/* estimate.js — the five-step estimate wizard.
   - Option tiles come from pests.xml (pests) and pricing.xml (property, size, area).
   - Each step is validated before Continue; the postcode must be in a service zone.
   - The price range is calculated with calculateEstimate() and only revealed on the last step.
   - Finishing saves the estimate (store.saveEstimate) and opens the result page.
   Answers can be pre-filled from ?pest=<id> or from the previous estimate. */

import { startPage, $, $$, esc, range, selectGroup, showError } from '../ui.js';
import { getPests } from '../data.js';
import { getPricing, calculateEstimate, findZone } from '../pricing.js';
import { getEstimate, saveEstimate } from '../store.js';

startPage();

const steps = $$('.wstep');
const answers = { pest: null, property: null, size: null, area: null, postcode: '' };
let current = 0;
let pests = [];
let pricing = null;

/* ---------- building the options ---------- */

const tile = (value, label, icon, hint) =>
  `<button type="button" class="choice" data-value="${esc(value)}"><svg aria-hidden="true"><use href="#${esc(icon)}"/></svg>${esc(label)}${hint ? `<small>${esc(hint)}</small>` : ''}</button>`;

function renderOptions() {
  $('#opt-pest').innerHTML = pests.map((p) => tile(p.id, p.name, `p-${p.id}`, p.id === 'termite' ? 'inspection' : '')).join('');
  $('#opt-property').innerHTML = pricing.properties.map((p) => tile(p.id, p.label, p.icon, p.hint)).join('');
  $('#opt-size').innerHTML = pricing.sizes.map((s) => `<button type="button" class="pill" data-value="${esc(s.id)}">${esc(s.label)}</button>`).join('');
  $('#opt-area').innerHTML = pricing.areas.map((a) => tile(a.id, a.label, a.icon)).join('');

  const groups = {
    pest: selectGroup($('#opt-pest'), (v) => { answers.pest = v; refresh(); }),
    property: selectGroup($('#opt-property'), (v) => { answers.property = v; refresh(); }),
    size: selectGroup($('#opt-size'), (v) => { answers.size = v; refresh(); }),
    area: selectGroup($('#opt-area'), (v) => { answers.area = v; refresh(); }),
  };
  // pre-fill: ?pest= wins, then the previous estimate
  const previous = getEstimate()?.answers || {};
  const fromUrl = new URLSearchParams(location.search).get('pest');
  Object.assign(answers, previous);
  if (fromUrl && pests.some((p) => p.id === fromUrl)) answers.pest = fromUrl;
  Object.entries(groups).forEach(([key, group]) => { if (answers[key]) group.value = answers[key]; });
  $('#postcode').value = answers.postcode || '';
  $('#pets').checked = !!answers.pets;
  $('#notes').value = answers.notes || '';
}

/* ---------- summary panel ---------- */

const labelFor = (list, id) => list.find((x) => x.id === id)?.label;

function refresh() {
  $('#sum-pest').textContent = pests.find((p) => p.id === answers.pest)?.name || '—';
  $('#sum-property').textContent = labelFor(pricing.properties, answers.property) || '—';
  $('#sum-size').textContent = labelFor(pricing.sizes, answers.size) || '—';
  $('#sum-area').textContent = labelFor(pricing.areas, answers.area) || '—';
  const last = current === steps.length - 1;
  const price = $('#sum-price');
  if (last) {
    const est = calculateEstimate(pricing, answers);
    price.textContent = est.error ? '—' : range(est.min, est.max);
    $('#sum-price-note').textContent = est.error ? est.error : 'Based on your answers';
  } else {
    price.textContent = '$— – $—';
    $('#sum-price-note').textContent = 'Revealed on the last step';
  }
  price.style.filter = last ? '' : 'blur(6px)';
  price.style.opacity = last ? '' : '.5';
}

/* ---------- validation per step ---------- */

function stepError(message) {
  let note = $('.step-error', steps[current]);
  if (!message) { note?.remove(); return true; }
  if (!note) {
    note = document.createElement('p');
    note.className = 'notice notice-red step-error';
    note.setAttribute('role', 'alert');
    steps[current].append(note);
  }
  note.innerHTML = `<svg><use href="#i-warn"/></svg><span>${esc(message)}</span>`;
  return false;
}

function validatePostcode() {
  const field = $('#postcode-field');
  const code = $('#postcode').value.trim();
  answers.postcode = code;
  let message = '';
  if (!/^\d{4}$/.test(code)) message = 'Enter a 4-digit postcode, e.g. 3056';
  else if (!findZone(pricing, code)) message = `Sorry, we don't service ${code} yet. We cover Melbourne metro and the outer eastern and south-eastern suburbs.`;
  field.classList.toggle('error', !!message);
  $('#postcode-error span').textContent = message;
  if (!message) $('#postcode-hint').textContent = `${findZone(pricing, code).label} — we service your area.`;
  return !message;
}

function validateStep() {
  switch (current) {
    case 0: return stepError(answers.pest ? '' : 'Choose the pest you need help with.');
    case 1: return stepError(answers.property ? '' : 'Choose your property type.');
    case 2: return stepError(answers.size ? '' : 'Choose the property size.') && validatePostcode();
    case 3: return stepError(answers.area ? '' : 'Choose where the problem is.');
    default: return true;
  }
}

/* ---------- moving between steps ---------- */

function show(index, { focus = true } = {}) {
  current = index;
  steps.forEach((s, i) => s.classList.toggle('active', i === index));
  $$('.progress .seg').forEach((s, i) => { s.className = 'seg' + (i < index ? ' done' : i === index ? ' active' : ''); });
  $$('.wizard-steps li').forEach((li, i) => {
    li.className = i < index ? 'done' : i === index ? 'active' : '';
    if (i === index) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  $('#step-label').textContent = `Step ${index + 1} of ${steps.length}`;
  $('#prev').disabled = index === 0;
  $('#next').innerHTML = (index === steps.length - 1 ? 'See my estimate' : 'Continue') + ' <svg><use href="#i-arrow"/></svg>';
  refresh();
  if (!focus) return;
  // move focus to the new question so screen-reader and keyboard users land on it
  $('h2', steps[index]).setAttribute('tabindex', '-1');
  $('h2', steps[index]).focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function finish() {
  answers.pets = $('#pets').checked;
  answers.notes = $('#notes').value.trim();
  const est = calculateEstimate(pricing, answers);
  if (est.error) { stepError(est.error); return; }
  const pest = pests.find((p) => p.id === answers.pest);
  saveEstimate({
    ref: 'EST-' + String(Date.now()).slice(-5),
    createdAt: new Date().toISOString(),
    answers: { ...answers },
    pestName: pest.name,
    label: est.label,
    duration: est.duration,
    zoneLabel: est.zone.label,
    labels: { property: est.property.label, size: est.size.label, area: est.area.label },
    min: est.min,
    max: est.max,
    lines: est.lines,
    photos: $('#photos').files.length,
  });
  location.href = 'estimate-result.html';
}

$('#next').addEventListener('click', () => {
  if (!validateStep()) return;
  if (current < steps.length - 1) show(current + 1); else finish();
});
$('#prev').addEventListener('click', () => { if (current > 0) show(current - 1); });
$('#postcode').addEventListener('input', () => {
  $('#postcode').value = $('#postcode').value.replace(/\D/g, '').slice(0, 4);
  if ($('#postcode-field').classList.contains('error') || $('#postcode').value.length === 4) validatePostcode();
});

/* ---------- photo previews (kept in the browser only) ---------- */

$('#photos').addEventListener('change', (e) => {
  const files = [...e.target.files].slice(0, 4);
  $('#photo-status').textContent = files.length ? `${files.length} photo${files.length > 1 ? 's' : ''} added` : 'Tap to take a photo or choose from your library';
  $('#photo-previews').innerHTML = '';
  files.forEach((file) => {
    const img = document.createElement('img');
    img.alt = file.name;
    img.src = URL.createObjectURL(file);
    $('#photo-previews').append(img);
  });
});

(async () => {
  try {
    [pests, pricing] = await Promise.all([getPests(), getPricing()]);
    renderOptions();
    show(0, { focus: false });
  } catch (err) {
    showError($('#wizard .card'), err);
  }
})();
