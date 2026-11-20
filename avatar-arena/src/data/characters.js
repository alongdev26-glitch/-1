// מקור האמת לכל דמות. כדי להוסיף דמות חדשה מוסיפים כאן אובייקט אחד.
// faces = לאיזה כיוון האיור המקורי פונה (1 ימינה, -1 שמאלה).
// tier = רמת כוח (1 חלש ... 5 חזק), unlockStage = בשלב איזה שלב בסיפור היא נפתחת.
export const ELEMENTS = {
  air:   { name: 'אוויר', color: 0xcfe8ff },
  water: { name: 'מים',   color: 0x3a8dde },
  earth: { name: 'אדמה',  color: 0x8a6a3b },
  fire:  { name: 'אש',    color: 0xe8541c },
};

export const CHARACTERS = [
  {
    id: 'aang', faces: -1, name: 'אנג', element: 'air', tier: 1, unlockStage: 0,
    stats: { speed: 280, jump: 520, weight: 0.8, doubleJumps: 2 },
    attack: { dmg: 5, kb: 220, range: 46 },
    special: { name: 'משב רוח', dmg: 3, kb: 420, speed: 520, cooldown: 900, life: 500, size: 16, gravity: 0 },
  },
  {
    id: 'katara', faces: -1, name: 'קטרה', element: 'water', tier: 2, unlockStage: 1,
    stats: { speed: 250, jump: 480, weight: 1.0, doubleJumps: 1 },
    attack: { dmg: 6, kb: 240, range: 50 },
    special: { name: 'שוט מים', dmg: 8, kb: 320, speed: 440, cooldown: 1100, life: 700, size: 14, gravity: 0 },
  },
  {
    id: 'toph', faces: 1, name: 'טוף', element: 'earth', tier: 3, unlockStage: 2,
    stats: { speed: 210, jump: 440, weight: 1.4, doubleJumps: 1 },
    attack: { dmg: 8, kb: 270, range: 48 },
    special: { name: 'סלע', dmg: 12, kb: 380, speed: 360, cooldown: 1500, life: 900, size: 20, gravity: 300 },
  },
  {
    id: 'zuko', faces: 1, name: 'זוקו', element: 'fire', tier: 4, unlockStage: 3,
    stats: { speed: 240, jump: 470, weight: 1.1, doubleJumps: 1 },
    attack: { dmg: 9, kb: 280, range: 52 },
    special: { name: 'כדור אש', dmg: 14, kb: 400, speed: 480, cooldown: 1400, life: 900, size: 18, gravity: 0 },
  },
];

export const byId = (id) => CHARACTERS.find((c) => c.id === id);
