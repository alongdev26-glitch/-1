import Phaser from 'phaser';
import Fight from '../scenes/Fight.js';
import { CHARACTERS, byId } from '../data/characters.js';
import { touch } from './input.js';
import {
  menuScreen, selectScreen, vsScreen, fightBackground, hudScreen, pauseScreen, resultsScreen,
} from './screens.js';

const $ = (id) => document.getElementById(id);
const state = { sel: 'aang', bots: 1, cfg: null, game: null, last: null };
let vsTimer = null;

// ---- במה: 960x540 שמוקטנת/מוגדלת למסך ----
function fit() {
  const s = Math.min(window.innerWidth / 960, window.innerHeight / 540);
  $('stage').style.setProperty('--s', s);
}

function toast(msg) {
  const t = document.createElement('div');
  t.id = 'toast'; t.textContent = msg;
  $('overlay').appendChild(t);
  setTimeout(() => t.remove(), 1400);
}

const isTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0 || /[?&]touch=1/.test(location.search);

function setScreen(html) {
  $('screen').innerHTML = html;
  $('screen').hidden = false;
}

function clearOverlay() { $('overlay').innerHTML = ''; }

// ---- מסכים ----
export function showMenu() {
  stopFight();
  $('fight-layer').hidden = true;
  setScreen(menuScreen());
  $('screen').onclick = (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'start') showSelect();
    if (a === 'soon') toast('בקרוב');
  };
}

export function showSelect() {
  const render = () => {
    setScreen(selectScreen(state.sel, state.bots));
    $('screen').onclick = (e) => {
      const card = e.target.closest('[data-char]');
      if (card) { state.sel = card.dataset.char; return render(); }
      const bots = e.target.closest('[data-bots]');
      if (bots) { state.bots = +bots.dataset.bots; return render(); }
      if (e.target.closest('[data-act="go"]')) startVs();
    };
  };
  render();
}

function startVs() {
  const player = byId(state.sel);
  const others = Phaser.Utils.Array.Shuffle(CHARACTERS.filter((c) => c.id !== player.id));
  const bots = others.slice(0, state.bots);
  state.cfg = { p1: player.id, bots: bots.map((b) => b.id) };
  setScreen(vsScreen(player, bots));
  $('screen').onclick = null;
  launchFight(); // טוענים את הקרב ברקע בזמן ש-VS מוצג

  let p = 8; const bar = () => $('vs-progress');
  clearInterval(vsTimer);
  vsTimer = setInterval(() => {
    const scene = state.game?.scene.getScene('Fight');
    p = Math.min(100, p + 7 + Math.random() * 6);
    if (bar()) bar().style.width = p + '%';
    if (p >= 100 && scene?.ready) { clearInterval(vsTimer); beginFight(scene); }
  }, 160);
}

// ---- קרב ----
function launchFight() {
  state.cfg.onHud = updateHud;
  state.cfg.onEnd = showResults;
  $('canvas-wrap').hidden = false;
  if (!state.game) {
    state.game = new Phaser.Game({
      type: Phaser.AUTO, parent: 'canvas-wrap', width: 960, height: 540, transparent: true,
      scale: { mode: Phaser.Scale.NONE }, input: { activePointers: 1 },
      physics: { default: 'arcade', arcade: { gravity: { y: 1100 }, debug: false } },
      callbacks: { preBoot: (g) => g.registry.set('cfg', state.cfg) },
      scene: [Fight],
    });
  } else {
    state.game.registry.set('cfg', state.cfg);
    state.game.scene.stop('Fight');
    state.game.scene.start('Fight');
  }
}

function beginFight(scene) {
  const fighters = scene.fighters;
  $('fight-bg').innerHTML = fightBackground();
  $('hud').innerHTML = hudScreen(fighters);
  $('fight-layer').hidden = false;
  $('screen').hidden = true; $('screen').innerHTML = '';
  clearOverlay();
  $('touch-ui').hidden = !isTouch();
  bindHud();
  scene.go();
}

function bindHud() {
  const hud = $('hud');
  hud.querySelector('[data-act="pause"]').onclick = pause;
  hud.querySelectorAll('[data-hold]').forEach((el) => {
    const key = el.dataset.hold;
    const set = (v) => { touch[key] = v; el.classList.toggle('on', v); };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); set(true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, () => set(false)));
  });
}

const hudCache = {};
function updateHud(fighters) {
  fighters.forEach((f) => {
    const card = document.querySelector(`[data-hud="${f.uid}"]`);
    if (!card) return;
    const key = `${Math.round(f.percent)}|${f.stocks}`;
    if (hudCache[f.uid] !== key) {
      hudCache[f.uid] = key;
      card.querySelector('[data-pct]').textContent = Math.round(f.percent) + '%';
      [...card.querySelector('[data-stocks]').children].forEach((d, i) => d.classList.toggle('opacity-25', i >= f.stocks));
    }
    if (f.human) {
      const ring = $('sp-ring');
      if (ring) ring.setAttribute('stroke-dashoffset', String(100.5 * Math.min(1, f.spCd / f.def.special.cooldown)));
    }
  });
}

function stopFight() {
  clearInterval(vsTimer);
  Object.keys(touch).forEach((k) => (touch[k] = false));
  if (state.game) { state.game.scene.stop('Fight'); }
  $('canvas-wrap').hidden = true;
  Object.keys(hudCache).forEach((k) => delete hudCache[k]);
}

function pause() {
  const scene = state.game?.scene.getScene('Fight');
  if (!scene || scene.over || !scene.started) return;
  state.game.scene.pause('Fight');
  Object.keys(touch).forEach((k) => (touch[k] = false));
  $('overlay').innerHTML = pauseScreen();
  $('overlay').style.pointerEvents = 'auto';
  $('overlay').onclick = (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'resume') resume();
    if (a === 'restart') { resume(true); startVs(); }
    if (a === 'menu') { resume(true); showMenu(); }
  };
}

function resume(silent) {
  clearOverlay();
  $('overlay').style.pointerEvents = 'none';
  $('overlay').onclick = null;
  if (!silent) state.game.scene.resume('Fight');
}

function showResults(r) {
  stopFightKeepLayer();
  state.last = r;
  setTimeout(() => {
    $('fight-layer').hidden = true;
    setScreen(resultsScreen(r));
    $('screen').onclick = (e) => {
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'again') startVs();
      if (a === 'menu') showMenu();
    };
  }, 700);
}

function stopFightKeepLayer() { Object.keys(touch).forEach((k) => (touch[k] = false)); }

export function initUI() {
  window.__arena = state; // לבדיקות
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if ($('overlay').querySelector('[data-act="resume"]')) resume(); else pause();
    }
  });
  showMenu();
}
