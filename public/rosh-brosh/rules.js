// חוקי הסיבוב: לכל שחקן 3 חיים. טעות או סוף זמן מורידים חיים והתור עובר.
// מי שנשאר בלי חיים מפסיד. אם נגמרו התשובות, מי שנתן את האחרונה מנצח.
export const LIVES = 3;
export const other = (who) => (who === 'me' ? 'bot' : 'me');

export function newRound(n, first = 'me') {
  return { n, found: Array(n).fill(null), count: 0, lives: { me: LIVES, bot: LIVES }, turn: first, last: null, over: null };
}

/** תשובה נכונה של who לאינדקס i. מתעלם אם זה לא תורו או שהתשובה כבר נמצאה. */
export function hit(s, who, i) {
  if (s.over || s.turn !== who || s.found[i]) return s;
  s.found[i] = who;
  s.count += 1;
  s.last = who;
  if (s.count === s.n) s.over = { winner: who, reason: 'last' };
  else s.turn = other(who);
  return s;
}

/** טעות או סוף זמן של who. */
export function miss(s, who) {
  if (s.over || s.turn !== who) return s;
  s.lives[who] -= 1;
  if (s.lives[who] <= 0) s.over = { winner: other(who), reason: 'lives' };
  else s.turn = other(who);
  return s;
}
