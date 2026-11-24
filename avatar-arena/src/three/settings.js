// מתג "גרפיקה 3D" (נשמר בטלפון). ברירת מחדל: פעיל.
const KEY = 'avatar-arena-3d';
let cache = null;
export function is3D() {
  if (cache === null) { try { cache = localStorage.getItem(KEY) !== '0'; } catch { cache = true; } }
  return cache;
}
export function set3D(v) {
  cache = !!v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* ignore */ }
}
