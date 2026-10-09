let ctx: AudioContext | null = null;

function tone(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number, delay = 0): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch {
    /* audio unavailable */
  }
}

export const sfx = {
  kick: () => tone(220, 0.12, 'triangle', 0.25, 90),
  bounce: () => tone(160, 0.08, 'sine', 0.18, 110),
  goal: () => {
    tone(523, 0.14, 'square', 0.12);
    tone(659, 0.14, 'square', 0.12, undefined, 0.1);
    tone(784, 0.26, 'square', 0.12, undefined, 0.2);
  },
  buy: () => {
    tone(880, 0.08, 'sine', 0.2);
    tone(1320, 0.14, 'sine', 0.2, undefined, 0.07);
  },
  deny: () => tone(120, 0.18, 'sawtooth', 0.15, 80),
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.2, undefined, i * 0.12)),
  lose: () => tone(300, 0.5, 'sawtooth', 0.15, 100),
};
