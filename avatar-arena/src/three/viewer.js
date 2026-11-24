// צופה תלת-מימדי מסתובב לדמות (מסכי בחירה ו-VS). אפשר לגרור כדי לסובב.
import * as THREE from 'three';
import { buildTex } from './depth.js';
import { makeMaterial, sharedGeometry, setEntry } from './material.js';
import { byId, ELEMENTS } from '../data/characters.js';
import { is3D } from './settings.js';

const live = new Set();
export function destroyViewers() { live.forEach((v) => v.destroy()); live.clear(); }

export function createViewer(el, charId) {
  const def = byId(charId);
  if (!def || !is3D()) return null;
  let r;
  try { r = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch { return null; }
  const W = el.clientWidth || 160, H = el.clientHeight || 160;
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.setSize(W, H, false);
  r.setClearColor(0x000000, 0);
  const cv = r.domElement;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab';
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.appendChild(cv);

  const scene = new THREE.Scene();
  const fov = 24, cam = new THREE.PerspectiveCamera(fov, W / H, 1, 5000);
  const group = new THREE.Group();
  scene.add(group);
  const rim = ELEMENTS[def.element].color;
  const front = new THREE.Mesh(sharedGeometry(), makeMaterial(1, rim));
  const back = new THREE.Mesh(sharedGeometry(), makeMaterial(-1, rim));
  group.add(front, back);
  group.visible = false;

  let drag = 0, dragging = false, lastX = 0, raf = 0, dead = false, t0 = performance.now();
  const down = (e) => { dragging = true; lastX = e.clientX; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; };
  const move = (e) => { if (dragging) { drag += (e.clientX - lastX) * 0.012; lastX = e.clientX; } };
  const up = () => { dragging = false; cv.style.cursor = 'grab'; };
  cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

  const img = new Image();
  img.onload = () => {
    if (dead) return;
    const e = buildTex('spr_' + charId, img);
    const hpx = 200, wpx = hpx * e.aspect;
    // התאמה למכולה: הדמות ממלאת בערך 90% מהגובה או מהרוחב
    const fitH = hpx * 1.1, fitW = (wpx * 1.05 * H) / W;
    const view = Math.max(fitH, fitW);
    cam.position.set(0, hpx * 0.45, view / 2 / Math.tan((fov * Math.PI) / 360));
    cam.lookAt(0, hpx * 0.45, 0);
    [front, back].forEach((m) => { setEntry(m.material, e, wpx, hpx, hpx * 0.2); m.scale.set(wpx, hpx, 1); });
    group.position.y = 0;
    group.scale.x = def.faces > 0 ? 1 : -1; // כולם מביטים ימינה בתחילה
    group.visible = true;
    el.querySelectorAll('img').forEach((i) => { i.style.visibility = 'hidden'; });
  };
  img.src = `sprites/${charId}.png`;

  const loop = () => {
    if (dead) return;
    const t = (performance.now() - t0) / 1000;
    group.rotation.y = (dragging || drag ? drag : 0) + Math.sin(t * 0.9) * 0.6;
    group.position.y = Math.sin(t * 1.7) * 3;
    r.render(scene, cam);
    raf = requestAnimationFrame(loop);
  };
  loop();

  const api = {
    destroy() {
      dead = true; cancelAnimationFrame(raf);
      front.material.dispose(); back.material.dispose();
      cv.remove(); r.dispose(); r.forceContextLoss && r.forceContextLoss();
    },
  };
  live.add(api);
  return api;
}
