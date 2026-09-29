/* pricing.js — reads data/pricing.xml and calculates the indicative estimate.

   range = base range for the pest × property factor
           + size adjustment + area adjustment + travel for the postcode zone
   Results are rounded to the nearest $5. */

import { loadXML, num } from './data.js';

const round5 = (n) => Math.round(n / 5) * 5;

/** Option lists with their price effects, as plain objects. */
export async function getPricing() {
  const xml = await loadXML('pricing');
  const options = (selector) => [...xml.querySelectorAll(selector)].map((el) => ({
    id: el.getAttribute('id'),
    label: el.textContent.trim(),
    icon: el.getAttribute('icon'),
    hint: el.getAttribute('hint'),
    factor: el.hasAttribute('factor') ? num(el, 'factor') : 1,
    addMin: el.hasAttribute('addMin') ? num(el, 'addMin') : 0,
    addMax: el.hasAttribute('addMax') ? num(el, 'addMax') : 0,
  }));
  return {
    bases: new Map([...xml.querySelectorAll('bases > base')].map((b) => [b.getAttribute('pest'), {
      min: num(b, 'min'), max: num(b, 'max'), duration: b.getAttribute('duration'), label: b.getAttribute('label'),
    }])),
    properties: options('properties > property'),
    sizes: options('sizes > size'),
    areas: options('areas > area'),
    zones: [...xml.querySelectorAll('zones > zone')].map((z) => ({
      id: z.getAttribute('id'),
      label: z.getAttribute('label'),
      travel: num(z, 'travel'),
      ranges: [...z.querySelectorAll('postcodes')].map((r) => [num(r, 'from'), num(r, 'to')]),
    })),
  };
}

/** Service zone for a 4-digit postcode, or null when we do not service it. */
export function findZone(pricing, postcode) {
  const code = Number(String(postcode).trim());
  if (!/^\d{4}$/.test(String(postcode).trim())) return null;
  return pricing.zones.find((z) => z.ranges.some(([from, to]) => code >= from && code <= to)) || null;
}

/**
 * Calculates the estimate for a set of answers:
 *   { pest, property, size, area, postcode }
 * Returns { min, max, label, duration, zone, lines[] } where lines explain each part,
 * or { error } when an answer is missing or the postcode is outside our zones.
 */
export function calculateEstimate(pricing, answers) {
  const base = pricing.bases.get(answers.pest);
  const property = pricing.properties.find((p) => p.id === answers.property);
  const size = pricing.sizes.find((s) => s.id === answers.size);
  const area = pricing.areas.find((a) => a.id === answers.area);
  if (!base || !property || !size || !area) return { error: 'Some answers are missing.' };
  const zone = findZone(pricing, answers.postcode);
  if (!zone) return { error: `Sorry, we don't service postcode ${answers.postcode || '(blank)'} yet.` };

  const baseMin = round5(base.min * property.factor);
  const baseMax = round5(base.max * property.factor);
  const lines = [
    { item: base.label, basis: property.factor === 1 ? `Standard ${property.label.toLowerCase()}` : `${property.label} (×${property.factor})`, min: baseMin, max: baseMax },
    { item: 'Property size', basis: size.label, min: size.addMin, max: size.addMax, adjust: true },
    { item: 'Treatment area', basis: area.label, min: area.addMin, max: area.addMax, adjust: true },
    { item: 'Travel', basis: `${answers.postcode} — ${zone.label}`, min: zone.travel, max: zone.travel, adjust: true },
  ];
  const min = lines.reduce((s, l) => s + l.min, 0);
  const max = lines.reduce((s, l) => s + l.max, 0);
  return { min, max, label: base.label, duration: base.duration, zone, lines, property, size, area };
}
