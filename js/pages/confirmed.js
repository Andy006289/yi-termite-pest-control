/* confirmed.js — Booking confirmed.
   Reads the booking named in ?ref= from the saved XML, shows its summary and the
   preparation steps for that pest (pests.xml), and offers an "Add to calendar"
   .ics file generated in the browser. */

import { startPage, $, esc, range, formatDay, showError } from '../ui.js';
import { getPest } from '../data.js';
import { getSchedule } from '../schedule.js';
import { getBooking } from '../store.js';

startPage();

const root = $('#confirm-root');

/** iCalendar file for the arrival window, so the visit can be added to any calendar app. */
function calendarFile(booking, window, pestLabel) {
  const stamp = (date, time) => date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//YI Termite & Pest Control//Booking//EN', 'BEGIN:VEVENT',
    `UID:${booking.ref}@yi-termite-pest.example`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=Australia/Melbourne:${stamp(booking.date, window.start)}`,
    `DTEND;TZID=Australia/Melbourne:${stamp(booking.date, window.end)}`,
    `SUMMARY:${pestLabel} – YI Termite & Pest Control`,
    `LOCATION:${booking.address.replace(/,/g, '\\,')}`,
    `DESCRIPTION:Booking ref ${booking.ref}. Technician arrives within this window.`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return new Blob([lines.join('\r\n')], { type: 'text/calendar' });
}

async function render() {
  const ref = new URLSearchParams(location.search).get('ref');
  const booking = ref && await getBooking(ref);
  if (!booking) {
    root.innerHTML = `<div class="card empty"><span class="ico"><svg><use href="#i-cal"/></svg></span><h1 style="font-size:1.4rem">Booking not found</h1>
      <p class="muted">We couldn't find that booking in this browser.</p><a class="btn btn-primary" href="my-services.html">Go to My Services</a></div>`;
    return;
  }
  const [pest, schedule] = await Promise.all([getPest(booking.pest), getSchedule()]);
  const window = schedule.windows.find((w) => w.id === booking.window);

  root.innerHTML = `
    <div class="card center" style="padding:40px 24px">
      <span class="ico" style="width:72px;height:72px;border-radius:50%;margin:0 auto 16px"><svg style="width:36px;height:36px"><use href="#i-check"/></svg></span>
      <span class="badge"><span class="dot"></span> Request received</span>
      <h1 style="font-size:clamp(1.6rem,4vw,2.2rem);margin-top:12px">You're booked in, ${esc(booking.contact.firstName)}</h1>
      <p class="muted">Booking ref <b>${esc(booking.ref)}</b>. We'll text ${esc(booking.contact.mobile)} when a technician is assigned — usually within the hour.</p>
      <div class="panel" style="text-align:left;margin-top:24px">
        <div class="kv">
          <div><b>Service</b>${esc(pest.name)}</div>
          <div><b>When</b>${formatDay(booking.date)} · ${esc(window.label)}</div>
          <div><b>Where</b>${esc(booking.address)}</div>
          <div><b>Estimate</b>${range(booking.estimate.min, booking.estimate.max)}</div>
        </div>
      </div>
      <div class="row" style="justify-content:center;margin-top:24px">
        <a class="btn btn-primary" href="my-services.html">View in My Services</a>
        <a class="btn btn-outline" id="add-cal" download="${esc(booking.ref)}.ics"><svg><use href="#i-cal"/></svg> Add to calendar</a>
      </div>
      <p class="small muted" style="margin:24px 0 0">Need to change it? You can cancel from My Services up to 24 hours before.</p>
    </div>
    <div class="card" style="margin-top:16px">
      <h2 class="h3">Before we arrive</h2>
      <ul class="small muted" style="margin:0;padding-left:18px;display:grid;gap:6px">
        ${pest.prep.map((step) => `<li>${esc(step)}</li>`).join('')}
        <li>You'll receive your digital service report within 24 hours of the visit.</li>
      </ul>
    </div>`;
  $('#add-cal').href = URL.createObjectURL(calendarFile(booking, window, pest.name));
}

render().catch((err) => showError(root, err)).finally(() => root.setAttribute('aria-busy', 'false'));
