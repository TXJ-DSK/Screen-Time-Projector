import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { DailyLogEntry } from '../types/domain';
import {
  generateAuditReportStats,
  getTopApplications,
  getTopCategories,
} from '../utils/auditReportCalculations';
import { minutesToReadable } from '../utils/date';

interface AuditReportProps {
  logs: DailyLogEntry[];
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

export default function AuditReport({ logs }: AuditReportProps) {
  if (logs.length === 0) {
    return (
      <section className="panel audit-report">
        <div className="panel-head">
          <h2>Audit Report</h2>
          <p className="muted">
            Upload and extract screen time data to see your audit report.
          </p>
        </div>
      </section>
    );
  }

  const stats = generateAuditReportStats(logs);
  const topApps = getTopApplications(logs, 5);
  const topCategories = getTopCategories(logs, 5);

  const appChartData = topApps.map((app) => ({
    name: app.name,
    value: app.averageDailyMinutes,
  }));

  const categoryChartData = topCategories.map((category) => ({
    name: category.name,
    value: category.averageDailyMinutes,
  }));

  return (
    <section className="panel audit-report">
      <div className="panel-head">
        <h2>Audit Report</h2>
        <p className="muted">Screen time analysis and insights</p>
      </div>

      <div className="audit-stats">
        <div className="stat-card">
          <h3>Average Daily Usage</h3>
          <p className="stat-value">{minutesToReadable(stats.averageDailyMinutes)}</p>
        </div>

        <div className="stat-card">
          <h3>Per Week</h3>
          <p className="stat-value">{stats.averageWeeklyDays} days</p>
        </div>

        <div className="stat-card">
          <h3>Per Month</h3>
          <p className="stat-value">{stats.averageMonthlyDays} days</p>
        </div>

        <div className="stat-card">
          <h3>Per Year</h3>
          <p className="stat-value">{stats.averageYearlyDays} days</p>
        </div>
      </div>

      {stats.topAppSavingsPotential && (
        <div className="savings-card">
          <h3>Potential Time Savings</h3>
          <p>
            If you cut back on <strong>{stats.topAppSavingsPotential.name}</strong> by
            half, you could save approximately{' '}
            <strong>
              {stats.topAppSavingsPotential.weeklySavingsDays} days per week
            </strong>
            .
          </p>
        </div>
      )}

      <div className="chart-grid">
        <div className="chart-container">
          <h3>Top Applications (daily average)</h3>
          {appChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {appChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => {
                    if (typeof value === 'number') {
                      return minutesToReadable(value);
                    }
                    return String(value);
                  }}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">No application data available</p>
          )}
        </div>

        <div className="chart-container">
          <h3>Top Categories (daily average)</h3>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => {
                    if (typeof value === 'number') {
                      return minutesToReadable(value);
                    }
                    return String(value);
                  }}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">No category data available</p>
          )}
        </div>
      </div>

      {stats.topCategorySavingsPotential && (
        <div className="savings-card">
          <h3>Category Insights</h3>
          <p>
            Your top category is <strong>{stats.topCategorySavingsPotential.name}</strong>{' '}
            at{' '}
            <strong>
              {minutesToReadable(stats.topCategorySavingsPotential.dailyMinutes)}
            </strong>{' '}
            per day. If you reduce this by half, you could save approximately{' '}
            <strong>
              {stats.topCategorySavingsPotential.weeklySavingsDays} days per week
            </strong>
            .
          </p>
        </div>
      )}
    </section>
  );
}
