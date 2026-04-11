import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import App from './App';

describe('App component', () => {
  test('renders setup screen when firebase env is missing', () => {
    render(<App />);
    expect(screen.getByText(/Firebase configuration is missing/)).toBeInTheDocument();
  });
});
