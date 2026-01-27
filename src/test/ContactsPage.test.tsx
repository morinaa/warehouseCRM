import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import ContactsPage from '../pages/ContactsPage';
import { renderWithProviders } from './utils';
import { api } from '../api/mockApi';

describe('ContactsPage validation', () => {
  beforeEach(() => {
    vi.spyOn(api, 'listRetailers').mockResolvedValue([]);
    vi.spyOn(api, 'listAccounts').mockResolvedValue([]);
  });

  it('prevents save when required fields are missing', async () => {
    renderWithProviders(<ContactsPage />);

    fireEvent.click(screen.getByRole('button', { name: /new retailer/i }));
    await waitFor(() => screen.getByText(/Full name/i));

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    expect(await screen.findByText(/Name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
  });
});
