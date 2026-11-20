import Phaser from 'phaser';
import { byId, ELEMENTS } from '../data/characters.js';

const STOCKS = 3;
const BLAST = { left: -120, right: 1080, top: -160, bottom: 660 };

export default class Fight extends Phaser.Scene {
  constructor() { super('Fight'); }

  init(data) { this.ids = { p1: data.p1 || 'aang', p2: data.p2 || 'zuko' }; }

  create() {
    this.over = false;
    this.makeTextures();
    this.add.rectangle(480, 270, 960, 540, 0x16213a);

    // פלטפורמות: ראשית (מוצקה) ושתי צפות (אפשר לקפוץ דרכן מלמטה)
    this.platforms = this.physics.add.staticGroup();
    this.addPlatform(480, 430, 560, 28, true);
    this.addPlatform(300, 305, 150, 14, false);
    this.addPlatform(660, 305, 150, 14, false);

    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', a: 'A', d: 'D', w: 'W', j: 'J', k: 'K', space: 'SPACE',
    });
    this.touch = { left: false, right: false, jump: false, attack: false, special: false };
    this.buildTouch();

    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.fighters = [
      this.spawnFighter(byId(this.ids.p1), 0, 360, true),
      this.spawnFighter(byId(this.ids.p2), 1, 600, false),
    ];
    this.fighters.forEach((f) => {
      f.other = this.fighters[1 - f.idx];
      this.physics.add.collider(f, this.platforms, null, (fi, p) => p.solid || (fi.body.velocity.y >= 0 && fi.body.bottom <= p.body.top + 14));
    });
    this.buildHud();
  }

  addPlatform(x, y, w, h, solid) {
    const p = this.platforms.create(x, y, solid ? 'plat_main' : 'plat_float');
    p.setDisplaySize(w, h).refreshBody();
    p.solid = solid;
  }

  makeTextures() {
    if (this.textures.exists('plat_main')) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x4b5563).fillRect(0, 0, 8, 8).generateTexture('plat_main', 8, 8);
    g.clear().fillStyle(0x94a3b8).fillRect(0, 0, 8, 8).generateTexture('plat_float', 8, 8);
    g.clear().fillStyle(0xffffff).fillCircle(16, 16, 16).generateTexture('orb', 32, 32);
    Object.entries(ELEMENTS).forEach(([key, el]) => {
      g.clear().fillStyle(el.color).fillRoundedRect(0, 0, 36, 56, 8)
        .fillStyle(0xffffff).fillRect(24, 14, 8, 8).fillStyle(0x000000).fillRect(28, 16, 4, 4)
        .generateTexture('body_' + key, 36, 56);
    });
    g.destroy();
  }

  spawnFighter(def, idx, x, human) {
    const f = this.physics.add.sprite(x, 250, 'body_' + def.element);
    f.setCollideWorldBounds(false).setDragX(1400).setMaxVelocity(700, 900);
    f.def = def; f.idx = idx; f.human = human;
    f.percent = 0; f.stocks = STOCKS; f.facing = idx === 0 ? 1 : -1;
    f.jumpsLeft = def.stats.doubleJumps; f.stun = 0; f.invuln = 1500;
    f.atkCd = 0; f.spCd = 0; f.attackBox = null; f.jumpHeld = false; f.aiT = 0;
    return f;
  }

  buildTouch() {
    if (!this.sys.game.device.input.touch) return;
    const mk = (x, y, label, key, r = 38) => {
      this.add.circle(x, y, r, 0xffffff, 0.15).setStrokeStyle(2, 0xffffff, 0.4).setScrollFactor(0).setDepth(50)
        .setInteractive().on('pointerdown', () => { this.touch[key] = true; })
        .on('pointerup', () => { this.touch[key] = false; })
        .on('pointerout', () => { this.touch[key] = false; });
      this.add.text(x, y, label, { fontSize: '26px', color: '#fff' }).setOrigin(0.5).setDepth(51);
    };
    mk(70, 470, '◀', 'left'); mk(170, 470, '▶', 'right');
    mk(890, 470, '⚔', 'attack'); mk(800, 490, '✦', 'special'); mk(850, 390, '⤒', 'jump');
  }

  buildHud() {
    this.hud = this.fighters.map((f, i) => {
      const x = i === 0 ? 170 : 790;
      const c = ELEMENTS[f.def.element].color;
      this.add.rectangle(x, 495, 230, 70, 0x0b1220, 0.85).setStrokeStyle(3, c).setDepth(40);
      this.add.text(x, 475, f.def.name, { fontSize: '18px', color: '#fff' }).setOrigin(0.5).setDepth(41);
      const pct = this.add.text(x, 503, '0%', { fontSize: '30px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(41);
      const lives = this.add.text(x, 528, '', { fontSize: '14px', color: '#ffd166' }).setOrigin(0.5).setDepth(41);
      return { pct, lives };
    });
  }

  // ---- קלט ----
  readInput(f) {
    if (f.human) {
      const k = this.keys, t = this.touch;
      const jump = k.up.isDown || k.w.isDown || k.space.isDown || t.jump;
      return {
        move: (k.right.isDown || k.d.isDown || t.right ? 1 : 0) - (k.left.isDown || k.a.isDown || t.left ? 1 : 0),
        jump, attack: k.j.isDown || t.attack, special: k.k.isDown || t.special,
      };
    }
    return this.ai(f);
  }

  ai(f) {
    const o = f.other, dx = o.x - f.x, dist = Math.abs(dx);
    const offStage = f.x < 190 || f.x > 770;
    const inp = { move: 0, jump: false, attack: false, special: false };
    if (f.y > 430 || offStage && f.y > 380) {
      inp.move = f.x < 480 ? 1 : -1; inp.jump = (this.time.now % 400) < 80; return inp;
    }
    if (dist > 90) inp.move = Math.sign(dx);
    else if (dist < 40) inp.move = -Math.sign(dx) * (Math.random() < 0.01 ? 1 : 0);
    if (o.y < f.y - 60 && f.body.blocked.down) inp.jump = true;
    if (dist < f.def.attack.range + 24 && Math.random() < 0.06) inp.attack = true;
    if (dist > 160 && Math.abs(o.y - f.y) < 60 && Math.random() < 0.02) inp.special = true;
    return inp;
  }

  // ---- התקפות ----
  doAttack(f) {
    f.atkCd = 380;
    const a = f.def.attack;
    f.attackBox = { until: this.time.now + 140, hit: false, w: a.range, h: 40 };
    f.setTint(0xffffaa); this.time.delayedCall(120, () => f.clearTint());
  }

  doSpecial(f) {
    const s = f.def.special;
    f.spCd = s.cooldown;
    const col = ELEMENTS[f.def.element].color;
    const p = this.projectiles.create(f.x + f.facing * 28, f.y - 4, 'orb').setTint(col);
    p.setDisplaySize(s.size * 2, s.size * 2).setCircle(16);
    p.body.allowGravity = s.gravity > 0; p.body.setGravityY(s.gravity);
    p.setVelocity(f.facing * s.speed, s.gravity > 0 ? -140 : 0);
    p.owner = f; p.dieAt = this.time.now + s.life;
  }

  hit(target, from, dmg, kb, dir) {
    if (target.invuln > 0) return;
    target.percent += dmg;
    const power = (kb + target.percent * 4.2) / target.def.stats.weight;
    target.setVelocity(dir * power, -power * 0.55);
    target.stun = 160 + Math.min(power, 600) * 0.4;
    target.jumpsLeft = Math.max(target.jumpsLeft, 1);
    target.setTint(0xff6666); this.time.delayedCall(140, () => target.clearTint());
    this.cameras.main.shake(70, 0.003);
  }

  // ---- לולאה ----
  update(_, dt) {
    if (this.over) return;
    this.fighters.forEach((f) => this.updateFighter(f, dt));
    this.projectiles.getChildren().forEach((p) => {
      if (this.time.now > p.dieAt || p.x < -100 || p.x > 1060 || p.y > 600) return p.destroy();
      const t = p.owner.other;
      if (Phaser.Geom.Intersects.RectangleToRectangle(p.getBounds(), t.getBounds())) {
        const s = p.owner.def.special;
        this.hit(t, p.owner, s.dmg, s.kb, Math.sign(p.body.velocity.x) || 1);
        p.destroy();
      }
    });
    this.fighters.forEach((f, i) => {
      this.hud[i].pct.setText(Math.round(f.percent) + '%');
      this.hud[i].lives.setText('●'.repeat(f.stocks));
    });
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
      f.setFlipX(f.facing < 0);
      if (inp.jump && !f.jumpHeld && (grounded || f.jumpsLeft > 0)) {
        if (!grounded) f.jumpsLeft--;
        f.setVelocityY(-f.def.stats.jump);
      }
      if (inp.attack && f.atkCd <= 0) this.doAttack(f);
      if (inp.special && f.spCd <= 0) this.doSpecial(f);
    }
    f.jumpHeld = inp.jump;

    const box = f.attackBox;
    if (box) {
      if (this.time.now > box.until) f.attackBox = null;
      else if (!box.hit) {
        const r = new Phaser.Geom.Rectangle(f.facing > 0 ? f.x + 14 : f.x - 14 - box.w, f.y - 20, box.w, box.h);
        if (Phaser.Geom.Intersects.RectangleToRectangle(r, f.other.getBounds())) {
          box.hit = true;
          this.hit(f.other, f, f.def.attack.dmg, f.def.attack.kb, f.facing);
        }
      }
    }

    if (f.x < BLAST.left || f.x > BLAST.right || f.y < BLAST.top || f.y > BLAST.bottom) this.ko(f);
  }

  ko(f) {
    f.stocks--;
    this.cameras.main.flash(180, 255, 255, 255);
    if (f.stocks <= 0) return this.endGame(f.other);
    f.percent = 0; f.invuln = 1800; f.stun = 0;
    f.setPosition(480, -20).setVelocity(0, 0);
  }

  endGame(winner) {
    this.over = true;
    this.physics.pause();
    const human = winner.human;
    this.add.rectangle(480, 270, 960, 540, 0x000000, 0.6).setDepth(60);
    this.add.text(480, 220, human ? 'ניצחת! 🏆' : 'הפסדת...', { fontSize: '60px', fontStyle: 'bold', color: '#ffd166' }).setOrigin(0.5).setDepth(61);
    this.add.text(480, 290, `${winner.def.name} ניצח`, { fontSize: '26px', color: '#fff' }).setOrigin(0.5).setDepth(61);
    const b = this.add.text(480, 360, 'לתפריט', { fontSize: '30px', color: '#0b0f1a', backgroundColor: '#ffd166', padding: { x: 24, y: 10 } })
      .setOrigin(0.5).setDepth(61).setInteractive({ useHandCursor: true });
    const go = () => this.scene.start('Menu');
    b.on('pointerdown', go); this.input.keyboard.once('keydown-ENTER', go);
  }
}
