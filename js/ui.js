/* ui.js — small helpers and behaviour shared by every page:
   DOM shortcuts, HTML escaping, money/date formatting, the mobile menu,
   single-select option groups and page start-up. */

import { injectIcons } from './icons.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escapes text before it is placed inside an HTML template string. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** $180 */
export const money = (n) => '$' + Math.round(n).toLocaleString('en-AU');
/** $180 – $260 */
export const range = (min, max) => (min === max ? money(min) : `${money(min)} – ${money(max)}`);

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses YYYY-MM-DD as a local date (no time-zone shift). */
export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
/** Local date → YYYY-MM-DD */
export function toISODate(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
/** "Thu 17 Sep" (adds the year when it is not the current one) */
export function formatDay(iso, { year = false } = {}) {
  const d = parseISODate(iso);
  const showYear = year || d.getFullYear() !== new Date().getFullYear();
  return `${DAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}${showYear ? ' ' + d.getFullYear() : ''}`;
}
export const weekdayShort = (iso) => DAY[parseISODate(iso).getDay()];

/** Mobile navigation: the hamburger toggles the menu and keeps aria-expanded in sync. */
function initMenu() {
  const btn = $('.menu-btn');
  const nav = $('.mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  // Escape closes the menu and returns focus to the button
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { btn.click(); btn.focus(); }
  });
}

/**
 * Makes a container behave like a radio group: clicking a .choice/.pill/.slot/.date
 * inside it selects that one item. onChange(value, item) runs after every change.
 * Items marked .off or disabled cannot be chosen.
 */
export function selectGroup(container, onChange) {
  const items = () => $$('.choice, .pill, .slot, .date', container);
  const sync = () => items().forEach((el) => el.setAttribute('aria-pressed', String(el.classList.contains('selected'))));
  container.addEventListener('click', (e) => {
    const item = e.target.closest('.choice, .pill, .slot, .date');
    if (!item || !container.contains(item) || item.classList.contains('off') || item.disabled) return;
    e.preventDefault();
    items().forEach((el) => el.classList.remove('selected'));
    item.classList.add('selected');
    sync();
    onChange?.(item.dataset.value, item);
  });
  sync();
  return {
    get value() { return $('.selected', container)?.dataset.value ?? null; },
    set value(v) {
      items().forEach((el) => el.classList.toggle('selected', el.dataset.value === v));
      sync();
    },
  };
}

/** Shows a friendly message in place of a section when its data cannot load. */
export function showError(target, err) {
  console.error(err);
  target.innerHTML = `<div class="notice notice-red" role="alert"><svg><use href="#i-warn"/></svg><span>Sorry, this section could not load its data. If you opened the file directly, run the site from a local web server (see README). <small>${esc(err.message)}</small></span></div>`;
}

/** Small temporary message at the bottom of the screen. */
export function toast(message) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = message;
  document.body.append(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
}

/** Runs on every page before the page's own script. */
export function startPage() {
  injectIcons();
  initMenu();
}
