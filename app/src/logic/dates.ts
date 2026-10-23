import type { ISODate } from '../types';

export function toISODate(d: Date): ISODate {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const today = (): ISODate => toISODate(new Date());

export function parseISO(s: ISODate): number {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b) - parseISO(a)) / 86_400_000);
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = new Date(parseISO(s) + n * 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function formatShort(s: ISODate): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

const MONTHS = ['בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני', 'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר'];
export function formatDayTitle(s: ISODate, now: ISODate = today()): string {
  const [, m, d] = s.split('-').map(Number);
  const label = `${d} ${MONTHS[m - 1]}`;
  const diff = daysBetween(s, now);
  if (diff === 0) return `היום - ${label}`;
  if (diff === 1) return `אתמול - ${label}`;
  return label;
}

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'];
export const weekdayShort = (s: ISODate) => WEEKDAYS[new Date(parseISO(s)).getUTCDay()];
