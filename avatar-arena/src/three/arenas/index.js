import { buildFireArena } from './fire.js';

// מפות שיש להן זירה תלת-מימדית. לאחרות (ברמת "תלת-מימד מלא") נשארת הזירה הדו-ממדית והדמויות בתלת-מימד.
export const ARENAS = { fire: buildFireArena };
