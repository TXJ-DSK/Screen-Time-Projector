export interface ScreenTimeCategory {
  name: string;
  minutesSpent: number;
}

export interface DailyLogEntry {
  dateKey: string;
  dateIso: string;
  totalMinutes: number;
  categories: ScreenTimeCategory[];
}

export interface ExtractedScreenTimeData {
  dateKey: string;
  totalMinutes: number;
  categories: ScreenTimeCategory[];
  rawText?: string;
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
  categories: CategoryProjection[];
}
