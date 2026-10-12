import { joinError, newCode, newRoom, reduce, viewFor } from './room';
import type { Action, Settings, View } from './room';
import type { Callbacks, Intent, NetError, Session } from './peer';
import { myUid } from './peer';

/**
 * Rooms over the `room` capability of a claude.ai Artifact page. Same host-authoritative design as the
 * PeerJS rooms: the host keeps the game and emits each player a personal view. Browsers inside an
 * Artifact cannot open WebRTC connections, so this is the only way to play online there.
 */

interface Peer {
  presence: Readonly<Record<string, unknown>>;
}
interface PeersChange {
  peers: readonly Peer[];
  left: readonly Peer[];
}
interface Message {
  data?: unknown;
}
interface NamedRoom {
  emit(topic: string, data?: unknown): Promise<void>;
  on(topic: string, handler: (m: Message) => void): () => void;
  presence(patch: Record<string, unknown>): Promise<void>;
  peers(): readonly Peer[];
  onPeers(handler: (c: PeersChange) => void): () => void;
  leave(): Promise<void>;
}
interface RoomNs {
  join(name: string): Promise<NamedRoom>;
}

declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}

export const TO_HOST = 'to-host';
export const TO_GUEST = 'to-guest';

const roomName = (code: string) => `imposter-${code.toLowerCase()}`;
const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const fail = (code: NetError) => Object.assign(new Error(code), { code });

/** The room capability, or null when this page is not an Artifact (or the viewer cannot connect). */
export async function roomCapability(): Promise<RoomNs | null> {
  if (typeof window === 'undefined' || !window.claude?.use) return null;
  try {
    return ((await window.claude.use('room')) as RoomNs | null) ?? null;
  } catch {
    return null;
  }
}

const hostPeer = (r: NamedRoom) => r.peers().some((p) => p.presence.host === true);

export async function openHostViaRoom(ns: RoomNs, name: string, settings: Settings, cb: Callbacks): Promise<Session> {
  const uid = myUid();
  let nr: NamedRoom | null = null;
  let code = '';
  for (let tries = 0; tries < 6 && !nr; tries++) {
    code = newCode();
    let r: NamedRoom;
    try {
      r = await ns.join(roomName(code));
    } catch {
      throw fail('net');
    }
    await sleep(1800); // let whoever is already in that room answer
    if (hostPeer(r)) await r.leave();
    else nr = r;
  }
  if (!nr) throw fail('net');
  const room$ = nr;
  await room$.presence({ uid, host: true });

  let room = newRoom(code, uid, name, settings);
  const here = new Set<string>();

  const sendTo = (u: string) => void room$.emit(TO_GUEST, { to: u, view: viewFor(room, u) });
  const push = () => {
    for (const p of room.players) if (p.uid !== uid && !p.gone) sendTo(p.uid);
    cb.onView(viewFor(room, uid));
  };
  const apply = (a: Action) => {
    room = reduce(room, a);
    push();
  };

  const offMsg = room$.on(TO_HOST, (m) => {
    const d = m.data as { t?: string; uid?: string; name?: string; target?: number } | undefined;
    if (!d || typeof d.uid !== 'string' || d.uid === uid) return;
    if (d.t === 'join' && typeof d.name === 'string') {
      const err = joinError(room, d.uid);
      if (err) return void room$.emit(TO_GUEST, { to: d.uid, error: err });
      here.add(d.uid);
      apply({ t: 'join', uid: d.uid, name: d.name });
    } else if (d.t === 'ready') {
      apply({ t: 'ready', uid: d.uid });
    } else if (d.t === 'vote' && typeof d.target === 'number') {
      apply({ t: 'vote', uid: d.uid, target: d.target });
    }
  });
  const offPeers = room$.onPeers((c) => {
    for (const p of c.left) {
      const u = p.presence.uid;
      if (typeof u === 'string' && u !== uid && here.delete(u)) apply({ t: 'leave', uid: u });
    }
  });
  const beat = window.setInterval(push, 6000); // covers a dropped message

  push();
  return {
    code,
    isHost: true,
    dispatch(intent: Intent) {
      if (intent.t === 'ready') apply({ t: 'ready', uid });
      else if (intent.t === 'vote') apply({ t: 'vote', uid, target: intent.target });
      else apply(intent);
    },
    close() {
      window.clearInterval(beat);
      offMsg();
      offPeers();
      void room$.leave();
    },
  };
}

export async function openGuestViaRoom(ns: RoomNs, code: string, name: string, cb: Callbacks): Promise<Session> {
  const uid = myUid();
  let nr: NamedRoom;
  try {
    nr = await ns.join(roomName(code));
  } catch {
    throw fail('net');
  }
  await nr.presence({ uid });

  return new Promise<Session>((resolve, reject) => {
    let joined = false;
    let done = false;
    let sawHost = false;
    const cleanup = () => {
      done = true;
      window.clearInterval(retry);
      window.clearTimeout(giveUp);
      offMsg();
      offPeers();
    };
    const abort = (c: NetError) => {
      cleanup();
      void nr.leave();
      reject(fail(c));
    };
    const offMsg = nr.on(TO_GUEST, (m) => {
      if (done && !joined) return;
      const d = m.data as { to?: string; view?: View; error?: 'full' | 'started' } | undefined;
      if (!d || d.to !== uid) return;
      if (d.error) return abort(d.error);
      if (!d.view) return;
      cb.onView(d.view);
      if (!joined) {
        joined = true;
        window.clearInterval(retry);
        window.clearTimeout(giveUp);
        resolve({
          code,
          isHost: false,
          dispatch(intent) {
            if (intent.t === 'ready') void nr.emit(TO_HOST, { t: 'ready', uid });
            else if (intent.t === 'vote') void nr.emit(TO_HOST, { t: 'vote', uid, target: intent.target });
          },
          close() {
            offMsg();
            offPeers();
            void nr.leave();
          },
        });
      }
    });
    const offPeers = nr.onPeers(() => {
      const present = hostPeer(nr);
      if (present) sawHost = true;
      if (joined && sawHost && !present) {
        offMsg();
        offPeers();
        cb.onClosed();
      }
    });
    // Keep asking until the host answers, so one dropped message does not strand a joiner.
    const ask = () => void nr.emit(TO_HOST, { t: 'join', uid, name });
    const retry = window.setInterval(() => {
      if (hostPeer(nr)) ask();
    }, 1500);
    const giveUp = window.setTimeout(() => {
      if (!joined) abort('notfound');
    }, 9000);
  });
}
