import { describe, it, expect } from 'vitest';
import { newRound, hit, miss, LIVES } from './rules.js';

describe('חוקי סיבוב', () => {
  it('לכל שחקן 3 חיים והתור עובר אחרי כל פעולה', () => {
    const s = newRound(5, 'me');
    expect(s.lives).toEqual({ me: LIVES, bot: LIVES });
    hit(s, 'me', 0);
    expect(s.turn).toBe('bot');
    miss(s, 'bot');
    expect(s.turn).toBe('me');
    expect(s.lives.bot).toBe(2);
  });
  it('שלוש טעויות מפסידות, גם אם באמצע היו תשובות נכונות', () => {
    const s = newRound(9, 'me');
    miss(s, 'me'); hit(s, 'bot', 1);
    miss(s, 'me'); hit(s, 'bot', 2);
    expect(s.over).toBeNull();
    miss(s, 'me');
    expect(s.over).toEqual({ winner: 'bot', reason: 'lives' });
    expect(s.lives.me).toBe(0);
  });
  it('תשובה נכונה לא מחזירה חיים', () => {
    const s = newRound(9, 'me');
    miss(s, 'me'); hit(s, 'bot', 0); hit(s, 'me', 1);
    expect(s.lives.me).toBe(2);
  });
  it('כשנגמרו התשובות מי שנתן את האחרונה מנצח, לא מי שמצא יותר', () => {
    const s = newRound(4, 'me');
    hit(s, 'me', 0); hit(s, 'bot', 1); hit(s, 'me', 2);
    expect(s.over).toBeNull();
    hit(s, 'bot', 3);
    expect(s.over).toEqual({ winner: 'bot', reason: 'last' });
    expect(s.count).toBe(4);
  });
  it('אי אפשר לפעול שלא בתור, על תשובה שנמצאה, או אחרי הסוף', () => {
    const s = newRound(3, 'me');
    hit(s, 'bot', 0);
    expect(s.count).toBe(0);
    hit(s, 'me', 0);
    hit(s, 'bot', 0);
    expect(s.count).toBe(1);
    miss(s, 'me');
    expect(s.lives.me).toBe(3);
    miss(s, 'bot'); miss(s, 'me'); miss(s, 'bot'); miss(s, 'me'); miss(s, 'bot');
    expect(s.over?.winner).toBe('me');
    hit(s, 'me', 1);
    expect(s.count).toBe(1);
  });
});
