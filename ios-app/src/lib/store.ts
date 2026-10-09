/* store.ts — what the app saves on the phone.

   1. The current estimate (answers + result) as JSON in AsyncStorage, so it survives
      closing the app and can be carried into the booking screen.
   2. Bookings made in the app as an XML document in AsyncStorage:
        <localBookings><booking ref="YI-10395" …>…</booking></localBookings>
      Each <booking> has the same structure as data/bookings.xml (bookings.xsd).
      It is built with the XML DOM (createElement / setAttribute) and saved with
      XMLSerializer, exactly like the Assessment 2 website did with localStorage.
   3. readBookings() merges the sample account from bookings.xml (loaded over HTTPS)
      with the local bookings, so My Services shows both. */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EstimateLine } from './pricing';
import { toISODate } from './format';
import { all, attr, first, num, parseXml, path, serializeXml, textOf, txt, type XmlDoc, type XmlEl } from './xml';

const ESTIMATE_KEY = 'yi.estimate';
const BOOKINGS_KEY = 'yi.bookings.xml';

/* ---------------- estimate ---------------- */

export type SavedEstimate = {
  ref: string;
  createdAt: string;
  answers: { pest: string; property: string; size: string; area: string; postcode: string; pets?: boolean; notes?: string };
  pestName: string;
  label: string;
  duration: string;
  zoneLabel: string;
  labels: { property: string; size: string; area: string };
  min: number;
  max: number;
  lines: EstimateLine[];
  photos: string[];
};

export async function loadEstimate(): Promise<SavedEstimate | null> {
  try {
    const raw = await AsyncStorage.getItem(ESTIMATE_KEY);
    return raw ? (JSON.parse(raw) as SavedEstimate) : null;
  } catch {
    return null;
  }
}
export async function storeEstimate(estimate: SavedEstimate | null) {
  if (estimate) await AsyncStorage.setItem(ESTIMATE_KEY, JSON.stringify(estimate));
  else await AsyncStorage.removeItem(ESTIMATE_KEY);
}

/* ---------------- local bookings (XML) ---------------- */

async function readLocalDoc(): Promise<XmlDoc> {
  const saved = await AsyncStorage.getItem(BOOKINGS_KEY).catch(() => null);
  if (saved) {
    try {
      return parseXml(saved, 'saved bookings');
    } catch {
      /* damaged copy: start again */
    }
  }
  return parseXml('<localBookings/>');
}

async function writeLocalDoc(doc: XmlDoc) {
  await AsyncStorage.setItem(BOOKINGS_KEY, serializeXml(doc));
}

/** Serialised XML of the bookings made in the app (for sharing / export). */
export async function exportLocalBookingsXml(): Promise<string> {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializeXml(await readLocalDoc());
}

export type NewBooking = {
  pest: string;
  date: string;
  window: string;
  property: { type: string; size: string; area: string; address: string };
  estimate: { min: number; max: number };
  contact: { firstName: string; lastName: string; mobile: string; email: string };
  access: string;
  notes: string;
};

/** Saves a new booking and returns its reference (one above the highest YI-number seen). */
export async function saveBooking(data: NewBooking, sample: XmlDoc): Promise<string> {
  const doc = await readLocalDoc();
  const refs = [...all(sample, 'booking'), ...all(doc, 'booking')].map((b) => Number(attr(b, 'ref').slice(3)));
  const ref = 'YI-' + String(Math.max(10394, ...refs) + 1).padStart(5, '0');

  const el = (name: string, attrs: Record<string, string | number> = {}, content?: string) => {
    const node = doc.createElement(name);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v !== undefined && v !== '') node.setAttribute(k, String(v));
    });
    if (content) node.appendChild(doc.createTextNode(content));
    return node;
  };
  const booking = el('booking', { ref, status: 'requested', pest: data.pest });
  booking.appendChild(el('created', {}, new Date().toISOString()));
  booking.appendChild(el('visit', { date: data.date, window: data.window }));
  booking.appendChild(el('property', { type: data.property.type, size: data.property.size, area: data.property.area }, data.property.address));
  booking.appendChild(el('estimate', { min: data.estimate.min, max: data.estimate.max }));
  booking.appendChild(el('contact', data.contact));
  if (data.access) booking.appendChild(el('access', {}, data.access));
  if (data.notes) booking.appendChild(el('notes', {}, data.notes));
  doc.documentElement!.appendChild(booking);
  await writeLocalDoc(doc);
  return ref;
}

/** Marks an app booking as cancelled. Returns false for sample bookings. */
export async function cancelBooking(ref: string): Promise<boolean> {
  const doc = await readLocalDoc();
  const b = all(doc, 'booking').find((x) => attr(x, 'ref') === ref);
  if (!b) return false;
  b.setAttribute('status', 'cancelled');
  await writeLocalDoc(doc);
  return true;
}

/** Removes every booking and the saved estimate (demo reset). */
export async function clearLocalData() {
  await AsyncStorage.multiRemove([BOOKINGS_KEY, ESTIMATE_KEY]);
}

/* ---------------- reading bookings ---------------- */

export type Report = {
  title: string; findings: string; treatment: string; areas: string[];
  recommendation: string; nextInspection: string; warranty: string; warrantyUntil: string;
};
export type Booking = {
  source: 'sample' | 'app';
  ref: string; status: string; pest: string; technician: string; created: string;
  date: string; window: string; address: string;
  property: { type: string; size: string; area: string };
  estimate: { min: number; max: number };
  price: number | null;
  contact: { firstName: string; lastName: string; mobile: string; email: string };
  access: string; notes: string;
  report: Report | null;
};
export type Account = {
  customer: { id: string; firstName: string; lastName: string; mobile: string; email: string; address: string };
  technicians: Record<string, { name: string; licence: string }>;
};

function toBooking(el: XmlEl, source: Booking['source'], today: Date): Booking {
  const visit = first(el, 'visit');
  let date = attr(visit, 'date');
  if (!date && visit?.hasAttribute('daysFromToday')) {
    date = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + num(visit, 'daysFromToday')));
  }
  const contact = first(el, 'contact');
  const property = first(el, 'property');
  const estimate = first(el, 'estimate');
  const report = first(el, 'report');
  return {
    source,
    ref: attr(el, 'ref'),
    status: attr(el, 'status'),
    pest: attr(el, 'pest'),
    technician: attr(el, 'technician'),
    created: textOf(el, 'created'),
    date,
    window: attr(visit, 'window'),
    address: txt(property),
    property: { type: attr(property, 'type'), size: attr(property, 'size'), area: attr(property, 'area') },
    estimate: { min: num(estimate, 'min'), max: num(estimate, 'max') },
    price: first(el, 'price') ? Number(textOf(el, 'price')) : null,
    contact: { firstName: attr(contact, 'firstName'), lastName: attr(contact, 'lastName'), mobile: attr(contact, 'mobile'), email: attr(contact, 'email') },
    access: textOf(el, 'access'),
    notes: textOf(el, 'notes'),
    report: report && {
      title: textOf(report, 'title'),
      findings: textOf(report, 'findings'),
      treatment: textOf(report, 'treatment'),
      areas: path(report, 'areas', 'area').map(txt),
      recommendation: textOf(report, 'recommendation'),
      nextInspection: attr(first(report, 'recommendation'), 'nextInspection'),
      warranty: textOf(report, 'warranty'),
      warrantyUntil: attr(first(report, 'warranty'), 'until'),
    },
  };
}

export function parseAccount(sample: XmlDoc): Account {
  const c = first(sample, 'customer');
  const technicians: Account['technicians'] = {};
  all(sample, 'technician').forEach((t) => {
    technicians[attr(t, 'id')] = { name: txt(t), licence: attr(t, 'licence') };
  });
  return {
    customer: {
      id: attr(c, 'id'), firstName: textOf(c, 'firstName'), lastName: textOf(c, 'lastName'),
      mobile: textOf(c, 'mobile'), email: textOf(c, 'email'), address: textOf(c, 'address'),
    },
    technicians,
  };
}

/** Every booking: the sample account plus bookings made in the app, newest visit first. */
export async function readBookings(sample: XmlDoc, today = new Date()): Promise<Booking[]> {
  const local = await readLocalDoc();
  const list = [
    ...path(first(sample, 'bookings'), 'booking').map((b) => toBooking(b, 'sample', today)),
    ...all(local, 'booking').map((b) => toBooking(b, 'app', today)),
  ];
  return list.sort((a, b) => b.date.localeCompare(a.date));
}
