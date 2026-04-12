import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import type { WeeklyProjectionSummary } from '../types/domain';
import ProjectionDashboard from './ProjectionDashboard';

const summary: WeeklyProjectionSummary = {
  generatedAtIso: '2026-04-11T12:00:00.000Z',
  lookbackDays: 21,
  isTodayRecorded: true,
  totalTodayMinutes: 420,
  totalAverageDailyMinutes: 500,
  applications: [
    {
      name: 'Chrome',
      todayMinutes: 260,
      averageDailyMinutes: 40,
      isTodayRecorded: true,
    },
  ],
  categories: [],
};

describe('ProjectionDashboard', () => {
  test('renders today vs 21-day average statistics and applications', () => {
    render(
      <ProjectionDashboard
        userEmail="student@example.com"
        loading={false}
        fetchError={null}
        logs={[]}
        summary={summary}
        onRefresh={vi.fn(async () => undefined)}
        onSignOut={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByText('Today vs 21-Day Average')).toBeInTheDocument();
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText(/21-Day Average/)).toBeInTheDocument();
  });
});
