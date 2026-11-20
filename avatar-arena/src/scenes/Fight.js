import Phaser from 'phaser';
import { CHARACTERS, byId, ELEMENTS } from '../data/characters.js';
import { touch } from '../ui/input.js';

const STOCKS = 3;
const SPRITE_H = 100, BODY_W = 34, BODY_H = 74;
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
    CHARACTERS.forEach((c) => { if (!this.textures.exists('spr_' + c.id)) this.load.image('spr_' + c.id, `sprites/${c.id}.png`); });
  }

  create() {
    this.makeTextures();
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

  spawnFighter(def, idx, x, human) {
    const f = this.physics.add.sprite(x, 150, 'spr_' + def.id);
    const sc = SPRITE_H / f.height;
    f.setScale(sc);
    f.body.setSize(BODY_W / sc, BODY_H / sc).setOffset((f.width - BODY_W / sc) / 2, f.height - BODY_H / sc);
    f.setDragX(1400).setMaxVelocity(700, 900);
    Object.assign(f, {
      def, idx, human, uid: idx, percent: 0, stocks: STOCKS, facing: x < 480 ? 1 : -1,
      jumpsLeft: def.stats.doubleJumps, stun: 0, invuln: 1500, atkCd: 0, spCd: 0, attackBox: null,
      jumpHeld: false, dropUntil: 0, kos: 0, taken: 0, lastHitBy: null,
      skill: human ? 1 : 0.7 + Math.random() * 0.5,
    });
    return f;
  }

  hurt(f) { return new Phaser.Geom.Rectangle(f.body.x, f.body.y, f.body.width, f.body.height); }
  alive() { return this.fighters.filter((f) => f.stocks > 0); }
  enemiesOf(f) { return this.alive().filter((o) => o !== f); }
  nearest(f) { return this.enemiesOf(f).sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0]; }

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
    f.atkCd = 380;
    f.attackBox = { until: this.time.now + 140, hit: new Set(), w: f.def.attack.range };
    const col = ELEMENTS[f.def.element].color;
    const arc = this.add.arc(f.x + f.facing * 30, f.y, 34, f.facing > 0 ? -60 : 120, f.facing > 0 ? 60 : 240, false, col, 0.7).setDepth(5);
    this.tweens.add({ targets: arc, alpha: 0, duration: 160, onComplete: () => arc.destroy() });
  }

  doSpecial(f) {
    const s = f.def.special;
    f.spCd = s.cooldown;
    const col = ELEMENTS[f.def.element].color;
    const p = this.projectiles.create(f.x + f.facing * 28, f.y - 4, 'orb').setTint(col).setDepth(6);
    p.setDisplaySize(s.size * 2, s.size * 2).setCircle(16);
    p.body.allowGravity = s.gravity > 0; p.body.setGravityY(s.gravity);
    p.setVelocity(f.facing * s.speed, s.gravity > 0 ? -140 : 0);
    p.owner = f; p.dieAt = this.time.now + s.life;
    p.trail = this.add.particles(0, 0, 'spark', {
      follow: p, speed: 30, lifespan: 260, scale: { start: 1, end: 0 }, tint: col, frequency: 28,
    }).setDepth(5);
  }

  killProjectile(p) { p.trail?.stop(); this.time.delayedCall(300, () => p.trail?.destroy()); p.destroy(); }

  hit(target, from, dmg, kb, dir) {
    if (target.invuln > 0) return;
    target.percent += dmg; target.taken += dmg; target.lastHitBy = from;
    const power = (kb + target.percent * 4.2) / target.def.stats.weight;
    target.setVelocity(dir * power, -power * 0.55);
    target.stun = 160 + Math.min(power, 600) * 0.4;
    target.jumpsLeft = Math.max(target.jumpsLeft, 1);
    target.setTint(0xff6666); this.time.delayedCall(140, () => target.clearTint());
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
    f.setAlpha(f.invuln > 0 && Math.floor(this.time.now / 90) % 2 ? 0.4 : 1);

    const grounded = f.body.blocked.down || f.body.touching.down;
    if (grounded) f.jumpsLeft = f.def.stats.doubleJumps;

    const inp = this.readInput(f);
    if (f.stun <= 0) {
      if (inp.move) { f.setVelocityX(inp.move * f.def.stats.speed); f.facing = inp.move; }
      f.setFlipX(f.facing !== f.def.faces);
      if (inp.down && grounded) f.dropUntil = this.time.now + 250; // נפילה דרך פלטפורמה צפה
      if (inp.jump && !f.jumpHeld && (grounded || f.jumpsLeft > 0)) {
        if (!grounded) f.jumpsLeft--;
        f.setVelocityY(-f.def.stats.jump);
      }
      if (inp.attack && f.atkCd <= 0) this.doAttack(f);
      if (inp.special && f.spCd <= 0) this.doSpecial(f);
    }
    f.jumpHeld = inp.jump;
    f.setAngle(f.stun > 0 ? f.body.velocity.x * 0.04 : grounded && inp.move ? Math.sin(this.time.now / 60) * 5 : 0);

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
      f.setActive(false).setVisible(false); f.body.enable = false;
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
    });
  }
}
