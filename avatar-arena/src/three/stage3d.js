// הקרב ב-2.5D: הלוחמים מצוירים כדמויות תלת-מימדיות ("איור מנופח") בקנבס נפרד מתחת ל-Phaser.
// ה-Phaser ממשיך לנהל פיזיקה, אנימציה ואפקטים. כאן רק קוראים את מיקום הדמות המצוירת (f.vis) ומציירים אותה מחדש בתלת-מימד.
import * as THREE from 'three';
import { buildTex } from './depth.js';
import { makeMaterial, sharedGeometry, setEntry } from './material.js';
import { ELEMENTS } from '../data/characters.js';

const W = 960, H = 540, DIST = 1500;

export class Stage3D {
  constructor(container) {
    this.r = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.r.setSize(W, H, false);
    this.r.setClearColor(0x000000, 0);
    const cv = this.r.domElement;
    cv.style.cssText = `width:${W}px;height:${H}px;display:block`;
    container.appendChild(cv);
    this.cam = new THREE.PerspectiveCamera((2 * Math.atan(H / 2 / DIST) * 180) / Math.PI, W / H, 10, 6000);
    this.cam.position.set(0, 0, DIST);
    this.scene = new THREE.Scene();
    this.items = new Map();
    this.hidden = [];
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
      this.items.set(f.uid, { g, front, back, sx: f.vis.flipX ? -1 : 1, tilt: 0 });
      f.vis.renderWebGL = () => {};   // לא מצייר ב-Phaser
      f.vis.renderCanvas = () => {};
      this.hidden.push(f.vis);
    });
  }

  sync(fighters) {
    for (const f of fighters) {
      const it = this.items.get(f.uid), v = f.vis;
      if (!it) continue;
      it.g.visible = v.visible && v.alpha > 0.01;
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
        if (v.isTinted && v.tintFill) {
          const c = v.tintTopLeft;
          u.uTint.value.set(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255, 1);
        } else u.uTint.value.set(0, 0, 0, 0);
      });
      it.g.position.x = v.x - W / 2;
      it.g.position.y = H / 2 - v.y;
      // היפוך כיוון = פנייה (הסקאלה עוברת דרך אפס), והטיית מבט 3/4 לכיוון המצלמה
      it.sx += ((v.flipX ? -1 : 1) - it.sx) * 0.4;
      it.tilt += (-f.facing * 0.4 - it.tilt) * 0.25;
      it.g.scale.x = it.sx;
      it.g.rotation.set(0, it.tilt, (-v.angle * Math.PI) / 180);
    }
    this.r.render(this.scene, this.cam);
  }

  dispose() {
    this.hidden.forEach((v) => { delete v.renderWebGL; delete v.renderCanvas; });
    this.hidden = [];
    this.items.forEach((it) => { it.front.material.dispose(); it.back.material.dispose(); });
    this.r.domElement.remove();
    this.r.dispose();
    this.r.forceContextLoss && this.r.forceContextLoss();
  }
}
