/* Unit tests for the business rules ported from the Assessment 2 website:
   XML parsing, pest identification, pricing, the booking roster and form validation.
   The fixtures are copies of the live XML files served over HTTPS. */

import { readFileSync } from 'fs';
import { join } from 'path';

import { parsePests, parsePricing, parseQuiz, parseSchedule, rankPests } from '@/lib/data';
import { formatDay, range, toISODate } from '@/lib/format';
import { calculateEstimate, findZone } from '@/lib/pricing';
import { buildDays, nextAvailable } from '@/lib/schedule';
import { isValidEmail, normaliseMobile, validateBooking } from '@/lib/validation';
import { parseXml } from '@/lib/xml';

const fixture = (name: string) => parseXml(readFileSync(join(__dirname, 'fixtures', `${name}.xml`), 'utf8'), name);
const pests = parsePests(fixture('pests'));
const quiz = parseQuiz(fixture('pests'));
const pricing = parsePricing(fixture('pricing'));
const schedule = parseSchedule(fixture('timeslots'));

describe('XML parsing', () => {
  test('reads all 8 pests with their cues and preparation steps', () => {
    expect(pests).toHaveLength(8);
    const roach = pests.find((p) => p.id === 'cockroach')!;
    expect(roach.name).toBe('Cockroaches');
    expect(roach.scientific).toBe('Blattella germanica');
    expect(roach.prep.length).toBeGreaterThan(0);
    expect(roach.cues).toContainEqual({ question: 'look', answer: 'brown-flat', weight: 5 });
  });

  test('reads the three quiz questions; entities are decoded', () => {
    expect(quiz.map((q) => q.id)).toEqual(['where', 'look', 'count']);
    expect(quiz[2].style).toBe('pills');
    expect(quiz[1].options.find((o) => o.id === 'brown-flat')!.label).toBe('Brown & flat');
  });

  test('reads pricing bases, options and zones', () => {
    expect(pricing.bases.cockroach).toMatchObject({ min: 150, max: 190 });
    expect(pricing.properties.find((p) => p.id === 'apartment')!.factor).toBe(0.8);
    expect(pricing.zones).toHaveLength(3);
  });

  test('rejects XML that is not well-formed', () => {
    expect(() => parseXml('<pests><pest></pests>', 'broken.xml')).toThrow(/not well-formed/);
  });
});

describe('identification quiz', () => {
  test('kitchen + brown & flat + a few → German cockroach with high confidence', () => {
    const [best] = rankPests(pests, { where: 'kitchen', look: 'brown-flat', count: 'few' });
    expect(best.pest.id).toBe('cockroach');
    expect(best.confidence).toBeGreaterThanOrEqual(0.7);
  });

  test('roof + furry + signs only → rodents', () => {
    expect(rankPests(pests, { where: 'roof', look: 'furry', count: 'signs' })[0].pest.id).toBe('rodent');
  });

  test('no answers → every score is zero', () => {
    expect(rankPests(pests, {}).every((r) => r.score === 0)).toBe(true);
  });
});

describe('pricing', () => {
  test('cockroach, 3-bed house, inside & outside, 3056 → $180 – $260 (same as the website)', () => {
    const est = calculateEstimate(pricing, { pest: 'cockroach', property: 'house', size: '3', area: 'both', postcode: '3056' });
    expect('error' in est).toBe(false);
    if (!('error' in est)) {
      expect([est.min, est.max]).toEqual([180, 260]);
      expect(est.lines).toHaveLength(4);
    }
  });

  test('apartment factor and outer-suburb travel are applied', () => {
    const est = calculateEstimate(pricing, { pest: 'ant', property: 'apartment', size: '1', area: 'inside', postcode: '3805' });
    // 140×0.8=112→110, 180×0.8=144→145, + $40 travel
    if ('error' in est) throw new Error(est.error);
    expect([est.min, est.max]).toEqual([150, 185]);
    expect(est.zone.label).toBe('Outer suburbs');
  });

  test('postcodes outside the service zones are refused', () => {
    expect(findZone(pricing, '2000')).toBeNull();
    expect(findZone(pricing, '30a6')).toBeNull();
    const est = calculateEstimate(pricing, { pest: 'ant', property: 'house', size: '1', area: 'inside', postcode: '2000' });
    expect(est).toEqual({ error: expect.stringContaining('2000') });
  });

  test('missing answers give an error, not a price', () => {
    expect(calculateEstimate(pricing, { pest: 'ant', property: null, size: '1', area: 'inside', postcode: '3056' })).toEqual({ error: 'Some answers are missing.' });
  });
});

describe('booking roster', () => {
  // Monday 28 Sep 2026 → the 9 bookable days start on Tuesday 29 Sep
  const monday = new Date(2026, 8, 28);
  const days = buildDays(schedule, [], monday);

  test('shows 9 days starting the day after today', () => {
    expect(days).toHaveLength(9);
    expect(days[0].date).toBe('2026-09-29');
  });

  test('Sunday is closed and Saturday closes at 1pm', () => {
    const sunday = days.find((d) => d.date === '2026-10-04')!;
    expect(sunday.open).toBe(false);
    const saturday = days.find((d) => d.date === '2026-10-03')!;
    expect(saturday.windows.find((w) => w.id === 'w13')!.remaining).toBe(0);
    expect(saturday.windows.find((w) => w.id === 'w09')!.remaining).toBeGreaterThan(0);
  });

  test('existing demand fills windows (Wednesday 1–3pm is full)', () => {
    const wed = days.find((d) => d.date === '2026-09-30')!;
    expect(wed.windows.find((w) => w.id === 'w13')!.remaining).toBe(0);
  });

  test('a booking made in the app takes a place; a cancelled one gives it back', () => {
    const before = days[0].windows.find((w) => w.id === 'w11')!.remaining;
    const after = buildDays(schedule, [{ date: '2026-09-29', window: 'w11', status: 'requested' }], monday)[0].windows.find((w) => w.id === 'w11')!.remaining;
    const cancelled = buildDays(schedule, [{ date: '2026-09-29', window: 'w11', status: 'cancelled' }], monday)[0].windows.find((w) => w.id === 'w11')!.remaining;
    expect(after).toBe(before - 1);
    expect(cancelled).toBe(before);
  });

  test('nextAvailable returns the earliest free windows in order', () => {
    const next = nextAvailable(days, 3);
    expect(next).toHaveLength(3);
    expect(next[0].date).toBe('2026-09-29');
  });
});

describe('booking form validation', () => {
  test('normalises Australian mobiles and rejects landlines', () => {
    expect(normaliseMobile('+61 412 345 678')).toBe('0412 345 678');
    expect(normaliseMobile('0412345678')).toBe('0412 345 678');
    expect(normaliseMobile('(03) 9123 4567')).toBeNull();
    expect(normaliseMobile('0412')).toBeNull();
  });

  test('email is optional but must be valid when given', () => {
    expect(isValidEmail('')).toBe(true);
    expect(isValidEmail('priya@example.com')).toBe(true);
    expect(isValidEmail('priya@example')).toBe(false);
  });

  test('an empty form reports every required field', () => {
    const errors = validateBooking({ firstName: '', lastName: '', mobile: '', email: '', address: '', access: '', notes: '', agree: false }, null);
    expect(Object.keys(errors).sort()).toEqual(['address', 'agree', 'firstName', 'lastName', 'mobile', 'window']);
  });

  test('a complete form has no errors', () => {
    const errors = validateBooking({ firstName: 'Priya', lastName: 'Nair', mobile: '0412 345 678', email: '', address: '12 Sydney Rd', access: '', notes: '', agree: true }, 'w09');
    expect(errors).toEqual({});
  });
});

describe('formatting', () => {
  test('money ranges and dates', () => {
    expect(range(180, 260)).toBe('$180 – $260');
    expect(range(165, 165)).toBe('$165');
    expect(formatDay('2025-11-06', { year: true })).toBe('Thu 6 Nov 2025');
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
