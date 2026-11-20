// טקסטורות האפקטים, מצוירות בקוד (לבנות, וצובעים אותן ב-setTint לפי האלמנט).
export function makeFxTextures(scene) {
  if (scene.textures.exists('fx_glow')) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const done = (key, w, h) => { g.generateTexture(key, w, h); g.clear(); };

  for (let i = 0; i < 16; i++) g.fillStyle(0xffffff, 0.06 + i * 0.012).fillCircle(32, 32, 32 - i * 1.8);
  done('fx_glow', 64, 64);

  // כדור אוויר: ליבה וקשתות ספירליות
  g.fillStyle(0xffffff, 0.35).fillCircle(32, 32, 30);
  g.fillStyle(0xffffff, 0.9).fillCircle(32, 32, 7);
  [[26, 0.2, 4.2], [19, 1.6, 5.6], [12, 3.0, 7.4]].forEach(([r, a0, a1]) => {
    g.lineStyle(4, 0xffffff, 0.95).beginPath().arc(32, 32, r, a0, a1).strokePath();
  });
  done('fx_airorb', 64, 64);

  // אגרוף אש: אגרוף ואצבעות
  g.fillStyle(0xffffff, 1).fillRoundedRect(8, 12, 30, 24, 7).fillRoundedRect(34, 16, 10, 14, 5);
  [[12, 12], [20, 9], [28, 9], [36, 12]].forEach(([x, y]) => g.fillCircle(x, y, 6.5));
  g.fillStyle(0xffffff, 0.55).fillRect(4, 18, 6, 12);
  done('fx_fist', 48, 40);

  // קיר אדמה / עמוד
  g.fillStyle(0xffffff, 1).fillPoints([
    { x: 0, y: 64 }, { x: 0, y: 16 }, { x: 8, y: 6 }, { x: 15, y: 13 }, { x: 24, y: 2 }, { x: 32, y: 11 }, { x: 40, y: 5 }, { x: 40, y: 64 },
  ], true);
  g.fillStyle(0x000000, 0.18).fillRect(0, 34, 40, 4).fillRect(0, 50, 40, 3);
  g.fillStyle(0xffffff, 0.3).fillRect(5, 14, 5, 44);
  done('fx_wall', 40, 64);

  // סלע
  g.fillStyle(0xffffff, 1).fillPoints([
    { x: 8, y: 40 }, { x: 4, y: 24 }, { x: 18, y: 6 }, { x: 40, y: 2 }, { x: 58, y: 16 }, { x: 62, y: 38 }, { x: 46, y: 60 }, { x: 22, y: 60 },
  ], true);
  g.fillStyle(0x000000, 0.2).fillPoints([{ x: 30, y: 24 }, { x: 62, y: 38 }, { x: 46, y: 60 }, { x: 28, y: 50 }], true);
  g.fillStyle(0xffffff, 0.35).fillPoints([{ x: 18, y: 6 }, { x: 40, y: 2 }, { x: 34, y: 20 }, { x: 14, y: 26 }], true);
  done('fx_rock', 64, 64);

  // רסיס קרח
  g.fillStyle(0xffffff, 1).fillPoints([{ x: 0, y: 8 }, { x: 14, y: 0 }, { x: 40, y: 8 }, { x: 14, y: 16 }], true);
  g.fillStyle(0xffffff, 0.5).fillPoints([{ x: 4, y: 8 }, { x: 14, y: 3 }, { x: 28, y: 8 }], true);
  done('fx_shard', 40, 16);

  // גל מים
  g.fillStyle(0xffffff, 0.9).fillPoints([
    { x: 0, y: 200 }, { x: 8, y: 150 }, { x: 28, y: 100 }, { x: 58, y: 55 }, { x: 98, y: 26 }, { x: 140, y: 20 }, { x: 160, y: 40 },
    { x: 138, y: 60 }, { x: 118, y: 82 }, { x: 114, y: 112 }, { x: 128, y: 142 }, { x: 160, y: 172 }, { x: 160, y: 200 },
  ], true);
  g.fillStyle(0xffffff, 1);
  [[150, 36, 9], [128, 28, 7], [104, 34, 8], [84, 46, 7], [66, 70, 6]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
  g.fillStyle(0x000000, 0.12).fillPoints([{ x: 0, y: 200 }, { x: 30, y: 120 }, { x: 90, y: 90 }, { x: 160, y: 200 }], true);
  done('fx_wave', 160, 200);

  // עמוד מים
  g.fillStyle(0xffffff, 0.85).fillRoundedRect(8, 0, 44, 200, 22);
  g.fillStyle(0xffffff, 0.45).fillRect(18, 8, 8, 184);
  done('fx_column', 60, 200);

  // טורנדו
  for (let i = 0; i < 10; i++) {
    const y = 8 + i * 19, w = 24 + i * 7;
    g.lineStyle(5, 0xffffff, 0.35 + (i % 3) * 0.2).beginPath().arc(45, y, w / 2, Math.PI * 0.05, Math.PI * 0.95).strokePath();
    g.lineStyle(3, 0xffffff, 0.8).beginPath().arc(45, y + 6, w / 2.4, Math.PI * 1.1, Math.PI * 1.9).strokePath();
  }
  done('fx_tornado', 90, 200);

  // גלגל אש
  g.lineStyle(7, 0xffffff, 1).strokeCircle(24, 24, 17);
  g.lineStyle(4, 0xffffff, 0.9);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.lineBetween(24, 24, 24 + Math.cos(a) * 17, 24 + Math.sin(a) * 17); }
  g.fillStyle(0xffffff, 1).fillCircle(24, 24, 6);
  done('fx_wheel', 48, 48);

  g.destroy();
}
