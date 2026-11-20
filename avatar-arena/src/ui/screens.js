// תבניות המסכים. המבנה והמחלקות לקוחים מקוד ה-Tailwind ש-Stitch יצר.
// כל מחלקה כתובה כאן במלואה (בלי הרכבה בקוד) כדי ש-Tailwind יזהה אותה.
import { CHARACTERS } from '../data/characters.js';

export const face = (c) => `sprites/${c.id}_face.png`;
const stars = (n, on, off) => Array.from({ length: 5 }, (_, i) => `<span class="${i < n ? on : off}">★</span>`).join('');
const starCount = (c) => Math.min(5, c.tier + 1);
const pct = (v, max) => Math.round(Math.max(8, Math.min(100, (v / max) * 100)));
const statsOf = (c) => ({
  atk: pct(c.attack.dmg + c.special.dmg, 23),
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
    <button data-act="start" class="w-[340px] py-4 px-6 bg-gradient-to-b from-[#f8cf4f] to-[#e4ac29] hover:from-[#fce075] hover:to-[#ebb735] active:translate-y-0.5 text-stone-900 font-extrabold text-[26px] rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.3)] border border-[#ffeaa5] transition-all duration-150 flex items-center justify-center tracking-wide" type="button"><span>התחל קרב</span></button>
    <button data-act="soon" class="mt-4 w-[290px] py-2.5 px-5 bg-[#17202e]/90 hover:bg-[#1f2b3e]/90 active:translate-y-0.5 text-[#8f9eb3] font-bold text-lg rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-[#2b3a52] transition-all duration-150 flex items-center justify-center gap-2" type="button">
      <svg class="w-4 h-4 text-[#8f9eb3]" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path></svg>
      <span>מסלול סיפור</span>
    </button>
  </section>

  <nav class="relative z-10 w-full flex items-center justify-center gap-5 pb-12 px-4">
    <button data-act="soon" class="min-w-[140px] py-3 px-4 bg-[#141b28]/95 hover:bg-[#1e283b] active:scale-95 text-stone-200 hover:text-white font-bold text-lg rounded-xl shadow-lg border border-[#28354b] transition-all duration-150 text-center" type="button">מסלול סיפור</button>
    <button data-act="start" class="min-w-[140px] py-3 px-4 bg-[#141b28]/95 hover:bg-[#1e283b] active:scale-95 text-stone-200 hover:text-white font-bold text-lg rounded-xl shadow-lg border border-[#28354b] transition-all duration-150 text-center" type="button">דמויות</button>
    <button data-act="soon" class="min-w-[140px] py-3 px-4 bg-[#141b28]/95 hover:bg-[#1e283b] active:scale-95 text-stone-200 hover:text-white font-bold text-lg rounded-xl shadow-lg border border-[#28354b] transition-all duration-150 text-center" type="button">הגדרות</button>
  </nav>
  <div class="pointer-events-none absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/70 to-transparent z-[5]"></div>
</main>`;

// ---------- בחירת דמות ----------
const selectCard = (c, selected) => {
  const e = EL[c.element], s = statsOf(c);
  const frame = selected
    ? 'border-2 border-[#f7d358] bg-[#142338]/90 selected-card-glow'
    : e.card;
  const bar = selected ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500' : e.bar;
  const row = (icon, color, w, fill) => `
    <div class="flex items-center gap-1.5 text-[9px] text-slate-300">
      <span class="w-2 ${color} font-mono">${icon}</span>
      <div class="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden"><div class="${fill} h-full rounded-full" style="width:${w}%"></div></div>
    </div>`;
  return `
  <article data-char="${c.id}" class="relative flex flex-col rounded-xl ${frame} overflow-hidden cursor-pointer transform hover:-translate-y-1 transition duration-200">
    <div class="h-1.5 w-full ${bar}"></div>
    <div class="relative flex-1 flex items-center justify-center p-2 bg-gradient-to-b ${e.portrait} overflow-hidden">
      <img src="${face(c)}" alt="" class="h-full w-full object-contain object-center drop-shadow-lg" style="image-rendering:pixelated" draggable="false">
      <div class="absolute bottom-1 right-2 ${e.tag} rounded-full w-5 h-5 flex items-center justify-center shadow"><span class="text-[10px] text-white font-bold">${e.emoji}</span></div>
    </div>
    <div class="bg-[#0b1420]/95 px-2 py-2 flex flex-col items-center border-t border-slate-700/60">
      <div class="flex items-center gap-0.5 text-[9px] mb-0.5">${stars(starCount(c), e.stars, 'text-slate-600')}</div>
      <h3 class="text-sm font-bold text-white tracking-wide">${c.name} <span dir="ltr" class="inline-block">(${c.en})</span></h3>
      <div class="w-full mt-1.5 space-y-1">
        ${row('⚡', 'text-yellow-400', s.atk, 'bg-amber-400')}
        ${row('🛡️', 'text-sky-400', s.def, 'bg-sky-400')}
        ${row('🌪️', 'text-emerald-400', s.spd, 'bg-emerald-400')}
      </div>
    </div>
  </article>`;
};

const lockedCard = () => `
  <article class="relative flex flex-col rounded-xl border border-slate-700/50 bg-[#0e141c]/90 opacity-70 overflow-hidden cursor-not-allowed select-none">
    <div class="h-1.5 w-full bg-slate-700"></div>
    <div class="relative flex-1 flex flex-col items-center justify-center p-2 bg-[#0a0f16]/90 overflow-hidden">
      <div class="opacity-15 filter grayscale">
        <svg class="w-20 h-24 text-slate-400" fill="currentColor" viewBox="0 0 100 120"><path d="M22 105 C35 88, 65 88, 78 105 L88 120 L12 120 Z"></path><circle cx="50" cy="48" r="26"></circle></svg>
      </div>
      <div class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 z-10">
        <div class="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-600 flex items-center justify-center shadow-lg">
          <svg class="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path clip-rule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" fill-rule="evenodd"></path></svg>
        </div>
        <span class="text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800">נפתח בשלב 4</span>
      </div>
    </div>
    <div class="bg-[#080d14] px-2 py-3 flex flex-col items-center border-t border-slate-800">
      <span class="text-xs font-bold text-slate-500 tracking-wider">נעול</span>
      <div class="w-full mt-2 space-y-1.5 opacity-30"><div class="bg-slate-700 h-1.5 rounded-full w-full"></div><div class="bg-slate-700 h-1.5 rounded-full w-full"></div></div>
    </div>
  </article>`;

export const selectScreen = (selId, bots) => `
<main dir="rtl" class="screen flex flex-col justify-between select-none overflow-hidden bg-twilight-mountains font-rubik">
  <div aria-hidden="true" class="absolute inset-0 pointer-events-none bg-mountains-shade">
    <svg class="absolute bottom-0 w-full h-2/5 opacity-35 text-[#080d16]" fill="currentColor" preserveAspectRatio="none" viewBox="0 0 1200 400"><path d="M0,400 L0,220 L160,110 L340,280 L520,70 L710,240 L890,90 L1080,260 L1200,160 L1200,400 Z"></path></svg>
    <svg class="absolute bottom-0 w-full h-1/3 opacity-55 text-[#05080e]" fill="currentColor" preserveAspectRatio="none" viewBox="0 0 1200 300"><path d="M0,300 L0,180 L230,80 L440,220 L680,60 L920,210 L1110,120 L1200,180 L1200,300 Z"></path></svg>
  </div>
  <header class="relative z-10 pt-4 pb-1 text-center">
    <h1 class="text-lg tracking-widest text-slate-300 font-bold uppercase drop-shadow-md">בחר דמות / CHARACTER SELECT</h1>
  </header>
  <section class="relative z-10 flex-1 flex items-center justify-center px-8 py-2">
    <div class="grid grid-cols-5 gap-5 w-full max-w-5xl h-[72%] max-h-[380px] items-stretch">
      ${CHARACTERS.map((c) => selectCard(c, c.id === selId)).join('')}
      ${lockedCard()}
    </div>
  </section>
  <footer class="relative z-10 w-full px-12 py-4 flex items-center justify-between border-t border-slate-800/80 bg-gradient-to-t from-[#060a11] via-[#09101c]/95 to-transparent">
    <div class="flex items-center gap-3">
      <span class="text-sm font-bold text-slate-300 drop-shadow">כמה בוטים?</span>
      <div class="inline-flex rounded-lg p-0.5 bg-[#0e1726] border border-slate-700 shadow-inner" role="group">
        ${[1, 2, 3].map((n) => `<button data-bots="${n}" class="w-8 h-8 flex items-center justify-center rounded text-sm ${n === bots ? 'font-bold bg-sky-600 text-white shadow' : 'font-semibold text-slate-400 hover:text-white hover:bg-slate-800'} focus:outline-none transition" type="button">${n}</button>`).join('')}
      </div>
    </div>
    <button data-act="go" class="relative group px-12 py-2.5 rounded-xl font-black text-base tracking-wider text-amber-950 bg-gradient-to-b from-[#ffea79] via-[#f7cb45] to-[#d89e1b] hover:brightness-110 active:scale-95 shadow-[0_4px_16px_rgba(247,203,69,0.35)] border-t border-yellow-200 transition-all duration-150 ease-out cursor-pointer flex items-center gap-2" type="button">
      <span>קדימה</span>
      <svg class="w-4 h-4 text-amber-950 transform rotate-180" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    </button>
  </footer>
</main>`;

// ---------- VS ----------
const vsOpponent = (c) => {
  const e = EL[c.element];
  return `
  <div class="flex flex-col items-center">
    <div class="w-24 aspect-[4/5] ${e.vsBg} rounded-md border-2 ${e.vsBorder} p-1 flex flex-col justify-between character-card shadow-lg relative">
      <div class="w-full flex-1 ${e.vsInner} rounded flex items-center justify-center overflow-hidden relative">
        <img src="${face(c)}" alt="" class="w-full h-full object-cover object-top" style="image-rendering:pixelated" draggable="false">
      </div>
      <div class="mt-1 text-center font-bold text-sm text-white drop-shadow">רמה ${c.tier}</div>
    </div>
    <div class="mt-2 flex flex-col items-center">
      <div class="flex items-center gap-1"><span class="w-3.5 h-3.5 rounded-full ${e.vsDot} inline-block"></span><span class="text-[10px] text-slate-300">${'●'.repeat(Math.min(3, c.tier))}</span></div>
      <span class="text-sm font-semibold text-slate-200 mt-0.5">${c.en}</span>
    </div>
  </div>`;
};

export const vsScreen = (player, bots) => {
  const e = EL[player.element];
  return `
<main class="screen vs-bg text-white overflow-hidden flex flex-col justify-between p-10 select-none font-sans">
  <div class="diagonal-line"></div>
  <header class="w-full flex items-center justify-between z-10 opacity-70">
    <div class="text-xs tracking-widest text-slate-400 font-semibold uppercase">PRE-FIGHT / VS SCREEN</div>
    <div class="text-xs text-slate-400 tracking-wider">AVATAR ARENA</div>
  </header>
  <section class="relative z-10 w-full flex-1 flex items-center justify-between px-12 my-auto">
    <article class="flex flex-col items-center">
      <div class="w-48 aspect-[4/5] bg-[#3a4454] rounded-lg border-2 border-slate-300/80 character-card p-1.5 flex flex-col overflow-hidden relative">
        <div class="w-full h-full bg-[#e8a36e] rounded overflow-hidden relative flex items-end justify-center">
          <img src="${face(player)}" alt="" class="w-full h-full object-cover object-top" style="image-rendering:pixelated" draggable="false">
        </div>
        <div class="absolute bottom-2 left-2 right-2 bg-black/60 py-0.5 rounded flex items-center justify-center gap-1 border border-yellow-500/30">
          ${stars(starCount(player), 'text-yellow-400 text-xs', 'text-slate-600 text-xs')}
        </div>
      </div>
      <div class="mt-3 flex flex-col items-center gap-1.5">
        <h2 class="text-xl font-bold tracking-wide text-white drop-shadow">${player.en}</h2>
        <div class="flex items-center gap-1.5 bg-[#182030] px-2 py-1 rounded-full border border-slate-700/80">
          <div class="w-5 h-5 rounded-full ${e.vsBg} flex items-center justify-center shadow-inner text-[10px]">${e.emoji}</div>
          <div class="w-24 h-2 bg-slate-700 rounded-full overflow-hidden"><div class="h-full ${e.vsBg} rounded-full" style="width:${statsOf(player).spd}%"></div></div>
        </div>
      </div>
    </article>
    <article class="flex flex-col items-center justify-center px-4">
      <h1 class="text-7xl font-extrabold text-[#f6c344] vs-text tracking-tighter transform -rotate-3 select-none">VS</h1>
    </article>
    <article class="flex flex-col items-center">
      <div class="flex items-center gap-5">
        ${bots.map((b, i) => (i ? `<span class="text-sm font-bold text-slate-400 uppercase italic">VS</span>` : '') + vsOpponent(b)).join('')}
      </div>
    </article>
  </section>
  <footer class="relative z-10 w-full flex flex-col items-center pb-2">
    <div class="w-96 h-2.5 bg-[#172031] rounded-full overflow-hidden border border-slate-700/60 p-0.5">
      <div id="vs-progress" class="h-full bg-gradient-to-r from-[#f6c344] to-yellow-300 rounded-full loading-pulse transition-all duration-300" style="width:8%"></div>
    </div>
    <span dir="rtl" class="mt-1.5 text-xs text-slate-400 font-medium tracking-wider">טוען...</span>
  </footer>
</main>`;
};

// ---------- קרב: רקע, HUD, בקרות מגע ----------
export const fightBackground = () => `
<div class="absolute inset-0 bg-sunset-sky overflow-hidden">
  <div class="absolute left-1/2 -translate-x-1/2 bottom-[26%] w-[22%] aspect-square rounded-full sun-glow pointer-events-none"></div>
  <div class="absolute left-1/2 -translate-x-1/2 bottom-[27%] w-[12%] aspect-square rounded-full bg-[#fffae4] opacity-95 pointer-events-none"></div>
  <svg class="absolute bottom-0 w-full h-[55%] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 300"><path d="M0,300 L0,220 L110,165 L240,240 L380,140 L500,225 L650,110 L790,205 L910,135 L1000,195 L1000,300 Z" fill="#b97864" fill-opacity="0.5"></path></svg>
  <svg class="absolute bottom-0 w-full h-[48%] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 300"><path d="M0,300 L0,185 L90,120 L210,210 L310,150 L440,230 L550,180 L680,85 L810,210 L940,150 L1000,200 L1000,300 Z" fill="#8f574d" fill-opacity="0.75"></path></svg>
  <svg class="absolute bottom-0 w-full h-[38%] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 300"><path d="M0,300 L0,140 L120,70 L260,180 L350,125 L470,220 L580,240 L690,130 L850,220 L1000,110 L1000,300 Z" fill="#673c38" fill-opacity="0.9"></path></svg>
</div>
<div class="absolute inset-0 pointer-events-none">
  <div class="absolute left-[8%] top-[40%] w-[16%] h-[7%] flex flex-col items-center">
    <svg class="w-full h-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]" viewBox="0 0 200 65"><ellipse cx="100" cy="18" fill="#58616a" rx="90" ry="12" stroke="#717c88" stroke-width="2"></ellipse><ellipse cx="100" cy="17" fill="#75828f" rx="84" ry="9"></ellipse><polygon fill="#353c44" points="12,18 25,32 50,42 85,55 105,62 125,52 160,40 188,18" stroke="#252a30" stroke-width="1.5"></polygon><polygon fill="#2c333a" points="40,24 60,48 85,55 90,30"></polygon><polygon fill="#434c56" points="110,24 135,46 155,30"></polygon></svg>
  </div>
  <div class="absolute right-[8%] top-[40%] w-[16%] h-[7%] flex flex-col items-center">
    <svg class="w-full h-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]" viewBox="0 0 200 65"><ellipse cx="100" cy="18" fill="#58616a" rx="90" ry="12" stroke="#717c88" stroke-width="2"></ellipse><ellipse cx="100" cy="17" fill="#75828f" rx="84" ry="9"></ellipse><polygon fill="#353c44" points="12,18 35,36 60,48 100,62 135,50 170,36 188,18" stroke="#252a30" stroke-width="1.5"></polygon><polygon fill="#2b3138" points="35,24 55,42 75,28"></polygon><polygon fill="#434c56" points="90,26 100,62 125,40"></polygon></svg>
  </div>
  <div class="absolute left-1/2 -translate-x-1/2 bottom-[13%] w-[46%] h-[28%] flex flex-col items-center">
    <svg class="w-full h-full drop-shadow-[0_16px_25px_rgba(0,0,0,0.65)]" viewBox="0 0 540 220"><polygon fill="#303840" points="25,48 60,95 110,140 180,185 240,215 285,212 345,175 420,125 480,80 515,48" stroke="#1f2429" stroke-width="3"></polygon><polygon fill="#242b31" points="60,95 130,110 180,185 110,140"></polygon><polygon fill="#3d4650" points="130,110 240,120 240,215 180,185"></polygon><polygon fill="#293037" points="240,120 330,110 345,175 285,212 240,215"></polygon><polygon fill="#39424c" points="330,110 420,125 345,175"></polygon><polygon fill="#21272d" points="420,125 480,80 435,70"></polygon><polygon fill="#434e5a" points="130,55 190,75 240,120 130,110"></polygon><polygon fill="#4e5a66" points="240,120 310,70 330,110"></polygon><polygon fill="#293138" points="40,55 130,55 90,85"></polygon><ellipse cx="270" cy="46" fill="#555f69" rx="245" ry="32" stroke="#363d44" stroke-width="3"></ellipse><ellipse cx="270" cy="44" fill="#75818d" rx="238" ry="28"></ellipse><ellipse cx="270" cy="43" fill="#8d99a6" rx="226" ry="24"></ellipse><ellipse cx="270" cy="43" fill="none" rx="205" ry="20" stroke="#68737e" stroke-dasharray="8 4" stroke-width="2"></ellipse></svg>
  </div>
</div>`;

export const hudCard = (c, human, uid) => {
  const e = EL[c.element];
  return `
  <article data-hud="${uid}" class="flex flex-col items-center">
    <div class="flex items-center ${e.hudCard} border rounded-md px-1.5 py-1 gap-1.5 shadow-md">
      <div class="w-8 h-8 rounded ${e.hudFace} border overflow-hidden flex items-center justify-center relative flex-shrink-0">
        <img src="${face(c)}" alt="" class="w-full h-full object-cover object-top" style="image-rendering:pixelated" draggable="false">
      </div>
      <div class="flex flex-col text-left leading-tight pr-0.5">
        <span class="text-[9px] ${e.hudName} font-semibold tracking-wide">${c.en}${human ? ' ★' : ''}</span>
        <span data-pct class="text-sm font-black text-white">0%</span>
      </div>
    </div>
    <div data-stocks class="flex gap-1 mt-0.5 items-center">
      ${[0, 1, 2].map(() => `<span class="w-1.5 h-1.5 rounded-full ${e.hudDot} border"></span>`).join('')}
    </div>
  </article>`;
};

export const hudScreen = (fighters) => `
<div class="screen pointer-events-none font-sans">
  <header class="absolute top-3 left-4 right-4 flex items-start justify-between z-20">
    <div class="flex items-center gap-3">${fighters.map((f) => hudCard(f.def, f.human, f.uid)).join('')}</div>
    <button data-act="pause" aria-label="Pause" class="pointer-events-auto w-9 h-9 rounded-full bg-black/40 border border-white/40 flex items-center justify-center text-white/80 active:scale-95 transition-transform backdrop-blur-sm" type="button">
      <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><rect height="14" rx="1.5" width="3.5" x="6" y="5"></rect><rect height="14" rx="1.5" width="3.5" x="14.5" y="5"></rect></svg>
    </button>
  </header>
  <div id="touch-ui" class="absolute inset-0 z-30" hidden>
    <nav class="absolute left-6 bottom-6 w-36 h-36 rounded-full d-pad-base pointer-events-auto flex items-center justify-center p-2">
      <div class="relative w-full h-full flex items-center justify-center">
        <button data-hold="up" aria-label="Up" class="dp absolute top-1 left-1/2 -translate-x-1/2 w-9 h-9 flex items-center justify-center" type="button"><svg class="w-7 h-7 d-pad-arrow" viewBox="0 0 24 24"><polygon points="12,4 4,16 20,16"></polygon></svg></button>
        <button data-hold="down" aria-label="Down" class="dp absolute bottom-1 left-1/2 -translate-x-1/2 w-9 h-9 flex items-center justify-center" type="button"><svg class="w-7 h-7 d-pad-arrow" viewBox="0 0 24 24"><polygon points="12,20 4,8 20,8"></polygon></svg></button>
        <button data-hold="left" aria-label="Left" class="dp absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center" type="button"><svg class="w-7 h-7 d-pad-arrow" viewBox="0 0 24 24"><polygon points="4,12 16,4 16,20"></polygon></svg></button>
        <button data-hold="right" aria-label="Right" class="dp absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center" type="button"><svg class="w-7 h-7 d-pad-arrow" viewBox="0 0 24 24"><polygon points="20,12 8,4 8,20"></polygon></svg></button>
        <div class="w-6 h-6 rounded-full bg-white/20 border border-white/30 pointer-events-none"></div>
      </div>
    </nav>
    <nav class="absolute right-5 bottom-5 w-52 h-52 pointer-events-none">
      <button data-hold="attack" aria-label="Attack" class="virtual-btn pointer-events-auto absolute right-0 top-3 w-20 h-20 rounded-full flex items-center justify-center text-white/90 font-medium text-sm tracking-wide" type="button">Attack</button>
      <div class="absolute left-0 top-10 flex flex-col items-center gap-0.5">
        <span class="text-xs text-white/80 font-medium tracking-wide">Special</span>
        <button data-hold="special" aria-label="Special" class="virtual-btn pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center relative p-1.5" type="button">
          <svg class="w-full h-full text-white/80" viewBox="0 0 40 40"><circle id="sp-ring" cx="20" cy="20" fill="none" r="16" stroke="currentColor" stroke-dasharray="100.5" stroke-dashoffset="0" stroke-width="2.5" transform="rotate(-90 20 20)"></circle><circle cx="20" cy="20" fill="none" opacity="0.6" r="10" stroke="currentColor" stroke-width="2"></circle></svg>
        </button>
      </div>
      <button data-hold="jump" aria-label="Jump" class="virtual-btn pointer-events-auto absolute right-1 bottom-0 w-16 h-16 rounded-full flex items-center justify-center text-white/90 font-medium text-sm tracking-wide" type="button">Jump</button>
    </nav>
  </div>
</div>`;

// ---------- עצירה ----------
export const pauseScreen = () => `
<div dir="rtl" class="screen flex items-center justify-center select-none font-sans">
  <div class="absolute inset-0 bg-[#09111c]/65"></div>
  <section aria-label="תפריט עצירה" class="relative z-20 w-[250px] bg-[rgba(16,26,43,0.94)] game-modal rounded-[9px] p-5 flex flex-col gap-3 items-center border border-[#2e496a] shadow-2xl">
    <button data-act="resume" class="w-full py-2 px-3 rounded-md bg-[#ffcf53] hover:bg-[#f8be35] text-[#1b263b] font-bold text-base tracking-wide gold-button-glow transition duration-150 active:scale-[0.98] focus:outline-none flex items-center justify-center shadow" type="button">המשך</button>
    <button data-act="restart" class="w-full py-2 px-3 rounded-md bg-[rgba(23,37,61,0.88)] hover:bg-[rgba(35,54,88,0.95)] text-slate-100 font-medium text-sm border border-[#395476] transition duration-150 active:scale-[0.98] focus:outline-none flex items-center justify-center shadow-sm" type="button">התחל מחדש</button>
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
