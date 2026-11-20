// מקור האמת לכל דמות. כדי להוסיף דמות חדשה מוסיפים כאן אובייקט אחד.
// poses = רשימת פוזות נוספות שיש להן קובץ ב-public/sprites/{id}_{pose}.png (attack, special, hit, jump).
// poseFaces = לאן איורי הפוזות פונים (ברירת מחדל: ימינה). poseScale = כוונון גודל לפוזה (ברירת מחדל 1).
// faces = לאיזה כיוון האיור המקורי פונה (1 ימינה, -1 שמאלה).
// tier = רמת כוח (1 חלש ... 5 חזק), unlockStage = בשלב איזה שלב בסיפור היא נפתחת.
export const ELEMENTS = {
  air:   { name: 'אוויר', color: 0xcfe8ff },
  water: { name: 'מים',   color: 0x3a8dde },
  earth: { name: 'אדמה',  color: 0x8a6a3b },
  fire:  { name: 'אש',    color: 0xe8541c },
};

import { MOVES, ULTS } from './moves.js';

export const CHARACTERS = [
  {
    id: 'aang', poses: [], poseFaces: 1, poseScale: {}, en: 'Aang', faces: -1, name: 'אנג', element: 'air', tier: 1, unlockStage: 0,
    stats: { speed: 280, jump: 520, weight: 0.8, doubleJumps: 2 },
  },
  {
    id: 'katara', poses: [], poseFaces: 1, poseScale: {}, en: 'Katara', faces: -1, name: 'קטרה', element: 'water', tier: 2, unlockStage: 1,
    stats: { speed: 250, jump: 480, weight: 1.0, doubleJumps: 1 },
  },
  {
    id: 'toph', poses: [], poseFaces: 1, poseScale: {}, en: 'Toph', faces: 1, name: 'טוף', element: 'earth', tier: 3, unlockStage: 2,
    stats: { speed: 210, jump: 440, weight: 1.4, doubleJumps: 1 },
  },
  {
    id: 'zuko', poses: [], poseFaces: 1, poseScale: {}, en: 'Zuko', faces: 1, name: 'זוקו', element: 'fire', tier: 4, unlockStage: 3,
    stats: { speed: 240, jump: 470, weight: 1.1, doubleJumps: 1 },
  },
];

CHARACTERS.forEach((c) => { c.moves = MOVES[c.id]; c.ult = ULTS[c.id]; });

export const byId = (id) => CHARACTERS.find((c) => c.id === id);
