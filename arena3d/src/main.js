import * as THREE from 'three';
import { buildWorld, Effects } from './world.js';
import { loadCharacter, modelIds } from './rig.js';
import { Fighter, angleDiff } from './fighter.js';
import { initInput, currentMove, pressed } from './input.js';
import { makeBot } from './ai.js';

const $ = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(55, 2, 0.1, 200);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const CHARS = { toph: { label: 'טוף', icon: '🪨' }, blue: { label: 'האיש הכחול', icon: '🔵', lock: true } };
let sel = 'toph', sources = {}, fx, state = { running: false, paused: false, time: 180, over: false };
let me, cpu, bot, camPos = new THREE.Vector3(0, 4, 9), camLook = new THREE.Vector3(), shake = 0, camFwd = new THREE.Vector3(0, 0, -1);
const clock = new THREE.Clock();

function gems(el, n) { el.innerHTML = Array.from({ length: 3 }, (_, i) => `<b class="${i < n ? '' : 'off'}"></b>`).join(''); }
function banner(text, ms = 1100) { const b = $('banner'); b.textContent = text; b.style.opacity = 1; clearTimeout(banner.t); banner.t = setTimeout(() => (b.style.opacity = 0), ms); }
function hud() {
  $('hp1').style.width = (me.hp / me.maxHp * 100) + '%'; $('hp2').style.width = (cpu.hp / cpu.maxHp * 100) + '%';
  gems($('g1'), me.lives); gems($('g2'), cpu.lives);
  const t = Math.max(0, Math.ceil(state.time)); $('timer').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  $('cd-x').style.setProperty('--p', (me.cdSpecial / 4 * 100) + '%');
}

function menu() {
  $('chars').innerHTML = Object.entries(CHARS).map(([id, c]) => `<div class="card ${id === sel ? 'sel' : ''} ${c.lock ? 'lock' : ''}" data-id="${id}"><div style="font-size:42px">${c.icon}</div>${c.label}${c.lock ? '<div style="font-size:11px;opacity:.7">בקרוב</div>' : ''}</div>`).join('');
  document.querySelectorAll('.card').forEach((el) => el.addEventListener('click', () => { if (CHARS[el.dataset.id].lock) return; sel = el.dataset.id; menu(); }));
}

function spawn() {
  [me, cpu].forEach((f) => f && scene.remove(f.group, f.shadow));
  me = new Fighter(sel, sources[sel], { name: CHARS[sel].label, human: true });
  cpu = new Fighter(sel, sources[sel], { hueShift: 0.55, name: 'CPU' });   // אותו מודל בצבע אחר, עד שיהיה מודל שני
  scene.add(me.group, me.shadow, cpu.group, cpu.shadow);
  bot = makeBot(3);
  roundReset();
  $('n1').textContent = me.name; $('n2').textContent = cpu.name;
}
function roundReset() { me.reset(-3, 3, Math.PI * 0.75); cpu.reset(3, -3, -Math.PI * 0.25); }

function startMatch() {
  spawn(); state = { running: true, paused: false, time: 180, over: false, koT: 0 };
  $('menu').classList.add('hidden'); $('over').classList.add('hidden'); banner('FIGHT!', 900);
}
function endMatch(win) {
  state.over = true; state.running = false; $('over').classList.remove('hidden');
  $('over-t').textContent = win ? 'ניצחת!' : 'הפסדת'; $('over-s').textContent = `חיים: ${me.lives} - ${cpu.lives}`;
}

function worldMove() {            // ממירים את הג'ויסטיק לכיוון בעולם, ביחס למצלמה
  const m = currentMove(); if (!m.x && !m.y) return { x: 0, z: 0 };
  const f = new THREE.Vector3(camFwd.x, 0, camFwd.z).normalize(), r = new THREE.Vector3(-f.z, 0, f.x);   // r: ימין המסך
  return { x: f.x * m.y + r.x * m.x, z: f.z * m.y + r.z * m.x };
}

function updateCamera(dt) {
  // מצלמה "נעולה": מאחורי השחקן על הקו שבין היריב לשחקן, מביטה לכיוון היריב
  const dx = me.pos.x - cpu.pos.x, dz = me.pos.z - cpu.pos.z, d = Math.hypot(dx, dz) || 1;
  const bx = dx / d, bz = dz / d, dist = THREE.MathUtils.clamp(5.6 + d * 0.2, 6, 8);
  const sideX = -bz * 1.9, sideZ = bx * 1.9;      // מצלמת כתף: קצת לצד כדי שלא נסתיר את היריב
  const want = new THREE.Vector3(me.pos.x + bx * dist + sideX, 3.4 + d * 0.07, me.pos.z + bz * dist + sideZ);
  const c = Math.hypot(want.x, want.z); if (c > 14) { want.x *= 14 / c; want.z *= 14 / c; }
  camPos.lerp(want, Math.min(1, dt * 4));
  const target = new THREE.Vector3(me.pos.x - bx * Math.min(d, 6) * 0.5, 1.0, me.pos.z - bz * Math.min(d, 6) * 0.5);
  camLook.lerp(target, Math.min(1, dt * 6));
  cam.position.copy(camPos);
  if (shake > 0) { cam.position.x += (Math.random() - 0.5) * shake; cam.position.y += (Math.random() - 0.5) * shake; shake = Math.max(0, shake - dt * 2.4); }
  cam.lookAt(camLook);
  camFwd.set(camLook.x - camPos.x, 0, camLook.z - camPos.z).normalize();
}

function handleEvents(f, foe) {
  for (const e of f.events) {
    if (typeof e === 'object' && e.type === 'wave') { fx.wave(e.x, e.z, e.r); shake = Math.max(shake, 0.35); }
    if (typeof e === 'object' && e.type === 'hit') { fx.spark(new THREE.Vector3(f.pos.x, 1.2, f.pos.z), e.heavy); shake = Math.max(shake, e.heavy ? 0.4 : 0.15); }
    if (typeof e === 'object' && e.type === 'ko') { state.koT = 1.8; state.koFor = f; shake = 0.5; }
  }
}

function step(dt) {
  if (!state.running || state.paused) return;
  state.time -= dt;
  const mv = worldMove();
  const myCmd = { x: mv.x, z: mv.z, attack: pressed('attack'), jump: pressed('jump'), special: pressed('special') };
  me.update(dt, myCmd, cpu); cpu.update(dt, bot(dt, cpu, me), me);
  handleEvents(me, cpu); handleEvents(cpu, me);
  if (state.koT > 0) {
    state.koT -= dt;
    if (state.koT <= 0) {
      const loser = state.koFor; loser.lives -= 1; state.koFor = null;
      if (loser.lives <= 0) { endMatch(loser === cpu); return; }
      banner(loser === me ? 'KO' : 'KO!', 900); roundReset();
    }
  }
  if (state.time <= 0) endMatch(me.hp + me.lives * 100 >= cpu.hp + cpu.lives * 100);
}

function loop() {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  step(dt);
  if (me && cpu) { updateCamera(dt); hud(); } else { cam.position.set(0, 6, 12); cam.lookAt(0, 0.5, 0); }
  fx?.update(dt);
  renderer.render(scene, cam);
  requestAnimationFrame(loop);
}

async function boot() {
  initInput(document.getElementById('app'));
  menu();
  await buildWorld(scene);
  fx = new Effects(scene);
  for (const id of modelIds()) sources[id] = await loadCharacter(id);
  const b = $('start'); b.disabled = false; b.textContent = 'התחל קרב'; b.onclick = startMatch;
  $('again').onclick = startMatch;
  $('pausebtn').onclick = () => { state.paused = !state.paused; banner(state.paused ? 'PAUSE' : '', state.paused ? 1e9 : 10); };
  window.__game = { get me() { return me; }, get cpu() { return cpu; }, get state() { return state; }, scene, cam, startMatch };
  loop();
}
boot().catch((e) => { console.error(e); document.getElementById('start').textContent = 'שגיאה בטעינה'; });
