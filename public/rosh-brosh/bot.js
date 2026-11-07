// יריב ממוחשב שנראה כמו שחקן אמיתי: שם, תמונה וגביעים קרובים לשלך,
// ותשובות שמגיעות בקצב אנושי (לא מיד, לא כולן, עם הפסקות).
export const NAMES = ['שימי ביטון', 'יוני הררי', 'שמרית', 'חגית דהן', 'שיר דאום', 'נועם כהן', 'דנה לוי', 'איתי מזרחי', 'מיכל אברהם', 'רועי פרידמן', 'תמר ביטון', 'גיא שמעוני', 'הילה ברק', 'עומר אזולאי', 'ליאור אוחיון', 'מאיה גבאי'];
const FACES = [['😀', '#d98c5f'], ['🧔', '#6aa5c8'], ['👩‍🦰', '#c97aa3'], ['🧑‍🦱', '#8fbf7a'], ['👱‍♀️', '#e0b44d'], ['👨‍🦳', '#9b8fd1'], ['🧑', '#c8826a'], ['👩', '#6fb7a8']];

export const ROUND_SECONDS = 30;

export function makeOpponent(myTrophies, rng = Math.random) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const [face, color] = pick(FACES);
  const spread = Math.max(15, Math.round(myTrophies * 0.4));
  const trophies = Math.max(0, Math.round(myTrophies + (rng() * 2 - 1) * spread));
  return { name: pick(NAMES), face, color, trophies };
}

/** רמת הבוט: 0.35 עד 0.8, עולה עם הגביעים של היריב. */
export function botSkill(opp) {
  return Math.min(0.8, Math.max(0.35, 0.4 + opp.trophies / 1500));
}

export const TURN_SECONDS = 10;

/**
 * התור של הבוט: חושב 2 עד 6 שניות, ואז עונה נכון בהסתברות skill
 * (תשובה אקראית מבין הפתוחות) או מחטיא (index = null).
 */
export function planBotTurn(open, skill, rng = Math.random) {
  const delay = Math.round(2000 + rng() * 4000);
  if (!open.length || rng() >= skill) return { delay, index: null };
  return { delay, index: open[Math.floor(rng() * open.length)] };
}
