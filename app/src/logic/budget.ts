import type { Expense, ISODate, Trip } from '../types';
import { daysBetween, addDays } from './dates';

export const sumHome = (list: Expense[]) => list.reduce((a, e) => a + e.amountHome, 0);

export const spentOn = (expenses: Expense[], date: ISODate) => sumHome(expenses.filter((e) => e.date === date));

/** Daily budget minus what was spent today (home currency). Negative = over budget. */
export function remainingToday(trip: Trip, expenses: Expense[], now: ISODate): number {
  return trip.dailyBudget - spentOn(expenses, now);
}

export function tripLength(trip: Trip): number {
  return Math.max(1, daysBetween(trip.startDate, trip.endDate) + 1);
}

/** Day number in the trip, clamped to 1..length. */
export function tripDay(trip: Trip, now: ISODate): number {
  return Math.min(tripLength(trip), Math.max(1, daysBetween(trip.startDate, now) + 1));
}

export interface TripStats {
  total: number;
  budget: number;
  usedPercent: number;
  daysLeft: number;
  leftBudget: number;
  rolling: number; // cumulative budget so far minus spend. positive = saved
  avgPerDay: number;
  priciest: { date: ISODate; total: number } | null;
}

export function tripStats(trip: Trip, expenses: Expense[], now: ISODate): TripStats {
  const total = sumHome(expenses);
  const length = tripLength(trip);
  const day = tripDay(trip, now);
  const budget = trip.dailyBudget * length;
  const byDay = new Map<ISODate, number>();
  for (const e of expenses) byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amountHome);
  let priciest: TripStats['priciest'] = null;
  for (const [date, t] of byDay) if (!priciest || t > priciest.total) priciest = { date, total: t };
  return {
    total,
    budget,
    usedPercent: budget ? (total / budget) * 100 : 0,
    daysLeft: Math.max(0, length - day),
    leftBudget: budget - total,
    rolling: trip.dailyBudget * day - total,
    avgPerDay: total / day,
    priciest,
  };
}

export function lastDays(expenses: Expense[], now: ISODate, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(now, i - (n - 1));
    return { date, total: spentOn(expenses, date) };
  });
}

export function byCategory(expenses: Expense[]) {
  const map = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const cur = map.get(e.categoryId) ?? { total: 0, count: 0 };
    cur.total += e.amountHome;
    cur.count += 1;
    map.set(e.categoryId, cur);
  }
  const total = sumHome(expenses) || 1;
  return [...map.entries()]
    .map(([categoryId, v]) => ({ categoryId, ...v, percent: (v.total / total) * 100 }))
    .sort((a, b) => b.total - a.total);
}

/** Totals per original currency, with the home equivalent. */
export function byCurrency(expenses: Expense[]) {
  const map = new Map<string, { amount: number; home: number }>();
  for (const e of expenses) {
    const cur = map.get(e.currency) ?? { amount: 0, home: 0 };
    cur.amount += e.amount;
    cur.home += e.amountHome;
    map.set(e.currency, cur);
  }
  return [...map.entries()].map(([currency, v]) => ({ currency, ...v })).sort((a, b) => b.home - a.home);
}
