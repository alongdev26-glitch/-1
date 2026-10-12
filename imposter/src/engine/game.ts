export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

export type Rng = () => number;

export type Role = 'imposter' | 'innocent' | 'jester' | 'bodyguard' | 'bounty';

export interface Player {
  id: number;
  name: string;
  role: Role;
  isImposter: boolean;
  /** Bodyguard: the imposter to shield. Bounty hunter: the imposter to expose. */
  target?: number;
}

export interface Round {
  word: string;
  players: Player[];
  /** The player who gives the first clue. */
  firstSpeaker: number;
}

export type Outcome = 'crew' | 'imposter' | 'jester';

export interface VoteResult {
  /** Player ids with the most votes. More than one means a tie. */
  top: number[];
  outcome: Outcome;
  /** Ids of imposters that were caught (voted out). */
  caught: number[];
  /** Bounty hunters who voted for their target. */
  bountyHits: number[];
}

/** Players needed before each special role joins a Roles-mode game. */
export const ROLE_MIN_PLAYERS = { jester: 4, bounty: 5, bodyguard: 6 } as const;

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
  rolesMode = false,
): Round {
  if (names.length < MIN_PLAYERS || names.length > MAX_PLAYERS) {
    throw new Error(`Players must be ${MIN_PLAYERS}-${MAX_PLAYERS}`);
  }
  if (words.length === 0) throw new Error('No words to choose from');
  const n = names.length;
  const count = Math.min(Math.max(1, imposterCount), maxImposters(n));
  const order = shuffle(names.map((_, i) => i), rng);
  const roles: Role[] = names.map(() => 'innocent');
  const imposterIds = order.slice(0, count);
  imposterIds.forEach((id) => (roles[id] = 'imposter'));
  if (rolesMode) {
    const special: Role[] = [];
    if (n >= ROLE_MIN_PLAYERS.jester) special.push('jester');
    if (n >= ROLE_MIN_PLAYERS.bounty) special.push('bounty');
    if (n >= ROLE_MIN_PLAYERS.bodyguard) special.push('bodyguard');
    special.forEach((role, i) => (roles[order[count + i]] = role));
  }
  return {
    word: pick(words, rng),
    players: names.map((name, id) => ({
      name,
      id,
      role: roles[id],
      isImposter: roles[id] === 'imposter',
      target: roles[id] === 'bodyguard' || roles[id] === 'bounty' ? pick(imposterIds, rng) : undefined,
    })),
    firstSpeaker: Math.floor(rng() * n),
  };
}

/** `votes[i]` is the player id that player i voted for. */
export function tallyVotes(round: Round, votes: number[]): VoteResult {
  const counts = new Map<number, number>();
  // Negative entries are players who never voted (they left the room).
  for (const v of votes) if (v >= 0) counts.set(v, (counts.get(v) ?? 0) + 1);
  if (counts.size === 0) return { top: [], caught: [], bountyHits: [], outcome: 'imposter' };
  const max = Math.max(...counts.values());
  const top = [...counts].filter(([, c]) => c === max).map(([id]) => id);
  const single = top.length === 1 ? round.players[top[0]] : undefined;
  // A tie catches nobody: the imposters get away.
  const caught = single?.isImposter ? [single.id] : [];
  const bountyHits = round.players
    .filter((p) => p.role === 'bounty' && votes[p.id] === p.target)
    .map((p) => p.id);
  let outcome: Outcome = 'imposter';
  if (caught.length > 0) outcome = 'crew';
  else if (single?.role === 'jester') outcome = 'jester'; // the jester wants to be voted out
  return { top, caught, bountyHits, outcome };
}
