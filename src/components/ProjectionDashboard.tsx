import type { DailyLogEntry, WeeklyProjectionSummary } from '../types/domain';
import { clamp, minutesToReadable } from '../utils/date';
import AuditReport from './AuditReport';

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
  const maxAverageMinutes =
    summary.applications.reduce(
      (max, app) => Math.max(max, app.averageDailyMinutes),
      0,
    ) || 1;

  const maxAverageCategoryMinutes =
    summary.categories.reduce((max, cat) => Math.max(max, cat.averageDailyMinutes), 0) ||
    1;

  return (
    <section className="panel dashboard-panel">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Signed in as {userEmail}</p>
          <h2>How Your Day Compares</h2>
          <p className="muted">
            Your usage today versus your typical daily pattern. What does your screen time
            story look like?
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
          <p>Today's Total Usage</p>
          <strong>{minutesToReadable(summary.totalTodayMinutes)}</strong>
        </article>
        <article className="stat-card">
          <p>21-Day Average</p>
          <strong>{minutesToReadable(summary.totalAverageDailyMinutes)}</strong>
        </article>
        <article className="stat-card">
          <p>Today's Status</p>
          <strong>{summary.isTodayRecorded ? '✓ Recorded' : '⚠ Not recorded'}</strong>
        </article>
        <article className="stat-card">
          <p>Daily logs loaded</p>
          <strong>{logs.length}</strong>
        </article>
      </div>

      {!summary.isTodayRecorded && (
        <div className="info-banner">
          <p>
            💡 <strong>Tip:</strong> Upload today's screenshot to see your current usage
            compared to your 21-day average.
          </p>
        </div>
      )}

      {summary.applications.length === 0 && summary.categories.length === 0 ? (
        <p className="empty-state">
          No usage history yet. Upload at least one screenshot to generate projections.
        </p>
      ) : (
        <>
          {summary.applications.length > 0 && (
            <>
              <h3>Applications</h3>
              <div className="projection-list" aria-label="Application comparison">
                {summary.applications.map((app) => {
                  const maxWidth = Math.max(app.todayMinutes, app.averageDailyMinutes);
                  const todayWidth =
                    maxWidth > 0 ? clamp((app.todayMinutes / maxWidth) * 100, 2, 100) : 0;
                  const averageWidth =
                    maxWidth > 0
                      ? clamp((app.averageDailyMinutes / maxWidth) * 100, 2, 100)
                      : 0;

                  return (
                    <article key={app.name} className="projection-row">
                      <div className="projection-meta">
                        <h4>{app.name}</h4>
                        <p>
                          Today: {minutesToReadable(app.todayMinutes)} / Prediction:{' '}
                          {minutesToReadable(app.averageDailyMinutes)}
                        </p>
                      </div>

                      <div className="projection-bars" aria-hidden="true">
                        {app.isTodayRecorded ? (
                          <>
                            <span
                              className="bar-actual"
                              style={{ width: `${todayWidth}%` }}
                              title="Today's usage"
                            />
                            <span
                              className="bar-projected"
                              style={{ width: `${averageWidth}%` }}
                              title="typical pattern"
                            />
                          </>
                        ) : (
                          <span
                            className="bar-projected"
                            style={{ width: `${averageWidth}%` }}
                            title="typical pattern (no data for today)"
                          />
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {summary.categories.length > 0 && (
            <>
              <h3>Categories</h3>
              <div className="projection-list" aria-label="Category comparison">
                {summary.categories.map((cat) => {
                  const maxWidth = Math.max(cat.todayMinutes, cat.averageDailyMinutes);
                  const todayWidth =
                    maxWidth > 0 ? clamp((cat.todayMinutes / maxWidth) * 100, 2, 100) : 0;
                  const averageWidth =
                    maxWidth > 0
                      ? clamp((cat.averageDailyMinutes / maxWidth) * 100, 2, 100)
                      : 0;

                  return (
                    <article key={cat.name} className="projection-row">
                      <div className="projection-meta">
                        <h4>{cat.name}</h4>
                        <p>
                          Today: {minutesToReadable(cat.todayMinutes)} / Prediction:{' '}
                          {minutesToReadable(cat.averageDailyMinutes)}
                        </p>
                      </div>

                      <div className="projection-bars" aria-hidden="true">
                        {cat.isTodayRecorded ? (
                          <>
                            <span
                              className="bar-actual"
                              style={{ width: `${todayWidth}%` }}
                              title="Today's usage"
                            />
                            <span
                              className="bar-projected"
                              style={{ width: `${averageWidth}%` }}
                              title="typical pattern"
                            />
                          </>
                        ) : (
                          <span
                            className="bar-projected"
                            style={{ width: `${averageWidth}%` }}
                            title="typical pattern (no data for today)"
                          />
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <AuditReport logs={logs} />
    </section>
  );
}
