// תמיכה בשלט קונסולה (Gamepad API, פריסה סטנדרטית של Xbox/PlayStation).
// בקרב: סטיק שמאלי או חיצים = תנועה פרופורציונית, A = קפיצה, X/Y/B/RB = מכות 1-4, RT/LT/LB = מכה סודית, Start = עצירה.
// בתפריטים: חיצים/סטיק = מעבר בין אפשרויות, A = אישור, B = חזרה.
export const pad = { active: false, axis: 0, up: false, down: false, jump: false, m: [false, false, false, false], ult: false };

const DEAD = 0.2;
let prev = {}, nextRepeat = {}, current = null, blockedUntil = 0;

// מתעלם מכפתורי הקרב לרגע (למשל אחרי שלחצו B כדי לחזור מעצירה, שלא יפעיל גם מכה)
export function blockInput(ms = 300) {
  blockedUntil = performance.now() + ms;
  pad.jump = false; pad.m = [false, false, false, false]; pad.ult = false; // גם מיד, לפני הקריאה הבאה
}

const btn = (g, i) => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5));

function find() {
  const list = (navigator.getGamepads && navigator.getGamepads()) || [];
  for (const g of list) if (g && g.connected) return g;
  return null;
}

// קריאה אחת בכל פריים. מחזירה אירועי לחיצה (קצה) לתפריטים.
export function pollPad(now = performance.now()) {
  const g = find();
  const ev = { nav: null, confirm: false, back: false, start: false };
  if (!g) {
    if (pad.active) { pad.active = false; pad.axis = 0; pad.up = pad.down = pad.jump = pad.ult = false; pad.m = [false, false, false, false]; }
    current = null; prev = {};
    return ev;
  }
  current = g;
  pad.active = true;
  // סטיק שמאלי עם אזור מת וקימור: ככל שמטים רחוק יותר התנועה חזקה יותר
  const ax = g.axes[0] || 0, ay = g.axes[1] || 0, mag = Math.hypot(ax, ay);
  const scale = mag < DEAD ? 0 : Math.pow((Math.min(1, mag) - DEAD) / (1 - DEAD), 1.3) / mag;
  const sx = ax * scale, sy = ay * scale;
  const dl = btn(g, 14), dr = btn(g, 15), du = btn(g, 12), dd = btn(g, 13);
  pad.axis = dl || dr ? (dr ? 1 : 0) - (dl ? 1 : 0) : sx;
  pad.up = du || sy < -0.55 || false;
  pad.down = dd || sy > 0.55;
  pad.jump = btn(g, 0);
  pad.m = [btn(g, 2), btn(g, 3), btn(g, 1), btn(g, 5)];
  pad.ult = btn(g, 7) || btn(g, 6) || btn(g, 4);
  if (now < blockedUntil) { pad.jump = false; pad.m = [false, false, false, false]; pad.ult = false; }

  const edge = (k, down) => { const was = prev[k]; prev[k] = down; return down && !was; };
  ev.confirm = edge('a', btn(g, 0));
  ev.back = edge('b', btn(g, 1));
  ev.start = edge('s', btn(g, 9));
  // ניווט עם חזרה אוטומטית כשמחזיקים
  const dirs = { left: dl || ax < -0.6, right: dr || ax > 0.6, up: du || ay < -0.6, down: dd || ay > 0.6 };
  for (const [d, on] of Object.entries(dirs)) {
    if (!on) { nextRepeat[d] = 0; continue; }
    if (!nextRepeat[d] || now >= nextRepeat[d]) { ev.nav = d; nextRepeat[d] = now + (nextRepeat[d] ? 170 : 380); }
  }
  return ev;
}

// רטט (אם השלט תומך)
export function rumble(ms = 100, strong = 0.5) {
  const a = current && current.vibrationActuator;
  if (a && a.playEffect) a.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: strong * 0.6 }).catch(() => {});
}
