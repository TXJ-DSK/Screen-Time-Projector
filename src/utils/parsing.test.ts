import { describe, expect, test } from 'vitest';

import {
  normalizeCategoryName,
  parseDurationToMinutes,
  sanitizeCategories,
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

describe('category sanitizing', () => {
  test('normalizes and merges duplicate category names', () => {
    const categories = sanitizeCategories([
      { name: ' entertainment ', minutesSpent: 50 },
      { name: 'Entertainment', minutesSpent: 20 },
      { name: 'SOCIAL', minutesSpent: 30 },
    ]);

    expect(categories).toEqual([
      { name: 'Entertainment', minutesSpent: 70 },
      { name: 'Social', minutesSpent: 30 },
    ]);
  });

  test('normalizes category names to title case', () => {
    expect(normalizeCategoryName('  PRODUCTIVITY  tools ')).toBe('Productivity Tools');
  });
});
