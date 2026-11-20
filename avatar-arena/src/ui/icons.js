// איור קטן לכל מכה (SVG, viewBox 40x40). הצבע בא מ-currentColor, כלומר מהאלמנט.
import { ELEMENTS } from '../data/characters.js';

const S = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
const P = {
  // אנג
  airOrb: `<circle cx="20" cy="20" r="6" fill="currentColor"/><path d="M20 6a14 14 0 0 1 14 14M34 24a14 14 0 0 1-20 10M8 22A12 12 0 0 1 18 8" ${S} stroke-width="3"/>`,
  staffSwing: `<path d="M8 33 32 7" ${S} stroke-width="3.5"/><path d="M12 12c8-6 18-2 22 8" ${S} stroke-width="2.5" opacity=".7"/><circle cx="31" cy="9" r="2.5" fill="currentColor"/>`,
  whirl: `<path d="M20 20m-3 0a3 3 0 1 1 6 0a6 6 0 1 1-12 0a9 9 0 1 1 18 0a12 12 0 1 1-24 0" ${S} stroke-width="3"/>`,
  gust: `<path d="M4 13h20a5 5 0 1 0-5-5M4 21h28a5 5 0 1 1-5 5M4 29h16" ${S} stroke-width="3"/>`,
  tornado: `<path d="M6 8h28M9 14h22M12 20h16M15 26h10M18 32h5" ${S} stroke-width="3.2"/>`,
  // קטרה
  waterBurst: `<path d="M20 5c6 8 9 12 9 17a9 9 0 0 1-18 0c0-5 3-9 9-17z" fill="currentColor"/><path d="M6 28 3 33M34 28l3 5M20 36v3" ${S} stroke-width="2.6"/>`,
  waterWhip: `<path d="M5 30c8-2 6-12 14-12s6 10 16 4" ${S} stroke-width="4"/><circle cx="35" cy="22" r="2.6" fill="currentColor"/>`,
  iceShards: `<path d="M5 20 16 15l8 5-8 5zM15 9l9-2 6 6-9 2zM15 31l9 2 6-6-9-2z" fill="currentColor" stroke="#fff" stroke-width="1" opacity=".95"/>`,
  waterColumn: `<rect x="13" y="4" width="14" height="32" rx="7" fill="currentColor" opacity=".9"/><path d="M13 14c4 3 10-3 14 0M13 22c4 3 10-3 14 0M13 30c4 3 10-3 14 0" ${S} stroke="#fff" stroke-width="1.8" opacity=".8"/>`,
  tidalWave: `<path d="M3 34c2-14 10-26 22-27 7 0 10 5 7 8-2 2-5 1-6-1 3 9 8 12 13 12v8z" fill="currentColor"/><circle cx="31" cy="11" r="2" fill="#fff"/><circle cx="24" cy="9" r="1.6" fill="#fff"/>`,
  // טוף
  earthWall: `<path d="M5 34V16l5-5 4 4 6-8 6 7 5-3 4 3v20z" fill="currentColor"/><path d="M5 25h30M5 31h30" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`,
  rockFist: `<rect x="9" y="14" width="19" height="16" rx="5" fill="currentColor"/><circle cx="12" cy="14" r="4.2" fill="currentColor"/><circle cx="18" cy="12" r="4.2" fill="currentColor"/><circle cx="24" cy="12" r="4.2" fill="currentColor"/><path d="M31 10l5-4M32 18h6M31 26l5 4" ${S} stroke-width="2.6"/>`,
  earthPillar: `<path d="M12 36V12l4-5 3 4 4-7 4 6 2-2 0 28z" fill="currentColor"/><path d="M6 36h28" ${S} stroke-width="3"/>`,
  rockThrow: `<path d="M24 22l-3-8 7-6 9 4 1 9-7 6z" fill="currentColor"/><path d="M4 34C8 18 16 12 22 14" ${S} stroke-width="2.6" stroke-dasharray="1 5"/>`,
  giantRock: `<path d="M4 36 9 14l9-8 14 2 6 12-4 16z" fill="currentColor"/><path d="M13 14l6 8-4 14M25 8l-4 14 9 3" ${S} stroke="#000" stroke-opacity=".3" stroke-width="2"/>`,
  // זוקו
  fireFist: `<path d="M20 3c3 7 11 9 11 20a11 11 0 0 1-22 0c0-4 2-6 4-9 1 3 3 4 4 4-1-6 0-10 3-15z" fill="currentColor"/><path d="M15 27h10" ${S} stroke="#fff" stroke-width="2.4" opacity=".8"/>`,
  flameKick: `<path d="M6 30C10 12 22 6 34 10c-6 2-10 6-10 10 4-2 8-1 10 3-9-1-18 2-28 7z" fill="currentColor"/>`,
  fireBreath: `<path d="M4 20 36 7v26z" fill="currentColor" opacity=".9"/><path d="M12 20 30 14M12 20l18 6" ${S} stroke="#fff" stroke-width="2" opacity=".7"/>`,
  fireWheel: `<circle cx="20" cy="20" r="13" ${S} stroke-width="4"/><path d="M20 7v26M7 20h26M11 11l18 18M29 11 11 29" ${S} stroke-width="2.4"/><circle cx="20" cy="20" r="4" fill="currentColor"/>`,
  lightning: `<path d="M23 2 8 22h9l-3 16 18-23h-10z" fill="currentColor" stroke="#fff" stroke-width="1.4"/>`,
};

const COLOR = { air: '#dff3ff', water: '#7cc4ff', earth: '#d2b07a', fire: '#ffb34a' };

// מחזיר SVG מוכן. הברק תמיד צהוב.
export function moveIcon(move, element, size = 28) {
  const body = P[move.id] || '';
  const color = move.id === 'lightning' ? '#ffe066' : COLOR[element] || '#fff';
  return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" style="color:${color};filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))" aria-hidden="true">${body}</svg>`;
}
export { ELEMENTS };
