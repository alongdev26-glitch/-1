import { useMemo, useState } from 'react';
import { CATEGORIES, categoryById } from '../data/categories';
import { useApp } from '../ctx';
import { sumHome, tripStats } from '../logic/budget';
import { formatDayTitle } from '../logic/dates';
import { csvCell, downloadFile, money } from '../ui/format';
import { Chip, Empty } from '../ui/kit';
import { Icon } from '../ui/icons';
import { ExpenseRow } from './Home';

type Filter = 'all' | 'today' | string;

export function exportCsv(app: ReturnType<typeof useApp>) {
  const { trip, expenses, members } = app;
  const rows = [['תאריך', 'שעה', 'קטגוריה', 'תיאור', 'סכום', 'מטבע', 'שער', 'סכום בשקלים', 'שילם', 'חלוקה']];
  for (const e of [...expenses].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))) {
    rows.push([
      e.date, e.time, categoryById(e.categoryId).name, e.note, String(e.amount), e.currency, String(e.rateToHome), e.amountHome.toFixed(2),
      members.find((m) => m.id === e.paidById)?.name ?? '', e.splits.map((s) => `${members.find((m) => m.id === s.memberId)?.name}:${s.share.toFixed(2)}`).join(' | '),
    ]);
  }
  // BOM so Excel opens the Hebrew correctly
  downloadFile(`${trip.name}.csv`, '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
}

export function Expenses({ onOpenExpense }: { onOpenExpense: (id: string) => void }) {
  const app = useApp();
  const { trip, expenses, now } = app;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const s = tripStats(trip, expenses, now);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = expenses
      .filter((e) => (filter === 'all' ? true : filter === 'today' ? e.date === now : e.categoryId === filter))
      .filter((e) => !term || `${e.note} ${categoryById(e.categoryId).name} ${app.members.find((m) => m.id === e.paidById)?.name}`.toLowerCase().includes(term))
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    const map = new Map<string, typeof list>();
    for (const e of list) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return [...map.entries()];
  }, [expenses, q, filter, now, app.members]);

  return (
    <div className="space-y-4">
      <section className="glass p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-mute">סה״כ הוצאות הטיול</div>
            <div className="num text-4xl font-bold">{money(s.total)}</div>
            <div className="num mt-1 text-sm text-mint">ממוצע ליום: {money(s.avgPerDay)}</div>
          </div>
          <button className="btn-soft text-sm" onClick={() => exportCsv(app)} disabled={!expenses.length}>
            <span className="flex items-center gap-2"><Icon name="upload" size={16} />ייצוא לאקסל</span>
          </button>
        </div>
      </section>

      <div className="relative"><Icon name="search" size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-mute" /><input className="field ps-11" placeholder="חפש הוצאה, מקום, חבר קבוצה..." value={q} onChange={(e) => setQ(e.target.value)} /></div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>הכל {expenses.length}</Chip>
        <Chip active={filter === 'today'} onClick={() => setFilter('today')}>היום</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
            <span className="flex items-center gap-1.5"><Icon name={c.icon} size={15} />{c.name}</span>
          </Chip>
        ))}
      </div>

      {groups.length === 0 && <Empty icon="receipt" text={expenses.length ? 'לא נמצאו הוצאות' : 'עוד אין הוצאות בטיול'} />}
      {groups.map(([date, list]) => (
        <section key={date} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{formatDayTitle(date, now)}</span>
            <span className="num pill px-3 py-0.5 text-xs text-mint">סה״כ ליום: {money(sumHome(list))}</span>
          </div>
          {list.map((e) => (
            <ExpenseRow key={e.id} id={e.id} onOpen={onOpenExpense} />
          ))}
        </section>
      ))}
    </div>
  );
}
