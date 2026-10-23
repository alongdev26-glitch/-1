import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppCtx, useApp, type AppState } from './ctx';
import { db, deleteTrip, getMeta, setMeta } from './db';
import { today } from './logic/dates';
import { loadRates, refreshRates, setManualRate, type StoredRates } from './logic/rates';
import { AddExpense } from './screens/AddExpense';
import { ExpenseDetail } from './screens/ExpenseDetail';
import { Expenses } from './screens/Expenses';
import { Group } from './screens/Group';
import { Home } from './screens/Home';
import { Summary } from './screens/Summary';
import { TripForm } from './screens/TripForm';
import { checkVisaNotifications, Visa } from './screens/Visa';
import { BottomNav, type Tab } from './ui/Nav';
import { Sheet } from './ui/kit';

function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    addEventListener('online', up);
    addEventListener('offline', down);
    return () => { removeEventListener('online', up); removeEventListener('offline', down); };
  }, []);
  return on;
}

function useToday() {
  const [now, setNow] = useState(today());
  useEffect(() => {
    const t = setInterval(() => setNow(today()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function App() {
  const trips = useLiveQuery(() => db.trips.toArray(), []);
  const activeId = useLiveQuery(() => getMeta<string | null>('activeTripId', null), []);
  const trip = trips?.find((t) => t.id === activeId) ?? trips?.[0];
  const tripId = trip?.id ?? '';
  const members = useLiveQuery(() => db.members.where('tripId').equals(tripId).sortBy('order'), [tripId]);
  const expenses = useLiveQuery(() => db.expenses.where('tripId').equals(tripId).toArray(), [tripId]);
  const settlements = useLiveQuery(() => db.settlements.where('tripId').equals(tripId).toArray(), [tripId]);
  const visaStays = useLiveQuery(() => db.visaStays.where('tripId').equals(tripId).toArray(), [tripId]);
  const online = useOnline();
  const now = useToday();
  const [rates, setRates] = useState<StoredRates | null>(null);
  const home = trip?.homeCurrency;

  const refresh = useCallback(async () => {
    if (home) setRates(await refreshRates(home, true));
  }, [home]);

  useEffect(() => {
    if (!home) return;
    let alive = true;
    loadRates(home).then((r) => alive && setRates(r));
    if (navigator.onLine) refreshRates(home).then((r) => alive && setRates(r));
    return () => { alive = false; };
  }, [home, online]);

  useEffect(() => {
    if (visaStays?.length) checkVisaNotifications(visaStays, now).catch(() => {});
  }, [visaStays, now]);

  const state = useMemo<AppState | null>(() => {
    if (!trip || !trips || !members || !expenses || !settlements || !visaStays || !rates) return null;
    return {
      trip, trips, members, expenses, settlements, visaStays, rates, online, now, refreshRates: refresh,
      setRate: async (code, rate) => setRates(await setManualRate(trip.homeCurrency, code, rate)),
    };
  }, [trip, trips, members, expenses, settlements, visaStays, rates, online, now, refresh]);

  if (trips === undefined || activeId === undefined) return <div className="grid min-h-dvh place-items-center text-mute">טוען…</div>;
  if (trips.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <TripForm first onDone={() => {}} />
      </div>
    );
  }
  if (!state) return <div className="grid min-h-dvh place-items-center text-mute">טוען…</div>;
  return (
    <AppCtx.Provider value={state}>
      <Shell />
    </AppCtx.Provider>
  );
}

type Overlay = null | 'add' | 'summary' | 'trips' | 'newTrip' | 'editTrip';

function Shell() {
  const { trip, trips, online } = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [detail, setDetail] = useState<string | null>(null);

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-28">
      <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between gap-2 bg-bg/80 px-4 py-3 backdrop-blur-xl">
        <button className="glass flex min-w-0 flex-1 items-center gap-2 px-4 py-2 text-start" onClick={() => setOverlay('trips')} aria-label="החלף טיול">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-mute">טיול פעיל</div>
            <div className="truncate text-sm font-bold">{trip.name}</div>
          </div>
          <span className="text-mute">⌄</span>
        </button>
        <span className={`pill flex items-center gap-1.5 px-3 py-1.5 text-xs ${online ? 'text-mint' : 'text-gold'}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {online ? 'מחובר' : 'עובד אופליין'}
        </span>
      </header>

      <main className="pt-2">
        {tab === 'home' && <Home onSummary={() => setOverlay('summary')} onOpenExpense={setDetail} />}
        {tab === 'expenses' && <Expenses onOpenExpense={setDetail} />}
        {tab === 'group' && <Group />}
        {tab === 'visa' && <Visa />}
      </main>

      <BottomNav tab={tab} onTab={setTab} onAdd={() => setOverlay('add')} />

      {overlay === 'add' && <AddExpense onClose={() => setOverlay(null)} />}
      {overlay === 'summary' && <Summary onClose={() => setOverlay(null)} />}
      {detail && <ExpenseDetail id={detail} onClose={() => setDetail(null)} />}
      {overlay === 'trips' && (
        <Sheet title="הטיולים שלי" onClose={() => setOverlay(null)}>
          <div className="mb-4 space-y-2">
            {trips.map((t) => (
              <button
                key={t.id}
                className={`flex w-full items-center justify-between rounded-2xl border p-3 text-start ${t.id === trip.id ? 'border-mint bg-mint/10' : 'border-line bg-white/5'}`}
                onClick={async () => { await setMeta('activeTripId', t.id); setOverlay(null); }}
              >
                <span className="font-semibold">{t.name}</span>
                {t.id === trip.id && <span className="text-mint">✓</span>}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setOverlay('newTrip')}>+ טיול חדש</button>
            <button className="btn-soft shrink-0" onClick={() => setOverlay('editTrip')}>ערוך</button>
          </div>
          <button
            className="mt-3 w-full text-sm text-rose"
            onClick={async () => { if (confirm(`למחוק את "${trip.name}" וכל הנתונים שלו?`)) { await deleteTrip(trip.id); setOverlay(null); } }}
          >
            מחק את הטיול הנוכחי
          </button>
        </Sheet>
      )}
      {overlay === 'newTrip' && (
        <Sheet title="טיול חדש" onClose={() => setOverlay(null)}>
          <TripForm onDone={() => { setOverlay(null); setTab('home'); }} onCancel={() => setOverlay(null)} />
        </Sheet>
      )}
      {overlay === 'editTrip' && (
        <Sheet title="עריכת טיול" onClose={() => setOverlay(null)}>
          <TripForm initial={trip} onDone={() => setOverlay(null)} onCancel={() => setOverlay(null)} />
        </Sheet>
      )}
    </div>
  );
}
