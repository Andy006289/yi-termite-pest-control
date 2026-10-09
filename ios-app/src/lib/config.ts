/* config.ts — where the app gets its data from.

   The XML files are the same ones the Assessment 2 website uses. They are served by
   GitHub Pages over HTTPS (TLS 1.2+/1.3, HSTS enabled), so the web site and the mobile
   app share one source of truth. */

/** Base URL of the XML data. Must be https:// — see secureFetch.ts. */
export const DATA_BASE_URL = 'https://andy006289.github.io/yi-termite-pest-control/data/';

/** The Assessment 2 website, opened from the Account screen. */
export const WEBSITE_URL = 'https://andy006289.github.io/yi-termite-pest-control/';

/** Requests that take longer than this are aborted and fall back to the offline copy. */
export const REQUEST_TIMEOUT_MS = 10000;

/** The XML files the app reads. */
export const DATA_FILES = ['pests', 'pricing', 'timeslots', 'bookings'] as const;
export type DataFile = (typeof DATA_FILES)[number];

export const PHONE = '1300 000 000';
