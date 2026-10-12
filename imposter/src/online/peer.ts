import Peer from 'peerjs';
import type { DataConnection, PeerOptions } from 'peerjs';
import { joinError, newCode, newRoom, reduce, viewFor } from './room';
import type { Action, Settings, View } from './room';
import { openGuestViaRoom, openHostViaRoom, roomCapability } from './roomcap';

/**
 * Phone-to-phone rooms over WebRTC (PeerJS). The player who creates the code is the host: their phone
 * holds the room and sends every guest a personal `View`. Nobody needs an account.
 */

const PREFIX = 'imposter-game-';
const UID_KEY = 'imposter.uid';
const CONNECT_MS = 12000;

export type NetError = 'net' | 'notfound' | 'full' | 'started';

type Msg =
  | { t: 'join'; uid: string; name: string }
  | { t: 'ready' }
  | { t: 'vote'; target: number }
  | { t: 'view'; view: View }
  | { t: 'error'; code: 'full' | 'started' };

/** Things a player can do. Only the host may use the first group. */
export type Intent =
  | Extract<Action, { t: 'settings' | 'start' | 'next' | 'tovote' | 'again' | 'lobby' }>
  | { t: 'ready' }
  | { t: 'vote'; target: number };

export interface Session {
  code: string;
  isHost: boolean;
  dispatch(intent: Intent): void;
  close(): void;
}

export interface Callbacks {
  onView(view: View): void;
  /** The connection to the room was lost (the host left, or the network dropped). */
  onClosed(): void;
}

export function myUid(): string {
  try {
    let id = localStorage.getItem(UID_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      localStorage.setItem(UID_KEY, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

/** `?peer=host:port` points at a private PeerJS server (used for testing); otherwise the free public one. */
function peerOptions(): PeerOptions {
  const custom = new URLSearchParams(location.search).get('peer');
  if (!custom) return { debug: 0 };
  const [host, port] = custom.split(':');
  return { host, port: Number(port) || 9000, path: '/', secure: location.protocol === 'https:' && host !== 'localhost', debug: 0 };
}

function openPeer(id?: string): Promise<Peer> {
  return new Promise((resolve, reject) => {
    const p = id ? new Peer(id, peerOptions()) : new Peer(peerOptions());
    const timer = window.setTimeout(() => {
      p.destroy();
      reject(Object.assign(new Error('timeout'), { type: 'timeout' }));
    }, CONNECT_MS);
    p.once('open', () => {
      window.clearTimeout(timer);
      resolve(p);
    });
    p.once('error', (e: Error & { type?: string }) => {
      window.clearTimeout(timer);
      p.destroy();
      reject(Object.assign(new Error(e.type ?? 'error'), { type: e.type ?? 'error' }));
    });
  });
}

async function openHostPeer(name: string, settings: Settings, cb: Callbacks): Promise<Session> {
  const uid = myUid();
  let peer: Peer | null = null;
  let code = '';
  for (let tries = 0; tries < 8 && !peer; tries++) {
    code = newCode();
    try {
      peer = await openPeer(PREFIX + code);
    } catch (e) {
      if ((e as { type?: string }).type !== 'unavailable-id') throw Object.assign(new Error('net'), { code: 'net' as NetError });
    }
  }
  if (!peer) throw Object.assign(new Error('net'), { code: 'net' as NetError });
  const host = peer;

  let room = newRoom(code, uid, name, settings);
  const conns = new Map<string, DataConnection>();

  const push = () => {
    for (const [u, c] of conns) if (c.open) c.send({ t: 'view', view: viewFor(room, u) } satisfies Msg);
    cb.onView(viewFor(room, uid));
  };
  const apply = (a: Action) => {
    room = reduce(room, a);
    push();
  };

  host.on('connection', (c) => {
    let guest: string | null = null;
    c.on('data', (data) => {
      const m = data as Partial<Msg> | null;
      if (!m || typeof m !== 'object') return;
      if (m.t === 'join' && typeof m.uid === 'string' && typeof m.name === 'string') {
        const err = joinError(room, m.uid);
        if (err) {
          c.send({ t: 'error', code: err } satisfies Msg);
          window.setTimeout(() => c.close(), 300);
          return;
        }
        if (m.uid === uid) return;
        conns.get(m.uid)?.close();
        guest = m.uid;
        conns.set(guest, c);
        apply({ t: 'join', uid: guest, name: m.name });
      } else if (guest && m.t === 'ready') {
        apply({ t: 'ready', uid: guest });
      } else if (guest && m.t === 'vote' && typeof m.target === 'number') {
        apply({ t: 'vote', uid: guest, target: m.target });
      }
    });
    c.on('close', () => {
      if (guest && conns.get(guest) === c) {
        conns.delete(guest);
        apply({ t: 'leave', uid: guest });
      }
    });
  });
  host.on('disconnected', () => {
    if (!host.destroyed) host.reconnect();
  });

  push();
  return {
    code,
    isHost: true,
    dispatch(intent) {
      if (intent.t === 'ready') apply({ t: 'ready', uid });
      else if (intent.t === 'vote') apply({ t: 'vote', uid, target: intent.target });
      else apply(intent);
    },
    close() {
      host.destroy();
    },
  };
}

async function openGuestPeer(code: string, name: string, cb: Callbacks): Promise<Session> {
  const uid = myUid();
  let peer: Peer;
  try {
    peer = await openPeer();
  } catch {
    throw Object.assign(new Error('net'), { code: 'net' as NetError });
  }
  return new Promise<Session>((resolve, reject) => {
    const fail = (c: NetError) => {
      peer.destroy();
      reject(Object.assign(new Error(c), { code: c }));
    };
    const conn = peer.connect(PREFIX + code, { reliable: true });
    let joined = false;
    const timer = window.setTimeout(() => fail('notfound'), CONNECT_MS);
    peer.on('error', (e: Error & { type?: string }) => {
      if (joined) return cb.onClosed();
      window.clearTimeout(timer);
      fail(e.type === 'peer-unavailable' ? 'notfound' : 'net');
    });
    conn.on('open', () => conn.send({ t: 'join', uid, name } satisfies Msg));
    conn.on('data', (data) => {
      const m = data as Msg;
      if (m.t === 'error') {
        window.clearTimeout(timer);
        fail(m.code);
      } else if (m.t === 'view') {
        cb.onView(m.view);
        if (!joined) {
          joined = true;
          window.clearTimeout(timer);
          resolve({
            code,
            isHost: false,
            dispatch(intent) {
              if (!conn.open) return;
              if (intent.t === 'ready') conn.send({ t: 'ready' } satisfies Msg);
              else if (intent.t === 'vote') conn.send({ t: 'vote', target: intent.target } satisfies Msg);
            },
            close() {
              peer.destroy();
            },
          });
        }
      }
    });
    conn.on('close', () => {
      if (joined) cb.onClosed();
    });
  });
}

/** Picks the transport: the Artifact `room` capability when this page runs inside claude.ai, otherwise PeerJS. */
export async function openHost(name: string, settings: Settings, cb: Callbacks): Promise<Session> {
  const ns = await roomCapability();
  return ns ? openHostViaRoom(ns, name, settings, cb) : openHostPeer(name, settings, cb);
}

export async function openGuest(code: string, name: string, cb: Callbacks): Promise<Session> {
  const ns = await roomCapability();
  return ns ? openGuestViaRoom(ns, code, name, cb) : openGuestPeer(code, name, cb);
}
