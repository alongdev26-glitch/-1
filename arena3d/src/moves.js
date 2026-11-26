// מכות לפי מסך "איך משחקים": A + כיוון הג'ויסטיק (מכה בסיסית / ימין / שמאל / למטה / למעלה), B + כיוון = הגנה, X = אולטימטיבית.
// כיוון "למעלה" = לכיוון היריב, "למטה" = לאחור. אינדקסים: 0 בסיסית, 1 ימין, 2 שמאל, 3 למטה, 4 למעלה, 5 אולט.
export const DIRS = ['none', 'right', 'left', 'down', 'up'];
export const ELEMENT = {
  toph: { name: 'אדמה', color: '#d9b36a', hex: 0xd9b36a, glow: 0xe8c47a, sup: 0xcfe85a },
  zuko: { name: 'אש', color: '#ff7a22', hex: 0xff7a22, glow: 0xffb347, sup: 0x5fb8ff },
};
export const MOVES = {
  toph: [
    { name: 'פטיש סלע', icon: '👊', kind: 'melee', anim: 'm1', dur: 0.66, hitAt: 0.55, cd: 0.15, dmg: 11, kb: 7.5, range: 2.1 },
    { name: 'זריקת סלע', icon: '🪨', kind: 'boulder', anim: 'm4', dur: 0.8, hitAt: 0.5, cd: 4.5, dmg: 17, kb: 8, speed: 11 },
    { name: 'טאטוא אדמה', icon: '🌀', kind: 'sweep', anim: 'm3', dur: 0.6, hitAt: 0.45, cd: 3, dmg: 11, kb: 7.5, range: 2.5 },
    { name: 'רעידת אדמה', icon: '🌋', kind: 'quake', anim: 'stomp', dur: 0.9, hitAt: 0.55, cd: 6, dmg: 18, kb: 9.5, radius: 3.6 },
    { name: 'עמוד סלע', icon: '⛰️', kind: 'pillar', anim: 'm2', dur: 0.7, hitAt: 0.45, cd: 3.5, dmg: 14, kb: 7 },
    { name: 'מצב סופר: כוח האדמה', icon: '🌟', kind: 'super', anim: 'ult', dur: 1.6, hitAt: 0.62, cd: 0, dmg: 0, kb: 0, radius: 7 },
  ],
  zuko: [
    { name: 'דקירת אש', icon: '👊', kind: 'melee', anim: 'm2', dur: 0.3, hitAt: 0.45, cd: 0.05, dmg: 5, kb: 3.6, range: 2.3 },
    { name: 'כדור אש', icon: '🔥', kind: 'fireball', anim: 'm1', dur: 0.75, hitAt: 0.5, cd: 3, dmg: 14, kb: 7, speed: 13 },
    { name: 'נשיפת להבות', icon: '🌪️', kind: 'flamethrower', anim: 'm4', dur: 1.1, hitAt: 0.3, cd: 6, dmg: 4, kb: 2.5, range: 4.4 },
    { name: 'טבעת אש', icon: '⭕', kind: 'firering', anim: 'm3', dur: 0.85, hitAt: 0.55, cd: 6, dmg: 16, kb: 9, radius: 3.4 },
    { name: 'בעיטת להבות', icon: '🦶', kind: 'flamekick', anim: 'jump', dur: 0.7, hitAt: 0.35, cd: 4, dmg: 15, kb: 8 },
    { name: 'מצב סופר: אש כחולה', icon: '🔵', kind: 'super', anim: 'ult', dur: 1.6, hitAt: 0.62, cd: 0, dmg: 0, kb: 0, radius: 7 },
  ],
};
// הגנה: B לבד = חסימה (מחזיקים), B + כיוון = קפיצה/גלגול. dur בשניות
export const DEFENSE = {
  right: { name: 'קפיצה ימינה', icon: '↗️' }, left: { name: 'קפיצה שמאלה', icon: '↖️' },
  down: { name: 'סלטה אחורית', icon: '🤸' }, up: { name: 'גלגול', icon: '🌀' },
};
export const SUPER_TIME = 30;   // משך מצב סופר בשניות (טרנספורמציה חד-פעמית, נטענת במד)
