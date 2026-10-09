/* data.ts — loads the XML files over HTTPS and turns them into plain objects.

   Loading order for each file:
     1. fetch https://…/data/<name>.xml through secureFetchText (HTTPS only)
     2. check it is well-formed XML, then keep a copy in AsyncStorage
     3. if the network fails, use the last good copy so the app still works offline
   The parse functions mirror js/data.js, js/pricing.js and js/schedule.js from
   the Assessment 2 website. */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { DATA_BASE_URL, type DataFile } from './config';
import { recordRequest, secureFetchText } from './secureFetch';
import { attr, first, has, kids, num, parseXml, path, textOf, txt, type XmlDoc } from './xml';

const CACHE_PREFIX = 'yi.xml.';

export type LoadedFile = { doc: XmlDoc; source: 'network' | 'cache'; savedAt: string };

/** Loads one XML file: network first, offline copy second. */
export async function loadXml(name: DataFile): Promise<LoadedFile> {
  const url = `${DATA_BASE_URL}${name}.xml`;
  try {
    const text = await secureFetchText(url);
    const doc = parseXml(text, `${name}.xml`);
    const savedAt = new Date().toISOString();
    AsyncStorage.setItem(CACHE_PREFIX + name, JSON.stringify({ text, savedAt })).catch(() => {});
    return { doc, source: 'network', savedAt };
  } catch (err) {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + name).catch(() => null);
    if (cached) {
      const { text, savedAt } = JSON.parse(cached) as { text: string; savedAt: string };
      recordRequest({ url, at: new Date().toISOString(), ok: true, source: 'cache', bytes: text.length, error: (err as Error).message });
      return { doc: parseXml(text, `${name}.xml (offline copy)`), source: 'cache', savedAt };
    }
    throw err;
  }
}

/* ---------------- types ---------------- */

export type Tone = 'green' | 'amber' | 'red';
export type Cue = { question: string; answer: string; weight: number };
export type Pest = {
  id: string; tag: string; tone: Tone; name: string; species: string; scientific: string;
  where: string; advice: string; included: string; variables: string; prep: string[];
  alsoConsider: string; cues: Cue[];
};
export type QuizOption = { id: string; label: string; icon: string; hint: string };
export type QuizQuestion = { id: string; title: string; style: 'tiles' | 'pills'; options: QuizOption[] };

export type PriceOption = { id: string; label: string; icon: string; hint: string; factor: number; addMin: number; addMax: number };
export type Base = { min: number; max: number; duration: string; label: string };
export type Zone = { id: string; label: string; travel: number; ranges: [number, number][] };
export type Pricing = { bases: Record<string, Base>; properties: PriceOption[]; sizes: PriceOption[]; areas: PriceOption[]; zones: Zone[] };

export type Window = { id: string; label: string; start: string; end: string; capacity: number; popular: boolean };
export type Schedule = {
  horizon: number; leadDays: number; windows: Window[];
  weekdays: { day: number; open: boolean; closesAt: string }[];
  demand: { day: number; window: string; count: number }[];
};

/* ---------------- pests.xml ---------------- */

export function parsePests(doc: XmlDoc): Pest[] {
  return kids(doc.documentElement, 'pest').map((p) => ({
    id: attr(p, 'id'),
    tag: attr(p, 'tag'),
    tone: (attr(p, 'tone') || 'green') as Tone,
    name: textOf(p, 'name'),
    species: textOf(p, 'species'),
    scientific: attr(first(p, 'species'), 'scientific'),
    where: textOf(p, 'where'),
    advice: textOf(p, 'advice'),
    included: textOf(p, 'included'),
    variables: textOf(p, 'variables'),
    prep: path(p, 'prep', 'step').map(txt),
    alsoConsider: textOf(p, 'alsoConsider'),
    cues: path(p, 'cues', 'cue').map((c) => ({ question: attr(c, 'question'), answer: attr(c, 'answer'), weight: num(c, 'weight') })),
  }));
}

export function parseQuiz(doc: XmlDoc): QuizQuestion[] {
  return path(doc.documentElement, 'quiz', 'question').map((q) => ({
    id: attr(q, 'id'),
    title: attr(q, 'title'),
    style: attr(q, 'style') === 'pills' ? 'pills' : 'tiles',
    options: kids(q, 'option').map((o) => ({ id: attr(o, 'id'), label: txt(o), icon: attr(o, 'icon'), hint: attr(o, 'hint') })),
  }));
}

export type Ranked = { pest: Pest; score: number; confidence: number };

/**
 * Scores every pest against the quiz answers ({ where: 'kitchen', look: 'brown-flat', … }).
 * A pest earns each cue's weight when that answer was chosen. Returns the pests sorted
 * best first, each with score and confidence (score as a share of the pest's maximum).
 */
export function rankPests(pests: Pest[], answers: Record<string, string>): Ranked[] {
  return pests
    .map((pest) => {
      const max = pest.cues.reduce((sum, c) => sum + c.weight, 0);
      const score = pest.cues.filter((c) => answers[c.question] === c.answer).reduce((sum, c) => sum + c.weight, 0);
      return { pest, score, confidence: max ? score / max : 0 };
    })
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence);
}

/* ---------------- pricing.xml ---------------- */

export function parsePricing(doc: XmlDoc): Pricing {
  const root = doc.documentElement;
  const options = (group: string, tag: string): PriceOption[] =>
    path(root, group, tag).map((el) => ({
      id: attr(el, 'id'),
      label: txt(el),
      icon: attr(el, 'icon'),
      hint: attr(el, 'hint'),
      factor: has(el, 'factor') ? num(el, 'factor') : 1,
      addMin: has(el, 'addMin') ? num(el, 'addMin') : 0,
      addMax: has(el, 'addMax') ? num(el, 'addMax') : 0,
    }));
  const bases: Record<string, Base> = {};
  path(root, 'bases', 'base').forEach((b) => {
    bases[attr(b, 'pest')] = { min: num(b, 'min'), max: num(b, 'max'), duration: attr(b, 'duration'), label: attr(b, 'label') };
  });
  return {
    bases,
    properties: options('properties', 'property'),
    sizes: options('sizes', 'size'),
    areas: options('areas', 'area'),
    zones: path(root, 'zones', 'zone').map((z) => ({
      id: attr(z, 'id'),
      label: attr(z, 'label'),
      travel: num(z, 'travel'),
      ranges: kids(z, 'postcodes').map((r) => [num(r, 'from'), num(r, 'to')] as [number, number]),
    })),
  };
}

/* ---------------- timeslots.xml ---------------- */

export function parseSchedule(doc: XmlDoc): Schedule {
  const root = doc.documentElement;
  return {
    horizon: num(root, 'horizon'),
    leadDays: num(root, 'leadDays'),
    windows: path(root, 'windows', 'window').map((w) => ({
      id: attr(w, 'id'), label: txt(w), start: attr(w, 'start'), end: attr(w, 'end'),
      capacity: num(w, 'capacity'), popular: attr(w, 'popular') === 'true',
    })),
    weekdays: path(root, 'weekdays', 'weekday').map((d) => ({ day: num(d, 'day'), open: attr(d, 'open') === 'true', closesAt: attr(d, 'closesAt') })),
    demand: path(root, 'demand', 'booked').map((b) => ({ day: num(b, 'day'), window: attr(b, 'window'), count: num(b, 'count') })),
  };
}
