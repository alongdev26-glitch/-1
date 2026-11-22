// ציור המפות (רקע, פלטפורמות וחלקיקים). הפלטפורמות מצוירות מאותם נתונים שהפיזיקה משתמשת בהם.

// מחולל אקראי עם זרע: אותה מפה נראית אותו דבר בכל פעם
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// חלקיקים באוויר (CSS): ענן, שלג, אפר/גחלים, אבק, בועות
export function ambientHTML(type, color, n = 20) {
  const r = Math.random;
  const items = [];
  for (let i = 0; i < n; i++) {
    const delay = -r() * 14, left = r() * 100, top = r() * 100;
    let style = `left:${left}%;`, anim;
    if (type === 'snow') {
      const s = 2 + r() * 3.5;
      style += `top:0;width:${s}px;height:${s}px;background:${color};opacity:${0.5 + r() * 0.5};--dx:${(r() - 0.5) * 120}px;animation:fall ${7 + r() * 7}s linear ${delay}s infinite;`;
    } else if (type === 'ember') {
      const s = 2 + r() * 3;
      style += `top:0;width:${s}px;height:${s}px;background:${color};box-shadow:0 0 6px ${color};--dx:${(r() - 0.5) * 140}px;animation:rise ${5 + r() * 6}s linear ${delay}s infinite;`;
    } else if (type === 'bubble') {
      const s = 5 + r() * 9;
      style += `top:0;width:${s}px;height:${s}px;border:1.5px solid ${color};background:transparent;--dx:${(r() - 0.5) * 50}px;animation:rise ${7 + r() * 6}s linear ${delay}s infinite;`;
    } else if (type === 'dust') {
      const s = 2 + r() * 2.5;
      style += `top:${top}%;left:0;width:${s}px;height:${s}px;background:${color};opacity:${0.35 + r() * 0.4};animation:drift ${6 + r() * 6}s linear ${delay}s infinite;`;
    } else { // cloud
      const w = 130 + r() * 150;
      style += `top:${6 + r() * 50}%;left:0;width:${w}px;height:${24 + r() * 26}px;background:${color};opacity:${0.12 + r() * 0.2};border-radius:50%;filter:blur(7px);animation:drift ${40 + r() * 40}s linear ${delay * 3}s infinite;`;
    }
    items.push(`<i style="${style}"></i>`);
  }
  return `<div class="amb">${items.join('')}</div>`;
}

// ---- פלטפורמה: לוח עם תחתית משוננת ----
function slab(p, m, idx) {
  if (m.slab.tech) return techSlab(p, m, idx);
  const rnd = rng(1000 + idx * 17 + (m.id.charCodeAt(0) || 0));
  const L = p.x - p.w / 2, R = p.x + p.w / 2, T = p.top;
  const depth = p.main ? 150 : 50 + p.w * 0.2;
  const n = Math.max(7, Math.round(p.w / 38));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, shape = 1 - Math.pow(Math.abs(u * 2 - 1), 1.7);
    pts.push([L + p.w * u, T + 8 + depth * shape * (0.72 + 0.28 * rnd())]);
  }
  const under = [[L, T + 6], ...pts, [R, T + 6]].map((q) => q.join(',')).join(' ');
  const facets = [];
  for (let i = 0; i < pts.length - 1; i += 2) {
    const a = pts[i], b = pts[i + 1], c = pts[Math.min(pts.length - 1, i + 2)];
    facets.push(`<polygon points="${a.join(',')} ${b.join(',')} ${[b[0], T + 10].join(',')} ${[a[0], T + 10].join(',')}" fill="${m.slab.facet}" opacity=".55"/>`);
    facets.push(`<polygon points="${b.join(',')} ${c.join(',')} ${[c[0], T + 10].join(',')}" fill="${m.slab.deep}" opacity=".35"/>`);
  }
  let cracks = '';
  if (m.slab.crack) {
    for (let i = 1; i < pts.length - 1; i += 2) {
      cracks += `<path d="M${pts[i][0]},${T + 14} L${pts[i][0] + (rnd() - 0.5) * 16},${(T + 14 + pts[i][1]) / 2} L${pts[i][0] + (rnd() - 0.5) * 10},${pts[i][1] - 6}" stroke="${m.slab.crack}" stroke-width="2" fill="none" opacity=".85"/>`;
    }
  }
  return `
  <g>
    <polygon points="${under}" fill="${m.slab.face}" stroke="${m.slab.deep}" stroke-width="2.5"/>
    ${facets.join('')}${cracks}
    <rect x="${L - 2}" y="${T - 5}" width="${p.w + 4}" height="17" rx="8" fill="${m.slab.rim}" stroke="${m.slab.deep}" stroke-width="1.5"/>
    <rect x="${L + 4}" y="${T - 5}" width="${p.w - 8}" height="11" rx="5.5" fill="${m.slab.top}"/>
    ${p.main ? `<line x1="${L + 24}" y1="${T + 1}" x2="${R - 24}" y2="${T + 1}" stroke="${m.slab.rim}" stroke-width="1.5" stroke-dasharray="8 5" opacity=".7"/>` : ''}
  </g>`;
}

const hillPath = (variant) => [
  'M0,300 L0,220 L110,165 L240,240 L380,140 L500,225 L650,110 L790,205 L910,135 L1000,195 L1000,300 Z',
  'M0,300 L0,185 L90,120 L210,210 L310,150 L440,230 L550,180 L680,85 L810,210 L940,150 L1000,200 L1000,300 Z',
  'M0,300 L0,140 L120,70 L260,180 L350,125 L470,220 L580,240 L690,130 L850,220 L1000,110 L1000,300 Z',
][variant];

// פלטפורמה טכנולוגית: לוח מתכת עם פס ניאון תכלת, פודים מאירים, ובראשית גם מנועים
function techSlab(p, m, idx) {
  const L = p.x - p.w / 2, R = p.x + p.w / 2, T = p.top, c = m.slab.neon || '#38efff';
  const depth = p.main ? 44 : 26;
  const glow = `filter:drop-shadow(0 0 6px ${c})`;
  let pods = '';
  for (let x = L + 26; x < R - 20; x += p.main ? 52 : 44) pods += `<circle cx="${x}" cy="${T + 14}" r="${p.main ? 4 : 3.2}" fill="#7cf6fc" style="${glow}"/>`;
  let seams = '';
  for (let x = L + 40; x < R - 20; x += 40) seams += `<line x1="${x}" y1="${T - 4}" x2="${x}" y2="${T + 12}" stroke="${m.slab.deep}" stroke-width="2"/>`;
  const thrusters = p.main ? [L + p.w * 0.2, R - p.w * 0.2].map((x, i) => `
    <g transform="rotate(${i ? -22 : 22} ${x} ${T + depth})">
      <polygon points="${x - 14},${T + depth - 6} ${x + 14},${T + depth - 6} ${x + 8},${T + depth + 22} ${x - 8},${T + depth + 22}" fill="#232d35" stroke="${m.slab.deep}" stroke-width="2"/>
      <ellipse class="thr" cx="${x}" cy="${T + depth + 28}" rx="7" ry="13" fill="#bff9ff" style="${glow};transform-origin:${x}px ${T + depth + 18}px"/>
    </g>`).join('') + `<circle cx="${p.x}" cy="${T + depth + 4}" r="6" fill="#34d399" style="filter:drop-shadow(0 0 8px #10b981)"/>` : '';
  return `<g>
    <polygon points="${L + 10},${T + 8} ${R - 10},${T + 8} ${R - 30},${T + depth} ${L + 30},${T + depth}" fill="${m.slab.face}" stroke="${m.slab.deep}" stroke-width="2.5"/>
    ${thrusters}
    <rect x="${L}" y="${T - 5}" width="${p.w}" height="18" rx="4" fill="${m.slab.rim}" stroke="${m.slab.deep}" stroke-width="2"/>
    <rect x="${L + 4}" y="${T - 4}" width="${p.w - 8}" height="9" rx="3" fill="${m.slab.top}"/>
    ${seams}
    <rect x="${L + 10}" y="${T - 5}" width="${p.w - 20}" height="3" rx="1.5" fill="${c}" style="${glow}"/>
    ${pods}
  </g>`;
}

// מערת לבה: קירות סלע, מפלי לבה זוהרים, עמודי סלע מפותלים, מבנה עתיק בעומק וים לבה
function caveBackdrop() {
  const pillar = (x, top, w, col) => {
    let out = '';
    for (let y = top, i = 0; y < 470; y += 26, i++) {
      const ww = w * (0.72 + 0.28 * Math.abs(Math.sin(i * 1.4)));
      out += `<ellipse cx="${x + Math.sin(i * 0.9) * 3}" cy="${y}" rx="${ww / 2}" ry="17" fill="${col}"/>`;
    }
    return out;
  };
  return `
<div class="absolute inset-0 overflow-hidden" style="background:linear-gradient(180deg,#0d0404 0%,#2a0d07 45%,#7a2208 80%,#c8420c 100%)">
  <div class="absolute rounded-full pointer-events-none" style="left:50%;top:55%;width:760px;height:520px;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,120,30,.45),transparent 65%)"></div>
  <svg class="absolute inset-0 pointer-events-none" viewBox="0 0 960 540" style="width:960px;height:540px">
    <!-- מבנה עתיק בעומק -->
    <g opacity=".85"><rect x="372" y="40" width="190" height="250" fill="#1c100d"/>
      <path d="M390 60 V270 M430 52 V280 M470 46 V285 M510 52 V280 M545 60 V270 M372 110 H562 M372 170 H562 M372 230 H562" stroke="#4a3027" stroke-width="3"/>
      <rect x="440" y="20" width="50" height="30" fill="#241612"/><rect x="452" y="6" width="26" height="16" fill="#2c1b16"/></g>
    <!-- קירות סלע -->
    <path d="M0 0 H300 Q260 40 280 90 Q330 130 300 190 Q270 240 320 290 Q340 330 300 380 L260 540 H0Z" fill="#221310"/>
    <path d="M0 0 H210 Q190 60 215 110 Q235 170 200 230 L170 540 H0Z" fill="#170c0a"/>
    <path d="M960 0 H690 Q730 50 715 100 Q690 150 740 200 Q790 240 770 300 Q790 350 730 400 L700 540 H960Z" fill="#221310"/>
    <path d="M960 0 H800 Q820 70 795 130 Q770 190 810 250 L840 540 H960Z" fill="#170c0a"/>
    <!-- חלון לבה בקיר שמאל -->
    <path d="M262 62 Q300 66 304 110 Q306 150 282 190 Q256 150 258 100Z" fill="#ff7a1c" opacity=".9"/>
    <!-- עמודי סלע מפותלים -->
    <g opacity=".95">${pillar(358, 285, 46, '#3a2218')}${pillar(480, 305, 58, '#412619')}${pillar(600, 270, 44, '#3a2218')}</g>
  </svg>
  <!-- מפלי לבה -->
  <div class="lavafall absolute" style="left:612px;top:0;width:58px;height:470px"></div>
  <div class="lavafall absolute" style="left:688px;top:0;width:36px;height:430px"></div>
  <div class="lavafall absolute" style="left:826px;top:0;width:66px;height:420px"></div>
  <div class="lavafall absolute" style="left:900px;top:0;width:34px;height:430px"></div>
  <div class="lavafall absolute" style="left:270px;top:70px;width:26px;height:130px;border-radius:12px"></div>
  <!-- ים לבה -->
  <div class="absolute left-0 right-0 bottom-0" style="top:80%;background:linear-gradient(180deg,#ff5a14,#ffb030 45%,#ff4d00);box-shadow:0 -30px 60px rgba(255,100,20,.55)"></div>
  <div class="absolute left-0 right-0 pointer-events-none lavawave" style="top:80%;bottom:0;background:radial-gradient(ellipse 120px 24px at 18% 30%,rgba(255,240,170,.85),transparent),radial-gradient(ellipse 160px 28px at 52% 62%,rgba(255,230,140,.8),transparent),radial-gradient(ellipse 130px 22px at 82% 38%,rgba(255,240,170,.85),transparent)"></div>
  <div class="absolute inset-0 pointer-events-none" style="background:radial-gradient(ellipse at 50% 55%,transparent 55%,rgba(0,0,0,.5) 100%)"></div>
</div>`;
}

// צללית מקדשי אוויר (פגודות מדורגות) למסך הסיפור
function temples() {
  const tower = (x, y, w, tiers, c) => {
    let out = '', ty = y;
    for (let i = 0; i < tiers; i++) {
      const tw = w * (1 - i * 0.16), th = 18;
      out += `<polygon points="${x - tw / 2 - 10},${ty} ${x + tw / 2 + 10},${ty} ${x + tw / 2 - 2},${ty - 12} ${x - tw / 2 + 2},${ty - 12}" fill="${c}"/>`;
      out += `<rect x="${x - tw / 2 + 6}" y="${ty}" width="${tw - 12}" height="${th}" fill="${c}"/>`;
      out += `<rect x="${x - 3}" y="${ty + 5}" width="6" height="9" rx="3" fill="#ffd9a0" opacity=".85"/>`;
      ty += th + 12;
    }
    return out + `<rect x="${x - 2}" y="${y - 30}" width="4" height="22" fill="${c}"/><circle cx="${x}" cy="${y - 32}" r="4" fill="${c}"/>`;
  };
  return `<svg class="absolute inset-0 pointer-events-none" viewBox="0 0 960 540" style="width:960px;height:540px">
    <g opacity=".5">${tower(150, 250, 90, 4, '#33425f')}${tower(520, 230, 70, 5, '#33425f')}</g>
    <g opacity=".75">${tower(300, 300, 110, 4, '#232d44')}${tower(740, 270, 100, 5, '#232d44')}${tower(900, 330, 80, 3, '#232d44')}</g>
    <path d="M0 540 L0 440 Q160 410 300 450 T620 440 T960 420 L960 540Z" fill="#161d30"/>
  </svg>`;
}

// ---- עולם המים: קרחונים, איגלו, מפל קפוא וארמון קרח ----
function iceWorld() {
  const peak = (x, h, w, c) => `<polygon points="${x - w},540 ${x - w * 0.35},${540 - h * 0.7} ${x - w * 0.15},${540 - h * 0.62} ${x + w * 0.05},${540 - h} ${x + w * 0.4},${540 - h * 0.55} ${x + w},540" fill="${c}"/>`;
  const igloo = (x, y, r) => `<g><path d="M${x - r},${y} A${r},${r} 0 0 1 ${x + r},${y}Z" fill="#cfeaff"/><path d="M${x - r * 0.9},${y - r * 0.35} H${x + r * 0.9}M${x - r * 0.55},${y - r * 0.78} H${x + r * 0.55}M${x - r * 0.3},${y} V${y - r * 0.35}M${x + r * 0.3},${y} V${y - r * 0.35}" stroke="#8fc1e6" stroke-width="2" fill="none"/><path d="M${x - r * 0.28},${y} V${y - r * 0.3} Q${x},${y - r * 0.52} ${x + r * 0.28},${y - r * 0.3} V${y}Z" fill="#0a1a38"/></g>`;
  return `<svg class="absolute inset-0 pointer-events-none" viewBox="0 0 960 540" style="width:960px;height:540px">
    <g opacity=".55">${peak(140, 250, 190, '#1f4a7e')}${peak(470, 300, 230, '#1a4175')}${peak(820, 260, 200, '#1f4a7e')}</g>
    <g opacity=".9">${peak(320, 190, 170, '#2d6aa8')}${peak(660, 210, 190, '#2a6199')}</g>
    <!-- ארמון קרח זוהר -->
    <g transform="translate(120 190)"><g opacity=".92">
      <polygon points="0,150 0,70 14,70 22,20 30,70 56,70 70,0 84,70 110,70 118,28 126,70 140,70 140,150" fill="#a8dcff"/>
      <polygon points="56,150 56,95 70,80 84,95 84,150" fill="#12306a"/>
      <polygon points="70,0 84,70 56,70" fill="#e6f7ff" opacity=".7"/></g></g>
    <!-- מפל קפוא -->
    <g opacity=".85"><polygon points="640,230 700,230 696,470 644,470" fill="#9fd8ff"/>
    <path d="M652,240 V460 M664,236 V466 M676,238 V464 M688,236 V462" stroke="#e6f7ff" stroke-width="3" opacity=".7"/></g>
    ${igloo(790, 478, 46)}${igloo(880, 486, 34)}${igloo(700, 492, 28)}
    <path d="M0 540 L0 470 Q140 440 300 470 T620 462 T960 450 L960 540Z" fill="#dcefff"/>
    <path d="M0 540 L0 500 Q180 480 360 504 T960 490 L960 540Z" fill="#b6d6f0"/>
  </svg>`;
}

// ---- עולם האדמה: מסות סלע, חומת בה סינג סה ויער ירוק ----
function earthWorld() {
  const mesa = (x, w, h, c) => `<polygon points="${x},540 ${x + 14},${540 - h} ${x + w - 14},${540 - h} ${x + w},540" fill="${c}"/>
    <path d="M${x + 12},${540 - h * 0.55} H${x + w - 12}M${x + 8},${540 - h * 0.28} H${x + w - 8}" stroke="rgba(0,0,0,.18)" stroke-width="4"/>`;
  const tower = (x, y) => `<rect x="${x}" y="${y}" width="26" height="46" fill="#6d4e2d"/><polygon points="${x - 6},${y} ${x + 13},${y - 16} ${x + 32},${y}" fill="#8f5f33"/>`;
  const tree = (x, y, r) => `<rect x="${x - 3}" y="${y}" width="6" height="${r}" fill="#3b2a15"/><circle cx="${x}" cy="${y}" r="${r}" fill="#3f7a3a"/><circle cx="${x + r * 0.5}" cy="${y - r * 0.3}" r="${r * 0.7}" fill="#4f9448"/>`;
  return `<svg class="absolute inset-0 pointer-events-none" viewBox="0 0 960 540" style="width:960px;height:540px">
    <g opacity=".55">${mesa(120, 190, 260, '#9a6b3c')}${mesa(620, 230, 240, '#8d6034')}</g>
    <g opacity=".85">${mesa(330, 170, 190, '#7d5430')}${mesa(820, 150, 210, '#6e4a29')}</g>
    <!-- חומת בה סינג סה -->
    <g opacity=".95"><rect x="0" y="330" width="960" height="74" fill="#6a4a2a"/>
    ${Array.from({ length: 24 }, (_, i) => `<rect x="${i * 40 + 6}" y="316" width="22" height="16" fill="#6a4a2a"/>`).join('')}
    <rect x="0" y="336" width="960" height="5" fill="rgba(0,0,0,.25)"/>${tower(230, 288)}${tower(560, 288)}${tower(850, 288)}</g>
    ${tree(70, 440, 24)}${tree(140, 452, 18)}${tree(860, 444, 22)}${tree(920, 456, 16)}
    <path d="M0 540 L0 450 Q200 420 420 452 T960 440 L960 540Z" fill="#4b3319"/>
    <path d="M0 540 L0 500 Q260 480 520 504 T960 492 L960 540Z" fill="#33220f"/>
  </svg>`;
}

// ---- עולם האש: הר געש, נהר לבה ומבצר ארגמן ----
function fireWorld() {
  const roof = (x, y, w, tiers) => {
    let out = '', ty = y;
    for (let i = 0; i < tiers; i++) {
      const tw = w * (1 - i * 0.18);
      out += `<polygon points="${x - tw / 2 - 16},${ty + 2} ${x},${ty - 22} ${x + tw / 2 + 16},${ty + 2} ${x + tw / 2},${ty + 10} ${x - tw / 2},${ty + 10}" fill="#4a0f0a"/>`;
      out += `<rect x="${x - tw / 2 + 6}" y="${ty + 10}" width="${tw - 12}" height="22" fill="#2b0807"/><rect x="${x - 4}" y="${ty + 14}" width="8" height="12" rx="4" fill="#ff9a3a" opacity=".9"/>`;
      ty += 38;
    }
    return out;
  };
  return `<svg class="absolute inset-0 pointer-events-none" viewBox="0 0 960 540" style="width:960px;height:540px">
    <defs><linearGradient id="lavaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36a"/><stop offset="1" stop-color="#e8541c"/></linearGradient></defs>
    <!-- הר געש עם לוע זוהר -->
    <g opacity=".95"><polygon points="250,540 420,170 470,150 520,170 700,540" fill="#2a0a08"/>
      <polygon points="420,170 470,150 520,170 500,185 440,185" fill="url(#lavaG)"/>
      <path d="M470,160 L462,250 L482,330 L460,430 L486,540 M452,200 L420,300 L430,420" stroke="#ff7a1c" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/></g>
    <g opacity=".5"><ellipse cx="470" cy="120" rx="90" ry="34" fill="#2a1512" filter="blur(0)"/><ellipse cx="520" cy="70" rx="110" ry="30" fill="#3a1d18"/><ellipse cx="440" cy="30" rx="120" ry="26" fill="#2a1512"/></g>
    <!-- מבצר ארגמן -->
    <g opacity=".95">${roof(170, 280, 130, 3)}${roof(780, 300, 120, 3)}${roof(900, 350, 80, 2)}</g>
    <path d="M0 540 L0 450 Q200 420 420 456 T960 440 L960 540Z" fill="#1a0605"/>
    <path d="M0 520 Q180 490 360 515 T720 506 T960 500 L960 540 L0 540Z" fill="url(#lavaG)" opacity=".9"/>
    <path d="M0 530 Q200 506 400 528 T960 516" stroke="#ffd36a" stroke-width="3" fill="none" opacity=".8"/>
  </svg>`;
}

function sceneryFor(kind) {
  return { air: temples, water: iceWorld, earth: earthWorld, fire: fireWorld }[kind === true ? 'air' : kind]?.() || '';
}

export function fightBackground(m, { ambient = true, platforms = true, scenery = false } = {}) {
  const [s0, s1, s2] = m.sky;
  const sun = m.sun;
  const hills = m.hills.map((c, i) => {
    const h = [55, 48, 38][i], o = [0.55, 0.78, 0.92][i];
    return `<svg class="absolute bottom-0 w-full pointer-events-none" style="height:${h}%" preserveAspectRatio="none" viewBox="0 0 1000 300"><path d="${hillPath(i)}" fill="${c}" fill-opacity="${o}"/></svg>`;
  }).join('');
  const extras = [];
  if (m.aurora) {
    extras.push(`<div class="absolute" style="left:-10%;top:6%;width:120%;height:34%;background:linear-gradient(100deg,transparent 0%,rgba(80,255,190,.35) 30%,rgba(90,160,255,.35) 60%,transparent 100%);filter:blur(26px);transform:skewY(-6deg)"></div>`);
    extras.push(`<div class="absolute" style="left:-10%;top:16%;width:120%;height:22%;background:linear-gradient(80deg,transparent 0%,rgba(190,120,255,.28) 40%,rgba(80,230,255,.3) 70%,transparent 100%);filter:blur(30px);transform:skewY(5deg)"></div>`);
  }
  if (m.canyon) {
    extras.push(`<svg class="absolute left-0 bottom-0 h-full pointer-events-none" style="width:22%" preserveAspectRatio="none" viewBox="0 0 100 300"><path d="M0,0 L70,0 L55,60 L82,120 L60,190 L88,250 L70,300 L0,300 Z" fill="#6a4727"/><path d="M0,0 L40,0 L30,70 L50,130 L36,200 L52,300 L0,300 Z" fill="#4c3119"/></svg>`);
    extras.push(`<svg class="absolute right-0 bottom-0 h-full pointer-events-none" style="width:22%" preserveAspectRatio="none" viewBox="0 0 100 300"><path d="M100,0 L30,0 L45,60 L18,120 L40,190 L12,250 L30,300 L100,300 Z" fill="#6a4727"/><path d="M100,0 L60,0 L70,70 L50,130 L64,200 L48,300 L100,300 Z" fill="#4c3119"/></svg>`);
  }
  if (m.lava) {
    extras.push(`<div class="absolute bottom-0 left-0 right-0 pointer-events-none" style="height:30%;background:linear-gradient(0deg,#ff5a14 0%,rgba(255,120,30,.7) 35%,transparent 100%)"></div>`);
    extras.push(`<svg class="absolute bottom-0 w-full pointer-events-none" style="height:12%" preserveAspectRatio="none" viewBox="0 0 1000 60"><path d="M0,60 L0,30 Q80,8 160,28 T320,26 T480,30 T640,24 T800,30 T1000,26 L1000,60 Z" fill="#ff7a1c"/><path d="M0,60 L0,44 Q100,30 200,44 T400,42 T600,46 T800,42 T1000,46 L1000,60 Z" fill="#ffd36a" opacity=".8"/></svg>`);
  }
  if (m.cave && !scenery) {
    return `${caveBackdrop()}${ambient ? ambientHTML(m.ambient.type, m.ambient.color, 22) : ''}${platforms ? `<svg class="absolute inset-0 pointer-events-none" viewBox="0 0 960 540" style="width:960px;height:540px;filter:drop-shadow(0 10px 14px rgba(0,0,0,.6))">${m.platforms.map((p, i) => slab(p, m, i)).join('')}</svg>` : ''}`;
  }
  return `
<div class="absolute inset-0 overflow-hidden" style="background:linear-gradient(180deg,${s0} 0%,${s1} 58%,${s2} 100%)">
  <div class="absolute rounded-full pointer-events-none" style="left:${sun.x}%;top:${sun.y}%;width:${sun.r * 3.4}px;height:${sun.r * 3.4}px;transform:translate(-50%,-50%);background:radial-gradient(circle,${sun.color} 0%,${sun.color}88 28%,transparent 70%)"></div>
  <div class="absolute rounded-full pointer-events-none" style="left:${sun.x}%;top:${sun.y}%;width:${sun.r * 1.5}px;height:${sun.r * 1.5}px;transform:translate(-50%,-50%);background:${sun.color};opacity:.95"></div>
  ${extras.join('')}
  ${hills}
  ${ambient ? ambientHTML(m.ambient.type, m.ambient.color, 16) : ''}
</div>
${scenery ? sceneryFor(scenery) : ''}
${platforms ? `<svg class="absolute inset-0 pointer-events-none" viewBox="0 0 960 540" style="width:960px;height:540px;filter:drop-shadow(0 14px 18px rgba(0,0,0,.55))">
  ${m.platforms.map((p, i) => slab(p, m, i)).join('')}
</svg>` : ''}`;
}

// תצוגה מקדימה קטנה של מפה (הרקע והפלטפורמות בקנה מידה)
export function mapPreview(m, w = 224) {
  const k = w / 960;
  return `<div class="relative overflow-hidden" style="width:${w}px;height:${540 * k}px"><div class="absolute left-0 top-0" style="width:960px;height:540px;transform:scale(${k});transform-origin:0 0">${fightBackground(m, { ambient: false })}</div></div>`;
}
