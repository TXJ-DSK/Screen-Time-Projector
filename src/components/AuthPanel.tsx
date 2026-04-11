import { useState } from 'react';

interface AuthPanelProps {
  isBusy: boolean;
  errorMessage: string | null;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
}

export default function AuthPanel({
  isBusy,
  errorMessage,
  onSignIn,
  onSignUp,
  onGoogleSignIn,
}: AuthPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const actionLabel = isSignUpMode ? 'Create account' : 'Sign in';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (isSignUpMode) {
      await onSignUp(email, password);
      return;
    }

    await onSignIn(email, password);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-live="polite">
        <p className="eyebrow">Screen Time Projector</p>
        <h1>Project your weekly digital habits.</h1>
        <p className="muted">
          Upload your daily screenshot, extract category usage, and compare your
          week-to-date minutes against an end-of-week projection.
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label htmlFor="email">Email</label>
          <input
            autoComplete="email"
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isBusy}
          />

          <label htmlFor="password">Password</label>
          <input
            autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
            id="password"
            name="password"
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isBusy}
          />

          <button type="submit" className="primary-btn" disabled={isBusy}>
            {isBusy ? 'Working...' : actionLabel}
          </button>
        </form>

        <button
          type="button"
          className="ghost-btn"
          onClick={onGoogleSignIn}
          disabled={isBusy}
        >
          Continue with Google
        </button>

        <button
          type="button"
          className="switch-btn"
          onClick={() => setIsSignUpMode((value) => !value)}
          disabled={isBusy}
        >
          {isSignUpMode ? 'Have an account? Sign in' : 'Need an account? Sign up'}
        </button>

        {errorMessage && <p className="error-text">{errorMessage}</p>}
      </section>
    </main>
  );
}
