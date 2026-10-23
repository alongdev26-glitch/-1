import { categoryById } from '../data/categories';
import { currencyInfo } from '../data/currencies';
import { useApp } from '../ctx';
import { byCategory, byCurrency, tripStats } from '../logic/budget';
import { formatShort } from '../logic/dates';
import { amountIn, money } from '../ui/format';
import { Icon, IconBadge } from '../ui/icons';
import { exportCsv } from './Expenses';

export function Summary({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const { trip, expenses, now, rates } = app;
  const s = tripStats(trip, expenses, now);
  const cats = byCategory(expenses);
  const curs = byCurrency(expenses);

  async function share() {
    const text = [
      `סיכום ${trip.name}`,
      `סה״כ הוצאות: ${money(s.total)} מתוך ${money(s.budget)}`,
      `ממוצע יומי: ${money(s.avgPerDay)} (יעד ${money(trip.dailyBudget)})`,
      s.priciest ? `היום הכי יקר: ${formatShort(s.priciest.date)} (${money(s.priciest.total)})` : '',
      ...cats.map((c) => `${categoryById(c.categoryId).name}: ${money(c.total)} (${Math.round(c.percent)}%)`),
      'נוצר ב"קופת טיול"',
    ].filter(Boolean).join('\n');
    if (navigator.share) await navigator.share({ text }).catch(() => {});
    else await navigator.clipboard?.writeText(text);
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-md overflow-y-auto px-4 pb-10 pt-3" style={{ background: 'var(--color-bg)' }}>
      <div className="mb-3 flex items-center justify-between">
        <button className="pill flex items-center gap-1 px-4 py-2 text-sm" onClick={onClose}><Icon name="forward" size={16} />חזרה</button>
        <h1 className="font-bold">סיכום הטיול</h1>
      </div>
      <div className="space-y-4">
        <section className="glass p-5">
          <div className="text-xs text-mute">סה״כ הוצאות</div>
          <div className="num text-4xl font-bold">{money(s.total)}</div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-mute">ממוצע יומי</div><div className="num font-bold">{money(s.avgPerDay)}</div></div>
            <div><div className="text-mute">היום הכי יקר</div><div className="num font-bold text-warn">{s.priciest ? `${money(s.priciest.total)} · ${formatShort(s.priciest.date).slice(0, 5)}` : '—'}</div></div>
          </div>
        </section>

        <section className="glass p-5">
          <h2 className="font-semibold">פילוח הוצאות לפי קטגוריה</h2>
          <div className="my-3 flex h-3 overflow-hidden rounded-full bg-white/10">
            {cats.map((c) => <div key={c.categoryId} style={{ width: `${c.percent}%`, background: categoryById(c.categoryId).color }} />)}
          </div>
          {cats.length === 0 && <p className="text-sm text-mute">אין נתונים עדיין</p>}
          <div className="space-y-3">
            {cats.map((c) => {
              const cat = categoryById(c.categoryId);
              return (
                <div key={c.categoryId} className="flex items-center gap-3">
                  <IconBadge name={cat.icon} size={40} />
                  <div className="flex-1">
                    <div className="font-medium">{cat.name}</div>
                    <div className="text-xs text-mute">{Math.round(c.percent)}% מכל ההוצאות · {c.count} הוצאות</div>
                  </div>
                  <div className="num font-bold">{money(c.total)}</div>
                </div>
              );
            })}
          </div>
        </section>

        {curs.length > 0 && (
          <section className="glass p-5">
            <h2 className="mb-3 font-semibold">מטבעות מקוריים בשטח</h2>
            <div className="space-y-3">
              {curs.map((c) => (
                <div key={c.currency} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{currencyInfo(c.currency).name} ({c.currency})</div>
                    <div className="num text-xs text-mute">שער {Number((rates.manual[c.currency] ?? rates.rates[c.currency] ?? 1).toPrecision(3))}</div>
                  </div>
                  <div className="text-end">
                    <div className="num font-bold">{amountIn(c.amount, c.currency)}</div>
                    <div className="num text-xs text-mute">{money(c.home)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <button className="btn-primary" onClick={share}><span className="flex items-center justify-center gap-2"><Icon name="upload" size={18} />שתף סיכום עם הקבוצה</span></button>
        <button className="btn-soft w-full" onClick={() => exportCsv(app)} disabled={!expenses.length}>ייצוא לאקסל (CSV)</button>
      </div>
    </div>
  );
}
