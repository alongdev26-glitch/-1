// חיבור בין שני שחקנים בלי שרת משלנו: שני הטלפונים מתחברים החוצה לשרת MQTT ציבורי (WSS)
// ומעבירים דרכו הודעות. אין חיבור ישיר בין הטלפונים, ולכן אין בעיות NAT ורשתות סלולריות.
// bus = { open(name) -> channel, close() }, channel = { post(data), onmessage, ready (promise), close() }
// mqttBus: שרת MQTT ציבורי. bcBus: בין לשוניות באותו דפדפן (לבדיקות, ?net=bc).
// busMatch מחזיר { promise, cancel }. ה-promise נפתר ל-{ role: 'host' | 'guest', conn } או null אם לא נמצא יריב.
const rid = () => Math.random().toString(36).slice(2, 10);
const qs = () => new URLSearchParams(location.search);

export const HEARTBEAT_MS = 3000;
export const DEAD_MS = 10000;

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

/**
 * חיבור על ערוץ: מספר סידורי (מסנן כפילויות של MQTT), פעימת לב כדי לזהות שהיריב נעלם,
 * וצד המארח שולח "ready" שוב ושוב עד שהאורח עונה (הודעה בודדת יכולה ללכת לאיבוד).
 */
export function toConn(ch, { host = false, onDone } = {}) {
  let seqOut = 0;
  let seqIn = 0;
  let last = Date.now();
  let heard = false;
  const timers = [];
  const stop = () => { timers.forEach(clearInterval); timers.length = 0; };
  const conn = makeConn(
    (m) => ch.post({ k: 'd', n: ++seqOut, m }),
    () => { stop(); try { ch.post({ k: 'bye' }); } catch { /* ignore */ } ch.close(); onDone?.(); },
  );
  ch.onmessage = (x) => {
    last = Date.now();
    if (x.k !== 'ready') heard = true;
    if (x.k === 'bye') { stop(); conn._closed(); ch.close(); onDone?.(); }
    else if (x.k === 'd' && x.n > seqIn) { seqIn = x.n; conn._in(x.m); }
  };
  timers.push(setInterval(() => ch.post({ k: 'hb' }), HEARTBEAT_MS));
  timers.push(setInterval(() => { if (Date.now() - last > DEAD_MS) { stop(); conn._closed(); } }, 1000));
  if (host) timers.push(setInterval(() => { if (!heard) ch.post({ k: 'ready' }); }, 1000));
  else ch.post({ k: 'hb' });
  return conn;
}

/** התאמה: שני מחפשים מפרסמים "seek" בלובי. מי שהמזהה שלו קטן הופך למארח ושולח offer. */
export function busMatch(makeBus, { timeoutMs = 30000, onStatus = () => {} } = {}) {
  const id = rid();
  let done = false;
  let finish;
  const promise = new Promise((res) => { finish = res; });
  let bus = null;
  let lobby = null;
  let priv = null;
  let seekTimer = 0;
  let timeoutTimer = 0;
  const end = (value) => {
    if (done) return;
    done = true;
    clearInterval(seekTimer);
    clearTimeout(timeoutTimer);
    lobby?.close();
    if (!value) { priv?.close(); bus?.close(); }
    finish(value);
  };
  timeoutTimer = setTimeout(() => end(null), timeoutMs);
  (async () => {
    onStatus('connecting');
    try { bus = await makeBus(); } catch (e) { onStatus(e?.message === 'lib' ? 'error:lib' : 'error:server'); end(null); return; }
    if (done) { bus.close(); return; }
    onStatus('searching');
    lobby = bus.open('lobby');
    await lobby.ready;
    lobby.onmessage = async (m) => {
      if (done || !m || (m.to && m.to !== id)) return;
      if (m.t === 'seek' && m.id !== id && id < m.id) {
        lobby.post({ t: 'offer', to: m.id, host: id });
      } else if (m.t === 'offer' && !priv) {
        const ch = bus.open(`m-${m.host}`);
        priv = ch;
        ch.onmessage = (x) => { if (x.k === 'ready' && !done) end({ role: 'guest', conn: toConn(ch, { onDone: () => bus.close() }) }); };
        await ch.ready;
        lobby.post({ t: 'accept', to: m.host, id });
      } else if (m.t === 'accept' && !priv) {
        const ch = bus.open(`m-${id}`);
        priv = ch;
        await ch.ready;
        ch.post({ k: 'ready' });
        end({ role: 'host', conn: toConn(ch, { host: true, onDone: () => bus.close() }) });
      }
    };
    const seek = () => lobby.post({ t: 'seek', id });
    seek();
    seekTimer = setInterval(seek, 900);
  })();
  return { promise, cancel: () => end(null) };
}

// ---------- בין לשוניות (בדיקות) ----------
export function bcBus() {
  const me = rid();
  const chans = new Set();
  return {
    open(name) {
      const bc = new BroadcastChannel(`rosh-brosh-${name}`);
      const ch = { onmessage: null, ready: Promise.resolve(), post: (d) => bc.postMessage({ f: me, d }), close: () => { bc.close(); chans.delete(ch); } };
      bc.onmessage = (e) => { if (e.data.f !== me) ch.onmessage?.(e.data.d); };
      chans.add(ch);
      return ch;
    },
    close() { [...chans].forEach((c) => c.close()); },
  };
}

// ---------- MQTT (שרת ציבורי) ----------
const BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'];
const MQTT_SRC = 'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js';

/** ?mqttjs= מותר רק מאותו אתר, ו-?broker= רק ל-localhost (לבדיקות). */
function mqttSrc() {
  const v = qs().get('mqttjs');
  try { if (v && new URL(v, location.href).origin === location.origin) return v; } catch { /* ignore */ }
  return MQTT_SRC;
}
function brokers() {
  const b = qs().get('broker');
  return b && /^wss?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(b) ? [b] : BROKERS;
}
function loadMqtt() {
  if (window.mqtt) return Promise.resolve(window.mqtt);
  return new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = mqttSrc();
    s.onload = () => (window.mqtt ? ok(window.mqtt) : bad(new Error('lib')));
    s.onerror = () => bad(new Error('lib'));
    document.head.append(s);
  });
}
const connectTo = (mqtt, url, ms) => new Promise((ok) => {
  const c = mqtt.connect(url, { reconnectPeriod: 0, connectTimeout: ms, clientId: `rb_${rid()}${rid()}`, clean: true, keepalive: 30 });
  const t = setTimeout(() => { c.end(true); ok(null); }, ms + 500);
  c.once('connect', () => { clearTimeout(t); ok(c); });
  c.once('error', () => { clearTimeout(t); c.end(true); ok(null); });
  c.once('close', () => { clearTimeout(t); ok(null); });
});

export async function mqttBus() {
  const mqtt = await loadMqtt();
  let client = null;
  for (const url of brokers()) { client = await connectTo(mqtt, url, 6000); if (client) break; }
  if (!client) throw new Error('server');
  const me = rid();
  const handlers = new Map();
  client.on('message', (topic, payload) => {
    try {
      const m = JSON.parse(payload.toString());
      if (m.f !== me) handlers.get(topic)?.(m.d);
    } catch { /* ignore garbage */ }
  });
  return {
    open(name) {
      const topic = `rosh-brosh/v1/${name}`;
      const ch = {
        onmessage: null,
        post: (d) => client.publish(topic, JSON.stringify({ f: me, d }), { qos: 1 }),
        close: () => { handlers.delete(topic); try { client.unsubscribe(topic); } catch { /* ignore */ } },
      };
      handlers.set(topic, (d) => ch.onmessage?.(d));
      ch.ready = new Promise((ok) => client.subscribe(topic, { qos: 1 }, () => ok()));
      return ch;
    },
    close() { try { client.end(true); } catch { /* ignore */ } },
  };
}

export function findMatch(opts) {
  return busMatch(qs().get('net') === 'bc' ? bcBus : mqttBus, opts);
}
