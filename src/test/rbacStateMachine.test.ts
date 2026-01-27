import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '../api/mockApi';

const superCreds = { email: 'super@signalwholesale.com', password: 'demo123' };
const buyerAdminCreds = { email: 'buyer.admin@signalwholesale.com', password: 'demo123' };
const buyerUserCreds = { email: 'buyer@signalwholesale.com', password: 'demo123' };
const supplierManagerCreds = { email: 'supplier.manager@supplier.com', password: 'demo123' };

let buyerAccountId: string;
let supplierId: string;
let buyerUserId: string;

describe('RBAC and order state machine enforcement', () => {
  beforeEach(async () => {
    api.__reset();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    const superUser = await api.login(superCreds);
    const supplier = await api.createSupplier(superUser.id, {
      name: 'Sparkle Supply',
      region: 'NA',
      website: 'https://sparkle.example.com',
      categories: ['General'],
      tags: [],
    });
    supplierId = supplier.id;

    const buyerAccount = await api.createAccount(
      {
        name: 'QuickStop Convenience',
        channel: 'Convenience',
        region: 'NE',
        website: 'https://quickstop.example.com',
        tags: ['reorder'],
        creditLimit: 15000,
        creditUsed: 0,
        priceTierId: 'tier-standard',
        paymentTerms: 'Net 15',
      },
      superUser.id,
    );
    buyerAccountId = buyerAccount.id;

    await api.adminCreateUser(superUser.id, {
      name: 'Buyer Admin',
      email: buyerAdminCreds.email,
      role: 'buyer_admin',
      companyId: buyerAccountId,
      password: buyerAdminCreds.password,
    });
    const buyerUser = await api.adminCreateUser(superUser.id, {
      name: 'Buyer User',
      email: buyerUserCreds.email,
      role: 'buyer',
      companyId: buyerAccountId,
      password: buyerUserCreds.password,
    });
    buyerUserId = buyerUser.id;

    await api.adminCreateUser(superUser.id, {
      name: 'Supplier Manager',
      email: supplierManagerCreds.email,
      role: 'supplier_manager',
      supplierId,
      password: supplierManagerCreds.password,
    });
  });

  it('allows only super admin to create supplier or buyer companies', async () => {
    const buyerAdmin = await api.login(buyerAdminCreds);

    await expect(
      api.createSupplier(buyerAdmin.id, { name: 'Not Allowed', categories: ['X'], region: 'Test', tags: [] }),
    ).rejects.toThrow(/superadmin/i);

    await expect(
      api.createAccount(
        {
          name: 'Buyer Co',
          channel: 'Grocery',
          region: 'NE',
          website: 'https://example.com',
          tags: [],
          creditLimit: 10000,
          creditUsed: 0,
          priceTierId: 'tier-standard',
          paymentTerms: 'Net 30',
        },
        buyerAdmin.id,
      ),
    ).rejects.toThrow(/superadmin/i);

    const superUser = await api.login(superCreds);
    const supplier = await api.createSupplier(superUser.id, {
      name: 'Compliant Supplier',
      region: 'West',
      website: 'https://supplier.example.com',
      categories: ['Beverages'],
      tags: ['approved'],
    });
    expect(supplier.name).toBe('Compliant Supplier');

    const account = await api.createAccount(
      {
        name: 'Compliant Buyer',
        channel: 'Convenience',
        region: 'NE',
        website: 'https://buyer.example.com',
        tags: ['new'],
        creditLimit: 5000,
        creditUsed: 0,
        priceTierId: 'tier-standard',
        paymentTerms: 'Net 15',
      },
      superUser.id,
    );
    expect(account.name).toBe('Compliant Buyer');
  });

  it('keeps supplier user creation scoped to company admins only', async () => {
    const superUser = await api.login(superCreds);
    const supplierAdmin = await api.adminCreateUser(superUser.id, {
      name: 'Supplier Admin',
      email: 'supplier.admin@test.com',
      role: 'supplier_admin',
      supplierId,
      password: 'demo123',
    });

    const manager = await api.adminCreateUser(supplierAdmin.id, {
      name: 'Manager',
      email: 'manager@test.com',
      role: 'supplier_manager',
      supplierId: 'sup-prosnack', // should be forced to admin scope
      password: 'demo123',
    });
    expect(manager.role).toBe('supplier_manager');
    expect(manager.supplierId).toBe(supplierAdmin.supplierId);

    const regular = await api.adminCreateUser(supplierAdmin.id, {
      name: 'Worker',
      email: 'worker@test.com',
      role: 'supplier',
      supplierId,
      password: 'demo123',
    });
    expect(regular.role).toBe('supplier');

    await expect(
      api.adminCreateUser(manager.id, {
        name: 'Not allowed',
        email: 'blocked@test.com',
        role: 'supplier',
        supplierId,
        password: 'demo123',
      }),
    ).rejects.toThrow(/superadmin or company admins/i);

    await expect(
      api.adminCreateUser(regular.id, {
        name: 'Also blocked',
        email: 'blocked2@test.com',
        role: 'supplier',
        supplierId,
        password: 'demo123',
      }),
    ).rejects.toThrow(/superadmin or company admins/i);
  });

  it('restricts catalog creation to supplier admins/managers', async () => {
    const superUser = await api.login(superCreds);
    const supplierManager = await api.adminCreateUser(superUser.id, {
      name: 'Catalog Manager',
      email: 'catalog.manager@test.com',
      role: 'supplier_manager',
      supplierId,
      password: 'demo123',
    });
    await api.login({ email: supplierManager.email, password: 'demo123' });
    const product = await api.createProduct({
      supplierId,
      name: 'RBAC Drink',
      sku: 'RBAC-DRINK',
      basePrice: 10,
      currency: 'USD',
      active: true,
      stock: { stockLevel: 10, minThreshold: 2 },
      tierPrices: [],
    });
    expect(product.name).toBe('RBAC Drink');

    const supplierUser = await api.adminCreateUser(superUser.id, {
      name: 'Supplier User',
      email: 'supplier.user@test.com',
      role: 'supplier',
      supplierId,
      password: 'demo123',
    });
    await api.login({ email: supplierUser.email, password: 'demo123' });
    await expect(
      api.createProduct({
        supplierId,
        name: 'Blocked Product',
        sku: 'RBAC-BLOCK',
        basePrice: 5,
        currency: 'USD',
        active: true,
        stock: { stockLevel: 1, minThreshold: 1 },
        tierPrices: [],
      }),
    ).rejects.toThrow(/only supplier admins or managers/i);

    await api.login(buyerAdminCreds);
    await expect(
      api.createProduct({
        supplierId,
        name: 'Buyer Product',
        sku: 'RBAC-BUYER',
        basePrice: 5,
        currency: 'USD',
        active: true,
        stock: { stockLevel: 1, minThreshold: 1 },
        tierPrices: [],
      }),
    ).rejects.toThrow(/buyers cannot create products/i);
  });

  it('enforces buyer approval and supplier acceptance on orders', async () => {
    const superUser = await api.login(superCreds);
    const supplier = await api.createSupplier(superUser.id, {
      name: 'Live Supplier',
      region: 'NA',
      website: 'https://supplier.example.com',
      categories: ['General'],
      tags: [],
    });
    const supplierManager = await api.adminCreateUser(superUser.id, {
      name: 'Supplier Manager',
      email: 'supplier.manager+live@test.com',
      role: 'supplier_manager',
      supplierId: supplier.id,
      password: 'demo123',
    });

    await api.login(buyerUserCreds);
    const order = await api.createOrder({
      orderNumber: 'ORD-RBAC',
      accountId: buyerAccountId,
      supplierId: supplier.id,
      status: 'pending',
      orderValue: 100,
      items: [{ productId: 'pr-1', quantity: 1, unitPrice: 100, lineTotal: 100 }],
      createdBy: buyerUserId,
    });
    expect(order.status).toBe('pending_buyer_approval');
    expect(order.approvalStatus).toBe('pending');

    // Supplier cannot advance without approval
    await api.login({ email: supplierManager.email, password: 'demo123' });
    await expect(api.moveOrder(order.id, 'confirmed')).rejects.toThrow(/sent to supplier/i);

    // Buyer admin creates a manager who can approve
    const buyerAdmin = await api.login(buyerAdminCreds);
    const buyerManager = await api.adminCreateUser(buyerAdmin.id, {
      name: 'Buyer Manager',
      email: 'buyer.manager@test.com',
      role: 'buyer_manager',
      companyId: buyerAccountId,
      password: 'demo123',
    });
    await api.login({ email: buyerManager.email, password: 'demo123' });
    const approved = await api.updateOrder(order.id, {
      approvalStatus: 'accepted',
      approvedBy: buyerManager.id,
    });
    expect(approved.approvalStatus).toBe('accepted');
    expect(approved.status).toBe('sent_to_supplier');

    // Supplier can now move forward after approval
    await api.login({ email: supplierManager.email, password: 'demo123' });
    const confirmed = await api.moveOrder(order.id, 'confirmed');
    expect(confirmed.status).toBe('accepted_by_supplier');
    const shipped = await api.moveOrder(order.id, 'shipped');
    expect(shipped.status).toBe('shipped');

    await expect(api.moveOrder(order.id, 'pending')).rejects.toThrow(/cannot move backwards/i);
  });

  it('auto-approves orders created by buyer admins/managers but still requires supplier confirmation', async () => {
    const superUser = await api.login(superCreds);
    const supplier = await api.createSupplier(superUser.id, {
      name: 'Auto Supplier',
      region: 'NA',
      website: 'https://supplier.example.com',
      categories: ['General'],
      tags: [],
    });
    const supplierManager = await api.adminCreateUser(superUser.id, {
      name: 'Auto Supplier Manager',
      email: 'auto.manager@supplier.com',
      role: 'supplier_manager',
      supplierId: supplier.id,
      password: 'demo123',
    });

    const buyerAdmin = await api.login(buyerAdminCreds);
    const adminOrder = await api.createOrder({
      orderNumber: 'ORD-AUTO',
      accountId: buyerAccountId,
      supplierId: supplier.id,
      status: 'pending',
      orderValue: 75,
      items: [{ productId: 'pr-1', quantity: 1, unitPrice: 75, lineTotal: 75 }],
      createdBy: buyerAdmin.id,
    });

    expect(adminOrder.approvalStatus).toBe('accepted');
    expect(adminOrder.status).toBe('sent_to_supplier'); // supplier still confirms
    await api.login({ email: supplierManager.email, password: 'demo123' });
    const accepted = await api.moveOrder(adminOrder.id, 'confirmed');
    expect(accepted.status).toBe('accepted_by_supplier');
  });

  it('blocks buyer self-approval or status escalation', async () => {
    await api.login(buyerUserCreds);
    const order = await api.createOrder({
      orderNumber: 'ORD-SELF',
      accountId: buyerAccountId,
      supplierId,
      status: 'pending',
      orderValue: 50,
      items: [{ productId: 'pr-1', quantity: 1, unitPrice: 50, lineTotal: 50 }],
      createdBy: buyerUserId,
    });

    await expect(
      api.updateOrder(order.id, { approvalStatus: 'accepted', approvedBy: 'u-buyer', status: 'confirmed' }),
    ).rejects.toThrow(/approve or reject/i);

    await expect(api.moveOrder(order.id, 'confirmed')).rejects.toThrow(/cannot move order status/i);
  });
});
