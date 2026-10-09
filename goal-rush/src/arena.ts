// Per-theme layout (spawn spots, obstacles) and scenery/HUD drawing.
import { bricks, cloud, drawFlag, hills, outlineText, rr, vGradient, type Ctx } from './draw';
import { makeWorld, SCREEN, type Obstacle, type Vec, type World } from './physics';
import { C, type FlagId, type ThemeId } from './theme';

export interface Layout {
  bot: Vec;
  player: Vec;
  obstacles: Obstacle[];
  pickup: Vec | null;
}

const LEDGE_L: Obstacle = { kind: 'rect', x: -20, y: 575, w: 150, h: 90 };
const LEDGE_R: Obstacle = { kind: 'rect', x: 290, y: 450, w: 110, h: 90 };

export const LAYOUTS: Record<ThemeId, Layout> = {
  shoot: { bot: { x: 85, y: 320 }, player: { x: 305, y: 560 }, obstacles: [], pickup: null },
  battles: { bot: { x: 80, y: 300 }, player: { x: 310, y: 640 }, obstacles: [], pickup: null },
  global: {
    bot: { x: 80, y: 640 },
    player: { x: 300, y: 330 },
    obstacles: [
      { kind: 'circle', x: 195, y: 215, r: 40 },
      { kind: 'circle', x: 195, y: 724, r: 30 },
    ],
    pickup: { x: 300, y: 500 },
  },
  superstar: { bot: { x: 85, y: 535 }, player: { x: 310, y: 405 }, obstacles: [LEDGE_L, LEDGE_R], pickup: null },
};

export const worldFor = (id: ThemeId): World => makeWorld(LAYOUTS[id].obstacles);

// ------------------------------------------------------------------ backgrounds
function stripes(ctx: Ctx, color: string, w: number, h: number): void {
  ctx.fillStyle = color;
  for (let x = -h; x < w + h; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 26, 0);
    ctx.lineTo(x + 26 + h * 0.6, h);
    ctx.lineTo(x + h * 0.6, h);
    ctx.closePath();
    ctx.fill();
  }
}

function frame(ctx: Ctx, outer: string, stripe: string, inner: [string, string]): void {
  const { w, h } = SCREEN;
  ctx.fillStyle = outer;
  ctx.fillRect(0, 0, w, h);
  stripes(ctx, stripe, w, h);
  ctx.fillStyle = '#F4F2F0';
  rr(ctx, 2, 96, w - 4, 712, 30);
  ctx.fill();
  ctx.fillStyle = '#DAD6DC';
  rr(ctx, 12, 106, w - 24, 696, 24);
  ctx.fill();
  ctx.fillStyle = vGradient(ctx, 120, 790, inner[0], inner[1]);
  rr(ctx, 20, 118, w - 40, 672, 22);
  ctx.fill();
}

export function drawArena(ctx: Ctx, id: ThemeId, t: number): void {
  const { w, h } = SCREEN;
  if (id === 'shoot') {
    frame(ctx, C.orangeRed, 'rgba(255,255,255,0.12)', ['#7FC8F5', '#B5E2FA']);
    ctx.save();
    rr(ctx, 20, 118, w - 40, 672, 22);
    ctx.clip();
    cloud(ctx, 40 + ((t * 6) % 40), 560, 1.2, 'rgba(255,255,255,0.55)');
    hills(ctx, 640, w, '#A9CCE6', 18, 0.5);
    hills(ctx, 700, w, '#7FAFD0', 14, 2);
    ctx.restore();
  } else if (id === 'battles') {
    ctx.fillStyle = vGradient(ctx, 0, h, '#7FD6FF', '#2D9BFF');
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 300, 0, h);
    g.addColorStop(0, '#FFC21A');
    g.addColorStop(1, '#FF8A00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w, 300);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.lineTo(0, 700);
    ctx.closePath();
    ctx.fill();
    const glow = ctx.createRadialGradient(w * 0.7, h - 40, 10, w * 0.7, h - 40, 220);
    glow.addColorStop(0, 'rgba(255,240,120,0.75)');
    glow.addColorStop(1, 'rgba(255,240,120,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, h - 300, w, 300);
  } else if (id === 'global') {
    ctx.fillStyle = vGradient(ctx, 0, h, '#F5C95A', '#F0B040');
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,240,180,0.35)';
    for (let x = 30; x < w; x += 110) ctx.fillRect(x, 0, 44, h);
    cloud(ctx, 30 + ((t * 5) % 60), 600, 1.4, 'rgba(255,245,215,0.7)');
    hills(ctx, 690, w, 'rgba(206,160,90,0.55)', 16, 1);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 770, w, 14);
    ctx.fillStyle = vGradient(ctx, 784, h, '#6FA0F0', '#4E86E0');
    ctx.fillRect(0, 784, w, h - 784);
  } else {
    // superstar: stone walls around a purple arena
    bricks(ctx, 0, 0, w, h);
    ctx.fillStyle = '#F4F2F0';
    rr(ctx, 4, 100, w - 8, 700, 28);
    ctx.fill();
    ctx.fillStyle = vGradient(ctx, 120, 790, '#B79BFF', '#8D6BE8');
    rr(ctx, 14, 112, w - 28, 676, 22);
    ctx.fill();
    ctx.save();
    rr(ctx, 14, 112, w - 28, 676, 22);
    ctx.clip();
    cloud(ctx, 220 - ((t * 5) % 50), 650, 1.2, 'rgba(236,226,255,0.6)');
    hills(ctx, 700, w, '#A88BEA', 16, 1.2);
    hills(ctx, 745, w, '#9373DA', 12, 0.3);
    // spotlight from the top-left
    ctx.fillStyle = 'rgba(80,110,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(70, 120);
    ctx.lineTo(120, 120);
    ctx.lineTo(290, 420);
    ctx.lineTo(210, 420);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function drawObstacles(ctx: Ctx, id: ThemeId, t: number): void {
  const lay = LAYOUTS[id];
  for (const o of lay.obstacles) {
    if (o.kind === 'rect') {
      bricks(ctx, o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#F4F2F0';
      ctx.fillRect(o.x, o.y - 6, o.w, 8);
      continue;
    }
    if (o.y < 400) {
      // rounded diamond block with a white lower edge
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(Math.PI / 4);
      const s = o.r * 1.45;
      ctx.fillStyle = '#F2F2F6';
      rr(ctx, -s / 2, -s / 2 + 14, s, s, 16);
      ctx.fill();
      ctx.fillStyle = C.periwinkle;
      rr(ctx, -s / 2, -s / 2, s, s, 16);
      ctx.fill();
      ctx.restore();
    } else {
      // floor spike
      ctx.fillStyle = '#F2F2F6';
      ctx.beginPath();
      ctx.moveTo(o.x - 56, 772);
      ctx.lineTo(o.x, 676);
      ctx.lineTo(o.x + 56, 772);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.periwinkle;
      ctx.beginPath();
      ctx.moveTo(o.x - 46, 772);
      ctx.lineTo(o.x, 694);
      ctx.lineTo(o.x + 46, 772);
      ctx.closePath();
      ctx.fill();
    }
  }
  void t;
}

// ------------------------------------------------------------------ HUD
export interface HudSide {
  name: string;
  flag: FlagId;
  score: number;
  rounds: number;
}

function card(ctx: Ctx, x: number, side: 'opp' | 'me', info: HudSide, mode: 'score' | 'slots', target: number): void {
  const y = 8;
  const w = 108;
  const h = 104;
  const tint = side === 'opp' ? ['rgba(255,150,130,0.92)', 'rgba(255,110,90,0.8)'] : ['rgba(150,175,255,0.92)', 'rgba(110,140,255,0.8)'];
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.35, tint[0]);
  g.addColorStop(1, tint[1]);
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = side === 'opp' ? '#B8584C' : '#4A5FB8';
  ctx.stroke();
  const cx = x + w / 2;
  ctx.beginPath();
  ctx.arc(cx, y + 31, 29, 0, Math.PI * 2);
  ctx.fillStyle = '#4BE02F';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1b5a14';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, y + 31, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  drawFlag(ctx, info.flag, cx, y + 31, 21);
  outlineText(ctx, info.name, cx, y + 70, 17, C.navy, 'rgba(255,255,255,0.85)', '"Baloo 2"');
  if (mode === 'score') {
    outlineText(ctx, `${info.score}/${target}`, cx, y + 90, 19, C.navy, 'rgba(255,255,255,0.85)', '"Baloo 2"');
  } else {
    // round-win slots, filled when a round is won
    const slotY = y + 90;
    for (let i = 0; i < 3; i++) {
      const sx = cx - 30 + i * 30;
      ctx.beginPath();
      ctx.arc(sx, slotY, 11, 0, Math.PI * 2);
      ctx.fillStyle = i < info.rounds ? C.gold : side === 'opp' ? 'rgba(220,100,90,0.55)' : 'rgba(110,100,200,0.5)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = i < info.rounds ? '#B88A00' : 'rgba(0,0,0,0.12)';
      ctx.stroke();
    }
  }
}

export function drawHud(ctx: Ctx, id: ThemeId, hudMode: 'score' | 'slots', opp: HudSide, me: HudSide, target: number): void {
  void id;
  card(ctx, 10, 'opp', opp, hudMode, target);
  card(ctx, SCREEN.w - 118, 'me', me, hudMode, target);
}
