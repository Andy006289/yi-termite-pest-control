/* schedule.js — reads data/timeslots.xml and works out which arrival windows are
   still free on each of the next few days.

   remaining = window capacity − demand in timeslots.xml for that weekday
               − bookings already made in this browser for that exact date and window */

import { loadXML, num } from './data.js';
import { toISODate } from './ui.js';

export async function getSchedule() {
  const xml = await loadXML('timeslots');
  const root = xml.documentElement;
  return {
    horizon: num(root, 'horizon'),
    leadDays: num(root, 'leadDays'),
    windows: [...xml.querySelectorAll('windows > window')].map((w) => ({
      id: w.getAttribute('id'),
      label: w.textContent.trim(),
      start: w.getAttribute('start'),
      end: w.getAttribute('end'),
      capacity: num(w, 'capacity'),
      popular: w.getAttribute('popular') === 'true',
    })),
    weekdays: [...xml.querySelectorAll('weekdays > weekday')].map((d) => ({
      day: num(d, 'day'),
      open: d.getAttribute('open') === 'true',
      closesAt: d.getAttribute('closesAt'),
    })),
    demand: [...xml.querySelectorAll('demand > booked')].map((b) => ({
      day: num(b, 'day'), window: b.getAttribute('window'), count: num(b, 'count'),
    })),
  };
}

/** Label of a window id, e.g. "w09" → "9 – 11am". */
export const windowLabel = (schedule, id) => schedule.windows.find((w) => w.id === id)?.label ?? id;

/**
 * The bookable days: [{ date: 'YYYY-MM-DD', open, windows: [{ id, label, remaining, popular }] }]
 * appBookings is a list of { date, window, status } for bookings made in this browser.
 */
export function buildDays(schedule, appBookings = [], today = new Date()) {
  const days = [];
  for (let i = 0; i < schedule.horizon; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + schedule.leadDays + i);
    const iso = toISODate(d);
    const weekday = schedule.weekdays.find((w) => w.day === d.getDay());
    const windows = schedule.windows.map((w) => {
      const afterClose = weekday.closesAt && w.start >= weekday.closesAt;
      const demand = schedule.demand.filter((x) => x.day === d.getDay() && x.window === w.id).reduce((s, x) => s + x.count, 0);
      const mine = appBookings.filter((b) => b.date === iso && b.window === w.id && b.status !== 'cancelled').length;
      const remaining = weekday.open && !afterClose ? Math.max(0, w.capacity - demand - mine) : 0;
      return { id: w.id, label: w.label, remaining, popular: w.popular };
    });
    days.push({ date: iso, open: weekday.open && windows.some((w) => w.remaining > 0), windows });
  }
  return days;
}

/** The first `count` free windows across all days (used for "Next available"). */
export function nextAvailable(days, count = 3) {
  const out = [];
  for (const day of days) {
    for (const w of day.windows) {
      if (w.remaining > 0) out.push({ date: day.date, ...w });
      if (out.length === count) return out;
    }
  }
  return out;
}
