import type { DailyLogEntry, WeeklyProjectionSummary } from '../types/domain';
import { clamp, minutesToReadable } from '../utils/date';

interface ProjectionDashboardProps {
  userEmail: string;
  loading: boolean;
  fetchError: string | null;
  logs: DailyLogEntry[];
  summary: WeeklyProjectionSummary;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export default function ProjectionDashboard({
  userEmail,
  loading,
  fetchError,
  logs,
  summary,
  onRefresh,
  onSignOut,
}: ProjectionDashboardProps) {
  const maxProjectedMinutes =
    summary.categories.reduce(
      (max, category) => Math.max(max, category.projectedEndOfWeekMinutes),
      0,
    ) || 1;

  return (
    <section className="panel dashboard-panel">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Signed in as {userEmail}</p>
          <h2>Current Week vs Projection</h2>
          <p className="muted">
            Projection is based on a {summary.lookbackDays}-day moving average per
            category.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="ghost-btn"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" className="danger-btn" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <article className="stat-card">
          <p>This week so far</p>
          <strong>{minutesToReadable(summary.totalWeekToDateMinutes)}</strong>
        </article>
        <article className="stat-card">
          <p>Projected end of week</p>
          <strong>{minutesToReadable(summary.totalProjectedEndOfWeekMinutes)}</strong>
        </article>
        <article className="stat-card">
          <p>Baseline full week</p>
          <strong>{minutesToReadable(summary.totalBaselineWeekMinutes)}</strong>
        </article>
        <article className="stat-card">
          <p>Daily logs loaded</p>
          <strong>{logs.length}</strong>
        </article>
      </div>

      {fetchError && <p className="error-text">{fetchError}</p>}

      {summary.categories.length === 0 ? (
        <p className="empty-state">
          No category history yet. Upload at least one screenshot to generate projections.
        </p>
      ) : (
        <div className="projection-list" aria-label="Category projections">
          {summary.categories.map((category) => {
            const projectedWidth = clamp(
              (category.projectedEndOfWeekMinutes / maxProjectedMinutes) * 100,
              2,
              100,
            );
            const actualWidth = clamp(
              (category.weekToDateMinutes / maxProjectedMinutes) * 100,
              2,
              projectedWidth,
            );

            return (
              <article key={category.name} className="projection-row">
                <div className="projection-meta">
                  <h3>{category.name}</h3>
                  <p>
                    {minutesToReadable(category.weekToDateMinutes)} now /{' '}
                    {minutesToReadable(category.projectedEndOfWeekMinutes)} projected
                  </p>
                </div>

                <div className="projection-bars" aria-hidden="true">
                  <span
                    className="bar-projected"
                    style={{ width: `${projectedWidth}%` }}
                  />
                  <span className="bar-actual" style={{ width: `${actualWidth}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
