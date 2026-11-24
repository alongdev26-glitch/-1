// מערת הלבה בתלת-מימד: קירות סלע, מפלי לבה זורמים, עמודי סלע, מבנה עתיק בעומק, ים לבה, ופלטפורמות טכנולוגיות.
// הכתיבה בפיקסלים של המסך (at) והעומק z קובע את הפרלקסה.
import * as THREE from 'three';
import { at, sc, rng, flat, glow, rockGeometry, pillarGeometry, flowMaterial, lavaFloorMaterial, techPlatform } from '../helpers.js';

function gradientTexture() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#0d0404'); gr.addColorStop(0.5, '#2a0d07'); gr.addColorStop(0.85, '#7a2208'); gr.addColorStop(1, '#c8420c');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(c);
}

export function buildFireArena(map) {
  const group = new THREE.Group(), anim = [], flows = [];

  // רקע עמוק
  const back = new THREE.Mesh(new THREE.PlaneGeometry(5200, 3200), new THREE.MeshBasicMaterial({ map: gradientTexture(), fog: false }));
  back.position.set(0, -100, -1700); group.add(back);

  // מבנה עתיק בעומק
  const rockDark = flat(0x1c100d), rockMid = flat(0x2a1710), rockLite = flat(0x3a2218);
  {
    const z = -720, p = at(467, 165, z);
    const body = new THREE.Mesh(new THREE.BoxGeometry(190 * sc(z), 255 * sc(z), 70), rockDark);
    body.position.copy(p); group.add(body);
    for (const x of [390, 430, 470, 510, 545]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(5 * sc(z), 245 * sc(z), 6), flat(0x4a3027));
      const bp = at(x, 165, z + 36); bar.position.copy(bp); group.add(bar);
    }
    for (const y of [110, 170, 230]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(190 * sc(z), 5 * sc(z), 6), flat(0x4a3027));
      const bp = at(467, y, z + 36); bar.position.copy(bp); group.add(bar);
    }
    const crown = new THREE.Mesh(new THREE.BoxGeometry(60 * sc(z), 40 * sc(z), 60), rockMid);
    crown.position.copy(at(467, 28, z)); group.add(crown);
  }

  // קירות סלע שמאל וימין (שכבות עומק)
  const r = rng(7);
  [[-10, 300], [660, 980]].forEach(([x0, x1], side) => {
    for (let i = 0; i < 11; i++) {
      const z = -330 - r() * 280, rad = (110 + r() * 90) * sc(z);
      const m = new THREE.Mesh(rockGeometry(100 + i * 13 + side * 40, 1), i % 3 === 0 ? rockMid : i % 3 === 1 ? rockDark : rockLite);
      m.scale.set(rad * (0.9 + r() * 0.5), rad * (1.2 + r() * 0.6), rad * 0.8);
      m.position.copy(at(x0 + r() * (x1 - x0), 10 + i * 52 + r() * 34, z));
      m.rotation.set(r() * 3, r() * 3, r() * 3);
      group.add(m);
    }
  });

  // מפלי לבה זורמים
  [[612, 58, 470, -380], [688, 36, 430, -330], [826, 66, 420, -300], [900, 34, 430, -330]].forEach(([left, w, h, z]) => {
    const mat = flowMaterial(0xff4d00, 0xffd054, 0.55, 3); flows.push(mat);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * sc(z), (h + 200) * sc(z)), mat);
    m.position.copy(at(left + w / 2, (h - 200) / 2, z)); group.add(m);
  });
  { // חלון לבה בקיר שמאל
    const mat = flowMaterial(0xff5a14, 0xffc04a, 0.4, 2); flows.push(mat);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(40 * sc(-440), 130 * sc(-440)), mat);
    m.position.copy(at(283, 130, -440)); group.add(m);
  }

  // עמודי סלע מפותלים
  [[358, 285, 46, 11], [480, 305, 58, 12], [600, 270, 44, 13]].forEach(([x, top, w, seed]) => {
    const z = -230, hpx = 475 - top;
    const m = new THREE.Mesh(pillarGeometry(hpx * sc(z) * 1.1, (w / 2) * sc(z) * 1.1, seed), rockLite);
    m.position.copy(at(x, 475, z)); group.add(m);
  });

  // ים לבה
  const lavaMat = lavaFloorMaterial();
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(4600, 2600), lavaMat);
  lava.rotation.x = -Math.PI / 2; lava.position.set(0, 270 - 436, -500); group.add(lava);

  // פלטפורמות
  map.platforms.forEach((p) => {
    const tp = techPlatform(p, anim);
    tp.position.set(p.x - 480, 270 - p.top, 0);
    group.add(tp);
  });

  // גחלים באוויר
  const N = 90, pos = new Float32Array(N * 3), rr = rng(99);
  for (let i = 0; i < N; i++) pos.set([(rr() - 0.5) * 1500, -260 + rr() * 640, -380 + rr() * 480], i * 3);
  const embers = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
    new THREE.PointsMaterial({ color: 0xffb34a, size: 5, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  group.add(embers);

  // אורות
  group.add(new THREE.HemisphereLight(0xff9a5a, 0x2a0d06, 0.95));
  const dir = new THREE.DirectionalLight(0xffd0a0, 0.9); dir.position.set(-300, 600, 800); group.add(dir);
  const lavaLight = new THREE.PointLight(0xff6a1a, 2.6, 1700, 1.4); lavaLight.position.set(0, -170, 160); group.add(lavaLight);
  const cyan = new THREE.PointLight(0x38efff, 0.9, 520, 1.6); cyan.position.set(0, -40, 120); group.add(cyan);

  return {
    group,
    fog: { color: 0x2a0d07, near: 1100, far: 3200 },
    bg: 0x140604,
    light: { glow: [1.0, 0.45, 0.1], strength: 0.55, amb: [1.0, 0.92, 0.88] },
    update(t) {
      flows.forEach((m) => { m.uniforms.uTime.value = t; });
      lavaMat.uniforms.uTime.value = t;
      anim.forEach((f) => f(t));
      const a = embers.geometry.attributes.position;
      for (let i = 0; i < N; i++) {
        let y = a.getY(i) + 0.9 + (i % 5) * 0.25;
        if (y > 380) y = -260;
        a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * 1.3 + i) * 0.25);
      }
      a.needsUpdate = true;
      lavaLight.intensity = 2.4 + Math.sin(t * 2.3) * 0.25;
    },
  };
}
