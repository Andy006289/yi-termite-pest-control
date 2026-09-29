/* services.js — My Services dashboard.
   Merges the sample account (data/bookings.xml) with bookings made in this browser
   (XML in localStorage) and shows them in four tabs:
     Upcoming         future bookings; app-made ones can be cancelled
     Service reports  completed visits; selecting one shows its full report (printable)
     Properties       addresses with their visit history
     Account          contact details, export bookings as XML, reset the demo */

import { startPage, $, $$, esc, money, range, formatDay, toISODate, showError, toast } from '../ui.js';
import { getPests } from '../data.js';
import { getSchedule, windowLabel } from '../schedule.js';
import { getAllBookings, getAccount, cancelBooking, exportLocalBookingsXML, clearLocalBookings } from '../store.js';
import { statusBadge } from '../components.js';

startPage();

let bookings = [], pests = [], schedule, account;
const pestName = (id) => pests.find((p) => p.id === id)?.name ?? id;
const todayISO = () => toISODate(new Date());

/* ---------- tabs (WAI-ARIA tab pattern: click or arrow keys) ---------- */

function initTabs() {
  const tabs = $$('[role="tab"]');
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
    });
    history.replaceState(null, '', `#${tab.id.replace('tab-', '')}`);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const next = tabs[(i + step + tabs.length) % tabs.length];
      select(next); next.focus();
    });
  });
  const fromHash = $(`#tab-${location.hash.slice(1)}`);
  if (fromHash) select(fromHash);
}

/* ---------- Upcoming ---------- */

function bookingCard(b) {
  const tech = account.technicians.get(b.technician);
  const cancellable = b.source === 'app' && b.status !== 'cancelled';
  return `<article class="card booking-card">
    <div class="head"><div>${statusBadge(b.status)}<h2 class="h3" style="margin:10px 0 0">${esc(pestName(b.pest))}</h2><span class="small muted">Ref ${esc(b.ref)}</span></div>
      <div class="pest-visual" style="width:64px;aspect-ratio:1;border-radius:12px"><svg aria-hidden="true"><use href="#p-${esc(b.pest)}"/></svg></div></div>
    <div class="kv">
      <div><b>When</b>${formatDay(b.date)} · ${esc(windowLabel(schedule, b.window))}</div>
      <div><b>Where</b>${esc(b.address)}</div>
      <div><b>Technician</b>${tech ? `${esc(tech.name)} · Lic. ${esc(tech.licence)}` : 'Being assigned'}</div>
      <div><b>Estimate</b>${range(b.estimate.min, b.estimate.max)}</div>
    </div>
    ${b.status === 'cancelled' ? '' : `<ul class="timeline" style="margin-top:4px">
      <li><span class="tdot done"><svg><use href="#i-check"/></svg></span><div class="small"><b>Request received</b><div class="muted">${b.created ? new Date(b.created).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</div></div></li>
      <li><span class="tdot ${b.status === 'confirmed' ? 'done' : 'now'}">${b.status === 'confirmed' ? '<svg><use href="#i-check"/></svg>' : ''}</span><div class="small"><b>Technician confirmed</b><div class="muted">${b.status === 'confirmed' ? 'Confirmed' : 'Usually within 1 hour'}</div></div></li>
      <li><span class="tdot"></span><div class="small"><b>Service &amp; report</b><div class="muted">Report within 24h of the visit</div></div></li>
    </ul>`}
    ${cancellable ? `<div class="row"><button type="button" class="btn btn-outline btn-sm" data-cancel="${esc(b.ref)}"><svg><use href="#i-close"/></svg> Cancel booking</button></div>` : ''}
  </article>`;
}

function renderUpcoming() {
  const upcoming = bookings.filter((b) => b.date >= todayISO() && b.status !== 'completed')
    .sort((a, b) => a.date.localeCompare(b.date) || a.window.localeCompare(b.window));
  $('#panel-upcoming').innerHTML = upcoming.length
    ? upcoming.map(bookingCard).join('')
    : `<div class="card empty"><span class="ico"><svg><use href="#i-cal"/></svg></span><p class="muted">No upcoming visits.</p><a class="btn btn-primary" href="booking.html">Book a service</a></div>`;
}

/* ---------- Service reports ---------- */

function reportDetail(b) {
  const r = b.report;
  const tech = account.technicians.get(b.technician);
  const [y, m] = r.nextInspection.split('-').map(Number);
  const next = new Date(y, m - 1, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  return `<article class="card report-section" id="report-detail" tabindex="-1">
    <div class="row between"><div><div class="eyebrow">Service report · ${esc(b.ref)}</div><h2 class="h3" style="margin:0">${esc(r.title)}</h2>
      <span class="small muted">Completed ${formatDay(b.date, { year: true })}${tech ? ` · Technician ${esc(tech.name)}` : ''} · ${money(b.price)}</span></div>
      <button type="button" class="btn btn-outline btn-sm no-print" id="print-report"><svg><use href="#i-doc"/></svg> Print / save PDF</button></div>
    <div class="grid grid-2" style="gap:20px">
      <div><h3 class="h4"><svg><use href="#i-search"/></svg> Findings</h3><p class="small muted" style="margin:0">${esc(r.findings)}</p></div>
      <div><h3 class="h4"><svg><use href="#i-check"/></svg> Treatment</h3><p class="small muted" style="margin:0">${esc(r.treatment)}</p></div>
      <div><h3 class="h4"><svg><use href="#i-pin"/></svg> Treated areas</h3><div class="tag-list">${r.areas.map((a) => `<span class="tag">${esc(a)}</span>`).join('')}</div></div>
      <div><h3 class="h4"><svg><use href="#i-cal"/></svg> Recommendations</h3><p class="small muted" style="margin:0">${esc(r.recommendation)} <b>Next inspection: ${next}.</b></p></div>
    </div>
    <div class="notice notice-green"><svg><use href="#i-shield"/></svg><span>Warranty until ${formatDay(r.warrantyUntil, { year: true })}. ${esc(r.warranty)}</span></div>
  </article>`;
}

function renderReports() {
  const done = bookings.filter((b) => b.status === 'completed' && b.report);
  const panel = $('#panel-reports');
  if (!done.length) { panel.innerHTML = '<div class="card empty"><p class="muted">No completed visits yet.</p></div>'; return; }
  panel.innerHTML = `<div><h2 style="font-size:1.3rem;margin:0 0 12px">Past services</h2>
    <div class="report-list">${done.map((b) => `<button type="button" class="card report-row card-hover" data-report="${esc(b.ref)}" aria-controls="report-slot">
      <span class="ico"><svg aria-hidden="true"><use href="#p-${esc(b.pest)}"/></svg></span>
      <div class="grow"><h3 class="h4" style="margin:0">${esc(b.report.title)}</h3><div class="small muted">${formatDay(b.date, { year: true })} · ${esc(b.address.split(',')[0])} · ${money(b.price)}</div></div>
      <span class="badge">Report ready</span><svg style="width:18px;height:18px;color:var(--ink-3)" aria-hidden="true"><use href="#i-chev"/></svg></button>`).join('')}</div></div>
    <div id="report-slot">${reportDetail(done[0])}</div>`;
}

/* ---------- Properties ---------- */

function renderProperties() {
  const byAddress = new Map();
  bookings.forEach((b) => byAddress.set(b.address, [...(byAddress.get(b.address) || []), b]));
  $('#panel-properties').innerHTML = [...byAddress].map(([address, list]) => `<div class="card">
    <div class="row between"><div class="row"><span class="ico"><svg><use href="#i-pin"/></svg></span><div><h2 class="h4" style="margin:0">${esc(address)}</h2><div class="small muted">${list.length} visit${list.length > 1 ? 's' : ''}</div></div></div></div>
    <div class="table-wrap" style="margin-top:12px"><table><thead><tr><th scope="col">Date</th><th scope="col">Service</th><th scope="col">Status</th></tr></thead>
      <tbody>${list.map((b) => `<tr><td>${formatDay(b.date, { year: true })}</td><td>${esc(pestName(b.pest))}</td><td>${statusBadge(b.status)}</td></tr>`).join('')}</tbody></table></div>
  </div>`).join('');
}

/* ---------- Account ---------- */

function renderAccount() {
  const c = account.customer;
  const mine = bookings.filter((b) => b.source === 'app').length;
  $('#panel-account').innerHTML = `<div class="card">
      <h2 class="h3">Contact details</h2>
      <div class="kv"><div><b>Name</b>${esc(c.firstName)} ${esc(c.lastName)}</div><div><b>Mobile</b>${esc(c.mobile)}</div><div><b>Email</b>${esc(c.email)}</div><div><b>Home address</b>${esc(c.address)}</div></div>
      <p class="small muted" style="margin:12px 0 0">Sample account from data/bookings.xml.</p>
    </div>
    <div class="card">
      <h2 class="h3">Your data</h2>
      <p class="small muted">${mine} booking${mine === 1 ? '' : 's'} made in this browser, stored as XML.</p>
      <div class="row"><button type="button" class="btn btn-outline btn-sm" id="export-xml"><svg><use href="#i-doc"/></svg> Download bookings (XML)</button>
        <button type="button" class="btn btn-ghost btn-sm" id="reset-demo">Reset demo data</button></div>
    </div>`;
}

/* ---------- events ---------- */

document.addEventListener('click', async (e) => {
  const cancel = e.target.closest('[data-cancel]');
  if (cancel && confirmCancel(cancel.dataset.cancel)) {
    cancelBooking(cancel.dataset.cancel);
    toast(`Booking ${cancel.dataset.cancel} cancelled`);
    await load();
  }
  const row = e.target.closest('[data-report]');
  if (row) {
    $('#report-slot').innerHTML = reportDetail(bookings.find((b) => b.ref === row.dataset.report));
    $('#report-detail').focus();
  }
  if (e.target.closest('#print-report')) window.print();
  if (e.target.closest('#export-xml')) {
    const url = URL.createObjectURL(new Blob([exportLocalBookingsXML()], { type: 'application/xml' }));
    Object.assign(document.createElement('a'), { href: url, download: 'my-bookings.xml' }).click();
  }
  if (e.target.closest('#reset-demo')) {
    clearLocalBookings();
    toast('Demo data reset');
    await load();
  }
});

/* An inline confirmation instead of window.confirm(): the button asks once, then acts. */
function confirmCancel(ref) {
  const btn = $(`[data-cancel="${ref}"]`);
  if (btn.dataset.armed) return true;
  btn.dataset.armed = '1';
  btn.innerHTML = 'Tap again to confirm cancellation';
  btn.classList.replace('btn-outline', 'btn-accent');
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; renderUpcoming(); } }, 4000);
  return false;
}

async function load() {
  [bookings, pests, schedule, account] = await Promise.all([getAllBookings(), getPests(), getSchedule(), getAccount()]);
  const latest = bookings.filter((b) => b.source === 'app').sort((a, b) => b.created.localeCompare(a.created))[0];
  $('#greeting').textContent = `Hi ${latest ? latest.contact.firstName : account.customer.firstName}`;
  renderUpcoming();
  renderReports();
  renderProperties();
  renderAccount();
}

initTabs();
load().catch((err) => showError($('#panel-upcoming'), err));
