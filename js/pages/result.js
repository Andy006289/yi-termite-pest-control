/* result.js — Estimate result page.
   Shows the saved estimate: price range, a line-by-line breakdown of how it was
   calculated, what is included (pests.xml) and the next three free windows
   (timeslots.xml). Choosing a window opens the booking page with it pre-selected. */

import { startPage, $, esc, money, range, formatDay, showError } from '../ui.js';
import { getPest } from '../data.js';
import { getSchedule, buildDays, nextAvailable } from '../schedule.js';
import { getEstimate, getAppSlots } from '../store.js';

startPage();

const root = $('#result-root');

function empty() {
  root.innerHTML = `<div class="card empty"><span class="ico"><svg><use href="#i-dollar"/></svg></span>
    <h2 style="font-size:1.3rem">No estimate yet</h2><p class="muted">Answer five quick questions to see your price range.</p>
    <a class="btn btn-primary" href="estimate.html">Get an estimate <svg><use href="#i-arrow"/></svg></a></div>`;
}

const signed = (line) => {
  if (!line.adjust) return range(line.min, line.max);
  if (line.min === 0 && line.max === 0) return '$0';
  return line.min === line.max ? `+${money(line.min)}` : `+${money(line.min)} – ${money(line.max)}`;
};

async function render() {
  const est = getEstimate();
  if (!est) { empty(); return; }
  const [pest, schedule] = await Promise.all([getPest(est.answers.pest), getSchedule()]);
  const slots = nextAvailable(buildDays(schedule, getAppSlots()), 3);

  root.className = 'container grid booking-layout';
  root.style.cssText = 'gap:24px;align-items:start';
  root.innerHTML = `
  <div class="stack">
    <div class="card">
      <div class="result-hero">
        <div class="pest-visual"><svg aria-hidden="true"><use href="#p-${esc(pest.id)}"/></svg></div>
        <div><div class="tiny muted">${esc(est.label)} · ${esc(est.labels.size)} ${esc(est.labels.property.toLowerCase())} · ${esc(est.labels.area.toLowerCase())} · ${esc(est.answers.postcode)}</div>
          <div class="price-range" style="margin-top:6px">${range(est.min, est.max)}<small>incl. GST · typical visit ${esc(est.duration)}</small></div></div>
      </div>
      <div class="divider"></div>
      <div class="grid grid-2" style="gap:16px">
        <div class="feature"><span class="ico"><svg><use href="#i-check"/></svg></span><div><h3 class="h4">Included</h3><p class="small muted" style="margin:0">${esc(pest.included)}</p></div></div>
        <div class="feature"><span class="ico ico-amber"><svg><use href="#i-warn"/></svg></span><div><h3 class="h4">Can change the price</h3><p class="small muted" style="margin:0">${esc(pest.variables)}</p></div></div>
      </div>
      ${est.answers.pets ? '<div class="notice notice-green" style="margin-top:16px"><svg><use href="#i-shield"/></svg><span>Pets or children at home: the technician will use low-toxicity products.</span></div>' : ''}
      ${pest.tone !== 'green' ? `<div class="notice" style="margin-top:16px"><svg><use href="#i-info"/></svg><span>${esc(pest.advice)}</span></div>` : ''}
      <div class="row" style="margin-top:20px;gap:12px">
        <a class="btn btn-primary" href="booking.html">Book with these details <svg><use href="#i-arrow"/></svg></a>
        <a class="btn btn-outline" href="estimate.html">Change answers</a>
      </div>
    </div>

    <div class="card">
      <h2 class="h3">How we calculated this</h2>
      <div class="table-wrap"><table>
        <thead><tr><th scope="col">Item</th><th scope="col">Basis</th><th scope="col">Range</th></tr></thead>
        <tbody>${est.lines.map((l) => `<tr><td>${esc(l.item)}</td><td>${esc(l.basis)}</td><td>${signed(l)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><th scope="row" colspan="2">Indicative total</th><th>${range(est.min, est.max)}</th></tr></tfoot>
      </table></div>
    </div>
  </div>

  <aside class="stack">
    <div class="card">
      <div class="eyebrow">Next available</div>
      <div class="slots" style="grid-template-columns:1fr">
        ${slots.length ? slots.map((s, i) => `<a class="slot" href="booking.html?date=${s.date}&amp;window=${s.id}"><span>${formatDay(s.date)} · ${esc(s.label)}</span>${i === 0 ? '<span class="badge">Earliest</span>' : s.remaining === 1 ? '<span class="badge badge-amber">1 left</span>' : ''}</a>`).join('') : '<p class="small muted">No free windows in the next days — call us.</p>'}
      </div>
      <a class="btn btn-accent btn-block" style="margin-top:16px" href="booking.html">Choose another time</a>
    </div>
    <div class="panel small"><b>Prefer to talk?</b><div class="muted" style="margin-top:4px">Call 1300 000 000 · 7am–7pm. Quote ref <b>${esc(est.ref)}</b> and we'll pick up where you left off.</div></div>
  </aside>`;
}

render().catch((err) => showError(root, err)).finally(() => root.setAttribute('aria-busy', 'false'));
