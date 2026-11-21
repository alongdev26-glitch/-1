// התקדמות השחקן (נשמרת ב-localStorage). במשחק חופשי הכל פתוח. בסיפור, מכה N נפתחת אחרי N שלבים.
const KEY = 'avatar-arena-story-v1';
let mode = 'free'; // 'free' | 'story'
export const setMode = (m) => { mode = m; };

const blank = () => ({ stars: {}, cleared: [], coins: 0, xp: 0, unlocked: ['zuko', 'katara', 'toph'], titles: [] });
export function story() {
  try { return { ...blank(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return blank(); }
}
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } }
export function resetStory() { save(blank()); }

export const storyStage = () => story().cleared.length;
export const starsOf = (id) => (story().stars[id] || []).filter(Boolean).length;
export const isCleared = (id) => story().cleared.includes(id);

// שומר תוצאת קרב. מחזיר מה השתנה (ניצחון ראשון, כוכבים חדשים, פרסים)
export function recordStory(stage, got) {
  const s = story();
  const prev = s.stars[stage.id] || [false, false, false];
  const merged = prev.map((v, i) => v || !!got[i]);
  const newStars = merged.filter(Boolean).length - prev.filter(Boolean).length;
  const first = got[0] && !s.cleared.includes(stage.id);
  const out = { first, newStars, coins: newStars * 50, xp: 0, unlockedChar: null, perk: null };
  s.stars[stage.id] = merged;
  if (first) {
    s.cleared.push(stage.id);
    out.coins += stage.reward.coins; out.xp = stage.reward.xp; out.perk = stage.perk;
    if (stage.perk?.kind === 'char' && !s.unlocked.includes(stage.perk.char)) { s.unlocked.push(stage.perk.char); out.unlockedChar = stage.perk.char; }
    if (stage.perk?.kind === 'title') s.titles.push(stage.perk.text);
  }
  s.coins += out.coins; s.xp += out.xp;
  save(s);
  return out;
}

// האם מכה זמינה. במשחק חופשי הכל פתוח, ובקרב סיפור רק השחקן מוגבל (היריבים מקבלים הכל)
export const isUnlocked = (move, human = true) => mode === 'free' || !human || storyStage() >= (move.unlockStage ?? 0);
