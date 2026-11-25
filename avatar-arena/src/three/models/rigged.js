// דמויות תלת-מימד אמיתיות עם שלד (GLB). המודל נטען פעם אחת ומשוכפל לכל לוחם.
// האנימציה: פריימים של ANIMS (src/anim/bake.js) מתורגמים לסיבובי עצמות במישור הצד (ציר X של המודל; המודל פונה ל-+Z).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ANIMS } from '../../anim/bake.js';

const cache = new Map();     // id -> Promise<gltf scene>
export const hasModel = (id) => !!(MODELS[id]);
const MODELS = {
  toph: { url: 'models/toph.glb', b64: 'models/toph.b64.txt', arms: { down: 1.35 } },
};

// טוען GLB; אם השרת לא מגיש .glb (למשל מארח שמגיש רק טקסט), נופלים לגרסת base64 של אותו קובץ
async function fetchGlb(conf) {
  try {
    const r = await fetch(conf.url);
    if (r.ok) {
      const buf = await r.arrayBuffer();
      if (new Uint8Array(buf, 0, 4).every((c, i) => c === 'glTF'.charCodeAt(i))) return buf;
    }
  } catch { /* נופלים לבא */ }
  const r2 = await fetch(conf.b64);
  const txt = (await r2.text()).trim();
  const bin = atob(txt), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

export function preloadModel(id) {
  if (!MODELS[id]) return Promise.resolve(null);
  if (!cache.has(id)) {
    cache.set(id, fetchGlb(MODELS[id]).then((buf) => new Promise((res) => {
      new GLTFLoader().parse(buf, '', (g) => res(g.scene), () => res(null));
    })).catch(() => null));
  }
  return cache.get(id);
}
// טוען מראש וזוכר סינכרונית את התוצאה
const ready = new Map();
export function warm(ids) { ids.forEach((id) => preloadModel(id).then((s) => { if (s) ready.set(id, s); })); }
export const isReady = (id) => ready.has(id);

const nm = (n) => n.replace(/\./g, '');
const AXX = new THREE.Vector3(1, 0, 0), AXZ = new THREE.Vector3(0, 0, 1), AXY = new THREE.Vector3(0, 1, 0);
const qx = (a) => new THREE.Quaternion().setFromAxisAngle(AXX, a);
const qz = (a) => new THREE.Quaternion().setFromAxisAngle(AXZ, a);
const qy = (a) => new THREE.Quaternion().setFromAxisAngle(AXY, a);

// יוצר מופע (clone) של הדמות. מחזיר { root, height, setPose(frame, strikeIdx, heightPx) } או null
export function createRigged(id) {
  const src = ready.get(id);
  if (!src) return null;
  const root = cloneSkinned(src);
  // חומרים נפרדים לכל מופע (להבהוב פגיעה)
  const mats = [];
  root.traverse((o) => {
    if (o.isMesh) { o.frustumCulled = false; o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.push(m)); }
  });
  const B = (n) => root.getObjectByName(nm(n));
  const b = {
    spine: ['DEF-spine', 'DEF-spine.001', 'DEF-spine.002', 'DEF-spine.003'].map(B),
    neck: ['DEF-spine.004', 'DEF-spine.005'].map(B), head: B('DEF-spine.006'),
    sh: [B('DEF-shoulder.L'), B('DEF-shoulder.R')],
    ua: [B('DEF-upper_arm.L'), B('DEF-upper_arm.R')], fa: [B('DEF-forearm.L'), B('DEF-forearm.R')], hand: [B('DEF-hand.L'), B('DEF-hand.R')],
    th: [B('DEF-thigh.L'), B('DEF-thigh.R')], sn: [B('DEF-shin.L'), B('DEF-shin.R')], ft: [B('DEF-foot.L'), B('DEF-foot.R')],
  };
  root.updateMatrixWorld(true);
  // עצמות שההורה שלהן הוא "שורש" (כי רק עצמות DEF יוצאו): מחברים לחזה/אגן כדי שיזוזו עם הגוף
  const chest = b.spine[3], hips = b.spine[0];
  [...b.sh, ...b.ua].forEach((x) => x && chest.attach(x));
  b.th.forEach((x) => x && hips.attach(x));
  root.updateMatrixWorld(true);
  const all = [...b.spine, ...b.neck, b.head, ...b.sh, ...b.ua, ...b.fa, ...b.hand, ...b.th, ...b.sn, ...b.ft].filter(Boolean);
  const rest = new Map(all.map((x) => [x, x.quaternion.clone()]));
  const restPos = hips.position.clone();
  const box = new THREE.Box3().setFromObject(root, true);
  const height = box.max.y - box.min.y, footY = box.min.y;
  const conf = MODELS[id];

  // מחילים סיבוב "במרחב המודל" על העצמה: local' = P^-1 * R * P * local0
  const parentQ = new THREE.Quaternion(), rootQ = new THREE.Quaternion();
  function rot(bone, R) {
    if (!bone) return;
    bone.parent.getWorldQuaternion(parentQ);
    root.getWorldQuaternion(rootQ);                      // כיוון המודל בעולם (פנייה): עובדים במרחב המודל, לא בעולם
    const P = rootQ.clone().invert().multiply(parentQ);
    const q = P.clone().invert().multiply(R).multiply(P).multiply(rest.get(bone));
    bone.quaternion.copy(q);
  }
  const out = {
    root, height, footY, mats,
    // frame = פריים אנימציה, strikeIdx = אינדקס היד המכה (0/1), px = גובה ספרייט בפיקסלים (להזזת bob)
    setPose(fr, strikeIdx = 0) {
      all.forEach((x) => x.quaternion.copy(rest.get(x)));
      hips.position.copy(restPos);
      root.updateMatrixWorld(true);
      const kb = fr.kneeBoth || 0;
      // גוף: הטיה קדימה (torsoF) מתחלקת בין חוליות עמוד השדרה; פיתול (torso) סביב Y
      const lean = (fr.torsoF || 0) * 1.0, twist = (fr.torso || 0) * 1.6;
      const per = lean / 4;
      b.spine.forEach((s) => rot(s, qx(per).multiply(qy(twist / 4))));
      b.neck.forEach((s) => rot(s, qx(((fr.headF || 0) * 0.5) / 2)));
      rot(b.head, qx((fr.headF || 0) * 0.5).multiply(qz(-(fr.head || 0) * 0.6)));
      // רגליים: 0 = קדמית. h = נדנוד, step/leg = צעד קדימה (שלילי סביב X = קדימה)
      for (let i = 0; i < 2; i++) {
        const p = fr.leg[i], front = i === 0;
        const swing = p.h * 1.5 + (front ? (fr.stepF || 0) + (fr.legF || 0) : -(fr.stepF || 0) * 0.6);
        const bend = p.k * 1.4 + kb * (front ? 1 : 0.6) + (front ? fr.legK || 0 : 0);
        rot(b.th[i], qx(-swing + bend * 0.5));
        rot(b.sn[i], qx(bend * 1.1));
        rot(b.ft[i], qx((swing - bend * 0.6) * 0.5));
      }
      // ידיים: מורידים מהמצב T (סביב Z) ואז מנדנדים קדימה (סביב X)
      const down = conf.arms.down;
      for (let i = 0; i < 2; i++) {
        const isStrike = i === strikeIdx || fr.off > 0;
        let s = fr.arm[i].s * 1.2, e = fr.arm[i].e * 1.2 + 0.12;
        if (isStrike) { s += (fr.strike || 0) * 0.9; e += Math.abs(fr.strikeE || 0) * 1.1; }
        else if (fr.strike) { s += -(fr.strike || 0) * 0.35; e += 0.2; }
        const side = i === 0 ? -1 : 1;        // L: +X ידו מורידים ב-Z שלילי, R הפוך
        rot(b.ua[i], qx(-s).multiply(qz(side * down)));
        rot(b.fa[i], qx(-e));
      }
      root.updateMatrixWorld(true);
    },
  };
  return out;
}
