/* components.js — HTML snippets reused on more than one page. */

import { esc, money } from './ui.js';

/** Pest guide card (Home and Pest Guide). The whole card links to the pest's details. */
export function pestCard(pest, base) {
  const tone = { red: 'badge-red', amber: 'badge-amber', green: '' }[pest.tone];
  const price = pest.id === 'termite' ? `Inspection ${money(base.min)}` : `from ${money(base.min)}`;
  return `<a class="card card-hover pest-card" href="identify.html?pest=${esc(pest.id)}">
    <div class="pest-visual"><svg aria-hidden="true"><use href="#p-${esc(pest.id)}"/></svg></div>
    <h3>${esc(pest.name)}</h3><p class="small muted" style="margin:0">${esc(pest.where)}</p>
    <div class="meta"><span class="small" style="font-weight:600">${price}</span><span class="badge ${tone}">${esc(pest.tag)}</span></div></a>`;
}

/** Status badge for a booking. */
export function statusBadge(status) {
  const map = {
    requested: ['', 'Request received'],
    confirmed: ['badge-blue', 'Technician confirmed'],
    completed: ['', 'Report ready'],
    cancelled: ['badge-grey', 'Cancelled'],
  };
  const [cls, label] = map[status] || ['badge-grey', status];
  return `<span class="badge ${cls}"><span class="dot"></span> ${label}</span>`;
}
