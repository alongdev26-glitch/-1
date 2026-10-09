// Palette and catalog taken 1:1 from the GOAL RUSH design prompt.
export const C = {
  skyTop: '#29B6FF',
  skyBottom: '#8FE3FF',
  grass: '#3DDC4A',
  orangeRed: '#FF5A36',
  gold: '#FFC800',
  purple: '#7B3FF2',
  navy: '#1B2A6B',
  net: '#FFFFFF',
  btnTop: '#3BCB2F',
  btnBottom: '#1E9E14',
  lavender: '#B9A8F0',
  cardBorder: '#8A74C9',
  tabInactive: '#9B84D8',
  cardFill: '#9279C4',
  periwinkle: '#8FA8F5',
  ink: '#111111',
} as const;

export type ThemeId = 'shoot' | 'battles' | 'global' | 'superstar';

export interface Theme {
  id: ThemeId;
  banner: string;
  bannerStyle: 'blue' | 'yellow' | 'purple';
  hud: 'score' | 'slots';
  obstacles: boolean;
}

export const THEMES: Record<ThemeId, Theme> = {
  shoot: { id: 'shoot', banner: 'SHOOT AND SCORE', bannerStyle: 'yellow', hud: 'score', obstacles: false },
  battles: { id: 'battles', banner: '1V1 BATTLES', bannerStyle: 'blue', hud: 'score', obstacles: false },
  global: { id: 'global', banner: 'GLOBAL COMPETITION', bannerStyle: 'yellow', hud: 'slots', obstacles: true },
  superstar: { id: 'superstar', banner: 'BECOME A SUPERSTAR', bannerStyle: 'purple', hud: 'score', obstacles: true },
};
export const THEME_ORDER: ThemeId[] = ['shoot', 'battles', 'global', 'superstar'];

export type Tab = 'ball' | 'player' | 'addon';

export interface Item {
  id: string;
  tab: Tab;
  name: string;
  price: number;
  color?: string; // player body colour
}

export const ITEMS: Item[] = [
  { id: 'ball-classic', tab: 'ball', name: 'Classic', price: 0 },
  { id: 'ball-gold', tab: 'ball', name: 'Golden', price: 300 },
  { id: 'ball-flame', tab: 'ball', name: 'Flame', price: 600 },
  { id: 'ball-melon', tab: 'ball', name: 'Watermelon', price: 800 },
  { id: 'ball-neon', tab: 'ball', name: 'Neon', price: 1200 },
  { id: 'ball-planet', tab: 'ball', name: 'Planet', price: 2000 },
  { id: 'pl-blue', tab: 'player', name: 'Blue', price: 0, color: '#2F6BFF' },
  { id: 'pl-red', tab: 'player', name: 'Red', price: 400, color: '#F23B3B' },
  { id: 'pl-orange', tab: 'player', name: 'Orange', price: 400, color: '#FF8A1F' },
  { id: 'pl-green', tab: 'player', name: 'Green', price: 600, color: '#2FBF4A' },
  { id: 'pl-pink', tab: 'player', name: 'Pink', price: 800, color: '#FF5FB0' },
  { id: 'pl-yellow', tab: 'player', name: 'Yellow', price: 1000, color: '#FFD21F' },
  { id: 'ad-none', tab: 'addon', name: 'None', price: 0 },
  { id: 'ad-cone', tab: 'addon', name: 'Cone', price: 200 },
  { id: 'ad-helmet', tab: 'addon', name: 'Helmet', price: 500 },
  { id: 'ad-phones', tab: 'addon', name: 'Headphones', price: 1000 },
  { id: 'ad-tophat', tab: 'addon', name: 'Top Hat', price: 2500 },
  { id: 'ad-jester', tab: 'addon', name: 'Jester', price: 5000 },
];

export const itemById = (id: string): Item => ITEMS.find((i) => i.id === id) ?? ITEMS[0];

export interface Flag {
  id: string;
  name: string;
}
export const FLAGS = ['uk', 'us', 'tr', 'fr', 'it'] as const;
export type FlagId = (typeof FLAGS)[number];
export const OPPONENTS: { name: string; flag: FlagId }[] = [
  { name: 'Elias', flag: 'uk' },
  { name: 'Emu', flag: 'tr' },
  { name: 'Elias', flag: 'fr' },
  { name: 'Luca', flag: 'it' },
];
