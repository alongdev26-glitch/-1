import { QUESTIONS } from './questions.js';
import { matchAnswer } from './checker.js';
import { makeOpponent, botSkill, planBotTurn, TURN_SECONDS } from './bot.js';
import {
  MAX_ENERGY, COST, COIN_PACK, FREE_COINS, FREE_COINS_MS, DAILY_GEMS,
  defaultSave, tickEnergy, energyCountdownMs, spendEnergy, spend, rewards, pickQuestion,
} from './economy.js';

const KEY = 'rosh-brosh-save-v1';
const PRE_SECONDS = 6;
const WINS_NEEDED = 2;
const MAX_ROUNDS = 5;

// תמונות הפרופיל מ-Stitch (אם לא נטענות, מוצג האימוג'י)
const IMG = 'https://lh3.googleusercontent.com/aida-public/';
const ME = { name: 'אופיר שאול', face: '🧑‍🦱', img: IMG + 'AB6AXuATPYsjSE1-MTMHgW2gZ20vtyVL3FGScRajsO48nTAySB0MBs1W_pBUz0IivL88IUU_pt8jqgffQReIMZKp5yq7axbDaccW7NoBIIgwoT2oqtUfsH19nGR8gyJqGjyMObu71XqUgt6EX6PowhdrsXwnp_Gqv25GA---bP8v3W85XWUm_eFUOtej7xrGvVJDONi2NWMs7RJh-d3mXEvHsYYWltmpkkowdRczmURey1Y' };
const FRIENDS = [
  { name: 'שימי ביטון', face: '👨‍🦳', trophies: 68, img: IMG + 'AB6AXuCmP_6xbAO0Ruz6_fEtqzKcOfG-rzoJimMY1e67sC75yxt864CGtt333uxlMQZ9OLvt8HUz2c2ehZCA8DITNoGBUhQwyXPHS-pZUyNMcZa6bul3MNXOykm5SPggr2KSgi4kcBh6xuB4xS0KcuZpFrfDUF8r7BKxk5vdDg0SM1fWY4XkjRxjZxVgHilSf6yOumP_vx0Ch1YDmTn3j_fuwnX2DTL0TW_VnrLmvgD1U3A' },
  { name: 'יוני הררי', face: '🧔', trophies: 677, img: IMG + 'AB6AXuAumkutXBKtspkLtKHvqdwSUtBt3d7zv2VE_38RMKpGBCfsW6hUTpskLbVJkJGmzR7s-WEaP5FCEwfE4-07ntP5xhYKTDC_mu-60am0SsBOKtLFOdqeWCakj-B185q9ndtEgpXU3D6aM6hQBqYTJUu5giou_U10ZcAWz1o3TTFdkkQHUnVy4m0n-0H76XjiTfFtsEfZ6AA9wVos8VabTiJQEMLQ2xWQeNPY2LG48kw' },
  { name: 'שמרית', face: '👩‍🦰', trophies: 989, img: IMG + 'AB6AXuCREPpx0ck0kwKhgnRRFq9zjfvSb4A6bnLo0ytKNz1RQfTAlgq-ouUmwxKjdPnAXMpXCJdHCR0RII2zE8YGGkBg0HVyU5D2dZ-src1tBSZYHelmsdcfb1J6cIy1NG6iGZ4UQXpCb3Hm7RbEhbehQ6CB2yiQ-mqBvZWp1SpdWwkpSFNvim_qdL6j_ECTwVmaFvgr7GrH7ahonwc2IfOPKy171sMvzvMGKkLo1JG39GE' },
];

// ---------- save ----------
let save = load();
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && typeof raw === 'object') return { ...defaultSave(), ...raw };
  } catch { /* private mode / corrupt */ }
  return defaultSave();
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* ignore */ }
}

// ---------- html helpers ----------
const $ = (s) => document.querySelector(s);
const screen = $('#screen');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** עיגול תמונה: האימוג'י מאחור, והתמונה מעליו (נעלמת אם לא נטענה). */
const avatar = (p, size, extra = '') =>
  `<div class="relative ${size} rounded-full overflow-hidden bg-amber-500 flex items-center justify-center shrink-0 ${extra}"><span class="text-[1.4em] leading-none">${p.face}</span>${p.img ? `<img alt="${esc(p.name)}" class="absolute inset-0 w-full h-full object-cover" src="${p.img}" onerror="this.remove()">` : ''}</div>`;

const PLUS = (pos) => `<span class="absolute ${pos} text-[9px] bg-green-500 rounded-full w-3 h-3 flex items-center justify-center text-white font-extrabold leading-none">+</span>`;

/** סרגל עליון של מסך הבית (stat-pill) */
const homeHeader = () => `
<header class="w-full pt-3 px-3 pb-1 z-20">
  <div class="flex items-start justify-between gap-1 w-full">
    <button data-act="back" aria-label="חזור" class="w-10 h-10 rounded-full bg-[#3d0b6d]/80 border border-[#892ee3] flex items-center justify-center text-white active:scale-95 shadow-md flex-shrink-0">
      <svg class="w-6 h-6 rotate-180 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path></svg>
    </button>
    <div class="flex items-center gap-1.5 flex-1 justify-end">
      <button data-act="energy" class="flex flex-col items-center">
        <div class="stat-pill px-2 py-0.5 rounded-full flex items-center gap-1 min-w-[70px] justify-between h-7">
          <span data-v="energy" class="font-bold text-xs tracking-tight text-white pl-0.5"></span>
          <div class="relative flex items-center justify-center -mr-1"><span class="text-yellow-300 text-sm filter drop-shadow">⚡</span>${PLUS('-top-1 -right-1')}</div>
        </div>
        <span data-v="timer" class="text-[9px] font-semibold text-purple-200/90 mt-0.5 tracking-wider h-3"></span>
      </button>
      <button data-act="gems" class="stat-pill px-2 py-0.5 rounded-full flex items-center gap-1 min-w-[76px] justify-between h-7">
        <span data-v="gems" class="font-bold text-xs tracking-tight text-white"></span>
        <div class="relative flex items-center justify-center -mr-1"><span class="text-cyan-300 text-sm filter drop-shadow">💎</span>${PLUS('-top-1 -right-1')}</div>
      </button>
      <button data-act="coins" class="stat-pill px-2 py-0.5 rounded-full flex items-center gap-1 min-w-[68px] justify-between h-7">
        <span data-v="coins" class="font-bold text-xs tracking-tight text-white"></span>
        <div class="relative flex items-center justify-center -mr-1"><span class="text-amber-400 text-base filter drop-shadow">🪙</span>${PLUS('-top-1 -right-1')}</div>
      </button>
    </div>
  </div>
  <div class="flex items-center gap-2 mt-1 mr-1">
    ${avatar(ME, 'w-12 h-12', 'border-2 border-yellow-400 shadow-lg')}
    <div class="stat-pill px-2.5 py-0.5 rounded-full flex items-center gap-1 h-6"><span class="text-xs font-bold text-white">${save.trophies}</span><span class="text-xs">🏆</span></div>
  </div>
</header>`;

/** סרגל עליון של מסך הדו-קרב (פילים בלי מסגרת בהירה) */
const gamePill = (act, key, icon, iconCls, heightCls = 'h-[32px]') => `
<button data-act="${act}" class="bg-[#460f72] border border-white/25 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-inner ${heightCls}">
  <span data-v="${key}" class="font-extrabold text-sm tracking-wide text-white"></span>
  <div class="relative flex items-center justify-center"><span class="${iconCls} leading-none">${icon}</span><span class="absolute -bottom-1.5 -left-1 text-[9px] font-black bg-white text-purple-900 rounded-full w-3 h-3 flex items-center justify-center leading-none">+</span></div>
</button>`;
const gameHeader = () => `
<header class="pt-3 px-3 pb-2 z-20 flex flex-col gap-1">
  <div class="flex items-center justify-between w-full">
    <button data-act="back" aria-label="חזרה" class="w-10 h-10 rounded-full bg-[#460f72]/70 active:scale-95 transition-transform flex items-center justify-center border border-white/20 shadow-md" type="button">
      <svg class="w-6 h-6 text-white stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    </button>
    <div class="flex items-center gap-2">
      <div class="flex flex-col items-center">
        <button data-act="energy" class="bg-[#460f72] border border-white/25 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-inner">
          <span data-v="energy" class="font-extrabold text-sm tracking-wide text-white"></span>
          <div class="relative flex items-center justify-center"><span class="text-base leading-none text-yellow-400 drop-shadow">⚡</span><span class="absolute -bottom-1 -left-1 text-[9px] font-black bg-white text-purple-900 rounded-full w-3 h-3 flex items-center justify-center leading-none">+</span></div>
        </button>
        <span data-v="timer" class="text-[10px] text-white/90 font-medium tracking-tight mt-0.5 h-3"></span>
      </div>
      ${gamePill('gems', 'gems', '💎', 'text-xs')}
      ${gamePill('coins', 'coins', '🪙', 'text-sm')}
    </div>
  </div>
</header>`;

const SCREEN_BG = 'bg-gradient-to-b from-[#6e18af] via-[#6616a5] to-[#400e6c]';
const cost = (n) => `<div class="flex items-center bg-[#3c0f5e] px-1.5 py-0.5 rounded-full text-xs font-bold text-yellow-300 gap-1 border border-yellow-500/30"><span>${n}</span><span>🪙</span></div>`;
const darkBtn = (act, cls, inner) => `<button data-act="${act}" type="button" class="${cls} bg-[#52177c] hover:bg-[#5f1c90] active:scale-95 transition-all text-white py-2 rounded-2xl flex items-center justify-center gap-1.5 btn-3d-dark border border-white/20">${inner}</button>`;
const bigGloss = (act, label, extra = '') => `<button data-act="${act}" class="game-gloss-card w-full h-16 rounded-2xl flex items-center justify-center cursor-pointer text-2xl font-black text-3d-white ${extra}">${label}</button>`;

// ---------- toast / modal ----------
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}
function openModal(title, text, buttons) {
  const m = $('#modal');
  m.innerHTML = `<div class="game-gloss-card w-full rounded-3xl p-5 text-center flex flex-col gap-3">
    <h3 class="text-2xl font-black text-3d-white">${title}</h3>
    ${text ? `<p class="text-purple-100 font-medium leading-relaxed">${text}</p>` : ''}
    ${buttons.map((b, i) => `<button data-modal="${i}" class="${b.ghost ? 'bg-[#3c0f5e] border border-white/20' : 'play-btn-glow'} rounded-2xl py-3 text-xl font-extrabold">${b.label}</button>`).join('')}
  </div>`;
  m.hidden = false;
  m.onclick = (e) => {
    const b = e.target.closest('[data-modal]');
    if (b) buttons[Number(b.dataset.modal)].run?.();
    if (b || e.target === m) closeModal();
  };
}
function closeModal() { $('#modal').hidden = true; }

// ---------- top bar values ----------
function renderBar() {
  tickEnergy(save);
  const ms = energyCountdownMs(save);
  const s = Math.ceil(ms / 1000);
  const vals = {
    energy: `${save.energy}/${MAX_ENERGY}`, gems: save.gems, coins: save.coins,
    timer: ms ? `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : '',
  };
  for (const [k, v] of Object.entries(vals)) {
    const els = document.querySelectorAll(`[data-v="${k}"]`);
    const prev = lastVal[k];
    if ((k === 'gems' || k === 'coins') && prev !== undefined && prev !== v) tween(k, prev, v);
    else els.forEach((e) => { e.textContent = v; });
    if (k === 'energy' && prev !== undefined && prev !== v) els.forEach(bump);
    lastVal[k] = v;
  }
}
const lastVal = {};
const bump = (el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
function tween(key, from, to) {
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 500);
    const v = Math.round(from + (to - from) * k);
    document.querySelectorAll(`[data-v="${key}"]`).forEach((e) => { e.textContent = v; if (k === 1) bump(e); });
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function countUp(el, to, prefix = '', suffix = '') {
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 900);
    const v = Math.round(to * (1 - (1 - k) ** 3));
    el.textContent = `${prefix}${v}${suffix}`;
    if (k < 1 && el.isConnected) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function confetti(parent, n = 30) {
  const colors = ['#ffd000', '#ff5d9e', '#5be3ff', '#86efac', '#ffffff', '#c084fc'];
  const box = document.createElement('div');
  box.className = 'confetti';
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.6}s;animation-duration:${1.8 + Math.random() * 1.6}s;--rot:${Math.round(Math.random() * 720 - 360)}deg`;
    box.append(c);
  }
  parent.append(box);
  setTimeout(() => box.remove(), 4200);
}
setInterval(renderBar, 1000);

// ---------- economy actions ----------
function buyEnergy() {
  if (save.energy >= MAX_ENERGY) return toast('האנרגיה מלאה');
  openModal('⚡ אנרגיה', 'כל משחק עולה אנרגיה אחת. אנרגיה אחת חוזרת כל 10 דקות.', [
    { label: `מלא הכול ב-${COST.refill} 💎`, run: () => {
      if (!spend(save, 'gems', COST.refill)) return toast('אין מספיק יהלומים');
      save.energy = MAX_ENERGY; persist(); renderBar(); toast('האנרגיה התמלאה');
    } },
    { label: 'אחכה', ghost: true },
  ]);
}
function gemsModal() {
  openModal('💎 יהלומים', 'בגרסה המלאה כאן קונים יהלומים בכסף אמיתי. באב-הטיפוס אפשר לקבל פרס יומי וחינם.', [
    { label: `פרס יומי: ${DAILY_GEMS} 💎`, run: claimDaily },
    { label: 'סגור', ghost: true },
  ]);
}
function coinsModal() {
  openModal('🪙 מטבעות', 'המטבעות משמשים ל"החלף שאלה", "זמן" ו"ג\'וקר".', [
    { label: `${COIN_PACK} 🪙 ב-${COST.coinPack} 💎`, run: () => {
      if (!spend(save, 'gems', COST.coinPack)) return toast('אין מספיק יהלומים');
      save.coins += COIN_PACK; persist(); renderBar(); toast(`קיבלת ${COIN_PACK} מטבעות`);
    } },
    { label: 'מטבעות חינם', run: claimFreeCoins },
    { label: 'סגור', ghost: true },
  ]);
}
function claimFreeCoins() {
  const wait = save.freeCoinsAt + FREE_COINS_MS - Date.now();
  if (wait > 0) return toast(`חוזרים בעוד ${Math.ceil(wait / 60000)} דקות`);
  save.coins += FREE_COINS; save.freeCoinsAt = Date.now(); persist(); renderBar(); toast(`קיבלת ${FREE_COINS} מטבעות`);
}
function claimDaily() {
  const day = new Date().toISOString().slice(0, 10);
  if (save.dailyDay === day) return toast('כבר לקחת היום. חוזרים מחר');
  save.gems += DAILY_GEMS; save.dailyDay = day; persist(); renderBar(); toast(`קיבלת ${DAILY_GEMS} יהלומים`);
}

// ---------- navigation + events ----------
let backAction = null;
function show(html, back = null) {
  backAction = back;
  screen.innerHTML = html;
  renderBar();
}
const ACTIONS = {
  back: () => backAction?.(),
  energy: buyEnergy, gems: gemsModal, coins: coinsModal,
  daily: claimDaily, free: claimFreeCoins, seasons: () => leaderboard(), play: () => startMatch(),
  friend: (el) => startMatch(FRIENDS[Number(el.dataset.i)]),
  home: () => home(),
};
screen.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el) (ACTIONS[el.dataset.act] || (() => {}))(el);
});

// ---------- home ----------
function home() {
  stopRound();
  M = null;
  show(`
<div class="flex-1 min-h-0 bg-game-swirls flex flex-col justify-between overflow-y-auto">
  ${homeHeader()}
  <main class="menu-in px-4 flex flex-col justify-start gap-3.5 mt-2 z-10">
    <section class="grid grid-cols-2 gap-3">
      <button data-act="daily" class="game-gloss-card h-20 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-2 text-center cursor-pointer">
        <div class="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-purple-400/10 pointer-events-none"></div>
        <div class="absolute -left-2 -bottom-2 text-3xl opacity-25 filter blur-[0.5px]">🎁</div>
        <span class="text-xl font-black text-3d-white tracking-wide z-10">פרס יומי</span>
      </button>
      <button data-act="free" class="game-gloss-card h-20 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-2 text-center cursor-pointer">
        <div class="absolute inset-0 bg-gradient-to-tr from-yellow-500/15 to-purple-400/10 pointer-events-none"></div>
        <div class="absolute -right-2 -top-2 text-2xl opacity-20">✨</div>
        <span class="text-lg font-black text-3d-white tracking-tight z-10 leading-tight">מטבעות חינם</span>
        <span class="text-xs font-bold text-yellow-300 z-10 mt-0.5 drop-shadow">זמין!</span>
      </button>
    </section>
    <section>
      <button data-act="seasons" class="w-full game-gloss-card h-24 rounded-2xl relative overflow-hidden flex items-center justify-center cursor-pointer">
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <svg class="w-24 h-24 text-pink-300" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"></path></svg>
        </div>
        <div class="absolute left-6 top-3 w-3 h-1.5 bg-pink-400 rotate-45 rounded-sm opacity-60"></div>
        <div class="absolute right-8 bottom-3 w-2.5 h-1.5 bg-yellow-400 -rotate-12 rounded-sm opacity-60"></div>
        <h2 class="text-3xl font-black text-3d-white tracking-wide z-10">עונות</h2>
      </button>
    </section>
    <section>
      <button data-act="play" class="w-full play-btn-glow h-28 rounded-2xl relative overflow-hidden flex items-center justify-center cursor-pointer transition-all active:scale-[0.98]">
        <div class="absolute inset-0 tiled-diamonds opacity-40"></div>
        <div class="absolute top-2.5 right-6 text-white text-xs opacity-75 animate-pulse">✦</div>
        <div class="absolute bottom-3 left-10 text-white text-xs opacity-60 animate-pulse">✦</div>
        <div class="absolute top-4 left-1/4 text-white text-[10px] opacity-75">✦</div>
        <span class="text-4xl font-extrabold text-3d-white tracking-normal z-10">שחק כעת</span>
      </button>
    </section>
    <section class="mt-1">
      <div class="flex justify-start mb-2">
        <div class="bg-[#480c7d] border-r-4 border-l border-t border-b border-[#9f34f5] px-5 py-1 rounded-r-xl rounded-l-md shadow-md"><h3 class="text-sm font-bold text-purple-100">החברים שלי</h3></div>
      </div>
      <div class="grid grid-cols-3 gap-2 px-1 text-center">
        ${FRIENDS.map((f, i) => `
        <button data-act="friend" data-i="${i}" class="flex flex-col items-center">
          ${avatar(f, 'w-16 h-16 sm:w-20 sm:h-20', 'border-2 border-white/90 shadow-xl !bg-purple-900')}
          <span class="mt-1 text-xs font-bold text-white drop-shadow truncate w-full text-center">${esc(f.name)}</span>
        </button>`).join('')}
      </div>
    </section>
  </main>
  <footer class="relative mt-auto w-full pt-4 pb-4 px-3 bg-gradient-to-t from-[#260549] via-[#3c0973] to-transparent">
    <div class="relative flex flex-col items-center justify-center text-center">
      <div class="floaty absolute -top-7 inset-x-0 h-16 pointer-events-none flex justify-center items-center">
        <div class="w-7 h-7 rounded-full coin-3d -rotate-12 -translate-x-16 -translate-y-2"></div>
        <div class="w-8 h-8 rounded-full coin-3d rotate-45 -translate-x-8 translate-y-3"></div>
        <div class="w-12 h-12 rounded-full coin-3d rotate-12 z-10 translate-y-2 scale-110"></div>
        <div class="w-9 h-9 rounded-full coin-3d -rotate-45 translate-x-10 translate-y-0"></div>
        <div class="w-6 h-6 rounded-full coin-3d rotate-12 translate-x-16 -translate-y-3"></div>
      </div>
      <h1 class="text-5xl font-black font-display text-3d-banner tracking-normal relative z-20 mt-1 mb-1 leading-none">עוד!</h1>
      <p class="text-xs sm:text-sm font-bold text-purple-100 max-w-[280px] leading-snug drop-shadow-md z-20">המון אפשרויות, פעילויות ואתגרים מחכים במשחק!</p>
    </div>
  </footer>
</div>`);
}

const CROWN = (cls, gems = false) => `
<svg viewBox="0 0 120 80" class="${cls}" aria-hidden="true">
  <defs><linearGradient id="cg${gems ? 'b' : 't'}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e09a12"/></linearGradient></defs>
  <path d="M10 66 L4 18 L36 42 L60 6 L84 42 L116 18 L110 66 Z" fill="url(#cg${gems ? 'b' : 't'})" stroke="#b9770e" stroke-width="2" stroke-linejoin="round"/>
  <rect x="10" y="62" width="100" height="12" rx="4" fill="#f5b82e" stroke="#b9770e" stroke-width="2"/>
  <circle cx="4" cy="18" r="5" fill="#fff4c2"/><circle cx="60" cy="6" r="5" fill="#fff4c2"/><circle cx="116" cy="18" r="5" fill="#fff4c2"/>
  ${gems ? '<circle cx="60" cy="48" r="6" fill="#ef4444"/><circle cx="34" cy="56" r="4" fill="#ef4444"/><circle cx="86" cy="56" r="4" fill="#ef4444"/>' : ''}
</svg>`;

// ---------- leaderboard ----------
function leaderboard() {
  const rows = [
    FRIENDS[2], FRIENDS[1],
    { name: 'חגית דהן', face: '👱‍♀️', trophies: 556 },
    { ...ME, trophies: save.trophies, me: true },
    { name: 'Shir Daum', face: '👩', trophies: 123 },
    { name: 'Shai Cohen', face: '🧑', trophies: 58 },
  ].sort((a, b) => b.trophies - a.trophies);
  show(`
<div class="flex-1 min-h-0 ${SCREEN_BG} tiled-diamonds flex flex-col overflow-hidden">
  ${gameHeader()}
  <div class="px-3.5 flex justify-start">
    <div class="stat-pill px-3 py-0.5 rounded-full flex items-center gap-1.5 h-7"><span class="text-sm font-bold">${save.trophies}</span><span>🏆</span></div>
  </div>
  <div class="flex justify-center -mb-3 z-10 crown-in">${CROWN('w-28 h-20 drop-shadow-lg')}</div>
  <section class="mx-3.5 flex-1 min-h-0 bg-gradient-to-b from-[#7a22d6] to-[#5a16a8] rounded-3xl border border-white/20 shadow-xl px-3 pt-4 pb-3 flex flex-col">
    <h1 class="text-center text-4xl font-black text-3d-white mb-3">המובילים</h1>
    <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 lb-list">
      ${rows.map((r, i) => `
      <div class="lb-row rounded-2xl px-3 py-2 flex items-center gap-3 ${r.me ? 'bg-white/15 border border-white/50' : 'bg-white/5'}" style="animation-delay:${i * 70}ms">
        <div class="w-9 h-9 rounded-full ${r.me ? 'text-yellow-300 border-yellow-300/70' : 'border-white/30'} border flex items-center justify-center font-black text-lg">${i + 1}</div>
        ${avatar(r, 'w-12 h-12', `border-2 ${r.me ? 'border-yellow-400' : 'border-white/80'}`)}
        <b class="flex-1 font-extrabold text-lg ${r.me ? 'text-yellow-200' : ''}">${esc(r.name)}</b>
        <div class="stat-pill px-3 py-1 rounded-full text-sm font-extrabold flex items-center gap-1.5"><span>${r.trophies}</span><span>🏆</span></div>
      </div>`).join('')}
    </div>
  </section>
  <footer class="relative pt-1 pb-4 flex flex-col items-center">
    ${CROWN('w-32 h-24 drop-shadow-xl -mb-1 crown-float', true)}
    <h2 class="text-4xl font-black text-3d-banner font-display leading-none">תוביל</h2>
    <p class="text-lg font-black text-white drop-shadow mt-1">את טבלת השיאים!</p>
  </footer>
</div>`, home);
}

// ---------- match ----------
let M = null; // { opp, score:[me,opp], round, qi, usedQ, finished }
let R = null; // current round runtime

function startMatch(friend) {
  const opp = friend && friend.name
    ? { ...friend }
    : (() => {
      const o = makeOpponent(save.trophies);
      const f = FRIENDS.find((x) => x.name === o.name);
      return f ? { ...o, img: f.img } : o;
    })();
  if (!spendEnergy(save)) { renderBar(); return buyEnergy(); }
  save.played += 1; persist(); renderBar();
  M = { opp, score: [0, 0], round: 0, usedQ: [], finished: false };
  nextRound();
}

function chooseQuestion() {
  M.qi = pickQuestion(QUESTIONS.length, save.seen, M.usedQ);
  M.usedQ.push(M.qi);
  persist();
}

function forfeit() {
  if (!M || M.finished) return home();
  openModal('לעזוב באמצע?', 'עזיבה נחשבת הפסד, והאנרגיה לא חוזרת.', [
    { label: 'כן, לעזוב', run: () => finishMatch('lose') },
    { label: 'להישאר', ghost: true },
  ]);
}

function stopRound() {
  if (!R) return;
  clearInterval(R.iv);
  (R.botTimers || []).forEach(clearTimeout);
  R = null;
}

function nextRound() {
  stopRound();
  M.round += 1;
  chooseQuestion();
  intro();
}

function intro() {
  let left = PRE_SECONDS;
  const q = QUESTIONS[M.qi];
  show(`
<div class="flex-1 min-h-0 ${SCREEN_BG} flex flex-col">
  ${gameHeader()}
  <section class="px-3.5 flex flex-col gap-4">
    <div class="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2 mt-2">
      <div class="flex flex-col items-center gap-1">${avatar(ME, 'w-20 h-20', 'border-[3px] border-white shadow-xl')}<span class="font-black">${esc(ME.name)}</span><span class="stat-pill rounded-full px-3 text-sm font-bold">${save.trophies} 🏆</span></div>
      <div class="text-5xl font-black text-3d-white bump" dir="ltr">${M.score[0]}-${M.score[1]}</div>
      <div class="flex flex-col items-center gap-1">${avatar(M.opp, 'w-20 h-20', 'border-[3px] border-white shadow-xl')}<span class="font-black">${esc(M.opp.name)}</span><span class="stat-pill rounded-full px-3 text-sm font-bold">${M.opp.trophies} 🏆</span></div>
    </div>
    <div id="count" class="count-tick self-center w-20 h-20 rounded-full border-4 border-white/25 border-t-white flex items-center justify-center text-4xl font-black">${left}</div>
    <div class="bg-[#8b2dbf] p-5 rounded-3xl border-2 border-white/25 shadow-xl text-center">
      <h1 class="font-extrabold text-white text-[23px] leading-tight text-emboss">${esc(q.text)}</h1>
      <p class="text-purple-100 text-sm mt-2 font-medium">סיבוב ${M.round} · ${q.answers.length} תשובות לחפש</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      ${darkBtn('swap', 'py-3', `<span class="font-extrabold text-sm">החלף שאלה</span>${cost(COST.swap)}`)}
      ${darkBtn('confirm', 'py-3', '<span class="font-extrabold text-sm">✓ אשר שאלה</span>')}
    </div>
  </section>
</div>`, forfeit);
  const count = $('#count');
  ACTIONS.swap = () => {
    if (!spend(save, 'coins', COST.swap)) return toast('אין מספיק מטבעות');
    persist(); renderBar(); clearInterval(R.iv); chooseQuestion(); intro();
  };
  ACTIONS.confirm = () => { clearInterval(R.iv); play(); };
  R = { iv: setInterval(() => {
    left -= 1;
    count.textContent = Math.max(left, 0); bump(count);
    if (left <= 0) { clearInterval(R.iv); play(); }
  }, 1000) };
}

const CHECK = (cls = 'bg-[#70d63b]', mark = '✓') => `<div class="relative w-6 h-6 rounded-full ${cls} flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">${mark}</div>`;
const SPARKS = '<span class="spark" style="--dx:-14px;--dy:-16px"></span><span class="spark" style="--dx:14px;--dy:-14px"></span><span class="spark" style="--dx:-16px;--dy:12px"></span><span class="spark" style="--dx:16px;--dy:14px"></span>';

/** שורה בלוח: who = me | bot, hit = נכון/טעות. "me" בצד שמאל, "bot" בצד ימין. */
const bubbleRow = (e) => {
  const ok = e.hit;
  const check = ok
    ? `<div class="relative w-6 h-6 rounded-full bg-[#70d63b] flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">✓${e.who === 'me' ? SPARKS : ''}</div>`
    : CHECK('bg-[#ef4444]', '✗');
  const bubble = ok
    ? (e.who === 'me'
      ? 'bg-[#dcfce7] text-[#1b7a2d] border-green-200'
      : 'bg-white text-[#2a0845] border-purple-100')
    : 'bg-[#fee2e2] text-[#b91c1c] border-red-200 miss-flash';
  const b = `<div class="${bubble} font-extrabold text-[15px] px-4 py-1 rounded-xl badge-3d border max-w-[70%] truncate">${esc(e.text)}</div>`;
  return e.who === 'me'
    ? `<div class="flex items-center justify-end gap-1.5 slide-end">${b}${check}</div>`
    : `<div class="flex items-center justify-start gap-1.5 slide-start">${check}${b}</div>`;
};

const SWORD = (rot, trans, grad) => `
<div class="absolute transform ${rot} ${trans} drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"><div class="flex flex-col items-center">
  <div class="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-b-[24px] border-b-[#e0f2fe]"></div>
  <div class="w-[20px] h-[55px] bg-gradient-to-r ${grad} border-x border-[#0284c7]"></div>
  <div class="w-[38px] h-[8px] bg-gradient-to-b from-[#0284c7] to-[#0369a1] rounded-sm shadow-md"></div>
  <div class="w-[7px] h-[22px] bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#78350f] flex flex-col justify-between py-1"><span class="w-full h-[1px] bg-yellow-300"></span><span class="w-full h-[1px] bg-yellow-300"></span><span class="w-full h-[1px] bg-yellow-300"></span></div>
  <div class="w-4 h-4 bg-yellow-500 rounded-full border border-amber-600 shadow"></div>
</div></div>`;

function play() {
  const q = QUESTIONS[M.qi];
  const n = q.answers.length;
  const found = Array(n).fill(null); // null | 'me' | 'bot'
  const log = []; // { who, hit, text }
  const strikes = { me: 0, bot: 0 };
  let turn = M.round % 2 === 1 ? 'me' : 'bot';
  let turnTotal = TURN_SECONDS * 1000;
  let turnLeft = turnTotal;
  let over = false;

  show(`
<div class="flex-1 min-h-0 ${SCREEN_BG} flex flex-col justify-between overflow-hidden">
  ${gameHeader()}
  <section class="px-3.5 z-10 flex flex-col gap-3 min-h-0">
    <div class="flex items-center justify-between px-1">
      <div id="av-me" class="rounded-full">${avatar(ME, 'w-11 h-11', 'border-2 border-white shadow-lg')}</div>
      <div class="flex flex-col items-center">
        <div id="chip" class="stat-pill rounded-full px-4 py-1 text-sm font-extrabold flex items-center gap-2"><span id="chip-text"></span><span id="chip-sec" class="text-yellow-300 tabular-nums"></span></div>
        <div class="w-40 bg-purple-950/40 h-1.5 rounded-full overflow-hidden mt-1.5"><div id="tbar" class="h-full rounded-full w-full" style="background:linear-gradient(to left,#d4a853,#eab308)"></div></div>
      </div>
      <div id="av-bot" class="rounded-full">${avatar(M.opp, 'w-11 h-11', 'border-2 border-white shadow-lg')}</div>
    </div>
    <div class="bg-[#8b2dbf] p-3 pb-3.5 rounded-3xl border-2 border-white/25 shadow-xl flex flex-col gap-2.5 min-h-0">
      <h1 class="text-center font-extrabold text-white text-[21px] leading-tight px-2 text-emboss tracking-normal">${esc(q.text)}</h1>
      <div class="doodle-bg rounded-2xl p-3 border border-purple-300/40 relative shadow-inner min-h-[175px] flex flex-col justify-between overflow-hidden">
        <div id="rows" class="flex flex-col gap-2.5 w-full max-h-[30dvh] overflow-y-auto"></div>
        <div class="mt-2 pt-1 border-t border-purple-200/50 flex items-center justify-between text-xs font-bold text-purple-900 px-1">
          <span class="text-purple-800 text-[13px] font-black">${esc(ME.name)}</span>
          <span id="left" class="text-[11px] font-bold text-purple-700/70"></span>
          <span id="lives" class="text-[13px] tracking-widest"></span>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-5 gap-2 px-1">
      ${darkBtn('joker', 'col-span-2', `<span class="font-extrabold text-sm">ג'וקר</span>${cost(COST.joker)}`)}
      ${darkBtn('time', 'col-span-2', `<span class="font-extrabold text-sm">זמן</span>${cost(COST.time)}`)}
      ${darkBtn('emoji', 'col-span-1 !text-xl', '🤪')}
    </div>
    <form id="form" class="flex items-stretch bg-white rounded-2xl p-1 shadow-2xl border border-white/50 h-[52px]" autocomplete="off">
      <button id="send" class="bg-gradient-to-b from-[#ffbe2e] to-[#f59e0b] text-white font-black text-lg px-6 rounded-xl btn-3d-yellow transition-transform active:scale-95 flex items-center justify-center disabled:opacity-50" type="submit">שלח</button>
      <input id="ans" class="flex-1 min-w-0 bg-transparent border-0 outline-none text-gray-800 placeholder-gray-400 font-bold text-right px-3 text-base" dir="rtl" placeholder="הזן תשובה" type="text" autocapitalize="off" spellcheck="false" enterkeyhint="send" aria-label="תשובה" />
    </form>
  </section>
  <footer class="w-full relative pt-3 pb-5 flex flex-col items-center justify-end overflow-hidden">
    <div class="swords relative w-40 h-32 flex items-center justify-center mb-1 [@media(max-height:860px)]:hidden">
      ${SWORD('-rotate-45', 'translate-x-2 -translate-y-1', 'from-[#7dd3fc] via-[#bae6fd] to-[#38bdf8]')}
      ${SWORD('rotate-45', '-translate-x-2 -translate-y-1', 'from-[#38bdf8] via-[#bae6fd] to-[#7dd3fc]')}
      <div class="glow-flare -top-1 right-10"></div>
      <div class="glow-flare top-8 left-9 !w-2 !h-2"></div>
    </div>
    <div class="text-center z-10">
      <h2 class="text-5xl font-black tracking-tight text-stroke-title text-white leading-none mb-1">דו-קרב</h2>
      <p class="text-white/95 font-black text-xl tracking-wide drop-shadow-md">ראש בראש בזמן אמת</p>
    </div>
  </footer>
</div>`, forfeit);

  const rowsEl = $('#rows');
  const form = $('#form');
  const input = $('#ans');
  const send = $('#send');
  const tbar = $('#tbar');

  function draw() {
    rowsEl.innerHTML = log.map(bubbleRow).join('');
    rowsEl.scrollTop = rowsEl.scrollHeight;
    $('#left').textContent = `נשארו ${n - found.filter(Boolean).length}`;
    const dots = (who) => '●'.repeat(2 - strikes[who]) + '<span class="opacity-30">' + '●'.repeat(strikes[who]) + '</span>';
    $('#lives').innerHTML = `<span class="text-red-500">${dots('me')}</span>`;
  }

  function paintTurn() {
    const mine = turn === 'me';
    $('#chip-text').textContent = mine ? 'התור שלך' : `התור של ${M.opp.name}`;
    $('#av-me').className = `rounded-full ${mine ? 'turn-active' : 'turn-idle'}`;
    $('#av-bot').className = `rounded-full ${mine ? 'turn-idle' : 'turn-active'}`;
    input.disabled = !mine;
    send.disabled = !mine;
    input.placeholder = mine ? 'הזן תשובה' : `התור של ${M.opp.name}...`;
    form.classList.toggle('opacity-60', !mine);
    if (mine) input.focus({ preventScroll: true });
  }

  function setTurn(t) {
    if (over) return;
    turn = t;
    turnTotal = TURN_SECONDS * 1000;
    turnLeft = turnTotal;
    paintTurn();
    if (t === 'bot') {
      const open = found.map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);
      const plan = planBotTurn(open, botSkill(M.opp));
      R.botTimers.push(setTimeout(() => {
        if (over) return;
        if (plan.index === null) miss('bot', '?'); else hit(plan.index, 'bot');
      }, plan.delay));
    }
  }
  const other = (w) => (w === 'me' ? 'bot' : 'me');

  function hit(i, who) {
    if (over || found[i]) return;
    found[i] = who;
    strikes[who] = 0;
    log.push({ who, hit: true, text: q.answers[i].names[0] });
    draw();
    if (found.every(Boolean)) return end(null);
    setTurn(other(who));
  }
  function miss(who, text) {
    if (over) return;
    strikes[who] += 1;
    log.push({ who, hit: false, text });
    draw();
    if (strikes[who] >= 2) return end(who);
    setTurn(other(who));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (turn !== 'me' || over) return;
    const text = input.value.trim();
    if (!text) return;
    const m = matchAnswer(text, q.answers);
    input.value = '';
    if (m && found[m.index]) {
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      return toast(found[m.index] === 'me' ? 'כבר מצאת את זה' : 'היריב כבר מצא את זה');
    }
    if (m) hit(m.index, 'me');
    else {
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      miss('me', text);
    }
  });
  ACTIONS.time = () => {
    if (over || turn !== 'me') return toast('רק בתור שלך');
    if (!spend(save, 'coins', COST.time)) return toast('אין מספיק מטבעות');
    turnTotal += 10000; turnLeft += 10000; persist(); renderBar();
  };
  ACTIONS.joker = () => {
    if (over || turn !== 'me') return toast('רק בתור שלך');
    const open = found.map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);
    if (!open.length) return;
    if (!spend(save, 'coins', COST.joker)) return toast('אין מספיק מטבעות');
    persist(); renderBar();
    hit(open[Math.floor(Math.random() * open.length)], 'me');
  };
  ACTIONS.emoji = () => toast(['😜', '😎', '🤔', '😂'][Math.floor(Math.random() * 4)]);

  R = { botTimers: [], iv: null };
  draw();
  paintTurn();
  setTurn(turn);
  let last = performance.now();
  R.iv = setInterval(() => {
    const now = performance.now();
    turnLeft -= now - last; last = now;
    const sec = Math.max(0, Math.ceil(turnLeft / 1000));
    $('#chip-sec').textContent = sec;
    tbar.style.width = `${Math.max(0, (turnLeft / turnTotal) * 100)}%`;
    const low = turnLeft < 3000;
    tbar.classList.toggle('bar-low', low);
    $('#chip').classList.toggle('chip-low', low);
    if (turnLeft <= 0 && turn === 'me') miss('me', '⏱');
    else if (turnLeft <= 0) turnLeft = 0;
  }, 100);

  /** loser: מי שהפסיד בגלל שתי החטאות, או null אם נגמרו התשובות */
  function end(loser) {
    if (over) return;
    over = true;
    stopRound();
    input.disabled = true; send.disabled = true;
    const me = found.filter((f) => f === 'me').length;
    const bot = found.filter((f) => f === 'bot').length;
    const winner = loser ? (loser === 'me' ? 1 : 0) : me > bot ? 0 : bot > me ? 1 : -1;
    if (winner >= 0) M.score[winner] += 1;
    const missed = q.answers.map((a, i) => (found[i] ? null : a.names[0])).filter(Boolean);
    const title = winner === 0 ? 'זכית בסיבוב!' : winner === 1 ? 'היריב זכה בסיבוב' : 'תיקו בסיבוב';
    const why = loser === 'me' ? 'שתי טעויות ברצף' : loser === 'bot' ? `${M.opp.name} טעה פעמיים` : `${me} מול ${bot}`;
    const banner = document.createElement('div');
    banner.className = 'banner';
    banner.innerHTML = `<div class="px-6"><h2 class="text-4xl font-black text-3d-white mb-2">${esc(title)}</h2><p class="text-xl text-purple-100 font-bold">${esc(why)}</p>${missed.length ? `<p class="mt-3 text-sm text-purple-200">לא נמצאו: ${esc(missed.slice(0, 4).join(', '))}${missed.length > 4 ? '…' : ''}</p>` : ''}</div>`;
    $('#app').append(banner);
    if (winner === 0) confetti(banner, 24);
    setTimeout(() => {
      banner.remove();
      const done = M.score.some((s) => s >= WINS_NEEDED) || M.round >= MAX_ROUNDS;
      if (!done) return nextRound();
      finishMatch(M.score[0] > M.score[1] ? 'win' : M.score[1] > M.score[0] ? 'lose' : 'draw');
    }, 2600);
  }
}

function finishMatch(outcome) {
  stopRound();
  M.finished = true;
  const r = rewards(outcome, save.trophies, M.opp.trophies);
  save.trophies = Math.max(0, save.trophies + r.trophies);
  save.coins += r.coins;
  if (outcome === 'win') save.wins += 1;
  persist();
  const title = outcome === 'win' ? '🏆 ניצחת!' : outcome === 'lose' ? 'הפסדת הפעם' : 'תיקו';
  ACTIONS.again = () => startMatch();
  show(`
<div class="flex-1 min-h-0 ${SCREEN_BG} flex flex-col">
  ${gameHeader()}
  <section class="px-4 flex-1 flex flex-col justify-center gap-5 text-center">
    <div class="flex items-center justify-center gap-6">
      ${avatar(ME, 'w-20 h-20', 'border-[3px] border-white shadow-xl')}
      <div class="text-5xl font-black text-3d-white" dir="ltr">${M.score[0]}-${M.score[1]}</div>
      ${avatar(M.opp, 'w-20 h-20', 'border-[3px] border-white shadow-xl')}
    </div>
    <h2 class="text-5xl font-black text-3d-banner">${title}</h2>
    <div class="flex justify-center gap-3">
      <div id="r-tp" class="stat-pill rounded-full px-5 py-2 text-xl font-bold pop"></div>
      <div id="r-co" class="stat-pill rounded-full px-5 py-2 text-xl font-bold pop" style="animation-delay:.15s"></div>
    </div>
    <button data-act="again" class="play-btn-glow w-full h-20 rounded-2xl text-3xl font-extrabold text-3d-white">שחק שוב</button>
    ${bigGloss('home', 'חזרה למסך הבית', '!text-xl')}
  </section>
</div>`, home);
  countUp($('#r-tp'), Math.abs(r.trophies), r.trophies < 0 ? '-' : '+', ' 🏆');
  countUp($('#r-co'), r.coins, '+', ' 🪙');
  if (outcome === 'win') confetti(screen, 40);
}

home();
