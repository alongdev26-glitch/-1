import Dexie, { type EntityTable } from 'dexie';
import type { Expense, Member, Settlement, Trip, VisaStay } from './types';

export interface MetaRow {
  key: string;
  value: unknown;
}

export const db = new Dexie('kupat-tayul') as Dexie & {
  trips: EntityTable<Trip, 'id'>;
  members: EntityTable<Member, 'id'>;
  expenses: EntityTable<Expense, 'id'>;
  settlements: EntityTable<Settlement, 'id'>;
  visaStays: EntityTable<VisaStay, 'id'>;
  meta: EntityTable<MetaRow, 'key'>;
};

db.version(1).stores({
  trips: 'id',
  members: 'id, tripId',
  expenses: 'id, tripId, date',
  settlements: 'id, tripId',
  visaStays: 'id, tripId',
  meta: 'key',
});

export const uid = () => crypto.randomUUID();

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key);
  return row ? (row.value as T) : fallback;
}

export const setMeta = (key: string, value: unknown) => db.meta.put({ key, value });

export const MEMBER_COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#f472b6', '#a78bfa', '#fb7185', '#2dd4bf', '#facc15'];

export async function createTrip(input: Omit<Trip, 'id'>, memberNames: string[]): Promise<string> {
  const id = uid();
  await db.transaction('rw', db.trips, db.members, db.meta, async () => {
    await db.trips.add({ ...input, id });
    const names = memberNames.length ? memberNames : ['אני'];
    await db.members.bulkAdd(
      names.map((name, i) => ({ id: uid(), tripId: id, name, order: i, color: MEMBER_COLORS[i % MEMBER_COLORS.length] })),
    );
    await setMeta('activeTripId', id);
  });
  return id;
}

export async function deleteTrip(id: string) {
  await db.transaction('rw', [db.trips, db.members, db.expenses, db.settlements, db.visaStays, db.meta], async () => {
    await Promise.all([
      db.trips.delete(id),
      db.members.where('tripId').equals(id).delete(),
      db.expenses.where('tripId').equals(id).delete(),
      db.settlements.where('tripId').equals(id).delete(),
      db.visaStays.where('tripId').equals(id).delete(),
    ]);
    const next = await db.trips.toCollection().first();
    await setMeta('activeTripId', next?.id ?? null);
  });
}
