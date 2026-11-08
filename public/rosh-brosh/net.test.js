import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { busMatch, toConn, DEAD_MS } from './net.js';

// אוטובוס בזיכרון: ערוצים לפי שם, הודעות לא חוזרות לשולח.
function hub() {
  const chans = new Map(); // name -> Set(channel)
  const blocked = new Set();
  const make = (clientId) => () => ({
    open(name) {
      const ch = {
        onmessage: null,
        ready: Promise.resolve(),
        post(d) { if (blocked.has(clientId)) return; queueMicrotask(() => { for (const o of chans.get(name) || []) if (o !== ch && !blocked.has(o.client)) o.onmessage?.(JSON.parse(JSON.stringify(d))); }); },
        close() { chans.get(name)?.delete(ch); },
        client: clientId,
      };
      if (!chans.has(name)) chans.set(name, new Set());
      chans.get(name).add(ch);
      return ch;
    },
    close() {},
  });
  return { make, block: (id) => blocked.add(id) };
}

describe('התאמה דרך אוטובוס', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('שני מחפשים מתחברים (מארח ואורח), והודעות עוברות בשני הכיוונים בסדר', async () => {
    const h = hub();
    const a = busMatch(h.make('A'), { timeoutMs: 30000 });
    const b = busMatch(h.make('B'), { timeoutMs: 30000 });
    await vi.advanceTimersByTimeAsync(3000);
    const [ra, rb] = await Promise.all([a.promise, b.promise]);
    expect([ra.role, rb.role].sort()).toEqual(['guest', 'host']);
    const got = { a: [], b: [] };
    ra.conn.onMessage((m) => got.a.push(m));
    rb.conn.onMessage((m) => got.b.push(m));
    ra.conn.send({ t: 'x', n: 1 }); ra.conn.send({ t: 'x', n: 2 }); rb.conn.send({ t: 'y' });
    await vi.advanceTimersByTimeAsync(10);
    expect(got.b).toEqual([{ t: 'x', n: 1 }, { t: 'x', n: 2 }]);
    expect(got.a).toEqual([{ t: 'y' }]);
  });

  it('שחקן שלישי לא מצטרף לזוג, ונגמר לו הזמן', async () => {
    const h = hub();
    const a = busMatch(h.make('A'), { timeoutMs: 8000 });
    const b = busMatch(h.make('B'), { timeoutMs: 8000 });
    await vi.advanceTimersByTimeAsync(2500);
    await Promise.all([a.promise, b.promise]);
    const c = busMatch(h.make('C'), { timeoutMs: 6000 });
    await vi.advanceTimersByTimeAsync(7000);
    expect(await c.promise).toBeNull();
  });

  it('מחפש לבד: נגמר הזמן ומתקבל null', async () => {
    const h = hub();
    const a = busMatch(h.make('A'), { timeoutMs: 5000 });
    await vi.advanceTimersByTimeAsync(5500);
    expect(await a.promise).toBeNull();
  });

  it('ביטול מחזיר null מיד', async () => {
    const h = hub();
    const a = busMatch(h.make('A'), { timeoutMs: 30000 });
    a.cancel();
    expect(await a.promise).toBeNull();
  });

  it('שרת שלא זמין: סטטוס שגיאה ו-null', async () => {
    const statuses = [];
    const a = busMatch(async () => { throw new Error('server'); }, { onStatus: (s) => statuses.push(s) });
    expect(await a.promise).toBeNull();
    expect(statuses).toEqual(['connecting', 'error:server']);
  });

  it('יריב שנעלם (אין פעימות) סוגר את החיבור אחרי כ-10 שניות', async () => {
    const h = hub();
    const a = busMatch(h.make('A'), { timeoutMs: 30000 });
    const b = busMatch(h.make('B'), { timeoutMs: 30000 });
    await vi.advanceTimersByTimeAsync(3000);
    const [ra] = await Promise.all([a.promise, b.promise]);
    const closed = vi.fn();
    ra.conn.onClose(closed);
    h.block('B');
    await vi.advanceTimersByTimeAsync(DEAD_MS - 2000);
    expect(closed).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(4000);
    expect(closed).toHaveBeenCalledTimes(1);
  });
});

describe('כפילויות', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it('הודעה שמגיעה פעמיים (MQTT) נספרת פעם אחת', () => {
    const ch = { onmessage: null, post() {}, close() {} };
    const conn = toConn(ch);
    const got = [];
    conn.onMessage((m) => got.push(m));
    ch.onmessage({ k: 'd', n: 1, m: 'a' });
    ch.onmessage({ k: 'd', n: 1, m: 'a' });
    ch.onmessage({ k: 'd', n: 2, m: 'b' });
    ch.onmessage({ k: 'd', n: 2, m: 'b' });
    expect(got).toEqual(['a', 'b']);
    conn.close();
  });
  it('"bye" סוגר את החיבור', () => {
    const ch = { onmessage: null, post() {}, close() {} };
    const conn = toConn(ch);
    const closed = vi.fn();
    conn.onClose(closed);
    ch.onmessage({ k: 'bye' });
    expect(closed).toHaveBeenCalledTimes(1);
  });
});
