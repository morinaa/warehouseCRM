import { describe, it, expect, vi } from 'vitest';

// Helper to get a fresh in-memory mock API per test run
const loadApi = async () => {
  vi.resetModules();
  const mod = await import('../api/mockApi');
  return mod.api;
};

describe('Audit logs', () => {
  it('paginates 20 items per page with cursor', async () => {
    const api = await loadApi();

    // Generate >20 audit events via lightweight order status adds
    for (let i = 0; i < 25; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await api.addOrderStatus('u-super', `Status-${i}`);
    }

    const page1 = await api.listAuditLogs({ cursor: { index: 0 }, role: 'superadmin' });
    expect(page1.items).toHaveLength(20);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await api.listAuditLogs({ cursor: page1.nextCursor, role: 'superadmin' });
    expect(page2.items.length).toBeGreaterThan(0);
    expect(page2.items.length).toBe(5); // 25 generated - first 20 = 5 remaining
    expect(page2.nextCursor).toBeNull();
  });

  it('blocks exports over 1 year range', async () => {
    const api = await loadApi();
    const from = '2024-01-01';
    const to = '2026-01-02';

    await expect(
      api.exportAuditLogs('u-super', {
        from,
        to,
      }),
    ).rejects.toThrow(/cannot exceed 1 year/i);
  });

  it('scopes buyer admin to their company even without stored user', async () => {
    const api = await loadApi();

    const targetBuyer = 'buyer-scope-test';
    // generate a buyer-scoped audit log via admin user creation
    await api.adminCreateUser('u-super', {
      name: 'Scoped Buyer',
      email: 'scoped@buyer.com',
      role: 'buyer',
      buyerId: targetBuyer,
    });

    const buyerView = await api.listAuditLogs({
      role: 'buyer_admin',
      buyerId: targetBuyer,
      cursor: { index: 0 },
    });

    expect(buyerView.items.some((log) => log.buyerId === targetBuyer)).toBe(true);
    expect(
      buyerView.items.every((log) => log.buyerId === targetBuyer),
    ).toBe(true);
  });
});
