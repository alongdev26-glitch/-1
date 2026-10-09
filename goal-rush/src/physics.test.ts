import { describe, expect, it } from 'vitest';
import { LAYOUTS, worldFor } from './arena';
import { THEME_ORDER } from './theme';
import { BALL_R, findScoringShot, launchVelocity, makeWorld, MAX_SPEED, simulateShot, stepBall, type Ball } from './physics';

describe('physics', () => {
  it('a ball dropped straight into the mouth scores', () => {
    const w = makeWorld();
    const b: Ball = { x: 195, y: 300, vx: 0, vy: 0, r: BALL_R };
    let ev = null;
    for (let i = 0; i < 600 && ev !== 'goal' && ev !== 'out'; i++) ev = stepBall(b, 1 / 120, w);
    expect(ev).toBe('goal');
  });

  it('a ball dropped outside the rim does not score', () => {
    const w = makeWorld();
    const b: Ball = { x: 300, y: 300, vx: 0, vy: 0, r: BALL_R };
    let ev = null;
    for (let i = 0; i < 1200 && ev !== 'goal' && ev !== 'out'; i++) ev = stepBall(b, 1 / 120, w);
    expect(ev).toBe('out');
  });

  it('walls bounce the ball back inside the arena', () => {
    const w = makeWorld();
    const b: Ball = { x: 100, y: 500, vx: -900, vy: 0, r: BALL_R };
    for (let i = 0; i < 30; i++) stepBall(b, 1 / 120, w);
    expect(b.x).toBeGreaterThanOrEqual(w.left + BALL_R);
    expect(b.vx).toBeGreaterThan(0);
  });

  it('launch velocity is capped', () => {
    const v = launchVelocity({ x: 900, y: -900 });
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(MAX_SPEED, 3);
  });

  it('every spawn position has a scoring shot (so the bot can score)', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const id of THEME_ORDER) {
      const w = worldFor(id);
      for (const spot of [LAYOUTS[id].bot, LAYOUTS[id].player]) {
        const from = { x: spot.x + (spot.x < 195 ? 30 : -30), y: spot.y + 22 };
        const v = findScoringShot(from, w, rnd, 600);
        expect(v, `${id} ${spot.x},${spot.y}`).not.toBeNull();
        expect(simulateShot(from, v!, w).scored).toBe(true);
      }
    }
  });
});
