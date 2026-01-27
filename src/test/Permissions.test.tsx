import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { screen } from '@testing-library/react';
import Sidebar from '../components/Sidebar';
import ProductsPage from '../pages/ProductsPage';
import OrdersPage from '../pages/DealsPage';
import { renderWithProviders } from './utils';
import { api } from '../api/mockApi';
import { useAuth } from '../providers/AuthProvider';

vi.mock('../providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

describe('UI permission gating', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows Super Admin navigation for superadmins', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      user: { id: 'u-super', name: 'Super', email: 'super@signalwholesale.com', role: 'superadmin' },
    });
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole('link', { name: /Super Admin/i, hidden: true })).toBeInTheDocument();
  });

  it('hides Super Admin navigation for buyers', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      user: { id: 'u-buyer', name: 'Buyer', email: 'buyer@signalwholesale.com', role: 'buyer' },
    });
    renderWithProviders(<Sidebar />);
    expect(screen.queryByRole('button', { name: /Super Admin/i })).not.toBeInTheDocument();
  });

  describe('ProductsPage catalog controls', () => {
    beforeEach(() => {
      vi.spyOn(api, 'listProducts').mockResolvedValue([]);
      vi.spyOn(api, 'listSuppliers').mockResolvedValue([
        { id: 'sup-sparkle', name: 'Sparkle', categories: ['Beverages'], tags: [] },
      ]);
    });

    it('hides add product for supplier regular user', async () => {
      (useAuth as unknown as Mock).mockReturnValue({
        user: { id: 'sup-user', name: 'Supplier User', role: 'supplier', supplierId: 'sup-sparkle' },
      });

    renderWithProviders(<ProductsPage />);
      expect(await screen.findByRole('heading', { name: /Products/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Add product/i })).not.toBeInTheDocument();
    });

    it('shows add product for supplier manager', async () => {
      (useAuth as unknown as Mock).mockReturnValue({
        user: { id: 'sup-manager', name: 'Supplier Manager', role: 'supplier_manager', supplierId: 'sup-sparkle' },
      });

      renderWithProviders(<ProductsPage />);
      expect(await screen.findByRole('button', { name: /Add product/i })).toBeInTheDocument();
    });
  });

  describe('OrdersPage approvals', () => {
    beforeEach(() => {
      vi.spyOn(api, 'listOrders').mockResolvedValue([
        {
          id: 'o1',
          orderNumber: 'ORD-1',
          accountId: 'a1',
          supplierId: 'sup-sparkle',
          orderValue: 100,
          status: 'pending',
          items: [],
          createdAt: '2026-01-01',
          approvalStatus: 'pending',
          createdBy: 'u-buyer',
        },
      ]);
      vi.spyOn(api, 'listOrderStatuses').mockResolvedValue([
        { id: 'pending', name: 'Pending', order: 1 },
        { id: 'confirmed', name: 'Confirmed', order: 2 },
      ]);
      vi.spyOn(api, 'listRetailers').mockResolvedValue([]);
      vi.spyOn(api, 'listAccounts').mockResolvedValue([]);
      vi.spyOn(api, 'listUsers').mockResolvedValue([
        { id: 'u-buyer', name: 'Buyer', email: '', role: 'buyer' },
        { id: 'u-supplier', name: 'Supplier', email: '', role: 'supplier', supplierId: 'sup-sparkle' },
      ]);
      vi.spyOn(api, 'listSuppliers').mockResolvedValue([{ id: 'sup-sparkle', name: 'Sparkle', categories: [], tags: [] }]);
      vi.spyOn(api, 'listProducts').mockResolvedValue([]);
    });

    it('renders accept controls for supplier users', async () => {
      (useAuth as unknown as Mock).mockReturnValue({
        user: { id: 'u-supplier', role: 'supplier', supplierId: 'sup-sparkle' },
      });

      renderWithProviders(<OrdersPage />);
      const acceptButtons = await screen.findAllByRole('button', { name: /Accept/i });
      expect(acceptButtons.length).toBeGreaterThan(0);
    });

    it('does not render accept controls for buyer regular users', async () => {
      (useAuth as unknown as Mock).mockReturnValue({
        user: { id: 'u-buyer', role: 'buyer', companyId: 'ac-quickstop' },
      });

      renderWithProviders(<OrdersPage />);
      expect(await screen.findByText(/Orders are created by your admin\/manager/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Accept/i })).not.toBeInTheDocument();
    });
  });
});
