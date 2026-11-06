import { QUESTIONS } from './questions.js';
import { matchAnswer } from './checker.js';
import { makeOpponent, botSkill, planBotGuesses, ROUND_SECONDS } from './bot.js';
import {
  MAX_ENERGY, COST, COIN_PACK, FREE_COINS, FREE_COINS_MS, DAILY_GEMS,
  defaultSave, tickEnergy, energyCountdownMs, spendEnergy, spend, rewards, pickQuestion,
} from './economy.js';

const KEY = 'rosh-brosh-save-v1';
const ME = { name: 'אתה', face: '🧑‍🦱', color: '#e0b44d' };
const PRE_SECONDS = 6;
const WINS_NEEDED = 2;
const MAX_ROUNDS = 5;

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

// ---------- tiny DOM helpers ----------
const $ = (s) => document.querySelector(s);
const screen = $('#screen');
function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
const avatar = (p, size = 'lg', active = false) =>
  h('div', { class: `avatar ${size}${active ? ' active' : ''}`, style: `--c:${p.color}` }, p.face);
const trophyPill = (n) => h('span', { class: 'tp' }, `${n} 🏆`);

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}

function openModal(...content) {
  const m = $('#modal');
  m.replaceChildren(h('div', { class: 'sheet' }, ...content));
  m.hidden = false;
  m.onclick = (e) => { if (e.target === m) closeModal(); };
}
function closeModal() { $('#modal').hidden = true; }

// ---------- top bar ----------
function renderBar() {
  tickEnergy(save);
  $('#energy-val').textContent = `${save.energy}/${MAX_ENERGY}`;
  $('#gems-val').textContent = save.gems;
  $('#coins-val').textContent = save.coins;
  const ms = energyCountdownMs(save);
  const s = Math.ceil(ms / 1000);
  $('#energy-timer').textContent = ms ? `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : '';
}
setInterval(renderBar, 1000);

$('#energy-pill').onclick = () => {
  if (save.energy >= MAX_ENERGY) return toast('האנרגיה מלאה');
  buyEnergy();
};
$('#gems-pill').onclick = () => openModal(
  h('h3', {}, '💎 יהלומים'),
  h('p', {}, 'בגרסה המלאה כאן קונים יהלומים בכסף אמיתי. באב-הטיפוס אפשר לקבל פרס יומי וחינם.'),
  h('button', { class: 'big', onclick: () => { closeModal(); claimDaily(); } }, `פרס יומי: ${DAILY_GEMS} 💎`),
  h('button', { class: 'big ghost', onclick: closeModal }, 'סגור'),
);
$('#coins-pill').onclick = () => openModal(
  h('h3', {}, '🪙 מטבעות'),
  h('p', {}, `המטבעות משמשים ל"החלף שאלה", "זמן" ו"ג'וקר".`),
  h('button', { class: 'big', onclick: () => { buyCoins(); } }, `${COIN_PACK} 🪙 ב-${COST.coinPack} 💎`),
  h('button', { class: 'big ghost', onclick: () => { closeModal(); claimFreeCoins(); } }, 'מטבעות חינם'),
);

function buyEnergy() {
  openModal(
    h('h3', {}, '⚡ אנרגיה'),
    h('p', {}, 'כל משחק עולה אנרגיה אחת. אנרגיה אחת חוזרת כל 10 דקות.'),
    h('button', {
      class: 'big',
      onclick: () => {
        if (!spend(save, 'gems', COST.refill)) return toast('אין מספיק יהלומים');
        save.energy = MAX_ENERGY; persist(); renderBar(); closeModal(); toast('האנרגיה התמלאה');
      },
    }, `מלא הכול ב-${COST.refill} 💎`),
    h('button', { class: 'big ghost', onclick: closeModal }, 'אחכה'),
  );
}
function buyCoins() {
  if (!spend(save, 'gems', COST.coinPack)) return toast('אין מספיק יהלומים');
  save.coins += COIN_PACK; persist(); renderBar(); closeModal(); toast(`קיבלת ${COIN_PACK} מטבעות`);
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

// ---------- navigation ----------
let backAction = null;
function show(name, builder, { back = null, bar = true } = {}) {
  $('#topbar').hidden = !bar;
  backAction = back;
  $('#back').style.visibility = back ? 'visible' : 'hidden';
  screen.replaceChildren(builder());
  screen.scrollTop = 0;
  renderBar();
}
$('#back').onclick = () => backAction?.();

// ---------- home ----------
const FRIENDS = [makeOpponent(60), makeOpponent(100), makeOpponent(150)];
function home() {
  stopRound();
  show('home', () => h('div', { class: 'home', style: 'display:flex;flex-direction:column;flex:1' },
    h('div', { class: 'trophies' }, `${save.trophies} 🏆`),
    h('div', { class: 'menu' },
      h('div', { class: 'row' },
        h('button', { class: 'big small', onclick: claimDaily }, 'פרס יומי'),
        h('button', { class: 'big small', onclick: claimFreeCoins }, 'מטבעות חינם', h('small', {}, 'זמין!')),
      ),
      h('button', { class: 'big', onclick: leaderboard }, 'המובילים'),
      h('button', { class: 'big play', onclick: startMatch }, 'שחק כעת'),
    ),
    h('div', { class: 'section-title' }, 'החברים שלי'),
    h('div', { class: 'friends' }, FRIENDS.map((f) => h('button', { class: 'friend', onclick: () => startMatch(f) }, avatar(f), f.name))),
    h('div', { class: 'hero' }, h('h1', {}, 'ראש בראש'), h('p', {}, `${save.played} משחקים · ${save.wins} ניצחונות`)),
  ));
}

// ---------- leaderboard ----------
function leaderboard() {
  const rows = [...FRIENDS.map((f, i) => ({ ...f, trophies: [677, 989, 556][i] })), { ...makeOpponent(120), name: 'Shir Daum', trophies: 123 }, { ...makeOpponent(60), name: 'Shir Cohen', trophies: 58 }, { ...ME, trophies: save.trophies, me: true }]
    .sort((a, b) => b.trophies - a.trophies);
  show('lb', () => h('div', {},
    h('div', { class: 'board-title' }, '👑 המובילים'),
    h('div', { class: 'lb' }, rows.map((r, i) => h('div', { class: `lb-row${r.me ? ' me' : ''}` },
      h('div', { class: 'rank' }, i + 1), avatar(r, 'md'), h('b', {}, r.me ? `${r.name} (אני)` : r.name), h('span', { class: 'score-pill' }, `${r.trophies} 🏆`)))),
  ), { back: home });
}

// ---------- match ----------
let M = null; // { opp, score:[me,opp], round, qi, usedQ }
let R = null; // current round runtime

function startMatch(friend) {
  const opp = friend && friend.name ? friend : makeOpponent(save.trophies);
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
  openModal(
    h('h3', {}, 'לעזוב באמצע?'),
    h('p', {}, 'עזיבה נחשבת הפסד, והאנרגיה לא חוזרת.'),
    h('button', { class: 'big', onclick: () => { closeModal(); finishMatch('lose'); } }, 'כן, לעזוב'),
    h('button', { class: 'big ghost', onclick: closeModal }, 'להישאר'),
  );
}

function versusHeader(activeMe = true) {
  return h('div', { class: 'versus' },
    h('div', { class: 'who' }, avatar(ME, 'xl', activeMe), h('span', { class: 'tp' }, `${save.trophies} 🏆`), ME.name),
    h('div', { class: 'score', id: 'score' }, `${M.score[0]}-${M.score[1]}`),
    h('div', { class: 'who' }, avatar(M.opp, 'xl'), h('span', { class: 'tp' }, `${M.opp.trophies} 🏆`), M.opp.name),
  );
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
  const count = h('div', { class: 'countdown' }, left);
  const swap = h('button', { class: 'act', onclick: () => {
    if (!spend(save, 'coins', COST.swap)) return toast('אין מספיק מטבעות');
    persist(); renderBar(); chooseQuestion(); clearInterval(R?.iv); intro();
  } }, `החלף שאלה · ${COST.swap} 🪙`);
  const go = h('button', { class: 'act', onclick: () => { clearInterval(R.iv); play(); } }, '✓ אשר שאלה');
  show('intro', () => h('div', { style: 'display:flex;flex-direction:column;flex:1' },
    versusHeader(),
    count,
    h('div', { class: 'qbox' }, q.text),
    h('div', { class: 'round-label' }, `סיבוב ${M.round} · ${q.answers.length} תשובות לחפש`),
    h('div', { class: 'actions' }, swap, go),
  ), { back: forfeit });
  R = { iv: setInterval(() => {
    left -= 1;
    count.textContent = Math.max(left, 0);
    if (left <= 0) { clearInterval(R.iv); play(); }
  }, 1000) };
}

function stopRound() {
  if (!R) return;
  clearInterval(R.iv);
  (R.botTimers || []).forEach(clearTimeout);
  R = null;
}

function play() {
  const q = QUESTIONS[M.qi];
  const n = q.answers.length;
  const found = Array(n).fill(null); // null | 'me' | 'bot'
  const chips = h('div', { class: 'chips' });
  const countMe = h('span', {}, '');
  const countBot = h('span', {}, '');
  const bar = h('div', { class: 'timerbar' }, h('i'));
  const input = h('input', { type: 'text', placeholder: 'הזן תשובה', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'send', 'aria-label': 'תשובה' });
  const entry = h('form', { class: 'entry' }, input, h('button', { type: 'submit' }, 'שלח'));
  const timeBtn = h('button', { class: 'act', type: 'button' }, `עוד 10 שניות · ${COST.time} 🪙`);
  const jokerBtn = h('button', { class: 'act', type: 'button' }, `ג'וקר · ${COST.joker} 🪙`);
  let total = ROUND_SECONDS * 1000;
  let left = total;
  let over = false;
  const order = []; // indexes in the order they were found, to show the story

  function draw() {
    chips.replaceChildren(
      ...order.map((i) => h('span', { class: `chip ${found[i]}` }, h('span', { class: 'tick' }, found[i] === 'me' ? '✓' : '•'), q.answers[i].names[0])),
      ...Array.from({ length: n - order.length }, () => h('span', { class: 'chip ghost' }, '?')),
    );
    const me = found.filter((f) => f === 'me').length;
    const bot = found.filter((f) => f === 'bot').length;
    countMe.textContent = `אתה: ${me}`;
    countBot.textContent = `${M.opp.name}: ${bot}`;
    chips.scrollTop = chips.scrollHeight;
  }
  function claim(i, who) {
    if (over || found[i]) return false;
    found[i] = who;
    order.push(i);
    draw();
    if (order.length === n) end();
    return true;
  }

  entry.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || over) return;
    const m = matchAnswer(text, q.answers);
    const bad = (msg) => {
      entry.classList.remove('shake'); void entry.offsetWidth; entry.classList.add('shake');
      if (msg) toast(msg);
    };
    if (!m) bad();
    else if (found[m.index]) bad(found[m.index] === 'me' ? 'כבר מצאת את זה' : 'היריב כבר מצא את זה');
    else claim(m.index, 'me');
    input.value = '';
    input.focus();
  });
  timeBtn.onclick = () => {
    if (over) return;
    if (!spend(save, 'coins', COST.time)) return toast('אין מספיק מטבעות');
    total += 10000; left += 10000; persist(); renderBar();
  };
  jokerBtn.onclick = () => {
    if (over) return;
    const open = found.map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);
    if (!open.length) return;
    if (!spend(save, 'coins', COST.joker)) return toast('אין מספיק מטבעות');
    persist(); renderBar();
    claim(open[Math.floor(Math.random() * open.length)], 'me');
  };

  show('play', () => h('div', { style: 'display:flex;flex-direction:column;flex:1;min-height:0' },
    h('div', { class: 'board' }, h('header', {}, q.text), chips, h('div', { class: 'count' }, countMe, countBot), bar),
    h('div', { class: 'helpers' }, timeBtn, jokerBtn),
    entry,
  ), { back: forfeit });
  draw();
  setTimeout(() => input.focus({ preventScroll: true }), 50);

  const plan = planBotGuesses(n, botSkill(M.opp));
  R = { botTimers: plan.map((p) => setTimeout(() => claim(p.index, 'bot'), p.at)), iv: null };
  const startAt = performance.now();
  let last = startAt;
  R.iv = setInterval(() => {
    const now = performance.now();
    left -= now - last; last = now;
    bar.firstChild.style.width = `${Math.max(0, (left / total) * 100)}%`;
    bar.classList.toggle('low', left < 7000);
    if (left <= 0) end();
  }, 100);

  function end() {
    if (over) return;
    over = true;
    // הבוט שעוד לא "הספיק" לענות לא ממשיך אחרי הסוף
    stopRound();
    const me = found.filter((f) => f === 'me').length;
    const bot = found.filter((f) => f === 'bot').length;
    const winner = me > bot ? 0 : bot > me ? 1 : -1;
    if (winner >= 0) M.score[winner] += 1;
    const missed = q.answers.map((a, i) => (found[i] ? null : a.names[0])).filter(Boolean);
    const title = winner === 0 ? 'זכית בסיבוב!' : winner === 1 ? 'היריב זכה בסיבוב' : 'תיקו בסיבוב';
    const banner = h('div', { class: 'banner' }, h('div', {},
      h('h2', {}, title),
      h('p', {}, `${me} מול ${bot}`),
      missed.length ? h('p', { style: 'margin-top:10px;font-size:15px' }, `לא נמצאו: ${missed.slice(0, 4).join(', ')}${missed.length > 4 ? '…' : ''}`) : null,
    ));
    $('#app').append(banner);
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
  persist(); renderBar();
  const title = outcome === 'win' ? '🏆 ניצחת!' : outcome === 'lose' ? 'הפסדת הפעם' : 'תיקו';
  show('result', () => h('div', { class: 'result' },
    h('div', { style: 'display:flex;justify-content:center;gap:24px;align-items:center' }, avatar(ME, 'lg'), h('div', { class: 'score' }, `${M.score[0]}-${M.score[1]}`), avatar(M.opp, 'lg')),
    h('h2', {}, title),
    h('div', { class: 'rewards' },
      h('span', { class: 'score-pill' }, `${r.trophies >= 0 ? '+' : ''}${r.trophies} 🏆`),
      h('span', { class: 'score-pill' }, `+${r.coins} 🪙`)),
    h('div', { class: 'stack' },
      h('button', { class: 'big play', onclick: startMatch }, 'שחק שוב'),
      h('button', { class: 'big small', onclick: home }, 'חזרה למסך הבית')),
  ), { back: home });
}

home();
