import { describe, expect, it } from 'vitest';
import { createRound, maxImposters, tallyVotes } from './game';

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
