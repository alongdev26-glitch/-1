// מתרגם פריים אנימציה (src/anim/bake.js ANIMS) לזוויות עצמות של הדמות התלת-מימדית.
// כל הזוויות סביב ציר z. חיובי = קדימה (+x). הפריים מכיל ערכי "F" שכבר מוגדרים כ"קדימה".
import { ANIMS } from '../../anim/bake.js';

const NEUTRAL = ANIMS.idle[0];
export const frameFor = (anim, i) => (ANIMS[anim] && ANIMS[anim][i]) || NEUTRAL;

// strikeI = האינדקס של היד המכה (src/data/rigs.js)
export function applyPose(root, fr, strikeI = 0) {
  const b = root.userData.bones;
  const kb = fr.kneeBoth || 0;
  b.hips.position.y = 0.49 - (fr.bob || 0) / 256;
  b.hips.rotation.z = 0;
  b.spine.rotation.set(0, (fr.torso || 0) * 1.6, -(fr.torso || 0) * 0.3 - (fr.torsoF || 0));
  b.neck.rotation.z = -(fr.head || 0) * 0.5 - (fr.headF || 0) * 0.6;
  b.head.rotation.z = -(fr.head || 0) * 0.5 - (fr.headF || 0) * 0.4;

  // רגליים: 0 = קדמית. הליכה סימטרית, ולכן הסימן לא משנה
  b.leg.forEach((L, i) => {
    const p = fr.leg[i];
    const front = i === 0;
    const bend = kb * (front ? 1 : 0.6) + (front ? fr.legK || 0 : 0);
    const step = front ? (fr.stepF || 0) + (fr.legF || 0) : -(fr.stepF || 0) * 0.6;
    L.th.rotation.z = p.h * 1.5 + step + bend * 0.9;
    L.kn.rotation.z = -(p.k * 1.4 + bend * 1.8);
  });

  // ידיים
  b.arm.forEach((A, i) => {
    const isStrike = i === strikeI || fr.off > 0;
    let s = fr.arm[i].s * 1.2, e = fr.arm[i].e * 1.2 + 0.1;
    if (isStrike) { s += (fr.strike || 0) * 0.9; e += Math.abs(fr.strikeE || 0) * 1.1; }
    else if (fr.strike) { s += -(fr.strike || 0) * 0.35; e += 0.2; }
    A.sh.rotation.z = s;
    A.sh.rotation.x = 0;
    A.el.rotation.z = e;
  });
}
