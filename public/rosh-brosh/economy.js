// כלכלה: אנרגיה שמתמלאת עם הזמן, מטבעות, יהלומים וגביעים.
export const MAX_ENERGY = 5;
export const ENERGY_MS = 10 * 60 * 1000;
export const COST = { swap: 10, time: 6, joker: 20, refill: 20, coinPack: 10 };
export const COIN_PACK = 100;
export const FREE_COINS = 25;
export const FREE_COINS_MS = 4 * 60 * 60 * 1000;
export const DAILY_GEMS = 10;

export const defaultSave = (now = Date.now()) => ({
  coins: 100, gems: 50, energy: MAX_ENERGY, energyAt: now, trophies: 0,
  played: 0, wins: 0, freeCoinsAt: 0, dailyDay: '', seen: [],
});

/** מוסיף אנרגיה שהצטברה מאז הפעם האחרונה. */
export function tickEnergy(s, now = Date.now()) {
  if (s.energy >= MAX_ENERGY) {
    s.energy = MAX_ENERGY;
    s.energyAt = now;
    return s;
  }
  const gained = Math.floor((now - s.energyAt) / ENERGY_MS);
  if (gained > 0) {
    s.energy = Math.min(MAX_ENERGY, s.energy + gained);
    s.energyAt = s.energy >= MAX_ENERGY ? now : s.energyAt + gained * ENERGY_MS;
  }
  return s;
}

export const energyCountdownMs = (s, now = Date.now()) => (s.energy >= MAX_ENERGY ? 0 : Math.max(0, ENERGY_MS - (now - s.energyAt)));

/** גובה את האנרגיה של משחק. מחזיר false אם אין. */
export function spendEnergy(s, now = Date.now()) {
  tickEnergy(s, now);
  if (s.energy < 1) return false;
  if (s.energy >= MAX_ENERGY) s.energyAt = now;
  s.energy -= 1;
  return true;
}

export function spend(s, kind, amount) {
  if (s[kind] < amount) return false;
  s[kind] -= amount;
  return true;
}

/** פרסים בסוף משחק: 'win' | 'lose' | 'draw'. */
export function rewards(outcome, myTrophies, oppTrophies) {
  if (outcome === 'win') {
    const bonus = Math.max(0, Math.min(10, Math.round((oppTrophies - myTrophies) / 10)));
    return { trophies: 20 + bonus, coins: 15 };
  }
  if (outcome === 'lose') return { trophies: -Math.min(myTrophies, 8), coins: 3 };
  return { trophies: 0, coins: 5 };
}

/** בוחר שאלה שעוד לא ראינו (ומאפס כשנגמרו). */
export function pickQuestion(total, seen, exclude = [], rng = Math.random) {
  let pool = [];
  for (let i = 0; i < total; i++) if (!seen.includes(i) && !exclude.includes(i)) pool.push(i);
  if (!pool.length) {
    seen.length = 0;
    for (let i = 0; i < total; i++) if (!exclude.includes(i)) pool.push(i);
  }
  const idx = pool[Math.floor(rng() * pool.length)];
  seen.push(idx);
  return idx;
}

// משימה יומית: לנצח 2 משחקים היום ולקבל יהלומים.
export const TASK_WINS = 2;
export const TASK_GEMS = 15;
export const dayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

/** מאפס את המשימה ביום חדש. מחזיר { wins, done, claimed }. */
export function taskState(s, now = Date.now()) {
  const day = dayKey(now);
  if (s.taskDay !== day) { s.taskDay = day; s.taskWins = 0; s.taskClaimed = false; }
  const wins = Math.min(TASK_WINS, s.taskWins || 0);
  return { wins, done: wins >= TASK_WINS, claimed: !!s.taskClaimed };
}
export function recordWin(s, now = Date.now()) {
  taskState(s, now);
  s.taskWins = (s.taskWins || 0) + 1;
  return s;
}
/** מחזיר true ונותן יהלומים אם המשימה הושלמה ועוד לא נלקחה. */
export function claimTask(s, now = Date.now()) {
  const t = taskState(s, now);
  if (!t.done || t.claimed) return false;
  s.taskClaimed = true;
  s.gems += TASK_GEMS;
  return true;
}

// ---------- פרס יומי עם רצף של 7 ימים ----------
export const DAILY_REWARDS = [
  { coins: 20, gems: 0 }, { coins: 30, gems: 5 }, { coins: 40, gems: 5 }, { coins: 50, gems: 10 },
  { coins: 60, gems: 10 }, { coins: 80, gems: 15 }, { coins: 120, gems: 25 },
];
const DAY_MS = 24 * 60 * 60 * 1000;

/** מצב הפרס היומי: האם נלקח היום, אורך הרצף, ומספר היום (1 עד 7) בתוך הרצף. */
export function dailyState(s, now = Date.now()) {
  const today = dayKey(now);
  const claimed = s.dailyDay === today;
  let streak = s.dailyStreak || 0;
  if (!claimed && s.dailyDay !== dayKey(now - DAY_MS)) streak = 0; // יום שלא נלקח מאפס את הרצף
  const day = claimed ? ((streak - 1) % 7) + 1 : (streak % 7) + 1;
  return { claimed, streak, day, reward: DAILY_REWARDS[day - 1] };
}
/** לוקח את הפרס. מחזיר { coins, gems, day } או null אם כבר נלקח היום. */
export function claimDailyReward(s, now = Date.now()) {
  const st = dailyState(s, now);
  if (st.claimed) return null;
  s.dailyStreak = st.streak + 1;
  s.dailyDay = dayKey(now);
  s.coins += st.reward.coins;
  s.gems += st.reward.gems;
  return { ...st.reward, day: st.day };
}

// ---------- מטבעות חינם ----------
export function freeCoinsState(s, now = Date.now()) {
  const msLeft = Math.max(0, (s.freeCoinsAt || 0) + FREE_COINS_MS - now);
  return { ready: msLeft === 0, msLeft };
}
export function claimFreeCoinsReward(s, now = Date.now()) {
  if (!freeCoinsState(s, now).ready) return null;
  s.coins += FREE_COINS;
  s.freeCoinsAt = now;
  return { coins: FREE_COINS };
}

// ---------- חנות ----------
export const SHOP = {
  coins: [
    { id: 'c100', coins: 100, gems: 10 },
    { id: 'c550', coins: 550, gems: 50, bonus: '+10%' },
    { id: 'c1200', coins: 1200, gems: 100, bonus: '+20%' },
  ],
  energy: [
    { id: 'e1', energy: 1, gems: 5 },
    { id: 'efull', energy: 'full', gems: 20 },
  ],
  // חבילות יהלומים בכסף אמיתי: מוצגות בלבד. תשלום אמיתי דורש Google Play Billing או ספק תשלומים.
  gems: [
    { id: 'g50', gems: 50, price: '₪5.90' },
    { id: 'g120', gems: 120, price: '₪11.90' },
    { id: 'g300', gems: 300, price: '₪24.90' },
    { id: 'g700', gems: 700, price: '₪49.90' },
  ],
};
/** קנייה ביהלומים. מחזיר { ok, error?, missing?, coins?, energy? }. */
export function buyItem(s, item, now = Date.now()) {
  if (item.price) return { ok: false, error: 'soon' };
  if (s.gems < item.gems) return { ok: false, error: 'gems', missing: item.gems - s.gems };
  if (item.energy !== undefined) {
    tickEnergy(s, now);
    if (s.energy >= MAX_ENERGY) return { ok: false, error: 'full' };
    s.gems -= item.gems;
    s.energy = item.energy === 'full' ? MAX_ENERGY : Math.min(MAX_ENERGY, s.energy + item.energy);
    if (s.energy >= MAX_ENERGY) s.energyAt = now;
    return { ok: true, energy: s.energy };
  }
  s.gems -= item.gems;
  s.coins += item.coins;
  return { ok: true, coins: item.coins };
}
