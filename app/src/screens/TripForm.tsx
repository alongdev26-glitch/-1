import { useState } from 'react';
import { CURRENCIES } from '../data/currencies';
import { createTrip, db } from '../db';
import { addDays, today } from '../logic/dates';
import type { Trip } from '../types';
import { Icon } from '../ui/icons';
import { Chip, Field } from '../ui/kit';

interface Props {
  initial?: Trip;
  onDone: () => void;
  onCancel?: () => void;
}

export function TripForm({ initial, onDone, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [start, setStart] = useState(initial?.startDate ?? today());
  const [end, setEnd] = useState(initial?.endDate ?? addDays(today(), 29));
  const [budget, setBudget] = useState(String(initial?.dailyBudget ?? 300));
  const [currencies, setCurrencies] = useState<string[]>(initial?.currencies ?? ['THB']);
  const [names, setNames] = useState<string[]>(['אני', '']);

  const toggle = (c: string) => setCurrencies((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  const valid = name.trim() && Number(budget) > 0 && end >= start && currencies.length > 0;

  async function save() {
    const data = {
      name: name.trim(),
      startDate: start,
      endDate: end,
      homeCurrency: 'ILS',
      dailyBudget: Number(budget),
      currencies,
    };
    if (initial) await db.trips.update(initial.id, data);
    else await createTrip(data, names.map((n) => n.trim()).filter(Boolean));
    onDone();
  }

  return (
    <div className="space-y-4">
      <Field label="שם הטיול">
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="תאילנד וויאטנם 2025" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="תאריך התחלה">
          <input className="field" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="תאריך סיום">
          <input className="field" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      <Field label="תקציב יומי (₪)">
        <input className="field num" dir="ltr" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} />
      </Field>
      <div>
        <span className="mb-2 block text-xs text-mute">מטבעות בטיול (בנוסף לשקל)</span>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.filter((c) => c.code !== 'ILS').map((c) => (
            <Chip key={c.code} active={currencies.includes(c.code)} onClick={() => toggle(c.code)}>
              {c.symbol} {c.code}
            </Chip>
          ))}
        </div>
      </div>
      {!initial && (
        <div>
          <span className="mb-2 block text-xs text-mute">חברי הקבוצה (שם בלבד, בלי הרשמה)</span>
          <div className="space-y-2">
            {names.map((n, i) => (
              <input
                key={i}
                className="field"
                value={n}
                placeholder={i === 0 ? 'אני' : 'שם חבר/ה'}
                onChange={(e) => setNames((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))}
              />
            ))}
            <button className="btn-soft flex w-full items-center justify-center gap-2 text-sm text-mint" onClick={() => setNames((n) => [...n, ''])}>
              <Icon name="plus" size={16} />הוסף חבר
            </button>
          </div>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button className="btn-primary" disabled={!valid} onClick={save}>
          {initial ? 'שמור שינויים' : 'צא לדרך'}
        </button>
        {onCancel && (
          <button className="btn-soft" onClick={onCancel}>
            ביטול
          </button>
        )}
      </div>
    </div>
  );
}
