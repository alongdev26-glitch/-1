import { QUESTIONS } from './questions.js?v=7';
import { matchAnswer } from './checker.js?v=7';
import { makeOpponent, botSkill, planBotTurn, TURN_SECONDS } from './bot.js?v=7';
import {
  MAX_ENERGY, COST, COIN_PACK, FREE_COINS, FREE_COINS_MS, DAILY_GEMS,
  defaultSave, tickEnergy, energyCountdownMs, spendEnergy, spend, rewards, pickQuestion,
  TASK_WINS, TASK_GEMS, taskState, recordWin, claimTask,
} from './economy.js?v=7';
import { I, emblem } from './icons.js?v=7';
import { findMatch } from './net.js?v=7';
import { toGuest, acceptAnswer, cleanName } from './protocol.js?v=7';
import { newRound, hit as ruleHit, miss as ruleMiss, LIVES } from './rules.js?v=7';

const KEY = 'rosh-brosh-save-v1';
const PRE_SECONDS = 6;
const WINS_NEEDED = 2;
const MAX_ROUNDS = 5;

const ME = { get name() { return save.name || 'אופיר שאול'; } };
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
    <button data-act="rename" aria-label="שנה שם" class="rounded-full">${avatar(ME, 'w-12 h-12', 'border-2 border-yellow-400 shadow-lg')}</button>
    <span class="text-sm font-bold text-white/90">${esc(ME.name)}</span>
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
  daily: claimDaily, free: claimFreeCoins, seasons: () => leaderboard(), play: () => startOnline(), local2: () => startLocal2(), bot: () => startMatch(), rename: () => renameModal(),
  friend: (el) => startMatch(FRIENDS[Number(el.dataset.i)]),
  home: () => home(),
  claim: () => { if (claimTask(save)) { persist(); renderBar(); toast(`קיבלת ${TASK_GEMS} יהלומים`); home(); } },
};
screen.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el) (ACTIONS[el.dataset.act] || (() => {}))(el);
});

// ---------- שם שחקן ----------
function renameModal() {
  const m = $('#modal');
  m.innerHTML = `<form id="rename" class="game-gloss-card w-full rounded-2xl p-5 text-center flex flex-col gap-3">
    <h3 class="text-2xl font-black text-3d-white">איך קוראים לך?</h3>
    <input id="rename-input" class="rounded-xl px-4 py-3 text-lg font-bold text-gray-800 text-right outline-none" dir="rtl" maxlength="14" value="${esc(ME.name)}" autocomplete="off" />
    <button class="play-btn-glow rounded-xl py-3 text-xl font-extrabold" type="submit">שמור</button>
  </form>`;
  m.hidden = false;
  m.onclick = (e) => { if (e.target === m) closeModal(); };
  $('#rename-input').focus();
  $('#rename').addEventListener('submit', (e) => {
    e.preventDefault();
    save.name = cleanName($('#rename-input').value, 'אופיר שאול');
    persist(); closeModal(); home();
  });
}

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
    <section class="grid grid-cols-2 gap-3">
      <button data-act="local2" class="game-gloss-card h-14 rounded-xl text-base font-black text-3d-white cursor-pointer">שניים על מכשיר אחד</button>
      <button data-act="bot" class="game-gloss-card h-14 rounded-xl text-base font-black text-3d-white cursor-pointer">מול הבוט</button>
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
  <footer class="mt-auto py-3 text-center text-[10px] text-white/60 z-10">v7 · <a href="./privacy.html" class="underline">מדיניות פרטיות</a></footer>
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
// M.mode: 'bot' (מול בוט) | 'local2' (שניים על מכשיר אחד) | 'host' / 'guest' (אונליין)
let M = null; // { mode, opp, conn, score:[me,opp], round, qi, usedQ, finished, onRemote, mirror }
let R = null; // current round runtime
const other = (w) => (w === 'me' ? 'bot' : 'me');
const SEARCH_SECONDS = Number(new URLSearchParams(location.search).get('search')) || 20;

function beginMatch(opp, mode, conn = null) {
  M = { mode, opp, conn, score: [0, 0], round: 0, usedQ: [], finished: false, onRemote: null, mirror: null };
  if (conn) {
    conn.onClose(() => { if (M && M.conn === conn && !M.finished) opponentLeft(); });
    conn.onMessage((raw) => onNet(raw));
  }
  if (mode === 'guest') return show(waitScreen('מחכה ליריב...'), forfeit);
  nextRound();
}

function startMatch(friend) {
  const opp = friend && friend.name ? { ...friend } : makeOpponent(save.trophies);
  if (!spendEnergy(save)) { renderBar(); return buyEnergy(); }
  save.played += 1; persist(); renderBar();
  beginMatch(opp, 'bot');
}

function startLocal2() {
  beginMatch({ name: 'שחקן 2', trophies: 0 }, 'local2');
}

const waitScreen = (text) => `
<div class="flex-1 min-h-0 ${SCREEN_BG} flex flex-col">
  ${gameHeader()}
  <section class="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
    <div class="spinner"></div>
    <p class="text-2xl font-black text-3d-white">${esc(text)}</p>
  </section>
</div>`;

// ---------- אונליין ----------
function startOnline() {
  tickEnergy(save);
  if (save.energy < 1) return buyEnergy();
  const search = findMatch({ timeoutMs: SEARCH_SECONDS * 1000 });
  let secs = 0;
  let tick = 0;
  const stop = () => { clearInterval(tick); };
  show(`
<div id="searching" class="flex-1 min-h-0 ${SCREEN_BG} flex flex-col">
  ${gameHeader()}
  <section class="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
    <div class="spinner"></div>
    <p class="text-2xl font-black text-3d-white">מחפש יריב...</p>
    <p class="text-white/80"><span id="search-sec">0</span> שניות</p>
    <button data-act="cancel-search" class="game-gloss-card rounded-xl px-8 py-3 text-lg font-black">ביטול</button>
  </section>
</div>`, () => { stop(); search.cancel(); home(); });
  ACTIONS['cancel-search'] = () => { stop(); search.cancel(); home(); };
  tick = setInterval(() => { secs += 1; const el = $('#search-sec'); if (el) el.textContent = secs; }, 1000);
  search.promise.then((res) => {
    stop();
    if (!$('#searching')) { res?.conn.close(); return; } // בוטל
    if (!res) { toast('לא נמצא יריב פנוי, משחקים מול בוט'); return startMatch(); }
    connected(res);
  });
}

/** לחיצת יד: כל צד שולח שם וגביעים, ואז המשחק מתחיל. */
function connected({ role, conn }) {
  const hello = { t: 'hello', name: cleanName(save.name || ME.name), trophies: save.trophies };
  let started = false;
  const timeout = setTimeout(() => { if (!started) { conn.close(); toast('החיבור נכשל, משחקים מול בוט'); startMatch(); } }, 6000);
  conn.onMessage((m) => {
    if (started || !m || m.t !== 'hello') return;
    started = true;
    clearTimeout(timeout);
    if (!spendEnergy(save)) { conn.close(); return buyEnergy(); }
    save.played += 1; persist(); renderBar();
    const opp = { name: cleanName(m.name), trophies: Number(m.trophies) || 0 };
    beginMatch(opp, role, conn);
  });
  conn.send(hello);
}

function onNet(raw) {
  if (!M || !raw || typeof raw !== 'object') return;
  if (raw.t === 'leave') return opponentLeft();
  if (M.mode === 'host') return M.onRemote?.(raw);
  if (M.mode === 'guest') return guestHandle(toGuest(raw));
}

function opponentLeft() {
  if (!M || M.finished) return;
  stopRound();
  toast('היריב עזב את המשחק');
  finishMatch('win');
}

function chooseQuestion() {
  M.qi = pickQuestion(QUESTIONS.length, save.seen, M.usedQ);
  M.usedQ.push(M.qi);
  persist();
}

function forfeit() {
  if (!M || M.finished) return home();
  if (M.mode === 'local2') return openModal('לצאת מהמשחק?', '', [
    { label: 'כן, לצאת', run: () => { stopRound(); M.finished = true; home(); } },
    { label: 'להישאר', ghost: true },
  ]);
  openModal('לעזוב באמצע?', 'עזיבה נחשבת הפסד, והאנרגיה לא חוזרת.', [
    { label: 'כן, לעזוב', run: () => { M.conn?.send({ t: 'leave' }); finishMatch('lose'); } },
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

const trophyPill = (n) => (M.mode === 'local2' ? '' : `<span class="stat-pill rounded-lg px-3 text-sm font-bold">${n} ${I.trophy('w-4 h-4')}</span>`);

function introHtml(q, actionsHtml) {
  return `
<div class="flex-1 min-h-0 ${SCREEN_BG} flex flex-col">
  ${gameHeader()}
  <section class="px-3.5 flex flex-col gap-4">
    <div class="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2 mt-2">
      <div class="flex flex-col items-center gap-1">${avatar(ME, 'w-20 h-20', 'border-[3px] border-white shadow-xl')}<span class="font-black">${esc(ME.name)}</span>${trophyPill(save.trophies)}</div>
      <div class="text-5xl font-black text-3d-white bump" dir="ltr">${M.score[0]}-${M.score[1]}</div>
      <div class="flex flex-col items-center gap-1">${avatar(M.opp, 'w-20 h-20', 'border-[3px] border-white shadow-xl')}<span class="font-black">${esc(M.opp.name)}</span>${trophyPill(M.opp.trophies)}</div>
    </div>
    <div id="count" class="count-tick self-center w-20 h-20 rounded-full border-4 border-white/25 border-t-white flex items-center justify-center text-4xl font-black">${PRE_SECONDS}</div>
    <div class="bg-[#8b2dbf] p-5 rounded-2xl border-2 border-white/25 shadow-xl text-center">
      <h1 class="font-extrabold text-white text-[23px] leading-tight text-emboss">${esc(q.text)}</h1>
      <p class="text-purple-100 text-sm mt-2 font-medium">סיבוב ${M.round} · ${q.answers.length} תשובות לחפש</p>
    </div>
    ${actionsHtml}
  </section>
</div>`;
}

function intro() {
  let left = PRE_SECONDS;
  const q = QUESTIONS[M.qi];
  const online = M.mode === 'host';
  const actions = online
    ? '<p class="text-center text-sm text-white/80">הסיבוב מתחיל בעוד רגע</p>'
    : `<div class="grid grid-cols-2 gap-3">
      ${darkBtn('swap', 'py-3', `<span class="font-extrabold text-sm">החלף שאלה</span>${cost(COST.swap)}`)}
      ${darkBtn('confirm', 'py-3', `<span class="font-extrabold text-sm">${I.check('w-4 h-4')} אשר שאלה</span>`)}
    </div>`;
  show(introHtml(q, actions), forfeit);
  if (online) M.conn.send({ t: 'intro', round: M.round, qi: M.qi, score: [...M.score], ms: PRE_SECONDS * 1000 });
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

const names = () => ({ me: ME.name, bot: M.opp.name });
const turnLabel = (turn) => (M.mode === 'local2' ? `התור של ${names()[turn]}` : turn === 'me' ? 'התור שלך' : `${M.opp.name} עונה...`);
const inputOn = (turn) => M.mode === 'local2' || turn === 'me';

/** בונה את מסך המשחק ומחזיר את האלמנטים שלו. */
function mountPlay(q) {
  show(`
<div class="flex-1 min-h-0 ${SCREEN_BG} flex flex-col justify-between overflow-hidden">
  ${gameHeader()}
  <section class="px-3.5 z-10 flex flex-col gap-3 min-h-0">
    <div class="flex items-start justify-between px-1">
      <div class="flex flex-col items-center gap-1"><div id="av-me" class="rounded-full">${avatar(ME, 'w-11 h-11', 'border-2 border-white shadow-lg')}</div><div id="lives-me" class="flex gap-0.5"></div></div>
      <div class="flex flex-col items-center">
        <div id="chip" class="stat-pill rounded-lg px-4 py-1 text-sm font-extrabold flex items-center gap-2"><span id="chip-text"></span><span id="chip-sec" class="text-yellow-300 tabular-nums"></span></div>
        <div class="w-40 bg-purple-950/40 h-1.5 rounded-full overflow-hidden mt-1.5"><div id="tbar" class="h-full rounded-full w-full" style="background:linear-gradient(to left,#d4a853,#eab308)"></div></div>
      </div>
      <div class="flex flex-col items-center gap-1"><div id="av-bot" class="rounded-full">${avatar(M.opp, 'w-11 h-11', 'border-2 border-white shadow-lg')}</div><div id="lives-bot" class="flex gap-0.5"></div></div>
    </div>
    <div class="bg-[#8b2dbf] p-3 pb-3.5 rounded-2xl border-2 border-white/25 shadow-xl flex flex-col gap-2.5 min-h-0">
      <h1 class="text-center font-extrabold text-white text-[21px] leading-tight px-2 text-emboss tracking-normal">${esc(q.text)}</h1>
      <div class="doodle-bg rounded-xl p-3 border border-purple-300/40 relative shadow-inner min-h-[175px] flex flex-col justify-between overflow-hidden">
        <div id="rows" class="flex flex-col gap-2.5 w-full max-h-[30dvh] overflow-y-auto"></div>
        <div class="mt-2 pt-1 border-t border-purple-200/50 flex items-center justify-between text-xs font-bold text-purple-900 px-1">
          <span class="text-purple-800 text-[13px] font-black">${esc(ME.name)}</span>
          <span id="left" class="text-[11px] font-bold text-purple-700/70"></span>
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
  return { rows: $('#rows'), form: $('#form'), input: $('#ans'), send: $('#send'), tbar: $('#tbar'), chip: $('#chip'), shown: { me: LIVES, bot: LIVES } };
}

function drawPlay(v, st, n) {
  v.rows.innerHTML = st.log.map(bubbleRow).join('');
  v.rows.scrollTop = v.rows.scrollHeight;
  $('#left').textContent = `נשארו ${n - st.count}`;
  for (const who of ['me', 'bot']) {
    $(`#lives-${who}`).innerHTML = hearts(st.lives[who], v.shown[who] !== st.lives[who]);
    v.shown[who] = st.lives[who];
  }
}

function paintPlayTurn(v, turn) {
  const on = inputOn(turn);
  $('#chip-text').textContent = turnLabel(turn);
  $('#chip-sec').style.visibility = turn === 'me' || M.mode !== 'bot' ? 'visible' : 'hidden';
  $('#av-me').className = `rounded-full ${turn === 'me' ? 'turn-active' : 'turn-idle'}`;
  $('#av-bot').className = `rounded-full ${turn === 'bot' ? 'turn-active' : 'turn-idle'}`;
  v.input.disabled = !on;
  v.send.disabled = !on;
  v.input.placeholder = on ? 'הזן תשובה' : `התור של ${M.opp.name}...`;
  v.form.classList.toggle('opacity-60', !on);
  if (on) v.input.focus({ preventScroll: true });
  else v.input.blur();
}

function tickPlay(v, left, total) {
  $('#chip-sec').textContent = Math.max(0, Math.ceil(left / 1000));
  v.tbar.style.width = `${Math.max(0, (left / total) * 100)}%`;
  const low = left < 3000;
  v.tbar.classList.toggle('bar-low', low);
  v.chip.classList.toggle('chip-low', low);
}

const shake = (form) => { form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); };

/** באנר סוף סיבוב. w = מי ניצח מנקודת המבט של המכשיר הזה. */
function showBanner(w, reason, missed) {
  const nm = names();
  const you = M.mode !== 'local2';
  const title = !you ? `${nm[w]} זכה בסיבוב` : w === 'me' ? 'זכית בסיבוב!' : 'היריב זכה בסיבוב';
  const loser = other(w);
  const why = reason === 'last'
    ? (you && w === 'me' ? 'נתת את התשובה האחרונה' : `${nm[w]} נתן את התשובה האחרונה`)
    : (you && loser === 'me' ? 'נגמרו לך החיים' : `${nm[loser]} נשאר בלי חיים`);
  const banner = document.createElement('div');
  banner.className = 'banner';
  banner.innerHTML = `<div class="px-6"><h2 class="text-4xl font-black text-3d-white mb-2">${esc(title)}</h2><p class="text-xl text-purple-100 font-bold">${esc(why)}</p>${missed.length ? `<p class="mt-3 text-sm text-purple-200">לא נמצאו: ${esc(missed.slice(0, 4).join(', '))}${missed.length > 4 ? '…' : ''}</p>` : ''}</div>`;
  $('#app').append(banner);
  if (w === 'me' && you) confetti(banner, 24);
  return banner;
}

/** סיבוב אצל מי שמחליט: בוט, שניים על מכשיר אחד, או מארח אונליין. */
function play() {
  const q = QUESTIONS[M.qi];
  const n = q.answers.length;
  const S = newRound(n, M.round % 2 === 1 ? 'me' : 'bot');
  const st = { log: [], lives: S.lives, count: 0 };
  let turnTotal = TURN_SECONDS * 1000;
  let turnLeft = turnTotal;
  let over = false;
  const host = M.mode === 'host';
  const send = (m) => { if (host) M.conn.send(m); };
  const v = mountPlay(q);

  const draw = () => { st.count = S.count; drawPlay(v, st, n); };
  const openIdx = () => S.found.map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);

  function nextTurn() {
    turnTotal = TURN_SECONDS * 1000;
    turnLeft = turnTotal;
    paintPlayTurn(v, S.turn);
    if (S.turn === 'bot' && M.mode === 'bot') {
      const plan = planBotTurn(openIdx(), botSkill(M.opp));
      R.botTimers.push(setTimeout(() => {
        if (over) return;
        if (plan.index === null) miss('bot', '?'); else hit(plan.index, 'bot');
      }, plan.delay));
    }
  }
  const broadcast = (who, ok, text) => send({ t: 'ev', who, hit: ok, text, lives: { ...S.lives }, turn: S.turn, count: S.count, ms: over ? 0 : turnTotal });

  function hit(i, who) {
    if (over || S.turn !== who || S.found[i]) return;
    ruleHit(S, who, i);
    const text = q.answers[i].names[0];
    st.log.push({ who, hit: true, text });
    draw();
    if (S.over) { broadcast(who, true, text); return end(); }
    nextTurn();
    broadcast(who, true, text);
  }
  function miss(who, text) {
    if (over || S.turn !== who) return;
    ruleMiss(S, who);
    st.log.push({ who, hit: false, text });
    draw();
    if (S.over) { broadcast(who, false, text); return end(); }
    nextTurn();
    broadcast(who, false, text);
  }

  /** תשובה מוקלדת של who. מחזיר 'hit' | 'miss' | 'dup' */
  function submit(who, text) {
    const m = matchAnswer(text, q.answers);
    if (m && S.found[m.index]) return 'dup';
    if (m) { hit(m.index, who); return 'hit'; }
    miss(who, text);
    return 'miss';
  }

  v.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const who = S.turn;
    if (over || !inputOn(who)) return;
    const text = v.input.value.trim();
    if (!text) return;
    v.input.value = '';
    const r = submit(who, text);
    if (r === 'dup') toast('כבר נמצא');
    if (r !== 'hit') shake(v.form);
  });

  ACTIONS.time = () => {
    if (M.mode === 'local2') return toast('לא זמין במשחק של שניים');
    if (over || S.turn !== 'me') return toast('רק בתור שלך');
    if (!spend(save, 'coins', COST.time)) return toast('אין מספיק מטבעות');
    turnTotal += 10000; turnLeft += 10000; persist(); renderBar();
    send({ t: 'turn', turn: S.turn, ms: turnLeft });
  };
  ACTIONS.joker = () => {
    if (M.mode === 'local2') return toast('לא זמין במשחק של שניים');
    if (over || S.turn !== 'me') return toast('רק בתור שלך');
    const open = openIdx();
    if (!open.length) return;
    if (!spend(save, 'coins', COST.joker)) return toast('אין מספיק מטבעות');
    persist(); renderBar();
    hit(open[Math.floor(Math.random() * open.length)], 'me');
  };
  ACTIONS.emoji = () => toast(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);

  // הודעות מהאורח (אונליין)
  M.onRemote = (m) => {
    if (over) return;
    if (m.t === 'answer' && acceptAnswer(S, m)) {
      if (submit('bot', m.text) === 'dup') M.conn.send({ t: 'toast', text: 'כבר נמצא' });
    } else if (m.t === 'joker' && S.turn === 'bot') {
      const open = openIdx();
      if (open.length) hit(open[Math.floor(Math.random() * open.length)], 'bot');
    } else if (m.t === 'time' && S.turn === 'bot') {
      turnTotal += 10000; turnLeft += 10000;
      send({ t: 'turn', turn: S.turn, ms: turnLeft });
    }
  };

  R = { botTimers: [], iv: null };
  draw();
  send({ t: 'start', turn: S.turn, ms: turnTotal });
  nextTurn();
  let last = performance.now();
  R.iv = setInterval(() => {
    const now = performance.now();
    turnLeft -= now - last; last = now;
    tickPlay(v, turnLeft, turnTotal);
    if (turnLeft <= 0) {
      if (S.turn === 'me' || M.mode !== 'bot') miss(S.turn, 'נגמר הזמן');
      else turnLeft = 0;
    }
  }, 100);

  /** הסיבוב נגמר: מי שנשאר בלי חיים מפסיד, או שמי שנתן את התשובה האחרונה מנצח. */
  function end() {
    if (over) return;
    over = true;
    stopRound();
    v.input.disabled = true; v.send.disabled = true;
    const { winner: w, reason } = S.over;
    M.score[w === 'me' ? 0 : 1] += 1;
    const missed = q.answers.map((a, i) => (S.found[i] ? null : a.names[0])).filter(Boolean);
    send({ t: 'end', winner: w, reason, score: [...M.score], missed: missed.slice(0, 5) });
    const banner = showBanner(w, reason, missed);
    setTimeout(() => {
      banner.remove();
      const done = M.score.some((s) => s >= WINS_NEEDED) || M.round >= MAX_ROUNDS;
      if (!done) return nextRound();
      const outcome = M.score[0] > M.score[1] ? 'win' : M.score[1] > M.score[0] ? 'lose' : 'draw';
      send({ t: 'final', outcome });
      finishMatch(outcome);
    }, 2600);
  }
}

// ---------- אורח (אונליין): מציג מה שהמארח שולח ושולח תשובות ----------
function guestHandle(m) {
  switch (m.t) {
    case 'intro': {
      const q = QUESTIONS[m.qi];
      if (!q) return;
      M.round = m.round; M.qi = m.qi; M.score = m.score;
      stopRound();
      show(introHtml(q, '<p class="text-center text-sm text-white/80">הסיבוב מתחיל בעוד רגע</p>'), forfeit);
      let left = Math.round((m.ms || 6000) / 1000);
      const count = $('#count');
      count.textContent = left;
      R = { iv: setInterval(() => { left -= 1; count.textContent = Math.max(left, 0); bump(count); if (left <= 0) clearInterval(R.iv); }, 1000) };
      break;
    }
    case 'start': return playMirror(m);
    case 'ev': return M.mirror?.ev(m);
    case 'turn': return M.mirror?.turn(m);
    case 'end': return M.mirror?.end(m);
    case 'toast': return toast(String(m.text || '').slice(0, 40));
    case 'final': return finishMatch(['win', 'lose', 'draw'].includes(m.outcome) ? m.outcome : 'draw');
    default:
  }
}

function playMirror(m) {
  stopRound();
  const q = QUESTIONS[M.qi];
  if (!q) return;
  const n = q.answers.length;
  const st = { log: [], lives: { me: LIVES, bot: LIVES }, count: 0 };
  let turn = m.turn;
  let total = m.ms;
  let left = m.ms;
  let over = false;
  const v = mountPlay(q);
  const paint = () => paintPlayTurn(v, turn);
  M.mirror = {
    ev(e) {
      st.log.push({ who: e.who, hit: !!e.hit, text: String(e.text).slice(0, 60) });
      st.lives = e.lives; st.count = e.count;
      turn = e.turn; total = left = e.ms || total;
      drawPlay(v, st, n);
      if (e.who === 'me' && !e.hit) shake(v.form);
      if (!over) paint();
    },
    turn(e) { turn = e.turn; total = left = e.ms; paint(); },
    end(e) {
      over = true;
      clearInterval(R?.iv);
      v.input.disabled = true; v.send.disabled = true;
      M.score = e.score;
      const banner = showBanner(e.winner, e.reason, Array.isArray(e.missed) ? e.missed.map(String) : []);
      setTimeout(() => banner.remove(), 2600);
    },
  };
  v.form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (over || turn !== 'me') return;
    const text = v.input.value.trim();
    if (!text) return;
    v.input.value = '';
    M.conn.send({ t: 'answer', text });
  });
  const mine = () => { if (over || turn !== 'me') { toast('רק בתור שלך'); return false; } return true; };
  ACTIONS.joker = () => {
    if (!mine()) return;
    if (!spend(save, 'coins', COST.joker)) return toast('אין מספיק מטבעות');
    persist(); renderBar(); M.conn.send({ t: 'joker' });
  };
  ACTIONS.time = () => {
    if (!mine()) return;
    if (!spend(save, 'coins', COST.time)) return toast('אין מספיק מטבעות');
    persist(); renderBar(); M.conn.send({ t: 'time' });
  };
  ACTIONS.emoji = () => toast(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
  R = { botTimers: [], iv: null };
  drawPlay(v, st, n);
  paint();
  let last = performance.now();
  R.iv = setInterval(() => {
    const now = performance.now();
    left -= now - last; last = now;
    tickPlay(v, left, total);
  }, 100);
}

function finishMatch(outcome) {
  stopRound();
  M.finished = true;
  const local2 = M.mode === 'local2';
  const r = local2 ? { trophies: 0, coins: 0 } : rewards(outcome, save.trophies, M.opp.trophies);
  if (!local2) {
    save.trophies = Math.max(0, save.trophies + r.trophies);
    save.coins += r.coins;
    if (outcome === 'win') { save.wins += 1; recordWin(save); }
    persist();
  }
  const mode = M.mode;
  const title = local2
    ? (outcome === 'win' ? `${ME.name} ניצח` : outcome === 'lose' ? `${M.opp.name} ניצח` : 'תיקו')
    : (outcome === 'win' ? 'ניצחת!' : outcome === 'lose' ? 'הפסדת הפעם' : 'תיקו');
  ACTIONS.again = () => (mode === 'local2' ? startLocal2() : mode === 'bot' ? startMatch() : startOnline());
  show(`
<div class="flex-1 min-h-0 ${SCREEN_BG} flex flex-col">
  ${gameHeader()}
  <section class="px-4 flex-1 flex flex-col justify-center gap-5 text-center">
    <div class="flex items-center justify-center gap-6">
      ${avatar(ME, 'w-20 h-20', 'border-[3px] border-white shadow-xl')}
      <div class="text-5xl font-black text-3d-white" dir="ltr">${M.score[0]}-${M.score[1]}</div>
      ${avatar(M.opp, 'w-20 h-20', 'border-[3px] border-white shadow-xl')}
    </div>
    <h2 class="text-5xl font-black text-3d-banner">${esc(title)}</h2>
    ${local2 ? '' : `<div class="flex justify-center gap-3">
      <div id="r-tp" class="stat-pill rounded-lg px-5 py-2 text-xl font-bold pop"></div>
      <div id="r-co" class="stat-pill rounded-lg px-5 py-2 text-xl font-bold pop" style="animation-delay:.15s"></div>
    </div>`}
    <button data-act="again" class="play-btn-glow w-full h-20 rounded-xl text-3xl font-extrabold text-3d-white">שחק שוב</button>
    ${bigGloss('home', 'חזרה למסך הבית', '!text-xl')}
  </section>
</div>`, home);
  if (!local2) {
    countUp($('#r-tp'), Math.abs(r.trophies), r.trophies < 0 ? '-' : '+', I.trophy('w-5 h-5'));
    countUp($('#r-co'), r.coins, '+', I.coin('w-5 h-5'));
  }
  if (outcome === 'win' && !local2) confetti(screen, 40);
  if (M.conn && mode !== 'bot') { const c = M.conn; setTimeout(() => c.close(), 500); }
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
