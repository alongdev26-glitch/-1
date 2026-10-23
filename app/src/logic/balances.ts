import type { Expense, Member, Settlement, Transfer } from '../types';

const r2 = (n: number) => Math.round(n * 100) / 100;

/** balance > 0: the group owes the member. balance < 0: the member owes the group. */
export function computeBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[],
): Record<string, number> {
  const cents: Record<string, number> = Object.fromEntries(members.map((m) => [m.id, 0]));
  const add = (id: string, v: number) => {
    if (id in cents) cents[id] += Math.round(v * 100);
  };
  for (const e of expenses) {
    add(e.paidById, e.amountHome);
    for (const s of e.splits) add(s.memberId, -s.share);
  }
  for (const s of settlements) {
    add(s.fromId, s.amountHome);
    add(s.toId, -s.amountHome);
  }
  return Object.fromEntries(Object.entries(cents).map(([id, c]) => [id, c / 100]));
}

/** Greedy: the biggest debtor pays the biggest creditor, until everything is zero. */
export function suggestTransfers(balances: Record<string, number>): Transfer[] {
  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -0.005)
    .map(([id, b]) => ({ id, c: Math.round(-b * 100) }));
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0.005)
    .map(([id, b]) => ({ id, c: Math.round(b * 100) }));
  const out: Transfer[] = [];
  while (debtors.length && creditors.length) {
    debtors.sort((a, b) => b.c - a.c);
    creditors.sort((a, b) => b.c - a.c);
    const d = debtors[0];
    const c = creditors[0];
    const pay = Math.min(d.c, c.c);
    if (pay > 0) out.push({ fromId: d.id, toId: c.id, amount: r2(pay / 100) });
    d.c -= pay;
    c.c -= pay;
    if (d.c <= 0) debtors.shift();
    if (c.c <= 0) creditors.shift();
  }
  return out;
}

export interface MemberTotals {
  paid: number; // what the member paid out of pocket
  share: number; // the member's part in all expenses
}

export function memberTotals(members: Member[], expenses: Expense[]): Record<string, MemberTotals> {
  const out: Record<string, MemberTotals> = Object.fromEntries(members.map((m) => [m.id, { paid: 0, share: 0 }]));
  for (const e of expenses) {
    if (out[e.paidById]) out[e.paidById].paid += e.amountHome;
    for (const s of e.splits) if (out[s.memberId]) out[s.memberId].share += s.share;
  }
  return out;
}
