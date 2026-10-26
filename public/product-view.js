const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
const date = value => value ? value.split('-').reverse().join('.') : 'Дата не указана';
const status = row => row.archived ? 'Архив' : ({ active: 'Активен', paused: 'На паузе', reserved: 'В резерве', attended: 'Посещение отмечено', cancelled: 'Отменено' }[row.status] || row.status);
const action = (text, fn, context) => {
  const button = el('button', text, 'secondary');
  button.type = 'button';
  if (context) button.setAttribute('aria-label', text + ': ' + context);
  button.addEventListener('click', fn);
  return button;
};
export const productMeta = {
  defaultSection: 'passes',
  navigation: ['passes', 'visits'],
  headings: {
    passes: ['Абонементы', 'Остаток, резерв и посещения — рядом с каждым учеником.'],
    visits: ['Журнал занятий', 'Сохранённые резервы, отметки посещения и отмены.'],
  },
};

export function passBalance(pass, visits) {
  const related = visits.filter(visit => visit.pass === pass.id);
  const reserved = related.filter(visit => visit.status === 'reserved').length;
  const attended = related.filter(visit => visit.status === 'attended').length;
  return { free: Number(pass.units) - reserved - attended, reserved, attended };
}

function balanceList(pass, visits) {
  const counts = passBalance(pass, visits);
  const list = el('dl', undefined, 'pass-balance');
  for (const [key, label] of [['free', 'Свободно'], ['reserved', 'В резерве'], ['attended', 'Посещено']]) {
    const item = el('div', undefined, 'balance-' + key);
    item.append(el('dt', label), el('dd', String(counts[key])));
    list.append(item);
  }
  return list;
}

function visitLine(visit, data, open, withMember = true) {
  const row = el('article', undefined, 'lesson-row');
  const info = el('div', undefined, 'lesson-info');
  info.append(el('h3', visit.lesson), el('p', date(visit.date), 'muted'));
  if (withMember) info.append(el('p', data.passes.find(pass => pass.id === visit.pass)?.name || 'Абонемент не найден', 'lesson-member'));
  const badge = el('span', status(visit), 'state-tag state-' + visit.status);
  row.append(info, badge, action('Открыть занятие', () => open('visits', visit), visit.lesson));
  return row;
}

export function productView({ host, key, rows, data, open }) {
  if (key === 'passes') {
    const list = el('div', undefined, 'member-list');
    const note = el('div', undefined, 'list-caption');
    note.append(el('span', 'Ученик и срок'), el('span', 'Баланс занятий'));
    list.append(note);
    for (const pass of [...rows].sort((a, b) => a.name.localeCompare(b.name, 'ru'))) {
      const row = el('article', undefined, 'member-row');
      const identity = el('div', undefined, 'member-identity');
      identity.append(el('h2', pass.name), el('p', `До ${date(pass.expires)} · пакет ${pass.units}`, 'muted'), el('span', status(pass), 'state-tag state-' + pass.status));
      row.append(identity, balanceList(pass, data.visits), action('Открыть абонемент', () => open('passes', pass), pass.name));
      list.append(row);
    }
    host.append(list, el('p', 'Свободно = пакет − резерв − посещения. Отменённое занятие освобождает резерв. Отметки в журнале вносятся вручную.', 'view-footnote'));
    return true;
  }
  if (key === 'visits') {
    const list = el('div', undefined, 'lesson-list');
    for (const visit of [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.lesson.localeCompare(b.lesson, 'ru')))
      list.append(visitLine(visit, data, open));
    host.append(list);
    return true;
  }
  return false;
}

export function editorContext({ collection, row, data, open }) {
  if (!row || collection.key !== 'passes') return null;
  const context = el('section', undefined, 'pass-detail');
  context.append(el('h2', row.name), balanceList(row, data.visits));
  const visits = data.visits.filter(visit => visit.pass === row.id).sort((a, b) => a.date.localeCompare(b.date));
  const details = el('details', undefined, 'pass-history');
  details.append(el('summary', `Занятия этого абонемента · ${visits.length}`));
  if (!visits.length) details.append(el('p', 'Занятий ещё нет. Сначала сохраните абонемент, затем перейдите в журнал занятий.', 'muted'));
  for (const visit of visits) details.append(visitLine(visit, data, open, false));
  context.append(details);
  return context;
}
