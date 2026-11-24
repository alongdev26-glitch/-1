// הופך איור (קנבס או תמונה) לטקסטורת צבע + טקסטורת עומק ("כרית" לפי המרחק מהשפה).
// התוצאה נשמרת במטמון לפי מפתח, כך שכל פריים מחושב פעם אחת.
import * as THREE from 'three';
import { RIGS } from '../data/rigs.js';
import { byId } from '../data/characters.js';
import { PAD, BAKE_SCALE } from '../anim/bake.js';

const cache = new Map();

// שכבות עומק לפי השלד: היד המכה והרגל הקדמית קרובות למצלמה, היד והרגל השנייה רחוקות.
// האזורים הם של האיור המקורי. בפריימים מוכנים (bk_) ממירים לקואורדינטות שלהם. ההחלקה אחר כך מרככת אי-דיוקים.
function applyLayers(key, val, w, h) {
  const m = key.match(/^bk_([a-z]+)_/) || key.match(/^spr_([a-z]+)$/);
  const rig = m && RIGS[m[1]], def = m && byId(m[1]);
  if (!rig || !def) return;
  const baked = key.startsWith('bk_'), S = baked ? BAKE_SCALE : 1, off = baked ? PAD : 0;
  const rect = (x0, y0, x1, y1, delta) => {
    const ax = Math.max(0, Math.floor((x0 + off) * S)), bx = Math.min(w, Math.ceil((x1 + off) * S));
    const ay = Math.max(0, Math.floor((y0 + off) * S)), by = Math.min(h, Math.ceil((y1 + off) * S));
    for (let y = ay; y < by; y++) for (let x = ax; x < bx; x++) {
      const i = y * w + x;
      if (val[i] > 0) val[i] = Math.max(0.05, Math.min(1, val[i] + delta));
    }
  };
  const nearArm = rig.strike ?? 0, nearLeg = def.faces > 0 ? 0 : 1;
  rig.arms.forEach((a, i) => rect(...a.box, i === nearArm ? 0.3 : -0.3));
  rig.legs.forEach((l, i) => rect(l.hip[0] - 34, l.hip[1], l.hip[0] + 34, 256, i === nearLeg ? 0.22 : -0.22));
}

export function buildTex(key, source) {
  if (cache.has(key)) return cache.get(key);
  const w = source.width, h = source.height;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(source, 0, 0);
  const px = g.getImageData(0, 0, w, h).data;

  // טרנספורם מרחק (chamfer) ממסכת השקיפות
  const INF = 1e9, d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = px[i * 4 + 3] > 24 ? INF : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!d[i]) continue;
    d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.41, at(x + 1, y - 1) + 1.41);
  }
  let max = 1;
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; if (!d[i]) continue;
    d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.41, at(x - 1, y + 1) + 1.41);
    if (d[i] > max) max = d[i];
  }
  // נרמול: העומק מרבי כבר במרחק קבוע מהשפה (גוף שמנמן, לא כדור ענק)
  const cap = Math.max(6, Math.max(w, h) * 0.075);
  const val = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) val[i] = Math.sqrt(Math.min(d[i], cap) / cap);
  applyLayers(key, val, w, h);
  // החלקה קלה (2 מעברי טשטוש) נגד מדרגות
  for (let pass = 0; pass < 3; pass++) {
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h) { s += val[yy * w + xx]; n++; }
      }
      out[y * w + x] = s / n;
    }
    val.set(out);
  }
  const dc = document.createElement('canvas'); dc.width = w; dc.height = h;
  const dg = dc.getContext('2d'), id = dg.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = Math.round(val[i] * 255); id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  dg.putImageData(id, 0, 0);

  const map = new THREE.CanvasTexture(c), depth = new THREE.CanvasTexture(dc);
  [map, depth].forEach((t) => { t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.flipY = true; });
  const entry = { map, depth, w, h, aspect: w / h };
  cache.set(key, entry);
  return entry;
}
