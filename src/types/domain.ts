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
  todayMinutes: number;
  averageDailyMinutes: number; // 21-day average
  isTodayRecorded: boolean;
}

export interface CategoryProjection {
  name: string;
  todayMinutes: number;
  averageDailyMinutes: number; // 21-day average
  isTodayRecorded: boolean;
}

export interface WeeklyProjectionSummary {
  generatedAtIso: string;
  lookbackDays: number;
  isTodayRecorded: boolean;
  totalTodayMinutes: number;
  totalAverageDailyMinutes: number;
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
