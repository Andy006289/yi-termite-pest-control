/* pricing.ts — the indicative estimate (same rules as the Assessment 2 website).

   range = base range for the pest × property factor
           + size adjustment + area adjustment + travel for the postcode zone
   Base amounts are rounded to the nearest $5. */

import type { PriceOption, Pricing, Zone } from './data';

const round5 = (n: number) => Math.round(n / 5) * 5;

export type EstimateAnswers = {
  pest: string | null; property: string | null; size: string | null; area: string | null;
  postcode: string; pets?: boolean; notes?: string;
};
export type EstimateLine = { item: string; basis: string; min: number; max: number; adjust?: boolean };
export type EstimateResult =
  | { error: string }
  | { min: number; max: number; label: string; duration: string; zone: Zone; lines: EstimateLine[]; property: PriceOption; size: PriceOption; area: PriceOption };

/** Service zone for a 4-digit postcode, or null when it is not serviced. */
export function findZone(pricing: Pricing, postcode: string): Zone | null {
  const code = String(postcode).trim();
  if (!/^\d{4}$/.test(code)) return null;
  const n = Number(code);
  return pricing.zones.find((z) => z.ranges.some(([from, to]) => n >= from && n <= to)) ?? null;
}

export function calculateEstimate(pricing: Pricing, answers: EstimateAnswers): EstimateResult {
  const base = answers.pest ? pricing.bases[answers.pest] : undefined;
  const property = pricing.properties.find((p) => p.id === answers.property);
  const size = pricing.sizes.find((s) => s.id === answers.size);
  const area = pricing.areas.find((a) => a.id === answers.area);
  if (!base || !property || !size || !area) return { error: 'Some answers are missing.' };
  const zone = findZone(pricing, answers.postcode);
  if (!zone) return { error: `Sorry, we don't service postcode ${answers.postcode || '(blank)'} yet.` };

  const baseMin = round5(base.min * property.factor);
  const baseMax = round5(base.max * property.factor);
  const lines: EstimateLine[] = [
    { item: base.label, basis: property.factor === 1 ? `Standard ${property.label.toLowerCase()}` : `${property.label} (×${property.factor})`, min: baseMin, max: baseMax },
    { item: 'Property size', basis: size.label, min: size.addMin, max: size.addMax, adjust: true },
    { item: 'Treatment area', basis: area.label, min: area.addMin, max: area.addMax, adjust: true },
    { item: 'Travel', basis: `${answers.postcode} — ${zone.label}`, min: zone.travel, max: zone.travel, adjust: true },
  ];
  const min = lines.reduce((s, l) => s + l.min, 0);
  const max = lines.reduce((s, l) => s + l.max, 0);
  return { min, max, label: base.label, duration: base.duration, zone, lines, property, size, area };
}
