import Phaser from 'phaser';
import { CHARACTERS, byId, ELEMENTS } from '../data/characters.js';
import { touch } from '../ui/input.js';
import { bakeFor, bakedKey, FRAMES, BAKE_SCALE } from '../anim/bake.js';
import { makeFxTextures } from '../fx/textures.js';
import { CAST, EV, chargeSpark } from '../fx/moves.js';
import { isUnlocked } from '../data/progress.js';
import { pad } from '../ui/gamepad.js';
import { MAPS } from '../data/maps.js';

const STOCKS = 3;
const SPRITE_H = 100, BODY_W = 34, BODY_H = 74;
const ATTACK_POSE_MS = 260, POP_MS = 130;
const BLAST = { left: -120, right: 1080, top: -160, bottom: 660 };
// הפלטפורמות באות מהמפה שנבחרה (src/data/maps.js), וגם הציור שלהן (src/ui/maps.js)
const ULT = 4; // אינדקס המכה הסודית ב-useMove

export default class Fight extends Phaser.Scene {
  constructor() { super('Fight'); }

  init() {
    this.cfg = this.registry.get('cfg') || { p1: 'aang', bots: ['zuko'] };
    this.map = this.cfg.map || MAPS[0];
    this.main = { ...this.map.platforms.find((p) => p.main), h: 30 };
    this.ready = false; this.started = false; this.over = false; this.stopCount = 0;
  }

  preload() {
    CHARACTERS.forEach((c) => {
      if (!this.textures.exists('spr_' + c.id)) this.load.image('spr_' + c.id, `sprites/${c.id}.png`);
      c.poses.forEach((p) => {
        if (!this.textures.exists(`spr_${c.id}_${p}`)) this.load.image(`spr_${c.id}_${p}`, `sprites/${c.id}_${p}.png`);
      });
    });
  }

  create() {
    this.makeTextures();
    makeFxTextures(this);
    const ids = [this.cfg.p1, ...this.cfg.bots];
    bakeFor(this, ids);

    this.platforms = this.physics.add.staticGroup();
    this.map.platforms.forEach((p) => {
      if (p.main) this.addPlatform(p.x, p.top + 15, p.w, 30, true);
      else this.addPlatform(p.x, p.top + 7, p.w, 14, false);
    });

    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S',
      j: 'J', k: 'K', l: 'L', i: 'I', u: 'U', space: 'SPACE',
    });

    this.projectiles = this.physics.add.group({ allowGravity: false });
    const gap = Math.min(110, this.main.w / (ids.length + 1));
    this.fighters = ids.map((id, i) => this.spawnFighter(byId(id), i, this.main.x + (i - (ids.length - 1) / 2) * gap, i === 0));
    this.fighters.forEach((f) => {
      this.physics.add.collider(f, this.platforms, null, (fi, p) =>
        p.solid || (fi.body.velocity.y >= 0 && fi.body.bottom <= p.body.top + 14 && this.time.now > fi.dropUntil));
    });
    // קושי הסיפור: חדות הבוטים, ובוס מקבל מד סודי חצי מלא ונזק מוגבר
    this.fighters.slice(1).forEach((b) => { if (this.cfg.skill) b.skill = this.cfg.skill; });
    if (this.cfg.boss && this.fighters[1]) { this.fighters[1].boss = true; this.fighters[1].ult = 60; }
    this.physics.pause(); // מחכים ל-go() אחרי מסך ה-VS
    this.ready = true;
  }

  go() { this.started = true; this.startT = this.time.now; this.physics.resume(); }

  addPlatform(x, y, w, h, solid) {
    const p = this.platforms.create(x, y, 'px').setAlpha(0);
    p.setDisplaySize(w, h).refreshBody();
    p.solid = solid;
  }

  makeTextures() {
    if (this.textures.exists('px')) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff).fillRect(0, 0, 4, 4).generateTexture('px', 4, 4);
    g.clear().fillStyle(0xffffff).fillCircle(16, 16, 16).generateTexture('orb', 32, 32);
    g.clear().fillStyle(0xffffff).fillCircle(4, 4, 4).generateTexture('spark', 8, 8);
    g.destroy();
  }

  // הגוף הפיזיקלי (f) בלתי נראה וקבוע. הדמות המצוירת (f.vis) היא שכבה נפרדת,
  // כדי שמתיחות, הטיות והחלפת פוזה לא ישנו את אזור הפגיעה.
  spawnFighter(def, idx, x, human) {
    const y0 = this.main.top - 90;
    const f = this.physics.add.sprite(x, y0, 'px').setVisible(false);
    f.setDisplaySize(BODY_W, BODY_H);
    f.body.setSize(4, 4);
    f.setDragX(1400).setMaxVelocity(700, 900);
    f.vis = this.add.image(x, y0, 'spr_' + def.id).setOrigin(0.5, 1).setDepth(3);
    Object.assign(f, {
      def, idx, human, uid: idx, percent: 0, stocks: STOCKS, facing: x < 480 ? 1 : -1,
      jumpsLeft: def.stats.doubleJumps, stun: 0, invuln: 1500, jumpHeld: false, dropUntil: 0,
      kos: 0, taken: 0, lastHitBy: null, pose: 'idle', poseT: 0, landT: -1e9, wasGrounded: false,
      act: null, cd: [0, 0, 0, 0], ult: 0, glow: null, wall: null, nextSpark: 0, movesSet: new Set(), ultUsed: false, boss: false,
      skill: human ? 1 : 0.7 + Math.random() * 0.5,
    });
    return f;
  }

  hurt(f) { return new Phaser.Geom.Rectangle(f.body.x, f.body.y, f.body.width, f.body.height); }
  alive() { return this.fighters.filter((f) => f.stocks > 0); }
  enemiesOf(f) { return this.alive().filter((o) => o !== f); }
  nearest(f) { return this.enemiesOf(f).sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0]; }

  // ---- עזרי אפקטים (נקראים מ-src/fx/moves.js) ----
  shake(i) { this.cameras.main.shake(90, i); }
  hitstop(ms) {
    this.stopCount++;
    this.physics.pause();
    this.time.delayedCall(ms, () => { this.stopCount--; if (!this.over && this.stopCount <= 0) this.physics.resume(); });
  }
  ultFlash(f) {
    this.cameras.main.flash(220, 255, 255, 255);
    this.cameras.main.shake(260, 0.006);
    this.hitstop(90);
  }

  burst(f, n) {
    const col = ELEMENTS[f.def.element].color;
    const em = this.add.particles(f.x, f.y - 8, 'spark', {
      speed: { min: 60, max: 150 }, lifespan: 320, scale: { start: 1.1, end: 0 }, tint: col, emitting: false,
    }).setDepth(7);
    em.explode(n);
    this.time.delayedCall(450, () => em.destroy());
  }

  // קליע כללי. o: tex, w, h, vx (בכיוון הפנייה), vy, g, x/dx/y, life, dmg, kb, pierce, rehit, up, spin, tint, trail, glow, ground, angleFromVel, onHit
  shoot(f, o) {
    const now = this.time.now;
    const x = o.x ?? f.x + f.facing * (o.dx ?? 30), y = o.y ?? f.y - 6;
    const p = this.projectiles.create(x, y, o.tex).setDepth(6);
    if (o.tint != null) p.setTint(o.tint);
    p.setDisplaySize(o.w, o.h);
    p.body.setAllowGravity(!!o.g);
    if (o.g) p.body.setGravityY(o.g);
    p.setVelocity(f.facing * o.vx, o.vy || 0);
    if (o.flip) p.setFlipX(f.facing < 0);
    Object.assign(p, {
      owner: f, dmg: o.dmg, kb: o.kb, dir: f.facing, pierce: !!o.pierce, rehit: o.rehit || 0, hits: new Map(), dieAt: now + o.life,
      spin: o.spin || 0, up: o.up, onHit: o.onHit, ground: o.ground, angleVel: o.angleFromVel, wobble: o.wobble,
    });
    if (o.angleFromVel) p.setRotation(Math.atan2(o.vy || 0, f.facing * o.vx));
    if (o.trail != null) {
      p.trailEm = this.add.particles(0, 0, 'spark', {
        follow: p, speed: 25, lifespan: 260, scale: { start: 1, end: 0 }, tint: o.trail, frequency: 26,
      }).setDepth(5);
    }
    if (o.glow != null) {
      p.glowImg = this.add.image(x, y, 'fx_glow').setTint(o.glow).setBlendMode(Phaser.BlendModes.ADD).setDepth(5)
        .setDisplaySize(Math.max(o.w, o.h) * 2.2, Math.max(o.w, o.h) * 2.2).setAlpha(0.75);
    }
    return p;
  }

  killProjectile(p) {
    p.trailEm?.stop();
    const em = p.trailEm; if (em) this.time.delayedCall(300, () => em.destroy());
    p.glowImg?.destroy();
    p.destroy();
  }

  // פגיעה באזור (מלבן top-left). opts: dir ('away' | מספר), up (שיגור כלפי מעלה)
  areaHit(f, rect, dmg, kb, opts = {}) {
    const r = new Phaser.Geom.Rectangle(rect.x, rect.y, rect.w, rect.h);
    let n = 0;
    this.enemiesOf(f).forEach((e) => {
      if (!Phaser.Geom.Intersects.RectangleToRectangle(r, this.hurt(e))) return;
      const dir = opts.dir === 'away' ? (Math.sign(e.x - (rect.x + rect.w / 2)) || f.facing) : (opts.dir ?? f.facing);
      if (this.hit(e, f, dmg, kb, dir, { up: opts.up })) n++;
    });
    return n;
  }

  hit(target, from, dmg, kb, dir, opts = {}) {
    if (target.invuln > 0) return false;
    if (from && from.boss) dmg *= 1.15;
    target.percent += dmg; target.taken += dmg; target.lastHitBy = from;
    // מד המכה הסודית: מתמלא מנזק שגרמת ובקצת מנזק שנספג
    if (from && from.ult < 100) from.ult = Math.min(100, from.ult + dmg * 1.6);
    if (target.ult < 100) target.ult = Math.min(100, target.ult + dmg * 0.5);
    const power = (kb + target.percent * 4.2) / target.def.stats.weight;
    if (opts.up) target.setVelocity(dir * power * 0.45, -opts.up - power * 0.15);
    else target.setVelocity(dir * power, -power * 0.55);
    target.stun = 160 + Math.min(power, 600) * 0.4;
    this.cancelAct(target);
    target.jumpsLeft = Math.max(target.jumpsLeft, 1);
    target.vis.setTintFill(0xffffff);
    this.time.delayedCall(70, () => target.vis.clearTint());
    this.cameras.main.shake(70, 0.003);
    if (target.human) this.cfg.onRumble?.(140, 0.7); else if (from && from.human) this.cfg.onRumble?.(70, 0.3);
    return true;
  }

  // ---- פוזות ואנימציה ----
  setPose(f, name) {
    if (f.pose === name) return;
    f.pose = name; f.poseT = this.time.now;
    const key = `spr_${f.def.id}_${name}`;
    const has = name !== 'idle' && f.def.poses.includes(name) && this.textures.exists(key);
    f.vis.setTexture(has ? key : 'spr_' + f.def.id);
    f.poseHasTex = has;
    if (name !== 'idle' && name !== 'jump') this.burst(f, 5);
  }

  choosePose(f, grounded) {
    if (f.stun > 0) return 'hit';
    if (f.act) return f.act.mv.type === 'melee' ? 'attack' : 'special';
    if (!grounded) return 'jump';
    return 'idle';
  }

  animate(f, inp, grounded, dt = 16) {
    const now = this.time.now, d = f.def, v = f.vis;
    this.setPose(f, this.choosePose(f, grounded));
    if (grounded && !f.wasGrounded) f.landT = now;
    f.wasGrounded = grounded;
    const t = now - f.poseT;

    let sx = 1, sy = 1, ang = 0, baked = false;
    // פריימים מוכנים: כל חלק בגוף זז בנפרד. כשיש לפוזה תמונה משלה היא מחליפה אותם.
    if (!f.poseHasTex) {
      let anim, i;
      if (f.pose === 'hit') { anim = 'hit'; i = t < 140 ? 0 : 1; }
      else if (f.act) {
        const mv = f.act.mv;
        anim = mv.anim;
        const p = Math.max(0, Math.min(0.999, (now - f.act.start) / (mv.windup + mv.recover)));
        i = Math.floor(p * FRAMES[anim]);
      } else if (!grounded) { anim = 'jump'; i = 0; }
      else if (Math.abs(inp.move) > 0.05 || Math.abs(f.body.velocity.x) > 30) {
        // קצב הצעדים לפי המהירות בפועל: הליכה איטית כשהסטיק מוטה מעט, ריצה מהירה כשמלא
        anim = 'walk';
        f.walkPhase = (f.walkPhase || 0) + (dt / 70) * (0.45 + 0.9 * Math.min(1, Math.abs(f.body.velocity.x) / f.def.stats.speed));
        i = Math.floor(f.walkPhase) % FRAMES.walk;
      }
      else { anim = 'idle'; i = Math.floor(now / 150) % FRAMES.idle; }
      const k = bakedKey(d.id, anim, i);
      if (this.textures.exists(k)) { v.setTexture(k); baked = true; }
    } else if (f.pose === 'hit') { ang = -f.facing * 14; sx = 1.06; sy = 0.92; }
    if (baked && now - f.landT < 110) { sy = 0.9; sx = 1.08; }

    const pop = 1 + 0.15 * Math.max(0, 1 - t / POP_MS);
    const ps = d.poseScale?.[f.pose] ?? 1;
    // הטקסטורות המוכנות נאפו בחצי רזולוציה ועם שוליים, לכן מכפילים בהתאם
    const base = (SPRITE_H * ps) / 256 / (baked ? BAKE_SCALE : 1);
    v.setScale(base * sx * pop, base * sy * pop).setAngle(ang);
    const faces = f.pose !== 'idle' && f.poseHasTex ? (d.poseFaces ?? 1) : d.faces;
    v.setFlipX(f.facing !== faces);
    v.setPosition(f.x, f.body.bottom + 2);
    v.setAlpha(f.invuln > 0 && Math.floor(now / 90) % 2 ? 0.4 : 1);
  }

  // ---- מכות ----
  canUse(f, i) {
    if (f.act || f.stun > 0 || f.stocks <= 0) return false;
    if (i === ULT) return f.ult >= 100 && isUnlocked(f.def.ult, f.human);
    return f.cd[i] <= 0 && isUnlocked(f.def.moves[i], f.human);
  }

  useMove(f, i) {
    if (!this.canUse(f, i)) return false;
    const mv = i === ULT ? f.def.ult : f.def.moves[i];
    f.act = { i, mv, start: this.time.now, released: false, evi: 0 };
    if (i === ULT) f.ultUsed = true; else f.movesSet.add(i);
    if (i === ULT) {
      f.ult = 0;
      this.cfg.onBanner?.(f.def.name + ': ' + mv.name, ELEMENTS[f.def.element].color);
      if (f.human) this.cfg.onRumble?.(320, 1);
    } else f.cd[i] = mv.cooldown;
    if (mv.charge) {
      f.glow = this.add.circle(f.x, f.y - 16, 6, ELEMENTS[f.def.element].color, 0.55).setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
    }
    return true;
  }

  cancelAct(f) {
    f.glow?.destroy(); f.glow = null;
    if (f.wall) { f.wall.destroy(); f.wall = null; }
    f.act = null;
  }

  tickAct(f, grounded) {
    const a = f.act, mv = a.mv, now = this.time.now, t = now - a.start;
    if (grounded) f.setVelocityX(0);
    while (mv.ev && a.evi < mv.ev.length && t >= mv.ev[a.evi].at) { EV[mv.ev[a.evi].fn](this, f, mv); a.evi++; }
    if (!a.released) {
      if (f.glow) {
        const k = Math.min(1, t / mv.windup);
        f.glow.setPosition(f.x + f.facing * 34, f.y - 16).setRadius(6 + k * (a.i === ULT ? 40 : 24));
        if (now > f.nextSpark) { f.nextSpark = now + 60; chargeSpark(this, f, ELEMENTS[f.def.element].color); }
      }
      if (t >= mv.windup) {
        a.released = true;
        f.glow?.destroy(); f.glow = null;
        CAST[mv.fx](this, f, mv);
      }
    }
    if (t >= mv.windup + mv.recover) f.act = null;
  }

  // ---- קלט ----
  readInput(f) {
    if (f.human) {
      const k = this.keys, t = touch;
      // מקלדת = מלא (1 או -1). ג'ויסטיק ושלט = פרופורציוני: ככל שמטים רחוק יותר הדמות מהירה יותר
      const kb = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
      const analog = Math.abs(t.axis) > Math.abs(pad.axis) ? t.axis : pad.axis;
      return {
        move: kb || analog,
        jump: k.up.isDown || k.w.isDown || k.space.isDown || t.up || t.jump || pad.up || pad.jump,
        down: k.down.isDown || k.s.isDown || t.down || pad.down,
        m: [k.j.isDown || t.m1 || pad.m[0], k.k.isDown || t.m2 || pad.m[1], k.l.isDown || t.m3 || pad.m[2], k.i.isDown || t.m4 || pad.m[3]],
        ult: k.u.isDown || t.ult || pad.ult,
      };
    }
    return this.ai(f);
  }

  ai(f) {
    const inp = { move: 0, jump: false, down: false, m: [false, false, false, false], ult: false };
    const o = this.nearest(f);
    if (!o) return inp;
    const dx = o.x - f.x, dist = Math.abs(dx);
    const edge = this.main.w / 2 - 15;
    if (f.y > this.main.top - 10 || (Math.abs(f.x - this.main.x) > edge && f.y > this.main.top - 60)) { // חזרה לזירה
      inp.move = f.x < this.main.x ? 1 : -1; inp.jump = this.time.now % 400 < 80; return inp;
    }
    if (dist > 90) inp.move = Math.sign(dx);
    if (o.y < f.y - 60 && f.body.blocked.down) inp.jump = true;
    if (!f.act && Math.sign(dx) !== f.facing && dist > 20) f.facing = Math.sign(dx);
    if (f.ult >= 100 && dist <= f.def.ult.range[1] && Math.random() < 0.03) inp.ult = true;
    else if (Math.random() < 0.05 * f.skill) {
      const c = f.def.moves.map((m, i) => i).filter((i) => this.canUse(f, i) && dist >= f.def.moves[i].range[0] && dist <= f.def.moves[i].range[1]);
      if (c.length) inp.m[Phaser.Utils.Array.GetRandom(c)] = true;
    }
    return inp;
  }

  // ---- לולאה ----
  update(_, dt) {
    if (!this.started || this.over) return;
    this.alive().forEach((f) => this.updateFighter(f, dt));
    this.projectiles.getChildren().slice().forEach((p) => this.updateProjectile(p, dt));
    this.cfg.onHud?.(this.fighters);
  }

  updateProjectile(p, dt) {
    const now = this.time.now;
    if (p.spin) p.angle += (p.spin * dt) / 1000;
    if (p.angleVel) p.setRotation(Math.atan2(p.body.velocity.y, p.body.velocity.x));
    if (p.wobble) p.setFlipX(Math.floor(now / 90) % 2 === 0);
    if (p.glowImg) p.glowImg.setPosition(p.x, p.y);
    const out = now > p.dieAt || p.x < -140 || p.x > 1100 || p.y > 620 ||
      (p.ground && (p.x < this.main.x - this.main.w / 2 - 20 || p.x > this.main.x + this.main.w / 2 + 20));
    if (out) return this.killProjectile(p);
    for (const e of this.enemiesOf(p.owner)) {
      if (!Phaser.Geom.Intersects.RectangleToRectangle(p.getBounds(), this.hurt(e))) continue;
      const last = p.hits.get(e);
      if (last !== undefined && !(p.rehit && now - last >= p.rehit)) continue;
      p.hits.set(e, now);
      this.hit(e, p.owner, p.dmg, p.kb, Math.sign(p.body.velocity.x) || p.dir, { up: p.up });
      p.onHit?.(this, p, e);
      if (!p.pierce) { this.killProjectile(p); break; }
    }
  }

  updateFighter(f, dt) {
    f.invuln = Math.max(0, f.invuln - dt);
    f.stun = Math.max(0, f.stun - dt);
    f.cd = f.cd.map((c) => Math.max(0, c - dt));

    const grounded = f.body.blocked.down || f.body.touching.down;
    if (grounded) f.jumpsLeft = f.def.stats.doubleJumps;

    const inp = this.readInput(f);
    if (f.act) this.tickAct(f, grounded);
    else if (f.stun <= 0) {
      if (Math.abs(inp.move) > 0.05) { f.setVelocityX(inp.move * f.def.stats.speed); f.facing = Math.sign(inp.move); }
      if (inp.down && grounded) f.dropUntil = this.time.now + 250; // נפילה דרך פלטפורמה צפה
      if (inp.jump && !f.jumpHeld && (grounded || f.jumpsLeft > 0)) {
        if (!grounded) f.jumpsLeft--;
        f.setVelocityY(-f.def.stats.jump);
      }
      if (inp.ult) this.useMove(f, ULT);
      else for (let i = 0; i < 4; i++) if (inp.m[i] && this.useMove(f, i)) break;
    }
    f.jumpHeld = inp.jump;
    this.animate(f, inp, grounded, dt);

    if (f.x < BLAST.left || f.x > BLAST.right || f.y < BLAST.top || f.y > BLAST.bottom) this.ko(f);
  }

  ko(f) {
    f.stocks--;
    if (f.lastHitBy && f.lastHitBy !== f) f.lastHitBy.kos++;
    this.cameras.main.flash(180, 255, 255, 255);
    this.cancelAct(f);
    if (f.stocks <= 0) {
      f.setActive(false); f.body.enable = false; f.vis.setVisible(false);
      this.cfg.onHud?.(this.fighters);
      const me = this.fighters[0];
      if (f.human) return this.finish(false);
      if (this.alive().length === 1 && this.alive()[0] === me) return this.finish(true);
      return;
    }
    f.percent = 0; f.invuln = 1800; f.stun = 0; f.lastHitBy = null;
    f.setPosition(480, -20).setVelocity(0, 0);
  }

  finish(won) {
    this.over = true;
    this.physics.pause();
    const me = this.fighters[0];
    this.cfg.onEnd?.({
      won, def: me.def, kos: me.kos, dmg: Math.round(me.taken),
      place: won ? 1 : this.alive().length + 1,
      time: Math.round((this.time.now - (this.startT || 0)) / 1000), stocksLeft: Math.max(0, me.stocks),
      movesUsed: me.movesSet.size, ultUsed: me.ultUsed,
    });
  }
}
