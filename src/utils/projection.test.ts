import { describe, expect, test } from 'vitest';

import type { DailyLogEntry } from '../types/domain';
import { calculateWeeklyProjection } from './projection';

function makeLog(
  dateKey: string,
  chromeMinutes: number,
  discordMinutes: number,
): DailyLogEntry {
  return {
    dateKey,
    dateIso: new Date(`${dateKey}T00:00:00`).toISOString(),
    totalMinutes: chromeMinutes + discordMinutes,
    applications: [
      { name: 'Chrome', minutesSpent: chromeMinutes },
      { name: 'Discord', minutesSpent: discordMinutes },
    ],
  };
}

describe('calculateWeeklyProjection', () => {
  test('calculates application projections from a 21-day window', () => {
    const logs: DailyLogEntry[] = [
      makeLog('2026-03-22', 60, 30),
      makeLog('2026-03-23', 70, 20),
      makeLog('2026-03-24', 50, 40),
      makeLog('2026-03-25', 40, 20),
      makeLog('2026-03-26', 65, 35),
      makeLog('2026-03-27', 55, 20),
      makeLog('2026-03-28', 80, 25),
      makeLog('2026-03-29', 75, 45),
      makeLog('2026-03-30', 45, 40),
      makeLog('2026-03-31', 50, 35),
      makeLog('2026-04-01', 62, 42),
      makeLog('2026-04-02', 57, 33),
      makeLog('2026-04-03', 48, 30),
      makeLog('2026-04-04', 85, 52),
      makeLog('2026-04-05', 70, 30),
      makeLog('2026-04-06', 55, 28),
      makeLog('2026-04-07', 65, 34),
      makeLog('2026-04-08', 60, 36),
      makeLog('2026-04-09', 58, 25),
      makeLog('2026-04-10', 53, 22),
      makeLog('2026-04-11', 68, 27),
    ];

    const summary = calculateWeeklyProjection(logs, 21, new Date('2026-04-11T12:00:00'));

    expect(summary.applications).toHaveLength(2);
    expect(summary.totalWeekToDateMinutes).toBeGreaterThan(0);
    expect(summary.totalProjectedEndOfWeekMinutes).toBeGreaterThanOrEqual(
      summary.totalWeekToDateMinutes,
    );

    const chrome = summary.applications.find((app) => app.name === 'Chrome');
    expect(chrome?.averageDailyMinutes).toBeGreaterThan(0);
  });

  test('clamps lookback days to at least 14 days', () => {
    const logs = [makeLog('2026-04-11', 120, 40)];

    const summary = calculateWeeklyProjection(logs, 3, new Date('2026-04-11T12:00:00'));

    expect(summary.lookbackDays).toBe(14);
    expect(summary.applications[0]?.baselineWeekMinutes).toBeGreaterThan(0);
  });
});
