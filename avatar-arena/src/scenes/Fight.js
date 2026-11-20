import Phaser from 'phaser';
import { byId, ELEMENTS } from '../data/characters.js';

const STOCKS = 3;
const BLAST = { left: -120, right: 1080, top: -160, bottom: 660 };

// פרטי עיצוב לכל דמות (2D מצויר בקוד, עד שתהיה גרפיקה אמיתית)
const LOOKS = {
  aang:   { skin: 0xf1c27d, cloth: 0xf2b134, accent: 0x3a8dde, hair: null },
  katara: { skin: 0xb98a5a, cloth: 0x3a8dde, accent: 0xffffff, hair: 0x4a2c17 },
  toph:   { skin: 0xf3dcc0, cloth: 0x4f8f4f, accent: 0xd9c27a, hair: 0x111111 },
  zuko:   { skin: 0xf1c27d, cloth: 0xc0392b, accent: 0x222222, hair: 0x111111 },
};

export default class Fight extends Phaser.Scene {
  constructor() { super('Fight'); }

  init(data) { this.cfg = { p1: data.p1 || 'aang', bots: data.bots || ['zuko'] }; }

  create() {
    this.over = false;
    this.makeTextures();
    this.drawBackground();

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
    const ids = [this.cfg.p1, ...this.cfg.bots];
    const xs = { 1: [480], 2: [360, 600], 3: [300, 480, 660], 4: [260, 400, 560, 700] }[ids.length];
    this.fighters = ids.map((id, i) => this.spawnFighter(byId(id), i, xs[i], i === 0));
    this.fighters.forEach((f) => {
      this.physics.add.collider(f, this.platforms, null, (fi, p) => p.solid || (fi.body.velocity.y >= 0 && fi.body.bottom <= p.body.top + 14));
    });
    this.buildHud();
  }

  drawBackground() {
    const g = this.add.graphics().setDepth(-10);
    g.fillGradientStyle(0x2a3a6b, 0x2a3a6b, 0xf0a868, 0xf0a868, 1).fillRect(0, 0, 960, 540);
    g.fillStyle(0xffe9a8, 0.9).fillCircle(760, 170, 54);
    g.fillStyle(0x3a2f5b, 1).fillTriangle(-40, 440, 180, 200, 400, 440).fillTriangle(260, 440, 520, 150, 780, 440).fillTriangle(620, 440, 840, 230, 1040, 440);
    g.fillStyle(0x24203f, 1).fillTriangle(-100, 440, 100, 290, 300, 440).fillTriangle(500, 440, 720, 280, 960, 440);
  }

  addPlatform(x, y, w, h, solid) {
    const p = this.platforms.create(x, y, solid ? 'plat_main' : 'plat_float');
    p.setDisplaySize(w, h).refreshBody();
    p.solid = solid;
  }

  makeTextures() {
    if (this.textures.exists('plat_main')) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x6b4f3a).fillRect(0, 0, 8, 8).fillStyle(0x4f8f4f).fillRect(0, 0, 8, 3).generateTexture('plat_main', 8, 8);
    g.clear().fillStyle(0xb9a27a).fillRect(0, 0, 8, 8).fillStyle(0x8a7550).fillRect(0, 5, 8, 3).generateTexture('plat_float', 8, 8);
    g.clear().fillStyle(0xffffff).fillCircle(16, 16, 16).generateTexture('orb', 32, 32);
    g.clear().fillStyle(0xffffff).fillCircle(4, 4, 4).generateTexture('spark', 8, 8);
    Object.entries(LOOKS).forEach(([id, L]) => {
      g.clear();
      g.fillStyle(0x222222, 0.35).fillEllipse(20, 58, 28, 6);                       // צל
      g.fillStyle(L.cloth).fillRoundedRect(8, 24, 24, 30, 6);                       // גוף
      g.fillStyle(L.accent).fillRect(8, 38, 24, 4);                                 // חגורה
      g.fillStyle(L.skin).fillCircle(20, 14, 11);                                   // ראש
      if (L.hair) g.fillStyle(L.hair).fillRoundedRect(8, 2, 24, 9, 4);              // שיער
      if (id === 'aang') g.fillStyle(L.accent).fillTriangle(20, 3, 15, 10, 25, 10); // חץ
      if (id === 'katara') g.fillStyle(L.hair).fillCircle(8, 18, 4);                // קוקו
      if (id === 'zuko') g.fillStyle(0xb03030).fillCircle(26, 10, 3.5).fillStyle(L.hair).fillRect(17, -1, 6, 4);
      if (id === 'toph') g.fillStyle(L.hair).fillCircle(20, 3, 4);
      g.fillStyle(0xffffff).fillCircle(25, 14, 3).fillStyle(0x000000).fillCircle(26, 14, 1.6); // עין
      g.generateTexture('char_' + id, 40, 62);
    });
    g.destroy();
  }

  spawnFighter(def, idx, x, human) {
    const f = this.physics.add.sprite(x, 250, 'char_' + def.id);
    f.body.setSize(26, 56).setOffset(7, 4);
    f.setDragX(1400).setMaxVelocity(700, 900);
    f.def = def; f.idx = idx; f.human = human;
    f.percent = 0; f.stocks = STOCKS; f.facing = x < 480 ? 1 : -1;
    f.jumpsLeft = def.stats.doubleJumps; f.stun = 0; f.invuln = 1500;
    f.atkCd = 0; f.spCd = 0; f.attackBox = null; f.jumpHeld = false;
    f.skill = human ? 1 : 0.7 + Math.random() * 0.5; // בוטים נבדלים בחדות
    return f;
  }

  alive() { return this.fighters.filter((f) => f.stocks > 0); }
  enemiesOf(f) { return this.alive().filter((o) => o !== f); }
  nearest(f) {
    return this.enemiesOf(f).sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0];
  }

  // ---- בקרות מגע: נבדקות כל פריים מכל האצבעות, אז אפשר ללחוץ כמה כפתורים ולהחליק ביניהם ----
  buildTouch() {
    this.touchOn = this.sys.game.device.input.touch;
    if (!this.touchOn) return;
    this.buttons = [
      { key: 'left', x: 80, y: 470, r: 52, label: '◀' },
      { key: 'right', x: 215, y: 470, r: 52, label: '▶' },
      { key: 'attack', x: 880, y: 470, r: 52, label: '⚔' },
      { key: 'special', x: 770, y: 490, r: 46, label: '✦' },
      { key: 'jump', x: 840, y: 360, r: 50, label: '⤒' },
    ];
    this.buttons.forEach((b) => {
      b.circle = this.add.circle(b.x, b.y, b.r, 0xffffff, 0.16).setStrokeStyle(3, 0xffffff, 0.5).setDepth(50);
      this.add.text(b.x, b.y, b.label, { fontSize: '34px', color: '#fff' }).setOrigin(0.5).setDepth(51);
    });
  }

  pollTouch() {
    if (!this.touchOn) return;
    Object.keys(this.touch).forEach((k) => (this.touch[k] = false));
    this.input.manager.pointers.forEach((p) => {
      if (!p.isDown) return;
      this.buttons.forEach((b) => {
        if (Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) <= b.r + 14) this.touch[b.key] = true;
      });
    });
    this.buttons.forEach((b) => b.circle.setFillStyle(0xffffff, this.touch[b.key] ? 0.38 : 0.16));
  }

  buildHud() {
    const n = this.fighters.length, gap = 230;
    const x0 = 480 - ((n - 1) * gap) / 2;
    this.hud = this.fighters.map((f, i) => {
      const x = x0 + i * gap, c = ELEMENTS[f.def.element].color;
      this.add.rectangle(x, 36, 210, 56, 0x0b1220, 0.8).setStrokeStyle(3, c).setDepth(40);
      this.add.text(x - 96, 22, f.human ? `${f.def.name} (אתה)` : f.def.name, { fontSize: '15px', color: '#fff' }).setDepth(41);
      const pct = this.add.text(x - 96, 38, '0%', { fontSize: '26px', fontStyle: 'bold', color: '#fff' }).setDepth(41);
      const lives = this.add.text(x + 96, 52, '', { fontSize: '14px', color: '#ffd166' }).setOrigin(1, 0.5).setDepth(41);
      return { pct, lives };
    });
  }

  // ---- קלט ----
  readInput(f) {
    if (f.human) {
      const k = this.keys, t = this.touch;
      return {
        move: (k.right.isDown || k.d.isDown || t.right ? 1 : 0) - (k.left.isDown || k.a.isDown || t.left ? 1 : 0),
        jump: k.up.isDown || k.w.isDown || k.space.isDown || t.jump,
        attack: k.j.isDown || t.attack, special: k.k.isDown || t.special,
      };
    }
    return this.ai(f);
  }

  ai(f) {
    const inp = { move: 0, jump: false, attack: false, special: false };
    const o = this.nearest(f);
    if (!o) return inp;
    const dx = o.x - f.x, dist = Math.abs(dx);
    if (f.y > 430 || ((f.x < 190 || f.x > 770) && f.y > 380)) { // חזרה לזירה
      inp.move = f.x < 480 ? 1 : -1; inp.jump = this.time.now % 400 < 80; return inp;
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
    f.attackBox = { until: this.time.now + 140, hit: new Set(), w: f.def.attack.range, h: 40 };
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

  hit(target, dmg, kb, dir) {
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
    this.pollTouch();
    this.alive().forEach((f) => this.updateFighter(f, dt));
    this.projectiles.getChildren().slice().forEach((p) => {
      if (this.time.now > p.dieAt || p.x < -100 || p.x > 1060 || p.y > 600) return this.killProjectile(p);
      const t = this.enemiesOf(p.owner).find((e) => Phaser.Geom.Intersects.RectangleToRectangle(p.getBounds(), e.getBounds()));
      if (t) {
        const s = p.owner.def.special;
        this.hit(t, s.dmg, s.kb, Math.sign(p.body.velocity.x) || 1);
        this.killProjectile(p);
      }
    });
    this.fighters.forEach((f, i) => {
      this.hud[i].pct.setText(Math.round(f.percent) + '%');
      this.hud[i].lives.setText('●'.repeat(Math.max(0, f.stocks)));
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
    // תנועת הליכה / אוויר פשוטה
    f.setAngle(f.stun > 0 ? f.body.velocity.x * 0.04 : grounded && inp.move ? Math.sin(this.time.now / 60) * 5 : 0);

    const box = f.attackBox;
    if (box) {
      if (this.time.now > box.until) f.attackBox = null;
      else {
        const r = new Phaser.Geom.Rectangle(f.facing > 0 ? f.x + 14 : f.x - 14 - box.w, f.y - 20, box.w, box.h);
        this.enemiesOf(f).forEach((e) => {
          if (!box.hit.has(e) && Phaser.Geom.Intersects.RectangleToRectangle(r, e.getBounds())) {
            box.hit.add(e);
            this.hit(e, f.def.attack.dmg, f.def.attack.kb, f.facing);
          }
        });
      }
    }
    if (f.x < BLAST.left || f.x > BLAST.right || f.y < BLAST.top || f.y > BLAST.bottom) this.ko(f);
  }

  ko(f) {
    f.stocks--;
    this.cameras.main.flash(180, 255, 255, 255);
    if (f.stocks <= 0) {
      f.setActive(false).setVisible(false); f.body.enable = false;
      if (f.human) return this.endGame(false);
      if (this.alive().length === 1) return this.endGame(true);
      return;
    }
    f.percent = 0; f.invuln = 1800; f.stun = 0;
    f.setPosition(480, -20).setVelocity(0, 0);
  }

  endGame(won) {
    this.over = true;
    this.physics.pause();
    this.add.rectangle(480, 270, 960, 540, 0x000000, 0.6).setDepth(60);
    this.add.text(480, 210, won ? 'ניצחת! 🏆' : 'הפסדת...', { fontSize: '60px', fontStyle: 'bold', color: '#ffd166' }).setOrigin(0.5).setDepth(61);
    const mk = (y, label, fn) => this.add.text(480, y, label, { fontSize: '28px', color: '#0b0f1a', backgroundColor: '#ffd166', padding: { x: 24, y: 10 } })
      .setOrigin(0.5).setDepth(61).setInteractive({ useHandCursor: true }).on('pointerdown', fn);
    mk(310, '↻ שוב', () => this.scene.restart(this.cfg));
    mk(380, 'לתפריט', () => this.scene.start('Menu'));
  }
}
