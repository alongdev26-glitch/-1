// לוחם: מצב, פיזיקה על הרצפה, מערכת מכות כללית (moves.js), ובחירת פריים אנימציה.
import * as THREE from 'three';
import { ANIMS } from './anims.js';
import { createRig } from './rig.js';
import { MOVES, DIRS } from './moves.js';

export const ARENA_R = 8.4;
const SPEED = 4.6, GRAV = 24, JUMP_V = 9;
const frame = (arr, t01) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(t01 * arr.length)))];

export class Fighter {
  constructor(id, src, { hueShift = 0, name = id, human = false } = {}) {
    this.id = id; this.name = name; this.human = human;
    this.moves = MOVES[id]; this.cd = this.moves.map(() => 0);
    this.rig = createRig(id, src, { hueShift });
    this.group = new THREE.Group();
    this.pivot = new THREE.Group(); this.pivot.rotation.order = 'YXZ'; this.pivot.position.y = 0.85;   // ציר סיבוב בגובה האגן (גלגול/סלטה)
    this.rig.wrap.position.y = -0.85; this.pivot.add(this.rig.wrap); this.group.add(this.pivot);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.45, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0; this.yawVis = 0;
    this.maxHp = 100; this.hp = 100; this.lives = 3; this.ult = 0;
    this.state = 'idle'; this.t = 0; this.stun = 0; this.walkPhase = 0; this.koT = 0; this.flash = 0;
    this.cur = null; this.hitDone = false; this.tick = 0; this.dashHit = false; this.events = []; this.inv = 0; this.dodge = null; this.blocking = false;
  }
  reset(x, z, yaw) {
    this.pos.set(x, 0, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.yawVis = yaw; this.hp = this.maxHp; this.state = 'idle'; this.t = 0; this.stun = 0;
    this.cd = this.moves.map(() => 0); this.koT = 0; this.cur = null; this.events.length = 0; this.inv = 0; this.dodge = null; this.blocking = false;
  }
  get alive() { return this.state !== 'ko'; }
  get grounded() { return this.pos.y <= 0.001; }
  dir() { return { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }; }

  // cmd: { x, z (כיוון תנועה בעולם), a, b (לחיצות), bHold, ult, dir ('none'|'right'|'left'|'down'|'up') }
  update(dt, cmd, foe) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt); this.inv = Math.max(0, this.inv - dt);
    this.cd = this.cd.map((c) => Math.max(0, c - dt));
    this.ult = Math.min(100, this.ult + dt * 1.1);
    if (this.state === 'ko') { this.koT += dt; this.pos.addScaledVector(this.vel, dt); this.vel.multiplyScalar(0.9); this._apply(); return; }
    const busy = this.state === 'move' || this.state === 'hit' || this.state === 'dodge';
    this.blocking = this.state === 'block';
    const toFoe = foe ? Math.atan2(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z) : this.yaw;
    if (this.state === 'hit') { this.stun -= dt; if (this.stun <= 0) { this.state = 'idle'; this.t = 0; } }
    if (!busy) {
      const mv = Math.hypot(cmd.x, cmd.z), dir = cmd.dir || 'none';
      const grounded = this.grounded;
      if (cmd.bHold && dir === 'none' && grounded && !cmd.a) {                       // חסימה (B מוחזק)
        this.state = 'block'; this.vel.x *= 0.5; this.vel.z *= 0.5;
      } else {
        if (this.state === 'block') { this.state = 'idle'; this.t = 0; }
        if (mv > 0.05 && !cmd.a && !cmd.b) { this.vel.x = cmd.x * SPEED; this.vel.z = cmd.z * SPEED; this.walkPhase += dt * 9 * Math.min(1, mv); this.state = grounded ? 'walk' : 'air'; }
        else { this.vel.x *= 0.6; this.vel.z *= 0.6; if (grounded && this.state !== 'air') this.state = 'idle'; }
      }
      if (this.state !== 'block') this.yaw = lerpAngle(this.yaw, toFoe, Math.min(1, dt * 10));
      if (cmd.ult && this._tryMove(5)) { /* אולט */ }
      else if (cmd.a && grounded) this._tryMove(Math.max(0, DIRS.indexOf(dir)));
      else if (cmd.b && dir !== 'none' && grounded) this._tryDefense(dir);
    } else {
      this.vel.x *= this.state === 'dodge' ? 0.97 : 0.88; this.vel.z *= this.state === 'dodge' ? 0.97 : 0.88;
      if (this.state === 'move') this._runMove(dt, foe);
      if (this.state === 'dodge') this._runDodge(dt);
    }
    if (!this.grounded || this.vel.y > 0) { this.vel.y -= GRAV * dt; if (this.state === 'walk' || this.state === 'idle') this.state = 'air'; }
    this.pos.addScaledVector(this.vel, dt);
    if (this.pos.y <= 0) { this.pos.y = 0; if (this.vel.y < 0) { this.vel.y = 0; if (this.state === 'air') { this.state = 'idle'; this.t = 0; } } }
    const d = Math.hypot(this.pos.x, this.pos.z);
    if (d > ARENA_R) { this.pos.x *= ARENA_R / d; this.pos.z *= ARENA_R / d; }
    if (foe && foe.alive) {
      const dx = this.pos.x - foe.pos.x, dz = this.pos.z - foe.pos.z, dist = Math.hypot(dx, dz), min = 0.85;
      if (dist < min && dist > 0.001) { const push = (min - dist) / 2; this.pos.x += dx / dist * push; this.pos.z += dz / dist * push; foe.pos.x -= dx / dist * push; foe.pos.z -= dz / dist * push; }
    }
    this._apply();
  }

  _tryDefense(dir) {
    const f = this.dir(), r = { x: -f.z, z: f.x };
    if (dir === 'right' || dir === 'left') {                  // קפיצה לצד
      const sg = dir === 'right' ? 1 : -1; this.vel.set(r.x * 7 * sg, 7.5, r.z * 7 * sg); this.state = 'air'; this.inv = 0.3;
    } else if (dir === 'down') { this.vel.set(-f.x * 6, 9.5, -f.z * 6); this.state = 'dodge'; this.dodge = { kind: 'back', t: 0, dur: 0.75 }; this.inv = 0.5; }
    else { this.vel.set(f.x * 9, 0, f.z * 9); this.state = 'dodge'; this.dodge = { kind: 'roll', t: 0, dur: 0.5 }; this.inv = 0.45; }
    this.events.push({ type: 'dodge', dir });
  }
  _runDodge(dt) {
    const d = this.dodge; d.t += dt;
    if (d.t >= d.dur && this.grounded) { this.state = 'idle'; this.t = 0; this.dodge = null; }
    else if (d.t >= d.dur + 0.4) { this.state = 'idle'; this.dodge = null; }
  }
  _tryMove(i) {
    const mv = this.moves[i];
    if (!mv || this.cd[i] > 0 || (i === 4 && this.ult < 100)) return false;
    this.state = 'move'; this.cur = mv; this.curIdx = i; this.t = 0; this.hitDone = false; this.tick = 0; this.dashHit = false;
    this.cd[i] = mv.cd; if (i === 4) this.ult = 0;
    this.events.push({ type: 'start', idx: i, move: mv });
    return true;
  }
  _runMove(dt, foe) {
    const mv = this.cur, p = this.t / mv.dur, d = this.dir();
    if (mv.kind !== 'flamekick') { const toFoe = foe ? Math.atan2(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z) : this.yaw; this.yaw = lerpAngle(this.yaw, toFoe, Math.min(1, dt * 6)); }
    if (!this.hitDone && p >= mv.hitAt) { this.hitDone = true; this._fire(mv, foe, d); }
    if (mv.kind === 'flamekick' && p >= mv.hitAt - 0.15 && p < 0.85) {          // זינוק קדימה עם זנב אש, פוגע במגע
      this.vel.x = d.x * 12; this.vel.z = d.z * 12;
      this.events.push({ type: 'flame', x: this.pos.x, y: 0.5, z: this.pos.z, dx: -d.x, dz: -d.z, n: 2, big: true });
      if (foe && foe.alive && !this.dashHit && Math.hypot(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z) < 1.3) { this.dashHit = true; foe.hurt(mv.dmg, d.x, d.z, mv.kb, this, true); this.vel.x *= 0.3; this.vel.z *= 0.3; }
    }
    if (mv.kind === 'flamethrower' && p >= mv.hitAt && p < 0.95) {              // חרוט להבות: נזק מתמשך
      this.events.push({ type: 'flame', x: this.pos.x + d.x * 0.6, y: 1.1, z: this.pos.z + d.z * 0.6, dx: d.x, dz: d.z, n: 3 });
      this.tick -= dt;
      if (this.tick <= 0) { this.tick = 0.12; this._cone(foe, mv.range, 0.55, mv.dmg, d, mv.kb); }
    }
    if (p >= 1) { this.state = 'idle'; this.t = 0; this.cur = null; }
  }
  _cone(foe, range, arc, dmg, d, kb) {
    if (!foe || !foe.alive) return;
    const dx = foe.pos.x - this.pos.x, dz = foe.pos.z - this.pos.z, dist = Math.hypot(dx, dz) || 1;
    const ang = Math.abs(angleDiff(Math.atan2(dx, dz), this.yaw));
    if (dist <= range && ang <= arc) foe.hurt(dmg, dx / dist, dz / dist, kb, this, false, true);
  }
  _fire(mv, foe, d) {
    const here = { x: this.pos.x, z: this.pos.z };
    switch (mv.kind) {
      case 'melee': {
        if (!foe || !foe.alive) break;
        const dx = foe.pos.x - here.x, dz = foe.pos.z - here.z, dist = Math.hypot(dx, dz);
        if (dist <= 1.9 && Math.abs(angleDiff(Math.atan2(dx, dz), this.yaw)) <= 1.2 && Math.abs(foe.pos.y - this.pos.y) < 1.4) foe.hurt(mv.dmg, dx / dist, dz / dist, mv.kb, this);
        this.events.push({ type: 'punch', x: here.x + d.x * 1.0, y: 1.2, z: here.z + d.z * 1.0 });
        break;
      }
      case 'sweep': {
        this.events.push({ type: 'sweep', x: here.x + d.x * 1.0, z: here.z + d.z * 1.0, yaw: this.yaw });
        this._cone(foe, mv.range, 1.0, mv.dmg, d, mv.kb);
        break;
      }
      case 'firering':
        this.events.push({ type: 'firering', x: here.x, z: here.z, r: mv.radius });
        if (foe && foe.alive) { const dx = foe.pos.x - here.x, dz = foe.pos.z - here.z, dist = Math.hypot(dx, dz); if (dist <= mv.radius && foe.pos.y < 1.2) foe.hurt(mv.dmg, dx / (dist || 1), dz / (dist || 1), mv.kb, this, true); }
        break;
      case 'quake':
        this.events.push({ type: 'wave', x: here.x, z: here.z, r: mv.radius });
        if (foe && foe.alive) { const dx = foe.pos.x - here.x, dz = foe.pos.z - here.z, dist = Math.hypot(dx, dz); if (dist <= mv.radius && foe.pos.y < 1.2) foe.hurt(mv.dmg, dx / (dist || 1), dz / (dist || 1), mv.kb, this, true); }
        break;
      case 'fireball': case 'boulder':
        this.events.push({ type: 'proj', kind: mv.kind, x: here.x + d.x * 0.9, y: 1.1 + this.pos.y, z: here.z + d.z * 0.9, dx: d.x, dz: d.z, speed: mv.speed, dmg: mv.dmg, kb: mv.kb });
        break;
      case 'pillar': {
        const x = here.x + d.x * 2.2, z = here.z + d.z * 2.2;
        this.events.push({ type: 'pillar', x, z, dmg: mv.dmg, kb: mv.kb, dx: d.x, dz: d.z });
        break;
      }
      case 'meteor':
        if (foe) this.events.push({ type: 'meteor', x: foe.pos.x, z: foe.pos.z, r: mv.radius, dmg: mv.dmg, kb: mv.kb });
        break;
      case 'lightning':
        if (foe) this.events.push({ type: 'lightning', x: foe.pos.x, z: foe.pos.z, r: mv.radius, dmg: mv.dmg, kb: mv.kb });
        break;
      default: break;
    }
  }
  hurt(dmg, nx, nz, kb, from, heavy = false, soft = false) {
    if (!this.alive || this.inv > 0) return;
    if (this.state === 'block') {                                       // חסימה: נזק ודחיפה מופחתים, בלי פגיעה
      dmg *= heavy ? 0.5 : 0.15; kb *= 0.25; this.events.push({ type: 'block' });
      this.hp = Math.max(0, this.hp - dmg); this.vel.x = nx * kb; this.vel.z = nz * kb;
      this.ult = Math.min(100, this.ult + dmg * 0.4); if (this.hp <= 0) { this.state = 'ko'; this.koT = 0; this.events.push({ type: 'ko', from }); }
      return;
    }
    this.hp = Math.max(0, this.hp - dmg); this.flash = 0.18;
    this.ult = Math.min(100, this.ult + dmg * 0.8); if (from && from !== this) from.ult = Math.min(100, from.ult + dmg * 1.2);
    this.vel.x = nx * kb; this.vel.z = nz * kb; if (heavy) this.vel.y = 5.5;
    if (!soft) { this.state = 'hit'; this.t = 0; this.stun = heavy ? 0.55 : 0.32; this.cur = null; }
    this.events.push({ type: 'hit', heavy, soft, from });
    if (this.hp <= 0) { this.state = 'ko'; this.koT = 0; this.vel.x = nx * 3; this.vel.z = nz * 3; this.events.push({ type: 'ko', from }); }
  }
  _apply() {
    this.group.position.copy(this.pos);
    this.yawVis = lerpAngle(this.yawVis, this.yaw, 0.35);
    this.pivot.rotation.y = this.yawVis;
    this.shadow.position.set(this.pos.x, 0.02, this.pos.z);
    this.shadow.scale.setScalar(Math.max(0.4, 1 - this.pos.y * 0.12));
    let fr;
    if (this.state === 'move') fr = frame(ANIMS[this.cur.anim], Math.min(0.999, this.t / this.cur.dur));
    else if (this.state === 'hit') fr = frame(ANIMS.hit, Math.min(0.99, this.t / 0.3));
    else if (this.state === 'block') fr = ANIMS.m1[3];
    else if (this.state === 'dodge') fr = ANIMS.jump[0];
    else if (this.state === 'air') fr = ANIMS.jump[0];
    else if (this.state === 'walk') fr = ANIMS.walk[Math.floor(this.walkPhase) % ANIMS.walk.length];
    else if (this.state === 'ko') fr = ANIMS.hit[0];
    else fr = ANIMS.idle[Math.floor(this.t * 5) % ANIMS.idle.length];
    this.rig.setPose(fr, 0);
    let rx = 0, py = 0;
    if (this.state === 'ko') { rx = -Math.min(1.5, this.koT * 3); py = 0.15 * Math.min(1, this.koT * 3); }
    else if (this.state === 'dodge' && this.dodge) { const k = Math.min(1, this.dodge.t / this.dodge.dur); rx = (this.dodge.kind === 'roll' ? 1 : -1) * Math.PI * 2 * k; py = this.dodge.kind === 'roll' ? 0.45 * Math.sin(k * Math.PI) : 0; }
    this.pivot.rotation.x = rx; this.rig.wrap.position.y = -0.85 + py;
    const f = this.flash > 0;
    this.rig.mats.forEach((m) => { if (m.emissive) { m.emissive.copy(m.color).multiplyScalar(0.32); if (f) m.emissive.setRGB(0.9, 0.2, 0.15); } });
  }
}
export const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const lerpAngle = (a, b, t) => a + angleDiff(b, a) * t;
