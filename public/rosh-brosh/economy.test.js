import { describe, it, expect } from 'vitest';
import { defaultSave, tickEnergy, spendEnergy, energyCountdownMs, rewards, pickQuestion, ENERGY_MS, MAX_ENERGY } from './economy.js';
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
