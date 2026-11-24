// הקרב בתלת-מימד: רנדרר אחד לזירה (ברמת "מלא") ולדמויות. Phaser ממשיך לנהל פיזיקה ואפקטים (קנבס שקוף מעל).
// ה-Phaser מצייר את הדמויות ב-f.vis. כאן קוראים את מצבו ומציירים מחדש בתלת-מימד.
import * as THREE from 'three';
import { buildTex } from './depth.js';
import { makeMaterial, sharedGeometry, setEntry } from './material.js';
import { shadowTexture, DIST } from './helpers.js';
import { ARENAS } from './arenas/index.js';
import { FollowCam } from './camera.js';
import { ELEMENTS } from '../data/characters.js';

const W = 960, H = 540;

export class World3D {
  // quality: 'full' (זירה ודמויות) או 'chars' (דמויות בלבד מעל רקע דו-ממדי)
  constructor(container, map, quality = 'full') {
    const arenaFn = ARENAS[map.id];
    this.full = quality === 'full' && !!arenaFn;
    this.r = new THREE.WebGLRenderer({ alpha: !this.full, antialias: true });
    this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.r.setSize(W, H, false);
    if (!this.full) this.r.setClearColor(0x000000, 0);
    const cv = this.r.domElement;
    cv.style.cssText = `width:${W}px;height:${H}px;display:block`;
    container.appendChild(cv);
    this.cam = new THREE.PerspectiveCamera((2 * Math.atan(H / 2 / DIST) * 180) / Math.PI, W / H, 10, 7000);
    this.cam.position.set(0, 0, DIST);
    this.scene = new THREE.Scene();
    this.items = new Map();
    this.hidden = [];
    this.follow = new FollowCam();
    this.t0 = performance.now();
    this.light = { glow: [0, 0, 0], amb: [1, 1, 1] };
    this.shadowTex = shadowTexture();
    if (this.full) {
      this.arena = arenaFn(map);
      this.scene.add(this.arena.group);
      this.scene.background = new THREE.Color(this.arena.bg);
      this.scene.fog = new THREE.Fog(this.arena.fog.color, this.arena.fog.near, this.arena.fog.far);
      this.light = { glow: this.arena.light.glow.map((c) => c * this.arena.light.strength), amb: this.arena.light.amb };
    } else {
      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1));
    }
  }

  // מחבר את הלוחמים: מסתיר את הציור הדו-ממדי שלהם ב-Phaser (בלי לשנות את מצבם)
  attach(fighters) {
    fighters.forEach((f) => {
      const rim = ELEMENTS[f.def.element].color;
      const g = new THREE.Group();
      const front = new THREE.Mesh(sharedGeometry(), makeMaterial(1, rim));
      const back = new THREE.Mesh(sharedGeometry(), makeMaterial(-1, rim));
      g.add(front, back);
      g.position.z = f.uid * 4;
      this.scene.add(g);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false, fog: false }));
      shadow.position.z = -3;
      this.scene.add(shadow);
      this.items.set(f.uid, { g, front, back, shadow, sx: f.vis.flipX ? -1 : 1, tilt: 0 });
      f.vis.renderWebGL = () => {};   // לא מצייר ב-Phaser
      f.vis.renderCanvas = () => {};
      this.hidden.push(f.vis);
    });
  }

  sync(fighters) {
    const t = (performance.now() - this.t0) / 1000;
    if (this.full) {
      this.follow.update(fighters);
      const { cx, cy, zoom } = this.follow;
      this.cam.position.set(cx - W / 2, H / 2 - cy, DIST / zoom);
      this.arena.update(t);
    }
    for (const f of fighters) {
      const it = this.items.get(f.uid), v = f.vis;
      if (!it) continue;
      it.g.visible = v.visible && v.alpha > 0.01;
      it.shadow.visible = it.g.visible && (f.body.blocked.down || f.body.touching.down);
      if (!it.g.visible) continue;
      const src = v.texture.getSourceImage && v.texture.getSourceImage();
      if (!src || !src.width) { it.g.visible = false; continue; }
      const entry = buildTex(v.texture.key, src);
      const dw = Math.abs(v.displayWidth), dh = Math.abs(v.displayHeight), thick = dh * 0.2;
      [it.front, it.back].forEach((m) => {
        setEntry(m.material, entry, dw, dh, thick);
        m.scale.set(dw, dh, 1);
        const u = m.material.uniforms;
        u.uAlpha.value = v.alpha;
        u.uGlow.value.set(...this.light.glow); u.uAmb.value.set(...this.light.amb);
        if (v.isTinted && v.tintFill) {
          const c = v.tintTopLeft;
          u.uTint.value.set(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255, 1);
        } else u.uTint.value.set(0, 0, 0, 0);
      });
      it.g.position.x = v.x - W / 2;
      it.g.position.y = H / 2 - v.y;
      it.shadow.position.set(v.x - W / 2, H / 2 - f.body.bottom + 2, -3);
      it.shadow.scale.set(dw * 0.75, 18, 1);
      // היפוך כיוון = פנייה (הסקאלה עוברת דרך אפס), והטיית מבט 3/4 לכיוון המצלמה
      it.sx += ((v.flipX ? -1 : 1) - it.sx) * 0.4;
      it.tilt += (-f.facing * 0.4 - it.tilt) * 0.25;
      it.g.scale.x = it.sx;
      it.g.rotation.set(0, it.tilt, (-v.angle * Math.PI) / 180);
    }
    this.r.render(this.scene, this.cam);
  }

  // מצב המצלמה, להעברה ל-Phaser (רק ברמת "מלא")
  camState() { return this.full ? this.follow : null; }

  dispose() {
    this.hidden.forEach((v) => { delete v.renderWebGL; delete v.renderCanvas; });
    this.hidden = [];
    this.scene.traverse((o) => { if (o.material && o.material.dispose) o.material.dispose(); if (o.geometry && o.geometry !== sharedGeometry() && o.geometry.dispose) o.geometry.dispose(); });
    this.r.domElement.remove();
    this.r.dispose();
    this.r.forceContextLoss && this.r.forceContextLoss();
  }
}
