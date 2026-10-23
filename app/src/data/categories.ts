import type { Category } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'אוכל', icon: '🍜', color: '#f59e0b' },
  { id: 'transport', name: 'תחבורה', icon: '🚕', color: '#38bdf8' },
  { id: 'lodging', name: 'לינה', icon: '🛏️', color: '#a78bfa' },
  { id: 'activity', name: 'אטרקציות', icon: '🤿', color: '#34d399' },
  { id: 'shopping', name: 'קניות', icon: '🛍️', color: '#f472b6' },
  { id: 'other', name: 'אחר', icon: '⋯', color: '#94a3b8' },
];

export const categoryById = (id: string): Category => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
