import { describe, it, expect } from 'vitest';
import { SHOP, buyItem, dailyState, claimDailyReward, DAILY_REWARDS, freeCoinsState, claimFreeCoinsReward, FREE_COINS, FREE_COINS_MS, COST, taskState, recordWin, claimTask, TASK_GEMS, defaultSave, tickEnergy, spendEnergy, energyCountdownMs, rewards, pickQuestion, ENERGY_MS, MAX_ENERGY } from './economy.js';
import { planBotTurn, makeOpponent, botSkill } from './bot.js';

describe('אנרגיה', () => {
  it('גובה אנרגיה ומתחיל טיימר, וממלא עם הזמן', () => {
    const t0 = 1_000_000;
    const s = defaultSave(t0);
    for (let i = 0; i < MAX_ENERGY; i++) expect(spendEnergy(s, t0)).toBe(true);
    expect(spendEnergy(s, t0)).toBe(false);
    expect(energyCountdownMs(s, t0 + 1000)).toBe(ENERGY_MS - 1000);
    tickEnergy(s, t0 + ENERGY_MS * 2 + 5);
    expect(s.energy).toBe(2);
    tickEnergy(s, t0 + ENERGY_MS * 50);
    expect(s.energy).toBe(MAX_ENERGY);
  });
});
describe('פרסים ושאלות', () => {
  it('גביעים לא יורדים מתחת לאפס', () => {
    expect(rewards('lose', 3, 100).trophies).toBe(-3);
    expect(rewards('win', 100, 150).trophies).toBeGreaterThan(20);
    expect(rewards('draw', 0, 0).trophies).toBe(0);
  });
  it('לא חוזר על שאלה עד שנגמרות', () => {
    const seen = [];
    const got = new Set(Array.from({ length: 10 }, () => pickQuestion(10, seen)));
    expect(got.size).toBe(10);
    expect(pickQuestion(10, seen, [3])).not.toBe(3);
  });
});
describe('בוט', () => {
  it('תור הבוט: מחכה 2 עד 6 שניות ועונה מבין התשובות הפתוחות או מחטיא', () => {
    let a = 12345;
    const rng = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    let hits = 0;
    for (let i = 0; i < 200; i++) {
      const t = planBotTurn([2, 5, 7], 0.6, rng);
      expect(t.delay).toBeGreaterThanOrEqual(2000);
      expect(t.delay).toBeLessThanOrEqual(6000);
      if (t.index !== null) { hits++; expect([2, 5, 7]).toContain(t.index); }
    }
    expect(hits).toBeGreaterThan(80);
    expect(hits).toBeLessThan(160);
    expect(planBotTurn([], 1, rng).index).toBeNull();
    expect(planBotTurn([1], 0, rng).index).toBeNull();
  });
  it('יריב קרוב בגביעים', () => {
    const o = makeOpponent(100, () => 0.9);
    expect(Math.abs(o.trophies - 100)).toBeLessThanOrEqual(40);
    expect(botSkill(o)).toBeLessThanOrEqual(0.8);
  });
});

describe('משימה יומית', () => {
  const day1 = Date.UTC(2026, 10, 6, 10);
  const day2 = Date.UTC(2026, 10, 7, 10);
  it('מתקדמת עם ניצחונות, נלקחת פעם אחת, ומתאפסת ביום חדש', () => {
    const s = defaultSave(day1);
    expect(taskState(s, day1)).toEqual({ wins: 0, done: false, claimed: false });
    recordWin(s, day1);
    expect(claimTask(s, day1)).toBe(false);
    recordWin(s, day1);
    expect(taskState(s, day1).done).toBe(true);
    const gems = s.gems;
    expect(claimTask(s, day1)).toBe(true);
    expect(s.gems).toBe(gems + TASK_GEMS);
    expect(claimTask(s, day1)).toBe(false);
    expect(taskState(s, day2)).toEqual({ wins: 0, done: false, claimed: false });
  });
});

describe('מחירים', () => {
  it('החלפת שאלה 10 וג\'וקר 20', () => {
    expect(COST.swap).toBe(10);
    expect(COST.joker).toBe(20);
  });
});

describe('חנות', () => {
  it('קונה חבילת מטבעות ביהלומים, ולא קונה בלי מספיק', () => {
    const s = defaultSave(0);
    s.gems = 60;
    expect(buyItem(s, SHOP.coins[0])).toMatchObject({ ok: true, coins: 100 });
    expect(s.gems).toBe(50);
    expect(s.coins).toBe(200);
    expect(buyItem(s, SHOP.coins[2])).toEqual({ ok: false, error: 'gems', missing: 50 });
    expect(s.gems).toBe(50);
    expect(s.coins).toBe(200);
  });
  it('אנרגיה: לא קונים כשהיא מלאה, ממלאים וגובים יהלומים', () => {
    const t = 1_000_000;
    const s = defaultSave(t);
    expect(buyItem(s, SHOP.energy[1], t)).toEqual({ ok: false, error: 'full' });
    expect(s.gems).toBe(50);
    s.energy = 2; s.energyAt = t;
    expect(buyItem(s, SHOP.energy[0], t).ok).toBe(true);
    expect(s.energy).toBe(3);
    expect(buyItem(s, SHOP.energy[1], t).ok).toBe(true);
    expect(s.energy).toBe(5);
    expect(s.gems).toBe(50 - 5 - 20);
  });
  it('חבילות יהלומים בכסף אמיתי לא נקנות (בקרוב)', () => {
    const s = defaultSave(0);
    expect(buyItem(s, SHOP.gems[0])).toEqual({ ok: false, error: 'soon' });
    expect(s.gems).toBe(50);
  });
});

describe('פרס יומי עם רצף', () => {
  const d = (n) => Date.UTC(2026, 10, n, 12);
  it('יום ראשון נותן מטבעות בלבד, ופעם אחת ביום', () => {
    const s = defaultSave(0);
    expect(dailyState(s, d(1))).toMatchObject({ claimed: false, streak: 0, day: 1 });
    const r = claimDailyReward(s, d(1));
    expect(r).toMatchObject({ coins: DAILY_REWARDS[0].coins, gems: 0, day: 1 });
    expect(claimDailyReward(s, d(1))).toBeNull();
    expect(dailyState(s, d(1))).toMatchObject({ claimed: true, streak: 1, day: 1 });
  });
  it('ימים רצופים מעלים את היום ונותנים גם יהלומים', () => {
    const s = defaultSave(0);
    claimDailyReward(s, d(1));
    const gems = s.gems;
    const r = claimDailyReward(s, d(2));
    expect(r.day).toBe(2);
    expect(r.gems).toBe(DAILY_REWARDS[1].gems);
    expect(s.gems).toBe(gems + DAILY_REWARDS[1].gems);
  });
  it('יום שלא נלקח מאפס את הרצף, ואחרי יום 7 חוזרים ליום 1', () => {
    const s = defaultSave(0);
    claimDailyReward(s, d(1)); claimDailyReward(s, d(2));
    expect(dailyState(s, d(4))).toMatchObject({ streak: 0, day: 1 });
    expect(claimDailyReward(s, d(4)).day).toBe(1);
    const t = defaultSave(0);
    for (let i = 1; i <= 7; i++) expect(claimDailyReward(t, d(i)).day).toBe(i);
    expect(dailyState(t, d(8)).day).toBe(1);
    expect(claimDailyReward(t, d(8)).day).toBe(1);
  });
});

describe('מטבעות חינם', () => {
  it('מחכים 4 שעות בין לקיחות', () => {
    const s = defaultSave(0);
    const t = 10 * FREE_COINS_MS;
    expect(freeCoinsState(s, t).ready).toBe(true);
    expect(claimFreeCoinsReward(s, t)).toEqual({ coins: FREE_COINS });
    expect(s.coins).toBe(100 + FREE_COINS);
    expect(claimFreeCoinsReward(s, t + 1000)).toBeNull();
    expect(freeCoinsState(s, t + 1000)).toEqual({ ready: false, msLeft: FREE_COINS_MS - 1000 });
    expect(claimFreeCoinsReward(s, t + FREE_COINS_MS)).not.toBeNull();
  });
});
