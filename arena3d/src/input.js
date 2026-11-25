// שליטה כמו במסך "איך משחקים": ג'ויסטיק (כיוון) + A (תקיפה) + B (הגנה) + X (אולטימטיבית).
// currentMove() = וקטור התנועה/הכיוון (y חיובי = קדימה = לכיוון היריב). pressed(name) = לחיצה (נשארת 90ms), held(name) = מוחזק.
export const input = { move: { x: 0, y: 0 }, a: false, b: false, ult: false, _pulse: { a: 0, b: 0, ult: 0 } };
const keys = new Set();
export const pressed = (n) => input[n] || performance.now() < input._pulse[n];
export const held = (n) => input[n];
const press = (n) => { input[n] = true; input._pulse[n] = performance.now() + 90; };
const release = (n) => { input[n] = false; };

export function initInput(root) {
  const KMAP = { KeyJ: 'a', KeyZ: 'a', KeyK: 'b', KeyX: 'b', KeyL: 'ult', KeyC: 'ult' };
  addEventListener('keydown', (e) => { if (KMAP[e.code]) { if (!input[KMAP[e.code]]) press(KMAP[e.code]); e.preventDefault(); } keys.add(e.code); });
  addEventListener('keyup', (e) => { if (KMAP[e.code]) release(KMAP[e.code]); keys.delete(e.code); });
  const base = root.querySelector('#joy-base'), knob = root.querySelector('#joy-knob'), stage = root.querySelector('#touch-left');
  let joyId = null, cx = 0, cy = 0; const R = 56;
  stage.addEventListener('pointerdown', (e) => {
    if (joyId !== null) return; joyId = e.pointerId; stage.setPointerCapture(e.pointerId);
    const r = stage.getBoundingClientRect(); cx = e.clientX; cy = e.clientY;
    base.style.cssText = `left:${cx - r.left}px;top:${cy - r.top}px;opacity:1`; knob.style.transform = 'translate(0,0)';
  });
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joyId) return;
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
    if (d > R) { dx = dx / d * R; dy = dy / d * R; }
    knob.style.transform = `translate(${dx}px,${dy}px)`; input.move.x = dx / R; input.move.y = -dy / R;
  });
  const end = (e) => { if (e.pointerId !== joyId) return; joyId = null; input.move.x = 0; input.move.y = 0; base.style.opacity = '.35'; knob.style.transform = 'translate(0,0)'; };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  [['#btn-a', 'a'], ['#btn-b', 'b'], ['#btn-x', 'ult']].forEach(([sel, name]) => {
    const el = root.querySelector(sel);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); press(name); el.classList.add('on'); });
    const up = () => { release(name); el.classList.remove('on'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
}
export function currentMove() {
  let x = input.move.x, y = input.move.y;
  if (!x && !y) {
    x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    y = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  }
  return { x, y };
}
// כיוון ג'ויסטיק בדיד: 'none' אם קטן מדי
export function joyDir() {
  const m = currentMove(); if (Math.hypot(m.x, m.y) < 0.45) return 'none';
  return Math.abs(m.y) > Math.abs(m.x) ? (m.y > 0 ? 'up' : 'down') : (m.x > 0 ? 'right' : 'left');
}
