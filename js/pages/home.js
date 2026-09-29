/* home.js — Home page.
   - Builds the "Common Melbourne pests" grid from pests.xml, with "from $…" prices from pricing.xml.
   - Fills the hero preview card with the visitor's last estimate (if any) and the next free window. */

import { startPage, $, range, formatDay, showError } from '../ui.js';
import { pestCard } from '../components.js';
import { getPests } from '../data.js';
import { getPricing } from '../pricing.js';
import { getSchedule, buildDays, nextAvailable } from '../schedule.js';
import { getEstimate, getAppSlots } from '../store.js';

startPage();

async function renderGrid() {
  const grid = $('#pest-grid');
  try {
    const [pests, pricing] = await Promise.all([getPests(), getPricing()]);
    grid.innerHTML = pests.map((p) => pestCard(p, pricing.bases.get(p.id))).join('');
  } catch (err) {
    showError(grid, err);
  }
  grid.setAttribute('aria-busy', 'false');
}

async function renderPreview() {
  const card = $('#hero-preview');
  const set = (key, value) => { const el = $(`[data-preview="${key}"]`, card); if (el) el.textContent = value; };
  try {
    const est = getEstimate();
    if (est) {
      set('badge', 'Your last estimate');
      set('when', 'Saved');
      set('pest', est.pestName);
      set('context', `${est.labels.area} · ${est.labels.size} ${est.labels.property.toLowerCase()}`);
      set('price', range(est.min, est.max));
      $('[data-preview="icon"] use', card).setAttribute('href', `#p-${est.answers.pest}`);
    }
    const [next] = nextAvailable(buildDays(await getSchedule(), getAppSlots()), 1);
    if (next) set('slot', `${formatDay(next.date)} · ${next.label}`);
  } catch (err) {
    console.error(err); // the preview is decorative; keep the sample content
  }
}

renderGrid();
renderPreview();
