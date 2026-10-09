// Pure ball physics + shot simulation (no DOM), shared by the match, the bot and the tests.
export interface Vec {
  x: number;
  y: number;
}

export interface Ball extends Vec {
  vx: number;
  vy: number;
  r: number;
}

export type Obstacle =
  | { kind: 'circle'; x: number; y: number; r: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number };

export interface Goal {
  cx: number;
  rimY: number;
  halfW: number;
  netDepth: number;
}

export interface World {
  goal: Goal;
  obstacles: Obstacle[];
  left: number;
  right: number;
  top: number;
  floor: number;
}

export const GRAVITY = 1500;
export const BALL_R = 16;
export const MAX_SPEED = 1100;
export const LAUNCH_K = 5.2;
const REST_WALL = 0.62;
const REST_OBS = 0.8;
const RIM_R = 5;

export const SCREEN = { w: 390, h: 844 };

export const makeWorld = (obstacles: Obstacle[] = []): World => ({
  goal: { cx: 195, rimY: 400, halfW: 52, netDepth: 78 },
  obstacles,
  left: 22,
  right: 368,
  top: 150,
  floor: 790,
});

export type StepEvent = 'bounce' | 'goal' | 'out' | null;

function bounceOffCircle(b: Ball, cx: number, cy: number, r: number, rest: number): boolean {
  const dx = b.x - cx;
  const dy = b.y - cy;
  const dist = Math.hypot(dx, dy);
  const min = r + b.r;
  if (dist >= min || dist === 0) return false;
  const nx = dx / dist;
  const ny = dy / dist;
  b.x = cx + nx * min;
  b.y = cy + ny * min;
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) {
    b.vx -= (1 + rest) * vn * nx;
    b.vy -= (1 + rest) * vn * ny;
  }
  return true;
}

function bounceOffRect(b: Ball, o: Extract<Obstacle, { kind: 'rect' }>, rest: number): boolean {
  const px = Math.max(o.x, Math.min(b.x, o.x + o.w));
  const py = Math.max(o.y, Math.min(b.y, o.y + o.h));
  const dx = b.x - px;
  const dy = b.y - py;
  const dist = Math.hypot(dx, dy);
  if (dist >= b.r) return false;
  if (dist === 0) {
    b.y = o.y - b.r; // centre inside the rect: pop out through the top
    b.vy = -Math.abs(b.vy) * rest;
    return true;
  }
  const nx = dx / dist;
  const ny = dy / dist;
  b.x = px + nx * b.r;
  b.y = py + ny * b.r;
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) {
    b.vx -= (1 + rest) * vn * nx;
    b.vy -= (1 + rest) * vn * ny;
  }
  return true;
}

/** Advances a ball by dt seconds. Returns the most important event of the step. */
export function stepBall(b: Ball, dt: number, w: World): StepEvent {
  let ev: StepEvent = null;
  const prevY = b.y;
  b.vy += GRAVITY * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;

  if (b.x < w.left + b.r) {
    b.x = w.left + b.r;
    b.vx = Math.abs(b.vx) * REST_WALL;
    ev = 'bounce';
  } else if (b.x > w.right - b.r) {
    b.x = w.right - b.r;
    b.vx = -Math.abs(b.vx) * REST_WALL;
    ev = 'bounce';
  }
  if (b.y < w.top + b.r) {
    b.y = w.top + b.r;
    b.vy = Math.abs(b.vy) * REST_WALL;
    ev = 'bounce';
  }

  const g = w.goal;
  // rim end-points are solid, the mouth between them is open
  if (bounceOffCircle(b, g.cx - g.halfW, g.rimY, RIM_R, 0.55)) ev = 'bounce';
  if (bounceOffCircle(b, g.cx + g.halfW, g.rimY, RIM_R, 0.55)) ev = 'bounce';

  for (const o of w.obstacles) {
    const hit = o.kind === 'circle' ? bounceOffCircle(b, o.x, o.y, o.r, REST_OBS) : bounceOffRect(b, o, REST_OBS);
    if (hit) ev = 'bounce';
  }

  // inside the net the ball is slowed down
  if (b.y > g.rimY && b.y < g.rimY + g.netDepth && Math.abs(b.x - g.cx) < g.halfW) {
    b.vx *= 1 - 3 * dt;
    b.vy *= 1 - 2 * dt;
  }

  if (prevY < g.rimY && b.y >= g.rimY && b.vy > 0 && Math.abs(b.x - g.cx) < g.halfW - b.r * 0.35) return 'goal';
  if (b.y > w.floor) return 'out';
  return ev;
}

export function launchVelocity(drag: Vec): Vec {
  // slingshot: dragging back (drag = start - current) launches forward
  let vx = drag.x * LAUNCH_K;
  let vy = drag.y * LAUNCH_K;
  const sp = Math.hypot(vx, vy);
  if (sp > MAX_SPEED) {
    vx = (vx / sp) * MAX_SPEED;
    vy = (vy / sp) * MAX_SPEED;
  }
  return { x: vx, y: vy };
}

export const power = (v: Vec): number => Math.min(1, Math.hypot(v.x, v.y) / MAX_SPEED);

export interface ShotResult {
  scored: boolean;
  points: Vec[];
  time: number;
}

/** Simulates a shot to its end (goal, floor or timeout). */
export function simulateShot(from: Vec, v: Vec, w: World, maxT = 3.2, sampleEvery = 0): ShotResult {
  const b: Ball = { x: from.x, y: from.y, vx: v.x, vy: v.y, r: BALL_R };
  const dt = 1 / 120;
  const points: Vec[] = [];
  let t = 0;
  let i = 0;
  while (t < maxT) {
    const ev = stepBall(b, dt, w);
    t += dt;
    if (sampleEvery && i++ % sampleEvery === 0) points.push({ x: b.x, y: b.y });
    if (ev === 'goal') return { scored: true, points, time: t };
    if (ev === 'out') break;
  }
  return { scored: false, points, time: t };
}

/** Finds a velocity that scores from `from`, by sampling; null when none was found. */
export function findScoringShot(from: Vec, w: World, rnd: () => number = Math.random, tries = 140): Vec | null {
  for (let i = 0; i < tries; i++) {
    const ang = -Math.PI / 2 + (rnd() - 0.5) * 2.2;
    const sp = 380 + rnd() * (MAX_SPEED - 380);
    const v = { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp };
    if (simulateShot(from, v, w).scored) return v;
  }
  return null;
}
