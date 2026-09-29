/* store.js — the app's saved state.

   1. The current estimate (answers + result) is kept in sessionStorage as JSON,
      so it can be carried from the wizard to the result and booking pages.
   2. Bookings made in the app are kept as an XML document in localStorage:
        <localBookings><booking ref="YI-10395" …>…</booking></localBookings>
      Each <booking> has the same structure as data/bookings.xml (see schema/bookings.xsd).
      It is built with the XML DOM (createElement / setAttribute) and saved with
      XMLSerializer, then read back with DOMParser.
   3. getAllBookings() merges the sample account in data/bookings.xml with those
      local bookings so My Services shows both. */

import { loadXML, text, num } from './data.js';
import { toISODate } from './ui.js';

const ESTIMATE_KEY = 'yi.estimate';
const BOOKINGS_KEY = 'yi.bookings.xml';

/* ---------------- estimate (sessionStorage) ---------------- */

export function getEstimate() {
  try { return JSON.parse(sessionStorage.getItem(ESTIMATE_KEY)) || null; } catch { return null; }
}
export function saveEstimate(estimate) {
  sessionStorage.setItem(ESTIMATE_KEY, JSON.stringify(estimate));
}

/* ---------------- local bookings (XML in localStorage) ---------------- */

function readLocalDoc() {
  let saved = null;
  try { saved = localStorage.getItem(BOOKINGS_KEY); } catch { /* storage blocked: start empty */ }
  if (saved) {
    const doc = new DOMParser().parseFromString(saved, 'application/xml');
    if (!doc.getElementsByTagName('parsererror').length) return doc;
  }
  return new DOMParser().parseFromString('<localBookings/>', 'application/xml');
}

function writeLocalDoc(doc) {
  localStorage.setItem(BOOKINGS_KEY, new XMLSerializer().serializeToString(doc));
}

/** Serialised XML of the bookings made in this browser (for download). */
export function exportLocalBookingsXML() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(readLocalDoc());
}

/** Next free reference: one above the highest YI-number seen so far. */
async function nextRef() {
  const sample = await loadXML('bookings');
  const refs = [...sample.querySelectorAll('booking'), ...readLocalDoc().querySelectorAll('booking')]
    .map((b) => Number(b.getAttribute('ref').slice(3)));
  return 'YI-' + String(Math.max(10394, ...refs) + 1).padStart(5, '0');
}

/**
 * Saves a new booking and returns its reference.
 * data = { pest, date, window, property:{type,size,area,address}, estimate:{min,max},
 *          contact:{firstName,lastName,mobile,email}, access, notes }
 */
export async function saveBooking(data) {
  const doc = readLocalDoc();
  const el = (name, attrs = {}, content) => {
    const node = doc.createElement(name);
    Object.entries(attrs).forEach(([k, v]) => { if (v !== undefined && v !== '') node.setAttribute(k, v); });
    if (content) node.textContent = content;
    return node;
  };
  const ref = await nextRef();
  const booking = el('booking', { ref, status: 'requested', pest: data.pest });
  booking.append(
    el('created', {}, new Date().toISOString()),
    el('visit', { date: data.date, window: data.window }),
    el('property', { type: data.property.type, size: data.property.size, area: data.property.area }, data.property.address),
    el('estimate', { min: data.estimate.min, max: data.estimate.max }),
    el('contact', data.contact),
  );
  if (data.access) booking.append(el('access', {}, data.access));
  if (data.notes) booking.append(el('notes', {}, data.notes));
  doc.documentElement.append(booking);
  writeLocalDoc(doc);
  return ref;
}

/** Marks a booking made in this browser as cancelled. Returns false for sample bookings. */
export function cancelBooking(ref) {
  const doc = readLocalDoc();
  const b = [...doc.querySelectorAll('booking')].find((x) => x.getAttribute('ref') === ref);
  if (!b) return false;
  b.setAttribute('status', 'cancelled');
  writeLocalDoc(doc);
  return true;
}

/** Removes every booking made in this browser (demo reset). */
export function clearLocalBookings() {
  localStorage.removeItem(BOOKINGS_KEY);
  sessionStorage.removeItem(ESTIMATE_KEY);
}

/* ---------------- reading bookings ---------------- */

/** Converts a <booking> element into a plain object with a real visit date. */
function toBooking(el, source, today) {
  const visit = el.querySelector('visit');
  let date = visit.getAttribute('date');
  if (!date && visit.hasAttribute('daysFromToday')) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + num(visit, 'daysFromToday'));
    date = toISODate(d);
  }
  const contact = el.querySelector('contact');
  const property = el.querySelector('property');
  const report = el.querySelector('report');
  return {
    source, // 'sample' (data/bookings.xml) or 'app' (made in this browser)
    ref: el.getAttribute('ref'),
    status: el.getAttribute('status'),
    pest: el.getAttribute('pest'),
    technician: el.getAttribute('technician'),
    created: text(el, 'created'),
    date,
    window: visit.getAttribute('window'),
    address: property.textContent.trim(),
    property: { type: property.getAttribute('type'), size: property.getAttribute('size'), area: property.getAttribute('area') },
    estimate: { min: num(el.querySelector('estimate'), 'min'), max: num(el.querySelector('estimate'), 'max') },
    price: el.querySelector('price') ? Number(text(el, 'price')) : null,
    contact: { firstName: contact.getAttribute('firstName'), lastName: contact.getAttribute('lastName'), mobile: contact.getAttribute('mobile'), email: contact.getAttribute('email') || '' },
    access: text(el, 'access'),
    notes: text(el, 'notes'),
    report: report && {
      title: text(report, 'title'),
      findings: text(report, 'findings'),
      treatment: text(report, 'treatment'),
      areas: [...report.querySelectorAll('areas > area')].map((a) => a.textContent.trim()),
      recommendation: text(report, 'recommendation'),
      nextInspection: report.querySelector('recommendation').getAttribute('nextInspection'),
      warranty: text(report, 'warranty'),
      warrantyUntil: report.querySelector('warranty').getAttribute('until'),
    },
  };
}

/** Sample account details: { customer, technicians } */
export async function getAccount() {
  const xml = await loadXML('bookings');
  const c = xml.querySelector('customer');
  return {
    customer: { id: c.getAttribute('id'), firstName: text(c, 'firstName'), lastName: text(c, 'lastName'), mobile: text(c, 'mobile'), email: text(c, 'email'), address: text(c, 'address') },
    technicians: new Map([...xml.querySelectorAll('technician')].map((t) => [t.getAttribute('id'), { name: t.textContent.trim(), licence: t.getAttribute('licence') }])),
  };
}

/** Every booking: the sample account plus bookings made in this browser, newest visit first. */
export async function getAllBookings(today = new Date()) {
  const sample = await loadXML('bookings');
  const list = [
    ...[...sample.querySelectorAll('bookings > booking')].map((b) => toBooking(b, 'sample', today)),
    ...[...readLocalDoc().querySelectorAll('booking')].map((b) => toBooking(b, 'app', today)),
  ];
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

/** One booking by reference. */
export async function getBooking(ref) {
  return (await getAllBookings()).find((b) => b.ref === ref);
}

/** Bookings made in this browser, reduced to what the schedule needs. */
export function getAppSlots() {
  return [...readLocalDoc().querySelectorAll('booking')].map((b) => ({
    date: b.querySelector('visit').getAttribute('date'),
    window: b.querySelector('visit').getAttribute('window'),
    status: b.getAttribute('status'),
  }));
}
