import { QUESTIONS } from './questions.js?v=6';
import { matchAnswer } from './checker.js?v=6';
import { makeOpponent, botSkill, planBotTurn, TURN_SECONDS } from './bot.js?v=6';
import {
  MAX_ENERGY, COST, COIN_PACK, FREE_COINS, FREE_COINS_MS, DAILY_GEMS,
  defaultSave, tickEnergy, energyCountdownMs, spendEnergy, spend, rewards, pickQuestion,
  TASK_WINS, TASK_GEMS, taskState, recordWin, claimTask,
} from './economy.js?v=6';
import { I, emblem } from './icons.js?v=6';
import { newRound, hit as ruleHit, miss as ruleMiss, LIVES } from './rules.js?v=6';

const KEY = 'rosh-brosh-save-v1';
const PRE_SECONDS = 6;
const WINS_NEEDED = 2;
const MAX_ROUNDS = 5;

const ME = { name: 'אופיר שאול' };
const FRIENDS = [
  { name: 'שימי ביטון', trophies: 68 },
  { name: 'יוני הררי', trophies: 677 },
  { name: 'שמרית', trophies: 989 },
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

/** לוגו עגול לשחקן (SVG), עם מסגרת מ-extra. */
const avatar = (p, size, extra = '') =>
  `<div class="${size} rounded-full overflow-hidden shrink-0 ${extra}">${emblem(p.name, 'w-full h-full block')}</div>`;

const PLUS = (pos) => `<span class="absolute ${pos} text-[9px] bg-green-500 rounded-sm w-3 h-3 flex items-center justify-center text-white font-extrabold leading-none">+</span>`;

/** סרגל עליון של מסך הבית (stat-pill) */
const homeHeader = () => `
<header class="w-full pt-3 px-3 pb-1 z-20">
  <div class="flex items-start justify-between gap-1 w-full">
    <button data-act="back" aria-label="חזור" class="w-10 h-10 rounded-xl bg-[#6d0b1e]/80 border border-[#e32e52] flex items-center justify-center text-white active:scale-95 shadow-md flex-shrink-0">
      <svg class="w-6 h-6 rotate-180 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path></svg>
    </button>
    <div class="flex items-center gap-1.5 flex-1 justify-end">
      <button data-act="energy" class="flex flex-col items-center">
        <div class="stat-pill px-2 py-0.5 rounded-lg flex items-center gap-1 min-w-[70px] justify-between h-7">
          <span data-v="energy" class="font-bold text-xs tracking-tight text-white pl-0.5"></span>
          <div class="relative flex items-center justify-center -mr-1">${I.bolt('w-4 h-4')}${PLUS('-top-1 -right-1')}</div>
        </div>
        <span data-v="timer" class="text-[9px] font-semibold text-[#ffd5de]/90 mt-0.5 tracking-wider h-3"></span>
      </button>
      <button data-act="gems" class="stat-pill px-2 py-0.5 rounded-lg flex items-center gap-1 min-w-[76px] justify-between h-7">
        <span data-v="gems" class="font-bold text-xs tracking-tight text-white"></span>
        <div class="relative flex items-center justify-center -mr-1">${I.gem('w-4 h-4')}${PLUS('-top-1 -right-1')}</div>
      </button>
      <button data-act="coins" class="stat-pill px-2 py-0.5 rounded-lg flex items-center gap-1 min-w-[68px] justify-between h-7">
        <span data-v="coins" class="font-bold text-xs tracking-tight text-white"></span>
        <div class="relative flex items-center justify-center -mr-1">${I.coin('w-4 h-4')}${PLUS('-top-1 -right-1')}</div>
      </button>
    </div>
  </div>
  <div class="flex items-center gap-2 mt-1 mr-1">
    ${avatar(ME, 'w-12 h-12', 'border-2 border-yellow-400 shadow-lg')}
    <div class="stat-pill px-2.5 py-0.5 rounded-lg flex items-center gap-1 h-6"><span class="text-xs font-bold text-white">${save.trophies}</span>${I.trophy('w-4 h-4')}</div>
  </div>
</header>`;

/** סרגל עליון של מסך הדו-קרב (פילים בלי מסגרת בהירה) */
const gamePill = (act, key, icon, heightCls = 'h-[32px]') => `
<button data-act="${act}" class="bg-[#720f1d] border border-white/25 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-inner ${heightCls}">
  <span data-v="${key}" class="font-extrabold text-sm tracking-wide text-white"></span>
  <div class="relative flex items-center justify-center"><span class="leading-none">${icon}</span><span class="absolute -bottom-1.5 -left-1 text-[9px] font-black bg-white text-[#871c2b] rounded-sm w-3 h-3 flex items-center justify-center leading-none">+</span></div>
</button>`;
const gameHeader = () => `
<header class="pt-3 px-3 pb-2 z-20 flex flex-col gap-1">
  <div class="flex items-center justify-between w-full">
    <button data-act="back" aria-label="חזרה" class="w-10 h-10 rounded-xl bg-[#720f1d]/70 active:scale-95 transition-transform flex items-center justify-center border border-white/20 shadow-md" type="button">
      <svg class="w-6 h-6 text-white stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    </button>
    <div class="flex items-center gap-2">
      <div class="flex flex-col items-center">
        <button data-act="energy" class="bg-[#720f1d] border border-white/25 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-inner">
          <span data-v="energy" class="font-extrabold text-sm tracking-wide text-white"></span>
          <div class="relative flex items-center justify-center">${I.bolt('w-4 h-4')}<span class="absolute -bottom-1 -left-1 text-[9px] font-black bg-white text-[#871c2b] rounded-sm w-3 h-3 flex items-center justify-center leading-none">+</span></div>
        </button>
        <span data-v="timer" class="text-[10px] text-white/90 font-medium tracking-tight mt-0.5 h-3"></span>
      </div>
      ${gamePill('gems', 'gems', I.gem('w-4 h-4'))}
      ${gamePill('coins', 'coins', I.coin('w-4 h-4'))}
    </div>
  </div>
</header>`;

const SCREEN_BG = 'bg-gradient-to-b from-[#af182c] via-[#a5162a] to-[#6c0e1e]';
const cost = (n) => `<div class="flex items-center bg-[#5e0f19] px-1.5 py-0.5 rounded-md text-xs font-bold text-yellow-300 gap-1 border border-yellow-500/30"><span>${n}</span>${I.coin('w-3.5 h-3.5')}</div>`;
const darkBtn = (act, cls, inner) => `<button data-act="${act}" type="button" class="${cls} bg-[#7c1723] hover:bg-[#901c2a] active:scale-95 transition-all text-white py-2 rounded-xl flex items-center justify-center gap-1.5 btn-3d-dark border border-white/20">${inner}</button>`;
const bigGloss = (act, label, extra = '') => `<button data-act="${act}" class="game-gloss-card w-full h-16 rounded-xl flex items-center justify-center cursor-pointer text-2xl font-black text-3d-white ${extra}">${label}</button>`;

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
  m.innerHTML = `<div class="game-gloss-card w-full rounded-2xl p-5 text-center flex flex-col gap-3">
    <h3 class="text-2xl font-black text-3d-white">${title}</h3>
    ${text ? `<p class="text-[#ffe8ed] font-medium leading-relaxed">${text}</p>` : ''}
    ${buttons.map((b, i) => `<button data-modal="${i}" class="${b.ghost ? 'bg-[#5e0f19] border border-white/20' : 'play-btn-glow'} rounded-xl py-3 text-xl font-extrabold">${b.label}</button>`).join('')}
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
function countUp(el, to, prefix = '', iconHtml = '') {
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 900);
    const v = Math.round(to * (1 - (1 - k) ** 3));
    el.innerHTML = `${prefix}${v} ${iconHtml}`;
    if (k < 1 && el.isConnected) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function confetti(parent, n = 30) {
  const colors = ['#ffd000', '#ffef5d', '#5be3ff', '#86efac', '#ffffff', '#fc849c'];
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
  openModal(`${I.bolt('w-6 h-6')} אנרגיה`, 'כל משחק עולה אנרגיה אחת. אנרגיה אחת חוזרת כל 10 דקות.', [
    { label: `מלא הכול ב-${COST.refill} ${I.gem('w-5 h-5')}`, run: () => {
      if (!spend(save, 'gems', COST.refill)) return toast('אין מספיק יהלומים');
      save.energy = MAX_ENERGY; persist(); renderBar(); toast('האנרגיה התמלאה');
    } },
    { label: 'אחכה', ghost: true },
  ]);
}
function gemsModal() {
  openModal(`${I.gem('w-6 h-6')} יהלומים`, 'בגרסה המלאה כאן קונים יהלומים בכסף אמיתי. באב-הטיפוס אפשר לקבל פרס יומי וחינם.', [
    { label: `פרס יומי: ${DAILY_GEMS} ${I.gem('w-5 h-5')}`, run: claimDaily },
    { label: 'סגור', ghost: true },
  ]);
}
function coinsModal() {
  openModal(`${I.coin('w-6 h-6')} מטבעות`, 'המטבעות משמשים ל"החלף שאלה", "זמן" ו"ג\'וקר".', [
    { label: `${COIN_PACK} ${I.coin('w-5 h-5')} ב-${COST.coinPack} ${I.gem('w-5 h-5')}`, run: () => {
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
  claim: () => { if (claimTask(save)) { persist(); renderBar(); toast(`קיבלת ${TASK_GEMS} יהלומים`); home(); } },
};
screen.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el) (ACTIONS[el.dataset.act] || (() => {}))(el);
});

// ---------- משימה יומית ----------
function taskCard() {
  const t = taskState(save);
  const pct = Math.round((t.wins / TASK_WINS) * 100);
  const action = t.claimed
    ? '<span class="text-sm font-extrabold text-green-300">נלקח</span>'
    : t.done
      ? `<button data-act="claim" class="bg-gradient-to-b from-[#ffd23f] to-[#f59e0b] text-[#6b0a14] font-black rounded-lg px-4 py-1.5 btn-3d-yellow task-ready">קבל</button>`
      : `<span class="stat-pill rounded-lg px-2.5 py-1 text-sm font-extrabold flex items-center gap-1">${TASK_GEMS} ${I.gem('w-4 h-4')}</span>`;
  return `<section>
    <div class="task-card rounded-xl px-3 py-2.5 flex items-center gap-3">
      <div class="shrink-0 text-yellow-300">${I.trophy('w-9 h-9')}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline justify-between"><b class="text-sm font-black">משימה יומית</b><span class="text-xs font-bold text-white/80">${t.wins}/${TASK_WINS}</span></div>
        <div class="text-xs text-white/80 mb-1.5">נצח ${TASK_WINS} משחקים היום</div>
        <div class="h-2 bg-black/30 rounded-full overflow-hidden p-0.5"><div class="h-full rounded-full bg-gradient-to-l from-[#ffd23f] to-[#f59e0b]" style="width:${pct}%"></div></div>
      </div>
      ${action}
    </div>
  </section>`;
}

// ---------- home ----------
function home() {
  stopRound();
  M = null;
  show(`
<div class="flex-1 min-h-0 bg-game-swirls flex flex-col justify-between overflow-y-auto">
  ${homeHeader()}
  <main class="menu-in px-4 flex flex-col justify-start gap-3.5 mt-2 z-10">
    <section class="grid grid-cols-2 gap-3">
      <button data-act="daily" class="game-gloss-card h-20 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-2 text-center cursor-pointer">
        <div class="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-[#fc849c]/10 pointer-events-none"></div>
        <div class="absolute -left-1 -bottom-2 opacity-30">${I.gift('w-12 h-12')}</div>
        <span class="text-xl font-black text-3d-white tracking-wide z-10">פרס יומי</span>
      </button>
      <button data-act="free" class="game-gloss-card h-20 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-2 text-center cursor-pointer">
        <div class="absolute inset-0 bg-gradient-to-tr from-yellow-500/15 to-[#fc849c]/10 pointer-events-none"></div>
        <div class="absolute -right-1 -top-1 opacity-30 text-yellow-200">${I.spark('w-9 h-9')}</div>
        <span class="text-lg font-black text-3d-white tracking-tight z-10 leading-tight">מטבעות חינם</span>
        <span class="text-xs font-bold text-yellow-300 z-10 mt-0.5 drop-shadow">זמין!</span>
      </button>
    </section>
    <section>
      <button data-act="seasons" class="w-full game-gloss-card h-24 rounded-xl relative overflow-hidden flex items-center justify-center cursor-pointer">
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <svg class="w-24 h-24 text-amber-300" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"></path></svg>
        </div>
        <div class="absolute left-6 top-3 w-3 h-1.5 bg-amber-400 rotate-45 rounded-sm opacity-60"></div>
        <div class="absolute right-8 bottom-3 w-2.5 h-1.5 bg-yellow-400 -rotate-12 rounded-sm opacity-60"></div>
        <h2 class="text-3xl font-black text-3d-white tracking-wide z-10">עונות</h2>
      </button>
    </section>
    <section>
      <button data-act="play" class="w-full play-btn-glow h-28 rounded-xl relative overflow-hidden flex items-center justify-center cursor-pointer transition-all active:scale-[0.98]">
        <div class="absolute inset-0 tiled-diamonds opacity-40"></div>
        <div class="absolute top-2.5 right-6 text-white opacity-75 animate-pulse">${I.spark('w-3 h-3')}</div>
        <div class="absolute bottom-3 left-10 text-white opacity-60 animate-pulse">${I.spark('w-3 h-3')}</div>
        <div class="absolute top-4 left-1/4 text-white opacity-75">${I.spark('w-2.5 h-2.5')}</div>
        <span class="text-4xl font-extrabold text-3d-white tracking-normal z-10">שחק כעת</span>
      </button>
    </section>
    ${taskCard()}
    <section class="mt-1">
      <div class="flex justify-start mb-2">
        <div class="bg-[#7d0c1f] border-r-4 border-l border-t border-b border-[#f53450] px-5 py-1 rounded-r-xl rounded-l-md shadow-md"><h3 class="text-sm font-bold text-[#ffe8ed]">החברים שלי</h3></div>
      </div>
      <div class="grid grid-cols-3 gap-2 px-1 text-center">
        ${FRIENDS.map((f, i) => `
        <button data-act="friend" data-i="${i}" class="flex flex-col items-center">
          ${avatar(f, 'w-16 h-16 sm:w-20 sm:h-20', 'border-2 border-white/90 shadow-xl !bg-[#871c2b]')}
          <span class="mt-1 text-xs font-bold text-white drop-shadow truncate w-full text-center">${esc(f.name)}</span>
        </button>`).join('')}
      </div>
    </section>
  </main>
  <footer class="mt-auto py-3 text-center text-[10px] text-white/60 z-10">v6 · <a href="./privacy.html" class="underline">מדיניות פרטיות</a></footer>
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
    { name: 'חגית דהן', trophies: 556 },
    { ...ME, trophies: save.trophies, me: true },
    { name: 'Shir Daum', trophies: 123 },
    { name: 'Shai Cohen', trophies: 58 },
  ].sort((a, b) => b.trophies - a.trophies);
  show(`
<div class="flex-1 min-h-0 ${SCREEN_BG} tiled-diamonds flex flex-col overflow-hidden">
  ${gameHeader()}
  <div class="px-3.5 flex justify-start">
    <div class="stat-pill px-3 py-0.5 rounded-lg flex items-center gap-1.5 h-7"><span class="text-sm font-bold">${save.trophies}</span>${I.trophy('w-4 h-4')}</div>
  </div>
  <div class="flex justify-center -mb-3 z-10 crown-in">${CROWN('w-28 h-20 drop-shadow-lg')}</div>
  <section class="mx-3.5 flex-1 min-h-0 bg-gradient-to-b from-[#d62248] to-[#a81638] rounded-2xl border border-white/20 shadow-xl px-3 pt-4 pb-3 flex flex-col">
    <h1 class="text-center text-4xl font-black text-3d-white mb-3">המובילים</h1>
    <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 lb-list">
      ${rows.map((r, i) => `
      <div class="lb-row rounded-xl px-3 py-2 flex items-center gap-3 ${r.me ? 'bg-white/15 border border-white/50' : 'bg-white/5'}" style="animation-delay:${i * 70}ms">
        <div class="w-9 h-9 rounded-lg ${r.me ? 'text-yellow-300 border-yellow-300/70' : 'border-white/30'} border flex items-center justify-center font-black text-lg">${i + 1}</div>
        ${avatar(r, 'w-12 h-12', `border-2 ${r.me ? 'border-yellow-400' : 'border-white/80'}`)}
        <b class="flex-1 font-extrabold text-lg ${r.me ? 'text-yellow-200' : ''}">${esc(r.name)}</b>
        <div class="stat-pill px-3 py-1 rounded-lg text-sm font-extrabold flex items-center gap-1.5"><span>${r.trophies}</span>${I.trophy('w-4 h-4')}</div>
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
  const opp = friend && friend.name ? { ...friend } : makeOpponent(save.trophies);
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
      <div class="flex flex-col items-center gap-1">${avatar(ME, 'w-20 h-20', 'border-[3px] border-white shadow-xl')}<span class="font-black">${esc(ME.name)}</span><span class="stat-pill rounded-lg px-3 text-sm font-bold">${save.trophies} ${I.trophy('w-4 h-4')}</span></div>
      <div class="text-5xl font-black text-3d-white bump" dir="ltr">${M.score[0]}-${M.score[1]}</div>
      <div class="flex flex-col items-center gap-1">${avatar(M.opp, 'w-20 h-20', 'border-[3px] border-white shadow-xl')}<span class="font-black">${esc(M.opp.name)}</span><span class="stat-pill rounded-lg px-3 text-sm font-bold">${M.opp.trophies} ${I.trophy('w-4 h-4')}</span></div>
    </div>
    <div id="count" class="count-tick self-center w-20 h-20 rounded-full border-4 border-white/25 border-t-white flex items-center justify-center text-4xl font-black">${left}</div>
    <div class="bg-[#bf2d35] p-5 rounded-2xl border-2 border-white/25 shadow-xl text-center">
      <h1 class="font-extrabold text-white text-[23px] leading-tight text-emboss">${esc(q.text)}</h1>
      <p class="text-[#ffe8ed] text-sm mt-2 font-medium">סיבוב ${M.round} · ${q.answers.length} תשובות לחפש</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      ${darkBtn('swap', 'py-3', `<span class="font-extrabold text-sm">החלף שאלה</span>${cost(COST.swap)}`)}
      ${darkBtn('confirm', 'py-3', `<span class="font-extrabold text-sm">${I.check('w-4 h-4')} אשר שאלה</span>`)}
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

const CHECK = (ok, spark = '') => `<div class="relative w-6 h-6 rounded-md ${ok ? 'bg-[#70d63b]' : 'bg-[#ef4444]'} flex items-center justify-center text-white shadow-sm shrink-0">${ok ? I.check('w-3.5 h-3.5') : I.cross('w-3.5 h-3.5')}${spark}</div>`;
const SPARKS = '<span class="spark" style="--dx:-14px;--dy:-16px"></span><span class="spark" style="--dx:14px;--dy:-14px"></span><span class="spark" style="--dx:-16px;--dy:12px"></span><span class="spark" style="--dx:16px;--dy:14px"></span>';

/** שורה בלוח: who = me | bot, hit = נכון/טעות. "me" בצד שמאל, "bot" בצד ימין. */
const bubbleRow = (e) => {
  const check = CHECK(e.hit, e.hit && e.who === 'me' ? SPARKS : '');
  const bubble = e.hit
    ? (e.who === 'me'
      ? 'bg-[#dcfce7] text-[#1b7a2d] border-green-200'
      : 'bg-white text-[#450811] border-[#ffe8ed]')
    : 'bg-[#fee2e2] text-[#b91c1c] border-red-200 miss-flash';
  const b = `<div class="${bubble} font-extrabold text-[15px] px-4 py-1 rounded-lg badge-3d border max-w-[70%] truncate">${esc(e.text)}</div>`;
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

const HEART = (alive, breaking) => I.heart(`w-5 h-5 ${alive ? 'text-red-500' : 'text-white/25'} ${breaking ? 'heart-break' : ''}`);
const hearts = (lives, breaking) => Array.from({ length: LIVES }, (_, i) => HEART(i < lives, breaking && i === lives)).join('');
const REACTIONS = ['יפה!', 'חכם', 'נו, תחשוב', 'אחלה', 'בואו נראה'];

function play() {
  const q = QUESTIONS[M.qi];
  const n = q.answers.length;
  const S = newRound(n, M.round % 2 === 1 ? 'me' : 'bot');
  const log = []; // { who, hit, text }
  const shown = { me: LIVES, bot: LIVES };
  let turnTotal = TURN_SECONDS * 1000;
  let turnLeft = turnTotal;
  let over = false;

  show(`
<div class="flex-1 min-h-0 ${SCREEN_BG} flex flex-col justify-between overflow-hidden">
  ${gameHeader()}
  <section class="px-3.5 z-10 flex flex-col gap-3 min-h-0">
    <div class="flex items-start justify-between px-1">
      <div class="flex flex-col items-center gap-1"><div id="av-me" class="rounded-full">${avatar(ME, 'w-11 h-11', 'border-2 border-white shadow-lg')}</div><div id="lives-me" class="flex gap-0.5"></div></div>
      <div class="flex flex-col items-center">
        <div id="chip" class="stat-pill rounded-lg px-4 py-1 text-sm font-extrabold flex items-center gap-2"><span id="chip-text"></span><span id="chip-sec" class="text-yellow-300 tabular-nums"></span></div>
        <div class="w-40 bg-[#640714]/40 h-1.5 rounded-full overflow-hidden mt-1.5"><div id="tbar" class="h-full rounded-full w-full" style="background:linear-gradient(to left,#d4a853,#eab308)"></div></div>
      </div>
      <div class="flex flex-col items-center gap-1"><div id="av-bot" class="rounded-full">${avatar(M.opp, 'w-11 h-11', 'border-2 border-white shadow-lg')}</div><div id="lives-bot" class="flex gap-0.5"></div></div>
    </div>
    <div class="bg-[#bf2d35] p-3 pb-3.5 rounded-2xl border-2 border-white/25 shadow-xl flex flex-col gap-2.5 min-h-0">
      <h1 class="text-center font-extrabold text-white text-[21px] leading-tight px-2 text-emboss tracking-normal">${esc(q.text)}</h1>
      <div class="doodle-bg rounded-xl p-3 border border-[#feb4c4]/40 relative shadow-inner min-h-[175px] flex flex-col justify-between overflow-hidden">
        <div id="rows" class="flex flex-col gap-2.5 w-full max-h-[30dvh] overflow-y-auto"></div>
        <div class="mt-2 pt-1 border-t border-[#ffd5de]/50 flex items-center justify-between text-xs font-bold text-[#871c2b] px-1">
          <span class="text-[#a82135] text-[13px] font-black">${esc(ME.name)}</span>
          <span id="left" class="text-[11px] font-bold text-[#ce223e]/70"></span>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-5 gap-2 px-1">
      ${darkBtn('joker', 'col-span-2', `<span class="font-extrabold text-sm">ג'וקר</span>${cost(COST.joker)}`)}
      ${darkBtn('time', 'col-span-2', `<span class="font-extrabold text-sm">זמן</span>${cost(COST.time)}`)}
      ${darkBtn('emoji', 'col-span-1', I.smile('w-6 h-6'))}
    </div>
    <form id="form" class="flex items-stretch bg-white rounded-xl p-1 shadow-2xl border border-white/50 h-[52px]" autocomplete="off">
      <button id="send" class="bg-gradient-to-b from-[#ffbe2e] to-[#f59e0b] text-white font-black text-lg px-6 rounded-lg btn-3d-yellow transition-transform active:scale-95 flex items-center justify-center disabled:opacity-50" type="submit">שלח</button>
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
    $('#left').textContent = `נשארו ${n - S.count}`;
    for (const who of ['me', 'bot']) {
      $(`#lives-${who}`).innerHTML = hearts(S.lives[who], shown[who] !== S.lives[who]);
      shown[who] = S.lives[who];
    }
  }

  function paintTurn() {
    const mine = S.turn === 'me';
    $('#chip-text').textContent = mine ? 'התור שלך' : `${M.opp.name} עונה...`;
    $('#chip-sec').style.visibility = mine ? 'visible' : 'hidden';
    $('#av-me').className = `rounded-full ${mine ? 'turn-active' : 'turn-idle'}`;
    $('#av-bot').className = `rounded-full ${mine ? 'turn-idle' : 'turn-active'}`;
    input.disabled = !mine;
    send.disabled = !mine;
    input.placeholder = mine ? 'הזן תשובה' : `התור של ${M.opp.name}...`;
    form.classList.toggle('opacity-60', !mine);
    if (mine) input.focus({ preventScroll: true });
    else input.blur();
  }

  function nextTurn() {
    turnTotal = TURN_SECONDS * 1000;
    turnLeft = turnTotal;
    paintTurn();
    if (S.turn === 'bot') {
      const open = S.found.map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);
      const plan = planBotTurn(open, botSkill(M.opp));
      R.botTimers.push(setTimeout(() => {
        if (over) return;
        if (plan.index === null) miss('bot', '?'); else hit(plan.index, 'bot');
      }, plan.delay));
    }
  }

  function hit(i, who) {
    if (over || S.turn !== who || S.found[i]) return;
    ruleHit(S, who, i);
    log.push({ who, hit: true, text: q.answers[i].names[0] });
    draw();
    if (S.over) return end();
    nextTurn();
  }
  function miss(who, text) {
    if (over || S.turn !== who) return;
    ruleMiss(S, who);
    log.push({ who, hit: false, text });
    draw();
    if (S.over) return end();
    nextTurn();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (S.turn !== 'me' || over) return;
    const text = input.value.trim();
    if (!text) return;
    const m = matchAnswer(text, q.answers);
    input.value = '';
    if (m && S.found[m.index]) {
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      return toast(S.found[m.index] === 'me' ? 'כבר מצאת את זה' : 'היריב כבר מצא את זה');
    }
    if (m) hit(m.index, 'me');
    else {
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      miss('me', text);
    }
  });
  ACTIONS.time = () => {
    if (over || S.turn !== 'me') return toast('רק בתור שלך');
    if (!spend(save, 'coins', COST.time)) return toast('אין מספיק מטבעות');
    turnTotal += 10000; turnLeft += 10000; persist(); renderBar();
  };
  ACTIONS.joker = () => {
    if (over || S.turn !== 'me') return toast('רק בתור שלך');
    const open = S.found.map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);
    if (!open.length) return;
    if (!spend(save, 'coins', COST.joker)) return toast('אין מספיק מטבעות');
    persist(); renderBar();
    hit(open[Math.floor(Math.random() * open.length)], 'me');
  };
  ACTIONS.emoji = () => toast(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);

  R = { botTimers: [], iv: null };
  draw();
  nextTurn();
  let last = performance.now();
  R.iv = setInterval(() => {
    const now = performance.now();
    turnLeft -= now - last; last = now;
    $('#chip-sec').textContent = Math.max(0, Math.ceil(turnLeft / 1000));
    tbar.style.width = `${Math.max(0, (turnLeft / turnTotal) * 100)}%`;
    const low = turnLeft < 3000;
    tbar.classList.toggle('bar-low', low);
    $('#chip').classList.toggle('chip-low', low);
    if (turnLeft <= 0 && S.turn === 'me') miss('me', 'נגמר הזמן');
    else if (turnLeft <= 0) turnLeft = 0;
  }, 100);

  /** הסיבוב נגמר: מי שנשאר בלי חיים מפסיד, או שמי שנתן את התשובה האחרונה מנצח. */
  function end() {
    if (over) return;
    over = true;
    stopRound();
    input.disabled = true; send.disabled = true;
    const { winner: w, reason } = S.over;
    const winner = w === 'me' ? 0 : 1;
    M.score[winner] += 1;
    const title = winner === 0 ? 'זכית בסיבוב!' : 'היריב זכה בסיבוב';
    const why = reason === 'last'
      ? (w === 'me' ? 'נתת את התשובה האחרונה' : `${M.opp.name} נתן את התשובה האחרונה`)
      : (w === 'me' ? `${M.opp.name} נשאר בלי חיים` : 'נגמרו לך החיים');
    const missed = q.answers.map((a, i) => (S.found[i] ? null : a.names[0])).filter(Boolean);
    const banner = document.createElement('div');
    banner.className = 'banner';
    banner.innerHTML = `<div class="px-6"><h2 class="text-4xl font-black text-3d-white mb-2">${esc(title)}</h2><p class="text-xl text-[#ffe8ed] font-bold">${esc(why)}</p>${missed.length ? `<p class="mt-3 text-sm text-[#ffd5de]">לא נמצאו: ${esc(missed.slice(0, 4).join(', '))}${missed.length > 4 ? '…' : ''}</p>` : ''}</div>`;
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
  if (outcome === 'win') { save.wins += 1; recordWin(save); }
  persist();
  const title = outcome === 'win' ? 'ניצחת!' : outcome === 'lose' ? 'הפסדת הפעם' : 'תיקו';
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
      <div id="r-tp" class="stat-pill rounded-lg px-5 py-2 text-xl font-bold pop"></div>
      <div id="r-co" class="stat-pill rounded-lg px-5 py-2 text-xl font-bold pop" style="animation-delay:.15s"></div>
    </div>
    <button data-act="again" class="play-btn-glow w-full h-20 rounded-xl text-3xl font-extrabold text-3d-white">שחק שוב</button>
    ${bigGloss('home', 'חזרה למסך הבית', '!text-xl')}
  </section>
</div>`, home);
  countUp($('#r-tp'), Math.abs(r.trophies), r.trophies < 0 ? '-' : '+', I.trophy('w-5 h-5'));
  countUp($('#r-co'), r.coins, '+', I.coin('w-5 h-5'));
  if (outcome === 'win') confetti(screen, 40);
}

// ---------- הודעת שמירה בדפדפן ----------
function consentBar() {
  try { if (localStorage.getItem('rosh-brosh-consent')) return; } catch { /* show anyway */ }
  const bar = document.createElement('div');
  bar.className = 'absolute inset-x-3 bottom-3 z-[45] bg-[#500817] border border-[#fc849c]/50 rounded-xl p-3 flex items-center gap-3 text-sm shadow-2xl';
  bar.innerHTML = '<p class="flex-1 leading-snug">המשחק שומר את ההתקדמות שלך בדפדפן. <a href="./privacy.html" class="underline">מדיניות פרטיות</a></p><button class="bg-[#ffbe2e] text-[#3b2200] font-extrabold rounded-lg px-4 py-2">הבנתי</button>';
  bar.querySelector('button').onclick = () => {
    try { localStorage.setItem('rosh-brosh-consent', '1'); } catch { /* ignore */ }
    bar.remove();
  };
  $('#app').append(bar);
}

home();
consentBar();
