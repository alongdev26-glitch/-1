import type { ISODate, VisaStay } from '../types';
import { addDays, daysBetween } from './dates';

export const ALERT_DAYS = [7, 3, 1] as const;

export interface VisaStatus {
  used: number; // the entry day counts
  remaining: number;
  allowed: number;
  lastDay: ISODate; // last allowed day
  percentLeft: number;
  level: 'ok' | 'warn' | 'danger' | 'over';
  active: boolean;
}

export function visaStatus(stay: VisaStay, now: ISODate): VisaStatus {
  const end = stay.exitDate && stay.exitDate < now ? stay.exitDate : now;
  const used = Math.max(0, Math.min(daysBetween(stay.entryDate, end) + 1, 9999));
  const remaining = stay.allowedDays - used;
  const level = remaining < 0 ? 'over' : remaining <= 3 ? 'danger' : remaining <= 7 ? 'warn' : 'ok';
  return {
    used,
    remaining,
    allowed: stay.allowedDays,
    lastDay: addDays(stay.entryDate, stay.allowedDays - 1),
    percentLeft: Math.max(0, Math.min(100, Math.round((remaining / stay.allowedDays) * 100))),
    level,
    active: !stay.exitDate || stay.exitDate >= now,
  };
}

/** Which of the alert thresholds (in days) are reached today. */
export function dueAlert(remaining: number, enabled: number[]): number | null {
  const hit = enabled.filter((d) => remaining <= d && remaining >= 0).sort((a, b) => a - b)[0];
  return hit ?? null;
}
