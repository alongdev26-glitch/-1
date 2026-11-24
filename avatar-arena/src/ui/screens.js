// תבניות המסכים. המבנה והמחלקות לקוחים מקוד ה-Tailwind ש-Stitch יצר.
// כל מחלקה כתובה כאן במלואה (בלי הרכבה בקוד) כדי ש-Tailwind יזהה אותה.
import { CHARACTERS } from '../data/characters.js';
import { moveIcon } from './icons.js';
import { MAPS } from '../data/maps.js';
import { mapPreview, ambientHTML } from './maps.js';

export const face = (c) => `sprites/${c.id}_face.png`;
const stars = (n, on, off) => Array.from({ length: 5 }, (_, i) => `<span class="${i < n ? on : off}">★</span>`).join('');
const starCount = (c) => Math.min(5, c.tier + 1);
const pct = (v, max) => Math.round(Math.max(8, Math.min(100, (v / max) * 100)));
const statsOf = (c) => ({
  atk: pct(c.moves.reduce((a, m) => a + m.dmg, 0) / c.moves.length, 14),
  def: pct(c.stats.weight, 1.4),
  spd: pct(c.stats.speed, 280),
});

// ---------- סגנון לפי אלמנט ----------
export const EL = {
  air: {
    label: 'אוויר', emoji: '💨', stars: 'text-[#f5c344]',
    card: 'border border-sky-800/80 hover:border-sky-500 bg-[#0f2035]/80', bar: 'bg-sky-600',
    portrait: 'from-[#1b314d] to-[#0f1b2c]', tag: 'bg-sky-600/80 border border-sky-300',
    vsBg: 'bg-[#2e75b6]', vsInner: 'bg-[#1d4f7e]', vsBorder: 'border-blue-300/40', vsDot: 'bg-sky-400',
    hudCard: 'bg-[#1c2430]/90 border-[#4d627a]', hudName: 'text-gray-300', hudDot: 'bg-[#f4a242] border-[#7d4e12]',
    hudFace: 'bg-[#e7be87] border-[#a27e50]', resBadge: 'bg-[#de6b35]/90',
  },
  water: {
    label: 'מים', emoji: '💧', stars: 'text-sky-400',
    card: 'border border-sky-800/80 hover:border-sky-500 bg-[#0f2035]/80', bar: 'bg-sky-600',
    portrait: 'from-[#163050] to-[#0c1a2d]', tag: 'bg-blue-700/80 border border-blue-400',
    vsBg: 'bg-[#2e75b6]', vsInner: 'bg-[#1d4f7e]', vsBorder: 'border-blue-300/40', vsDot: 'bg-blue-400',
    hudCard: 'bg-[#1c2e42]/90 border-[#3b759e]', hudName: 'text-[#8bc3eb]', hudDot: 'bg-[#41a2f1] border-[#144877]',
    hudFace: 'bg-[#a47b53] border-[#2b5980]', resBadge: 'bg-[#2c679e]/90',
  },
  earth: {
    label: 'אדמה', emoji: '🌿', stars: 'text-emerald-400',
    card: 'border border-emerald-800/80 hover:border-emerald-500 bg-[#0e241c]/80', bar: 'bg-emerald-600',
    portrait: 'from-[#143629] to-[#0a1e16]', tag: 'bg-emerald-700/80 border border-emerald-400',
    vsBg: 'bg-[#5b8a3c]', vsInner: 'bg-[#2f4a1f]', vsBorder: 'border-green-300/40', vsDot: 'bg-green-500',
    hudCard: 'bg-[#1d2b21]/90 border-[#44774e]', hudName: 'text-[#9bd99d]', hudDot: 'bg-[#75b84c] border-[#265311]',
    hudFace: 'bg-[#e7cb9f] border-[#40683c]', resBadge: 'bg-[#58793b]/90',
  },
  fire: {
    label: 'אש', emoji: '🔥', stars: 'text-amber-500',
    card: 'border border-red-900/80 hover:border-red-500 bg-[#281313]/80', bar: 'bg-red-600',
    portrait: 'from-[#3a1a1a] to-[#1c0d0d]', tag: 'bg-red-700/80 border border-red-400',
    vsBg: 'bg-[#c5492d]', vsInner: 'bg-[#852a1b]', vsBorder: 'border-red-300/40', vsDot: 'bg-red-500',
    hudCard: 'bg-[#331c19]/90 border-[#8f3f33]', hudName: 'text-[#f28e7e]', hudDot: 'bg-[#f34a36] border-[#6b160c]',
    hudFace: 'bg-[#e8be93] border-[#802f23]', resBadge: 'bg-[#88281d]/90',
  },
};

// ---------- תפריט ראשי ----------
export const menuScreen = () => `
<main dir="rtl" class="screen flex flex-col items-center justify-between select-none font-assistant">
  <div class="absolute inset-0 z-0 pointer-events-none">
    <div class="absolute inset-0 bg-gradient-to-b from-[#0e1726] via-[#1d273a] to-[#3e3436]"></div>
    <div class="absolute bottom-16 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-gradient-to-t from-[#c98342]/20 via-[#8a4e32]/10 to-transparent blur-3xl rounded-full"></div>
    <svg class="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1376 768">
      <polygon fill="#1b2233" opacity="0.45" points="0,520 220,440 380,480 620,380 750,450 960,370 1140,430 1376,360 1376,768 0,768"></polygon>
      <polygon fill="#141a27" opacity="0.8" points="0,580 180,480 340,540 510,430 680,510 890,410 1080,490 1260,400 1376,460 1376,768 0,768"></polygon>
      <polygon fill="#0d121c" points="0,640 140,560 290,610 460,520 630,590 840,490 1020,570 1220,480 1376,530 1376,768 0,768"></polygon>
      <path d="M0,670 Q320,630 688,650 T1376,640 L1376,768 L0,768 Z" fill="#0a0d15"></path>
    </svg>
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
  </div>

  <header class="relative z-10 w-full flex flex-col items-center pt-14">
    <div class="text-center tracking-tight flex flex-col items-center">
      <h1 class="text-[#F5BE34] font-black text-[42px] tracking-[0.22em] uppercase drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)] font-rubik leading-none">AVATAR</h1>
      <h2 class="text-white font-extrabold text-[68px] tracking-[0.08em] uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)] font-rubik -mt-2">ARENA</h2>
    </div>
    <div class="flex items-center justify-center gap-4 mt-4">
      <div class="element-badge w-12 h-12 rounded-full bg-gradient-to-b from-[#8fd8f7] to-[#4ea8dc] p-[2px] flex items-center justify-center border border-[#c3efff]/40">
        <div class="w-full h-full rounded-full bg-[#52b1e2] flex items-center justify-center shadow-inner">
          <svg class="w-6 h-6 text-white drop-shadow" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" viewBox="0 0 24 24"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>
        </div>
      </div>
      <div class="element-badge w-12 h-12 rounded-full bg-gradient-to-b from-[#3a8eed] to-[#1c56ab] p-[2px] flex items-center justify-center border border-[#91c5ff]/40">
        <div class="w-full h-full rounded-full bg-[#276cc6] flex items-center justify-center shadow-inner">
          <svg class="w-6 h-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
        </div>
      </div>
      <div class="element-badge w-12 h-12 rounded-full bg-gradient-to-b from-[#7fb85d] to-[#457c32] p-[2px] flex items-center justify-center border border-[#c3f0a5]/40">
        <div class="w-full h-full rounded-full bg-[#599141] flex items-center justify-center shadow-inner">
          <svg class="w-6 h-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24"><polygon points="12,3 2,21 22,21"></polygon><polygon fill="#457c32" opacity="0.6" points="12,8 6,19 18,19"></polygon></svg>
        </div>
      </div>
      <div class="element-badge w-12 h-12 rounded-full bg-gradient-to-b from-[#f26338] to-[#b82515] p-[2px] flex items-center justify-center border border-[#ffb194]/40">
        <div class="w-full h-full rounded-full bg-[#d73f1d] flex items-center justify-center shadow-inner">
          <svg class="w-6 h-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-.5 2.5-2 4.5-4 6-2 1.5-3 3.5-3 6 0 4.42 3.58 8 8 8s8-3.58 8-8c0-2-.5-3.5-2-5.5-.5 2-2 3-3.5 3 0-3-1.5-5.5-3.5-9.5z"></path></svg>
        </div>
      </div>
    </div>
  </header>

  <section class="relative z-10 w-full flex flex-col items-center justify-center -mt-4">
    <button data-act="story" class="w-[340px] py-4 px-6 bg-gradient-to-b from-[#f8cf4f] to-[#e4ac29] hover:from-[#fce075] hover:to-[#ebb735] active:translate-y-0.5 text-stone-900 font-extrabold text-[26px] rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.3)] border border-[#ffeaa5] transition-all duration-150 flex items-center justify-center tracking-wide" type="button"><span>התחל קרב</span></button>
    <button data-act="start" class="mt-4 w-[290px] py-2.5 px-5 bg-[#1b2538]/90 hover:bg-[#25324a]/90 active:translate-y-0.5 text-[#ffd9a8] font-bold text-lg rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-[#ffb779]/50 transition-all duration-150 flex items-center justify-center gap-2" type="button">
      <svg class="w-4 h-4 text-[#ffb779]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.9 2 2 6.9l4.2 4.2-2.1 2.1 1.4 1.4L7.6 12.5 11.5 16.4 9.4 18.5l1.4 1.4 4.2-4.2L19.9 20.6 22 18.5 5.3 1.9z"></path></svg>
      <span>קרב חופשי</span>
    </button>
  </section>

  <nav class="relative z-10 w-full flex items-center justify-center gap-5 pb-12 px-4">
    <button data-act="story" class="min-w-[140px] py-3 px-4 bg-[#141b28]/95 hover:bg-[#1e283b] active:scale-95 text-stone-200 hover:text-white font-bold text-lg rounded-xl shadow-lg border border-[#28354b] transition-all duration-150 text-center" type="button">מסלול סיפור</button>
    <button data-act="start" class="min-w-[140px] py-3 px-4 bg-[#141b28]/95 hover:bg-[#1e283b] active:scale-95 text-stone-200 hover:text-white font-bold text-lg rounded-xl shadow-lg border border-[#28354b] transition-all duration-150 text-center" type="button">דמויות</button>
    <button data-act="soon" class="min-w-[140px] py-3 px-4 bg-[#141b28]/95 hover:bg-[#1e283b] active:scale-95 text-stone-200 hover:text-white font-bold text-lg rounded-xl shadow-lg border border-[#28354b] transition-all duration-150 text-center" type="button">הגדרות</button>
  </nav>
  <div class="pointer-events-none absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/70 to-transparent z-[5]"></div>
</main>`;

// ---------- בחירת דמות ----------
// ---------- בחירת דמות (סגנון Smash: רשימת דמויות, ובתחתית פאנל שחקן ופאנל CPU) ----------
const TILE_BG = {
  air: 'linear-gradient(160deg,#cfe9ff,#5fa8e0)', water: 'linear-gradient(160deg,#4aa3ff,#0b3f80)',
  earth: 'linear-gradient(160deg,#a8c97a,#4a3a1c)', fire: 'linear-gradient(160deg,#ff9a4a,#7a1a0c)',
};
const lockedTile = (w = 96) => `<div class="relative overflow-hidden rounded-sm border-2 border-black/50 opacity-60" style="width:${w}px;height:${w}px;background:repeating-linear-gradient(45deg,#1b2233,#1b2233 6px,#161c2b 6px,#161c2b 12px)">
  <span class="absolute inset-0 flex items-center justify-center text-slate-500 text-2xl font-black">?</span></div>`;

export const selectScreen = (selId, bots, cpuLv = 5) => {
  const sel = byId(selId === 'random' ? 'zuko' : selId), e = EL[sel.element], t = TILE_BG[sel.element];
  const charTile = (c) => {
    const on = c.id === selId;
    return `<button data-char="${c.id}" class="relative overflow-hidden rounded-sm transition active:scale-95 ${on ? 'border-[3px] border-white shadow-[0_0_16px_3px_rgba(255,255,255,.55)] z-10 scale-105' : 'border-2 border-black/60 hover:border-white/70'}" style="width:96px;height:96px;background:${TILE_BG[c.element]}" type="button">
      <img src="${face(c)}" alt="" class="w-full h-full object-cover object-top" style="image-rendering:pixelated" draggable="false">
      <div class="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[10px] font-extrabold text-center py-0.5 tracking-wide">${c.en.toUpperCase()}</div>
      ${on ? '<div class="absolute top-0.5 left-0.5 px-1.5 rounded bg-red-600 text-white text-[10px] font-black">P1</div>' : ''}
    </button>`;
  };
  return `
<main dir="rtl" class="screen select-none overflow-hidden font-rubik" style="background:linear-gradient(180deg,#0b0d14 0%,#0b0d14 52%,#1a1d2e 100%)">
  <header class="absolute top-0 inset-x-0 h-12 flex items-center px-4 z-20" style="background:linear-gradient(90deg,#b81c1c 0 14%,transparent 14%)">
    <button data-act="back" class="w-10 h-9 flex items-center justify-center rounded bg-black/30 hover:bg-black/50 active:scale-95 text-white text-xl" type="button" aria-label="חזור">↩</button>
    <div class="absolute left-1/2 -translate-x-1/2 top-1.5 px-10 py-1 text-[20px] font-black tracking-wide text-[#1b1400]" style="background:linear-gradient(180deg,#ffe36a,#f4b400);clip-path:polygon(4% 0,96% 0,100% 100%,0 100%);font-family:Impact,'Arial Black',sans-serif">בחר דמות</div>
  </header>

  <section class="absolute left-1/2 -translate-x-1/2 top-[58px] grid gap-[6px]" style="grid-template-columns:repeat(9,96px)">
    <button data-char="random" class="relative overflow-hidden rounded-sm border-2 ${selId === 'random' ? 'border-white' : 'border-black/60'} bg-[#e8c200]" style="width:96px;height:96px" type="button"><span class="absolute inset-0 flex items-center justify-center text-[#1b1400] text-5xl font-black">?</span><div class="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[10px] font-extrabold text-center py-0.5">RANDOM</div></button>
    ${CHARACTERS.map(charTile).join('')}
    ${Array.from({ length: 13 }, () => lockedTile()).join('')}
  </section>

  <!-- פאנל שחקן (אדום) -->
  <section class="absolute left-0 bottom-0 z-10" style="width:52%;height:196px;background:linear-gradient(110deg,#7d0f12 0%,#d41f24 62%,#ff4a3a 100%);clip-path:polygon(0 0,100% 9%,93% 100%,0 100%)">
    <div class="absolute inset-0 opacity-25" style="background:repeating-linear-gradient(115deg,transparent 0 22px,rgba(255,255,255,.35) 22px 24px)"></div>
    <div ${selId === 'random' ? '' : `data-v3d="${sel.id}"`} class="absolute left-3 top-2 w-[150px] h-[176px] rounded-md overflow-hidden border-[3px] border-white shadow-xl" style="background:${selId === 'random' ? '#d9d9d9' : t}">
      ${selId === 'random' ? '<span class="absolute inset-0 flex items-center justify-center text-6xl font-black text-[#555]">?</span>' : `<img src="${face(sel)}" alt="" class="w-full h-full object-cover object-top" style="image-rendering:pixelated">`}
    </div>
    <div class="absolute left-[184px] top-5 flex flex-col gap-1.5 text-white" style="width:230px">
      <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded bg-white/90 text-red-700 text-[11px] font-black">P1</span><span class="text-[11px] font-bold opacity-90">שחקן 1</span></div>
      <div class="text-[26px] font-black leading-none drop-shadow" style="font-family:Impact,'Arial Black',sans-serif">${selId === 'random' ? 'RANDOM' : sel.en.toUpperCase()}</div>
      ${selId === 'random' ? '<div class="text-[12px] opacity-90">דמות אקראית</div>' : `
      <div class="flex items-center gap-1 text-[12px] font-bold"><span>${e.emoji}</span><span>${e.label}</span><span class="opacity-70">• רמה ${sel.tier}</span></div>
      <div class="flex items-center gap-1.5 mt-1 bg-black/25 rounded px-2 py-1 w-fit">${sel.moves.map((m) => moveIcon(m, sel.element, 22)).join('')}<span class="w-px h-4 bg-white/40"></span>${moveIcon(sel.ult, sel.element, 22)}</div>`}
    </div>
  </section>

  <!-- פאנל CPU (אפור) -->
  <section class="absolute right-0 bottom-0 z-10" style="width:52%;height:196px;background:linear-gradient(250deg,#3b3f47 0%,#8a8f98 60%,#c9ccd2 100%);clip-path:polygon(0 9%,100% 0,100% 100%,7% 100%)">
    <div class="absolute inset-0 opacity-20" style="background:repeating-linear-gradient(65deg,transparent 0 22px,rgba(255,255,255,.5) 22px 24px)"></div>
    <div class="absolute right-8 top-3 text-[120px] leading-none font-black text-white drop-shadow-lg" style="font-family:Impact,'Arial Black',sans-serif;text-shadow:4px 4px 0 #2b2e35">?</div>
    <div class="absolute left-[96px] top-5 flex flex-col gap-2 text-white items-end">
      <div class="text-[28px] font-black leading-none drop-shadow" style="font-family:Impact,'Arial Black',sans-serif">RANDOM</div>
      <div class="flex items-center gap-1.5">
        <span class="px-2 py-0.5 rounded bg-black/55 text-[11px] font-black tracking-wide">CPU LV.</span>
        <button data-cpulv="-1" class="w-7 h-7 rounded bg-black/55 hover:bg-black/75 text-lg font-black active:scale-90" type="button">−</button>
        <span class="w-8 text-center text-[24px] font-black text-[#ff3b2a]" style="font-family:Impact,sans-serif;text-shadow:2px 2px 0 #000">${cpuLv}</span>
        <button data-cpulv="1" class="w-7 h-7 rounded bg-black/55 hover:bg-black/75 text-lg font-black active:scale-90" type="button">+</button>
      </div>
      <div class="flex items-center gap-1.5"><span class="text-[11px] font-bold">בוטים:</span>
        ${[1, 2, 3].map((n) => `<button data-bots="${n}" class="w-8 h-8 rounded font-black text-[15px] ${n === bots ? 'bg-[#ffd24c] text-[#1b1400]' : 'bg-black/55 text-white hover:bg-black/75'} active:scale-90 transition" type="button">${n}</button>`).join('')}</div>
    </div>
  </section>

  <button data-act="go" class="absolute left-1/2 -translate-x-1/2 bottom-5 z-20 px-9 py-2.5 rounded-xl font-black text-[16px] text-[#1b1400] bg-gradient-to-b from-[#ffea79] via-[#f7cb45] to-[#d89e1b] shadow-[0_6px_18px_rgba(0,0,0,.55)] border-t border-yellow-200 active:scale-95 hover:brightness-110 transition flex items-center gap-2" type="button"><span>בחר מפה</span><span class="text-lg">◀</span></button>
</main>`;
};

// ---------- בחירת מפה (סגנון Smash: תצוגה גדולה בצד וטבלת מפות) ----------
export const mapScreen = (selId) => {
  const m = MAPS.find((x) => x.id === selId);
  const tile = (mp) => {
    const on = mp.id === selId;
    return `<button data-map="${mp.id}" class="relative overflow-hidden rounded-sm transition active:scale-95 ${on ? 'border-[3px] border-white shadow-[0_0_16px_3px_rgba(255,255,255,.55)] z-10 scale-105' : 'border-2 border-black/60 hover:border-white/70'}" style="width:94px;height:54px" type="button">${mapPreview(mp, 94)}</button>`;
  };
  const randomTile = `<button data-map="random" class="relative overflow-hidden rounded-sm ${selId === 'random' ? 'border-[3px] border-white shadow-[0_0_16px_3px_rgba(255,255,255,.55)] z-10 scale-105' : 'border-2 border-black/60'} bg-[#e8c200]" style="width:94px;height:54px" type="button"><span class="absolute inset-0 flex items-center justify-center text-[#1b1400] text-3xl font-black">?</span></button>`;
  const locked = (n) => Array.from({ length: n }, () => `<div class="rounded-sm border-2 border-black/50 opacity-55 flex items-center justify-center text-slate-500 font-black" style="width:94px;height:54px;background:repeating-linear-gradient(45deg,#1b2233,#1b2233 6px,#161c2b 6px,#161c2b 12px)">?</div>`).join('');
  return `
<main dir="rtl" class="screen select-none overflow-hidden font-rubik" style="background:linear-gradient(135deg,#10131d 0%,#1a1d2e 60%,#2a2037 100%)">
  <header class="absolute top-0 inset-x-0 h-12 flex items-center px-4 z-20" style="background:linear-gradient(90deg,#b81c1c 0 14%,transparent 14%)">
    <button data-act="back" class="w-10 h-9 flex items-center justify-center rounded bg-black/30 hover:bg-black/50 active:scale-95 text-white text-xl" type="button" aria-label="חזור">↩</button>
    <div class="absolute left-1/2 -translate-x-1/2 top-1.5 px-10 py-1 text-[20px] font-black tracking-wide text-[#1b1400]" style="background:linear-gradient(180deg,#ffe36a,#f4b400);clip-path:polygon(4% 0,96% 0,100% 100%,0 100%);font-family:Impact,'Arial Black',sans-serif">בחר מפה</div>
    <div class="mr-auto flex items-center gap-2 text-white text-[12px] font-bold"><span class="px-2.5 py-1 rounded bg-black/45">חיים: 3</span><span class="px-2.5 py-1 rounded bg-black/45">סגנון: רגיל</span></div>
  </header>

  <!-- תצוגה גדולה של המפה הנבחרת -->
  <section class="absolute left-6 top-16 flex flex-col items-center gap-2" style="width:330px">
    <div class="relative overflow-hidden rounded-md border-[3px] border-white shadow-2xl" style="width:330px;height:186px;background:#e8c200">
      ${m ? mapPreview(m, 330) : '<span class="absolute inset-0 flex items-center justify-center text-[#1b1400] text-8xl font-black">?</span>'}
    </div>
    <div class="w-full px-4 py-2.5 rounded-md text-white" style="background:linear-gradient(90deg,#0b0e16,#1e2433);border-left:5px solid ${m ? '#ffd24c' : '#aaa'}">
      <div class="flex items-center justify-between"><span class="text-[24px] font-black" style="font-family:Impact,'Arial Black',sans-serif">${m ? m.name : 'אקראי'}</span><span class="text-xl">${m ? EL[m.element].emoji : '🎲'}</span></div>
      <div class="text-[11px] text-slate-300 mt-0.5">${m ? `${m.platforms.length} פלטפורמות • אי ראשי ברוחב ${m.platforms[0].w}` : 'מפה שנבחרת באקראי לפני הקרב'}</div>
    </div>
  </section>

  <!-- טבלת המפות -->
  <section class="absolute right-6 top-16 grid gap-[6px] p-2 rounded-md" style="grid-template-columns:repeat(4,94px);background:rgba(0,0,0,.45)">
    ${randomTile}${MAPS.map(tile).join('')}${locked(10)}
  </section>

  <button data-act="go" class="absolute left-1/2 -translate-x-1/2 bottom-5 z-20 px-10 py-2.5 rounded-xl font-black text-[16px] text-[#1b1400] bg-gradient-to-b from-[#ffea79] via-[#f7cb45] to-[#d89e1b] shadow-[0_6px_18px_rgba(0,0,0,.55)] border-t border-yellow-200 active:scale-95 hover:brightness-110 transition flex items-center gap-2" type="button"><span>קדימה!</span><span class="text-lg">◀</span></button>
</main>`;
};

// ---------- VS ----------
// כל צד נצבע לפי האלמנט של הדמות: מים כחול, אש אדום, אדמה חום-ירוק, אוויר תכלת
const VS_THEME = {
  air:   { bg: 'linear-gradient(155deg,#eaf7ff 0%,#8cc8f2 50%,#3a7fc0 100%)', glow: '#bfe6ff', amb: ['cloud', '#ffffff'] },
  water: { bg: 'linear-gradient(155deg,#071a3d 0%,#0f4a8c 50%,#2a8fd8 100%)', glow: '#5fb4ff', amb: ['bubble', '#bfe6ff'] },
  earth: { bg: 'linear-gradient(155deg,#2b1d0d 0%,#6a4a22 50%,#5a8a34 100%)', glow: '#b9d68a', amb: ['dust', '#e4c895'] },
  fire:  { bg: 'linear-gradient(155deg,#240705 0%,#8a1d0b 50%,#ff7a1c 100%)', glow: '#ff9a3a', amb: ['ember', '#ffb34a'] },
};
const OPP_W = { 1: 200, 2: 150, 3: 118 };

const vsCard = (c, w) => {
  const t = VS_THEME[c.element], e = EL[c.element];
  const fs = w >= 190 ? 22 : w >= 140 ? 18 : 15;
  return `
  <div class="flex flex-col items-center" style="width:${w}px">
    <div class="relative rounded-xl overflow-hidden" style="width:${w}px;height:${Math.round(w * 1.25)}px;border:3px solid ${t.glow};box-shadow:0 0 32px ${t.glow}aa,0 10px 24px rgba(0,0,0,.6);background:${t.bg}">
      <div data-v3d="${c.id}" class="absolute inset-0"><img src="${face(c)}" alt="" class="w-full h-full object-cover object-top" style="image-rendering:pixelated" draggable="false"></div>
      <div class="absolute bottom-1.5 left-1.5 right-1.5 z-10 bg-black/55 py-0.5 rounded flex items-center justify-center gap-0.5 border border-yellow-500/30">
        ${stars(starCount(c), 'text-yellow-400 text-xs', 'text-slate-500 text-xs')}
      </div>
    </div>
    <h2 class="mt-2 font-extrabold tracking-wide text-white" style="font-size:${fs}px;text-shadow:0 2px 6px rgba(0,0,0,.8)">${c.en}</h2>
    <div class="mt-1 flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full text-xs text-white" style="border:1px solid ${t.glow}">
      <span>${e.emoji}</span><span dir="rtl">${e.label}</span>
    </div>
  </div>`;
};

export const vsScreen = (player, bots, map) => {
  const tp = VS_THEME[player.element], to = VS_THEME[bots[0].element];
  const w = OPP_W[bots.length] || 118;
  return `
<main class="screen text-white overflow-hidden select-none font-sans" style="background:#0a0f1a">
  <div class="absolute inset-0" style="background:${tp.bg}">${ambientHTML(tp.amb[0], tp.amb[1], 14)}
    <div class="absolute rounded-full" style="left:6%;top:50%;width:460px;height:460px;transform:translateY(-50%);background:radial-gradient(circle,${tp.glow}55,transparent 65%)"></div></div>
  <div class="absolute inset-0" style="background:${to.bg};clip-path:polygon(64% 0,100% 0,100% 100%,54% 100%)">${ambientHTML(to.amb[0], to.amb[1], 14)}
    <div class="absolute rounded-full" style="right:4%;top:50%;width:460px;height:460px;transform:translateY(-50%);background:radial-gradient(circle,${to.glow}55,transparent 65%)"></div></div>
  <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
    <line x1="64" y1="0" x2="54" y2="100" stroke="#f6c344" stroke-width="3" vector-effect="non-scaling-stroke" style="filter:drop-shadow(0 0 8px rgba(246,195,68,.9))"/>
  </svg>
  <div class="absolute inset-0 pointer-events-none" style="background:radial-gradient(ellipse at 50% 55%,transparent 45%,rgba(0,0,0,.45) 100%)"></div>

  <header class="absolute top-8 left-10 right-10 flex items-center justify-between z-10 opacity-80">
    <div class="text-xs tracking-widest text-white/80 font-semibold uppercase">PRE-FIGHT / VS SCREEN</div>
    <div class="text-xs text-white/80 tracking-wider">AVATAR ARENA</div>
  </header>

  <section class="absolute left-12 top-1/2 z-10" style="transform:translateY(-54%)">${vsCard(player, 200)}</section>
  <section class="absolute right-12 top-1/2 z-10 flex items-center gap-4" style="transform:translateY(-54%)">${bots.map((b) => vsCard(b, w)).join('')}</section>

  <div class="absolute z-20 flex flex-col items-center" style="left:59%;top:50%;transform:translate(-50%,-56%)">
    <h1 class="text-7xl font-extrabold text-[#f6c344] vs-text tracking-tighter transform -rotate-3">VS</h1>
    <div dir="rtl" class="mt-2 px-3 py-1 rounded-full bg-black/55 border border-white/25 text-xs text-white font-semibold">🗺 ${map.name}</div>
  </div>

  <footer class="absolute bottom-4 left-0 right-0 z-10 flex flex-col items-center">
    <div class="w-96 h-2.5 bg-black/45 rounded-full overflow-hidden border border-white/20 p-0.5">
      <div id="vs-progress" class="h-full bg-gradient-to-r from-[#f6c344] to-yellow-300 rounded-full loading-pulse transition-all duration-300" style="width:8%"></div>
    </div>
    <span dir="rtl" class="mt-1.5 text-xs text-white/80 font-medium tracking-wider">טוען...</span>
  </footer>
</main>`;
};

// ---------- קרב: HUD ובקרות מגע (הרקע והפלטפורמות ב-src/ui/maps.js) ----------
// HUD בסגנון Smash: כרטיסי נזק מוטים בתחתית, טיימר במרכז, שם השלב והשהיה בראש
const ECOL = { air: '#bfe6ff', water: '#3a8dde', earth: '#c2a169', fire: '#ff6a2a' };
export const hudCard = (c, human, uid, w = 200) => {
  const col = ECOL[c.element], compact = w < 140;
  return `
  <article data-hud="${uid}" class="hud-card" style="width:${w}px;--ec:${col}">
    <div class="hud-in ${compact ? 'hud-compact' : ''}">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="hud-tag">${human ? 'P1' : 'CPU'}</span>
          <img src="${face(c)}" alt="" class="hud-face" style="image-rendering:pixelated">
          <span class="hud-name">${c.en.toUpperCase()}</span>
        </div>
        <div data-stocks class="flex gap-1">${[0, 1, 2].map(() => '<span class="hud-dot"></span>').join('')}</div>
      </div>
      <div class="flex items-baseline justify-between">
        ${compact ? '' : '<span class="hud-lbl">DAMAGE</span>'}
        <div class="hud-dmg"><span data-pct>0%</span></div>
      </div>
      <div class="hud-bar"><div data-ultbar></div></div>
    </div>
  </article>`;
};

export const hudScreen = (fighters, ctx = {}) => {
  const n = fighters.length;
  const w = ctx.touch ? Math.max(92, Math.min(190, Math.floor(390 / n) - 6)) : Math.max(120, Math.min(220, Math.floor(820 / n) - 14));
  return `
<div class="screen pointer-events-none font-sans">
  <header class="absolute top-3 left-4 right-4 flex items-start justify-between z-20">
    <div class="flex items-center gap-2">
      <div class="hud-chip"><span class="text-[9px] tracking-[.18em] text-orange-300 block leading-none">STAGE</span><span class="text-[13px] font-extrabold text-white">${ctx.stageName || ''}</span></div>
    </div>
    <div class="hud-timer"><span class="hud-timer-in">⏱ <span id="hud-timer">00:00</span></span></div>
    <button data-act="pause" aria-label="Pause" class="pointer-events-auto w-9 h-9 rounded-full bg-black/45 border border-white/40 flex items-center justify-center text-white/85 active:scale-95 transition-transform backdrop-blur-sm" type="button">
      <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><rect height="14" rx="1.5" width="3.5" x="6" y="5"></rect><rect height="14" rx="1.5" width="3.5" x="14.5" y="5"></rect></svg>
    </button>
  </header>
  <div class="absolute left-1/2 bottom-2 z-20 flex items-end gap-3" style="transform:translateX(-50%)">${fighters.map((f) => hudCard(f.def, f.human, f.uid, w)).join('')}</div>
  <div id="touch-ui" class="absolute inset-0 z-30" hidden>
    <div id="joy-zone" class="absolute left-0 top-0 w-1/2 h-full pointer-events-auto" style="touch-action:none"></div>
    <div id="joy-ghost" class="absolute pointer-events-none" style="left:30px;bottom:30px;width:140px;height:140px;border-radius:50%;border:3px solid rgba(255,209,102,.8);background:radial-gradient(circle,rgba(255,209,102,.24),rgba(255,255,255,.06));box-shadow:0 0 24px rgba(255,209,102,.5),inset 0 0 20px rgba(255,209,102,.22)">
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 140 140"><g fill="rgba(255,236,170,.95)"><polygon points="70,10 80,26 60,26"/><polygon points="70,130 80,114 60,114"/><polygon points="10,70 26,60 26,80"/><polygon points="130,70 114,60 114,80"/></g></svg>
      <div class="absolute rounded-full" style="width:60px;height:60px;left:40px;top:40px;background:rgba(255,236,170,.38);border:3px solid rgba(255,236,170,.9);box-shadow:0 0 14px rgba(255,209,102,.7)"></div>
    </div>
    <div id="joy-base" class="absolute rounded-full pointer-events-none" hidden style="width:140px;height:140px;border:3px solid rgba(255,209,102,.9);background:radial-gradient(circle,rgba(255,209,102,.28),rgba(255,255,255,.08));box-shadow:0 0 28px rgba(255,209,102,.6),inset 0 0 22px rgba(255,209,102,.25)">
      <div id="joy-knob" class="absolute rounded-full" style="width:64px;height:64px;left:38px;top:38px;background:rgba(255,236,170,.55);border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.5),0 0 16px rgba(255,209,102,.8)"></div>
    </div>
    <div id="joy-hint" class="absolute text-[12px] font-bold pointer-events-none" style="left:30px;bottom:176px;width:140px;text-align:center;color:rgba(255,236,170,.9);text-shadow:0 1px 3px #000">גע וגרור כדי לזוז</div>
    <nav class="absolute right-4 bottom-4 pointer-events-none" style="width:300px;height:262px">
      <button data-hold="m1" aria-label="1" class="virtual-btn pointer-events-auto absolute rounded-full flex items-center justify-center text-white/90 font-bold " style="left:218px;top:150px;width:72px;height:72px;font-size:28px" type="button">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40"><circle data-ring="m1" cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2.4" stroke-dasharray="113" stroke-dashoffset="0" transform="rotate(-90 20 20)"></circle></svg>
        <span class="relative">1</span>
      </button>
      <button data-hold="m2" aria-label="2" class="virtual-btn pointer-events-auto absolute rounded-full flex items-center justify-center text-white/90 font-bold " style="left:140px;top:184px;width:58px;height:58px;font-size:23px" type="button">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40"><circle data-ring="m2" cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2.4" stroke-dasharray="113" stroke-dashoffset="0" transform="rotate(-90 20 20)"></circle></svg>
        <span class="relative">2</span>
      </button>
      <button data-hold="m3" aria-label="3" class="virtual-btn pointer-events-auto absolute rounded-full flex items-center justify-center text-white/90 font-bold " style="left:148px;top:108px;width:58px;height:58px;font-size:23px" type="button">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40"><circle data-ring="m3" cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2.4" stroke-dasharray="113" stroke-dashoffset="0" transform="rotate(-90 20 20)"></circle></svg>
        <span class="relative">3</span>
      </button>
      <button data-hold="m4" aria-label="4" class="virtual-btn pointer-events-auto absolute rounded-full flex items-center justify-center text-white/90 font-bold " style="left:228px;top:62px;width:58px;height:58px;font-size:23px" type="button">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40"><circle data-ring="m4" cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2.4" stroke-dasharray="113" stroke-dashoffset="0" transform="rotate(-90 20 20)"></circle></svg>
        <span class="relative">4</span>
      </button>
      <button data-hold="ult" aria-label="★" class="virtual-btn pointer-events-auto absolute rounded-full flex items-center justify-center text-white/90 font-bold data-ultbtn" style="left:64px;top:52px;width:62px;height:62px;font-size:24px" type="button">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40"><circle data-ring="ult" cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2.4" stroke-dasharray="113" stroke-dashoffset="0" transform="rotate(-90 20 20)"></circle></svg>
        <span class="relative">★</span>
      </button>
      <button data-hold="jump" aria-label="⤒" class="virtual-btn pointer-events-auto absolute rounded-full flex items-center justify-center text-white/90 font-bold " style="left:52px;top:150px;width:58px;height:58px;font-size:23px" type="button">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40"><circle data-ring="jump" cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2.4" stroke-dasharray="113" stroke-dashoffset="0" transform="rotate(-90 20 20)"></circle></svg>
        <span class="relative">⤒</span>
      </button>
    </nav>
  </div>
</div>`;
};

// ---------- עצירה ----------
export const pauseScreen = (gfx = 'תלת-מימד מלא') => `
<div dir="rtl" class="screen flex items-center justify-center select-none font-sans">
  <div class="absolute inset-0 bg-[#09111c]/65"></div>
  <section aria-label="תפריט עצירה" class="relative z-20 w-[250px] bg-[rgba(16,26,43,0.94)] game-modal rounded-[9px] p-5 flex flex-col gap-3 items-center border border-[#2e496a] shadow-2xl">
    <button data-act="resume" class="w-full py-2 px-3 rounded-md bg-[#ffcf53] hover:bg-[#f8be35] text-[#1b263b] font-bold text-base tracking-wide gold-button-glow transition duration-150 active:scale-[0.98] focus:outline-none flex items-center justify-center shadow" type="button">המשך</button>
    <button data-act="restart" class="w-full py-2 px-3 rounded-md bg-[rgba(23,37,61,0.88)] hover:bg-[rgba(35,54,88,0.95)] text-slate-100 font-medium text-sm border border-[#395476] transition duration-150 active:scale-[0.98] focus:outline-none flex items-center justify-center shadow-sm" type="button">התחל מחדש</button>
    <button data-act="toggle3d" class="w-full py-2 px-3 rounded-md bg-[rgba(23,37,61,0.88)] hover:bg-[rgba(35,54,88,0.95)] text-slate-100 font-medium text-sm border border-[#395476] transition duration-150 active:scale-[0.98] focus:outline-none flex items-center justify-center shadow-sm" type="button">גרפיקה: ${gfx}</button>
    <button data-act="menu" class="w-full py-2 px-3 rounded-md bg-[rgba(23,37,61,0.88)] hover:bg-[rgba(35,54,88,0.95)] text-slate-100 font-medium text-sm border border-[#395476] transition duration-150 active:scale-[0.98] focus:outline-none flex items-center justify-center shadow-sm" type="button">לתפריט</button>
  </section>
</div>`;

// ---------- תוצאות ----------
export const resultsScreen = (r) => {
  const c = r.def, e = EL[c.element];
  const trophy = r.won ? `
    <div class="w-10 h-10 flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(255,210,76,0.6)]">
      <svg class="w-9 h-9 text-[#ffd24c]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-2V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v2a5 5 0 0 0 4.6 4.97A6.002 6.002 0 0 0 11 17.9V20H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.1a6.002 6.002 0 0 0 4.4-4.93A5 5 0 0 0 22 9V7a3 3 0 0 0-3-3zM4 9V7a1 1 0 0 1 1-1h2v4.82A3.003 3.003 0 0 1 4 9zm16 0a3.003 3.003 0 0 1-3 1.82V6h2a1 1 0 0 1 1 1v2z"></path></svg>
    </div>` : '';
  const title = r.won
    ? `<h1 class="text-4xl font-extrabold text-[#ffd24c] tracking-tight text-gold-glow">ניצחת!</h1>`
    : `<h1 class="text-4xl font-extrabold text-[#f0705f] tracking-tight" style="text-shadow:0 2px 4px rgba(0,0,0,.7)">הפסדת...</h1>`;
  const unlock = r.unlocked ? `
    <div class="unlock-banner w-full rounded-md py-1.5 px-3 text-center border-y-2 border-[#bfa265] relative shadow-md">
      <div class="text-[#3c2a12] font-black text-sm tracking-wide">דמות חדשה נפתחה!</div>
      <div class="text-[9px] text-[#745e38] font-bold tracking-widest opacity-80 leading-none mt-0.5">${r.unlocked}</div>
    </div>` : '';
  return `
<div dir="rtl" class="screen flex flex-col items-center justify-between p-8 bg-mountain-gradient select-none overflow-hidden font-heebo">
  <div aria-hidden="true" class="absolute inset-0 pointer-events-none opacity-45 overflow-hidden">
    <svg class="absolute bottom-0 left-0 w-full h-[55%] text-[#142034] fill-current" preserveAspectRatio="none" viewBox="0 0 1200 400"><path d="M0,400 L0,220 L160,150 L340,280 L520,110 L710,230 L890,90 L1080,260 L1200,180 L1200,400 Z"></path></svg>
    <svg class="absolute bottom-0 left-0 w-full h-[38%] text-[#0c1524] fill-current" preserveAspectRatio="none" viewBox="0 0 1200 300"><path d="M0,300 L0,140 L220,60 L450,190 L670,50 L840,150 L1020,40 L1200,120 L1200,300 Z"></path></svg>
  </div>
  <div class="relative z-10 w-full flex justify-between items-center opacity-70">
    <span class="text-xs uppercase tracking-widest text-slate-400 font-bold">AVATAR ARENA • 2D</span>
    <span class="text-xs tracking-wider text-slate-400 font-semibold">תוצאות קרב</span>
  </div>
  <main class="relative z-10 w-full max-w-[440px] bg-[#162338]/90 rounded-2xl border-2 border-[#38557e] shadow-[0_15px_35px_rgba(0,0,0,0.65)] px-6 pt-5 pb-4 flex flex-col items-center my-auto">
    <div class="flex items-center justify-center gap-2 mb-3">${trophy}${title}</div>
    <section class="w-full bg-[#101b2c]/80 rounded-xl border border-[#2b4162] p-3 flex items-center justify-between gap-4 mb-3">
      <div class="relative w-24 h-28 bg-[#8ec7e8] rounded-lg border-2 border-[#fed34c] overflow-hidden flex-shrink-0 shadow-inner flex flex-col justify-end items-center">
        <img src="${face(c)}" alt="" class="absolute inset-0 w-full h-full object-cover object-top" style="image-rendering:pixelated" draggable="false">
        <div class="absolute bottom-1 ${e.resBadge} border border-[#fed34c] px-2 py-0.5 rounded-full text-[9px] font-bold text-white leading-none">${e.label}</div>
      </div>
      <div class="flex-1 flex flex-col justify-center gap-1.5 text-right font-bold text-sm text-slate-200 pr-1">
        <div class="flex items-center justify-between border-b border-slate-700/50 pb-1">
          <span class="flex items-center gap-1.5 text-xs text-slate-300"><span class="text-rose-500 font-extrabold text-sm">⚔</span><span>חיסולים <span dir="ltr" class="inline-block">(KO)</span>:</span></span>
          <span class="text-emerald-400 font-extrabold text-base tracking-wider">${r.kos}</span>
        </div>
        <div class="flex items-center justify-between border-b border-slate-700/50 pb-1">
          <span class="flex items-center gap-1.5 text-xs text-slate-300"><span class="text-sky-400 font-extrabold text-sm">🛡</span><span>נזק שנספג:</span></span>
          <span class="text-amber-400 font-extrabold text-base tracking-wider">${r.dmg}%</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1.5 text-xs text-slate-300"><span class="text-amber-400 font-black text-sm">#</span><span>מיקום:</span></span>
          <span class="text-yellow-400 font-black text-base tracking-wider">${r.place}</span>
        </div>
      </div>
    </section>
    ${unlock}
  </main>
  <footer class="relative z-10 w-full max-w-[440px] flex items-center justify-between gap-4 pb-2">
    <button data-act="again" class="flex-1 py-2.5 px-4 bg-gradient-to-b from-[#ffe58f] via-[#ffd24c] to-[#d99b1a] hover:from-[#fff0b3] hover:to-[#e5a824] active:scale-[0.98] text-[#342200] font-black text-lg rounded-xl border-2 border-[#fff7cc] box-golden-shadow transition duration-150 ease-in-out text-center cursor-pointer" type="button">שוב</button>
    <button data-act="menu" class="flex-1 py-2.5 px-4 bg-gradient-to-b from-[#ffe58f] via-[#ffd24c] to-[#d99b1a] hover:from-[#fff0b3] hover:to-[#e5a824] active:scale-[0.98] text-[#342200] font-black text-lg rounded-xl border-2 border-[#fff7cc] box-golden-shadow transition duration-150 ease-in-out text-center cursor-pointer" type="button">לתפריט</button>
  </footer>
</div>`;
};

// ======================= מסלול סיפור =======================
import { REALMS, realmById, realmOpen } from '../data/story.js';
import { byId } from '../data/characters.js';

const ico = (n, cls = '', fill = false) => `<span class="material-symbols-outlined ${cls}"${fill ? ` style="font-variation-settings:'FILL' 1"` : ''}>${n}</span>`;
const ORN = { air: '✦', water: '❄', earth: '◈', fire: '✹' };
const ROLE = { air: 'כשף אוויר', water: 'כשפית מים', earth: 'כשפית אדמה', fire: 'כשף אש' };
const starRow = (earned, size = 'text-[13px]') => [0, 1, 2].map((i) => ico('star', `${size} ${earned[i] ? 'text-primary' : 'text-outline-variant'}`, !!earned[i])).join('');

// מצב כל שלב: done (הושלם) / open (פתוח) / locked (נעול)
export function stageStates(realm, st) {
  let cur = null;
  const list = realm.stages.map((s, i) => {
    const done = st.cleared.includes(s.id);
    const open = done || i === 0 || st.cleared.includes(realm.stages[i - 1].id);
    if (open && !done && !cur) cur = s.id;
    return { s, i, done, open };
  });
  return { list, cur };
}

function curvePath(pts) {
  // עקומה חלקה (Catmull-Rom) דרך נקודות התחנות, באחוזים
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}


// שביל המסע: חומר שונה לכל עולם (רוח, קרח, אבן, לבה)
function trailSvg(id, pts, done) {
  const d = curvePath(pts), dd = done.length > 1 ? curvePath(done) : null;
  const L = (path, attrs, glow) => `<path d="${path}" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke" ${attrs}${glow ? ` style="filter:drop-shadow(0 0 6px ${glow})"` : ''}/>`;
  const T = {
    air: () => L(d, 'stroke="rgba(10,13,23,.6)" stroke-width="9"') + L(d, 'stroke="rgba(220,230,255,.55)" stroke-width="3" stroke-dasharray="3 8"') + (dd ? L(dd, 'stroke="#ffb779" stroke-width="4"', 'rgba(255,183,121,.9)') : ''),
    water: () => L(d, 'stroke="rgba(2,10,30,.65)" stroke-width="10"') + L(d, 'stroke="rgba(160,215,255,.55)" stroke-width="6"', 'rgba(124,196,255,.6)') + L(d, 'stroke="rgba(255,255,255,.85)" stroke-width="2" stroke-dasharray="1 14"') + (dd ? L(dd, 'stroke="#7cc4ff" stroke-width="5"', 'rgba(124,196,255,.95)') : ''),
    earth: () => L(d, 'stroke="rgba(15,8,3,.7)" stroke-width="12"') + L(d, 'stroke="#a98456" stroke-width="8" stroke-dasharray="11 7"').replace('stroke-linecap="round"', 'stroke-linecap="butt"') + (dd ? L(dd, 'stroke="#9fd08a" stroke-width="3" stroke-dasharray="11 7"', 'rgba(159,208,138,.8)').replace('stroke-linecap="round"', 'stroke-linecap="butt"') : ''),
    fire: () => L(d, 'stroke="rgba(10,2,2,.8)" stroke-width="12"') + L(d, 'stroke="#e8541c" stroke-width="8"', 'rgba(255,122,28,.9)') + L(d, 'stroke="#ffd36a" stroke-width="3"') + (dd ? L(dd, 'stroke="#fff0c0" stroke-width="2"', 'rgba(255,240,192,.9)') : ''),
  };
  return (T[id] || T.air)();
}

export const storyScreen = ({ realm, sel, st, chosen, bg }) => {
  const { list, cur } = stageStates(realm, st);
  const selected = list.find((x) => x.s.id === sel) || list.find((x) => x.s.id === cur) || list[0];
  const S = selected.s;
  const earnedOf = (id) => st.stars[id] || [false, false, false];
  const totalStars = list.reduce((a, x) => a + earnedOf(x.s.id).filter(Boolean).length, 0);
  const movesOpen = Math.min(4, 1 + st.cleared.length), ultOpen = st.cleared.length >= 4;

  const opp = byId(S.opp === chosen ? S.alt : S.opp);
  const doneIdx = list.filter((x) => x.done).length;

  // --- צמתי המפה ---
  const pts = list.map((x) => x.s.pos);
  const trailDone = list.filter((x) => x.done).map((x) => x.s.pos);
  const nodes = list.map(({ s, done, open }, idx) => {
    const isCur = s.id === cur, isSel = s.id === S.id, boss = !!s.boss;
    const size = boss ? 78 : isCur ? 62 : 54;
    const inner = !open ? ico('lock', 'text-outline text-[20px]')
      : boss ? `<img src="sprites/${s.opp}_face.png" alt="" class="w-full h-full object-cover object-top" style="image-rendering:pixelated">`
      : ico(done ? 'check_circle' : s.icon, `${done ? 'text-primary' : 'text-secondary'} text-[24px]`, done);
    const badge = isCur ? `<div class="absolute -top-8 px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-label-md shadow-lg flex items-center gap-1 whitespace-nowrap" style="animation:bob 1.2s ease-in-out infinite">${ico('swords', 'text-[13px]')}קרב פעיל!</div>`
      : boss && open && !done ? `<div class="absolute -top-8 px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container text-label-md shadow-lg whitespace-nowrap">שלב בוס</div>` : '';
    const glow = isCur || isSel || (boss && open) ? 'filter:drop-shadow(0 0 12px rgb(var(--c-primary) / .75))' : 'filter:drop-shadow(0 4px 8px rgb(0 0 0 / .6))';
    return `
    <button data-stage="${s.id}" class="absolute flex flex-col items-center group ${open ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}" style="left:${s.pos[0]}%;top:${s.pos[1]}%;transform:translate(-50%,-50%)" type="button">
      ${badge}
      <div class="rn ${done ? 'done' : ''} ${isSel ? 'sel' : ''} transition-transform group-hover:scale-110" style="width:${size}px;height:${size}px;${glow}">
        <div class="rn-in">${inner}</div>
        ${isCur ? '<span class="absolute inset-0 rounded-full bg-primary/25 animate-ping pointer-events-none"></span>' : ''}
        ${done ? `<div class="absolute -bottom-3 flex items-center px-1.5 py-0.5 rounded-full bg-surface-container-lowest shadow">${starRow(earnedOf(s.id), 'text-[11px]')}</div>` : ''}
      </div>
      <span class="mt-3.5 px-2 py-0.5 rounded-lg bg-surface-container-lowest/90 text-label-md ${open ? 'text-on-surface' : 'text-outline'} shadow whitespace-nowrap">${idx + 1}. ${s.short}</span>
    </button>`;
  }).join('');

  // --- כרטיס השלב ---
  const lockedMsg = !selected.open;
  const objs = S.obj.map((o, i) => {
    const got = earnedOf(S.id)[i];
    return `<div class="flex items-center gap-2 px-2.5 py-1 rounded-lg ${got ? 'bg-primary/10' : 'bg-surface-container/70'}">
      ${ico('star', `text-[16px] ${got ? 'text-primary' : 'text-outline-variant'}`, !!got)}
      <span class="text-[12px] ${got ? 'text-on-surface' : 'text-on-surface-variant'} flex-1">${o.text}</span>
      ${got ? ico('check', 'text-primary text-[16px]') : ''}</div>`;
  }).join('');
  const chips = ['zuko', 'katara', 'toph', 'aang'].map((id) => {
    const c = byId(id), have = st.unlocked.includes(id), on = id === chosen && have;
    return `<button data-pick="${id}" class="relative w-9 h-9 rounded-lg overflow-hidden ${on ? 'ring-2 ring-primary' : 'ring-1 ring-outline-variant'} ${have ? '' : 'opacity-50 cursor-not-allowed'}" title="${have ? c.name : 'נפתח בסיפור'}" type="button">
      <img src="sprites/${id}_face.png" alt="" class="w-full h-full object-cover object-top" style="image-rendering:pixelated;${have ? '' : 'filter:grayscale(1)'}">
      ${have ? '' : `<span class="absolute inset-0 flex items-center justify-center bg-black/50">${ico('lock', 'text-[16px] text-white')}</span>`}</button>`;
  }).join('');
  const perk = S.perk ? `<span class="flex items-center gap-1 text-secondary">${ico(S.perk.kind === 'char' ? 'person_add' : S.perk.kind === 'title' ? 'military_tech' : 'bolt', 'text-[15px]')}${S.perk.text}</span>` : '';

  const tabs = REALMS.map((r) => {
    const act = r.id === realm.id, open = r.ready && realmOpen(r, st.cleared);
    return `<button data-tab="${r.id}" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md transition ${act ? 'bg-gradient-to-r from-primary-container to-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container-highest'} ${open ? '' : 'opacity-60'}" type="button">
      ${ico(open ? r.icon : 'lock', 'text-[17px]')}<span>${r.name}</span>${act ? `<span class="px-1.5 rounded-full bg-on-primary/20">${doneIdx}/${list.length}</span>` : ''}</button>`;
  }).join('');

  return `
<div dir="rtl" class="screen flex flex-col select-none overflow-hidden font-assistant text-on-surface realm-${realm.id}">
  <div class="absolute inset-0">${bg}</div>
  <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(180deg,rgba(10,13,23,.75),rgba(10,13,23,.15) 35%,rgba(10,13,23,.55))"></div>

  <header class="relative z-20 flex items-center justify-between px-6 py-2 bg-surface-container-lowest/80 backdrop-blur-md shadow-xl">
    <div class="flex items-center gap-3">
      <button data-act="back" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high/90 hover:bg-surface-bright text-label-lg active:scale-95 transition" type="button">${ico('arrow_forward', 'text-primary text-[18px]')}חזור לראשי</button>
      <div class="h-6 w-px bg-surface-variant"></div>
      <div class="flex flex-col"><span class="text-headline-md text-primary leading-none">${realm.name}</span><span class="text-body-sm text-secondary-fixed-dim">${realm.sub}</span></div>
    </div>
    <nav class="flex items-center gap-1 p-1 rounded-full bg-surface-container-low/90">${tabs}</nav>
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container-high/90">${ico('star', 'text-primary text-[18px]', true)}<span class="text-label-lg text-primary">${totalStars} / ${list.length * 3}</span></div>
      <div class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container-high/90">${ico('monetization_on', 'text-primary-container text-[18px]', true)}<span class="text-label-lg">${st.coins.toLocaleString('en')}</span></div>
    </div>
  </header>

  <div class="relative z-10 flex-1 flex items-stretch gap-4 px-6 py-3 min-h-0">
    <section class="relative flex-1 min-w-0">
      <div class="absolute top-0 right-0 flex flex-col">
        <div class="flex items-center gap-1.5 text-primary text-label-md tracking-wider">${ico('explore', 'text-[15px]')}<span>מפת המסע • ${realm.name}</span></div>
      </div>
      <svg class="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">${trailSvg(realm.id, pts, trailDone)}</svg>
      ${nodes}
    </section>

    <aside data-orn="${ORN[realm.id]}" class="rp w-[400px] flex flex-col bg-surface-container-lowest/92 backdrop-blur-xl p-3 shadow-2xl relative overflow-hidden gap-1.5">
      <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="px-2 py-0.5 rounded bg-primary-container/25 text-primary-fixed text-label-md">${S.boss ? 'שלב סופי' : 'שלב'} ${selected.i + 1} מתוך ${list.length}</span>
          <span class="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-label-md">קושי: ${S.diff}</span>
        </div>
        <span class="text-body-sm text-outline">מומלץ <strong class="text-primary">${S.cp.toLocaleString('en')} CP</strong></span>
      </div>
      <h2 class="text-[18px] font-bold text-on-surface leading-tight">${S.name}</h2>

      <div class="flex items-center gap-3 p-2 rounded-xl bg-surface-container-low/90">
        <div class="relative w-[62px] h-[62px] rounded-lg overflow-hidden shrink-0 bg-surface-container-highest/60" style="${S.boss ? 'box-shadow:0 0 16px 3px rgba(255,183,121,.5)' : ''}">
          <img src="sprites/${opp.id}_face.png" alt="" class="w-full h-full object-cover object-top" style="image-rendering:pixelated;${lockedMsg ? 'filter:grayscale(1) brightness(.6)' : ''}">
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1 text-primary text-label-md">${ico('sports_martial_arts', 'text-[14px]')}<span>${S.boss ? 'בוס' + (S.bossLabel ? ' • ' + S.bossLabel : ' • מצב אווטאר') : 'יריב'} • ${ROLE[opp.element]}</span></div>
          <h3 class="text-title-md truncate">${opp.name} <span dir="ltr" class="text-body-sm text-outline">(${opp.en})</span></h3>
          <p class="text-body-sm text-on-surface-variant line-clamp-2">${S.desc}</p>
        </div>
      </div>

      <div class="flex flex-col gap-0.5">
        <span class="text-label-md text-on-surface-variant flex items-center gap-1">${ico('stars', 'text-[15px] text-primary')}יעדים ל-3 כוכבים</span>
        ${objs}
      </div>

      <div class="flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-container-high/50 text-[11.5px]">
        <span class="text-outline">פרסי ניצחון</span>
        <div class="flex items-center gap-2.5">
          <span class="flex items-center gap-0.5 text-primary-container">${ico('monetization_on', 'text-[15px]', true)}+${S.reward.coins}</span>
          <span class="flex items-center gap-0.5 text-primary">${ico('military_tech', 'text-[15px]')}+${S.reward.xp} XP</span>
          ${perk}
        </div>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-label-md text-on-surface-variant">שחק בתור:</span>
        <div class="flex items-center gap-1.5">${chips}</div>
      </div>

      <button data-act="fight" ${lockedMsg ? 'disabled' : ''} class="mt-auto w-full py-2 rounded-xl font-extrabold text-[15px] flex items-center justify-center gap-2 transition active:scale-[0.98] ${lockedMsg ? 'bg-surface-container-high text-outline cursor-not-allowed' : 'bg-gradient-to-r from-primary-container via-primary to-primary-container text-on-primary shadow-xl hover:brightness-110'}" type="button">
        ${ico(lockedMsg ? 'lock' : S.boss ? 'cyclone' : 'swords', 'text-[22px]')}
        <span>${lockedMsg ? 'נעול. נצח בשלב הקודם' : S.boss ? 'התמודד מול האווטאר!' : selected.done ? 'שחק שוב' : 'התחל שלב'}</span>
      </button>
    </aside>
  </div>

  <footer class="relative z-20 flex items-center justify-between px-6 py-1.5 bg-surface-container-lowest/85 backdrop-blur-md text-body-sm text-on-surface-variant">
    <div class="flex items-center gap-4">
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-primary"></span>קרב נוכחי</span>
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-surface-variant"></span>הושלם</span>
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>נעול</span>
    </div>
    <div class="flex items-center gap-3">
      <span class="flex items-center gap-1">${ico('bolt', 'text-[15px] text-primary')}מכות פתוחות: <strong class="text-primary">${movesOpen}/4</strong></span>
      <span class="flex items-center gap-1">${ico(ultOpen ? 'lock_open' : 'lock', 'text-[15px] text-primary')}מכה סודית: <strong class="${ultOpen ? 'text-primary' : 'text-outline'}">${ultOpen ? 'פתוחה' : 'נעולה'}</strong></span>
    </div>
  </footer>
</div>`;
};

// תוצאות קרב סיפור: כוכבים, יעדים, פרסים והדמות החדשה
export const storyResultsScreen = ({ r, stage, got, rec, realmId = 'air' }) => {
  const stars = got.filter(Boolean).length;
  const unlocked = rec.unlockedChar ? byId(rec.unlockedChar) : null;
  const title = r.won ? (stage.boss ? 'ניצחת את האווטאר!' : 'ניצחת!') : 'הפסדת...';
  const objs = stage.obj.map((o, i) => `<div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${got[i] ? 'bg-primary/10' : 'bg-surface-container/70'}">
      ${ico('star', `text-[16px] ${got[i] ? 'text-primary' : 'text-outline-variant'}`, !!got[i])}
      <span class="text-[12px] flex-1 ${got[i] ? 'text-on-surface' : 'text-outline'}">${o.text}</span>
      ${ico(got[i] ? 'check_circle' : 'cancel', `text-[16px] ${got[i] ? 'text-primary' : 'text-outline'}`, !!got[i])}</div>`).join('');
  return `
<div dir="rtl" class="screen flex flex-col items-center justify-center select-none overflow-hidden font-assistant text-on-surface bg-mountain-gradient realm-${realmId}">
  <div class="absolute inset-0 pointer-events-none opacity-40" style="background:radial-gradient(circle at 50% 30%,rgba(255,183,121,.35),transparent 60%)"></div>
  <main class="relative z-10 w-[460px] rounded-2xl bg-surface-container-lowest/92 border-2 border-secondary-container shadow-[0_15px_35px_rgba(0,0,0,.65)] px-6 py-4 flex flex-col items-center gap-2.5">
    <h1 class="text-[30px] font-extrabold ${r.won ? 'text-primary' : 'text-error'}" style="text-shadow:0 2px 6px rgba(0,0,0,.7)">${title}</h1>
    <div class="text-body-sm text-outline">${stage.name}</div>
    <div class="flex items-center gap-1.5">${[0, 1, 2].map((i) => ico('star', `text-[44px] ${got[i] ? 'text-primary' : 'text-outline-variant'}`, !!got[i])).join('')}</div>
    <div class="w-full flex flex-col gap-1">${objs}</div>
    <div class="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-high/50 text-[13px]">
      <span class="text-outline">תגמולים</span>
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-1 text-primary-container">${ico('monetization_on', 'text-[17px]', true)}+${rec.coins}</span>
        ${rec.xp ? `<span class="flex items-center gap-1 text-primary">${ico('military_tech', 'text-[17px]')}+${rec.xp} XP</span>` : ''}
        ${rec.perk && rec.perk.kind !== 'char' ? `<span class="text-secondary">${rec.perk.text}</span>` : ''}
      </div>
    </div>
    ${unlocked ? `<div class="w-full flex items-center gap-3 px-3 py-2 rounded-xl unlock-banner border-y-2 border-[#bfa265]">
      <img src="sprites/${unlocked.id}_face.png" alt="" class="w-14 h-14 rounded-lg object-cover object-top" style="image-rendering:pixelated">
      <div><div class="text-[#3c2a12] font-black text-[16px]">דמות חדשה נפתחה!</div><div class="text-[#745e38] font-bold text-[13px]">${unlocked.name} (${unlocked.en}) זמין עכשיו כדמות שחקן</div></div></div>` : ''}
    <div class="w-full flex gap-3 pt-1">
      <button data-act="again" class="flex-1 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright font-bold text-[15px] active:scale-95 transition" type="button">שוב</button>
      <button data-act="story-back" class="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-[#ffe58f] via-[#ffd24c] to-[#d99b1a] text-[#342200] font-black text-[16px] active:scale-95 transition box-golden-shadow" type="button">${r.won ? 'המשך במסלול' : 'חזרה למפה'}</button>
    </div>
  </main>
</div>`;
};
