// Canvas drawing primitives: blobs, balls, goal, flags and effects. No game state in here.
import { C, type FlagId } from './theme';

export type Ctx = CanvasRenderingContext2D;

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

export function vGradient(ctx: Ctx, y0: number, y1: number, a: string, b: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}

export function outlineText(ctx: Ctx, text: string, x: number, y: number, size: number, fill = '#fff', stroke: string = C.ink, family = 'Bangers'): void {
  ctx.save();
  ctx.font = `${size}px ${family}, Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size / 5);
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  const r = f(n >> 16);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function capsule(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, w: number, fill: string): void {
  ctx.lineCap = 'round';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = w + 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = w;
  ctx.stroke();
}

export type Pose = 'stand' | 'fall' | 'dizzy' | 'kick' | 'hold';
export type AddonId = 'ad-none' | 'ad-cone' | 'ad-helmet' | 'ad-phones' | 'ad-tophat' | 'ad-jester' | string;

export interface BlobOpts {
  x: number;
  y: number;
  s?: number; // scale, 1 = head radius 22
  color: string;
  addon?: AddonId;
  jersey?: string;
  number?: string;
  pigtails?: boolean;
  suit?: boolean;
  pose?: Pose;
  look?: { x: number; y: number };
  rot?: number;
  flip?: boolean;
  t?: number;
}

export function drawBlob(ctx: Ctx, o: BlobOpts): void {
  const s = o.s ?? 1;
  const pose = o.pose ?? 'stand';
  const t = o.t ?? 0;
  const bob = Math.sin(t * 3) * 2;
  ctx.save();
  ctx.translate(o.x, o.y + bob * s);
  ctx.rotate(o.rot ?? 0);
  ctx.scale((o.flip ? -1 : 1) * s, s);
  ctx.lineJoin = 'round';

  const dark = shade(o.color, -45);
  const armUp = pose === 'fall' ? -1 : pose === 'hold' ? 0.5 : 0;
  // legs
  const kick = pose === 'kick' ? 16 : 0;
  capsule(ctx, -8, 18, -11, 40, 11, dark);
  capsule(ctx, 8, 18, 11 + kick, 40 - kick * 0.2, 11, dark);
  // body
  ctx.fillStyle = o.color;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 4, 19, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (o.suit) {
    ctx.fillStyle = '#4a4a4f';
    ctx.beginPath();
    ctx.ellipse(0, 6, 17, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.lineTo(0, -4);
    ctx.lineTo(10, -14);
    ctx.lineTo(6, -18);
    ctx.lineTo(-6, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0202b';
    ctx.beginPath();
    ctx.moveTo(-3, -8);
    ctx.lineTo(3, -8);
    ctx.lineTo(5, 12);
    ctx.lineTo(0, 17);
    ctx.lineTo(-5, 12);
    ctx.closePath();
    ctx.fill();
  } else if (o.jersey) {
    ctx.fillStyle = o.jersey;
    ctx.beginPath();
    ctx.ellipse(0, 6, 17.5, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = shade(o.jersey, -50);
    ctx.lineWidth = 2;
    ctx.stroke();
    if (o.number) {
      ctx.fillStyle = shade(o.jersey, -90);
      ctx.font = '800 15px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.number, 0, 5);
    }
  }
  // arms
  const ay = pose === 'fall' ? -6 : 0;
  capsule(ctx, -15, -6, -30, 12 + armUp * 26 + ay, 10, o.color);
  capsule(ctx, 15, -6, 30, 12 + armUp * 26 + ay, 10, o.color);

  // head
  const hg = ctx.createRadialGradient(-8, -42, 3, 0, -30, 26);
  hg.addColorStop(0, shade(o.color, 55));
  hg.addColorStop(1, o.color);
  ctx.fillStyle = hg;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -30, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (o.pigtails) {
    ctx.fillStyle = '#FFD21F';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx * 18, -48);
      ctx.bezierCurveTo(sx * 46, -58, sx * 44, -30, sx * 30, -24);
      ctx.bezierCurveTo(sx * 30, -34, sx * 22, -40, sx * 18, -42);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, -48, 18, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  }

  // googly eyes
  const look = o.look ?? { x: 0.4, y: -0.3 };
  const ll = Math.hypot(look.x, look.y) || 1;
  const lx = (look.x / ll) * 3.4;
  const ly = (look.y / ll) * 3.4;
  for (const ex of [-9.5, 9.5]) {
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(ex, -32, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (pose === 'dizzy') {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ex - 5, -37);
      ctx.lineTo(ex + 5, -27);
      ctx.moveTo(ex + 5, -37);
      ctx.lineTo(ex - 5, -27);
      ctx.stroke();
    } else {
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(ex + lx, -32 + ly, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex + lx - 1.6, -33.6 + ly, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawAddon(ctx, o.addon ?? 'ad-none');

  if (pose === 'dizzy') {
    ctx.fillStyle = '#FFE24A';
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + (i * Math.PI * 2) / 3;
      star(ctx, Math.cos(a) * 26, -58 + Math.sin(a) * 6, 6);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [cx, cy, r] of [[-26, -50, 8], [-20, -60, 7], [26, -52, 7]] as const) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function star(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawAddon(ctx: Ctx, id: AddonId): void {
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = C.ink;
  switch (id) {
    case 'ad-cone': {
      // actual cone: narrow top, wide base
      ctx.fillStyle = '#FF7A1A';
      ctx.beginPath();
      ctx.moveTo(-5, -82);
      ctx.lineTo(5, -82);
      ctx.lineTo(13, -52);
      ctx.lineTo(-13, -52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-8, -70, 16, 5);
      ctx.fillRect(-11, -61, 22, 5);
      ctx.fillStyle = '#FF7A1A';
      rr(ctx, -17, -54, 34, 6, 3);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'ad-helmet': {
      ctx.fillStyle = '#5E9B3C';
      ctx.beginPath();
      ctx.arc(0, -42, 25, Math.PI, 0);
      ctx.lineTo(25, -38);
      ctx.lineTo(-25, -38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7DBB57';
      ctx.beginPath();
      ctx.ellipse(-8, -56, 9, 5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3d6b27';
      ctx.beginPath();
      ctx.moveTo(-25, -38);
      ctx.lineTo(-26, -26);
      ctx.moveTo(25, -38);
      ctx.lineTo(26, -26);
      ctx.stroke();
      break;
    }
    case 'ad-phones': {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, -32, 25, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.strokeStyle = '#FFD21F';
      ctx.lineWidth = 4.5;
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = C.ink;
      ctx.fillStyle = '#FF5FB0';
      for (const sx of [-1, 1]) {
        rr(ctx, sx * 25 - 6, -42, 12, 22, 6);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case 'ad-tophat': {
      ctx.fillStyle = '#1b1b1d';
      rr(ctx, -26, -57, 52, 8, 4);
      ctx.fill();
      ctx.stroke();
      rr(ctx, -15, -88, 30, 34, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3a3a40';
      ctx.fillRect(-15, -63, 30, 5);
      // curly moustache
      ctx.fillStyle = '#1b1b1d';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.bezierCurveTo(-8, -26, -18, -24, -20, -17);
      ctx.bezierCurveTo(-14, -19, -7, -17, 0, -15);
      ctx.bezierCurveTo(7, -17, 14, -19, 20, -17);
      ctx.bezierCurveTo(18, -24, 8, -26, 0, -20);
      ctx.fill();
      break;
    }
    case 'ad-jester': {
      ctx.fillStyle = '#E8262B';
      ctx.beginPath();
      ctx.moveTo(-22, -48);
      ctx.bezierCurveTo(-34, -70, -26, -84, -12, -88);
      ctx.bezierCurveTo(-12, -74, -4, -62, 2, -52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2B55E0';
      ctx.beginPath();
      ctx.moveTo(22, -48);
      ctx.bezierCurveTo(34, -70, 26, -84, 12, -88);
      ctx.bezierCurveTo(12, -74, 4, -62, -2, -52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFD21F';
      for (const sx of [-12, 12]) {
        ctx.beginPath();
        ctx.arc(sx, -88, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      rr(ctx, -23, -54, 46, 8, 4);
      ctx.fill();
      ctx.stroke();
      break;
    }
    default:
  }
}

// ---------------------------------------------------------------- balls
export type BallSkin = 'ball-classic' | 'ball-gold' | 'ball-flame' | 'ball-melon' | 'ball-neon' | 'ball-planet' | 'ball-seam' | string;

function pentagon(ctx: Ctx, x: number, y: number, r: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = rot + (i * Math.PI * 2) / 5;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

export function drawBall(ctx: Ctx, x: number, y: number, r: number, skin: BallSkin, spin = 0, sticker = false): void {
  ctx.save();
  ctx.translate(x, y);
  if (sticker) {
    ctx.beginPath();
    ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.save();
  ctx.clip();
  ctx.rotate(spin);
  let base = '#fff';
  let patch = '#1a1a1a';
  if (skin === 'ball-gold') [base, patch] = ['#FFD84A', '#B8860B'];
  else if (skin === 'ball-flame') [base, patch] = ['#FF8A1F', '#D6200F'];
  else if (skin === 'ball-melon') [base, patch] = ['#35A64A', '#14692A'];
  else if (skin === 'ball-neon') [base, patch] = ['#5CF2FF', '#FF2BD6'];
  else if (skin === 'ball-planet') [base, patch] = ['#3FA9FF', '#3DDC4A'];
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.25, base);
  g.addColorStop(1, shade(base === '#fff' ? '#d8d8d8' : base, -35));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  if (skin === 'ball-melon') {
    ctx.strokeStyle = '#0d4a1c';
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.32, -r);
      ctx.bezierCurveTo(i * r * 0.6, -r * 0.4, i * r * 0.6, r * 0.4, i * r * 0.32, r);
      ctx.stroke();
    }
  } else if (skin === 'ball-seam') {
    ctx.strokeStyle = '#D6200F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-r * 1.1, 0, r * 0.95, -0.9, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 1.1, 0, r * 0.95, Math.PI - 0.9, Math.PI + 0.9);
    ctx.stroke();
  } else {
    ctx.fillStyle = patch;
    pentagon(ctx, 0, 0, r * 0.38, -Math.PI / 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5 + Math.PI / 5;
      pentagon(ctx, Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98, r * 0.34, a + Math.PI);
      ctx.fill();
      ctx.strokeStyle = patch;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38);
      ctx.lineTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.lineWidth = Math.max(1.8, r * 0.1);
  ctx.strokeStyle = skin === 'ball-melon' ? '#0d4a1c' : C.ink;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- goal
export function drawGoal(ctx: Ctx, cx: number, rimY: number, halfW: number, netDepth: number, shake = 0, t = 0): void {
  const bw = halfW * 2 + 68;
  const bh = 124;
  // backboard-style frame
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#F0EEEC';
  rr(ctx, cx - bw / 2, rimY - bh - 18, bw, bh, 12);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#EE3A1E';
  ctx.lineWidth = 6;
  rr(ctx, cx - bw / 2 + 9, rimY - bh - 9, bw - 18, bh - 18, 8);
  ctx.stroke();
  rr(ctx, cx - 32, rimY - 66, 64, 44, 6);
  ctx.stroke();
  // net (diamond mesh) – behind the crossbar
  const nx = shake * Math.sin(t * 40) * 3;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - halfW, rimY);
  ctx.lineTo(cx + halfW, rimY);
  ctx.lineTo(cx + halfW * 0.72 + nx, rimY + netDepth);
  ctx.lineTo(cx - halfW * 0.72 + nx, rimY + netDepth);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 1.4;
  const step = 11;
  for (let k = -12; k <= 12; k++) {
    ctx.beginPath();
    ctx.moveTo(cx + k * step - 60 + nx * 0.5, rimY);
    ctx.lineTo(cx + k * step + 60 + nx * 0.5, rimY + 120);
    ctx.moveTo(cx + k * step + 60 + nx * 0.5, rimY);
    ctx.lineTo(cx + k * step - 60 + nx * 0.5, rimY + 120);
    ctx.stroke();
  }
  ctx.restore();
  // crossbar ring + white posts
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.ink;
  ctx.fillStyle = '#F2492B';
  ctx.beginPath();
  ctx.ellipse(cx, rimY, halfW + 6, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(40,20,20,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, rimY + 1, halfW - 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const sx of [-1, 1]) {
    ctx.fillStyle = '#fff';
    rr(ctx, cx + sx * (halfW + 4) - 4, rimY - 4, 8, netDepth + 8, 4);
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

// ---------------------------------------------------------------- flags
export function drawFlag(ctx: Ctx, id: FlagId, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const x0 = cx - r;
  const y0 = cy - r;
  const d = r * 2;
  if (id === 'uk') {
    ctx.fillStyle = '#1C3F94';
    ctx.fillRect(x0, y0, d, d);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = d * 0.2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + d, y0 + d);
    ctx.moveTo(x0 + d, y0);
    ctx.lineTo(x0, y0 + d);
    ctx.stroke();
    ctx.strokeStyle = '#D0202E';
    ctx.lineWidth = d * 0.08;
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = d * 0.34;
    ctx.beginPath();
    ctx.moveTo(cx, y0);
    ctx.lineTo(cx, y0 + d);
    ctx.moveTo(x0, cy);
    ctx.lineTo(x0 + d, cy);
    ctx.stroke();
    ctx.strokeStyle = '#D0202E';
    ctx.lineWidth = d * 0.2;
    ctx.stroke();
  } else if (id === 'us') {
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#D0202E';
      ctx.fillRect(x0, y0 + (d / 7) * i, d, d / 7 + 0.5);
    }
    ctx.fillStyle = '#2B3F94';
    ctx.fillRect(x0, y0, d * 0.55, d * 0.55);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.arc(x0 + d * (0.1 + i * 0.17), y0 + d * (0.1 + j * 0.17), d * 0.034, 0, Math.PI * 2);
        ctx.fill();
      }
  } else if (id === 'tr') {
    ctx.fillStyle = '#E30A17';
    ctx.fillRect(x0, y0, d, d);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - d * 0.06, cy, d * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E30A17';
    ctx.beginPath();
    ctx.arc(cx, cy, d * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    star(ctx, cx + d * 0.17, cy, d * 0.1);
  } else if (id === 'fr') {
    ctx.fillStyle = '#1F3C98';
    ctx.fillRect(x0, y0, d / 3 + 1, d);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x0 + d / 3, y0, d / 3 + 1, d);
    ctx.fillStyle = '#E02B3A';
    ctx.fillRect(x0 + (2 * d) / 3, y0, d / 3, d);
  } else {
    ctx.fillStyle = '#1F9A4B';
    ctx.fillRect(x0, y0, d / 3 + 1, d);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x0 + d / 3, y0, d / 3 + 1, d);
    ctx.fillStyle = '#D3262E';
    ctx.fillRect(x0 + (2 * d) / 3, y0, d / 3, d);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- scenery & effects
export function cloud(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 26 * s, y - 10 * s, 28 * s, 0, Math.PI * 2);
  ctx.arc(x + 56 * s, y, 22 * s, 0, Math.PI * 2);
  ctx.rect(x, y, 56 * s, 22 * s);
  ctx.fill();
}

export function hills(ctx: Ctx, y: number, w: number, color: string, amp: number, phase: number): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, y + amp);
  for (let x = 0; x <= w; x += 10) ctx.lineTo(x, y + Math.sin(x / 70 + phase) * amp);
  ctx.lineTo(w, 900);
  ctx.lineTo(0, 900);
  ctx.closePath();
  ctx.fill();
}

export function lightBeams(ctx: Ctx, cx: number, top: number, bottom: number, alpha: number): void {
  const cols = ['255,80,80', '255,200,60', '120,230,120', '90,200,255', '170,120,255'];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  cols.forEach((c, i) => {
    const off = (i - 2) * 16;
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, `rgba(${c},0)`);
    g.addColorStop(1, `rgba(${c},${alpha})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx + off * 0.4 - 10, top);
    ctx.lineTo(cx + off * 0.4 + 10, top);
    ctx.lineTo(cx + off + 16, bottom);
    ctx.lineTo(cx + off - 16, bottom);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

export function bricks(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#BDB39C';
  ctx.fillRect(x, y, w, h);
  const bh = 22;
  const bw = 46;
  for (let row = 0; row * bh < h + bh; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col * bw < w + bw; col++) {
      const bx = x + col * bw + off;
      const by = y + row * bh;
      ctx.fillStyle = (row * 7 + col * 3) % 5 === 0 ? '#A89E86' : '#B9AE96';
      rr(ctx, bx + 1.5, by + 1.5, bw - 3, bh - 3, 2);
      ctx.fill();
      ctx.strokeStyle = '#6E664F';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      if ((row + col) % 4 === 0) {
        ctx.fillStyle = 'rgba(90,150,70,0.55)';
        ctx.fillRect(bx + 8, by + bh - 6, 6, 4);
      }
    }
  }
  ctx.restore();
}

export function confetti(ctx: Ctx, t: number, w: number, h: number): void {
  const cols = ['#FF5A36', '#FFC800', '#3DDC4A', '#29B6FF', '#B06BFF', '#FF5FB0'];
  for (let i = 0; i < 70; i++) {
    const sx = (i * 97) % w;
    const speed = 60 + ((i * 53) % 90);
    const y = ((t * speed + i * 41) % (h + 40)) - 20;
    const x = sx + Math.sin(t * 2 + i) * 18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 3 + i);
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(-4, -2, 8, 4);
    ctx.restore();
  }
}
