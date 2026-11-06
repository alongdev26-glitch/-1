// כלכלה: אנרגיה שמתמלאת עם הזמן, מטבעות, יהלומים וגביעים.
export const MAX_ENERGY = 5;
export const ENERGY_MS = 10 * 60 * 1000;
export const COST = { swap: 8, time: 6, joker: 12, refill: 20, coinPack: 10 };
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
