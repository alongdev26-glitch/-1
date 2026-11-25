// רמת הגרפיקה (נשמרת בטלפון): 'full' = זירה ודמויות בתלת-מימד, 'chars' = דמויות בלבד, 'off' = דו-ממד.
const KEY = 'avatar-arena-gfx';
const LEVELS = ['full', 'chars', 'off'];
let cache = null;
// ברירת מחדל: תמיד תלת-מימד מלא. טלפונים מדווחים לרוב על ליבות מעטות מהאמיתי (דפדפן), אז לא סומכים על hardwareConcurrency.
const auto = () => 'full';
export function quality() {
  if (cache === null) {
    try { const v = localStorage.getItem(KEY); cache = LEVELS.includes(v) ? v : auto(); } catch { cache = auto(); }
  }
  return cache;
}
export function setQuality(q) {
  cache = LEVELS.includes(q) ? q : 'chars';
  try { localStorage.setItem(KEY, cache); } catch { /* ignore */ }
}
export const nextQuality = () => LEVELS[(LEVELS.indexOf(quality()) + 1) % LEVELS.length];
export const is3D = () => quality() !== 'off';
export const QUALITY_LABEL = { full: 'תלת-מימד מלא', chars: 'דמויות בלבד', off: 'דו-ממד' };
