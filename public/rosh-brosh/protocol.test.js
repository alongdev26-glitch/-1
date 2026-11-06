import { describe, it, expect } from 'vitest';
import { toGuest, acceptAnswer, cleanName, flip } from './protocol.js';
import { newRound } from './rules.js';

describe('פרוטוקול אונליין', () => {
  it('הופך את נקודת המבט של האורח', () => {
    const ev = { t: 'ev', who: 'me', hit: true, text: 'x', lives: { me: 3, bot: 1 }, turn: 'bot', count: 2, ms: 10000 };
    expect(toGuest(ev)).toMatchObject({ who: 'bot', turn: 'me', lives: { me: 1, bot: 3 }, count: 2 });
    expect(toGuest({ t: 'end', winner: 'bot', reason: 'lives', score: [1, 0] })).toMatchObject({ winner: 'me', score: [0, 1] });
    expect(toGuest({ t: 'intro', round: 2, qi: 4, score: [2, 1], ms: 6000 }).score).toEqual([1, 2]);
    expect(toGuest({ t: 'final', outcome: 'win' }).outcome).toBe('lose');
    expect(toGuest({ t: 'final', outcome: 'draw' }).outcome).toBe('draw');
    expect(toGuest({ t: 'toast', text: 'a' })).toEqual({ t: 'toast', text: 'a' });
  });
  it('הפיכה כפולה מחזירה לנקודת המבט המקורית', () => {
    const ev = { t: 'ev', who: 'bot', hit: false, text: 'x', lives: { me: 2, bot: 3 }, turn: 'me', count: 0, ms: 1 };
    const once = toGuest(ev);
    const twice = { ...once, who: flip(once.who), turn: flip(once.turn), lives: { me: once.lives.bot, bot: once.lives.me } };
    expect(twice).toEqual(ev);
  });
  it('המארח מקבל תשובה מהאורח רק בתורו של האורח', () => {
    const s = newRound(5, 'me');
    expect(acceptAnswer(s, { t: 'answer', text: 'שלום' })).toBe(false);
    s.turn = 'bot';
    expect(acceptAnswer(s, { t: 'answer', text: 'שלום' })).toBe(true);
    expect(acceptAnswer(s, { t: 'answer', text: '' })).toBe(false);
    expect(acceptAnswer(s, { t: 'answer', text: 'א'.repeat(61) })).toBe(false);
    expect(acceptAnswer(s, { t: 'answer', text: 5 })).toBe(false);
    expect(acceptAnswer(s, null)).toBe(false);
    s.over = { winner: 'me', reason: 'lives' };
    expect(acceptAnswer(s, { t: 'answer', text: 'שלום' })).toBe(false);
  });
  it('שם מהיריב נחתך ומנוקה', () => {
    expect(cleanName('  דני   כהן  ')).toBe('דני כהן');
    expect(cleanName('א'.repeat(40))).toHaveLength(14);
    expect(cleanName(undefined)).toBe('שחקן');
    expect(cleanName(12)).toBe('שחקן');
  });
});
