import { useMemo, useState } from 'react';
import { CATEGORIES } from '../data/categories';
import { currencyInfo } from '../data/currencies';
import { useApp } from '../ctx';
import { db, uid } from '../db';
import { computeSplits, exactRemainder } from '../logic/split';
import { effectiveRate, toHome } from '../logic/rates';
import type { SplitType } from '../types';
import { fmt, fmt2 } from '../ui/format';
import { Chip, Sheet } from '../ui/kit';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export function AddExpense({ onClose }: { onClose: () => void }) {
  const { trip, members, rates, setRate, now } = useApp();
  const home = trip.homeCurrency;
  const currencies = useMemo(() => [...trip.currencies, home], [trip, home]);
  const [raw, setRaw] = useState('');
  const [currency, setCurrency] = useState(currencies[0]);
  const [categoryId, setCategoryId] = useState('food');
  const [note, setNote] = useState('');
  const [payerId, setPayerId] = useState(members[0]?.id ?? '');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selected, setSelected] = useState<string[]>(members.map((m) => m.id));
  const [exact, setExact] = useState<Record<string, number>>({});
  const [sheet, setSheet] = useState<'split' | 'rate' | null>(null);
  const [rateText, setRateText] = useState('');

  const amount = Number(raw) || 0;
  const rate = effectiveRate(rates, currency, home);
  const amountHome = toHome(amount, rate);
  const info = currencyInfo(currency);
  const payer = members.find((m) => m.id === payerId);
  const splits = computeSplits({ type: splitType, amountHome, payerId, allIds: members.map((m) => m.id), selectedIds: selected, exact });
  const exactOk = splitType !== 'exact' || Math.abs(exactRemainder(amountHome, exact)) < 0.01;
  const canSave = amount > 0 && splits.length > 0 && exactOk;

  const press = (k: string) =>
    setRaw((cur) => {
      if (k === '⌫') return cur.slice(0, -1);
      if (k === '.') return cur.includes('.') ? cur : (cur || '0') + '.';
      if (cur.replace('.', '').length >= 10 || /\.\d\d$/.test(cur)) return cur;
      return cur === '0' ? k : cur + k;
    });

  async function save() {
    const d = new Date();
    await db.expenses.add({
      id: uid(),
      tripId: trip.id,
      amount,
      currency,
      rateToHome: rate,
      amountHome,
      categoryId,
      note: note.trim(),
      date: now,
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      paidById: payerId,
      splitType,
      splits,
    });
    onClose();
  }

  const splitLabel =
    splitType === 'personal' ? 'הוצאה אישית' : splitType === 'exact' ? 'סכומים מדויקים' : `חלוקה שווה ל-${splitType === 'selected' ? selected.length : members.length}`;

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col overflow-y-auto bg-bg px-4 pb-4 pt-3" style={{ background: 'var(--color-bg)' }}>
      <div className="mb-2 flex items-center justify-between">
        <button className="pill px-4 py-2 text-sm" onClick={onClose}>
          ✕ סגור
        </button>
        <span className="text-sm text-mute">הוצאה חדשה</span>
      </div>

      <div className="glass mb-3 p-5 text-center">
        <div className="num flex items-baseline justify-center gap-2" dir="ltr">
          <span className="text-xl text-sky">{info.code}</span>
          <span className={`text-5xl font-bold ${raw ? '' : 'text-white/25'}`}>{raw || '0'}</span>
        </div>
        {currency !== home && (
          <button
            className="pill num mx-auto mt-3 flex items-center gap-2 px-4 py-1.5 text-sm text-mute"
            onClick={() => {
              setRateText(String(rate));
              setSheet('rate');
            }}
          >
            <span dir="ltr">
              1 {currency} = ₪{Number(rate.toPrecision(3))}
            </span>
            <span className="text-mint">₪{fmt2(amountHome)} ≈</span>
            <span>✎</span>
          </button>
        )}
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto" dir="rtl">
        {currencies.map((c) => (
          <Chip key={c} active={c === currency} onClick={() => setCurrency(c)}>
            {currencyInfo(c).symbol} {c}
          </Chip>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-6 gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl border py-2 text-[11px] ${categoryId === c.id ? 'border-gold bg-gold/15 text-gold' : 'border-line bg-white/5 text-mute'}`}
          >
            <span className="text-xl">{c.icon}</span>
            {c.name}
          </button>
        ))}
      </div>

      <input className="field mb-3" placeholder="פה תאי ושתייה (אופציונלי)" value={note} onChange={(e) => setNote(e.target.value)} />

      <button className="glass mb-3 flex items-center justify-between p-3 text-start" onClick={() => setSheet('split')}>
        <div>
          <div className="text-sm font-semibold">שולם ע״י: {payer?.name}</div>
          <div className="text-xs text-mint">{splitLabel}</div>
        </div>
        <span className="text-mute">‹</span>
      </button>

      <div className="mb-3 grid grid-cols-3 gap-2" dir="ltr">
        {KEYS.map((k) => (
          <button key={k} onClick={() => press(k)} className="rounded-2xl border border-line bg-white/5 py-3.5 text-2xl font-semibold active:bg-white/15" aria-label={k === '⌫' ? 'מחק' : k}>
            {k}
          </button>
        ))}
      </div>

      <button className="btn-primary mt-auto" disabled={!canSave} onClick={save}>
        שמור הוצאה {amount > 0 && `(${fmt(amount)} ${currency})`}
      </button>

      {sheet === 'rate' && (
        <Sheet title={`שער ${currency} → ₪`} onClose={() => setSheet(null)}>
          <p className="mb-3 text-sm text-mute">שער החלפנייה בפועל שונה לעיתים מהשער הרשמי. השער נשמר עם ההוצאה.</p>
          <input className="field num" dir="ltr" inputMode="decimal" value={rateText} onChange={(e) => setRateText(e.target.value)} />
          <div className="mt-4 flex gap-3">
            <button
              className="btn-primary"
              onClick={async () => {
                await setRate(currency, Number(rateText) || null);
                setSheet(null);
              }}
            >
              שמור שער
            </button>
            <button
              className="btn-soft shrink-0"
              onClick={async () => {
                await setRate(currency, null);
                setSheet(null);
              }}
            >
              איפוס
            </button>
          </div>
        </Sheet>
      )}

      {sheet === 'split' && (
        <Sheet title="מי שילם ואיך מחלקים" onClose={() => setSheet(null)}>
          <span className="mb-2 block text-xs text-mute">שולם ע״י</span>
          <div className="mb-4 flex flex-wrap gap-2">
            {members.map((m) => (
              <Chip key={m.id} active={m.id === payerId} onClick={() => setPayerId(m.id)}>
                {m.name}
              </Chip>
            ))}
          </div>
          <span className="mb-2 block text-xs text-mute">חלוקה</span>
          <div className="mb-4 flex flex-wrap gap-2">
            <Chip active={splitType === 'equal'} onClick={() => setSplitType('equal')}>שווה לכולם</Chip>
            <Chip active={splitType === 'selected'} onClick={() => setSplitType('selected')}>נבחרים</Chip>
            <Chip active={splitType === 'exact'} onClick={() => setSplitType('exact')}>סכומים</Chip>
            <Chip active={splitType === 'personal'} onClick={() => setSplitType('personal')}>אישי</Chip>
          </div>
          {splitType === 'selected' && (
            <div className="mb-4 flex flex-wrap gap-2">
              {members.map((m) => (
                <Chip key={m.id} active={selected.includes(m.id)} onClick={() => setSelected((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))}>
                  {m.name}
                </Chip>
              ))}
            </div>
          )}
          {splitType === 'exact' && (
            <div className="mb-4 space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="w-20 text-sm">{m.name}</span>
                  <input
                    className="field num"
                    dir="ltr"
                    inputMode="decimal"
                    placeholder="₪0"
                    value={exact[m.id] ?? ''}
                    onChange={(e) => setExact((x) => ({ ...x, [m.id]: Number(e.target.value) || 0 }))}
                  />
                </div>
              ))}
              <p className={`text-xs ${exactOk ? 'text-mint' : 'text-rose'}`}>
                {exactOk ? 'הסכומים תואמים ✓' : `חסר ₪${fmt2(exactRemainder(amountHome, exact))} מתוך ₪${fmt2(amountHome)}`}
              </p>
            </div>
          )}
          <button className="btn-primary" onClick={() => setSheet(null)}>
            סיום
          </button>
        </Sheet>
      )}
    </div>
  );
}
