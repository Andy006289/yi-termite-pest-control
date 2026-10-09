/* HTTPS security tests: non-HTTPS URLs are refused before any request is made,
   HTTPS responses are logged with their HSTS header, failures fall back to the
   offline copy, and the configured data source itself is HTTPS. */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { readFileSync } from 'fs';
import { join } from 'path';

import appJson from '../app.json';
import { DATA_BASE_URL, WEBSITE_URL } from '@/lib/config';
import { loadXml } from '@/lib/data';
import { getRequestLog, InsecureUrlError, isHttps, secureFetchText } from '@/lib/secureFetch';

const PESTS = readFileSync(join(__dirname, 'fixtures', 'pests.xml'), 'utf8');

function mockResponse(body: string, status = 200, headers: Record<string, string> = {}) {
  const h = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { ok: status >= 200 && status < 300, status, text: async () => body, headers: { get: (k: string) => h.get(k.toLowerCase()) ?? null } };
}

beforeEach(async () => {
  global.fetch = jest.fn() as unknown as typeof fetch;
  await AsyncStorage.clear();
});

describe('HTTPS enforcement', () => {
  test('the app is configured with HTTPS endpoints only', () => {
    expect(isHttps(DATA_BASE_URL)).toBe(true);
    expect(isHttps(WEBSITE_URL)).toBe(true);
  });

  test('iOS App Transport Security has no cleartext exception', () => {
    expect(appJson.expo.ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads).toBe(false);
  });

  test.each(['http://andy006289.github.io/data/pests.xml', 'ftp://example.com/x.xml', 'data/pests.xml', '//example.com/x'])(
    'refuses %s without sending a request',
    async (url) => {
      await expect(secureFetchText(url)).rejects.toBeInstanceOf(InsecureUrlError);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(getRequestLog()[0]).toMatchObject({ url, source: 'blocked', ok: false });
    },
  );

  test('fetches an HTTPS URL and records status and HSTS header', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse(PESTS, 200, { 'Strict-Transport-Security': 'max-age=31556952', 'Content-Type': 'application/xml' }));
    const text = await secureFetchText('https://andy006289.github.io/yi-termite-pest-control/data/pests.xml');
    expect(text).toContain('<catalogue');
    expect(getRequestLog()[0]).toMatchObject({ source: 'network', status: 200, hsts: 'max-age=31556952' });
  });

  test('HTTP error responses are reported as failures', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse('Not found', 404));
    await expect(secureFetchText('https://andy006289.github.io/missing.xml')).rejects.toThrow('HTTP 404');
    expect(getRequestLog()[0]).toMatchObject({ source: 'failed', status: 404 });
  });
});

describe('offline copy', () => {
  test('uses the last good copy when the network fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse(PESTS));
    const first = await loadXml('pests');
    expect(first.source).toBe('network');

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));
    const second = await loadXml('pests');
    expect(second.source).toBe('cache');
    expect(second.doc.documentElement!.tagName).toBe('catalogue');
  });

  test('without a copy, a network failure is passed to the screen', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));
    await expect(loadXml('pricing')).rejects.toThrow('Network request failed');
  });
});
