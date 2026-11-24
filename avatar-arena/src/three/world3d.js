// הקרב בתלת-מימד: רנדרר אחד לזירה (ברמת "מלא") ולדמויות. Phaser ממשיך לנהל פיזיקה ואפקטים (קנבס שקוף מעל).
// ה-Phaser מצייר את הדמויות ב-f.vis. כאן קוראים את מצבו ומציירים מחדש בתלת-מימד.
import * as THREE from 'three';
import { buildTex } from './depth.js';
import { makeMaterial, sharedGeometry, setEntry } from './material.js';
import { shadowTexture, DIST } from './helpers.js';
import { ARENAS } from './arenas/index.js';
import { FollowCam } from './camera.js';
import { ELEMENTS } from '../data/characters.js';
import { RIGS } from '../data/rigs.js';
import { buildHumanoid } from './models/humanoid.js';
import { applyPose, frameFor } from './models/pose.js';

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
    const key = new THREE.DirectionalLight(0xfff0e0, 1.6); key.position.set(-300, 500, 700); this.scene.add(key);
    this.scene.add(new THREE.HemisphereLight(0xffe6cc, 0x553322, 0.7));
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
      const model = buildHumanoid(f.def.id);
      g.add(model);
      front.visible = back.visible = false;
      g.position.z = f.uid * 4;
      this.scene.add(g);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false, fog: false }));
      shadow.position.z = -3;
      this.scene.add(shadow);
      this.items.set(f.uid, { g, front, back, model, yaw: f.facing > 0 ? -0.45 : Math.PI + 0.45, shadow, sx: f.vis.flipX ? -1 : 1, tilt: 0 });
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
      const dh = Math.abs(v.displayHeight), dw = Math.abs(v.displayWidth);
      const m = /^bk_[a-z]+_([a-z0-9]+)_(\d+)$/.exec(v.texture.key);
      const fr = frameFor(m ? m[1] : 'idle', m ? +m[2] : 0);
      applyPose(it.model, fr, (RIGS[f.def.id] || {}).strike || 0);
      const H3 = dh * 0.92 * it.model.userData.build;
      it.model.scale.setScalar(H3);
      it.model.position.y = -dh / 2 + (dh - H3) * 0 - 4;
      it.model.traverse((o) => { if (o.material && o.material.emissive) o.material.emissive.setRGB(0, 0, 0); });
      if (v.isTinted && v.tintFill) {
        const c = v.tintTopLeft;
        it.model.traverse((o) => { if (o.material && o.material.emissive) o.material.emissive.setRGB(((c >> 16) & 255) / 255 * 0.8, ((c >> 8) & 255) / 255 * 0.8, (c & 255) / 255 * 0.8); });
      }
      it.g.position.x = v.x - W / 2;
      it.g.position.y = H / 2 - v.y;
      it.shadow.position.set(v.x - W / 2, H / 2 - f.body.bottom + 2, -3);
      it.shadow.scale.set(dw * 0.6, 18, 1);
      const target = f.facing > 0 ? -0.45 : Math.PI + 0.45;
      let d = target - it.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      it.yaw += d * 0.3;
      it.model.rotation.y = it.yaw;
      it.g.rotation.set(0, 0, (-v.angle * Math.PI) / 180);
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
