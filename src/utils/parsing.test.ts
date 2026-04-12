import { describe, expect, test } from 'vitest';

import {
  normalizeAppName,
  parseDurationToMinutes,
  sanitizeApplications,
} from './parsing';

describe('parseDurationToMinutes', () => {
  test('handles number-like strings', () => {
    expect(parseDurationToMinutes('45')).toBe(45);
  });

  test('handles hour and minute strings', () => {
    expect(parseDurationToMinutes('1h 30m')).toBe(90);
    expect(parseDurationToMinutes('2 hours')).toBe(120);
    expect(parseDurationToMinutes('40 minutes')).toBe(40);
  });

  test('handles numeric values', () => {
    expect(parseDurationToMinutes(67)).toBe(67);
  });
});

describe('application sanitizing', () => {
  test('normalizes and merges duplicate application names', () => {
    const applications = sanitizeApplications([
      { name: ' Chrome ', minutesSpent: 50 },
      { name: 'Chrome', minutesSpent: 20 },
      { name: 'DISCORD', minutesSpent: 30 },
    ]);

    expect(applications).toEqual([
      { name: 'Chrome', minutesSpent: 70 },
      { name: 'Discord', minutesSpent: 30 },
    ]);
  });

  test('normalizes application names to title case', () => {
    expect(normalizeAppName('  visual  studio  code  ')).toBe('Visual Studio Code');
  });
});
