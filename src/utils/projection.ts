import type {
  ApplicationProjection,
  CategoryProjection,
  DailyLogEntry,
  WeeklyProjectionSummary,
} from '../types/domain';
import { addDays, startOfWeekMonday, toDateKey } from './date';

export function calculateWeeklyProjection(
  logs: DailyLogEntry[],
  lookbackDays: number,
  today = new Date(),
): WeeklyProjectionSummary {
  const safeLookback = Math.max(14, Math.min(21, lookbackDays));
  const endDate = new Date(today);
  endDate.setHours(0, 0, 0, 0);

  const lookbackStart = addDays(endDate, -(safeLookback - 1));
  const weekStart = startOfWeekMonday(endDate);

  const logsByDate = new Map<string, DailyLogEntry>();
  for (const log of logs) {
    logsByDate.set(log.dateKey, log);
  }

  const applicationHistory = new Map<string, number[]>();
  const applicationWeekToDate = new Map<string, number>();
  const categoryHistory = new Map<string, number[]>();
  const categoryWeekToDate = new Map<string, number>();

  for (let dayOffset = 0; dayOffset < safeLookback; dayOffset += 1) {
    const day = addDays(lookbackStart, dayOffset);
    const dateKey = toDateKey(day);
    const log = logsByDate.get(dateKey);
    const applicationMinuteMap = new Map<string, number>();
    const categoryMinuteMap = new Map<string, number>();

    if (log) {
      for (const app of log.applications) {
        applicationMinuteMap.set(
          app.name,
          (applicationMinuteMap.get(app.name) ?? 0) + app.minutesSpent,
        );
      }
      for (const category of log.categories) {
        categoryMinuteMap.set(
          category.name,
          (categoryMinuteMap.get(category.name) ?? 0) + category.minutesSpent,
        );
      }
    }

    const knownApplications = new Set<string>([
      ...applicationHistory.keys(),
      ...applicationMinuteMap.keys(),
    ]);
    const knownCategories = new Set<string>([
      ...categoryHistory.keys(),
      ...categoryMinuteMap.keys(),
    ]);

    for (const appName of knownApplications) {
      if (!applicationHistory.has(appName)) {
        applicationHistory.set(appName, []);
      }

      applicationHistory.get(appName)?.push(applicationMinuteMap.get(appName) ?? 0);
    }

    for (const categoryName of knownCategories) {
      if (!categoryHistory.has(categoryName)) {
        categoryHistory.set(categoryName, []);
      }

      categoryHistory.get(categoryName)?.push(categoryMinuteMap.get(categoryName) ?? 0);
    }

    if (day >= weekStart && day <= endDate) {
      for (const [appName, minutes] of applicationMinuteMap.entries()) {
        applicationWeekToDate.set(
          appName,
          (applicationWeekToDate.get(appName) ?? 0) + minutes,
        );
      }
      for (const [categoryName, minutes] of categoryMinuteMap.entries()) {
        categoryWeekToDate.set(
          categoryName,
          (categoryWeekToDate.get(categoryName) ?? 0) + minutes,
        );
      }
    }
  }

  const daysElapsedInWeek = Math.max(
    1,
    Math.round((endDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)) + 1,
  );
  const daysRemainingInWeek = Math.max(0, 7 - daysElapsedInWeek);

  const applications: ApplicationProjection[] = [...applicationHistory.entries()]
    .map(([name, minutesHistory]) => {
      const historyTotal = minutesHistory.reduce((sum, value) => sum + value, 0);
      const averageDailyMinutes = Math.round(historyTotal / safeLookback);
      const weekToDateMinutes = applicationWeekToDate.get(name) ?? 0;
      const projectedEndOfWeekMinutes =
        weekToDateMinutes + averageDailyMinutes * daysRemainingInWeek;

      return {
        name,
        weekToDateMinutes,
        averageDailyMinutes,
        projectedEndOfWeekMinutes,
        baselineWeekMinutes: averageDailyMinutes * 7,
      };
    })
    .filter((app) => app.baselineWeekMinutes > 0 || app.weekToDateMinutes > 0)
    .sort((a, b) => b.projectedEndOfWeekMinutes - a.projectedEndOfWeekMinutes);

  const categories: CategoryProjection[] = [...categoryHistory.entries()]
    .map(([name, minutesHistory]) => {
      const historyTotal = minutesHistory.reduce((sum, value) => sum + value, 0);
      const averageDailyMinutes = Math.round(historyTotal / safeLookback);
      const weekToDateMinutes = categoryWeekToDate.get(name) ?? 0;
      const projectedEndOfWeekMinutes =
        weekToDateMinutes + averageDailyMinutes * daysRemainingInWeek;

      return {
        name,
        weekToDateMinutes,
        averageDailyMinutes,
        projectedEndOfWeekMinutes,
        baselineWeekMinutes: averageDailyMinutes * 7,
      };
    })
    .filter(
      (category) => category.baselineWeekMinutes > 0 || category.weekToDateMinutes > 0,
    )
    .sort((a, b) => b.projectedEndOfWeekMinutes - a.projectedEndOfWeekMinutes);

  const totalWeekToDateMinutes = applications.reduce(
    (sum, app) => sum + app.weekToDateMinutes,
    0,
  );
  const totalProjectedEndOfWeekMinutes = applications.reduce(
    (sum, app) => sum + app.projectedEndOfWeekMinutes,
    0,
  );
  const totalBaselineWeekMinutes = applications.reduce(
    (sum, app) => sum + app.baselineWeekMinutes,
    0,
  );

  return {
    generatedAtIso: new Date().toISOString(),
    lookbackDays: safeLookback,
    daysElapsedInWeek,
    daysRemainingInWeek,
    totalWeekToDateMinutes,
    totalProjectedEndOfWeekMinutes,
    totalBaselineWeekMinutes,
    applications,
    categories,
  };
}
