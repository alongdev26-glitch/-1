// דמות תלת-מימדית שנבנית בקוד: שלד של קבוצות (pivots) עם גיאומטריה. גובה 1 יחידה, מביטה ל-+x, רגליים על y=0.
// ציר ההטיה קדימה/אחורה הוא z. הצדדים (שמאל/ימין) לאורך z.
import * as THREE from 'three';

const STYLES = {
  zuko:   { skin: 0xd9a47a, hair: 0x15100d, top: 0x9c1d12, trim: 0x2a1512, pants: 0x1c1514, boots: 0x14100e, sash: 0xd8b04a, hairStyle: 'topknot', sleeves: 0x2a1512, scar: true, build: 1.02 },
  toph:   { skin: 0xf0d7c0, hair: 0x15110f, top: 0x6f9a52, trim: 0xe0d3a6, pants: 0xe0d3a6, boots: null, sash: 0x8a7a45, hairStyle: 'bun', sleeves: 0xe0d3a6, band: 0x3f5f33, build: 0.84 },
  aang:   { skin: 0xe8b98e, hair: 0xe8b98e, top: 0xf2a81d, trim: 0xd8721a, pants: 0xe08a1a, boots: 0x7a4a1c, sash: 0xd8721a, hairStyle: 'bald', sleeves: 0xd8721a, arrow: 0x4a90d9, build: 0.86 },
  katara: { skin: 0xb77b4d, hair: 0x3b2418, top: 0x3b6fc4, trim: 0xcfe0f5, pants: 0x1c2b44, boots: 0x6f4a2a, sash: 0x8a5b2c, hairStyle: 'loops', sleeves: 0x3b6fc4, skirt: true, build: 0.97 },
};

const mat = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.78, metalness: 0.02, flatShading: false, ...extra });
const limbMesh = (len, r0, r1, m) => { const g = new THREE.CylinderGeometry(r0, r1, len, 10, 1); g.translate(0, -len / 2, 0); return new THREE.Mesh(g, m); };
const ball = (r, m, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); o.scale.set(sx, sy, sz); return o; };

export function buildHumanoid(id) {
  const S = STYLES[id] || STYLES.zuko;
  const skin = mat(S.skin), hair = mat(S.hair), top = mat(S.top), trim = mat(S.trim), pants = mat(S.pants), sash = mat(S.sash), sleeve = mat(S.sleeves);
  const boots = mat(S.boots ?? S.skin);
  const root = new THREE.Group();     // המיקום בעולם
  const body = new THREE.Group();     // גוף כולו (בוב, סיבוב ציר)
  root.add(body);
  const b = {};                       // העצמות לאנימציה

  const hips = new THREE.Group(); hips.position.y = 0.5; body.add(hips); b.hips = hips;
  const pelvis = ball(0.075, pants, 0.9, 0.9, 1.3); hips.add(pelvis);
  if (S.skirt) {
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.14, 0.34, 14, 1, true), top); sk.position.y = -0.1; sk.material.side = THREE.DoubleSide; hips.add(sk);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 18), trim); hem.rotation.x = Math.PI / 2; hem.position.y = -0.27; hips.add(hem);
  }

  const spine = new THREE.Group(); spine.position.y = 0.04; hips.add(spine); b.spine = spine;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.27, 12), top); torso.scale.z = 1.35; torso.position.y = 0.13; spine.add(torso);
  const chest = ball(0.1, top, 0.9, 0.95, 1.4); chest.position.y = 0.24; spine.add(chest);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.084, 0.02, 6, 16), sash); belt.rotation.x = Math.PI / 2; belt.scale.set(1, 1.35, 1); belt.position.y = 0.02; spine.add(belt);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.014, 6, 14), trim); collar.rotation.x = Math.PI / 2; collar.scale.set(1, 1.3, 1); collar.position.y = 0.3; spine.add(collar);

  const neck = new THREE.Group(); neck.position.y = 0.31; spine.add(neck); b.neck = neck;
  const nk = limbMesh(0.05, 0.03, 0.035, skin); nk.position.y = 0.04; neck.add(nk);
  const head = new THREE.Group(); head.position.y = 0.07; neck.add(head); b.head = head;
  const skull = ball(0.085, skin, 1, 1.05, 0.95); skull.position.y = 0.075; head.add(skull);
  // פנים: עיניים, גבות, אף
  const eyeM = mat(0x120c0a, { roughness: 0.3 });
  [-1, 1].forEach((s) => {
    const e = ball(0.014, eyeM, 0.6, 1.2, 1); e.position.set(0.075, 0.085, s * 0.035); head.add(e);
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.007, 0.035), hair); br.position.set(0.08, 0.108, s * 0.036); br.rotation.x = s * 0.15; head.add(br);
  });
  const nose = ball(0.014, skin, 1.3, 1, 1); nose.position.set(0.087, 0.064, 0); head.add(nose);
  if (S.scar) { const sc = ball(0.03, mat(0x8a3a2e), 0.3, 1, 0.9); sc.position.set(0.078, 0.092, 0.05); head.add(sc); }
  if (S.arrow) { const ar = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 3), mat(S.arrow)); ar.position.set(0.04, 0.15, 0); ar.rotation.z = -0.3; head.add(ar); }
  if (S.hairStyle !== 'bald') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair); cap.position.set(-0.01, 0.085, 0); cap.scale.set(1, 1.05, 1.0); head.add(cap);
    if (S.hairStyle === 'topknot') {
      const kn = ball(0.032, hair); kn.position.set(-0.03, 0.185, 0); head.add(kn);
      const tail = limbMesh(0.14, 0.012, 0.004, hair); tail.position.set(-0.08, 0.1, 0); tail.rotation.z = 0.25; head.add(tail);
    } else if (S.hairStyle === 'bun') {
      const kn = ball(0.04, hair); kn.position.set(-0.04, 0.175, 0); head.add(kn);
    } else if (S.hairStyle === 'loops') {
      [-1, 1].forEach((s) => { const l = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.007, 6, 10), hair); l.position.set(0.06, 0.07, s * 0.085); head.add(l); });
      const back = limbMesh(0.13, 0.04, 0.02, hair); back.position.set(-0.07, 0.1, 0); back.rotation.z = 0.15; head.add(back);
    }
  }
  if (S.band) { const bd = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.009, 6, 16), mat(S.band)); bd.rotation.x = Math.PI / 2; bd.position.y = 0.12; head.add(bd); }

  // ידיים: כתף -> מרפק. i=0 בצד z+ (קרוב למצלמה כשפונים ימינה בהטיה), i=1 בצד z-
  b.arm = [0, 1].map((i) => {
    const z = i === 0 ? 0.115 : -0.115;
    const sh = new THREE.Group(); sh.position.set(0, 0.27, z); spine.add(sh);
    const cap = ball(0.04, sleeve); sh.add(cap);
    const up = limbMesh(0.14, 0.036, 0.03, sleeve); sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.14; sh.add(el);
    const lo = limbMesh(0.13, 0.03, 0.024, S.hairStyle === 'loops' || id === 'zuko' ? sleeve : skin); el.add(lo);
    const hand = ball(0.028, skin, 1, 1.2, 0.8); hand.position.y = -0.14; el.add(hand);
    return { sh, el };
  });

  // רגליים
  b.leg = [0, 1].map((i) => {
    const z = i === 0 ? 0.045 : -0.045;
    const th = new THREE.Group(); th.position.set(0, -0.01, z); hips.add(th);
    th.add(limbMesh(0.23, 0.05, 0.04, pants));
    const kn = new THREE.Group(); kn.position.y = -0.23; th.add(kn);
    kn.add(limbMesh(0.23, 0.04, 0.032, pants));
    const boot = limbMesh(0.09, 0.036, 0.04, boots); boot.position.y = -0.14; kn.add(boot);
    const ft = ball(0.04, boots, 1.7, 0.6, 1); ft.position.set(0.03, -0.235, 0); kn.add(ft);
    return { th, kn };
  });
  hips.position.y = 0.49;
  root.userData.bones = b;
  root.userData.build = S.build;
  return root;
}
