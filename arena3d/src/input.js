// שליטה: ג'ויסטיק צף במגע, מקלדת, וכפתורי A/B/X. state.move = וקטור (x,y) בטווח [-1,1] (y חיובי = קדימה).
export const input = { move: { x: 0, y: 0 }, attack: false, jump: false, special: false, _pulse: { attack: 0, jump: 0, special: 0 } };
const keys = new Set();
export function pressed(name) { // לחיצה קצרה לא הולכת לאיבוד (נשארת לחוצה עד 90ms)
  return input[name] || performance.now() < input._pulse[name];
}
function press(name) { input[name] = true; input._pulse[name] = performance.now() + 90; }
const release = (name) => { input[name] = false; };

export function initInput(root) {
  // מקלדת
  const KMAP = { KeyJ: 'attack', KeyK: 'special', Space: 'jump', KeyZ: 'attack', KeyX: 'special' };
  addEventListener('keydown', (e) => { if (KMAP[e.code]) { press(KMAP[e.code]); e.preventDefault(); } keys.add(e.code); });
  addEventListener('keyup', (e) => { if (KMAP[e.code]) release(KMAP[e.code]); keys.delete(e.code); });
  // ג'ויסטיק צף: כל נגיעה בחצי השמאלי של המסך
  const base = root.querySelector('#joy-base'), knob = root.querySelector('#joy-knob');
  let joyId = null, cx = 0, cy = 0; const R = 56;
  const stage = root.querySelector('#touch-left');
  stage.addEventListener('pointerdown', (e) => {
    if (joyId !== null) return; joyId = e.pointerId; stage.setPointerCapture(e.pointerId);
    const r = stage.getBoundingClientRect(); cx = e.clientX; cy = e.clientY;
    base.style.cssText = `left:${cx - r.left}px;top:${cy - r.top}px;opacity:1`; knob.style.transform = 'translate(0,0)';
  });
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joyId) return;
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
    if (d > R) { dx = dx / d * R; dy = dy / d * R; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    input.move.x = dx / R; input.move.y = -dy / R;
  });
  const end = (e) => { if (e.pointerId !== joyId) return; joyId = null; input.move.x = 0; input.move.y = 0; base.style.opacity = '.35'; knob.style.transform = 'translate(0,0)'; };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  // כפתורים
  [['#btn-a', 'attack'], ['#btn-b', 'jump'], ['#btn-x', 'special']].forEach(([sel, name]) => {
    const el = root.querySelector(sel);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); press(name); el.classList.add('on'); });
    const up = () => { release(name); el.classList.remove('on'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
  });
}
// קלט מקלדת כווקטור תנועה (אם אין ג'ויסטיק פעיל)
export function currentMove() {
  let x = input.move.x, y = input.move.y;
  if (!x && !y) {
    x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    y = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  }
  return { x, y };
}
