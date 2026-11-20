import Phaser from 'phaser';
import Menu from './scenes/Menu.js';
import Select from './scenes/Select.js';
import Fight from './scenes/Fight.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#101828',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 1100 }, debug: false } },
  input: { activePointers: 4 },
  scene: [Menu, Select, Fight],
});
