// לוחם: מצב, פיזיקה על הרצפה, מערכת מכות כללית (moves.js), ובחירת פריים אנימציה.
import * as THREE from 'three';
import { ANIMS } from './anims.js';
import { createRig } from './rig.js';
import { MOVES, DIRS, ELEMENT, SUPER_TIME } from './moves.js';

export const FLOOR_R = 13.0;      // רדיוס הרצפה: מעבר לו אין קרקע ונופלים (העפה מהזירה)
const WALL_R = 38;             // המעקה החיצוני של הזירה
const GRAV = 24, OUT_Y = -14;
// הבדלי דמויות: מהירות, משקל (כבד = מועף פחות), גובה קפיצה
const STATS = { toph: { speed: 4.0, weight: 1.25 }, zuko: { speed: 5.4, weight: 0.85 } };
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
    const st = STATS[id] || { speed: 4.6, weight: 1 }; this.speed = st.speed; this.weight = st.weight;
    this.pct = 0; this.lives = 3; this.ult = 0; this.airJumps = 1; this.out = false;
    this.superT = 0; this.superUsed = false; this.aura = null; this.origColors = null; this.auraT = 0;
    this.state = 'idle'; this.t = 0; this.stun = 0; this.walkPhase = 0; this.koT = 0; this.flash = 0;
    this.cur = null; this.hitDone = false; this.tick = 0; this.dashHit = false; this.events = []; this.inv = 0; this.dodge = null; this.blocking = false;
  }
  reset(x, z, yaw) {
    this.pos.set(x, 0, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.yawVis = yaw; this.state = 'idle'; this.t = 0; this.stun = 0; this.airJumps = 1; this.out = false;
    this.cd = this.moves.map(() => 0); this.koT = 0; this.cur = null; this.events.length = 0; this.inv = 0; this.dodge = null; this.blocking = false; if (this.superT > 0) { this.superT = 0; this._endSuper(); }
  }
  get alive() { return this.state !== 'ko'; }
  get onFloor() { return Math.hypot(this.pos.x, this.pos.z) <= FLOOR_R; }
  get grounded() { return this.pos.y <= 0.001 && this.onFloor; }
  dir() { return { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }; }

  // cmd: { x, z (כיוון תנועה בעולם), a, b (לחיצות), bHold, ult, dir ('none'|'right'|'left'|'down'|'up') }
  update(dt, cmd, foe) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt); this.inv = Math.max(0, this.inv - dt);
    this.cd = this.cd.map((c) => Math.max(0, c - dt * (this.superT > 0 ? 1.67 : 1)));
    if (this.superT > 0) { this.superT -= dt; if (this.superT <= 0) { this.superT = 0; this._endSuper(); this.events.push({ type: 'superend' }); } }
    if (!this.superUsed) this.ult = Math.min(100, this.ult + dt * 1.1);
    if (this.state === 'ko') { this.koT += dt; if (this.out) this.vel.y -= GRAV * dt; this.pos.addScaledVector(this.vel, dt); this.vel.x *= 0.98; this.vel.z *= 0.98; this._apply(); return; }
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
        if (mv > 0.05 && !cmd.a && !cmd.b) { const sp = this.speed * (this.superT > 0 ? 1.3 : 1); this.vel.x = cmd.x * sp; this.vel.z = cmd.z * sp; this.walkPhase += dt * 9 * Math.min(1, mv); this.state = grounded ? 'walk' : 'air'; }
        else { this.vel.x *= 0.6; this.vel.z *= 0.6; if (grounded && this.state !== 'air') this.state = 'idle'; }
      }
      if (this.state !== 'block') this.yaw = lerpAngle(this.yaw, toFoe, Math.min(1, dt * 10));
      if (!grounded && cmd.b && this.airJumps > 0 && this.state !== 'hit') this._airJump();
      if (cmd.ult && this._tryMove(5)) { /* אולט */ }
      else if (cmd.a && grounded) this._tryMove(Math.max(0, DIRS.indexOf(dir)));
      else if (cmd.b && dir !== 'none' && grounded) this._tryDefense(dir);
    } else {
      const fr = this.state === 'dodge' ? 0.97 : (this.state === 'hit' ? 0.955 : 0.88); this.vel.x *= fr; this.vel.z *= fr;
      if (this.state === 'move') this._runMove(dt, foe);
      if (this.state === 'dodge') this._runDodge(dt);
    }
    if (!this.grounded || this.vel.y > 0) { this.vel.y -= GRAV * dt; if (this.state === 'walk' || this.state === 'idle') this.state = 'air'; }
    this.pos.addScaledVector(this.vel, dt);
    if (this.pos.y <= 0 && this.onFloor && this.pos.y > -0.6) {            // נחיתה על הרצפה
      this.pos.y = 0; if (this.vel.y < 0) { this.vel.y = 0; this.airJumps = 1; if (this.state === 'air') { this.state = 'idle'; this.t = 0; } }
    }
    const d = Math.hypot(this.pos.x, this.pos.z);
    if (d > WALL_R) { this.pos.x *= WALL_R / d; this.pos.z *= WALL_R / d; this.vel.x *= -0.3; this.vel.z *= -0.3; }
    if (this.pos.y < OUT_Y && this.alive) { this.out = true; this.state = 'ko'; this.koT = 0; this.events.push({ type: 'ko', from: null, out: true }); }
    if (foe && foe.alive) {
      const dx = this.pos.x - foe.pos.x, dz = this.pos.z - foe.pos.z, dist = Math.hypot(dx, dz), min = 0.85;
      if (dist < min && dist > 0.001) { const push = (min - dist) / 2; this.pos.x += dx / dist * push; this.pos.z += dz / dist * push; foe.pos.x -= dx / dist * push; foe.pos.z -= dz / dist * push; }
    }
    this._apply();
  }

  _airJump() {                                            // קפיצת התאוששות באוויר (פעם אחת) לכיוון מרכז הזירה
    const d = Math.hypot(this.pos.x, this.pos.z) || 1; this.airJumps--; this.vel.y = 9.5;
    this.vel.x = -this.pos.x / d * 5.5; this.vel.z = -this.pos.z / d * 5.5; this.state = 'air'; this.cur = null; this.events.push({ type: 'airjump' });
  }
  _beginSuper() {
    const col = ELEMENT[this.id].sup;
    this.origColors = this.rig.mats.map((m) => (m.color ? m.color.clone() : null));
    if (this.id === 'zuko') this.rig.mats.forEach((m) => { if (!m.color) return; const h = {}; m.color.getHSL(h); if (h.s > 0.4 && (h.h < 0.06 || h.h > 0.94)) m.color.setHSL(0.58, 0.9, Math.max(0.4, h.l)); });   // אש כחולה
    const g = new THREE.Group(); const am = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    [[1.0, 2.7, 0], [0.75, 2.2, 1.2]].forEach(([r, h, ph]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 14, 1, true), am.clone()); c.position.y = h / 2 - 0.05; c.userData = { ph }; g.add(c); });
    const lt = new THREE.PointLight(col, 1.6, 9); lt.position.set(0, 1.2, 0); g.add(lt);
    this.group.add(g); this.aura = g;
  }
  _endSuper() {
    if (this.aura) { this.group.remove(this.aura); this.aura.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); this.aura = null; }
    if (this.origColors) this.rig.mats.forEach((m, i) => { if (m.color && this.origColors[i]) m.color.copy(this.origColors[i]); });
    this.origColors = null;
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
    if (!mv || this.cd[i] > 0 || (i === 5 && (this.ult < 100 || this.superUsed || this.superT > 0))) return false;
    this.state = 'move'; this.cur = mv; this.curIdx = i; this.t = 0; this.hitDone = false; this.tick = 0; this.dashHit = false;
    this.cd[i] = mv.cd; if (i === 5) { this.superUsed = true; this.ult = 100; }
    this.events.push({ type: 'start', idx: i, move: mv });
    return true;
  }
  _runMove(dt, foe) {
    const mv = this.cur, p = this.t / mv.dur, d = this.dir();
    if (mv.kind !== 'flamekick') { const toFoe = foe ? Math.atan2(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z) : this.yaw; this.yaw = lerpAngle(this.yaw, toFoe, Math.min(1, dt * 6)); }
    if (mv.kind === 'super' && p < mv.hitAt) { this.events.push({ type: 'charge', x: this.pos.x, z: this.pos.z }); this.vel.x *= 0.2; this.vel.z *= 0.2; }
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
        if (dist <= (mv.range || 1.9) && Math.abs(angleDiff(Math.atan2(dx, dz), this.yaw)) <= 1.2 && Math.abs(foe.pos.y - this.pos.y) < 1.4) foe.hurt(mv.dmg, dx / dist, dz / dist, mv.kb, this);
        this.events.push({ type: 'punch', x: here.x + d.x * 1.0, y: 1.2, z: here.z + d.z * 1.0 });
        break;
      }
      case 'super':
        this.superT = SUPER_TIME; this._beginSuper();
        this.events.push({ type: 'superburst', x: here.x, z: here.z, r: mv.radius });
        if (foe && foe.alive) { const dx = foe.pos.x - here.x, dz = foe.pos.z - here.z, dist = Math.hypot(dx, dz); if (dist < mv.radius) foe.hurt(2, dx / (dist || 1), dz / (dist || 1), 9, this, true, true); }
        break;
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
        break;
      default: break;
    }
  }
  hurt(dmg, nx, nz, kb, from, heavy = false, soft = false) {
    if (!this.alive || this.inv > 0) return;
    if (this.state === 'block') {                                       // חסימה: כמעט בלי נזק ובלי הדיפה
      this.pct += dmg * (heavy ? 0.4 : 0.1); kb *= 0.25; this.vel.x = nx * kb; this.vel.z = nz * kb;
      this.events.push({ type: 'block' }); if (!this.superUsed) this.ult = Math.min(100, this.ult + dmg * 0.4);
      return;
    }
    if (from && from.superT > 0) { dmg *= 1.5; kb *= 1.25; }
    this.pct += dmg; this.flash = 0.18;
    if (!this.superUsed) this.ult = Math.min(100, this.ult + dmg * 0.8); if (from && from !== this && !from.superUsed) from.ult = Math.min(100, from.ult + dmg * 1.2);
    const scale = (1 + this.pct / 100) / (this.weight * (this.superT > 0 ? 1.3 : 1));                    // ככל שהאחוז גבוה יותר: מועפים רחוק יותר (כמו Smash)
    this.vel.x = nx * kb * scale; this.vel.z = nz * kb * scale;
    if (heavy || this.pct > 90) this.vel.y = Math.min(13, 5.5 * (0.8 + this.pct / 160));
    if (!soft) { this.state = 'hit'; this.t = 0; this.stun = (heavy ? 0.5 : 0.3) * (1 + Math.min(1, this.pct / 200)); this.cur = null; }
    this.events.push({ type: 'hit', heavy, soft, from, pct: this.pct });
  }
  _apply() {
    this.group.position.copy(this.pos); this.group.visible = this.pos.y > -30;
    this.yawVis = lerpAngle(this.yawVis, this.yaw, 0.35);
    this.pivot.rotation.y = this.yawVis;
    this.shadow.position.set(this.pos.x, 0.02, this.pos.z); this.shadow.visible = this.onFloor;
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
    if (this.state === 'ko') { rx = this.out ? this.koT * 6 : -Math.min(1.5, this.koT * 3); py = this.out ? 0 : 0.15 * Math.min(1, this.koT * 3); }
    else if (this.state === 'dodge' && this.dodge) { const k = Math.min(1, this.dodge.t / this.dodge.dur); rx = (this.dodge.kind === 'roll' ? 1 : -1) * Math.PI * 2 * k; py = this.dodge.kind === 'roll' ? 0.45 * Math.sin(k * Math.PI) : 0; }
    this.pivot.rotation.x = rx; this.rig.wrap.position.y = -0.85 + py;
    const f = this.flash > 0;
    const sup = this.superT > 0 ? new THREE.Color(ELEMENT[this.id].sup) : null;
    this.rig.mats.forEach((m) => { if (m.emissive) { m.emissive.copy(m.color).multiplyScalar(0.32); if (sup) m.emissive.lerp(sup, 0.16); if (f) m.emissive.setRGB(0.9, 0.2, 0.15); } });
    if (this.aura) { this.auraT += 0.12; this.aura.children.forEach((c) => { if (c.isMesh) { const k = 1 + 0.12 * Math.sin(this.auraT * 3 + c.userData.ph); c.scale.set(k, 1 + 0.2 * Math.sin(this.auraT * 4 + c.userData.ph), k); c.rotation.y += 0.15; } }); }
  }
}
export const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const lerpAngle = (a, b, t) => a + angleDiff(b, a) * t;
