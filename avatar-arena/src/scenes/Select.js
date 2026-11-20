import Phaser from 'phaser';
import { CHARACTERS, ELEMENTS } from '../data/characters.js';

export default class Select extends Phaser.Scene {
  constructor() { super('Select'); }
  create() {
    const { width: w } = this.scale;
    this.add.text(w / 2, 50, 'בחר דמות', { fontSize: '38px', fontStyle: 'bold', color: '#ffd166' }).setOrigin(0.5);
    this.index = 0;
    this.botCount = 1;
    this.cards = CHARACTERS.map((c, i) => {
      const x = 130 + i * 233;
      const col = ELEMENTS[c.element].color;
      const bg = this.add.rectangle(x, 270, 210, 360, 0x1e293b).setStrokeStyle(4, 0x334155)
        .setInteractive({ useHandCursor: true });
      const img = this.add.image(x, 150, 'spr_' + c.id);
      img.setScale(Math.min(125 / img.height, 180 / img.width));
      this.add.text(x, 235, c.name, { fontSize: '30px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
      this.add.text(x, 270, `${ELEMENTS[c.element].name} · רמה ${c.tier}`, { fontSize: '18px', color: '#cbd5e1' }).setOrigin(0.5);
      this.add.text(x, 320, `מהירות ${c.stats.speed}\nמשקל ${c.stats.weight}\nיכולת: ${c.special.name}\nנזק ${c.special.dmg}`, {
        fontSize: '16px', color: '#94a3b8', align: 'center', lineSpacing: 6,
      }).setOrigin(0.5, 0);
      bg.on('pointerdown', () => { this.index = i; this.refresh(); this.start(); });
      return bg;
    });
    this.add.text(w / 2, 472, 'כמה בוטים?', { fontSize: '20px', color: '#cbd5e1' }).setOrigin(0.5);
    this.botBtns = [1, 2, 3].map((n, i) => this.add.text(w / 2 - 100 + i * 100, 505, `${n}`, {
      fontSize: '26px', color: '#0b0f1a', backgroundColor: '#64748b', padding: { x: 26, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.botCount = n; this.refresh(); }));
    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => { this.index = Math.max(0, this.index - 1); this.refresh(); });
    kb.on('keydown-RIGHT', () => { this.index = Math.min(CHARACTERS.length - 1, this.index + 1); this.refresh(); });
    kb.on('keydown-ENTER', () => this.start());
    this.refresh();
  }
  refresh() {
    this.cards.forEach((c, i) => c.setStrokeStyle(4, i === this.index ? 0xffd166 : 0x334155));
    this.botBtns.forEach((b, i) => b.setBackgroundColor(i + 1 === this.botCount ? '#ffd166' : '#64748b'));
  }
  start() {
    const p1 = CHARACTERS[this.index];
    const others = Phaser.Utils.Array.Shuffle(CHARACTERS.filter((c) => c.id !== p1.id));
    this.scene.start('Fight', { p1: p1.id, bots: others.slice(0, this.botCount).map((c) => c.id) });
  }
}
