// באטל פס חודשי: צוברים נקודות ניסיון (XP) ממשחקים, ובכל רמה יש פרס בנתיב החינמי ובנתיב הפרימיום.
// הפרימיום נפתח ביהלומים שמרוויחים במשחק. פונקציות טהורות, כדי שאפשר יהיה לבדוק אותן.
import { MAX_ENERGY, tickEnergy } from './economy.js';

export const BP_LEVELS = 30;
export const XP_PER_LEVEL = 100;
export const PREMIUM_COST = 300;
export const XP = { game: 20, win: 30, round: 5, task: 50, daily: 10 };

export const seasonKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 7);
export function seasonDaysLeft(now = Date.now()) {
  const d = new Date(now);
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  return Math.max(1, Math.ceil((end - now) / 86400000));
}

/** הפרס של רמה בנתיב: { coins?, gems?, energy? } */
export function rewardFor(level, track) {
  if (track === 'free') {
    if (level % 5 === 0) return { gems: level === BP_LEVELS ? 50 : (level / 5) * 5 };
    if (level % 3 === 0) return { energy: 1 };
    return { coins: 10 + level * 2 };
  }
  if (level === BP_LEVELS) return { gems: 100, coins: 300 };
  if (level % 5 === 0) return { gems: level * 2, coins: 50 };
  return { coins: 30 + level * 4 };
}

/** מצב העונה. מאפס אם התחילה עונה חדשה. */
export function bpState(s, now = Date.now()) {
  const key = seasonKey(now);
  if (!s.bp || s.bp.season !== key) s.bp = { season: key, xp: 0, premium: false, free: [], prem: [] };
  const xp = Math.min(s.bp.xp, BP_LEVELS * XP_PER_LEVEL);
  const level = Math.floor(xp / XP_PER_LEVEL); // כמה רמות הושגו
  const maxed = level >= BP_LEVELS;
  return { season: key, xp, level, maxed, xpInLevel: maxed ? XP_PER_LEVEL : xp % XP_PER_LEVEL, premium: s.bp.premium, daysLeft: seasonDaysLeft(now) };
}

/** מוסיף XP. מחזיר { gained, levelsUp, level }. */
export function addXp(s, amount, now = Date.now()) {
  const before = bpState(s, now).level;
  s.bp.xp = Math.min(BP_LEVELS * XP_PER_LEVEL, s.bp.xp + Math.max(0, Math.round(amount)));
  const after = bpState(s, now).level;
  return { gained: amount, levelsUp: after - before, level: after };
}

/** XP על משחק שהסתיים. */
export function xpForMatch(outcome, roundsWon) {
  return XP.game + (outcome === 'win' ? XP.win : 0) + XP.round * Math.max(0, roundsWon);
}

export const isClaimed = (s, level, track) => (track === 'free' ? s.bp.free : s.bp.prem).includes(level);

/** אילו פרסים אפשר לקחת עכשיו: [{ level, track }] */
export function claimable(s, now = Date.now()) {
  const st = bpState(s, now);
  const out = [];
  for (let l = 1; l <= st.level; l++) {
    if (!isClaimed(s, l, 'free')) out.push({ level: l, track: 'free' });
    if (st.premium && !isClaimed(s, l, 'prem')) out.push({ level: l, track: 'prem' });
  }
  return out;
}

/** לוקח פרס אחד. מחזיר { coins, gems, energy } שנוספו בפועל, או null אם אי אפשר. */
export function claimReward(s, level, track, now = Date.now()) {
  const st = bpState(s, now);
  if (level < 1 || level > BP_LEVELS || level > st.level) return null;
  if (track === 'prem' && !st.premium) return null;
  if (track !== 'free' && track !== 'prem') return null;
  if (isClaimed(s, level, track)) return null;
  (track === 'free' ? s.bp.free : s.bp.prem).push(level);
  const r = rewardFor(level, track === 'free' ? 'free' : 'prem');
  const got = {};
  if (r.coins) { s.coins += r.coins; got.coins = r.coins; }
  if (r.gems) { s.gems += r.gems; got.gems = r.gems; }
  if (r.energy) {
    tickEnergy(s, now);
    if (s.energy >= MAX_ENERGY) { s.coins += 10; got.coins = (got.coins || 0) + 10; } // אנרגיה מלאה: מטבעות במקום
    else { s.energy += r.energy; got.energy = r.energy; }
  }
  return got;
}

/** לוקח את כל הפרסים הזמינים ומחזיר סכום כולל. */
export function claimAll(s, now = Date.now()) {
  const total = { coins: 0, gems: 0, energy: 0, count: 0 };
  for (const { level, track } of claimable(s, now)) {
    const g = claimReward(s, level, track, now);
    if (!g) continue;
    total.coins += g.coins || 0; total.gems += g.gems || 0; total.energy += g.energy || 0; total.count += 1;
  }
  return total;
}

/** פותח פרימיום ביהלומים. */
export function unlockPremium(s, now = Date.now()) {
  const st = bpState(s, now);
  if (st.premium) return { ok: false, error: 'already' };
  if (s.gems < PREMIUM_COST) return { ok: false, error: 'gems', missing: PREMIUM_COST - s.gems };
  s.gems -= PREMIUM_COST;
  s.bp.premium = true;
  return { ok: true };
}
