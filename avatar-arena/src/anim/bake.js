// יוצר מראש (בטעינה) פריימים מהאיור הבודד של כל דמות, בעיוות רשת היררכי לפי השלד ב-src/data/rigs.js.
// כל חלק זז בנפרד: ראש (הטיה/הנהון), פלג גוף (סיבוב ונדנוד), לכל יד כתף ומרפק, לכל רגל ירך, ברך וקרסול.
// המשחק עצמו רק מחליף בין פריימים מוכנים.
import { CHARACTERS } from '../data/characters.js';
import { RIGS } from '../data/rigs.js';

export const PAD = 14;      // שוליים למתיחה (בצדדים ולמעלה), בפיקסלים של הספרייט
export const BAKE_SCALE = 0.5; // הפריימים נאפים בחצי רזולוציה
const CELL = 6;             // גודל תא ברשת
const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const clamp01 = (t) => Math.max(0, Math.min(1, t));

// ---- הגדרת פריימים (זוויות ברדיאנים) ----
// torso/head/sway/bob: גוף. arm[i] = {s: כתף, e: מרפק}. leg[i] = {h: ירך, k: ברך, a: קרסול}.
// *f = "קדימה": הקוד כופל בכיוון שהדמות פונה אליו ובסימן היד, כך שזה נכון לכל דמות.
const F = (o = {}) => ({ torso: 0, head: 0, sway: 0, bob: 0, torsoF: 0, headF: 0, strike: 0, strikeE: 0, off: 0,
  arm: [{ s: 0, e: 0 }, { s: 0, e: 0 }], leg: [{ h: 0, k: 0, a: 0 }, { h: 0, k: 0, a: 0 }], stepF: 0, kneeBoth: 0, legF: 0, legK: 0, ...o });

const walk = Array.from({ length: 8 }, (_, i) => {
  const p = (i / 8) * Math.PI * 2, s = Math.sin(p), c = Math.cos(p);
  const sL = Math.sin(p + Math.PI), cL = Math.cos(p + Math.PI);
  return F({
    torso: 0.05 * s, head: 0.07 * Math.sin(p - 0.9), bob: -3 * Math.abs(s) + 1, sway: 1.2 * s,
    leg: [{ h: 0.24 * s, k: 0.42 * Math.max(0, c), a: -0.2 * s }, { h: 0.24 * sL, k: 0.42 * Math.max(0, cL), a: -0.2 * sL }],
    arm: [{ s: 0.3 * sL, e: 0.3 * Math.max(0, sL) }, { s: 0.3 * s, e: 0.3 * Math.max(0, s) }],
  });
});
const idle = Array.from({ length: 6 }, (_, i) => {
  const p = (i / 6) * Math.PI * 2;
  return F({
    torso: 0.02 * Math.sin(p), head: 0.035 * Math.sin(p - 0.8), bob: 1.8 * Math.sin(p),
    arm: [{ s: 0.06 * Math.sin(p + 1), e: 0.08 * (1 + Math.sin(p)) / 2 }, { s: -0.06 * Math.sin(p + 1), e: 0.08 * (1 - Math.sin(p)) / 2 }],
    leg: [{ h: 0, k: 0.04 * (1 + Math.sin(p)), a: 0 }, { h: 0, k: 0.04 * (1 - Math.sin(p)), a: 0 }],
  });
});
const jump = [F({
  torsoF: -0.05, head: 0, bob: 0,
  arm: [{ s: -0.3, e: 0.3 }, { s: 0.3, e: 0.3 }],
  leg: [{ h: 0.25, k: 0.6, a: -0.2 }, { h: -0.15, k: 0.45, a: 0.2 }],
})];
// אנימציות מכות (8 פריימים, שלושה רבעים הכנה ורבע התאוששות). *F = קדימה (הקוד כופל בכיוון הדמות)
const seq = (o) => Array.from({ length: 8 }, (_, i) => F(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v[i] : v]))));
// m1: יריה עם שתי ידיים. הכנה ארוכה (ידיים נאספות לחזה, גוף אחורה, ברכיים כפופות) ואז דחיפה
const m1 = seq({ off: 1, strike: [-0.15, -0.4, -0.7, -0.9, -1.0, 0.95, 0.7, 0.3], strikeE: [0.4, 0.6, 0.8, 0.9, 0.9, 0, 0.1, 0.2],
  torsoF: [-0.04, -0.1, -0.16, -0.2, -0.22, 0.2, 0.12, 0.04], headF: [0.05, 0.08, 0.1, 0.1, 0.1, -0.1, -0.05, 0],
  kneeBoth: [0.05, 0.12, 0.2, 0.26, 0.28, 0.1, 0.05, 0], bob: [0, 1, 2, 3, 3, -1, 0, 0], stepF: [0, 0, 0, 0, 0, 0.12, 0.08, 0] });
// m2: מכה בקשת עם יד אחת וצעד
const m2 = seq({ strike: [-0.4, -0.8, -1, -1, 0.6, 1.0, 0.6, 0.2], strikeE: [0.4, 0.6, 0.6, 0.5, 0, 0, 0.2, 0.3],
  torsoF: [-0.1, -0.2, -0.28, -0.28, 0.1, 0.28, 0.18, 0.05], stepF: [0, 0, 0, 0, 0.1, 0.22, 0.15, 0.05], headF: [0.05, 0.08, 0.1, 0.1, -0.05, -0.1, -0.05, 0] });
// m3: סיבוב סערה. גוף מתפתל, ידיים פרוסות לצדדים
const m3 = seq({ off: 1, strike: [0.2, 0.5, 0.7, 0.7, 0.7, 0.7, 0.4, 0.1], torso: [0, 0.3, -0.3, 0.42, -0.42, 0.3, -0.15, 0],
  head: [0, -0.1, 0.1, -0.15, 0.15, -0.1, 0.05, 0], kneeBoth: [0.1, 0.24, 0.3, 0.3, 0.3, 0.24, 0.14, 0.05], bob: [0, 2, 3, 3, 3, 2, 1, 0] });
// m4: משב חזק. הכנה עמוקה לאחור ואז דחיפה קדימה עם צעד גדול
const m4 = seq({ off: 1, strike: [-0.2, -0.5, -0.9, -1.0, -1.0, 1.1, 1.0, 0.5], strikeE: [0.3, 0.5, 0.8, 0.9, 0.9, 0, 0, 0.2],
  torsoF: [-0.06, -0.14, -0.22, -0.26, -0.26, 0.3, 0.24, 0.1], stepF: [0, 0, 0, 0, 0, 0.25, 0.25, 0.1], kneeBoth: [0.05, 0.15, 0.25, 0.3, 0.3, 0.1, 0.05, 0],
  headF: [0.04, 0.08, 0.1, 0.1, 0.1, -0.12, -0.05, 0] });
// ult: ידיים מורמות מעל הראש, גוף ורגליים כפופות, ואז מכה קדימה
const ult = seq({ off: 1, strike: [-0.3, -0.8, -1.3, -1.5, -1.5, -1.5, 1.2, 0.6], strikeE: [0.2, 0.3, 0.2, 0.1, 0.1, 0.1, 0, 0.2],
  torsoF: [-0.05, -0.12, -0.2, -0.26, -0.28, -0.28, 0.3, 0.1], headF: [0, -0.1, -0.2, -0.3, -0.3, -0.3, 0.1, 0],
  kneeBoth: [0.1, 0.2, 0.3, 0.34, 0.34, 0.34, 0.1, 0.05], bob: [0, 2, 4, 5, 5, 5, -2, 0] });
// stomp (טוף): מכה חלשה, רגל מורמת, דריכה חזקה, ואז מכה שמשגרת את הקיר
const stomp = seq({ strike: [0.45, 0.9, 0.2, 0, -0.8, -1.0, 1.0, 0.3], strikeE: [0.3, 0, 0.3, 0.3, 0.6, 0.7, 0, 0.2],
  torsoF: [0.04, 0.1, -0.04, 0.02, -0.18, -0.22, 0.24, 0.06], legF: [0, 0, 0.5, 0, 0, 0, 0.1, 0], legK: [0, 0, 0.95, 0.2, 0, 0, 0, 0],
  kneeBoth: [0.05, 0.05, 0.1, 0.4, 0.25, 0.3, 0.1, 0], bob: [0, 0, -2, 5, 2, 2, -1, 0], headF: [0, 0.05, 0.05, 0.08, 0.1, 0.1, -0.1, 0] });
// פגיעה: ראש נזרק אחורה, גב מקושת, ידיים מתעופפות
const hit = [
  F({ torsoF: -0.3, headF: -0.35, arm: [{ s: 0.55, e: 0.3 }, { s: -0.55, e: 0.3 }], kneeBoth: 0.2, bob: 2 }),
  F({ torsoF: -0.2, headF: -0.2, arm: [{ s: 0.35, e: 0.2 }, { s: -0.35, e: 0.2 }], kneeBoth: 0.12, bob: 1 }),
];

export const ANIMS = { walk, idle, jump, hit, m1, m2, m3, m4, ult, stomp };
export const FRAMES = Object.fromEntries(Object.entries(ANIMS).map(([k, v]) => [k, v.length]));
export const bakedKey = (id, anim, i) => `bk_${id}_${anim}_${i}`;

function rot(p, c, a) {
  const dx = p[0] - c[0], dy = p[1] - c[1], co = Math.cos(a), si = Math.sin(a);
  return [c[0] + dx * co - dy * si, c[1] + dx * si + dy * co];
}

// עוזר: סימן ה"קדימה" של יד, כך שזווית חיובית*סימן מניעה את כף היד לכיוון שהדמות פונה אליו
function armForward(a, faces) {
  const vy = a.h[1] - a.s[1];
  return Math.abs(vy) < 6 ? (a.e[1] > a.s[1] ? -1 : 1) * faces : Math.sign(-vy * faces);
}

function makeWarp(rig, H, fr, faces) {
  const strikeI = rig.strike ?? 0;
  const armFw = rig.arms.map((a) => armForward(a, faces));
  return (x, y) => {
    let cp = [x, y];
    const mix = (w, np) => { if (w > 0.001) cp = [cp[0] + w * (np[0] - cp[0]), cp[1] + w * (np[1] - cp[1])]; };

    // רגליים: קרסול, ברך, ירך. משקל לפי גובה וצד
    const wy = smooth((y - (rig.hipY - 10)) / 20);
    const sR = smooth((x - (rig.cx - 14)) / 28);
    const frontLeg = faces > 0 ? 0 : 1;
    rig.legs.forEach((L, i) => {
      const side = i === 0 ? sR : 1 - sR;
      const w = wy * side;
      const st = (fr.stepF ? (i === frontLeg ? -faces * fr.stepF : faces * fr.stepF * 0.6) : 0) + (i === frontLeg ? -faces * fr.legF : 0);
      const p = fr.leg[i];
      mix(w * smooth((y - L.ankle[1]) / 10 + 0.5), rot(cp, L.ankle, p.a));
      mix(w * smooth((y - L.knee[1]) / 16 + 0.5), rot(cp, L.knee, p.k + fr.kneeBoth * (i === frontLeg ? 1 : -0.6) + (i === frontLeg ? fr.legK : 0)));
      mix(w, rot(cp, L.hip, p.h + st));
    });

    // ידיים: מרפק ואז כתף. היד המכה מקבלת את תנועת ההתקפה/היכולת
    rig.arms.forEach((a, i) => {
      const [x0, y0, x1, y1] = a.box, f = 10;
      const m = smooth((x - x0) / f) * smooth((x1 - x) / f) * smooth((y - y0) / f) * smooth((y1 - y) / f);
      if (m <= 0.001) return;
      const ux = a.e[0] - a.s[0], uy = a.e[1] - a.s[1], ul = Math.hypot(ux, uy) || 1;
      const proj = ((x - a.e[0]) * ux + (y - a.e[1]) * uy) / ul;
      const we = m * smooth(proj / 14 + 0.5);
      const isStrike = i === strikeI, both = fr.off > 0;
      const amp = a.amp ?? 1;
      let s = fr.arm[i].s * a.dir * amp, e = fr.arm[i].e * a.eb * amp;
      if (isStrike || both) { s += armForward(a, faces) * fr.strike; e += a.eb * fr.strikeE; }
      else if (fr.strike) { s += -armForward(a, faces) * fr.strike * 0.45; e += a.eb * 0.25; }
      mix(we, rot(cp, a.e, e));
      mix(m, rot(cp, a.s, s));
    });

    // ראש: מעל הצוואר
    mix(smooth((rig.neckY - y) / 16), rot(cp, [rig.cx, rig.neckY], fr.head + faces * fr.headF));
    // פלג גוף: סיבוב סביב הירכיים, מלא מעל הירכיים (כולל ראש וידיים)
    mix(smooth((rig.hipY - y) / 20), rot(cp, [rig.cx, rig.hipY], fr.torso + faces * fr.torsoF));
    // נדנוד גוף: דועך לאפס ברגליים (הרגליים נשארות על הקרקע)
    const bw = y < rig.hipY ? 1 : Math.max(0, (H - y) / (H - rig.hipY));
    return [cp[0] + fr.sway * bw, cp[1] + fr.bob * bw];
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

function bakeFrame(img, w, h, rig, fr, occInfo, faces) {
  const S = BAKE_SCALE, cw = Math.ceil((w + PAD * 2) * S), ch = Math.ceil((h + PAD) * S);
  const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
  const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
  const warp = makeWarp(rig, h, fr, faces);
  const { occ, nx, ny } = occInfo;
  const verts = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) verts.push(warp(i * CELL, j * CELL));
  const V = (i, j) => verts[j * (nx + 1) + i];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!occ[j * nx + i]) continue;
    const a = V(i, j), b = V(i + 1, j), d = V(i, j + 1);
    g.setTransform(S * (b[0] - a[0]) / CELL, S * (b[1] - a[1]) / CELL, S * (d[0] - a[0]) / CELL, S * (d[1] - a[1]) / CELL, S * (a[0] + PAD), S * (a[1] + PAD));
    const sx = i * CELL, sy = j * CELL, sw = Math.min(CELL, w - sx), sh = Math.min(CELL, h - sy);
    g.drawImage(img, sx, sy, sw, sh, 0, 0, sw + 0.7, sh + 0.7); // חפיפה קטנה נגד סדקים
  }
  return canvas;
}

export function bakeFor(scene, ids) {
  CHARACTERS.filter((c) => ids.includes(c.id)).forEach((def) => {
    const rig = RIGS[def.id];
    const key = 'spr_' + def.id;
    if (!rig || !scene.textures.exists(key) || scene.textures.exists(bakedKey(def.id, 'walk', 0))) return;
    const img = scene.textures.get(key).getSourceImage();
    const w = img.width, h = img.height;
    const occInfo = occupancy(img, w, h);
    Object.entries(ANIMS).forEach(([anim, frames]) => {
      frames.forEach((fr, i) => scene.textures.addCanvas(bakedKey(def.id, anim, i), bakeFrame(img, w, h, rig, fr, occInfo, def.faces)));
    });
  });
}
