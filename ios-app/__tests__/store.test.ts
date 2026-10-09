/* Bookings are saved on the phone as XML with the same structure as bookings.xml. */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { readFileSync } from 'fs';
import { join } from 'path';

import { toISODate } from '@/lib/format';
import { cancelBooking, clearLocalData, exportLocalBookingsXml, parseAccount, readBookings, saveBooking, type NewBooking } from '@/lib/store';
import { parseXml } from '@/lib/xml';

const sample = parseXml(readFileSync(join(__dirname, 'fixtures', 'bookings.xml'), 'utf8'), 'bookings.xml');

const booking: NewBooking = {
  pest: 'cockroach',
  date: '2026-10-01',
  window: 'w09',
  property: { type: 'house', size: '3', area: 'both', address: '12 Sydney Rd, Brunswick VIC 3056' },
  estimate: { min: 180, max: 260 },
  contact: { firstName: 'Priya', lastName: 'Nair', mobile: '0412 345 678', email: '' },
  access: "I'll be home",
  notes: 'Pets or children at home. Under the <dishwasher> & fridge',
};

beforeEach(() => AsyncStorage.clear());

test('the sample account is read from bookings.xml', () => {
  const account = parseAccount(sample);
  expect(account.customer.firstName).toBe('Priya');
  expect(account.technicians.T01).toEqual({ name: 'Marcus T.', licence: '12345' });
});

test('sample visits using daysFromToday get a real date', async () => {
  const today = new Date(2026, 8, 29);
  const list = await readBookings(sample, today);
  expect(list.find((b) => b.ref === 'YI-10394')!.date).toBe(toISODate(new Date(2026, 9, 1)));
  expect(list.find((b) => b.ref === 'YI-10212')!.report!.areas).toHaveLength(4);
});

test('a new booking gets the next reference and is stored as XML', async () => {
  const ref = await saveBooking(booking, sample);
  expect(ref).toBe('YI-10395');
  const xml = await exportLocalBookingsXml();
  expect(xml).toMatch(/^<\?xml version="1.0"/);
  expect(xml).toContain('<booking ref="YI-10395" status="requested" pest="cockroach">');
  expect(xml).toContain('<visit date="2026-10-01" window="w09"/>');
  // special characters are escaped, so the document stays well-formed
  expect(xml).toContain('&lt;dishwasher&gt; &amp; fridge');
  expect(() => parseXml(xml)).not.toThrow();

  expect(await saveBooking(booking, sample)).toBe('YI-10396');
});

test('app bookings merge with the sample account and can be cancelled', async () => {
  const ref = await saveBooking(booking, sample);
  let list = await readBookings(sample);
  expect(list.filter((b) => b.source === 'app')).toHaveLength(1);
  expect(list.filter((b) => b.source === 'sample')).toHaveLength(3);

  expect(await cancelBooking(ref)).toBe(true);
  expect(await cancelBooking('YI-10212')).toBe(false); // sample bookings are read-only
  list = await readBookings(sample);
  expect(list.find((b) => b.ref === ref)!.status).toBe('cancelled');
});

test('reset removes local bookings', async () => {
  await saveBooking(booking, sample);
  await clearLocalData();
  expect((await readBookings(sample)).filter((b) => b.source === 'app')).toHaveLength(0);
});
