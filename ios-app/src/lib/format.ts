/* format.ts — money and date formatting (ported from the Assessment 2 ui.js). */

/** $180 */
export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-AU');
/** $180 – $260 */
export const range = (min: number, max: number) => (min === max ? money(min) : `${money(min)} – ${money(max)}`);

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Parses YYYY-MM-DD as a local date (no time-zone shift). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
/** Local date → YYYY-MM-DD */
export function toISODate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
/** "Thu 17 Sep" (adds the year when it is not the current one, or when asked) */
export function formatDay(iso: string, opts: { year?: boolean } = {}): string {
  const d = parseISODate(iso);
  const showYear = opts.year || d.getFullYear() !== new Date().getFullYear();
  return `${DAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}${showYear ? ' ' + d.getFullYear() : ''}`;
}
export const weekdayShort = (iso: string) => DAY[parseISODate(iso).getDay()];
/** "2026-09" → "September 2026" */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_LONG[m - 1]} ${y}`;
}
/** ISO timestamp → "29 Sep 2026, 11:04 am" */
export function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const time = `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
  return `${d.getDate()} ${MONTH[d.getMonth()]} ${d.getFullYear()}, ${time}`;
}
