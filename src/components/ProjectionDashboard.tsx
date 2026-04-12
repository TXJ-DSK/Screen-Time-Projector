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
    summary.applications.reduce(
      (max, app) => Math.max(max, app.projectedEndOfWeekMinutes),
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
            application.
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

      {summary.applications.length === 0 ? (
        <p className="empty-state">
          No app usage history yet. Upload at least one screenshot to generate
          projections.
        </p>
      ) : (
        <div className="projection-list" aria-label="Application projections">
          {summary.applications.map((app) => {
            const projectedWidth = clamp(
              (app.projectedEndOfWeekMinutes / maxProjectedMinutes) * 100,
              2,
              100,
            );
            const actualWidth = clamp(
              (app.weekToDateMinutes / maxProjectedMinutes) * 100,
              2,
              projectedWidth,
            );

            return (
              <article key={app.name} className="projection-row">
                <div className="projection-meta">
                  <h3>{app.name}</h3>
                  <p>
                    {minutesToReadable(app.weekToDateMinutes)} now /{' '}
                    {minutesToReadable(app.projectedEndOfWeekMinutes)} projected
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
