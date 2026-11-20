// ארבע מכות + מכה סודית לכל דמות.
//  fx = שם הפונקציה ב-src/fx/moves.js, anim = שם האנימציה המוכנה (src/anim/bake.js)
//  windup = זמן הכנה עד השחרור (ms), recover = התאוששות, cooldown = קירור (ms)
//  range = טווח מרחק שבו הבוט משתמש במכה, type = melee | projectile | area (לפוזה ולבינה)
//  unlockStage = בשלב איזה שלב בסיפור המכה נפתחת (בהתחלה רק מכה 1)
//  charge = להציג זוהר הטענה ביד בזמן ההכנה
const M = (o) => ({ recover: 220, cooldown: 1000, type: 'projectile', range: [0, 500], ...o });

export const MOVES = {
  aang: [
    M({ id: 'airOrb', name: 'כדור אוויר', fx: 'airOrb', anim: 'm1', windup: 380, recover: 200, cooldown: 900, dmg: 7, kb: 280, range: [110, 520], charge: true, unlockStage: 0 }),
    M({ id: 'staffSwing', name: 'מכת מטה', fx: 'staffSwing', anim: 'm2', type: 'melee', windup: 170, recover: 170, cooldown: 650, dmg: 9, kb: 330, range: [0, 120], unlockStage: 1 }),
    M({ id: 'whirl', name: 'סערה', fx: 'whirl', anim: 'm3', type: 'area', windup: 240, recover: 260, cooldown: 1800, dmg: 8, kb: 420, range: [0, 100], unlockStage: 2 }),
    M({ id: 'gust', name: 'משב רוח', fx: 'gust', anim: 'm4', type: 'area', windup: 320, recover: 240, cooldown: 2200, dmg: 6, kb: 560, range: [0, 230], unlockStage: 3 }),
  ],
  katara: [
    M({ id: 'waterBurst', name: 'פיצוץ מים', fx: 'waterBurst', anim: 'm1', windup: 340, recover: 200, cooldown: 1000, dmg: 9, kb: 330, range: [110, 500], charge: true, unlockStage: 0 }),
    M({ id: 'waterWhip', name: 'שוט מים', fx: 'waterWhip', anim: 'm2', type: 'melee', windup: 150, recover: 170, cooldown: 650, dmg: 8, kb: 300, range: [0, 140], unlockStage: 1 }),
    M({ id: 'iceShards', name: 'רסיסי קרח', fx: 'iceShards', anim: 'm3', windup: 260, recover: 220, cooldown: 1600, dmg: 5, kb: 210, range: [120, 520], unlockStage: 2 }),
    M({ id: 'waterColumn', name: 'עמוד מים', fx: 'waterColumn', anim: 'm4', type: 'area', windup: 300, recover: 240, cooldown: 2000, dmg: 8, kb: 120, range: [40, 170], unlockStage: 3 }),
  ],
  toph: [
    M({ id: 'earthWall', name: 'קיר אדמה', fx: 'earthWall', anim: 'stomp', windup: 520, recover: 220, cooldown: 1500, dmg: 11, kb: 330, range: [100, 460], unlockStage: 0,
      ev: [{ at: 130, fn: 'weakPunch' }, { at: 260, fn: 'stompWall' }] }),
    M({ id: 'rockFist', name: 'אגרוף סלע', fx: 'rockFist', anim: 'm2', type: 'melee', windup: 260, recover: 200, cooldown: 900, dmg: 12, kb: 360, range: [0, 110], unlockStage: 1 }),
    M({ id: 'earthPillar', name: 'עמוד אדמה', fx: 'earthPillar', anim: 'stomp', type: 'area', windup: 380, recover: 260, cooldown: 2400, dmg: 10, kb: 120, range: [60, 360], unlockStage: 2 }),
    M({ id: 'rockThrow', name: 'זריקת סלע', fx: 'rockThrow', anim: 'm4', windup: 360, recover: 220, cooldown: 1800, dmg: 14, kb: 400, range: [140, 520], unlockStage: 3 }),
  ],
  zuko: [
    M({ id: 'fireFist', name: 'אגרוף אש', fx: 'fireFist', anim: 'm2', windup: 300, recover: 200, cooldown: 900, dmg: 10, kb: 380, range: [100, 540], charge: true, unlockStage: 0 }),
    M({ id: 'flameKick', name: 'בעיטת להבה', fx: 'flameKick', anim: 'm2', type: 'melee', windup: 170, recover: 170, cooldown: 700, dmg: 9, kb: 340, range: [0, 130], unlockStage: 1 }),
    M({ id: 'fireBreath', name: 'נשימת אש', fx: 'fireBreath', anim: 'm4', type: 'area', windup: 240, recover: 300, cooldown: 2000, dmg: 3, kb: 130, range: [0, 170], unlockStage: 2 }),
    M({ id: 'fireWheel', name: 'גלגל אש', fx: 'fireWheel', anim: 'm3', windup: 260, recover: 220, cooldown: 2400, dmg: 6, kb: 220, range: [100, 500], unlockStage: 3 }),
  ],
};

export const ULTS = {
  aang: M({ id: 'tornado', name: 'זרם אוויר', fx: 'tornado', anim: 'ult', windup: 600, recover: 300, cooldown: 0, dmg: 5, kb: 280, range: [0, 420], charge: true, unlockStage: 4 }),
  katara: M({ id: 'tidalWave', name: 'גל ענק', fx: 'tidalWave', anim: 'ult', windup: 600, recover: 300, cooldown: 0, dmg: 22, kb: 700, range: [0, 520], charge: true, unlockStage: 4 }),
  toph: M({ id: 'giantRock', name: 'סלע עצום', fx: 'giantRock', anim: 'ult', type: 'area', windup: 650, recover: 300, cooldown: 0, dmg: 26, kb: 150, range: [0, 400], charge: true, unlockStage: 4 }),
  zuko: M({ id: 'lightning', name: 'ברק', fx: 'lightning', anim: 'ult', windup: 600, recover: 300, cooldown: 0, dmg: 28, kb: 700, range: [0, 600], charge: true, unlockStage: 4 }),
};
