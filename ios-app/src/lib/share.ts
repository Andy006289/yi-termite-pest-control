/* share.ts — native iOS sharing: calendar file, report PDF and bookings XML.

   Files are written to the app's cache directory and handed to the iOS share sheet,
   where the user can add the visit to Calendar, save the PDF to Files, AirDrop it, etc.
   Nothing leaves the phone unless the user chooses a destination. */

import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

import type { Schedule } from './data';
import { formatDay, formatMonth, money } from './format';
import type { Account, Booking } from './store';

function writeCacheFile(name: string, content: string): string {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  return file.uri;
}

async function shareFile(uri: string, mimeType: string, UTI: string, dialogTitle: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType, UTI, dialogTitle });
}

/* ---------------- calendar (.ics) ---------------- */

/** An iCalendar event for the booked arrival window (Melbourne time). */
export function buildIcs(b: { ref: string; date: string; start: string; end: string; title: string; address: string; notes: string }): string {
  const d = b.date.replace(/-/g, '');
  const t = (hhmm: string) => hhmm.replace(':', '') + '00';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//YI Termite & Pest Control//Booking//EN', 'BEGIN:VEVENT',
    `UID:${b.ref}@yi-pest-control`, `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Australia/Melbourne:${d}T${t(b.start)}`, `DTEND;TZID=Australia/Melbourne:${d}T${t(b.end)}`,
    `SUMMARY:${esc(b.title)}`, `LOCATION:${esc(b.address)}`, `DESCRIPTION:${esc(b.notes)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

export async function shareCalendarEvent(booking: Booking, schedule: Schedule, title: string) {
  const w = schedule.windows.find((x) => x.id === booking.window);
  if (!w) throw new Error('Unknown arrival window.');
  const ics = buildIcs({
    ref: booking.ref, date: booking.date, start: w.start, end: w.end, title, address: booking.address,
    notes: `Booking ${booking.ref}. Arrival window ${w.label}. The technician will call 30 minutes before arriving.`,
  });
  if (Platform.OS === 'web') return; // the web preview has no share sheet
  await shareFile(writeCacheFile(`${booking.ref}.ics`, ics), 'text/calendar', 'com.apple.ical.ics', 'Add visit to calendar');
}

/* ---------------- service report (PDF) ---------------- */

const h = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function reportHtml(b: Booking, account: Account): string {
  const r = b.report!;
  const tech = account.technicians[b.technician];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#263238;margin:40px;font-size:13px;line-height:1.5}
    h1{color:#0F3D28;font-size:22px;margin:0 0 4px} h2{color:#1F6B45;font-size:14px;margin:18px 0 4px}
    .eyebrow{color:#237A4F;text-transform:uppercase;letter-spacing:.12em;font-size:10px;font-weight:700}
    .muted{color:#546E7A} .tag{display:inline-block;background:#DFEFE5;color:#0F3D28;border-radius:99px;padding:2px 10px;margin:2px 4px 2px 0}
    .box{background:#F0F7F2;border-radius:10px;padding:12px 14px;margin-top:18px} header{border-bottom:2px solid #1F6B45;padding-bottom:12px;margin-bottom:12px}
  </style></head><body>
  <header><div class="eyebrow">YI Termite &amp; Pest Control · Service report · ${h(b.ref)}</div>
  <h1>${h(r.title)}</h1><div class="muted">Completed ${formatDay(b.date, { year: true })}${tech ? ` · Technician ${h(tech.name)} (Lic. ${h(tech.licence)})` : ''}${b.price != null ? ` · ${money(b.price)}` : ''}</div>
  <div class="muted">${h(b.address)}</div></header>
  <h2>Findings</h2><p>${h(r.findings)}</p>
  <h2>Treatment</h2><p>${h(r.treatment)}</p>
  <h2>Treated areas</h2><p>${r.areas.map((a) => `<span class="tag">${h(a)}</span>`).join('')}</p>
  <h2>Recommendations</h2><p>${h(r.recommendation)} <b>Next inspection: ${formatMonth(r.nextInspection)}.</b></p>
  <div class="box"><b>Warranty until ${formatDay(r.warrantyUntil, { year: true })}.</b> ${h(r.warranty)}</div>
  </body></html>`;
}

export async function shareReportPdf(b: Booking, account: Account) {
  const html = reportHtml(b, account);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await shareFile(uri, 'application/pdf', 'com.adobe.pdf', `Service report ${b.ref}`);
}

/* ---------------- bookings XML ---------------- */

export async function shareBookingsXml(xml: string) {
  if (Platform.OS === 'web') {
    await Share.share({ message: xml });
    return;
  }
  await shareFile(writeCacheFile('my-bookings.xml', xml), 'application/xml', 'public.xml', 'My bookings (XML)');
}
