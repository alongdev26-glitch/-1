import { useState } from 'react';
import defaults from '../data/visa-defaults.json';
import { CURRENCIES } from '../data/currencies';
import { createTrip, db, uid } from '../db';
import { addDays, formatShort, today } from '../logic/dates';
import { Chip } from '../ui/kit';
import { Icon } from '../ui/icons';

const STEPS = 7;

/** First-run questionnaire: one question per screen. */
export function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(addDays(today(), 29));
  const [budget, setBudget] = useState('300');
  const [currencies, setCurrencies] = useState<string[]>(['THB']);
  const [names, setNames] = useState<string[]>(['אני', '']);
  const [country, setCountry] = useState<string | null>(null);
  const [entry, setEntry] = useState(today());
  const [busy, setBusy] = useState(false);

  const members = names.map((n) => n.trim()).filter(Boolean);
  const preset = defaults.countries.find((c) => c.country === country);

  const valid = [
    name.trim().length > 0,
    !!start && !!end && end >= start,
    Number(budget) > 0,
    currencies.length > 0,
    members.length > 0,
    true,
    true,
  ][step];

  const toggle = (c: string) => setCurrencies((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  async function finish() {
    setBusy(true);
    const tripId = await createTrip(
      { name: name.trim(), startDate: start, endDate: end, homeCurrency: 'ILS', dailyBudget: Number(budget), currencies },
      members,
    );
    if (preset) {
      await db.visaStays.add({
        id: uid(), tripId, country: preset.country, entryDate: entry, exitDate: null, allowedDays: preset.allowedDays, visaType: preset.visaType,
      });
    }
  }

  const next = () => (step === STEPS - 1 ? finish() : setStep(step + 1));

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-6 pt-5">
      <div className="mb-8 flex items-center gap-3">
        <button
          className={`pill grid h-10 w-10 place-items-center ${step === 0 ? 'invisible' : ''}`}
          onClick={() => setStep(step - 1)}
          aria-label="חזרה"
        >
          <Icon name="forward" size={18} />
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-mint transition-all duration-300" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
        </div>
        <span className="num w-8 text-end text-xs text-mute">{step + 1}/{STEPS}</span>
      </div>

      <div key={step} className="rise flex-1">
        {step === 0 && (
          <Q icon="compass" title="איך קוראים לטיול?" hint="שם קצר שתזהה בקלות. אפשר לשנות אחר כך.">
            <input autoFocus id="trip-name" className="field text-lg" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: תאילנד וויאטנם" onKeyDown={(e) => e.key === 'Enter' && valid && next()} />
          </Q>
        )}
        {step === 1 && (
          <Q icon="passport" title="מתי יוצאים וחוזרים?" hint="לפי התאריכים נחשב כמה ימים נשארו ומה התקציב הכולל.">
            <div className="space-y-3">
              <label className="block"><span className="mb-1 block text-xs text-mute">יציאה</span><input id="trip-start" className="field" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
              <label className="block"><span className="mb-1 block text-xs text-mute">חזרה</span><input id="trip-end" className="field" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></label>
            </div>
          </Q>
        )}
        {step === 2 && (
          <Q icon="wallet" title="כמה אפשר להוציא ביום?" hint="תקציב יומי בשקלים לכל הקבוצה. זה המספר שיוצג כ״נשאר להיום״.">
            <div className="glass flex items-center justify-center gap-3 p-6" dir="ltr">
              <span className="text-3xl text-mint">₪</span>
              <input id="trip-budget" className="num w-40 bg-transparent text-center text-6xl font-bold outline-none" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
          </Q>
        )}
        {step === 3 && (
          <Q icon="coins" title="באילו מטבעות תשלמו?" hint="נמיר אוטומטית לשקל לפי שער עדכני. אפשר לבחור כמה.">
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.filter((c) => c.code !== 'ILS').map((c) => (
                <Chip key={c.code} active={currencies.includes(c.code)} onClick={() => toggle(c.code)}>
                  {c.symbol} {c.code}
                </Chip>
              ))}
            </div>
          </Q>
        )}
        {step === 4 && (
          <Q icon="users" title="מי נוסע?" hint="שמות בלבד, בלי הרשמה. הראשון הוא אתה.">
            <div className="space-y-2">
              {names.map((n, i) => (
                <input key={i} id={`member-${i}`} className="field" value={n} placeholder={i === 0 ? 'השם שלך' : 'שם חבר/ה'} onChange={(e) => setNames((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))} />
              ))}
              <button className="btn-soft flex w-full items-center justify-center gap-2 text-sm text-mint" onClick={() => setNames((n) => [...n, ''])}>
                <Icon name="plus" size={16} />הוסף חבר
              </button>
            </div>
          </Q>
        )}
        {step === 5 && (
          <Q icon="globe" title="לאן נכנסים קודם?" hint="נספור לך את ימי הוויזה. אפשר לדלג ולהוסיף מאוחר יותר.">
            <div className="grid grid-cols-2 gap-2">
              {defaults.countries.map((c) => (
                <button key={c.country} onClick={() => setCountry(country === c.country ? null : c.country)} className={`rounded-2xl border px-3 py-3 text-start text-sm ${country === c.country ? 'border-mint/70 bg-mint/15 text-mint' : 'border-line bg-white/5'}`}>
                  <div className="font-semibold">{c.country}</div>
                  <div className="text-xs text-mute">{c.allowedDays} ימים</div>
                </button>
              ))}
            </div>
            {preset && (
              <label className="mt-4 block"><span className="mb-1 block text-xs text-mute">תאריך כניסה</span><input id="visa-entry" className="field" type="date" value={entry} onChange={(e) => setEntry(e.target.value)} /></label>
            )}
            <p className="mt-3 text-xs text-mute">הימים המוצעים הם ברירת מחדל. יש לאמת תמיד באתר הרשמי של המדינה.</p>
          </Q>
        )}
        {step === 6 && (
          <Q icon="check" title="הכל מוכן" hint="אפשר לשנות כל פרט אחר כך.">
            <dl className="glass divide-y divide-line text-sm">
              {[
                ['טיול', name.trim()],
                ['תאריכים', `${formatShort(start)} – ${formatShort(end)}`],
                ['תקציב יומי', `₪${budget}`],
                ['מטבעות', currencies.join(', ')],
                ['חברים', members.join(', ')],
                ['ויזה', preset ? `${preset.country}, ${preset.allowedDays} ימים` : 'לא הוגדרה'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-mute">{k}</dt><dd className="text-end font-medium">{v}</dd></div>
              ))}
            </dl>
          </Q>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {step === 5 && (
          <button className="btn-soft shrink-0" onClick={() => { setCountry(null); setStep(step + 1); }}>דלג</button>
        )}
        <button className="btn-primary" disabled={!valid || busy} onClick={next}>
          {step === STEPS - 1 ? 'צא לדרך' : 'הבא'}
        </button>
      </div>
    </div>
  );
}

function Q({ icon, title, hint, children }: { icon: Parameters<typeof Icon>[0]['name']; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-mint/40 bg-mint/10 text-mint">
        <Icon name={icon} size={28} />
      </div>
      <h1 className="text-3xl font-bold leading-tight">{title}</h1>
      <p className="mb-6 mt-2 text-sm text-mute">{hint}</p>
      {children}
    </section>
  );
}
