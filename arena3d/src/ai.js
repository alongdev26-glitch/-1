// בוט: מתקרב, תוקף במרווחים, ולעיתים מפעיל יכולת. level 1..5
export function makeBot(level = 3) {
  let think = 0, mode = 'approach', side = 1, mt = 0;
  return (dt, me, foe) => {
    const cmd = { x: 0, z: 0, attack: false, jump: false, special: false };
    if (!foe.alive || !me.alive) return cmd;
    think -= dt; mt -= dt;
    const dx = foe.pos.x - me.pos.x, dz = foe.pos.z - me.pos.z, d = Math.hypot(dx, dz) || 1;
    if (think <= 0) { think = 0.35 + Math.random() * (0.9 - level * 0.12); const r = Math.random(); mode = d > 2.2 ? 'approach' : (r < 0.55 ? 'attack' : (r < 0.8 ? 'strafe' : 'retreat')); side = Math.random() < 0.5 ? -1 : 1; }
    const fx = dx / d, fz = dz / d;
    if (mode === 'approach') { cmd.x = fx; cmd.z = fz; if (d < 6 && me.cdSpecial <= 0 && Math.random() < 0.01 * level) cmd.special = true; }
    else if (mode === 'attack') { if (d > 1.6) { cmd.x = fx * 0.8; cmd.z = fz * 0.8; } if (d < 2.0 && me.cdAttack <= 0 && Math.random() < 0.5 + level * 0.08) cmd.attack = true; if (d < 3.2 && me.cdSpecial <= 0 && Math.random() < 0.02 * level) cmd.special = true; }
    else if (mode === 'strafe') { cmd.x = -fz * side * 0.8; cmd.z = fx * side * 0.8; }
    else { cmd.x = -fx * 0.8; cmd.z = -fz * 0.8; }
    // להישאר בתוך הזירה
    const c = Math.hypot(me.pos.x, me.pos.z); if (c > 7.2) { cmd.x -= me.pos.x / c * 0.8; cmd.z -= me.pos.z / c * 0.8; }
    if (Math.random() < 0.003 * level && me.grounded) cmd.jump = true;
    return cmd;
  };
}
