# AbonFlow design contract · 26 October 2026

Current direction: **Native member library**. This replaces the former shared public-register visual tokens for this increment. The ten-product pre-release contract and actual module.js fields govern content; the SabaqLoop editorial design is not a template for this product.

## Screen job and composition

A fixed light navigation rail at desktop leaves the main canvas to a compact member list. Every row pairs identity and expiry with three real quantities: free, reserved and attended. The pass editor includes its balance and an expandable chronological lesson history. The separate lesson journal preserves reservation, attended and cancelled states.

free = pass.units − count(reserved) − count(attended), across all related visits, matching module.js. Cancellation releases reserve. Pause/archive remain separate server-enforced states. Manual attendance is not evidence of a lesson taking place.

## Visual system

Pale sage navigation, white member sheets, forest actions and near-black green text.

The normative semantic palette is the product-specific `:root` at the end of public/styles.css. Shared semantic roles are `--label`, `--label-secondary`, `--bg`, `--surface`, `--accent`, `--accent-hover`, `--accent-wash`, `--separator`, `--field-border`, `--focus`, `--error` and `--error-ground`. Spacing uses a 4px base and 8px multiples. Large titles tighten tracking, small supporting text keeps a relaxed line height, and numeric balances/times use tabular digits. Body text is 16px by browser default. Supporting labels never replace field labels. There are no custom font downloads, paid assets, gradients, ornamental charts, fake KPIs or integration badges.

The apple-design and frontend-ui-engineering skill guidance informs semantic roles, optical typography, clear interaction states and restrained surfaces. Existing product fields/code are the available reference evidence; no new approved visual comp or external reference catalogue was supplied. Layout and palette are implementation choices subject to browser review. System fonts require no bundled font license.

## Responsive and interaction rules

Below 900px the rail becomes a horizontal scrollable navigation strip. At 768px the member action has its own line. At 600px and below identity, quantities and the full-width open action stack; all three quantities remain visible together.

Buttons, inputs, selects and disclosure summaries have a minimum 44px interaction height. Every control uses visible keyboard focus. Search and archive operate on the same saved collections as before. Zero-data and no-match states preserve dependency links/create actions and clear-filter recovery. Pending actions disable their initiating control, show a waiting label and expose `aria-busy`. Errors remain focused and visible without discarding the edited form. The edit heading receives focus when opened. No modal, animation library or new dependency is introduced. Reduced motion removes active translation; contrast preference strengthens dividers and secondary ink. This increment is designed as a light workspace.

The calculated-data summary is a disclosure after the primary view, preserving the original server summary without duplicating it as a dashboard. Supporting collections may retain contained, labelled tables. All domain values are inserted through `textContent`, native options or existing safe form controls. Server authentication, roles, CSRF, revision checks, archival rules and backups stay in the existing command path.

## Implementation and evidence

public/product-view.js renders member rows, balances, lesson journal and pass detail. public/app.js keeps save/archive/auth/settings and adds presentation hooks. public/styles.css owns the native rail and member composition.

The bundled Node 24.19.0 suite passes 8/8; 1 regression test for pass balances, cancellation, cross-pass isolation and archived history. JS syntax and whitespace checks pass. This documents implementation and automated evidence. Responsive rendering, interaction quality, screen-reader behavior and contrast across actual rendered states remain pending browser QA. Historical screenshots in docs/ and .impeccable/ do not show this increment. See PRE_RELEASE.md.

The editor captures the workspace revision when opened; save and archive submit that captured revision. A validation or revision-conflict failure keeps typed fields and focuses the error notice. Initial network failures replace the loading state with a retry action.
