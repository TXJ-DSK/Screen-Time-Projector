import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import type { WeeklyProjectionSummary } from '../types/domain';
import ProjectionDashboard from './ProjectionDashboard';

const summary: WeeklyProjectionSummary = {
  generatedAtIso: '2026-04-11T12:00:00.000Z',
  lookbackDays: 21,
  daysElapsedInWeek: 6,
  daysRemainingInWeek: 1,
  totalWeekToDateMinutes: 420,
  totalProjectedEndOfWeekMinutes: 500,
  totalBaselineWeekMinutes: 490,
  categories: [
    {
      name: 'Entertainment',
      weekToDateMinutes: 260,
      averageDailyMinutes: 40,
      projectedEndOfWeekMinutes: 300,
      baselineWeekMinutes: 280,
    },
  ],
};

describe('ProjectionDashboard', () => {
  test('renders projection statistics and categories', () => {
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

    expect(screen.getByText('Current Week vs Projection')).toBeInTheDocument();
    expect(screen.getByText('Entertainment')).toBeInTheDocument();
    expect(screen.getByText(/Projected end of week/)).toBeInTheDocument();
  });
});
