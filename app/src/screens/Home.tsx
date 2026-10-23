import { categoryById } from '../data/categories';
import { currencyInfo } from '../data/currencies';
import { useApp } from '../ctx';
import { lastDays, remainingToday, spentOn, tripStats } from '../logic/budget';
import { weekdayShort } from '../logic/dates';
import { amountIn, money } from '../ui/format';
import { Bar } from '../ui/kit';

export function ExpenseRow({ id, onOpen }: { id: string; onOpen?: (id: string) => void }) {
  const { expenses, members, trip } = useApp();
  const e = expenses.find((x) => x.id === id);
  if (!e) return null;
  const cat = categoryById(e.categoryId);
  const payer = members.find((m) => m.id === e.paidById);
  return (
    <button className="glass flex w-full items-center gap-3 p-3 text-start" onClick={() => onOpen?.(id)}>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl" style={{ background: cat.color + '26' }}>
        {cat.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{e.note || cat.name}</div>
        <div className="text-xs text-mute">
          {cat.name} · {e.time} · שולם ע״י {payer?.name ?? '—'}
        </div>
      </div>
      <div className="text-end">
        <div className="num text-lg font-bold">{money(e.amountHome)}</div>
        {e.currency !== trip.homeCurrency && <div className="num text-xs text-mute">{amountIn(e.amount, e.currency)} {e.currency}</div>}
      </div>
    </button>
  );
}

export function Home({ onSummary, onOpenExpense }: { onSummary: () => void; onOpenExpense: (id: string) => void }) {
  const { trip, expenses, now, rates } = useApp();
  const left = remainingToday(trip, expenses, now);
  const spent = spentOn(expenses, now);
  const s = tripStats(trip, expenses, now);
  const week = lastDays(expenses, now, 7);
  const max = Math.max(trip.dailyBudget * 1.3, ...week.map((d) => d.total));
  const recent = [...expenses].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 3);
  const over = left < 0;

  return (
    <div className="space-y-4">
      <section className="glass p-6 text-center">
        <div className="text-sm text-mute">נשאר להיום</div>
        <div className={`num my-1 text-6xl font-bold ${over ? 'text-rose' : 'text-white'}`}>{money(left)}</div>
        <div className="text-xs text-mute">
          {over ? 'חרגת מהתקציב היומי' : `מתוך ${money(trip.dailyBudget)} · הוצאת היום ${money(spent)}`}
        </div>
        <Bar className="mt-4" value={(spent / trip.dailyBudget) * 100} color={over ? 'var(--color-rose)' : 'var(--color-mint)'} />
      </section>

      <section className="glass p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-mute">סה״כ הוצאות עד כה</span>
          <span className="text-xs text-mute">נותרו {s.daysLeft} ימים</span>
        </div>
        <div className="num text-3xl font-bold">
          {money(s.total)} <span className="text-base font-normal text-mute">/ {money(s.budget)}</span>
        </div>
        <Bar className="mt-3" value={s.usedPercent} color="linear-gradient(90deg,var(--color-mint),var(--color-sky))" />
        <div className="mt-2 flex justify-between text-xs">
          <span className={s.rolling >= 0 ? 'text-mint' : 'text-rose'}>
            {s.rolling >= 0 ? `חסכון מצטבר ${money(s.rolling)}` : `חריגה מצטברת ${money(-s.rolling)}`}
          </span>
          <span className="text-mute">נוצל {s.usedPercent.toFixed(1)}%</span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4">
          <div className="text-xs text-mute">ממוצע יומי</div>
          <div className="num text-2xl font-bold">{money(s.avgPerDay)}</div>
          <div className={`text-xs ${s.avgPerDay <= trip.dailyBudget ? 'text-mint' : 'text-rose'}`}>יעד: {money(trip.dailyBudget)}</div>
        </div>
        <div className="glass p-4">
          <div className="text-xs text-mute">היום הכי יקר</div>
          <div className="num text-2xl font-bold text-gold">{s.priciest ? money(s.priciest.total) : '—'}</div>
          <div className="text-xs text-mute">{s.priciest ? s.priciest.date.split('-').reverse().slice(0, 2).join('/') : 'אין עדיין'}</div>
        </div>
      </div>

      <section className="glass p-5">
        <div className="mb-3 text-sm font-semibold">7 ימים אחרונים</div>
        <div className="relative flex h-36 items-end justify-between gap-2" dir="rtl">
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-mint/50" style={{ bottom: `${(trip.dailyBudget / max) * 100}%` }} />
          {[...week].reverse().map((d, i) => (
            <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div
                className="w-full max-w-7 rounded-t-lg"
                style={{
                  height: `${Math.max(2, (d.total / max) * 100)}%`,
                  background: d.total > trip.dailyBudget ? 'var(--color-gold)' : i === 0 ? 'var(--color-mint)' : 'var(--color-sky)',
                  opacity: d.total ? 1 : 0.25,
                }}
                title={money(d.total)}
              />
              <span className={`text-[11px] ${i === 0 ? 'text-white' : 'text-mute'}`}>{i === 0 ? 'היום' : weekdayShort(d.date)}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 text-end text-[10px] text-mint">יעד {money(trip.dailyBudget)}</div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">הוצאות אחרונות</h2>
          <button className="text-sm text-sky" onClick={onSummary}>
            סיכום מלא ›
          </button>
        </div>
        {recent.length ? recent.map((e) => <ExpenseRow key={e.id} id={e.id} onOpen={onOpenExpense} />) : <div className="glass p-6 text-center text-mute">עוד אין הוצאות. לחץ על + כדי להוסיף הוצאה ראשונה.</div>}
      </section>

      <p className="text-center text-xs text-mute">
        {rates.fetchedAt ? `שערים עודכנו ${new Date(rates.fetchedAt).toLocaleDateString('he-IL')}` : 'שערים משוערים (עדיין לא עודכנו)'} ·{' '}
        {trip.currencies.map((c) => currencyInfo(c).symbol).join(' ')}
      </p>
    </div>
  );
}
