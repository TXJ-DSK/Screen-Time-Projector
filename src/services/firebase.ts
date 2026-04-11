import { type FirebaseApp, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';

interface FirebaseRuntime {
  configured: boolean;
  missingKeys: string[];
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys: Array<keyof typeof firebaseConfig> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

export const firebaseRuntime: FirebaseRuntime = {
  configured: missingKeys.length === 0,
  missingKeys: missingKeys.map((key) => `VITE_FIREBASE_${key.toUpperCase()}`),
};

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;

function initializeFirebaseIfNeeded(): void {
  if (!firebaseRuntime.configured) {
    throw new Error(
      'Firebase is not configured. Add missing VITE_FIREBASE_* values in your .env file.',
    );
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firestoreDb = getFirestore(firebaseApp);
  }
}

export function getFirebaseAuth(): Auth {
  initializeFirebaseIfNeeded();

  if (!firebaseAuth) {
    throw new Error('Failed to initialize Firebase Auth.');
  }

  return firebaseAuth;
}

export function getFirestoreDb(): Firestore {
  initializeFirebaseIfNeeded();

  if (!firestoreDb) {
    throw new Error('Failed to initialize Firestore.');
  }

  return firestoreDb;
}
