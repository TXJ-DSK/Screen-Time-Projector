import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';

import { firebaseRuntime, getFirebaseAuth } from './firebase';

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!firebaseRuntime.configured) {
    callback(null);
    return () => undefined;
  }

  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle(): Promise<void> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function signOutCurrentUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}
