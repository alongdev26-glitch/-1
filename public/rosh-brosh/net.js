// חיבור בין שני שחקנים בלי שרת משלנו.
// peerMatch: PeerJS (WebRTC) עם "משבצות המתנה" קבועות בשרת הציבורי החינמי של PeerJS.
// bcMatch: אותו רעיון בין שתי לשוניות באותו דפדפן (BroadcastChannel), לבדיקות. נבחר עם ?net=bc
// כל אחד מחזיר { promise, cancel }. ה-promise נפתר ל-{ role: 'host' | 'guest', conn } או null אם לא נמצא יריב.
const SLOTS = 5;
const SLOT_ID = (i) => `rosh-brosh-q-${i}`;
const rid = () => Math.random().toString(36).slice(2, 10);

/** חיבור כללי: send, onMessage (הודעות שהגיעו קודם נשמרות עד שיש מאזין), onClose, close. */
export function makeConn(sendFn, closeFn) {
  let handler = null;
  let onClose = null;
  let closed = false;
  const queue = [];
  return {
    send: (m) => { if (!closed) sendFn(m); },
    onMessage(fn) { handler = fn; while (queue.length) fn(queue.shift()); },
    onClose(fn) { onClose = fn; if (closed) fn(); },
    close() { if (!closed) { closed = true; closeFn?.(); } },
    _in(m) { if (handler) handler(m); else queue.push(m); },
    _closed() { if (!closed) { closed = true; onClose?.(); } },
  };
}

// ---------- בין לשוניות (בדיקות) ----------
export function bcMatch({ timeoutMs = 20000 } = {}) {
  const id = rid();
  const lobby = new BroadcastChannel('rosh-brosh-lobby');
  let done = false;
  let finish;
  let priv = null;
  const promise = new Promise((res) => { finish = res; });
  const timers = [];
  const end = (value) => {
    if (done) return;
    done = true;
    timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
    lobby.close();
    finish(value);
  };
  const toConn = (ch) => {
    const conn = makeConn((m) => ch.postMessage(m), () => { ch.postMessage({ t: 'bye' }); ch.close(); });
    ch.onmessage = (e) => { if (e.data.t === 'bye') conn._closed(); else if (e.data.t !== 'ready') conn._in(e.data); };
    return conn;
  };
  lobby.onmessage = (e) => {
    const m = e.data;
    if (done || (m.to && m.to !== id)) return;
    if (m.t === 'seek' && m.id !== id && id < m.id) {
      lobby.postMessage({ t: 'offer', to: m.id, host: id });
    } else if (m.t === 'offer' && !priv) {
      priv = new BroadcastChannel(`rosh-brosh-m-${m.host}`);
      priv.onmessage = (ev) => { if (ev.data.t === 'ready') end({ role: 'guest', conn: toConn(priv) }); };
      lobby.postMessage({ t: 'accept', to: m.host, id });
    } else if (m.t === 'accept' && !priv) {
      priv = new BroadcastChannel(`rosh-brosh-m-${id}`);
      priv.postMessage({ t: 'ready' });
      end({ role: 'host', conn: toConn(priv) });
    }
  };
  lobby.postMessage({ t: 'seek', id });
  timers.push(setInterval(() => lobby.postMessage({ t: 'seek', id }), 600));
  timers.push(setTimeout(() => end(null), timeoutMs));
  return { promise, cancel: () => end(null) };
}

// ---------- PeerJS ----------
const PEER_SRC = 'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js';
function loadPeer() {
  if (window.Peer) return Promise.resolve(window.Peer);
  return new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = PEER_SRC;
    s.onload = () => (window.Peer ? ok(window.Peer) : bad(new Error('peerjs')));
    s.onerror = () => bad(new Error('peerjs'));
    document.head.append(s);
  });
}

export function peerMatch({ timeoutMs = 20000 } = {}) {
  let cancelled = false;
  const peers = [];
  const promise = (async () => {
    let Peer;
    try { Peer = await loadPeer(); } catch { return null; }
    const open = (p) => new Promise((ok, bad) => {
      const t = setTimeout(() => bad(new Error('timeout')), 8000);
      p.once('open', () => { clearTimeout(t); ok(p); });
      p.once('error', (e) => { clearTimeout(t); bad(e); });
    });
    let seeker;
    try { seeker = new Peer(); peers.push(seeker); await open(seeker); } catch { return null; }
    const pending = new Map();
    seeker.on('error', (e) => {
      if (e.type !== 'peer-unavailable') return;
      for (const [slot, resolve] of pending) if (String(e.message).includes(slot)) resolve(null);
    });
    const wrap = (c) => {
      const conn = makeConn((m) => c.send(m), () => c.close());
      c.on('data', (d) => conn._in(d));
      c.on('close', () => conn._closed());
      c.on('error', () => conn._closed());
      return conn;
    };
    const dial = (i) => new Promise((ok) => {
      const slot = SLOT_ID(i);
      const t = setTimeout(() => { pending.delete(slot); ok(null); }, 3000);
      pending.set(slot, (v) => { clearTimeout(t); pending.delete(slot); ok(v); });
      const c = seeker.connect(slot, { reliable: true });
      c.on('open', () => pending.get(slot)?.(c));
    });
    const claim = (i) => new Promise((ok) => {
      const p = new Peer(SLOT_ID(i));
      peers.push(p);
      const t = setTimeout(() => { p.destroy(); ok(null); }, 6000);
      p.once('open', () => { clearTimeout(t); ok(p); });
      p.once('error', () => { clearTimeout(t); p.destroy(); ok(null); });
    });
    const waitConn = (p, ms) => new Promise((ok) => {
      const t = setTimeout(() => ok(null), ms);
      p.on('connection', (c) => c.on('open', () => { clearTimeout(t); ok(c); }));
    });
    const deadline = Date.now() + timeoutMs;
    while (!cancelled && Date.now() < deadline) {
      for (let i = 0; i < SLOTS && !cancelled; i++) {
        const c = await dial(i);
        if (c) return { role: 'guest', conn: wrap(c) };
      }
      for (let i = 0; i < SLOTS && !cancelled; i++) {
        const host = await claim(i);
        if (!host) continue;
        const c = await waitConn(host, 3000 + Math.random() * 2000);
        if (c) return { role: 'host', conn: wrap(c) };
        host.destroy();
        break;
      }
    }
    return null;
  })();
  return { promise, cancel: () => { cancelled = true; peers.forEach((p) => p.destroy()); } };
}

export function findMatch(opts) {
  const useBc = new URLSearchParams(location.search).get('net') === 'bc';
  return useBc ? bcMatch(opts) : peerMatch(opts);
}
