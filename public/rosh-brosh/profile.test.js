import { describe, it, expect } from 'vitest';
import { ageGroup, validateProfile, LOGOS } from './profile.js';

describe('פרופיל', () => {
  it('קבוצת גיל', () => {
    expect(ageGroup(5)).toBe('ילד');
    expect(ageGroup(12)).toBe('ילד');
    expect(ageGroup(13)).toBe('נער');
    expect(ageGroup(17)).toBe('נער');
    expect(ageGroup(18)).toBe('מבוגר');
    expect(ageGroup(99)).toBe('מבוגר');
    expect(ageGroup(3)).toBe('');
    expect(ageGroup('abc')).toBe('');
  });
  it('מאמת שם, גיל ולוגו', () => {
    expect(validateProfile({ name: '  דנה   כהן ', age: '25', logo: 'crown' })).toEqual({ value: { name: 'דנה כהן', age: 25, logo: 'crown' } });
    expect(validateProfile({ name: '', age: 20, logo: 'bolt' }).error).toBeTruthy();
    expect(validateProfile({ name: 'א'.repeat(15), age: 20, logo: 'bolt' }).error).toBeTruthy();
    expect(validateProfile({ name: 'דנה', age: '4', logo: 'bolt' }).error).toBeTruthy();
    expect(validateProfile({ name: 'דנה', age: '100', logo: 'bolt' }).error).toBeTruthy();
    expect(validateProfile({ name: 'דנה', age: '12.5', logo: 'bolt' }).error).toBeTruthy();
    expect(validateProfile({ name: 'דנה', age: '', logo: 'bolt' }).error).toBeTruthy();
    expect(validateProfile({ name: 'דנה', age: 20, logo: 'banana' }).error).toBeTruthy();
    for (const l of LOGOS) expect(validateProfile({ name: 'דנה', age: 20, logo: l }).value.logo).toBe(l);
  });
});
