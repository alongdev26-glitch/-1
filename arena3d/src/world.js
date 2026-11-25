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

// אפקטים: גל הלם (טבעת), ניצוצות פגיעה
export class Effects {
  constructor(scene) { this.scene = scene; this.items = []; }
  wave(x, z, r) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.55, 40), new THREE.MeshBasicMaterial({ color: 0xd9b36a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.06, z); this.scene.add(m); this.items.push({ m, t: 0, life: 0.5, r, kind: 'wave' });
    for (let i = 0; i < 12; i++) this.rock(x, z, r * (0.3 + Math.random() * 0.7));
  }
  rock(x, z, dist) {
    const a = Math.random() * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + Math.random() * 0.12), new THREE.MeshStandardMaterial({ color: 0x8a7a5a, flatShading: true }));
    m.position.set(x + Math.sin(a) * dist, 0.1, z + Math.cos(a) * dist); this.scene.add(m);
    this.items.push({ m, t: 0, life: 0.9, vy: 3 + Math.random() * 3, kind: 'rock' });
  }
  fireball() {   // כדור אש: מחזיר רשת שאפשר להזיז; הזנב נוצר מכאן
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffb347 })));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0.45, depthWrite: false })));
    g.add(new THREE.PointLight(0xff8a30, 2.2, 7));
    this.scene.add(g); return g;
  }
  trail(p) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff7a22, transparent: true, opacity: 0.7, depthWrite: false }));
    m.position.copy(p); this.scene.add(m); this.items.push({ m, t: 0, life: 0.35, kind: 'trail' });
  }
  burst(p) {
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd27a : 0xff6a1a }));
      m.position.copy(p); this.scene.add(m);
      this.items.push({ m, t: 0, life: 0.5, v: new THREE.Vector3((Math.random() - 0.5) * 7, Math.random() * 5 + 1, (Math.random() - 0.5) * 7), kind: 'spark' });
    }
  }
  spark(p, heavy) {
    for (let i = 0; i < (heavy ? 10 : 6); i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: heavy ? 0xffc36a : 0xffffff }));
      m.position.copy(p); this.scene.add(m);
      const v = new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 4 + 1, (Math.random() - 0.5) * 5);
      this.items.push({ m, t: 0, life: 0.4, v, kind: 'spark' });
    }
  }
  update(dt) {
    this.items = this.items.filter((it) => {
      it.t += dt; const k = it.t / it.life;
      if (it.kind === 'wave') { const s = 1 + (it.r / 0.55) * k; it.m.scale.set(s, s, 1); it.m.material.opacity = 0.9 * (1 - k); }
      else if (it.kind === 'trail') { it.m.scale.setScalar(Math.max(0.01, 1 - k)); it.m.material.opacity = 0.7 * (1 - k); }
      else if (it.kind === 'rock') { it.vy -= 14 * dt; it.m.position.y = Math.max(0.1, it.m.position.y + it.vy * dt); it.m.rotation.x += dt * 6; if (k > 0.7) it.m.scale.setScalar(Math.max(0.01, 1 - (k - 0.7) / 0.3)); }
      else { it.v.y -= 10 * dt; it.m.position.addScaledVector(it.v, dt); it.m.scale.setScalar(Math.max(0.01, 1 - k)); }
      if (k >= 1) { this.scene.remove(it.m); it.m.geometry.dispose(); it.m.material.dispose(); return false; }
      return true;
    });
  }
}
