export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

export type Rng = () => number;

export interface Player {
  id: number;
  name: string;
  isImposter: boolean;
}

export interface Round {
  word: string;
  players: Player[];
  /** The player who gives the first clue. */
  firstSpeaker: number;
}

export type Outcome = 'crew' | 'imposter';

export interface VoteResult {
  /** Player ids with the most votes. More than one means a tie. */
  top: number[];
  outcome: Outcome;
  /** Ids of imposters that were caught (voted out). */
  caught: number[];
}

export function maxImposters(playerCount: number): number {
  return Math.max(1, Math.floor((playerCount - 1) / 2));
}

export function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createRound(
  names: string[],
  words: readonly string[],
  imposterCount: number,
  rng: Rng = Math.random,
): Round {
  if (names.length < MIN_PLAYERS || names.length > MAX_PLAYERS) {
    throw new Error(`Players must be ${MIN_PLAYERS}-${MAX_PLAYERS}`);
  }
  if (words.length === 0) throw new Error('No words to choose from');
  const count = Math.min(Math.max(1, imposterCount), maxImposters(names.length));
  const imposterIds = new Set(shuffle(names.map((_, i) => i), rng).slice(0, count));
  return {
    word: pick(words, rng),
    players: names.map((name, id) => ({ id, name, isImposter: imposterIds.has(id) })),
    firstSpeaker: Math.floor(rng() * names.length),
  };
}

/** `votes[i]` is the player id that player i voted for. */
export function tallyVotes(round: Round, votes: number[]): VoteResult {
  const counts = new Map<number, number>();
  for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
  const max = Math.max(...counts.values());
  const top = [...counts].filter(([, c]) => c === max).map(([id]) => id);
  // A tie catches nobody: the imposters get away.
  const caught = top.length === 1 && round.players[top[0]].isImposter ? top : [];
  // Voting out any one imposter is a crew win.
  return { top, caught, outcome: caught.length > 0 ? 'crew' : 'imposter' };
}
