import type {
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

  const categoryHistory = new Map<string, number[]>();
  const categoryWeekToDate = new Map<string, number>();

  for (let dayOffset = 0; dayOffset < safeLookback; dayOffset += 1) {
    const day = addDays(lookbackStart, dayOffset);
    const dateKey = toDateKey(day);
    const log = logsByDate.get(dateKey);
    const categoryMinuteMap = new Map<string, number>();

    if (log) {
      for (const category of log.categories) {
        categoryMinuteMap.set(
          category.name,
          (categoryMinuteMap.get(category.name) ?? 0) + category.minutesSpent,
        );
      }
    }

    const knownCategories = new Set<string>([
      ...categoryHistory.keys(),
      ...categoryMinuteMap.keys(),
    ]);

    for (const categoryName of knownCategories) {
      if (!categoryHistory.has(categoryName)) {
        categoryHistory.set(categoryName, []);
      }

      categoryHistory.get(categoryName)?.push(categoryMinuteMap.get(categoryName) ?? 0);
    }

    if (day >= weekStart && day <= endDate) {
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

  const totalWeekToDateMinutes = categories.reduce(
    (sum, category) => sum + category.weekToDateMinutes,
    0,
  );
  const totalProjectedEndOfWeekMinutes = categories.reduce(
    (sum, category) => sum + category.projectedEndOfWeekMinutes,
    0,
  );
  const totalBaselineWeekMinutes = categories.reduce(
    (sum, category) => sum + category.baselineWeekMinutes,
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
    categories,
  };
}
