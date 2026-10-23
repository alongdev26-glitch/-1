import { describe, expect, it } from 'vitest';
import { computeBalances, suggestTransfers } from './balances';
import { computeSplits, exactRemainder, splitEvenly } from './split';
import { dueAlert, visaStatus } from './visa';
import { byCategory, remainingToday, tripStats } from './budget';
import { addDays, daysBetween } from './dates';
import { invertRates, toHome } from './rates';
import type { Expense, Member, Trip, VisaStay } from '../types';

const members: Member[] = ['a', 'b', 'c'].map((id) => ({ id, tripId: 't', name: id, color: '#fff', order: 0 }));
const trip: Trip = { id: 't', name: 'x', startDate: '2025-03-01', endDate: '2025-03-30', homeCurrency: 'ILS', dailyBudget: 300, currencies: ['THB'] };

function expense(p: Partial<Expense> & Pick<Expense, 'amountHome' | 'paidById'>): Expense {
  return {
    id: Math.random().toString(),
    tripId: 't', amount: p.amountHome, currency: 'ILS', rateToHome: 1, categoryId: 'food', note: '',
    date: '2025-03-12', time: '12:00', splitType: 'equal',
    splits: splitEvenly(p.amountHome, ['a', 'b', 'c']),
    ...p,
  };
}

describe('split', () => {
  it('splits evenly and keeps every agora', () => {
    const s = splitEvenly(100, ['a', 'b', 'c']);
    expect(s.reduce((x, y) => x + y.share, 0)).toBeCloseTo(100, 10);
    expect(s.map((x) => x.share)).toEqual([33.34, 33.33, 33.33]);
  });
  it('personal expense belongs to the payer only', () => {
    expect(computeSplits({ type: 'personal', amountHome: 50, payerId: 'a', allIds: ['a', 'b'] })).toEqual([{ memberId: 'a', share: 50 }]);
  });
  it('selected members only', () => {
    const s = computeSplits({ type: 'selected', amountHome: 90, payerId: 'a', allIds: ['a', 'b', 'c'], selectedIds: ['a', 'b'] });
    expect(s).toEqual([{ memberId: 'a', share: 45 }, { memberId: 'b', share: 45 }]);
  });
  it('reports the remainder of exact amounts', () => {
    expect(exactRemainder(100, { a: 40, b: 30 })).toBe(30);
  });
});

describe('balances', () => {
  it('sums to zero and suggests minimal transfers', () => {
    const ex = [
      expense({ amountHome: 300, paidById: 'a' }), // each owes 100
      expense({ amountHome: 90, paidById: 'b' }), // each owes 30
    ];
    const bal = computeBalances(members, ex, []);
    expect(bal).toEqual({ a: 170, b: -40, c: -130 });
    expect(Object.values(bal).reduce((x, y) => x + y, 0)).toBeCloseTo(0, 10);
    expect(suggestTransfers(bal)).toEqual([
      { fromId: 'c', toId: 'a', amount: 130 },
      { fromId: 'b', toId: 'a', amount: 40 },
    ]);
  });
  it('settlements reduce debts', () => {
    const ex = [expense({ amountHome: 300, paidById: 'a' })];
    const bal = computeBalances(members, ex, [{ id: 's', tripId: 't', fromId: 'b', toId: 'a', amountHome: 100, date: '2025-03-12' }]);
    expect(bal).toEqual({ a: 100, b: 0, c: -100 });
  });
});

describe('visa', () => {
  const stay: VisaStay = { id: 'v', tripId: 't', country: 'תאילנד', entryDate: '2025-03-01', exitDate: null, allowedDays: 30, visaType: '' };
  it('counts the entry day', () => {
    const s = visaStatus(stay, '2025-03-18');
    expect(s.used).toBe(18);
    expect(s.remaining).toBe(12);
    expect(s.lastDay).toBe('2025-03-30');
    expect(s.level).toBe('ok');
  });
  it('goes over after the last day', () => {
    expect(visaStatus(stay, '2025-03-30').remaining).toBe(0);
    expect(visaStatus(stay, '2025-03-31').level).toBe('over');
  });
  it('stops counting after exit', () => {
    expect(visaStatus({ ...stay, exitDate: '2025-03-10' }, '2025-04-20').used).toBe(10);
  });
  it('alerts at 7/3/1 days', () => {
    expect(dueAlert(8, [7, 3, 1])).toBeNull();
    expect(dueAlert(7, [7, 3, 1])).toBe(7);
    expect(dueAlert(1, [7, 3, 1])).toBe(1);
  });
});

describe('budget', () => {
  const ex = [expense({ amountHome: 128, paidById: 'a' }), expense({ amountHome: 100, paidById: 'a', date: '2025-03-11', categoryId: 'lodging' })];
  it('remaining today', () => {
    expect(remainingToday(trip, ex, '2025-03-12')).toBe(172);
  });
  it('stats', () => {
    const s = tripStats(trip, ex, '2025-03-12');
    expect(s.total).toBe(228);
    expect(s.budget).toBe(9000);
    expect(s.rolling).toBe(300 * 12 - 228);
    expect(s.priciest).toEqual({ date: '2025-03-12', total: 128 });
  });
  it('groups by category', () => {
    expect(byCategory(ex).map((c) => c.categoryId)).toEqual(['food', 'lodging']);
  });
});

describe('dates and rates', () => {
  it('date math', () => {
    expect(daysBetween('2025-02-28', '2025-03-01')).toBe(1);
    expect(addDays('2025-03-30', 2)).toBe('2025-04-01');
  });
  it('inverts rates and converts', () => {
    const r = invertRates({ THB: 9.35 });
    expect(r.THB).toBeCloseTo(0.107, 3);
    expect(toHome(350, 0.107)).toBe(37.45);
  });
});
