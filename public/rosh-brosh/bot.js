// יריב ממוחשב שנראה כמו שחקן אמיתי: שם, תמונה וגביעים קרובים לשלך,
// ותשובות שמגיעות בקצב אנושי (לא מיד, לא כולן, עם הפסקות).
const NAMES = ['שימי ביטון', 'יוני הררי', 'שמרית', 'חגית דהן', 'שיר דאום', 'נועם כהן', 'דנה לוי', 'איתי מזרחי', 'מיכל אברהם', 'רועי פרידמן', 'תמר ביטון', 'גיא שמעוני', 'הילה ברק', 'עומר אזולאי', 'ליאור אוחיון', 'מאיה גבאי'];
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

/**
 * מתזמן את הניחושים של הבוט. מחזיר רשימה של { at (מילישניות), index }.
 * הבוט "יודע" כל תשובה בהסתברות skill, ועונה בין שנייה 2.5 לשנייה 27.
 */
export function planBotGuesses(answerCount, skill, rng = Math.random, seconds = ROUND_SECONDS) {
  const known = [];
  for (let i = 0; i < answerCount; i++) if (rng() < skill) known.push(i);
  for (let i = known.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [known[i], known[j]] = [known[j], known[i]];
  }
  let t = 2500 + rng() * 2500;
  const end = (seconds - 3) * 1000;
  const plan = [];
  for (const index of known) {
    if (t > end) break;
    plan.push({ at: Math.round(t), index });
    t += 1200 + rng() * 4200;
  }
  return plan;
}
