import Phaser from 'phaser';
import Fight from '../scenes/Fight.js';
import { CHARACTERS, byId } from '../data/characters.js';
import { touch } from './input.js';
import { isUnlocked, setMode, story as storyData, recordStory } from '../data/progress.js';
import { realmById, REALMS, evalObjectives, realmOpen } from '../data/story.js';
import { moveIcon } from './icons.js';
import { World3D } from '../three/world3d.js';
import { createViewer, destroyViewers } from '../three/viewer.js';
import { is3D, quality, setQuality, nextQuality, QUALITY_LABEL } from '../three/settings.js';
import { pollPad, rumble, pad, blockInput } from './gamepad.js';
import {
  menuScreen, selectScreen, mapScreen, vsScreen, hudScreen, pauseScreen, resultsScreen, storyScreen, storyResultsScreen, stageStates,
} from './screens.js';
import { fightBackground } from './maps.js';
import { MAPS, mapById } from '../data/maps.js';

const $ = (id) => document.getElementById(id);
const state = { sel: 'zuko', bots: 1, map: 'random', cpuLv: 5, cfg: null, game: null, last: null, mode: 'menu', paused: false,
  story: { realm: 'air', sel: null, chosen: 'zuko' }, over: null };
let vsTimer = null;

// ---- תלת-מימד ----
function start3D(fighters) {
  stop3D();
  if (!is3D()) return;
  try {
    const w = new World3D($('three-layer'), state.cfg.map, quality());
    w.attach(fighters);
    state.stage3d = w;
    if (w.full) $('fight-bg').style.visibility = 'hidden'; // הזירה התלת-מימדית מחליפה את הרקע הדו-ממדי
    const sc = state.game?.scene.getScene('Fight');
    state.cfg.onFrame = (f) => {
      if (!state.stage3d) return;
      state.stage3d.sync(f);
      const cs = state.stage3d.camState();
      if (cs && sc) { sc.cameras.main.setZoom(cs.zoom); sc.cameras.main.centerOn(cs.cx, cs.cy); } // אותה מצלמה גם לאפקטים
    };
  } catch (e) { // אין WebGL: ממשיכים ב-2D
    console.warn('3D disabled', e);
    state.stage3d?.dispose?.(); state.stage3d = null;
    $('fight-bg').style.visibility = '';
  }
}
function stop3D() {
  if (state.stage3d) { try { state.stage3d.dispose(); } catch { /* ignore */ } state.stage3d = null; }
  if (state.cfg) state.cfg.onFrame = null;
  $('fight-bg').style.visibility = '';
  const sc = state.game?.scene.getScene('Fight');
  if (sc && sc.cameras && sc.cameras.main) { sc.cameras.main.setZoom(1); sc.cameras.main.centerOn(480, 270); }
}
function mountViewers() {
  $('screen').querySelectorAll('[data-v3d]').forEach((el) => createViewer(el, el.dataset.v3d));
}

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
  destroyViewers();
  $('screen').innerHTML = html;
  $('screen').hidden = false;
  mountViewers();
}

function clearOverlay() { $('overlay').innerHTML = ''; }

// ---- מסכים ----
export function showMenu() {
  state.mode = 'menu'; state.paused = false; setMode('free');
  stopFight();
  $('fight-layer').hidden = true;
  setScreen(menuScreen());
  $('screen').onclick = (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'start') showSelect();
    if (a === 'story') showStory();
    if (a === 'soon') toast('בקרוב');
  };
}

// ---- מסלול סיפור ----
export function showStory() {
  state.mode = 'menu'; setMode('free');
  stopFight();
  $('fight-layer').hidden = true;
  const render = () => {
    const realm = realmById(state.story.realm), st = storyData();
    if (!st.unlocked.includes(state.story.chosen)) state.story.chosen = st.unlocked[0];
    if (!state.story.sel) state.story.sel = stageStates(realm, st).cur || realm.stages[0].id;
    setScreen(storyScreen({ realm, sel: state.story.sel, st, chosen: state.story.chosen, bg: storyBackground(realm) }));
    $('screen').onclick = (e) => {
      const stage = e.target.closest('[data-stage]');
      if (stage) {
        const x = stageStates(realm, st).list.find((l) => l.s.id === stage.dataset.stage);
        if (!x.open) return toast('השלב נעול. נצח בשלב הקודם');
        state.story.sel = x.s.id; return render();
      }
      const pick = e.target.closest('[data-pick]');
      if (pick) {
        if (!st.unlocked.includes(pick.dataset.pick)) return toast('הדמות נפתחת בסיפור (נצח את הבוס)');
        state.story.chosen = pick.dataset.pick; return render();
      }
      const tab = e.target.closest('[data-tab]');
      if (tab) {
        const r = realmById(tab.dataset.tab);
        if (!r.ready || !realmOpen(r, st.cleared)) return toast('נצח את הבוס של הממלכה הקודמת כדי לפתוח');
        state.story.realm = r.id; state.story.sel = null; return render();
      }
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'back') showMenu();
      if (a === 'fight') startStory();
    };
  };
  render();
}

function storyBackground(realm) {
  return fightBackground(mapById(realm.map), { ambient: true, platforms: false, scenery: realm.id });
}

function startStory() {
  const realm = realmById(state.story.realm), st = storyData();
  const { list } = stageStates(realm, st);
  const x = list.find((l) => l.s.id === state.story.sel);
  if (!x || !x.open) return;
  const S = x.s, chosen = state.story.chosen;
  const opp = S.opp === chosen ? S.alt : S.opp;
  startVs({ p1: chosen, bots: [opp], map: mapById(S.map), story: { realm: realm.id, stage: S.id }, skill: S.skill, boss: !!S.boss });
}

// אחרי רינדור מחדש בשלט: מחזירים את הפוקוס לאריח שנבחר
function refocus(selector) {
  if (!pad.active) return;
  const el = $('screen').querySelector(selector);
  if (el) setFocus(el);
}

export function showSelect() {
  const render = () => {
    setScreen(selectScreen(state.sel, state.bots, state.cpuLv));
    refocus(`[data-char="${state.sel}"]`);
    $('screen').onclick = (e) => {
      const card = e.target.closest('[data-char]');
      if (card) { state.sel = card.dataset.char; return render(); }
      const bots = e.target.closest('[data-bots]');
      if (bots) { state.bots = +bots.dataset.bots; return render(); }
      const lv = e.target.closest('[data-cpulv]');
      if (lv) { state.cpuLv = Math.max(1, Math.min(9, state.cpuLv + +lv.dataset.cpulv)); return render(); }
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'back') showMenu();
      if (a === 'go') showMap();
    };
  };
  render();
}

export function showMap() {
  const render = () => {
    setScreen(mapScreen(state.map));
    refocus(`[data-map="${state.map}"]`);
    $('screen').onclick = (e) => {
      const card = e.target.closest('[data-map]');
      if (card) { state.map = card.dataset.map; return render(); }
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'back') showSelect();
      if (a === 'go') startVs();
    };
  };
  render();
}

function startVs(over) {
  state.mode = 'vs';
  state.over = over || null; // לשמירה, כדי ש"שוב" יחזור על אותו שלב סיפור
  setMode(over ? 'story' : 'free');
  let player, bots, map;
  if (over) {
    player = byId(over.p1); bots = over.bots.map(byId); map = over.map;
    state.cfg = { p1: player.id, bots: over.bots, map, story: over.story, skill: over.skill, boss: over.boss };
  } else {
    const pool = CHARACTERS.filter((c) => true);
    player = state.sel === 'random' ? Phaser.Utils.Array.GetRandom(pool) : byId(state.sel);
    const others = Phaser.Utils.Array.Shuffle(CHARACTERS.filter((c) => c.id !== player.id));
    bots = others.slice(0, state.bots);
    map = state.map === 'random' ? Phaser.Utils.Array.GetRandom(MAPS) : mapById(state.map);
    state.cfg = { p1: player.id, bots: bots.map((b) => b.id), map, skill: 0.45 + state.cpuLv * 0.1 };
  }
  setScreen(vsScreen(player, bots, map));
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
  state.cfg.onBanner = banner;
  state.cfg.onRumble = rumble;
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
  $('fight-bg').innerHTML = fightBackground(state.cfg.map);
  const stageName = state.cfg.story
    ? realmById(state.cfg.story.realm).stages.find((x) => x.id === state.cfg.story.stage)?.short
    : state.cfg.map.name;
  $('hud').innerHTML = hudScreen(fighters, { stageName, touch: isTouch() });
  $('fight-layer').hidden = false;
  $('screen').hidden = true; $('screen').innerHTML = '';
  clearOverlay();
  $('touch-ui').hidden = !isTouch();
  destroyViewers();
  bindHud();
  applyIcons(fighters[0].def);
  start3D(fighters);
  state.mode = 'fight';
  blockInput(400);
  scene.go();
}

function stagePoint(e) {
  const r = $('stage').getBoundingClientRect(), k = r.width / 960;
  return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
}

// ג'ויסטיק צף: מופיע מתחת לאצבע בחצי השמאלי של המסך ועוקב אחריה
function bindJoystick() {
  const zone = $('joy-zone'), base = $('joy-base'), knob = $('joy-knob'), hint = $('joy-hint'), ghost = $('joy-ghost');
  if (!zone) return;
  const R = 70;                       // רדיוס הג'ויסטיק
  let id = null, cx = 0, cy = 0;
  const flags = (dx, dy) => {
    // תנועה פרופורציונית: ככל שהאצבע רחוקה יותר מהמרכז הדמות מהירה יותר (אזור מת קטן וקימור עדין)
    const m = Math.min(1, Math.abs(dx) / R), DEAD = 0.16;
    touch.axis = m < DEAD ? 0 : Math.sign(dx) * Math.pow((m - DEAD) / (1 - DEAD), 1.2);
    touch.left = touch.axis < -0.05; touch.right = touch.axis > 0.05;
    touch.up = dy < -34; touch.down = dy > 34;
  };
  const reset = () => { id = null; base.hidden = true; hint.hidden = false; ghost.hidden = false; flags(0, 0); };
  zone.addEventListener('pointerdown', (e) => {
    if (id !== null) return;
    e.preventDefault(); zone.setPointerCapture(e.pointerId); id = e.pointerId;
    const p = stagePoint(e); cx = p.x; cy = p.y;
    base.style.left = cx - R + 'px'; base.style.top = cy - R + 'px';
    knob.style.left = '38px'; knob.style.top = '38px';
    base.hidden = false; hint.hidden = true; ghost.hidden = true;
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const p = stagePoint(e);
    let dx = p.x - cx, dy = p.y - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) { // האצבע חרגה מהטבעת: הבסיס זז אחריה
      const over = d - R;
      cx += (dx / d) * over; cy += (dy / d) * over;
      dx = p.x - cx; dy = p.y - cy;
      base.style.left = cx - R + 'px'; base.style.top = cy - R + 'px';
    }
    knob.style.left = 38 + dx + 'px'; knob.style.top = 38 + dy + 'px';
    flags(dx, dy);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => zone.addEventListener(ev, (e) => { if (e.pointerId === id || ev === 'lostpointercapture') reset(); }));
}

function bindHud() {
  const hud = $('hud');
  hud.querySelector('[data-act="pause"]').onclick = pause;
  bindJoystick();
  hud.querySelectorAll('[data-hold]').forEach((el) => {
    const key = el.dataset.hold;
    const set = (v) => { touch[key] = v; el.classList.toggle('on', v); };
    let downAt = 0;
    // נגיעה קצרה נשארת לחוצה לפחות 90ms, כדי שהמשחק (שקורא קלט בכל פריים) לא יפספס אותה
    const release = () => setTimeout(() => set(false), Math.max(0, 90 - (performance.now() - downAt)));
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); downAt = performance.now(); set(true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, release));
  });
}

// איור המכה על כל כפתור, ומספר קטן בפינה
function applyIcons(def) {
  const put = (key, move, num) => {
    const sp = document.querySelector(`[data-hold="${key}"] span`);
    if (!sp) return;
    const size = key === 'm1' ? 36 : key === 'ult' ? 32 : 30;
    sp.innerHTML = moveIcon(move, def.element, size) +
      `<b class="absolute -bottom-1 -right-1 text-[11px] leading-none rounded-full bg-black/55 px-1 py-0.5">${num}</b>`;
  };
  def.moves.forEach((m, i) => put('m' + (i + 1), m, i + 1));
  put('ult', def.ult, '★');
}

function updateButtons(f) {
  const set = (key, frac, locked) => {
    const el = document.querySelector(`[data-hold="${key}"]`), ring = document.querySelector(`[data-ring="${key}"]`);
    if (ring) ring.setAttribute('stroke-dashoffset', String(113 * Math.min(1, Math.max(0, frac))));
    if (el) el.classList.toggle('locked', !!locked);
  };
  f.def.moves.forEach((m, i) => set('m' + (i + 1), f.cd[i] / m.cooldown, !isUnlocked(m)));
  const ready = f.ult >= 100;
  set('ult', ready ? 0 : 1 - f.ult / 100, !isUnlocked(f.def.ult));
  document.querySelector('[data-hold="ult"]')?.classList.toggle('ult-ready', ready);
}

function banner(text, color) {
  const el = document.createElement('div');
  el.id = 'banner'; el.textContent = text;
  el.style.color = '#' + color.toString(16).padStart(6, '0');
  $('overlay').appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

const hudCache = {};
function updateHud(fighters) {
  fighters.forEach((f) => {
    const card = document.querySelector(`[data-hud="${f.uid}"]`);
    if (!card) return;
    const key = `${Math.round(f.percent)}|${f.stocks}`;
    if (hudCache[f.uid] !== key) {
      hudCache[f.uid] = key;
      const pc = card.querySelector('[data-pct]');
      pc.textContent = Math.round(f.percent) + '%';
      pc.parentElement.className = 'hud-dmg' + (f.percent >= 120 ? ' dmg-max' : f.percent >= 70 ? ' dmg-hi' : '');
      [...card.querySelector('[data-stocks]').children].forEach((d, i) => d.classList.toggle('opacity-25', i >= f.stocks));
    }
    const bar = card.querySelector('[data-ultbar]');
    if (bar) bar.style.width = Math.round(f.ult) + '%';
    if (f.human) updateButtons(f);
  });
  const sc = state.game?.scene.getScene('Fight'), tm = document.getElementById('hud-timer');
  if (sc && tm && sc.startT != null) {
    const t = Math.max(0, Math.floor((sc.time.now - sc.startT) / 1000));
    const txt = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
    if (tm.textContent !== txt) tm.textContent = txt;
  }
}

function stopFight() {
  clearInterval(vsTimer);
  stop3D();
  Object.keys(touch).forEach((k) => (touch[k] = false));
  if (state.game) { state.game.scene.stop('Fight'); }
  $('canvas-wrap').hidden = true;
  Object.keys(hudCache).forEach((k) => delete hudCache[k]);
}

function pause() {
  const scene = state.game?.scene.getScene('Fight');
  if (!scene || scene.over || !scene.started) return;
  state.game.scene.pause('Fight');
  state.paused = true;
  Object.keys(touch).forEach((k) => (touch[k] = false));
  $('overlay').innerHTML = pauseScreen(QUALITY_LABEL[quality()]);
  $('overlay').style.pointerEvents = 'auto';
  $('overlay').onclick = (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'resume') resume();
    if (a === 'toggle3d') {
      setQuality(nextQuality());
      if (is3D()) { start3D(scene.fighters); state.stage3d?.sync(scene.fighters); } else stop3D();
      $('overlay').innerHTML = pauseScreen(QUALITY_LABEL[quality()]);
    }
    if (a === 'restart') { resume(true); startVs(state.over); }
    if (a === 'menu') { resume(true); showMenu(); }
  };
}

function resume(silent) {
  state.paused = false;
  blockInput(350);
  clearOverlay();
  $('overlay').style.pointerEvents = 'none';
  $('overlay').onclick = null;
  if (!silent) state.game.scene.resume('Fight');
}

function showResults(r) {
  state.mode = 'results';
  stopFightKeepLayer();
  state.last = r;
  setTimeout(() => {
    $('fight-layer').hidden = true;
    if (state.cfg.story) {
      const realm = realmById(state.cfg.story.realm), stage = realm.stages.find((x) => x.id === state.cfg.story.stage);
      const got = evalObjectives(stage, r);
      const rec = recordStory(stage, got);
      setScreen(storyResultsScreen({ r, stage, got, rec, realmId: realm.id }));
      if (r.won) state.story.sel = null; // ממשיכים לשלב הבא
      $('screen').onclick = (e) => {
        const a = e.target.closest('[data-act]')?.dataset.act;
        if (a === 'again') startVs(state.over);
        if (a === 'story-back') showStory();
      };
      return;
    }
    setScreen(resultsScreen(r));
    $('screen').onclick = (e) => {
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'again') startVs();
      if (a === 'menu') showMenu();
    };
  }, 700);
}

function stopFightKeepLayer() { Object.keys(touch).forEach((k) => (touch[k] = false)); }

// ---- שלט: ניווט בתפריטים לפי כיוון, A = אישור, B = חזרה, Start = עצירה ----
const SELECTABLE = '[data-act],[data-char],[data-bots],[data-map],[data-stage],[data-pick],[data-tab]';
let focusEl = null;
function setFocus(el) {
  document.querySelectorAll('.gp-focus').forEach((x) => x.classList.remove('gp-focus'));
  focusEl = el;
  if (el) el.classList.add('gp-focus');
}
function focusables() {
  const root = $('overlay').querySelector('[data-act]') ? $('overlay') : $('screen');
  return [...root.querySelectorAll(SELECTABLE)].filter((e) => e.offsetParent !== null && !e.closest('[hidden]'));
}
function moveFocus(dir) {
  const list = focusables();
  if (!list.length) return;
  if (!focusEl || !list.includes(focusEl)) {
    setFocus(list.find((e) => e.classList.contains('selected-card-glow') || e.classList.contains('bg-sky-600') || e.classList.contains('scale-105')) || list[0]);
    return;
  }
  const c = (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const [cx, cy] = c(focusEl);
  const v = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
  let best = null, bestScore = Infinity;
  list.forEach((e) => {
    if (e === focusEl) return;
    const [x, y] = c(e), dx = x - cx, dy = y - cy;
    const along = dx * v[0] + dy * v[1];
    if (along <= 4) return;
    const across = Math.abs(dx * v[1]) + Math.abs(dy * v[0]);
    const score = along + across * 2.2;
    if (score < bestScore) { bestScore = score; best = e; }
  });
  if (best) { setFocus(best); if (best.dataset.char || best.dataset.map) best.click(); }
}
function goBack() {
  if (state.paused) return resume();
  const back = $('screen').querySelector('[data-act="back"]');
  if (back) return back.click();
  if ($('screen').querySelector('[data-act="again"]')) return showMenu();
  if ($('screen').querySelector('[data-char]')) return showMenu();
}
let padWas = false;
function gpTick() {
  const ev = pollPad();
  if (pad.active !== padWas) {
    padWas = pad.active;
    toast(pad.active ? '🎮 שלט מחובר' : 'השלט נותק');
    if (!pad.active) setFocus(null);
  }
  if (pad.active) {
    if (state.mode === 'fight' && !state.paused) { if (ev.start) pause(); }
    else if (state.mode === 'fight' && state.paused) {
      if (ev.start || ev.back) resume();
      else { if (ev.nav) moveFocus(ev.nav); if (ev.confirm) (focusEl && focusEl.isConnected ? focusEl : focusables()[0])?.click(); }
    } else if (state.mode === 'menu' || state.mode === 'results') {
      if (ev.nav) moveFocus(ev.nav);
      if (ev.confirm) {
        const el = focusEl && focusEl.isConnected ? focusEl : null;
        if (el) el.click(); else moveFocus('down');
      }
      if (ev.back) goBack();
      if (ev.start) { const go = $('screen').querySelector('[data-act="go"],[data-act="story"],[data-act="again"]'); go?.click(); }
    }
  }
  requestAnimationFrame(gpTick);
}

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
  requestAnimationFrame(gpTick);
}
