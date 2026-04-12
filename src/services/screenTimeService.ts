import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';

import type {
  ApplicationUsage,
  DailyLogEntry,
  ExtractedScreenTimeData,
} from '../types/domain';
import { addDays, toDateKey } from '../utils/date';
import { sanitizeApplications } from '../utils/parsing';
import { getFirestoreDb } from './firebase';

interface FirestoreDailyLog {
  date: Timestamp;
  totalMinutes: number;
  applications: ApplicationUsage[];
}

export async function ensureUserDocument(
  uid: string,
  email: string | null,
): Promise<void> {
  const db = getFirestoreDb();

  await setDoc(
    doc(db, 'users', uid),
    {
      email,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function saveScreenTimeRange(
  uid: string,
  extractedData: ExtractedScreenTimeData,
): Promise<void> {
  const db = getFirestoreDb();
  const applications = sanitizeApplications(extractedData.applications);

  // Parse dates
  const startDate = new Date(`${extractedData.startDate}T00:00:00`);
  const daysInRange = extractedData.daysInRange;

  // Calculate averaged applications for each day
  const averagedApplications: ApplicationUsage[] = applications.map((app) => ({
    name: app.name,
    minutesSpent: Math.round(app.minutesSpent / daysInRange),
  }));

  // Use user-provided total average minutes
  const totalMinutes = extractedData.totalAverageMinutes;

  // Save to each date in range
  for (let i = 0; i < daysInRange; i++) {
    const currentDate = addDays(startDate, i);
    const dateKey = toDateKey(currentDate);

    await setDoc(
      doc(db, 'users', uid, 'daily_logs', dateKey),
      {
        date: Timestamp.fromDate(currentDate),
        totalMinutes,
        applications: averagedApplications,
      },
      { merge: true },
    );
  }
}

export async function fetchLogsForDateWindow(
  uid: string,
  startDate: Date,
  endDate: Date,
): Promise<DailyLogEntry[]> {
  const db = getFirestoreDb();
  const logsCollection = collection(db, 'users', uid, 'daily_logs');

  const logsQuery = query(
    logsCollection,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'asc'),
  );

  const snapshot = await getDocs(logsQuery);

  return snapshot.docs.map((snapshotDoc) => {
    const data = snapshotDoc.data() as FirestoreDailyLog;
    const date = data.date.toDate();

    return {
      dateKey: snapshotDoc.id || toDateKey(date),
      dateIso: date.toISOString(),
      totalMinutes: data.totalMinutes,
      applications: sanitizeApplications(data.applications ?? []),
    };
  });
}
