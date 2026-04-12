import type { ApplicationUsage, ScreenTimeCategory } from '../types/domain';

export function normalizeAppName(name: string): string {
  const collapsed = name.trim().replace(/\s+/g, ' ');
  if (collapsed.length === 0) {
    return 'Other';
  }

  return collapsed
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeCategoryName(name: string): string {
  const collapsed = name.trim().replace(/\s+/g, ' ');
  if (collapsed.length === 0) {
    return 'Other';
  }

  return collapsed
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function parseDurationToMinutes(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.round(value));
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const normalized = value.toLowerCase().trim();

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  const hoursMatch = normalized.match(/(\d+)\s*h(?:our|ours)?/);
  const minutesMatch = normalized.match(/(\d+)\s*m(?:in|ins|minute|minutes)?/);

  const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;

  return hours * 60 + minutes;
}

export function sumApplicationMinutes(applications: ApplicationUsage[]): number {
  return applications.reduce((sum, app) => sum + app.minutesSpent, 0);
}

export function sanitizeApplications(
  applications: ApplicationUsage[],
): ApplicationUsage[] {
  const appMap = new Map<string, number>();

  for (const app of applications) {
    const name = normalizeAppName(app.name);
    const minutes = Math.max(0, Math.round(app.minutesSpent));

    if (!name || minutes <= 0) {
      continue;
    }

    const previousMinutes = appMap.get(name) ?? 0;
    appMap.set(name, previousMinutes + minutes);
  }

  return [...appMap.entries()].map(([name, minutesSpent]) => ({
    name,
    minutesSpent,
  }));
}

export function sumCategoryMinutes(categories: ScreenTimeCategory[]): number {
  return categories.reduce((sum, category) => sum + category.minutesSpent, 0);
}

export function sanitizeCategories(
  categories: ScreenTimeCategory[],
): ScreenTimeCategory[] {
  const catMap = new Map<string, number>();

  for (const category of categories) {
    const name = normalizeCategoryName(category.name);
    const minutes = Math.max(0, Math.round(category.minutesSpent));

    if (!name || minutes <= 0) {
      continue;
    }

    const previousMinutes = catMap.get(name) ?? 0;
    catMap.set(name, previousMinutes + minutes);
  }

  return [...catMap.entries()].map(([name, minutesSpent]) => ({
    name,
    minutesSpent,
  }));
}
