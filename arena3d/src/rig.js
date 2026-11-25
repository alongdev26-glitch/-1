// דמות עם שלד (GLB): טעינה, שכפול, ותרגום פריימי אנימציה (anims.js) לסיבובי עצמות.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

// שמות העצמות לפי שלד (Rigify של טוף). noDot: Three מסיר נקודות משמות צמתים.
export const SKELETONS = {
  rigify: {
    spine: ['DEF-spine', 'DEF-spine.001', 'DEF-spine.002', 'DEF-spine.003'], neck: ['DEF-spine.004', 'DEF-spine.005'], head: 'DEF-spine.006',
    sh: ['DEF-shoulder.L', 'DEF-shoulder.R'], ua: ['DEF-upper_arm.L', 'DEF-upper_arm.R'], fa: ['DEF-forearm.L', 'DEF-forearm.R'],
    th: ['DEF-thigh.L', 'DEF-thigh.R'], sn: ['DEF-shin.L', 'DEF-shin.R'], ft: ['DEF-foot.L', 'DEF-foot.R'], armDown: 1.35,
  },
};

const MODELS = { toph: { url: 'models/toph.glb', skel: 'rigify' } };
export const modelIds = () => Object.keys(MODELS);

const cache = new Map();
async function fetchGlb(url) {
  try {
    const r = await fetch(url);
    if (r.ok) {
      const buf = await r.arrayBuffer();
      if (new Uint8Array(buf, 0, 4).every((c, i) => c === 'glTF'.charCodeAt(i))) return buf;
    }
  } catch { /* נופלים לגרסת base64 */ }
  const txt = (await (await fetch(url.replace(/\.glb$/, '.b64.txt'))).text()).trim();
  const bin = atob(txt), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}
export function loadGlb(url) {
  if (!cache.has(url)) cache.set(url, fetchGlb(url).then((buf) => new Promise((res, rej) => new GLTFLoader().parse(buf, '', (g) => res(g.scene), rej))));
  return cache.get(url);
}
export const loadCharacter = (id) => loadGlb(MODELS[id].url);

const nm = (n) => n.replace(/\./g, '');
const AXX = new THREE.Vector3(1, 0, 0), AXZ = new THREE.Vector3(0, 0, 1), AXY = new THREE.Vector3(0, 1, 0);
const qx = (a) => new THREE.Quaternion().setFromAxisAngle(AXX, a);
const qz = (a) => new THREE.Quaternion().setFromAxisAngle(AXZ, a);
const qy = (a) => new THREE.Quaternion().setFromAxisAngle(AXY, a);

// hueShift (0..1) משנה גוון חומרים ירוקים (כדי להבדיל בין שני לוחמים עם אותו מודל)
export function createRig(id, src, { hueShift = 0, targetHeight = 1.7 } = {}) {
  const S = SKELETONS[MODELS[id].skel];
  const root = cloneSkinned(src);
  const mats = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      if (hueShift && m.color) { const hsl = {}; m.color.getHSL(hsl); if (hsl.s > 0.4 && hsl.h > 0.2 && hsl.h < 0.45) m.color.setHSL((hsl.h + hueShift) % 1, hsl.s, hsl.l); }
      mats.push(m);
    });
  });
  const B = (n) => root.getObjectByName(nm(n));
  const b = {
    spine: S.spine.map(B), neck: S.neck.map(B), head: B(S.head), sh: S.sh.map(B), ua: S.ua.map(B), fa: S.fa.map(B),
    th: S.th.map(B), sn: S.sn.map(B), ft: S.ft.map(B),
  };
  root.updateMatrixWorld(true);
  const chest = b.spine[3], hips = b.spine[0];
  [...b.sh, ...b.ua].forEach((x) => x && chest.attach(x));
  b.th.forEach((x) => x && hips.attach(x));
  root.updateMatrixWorld(true);
  const all = [...b.spine, ...b.neck, b.head, ...b.sh, ...b.ua, ...b.fa, ...b.th, ...b.sn, ...b.ft].filter(Boolean);
  const rest = new Map(all.map((x) => [x, x.quaternion.clone()]));
  const box = new THREE.Box3().setFromObject(root, true);
  const height = box.max.y - box.min.y, footY = box.min.y;
  const scale = targetHeight / height;
  const wrap = new THREE.Group();       // wrap: מיקום/סיבוב/קנה מידה בעולם
  root.scale.setScalar(scale); root.position.y = -footY * scale;
  wrap.add(root);

  const parentQ = new THREE.Quaternion(), rootQ = new THREE.Quaternion();
  function rot(bone, R) {
    if (!bone) return;
    bone.parent.getWorldQuaternion(parentQ);
    root.getWorldQuaternion(rootQ);
    const P = rootQ.clone().invert().multiply(parentQ);
    bone.quaternion.copy(P.clone().invert().multiply(R).multiply(P).multiply(rest.get(bone)));
  }
  function setPose(fr, strikeIdx = 0) {
    all.forEach((x) => x.quaternion.copy(rest.get(x)));
    root.updateMatrixWorld(true);
    const kb = fr.kneeBoth || 0, lean = fr.torsoF || 0, twist = (fr.torso || 0) * 1.6;
    b.spine.forEach((s) => rot(s, qx(lean / 4).multiply(qy(twist / 4))));
    b.neck.forEach((s) => rot(s, qx(((fr.headF || 0) * 0.5) / 2)));
    rot(b.head, qx((fr.headF || 0) * 0.5).multiply(qz(-(fr.head || 0) * 0.6)));
    for (let i = 0; i < 2; i++) {
      const p = fr.leg[i], front = i === 0;
      const swing = p.h * 1.5 + (front ? (fr.stepF || 0) + (fr.legF || 0) : -(fr.stepF || 0) * 0.6);
      const bend = p.k * 1.4 + kb * (front ? 1 : 0.6) + (front ? fr.legK || 0 : 0);
      rot(b.th[i], qx(-swing + bend * 0.5)); rot(b.sn[i], qx(bend * 1.1)); rot(b.ft[i], qx((swing - bend * 0.6) * 0.5));
    }
    for (let i = 0; i < 2; i++) {
      const isStrike = i === strikeIdx || fr.off > 0;
      let s = fr.arm[i].s * 1.2, e = fr.arm[i].e * 1.2 + 0.12;
      if (isStrike) { s += (fr.strike || 0) * 0.9; e += Math.abs(fr.strikeE || 0) * 1.1; }
      else if (fr.strike) { s += -(fr.strike || 0) * 0.35; e += 0.2; }
      rot(b.ua[i], qx(-s).multiply(qz((i === 0 ? -1 : 1) * S.armDown)));
      rot(b.fa[i], qx(-e));
    }
    root.updateMatrixWorld(true);
  }
  return { wrap, root, mats, height: targetHeight, setPose };
}
