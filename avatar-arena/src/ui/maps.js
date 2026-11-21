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
  return `
<div class="absolute inset-0 overflow-hidden" style="background:linear-gradient(180deg,${s0} 0%,${s1} 58%,${s2} 100%)">
  <div class="absolute rounded-full pointer-events-none" style="left:${sun.x}%;top:${sun.y}%;width:${sun.r * 3.4}px;height:${sun.r * 3.4}px;transform:translate(-50%,-50%);background:radial-gradient(circle,${sun.color} 0%,${sun.color}88 28%,transparent 70%)"></div>
  <div class="absolute rounded-full pointer-events-none" style="left:${sun.x}%;top:${sun.y}%;width:${sun.r * 1.5}px;height:${sun.r * 1.5}px;transform:translate(-50%,-50%);background:${sun.color};opacity:.95"></div>
  ${extras.join('')}
  ${hills}
  ${ambient ? ambientHTML(m.ambient.type, m.ambient.color, 16) : ''}
</div>
${scenery ? temples() : ''}
${platforms ? `<svg class="absolute inset-0 pointer-events-none" viewBox="0 0 960 540" style="width:960px;height:540px;filter:drop-shadow(0 14px 18px rgba(0,0,0,.55))">
  ${m.platforms.map((p, i) => slab(p, m, i)).join('')}
</svg>` : ''}`;
}

// תצוגה מקדימה קטנה של מפה (הרקע והפלטפורמות בקנה מידה)
export function mapPreview(m, w = 224) {
  const k = w / 960;
  return `<div class="relative overflow-hidden" style="width:${w}px;height:${540 * k}px"><div class="absolute left-0 top-0" style="width:960px;height:540px;transform:scale(${k});transform-origin:0 0">${fightBackground(m, { ambient: false })}</div></div>`;
}
