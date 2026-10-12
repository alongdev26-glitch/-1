import { describe, expect, it } from 'vitest';
import { cleanCode, joinError, newRoom, reduce, viewFor } from './room';
import type { Action, Room } from './room';

const settings = { packIds: ['animals'], rolesMode: false, imposters: 1 };

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function lobby(n: number): Room {
  let r = newRoom('ABCD', 'u0', 'Host', settings);
  for (let i = 1; i < n; i++) r = reduce(r, { t: 'join', uid: `u${i}`, name: `P${i}` });
  return r;
}

const run = (r: Room, ...actions: Action[]) => actions.reduce(reduce, r);

function started(n: number, rolesMode = false): Room {
  const r = lobby(n);
  return run(r, { t: 'settings', settings: { ...settings, rolesMode } }, { t: 'start', words: ['Dog'], rng: seeded(4) });
}

describe('lobby', () => {
  it('seats joiners and ignores a second join by the same uid', () => {
    const r = run(lobby(3), { t: 'join', uid: 'u1', name: 'Renamed' });
    expect(r.players).toHaveLength(3);
    expect(r.players[1].name).toBe('Renamed');
  });

  it('refuses newcomers when full or after the game started', () => {
    expect(joinError(lobby(12), 'late')).toBe('full');
    expect(joinError(started(3), 'late')).toBe('started');
    expect(joinError(started(3), 'u1')).toBeNull();
  });

  it('needs three players to start', () => {
    expect(run(lobby(2), { t: 'start', words: ['x'] }).phase).toBe('lobby');
    expect(started(3).phase).toBe('reveal');
  });

  it('removes people who leave, but never the host', () => {
    const r = run(lobby(4), { t: 'leave', uid: 'u2' }, { t: 'leave', uid: 'u0' });
    expect(r.players.map((p) => p.uid)).toEqual(['u0', 'u1', 'u3']);
  });

  it('cleans room codes', () => {
    expect(cleanCode(' ab-c1d e')).toBe('ABCD');
  });
});

describe('views keep secrets', () => {
  it('shows the word to everyone but the imposter, and never leaks other players roles', () => {
    const r = started(5);
    const roles = r.round!.players.map((p) => p.role);
    r.uids.forEach((u, i) => {
      const v = viewFor(r, u);
      expect(v.you?.role).toBe(roles[i]);
      expect(v.you?.word).toBe(roles[i] === 'imposter' ? undefined : 'Dog');
      expect(JSON.stringify(v)).not.toContain('"isImposter"');
      expect(v.result).toBeUndefined();
    });
  });

  it('reveals everything in the result', () => {
    let r = started(3);
    r = run(r, ...r.uids.map((u): Action => ({ t: 'ready', uid: u })));
    r = run(r, { t: 'next' }, { t: 'next' }, { t: 'tovote' });
    r = run(r, ...r.uids.map((u, i): Action => ({ t: 'vote', uid: u, target: (i + 1) % 3 })));
    const v = viewFor(r, 'u0');
    expect(v.phase).toBe('result');
    expect(v.result?.roster).toHaveLength(3);
    expect(v.result?.word).toBe('Dog');
  });
});

describe('game flow', () => {
  it('moves to the discussion once everyone is ready', () => {
    let r = started(3);
    r = run(r, { t: 'ready', uid: 'u0' }, { t: 'ready', uid: 'u1' });
    expect(r.phase).toBe('reveal');
    r = run(r, { t: 'ready', uid: 'u2' });
    expect(r.phase).toBe('discuss');
  });

  it('only allows voting or another round after a full round of turns', () => {
    let r = started(3);
    r = run(r, ...r.uids.map((u): Action => ({ t: 'ready', uid: u })));
    expect(run(r, { t: 'tovote' }).phase).toBe('discuss');
    expect(run(r, { t: 'again' }).roundNo).toBe(1);
    r = run(r, { t: 'next' }, { t: 'next' }, { t: 'next' });
    expect(r.turn).toBe(2);
    const again = run(r, { t: 'again' });
    expect(again.roundNo).toBe(2);
    expect(again.turn).toBe(0);
    expect(run(r, { t: 'tovote' }).phase).toBe('vote');
  });

  it('rejects votes for yourself or for nobody and waits for all voters', () => {
    let r = started(3);
    r = run(r, ...r.uids.map((u): Action => ({ t: 'ready', uid: u })));
    r = run(r, { t: 'next' }, { t: 'next' }, { t: 'tovote' });
    r = run(r, { t: 'vote', uid: 'u0', target: 0 }, { t: 'vote', uid: 'u0', target: 9 });
    expect(r.votes).toEqual({});
    r = run(r, { t: 'vote', uid: 'u0', target: 1 }, { t: 'vote', uid: 'u1', target: 2 });
    expect(r.phase).toBe('vote');
    r = run(r, { t: 'vote', uid: 'u2', target: 0 });
    expect(r.phase).toBe('result');
  });

  it('does not wait for a player who left mid-game', () => {
    let r = started(4);
    r = run(r, { t: 'ready', uid: 'u0' }, { t: 'ready', uid: 'u1' }, { t: 'ready', uid: 'u2' });
    r = run(r, { t: 'leave', uid: 'u3' });
    expect(r.phase).toBe('discuss');
    expect(viewFor(r, 'u0').players[3].gone).toBe(true);
  });

  it('returns everyone to the lobby for another game', () => {
    let r = started(3);
    r = run(r, ...r.uids.map((u): Action => ({ t: 'ready', uid: u })));
    r = run(r, { t: 'next' }, { t: 'next' }, { t: 'tovote' });
    r = run(r, ...r.uids.map((u, i): Action => ({ t: 'vote', uid: u, target: (i + 1) % 3 })));
    r = run(r, { t: 'lobby' });
    expect(r.phase).toBe('lobby');
    expect(r.round).toBeUndefined();
    expect(r.players).toHaveLength(3);
  });

  it('deals special roles in roles mode', () => {
    const r = started(6, true);
    const roles = new Set(r.round!.players.map((p) => p.role));
    expect(roles.has('jester') && roles.has('bounty') && roles.has('bodyguard')).toBe(true);
  });
});
