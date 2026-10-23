import { createContext, useContext } from 'react';
import type { Expense, ISODate, Member, Settlement, Trip, VisaStay } from './types';
import type { StoredRates } from './logic/rates';

export interface AppState {
  trip: Trip;
  trips: Trip[];
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  visaStays: VisaStay[];
  rates: StoredRates;
  online: boolean;
  now: ISODate;
  refreshRates: () => Promise<void>;
  setRate: (code: string, rate: number | null) => Promise<void>;
}

export const AppCtx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}
