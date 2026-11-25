import * as THREE from 'three';
import { buildWorld, Effects } from './world.js';
import { loadCharacter, modelIds } from './rig.js';
import { Fighter } from './fighter.js';
import { initInput, currentMove, pressed, held, joyDir } from './input.js';
import { makeBot } from './ai.js';
import { MOVES, DIRS, DEFENSE, ELEMENT } from './moves.js';

const $ = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(55, 2, 0.1, 200);
let quality = 'high'; try { quality = localStorage.getItem('a3d_q') || 'high'; } catch { /* ignore */ }
function applyQuality() { renderer.setPixelRatio(quality === 'low' ? 1 : Math.min(devicePixelRatio || 1, 2)); resize(); $('gfx').textContent = 'גרפיקה: ' + (quality === 'low' ? 'נמוכה' : 'גבוהה'); }
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', resize);

const ROSTER = [{ id: 'toph', label: 'טוף' }, { id: 'zuko', label: 'זוקו' }];
const balls = [], timers = [];
let selIdx = 0, sources = {}, fx, me, cpu, bot, menuFighter, podium;
let state = { mode: 'boot', paused: false, time: 180, over: false, koT: 0, hitstop: 0 };
let camPos = new THREE.Vector3(0, 4, 9), camLook = new THREE.Vector3(), shake = 0, camFwd = new THREE.Vector3(0, 0, -1), menuT = 0;
const clock = new THREE.Clock();
const sel = () => ROSTER[selIdx].id;
const later = (delay, fn) => timers.push({ t: delay, fn });
function flash(op = 0.7) { const f = $('flash'); f.style.transition = 'none'; f.style.opacity = op; requestAnimationFrame(() => { f.style.transition = 'opacity .35s'; f.style.opacity = 0; }); }

function gems(el, n) { el.innerHTML = Array.from({ length: 3 }, (_, i) => `<b class="${i < n ? '' : 'off'}"></b>`).join(''); }
function banner(text, ms = 1100) { const b = $('banner'); b.textContent = text; b.style.opacity = text ? 1 : 0; clearTimeout(banner.t); if (text && ms < 1e8) banner.t = setTimeout(() => (b.style.opacity = 0), ms); }
function hud() {
  for (const [el, f] of [[$('pct1'), me], [$('pct2'), cpu]]) { el.textContent = Math.floor(f.pct) + '%'; el.style.color = `hsl(${Math.max(0, 60 - f.pct * 0.45)} 95% ${f.pct > 120 ? 52 : 62}%)`; }
  gems($('g1'), me.lives); gems($('g2'), cpu.lives);
  const t = Math.max(0, Math.ceil(state.time)); $('timer').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  $('cd-x').style.setProperty('--p', me.ult + '%'); $('btn-x').classList.toggle('ready', me.ult >= 100);
}

// ---------- מסך בית ----------
function joyIcon(dir) { return `<span class="joy ${dir}"><b></b></span>`; }
function cardHTML(id) {
  const mv = MOVES[id], el = ELEMENT[id];
  return `<h2>${ROSTER.find((r) => r.id === id).label}</h2><div class="el">יסוד: ${el.name}</div><div class="mv">${mv.slice(0, 5).map((m) => `<i title="${m.name}">${m.icon}</i>`).join('')}<i class="ult" title="${mv[5].name}">${mv[5].icon}</i></div>`;
}
function showMenu() {
  state.mode = 'menu'; state.over = false; state.paused = false;
  [me, cpu].forEach((f) => f && scene.remove(f.group, f.shadow)); me = cpu = null;
  balls.forEach((b) => scene.remove(b.mesh)); balls.length = 0; timers.length = 0;
  $('hud').style.display = 'none'; ['over', 'pause', 'howto'].forEach((i) => $(i).classList.add('hidden')); $('menu').classList.remove('hidden');
  setMenuFighter(); banner('', 1);
}
function setMenuFighter() {
  if (menuFighter) scene.remove(menuFighter.group, menuFighter.shadow);
  menuFighter = new Fighter(sel(), sources[sel()], { name: sel() }); menuFighter.reset(0, 0, 0); scene.add(menuFighter.group, menuFighter.shadow);
  if (!podium) { podium = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 0.25, 40), new THREE.MeshStandardMaterial({ color: 0x1d2633, roughness: 0.6, metalness: 0.4, emissive: 0x0a1018 })); podium.position.y = -0.125; scene.add(podium); }
  podium.visible = true; menuFighter.group.position.y = 0;
  const el = ELEMENT[sel()]; $('card').style.setProperty('--acc', el.color); $('card').innerHTML = cardHTML(sel());
}
function howtoHTML(id) {
  const mv = MOVES[id], row = (dir, btn, name) => `<div class="ht-row">${joyIcon(dir)}<span class="ab">${btn}</span><span class="nm">${name}</span></div>`;
  const atk = DIRS.map((d, i) => row(d, 'A', mv[i].name)).join('');
  const def = [row('none', 'B', 'חסימה (להחזיק)'), ...['right', 'left', 'down', 'up'].map((d) => row(d, 'B', DEFENSE[d].name))].join('');
  return `<h1>איך משחקים</h1>
    <div class="ht-grid" style="margin-top:10px"><div class="ht-row">${joyIcon('none')}<span class="nm">תזוזה</span></div><div class="ht-row"><span class="ab">A</span><span class="nm">תקיפה</span></div><div class="ht-row" style="grid-column:1/3"><span class="ab">B</span><span class="nm">הגנה</span></div></div>
    <div class="ht-grid"><div>${atk}</div><div>${def}</div></div>
    <div class="ht-row" style="margin-top:10px"><span class="ab" style="border-color:#f0b429">X</span><span class="nm">אולטימטיבית: ${mv[5].name} (נטענת בקרב)</span></div>
    <p style="font-size:12px;opacity:.75;margin-top:6px">המטרה: להעיף את היריב מהזירה! ככל שהאחוז גבוה יותר הוא עף רחוק יותר. אם עפת החוצה: לחץ B באוויר לקפיצת חזרה. למעלה = לכיוון היריב, למטה = לאחור.</p>
    <button class="go" id="ht-go" type="button">הבנתי</button>`;
}
function showHowto(then) {
  $('howto').innerHTML = howtoHTML(sel()); $('howto').classList.remove('hidden');
  $('ht-go').onclick = () => { $('howto').classList.add('hidden'); try { localStorage.setItem('a3d_seen', '1'); } catch { /* ignore */ } then && then(); };
}
function menuFrame(dt) {
  menuT += dt;
  const a = menuT * 0.22, R = 6.4;
  cam.position.set(Math.sin(a) * R, 2.3, Math.cos(a) * R); cam.lookAt(0, 1.05, 0);
  menuFighter.yaw = menuT * 0.55; menuFighter.update(dt, { x: 0, z: 0, dir: 'none' }, null);
}

// ---------- קרב ----------
function spawn() {
  if (menuFighter) { scene.remove(menuFighter.group, menuFighter.shadow); menuFighter = null; }
  if (podium) podium.visible = false;
  const foeId = sel() === 'toph' ? 'zuko' : 'toph';
  me = new Fighter(sel(), sources[sel()], { name: ROSTER[selIdx].label, human: true });
  cpu = new Fighter(foeId, sources[foeId], { name: 'CPU · ' + ROSTER.find((r) => r.id === foeId).label });
  scene.add(me.group, me.shadow, cpu.group, cpu.shadow);
  bot = makeBot(3); roundReset();
  $('n1').textContent = me.name; $('n2').textContent = cpu.name;
  const m = MOVES[sel()]; $('btn-a').innerHTML = '<span style="font-size:15px">A</span>'; $('btn-x').firstChild.textContent = m[5].icon;
}
function roundReset(loser) { me.reset(-3, 3, Math.PI * 0.75); cpu.reset(3, -3, -Math.PI * 0.25); if (loser) loser.pct = 0; }
function startMatch() {
  spawn(); state = { mode: 'match', paused: false, time: 180, over: false, koT: 0, hitstop: 0 };
  $('menu').classList.add('hidden'); $('over').classList.add('hidden'); $('pause').classList.add('hidden'); $('hud').style.display = ''; banner('FIGHT!', 900);
}
function endMatch(win) {
  state.over = true; $('over').classList.remove('hidden');
  $('over-t').textContent = win ? 'ניצחת!' : 'הפסדת'; $('over-s').textContent = `חיים: ${me.lives} - ${cpu.lives}`;
}
function worldMove() {            // הג'ויסטיק -> כיוון בעולם, ביחס למצלמה
  const m = currentMove(); if (!m.x && !m.y) return { x: 0, z: 0 };
  const f = new THREE.Vector3(camFwd.x, 0, camFwd.z).normalize(), r = new THREE.Vector3(-f.z, 0, f.x);
  return { x: f.x * m.y + r.x * m.x, z: f.z * m.y + r.z * m.x };
}
function updateCamera(dt) {
  const dx = me.pos.x - cpu.pos.x, dz = me.pos.z - cpu.pos.z, d = Math.hypot(dx, dz) || 1;
  const bx = dx / d, bz = dz / d, dist = THREE.MathUtils.clamp(5.6 + d * 0.2, 6, 8);
  const want = new THREE.Vector3(me.pos.x + bx * dist - bz * 1.9, 3.4 + d * 0.07, me.pos.z + bz * dist + bx * 1.9);
  const c = Math.hypot(want.x, want.z); if (c > 14) { want.x *= 14 / c; want.z *= 14 / c; }
  camPos.lerp(want, Math.min(1, dt * 4));
  camLook.lerp(new THREE.Vector3(me.pos.x - bx * Math.min(d, 6) * 0.5, 1.0, me.pos.z - bz * Math.min(d, 6) * 0.5), Math.min(1, dt * 6));
  cam.position.copy(camPos);
  if (shake > 0) { cam.position.x += (Math.random() - 0.5) * shake; cam.position.y += (Math.random() - 0.5) * shake; shake = Math.max(0, shake - dt * 2.4); }
  cam.lookAt(camLook); camFwd.set(camLook.x - camPos.x, 0, camLook.z - camPos.z).normalize();
}
const hexOf = (f) => (f && ELEMENT[f.id] ? ELEMENT[f.id].hex : 0xffffff);
function damageNear(owner, foe, x, z, r, dmg, kb, heavy) {
  if (!foe || !foe.alive) return;
  const dx = foe.pos.x - x, dz = foe.pos.z - z, d = Math.hypot(dx, dz);
  if (d <= r && foe.pos.y < 1.6) foe.hurt(dmg, dx / (d || 1), dz / (d || 1), kb, owner, heavy);
}
function handleEvents(f, foe) {
  const evs = f.events.splice(0);
  for (const e of evs) {
    switch (e.type) {
      case 'start': if (e.idx === 5) { banner(e.move.name, 900); shake = Math.max(shake, 0.15); } break;
      case 'punch': fx.punch(e.x, e.y, e.z, ELEMENT[f.id].glow); break;
      case 'hit': fx.spark(new THREE.Vector3(f.pos.x, f.pos.y + 1.2, f.pos.z), e.heavy, hexOf(e.from)); shake = Math.max(shake, e.soft ? 0.05 : (e.heavy ? 0.4 : 0.15) + Math.min(0.3, e.pct / 400)); if (e.heavy || e.pct > 100) state.hitstop = 0.06; break;
      case 'block': fx.punch(f.pos.x, 1.2, f.pos.z, 0x9fd0ff); fx.dust(f.pos.x, f.pos.z, 3, 0.6); shake = Math.max(shake, 0.08); break;
      case 'dodge': fx.dust(f.pos.x, f.pos.z, 7, 0.9); break;
      case 'wave': fx.wave(e.x, e.z, e.r); shake = Math.max(shake, 0.35); break;
      case 'firering': fx.firering(e.x, e.z, e.r); shake = Math.max(shake, 0.3); break;
      case 'sweep': fx.sweep(e.x, e.z, e.yaw); break;
      case 'flame': fx.flame(e.x, e.y, e.z, e.dx, e.dz, e.n, e.big); break;
      case 'proj': balls.push({ kind: e.kind, mesh: e.kind === 'boulder' ? fx.boulder() : fx.fireball(), x: e.x, y: e.y, z: e.z, dx: e.dx, dz: e.dz, speed: e.speed, dmg: e.dmg, kb: e.kb, owner: f, foe, life: 1.6, tr: 0 }); break;
      case 'pillar': fx.pillar(e.x, e.z); shake = Math.max(shake, 0.2); later(0.2, () => damageNear(f, foe, e.x, e.z, 1.5, e.dmg, e.kb, true)); break;
      case 'meteor': fx.ring(e.x, e.z, e.r, 0xff5a2a, 0.8); fx.meteor(e.x, e.z, e.r, () => { fx.wave(e.x, e.z, e.r * 1.2); fx.burst({ x: e.x, y: 0.6, z: e.z }, 24, 0xffaa55); flash(0.45); shake = 0.7; damageNear(f, foe, e.x, e.z, e.r, e.dmg, e.kb, true); }); break;
      case 'lightning': fx.ring(e.x, e.z, e.r, 0x9fd0ff, 0.4); later(0.4, () => { fx.lightning(e.x, e.z); flash(0.85); shake = 0.6; state.hitstop = 0.08; damageNear(f, foe, e.x, e.z, e.r, e.dmg, e.kb, true); }); break;
      case 'ko': state.koT = 1.3; state.koFor = f; shake = 0.5; banner('OUT!', 900); break;
      case 'airjump': fx.dust(f.pos.x, f.pos.z, 4, 0.5, 0xcfe6ff); break;
      default: break;
    }
  }
}
function step(dt) {
  if (state.mode !== 'match' || state.paused || state.over) return;
  if (state.hitstop > 0) { state.hitstop -= dt; return; }
  state.time -= dt;
  for (let i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { const fn = timers[i].fn; timers.splice(i, 1); fn(); } }
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i]; b.life -= dt; b.x += b.dx * b.speed * dt; b.z += b.dz * b.speed * dt; b.mesh.position.set(b.x, b.y, b.z);
    if (b.kind === 'boulder') b.mesh.rotation.x += dt * 9; b.tr -= dt; if (b.tr <= 0) { b.kind === 'boulder' ? fx.dust(b.x, b.z, 1, 0.3) : fx.trail(b.mesh.position); b.tr = 0.04; }
    const t = b.foe, hitFoe = t.alive && Math.hypot(t.pos.x - b.x, t.pos.z - b.z) < 0.95 && Math.abs(t.pos.y + 1 - b.y) < 1.5;
    if (hitFoe) t.hurt(b.dmg, b.dx, b.dz, b.kb, b.owner, true);
    if (hitFoe || b.life <= 0 || Math.hypot(b.x, b.z) > 11) { if (hitFoe) { b.kind === 'boulder' ? (fx.dust(b.x, b.z, 8, 1), fx.spark(b.mesh.position, true, 0xc9b27d)) : fx.burst(b.mesh.position); shake = Math.max(shake, 0.35); } scene.remove(b.mesh); balls.splice(i, 1); }
  }
  const mv = worldMove(), dir = joyDir();
  me.update(dt, { x: mv.x, z: mv.z, dir, a: pressed('a'), b: pressed('b'), bHold: held('b'), ult: pressed('ult') }, cpu);
  cpu.update(dt, bot(dt, cpu, me), me);
  for (let n = 0; n < 3; n++) { handleEvents(me, cpu); handleEvents(cpu, me); }
  if (state.koT > 0) {
    state.koT -= dt;
    if (state.koT <= 0) {
      const loser = state.koFor; loser.lives -= 1; state.koFor = null;
      if (loser.lives <= 0) { endMatch(loser === cpu); return; }
      roundReset(loser); balls.forEach((b) => scene.remove(b.mesh)); balls.length = 0;
    }
  }
  if (state.time <= 0) endMatch(me.lives * 1000 - me.pct >= cpu.lives * 1000 - cpu.pct);
}
function loop() {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  step(dt);
  if (state.mode === 'match' && me && cpu) { updateCamera(dt); hud(); }
  else if (state.mode === 'menu' && menuFighter) menuFrame(dt);
  else { cam.position.set(0, 6, 12); cam.lookAt(0, 0.5, 0); }
  fx?.update(dt);
  renderer.render(scene, cam);
  requestAnimationFrame(loop);
}

async function boot() {
  initInput($('app')); applyQuality();
  await buildWorld(scene); fx = new Effects(scene);
  for (const id of modelIds()) sources[id] = await loadCharacter(id);
  window.__game = { get me() { return me; }, get cpu() { return cpu; }, get state() { return state; }, scene, cam, startMatch, showMenu, sel: (i) => { selIdx = i; setMenuFighter(); }, fx: () => fx };
  $('prev').onclick = () => { selIdx = (selIdx + ROSTER.length - 1) % ROSTER.length; setMenuFighter(); };
  $('next').onclick = () => { selIdx = (selIdx + 1) % ROSTER.length; setMenuFighter(); };
  $('gfx').onclick = () => { quality = quality === 'low' ? 'high' : 'low'; try { localStorage.setItem('a3d_q', quality); } catch { /* ignore */ } applyQuality(); };
  $('howbtn').onclick = () => showHowto();
  const b = $('start'); b.disabled = false; b.textContent = 'התחל קרב';
  let seen = false; try { seen = !!localStorage.getItem('a3d_seen'); } catch { /* ignore */ }
  b.onclick = () => (seen ? startMatch() : (seen = true, showHowto(startMatch)));
  $('again').onclick = startMatch; $('home1').onclick = showMenu; $('home2').onclick = showMenu;
  $('resume').onclick = () => { state.paused = false; $('pause').classList.add('hidden'); };
  $('pausebtn').onclick = () => { if (state.mode !== 'match' || state.over) return; state.paused = true; $('pause').classList.remove('hidden'); };
  showMenu(); loop();
}
boot().catch((e) => { console.error(e); document.getElementById('start').textContent = 'שגיאה בטעינה'; });
