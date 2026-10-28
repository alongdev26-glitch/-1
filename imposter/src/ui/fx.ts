import { load, save } from '../storage';

const KEY = 'imposter.sound';

let enabled = load(KEY) !== 'off';

export function isSoundOn() {
  return enabled;
}

export function setSoundOn(on: boolean) {
  enabled = on;
  save(KEY, on ? 'on' : 'off');
}

export function vibrate(pattern: number | number[]) {
  if (enabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
}

let ctx: AudioContext | null = null;

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.15) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export type Sfx = 'tap' | 'reveal' | 'vote' | 'win' | 'lose';

export function play(sfx: Sfx) {
  if (!enabled) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    return;
  }
  switch (sfx) {
    case 'tap':
      tone(520, 0, 0.06, 'triangle');
      break;
    case 'reveal':
      tone(440, 0, 0.1, 'triangle');
      tone(660, 0.08, 0.14, 'triangle');
      break;
    case 'vote':
      tone(300, 0, 0.08, 'square', 0.08);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle'));
      break;
    case 'lose':
      [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.3, 'sawtooth', 0.1));
      break;
  }
}
