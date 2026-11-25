// הזירה (מודל GLB), תאורה, רקע ואפקטים.
import * as THREE from 'three';
import { loadGlb } from './rig.js';

const ARENA_SCALE = 2.2;
export async function buildWorld(scene) {
  scene.background = skyTexture();
  scene.fog = new THREE.Fog(0x16212e, 28, 70);
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x3a3328, 0.85));
  const sun = new THREE.DirectionalLight(0xfff1d8, 1.25); sun.position.set(-6, 14, 9); scene.add(sun);
  const arena = (await loadGlb('models/arena.glb')).clone(true);
  arena.scale.setScalar(ARENA_SCALE);
  arena.position.y = 0.32 * ARENA_SCALE;        // הרצפה (דיסק) נמצאת ב-y=-0.32 במודל: מעלים אותה ל-0
  arena.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); if (o.material.emissive) o.material.emissive.copy(o.material.color).multiplyScalar(0.08); if (o.material.name === 'Material.001') o.material.color.setScalar(0.30); } });
  scene.add(arena);
  // קרקע רחוקה (חושך סביב הזירה) כדי שלא נראה חלל ריק
  const ground = new THREE.Mesh(new THREE.CircleGeometry(120, 48), new THREE.MeshStandardMaterial({ color: 0x1b222b, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -3; scene.add(ground);
  return { arena };
}
function skyTexture() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#0b1830'); gr.addColorStop(0.55, '#2a4d78'); gr.addColorStop(1, '#8fb4d6');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// אפקטים לכל מכה. items = אובייקטים זמניים; כל אחד עם kind ופונקציית עדכון בתוך update()
const sph = (r, c, o = 1, seg = 8) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg - 2), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false }));
export class Effects {
  constructor(scene) { this.scene = scene; this.items = []; this.light = new THREE.PointLight(0xffffff, 0, 16); scene.add(this.light); this.lightT = 0; }
  _add(m, extra) { this.scene.add(m); const it = { m, t: 0, life: 1, ...extra }; this.items.push(it); return it; }
  flashLight(color, intensity, x, y, z, dur = 0.25) { this.light.color.setHex(color); this.light.position.set(x, y, z); this.light.intensity = intensity; this.lightT = dur; this.lightMax = intensity; }
  dust(x, z, n = 8, spread = 1.5, color = 0xb9a67d) {
    for (let i = 0; i < n; i++) { const m = sph(0.18 + Math.random() * 0.16, color, 0.55); const a = Math.random() * 6.28, d = Math.random() * spread; m.position.set(x + Math.sin(a) * d, 0.2, z + Math.cos(a) * d); this._add(m, { kind: 'puff', life: 0.7, vy: 0.8 + Math.random() }); }
  }
  ring(x, z, r, color, life = 0.5, y = 0.06) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.6, 44), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); this._add(m, { kind: 'wave', life, r });
  }
  wave(x, z, r) { this.ring(x, z, r, 0xd9b36a); this.dust(x, z, 10, r * 0.8); for (let i = 0; i < 12; i++) this.rock(x, z, r * (0.3 + Math.random() * 0.7)); this.flashLight(0xd9b36a, 2, x, 1.5, z); }
  firering(x, z, r) { this.ring(x, z, r, 0xff7a22, 0.55); this.ring(x, z, r * 0.7, 0xffd27a, 0.4, 0.1); this.burst({ x, y: 0.4, z }, 20); this.flashLight(0xff8a30, 3, x, 1.2, z, 0.35); }
  rock(x, z, dist, color = 0x8a7a5a) {
    const a = Math.random() * Math.PI * 2, m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + Math.random() * 0.12), new THREE.MeshStandardMaterial({ color, flatShading: true }));
    m.position.set(x + Math.sin(a) * dist, 0.1, z + Math.cos(a) * dist); this._add(m, { kind: 'rock', life: 0.9, vy: 3 + Math.random() * 3 });
  }
  punch(x, y, z, color = 0xffffff) { const m = sph(0.3, color, 0.9); m.position.set(x, y, z); this._add(m, { kind: 'pop', life: 0.18 }); }
  sweep(x, z, yaw) {
    for (let i = 0; i < 9; i++) { const a = yaw + (i / 8 - 0.5) * 1.8, d = 0.8 + i * 0.12; const m = sph(0.22, 0xc9b27d, 0.6); m.position.set(x + Math.sin(a) * d, 0.35, z + Math.cos(a) * d); this._add(m, { kind: 'puff', life: 0.5, vy: 0.3, delay: i * 0.02 }); }
    this.dust(x, z, 6, 1.5);
  }
  pillar(x, z) {   // עמוד סלע: כמה קונוסים מחודדים שעולים מהאדמה, מחזיקים ושוקעים
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const mat = new THREE.MeshStandardMaterial({ color: 0x9b8760, flatShading: true, roughness: 1 });
    [[0, 0, 2.6, 0.55], [0.5, 0.2, 1.8, 0.4], [-0.45, 0.25, 2.0, 0.42], [0.1, -0.5, 1.5, 0.35], [-0.2, 0.5, 1.2, 0.3]].forEach(([ox, oz, h, r]) => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mat); c.position.set(ox, h / 2 - h, oz); c.userData.h = h; g.add(c);
    });
    this._add(g, { kind: 'pillar', life: 1.1 }); this.dust(x, z, 12, 1.2); this.flashLight(0xd9b36a, 1.5, x, 1.5, z, 0.2);
  }
  boulder() { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: 0x8c7a58, flatShading: true })); this.scene.add(m); return m; }
  meteor(x, z, r, onImpact) {
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(r, 36), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.set(x, 0.04, z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.92, r, 40), new THREE.MeshBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.05, z);
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), new THREE.MeshStandardMaterial({ color: 0x77664a, flatShading: true, emissive: 0x552200, emissiveIntensity: 0.6 })); rock.position.set(x, 20, z);
    const g = new THREE.Group(); g.add(shadow, ring, rock);
    this._add(g, { kind: 'meteor', life: 0.85, x, z, r, shadow, ring, rock, onImpact });
  }
  fireball() {
    const g = new THREE.Group();
    g.add(sph(0.3, 0xffb347, 1, 12), sph(0.5, 0xff5a1a, 0.45, 12));
    this.scene.add(g); return g;
  }
  trail(p, big = false) { const m = sph(big ? 0.34 : 0.22, 0xff7a22, 0.7); m.position.copy(p); this._add(m, { kind: 'trail', life: 0.35 }); }
  flame(x, y, z, dx, dz, n = 2, big = false) {
    for (let i = 0; i < n; i++) {
      const m = sph((big ? 0.26 : 0.2) + Math.random() * 0.15, i % 2 ? 0xffd27a : 0xff6a1a, 0.8);
      m.position.set(x + (Math.random() - 0.5) * 0.3, y + (Math.random() - 0.5) * 0.3, z + (Math.random() - 0.5) * 0.3);
      const sp = 4 + Math.random() * 4; this._add(m, { kind: 'flame', life: 0.45, v: new THREE.Vector3(dx * sp + (Math.random() - 0.5), 0.6 + Math.random(), dz * sp + (Math.random() - 0.5)) });
    }
  }
  lightning(x, z) {
    const pts = [new THREE.Vector3(x + (Math.random() - 0.5) * 3, 16, z + (Math.random() - 0.5) * 3)];
    for (let i = 1; i < 9; i++) pts.push(new THREE.Vector3(x + (Math.random() - 0.5) * (1.6 - i * 0.15), 16 - i * 1.9, z + (Math.random() - 0.5) * (1.6 - i * 0.15)));
    pts.push(new THREE.Vector3(x, 0.15, z));
    const g = new THREE.Group();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = a.distanceTo(b);
      for (const [w, col, op] of [[0.16, 0x9fd0ff, 0.55], [0.06, 0xffffff, 1]]) {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(w, w, len, 5), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false }));
        c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(c);
      }
    }
    this._add(g, { kind: 'bolt', life: 0.35 }); this.ring(x, z, 2.4, 0xbfe0ff, 0.4); this.burst({ x, y: 0.3, z }, 22, 0xbfe0ff); this.flashLight(0xaad0ff, 8, x, 4, z, 0.35);
  }
  burst(p, n = 14, color = 0) {
    for (let i = 0; i < n; i++) { const m = sph(0.09, color || (i % 2 ? 0xffd27a : 0xff6a1a), 1, 6); m.position.set(p.x, p.y, p.z); this._add(m, { kind: 'spark', life: 0.5, v: new THREE.Vector3((Math.random() - 0.5) * 7, Math.random() * 5 + 1, (Math.random() - 0.5) * 7) }); }
  }
  spark(p, heavy, color = 0) {
    for (let i = 0; i < (heavy ? 10 : 6); i++) { const m = sph(0.05, color || (heavy ? 0xffc36a : 0xffffff), 1, 6); m.position.copy(p); this._add(m, { kind: 'spark', life: 0.4, v: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 4 + 1, (Math.random() - 0.5) * 5) }); }
  }
  update(dt) {
    if (this.lightT > 0) { this.lightT -= dt; this.light.intensity = Math.max(0, this.lightMax * (this.lightT / 0.3)); if (this.lightT <= 0) this.light.intensity = 0; }
    this.items = this.items.filter((it) => {
      if (it.delay > 0) { it.delay -= dt; it.m.visible = false; return true; } it.m.visible = true;
      it.t += dt; const k = Math.min(1, it.t / it.life);
      switch (it.kind) {
        case 'wave': { const s = 1 + (it.r / 0.6) * k; it.m.scale.set(s, s, 1); it.m.material.opacity = 0.9 * (1 - k); break; }
        case 'puff': it.m.position.y += it.vy * dt; it.m.scale.setScalar(1 + k * 1.2); it.m.material.opacity = 0.55 * (1 - k); break;
        case 'pop': it.m.scale.setScalar(1 + k * 1.6); it.m.material.opacity = 0.9 * (1 - k); break;
        case 'rock': it.vy -= 14 * dt; it.m.position.y = Math.max(0.1, it.m.position.y + it.vy * dt); it.m.rotation.x += dt * 6; if (k > 0.7) it.m.scale.setScalar(Math.max(0.01, 1 - (k - 0.7) / 0.3)); break;
        case 'pillar': {
          const up = k < 0.2 ? k / 0.2 : (k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25);
          it.m.children.forEach((c) => { c.position.y = c.userData.h / 2 - c.userData.h * (1 - up); });
          break;
        }
        case 'meteor': {
          const f = k; it.shadow.material.opacity = 0.5 * f; it.ring.scale.setScalar(1 + (1 - f) * 0.4); it.ring.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(it.t * 18));
          it.rock.position.y = 20 * (1 - f * f) + 1.2; it.rock.rotation.x += dt * 5; it.rock.rotation.z += dt * 3;
          if (k >= 1 && !it.done) { it.done = true; it.onImpact && it.onImpact(); it.life = it.t + 0.001; }
          break;
        }
        case 'flame': it.v.y += 1.5 * dt; it.m.position.addScaledVector(it.v, dt); it.m.scale.setScalar(1 + k * 1.1); it.m.material.opacity = 0.8 * (1 - k); break;
        case 'bolt': it.m.visible = Math.random() > 0.15; it.m.children.forEach((c) => (c.material.opacity = (c.material.opacity > 0.9 ? 1 : 0.55) * (1 - k * 0.8))); break;
        case 'trail': it.m.scale.setScalar(Math.max(0.01, 1 - k)); it.m.material.opacity = 0.7 * (1 - k); break;
        default: it.v.y -= 10 * dt; it.m.position.addScaledVector(it.v, dt); it.m.scale.setScalar(Math.max(0.01, 1 - k));
      }
      if (k >= 1 && !(it.kind === 'meteor' && !it.done)) {
        this.scene.remove(it.m);
        it.m.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        return false;
      }
      return true;
    });
  }
}
