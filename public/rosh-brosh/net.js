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
// שיטה: כל המחפשים מתחרים על אותן משבצות קבועות (rosh-brosh-q-0, 1, 2...).
// מי שמצליח "לתפוס" משבצת מחכה בה (מארח). מי שהמשבצת תפוסה אצלו מתקשר אליה (אורח).
// כך שני מחפשים תמיד נפגשים, גם אם לא לחצו באותה שנייה.
const PEER_SRC = 'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js';
const qs = () => new URLSearchParams(location.search);

/** כתובת הספרייה. ?peerjs= מותר רק מאותו אתר (לבדיקות). */
function peerSrc() {
  const v = qs().get('peerjs');
  try { if (v && new URL(v, location.href).origin === location.origin) return v; } catch { /* ignore */ }
  return PEER_SRC;
}
/** ?peer=localhost:9000 מצביע על שרת התאמה מקומי (לבדיקות בלבד). */
function peerOptions() {
  const c = qs().get('peer');
  if (c && /^(localhost|127\.0\.0\.1):\d+$/.test(c)) {
    const [host, port] = c.split(':');
    return { host, port: Number(port), path: '/', secure: false, config: { iceServers: [] }, debug: 0 };
  }
  return { debug: 0 };
}
function loadPeer() {
  if (window.Peer) return Promise.resolve(window.Peer);
  return new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = peerSrc();
    s.onload = () => (window.Peer ? ok(window.Peer) : bad(new Error('peerjs')));
    s.onerror = () => bad(new Error('peerjs'));
    document.head.append(s);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function peerMatch({ timeoutMs = 30000, onStatus = () => {} } = {}) {
  let cancelled = false;
  const peers = [];
  const kill = (p) => { try { p.destroy(); } catch { /* ignore */ } };
  const promise = (async () => {
    onStatus('loading');
    let Peer;
    try { Peer = await loadPeer(); } catch { onStatus('error:lib'); return null; }
    const opts = peerOptions();
    const deadline = Date.now() + timeoutMs;

    const wrap = (c) => {
      const conn = makeConn((m) => c.send(m), () => c.close());
      c.on('data', (d) => conn._in(d));
      c.on('close', () => conn._closed());
      c.on('error', () => conn._closed());
      return conn;
    };
    /** תופס משבצת. { peer } | { taken } | { error } */
    const claim = (i) => new Promise((ok) => {
      const p = new Peer(SLOT_ID(i), opts);
      peers.push(p);
      const t = setTimeout(() => { kill(p); ok({ error: true }); }, 9000);
      p.once('open', () => { clearTimeout(t); ok({ peer: p }); });
      p.once('error', (e) => { clearTimeout(t); kill(p); ok(e.type === 'unavailable-id' ? { taken: true } : { error: true }); });
    });
    /** מחכה בתוך המשבצת עד שמישהו מתחבר (עד הדדליין). */
    const hold = (p) => new Promise((ok) => {
      let taken = false;
      const t = setTimeout(() => ok(null), Math.max(0, deadline - Date.now()));
      p.on('error', () => {});
      p.on('disconnected', () => { try { p.reconnect(); } catch { /* ignore */ } });
      p.on('connection', (c) => c.on('open', () => {
        if (taken || cancelled) { c.send({ t: 'busy' }); setTimeout(() => c.close(), 300); return; }
        taken = true;
        clearTimeout(t);
        c.send({ t: 'ready' });
        ok(c);
      }));
    });
    let seeker = null;
    const openSeeker = () => new Promise((ok) => {
      const p = new Peer(opts);
      peers.push(p);
      const t = setTimeout(() => { kill(p); ok(null); }, 9000);
      p.once('open', () => { clearTimeout(t); ok(p); });
      p.once('error', () => { clearTimeout(t); kill(p); ok(null); });
    });
    /** מתקשר למשבצת תפוסה ומחכה ל"ready" מהמארח. */
    const dial = (p, i) => new Promise((ok) => {
      const slot = SLOT_ID(i);
      let done = false;
      const finish = (v) => { if (done) return; done = true; clearTimeout(t); p.off('error', onErr); ok(v); };
      const onErr = (e) => { if (e.type === 'peer-unavailable' && String(e.message).includes(slot)) finish(null); };
      p.on('error', onErr);
      const t = setTimeout(() => { try { c.close(); } catch { /* ignore */ } finish(null); }, 5000);
      const c = p.connect(slot, { reliable: true, serialization: 'json' });
      c.on('data', (d) => { if (d && d.t === 'ready') finish(c); else if (d && d.t === 'busy') finish(null); });
      c.on('error', () => finish(null));
      c.on('close', () => finish(null));
    });

    while (!cancelled && Date.now() < deadline) {
      let serverProblem = false;
      for (let i = 0; i < SLOTS && !cancelled; i++) {
        onStatus('connecting');
        const r = await claim(i);
        if (r.peer) {
          onStatus('waiting');
          const c = await hold(r.peer);
          if (c) return { role: 'host', conn: wrap(c) };
          kill(r.peer);
          return null;
        }
        if (r.error) { serverProblem = true; continue; }
        if (!seeker) seeker = await openSeeker();
        if (!seeker) { serverProblem = true; continue; }
        onStatus('dialing');
        const c = await dial(seeker, i);
        if (c) return { role: 'guest', conn: wrap(c) };
      }
      onStatus(serverProblem ? 'error:server' : 'retry');
      await sleep(800 + Math.random() * 800);
    }
    return null;
  })();
  return { promise, cancel: () => { cancelled = true; peers.forEach(kill); } };
}

export function findMatch(opts) {
  const useBc = new URLSearchParams(location.search).get('net') === 'bc';
  return useBc ? bcMatch(opts) : peerMatch(opts);
}
