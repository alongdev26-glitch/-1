import { CURRENCIES } from '../data/currencies';
import { getMeta, setMeta } from '../db';

/** home units per 1 unit of each currency */
export type RateTable = Record<string, number>;

export interface StoredRates {
  home: string;
  fetchedAt: number | null; // ms
  rates: RateTable;
  manual: RateTable; // user overrides, win over live rates
}

const DAY = 24 * 60 * 60 * 1000;

export function fallbackRates(home: string): RateTable {
  const homeToILS = CURRENCIES.find((c) => c.code === home)?.fallbackToILS ?? 1;
  return Object.fromEntries(CURRENCIES.map((c) => [c.code, c.fallbackToILS / homeToILS]));
}

/** open.er-api.com returns "units of X per 1 home"; we store the inverse. */
export function invertRates(perHome: Record<string, number>): RateTable {
  const out: RateTable = {};
  for (const [code, v] of Object.entries(perHome)) if (v > 0) out[code] = 1 / v;
  return out;
}

export function effectiveRate(stored: StoredRates, code: string, home: string): number {
  if (code === home) return 1;
  return stored.manual[code] ?? stored.rates[code] ?? fallbackRates(home)[code] ?? 1;
}

export function toHome(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

export async function loadRates(home: string): Promise<StoredRates> {
  const saved = await getMeta<StoredRates | null>('rates', null);
  if (saved && saved.home === home) return saved;
  return { home, fetchedAt: null, rates: fallbackRates(home), manual: {} };
}

/** Downloads fresh rates at most once a day. Never throws: offline keeps the last table. */
export async function refreshRates(home: string, force = false): Promise<StoredRates> {
  const current = await loadRates(home);
  if (!force && current.fetchedAt && Date.now() - current.fetchedAt < DAY) return current;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${home}`);
    if (!res.ok) return current;
    const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (json.result !== 'success' || !json.rates) return current;
    const next: StoredRates = { ...current, fetchedAt: Date.now(), rates: { ...current.rates, ...invertRates(json.rates) } };
    await setMeta('rates', next);
    return next;
  } catch {
    return current;
  }
}

export async function setManualRate(home: string, code: string, rate: number | null): Promise<StoredRates> {
  const current = await loadRates(home);
  const manual = { ...current.manual };
  if (rate && rate > 0) manual[code] = rate;
  else delete manual[code];
  const next = { ...current, manual };
  await setMeta('rates', next);
  return next;
}
