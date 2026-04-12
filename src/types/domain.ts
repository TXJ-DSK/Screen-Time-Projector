export interface ApplicationUsage {
  name: string;
  minutesSpent: number;
}

export interface DailyLogEntry {
  dateKey: string;
  dateIso: string;
  totalMinutes: number;
  applications: ApplicationUsage[];
}

export interface ExtractedScreenTimeData {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysInRange: number;
  totalAverageMinutes: number; // Average total screen time per day
  applications: ApplicationUsage[]; // Sum of all apps in the range
  rawText?: string;
}

export interface ApplicationProjection {
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
}
