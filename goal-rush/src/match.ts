// The 1v1 match: input, bot, scoring, effects and the render loop on a 390x844 logical canvas.
import { drawArena, drawHud, drawObstacles, LAYOUTS, worldFor } from './arena';
import { drawBall, drawBlob, drawGoal, lightBeams, outlineText, star, type BallSkin, type Ctx, type Pose } from './draw';
import { sfx } from './audio';
import { BALL_R, findScoringShot, launchVelocity, power, simulateShot, SCREEN, stepBall, type Ball, type Vec, type World } from './physics';
import { itemById, OPPONENTS, THEMES, type FlagId, type ThemeId } from './theme';
import { save } from './state';

export const TARGET = 50;
export const ROUNDS_TO_WIN = 2;

export interface MatchResult {
  won: boolean;
  score: number;
  coins: number;
}

export interface MatchOpts {
  theme: ThemeId;
  demo?: boolean; // both sides are bots (used by the showcase)
  startScores?: [number, number]; // [opponent, me]
  onEnd?: (r: MatchResult) => void;
}

interface Side {
  name: string;
  flag: FlagId;
  spot: Vec;
  color: string;
  addon: string;
  skin: BallSkin;
  jersey?: string;
  number?: string;
  pigtails?: boolean;
  score: number;
  rounds: number;
  combo: number;
  mult: number;
  state: 'ready' | 'flying' | 'cooldown';
  ball: Ball;
  vis: { x: number; y: number };
  spin: number;
  timer: number; // bot think timer or cooldown
  flyT: number;
  pose: Pose;
  poseT: number;
  scored: boolean;
  isBot: boolean;
}

interface Float {
  text: string;
  x: number;
  y: number;
  t: number;
  big: boolean;
}

const OPP_COLORS = ['#FF8A1F', '#F23B3B', '#2FBF4A', '#FF5FB0'];

export class Match {
  private ctx: Ctx;
  private world: World;
  private opp: Side;
  private me: Side;
  private floats: Float[] = [];
  private drag: { start: Vec; cur: Vec } | null = null;
  private raf = 0;
  private last = 0;
  private t = 0;
  private goalFx = 0;
  private beamT = 0;
  private pickupT = 0;
  private pickupGone = false;
  private banner: { text: string; t: number } | null = null;
  private ended = false;
  private pausedFor = 0;
  private scale = 1;

  constructor(private canvas: HTMLCanvasElement, private o: MatchOpts) {
    this.ctx = canvas.getContext('2d')!;
    this.world = worldFor(o.theme);
    const lay = LAYOUTS[o.theme];
    const oppInfo = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const myColor = itemById(save.equipped.player).color ?? '#2F6BFF';
    const oppColor = OPP_COLORS.find((c) => c.toLowerCase() !== myColor.toLowerCase()) ?? '#FF8A1F';
    const base = (): Omit<Side, 'name' | 'flag' | 'spot' | 'color' | 'addon' | 'skin' | 'isBot'> => ({
      score: 0,
      rounds: 0,
      combo: 0,
      mult: 1,
      state: 'ready',
      ball: { x: 0, y: 0, vx: 0, vy: 0, r: BALL_R },
      vis: { x: 0, y: 0 },
      spin: 0,
      timer: 1.2 + Math.random(),
      flyT: 0,
      pose: 'hold',
      poseT: 0,
      scored: false,
    });
    this.opp = {
      ...base(),
      name: o.theme === 'global' ? 'Emu' : oppInfo.name,
      flag: o.theme === 'global' ? 'tr' : oppInfo.flag,
      spot: lay.bot,
      color: oppColor,
      addon: 'ad-none',
      skin: 'ball-classic',
      jersey: o.theme === 'global' ? '#FFD21F' : undefined,
      number: o.theme === 'global' ? '24' : undefined,
      pigtails: o.theme === 'global',
      isBot: true,
    };
    this.me = {
      ...base(),
      name: 'You',
      flag: 'us',
      spot: lay.player,
      color: myColor,
      addon: save.equipped.addon,
      skin: save.equipped.ball as BallSkin,
      isBot: !!o.demo,
    };
    if (o.demo) this.opp.skin = 'ball-seam';
    if (o.startScores) [this.opp.score, this.me.score] = o.startScores;
    for (const s of [this.opp, this.me]) this.placeBall(s);
    this.resize();
    canvas.addEventListener('pointerdown', this.down);
    canvas.addEventListener('pointermove', this.move);
    window.addEventListener('pointerup', this.up);
    window.addEventListener('resize', this.resize);
  }

  start(): void {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointerdown', this.down);
    this.canvas.removeEventListener('pointermove', this.move);
    window.removeEventListener('pointerup', this.up);
    window.removeEventListener('resize', this.resize);
  }

  /** Test/automation hook: fire the human's shot with an explicit velocity. */
  shootMe(v: Vec): void {
    this.launch(this.me, v);
  }

  private resize = (): void => {
    const r = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.scale = (r.width * dpr) / SCREEN.w;
  };

  private toLogical(e: PointerEvent): Vec {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SCREEN.w, y: ((e.clientY - r.top) / r.height) * SCREEN.h };
  }

  private down = (e: PointerEvent): void => {
    if (this.o.demo || this.ended || this.me.state !== 'ready') return;
    const p = this.toLogical(e);
    this.drag = { start: p, cur: p };
    this.canvas.setPointerCapture?.(e.pointerId);
  };

  private move = (e: PointerEvent): void => {
    if (this.drag) this.drag.cur = this.toLogical(e);
  };

  private up = (): void => {
    const d = this.drag;
    this.drag = null;
    if (!d || this.me.state !== 'ready' || this.ended) return;
    const dv = { x: d.start.x - d.cur.x, y: d.start.y - d.cur.y };
    if (Math.hypot(dv.x, dv.y) < 18) return;
    this.launch(this.me, launchVelocity(dv));
  };

  private placeBall(s: Side): void {
    const dir = s.spot.x < SCREEN.w / 2 ? 1 : -1;
    s.vis = { x: s.spot.x + dir * 30, y: s.spot.y + 22 };
    s.ball.x = s.vis.x;
    s.ball.y = s.vis.y;
  }

  private launch(s: Side, v: Vec): void {
    if (s.state !== 'ready') return;
    s.ball = { x: s.vis.x, y: s.vis.y, vx: v.x, vy: v.y, r: BALL_R };
    s.state = 'flying';
    s.flyT = 0;
    s.scored = false;
    s.pose = 'kick';
    s.poseT = 0.35;
    sfx.kick();
  }

  private botShoot(s: Side): void {
    const skill = this.o.theme === 'global' || this.o.theme === 'superstar' ? 0.5 : 0.42;
    let v: Vec | null = null;
    if (Math.random() < skill) v = findScoringShot(s.vis, this.world);
    if (!v) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2;
      const sp = 500 + Math.random() * 500;
      v = { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp };
    }
    this.launch(s, v);
  }

  private update(dt: number): void {
    this.t += dt;
    this.goalFx = Math.max(0, this.goalFx - dt);
    this.beamT = Math.max(0, this.beamT - dt);
    if (this.banner && (this.banner.t -= dt) <= 0) this.banner = null;
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter((f) => f.t < 1.3);
    if (this.pausedFor > 0) {
      this.pausedFor -= dt;
      return;
    }
    if (this.pickupGone && (this.pickupT -= dt) <= 0) this.pickupGone = false;
    for (const s of [this.opp, this.me]) this.updateSide(s, dt, s === this.me ? this.opp : this.me);
  }

  private updateSide(s: Side, dt: number, other: Side): void {
    s.poseT -= dt;
    if (s.poseT <= 0 && s.pose !== 'hold') s.pose = 'hold';
    if (s.state === 'ready') {
      if (s.isBot && !this.ended && (s.timer -= dt) <= 0) {
        this.botShoot(s);
        s.timer = 1.3 + Math.random() * 1.4;
      }
      return;
    }
    if (s.state === 'cooldown') {
      if ((s.timer -= dt) <= 0) {
        s.state = 'ready';
        s.timer = 0.6 + Math.random() * 0.8;
        this.placeBall(s);
      }
      return;
    }
    // flying
    s.flyT += dt;
    s.spin += dt * 9;
    let n = Math.ceil(dt * 120);
    const sub = dt / n;
    let ev: ReturnType<typeof stepBall> = null;
    while (n-- > 0) {
      const e = stepBall(s.ball, sub, this.world);
      if (e === 'goal' || e === 'out') {
        ev = e;
        break;
      }
      if (e === 'bounce') ev = 'bounce';
    }
    if (ev === 'bounce') sfx.bounce();
    this.tryPickup(s);
    if (ev === 'goal' && !s.scored) this.onGoal(s, other);
    const done = ev === 'out' || s.flyT > 3.6;
    if (done) {
      if (!s.scored) s.combo = 0;
      s.state = 'cooldown';
      s.timer = 0.45;
    }
  }

  private tryPickup(s: Side): void {
    const p = LAYOUTS[this.o.theme].pickup;
    if (!p || this.pickupGone || s !== this.me && !this.o.demo) return;
    if (Math.hypot(s.ball.x - p.x, s.ball.y - p.y) < 34) {
      s.mult = 2;
      this.pickupGone = true;
      this.pickupT = 7;
      sfx.buy();
      this.floats.push({ text: 'x2', x: p.x, y: p.y, t: 0, big: false });
    }
  }

  private onGoal(s: Side, other: Side): void {
    s.scored = true;
    s.combo += 1;
    const pts = 10 * s.combo * s.mult;
    s.mult = 1;
    s.score += pts;
    this.goalFx = 0.9;
    this.beamT = 0.9;
    other.pose = 'dizzy';
    other.poseT = 1.2;
    s.pose = 'fall';
    s.poseT = 0.9;
    this.floats.push({ text: `+${pts}`, x: this.world.goal.cx + 24, y: this.world.goal.rimY - 60, t: 0, big: pts >= 30 });
    sfx.goal();
    if (s.score >= TARGET && !this.o.demo) this.finishRound(s);
  }

  private finishRound(winner: Side): void {
    const hudSlots = THEMES[this.o.theme].hud === 'slots';
    winner.rounds += 1;
    if (hudSlots && winner.rounds < ROUNDS_TO_WIN) {
      this.banner = { text: winner === this.me ? 'ROUND WON!' : 'ROUND LOST', t: 1.4 };
      this.pausedFor = 1.4;
      for (const s of [this.opp, this.me]) {
        s.score = 0;
        s.combo = 0;
        s.state = 'cooldown';
        s.timer = 0.1;
      }
      return;
    }
    this.ended = true;
    const won = winner === this.me;
    won ? sfx.win() : sfx.lose();
    const coins = won ? 150 + Math.min(150, Math.floor(this.me.score / 2)) : 40 + Math.floor(this.me.score / 5);
    setTimeout(() => this.o.onEnd?.({ won, score: this.me.score, coins }), 1100);
  }

  // ----------------------------------------------------------------- render
  private render(): void {
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    const th = THEMES[this.o.theme];
    drawArena(ctx, th.id, this.t);
    drawObstacles(ctx, th.id, this.t);
    const g = this.world.goal;

    const pick = LAYOUTS[th.id].pickup;
    if (pick && !this.pickupGone) {
      ctx.beginPath();
      ctx.arc(pick.x, pick.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#FF5A36';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#111';
      ctx.stroke();
      drawBall(ctx, pick.x, pick.y + Math.sin(this.t * 3) * 2, 18, 'ball-melon', this.t);
    }

    if (this.beamT > 0) lightBeams(ctx, g.cx, g.rimY - 110, g.rimY + 60, 0.55 * (this.beamT / 0.9));
    drawGoal(ctx, g.cx, g.rimY, g.halfW, g.netDepth, this.goalFx > 0 ? this.goalFx : 0, this.t);

    for (const s of [this.opp, this.me]) {
      const look = { x: g.cx - s.spot.x, y: g.rimY - s.spot.y };
      const dir = s.spot.x < SCREEN.w / 2 ? 1 : -1;
      drawBlob(ctx, {
        x: s.spot.x,
        y: s.spot.y,
        s: 1.05,
        color: s.color,
        addon: s.addon,
        jersey: s.jersey,
        number: s.number,
        pigtails: s.pigtails,
        pose: s.pose,
        look,
        flip: dir < 0,
        t: this.t + (s === this.me ? 1 : 0),
        rot: s.pose === 'fall' ? -0.35 * dir : 0,
      });
    }
    for (const s of [this.opp, this.me]) {
      if (s.state === 'ready') drawBall(ctx, s.vis.x, s.vis.y + Math.sin(this.t * 3) * 2, 15, s.skin, 0, true);
      else if (s.state === 'flying') drawBall(ctx, s.ball.x, s.ball.y, s.ball.r, s.skin, s.spin);
    }

    this.drawAim(ctx);
    if (this.me.mult === 2) outlineText(ctx, 'x2', this.me.vis.x, this.me.vis.y - 34, 22, '#FFC800');

    for (const f of this.floats) {
      const k = Math.min(1, f.t / 0.18);
      const size = (f.big ? 66 : 48) * (0.6 + 0.4 * k);
      ctx.globalAlpha = f.t > 0.9 ? Math.max(0, 1 - (f.t - 0.9) / 0.4) : 1;
      outlineText(ctx, f.text, f.x, f.y - f.t * 36, size);
      ctx.globalAlpha = 1;
    }
    if (this.goalFx > 0) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = i * 1.7 + this.t * 2;
        star(ctx, g.cx + Math.cos(a) * 50, g.rimY - 40 + Math.sin(a) * 26, 6 + (i % 2) * 3);
      }
    }

    drawHud(ctx, th.id, th.hud, this.opp, this.me, TARGET);
    if (this.banner) outlineText(ctx, this.banner.text, SCREEN.w / 2, 430, 54, '#FFC800');
    if (this.ended) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, SCREEN.w, SCREEN.h);
    }
  }

  private drawAim(ctx: Ctx): void {
    const d = this.drag;
    if (!d || this.me.state !== 'ready') return;
    const dv = { x: d.start.x - d.cur.x, y: d.start.y - d.cur.y };
    if (Math.hypot(dv.x, dv.y) < 10) return;
    const v = launchVelocity(dv);
    const pw = power(v);
    const from = this.me.vis;
    const sim = simulateShot(from, v, this.world, 1.6, 5);
    ctx.save();
    sim.points.slice(0, 22).forEach((p, i) => {
      ctx.globalAlpha = 1 - i / 26;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.2 - i * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#111';
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // power ring around the ball
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(from.x, from.y, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = pw > 0.85 ? '#FF5A36' : pw > 0.5 ? '#FFC800' : '#3DDC4A';
    ctx.beginPath();
    ctx.arc(from.x, from.y, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pw);
    ctx.stroke();
    ctx.restore();
  }
}
