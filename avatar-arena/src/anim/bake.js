// יוצר מראש (בטעינה) פריימים של הליכה, עמידה וקפיצה מהאיור הבודד של כל דמות,
// בעיוות רשת לפי השלד ב-src/data/rigs.js. המשחק עצמו רק מחליף בין פריימים מוכנים.
import { CHARACTERS } from '../data/characters.js';
import { RIGS } from '../data/rigs.js';

export const PAD = 14;      // שוליים למתיחה (בצדדים ולמעלה)
const CELL = 6;             // גודל תא ברשת
const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

// כל אנימציה: רשימת פריימים. לכל פריים: זוויות (ברדיאנים) ונדנוד גוף בפיקסלים
const ANIMS = {
  walk: Array.from({ length: 8 }, (_, i) => {
    const p = (i / 8) * Math.PI * 2, s = Math.sin(p);
    return { leg: 0.24 * s, arm: 0.3 * s, head: 0.05 * Math.sin(2 * p), bob: -3 * Math.abs(s) + 1 };
  }),
  idle: Array.from({ length: 6 }, (_, i) => {
    const p = (i / 6) * Math.PI * 2;
    return { leg: 0.02 * Math.sin(p), arm: 0.07 * Math.sin(p + 1), head: 0.03 * Math.sin(p + 2), bob: 1.8 * Math.sin(p) };
  }),
  jump: [{ leg: 0.3, arm: -0.32, head: 0.0, bob: 0, tuck: 0.22 }],
};
export const FRAMES = Object.fromEntries(Object.entries(ANIMS).map(([k, v]) => [k, v.length]));
export const bakedKey = (id, anim, i) => `bk_${id}_${anim}_${i}`;

function rot(px, py, cx, cy, a) {
  const dx = px - cx, dy = py - cy, c = Math.cos(a), s = Math.sin(a);
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
}

function makeWarp(rig, H, fr) {
  return (x, y) => {
    let X = x, Y = y;
    const add = (w, p) => { if (w > 0) { X += w * (p[0] - x); Y += w * (p[1] - y); } };
    // רגליים: משקל לפי גובה (מתחת לירכיים) וצד (ימין/שמאל סביב ציר האמצע)
    const wy = smooth((y - (rig.hipY - 10)) / 20);
    const sR = smooth((x - (rig.cx - 14)) / 28);
    const [pr, pl] = rig.legs;
    add(wy * sR, rot(x, y, pr[0], pr[1], fr.leg + (fr.tuck || 0)));
    add(wy * (1 - sR), rot(x, y, pl[0], pl[1], -fr.leg - (fr.tuck || 0) * 0.4));
    // זרועות: אזורים עם קצה רך
    rig.arms.forEach((a) => {
      const [x0, y0, x1, y1] = a.box, f = 10;
      const w = smooth((x - x0) / f) * smooth((x1 - x) / f) * smooth((y - y0) / f) * smooth((y1 - y) / f);
      add(w, rot(x, y, a.pivot[0], a.pivot[1], fr.arm * a.dir * (a.amp ?? 1)));
    });
    // ראש: מעל הצוואר מוטה קלות
    add(smooth((rig.neckY - y) / 16), rot(x, y, rig.cx, rig.neckY, fr.head));
    // נדנוד גוף: מלא מעל הירכיים ודועך לאפס ברגליים (הרגליים נשארות על הקרקע)
    const bw = y < rig.hipY ? 1 : Math.max(0, (H - y) / (H - rig.hipY));
    Y += fr.bob * bw;
    return [X, Y];
  };
}

function occupancy(img, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, w, h).data;
  const nx = Math.ceil(w / CELL), ny = Math.ceil(h / CELL);
  const occ = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    let on = 0;
    for (let y = Math.max(0, j * CELL - 1); y < Math.min(h, (j + 1) * CELL + 1) && !on; y++)
      for (let x = Math.max(0, i * CELL - 1); x < Math.min(w, (i + 1) * CELL + 1); x++) if (d[(y * w + x) * 4 + 3] > 8) { on = 1; break; }
    occ[j * nx + i] = on;
  }
  return { occ, nx, ny };
}

function bakeFrame(img, w, h, rig, fr, occInfo) {
  const cw = w + PAD * 2, ch = h + PAD;
  const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
  const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
  const warp = makeWarp(rig, h, fr);
  const { occ, nx, ny } = occInfo;
  const verts = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) verts.push(warp(i * CELL, j * CELL));
  const V = (i, j) => verts[j * (nx + 1) + i];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!occ[j * nx + i]) continue;
    const a = V(i, j), b = V(i + 1, j), d = V(i, j + 1);
    g.setTransform((b[0] - a[0]) / CELL, (b[1] - a[1]) / CELL, (d[0] - a[0]) / CELL, (d[1] - a[1]) / CELL, a[0] + PAD, a[1] + PAD);
    const sx = i * CELL, sy = j * CELL, sw = Math.min(CELL, w - sx), sh = Math.min(CELL, h - sy);
    g.drawImage(img, sx, sy, sw, sh, 0, 0, sw + 0.7, sh + 0.7); // חפיפה קטנה נגד סדקים
  }
  return canvas;
}

export function bakeAll(scene) {
  CHARACTERS.forEach((def) => {
    const rig = RIGS[def.id];
    const key = 'spr_' + def.id;
    if (!rig || !scene.textures.exists(key) || scene.textures.exists(bakedKey(def.id, 'walk', 0))) return;
    const img = scene.textures.get(key).getSourceImage();
    const w = img.width, h = img.height;
    const occInfo = occupancy(img, w, h);
    Object.entries(ANIMS).forEach(([anim, frames]) => {
      frames.forEach((fr, i) => scene.textures.addCanvas(bakedKey(def.id, anim, i), bakeFrame(img, w, h, rig, fr, occInfo)));
    });
  });
}
