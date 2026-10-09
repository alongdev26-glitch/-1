import './style.css';
import { customizeScreen, fitUnit, homeScreen, matchScreen, mount, resultScreen, showcaseScreen } from './screens';
import { persist, save } from './state';
import { THEME_ORDER } from './theme';
import type { MatchResult } from './match';

let current: HTMLElement | null = null;

function show(node: HTMLElement): void {
  current?.dispatchEvent(new Event('gr-leave'));
  current = node;
  mount(node);
}

function home(): void {
  show(homeScreen({ play, shop: () => show(customizeScreen(home)), showcase: () => show(showcaseScreen(home)) }));
}

function play(): void {
  const theme = THEME_ORDER[save.matches % THEME_ORDER.length];
  show(matchScreen(theme, finished, home));
}

function finished(r: MatchResult): void {
  save.coins += r.coins;
  save.matches += 1;
  persist();
  show(resultScreen(r, play, home));
}

fitUnit();
window.addEventListener('resize', fitUnit);
if (location.hash === '#result') show(resultScreen({ won: true, score: 58, coins: 179 }, play, home));
else home();
