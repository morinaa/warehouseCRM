import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import AuthPage from '../pages/AuthPage';
import { renderWithProviders } from './utils';
import { AuthProvider } from '../providers/AuthProvider';
import { api } from '../api/mockApi';

describe('AuthPage validation', () => {
  beforeEach(() => {
    vi.spyOn(api, 'getCurrentUser').mockResolvedValue(null);
  });

  it('shows validation errors on empty login submit', async () => {
    renderWithProviders(
      <AuthProvider>
        <AuthPage mode="login" />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });
});
