import type {
  ApplicationProjection,
  CategoryProjection,
  DailyLogEntry,
  WeeklyProjectionSummary,
} from '../types/domain';
import { addDays, toDateKey } from './date';

export function calculateWeeklyProjection(
  logs: DailyLogEntry[],
  lookbackDays: number,
  today = new Date(),
): WeeklyProjectionSummary {
  const safeLookback = Math.max(14, Math.min(21, lookbackDays));
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(todayDate);

  const lookbackStart = addDays(todayDate, -(safeLookback - 1));

  const logsByDate = new Map<string, DailyLogEntry>();
  for (const log of logs) {
    logsByDate.set(log.dateKey, log);
  }

  // Get today's log if it exists
  const todayLog = logsByDate.get(todayKey);
  const isTodayRecorded = !!todayLog;

  // Build 21-day history for all apps and categories
  const applicationHistory = new Map<string, number[]>();
  const categoryHistory = new Map<string, number[]>();
  const todayApplicationMinutes = new Map<string, number>();
  const todayCategoryMinutes = new Map<string, number>();

  // If today has data, extract it separately
  if (todayLog) {
    for (const app of todayLog.applications) {
      todayApplicationMinutes.set(
        app.name,
        (todayApplicationMinutes.get(app.name) ?? 0) + app.minutesSpent,
      );
    }
    for (const category of todayLog.categories) {
      todayCategoryMinutes.set(
        category.name,
        (todayCategoryMinutes.get(category.name) ?? 0) + category.minutesSpent,
      );
    }
  }

  // Build history for all 21 days
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
  }

  // Calculate projections: today vs 21-day average
  const applications: ApplicationProjection[] = [...applicationHistory.entries()]
    .map(([name, minutesHistory]) => {
      const historyTotal = minutesHistory.reduce((sum, value) => sum + value, 0);
      const averageDailyMinutes = Math.round(historyTotal / safeLookback);
      const todayMinutes = todayApplicationMinutes.get(name) ?? 0;

      return {
        name,
        todayMinutes,
        averageDailyMinutes,
        isTodayRecorded,
      };
    })
    .filter((app) => app.averageDailyMinutes > 0 || app.todayMinutes > 0)
    .sort((a, b) => b.averageDailyMinutes - a.averageDailyMinutes);

  const categories: CategoryProjection[] = [...categoryHistory.entries()]
    .map(([name, minutesHistory]) => {
      const historyTotal = minutesHistory.reduce((sum, value) => sum + value, 0);
      const averageDailyMinutes = Math.round(historyTotal / safeLookback);
      const todayMinutes = todayCategoryMinutes.get(name) ?? 0;

      return {
        name,
        todayMinutes,
        averageDailyMinutes,
        isTodayRecorded,
      };
    })
    .filter((cat) => cat.averageDailyMinutes > 0 || cat.todayMinutes > 0)
    .sort((a, b) => b.averageDailyMinutes - a.averageDailyMinutes);

  const totalTodayMinutes = applications.reduce(
    (sum, app) => sum + app.todayMinutes,
    0,
  );
  const totalAverageDailyMinutes = applications.reduce(
    (sum, app) => sum + app.averageDailyMinutes,
    0,
  );

  return {
    generatedAtIso: new Date().toISOString(),
    lookbackDays: safeLookback,
    isTodayRecorded,
    totalTodayMinutes,
    totalAverageDailyMinutes,
    applications,
    categories,
  };
}
