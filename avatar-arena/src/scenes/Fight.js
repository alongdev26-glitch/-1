import Phaser from 'phaser';
import { CHARACTERS, byId, ELEMENTS } from '../data/characters.js';
import { touch } from '../ui/input.js';
import { bakeAll, bakedKey, FRAMES } from '../anim/bake.js';

const STOCKS = 3;
const SPRITE_H = 100, BODY_W = 34, BODY_H = 74;
const CAST_MS = 250, ATTACK_POSE_MS = 260, POP_MS = 130;
const BLAST = { left: -120, right: 1080, top: -160, bottom: 660 };
// מיקום הפלטפורמות מותאם לאיור של האי והסלעים ב-HUD של Stitch (במה של 960x540)
const MAIN = { x: 480, top: 348, w: 330, h: 30 };
const FLOATS = [{ x: 153.6, top: 224, w: 104 }, { x: 806.4, top: 224, w: 104 }];

export default class Fight extends Phaser.Scene {
  constructor() { super('Fight'); }

  init() {
    this.cfg = this.registry.get('cfg') || { p1: 'aang', bots: ['zuko'] };
    this.ready = false; this.started = false; this.over = false;
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
    bakeAll(this);
    this.platforms = this.physics.add.staticGroup();
    this.addPlatform(MAIN.x, MAIN.top + MAIN.h / 2, MAIN.w, MAIN.h, true);
    FLOATS.forEach((f) => this.addPlatform(f.x, f.top + 7, f.w, 14, false));

    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S', j: 'J', k: 'K', space: 'SPACE',
    });

    this.projectiles = this.physics.add.group({ allowGravity: false });
    const ids = [this.cfg.p1, ...this.cfg.bots];
    const xs = { 1: [480], 2: [410, 550], 3: [380, 480, 580], 4: [360, 440, 520, 600] }[ids.length];
    this.fighters = ids.map((id, i) => this.spawnFighter(byId(id), i, xs[i], i === 0));
    this.fighters.forEach((f) => {
      this.physics.add.collider(f, this.platforms, null, (fi, p) =>
        p.solid || (fi.body.velocity.y >= 0 && fi.body.bottom <= p.body.top + 14 && this.time.now > fi.dropUntil));
    });
    this.physics.pause(); // מחכים ל-go() אחרי מסך ה-VS
    this.ready = true;
  }

  go() { this.started = true; this.physics.resume(); }

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
    const f = this.physics.add.sprite(x, 150, 'px').setVisible(false);
    f.setDisplaySize(BODY_W, BODY_H);
    f.body.setSize(4, 4);
    f.setDragX(1400).setMaxVelocity(700, 900);
    f.vis = this.add.image(x, 150, 'spr_' + def.id).setOrigin(0.5, 1).setDepth(3);
    Object.assign(f, {
      def, idx, human, uid: idx, percent: 0, stocks: STOCKS, facing: x < 480 ? 1 : -1,
      jumpsLeft: def.stats.doubleJumps, stun: 0, invuln: 1500, atkCd: 0, spCd: 0, attackBox: null,
      jumpHeld: false, dropUntil: 0, kos: 0, taken: 0, lastHitBy: null, pose: 'idle', poseT: 0, atkT: -1e9,
      casting: null, landT: -1e9, wasGrounded: false,
      skill: human ? 1 : 0.7 + Math.random() * 0.5,
    });
    return f;
  }

  hurt(f) { return new Phaser.Geom.Rectangle(f.body.x, f.body.y, f.body.width, f.body.height); }
  alive() { return this.fighters.filter((f) => f.stocks > 0); }
  enemiesOf(f) { return this.alive().filter((o) => o !== f); }
  nearest(f) { return this.enemiesOf(f).sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0]; }

  // ---- פוזות ואנימציה ----
  setPose(f, name) {
    if (f.pose === name) return;
    f.pose = name; f.poseT = this.time.now;
    const key = `spr_${f.def.id}_${name}`;
    const has = name !== 'idle' && f.def.poses.includes(name) && this.textures.exists(key);
    f.vis.setTexture(has ? key : 'spr_' + f.def.id);
    f.poseHasTex = has;
    // "פופ" קצר + ניצוצות בצבע האלמנט: זה מה שגורם למעבר להרגיש כמו החלפת פוזה
    if (name !== 'idle') this.burst(f, 7);
  }

  burst(f, n) {
    const col = ELEMENTS[f.def.element].color;
    const em = this.add.particles(f.x, f.y - 8, 'spark', {
      speed: { min: 60, max: 150 }, lifespan: 320, scale: { start: 1.1, end: 0 }, tint: col, emitting: false,
    }).setDepth(7);
    em.explode(n);
    this.time.delayedCall(450, () => em.destroy());
  }

  ghost(f) {
    const v = f.vis, col = ELEMENTS[f.def.element].color;
    const g = this.add.image(v.x, v.y, v.texture.key).setOrigin(0.5, 1).setScale(v.scaleX, v.scaleY)
      .setFlipX(v.flipX).setAngle(v.angle).setTintFill(col).setAlpha(0.45).setDepth(2);
    this.tweens.add({ targets: g, alpha: 0, duration: 230, onComplete: () => g.destroy() });
  }

  choosePose(f, grounded) {
    if (f.stun > 0) return 'hit';
    if (f.casting) return 'special';
    if (this.time.now - f.atkT < ATTACK_POSE_MS) return 'attack';
    if (!grounded) return 'jump';
    return 'idle';
  }

  animate(f, inp, grounded) {
    const now = this.time.now, d = f.def, v = f.vis;
    this.setPose(f, this.choosePose(f, grounded));
    if (grounded && !f.wasGrounded) f.landT = now;
    f.wasGrounded = grounded;

    let sx = 1, sy = 1, ang = 0;
    const t = now - f.poseT;
    if (f.pose === 'attack') {
      const k = Math.max(0, 1 - t / ATTACK_POSE_MS);
      ang = f.facing * 18 * k; sx = 1 + 0.16 * k;
    } else if (f.pose === 'special') {
      const k = Math.min(1, t / CAST_MS);
      const pulse = 1 + 0.12 * Math.sin(k * Math.PI * 3) * k;
      sx = sy = pulse; ang = -f.facing * 4 * k;
    } else if (f.pose === 'hit') {
      ang = -f.facing * 14; sx = 1.06; sy = 0.92;
    } else if (f.pose === 'jump') {
      const vy = f.body.velocity.y;
      sy = vy < 0 ? 1.1 : 1.04; sx = vy < 0 ? 0.94 : 0.98;
    } else if (now - f.landT < 110) {
      sy = 0.88; sx = 1.1;
    } else if (inp.move) {
      ang = Math.sin(now / 60) * 5; sy = 1 + 0.02 * Math.sin(now / 30);
    }
    // פריימים מוכנים (הליכה / עמידה / קפיצה) כשאין לפוזה תמונה משלה. בפגיעה נשארים על האיור הקפוא
    if (f.pose !== 'hit' && !f.poseHasTex) {
      const anim = !grounded ? 'jump' : (inp.move || Math.abs(f.body.velocity.x) > 30) ? 'walk' : 'idle';
      const i = anim === 'jump' ? 0 : Math.floor(now / (anim === 'walk' ? 70 : 150)) % FRAMES[anim];
      const k = bakedKey(d.id, anim, i);
      if (this.textures.exists(k)) v.setTexture(k);
    }
    const pop = 1 + 0.15 * Math.max(0, 1 - t / POP_MS);
    const ps = (d.poseScale?.[f.pose] ?? 1) * (f.poseHasTex ? 1 : 1);
    const base = (SPRITE_H * ps) / 256; // כל הספרייטים בגובה 256 (לטקסטורות מוכנות יש שוליים)
    v.setScale(base * sx * pop, base * sy * pop).setAngle(ang);
    const faces = f.pose !== 'idle' && f.poseHasTex ? (d.poseFaces ?? 1) : d.faces;
    v.setFlipX(f.facing !== faces);
    v.setPosition(f.x, f.body.bottom + 2);
    v.setAlpha(f.invuln > 0 && Math.floor(now / 90) % 2 ? 0.4 : 1);
  }

  // ---- קלט ----
  readInput(f) {
    if (f.human) {
      const k = this.keys, t = touch;
      return {
        move: (k.right.isDown || k.d.isDown || t.right ? 1 : 0) - (k.left.isDown || k.a.isDown || t.left ? 1 : 0),
        jump: k.up.isDown || k.w.isDown || k.space.isDown || t.up || t.jump,
        down: k.down.isDown || k.s.isDown || t.down,
        attack: k.j.isDown || t.attack, special: k.k.isDown || t.special,
      };
    }
    return this.ai(f);
  }

  ai(f) {
    const inp = { move: 0, jump: false, down: false, attack: false, special: false };
    const o = this.nearest(f);
    if (!o) return inp;
    const dx = o.x - f.x, dist = Math.abs(dx);
    const edge = MAIN.w / 2 - 15;
    if (f.y > MAIN.top - 10 || (Math.abs(f.x - MAIN.x) > edge && f.y > MAIN.top - 60)) { // חזרה לזירה
      inp.move = f.x < MAIN.x ? 1 : -1; inp.jump = this.time.now % 400 < 80; return inp;
    }
    if (dist > 90) inp.move = Math.sign(dx);
    if (o.y < f.y - 60 && f.body.blocked.down) inp.jump = true;
    if (dist < f.def.attack.range + 24 && Math.random() < 0.06 * f.skill) inp.attack = true;
    if (dist > 160 && Math.abs(o.y - f.y) < 60 && Math.random() < 0.02 * f.skill) inp.special = true;
    return inp;
  }

  // ---- התקפות ----
  doAttack(f) {
    f.atkCd = 380; f.atkT = this.time.now;
    f.attackBox = { until: this.time.now + 140, hit: new Set(), w: f.def.attack.range };
    f.setVelocityX(f.facing * 150); // פסיעה קדימה
    const col = ELEMENTS[f.def.element].color;
    const arc = this.add.arc(f.x + f.facing * 30, f.y, 34, f.facing > 0 ? -60 : 120, f.facing > 0 ? 60 : 240, false, col, 0.7).setDepth(5);
    this.tweens.add({ targets: arc, alpha: 0, duration: 160, onComplete: () => arc.destroy() });
    [0, 50, 100].forEach((ms) => this.time.delayedCall(ms, () => f.active && this.ghost(f)));
  }

  // יכולת: הטענה של 250ms (פוזה מיוחדת עם טבעת זוהרת), ואז ירי ועצירת פריימים קצרה
  startSpecial(f) {
    f.spCd = f.def.special.cooldown;
    f.casting = { until: this.time.now + CAST_MS };
    const col = ELEMENTS[f.def.element].color;
    const ring = this.add.circle(f.x, f.y - 10, 48).setStrokeStyle(4, col, 0.95).setFillStyle(col, 0.15).setDepth(4);
    ring.setScale(1.8).setAlpha(0);
    this.tweens.add({ targets: ring, scale: 0.7, alpha: 1, duration: CAST_MS, ease: 'Quad.easeIn', onComplete: () => ring.destroy() });
  }

  fireSpecial(f) {
    const s = f.def.special;
    const col = ELEMENTS[f.def.element].color;
    const p = this.projectiles.create(f.x + f.facing * 28, f.y - 4, 'orb').setTint(col).setDepth(6);
    p.setDisplaySize(s.size * 2, s.size * 2).setCircle(16);
    p.body.allowGravity = s.gravity > 0; p.body.setGravityY(s.gravity);
    p.setVelocity(f.facing * s.speed, s.gravity > 0 ? -140 : 0);
    p.owner = f; p.dieAt = this.time.now + s.life;
    p.trail = this.add.particles(0, 0, 'spark', {
      follow: p, speed: 30, lifespan: 260, scale: { start: 1, end: 0 }, tint: col, frequency: 28,
    }).setDepth(5);
    const rgb = Phaser.Display.Color.IntegerToRGB(col);
    this.cameras.main.flash(80, rgb.r, rgb.g, rgb.b);
    this.burst(f, 12);
    // עצירת פריימים קצרה ברגע הירי
    this.physics.pause();
    this.time.delayedCall(60, () => { if (!this.over) this.physics.resume(); });
  }

  killProjectile(p) { p.trail?.stop(); this.time.delayedCall(300, () => p.trail?.destroy()); p.destroy(); }

  hit(target, from, dmg, kb, dir) {
    if (target.invuln > 0) return;
    target.percent += dmg; target.taken += dmg; target.lastHitBy = from;
    const power = (kb + target.percent * 4.2) / target.def.stats.weight;
    target.setVelocity(dir * power, -power * 0.55);
    target.stun = 160 + Math.min(power, 600) * 0.4;
    target.casting = null; // פגיעה מפסיקה הטענה
    target.jumpsLeft = Math.max(target.jumpsLeft, 1);
    target.vis.setTintFill(0xffffff);
    this.time.delayedCall(70, () => target.vis.clearTint());
    this.cameras.main.shake(70, 0.003);
  }

  // ---- לולאה ----
  update(_, dt) {
    if (!this.started || this.over) return;
    this.alive().forEach((f) => this.updateFighter(f, dt));
    this.projectiles.getChildren().slice().forEach((p) => {
      if (this.time.now > p.dieAt || p.x < -100 || p.x > 1060 || p.y > 600) return this.killProjectile(p);
      const t = this.enemiesOf(p.owner).find((e) => Phaser.Geom.Intersects.RectangleToRectangle(p.getBounds(), this.hurt(e)));
      if (t) {
        const s = p.owner.def.special;
        this.hit(t, p.owner, s.dmg, s.kb, Math.sign(p.body.velocity.x) || 1);
        this.killProjectile(p);
      }
    });
    this.cfg.onHud?.(this.fighters);
  }

  updateFighter(f, dt) {
    f.invuln = Math.max(0, f.invuln - dt);
    f.stun = Math.max(0, f.stun - dt);
    f.atkCd = Math.max(0, f.atkCd - dt);
    f.spCd = Math.max(0, f.spCd - dt);

    const grounded = f.body.blocked.down || f.body.touching.down;
    if (grounded) f.jumpsLeft = f.def.stats.doubleJumps;

    const inp = this.readInput(f);
    if (f.casting) {
      f.setVelocityX(0);
      if (this.time.now >= f.casting.until) { f.casting = null; this.fireSpecial(f); }
    } else if (f.stun <= 0) {
      if (inp.move) { f.setVelocityX(inp.move * f.def.stats.speed); f.facing = inp.move; }
      if (inp.down && grounded) f.dropUntil = this.time.now + 250; // נפילה דרך פלטפורמה צפה
      if (inp.jump && !f.jumpHeld && (grounded || f.jumpsLeft > 0)) {
        if (!grounded) f.jumpsLeft--;
        f.setVelocityY(-f.def.stats.jump);
      }
      if (inp.attack && f.atkCd <= 0) this.doAttack(f);
      if (inp.special && f.spCd <= 0) this.startSpecial(f);
    }
    f.jumpHeld = inp.jump;
    this.animate(f, inp, grounded);

    const box = f.attackBox;
    if (box) {
      if (this.time.now > box.until) f.attackBox = null;
      else {
        const r = new Phaser.Geom.Rectangle(f.facing > 0 ? f.x + 12 : f.x - 12 - box.w, f.y - 30, box.w, 60);
        this.enemiesOf(f).forEach((e) => {
          if (!box.hit.has(e) && Phaser.Geom.Intersects.RectangleToRectangle(r, this.hurt(e))) {
            box.hit.add(e);
            this.hit(e, f, f.def.attack.dmg, f.def.attack.kb, f.facing);
          }
        });
      }
    }
    if (f.x < BLAST.left || f.x > BLAST.right || f.y < BLAST.top || f.y > BLAST.bottom) this.ko(f);
  }

  ko(f) {
    f.stocks--;
    if (f.lastHitBy && f.lastHitBy !== f) f.lastHitBy.kos++;
    this.cameras.main.flash(180, 255, 255, 255);
    if (f.stocks <= 0) {
      f.setActive(false); f.body.enable = false; f.vis.setVisible(false);
      this.cfg.onHud?.(this.fighters);
      const me = this.fighters[0];
      if (f.human) return this.finish(false);
      if (this.alive().length === 1 && this.alive()[0] === me) return this.finish(true);
      return;
    }
    f.percent = 0; f.invuln = 1800; f.stun = 0; f.lastHitBy = null; f.casting = null;
    f.setPosition(480, -20).setVelocity(0, 0);
  }

  finish(won) {
    this.over = true;
    this.physics.pause();
    const me = this.fighters[0];
    this.cfg.onEnd?.({
      won, def: me.def, kos: me.kos, dmg: Math.round(me.taken),
      place: won ? 1 : this.alive().length + 1,
    });
  }
}
