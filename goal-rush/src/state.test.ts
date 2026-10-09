import { describe, expect, it } from 'vitest';
import { buy, defaultSave, equip } from './state';

describe('shop', () => {
  it('cannot buy without enough coins', () => {
    const s = defaultSave();
    s.coins = 100;
    expect(buy('ad-cone', s)).toBe(false);
    expect(s.owned).not.toContain('ad-cone');
    expect(s.coins).toBe(100);
  });

  it('buying deducts the price once and allows equipping', () => {
    const s = defaultSave();
    s.coins = 300;
    expect(buy('ad-cone', s)).toBe(true);
    expect(s.coins).toBe(100);
    expect(buy('ad-cone', s)).toBe(true);
    expect(s.coins).toBe(100);
    equip('ad-cone', s);
    expect(s.equipped.addon).toBe('ad-cone');
  });

  it('cannot equip an item that is not owned', () => {
    const s = defaultSave();
    equip('ad-jester', s);
    expect(s.equipped.addon).toBe('ad-none');
  });
});
