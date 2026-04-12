import type { AuditReportStats, DailyLogEntry } from '../types/domain';

export function generateAuditReportStats(logs: DailyLogEntry[]): AuditReportStats {
  if (logs.length === 0) {
    return {
      averageDailyMinutes: 0,
      averageWeeklyDays: 0,
      averageMonthlyDays: 0,
      averageYearlyDays: 0,
      topAppByUsage: null,
      topCategoryByUsage: null,
      topAppSavingsPotential: null,
      topCategorySavingsPotential: null,
    };
  }

  // Calculate average daily minutes across all logs
  const totalMinutes = logs.reduce((sum, log) => sum + log.totalMinutes, 0);
  const averageDailyMinutes = Math.round(totalMinutes / logs.length);

  // Convert to days per week/month/year
  // 1 day = 1440 minutes
  const minutesPerDay = 1440;
  const averageWeeklyDays = Number((averageDailyMinutes * 7) / minutesPerDay).toFixed(1);
  const averageMonthlyDays = Number(
    (averageDailyMinutes * 30.44) / minutesPerDay,
  ).toFixed(1);
  const averageYearlyDays = Number((averageDailyMinutes * 365) / minutesPerDay).toFixed(
    1,
  );

  // Aggregate all applications and categories across logs
  const applicationTotals = new Map<string, number>();
  const categoryTotals = new Map<string, number>();

  for (const log of logs) {
    for (const app of log.applications) {
      applicationTotals.set(
        app.name,
        (applicationTotals.get(app.name) ?? 0) + app.minutesSpent,
      );
    }
    for (const category of log.categories) {
      categoryTotals.set(
        category.name,
        (categoryTotals.get(category.name) ?? 0) + category.minutesSpent,
      );
    }
  }

  // Find top app and category by usage
  let topAppByUsage: { name: string; minutesSpent: number } | null = null;
  let topAppAverageDailyMinutes = 0;
  let topAppTotalMinutes = 0;

  for (const [name, minutes] of applicationTotals.entries()) {
    if (minutes > topAppTotalMinutes) {
      topAppTotalMinutes = minutes;
      topAppAverageDailyMinutes = Math.round(minutes / logs.length);
      topAppByUsage = { name, minutesSpent: topAppAverageDailyMinutes };
    }
  }

  let topCategoryByUsage: { name: string; minutesSpent: number } | null = null;
  let topCategoryAverageDailyMinutes = 0;
  let topCategoryTotalMinutes = 0;

  for (const [name, minutes] of categoryTotals.entries()) {
    if (minutes > topCategoryTotalMinutes) {
      topCategoryTotalMinutes = minutes;
      topCategoryAverageDailyMinutes = Math.round(minutes / logs.length);
      topCategoryByUsage = { name, minutesSpent: topCategoryAverageDailyMinutes };
    }
  }

  // Calculate savings potential: if you cut the top app/category in half, how many days saved per week?
  const topAppSavingsPotential = topAppByUsage
    ? {
        name: topAppByUsage.name,
        dailyMinutes: topAppByUsage.minutesSpent,
        weeklySavingsDays: parseFloat(
          (((topAppByUsage.minutesSpent / 2) * 7) / minutesPerDay).toFixed(1),
        ),
      }
    : null;

  const topCategorySavingsPotential = topCategoryByUsage
    ? {
        name: topCategoryByUsage.name,
        dailyMinutes: topCategoryByUsage.minutesSpent,
        weeklySavingsDays: parseFloat(
          (((topCategoryByUsage.minutesSpent / 2) * 7) / minutesPerDay).toFixed(1),
        ),
      }
    : null;

  return {
    averageDailyMinutes,
    averageWeeklyDays: parseFloat(averageWeeklyDays),
    averageMonthlyDays: parseFloat(averageMonthlyDays),
    averageYearlyDays: parseFloat(averageYearlyDays),
    topAppByUsage,
    topCategoryByUsage,
    topAppSavingsPotential,
    topCategorySavingsPotential,
  };
}

export function getTopApplications(
  logs: DailyLogEntry[],
  limit: number = 5,
): Array<{ name: string; averageDailyMinutes: number }> {
  const applicationTotals = new Map<string, number>();

  for (const log of logs) {
    for (const app of log.applications) {
      applicationTotals.set(
        app.name,
        (applicationTotals.get(app.name) ?? 0) + app.minutesSpent,
      );
    }
  }

  return [...applicationTotals.entries()]
    .map(([name, totalMinutes]) => ({
      name,
      averageDailyMinutes: Math.round(totalMinutes / Math.max(1, logs.length)),
    }))
    .sort((a, b) => b.averageDailyMinutes - a.averageDailyMinutes)
    .slice(0, limit);
}

export function getTopCategories(
  logs: DailyLogEntry[],
  limit: number = 5,
): Array<{ name: string; averageDailyMinutes: number }> {
  const categoryTotals = new Map<string, number>();
  const categoryDayCounts = new Map<string, number>();

  // Aggregate all categories and count days they appear
  for (const log of logs) {
    for (const category of log.categories) {
      categoryTotals.set(
        category.name,
        (categoryTotals.get(category.name) ?? 0) + category.minutesSpent,
      );
      categoryDayCounts.set(
        category.name,
        (categoryDayCounts.get(category.name) ?? 0) + 1,
      );
    }
  }

  // Calculate average only based on days the category appears
  return [...categoryTotals.entries()]
    .map(([name, totalMinutes]) => {
      const daysWithData = categoryDayCounts.get(name) ?? 1;
      return {
        name,
        // Average across days when this category was tracked
        averageDailyMinutes: Math.round(totalMinutes / daysWithData),
      };
    })
    .sort((a, b) => b.averageDailyMinutes - a.averageDailyMinutes)
    .slice(0, limit);
}
