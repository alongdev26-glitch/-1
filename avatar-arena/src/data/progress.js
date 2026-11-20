// התקדמות השחקן. במשחק חופשי הכל פתוח. בסיפור, מכה N נפתחת בשלב N.
export const FREE_PLAY = true;

const KEY = 'avatar-arena-stage';
export function storyStage() {
  try { return +(localStorage.getItem(KEY) || 0); } catch { return 0; }
}
export function setStoryStage(n) {
  try { localStorage.setItem(KEY, String(n)); } catch { /* ignore */ }
}
export const isUnlocked = (move) => FREE_PLAY || storyStage() >= (move.unlockStage ?? 0);
