import { LOGOS } from './profile.js';

// הודעות בין שני הטלפונים. המארח (host) מחליט הכול, והאורח (guest) מציג ושולח תשובות.
// כל ההודעות של המארח כתובות מנקודת המבט שלו: "me" = המארח, "bot" = היריב (האורח).
// toGuest הופך אותן לנקודת המבט של האורח.
export const flip = (who) => (who === 'me' ? 'bot' : 'me');

const flipOutcome = (o) => (o === 'win' ? 'lose' : o === 'lose' ? 'win' : o);

export function toGuest(m) {
  switch (m.t) {
    case 'ev':
      return { ...m, who: flip(m.who), turn: flip(m.turn), lives: { me: m.lives.bot, bot: m.lives.me } };
    case 'turn':
    case 'start':
      return { ...m, turn: flip(m.turn) };
    case 'end':
      return { ...m, winner: flip(m.winner), score: [m.score[1], m.score[0]] };
    case 'intro':
      return { ...m, score: [m.score[1], m.score[0]] };
    case 'final':
      return { ...m, outcome: flipOutcome(m.outcome) };
    default:
      return m;
  }
}

export const MAX_ANSWER = 60;

/** המארח מקבל תשובה מהאורח רק בתורו, ורק טקסט קצר. */
export function acceptAnswer(S, m) {
  return !!m && m.t === 'answer' && typeof m.text === 'string' && m.text.length > 0 && m.text.length <= MAX_ANSWER && !S.over && S.turn === 'bot';
}

/** שם שמגיע מהיריב: טקסט קצר בלבד. */
export const cleanName = (s, fallback = 'שחקן') => {
  const t = typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, 14) : '';
  return t || fallback;
};

/** לוגו שמגיע מהיריב: רק מהרשימה המותרת. */
export const cleanLogo = (l) => (LOGOS.includes(l) ? l : undefined);
