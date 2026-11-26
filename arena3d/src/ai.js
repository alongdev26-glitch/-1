// בוט: מתקרב, בוחר מכות לפי מרחק, ומתגונן לפעמים. פורמט הפקודה זהה לשחקן.
export function makeBot(level = 3) {
  let think = 0, mode = 'approach', side = 1, defT = 0, defDir = 'none';
  return (dt, me, foe) => {
    const cmd = { x: 0, z: 0, a: false, b: false, bHold: false, ult: false, dir: 'none' };
    if (!foe.alive || !me.alive) return cmd;
    think -= dt; defT -= dt;
    if (!me.onFloor) { const c = Math.hypot(me.pos.x, me.pos.z) || 1; cmd.b = true; cmd.x = -me.pos.x / c; cmd.z = -me.pos.z / c; return cmd; }   // התאוששות אחרי העפה
    const dx = foe.pos.x - me.pos.x, dz = foe.pos.z - me.pos.z, d = Math.hypot(dx, dz) || 1, fx = dx / d, fz = dz / d;
    if (think <= 0) { think = 0.3 + Math.random() * (0.9 - level * 0.12); const r = Math.random(); mode = d > 2.4 ? (r < 0.4 ? 'range' : 'approach') : (r < 0.6 ? 'attack' : (r < 0.8 ? 'strafe' : 'retreat')); side = Math.random() < 0.5 ? -1 : 1; }
    // הגנה: אם היריב תוקף מקרוב
    if (foe.state === 'move' && d < 3 && defT <= 0 && Math.random() < 0.012 * level) { defT = 1.2; defDir = ['down', 'up', 'left', 'right'][Math.floor(Math.random() * 4)]; cmd.b = true; cmd.dir = defDir; return cmd; }
    if (foe.state === 'move' && d < 2.6 && Math.random() < 0.02 * level) { cmd.bHold = true; return cmd; }
    if (me.ult >= 100 && !me.superUsed && me.superT <= 0 && Math.random() < 0.05) { cmd.ult = true; return cmd; }
    if (mode === 'approach') { cmd.x = fx; cmd.z = fz; }
    else if (mode === 'range') { if (d > 3.2 && d < 8 && Math.random() < 0.06 * level) { cmd.a = true; cmd.dir = 'right'; } else { cmd.x = fx * 0.4; cmd.z = fz * 0.4; } }
    else if (mode === 'attack') {
      if (d > 1.6) { cmd.x = fx * 0.8; cmd.z = fz * 0.8; }
      if (d < 2.1 && Math.random() < 0.45 + level * 0.08) { cmd.a = true; cmd.dir = ['none', 'none', 'none', 'up', 'left', 'down'][Math.floor(Math.random() * 6)]; }
    }
    else if (mode === 'strafe') { cmd.x = -fz * side * 0.8; cmd.z = fx * side * 0.8; }
    else { cmd.x = -fx * 0.8; cmd.z = -fz * 0.8; }
    const c = Math.hypot(me.pos.x, me.pos.z); if (c > 11) { cmd.x -= me.pos.x / c * 1.2; cmd.z -= me.pos.z / c * 1.2; }
    if (Math.random() < 0.002 * level && me.grounded && !cmd.a) { cmd.b = true; cmd.dir = side > 0 ? 'right' : 'left'; }
    return cmd;
  };
}
