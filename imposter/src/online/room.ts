import { MAX_PLAYERS, MIN_PLAYERS, ROLE_MIN_PLAYERS, createRound, tallyVotes } from '../engine/game';
import type { Outcome, Rng, Role, Round } from '../engine/game';

/**
 * The state of an online room. The host's phone holds the whole thing (including every secret)
 * and sends each guest a `View` with only what that player may see. Everything here is pure.
 */

export type RoomPhase = 'lobby' | 'reveal' | 'discuss' | 'vote' | 'result';

export interface Settings {
  packIds: string[];
  rolesMode: boolean;
  imposters: number;
}

export interface RoomPlayer {
  uid: string;
  name: string;
  gone?: boolean;
}

export interface Room {
  code: string;
  host: string;
  players: RoomPlayer[];
  settings: Settings;
  phase: RoomPhase;
  /** Set once a round starts. `uids[i]` is the player who sits in seat `i` of the round. */
  round?: Round;
  uids: string[];
  ready: string[];
  turn: number;
  roundNo: number;
  /** voter uid -> seat id of the player they voted for */
  votes: Record<string, number>;
}

export type Action =
  | { t: 'join'; uid: string; name: string }
  | { t: 'leave'; uid: string }
  | { t: 'settings'; settings: Settings }
  | { t: 'start'; words: string[]; rng?: Rng }
  | { t: 'ready'; uid: string }
  | { t: 'next' }
  | { t: 'tovote' }
  | { t: 'again' }
  | { t: 'lobby' }
  | { t: 'vote'; uid: string; target: number };

export const DEFAULT_SETTINGS: Settings = { packIds: [], rolesMode: false, imposters: 1 };

export const cleanName = (s: string) => s.trim().slice(0, 14);

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const newCode = (rng: Rng = Math.random) =>
  Array.from({ length: 4 }, () => LETTERS[Math.floor(rng() * LETTERS.length)]).join('');
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

export function newRoom(code: string, hostUid: string, hostName: string, settings: Settings = DEFAULT_SETTINGS): Room {
  return {
    code,
    host: hostUid,
    players: [{ uid: hostUid, name: cleanName(hostName) }],
    settings,
    phase: 'lobby',
    uids: [],
    ready: [],
    turn: 0,
    roundNo: 1,
    votes: {},
  };
}

export type JoinError = 'full' | 'started';

/** Whether a newcomer may take a seat. People already in the room can always come back. */
export function joinError(room: Room, uid: string): JoinError | null {
  if (room.players.some((p) => p.uid === uid)) return null;
  if (room.phase !== 'lobby') return 'started';
  return room.players.length >= MAX_PLAYERS ? 'full' : null;
}

const present = (room: Room) => room.players.filter((p) => !p.gone);

/** Moves the room on once everyone who is still here has done their part. */
function settle(room: Room): Room {
  const here = present(room).map((p) => p.uid);
  if (room.phase === 'reveal' && here.every((u) => room.ready.includes(u))) {
    return { ...room, phase: 'discuss', turn: 0, roundNo: 1 };
  }
  if (room.phase === 'vote' && here.every((u) => u in room.votes)) {
    return { ...room, phase: 'result' };
  }
  return room;
}

export function reduce(room: Room, a: Action): Room {
  switch (a.t) {
    case 'join': {
      if (joinError(room, a.uid)) return room;
      const name = cleanName(a.name);
      const existing = room.players.find((p) => p.uid === a.uid);
      if (existing) {
        return settle({
          ...room,
          players: room.players.map((p) => (p.uid === a.uid ? { ...p, name: name || p.name, gone: false } : p)),
        });
      }
      return { ...room, players: [...room.players, { uid: a.uid, name }] };
    }
    case 'leave': {
      if (a.uid === room.host) return room;
      if (room.phase === 'lobby') return { ...room, players: room.players.filter((p) => p.uid !== a.uid) };
      return settle({ ...room, players: room.players.map((p) => (p.uid === a.uid ? { ...p, gone: true } : p)) });
    }
    case 'settings':
      return room.phase === 'lobby' ? { ...room, settings: a.settings } : room;
    case 'start': {
      const n = room.players.length;
      if (room.phase !== 'lobby' || n < MIN_PLAYERS) return room;
      const names = room.players.map((p, i) => p.name || `#${i + 1}`);
      const round = createRound(names, a.words, room.settings.imposters, a.rng, room.settings.rolesMode && n >= ROLE_MIN_PLAYERS.jester);
      return { ...room, phase: 'reveal', round, uids: room.players.map((p) => p.uid), ready: [], turn: 0, roundNo: 1, votes: {} };
    }
    case 'ready':
      if (room.phase !== 'reveal' || !room.uids.includes(a.uid)) return room;
      return settle({ ...room, ready: [...new Set([...room.ready, a.uid])] });
    case 'next':
      if (room.phase !== 'discuss') return room;
      return { ...room, turn: Math.min(room.turn + 1, room.uids.length - 1) };
    case 'tovote':
      if (room.phase !== 'discuss' || room.turn < room.uids.length - 1) return room;
      return { ...room, phase: 'vote', votes: {} };
    case 'again':
      if (room.phase !== 'discuss' || room.turn < room.uids.length - 1) return room;
      return { ...room, turn: 0, roundNo: room.roundNo + 1 };
    case 'lobby':
      if (room.phase !== 'result') return room;
      return {
        ...room,
        phase: 'lobby',
        round: undefined,
        uids: [],
        ready: [],
        votes: {},
        turn: 0,
        roundNo: 1,
        players: room.players.filter((p) => !p.gone),
      };
    case 'vote': {
      if (room.phase !== 'vote') return room;
      const seat = room.uids.indexOf(a.uid);
      if (seat < 0 || a.target === seat || a.target < 0 || a.target >= room.uids.length) return room;
      return settle({ ...room, votes: { ...room.votes, [a.uid]: a.target } });
    }
  }
}

/** What one player is allowed to see. */
export interface View {
  code: string;
  phase: RoomPhase;
  isHost: boolean;
  /** Index of this player in `players` (the lobby list, or the seats of the round). */
  me: number;
  players: { id: number; name: string; host: boolean; gone: boolean }[];
  settings: Settings;
  you?: { role: Role; word?: string; target?: number };
  readyCount: number;
  total: number;
  turn: number;
  roundNo: number;
  speaker: number;
  voted: boolean;
  votedCount: number;
  result?: {
    outcome: Outcome;
    top: number[];
    word: string;
    roster: { id: number; role: Role; target?: number; hit: boolean }[];
  };
}

export function viewFor(room: Room, uid: string): View {
  const inRound = room.phase !== 'lobby' && room.round !== undefined;
  const list = inRound
    ? room.round!.players.map((p, i) => {
        const rp = room.players.find((x) => x.uid === room.uids[i]);
        return { id: i, name: p.name, host: room.uids[i] === room.host, gone: rp?.gone === true };
      })
    : room.players.map((p, i) => ({ id: i, name: p.name, host: p.uid === room.host, gone: false }));
  const me = inRound ? room.uids.indexOf(uid) : room.players.findIndex((p) => p.uid === uid);
  const view: View = {
    code: room.code,
    phase: room.phase,
    isHost: uid === room.host,
    me,
    players: list,
    settings: room.settings,
    readyCount: room.ready.length,
    total: present(room).length,
    turn: room.turn,
    roundNo: room.roundNo,
    speaker: inRound ? (room.round!.firstSpeaker + room.turn) % room.uids.length : 0,
    voted: uid in room.votes,
    votedCount: Object.keys(room.votes).length,
  };
  if (inRound && me >= 0 && room.phase !== 'result') {
    const p = room.round!.players[me];
    view.you = { role: p.role, word: p.role === 'imposter' ? undefined : room.round!.word, target: p.target };
  }
  if (room.phase === 'result' && room.round) {
    const votes = room.uids.map((u) => room.votes[u] ?? -1);
    const res = tallyVotes(room.round, votes);
    view.result = {
      outcome: res.outcome,
      top: res.top,
      word: room.round.word,
      roster: room.round.players.map((p) => ({ id: p.id, role: p.role, target: p.target, hit: res.bountyHits.includes(p.id) })),
    };
  }
  return view;
}
