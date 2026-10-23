import { categoryById } from '../data/categories';
import { useApp } from '../ctx';
import { db } from '../db';
import { formatShort } from '../logic/dates';
import { amountIn, money } from '../ui/format';
import { Sheet } from '../ui/kit';

export function ExpenseDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { expenses, members, trip } = useApp();
  const e = expenses.find((x) => x.id === id);
  if (!e) return null;
  const cat = categoryById(e.categoryId);
  const name = (mid: string) => members.find((m) => m.id === mid)?.name ?? '—';
  return (
    <Sheet title={`${cat.icon} ${e.note || cat.name}`} onClose={onClose}>
      <div className="mb-4 space-y-1 text-sm">
        <div className="num text-3xl font-bold">{money(e.amountHome)}</div>
        {e.currency !== trip.homeCurrency && (
          <div className="num text-mute">{amountIn(e.amount, e.currency)} {e.currency} · שער {Number(e.rateToHome.toPrecision(3))}</div>
        )}
        <div className="text-mute">{formatShort(e.date)} · {e.time} · שולם ע״י {name(e.paidById)}</div>
      </div>
      <div className="mb-4 space-y-1 rounded-2xl bg-white/5 p-3 text-sm">
        {e.splits.map((s) => (
          <div key={s.memberId} className="flex justify-between">
            <span>{name(s.memberId)}</span>
            <span className="num">{money(s.share)}</span>
          </div>
        ))}
      </div>
      <button className="btn-soft w-full text-rose" onClick={async () => { if (confirm('למחוק את ההוצאה?')) { await db.expenses.delete(id); onClose(); } }}>
        מחק הוצאה
      </button>
    </Sheet>
  );
}
