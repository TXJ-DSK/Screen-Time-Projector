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
  DailyLogEntry,
  ExtractedScreenTimeData,
  ScreenTimeCategory,
} from '../types/domain';
import { toDateKey } from '../utils/date';
import { sanitizeCategories, sumCategoryMinutes } from '../utils/parsing';
import { getFirestoreDb } from './firebase';

interface FirestoreDailyLog {
  date: Timestamp;
  totalMinutes: number;
  categories: ScreenTimeCategory[];
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

export async function saveDailyLog(
  uid: string,
  extractedData: ExtractedScreenTimeData,
): Promise<void> {
  const db = getFirestoreDb();
  const categories = sanitizeCategories(extractedData.categories);
  const totalMinutes = extractedData.totalMinutes || sumCategoryMinutes(categories);

  await setDoc(
    doc(db, 'users', uid, 'daily_logs', extractedData.dateKey),
    {
      date: Timestamp.fromDate(new Date(`${extractedData.dateKey}T00:00:00`)),
      totalMinutes,
      categories,
    },
    { merge: true },
  );
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
      categories: sanitizeCategories(data.categories ?? []),
    };
  });
}
