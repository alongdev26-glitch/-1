import { describe, expect, it } from 'vitest';
import { createRound, maxImposters, tallyVotes } from './game';
import type { Round } from './game';

const names = ['א', 'ב', 'ג', 'ד', 'ה'];

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe('createRound', () => {
  it('creates exactly the requested number of imposters', () => {
    const r = createRound(names, ['פיצה'], 2, seeded(1));
    expect(r.players.filter((p) => p.isImposter)).toHaveLength(2);
    expect(r.word).toBe('פיצה');
  });

  it('caps imposters so the crew keeps a majority', () => {
    expect(maxImposters(3)).toBe(1);
    expect(maxImposters(5)).toBe(2);
    expect(maxImposters(12)).toBe(5);
    const r = createRound(['א', 'ב', 'ג'], ['x'], 3, seeded(2));
    expect(r.players.filter((p) => p.isImposter)).toHaveLength(1);
  });

  it('rejects bad player counts and empty word lists', () => {
    expect(() => createRound(['א', 'ב'], ['x'], 1)).toThrow();
    expect(() => createRound(names, [], 1)).toThrow();
  });

  it('chooses a valid first speaker', () => {
    for (let s = 0; s < 20; s++) {
      const r = createRound(names, ['x'], 1, seeded(s));
      expect(r.firstSpeaker).toBeGreaterThanOrEqual(0);
      expect(r.firstSpeaker).toBeLessThan(names.length);
    }
  });
});

describe('tallyVotes', () => {
  const round = createRound(names, ['x'], 1, seeded(7));
  const imp = round.players.find((p) => p.isImposter)!.id;
  const innocent = round.players.find((p) => !p.isImposter)!.id;

  it('crew wins when the imposter gets the most votes', () => {
    const res = tallyVotes(round, names.map(() => imp));
    expect(res.outcome).toBe('crew');
    expect(res.caught).toEqual([imp]);
  });

  it('imposter wins when an innocent is voted out', () => {
    const res = tallyVotes(round, names.map(() => innocent));
    expect(res.outcome).toBe('imposter');
    expect(res.caught).toEqual([]);
  });

  it('a tie lets the imposter escape', () => {
    const other = round.players.find((p) => p.id !== imp && p.id !== innocent)!.id;
    const res = tallyVotes(round, [imp, imp, innocent, innocent, other]);
    expect(res.top.length).toBeGreaterThan(1);
    expect(res.outcome).toBe('imposter');
  });
});

describe('roles mode', () => {
  const six = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('adds jester, bounty hunter and bodyguard as the group grows', () => {
    const roles = (n: number) =>
      createRound(six.slice(0, n).concat(['g', 'h']).slice(0, n), ['x'], 1, seeded(3), true).players.map((p) => p.role);
    expect(roles(3)).not.toContain('jester');
    expect(roles(4)).toContain('jester');
    expect(roles(4)).not.toContain('bounty');
    expect(roles(5)).toContain('bounty');
    expect(roles(5)).not.toContain('bodyguard');
    expect(roles(6)).toContain('bodyguard');
  });

  it('points bodyguard and bounty hunter at an imposter', () => {
    const r = createRound(six, ['x'], 1, seeded(5), true);
    for (const p of r.players.filter((x) => x.role === 'bodyguard' || x.role === 'bounty')) {
      expect(r.players[p.target!].isImposter).toBe(true);
    }
  });

  it('classic mode has only imposters and innocents', () => {
    const r = createRound(six, ['x'], 1, seeded(5));
    expect(new Set(r.players.map((p) => p.role))).toEqual(new Set(['imposter', 'innocent']));
  });

  const mk = (roles: Round['players'][number]['role'][], targets: Record<number, number> = {}): Round => ({
    word: 'x',
    firstSpeaker: 0,
    players: roles.map((role, id) => ({ id, name: String(id), role, isImposter: role === 'imposter', target: targets[id] })),
  });

  it('the jester wins when voted out', () => {
    const r = mk(['imposter', 'innocent', 'jester', 'innocent']);
    const res = tallyVotes(r, [2, 2, 1, 2]);
    expect(res.outcome).toBe('jester');
  });

  it('records bounty hunters who voted for their target', () => {
    const r = mk(['imposter', 'innocent', 'bounty', 'innocent', 'innocent'], { 2: 0 });
    const res = tallyVotes(r, [1, 0, 0, 0, 0]);
    expect(res.outcome).toBe('crew');
    expect(res.bountyHits).toEqual([2]);
    expect(tallyVotes(r, [1, 0, 1, 0, 0]).bountyHits).toEqual([]);
  });
});
