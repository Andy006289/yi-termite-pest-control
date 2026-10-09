/* schedule.ts — which arrival windows are still free on the next few days.

   remaining = window capacity − demand in timeslots.xml for that weekday
               − bookings already made in the app for that exact date and window */

import type { Schedule } from './data';
import { toISODate } from './format';

export type SlotUse = { date: string; window: string; status: string };
export type DaySlot = { id: string; label: string; remaining: number; popular: boolean };
export type Day = { date: string; open: boolean; windows: DaySlot[] };

export const windowLabel = (schedule: Schedule, id: string) => schedule.windows.find((w) => w.id === id)?.label ?? id;

export function buildDays(schedule: Schedule, appBookings: SlotUse[] = [], today = new Date()): Day[] {
  const days: Day[] = [];
  for (let i = 0; i < schedule.horizon; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + schedule.leadDays + i);
    const iso = toISODate(d);
    const weekday = schedule.weekdays.find((w) => w.day === d.getDay());
    const open = !!weekday?.open;
    const windows = schedule.windows.map((w) => {
      const afterClose = !!weekday?.closesAt && w.start >= weekday.closesAt;
      const demand = schedule.demand.filter((x) => x.day === d.getDay() && x.window === w.id).reduce((s, x) => s + x.count, 0);
      const mine = appBookings.filter((b) => b.date === iso && b.window === w.id && b.status !== 'cancelled').length;
      const remaining = open && !afterClose ? Math.max(0, w.capacity - demand - mine) : 0;
      return { id: w.id, label: w.label, remaining, popular: w.popular };
    });
    days.push({ date: iso, open: open && windows.some((w) => w.remaining > 0), windows });
  }
  return days;
}

/** The first `count` free windows across all days ("Next available"). */
export function nextAvailable(days: Day[], count = 3): (DaySlot & { date: string })[] {
  const out: (DaySlot & { date: string })[] = [];
  for (const day of days) {
    for (const w of day.windows) {
      if (w.remaining > 0) out.push({ date: day.date, ...w });
      if (out.length === count) return out;
    }
  }
  return out;
}
