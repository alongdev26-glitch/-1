import Phaser from 'phaser';
import { CHARACTERS, ELEMENTS } from '../data/characters.js';

export default class Select extends Phaser.Scene {
  constructor() { super('Select'); }
  create() {
    const { width: w } = this.scale;
    this.add.text(w / 2, 50, 'בחר דמות', { fontSize: '38px', fontStyle: 'bold', color: '#ffd166' }).setOrigin(0.5);
    this.index = 0;
    this.cards = CHARACTERS.map((c, i) => {
      const x = 130 + i * 233;
      const col = ELEMENTS[c.element].color;
      const bg = this.add.rectangle(x, 270, 210, 360, 0x1e293b).setStrokeStyle(4, 0x334155)
        .setInteractive({ useHandCursor: true });
      this.add.rectangle(x, 150, 70, 100, col).setStrokeStyle(2, 0xffffff);
      this.add.text(x, 235, c.name, { fontSize: '30px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
      this.add.text(x, 270, `${ELEMENTS[c.element].name} · רמה ${c.tier}`, { fontSize: '18px', color: '#cbd5e1' }).setOrigin(0.5);
      this.add.text(x, 320, `מהירות ${c.stats.speed}\nמשקל ${c.stats.weight}\nיכולת: ${c.special.name}\nנזק ${c.special.dmg}`, {
        fontSize: '16px', color: '#94a3b8', align: 'center', lineSpacing: 6,
      }).setOrigin(0.5, 0);
      bg.on('pointerdown', () => { this.index = i; this.refresh(); this.start(); });
      return bg;
    });
    this.add.text(w / 2, 505, 'חצים לבחירה · Enter לאישור או לחיצה על דמות', { fontSize: '16px', color: '#94a3b8' }).setOrigin(0.5);
    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => { this.index = Math.max(0, this.index - 1); this.refresh(); });
    kb.on('keydown-RIGHT', () => { this.index = Math.min(CHARACTERS.length - 1, this.index + 1); this.refresh(); });
    kb.on('keydown-ENTER', () => this.start());
    this.refresh();
  }
  refresh() {
    this.cards.forEach((c, i) => c.setStrokeStyle(4, i === this.index ? 0xffd166 : 0x334155));
  }
  start() {
    const p1 = CHARACTERS[this.index];
    const others = CHARACTERS.filter((c) => c.id !== p1.id);
    const p2 = Phaser.Utils.Array.GetRandom(others);
    this.scene.start('Fight', { p1: p1.id, p2: p2.id });
  }
}
