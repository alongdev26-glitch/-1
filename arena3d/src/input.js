// שליטה כמו במסך "איך משחקים": ג'ויסטיק (כיוון) + A (תקיפה) + B (הגנה) + X (אולטימטיבית).
// currentMove() = וקטור התנועה/הכיוון (y חיובי = קדימה = לכיוון היריב). pressed(name) = לחיצה (נשארת 90ms), held(name) = מוחזק.
export const input = { move: { x: 0, y: 0 }, a: false, b: false, ult: false, _pulse: { a: 0, b: 0, ult: 0 }, _dir: { a: 'none', b: 'none', ult: 'none' } };
const keys = new Set();
export const pressed = (n) => input[n] || performance.now() < input._pulse[n];
export const held = (n) => input[n];
const press = (n) => { input[n] = true; input._pulse[n] = performance.now() + 90; input._dir[n] = computeDir(); };
export const dirOf = (n) => input._dir[n];

// זיהוי כיוון מדויק: זוכרים את מצב הג'ויסטיק 160ms אחורה (האגודל זז כשלוחצים על A/B), לוקחים את הכיוון החזק ביותר, עם היסטרזיס בין הגזרות
const hist = []; let lastSector = 'none';
function sample() { const m = currentMove(), t = performance.now(); hist.push({ t, x: m.x, y: m.y }); while (hist.length && t - hist[0].t > 400) hist.shift(); }
const AXIS = { up: 0, right: 90, down: 180, left: -90 };
export function computeDir() {
  sample();
  const now = performance.now(); let best = null, bm = 0;
  for (const h of hist) if (now - h.t <= 160) { const mag = Math.hypot(h.x, h.y); if (mag >= 0.45) { best = h; bm = mag; break; } }          // הכיוון הראשון החזק בחלון (לפני שהאגודל זז)
  if (!best) for (const h of hist) if (now - h.t <= 160) { const mag = Math.hypot(h.x, h.y); if (mag > bm) { bm = mag; best = h; } }       // אחרת: הכי חזק
  if (!best || bm < 0.3) { lastSector = 'none'; return 'none'; }
  const ang = Math.atan2(best.x, best.y) * 180 / Math.PI;
  let d = Math.abs(ang) <= 45 ? 'up' : Math.abs(ang) >= 135 ? 'down' : (ang > 0 ? 'right' : 'left');
  if (lastSector !== 'none' && lastSector !== d) { const dd = Math.abs((((ang - AXIS[lastSector] + 180) % 360) + 360) % 360 - 180); if (dd < 55) d = lastSector; }
  lastSector = d; return d;
}
const release = (n) => { input[n] = false; };

export function initInput(root) {
  const KMAP = { KeyJ: 'a', KeyZ: 'a', KeyK: 'b', KeyX: 'b', KeyL: 'ult', KeyC: 'ult' };
  addEventListener('keydown', (e) => { keys.add(e.code); sample(); if (KMAP[e.code]) { if (!input[KMAP[e.code]]) press(KMAP[e.code]); e.preventDefault(); } });
  addEventListener('keyup', (e) => { if (KMAP[e.code]) release(KMAP[e.code]); keys.delete(e.code); sample(); });
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
    knob.style.transform = `translate(${dx}px,${dy}px)`; input.move.x = dx / R; input.move.y = -dy / R; sample();
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
