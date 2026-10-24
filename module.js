import {
  F,
  S,
  R,
  C,
  live,
  rows,
  byId,
  unique,
  required,
  minor,
  amount,
  interval,
  noOverlap,
  changed,
  immutable,
  admin,
  totalLines,
  summary,
  clock,
  label,
} from "./core/rules.js";
const definition = {
  slug: "abonflow",
  reference: 79,
  title: "AbonFlow",
  description:
    "Абонементы, резерв занятий и посещения: отмена освобождает резерв, посещение расходует занятие.",
  limitations:
    "Одна организация · Собственный сервер · Ручной ввод · Без банковских и внешних интеграций",
  collections: [
    C("passes", "Абонементы", [
      F("name", "Обозначение ученика / абонемента"),
      F("units", "Занятий", "integer", { min: 1, max: 1000 }),
      F("expires", "Действует до", "date"),
      S("status", "Состояние", [
        ["active", "Активен"],
        ["paused", "Пауза"],
      ]),
    ]),
    C("visits", "Занятия", [
      R("pass", "Абонемент", "passes"),
      F("lesson", "Уникальный код занятия"),
      F("date", "Дата", "date"),
      S("status", "Состояние", [
        ["reserved", "Резерв"],
        ["attended", "Посещение отмечено"],
        ["cancelled", "Отменено"],
      ]),
    ]),
  ],
  validate(state, before, command, actor) {
    for (const p of rows(state, "passes")) {
      const visits = rows(state, "visits").filter((v) => v.pass === p.id),
        used = visits.filter((v) => v.status !== "cancelled").length;
      required(used <= p.units, "В абонементе недостаточно свободных занятий.");
      unique(visits, "lesson", "Код занятия в абонементе");
      for (const v of visits) {
        required(v.date <= p.expires, "Занятие позже срока абонемента.");
        required(
          !v.archived,
          "Посещения сохраняются; используйте отмену вместо архива.",
        );
        const old = changed(before, "visits", v.id);
        if (!old && v.status !== "cancelled")
          required(
            p.status === "active" && !p.archived,
            "Абонемент приостановлен или архивирован.",
          );
        if (old?.status === "attended")
          immutable(old, v, ["pass", "lesson", "date", "status", "archived"]);
      }
      if (p.archived)
        required(
          !visits.some((x) => x.status === "reserved"),
          "Сначала отмените или проведите резерв.",
        );
    }
  },
  summarize(state) {
    return rows(state, "passes").map((p) => {
      const visits = rows(state, "visits").filter((v) => v.pass === p.id);
      return summary(
        p.name,
        "Посещений: " + visits.filter((v) => v.status === "attended").length,
        "Резервов: " + visits.filter((v) => v.status === "reserved").length,
        "Свободно: " +
          (p.units - visits.filter((v) => v.status !== "cancelled").length),
      );
    });
  },
};
export default definition;
