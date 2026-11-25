// מכות לפי מסך "איך משחקים": A + כיוון הג'ויסטיק (מכה בסיסית / ימין / שמאל / למטה / למעלה), B + כיוון = הגנה, X = אולטימטיבית.
// כיוון "למעלה" = לכיוון היריב, "למטה" = לאחור. אינדקסים: 0 בסיסית, 1 ימין, 2 שמאל, 3 למטה, 4 למעלה, 5 אולט.
export const DIRS = ['none', 'right', 'left', 'down', 'up'];
export const ELEMENT = {
  toph: { name: 'אדמה', color: '#d9b36a', hex: 0xd9b36a, glow: 0xe8c47a },
  zuko: { name: 'אש', color: '#ff7a22', hex: 0xff7a22, glow: 0xffb347 },
};
export const MOVES = {
  toph: [
    { name: 'אגרוף סלע', icon: '👊', kind: 'melee', anim: 'm2', dur: 0.46, hitAt: 0.5, cd: 0.1, dmg: 8, kb: 5.5 },
    { name: 'זריקת סלע', icon: '🪨', kind: 'boulder', anim: 'm1', dur: 0.8, hitAt: 0.5, cd: 4.5, dmg: 17, kb: 8, speed: 11 },
    { name: 'טאטוא אדמה', icon: '🌀', kind: 'sweep', anim: 'm3', dur: 0.6, hitAt: 0.45, cd: 3, dmg: 11, kb: 7.5, range: 2.5 },
    { name: 'רעידת אדמה', icon: '🌋', kind: 'quake', anim: 'stomp', dur: 0.9, hitAt: 0.55, cd: 6, dmg: 18, kb: 9.5, radius: 3.6 },
    { name: 'עמוד סלע', icon: '⛰️', kind: 'pillar', anim: 'm4', dur: 0.7, hitAt: 0.45, cd: 3.5, dmg: 14, kb: 7 },
    { name: 'סלע ענק', icon: '☄️', kind: 'meteor', anim: 'ult', dur: 1.3, hitAt: 0.6, cd: 0, dmg: 42, kb: 12, radius: 3.2 },
  ],
  zuko: [
    { name: 'אגרוף אש', icon: '👊', kind: 'melee', anim: 'm2', dur: 0.46, hitAt: 0.5, cd: 0.1, dmg: 8, kb: 5.5 },
    { name: 'כדור אש', icon: '🔥', kind: 'fireball', anim: 'm2', dur: 0.75, hitAt: 0.5, cd: 3, dmg: 14, kb: 7, speed: 13 },
    { name: 'נשיפת להבות', icon: '🌪️', kind: 'flamethrower', anim: 'm1', dur: 1.1, hitAt: 0.3, cd: 6, dmg: 4, kb: 2.5, range: 4.4 },
    { name: 'טבעת אש', icon: '⭕', kind: 'firering', anim: 'stomp', dur: 0.85, hitAt: 0.55, cd: 6, dmg: 16, kb: 9, radius: 3.4 },
    { name: 'בעיטת להבות', icon: '🦶', kind: 'flamekick', anim: 'm3', dur: 0.7, hitAt: 0.35, cd: 4, dmg: 15, kb: 8 },
    { name: 'ברק', icon: '⚡', kind: 'lightning', anim: 'ult', dur: 1.2, hitAt: 0.6, cd: 0, dmg: 40, kb: 11, radius: 2.2 },
  ],
};
// הגנה: B לבד = חסימה (מחזיקים), B + כיוון = קפיצה/גלגול. dur בשניות
export const DEFENSE = {
  right: { name: 'קפיצה ימינה', icon: '↗️' }, left: { name: 'קפיצה שמאלה', icon: '↖️' },
  down: { name: 'סלטה אחורית', icon: '🤸' }, up: { name: 'גלגול', icon: '🌀' },
};
