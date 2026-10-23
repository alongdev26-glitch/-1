import { useEffect, useState } from 'react';
import defaults from '../data/visa-defaults.json';
import { useApp } from '../ctx';
import { db, getMeta, setMeta, uid } from '../db';
import { formatShort, today } from '../logic/dates';
import { ALERT_DAYS, dueAlert, visaStatus } from '../logic/visa';
import type { VisaStay } from '../types';
import { Bar, Field, Sheet } from '../ui/kit';

const LEVEL_COLOR = { ok: 'var(--color-mint)', warn: 'var(--color-gold)', danger: 'var(--color-rose)', over: 'var(--color-rose)' } as const;
const LEVEL_TEXT = { ok: 'בטוח', warn: 'מתקרב לסוף', danger: 'דחוף!', over: 'חריגה מהימים המותרים' } as const;

/** Fires at most one notification per stay, per threshold. */
export async function checkVisaNotifications(stays: VisaStay[], now: string) {
  const enabled = await getMeta<number[]>('visaAlerts', [7, 3, 1]);
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const sent = await getMeta<Record<string, number>>('visaAlertsSent', {});
  for (const stay of stays) {
    const st = visaStatus(stay, now);
    if (!st.active) continue;
    const hit = dueAlert(st.remaining, enabled);
    const key = `${stay.id}`;
    if (hit === null || sent[key] === hit) continue;
    sent[key] = hit;
    const body = st.remaining === 0 ? `היום היום האחרון שלך ב${stay.country}` : `נשארו ${st.remaining} ימים ב${stay.country}. בדוק את החוק העדכני באתר הרשמי.`;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification('קופת טיול · ויזה', { body, tag: key, lang: 'he', dir: 'rtl' });
    else new Notification('קופת טיול · ויזה', { body });
  }
  await setMeta('visaAlertsSent', sent);
}

export function Visa() {
  const { trip, visaStays, now } = useApp();
  const [adding, setAdding] = useState(false);
  const [alerts, setAlerts] = useState<number[]>([7, 3, 1]);
  const [perm, setPerm] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

  useEffect(() => {
    getMeta<number[]>('visaAlerts', [7, 3, 1]).then(setAlerts);
  }, []);

  async function toggleAlert(d: number) {
    const next = alerts.includes(d) ? alerts.filter((x) => x !== d) : [...alerts, d];
    setAlerts(next);
    await setMeta('visaAlerts', next);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') setPerm(await Notification.requestPermission());
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">🛂 מעקב ימי שהייה וויזה</h1>
        <p className="mt-1 text-sm text-mute">ניהול ימי ויזה והגבלות שהייה, כדי להימנע משהייה יתר (Overstay) וקנסות מיותרים.</p>
      </div>

      {visaStays.length === 0 && <div className="glass p-8 text-center text-mute"><div className="mb-2 text-4xl">🛂</div>עוד לא הוספת מדינה למסלול</div>}

      {[...visaStays].sort((a, b) => b.entryDate.localeCompare(a.entryDate)).map((stay) => {
        const st = visaStatus(stay, now);
        const flag = defaults.countries.find((c) => c.country === stay.country)?.flag ?? '🌍';
        const color = LEVEL_COLOR[st.level];
        return (
          <section key={stay.id} className="glass space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-3xl">{flag}</div>
                <div>
                  <div className="text-xl font-bold">{stay.country}</div>
                  <div className="text-xs text-mute">{stay.visaType}</div>
                </div>
              </div>
              <span className="pill px-3 py-1 text-xs" style={{ color }}>{st.active ? 'שהייה נוכחית' : 'הסתיימה'}</span>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs text-mute">זמן שנותר בחותמת</div>
                  <div className="num text-3xl font-bold" style={{ color }}>
                    {st.remaining >= 0 ? `${st.remaining} ימים נשארו` : `חריגה של ${-st.remaining} ימים`}
                  </div>
                  <div className="text-xs text-mute">מתוך {st.allowed} ימים מותרים (עברו {Math.max(0, st.used)})</div>
                </div>
                <div className="num text-lg font-bold" style={{ color }}>{st.percentLeft}%</div>
              </div>
              <Bar className="mt-3" value={st.percentLeft} color={color} />
              <div className="mt-2 flex justify-between text-xs text-mute">
                <span>כניסה: {formatShort(stay.entryDate)}</span>
                <span>יום אחרון: {formatShort(st.lastDay)}</span>
              </div>
            </div>
            <div className="rounded-2xl p-3 text-sm" style={{ background: color + '1f', color }}>
              סטטוס: {LEVEL_TEXT[st.level]}
              {st.level === 'ok' && ' · הכל לפי התוכנית'}
            </div>
            <div className="flex gap-2">
              {st.active && <button className="btn-soft flex-1 text-sm" onClick={() => db.visaStays.update(stay.id, { exitDate: today() })}>יצאתי מהמדינה</button>}
              <button className="btn-soft text-sm text-rose" onClick={() => confirm(`למחוק את ${stay.country}?`) && db.visaStays.delete(stay.id)}>מחק</button>
            </div>
          </section>
        );
      })}

      <section className="glass p-5">
        <h2 className="mb-1 font-semibold">🔔 תזכורות תפוגת ויזה</h2>
        <p className="mb-3 text-xs text-mute">
          {perm === 'granted' ? 'ההתראות פעילות במכשיר הזה.' : perm === 'denied' ? 'ההתראות חסומות בדפדפן. אפשר להפעיל אותן בהגדרות האתר.' : perm === 'unsupported' ? 'הדפדפן לא תומך בהתראות.' : 'בחירת תזכורת תבקש אישור להתראות.'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ALERT_DAYS.map((d) => (
            <button key={d} onClick={() => toggleAlert(d)} className={`rounded-2xl border py-3 text-sm ${alerts.includes(d) ? 'border-sky bg-sky/20 text-sky' : 'border-line bg-white/5 text-mute'}`}>
              🔔<br />{d === 1 ? 'יום לפני' : `${d} ימים לפני`}
            </button>
          ))}
        </div>
      </section>

      <button className="btn-soft w-full" onClick={() => setAdding(true)}>⊕ הוסף מדינה / כניסה חדשה למסלול</button>

      <div className="glass border-gold/30! p-4 text-sm">
        <div className="mb-1 font-bold text-gold">הבהרה משפטית חשובה למטייל</div>
        <p className="text-mute">חוקי ויזה והגבלות משתנים מעת לעת. יש לוודא תמיד את התנאים העדכניים באתר השגרירות הרשמי של המדינה ובחומת הדרכון בפועל. האפליקציה אינה מהווה תחליף לבדיקה רשמית מול פקיד ביקורת הגבולות.</p>
      </div>

      {adding && <AddStay tripId={trip.id} onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddStay({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const [country, setCountry] = useState(defaults.countries[0].country);
  const [custom, setCustom] = useState('');
  const [entry, setEntry] = useState(today());
  const preset = defaults.countries.find((c) => c.country === country);
  const [days, setDays] = useState(String(preset?.allowedDays ?? 30));
  const [type, setType] = useState(preset?.visaType ?? '');
  const isCustom = country === '__custom';
  const name = isCustom ? custom.trim() : country;

  function pick(v: string) {
    setCountry(v);
    const p = defaults.countries.find((c) => c.country === v);
    if (p) { setDays(String(p.allowedDays)); setType(p.visaType); }
  }

  return (
    <Sheet title="מדינה חדשה במסלול" onClose={onClose}>
      <div className="space-y-3">
        <Field label="מדינה">
          <select className="field" value={country} onChange={(e) => pick(e.target.value)}>
            {defaults.countries.map((c) => <option key={c.country} value={c.country} className="text-black">{c.flag} {c.country}</option>)}
            <option value="__custom" className="text-black">אחר...</option>
          </select>
        </Field>
        {isCustom && <input className="field" placeholder="שם המדינה" value={custom} onChange={(e) => setCustom(e.target.value)} />}
        <Field label="תאריך כניסה"><input className="field" type="date" value={entry} onChange={(e) => setEntry(e.target.value)} /></Field>
        <Field label="ימים מותרים (ערך מוצע, בדוק באתר הרשמי)">
          <input className="field num" dir="ltr" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field label="סוג ויזה"><input className="field" value={type} onChange={(e) => setType(e.target.value)} /></Field>
        <button
          className="btn-primary"
          disabled={!name || !Number(days)}
          onClick={async () => {
            await db.visaStays.add({ id: uid(), tripId, country: name, entryDate: entry, exitDate: null, allowedDays: Number(days), visaType: type });
            onClose();
          }}
        >
          הוסף
        </button>
      </div>
    </Sheet>
  );
}
