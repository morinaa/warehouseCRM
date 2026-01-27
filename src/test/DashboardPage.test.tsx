import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import DashboardPage from '../pages/DashboardPage';
import { renderWithProviders } from './utils';
import { api } from '../api/mockApi';
import React from 'react';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div data-testid="bar" />,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe('DashboardPage wholesale widgets', () => {
  beforeEach(() => {
    vi.spyOn(api, 'listRetailers').mockResolvedValue([]);
    vi.spyOn(api, 'listActivities').mockResolvedValue([]);
    vi.spyOn(api, 'listOrders').mockResolvedValue([
      {
        id: 'o1',
        orderNumber: 'ORD-1',
        accountId: 'a1',
        orderValue: 1200,
        status: 'pending',
        items: [],
        createdAt: '2026-01-20',
        approvalStatus: 'pending',
        createdBy: 'u-admin',
      },
    ]);
    vi.spyOn(api, 'listOrderStatuses').mockResolvedValue([
      { id: 'pending', name: 'Pending', order: 1 },
      { id: 'confirmed', name: 'Confirmed', order: 2 },
    ]);
    vi.spyOn(api, 'listAccounts').mockResolvedValue([
      {
        id: 'a1',
        name: 'Dormant Outlet',
        channel: 'Convenience',
        region: 'West',
        tags: [],
        ownerId: 'u-admin',
        health: 'watch',
        createdAt: '2025-12-01',
        creditLimit: 10000,
        creditUsed: 2000,
        priceTierId: 'tier-standard',
        paymentTerms: 'Net 15',
        lastOrderDate: '2024-12-01',
      },
      {
        id: 'a2',
        name: 'Active Mart',
        channel: 'Grocery',
        region: 'East',
        tags: [],
        ownerId: 'u-admin',
        health: 'healthy',
        createdAt: '2026-01-20',
        creditLimit: 20000,
        creditUsed: 4000,
        priceTierId: 'tier-standard',
        paymentTerms: 'Net 30',
        lastOrderDate: '2026-01-25',
      },
    ]);
    vi.spyOn(api, 'listProducts').mockResolvedValue([
      {
        id: 'p-low',
        supplierId: 'sup-1',
        name: 'Low Stock Item',
        sku: 'LS-1',
        basePrice: 10,
        currency: 'USD',
        description: '',
        active: true,
        category: 'Snacks',
        stock: { stockLevel: 5, minThreshold: 10 },
        tierPrices: [],
      },
      {
        id: 'p-ok',
        supplierId: 'sup-1',
        name: 'Healthy Stock',
        sku: 'HS-1',
        basePrice: 10,
        currency: 'USD',
        description: '',
        active: true,
        category: 'Snacks',
        stock: { stockLevel: 50, minThreshold: 10 },
        tierPrices: [],
      },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it(
    'shows reorder alerts and low stock watchlist correctly',
    async () => {
      renderWithProviders(<DashboardPage />);

      expect(await screen.findByText(/Re-order alerts/i)).toBeInTheDocument();
      expect(await screen.findByText('Dormant Outlet')).toBeInTheDocument();
      expect(screen.queryByText('Active Mart')).not.toBeInTheDocument();

      expect(screen.getByText(/Low stock watchlist/i)).toBeInTheDocument();
      expect(await screen.findByText('Low Stock Item')).toBeInTheDocument();
      expect(screen.queryByText('Healthy Stock')).not.toBeInTheDocument();

      expect(screen.getByText(/Orders by status/i)).toBeInTheDocument();
    },
    10000,
  );
});
