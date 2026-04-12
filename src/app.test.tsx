import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import App from './App';

describe('App component', () => {
  test('renders initial app shell state', () => {
    render(<App />);

    const setupHeading = screen.queryByText(/Project configuration is missing/);
    const initializingHeading = screen.queryByText(/Initializing your dashboard/);

    expect(setupHeading || initializingHeading).toBeTruthy();
  });
});
