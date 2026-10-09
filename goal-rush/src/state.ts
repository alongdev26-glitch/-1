import { ITEMS, itemById, type Tab } from './theme';

export interface Save {
  coins: number;
  owned: string[];
  equipped: Record<Tab, string>;
  matches: number;
}

const KEY = 'goal-rush-save-v1';

export const defaultSave = (): Save => ({
  coins: 500,
  owned: ITEMS.filter((i) => i.price === 0).map((i) => i.id),
  equipped: { ball: 'ball-classic', player: 'pl-blue', addon: 'ad-none' },
  matches: 0,
});

function read(): Save {
  const base = defaultSave();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s = JSON.parse(raw) as Partial<Save>;
    return {
      coins: typeof s.coins === 'number' ? s.coins : base.coins,
      owned: Array.isArray(s.owned) ? [...new Set([...base.owned, ...s.owned])] : base.owned,
      equipped: { ...base.equipped, ...(s.equipped ?? {}) },
      matches: typeof s.matches === 'number' ? s.matches : 0,
    };
  } catch {
    return base;
  }
}

export const save: Save = read();

export function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage unavailable (private window) – game still works */
  }
}

export const isOwned = (id: string): boolean => save.owned.includes(id);

/** Buys an item if affordable; returns whether it is now owned. */
export function buy(id: string, s: Save = save): boolean {
  if (s.owned.includes(id)) return true;
  const item = itemById(id);
  if (s.coins < item.price) return false;
  s.coins -= item.price;
  s.owned.push(id);
  return true;
}

export function equip(id: string, s: Save = save): void {
  const item = itemById(id);
  if (s.owned.includes(id)) s.equipped[item.tab] = id;
}
