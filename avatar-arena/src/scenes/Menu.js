import Phaser from 'phaser';

export default class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    const { width: w, height: h } = this.scale;
    this.add.text(w / 2, 150, 'AVATAR ARENA', { fontSize: '64px', fontStyle: 'bold', color: '#ffd166' }).setOrigin(0.5);
    this.add.text(w / 2, 215, 'ארבע אומות · קרב אחד', { fontSize: '24px', color: '#cbd5e1' }).setOrigin(0.5);
    const btn = this.add.text(w / 2, 330, '▶  התחל קרב', {
      fontSize: '34px', color: '#0b0f1a', backgroundColor: '#ffd166', padding: { x: 28, y: 14 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start('Select'));
    this.add.text(w / 2, h - 50, 'מקלדת: חצים/WASD לתנועה · J התקפה · K יכולת', { fontSize: '16px', color: '#94a3b8' }).setOrigin(0.5);
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Select'));
  }
}
