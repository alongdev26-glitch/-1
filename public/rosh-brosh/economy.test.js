import { describe, it, expect } from 'vitest';
import { defaultSave, tickEnergy, spendEnergy, energyCountdownMs, rewards, pickQuestion, ENERGY_MS, MAX_ENERGY } from './economy.js';
import { planBotGuesses, makeOpponent, botSkill } from './bot.js';

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
  it('מתזמן ניחושים בקצב אנושי, ללא כפילויות', () => {
    let x = 0.37;
    const rng = () => (x = (x * 9301 + 49297) % 233280 / 233280);
    const plan = planBotGuesses(12, 0.7, rng);
    expect(plan.length).toBeGreaterThan(0);
    expect(new Set(plan.map((p) => p.index)).size).toBe(plan.length);
    expect(plan[0].at).toBeGreaterThanOrEqual(2500);
    plan.forEach((p, i) => { if (i) expect(p.at - plan[i - 1].at).toBeGreaterThanOrEqual(1200); expect(p.at).toBeLessThanOrEqual(27000); });
  });
  it('יריב קרוב בגביעים', () => {
    const o = makeOpponent(100, () => 0.9);
    expect(Math.abs(o.trophies - 100)).toBeLessThanOrEqual(40);
    expect(botSkill(o)).toBeLessThanOrEqual(0.8);
  });
});
