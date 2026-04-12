export interface ApplicationUsage {
  name: string;
  minutesSpent: number;
}

export interface ScreenTimeCategory {
  name: string;
  minutesSpent: number;
}

export interface DailyLogEntry {
  dateKey: string;
  dateIso: string;
  totalMinutes: number;
  applications: ApplicationUsage[];
  categories: ScreenTimeCategory[];
}

export interface ExtractedScreenTimeData {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysInRange: number;
  totalAverageMinutes: number; // Average total screen time per day
  applications: ApplicationUsage[]; // Sum of all apps in the range
  categories: ScreenTimeCategory[]; // Sum of all categories in the range
  rawText?: string;
}

export interface ApplicationProjection {
  name: string;
  weekToDateMinutes: number;
  averageDailyMinutes: number;
  projectedEndOfWeekMinutes: number;
  baselineWeekMinutes: number;
}

export interface CategoryProjection {
  name: string;
  weekToDateMinutes: number;
  averageDailyMinutes: number;
  projectedEndOfWeekMinutes: number;
  baselineWeekMinutes: number;
}

export interface WeeklyProjectionSummary {
  generatedAtIso: string;
  lookbackDays: number;
  daysElapsedInWeek: number;
  daysRemainingInWeek: number;
  totalWeekToDateMinutes: number;
  totalProjectedEndOfWeekMinutes: number;
  totalBaselineWeekMinutes: number;
  applications: ApplicationProjection[];
  categories: CategoryProjection[];
}

export interface AuditReportStats {
  averageDailyMinutes: number;
  averageWeeklyDays: number; // Average days per week
  averageMonthlyDays: number; // Average days per month
  averageYearlyDays: number; // Average days per year
  topAppByUsage: { name: string; minutesSpent: number } | null;
  topCategoryByUsage: { name: string; minutesSpent: number } | null;
  topAppSavingsPotential: {
    name: string;
    dailyMinutes: number;
    weeklySavingsDays: number;
  } | null;
  topCategorySavingsPotential: {
    name: string;
    dailyMinutes: number;
    weeklySavingsDays: number;
  } | null;
}
