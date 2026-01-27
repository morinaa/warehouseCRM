import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { screen } from '@testing-library/react';
import OrdersPage from '../pages/DealsPage';
import { renderWithProviders } from './utils';
import { api } from '../api/mockApi';
import { useAuth } from '../providers/AuthProvider';

vi.mock('../providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.spyOn(api, 'listOrders').mockResolvedValue([
      {
        id: 'o1',
        orderNumber: 'ORD-1',
        accountId: 'a1',
        orderValue: 100,
        status: 'pending',
        items: [],
        createdAt: '2026-01-01',
        approvalStatus: 'pending',
        createdBy: 'u-admin',
      },
    ]);
    vi.spyOn(api, 'listOrderStatuses').mockResolvedValue([
      { id: 'pending', name: 'Pending', order: 1 },
      { id: 'confirmed', name: 'Confirmed', order: 2 },
    ]);
    vi.spyOn(api, 'listRetailers').mockResolvedValue([]);
    vi.spyOn(api, 'listAccounts').mockResolvedValue([]);
    vi.spyOn(api, 'listUsers').mockResolvedValue([
      { id: 'u-admin', name: 'Admin', email: '', role: 'admin' },
      { id: 'u-supplier', name: 'Supplier', email: '', role: 'supplier' },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows total order value but no inline create for admin', async () => {
    (useAuth as unknown as Mock).mockReturnValue({ user: { id: 'u-admin', role: 'admin' } });
    renderWithProviders(<OrdersPage />);

    const totalBadge = await screen.findByText(/Total \$100/i);
    expect(totalBadge.textContent).toContain('100');
    expect(screen.queryByRole('button', { name: /Create order/i })).not.toBeInTheDocument();
  });

  it('hides new order action for supplier role', async () => {
    (useAuth as unknown as Mock).mockReturnValue({ user: { id: 'u-supplier', role: 'supplier' } });
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByText(/Orders are created by your admin\/manager/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create order/i })).not.toBeInTheDocument();
  });
});
