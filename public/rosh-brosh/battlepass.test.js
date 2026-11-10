import { describe, it, expect } from 'vitest';
import { defaultSave, MAX_ENERGY } from './economy.js';
import { bpState, addXp, claimReward, claimable, claimAll, unlockPremium, rewardFor, xpForMatch, seasonKey, seasonDaysLeft, BP_LEVELS, XP_PER_LEVEL, PREMIUM_COST, XP } from './battlepass.js';

const now = Date.UTC(2026, 10, 10, 12);

describe('באטל פס', () => {
  it('רמות לפי XP, ועולה עד התקרה', () => {
    const s = defaultSave(0);
    expect(bpState(s, now)).toMatchObject({ level: 0, xpInLevel: 0, maxed: false });
    addXp(s, 250, now);
    expect(bpState(s, now)).toMatchObject({ level: 2, xpInLevel: 50 });
    const r = addXp(s, 40, now);
    expect(r.levelsUp).toBe(0);
    expect(addXp(s, 20, now).levelsUp).toBe(1);
    addXp(s, 99999, now);
    expect(bpState(s, now)).toMatchObject({ level: BP_LEVELS, maxed: true });
  });
  it('XP על משחק: ניצחון וסיבובים מוסיפים', () => {
    expect(xpForMatch('lose', 0)).toBe(XP.game);
    expect(xpForMatch('win', 2)).toBe(XP.game + XP.win + 2 * XP.round);
  });
  it('אפשר לקחת פרס רק ברמה שהושגה, פעם אחת', () => {
    const s = defaultSave(0);
    expect(claimReward(s, 1, 'free', now)).toBeNull();
    addXp(s, XP_PER_LEVEL, now);
    const coins = s.coins;
    expect(claimReward(s, 1, 'free', now)).toEqual({ coins: rewardFor(1, 'free').coins });
    expect(s.coins).toBe(coins + rewardFor(1, 'free').coins);
    expect(claimReward(s, 1, 'free', now)).toBeNull();
    expect(claimReward(s, 2, 'free', now)).toBeNull();
  });
  it('נתיב פרימיום נעול עד פתיחה ביהלומים', () => {
    const s = defaultSave(0);
    addXp(s, 300, now);
    expect(claimReward(s, 1, 'prem', now)).toBeNull();
    expect(unlockPremium(s, now)).toEqual({ ok: false, error: 'gems', missing: PREMIUM_COST - 50 });
    s.gems = PREMIUM_COST + 5;
    expect(unlockPremium(s, now)).toEqual({ ok: true });
    expect(s.gems).toBe(5);
    expect(unlockPremium(s, now)).toEqual({ ok: false, error: 'already' });
    expect(claimReward(s, 1, 'prem', now)).toEqual(rewardFor(1, 'prem'));
  });
  it('קבל הכול מסכם את כל הפרסים הזמינים', () => {
    const s = defaultSave(0);
    s.gems = PREMIUM_COST;
    unlockPremium(s, now);
    addXp(s, 5 * XP_PER_LEVEL, now);
    expect(claimable(s, now)).toHaveLength(10);
    const t = claimAll(s, now);
    expect(t.count).toBe(10);
    expect(t.gems).toBe(rewardFor(5, 'free').gems + rewardFor(5, 'prem').gems);
    expect(claimable(s, now)).toHaveLength(0);
  });
  it('פרס אנרגיה כשהאנרגיה מלאה הופך למטבעות', () => {
    const s = defaultSave(now);
    addXp(s, 3 * XP_PER_LEVEL, now);
    expect(rewardFor(3, 'free')).toEqual({ energy: 1 });
    expect(s.energy).toBe(MAX_ENERGY);
    const coins = s.coins;
    expect(claimReward(s, 3, 'free', now)).toEqual({ coins: 10 });
    expect(s.coins).toBe(coins + 10);
    const t = defaultSave(now);
    t.energy = 2; t.energyAt = now;
    addXp(t, 3 * XP_PER_LEVEL, now);
    expect(claimReward(t, 3, 'free', now)).toEqual({ energy: 1 });
    expect(t.energy).toBe(3);
  });
  it('עונה חדשה (חודש חדש) מאפסת הכול', () => {
    const s = defaultSave(0);
    s.gems = PREMIUM_COST;
    unlockPremium(s, now);
    addXp(s, 500, now);
    const next = Date.UTC(2026, 11, 2, 12);
    expect(seasonKey(next)).not.toBe(seasonKey(now));
    expect(bpState(s, next)).toMatchObject({ level: 0, premium: false });
    expect(seasonDaysLeft(Date.UTC(2026, 10, 30, 12))).toBe(1);
    expect(seasonDaysLeft(Date.UTC(2026, 10, 1, 0))).toBe(30);
  });
});
