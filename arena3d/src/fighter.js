// לוחם: מצב, פיזיקה על הרצפה, קרב, ובחירת פריים אנימציה.
import * as THREE from 'three';
import { ANIMS } from './anims.js';
import { createRig } from './rig.js';

export const ARENA_R = 8.4;         // רדיוס הרצפה הניתנת ללכת עליה
const SPEED = 4.6, GRAV = 24, JUMP_V = 9;
const ATTACK = { dur: 0.46, hitAt: 0.5, range: 1.9, arc: 1.2, dmg: 8, kb: 5.5, cd: 0.1 };
const SPECIAL = { dur: 0.9, hitAt: 0.55, radius: 3.6, dmg: 18, kb: 9.5, cd: 4 };
const frame = (arr, t01) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(t01 * arr.length)))];

export class Fighter {
  constructor(id, src, { hueShift = 0, name = id, human = false } = {}) {
    this.id = id; this.name = name; this.human = human;
    this.rig = createRig(id, src, { hueShift });
    this.group = new THREE.Group(); this.group.add(this.rig.wrap);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.45, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0; this.yawVis = 0;
    this.maxHp = 100; this.hp = 100; this.lives = 3; this.score = 0;
    this.state = 'idle'; this.t = 0; this.hitDone = false; this.stun = 0; this.cdSpecial = 0; this.cdAttack = 0; this.walkPhase = 0; this.koT = 0;
    this.flash = 0; this.events = [];
  }
  reset(x, z, yaw) { this.pos.set(x, 0, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.yawVis = yaw; this.hp = this.maxHp; this.state = 'idle'; this.t = 0; this.stun = 0; this.cdSpecial = 0; this.cdAttack = 0; this.koT = 0; }
  get alive() { return this.state !== 'ko'; }
  get grounded() { return this.pos.y <= 0.001; }

  // cmd: { x, z (כיוון תנועה בעולם, מנורמל), attack, jump, special }
  update(dt, cmd, foe) {
    this.events.length = 0;
    this.t += dt; this.cdSpecial = Math.max(0, this.cdSpecial - dt); this.cdAttack = Math.max(0, this.cdAttack - dt); this.flash = Math.max(0, this.flash - dt);
    if (this.state === 'ko') { this.koT += dt; this.pos.addScaledVector(this.vel, dt); this.vel.multiplyScalar(0.9); this._apply(); return; }
    const busy = this.state === 'attack' || this.state === 'special' || this.state === 'hit';
    // סיבוב לכיוון היריב (נעול) כשלא בתנועה חופשית
    const toFoe = foe ? Math.atan2(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z) : this.yaw;
    if (this.state === 'hit') { this.stun -= dt; if (this.stun <= 0) { this.state = 'idle'; this.t = 0; } }
    if (!busy) {
      const mv = Math.hypot(cmd.x, cmd.z);
      if (mv > 0.05) {
        this.vel.x = cmd.x * SPEED; this.vel.z = cmd.z * SPEED; this.walkPhase += dt * 9 * Math.min(1, mv);
        this.state = this.grounded ? 'walk' : 'air';
      } else { this.vel.x *= 0.6; this.vel.z *= 0.6; if (this.grounded) { this.state = 'idle'; } }
      this.yaw = lerpAngle(this.yaw, toFoe, Math.min(1, dt * 10));
      if (cmd.jump && this.grounded) { this.vel.y = JUMP_V; this.state = 'air'; this.t = 0; }
      if (cmd.attack && this.cdAttack <= 0) { this._start('attack'); }
      else if (cmd.special && this.cdSpecial <= 0) { this._start('special'); this.cdSpecial = SPECIAL.cd; }
    } else {
      this.vel.x *= 0.88; this.vel.z *= 0.88;
      if (this.state !== 'hit') this.yaw = lerpAngle(this.yaw, toFoe, Math.min(1, dt * 6));
      if (this.state === 'attack') {
        const p = this.t / ATTACK.dur;
        if (!this.hitDone && p >= ATTACK.hitAt) { this.hitDone = true; this._meleeHit(foe); }
        if (p >= 1) { this.state = 'idle'; this.t = 0; this.cdAttack = ATTACK.cd; }
      } else if (this.state === 'special') {
        const p = this.t / SPECIAL.dur;
        if (!this.hitDone && p >= SPECIAL.hitAt) { this.hitDone = true; this._shockwave(foe); }
        if (p >= 1) { this.state = 'idle'; this.t = 0; }
      }
    }
    // אוויר
    if (!this.grounded || this.vel.y > 0) { this.vel.y -= GRAV * dt; if (this.state === 'walk' || this.state === 'idle') this.state = 'air'; }
    this.pos.addScaledVector(this.vel, dt);
    if (this.pos.y <= 0) { this.pos.y = 0; if (this.vel.y < 0) { this.vel.y = 0; if (this.state === 'air') { this.state = 'idle'; this.t = 0; } } }
    // גבול הזירה
    const d = Math.hypot(this.pos.x, this.pos.z);
    if (d > ARENA_R) { this.pos.x *= ARENA_R / d; this.pos.z *= ARENA_R / d; }
    // התנגשות עם היריב (עיגולים)
    if (foe && foe.alive) {
      const dx = this.pos.x - foe.pos.x, dz = this.pos.z - foe.pos.z, dist = Math.hypot(dx, dz), min = 0.85;
      if (dist < min && dist > 0.001) { const push = (min - dist) / 2; this.pos.x += dx / dist * push; this.pos.z += dz / dist * push; foe.pos.x -= dx / dist * push; foe.pos.z -= dz / dist * push; }
    }
    this._apply();
  }
  _start(kind) { this.state = kind; this.t = 0; this.hitDone = false; this.events.push(kind); }
  _meleeHit(foe) {
    if (!foe || !foe.alive) return;
    const dx = foe.pos.x - this.pos.x, dz = foe.pos.z - this.pos.z, dist = Math.hypot(dx, dz);
    const ang = Math.abs(angleDiff(Math.atan2(dx, dz), this.yaw));
    if (dist <= ATTACK.range && ang <= ATTACK.arc && Math.abs(foe.pos.y - this.pos.y) < 1.4) foe.hurt(ATTACK.dmg, dx / dist, dz / dist, ATTACK.kb, this);
  }
  _shockwave(foe) {
    this.events.push({ type: 'wave', x: this.pos.x, z: this.pos.z, r: SPECIAL.radius });
    if (!foe || !foe.alive) return;
    const dx = foe.pos.x - this.pos.x, dz = foe.pos.z - this.pos.z, dist = Math.hypot(dx, dz);
    if (dist <= SPECIAL.radius && foe.pos.y < 1.2) foe.hurt(SPECIAL.dmg, dx / (dist || 1), dz / (dist || 1), SPECIAL.kb, this, true);
  }
  hurt(dmg, nx, nz, kb, from, heavy = false) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - dmg); this.flash = 0.18;
    this.vel.x = nx * kb; this.vel.z = nz * kb; if (heavy) this.vel.y = 5.5;
    this.state = 'hit'; this.t = 0; this.stun = heavy ? 0.55 : 0.32; this.hitDone = true;
    this.events.push({ type: 'hit', heavy, from });
    if (this.hp <= 0) { this.state = 'ko'; this.koT = 0; this.vel.x = nx * 3; this.vel.z = nz * 3; this.events.push({ type: 'ko', from }); }
  }
  _apply() {
    this.group.position.copy(this.pos);
    this.yawVis = lerpAngle(this.yawVis, this.yaw, 0.35);
    this.rig.wrap.rotation.y = this.yawVis;
    this.shadow.position.set(this.pos.x, 0.02, this.pos.z);
    const s = Math.max(0.4, 1 - this.pos.y * 0.12); this.shadow.scale.setScalar(s);
    // אנימציה
    let fr;
    if (this.state === 'attack') fr = frame(ANIMS.m2, this.t / ATTACK.dur);
    else if (this.state === 'special') fr = frame(ANIMS.stomp, this.t / SPECIAL.dur);
    else if (this.state === 'hit') fr = frame(ANIMS.hit, Math.min(0.99, this.t / 0.3));
    else if (this.state === 'air') fr = ANIMS.jump[0];
    else if (this.state === 'walk') fr = ANIMS.walk[Math.floor(this.walkPhase) % ANIMS.walk.length];
    else if (this.state === 'ko') fr = ANIMS.hit[0];
    else fr = ANIMS.idle[Math.floor(this.t * 5) % ANIMS.idle.length];
    this.rig.setPose(fr, 0);
    // נפילה במצב KO: מסובבים את כל הדמות אחורה
    this.rig.wrap.rotation.x = this.state === 'ko' ? -Math.min(1.5, this.koT * 3) : 0;
    this.rig.wrap.position.y = this.state === 'ko' ? 0.15 * Math.min(1, this.koT * 3) : 0;
    const f = this.flash > 0 ? 0.8 : 0;
    this.rig.mats.forEach((m) => { if (m.emissive) { m.emissive.copy(m.color).multiplyScalar(0.25); if (f) m.emissive.setRGB(0.9, 0.2, 0.15); } });
  }
}
export const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const lerpAngle = (a, b, t) => a + angleDiff(b, a) * t;
