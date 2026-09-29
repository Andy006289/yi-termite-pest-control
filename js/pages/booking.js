/* booking.js — Book a Service.
   - Days and arrival windows come from timeslots.xml; each window shows how many
     places are left after existing demand and bookings already made in this browser.
   - ?date=YYYY-MM-DD&window=w09 (from the result page) pre-selects a window.
   - The form is validated in the browser (required fields, Australian mobile,
     optional email, pricing acknowledgement) before anything is saved.
   - A valid booking is written as a <booking> XML element (store.saveBooking)
     and the confirmation page opens with its reference. */

import { startPage, $, $$, esc, range, formatDay, weekdayShort, parseISODate, selectGroup, showError } from '../ui.js';
import { getPests } from '../data.js';
import { getPricing } from '../pricing.js';
import { getSchedule, buildDays, windowLabel } from '../schedule.js';
import { getEstimate, saveBooking, getAppSlots } from '../store.js';

startPage();

const form = $('#booking-form');
const params = new URLSearchParams(location.search);
const choice = { date: null, window: null, pets: 'no' };
let schedule, days, pests, pricing, estimate;

/* ---------- days and windows ---------- */

function renderDays() {
  $('#dates').innerHTML = days.map((d) => {
    const date = parseISODate(d.date);
    return `<button type="button" class="date${d.open ? '' : ' off'}" data-value="${d.date}" ${d.open ? '' : 'disabled aria-disabled="true"'} aria-label="${formatDay(d.date)}${d.open ? '' : ', unavailable'}"><small>${weekdayShort(d.date)}</small>${date.getDate()}</button>`;
  }).join('');
  const dates = selectGroup($('#dates'), (value) => { choice.date = value; choice.window = null; renderWindows(); updateSummary(); });
  // pre-select: date from the URL if it is open, else the first open day
  const wanted = days.find((d) => d.date === params.get('date') && d.open) || days.find((d) => d.open);
  if (wanted) { dates.value = wanted.date; choice.date = wanted.date; }
  renderWindows(params.get('window'));
}

function renderWindows(preselect) {
  const day = days.find((d) => d.date === choice.date);
  if (!day) { $('#slots').innerHTML = '<p class="small muted">No days available.</p>'; return; }
  $('#slots').innerHTML = day.windows.map((w) => {
    const badge = w.remaining === 0 ? '<span class="badge badge-grey">Full</span>'
      : w.remaining === 1 ? '<span class="badge badge-amber">1 left</span>'
      : w.popular ? '<span class="badge">Popular</span>' : '';
    const off = w.remaining === 0;
    return `<button type="button" class="slot${off ? ' off' : ''}" data-value="${w.id}" ${off ? 'disabled aria-disabled="true"' : ''}><span>${esc(w.label)}</span>${badge}</button>`;
  }).join('');
  const slots = selectGroup($('#slots'), (value) => { choice.window = value; $('#slot-error').classList.remove('show'); updateSummary(); });
  if (preselect && day.windows.some((w) => w.id === preselect && w.remaining > 0)) { slots.value = preselect; choice.window = preselect; }
  updateSummary();
}

/* ---------- summary panel ---------- */

function currentEstimate() {
  if (estimate) return estimate;
  // no estimate yet: a standard visit for the chosen pest, priced from its base range
  const pestId = $('#pest-choice')?.value || pests[0].id;
  const base = pricing.bases.get(pestId);
  return { answers: { pest: pestId, property: 'house', size: '3', area: 'both' }, label: base.label, min: base.min, max: base.max, labels: null };
}

function updateSummary() {
  const est = currentEstimate();
  const box = $('#booking-summary');
  const pestSelect = estimate ? '' : `<div class="field" style="margin-top:12px"><label for="pest-choice">What do you need help with?</label>
      <select class="select" id="pest-choice">${pests.map((p) => `<option value="${p.id}" ${p.id === est.answers.pest ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>`;
  box.innerHTML = `
    <div class="eyebrow">Booking summary</div>
    <div class="result-hero"><div class="pest-visual"><svg aria-hidden="true"><use href="#p-${esc(est.answers.pest)}"/></svg></div>
      <div><h3 style="margin:0 0 4px">${esc(est.label)}</h3><span class="small muted">${est.labels ? `${esc(est.labels.size)} ${esc(est.labels.property.toLowerCase())} · ${esc(est.labels.area.toLowerCase())}` : 'Standard visit'}</span></div></div>
    ${pestSelect}
    <dl style="margin-top:16px"><dt>Day</dt><dd>${choice.date ? formatDay(choice.date) : '—'}</dd><dt>Window</dt><dd>${choice.window ? esc(windowLabel(schedule, choice.window)) : 'Choose a window'}</dd>
      <dt>Estimate</dt><dd>${range(est.min, est.max)}</dd></dl>
    <div class="divider"></div>
    <ul class="timeline">
      <li><span class="tdot ${estimate ? 'done' : ''}">${estimate ? '<svg><use href="#i-check"/></svg>' : ''}</span><div class="small"><b>Estimate</b><div class="muted">${estimate ? esc(estimate.ref) : 'Standard price range'}</div></div></li>
      <li><span class="tdot now"></span><div class="small"><b>Booking request</b><div class="muted">You're here</div></div></li>
      <li><span class="tdot"></span><div class="small"><b>Technician confirmed</b><div class="muted">Usually within 1 hour</div></div></li>
      <li><span class="tdot"></span><div class="small"><b>Service &amp; report</b></div></li>
    </ul>
    <a class="small" href="estimate.html" style="color:var(--green-700);font-weight:600">${estimate ? 'Edit estimate answers' : 'Get an accurate estimate'}</a>`;
  $('#pest-choice')?.addEventListener('change', updateSummary);
  $('#submit').innerHTML = `Confirm booking · ${range(est.min, est.max)} <svg><use href="#i-arrow"/></svg>`;
}

/* ---------- validation ---------- */

/** "+61 412 345 678" / "0412345678" → "0412 345 678", or null if not an Australian mobile. */
export function normaliseMobile(value) {
  const digits = value.replace(/[\s()-]/g, '').replace(/^\+?61/, '0');
  if (!/^04\d{8}$/.test(digits)) return null;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

const RULES = {
  required: (input) => input.value.trim().length > 0,
  mobile: (input) => normaliseMobile(input.value) !== null,
  email: (input) => !input.value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim()),
  checked: (input) => input.checked,
};

function validateField(field) {
  const input = $('input, select, textarea', field);
  const ok = RULES[field.dataset.rule](input);
  field.classList.toggle('error', !ok);
  input.setAttribute('aria-invalid', String(!ok));
  const msg = $('.error-msg', field);
  if (msg) { msg.id ||= `${input.id}-error`; if (!ok) input.setAttribute('aria-describedby', msg.id); else input.removeAttribute('aria-describedby'); }
  return ok;
}

function validateForm() {
  const bad = $$('[data-rule]', form).filter((f) => !validateField(f));
  const slotOk = !!choice.window;
  $('#slot-error').classList.toggle('show', !slotOk);
  const count = bad.length + (slotOk ? 0 : 1);
  const summary = $('#error-summary');
  summary.hidden = count === 0;
  summary.textContent = count ? `Please fix ${count} ${count === 1 ? 'item' : 'items'} above before confirming.` : '';
  if (!slotOk) $('#slots').scrollIntoView({ behavior: 'smooth', block: 'center' });
  else if (bad.length) $('input, select, textarea', bad[0]).focus();
  return count === 0;
}

// after the first attempt, fields re-check as the user types
let attempted = false;
form.addEventListener('input', (e) => {
  const field = e.target.closest('[data-rule]');
  if (attempted && field) validateField(field);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  attempted = true;
  if (!validateForm()) return;
  const est = currentEstimate();
  const val = (id) => $(`#${id}`).value.trim();
  $('#submit').disabled = true;
  try {
    const ref = await saveBooking({
      pest: est.answers.pest,
      date: choice.date,
      window: choice.window,
      property: { type: est.answers.property, size: est.answers.size, area: est.answers.area, address: val('ad') },
      estimate: { min: est.min, max: est.max },
      contact: { firstName: val('fn'), lastName: val('ln'), mobile: normaliseMobile(val('ph')), email: val('em') },
      access: val('acc'),
      notes: [choice.pets === 'yes' ? 'Pets or children at home.' : '', val('nt')].filter(Boolean).join(' '),
    });
    location.href = `booking-confirmed.html?ref=${encodeURIComponent(ref)}`;
  } catch (err) {
    $('#submit').disabled = false;
    showError($('#error-summary'), err);
    $('#error-summary').hidden = false;
  }
});

const petsGroup = selectGroup($('#pets'), (value) => { choice.pets = value; });

(async () => {
  try {
    [schedule, pests, pricing] = await Promise.all([getSchedule(), getPests(), getPricing()]);
    estimate = getEstimate();
    $('#no-estimate').hidden = !!estimate;
    if (estimate?.answers.pets) { choice.pets = 'yes'; petsGroup.value = 'yes'; }
    if (estimate?.answers.notes) $('#nt').value = estimate.answers.notes;  // carry the wizard's notes forward
    days = buildDays(schedule, getAppSlots());
    renderDays();
  } catch (err) {
    showError($('#booking-summary'), err);
  }
})();
