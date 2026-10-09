/* AppData.tsx — app-wide state shared by every screen.

   On start-up it loads the four XML files over HTTPS (in parallel), parses them, and
   reads the saved estimate and local bookings from the phone. Screens read the result
   with useAppData(); pull-to-refresh calls reload(). */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { DataFile } from './config';
import { loadXml, parsePests, parsePricing, parseQuiz, parseSchedule, type Pest, type Pricing, type QuizQuestion, type Schedule } from './data';
import { loadEstimate, parseAccount, readBookings, storeEstimate, type Account, type Booking, type SavedEstimate } from './store';
import type { XmlDoc } from './xml';

type Ready = {
  pests: Pest[];
  quiz: QuizQuestion[];
  pricing: Pricing;
  schedule: Schedule;
  account: Account;
  sampleDoc: XmlDoc;
};

type AppDataValue = {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  data: Ready | null;
  /** Where each file came from on the last load. */
  sources: Partial<Record<DataFile, { source: 'network' | 'cache'; savedAt: string }>>;
  loadedAt: string | null;
  bookings: Booking[];
  estimate: SavedEstimate | null;
  reload: () => Promise<void>;
  refreshBookings: () => Promise<void>;
  setEstimate: (e: SavedEstimate | null) => Promise<void>;
};

const Ctx = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AppDataValue['status']>('loading');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Ready | null>(null);
  const [sources, setSources] = useState<AppDataValue['sources']>({});
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [estimate, setEstimateState] = useState<SavedEstimate | null>(null);

  /** Loads everything; every state update happens after the network work. */
  const load = useCallback(async () => {
    try {
      const [pests, pricing, timeslots, bookingsFile] = await Promise.all([
        loadXml('pests'), loadXml('pricing'), loadXml('timeslots'), loadXml('bookings'),
      ]);
      const ready: Ready = {
        pests: parsePests(pests.doc),
        quiz: parseQuiz(pests.doc),
        pricing: parsePricing(pricing.doc),
        schedule: parseSchedule(timeslots.doc),
        account: parseAccount(bookingsFile.doc),
        sampleDoc: bookingsFile.doc,
      };
      setSources({
        pests: { source: pests.source, savedAt: pests.savedAt },
        pricing: { source: pricing.source, savedAt: pricing.savedAt },
        timeslots: { source: timeslots.source, savedAt: timeslots.savedAt },
        bookings: { source: bookingsFile.source, savedAt: bookingsFile.savedAt },
      });
      setData(ready);
      setBookings(await readBookings(ready.sampleDoc));
      setEstimateState(await loadEstimate());
      setLoadedAt(new Date().toISOString());
      setError(null);
      setStatus('ready');
    } catch (e) {
      setError((e as Error).message);
      setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, []);

  // first load on start-up (runs after the first render)
  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const reload = useCallback(async () => {
    setError(null);
    setStatus((s) => (s === 'ready' ? 'ready' : 'loading'));
    await load();
  }, [load]);

  const refreshBookings = useCallback(async () => {
    if (data) setBookings(await readBookings(data.sampleDoc));
    setEstimateState(await loadEstimate());
  }, [data]);

  const setEstimate = useCallback(async (e: SavedEstimate | null) => {
    await storeEstimate(e);
    setEstimateState(e);
  }, []);

  const value = useMemo(
    () => ({ status, error, data, sources, loadedAt, bookings, estimate, reload, refreshBookings, setEstimate }),
    [status, error, data, sources, loadedAt, bookings, estimate, reload, refreshBookings, setEstimate],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData(): AppDataValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppData must be used inside AppDataProvider');
  return v;
}
