import type { Category } from '../types';
import type { IconName } from '../ui/icons';

export type CategoryDef = Omit<Category, 'icon'> & { icon: IconName };

/** Shades of green and grey, in the order the summary draws them. */
export const CATEGORIES: CategoryDef[] = [
  { id: 'food', name: 'אוכל', icon: 'food', color: '#2fbf71' },
  { id: 'transport', name: 'תחבורה', icon: 'car', color: '#7bd9a3' },
  { id: 'lodging', name: 'לינה', icon: 'bed', color: '#1d8f55' },
  { id: 'activity', name: 'אטרקציות', icon: 'mountain', color: '#a9b5ae' },
  { id: 'shopping', name: 'קניות', icon: 'bag', color: '#6f7d75' },
  { id: 'other', name: 'אחר', icon: 'dots', color: '#47524c' },
];

export const categoryById = (id: string): CategoryDef => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
