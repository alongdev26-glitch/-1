// אפקטים ולוגיקת השחרור של כל מכה. נקראים מ-Fight.js ברגע השחרור (CAST) או באירוע באמצע ההכנה (EV).
import { ELEMENTS } from '../data/characters.js';

const GROUND = 348;                       // גובה פני האי (ראו Fight.js)
export { ELEMENTS };

// ---- עזרים ----
function ring(s, x, y, color, r0, r1, dur = 320, w = 4) {
  const c = s.add.circle(x, y, r0).setStrokeStyle(w, color, 0.95).setDepth(7);
  s.tweens.add({ targets: c, scale: r1 / r0, alpha: 0, duration: dur, onComplete: () => c.destroy() });
}
function slash(s, f, len, color, thick = 10, rise = 0) {
  // קשת תנועה מצוירת לפני הדמות
  const g = s.add.graphics().setDepth(7);
  const x0 = f.x + f.facing * 14, y0 = f.y - 10 + rise;
  const a0 = f.facing > 0 ? -1.0 : Math.PI - 0.6, a1 = f.facing > 0 ? 0.6 : Math.PI + 1.0;
  g.lineStyle(thick, color, 0.9).beginPath().arc(x0, y0, len * 0.55, a0, a1, false).strokePath();
  g.lineStyle(thick * 0.45, 0xffffff, 0.9).beginPath().arc(x0, y0, len * 0.55, a0 + 0.2, a1 - 0.2, false).strokePath();
  s.tweens.add({ targets: g, alpha: 0, duration: 190, onComplete: () => g.destroy() });
}
const melee = (s, f, mv, w, h, opts = {}) =>
  s.areaHit(f, { x: f.facing > 0 ? f.x + 8 : f.x - 8 - w, y: f.y - h * 0.6, w, h }, mv.dmg, mv.kb, opts);
const around = (s, f, mv, r, opts = {}) =>
  s.areaHit(f, { x: f.x - r, y: f.y - r, w: r * 2, h: r * 1.6 }, mv.dmg, mv.kb, { dir: 'away', ...opts });
function streaks(s, f, color, n, len, spread, dur = 380) {
  for (let i = 0; i < n; i++) {
    const y = f.y - 30 + (Math.random() - 0.5) * spread;
    const l = s.add.rectangle(f.x + f.facing * (24 + Math.random() * 20), y, len, 3, color, 0.8).setDepth(7);
    l.setOrigin(f.facing > 0 ? 0 : 1, 0.5);
    s.tweens.add({ targets: l, x: l.x + f.facing * (80 + Math.random() * 120), alpha: 0, scaleX: 0.3, duration: dur * (0.6 + Math.random() * 0.6), onComplete: () => l.destroy() });
  }
}
function impact(s, x, y, color, n = 10) {
  const em = s.add.particles(x, y, 'spark', { speed: { min: 80, max: 220 }, lifespan: 380, scale: { start: 1.3, end: 0 }, tint: color, emitting: false }).setDepth(8);
  em.explode(n);
  s.time.delayedCall(500, () => em.destroy());
}
function rise(s, tex, x, w, h, color, dur = 220, hold = 400) {
  // אובייקט שעולה מהקרקע ונעלם
  const o = s.add.image(x, GROUND + 6, tex).setOrigin(0.5, 1).setDisplaySize(w, 1).setTint(color).setDepth(4);
  s.tweens.add({ targets: o, displayHeight: h, duration: dur, ease: 'Back.easeOut' });
  s.time.delayedCall(hold, () => s.tweens.add({ targets: o, alpha: 0, duration: 200, onComplete: () => o.destroy() }));
  return o;
}
const nearestEnemyX = (s, f) => {
  const e = s.nearest(f);
  return e ? e.x : f.x + f.facing * 160;
};

// ---- עוזר ההטענה: ניצוצות שנשאבים אל היד ----
export function chargeSpark(s, f, color) {
  const hx = f.x + f.facing * 34, hy = f.y - 16;
  const a = Math.random() * Math.PI * 2, d = 36 + Math.random() * 26;
  const sp = s.add.image(hx + Math.cos(a) * d, hy + Math.sin(a) * d, 'spark').setTint(color).setDepth(7).setScale(1.2);
  s.tweens.add({ targets: sp, x: hx, y: hy, alpha: 0.2, scale: 0.3, duration: 200, onComplete: () => sp.destroy() });
}

// ---- אירועים באמצע ההכנה ----
export const EV = {
  weakPunch(s, f) { // טוף: מכה חלשה לפני הדריכה
    melee(s, f, { dmg: 2, kb: 90 }, 70, 56);
    slash(s, f, 70, 0xcdb48a, 6);
  },
  stompWall(s, f) { // טוף: הרגל לרצפה וקיר אדמה קטן עולה
    s.cameras.main.shake(90, 0.004);
    ring(s, f.x + f.facing * 20, GROUND, 0x8a6a3b, 10, 70, 300, 5);
    impact(s, f.x + f.facing * 20, GROUND, 0xb89a68, 10);
    f.wall = rise(s, 'fx_wall', f.x + f.facing * 58, 46, 62, 0x8a6a3b, 200, 99999);
    f.wall.setData('x', f.x + f.facing * 58);
  },
};

// ---- שחרור המכות ----
export const CAST = {
  // אנג
  airOrb(s, f, mv) {
    ring(s, f.x + f.facing * 34, f.y - 14, 0xdff3ff, 8, 52, 260);
    s.shake(0.003);
    s.shoot(f, { tex: 'fx_airorb', w: 50, h: 50, vx: 540, y: f.y - 14, dx: 34, life: 950, dmg: mv.dmg, kb: mv.kb, spin: 620, tint: 0xdff3ff, trail: 0xbfe6ff,
      glow: 0xbfe6ff, onHit: (sc, p) => { ring(sc, p.x, p.y, 0xdff3ff, 10, 70, 300); impact(sc, p.x, p.y, 0xdff3ff, 12); } });
  },
  staffSwing(s, f, mv) {
    slash(s, f, 150, 0xdff3ff, 12);
    melee(s, f, mv, 110, 80);
  },
  whirl(s, f, mv) {
    ring(s, f.x, f.y - 10, 0xdff3ff, 20, 110, 380, 6);
    ring(s, f.x, f.y - 10, 0xffffff, 10, 80, 300, 3);
    impact(s, f.x, f.y - 10, 0xdff3ff, 18);
    around(s, f, mv, 100);
  },
  gust(s, f, mv) {
    streaks(s, f, 0xdff3ff, 16, 70, 80);
    s.shake(0.004);
    melee(s, f, mv, 240, 120);
  },
  tornado(s, f, mv) { // המכה הסודית: טורנדו שסוחף את הזירה
    s.ultFlash(f, 0xbfe6ff);
    s.shoot(f, { tex: 'fx_tornado', w: 120, h: 220, vx: 310, y: GROUND - 100, dx: 50, life: 2600, dmg: mv.dmg, kb: mv.kb, pierce: true, rehit: 150,
      up: 360, tint: 0xdff3ff, trail: 0xdff3ff, glow: 0xdff3ff, wobble: true });
  },

  // קטרה
  waterBurst(s, f, mv) {
    ring(s, f.x + f.facing * 34, f.y - 14, 0x7cc4ff, 8, 56, 260);
    s.shake(0.003);
    s.shoot(f, { tex: 'fx_glow', w: 44, h: 44, vx: 470, y: f.y - 14, dx: 34, life: 800, dmg: mv.dmg, kb: mv.kb, tint: 0x6fb8ff, trail: 0x9fd6ff, glow: 0x6fb8ff,
      onHit: (sc, p) => {
        ring(sc, p.x, p.y, 0x9fd6ff, 12, 84, 340, 5); impact(sc, p.x, p.y, 0x9fd6ff, 22);
        sc.areaHit(f, { x: p.x - 60, y: p.y - 60, w: 120, h: 120 }, mv.dmg * 0.5, mv.kb * 0.6, { dir: 'away' });
      } });
    streaks(s, f, 0x9fd6ff, 8, 50, 30, 320);
  },
  waterWhip(s, f, mv) {
    slash(s, f, 200, 0x6fb8ff, 12, -6);
    impact(s, f.x + f.facing * 90, f.y - 14, 0x9fd6ff, 8);
    melee(s, f, mv, 150, 70);
  },
  iceShards(s, f, mv) {
    s.shake(0.003);
    [-0.2, 0, 0.2].forEach((a, i) => {
      s.time.delayedCall(i * 40, () => s.shoot(f, { tex: 'fx_shard', w: 38, h: 15, vx: 580 * Math.cos(a), vy: 580 * Math.sin(a), y: f.y - 16, dx: 34, life: 800,
        dmg: mv.dmg, kb: mv.kb, tint: 0xcdeeff, trail: 0xcdeeff, angleFromVel: true,
        onHit: (sc, p) => impact(sc, p.x, p.y, 0xcdeeff, 8) }));
    });
  },
  waterColumn(s, f, mv) {
    const x = f.x + f.facing * 120;
    ring(s, x, GROUND, 0x6fb8ff, 8, 80, 300, 5);
    const col = rise(s, 'fx_column', x, 64, 220, 0x6fb8ff, 180, 380);
    col.setAlpha(0.85);
    impact(s, x, GROUND - 20, 0x9fd6ff, 14);
    s.areaHit(f, { x: x - 36, y: GROUND - 230, w: 72, h: 240 }, mv.dmg, mv.kb, { up: 620, dir: f.facing });
  },
  tidalWave(s, f, mv) { // גל ענק
    s.ultFlash(f, 0x6fb8ff);
    s.shoot(f, { tex: 'fx_wave', w: 190, h: 250, vx: 520, y: GROUND - 110, dx: 40, life: 2200, dmg: mv.dmg, kb: mv.kb, pierce: true,
      up: 220, tint: 0x4aa3ff, trail: 0xbfe6ff, glow: 0x6fb8ff, onHit: (sc, p) => impact(sc, p.x, p.y, 0xbfe6ff, 16) });
  },

  // טוף
  earthWall(s, f, mv) { // הקיר שעלה באירוע stompWall משוגר במכה
    const w = f.wall; f.wall = null;
    const x = w ? w.getData('x') : f.x + f.facing * 58;
    if (w) w.destroy();
    s.cameras.main.shake(110, 0.005);
    impact(s, x, GROUND - 20, 0xb89a68, 14);
    s.shoot(f, { tex: 'fx_wall', w: 52, h: 70, vx: 380, y: GROUND - 32, x, life: 1000, dmg: mv.dmg, kb: mv.kb, tint: 0x8a6a3b, trail: 0xb89a68,
      ground: true, onHit: (sc, p) => impact(sc, p.x, p.y, 0xb89a68, 14) });
  },
  rockFist(s, f, mv) {
    slash(s, f, 110, 0xcdb48a, 10);
    ring(s, f.x + f.facing * 50, GROUND, 0x8a6a3b, 10, 80, 280, 5);
    impact(s, f.x + f.facing * 50, GROUND - 10, 0xb89a68, 12);
    s.shake(0.004);
    melee(s, f, mv, 100, 70);
  },
  earthPillar(s, f, mv) { // עמוד מתחת ליריב הקרוב (עם אזהרה קצרה)
    const x = nearestEnemyX(s, f);
    const warn = s.add.rectangle(x, GROUND + 2, 70, 6, 0xb89a68, 0.8).setDepth(4);
    s.tweens.add({ targets: warn, scaleX: 1.5, alpha: 0.2, yoyo: true, repeat: 2, duration: 90 });
    s.time.delayedCall(280, () => {
      warn.destroy();
      s.cameras.main.shake(120, 0.005);
      rise(s, 'fx_wall', x, 70, 190, 0x8a6a3b, 160, 420);
      impact(s, x, GROUND - 10, 0xb89a68, 16);
      s.areaHit(f, { x: x - 40, y: GROUND - 200, w: 80, h: 210 }, mv.dmg, mv.kb, { up: 640, dir: f.facing });
    });
  },
  rockThrow(s, f, mv) {
    s.shake(0.003);
    impact(s, f.x + f.facing * 30, f.y - 14, 0xb89a68, 8);
    s.shoot(f, { tex: 'fx_rock', w: 46, h: 46, vx: 400, vy: -300, g: 600, y: f.y - 30, dx: 30, life: 1500, dmg: mv.dmg, kb: mv.kb, spin: 480, tint: 0x8a6a3b,
      trail: 0xb89a68, onHit: (sc, p) => { impact(sc, p.x, p.y, 0xb89a68, 16); ring(sc, p.x, p.y, 0xb89a68, 10, 70, 260); } });
  },
  giantRock(s, f, mv) { // סלע עצום מתפרץ מהאדמה
    s.ultFlash(f, 0xb89a68);
    const x = nearestEnemyX(s, f);
    const warn = s.add.rectangle(x, GROUND + 2, 150, 8, 0xb89a68, 0.8).setDepth(4);
    s.tweens.add({ targets: warn, scaleX: 1.6, alpha: 0.2, yoyo: true, repeat: 3, duration: 100 });
    s.time.delayedCall(520, () => {
      warn.destroy();
      s.cameras.main.shake(260, 0.012);
      const rock = s.add.image(x, GROUND + 30, 'fx_rock').setOrigin(0.5, 1).setDisplaySize(190, 10).setTint(0x7a5c32).setDepth(6);
      s.tweens.add({ targets: rock, displayHeight: 210, displayWidth: 200, y: GROUND + 10, duration: 220, ease: 'Back.easeOut' });
      s.time.delayedCall(700, () => s.tweens.add({ targets: rock, alpha: 0, y: GROUND + 60, duration: 260, onComplete: () => rock.destroy() }));
      ring(s, x, GROUND, 0xb89a68, 20, 200, 420, 8);
      impact(s, x, GROUND - 40, 0xb89a68, 30);
      s.areaHit(f, { x: x - 110, y: GROUND - 260, w: 220, h: 280 }, mv.dmg, mv.kb, { up: 820, dir: f.facing });
    });
  },

  // זוקו
  fireFist(s, f, mv) {
    ring(s, f.x + f.facing * 34, f.y - 14, 0xffb34a, 8, 52, 240);
    s.shake(0.003);
    s.shoot(f, { tex: 'fx_fist', w: 54, h: 45, vx: 560, y: f.y - 14, dx: 34, life: 900, dmg: mv.dmg, kb: mv.kb, tint: 0xff7a1c, trail: 0xffc04a, glow: 0xff9a3a, flip: true,
      onHit: (sc, p) => { ring(sc, p.x, p.y, 0xffb34a, 10, 76, 300, 5); impact(sc, p.x, p.y, 0xffb34a, 18); } });
  },
  flameKick(s, f, mv) {
    slash(s, f, 160, 0xff8a2a, 12, 14);
    impact(s, f.x + f.facing * 80, f.y + 6, 0xffb34a, 10);
    melee(s, f, mv, 120, 74);
  },
  fireBreath(s, f, mv) {
    s.time.addEvent({ delay: 110, repeat: 3, callback: () => {
      if (!f.active) return;
      streaks(s, f, 0xff8a2a, 6, 60, 36, 300);
      const em = s.add.particles(f.x + f.facing * 30, f.y - 18, 'spark', { speedX: { min: f.facing * 120, max: f.facing * 280 }, speedY: { min: -40, max: 40 },
        lifespan: 360, scale: { start: 1.6, end: 0 }, tint: [0xffd36a, 0xff8a2a, 0xe8541c], emitting: false }).setDepth(7);
      em.explode(14);
      s.time.delayedCall(450, () => em.destroy());
      melee(s, f, mv, 170, 90);
    } });
  },
  fireWheel(s, f, mv) {
    s.shake(0.003);
    s.shoot(f, { tex: 'fx_wheel', w: 56, h: 56, vx: 330, y: GROUND - 26, dx: 30, life: 1500, dmg: mv.dmg, kb: mv.kb, pierce: true, rehit: 320, spin: 900,
      tint: 0xff7a1c, trail: 0xffc04a, glow: 0xff9a3a, ground: true });
  },
  lightning(s, f, mv) { // ברק שחוצה את הזירה
    s.ultFlash(f, 0xfff2a0);
    const dir = f.facing, x0 = f.x + dir * 30, y0 = f.y - 22, x1 = dir > 0 ? 1000 : -40;
    const g = s.add.graphics().setDepth(9);
    const draw = () => {
      g.clear();
      [[16, 0xffd84a, 0.5], [7, 0xfff2a0, 0.9], [3, 0xffffff, 1]].forEach(([w, c, a]) => {
        g.lineStyle(w, c, a).beginPath().moveTo(x0, y0);
        const segs = 16;
        for (let i = 1; i <= segs; i++) g.lineTo(x0 + ((x1 - x0) * i) / segs, y0 + (i === segs ? 0 : (Math.random() - 0.5) * 70));
        g.strokePath();
      });
    };
    draw();
    s.time.addEvent({ delay: 60, repeat: 5, callback: draw });
    s.time.delayedCall(420, () => s.tweens.add({ targets: g, alpha: 0, duration: 120, onComplete: () => g.destroy() }));
    s.cameras.main.flash(160, 255, 244, 160);
    s.areaHit(f, { x: Math.min(x0, x1), y: y0 - 80, w: Math.abs(x1 - x0), h: 160 }, mv.dmg, mv.kb, { dir });
    s.hitstop(140);
  },
};
