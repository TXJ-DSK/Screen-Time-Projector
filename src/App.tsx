import './App.css';

import type { User } from 'firebase/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';

import AuthPanel from './components/AuthPanel';
import ProjectionDashboard from './components/ProjectionDashboard';
import UploadPanel from './components/UploadPanel';
import {
  signInWithEmail,
  signInWithGoogle,
  signOutCurrentUser,
  signUpWithEmail,
  subscribeToAuthState,
} from './services/authService';
import { firebaseRuntime } from './services/firebase';
import {
  ensureUserDocument,
  fetchLogsForDateWindow,
  saveDailyLog,
} from './services/screenTimeService';
import { extractScreenTimeFromImage, geminiRuntime } from './services/visionService';
import type { DailyLogEntry, ExtractedScreenTimeData } from './types/domain';
import { addDays } from './utils/date';
import { calculateWeeklyProjection } from './utils/projection';

const LOOKBACK_DAYS = 21;

function isFirebaseLikeError(
  error: unknown,
): error is { code: string; message?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

function toErrorMessage(error: unknown): string {
  if (isFirebaseLikeError(error)) {
    switch (error.code) {
      case 'auth/configuration-not-found':
        return 'Firebase Authentication is not fully configured for this project. In Firebase Console, open Authentication, click Get started, and enable Email/Password (and Google if needed).';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is disabled in Firebase Console. Enable it in Authentication > Sign-in method.';
      default:
        break;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logFetchError, setLogFetchError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const projectionSummary = useMemo(
    () => calculateWeeklyProjection(logs, LOOKBACK_DAYS, new Date()),
    [logs],
  );

  const loadRecentLogs = useCallback(async (activeUser: User): Promise<void> => {
    try {
      setIsLoadingLogs(true);
      setLogFetchError(null);

      const startDate = addDays(new Date(), -(LOOKBACK_DAYS - 1));
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const fetchedLogs = await fetchLogsForDateWindow(
        activeUser.uid,
        startDate,
        endDate,
      );
      setLogs(fetchedLogs);
    } catch (error) {
      setLogFetchError(toErrorMessage(error));
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setAuthError(null);
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setLogs([]);
      setLogFetchError(null);
      return;
    }

    const activeUser = user;

    async function bootstrapUserData(): Promise<void> {
      try {
        await ensureUserDocument(activeUser.uid, activeUser.email);
      } catch (error) {
        setLogFetchError(toErrorMessage(error));
        return;
      }

      await loadRecentLogs(activeUser);
    }

    bootstrapUserData().catch((error: unknown) => {
      setLogFetchError(toErrorMessage(error));
    });
  }, [loadRecentLogs, user]);

  async function runAuthAction(action: () => Promise<void>): Promise<void> {
    try {
      setIsAuthBusy(true);
      setAuthError(null);
      await action();
    } catch (error) {
      setAuthError(toErrorMessage(error));
    } finally {
      setIsAuthBusy(false);
    }
  }

  async function handleSaveExtractedData(
    extractedData: ExtractedScreenTimeData,
  ): Promise<void> {
    if (!user) {
      setSaveError('Sign in before saving logs.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      await saveDailyLog(user.uid, extractedData);
      await loadRecentLogs(user);
    } catch (error) {
      setSaveError(toErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  const missingSetupKeys = [...firebaseRuntime.missingKeys, ...geminiRuntime.missingKeys];

  if (missingSetupKeys.length > 0) {
    return (
      <main className="setup-shell">
        <section className="setup-card">
          <p className="eyebrow">Setup Required</p>
          <h1>Project configuration is missing.</h1>
          <p>
            Add the following environment variables in your local .env file before using
            authentication, Firestore storage, and Gemini extraction.
          </p>
          <ul>
            {missingSetupKeys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  if (!isAuthReady) {
    return (
      <main className="setup-shell">
        <section className="setup-card">
          <p className="eyebrow">Screen Time Projector</p>
          <h1>Initializing your dashboard...</h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthPanel
        isBusy={isAuthBusy}
        errorMessage={authError}
        onSignIn={(email, password) =>
          runAuthAction(() => signInWithEmail(email, password))
        }
        onSignUp={(email, password) =>
          runAuthAction(() => signUpWithEmail(email, password))
        }
        onGoogleSignIn={() => runAuthAction(() => signInWithGoogle())}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Screen Time Projector</p>
        <h1>Track daily usage. Forecast your week.</h1>
      </header>

      <section className="app-grid">
        <UploadPanel
          isSaving={isSaving}
          saveError={saveError}
          onExtract={extractScreenTimeFromImage}
          onSave={handleSaveExtractedData}
        />

        <ProjectionDashboard
          userEmail={user.email ?? 'unknown user'}
          loading={isLoadingLogs}
          fetchError={logFetchError}
          logs={logs}
          summary={projectionSummary}
          onRefresh={() => loadRecentLogs(user)}
          onSignOut={() => signOutCurrentUser()}
        />
      </section>
    </main>
  );
}

export default App;
