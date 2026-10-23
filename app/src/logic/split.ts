import type { Split, SplitType } from '../types';

const toAgorot = (n: number) => Math.round(n * 100);
const fromAgorot = (n: number) => n / 100;

/** Splits `total` equally between ids, in whole agorot; leftovers go to the first ids. */
export function splitEvenly(total: number, ids: string[]): Split[] {
  if (ids.length === 0) return [];
  const cents = toAgorot(total);
  const base = Math.floor(cents / ids.length);
  const extra = cents - base * ids.length;
  return ids.map((memberId, i) => ({ memberId, share: fromAgorot(base + (i < extra ? 1 : 0)) }));
}

export interface SplitInput {
  type: SplitType;
  amountHome: number;
  payerId: string;
  allIds: string[];
  selectedIds?: string[];
  exact?: Record<string, number>;
}

export function computeSplits(input: SplitInput): Split[] {
  const { type, amountHome, payerId, allIds, selectedIds, exact } = input;
  switch (type) {
    case 'personal':
      return [{ memberId: payerId, share: amountHome }];
    case 'equal':
      return splitEvenly(amountHome, allIds);
    case 'selected':
      return splitEvenly(amountHome, (selectedIds ?? []).filter((id) => allIds.includes(id)));
    case 'exact':
      return allIds
        .map((memberId) => ({ memberId, share: exact?.[memberId] ?? 0 }))
        .filter((s) => s.share > 0);
  }
}

/** Difference between the total and the exact amounts entered (0 means they match). */
export function exactRemainder(amountHome: number, exact: Record<string, number>): number {
  const sum = Object.values(exact).reduce((a, b) => a + toAgorot(b), 0);
  return fromAgorot(toAgorot(amountHome) - sum);
}
