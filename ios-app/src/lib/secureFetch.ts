/* secureFetch.ts — the only way the app talks to the network.

   Three layers keep data access on HTTPS:
     1. This module refuses any URL that is not https:// before a request is made.
     2. iOS App Transport Security (ATS) blocks cleartext HTTP for the whole app;
        app.json keeps NSAllowsArbitraryLoads = false, so no exception is configured.
     3. The server (GitHub Pages) only serves HTTPS and sends Strict-Transport-Security.

   Every request is recorded in a small log that the "Data & security" screen shows
   as evidence (URL, status, HSTS header, duration, and whether the copy came from
   the network or the offline cache). */

import { REQUEST_TIMEOUT_MS } from './config';

export class InsecureUrlError extends Error {
  constructor(url: string) {
    super(`Blocked: ${url} is not an HTTPS URL. The app only loads data over HTTPS.`);
    this.name = 'InsecureUrlError';
  }
}

export type RequestLogEntry = {
  url: string;
  at: string; // ISO time
  ok: boolean;
  status?: number;
  hsts?: string | null;
  contentType?: string | null;
  bytes?: number;
  ms?: number;
  source: 'network' | 'cache' | 'blocked' | 'failed';
  error?: string;
};

const log: RequestLogEntry[] = [];
const listeners = new Set<() => void>();

export function getRequestLog(): RequestLogEntry[] {
  return [...log];
}
export function subscribeRequestLog(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function recordRequest(entry: RequestLogEntry) {
  log.unshift(entry);
  log.splice(30); // keep the latest 30
  listeners.forEach((fn) => fn());
}

/** True only for absolute https:// URLs. */
export function isHttps(url: string): boolean {
  return /^https:\/\/[^\s/]+/i.test(url.trim());
}

/**
 * Fetches a URL as text over HTTPS.
 * Throws InsecureUrlError for non-HTTPS URLs (nothing is sent), and a normal Error
 * for timeouts, network failures and non-2xx responses.
 */
export async function secureFetchText(url: string): Promise<string> {
  const at = new Date().toISOString();
  if (!isHttps(url)) {
    const err = new InsecureUrlError(url);
    recordRequest({ url, at, ok: false, source: 'blocked', error: err.message });
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/xml, text/xml' },
      cache: 'no-cache',
    });
    const text = await res.text();
    const entry: RequestLogEntry = {
      url,
      at,
      ok: res.ok,
      status: res.status,
      hsts: res.headers.get('strict-transport-security'),
      contentType: res.headers.get('content-type'),
      bytes: text.length,
      ms: Date.now() - started,
      source: 'network',
    };
    if (!res.ok) {
      entry.source = 'failed';
      entry.error = `HTTP ${res.status}`;
      recordRequest(entry);
      throw new Error(`${url} could not be loaded (HTTP ${res.status})`);
    }
    recordRequest(entry);
    return text;
  } catch (e) {
    const message = (e as Error).name === 'AbortError' ? `Timed out after ${REQUEST_TIMEOUT_MS / 1000}s` : (e as Error).message;
    if (!(e instanceof Error && /could not be loaded/.test(e.message))) {
      recordRequest({ url, at, ok: false, source: 'failed', ms: Date.now() - started, error: message });
    }
    throw new Error(message);
  } finally {
    clearTimeout(timer);
  }
}
