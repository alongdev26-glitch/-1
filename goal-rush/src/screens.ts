// DOM screens: home, customization (shop), showcase (promo screens) and the result popup.
import { sfx } from './audio';
import { confetti, drawBall, drawBlob, drawFlag, rr, type BallSkin } from './draw';
import { Match, type MatchResult } from './match';
import { buy, equip, isOwned, persist, save } from './state';
import { C, ITEMS, itemById, THEME_ORDER, THEMES, type Item, type Tab, type ThemeId } from './theme';

const app = (): HTMLElement => document.getElementById('app')!;

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

function canvasOf(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1) * 2;
  c.width = w * dpr;
  c.height = h * dpr;
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return [c, ctx];
}

const BACK_SVG = `<svg viewBox="0 0 48 48"><path d="M30 8 14 24l16 16" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const NONE_SVG = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="11"/><path d="M24 76 76 24" stroke="#fff" stroke-width="11" stroke-linecap="round"/></svg>`;
const BOLT_SVG = (fill: string) => `<svg class="bolt" viewBox="0 0 52 52"><path d="M30 2 10 28h12l-6 22 26-30H28z" fill="${fill}" stroke="#111" stroke-width="3.5" stroke-linejoin="round"/></svg>`;

export function mount(node: HTMLElement): void {
  const a = app();
  a.replaceChildren(node);
}

export function fitUnit(): void {
  const a = app();
  a.style.setProperty('--u', `${a.clientWidth / 390}px`);
}

// ------------------------------------------------------------------ banner icons
type IconKind = 'headphones' | 'ball' | 'globe' | 'trophy' | 'italy' | 'laurel';
function icon(kind: IconKind): HTMLCanvasElement {
  const [c, x] = canvasOf(72, 72);
  x.lineJoin = 'round';
  x.lineWidth = 3.5;
  x.strokeStyle = C.ink;
  if (kind === 'ball') drawBall(x, 36, 36, 26, 'ball-classic', 0.3, false);
  else if (kind === 'globe') {
    x.beginPath();
    x.arc(36, 36, 28, 0, Math.PI * 2);
    x.fillStyle = '#2FB2FF';
    x.fill();
    x.save();
    x.clip();
    x.fillStyle = '#4BD94F';
    x.beginPath();
    x.moveTo(14, 18);
    x.bezierCurveTo(30, 8, 40, 20, 34, 30);
    x.bezierCurveTo(30, 44, 24, 40, 22, 52);
    x.bezierCurveTo(12, 44, 8, 28, 14, 18);
    x.fill();
    x.beginPath();
    x.moveTo(46, 40);
    x.bezierCurveTo(58, 36, 64, 46, 56, 58);
    x.bezierCurveTo(48, 60, 42, 50, 46, 40);
    x.fill();
    x.restore();
    x.beginPath();
    x.arc(36, 36, 28, 0, Math.PI * 2);
    x.stroke();
  } else if (kind === 'headphones') {
    x.lineWidth = 11;
    x.beginPath();
    x.arc(36, 40, 24, Math.PI * 1.02, Math.PI * 1.98);
    x.stroke();
    x.strokeStyle = '#FFD21F';
    x.lineWidth = 6;
    x.stroke();
    x.strokeStyle = C.ink;
    x.lineWidth = 3.5;
    x.fillStyle = '#FF3FA8';
    for (const px of [10, 52]) {
      rr(x, px, 34, 14, 28, 7);
      x.fill();
      x.stroke();
    }
  } else if (kind === 'trophy') {
    x.fillStyle = '#FFC21A';
    x.beginPath();
    x.moveTo(18, 8);
    x.lineTo(54, 8);
    x.bezierCurveTo(54, 34, 46, 42, 36, 44);
    x.bezierCurveTo(26, 42, 18, 34, 18, 8);
    x.fill();
    x.stroke();
    x.lineWidth = 3;
    x.beginPath();
    x.arc(16, 18, 9, Math.PI * 0.5, Math.PI * 1.5);
    x.arc(56, 18, 9, Math.PI * 1.5, Math.PI * 0.5);
    x.stroke();
    x.fillStyle = '#FFC21A';
    rr(x, 30, 44, 12, 10, 2);
    x.fill();
    x.stroke();
    rr(x, 22, 54, 28, 10, 4);
    x.fill();
    x.stroke();
    x.fillStyle = '#FF7A1A';
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 5 : 11;
      const an = -Math.PI / 2 + (i * Math.PI) / 5;
      x.lineTo(36 + Math.cos(an) * r, 22 + Math.sin(an) * r);
    }
    x.closePath();
    x.fill();
  } else if (kind === 'italy') {
    drawFlag(x, 'it', 36, 36, 30);
    x.beginPath();
    x.arc(36, 36, 30, 0, Math.PI * 2);
    x.lineWidth = 5;
    x.stroke();
  } else {
    // laurel wreath: two leaf arcs forming a U
    x.strokeStyle = '#8A5A00';
    x.fillStyle = '#FFC21A';
    x.lineWidth = 2.2;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        const ang = Math.PI * (0.62 + i * 0.1);
        const px = 36 + side * Math.cos(ang) * -24;
        const py = 34 - Math.sin(ang) * -24 * 0.0 + Math.sin(ang) * 26 - 8;
        x.save();
        x.translate(px, py);
        x.rotate(side * (ang + 0.2) - Math.PI / 2);
        x.beginPath();
        x.ellipse(0, 0, 9, 4.6, 0, 0, Math.PI * 2);
        x.fill();
        x.stroke();
        x.restore();
      }
    }
  }
  return c;
}

export function banner(text: string, style: 'blue' | 'yellow' | 'purple', left: IconKind, right: 'bolt' | IconKind): HTMLElement {
  const b = el('div', `banner ${style}`);
  const l = el('div', 'b-left');
  l.append(icon(left));
  const t = el('div', 'b-text');
  t.textContent = text;
  t.style.fontSize = `calc(var(--u) * ${Math.min(46, Math.floor(620 / text.length))})`;
  const r = el('div', 'b-right');
  if (right === 'bolt') r.innerHTML = BOLT_SVG(style === 'yellow' ? '#FFF04A' : '#FFE24A');
  else r.append(icon(right));
  b.append(l, t, r);
  return b;
}

export function coinBadge(): HTMLElement {
  const c = el('div', 'coins', `<span class="coin">$</span><span id="coin-n">${save.coins}</span>`);
  return c;
}

// ------------------------------------------------------------------ home
export function homeScreen(go: { play: () => void; shop: () => void; showcase: () => void }): HTMLElement {
  const s = el('div', 'screen sky');
  s.append(el('div', 'rays'));
  s.append(el('div', 'title', `GOAL RUSH<small>1V1 FOOTBALL</small>`));
  s.append(coinBadge());
  const hero = el('div', 'home-hero');
  const [c, x] = canvasOf(320, 340);
  hero.append(c);
  s.append(hero);
  const draw = (t: number) => {
    x.clearRect(0, 0, 320, 340);
    drawBlob(x, {
      x: 150,
      y: 190,
      s: 3,
      color: itemById(save.equipped.player).color ?? '#2F6BFF',
      addon: save.equipped.addon,
      pose: 'hold',
      look: { x: 1, y: -0.2 },
      t,
    });
    drawBall(x, 70, 285, 40, save.equipped.ball as BallSkin, Math.sin(t) * 0.4, true);
  };
  let raf = 0;
  let t0 = performance.now();
  const loop = (now: number) => {
    draw((now - t0) / 1000);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  s.addEventListener('gr-leave', () => cancelAnimationFrame(raf));
  void t0;
  t0 = performance.now();

  const btns = el('div', 'home-btns');
  const play = el('button', 'pill big');
  play.textContent = 'PLAY';
  play.onclick = () => (sfx.kick(), go.play());
  const row = el('div', 'row');
  const shop = el('button', 'pill');
  shop.textContent = 'CUSTOMIZE';
  shop.onclick = go.shop;
  const show = el('button', 'pill gray');
  show.textContent = 'SHOWCASE';
  show.onclick = go.showcase;
  row.append(shop, show);
  btns.append(play, row);
  s.append(btns);
  s.append(el('div', 'arena-chip', `Next arena: ${THEMES[THEME_ORDER[save.matches % THEME_ORDER.length]].banner}`));
  return s;
}

// ------------------------------------------------------------------ customization
function previewFor(item: Item, w: number, h: number): HTMLCanvasElement {
  const [c, x] = canvasOf(w, h);
  const body = itemById('pl-blue').color!;
  if (item.tab === 'ball') drawBall(x, w / 2, h / 2, w * 0.3, item.id as BallSkin, 0.4, false);
  else if (item.tab === 'player')
    drawBlob(x, { x: w / 2, y: h * 0.52, s: w / 105, color: item.color!, jersey: '#fff', number: '9', pose: 'stand', look: { x: 0.3, y: -0.4 }, t: 0 });
  else drawBlob(x, { x: w / 2, y: h * 0.84, s: w / 118, color: body, addon: item.id, pose: 'stand', look: { x: 0.3, y: -0.4 }, t: 0 });
  return c;
}

export function customizeScreen(back: () => void, initialTab: Tab = 'addon'): HTMLElement {
  const s = el('div', 'screen sky');
  s.append(el('div', 'rays'));
  const bk = el('button', 'back', BACK_SVG);
  bk.onclick = back;
  s.append(bk, coinBadge());

  const hero = el('div', 'hero');
  const [hc, hx] = canvasOf(300, 310);
  hero.append(hc);
  s.append(hero);
  let tab: Tab = initialTab;
  let raf = 0;
  const t0 = performance.now();
  const loop = (now: number) => {
    const t = (now - t0) / 1000;
    hx.clearRect(0, 0, 300, 310);
    drawBlob(hx, {
      x: 150,
      y: 198,
      s: 2.35,
      color: itemById(save.equipped.player).color ?? '#2F6BFF',
      addon: save.equipped.addon,
      suit: save.equipped.addon === 'ad-tophat',
      pose: 'hold',
      look: { x: 0.6, y: -0.2 },
      t,
    });
    drawBall(hx, 70, 252, 42, save.equipped.ball as BallSkin, Math.sin(t) * 0.5, true);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  s.addEventListener('gr-leave', () => cancelAnimationFrame(raf));

  const tabs = el('div', 'tabs');
  const panel = el('div', 'panel');
  const labels: [Tab, string][] = [['ball', 'Ball'], ['player', 'Player'], ['addon', 'Add-on']];

  const render = () => {
    tabs.replaceChildren(
      ...labels.map(([id, label]) => {
        const b = el('button', `tab${id === tab ? ' on' : ''}`);
        b.textContent = label;
        b.onclick = () => ((tab = id), render());
        return b;
      }),
    );
    const grid = el('div', 'grid');
    for (const item of ITEMS.filter((i) => i.tab === tab)) grid.append(cell(item));
    panel.replaceChildren(grid);
    const n = s.querySelector('#coin-n');
    if (n) n.textContent = String(save.coins);
  };

  const cell = (item: Item): HTMLElement => {
    const wrap = el('div', 'cell');
    const owned = isOwned(item.id);
    const on = save.equipped[item.tab] === item.id;
    const card = el('button', `card${on ? ' on' : ''}${item.id === 'ad-none' ? ' none' : ''}`);
    if (item.id === 'ad-none') card.innerHTML = NONE_SVG;
    else card.append(previewFor(item, 100, 100));
    card.onclick = () => act(item);
    wrap.append(card);
    if (item.id !== 'ad-none') {
      if (owned) wrap.append(el('div', `owned${on ? ' eq' : ''}`, on ? 'EQUIPPED' : 'OWNED'));
      else {
        const p = el('button', 'pill price', `<span class="coin">$</span>${item.price}`);
        p.onclick = () => act(item);
        wrap.append(p);
      }
    }
    return wrap;
  };

  const act = (item: Item) => {
    if (!isOwned(item.id)) {
      if (!buy(item.id)) {
        sfx.deny();
        toast(s, `Need ${item.price - save.coins} more coins`);
        return;
      }
      sfx.buy();
    }
    equip(item.id);
    persist();
    render();
  };

  s.append(tabs, panel, banner('CUSTOMIZATION', 'blue', 'ball', 'headphones'));
  render();
  return s;
}

function toast(parent: HTMLElement, text: string): void {
  const t = el('div', 'toast');
  t.textContent = text;
  parent.append(t);
  setTimeout(() => t.remove(), 1400);
}

// ------------------------------------------------------------------ match + showcase
export function matchScreen(theme: ThemeId, onEnd: (r: MatchResult) => void, back: () => void): HTMLElement {
  const s = el('div', 'screen');
  const c = el('canvas', 'full');
  s.append(c);
  const bk = el('button', 'back', BACK_SVG);
  bk.onclick = back;
  bk.style.top = 'calc(var(--u) * 118)';
  bk.style.left = 'calc(var(--u) * 24)';
  s.append(bk);
  s.append(el('div', 'hint', 'Drag back from anywhere, release to shoot'));
  let m: Match | null = null;
  // the canvas needs layout before the match measures it
  requestAnimationFrame(() => {
    m = new Match(c, { theme, onEnd });
    m.start();
    (s as HTMLElement & { match?: Match }).match = m;
  });
  s.addEventListener('gr-leave', () => m?.stop());
  return s;
}

const SHOWCASE_PAGES: { kind: 'shop' | ThemeId }[] = [{ kind: 'shop' }, { kind: 'shoot' }, { kind: 'battles' }, { kind: 'global' }, { kind: 'superstar' }];
const DEMO_SCORES: Record<ThemeId, [number, number]> = { shoot: [16, 10], battles: [0, 0], global: [0, 0], superstar: [6, 162] };

export function showcaseScreen(back: () => void, start = 0): HTMLElement {
  const s = el('div', 'screen');
  let idx = start;
  let page: HTMLElement | null = null;
  const dots = el('div', 'dots');
  const bk = el('button', 'exit', 'EXIT');
  bk.onclick = back;
  const l = el('button', 'nav l', '‹');
  const r = el('button', 'nav r', '›');
  const show = () => {
    if (page) {
      page.dispatchEvent(new Event('gr-leave'));
      page.remove();
    }
    const p = SHOWCASE_PAGES[idx];
    if (p.kind === 'shop') {
      page = customizeScreen(back);
      page.querySelector('.back')?.remove();
    }
    else {
      const th = THEMES[p.kind];
      page = el('div', 'screen');
      const c = el('canvas', 'full');
      page.append(c);
      const pg = page;
      requestAnimationFrame(() => {
        const m = new Match(c, { theme: p.kind as ThemeId, demo: true, startScores: DEMO_SCORES[p.kind as ThemeId] });
        m.start();
        pg.addEventListener('gr-leave', () => m.stop());
      });
      const right = th.id === 'global' ? 'italy' : th.id === 'superstar' ? 'laurel' : 'bolt';
      const left = th.id === 'shoot' || th.id === 'battles' ? 'ball' : th.id === 'global' ? 'globe' : 'trophy';
      page.append(banner(th.banner, th.bannerStyle, left, right));
    }
    s.prepend(page);
    dots.replaceChildren(...SHOWCASE_PAGES.map((_, i) => el('i', i === idx ? 'on' : '')));
  };
  l.onclick = () => ((idx = (idx + SHOWCASE_PAGES.length - 1) % SHOWCASE_PAGES.length), show());
  r.onclick = () => ((idx = (idx + 1) % SHOWCASE_PAGES.length), show());
  s.append(bk, dots, l, r);
  // the shop page has its own back button; keep only one visible
  show();
  s.addEventListener('gr-leave', () => page?.dispatchEvent(new Event('gr-leave')));
  return s;
}

// ------------------------------------------------------------------ result
const TROPHY = `<svg viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF08A"/><stop offset="1" stop-color="#FFB000"/></linearGradient></defs>
<path d="M50 20h100c0 60-18 90-50 98-32-8-50-38-50-98z" fill="url(#g)" stroke="#111" stroke-width="7" stroke-linejoin="round"/>
<path d="M50 34C14 34 14 86 58 92M150 34c36 0 36 52-8 58" fill="none" stroke="#111" stroke-width="16" stroke-linecap="round"/>
<path d="M50 34C14 34 14 86 58 92M150 34c36 0 36 52-8 58" fill="none" stroke="#FFC21A" stroke-width="8" stroke-linecap="round"/>
<rect x="88" y="118" width="24" height="30" fill="url(#g)" stroke="#111" stroke-width="6"/>
<rect x="58" y="148" width="84" height="26" rx="8" fill="url(#g)" stroke="#111" stroke-width="6"/>
<path d="m100 40 10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z" fill="#FF7A1A" stroke="#111" stroke-width="4" stroke-linejoin="round"/></svg>`;

export function resultScreen(r: MatchResult, again: () => void, home: () => void): HTMLElement {
  const s = el('div', 'screen result');
  const c = el('canvas', 'full');
  s.append(c);
  const ctx = c.getContext('2d')!;
  let raf = 0;
  requestAnimationFrame(() => {
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
    const t0 = performance.now();
    const loop = (now: number) => {
      ctx.setTransform(c.width / 390, 0, 0, c.height / 844, 0, 0);
      ctx.clearRect(0, 0, 390, 844);
      if (r.won) confetti(ctx, (now - t0) / 1000, 390, 844);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });
  s.addEventListener('gr-leave', () => cancelAnimationFrame(raf));
  s.append(el('div', 'res-title', r.won ? 'YOU WIN!' : 'YOU LOSE'));
  const tr = el('div', 'res-trophy', TROPHY);
  if (!r.won) tr.style.filter = 'grayscale(1) brightness(0.8)';
  s.append(tr);
  s.append(el('div', 'res-score', `Your score: ${r.score}`));
  s.append(el('div', 'res-coins', `+${r.coins} <span class="coin">$</span>`));
  const btns = el('div', 'res-btns');
  const cont = el('button', 'pill big');
  cont.textContent = 'AGAIN';
  cont.onclick = again;
  const h = el('button', 'pill gray');
  h.textContent = 'HOME';
  h.onclick = home;
  btns.append(cont, h);
  s.append(btns);
  return s;
}
