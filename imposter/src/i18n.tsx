import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Role } from './engine/game';

export type Lang = 'en' | 'he';

export interface Strings {
  question: (a: number, b: number) => string;
  player: (n: number) => string;
  howMany: string;
  howManySub: (min: number, max: number) => string;
  nameQ: (n: number) => string;
  nameAria: (n: number) => string;
  packsQ: string;
  packsSub: string;
  words: (n: number) => string;
  modeQ: string;
  classic: string;
  classicDesc: string;
  roles: string;
  rolesDesc: string;
  rolesNeed: (n: number) => string;
  impQ: string;
  impSub: (players: number, max: number) => string;
  back: string;
  next: string;
  startGame: string;
  soundAria: string;
  roleInfo: Record<Role, { title: string; blurb: string }>;
  eyebrow: string;
  yourClient: string;
  yourTarget: string;
  secretWord: string;
  holdReveal: string;
  releaseHide: string;
  nextPlayer: string;
  startPlaying: string;
  turn: (a: number, b: number) => string;
  givesClue: string;
  goVote: string;
  voteLocked: string;
  allSpoke: string;
  whoImposter: string;
  crewWins: string;
  imposterWins: string;
  jesterWins: string;
  tie: string;
  votedOut: (name: string) => string;
  wordWas: string;
  playAgain: string;
  backToSetup: string;
  arrow: string;
}

const en: Strings = {
  question: (a, b) => `Question ${a} of ${b}`,
  player: (n) => `Player ${n}`,
  howMany: 'How many players?',
  howManySub: (min, max) => `${min} to ${max} people on one phone.`,
  nameQ: (n) => `What's player ${n}'s name?`,
  nameAria: (n) => `Player ${n} name`,
  packsQ: 'What are you playing?',
  packsSub: 'Pick one or more categories.',
  words: (n) => `${n} words`,
  modeQ: 'Pick a mode',
  classic: 'Classic',
  classicDesc: 'One or more imposters. Everyone else shares the secret word.',
  roles: 'Roles',
  rolesDesc: 'Adds a Jester, plus a Bounty Hunter at 5 players and a Bodyguard at 6.',
  rolesNeed: (n) => `Needs ${n}+ players.`,
  impQ: 'How many imposters?',
  impSub: (p, m) => `With ${p} players you can have up to ${m}.`,
  back: 'Back',
  next: 'Next',
  startGame: 'Start game',
  soundAria: 'Sound and vibration',
  roleInfo: {
    imposter: { title: 'Imposter', blurb: 'Blend in with the innocents and avoid suspicion.' },
    innocent: { title: 'Innocent', blurb: 'Work with the group to find and expose the imposters.' },
    jester: { title: 'Jester', blurb: 'Create chaos and misdirection. You win if the group votes you out.' },
    bodyguard: { title: 'Bodyguard', blurb: 'Secretly shield a fellow imposter-team player from suspicion.' },
    bounty: { title: 'Bounty Hunter', blurb: 'Target a specific imposter-team player and work to expose them.' },
  },
  eyebrow: 'Identity confirmed',
  yourClient: 'Your client',
  yourTarget: 'Your target',
  secretWord: 'Secret word',
  holdReveal: 'Press and hold to reveal',
  releaseHide: 'Release to hide',
  nextPlayer: 'Next player',
  startPlaying: 'Start playing',
  turn: (a, b) => `Turn ${a} of ${b}`,
  givesClue: 'Gives a one-word clue.',
  goVote: 'Go to vote',
  voteLocked: 'Vote (after everyone speaks)',
  allSpoke: 'Everyone has spoken. You can vote now.',
  whoImposter: 'Who do you think is the imposter?',
  crewWins: 'The crew wins! 🎉',
  imposterWins: 'The imposter wins! 😈',
  jesterWins: 'The jester wins! 🃏',
  tie: 'The vote was tied, so nobody was caught.',
  votedOut: (n) => `The group voted out ${n}.`,
  wordWas: 'The word was',
  playAgain: 'Play again',
  backToSetup: 'Back to setup',
  arrow: '→',
};

const he: Strings = {
  question: (a, b) => `שאלה ${a} מתוך ${b}`,
  player: (n) => `שחקן ${n}`,
  howMany: 'כמה שחקנים?',
  howManySub: (min, max) => `${min} עד ${max} אנשים על טלפון אחד.`,
  nameQ: (n) => `איך קוראים לשחקן ${n}\u200F?`,
  nameAria: (n) => `שם שחקן ${n}`,
  packsQ: 'על מה משחקים?',
  packsSub: 'אפשר לבחור כמה קטגוריות.',
  words: (n) => `${n} מילים`,
  modeQ: 'בחרו מצב',
  classic: 'קלאסי',
  classicDesc: 'מתחזה אחד או יותר. כל השאר מכירים את המילה הסודית.',
  roles: 'תפקידים',
  rolesDesc: 'מוסיף ליצן, וציד ראשים מ-5 שחקנים ושומר ראש מ-6.',
  rolesNeed: (n) => `צריך ${n}+ שחקנים.`,
  impQ: 'כמה מתחזים?',
  impSub: (p, m) => `עם ${p} שחקנים אפשר עד ${m}.`,
  back: 'חזרה',
  next: 'הבא',
  startGame: 'התחל משחק',
  soundAria: 'צלילים ורטט',
  roleInfo: {
    imposter: { title: 'מתחזה', blurb: 'התערבבו בין החפים מפשע ואל תיתפסו.' },
    innocent: { title: 'חף מפשע', blurb: 'עבדו עם הקבוצה כדי לחשוף את המתחזים.' },
    jester: { title: 'ליצן', blurb: 'עשו בלגן ובלבלו את כולם. מנצחים אם מצביעים נגדכם.' },
    bodyguard: { title: 'שומר ראש', blurb: 'הגנו בסתר על שחקן מקבוצת המתחזים מפני חשד.' },
    bounty: { title: 'ציד ראשים', blurb: 'המטרה שלכם שחקן ספציפי מקבוצת המתחזים. חשפו אותו.' },
  },
  eyebrow: 'הזהות אושרה',
  yourClient: 'הלקוח שלך',
  yourTarget: 'המטרה שלך',
  secretWord: 'המילה הסודית',
  holdReveal: 'החזק לחוץ כדי לחשוף',
  releaseHide: 'עזוב כדי להסתיר',
  nextPlayer: 'השחקן הבא',
  startPlaying: 'מתחילים לשחק',
  turn: (a, b) => `תור ${a} מתוך ${b}`,
  givesClue: 'אומר רמז של מילה אחת.',
  goVote: 'עוברים להצבעה',
  voteLocked: 'הצבעה (אחרי שכולם מדברים)',
  allSpoke: 'כולם דיברו. אפשר להצביע.',
  whoImposter: 'מי לדעתך המתחזה?',
  crewWins: 'הצוות ניצח! 🎉',
  imposterWins: 'המתחזה ניצח! 😈',
  jesterWins: 'הליצן ניצח! 🃏',
  tie: 'תיקו בהצבעה, אף אחד לא נתפס.',
  votedOut: (n) => `הקבוצה הצביעה נגד ${n}.`,
  wordWas: 'המילה הייתה',
  playAgain: 'סיבוב נוסף',
  backToSetup: 'חזרה להגדרות',
  arrow: '←',
};

const STRINGS: Record<Lang, Strings> = { en, he };
const KEY = 'imposter.lang';

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
}

const LangContext = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: en });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return localStorage.getItem(KEY) === 'he' ? 'he' : 'en';
    } catch {
      return 'en';
    }
  });
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* storage unavailable */
    }
  };
  return <LangContext.Provider value={{ lang, setLang, t: STRINGS[lang] }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
