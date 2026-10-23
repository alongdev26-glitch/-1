import { useState } from 'react';
import { useApp } from '../ctx';
import { db, MEMBER_COLORS, uid } from '../db';
import { computeBalances, memberTotals, suggestTransfers } from '../logic/balances';
import { today } from '../logic/dates';
import type { Transfer } from '../types';
import { money } from '../ui/format';
import { Avatar, Bar, Sheet } from '../ui/kit';

export function Group() {
  const { trip, members, expenses, settlements } = useApp();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [confirmAll, setConfirmAll] = useState(false);
  const balances = computeBalances(members, expenses, settlements);
  const totals = memberTotals(members, expenses);
  const transfers = suggestTransfers(balances);
  const me = members[0];
  const myBal = me ? balances[me.id] ?? 0 : 0;
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? '';
  const memberOf = (id: string) => members.find((m) => m.id === id);

  const settle = (t: Transfer) =>
    db.settlements.add({ id: uid(), tripId: trip.id, fromId: t.fromId, toId: t.toId, amountHome: t.amount, date: today() });

  async function settleAll() {
    await db.settlements.bulkAdd(transfers.map((t) => ({ id: uid(), tripId: trip.id, fromId: t.fromId, toId: t.toId, amountHome: t.amount, date: today() })));
    setConfirmAll(false);
  }

  async function addMember() {
    if (!name.trim()) return;
    await db.members.add({ id: uid(), tripId: trip.id, name: name.trim(), order: members.length, color: MEMBER_COLORS[members.length % MEMBER_COLORS.length] });
    setName('');
    setAdding(false);
  }

  const remind = (t: Transfer) => {
    const text = `היי ${nameOf(t.fromId)}, מסכמים את החשבון בטיול: ${money(t.amount)} ל${nameOf(t.toId)} 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <section className="glass p-5">
        <div className="text-sm text-mute">{myBal >= 0 ? 'מאזן נוכחי בטיול (מגיע לך)' : 'מאזן נוכחי בטיול (אתה חייב)'}</div>
        <div className={`num text-5xl font-bold ${myBal >= 0 ? 'text-mint' : 'text-rose'}`}>{money(myBal, '₪', true)}</div>
        <p className="mt-2 text-sm text-mute">
          {Math.abs(myBal) < 0.5 ? 'אתה מאוזן, אין חובות פתוחים.' : myBal > 0 ? 'אתה ביתרת זכות: הקבוצה חייבת לך.' : 'אתה ביתרת חובה: כדאי להשלים העברה.'}
        </p>
      </section>

      <section className="glass p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold">איזון מהיר וחכם</h2>
          <span className="pill px-2 py-0.5 text-xs text-sky">{transfers.length} העברות בלבד</span>
        </div>
        <p className="mb-3 text-xs text-mute">החישוב מצמצם את מספר ההעברות כך שכל אחד יעביר כסף הכי מעט פעמים.</p>
        {transfers.length === 0 && <p className="py-3 text-center text-mint">הכל מסודר ✓</p>}
        <div className="space-y-3">
          {transfers.map((t, i) => (
            <div key={i} className="rounded-2xl bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={nameOf(t.fromId)} color={memberOf(t.fromId)?.color ?? '#888'} size={32} />
                  <span>{nameOf(t.fromId)} ← {nameOf(t.toId)}</span>
                </div>
                <span className="num text-xl font-bold text-mint">{money(t.amount)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn-soft flex-1 text-sm" onClick={() => remind(t)}>תזכורת בוואטסאפ</button>
                <button className="btn-soft flex-1 text-sm text-mint" onClick={() => settle(t)}>✓ סומן כשולם</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">חברי הקבוצה ({members.length})</h2>
        {members.map((m, i) => {
          const b = balances[m.id] ?? 0;
          const t = totals[m.id];
          return (
            <div key={m.id} className="glass flex items-center gap-3 p-3">
              <Avatar name={m.name} color={m.color} />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold">
                  {m.name}
                  {i === 0 && <span className="pill px-2 text-[10px] text-mute">אתה</span>}
                </div>
                <div className="num text-xs text-mute">שילם: {money(t.paid)} · חלקו: {money(t.share)}</div>
                <Bar className="mt-1 h-1.5!" value={t.share ? (t.paid / t.share) * 100 : 0} color={b >= 0 ? 'var(--color-mint)' : 'var(--color-rose)'} />
              </div>
              <div className="text-end">
                <div className={`num text-lg font-bold ${b >= 0 ? 'text-mint' : 'text-rose'}`}>{money(b, '₪', true)}</div>
                <div className="text-[11px] text-mute">{b >= 0 ? 'יתרת זכות' : 'יתרת חובה'}</div>
              </div>
            </div>
          );
        })}
      </section>

      <button className="btn-primary" disabled={!transfers.length} onClick={() => setConfirmAll(true)}>סגירת חוב / רישום פירעון</button>
      <button className="btn-soft w-full" onClick={() => setAdding(true)}>+ הוסף חבר לקבוצה</button>

      {adding && (
        <Sheet title="חבר חדש" onClose={() => setAdding(false)}>
          <input autoFocus className="field mb-4" placeholder="שם" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addMember()} />
          <button className="btn-primary" disabled={!name.trim()} onClick={addMember}>הוסף</button>
        </Sheet>
      )}
      {confirmAll && (
        <Sheet title="לסגור את כל החובות?" onClose={() => setConfirmAll(false)}>
          <p className="mb-4 text-sm text-mute">יירשמו {transfers.length} העברות כבוצעו והיתרות יתאפסו. ההוצאות עצמן נשארות.</p>
          <button className="btn-primary" onClick={settleAll}>כן, הכל שולם</button>
        </Sheet>
      )}
    </div>
  );
}
