import Phaser from 'phaser';
import { CHARACTERS } from '../data/characters.js';

export default class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    this.add.text(480, 270, 'טוען...', { fontSize: '28px', color: '#ffd166' }).setOrigin(0.5);
    CHARACTERS.forEach((c) => this.load.image('spr_' + c.id, `sprites/${c.id}.png`));
  }
  create() { this.scene.start('Menu'); }
}
