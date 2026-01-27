import { v4 as uuid } from 'uuid';
import { seedData } from '../data/mockData';
import type {
  Account,
  Activity,
  AuditLog,
  CalendarEvent,
  CRMData,
  Invoice,
  Order,
  OrderStatusId,
  Product,
  Quote,
  Retailer,
  Supplier,
  User,
} from '../types';

const STORAGE_KEY = 'wholesale-crm-mock-v6';
const USER_KEY = 'wholesale-crm-current-user';
const PAGE_SIZE = 20;
const AUDIT_LIMIT_PER_EXPORT_DAYS = 365;

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));
const canUseStorage = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const migrateData = (data: CRMData): CRMData => {
  const dbCopy = clone(data);
  const ensureUser = (
    email: string,
    name: string,
    role: User['role'],
    supplierId?: string,
    companyId?: string,
  ) => {
    const existing = dbCopy.users.find((u) => u.email === email);
    if (!existing) {
      dbCopy.users.push({
        id: uuid(),
        name,
        email,
        role,
        supplierId,
        companyId,
        password: 'demo123',
      });
    }
  };
  ensureUser('super@signalwholesale.com', 'Super Admin', 'superadmin');
  ensureUser('buyer@signalwholesale.com', 'Buyer Admin', 'buyer_admin', undefined, 'ac-quickstop');
  ensureUser('buyermgr@signalwholesale.com', 'Buyer Manager', 'buyer_manager', undefined, 'ac-quickstop');
  ensureUser('buyer2@signalwholesale.com', 'Metro Buyer Admin', 'buyer_admin', undefined, 'ac-metromarket');
  ensureUser('sparkle@supplier.com', 'Sparkle Admin', 'supplier_admin', 'sup-sparkle');
  ensureUser('prosnack@supplier.com', 'ProSnack Admin', 'supplier_admin', 'sup-prosnack');
  ensureUser('freshfarm@supplier.com', 'FreshFarm Admin', 'supplier_admin', 'sup-freshfarm');
  ensureUser('sparkle.manager@supplier.com', 'Sparkle Manager', 'supplier_manager', 'sup-sparkle');

  const seedSuppliers = (seedData.suppliers ?? []).slice(0, 3);
  dbCopy.suppliers = clone(seedSuppliers);

  const normalizeStatus = (status: string): OrderStatusId => {
    switch (status) {
      case 'pending':
      case 'confirmed':
      case 'shipped':
      case 'completed':
        return status as OrderStatusId;
      case 'packing':
        return 'confirmed';
      case 'submitted':
        return 'pending';
      case 'invoiced':
        return 'completed';
      default:
        return 'pending';
    }
  };

  dbCopy.orderStatuses = [
    { id: 'pending', name: 'Pending', order: 1 },
    { id: 'confirmed', name: 'Confirmed', order: 2 },
    { id: 'shipped', name: 'Shipped', order: 3 },
    { id: 'completed', name: 'Completed', order: 4 },
  ];

  const productSupplierLookup = seedData.products.reduce<Record<string, string>>((acc, p) => {
    acc[p.id] = p.supplierId ?? seedSuppliers[0]?.id ?? 'sup-default';
    return acc;
  }, {});

  dbCopy.products = dbCopy.products
    .map((product, idx) => {
      const seedMatch = seedData.products.find((p) => p.id === product.id);
      return {
        ...product,
        supplierId:
          product.supplierId ??
          seedMatch?.supplierId ??
          seedSuppliers[idx % seedSuppliers.length]?.id,
      };
    })
    .filter((p) => seedSuppliers.some((s) => s.id === p.supplierId));

  dbCopy.orders = dbCopy.orders
    .map((order) => ({
      ...order,
      status: normalizeStatus(order.status as string),
      approvalStatus: order.approvalStatus ?? 'pending',
      createdBy: order.createdBy ?? dbCopy.users[0]?.id ?? 'system',
      approvedBy:
        order.approvalStatus === 'accepted'
          ? order.approvedBy ?? 'u-supplier'
          : order.approvedBy,
      supplierId:
        order.supplierId ??
        productSupplierLookup[order.items?.[0]?.productId] ??
        seedSuppliers[0]?.id,
      items: (order.items ?? []).filter(
        (line) => dbCopy.products.find((p) => p.id === line.productId) !== undefined,
      ),
    }))
    .filter((order) => seedSuppliers.some((s) => s.id === order.supplierId));

  dbCopy.auditLogs = dbCopy.auditLogs ?? [];
  return dbCopy;
};

const loadData = (): CRMData => {
  if (!canUseStorage) {
    return migrateData(seedData);
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return migrateData(JSON.parse(raw) as CRMData);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
  return migrateData(seedData);
};

let db: CRMData = loadData();

const persist = () => {
  if (canUseStorage) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
};

const delay = async <T>(value: T, ms = 140): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(clone(value)), ms));

const findById = <T extends { id: string }>(items: T[], id: string) =>
  items.find((item) => item.id === id);

const getStoredUser = (): User | null => {
  if (!canUseStorage) return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

const getUserById = (id?: string) => (id ? db.users.find((u) => u.id === id) : undefined);
const hasSupplierScope = (user?: User) =>
  user && (user.role === 'supplier' || user.role === 'supplier_admin' || user.role === 'supplier_manager');
const hasBuyerScope = (user?: User) =>
  user && (user.role === 'buyer' || user.role === 'buyer_admin' || user.role === 'buyer_manager');

const calculateOrderValue = (items: Order['items']) =>
  items.reduce((sum, item) => sum + item.lineTotal, 0);

const logEvent = (log: Omit<AuditLog, 'id' | 'timestamp' | 'status'> & { status?: AuditLog['status'] }) => {
  const actor = log.actorId ? getUserById(log.actorId) : undefined;
  const entry: AuditLog = {
    id: uuid(),
    timestamp: new Date().toISOString(),
    status: log.status ?? 'success',
    actorName: log.actorName ?? actor?.name,
    actorRole: log.actorRole ?? actor?.role,
    ...log,
  };
  db.auditLogs.unshift(entry);
  persist();
  return entry;
};

export const api = {
  async listUsers(): Promise<User[]> {
    return delay(db.users);
  },
  async getCurrentUser(): Promise<User | null> {
    if (!canUseStorage) {
      return db.users[0] ?? null;
    }
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },

  async login(input: { email: string; password: string }): Promise<User> {
    const user = db.users.find((u) => u.email === input.email && u.password === input.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    if (canUseStorage) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return delay(user);
  },

  async logout(): Promise<boolean> {
    if (canUseStorage) {
      localStorage.removeItem(USER_KEY);
    }
    return delay(true, 80);
  },

  async adminCreateUser(
    creatorId: string,
    input: {
      name: string;
      email: string;
      role: User['role'];
      password?: string;
      supplierId?: string;
      companyId?: string;
      permissions?: User['permissions'];
    },
  ): Promise<User> {
    const creator = db.users.find((u) => u.id === creatorId);
    const isSuper = creator?.role === 'superadmin';
    const isSupplierAdmin =
      creator?.role === 'supplier_admin' || creator?.role === 'supplier_manager' || creator?.role === 'supplier';
    const isBuyerAdmin = creator?.role === 'buyer_admin' || creator?.role === 'buyer_manager' || creator?.role === 'buyer';

    if (db.users.find((u) => u.email === input.email)) {
      throw new Error('Email already registered');
    }

    // Permission gating
    if (!isSuper) {
      if (isSupplierAdmin) {
        if (!creator?.supplierId) throw new Error('Creator missing supplier scope');
        if (!['supplier', 'supplier_admin', 'supplier_manager'].includes(input.role)) {
          throw new Error('Supplier admins can only create supplier users/managers/admins');
        }
        input.supplierId = creator.supplierId;
      } else if (isBuyerAdmin) {
        if (!creator?.companyId) throw new Error('Creator missing company scope');
        if (!['buyer', 'buyer_admin', 'buyer_manager'].includes(input.role)) {
          throw new Error('Buyer admins can only create buyer users/admins/managers');
        }
        input.companyId = creator.companyId;
      } else {
        throw new Error('Only admins can create users');
      }
    }

    // Enforce scope requirements for all roles at creation time
    if (['supplier', 'supplier_admin', 'supplier_manager'].includes(input.role) && !input.supplierId) {
      throw new Error('Supplier users must be tied to a supplier');
    }
    if (['buyer', 'buyer_admin', 'buyer_manager'].includes(input.role) && !input.companyId) {
      throw new Error('Buyer users must be tied to a buyer company');
    }
    if (input.role === 'admin' && !input.supplierId && !input.companyId) {
      throw new Error('Admin must belong to a supplier or buyer company');
    }

    const user: User = {
      id: uuid(),
      name: input.name,
      email: input.email,
      role: input.role,
      supplierId: input.supplierId,
      companyId: input.companyId,
      permissions: input.permissions,
      password: input.password ?? 'demo123',
    };
    db.users.push(user);
    logEvent({
      action: 'user.created',
      summary: `User ${user.email} created`,
      actorId: creatorId,
      actorRole: creator?.role,
      companyId: user.companyId,
      supplierId: user.supplierId,
      entityType: 'user',
      entityId: user.id,
      entityName: user.name,
      source: 'ui',
    });
    persist();
    return delay(user);
  },

  async listRetailers(): Promise<Retailer[]> {
    return delay(db.retailers);
  },

  async listSuppliers(): Promise<Supplier[]> {
    return delay(db.suppliers ?? []);
  },

  async createSupplier(creatorId: string, input: Omit<Supplier, 'id'>): Promise<Supplier> {
    const creator = db.users.find((u) => u.id === creatorId);
    if (!creator || creator.role !== 'superadmin') {
      throw new Error('Only superadmin can create suppliers');
    }
    const supplier: Supplier = { ...input, id: uuid() };
    db.suppliers.push(supplier);
    logEvent({
      action: 'supplier.created',
      summary: `Supplier ${supplier.name} created`,
      actorId: creatorId,
      actorRole: creator?.role,
      entityType: 'supplier',
      entityId: supplier.id,
      entityName: supplier.name,
      source: 'ui',
    });
    persist();
    return delay(supplier);
  },

  async createRetailer(input: Omit<Retailer, 'id' | 'createdAt'>): Promise<Retailer> {
    const retailer: Retailer = {
      ...input,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    db.retailers.push(retailer);
    logEvent({
      action: 'retailer.created',
      summary: `Retailer ${retailer.name} created`,
      companyId: retailer.accountId,
      entityType: 'retailer',
      entityId: retailer.id,
      entityName: retailer.name,
      source: 'ui',
    });
    persist();
    return delay(retailer);
  },

  async updateRetailer(id: string, updates: Partial<Retailer>): Promise<Retailer> {
    const existing = findById(db.retailers, id);
    if (!existing) {
      throw new Error('Retailer not found');
    }
    Object.assign(existing, updates);
    logEvent({
      action: 'retailer.updated',
      summary: `Retailer ${existing.name} updated`,
      companyId: existing.accountId,
      entityType: 'retailer',
      entityId: existing.id,
      entityName: existing.name,
      source: 'ui',
    });
    persist();
    return delay(existing);
  },

  async listAccounts(): Promise<Account[]> {
    const viewer = getStoredUser();
    if (!viewer || viewer.role === 'superadmin') return delay(db.accounts);
    if (hasBuyerScope(viewer)) {
      return delay(db.accounts.filter((a) => a.id === viewer.companyId));
    }
    return delay(db.accounts);
  },

  async createAccount(input: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    const account: Account = {
      ...input,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    db.accounts.push(account);
    logEvent({
      action: 'account.created',
      summary: `Account ${account.name} created`,
      companyId: account.id,
      entityType: 'account',
      entityId: account.id,
      entityName: account.name,
      source: 'ui',
    });
    persist();
    return delay(account);
  },

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const existing = findById(db.accounts, id);
    if (!existing) {
      throw new Error('Account not found');
    }
    Object.assign(existing, updates);
    logEvent({
      action: 'account.updated',
      summary: `Account ${existing.name} updated`,
      companyId: existing.id,
      entityType: 'account',
      entityId: existing.id,
      entityName: existing.name,
      source: 'ui',
    });
    persist();
    return delay(existing);
  },

  async listAccountTiers() {
    return delay(db.accountTiers);
  },

  async listOrders(): Promise<Order[]> {
    const viewer = getStoredUser();
    if (!viewer || viewer.role === 'superadmin') return delay(db.orders);
    if (hasBuyerScope(viewer)) {
      return delay(db.orders.filter((o) => o.accountId === viewer.companyId));
    }
    if (hasSupplierScope(viewer) || viewer.role === 'admin') {
      return delay(db.orders.filter((o) => o.supplierId === viewer.supplierId));
    }
    return delay([]);
  },

  async createOrder(
    input: Omit<Order, 'id' | 'createdAt' | 'approvalStatus' | 'createdBy'> & {
      approvalStatus?: Order['approvalStatus'];
      createdBy?: string;
    },
  ): Promise<Order> {
    const creator = getUserById(input.createdBy) ?? getStoredUser();
    if (creator && hasBuyerScope(creator)) {
      if (!creator.companyId) throw new Error('Buyer must belong to a company to place orders');
      if (input.accountId !== creator.companyId) {
        throw new Error('Buyers can only create orders for their own company');
      }
    }
    if (creator && hasSupplierScope(creator)) {
      throw new Error('Suppliers cannot create orders');
    }
    if (creator && creator.role === 'admin') {
      if (!creator.companyId && !creator.supplierId) throw new Error('Admin must be scoped to a company or supplier');
      if (creator.companyId && input.accountId !== creator.companyId) {
        throw new Error('Scoped admin can only create orders for their company');
      }
      if (creator.supplierId && input.supplierId && input.supplierId !== creator.supplierId) {
        throw new Error('Scoped admin can only target their supplier');
      }
    }

    const order: Order = {
      ...input,
      status: (input.status as OrderStatusId | undefined) ?? 'pending',
      createdBy: input.createdBy ?? db.users[0]?.id ?? 'system',
      approvalStatus: input.approvalStatus ?? 'pending',
      supplierId: input.supplierId ?? db.suppliers?.[0]?.id,
      id: uuid(),
      createdAt: new Date().toISOString(),
      orderValue: input.orderValue ?? calculateOrderValue(input.items),
    };
    db.orders.push(order);
    logEvent({
      action: 'order.created',
      summary: `Order ${order.orderNumber} created`,
      actorId: creator?.id,
      actorRole: creator?.role,
      companyId: order.accountId,
      supplierId: order.supplierId,
      entityType: 'order',
      entityId: order.id,
      entityName: order.orderNumber,
      metadata: { status: order.status },
      source: 'ui',
    });
    persist();
    return delay(order);
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const existing = findById(db.orders, id);
    if (!existing) {
      throw new Error('Order not found');
    }
    const actor = getUserById(updates.createdBy) ?? getStoredUser();
    if (actor && hasBuyerScope(actor) && existing.accountId !== actor.companyId) {
      throw new Error('Buyers can only modify their company orders');
    }
    if (actor && hasSupplierScope(actor) && existing.supplierId !== actor.supplierId) {
      throw new Error('Suppliers can only modify their supplier orders');
    }
    if (actor && actor.role === 'admin') {
      if (actor.companyId && existing.accountId !== actor.companyId) {
        throw new Error('Scoped admin cannot modify other buyer orders');
      }
      if (actor.supplierId && existing.supplierId !== actor.supplierId) {
        throw new Error('Scoped admin cannot modify other supplier orders');
      }
    }
    Object.assign(existing, updates);
    if (updates.items) {
      existing.orderValue = calculateOrderValue(updates.items);
    }
    logEvent({
      action: 'order.updated',
      summary: `Order ${existing.orderNumber} updated`,
      actorId: actor?.id,
      actorRole: actor?.role,
      companyId: existing.accountId,
      supplierId: existing.supplierId,
      entityType: 'order',
      entityId: existing.id,
      entityName: existing.orderNumber,
      metadata: { status: existing.status },
      source: 'ui',
    });
    persist();
    return delay(existing);
  },

  async deleteOrder(id: string): Promise<boolean> {
    const existing = findById(db.orders, id);
    db.orders = db.orders.filter((o) => o.id !== id);
    logEvent({
      action: 'order.deleted',
      summary: `Order ${existing?.orderNumber ?? id} deleted`,
      companyId: existing?.accountId,
      supplierId: existing?.supplierId,
      entityType: 'order',
      entityId: existing?.id ?? id,
      entityName: existing?.orderNumber ?? id,
      source: 'ui',
    });
    persist();
    return delay(true);
  },

  async moveOrder(id: string, statusId: OrderStatusId): Promise<Order> {
    const existing = findById(db.orders, id);
    if (!existing) {
      throw new Error('Order not found');
    }
    const actor = getStoredUser();
    if (actor && hasBuyerScope(actor)) {
      throw new Error('Buyers cannot move order status');
    }
    if (actor && hasSupplierScope(actor) && existing.supplierId !== actor.supplierId) {
      throw new Error('Cannot move orders outside your supplier scope');
    }
    existing.status = statusId;
    logEvent({
      action: 'order.status_changed',
      summary: `Order ${existing.orderNumber} moved to ${statusId}`,
      actorId: actor?.id,
      actorRole: actor?.role,
      companyId: existing.accountId,
      supplierId: existing.supplierId,
      entityType: 'order',
      entityId: existing.id,
      entityName: existing.orderNumber,
      metadata: { status: statusId },
      source: 'ui',
    });
    persist();
    return delay(existing);
  },

  async duplicateOrder(id: string): Promise<Order> {
    const existing = findById(db.orders, id);
    if (!existing) {
      throw new Error('Order not found');
    }
    const copy: Order = {
      ...clone(existing),
      id: uuid(),
      orderNumber: `${existing.orderNumber}-R`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvalStatus: 'pending',
      approvedBy: undefined,
      supplierId: existing.supplierId,
    };
    copy.orderValue = calculateOrderValue(copy.items);
    db.orders.push(copy);
    logEvent({
      action: 'order.duplicated',
      summary: `Order ${existing.orderNumber} duplicated`,
      companyId: existing.accountId,
      supplierId: existing.supplierId,
      entityType: 'order',
      entityId: copy.id,
      entityName: copy.orderNumber,
      metadata: { sourceOrder: existing.id },
      source: 'ui',
    });
    persist();
    return delay(copy);
  },

  async listActivities(): Promise<Activity[]> {
    return delay(db.activities);
  },

  async createActivity(input: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const activity: Activity = {
      ...input,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    db.activities.unshift(activity);
    logEvent({
      action: 'activity.created',
      summary: `${activity.type} created: ${activity.subject}`,
      actorId: activity.ownerId,
      companyId: activity.accountId,
      entityType: 'activity',
      entityId: activity.id,
      entityName: activity.subject,
      metadata: { status: activity.status ?? 'open' },
      source: 'ui',
    });
    persist();
    return delay(activity);
  },

  async toggleActivity(id: string): Promise<Activity> {
    const existing = findById(db.activities, id);
    if (!existing) {
      throw new Error('Activity not found');
    }
    existing.status = existing.status === 'done' ? 'open' : 'done';
    logEvent({
      action: 'activity.toggled',
      summary: `Activity ${existing.subject} marked ${existing.status}`,
      actorId: existing.ownerId,
      companyId: existing.accountId,
      entityType: 'activity',
      entityId: existing.id,
      entityName: existing.subject,
      metadata: { status: existing.status },
      source: 'ui',
    });
    persist();
    return delay(existing);
  },

  async listEvents(): Promise<CalendarEvent[]> {
    return delay(db.events);
  },

  async createEvent(input: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const event: CalendarEvent = { ...input, id: uuid() };
    db.events.push(event);
    logEvent({
      action: 'event.created',
      summary: `Event ${event.title} created`,
      entityType: 'event',
      entityId: event.id,
      entityName: event.title,
      companyId: event.orderId,
      source: 'ui',
    });
    persist();
    return delay(event);
  },

  async listProducts(): Promise<Product[]> {
    const viewer = getStoredUser();
    if (!viewer || viewer.role === 'superadmin') return delay(db.products);
    if (hasSupplierScope(viewer) || viewer.role === 'admin') {
      return delay(db.products.filter((p) => p.supplierId === viewer.supplierId));
    }
    return delay(db.products);
  },

  async createProduct(input: Omit<Product, 'id'>): Promise<Product> {
    const creator = getStoredUser();
    if (creator && hasSupplierScope(creator)) {
      if (!creator.supplierId) throw new Error('Supplier scope missing');
      if (input.supplierId !== creator.supplierId) {
        throw new Error('Cannot add products for another supplier');
      }
    }
    if (creator && creator.role === 'admin' && creator.supplierId && input.supplierId !== creator.supplierId) {
      throw new Error('Admin can only add products for their supplier scope');
    }
    const product: Product = { ...input, id: uuid() };
    db.products.push(product);
    logEvent({
      action: 'product.created',
      summary: `Product ${product.name} created`,
      supplierId: product.supplierId,
      entityType: 'product',
      entityId: product.id,
      entityName: product.name,
      source: 'ui',
    });
    persist();
    return delay(product);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const existing = findById(db.products, id);
    if (!existing) {
      throw new Error('Product not found');
    }
    const actor = getStoredUser();
    if (actor && hasSupplierScope(actor) && existing.supplierId !== actor.supplierId) {
      throw new Error('Cannot modify products outside your supplier');
    }
    if (actor && actor.role === 'admin' && actor.supplierId && existing.supplierId !== actor.supplierId) {
      throw new Error('Admin cannot modify other supplier products');
    }
    Object.assign(existing, updates);
    logEvent({
      action: 'product.updated',
      summary: `Product ${existing.name} updated`,
      supplierId: existing.supplierId,
      entityType: 'product',
      entityId: existing.id,
      entityName: existing.name,
      source: 'ui',
    });
    persist();
    return delay(existing);
  },

  async deleteProduct(id: string): Promise<boolean> {
    const existing = findById(db.products, id);
    db.products = db.products.filter((p) => p.id !== id);
    logEvent({
      action: 'product.deleted',
      summary: `Product ${existing?.name ?? id} deleted`,
      supplierId: existing?.supplierId,
      entityType: 'product',
      entityId: existing?.id ?? id,
      entityName: existing?.name ?? id,
      source: 'ui',
    });
    persist();
    return delay(true);
  },

  async listQuotes(): Promise<Quote[]> {
    return delay(db.quotes);
  },

  async createQuote(input: Omit<Quote, 'id' | 'createdAt'>): Promise<Quote> {
    const quote: Quote = { ...input, id: uuid(), createdAt: new Date().toISOString() };
    db.quotes.push(quote);
    logEvent({
      action: 'quote.created',
      summary: `Quote ${quote.name} created`,
      entityType: 'quote',
      entityId: quote.id,
      entityName: quote.name,
      companyId: quote.orderId,
      source: 'ui',
    });
    persist();
    return delay(quote);
  },

  async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote> {
    const existing = findById(db.quotes, id);
    if (!existing) {
      throw new Error('Quote not found');
    }
    Object.assign(existing, updates);
    logEvent({
      action: 'quote.updated',
      summary: `Quote ${existing.name} updated`,
      entityType: 'quote',
      entityId: existing.id,
      entityName: existing.name,
      companyId: existing.orderId,
      source: 'ui',
    });
    persist();
    return delay(existing);
  },

  async listInvoices(): Promise<Invoice[]> {
    return delay(db.invoices);
  },

  async createInvoice(input: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    const invoice: Invoice = { ...input, id: uuid(), createdAt: new Date().toISOString() };
    db.invoices.push(invoice);
    logEvent({
      action: 'invoice.created',
      summary: `Invoice ${invoice.id} created`,
      entityType: 'invoice',
      entityId: invoice.id,
      entityName: invoice.id,
      companyId: invoice.orderId,
      source: 'ui',
    });
    persist();
    return delay(invoice);
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const existing = findById(db.invoices, id);
    if (!existing) {
      throw new Error('Invoice not found');
    }
    Object.assign(existing, updates);
    logEvent({
      action: 'invoice.updated',
      summary: `Invoice ${existing.id} updated`,
      entityType: 'invoice',
      entityId: existing.id,
      entityName: existing.id,
      companyId: existing.orderId,
      source: 'ui',
    });
    persist();
    return delay(existing);
  },

  async listOrderStatuses(): Promise<CRMData['orderStatuses']> {
    return delay(db.orderStatuses);
  },

  async addOrderStatus(name: string): Promise<CRMData['orderStatuses'][number]> {
    const status = {
      id: (name.trim().toLowerCase().replace(/\s+/g, '-') || uuid()) as OrderStatusId,
      name,
      order: db.orderStatuses.length + 1,
    };
    db.orderStatuses.push(status);
    logEvent({
      action: 'order.status_added',
      summary: `Order status ${status.name} added`,
      entityType: 'order_status',
      entityId: status.id,
      entityName: status.name,
      source: 'ui',
    });
    persist();
    return delay(status);
  },

  async listAuditLogs(params: {
    cursor?: { index: number } | null;
    companyId?: string;
    supplierId?: string;
    role?: User['role'];
  }): Promise<{ items: AuditLog[]; nextCursor: { index: number } | null }> {
    const viewer = getStoredUser();
    const role = params.role ?? viewer?.role;
    const companyScope = params.companyId ?? viewer?.companyId;
    const supplierScope = params.supplierId ?? viewer?.supplierId;

    const isSuper = role === 'superadmin';
    const isBuyerRole = role ? hasBuyerScope({ role, companyId: companyScope } as User) : false;
    const isSupplierRole = role
      ? hasSupplierScope({ role, supplierId: supplierScope } as User) || role === 'admin'
      : false;

    let filtered = db.auditLogs;
    if (!isSuper) {
      filtered = filtered.filter((log) => {
        if (isBuyerRole && companyScope) {
          return log.companyId === companyScope;
        }
        if (isSupplierRole && supplierScope) {
          return log.supplierId === supplierScope;
        }
        return false;
      });
    }
    if (params.companyId) {
      filtered = filtered.filter((log) => log.companyId === params.companyId);
    }
    if (params.supplierId) {
      filtered = filtered.filter((log) => log.supplierId === params.supplierId);
    }

    const start = params.cursor?.index ?? 0;
    const end = start + PAGE_SIZE;
    const items = filtered.slice(start, end);
    const nextCursor = end < filtered.length ? { index: end } : null;
    return delay({ items, nextCursor });
  },

  async exportAuditLogs(params: {
    from: string;
    to: string;
    companyId?: string;
    supplierId?: string;
  }): Promise<AuditLog[]> {
    const fromDate = new Date(params.from);
    const toDate = new Date(params.to);
    const rangeMs = toDate.getTime() - fromDate.getTime();
    const days = rangeMs / (1000 * 60 * 60 * 24);
    if (days > AUDIT_LIMIT_PER_EXPORT_DAYS) {
      throw new Error('Export range cannot exceed 1 year');
    }
    let filtered = db.auditLogs.filter((log) => {
      const ts = new Date(log.timestamp).getTime();
      return ts >= fromDate.getTime() && ts <= toDate.getTime();
    });
    if (params.companyId) {
      filtered = filtered.filter((log) => log.companyId === params.companyId);
    }
    if (params.supplierId) {
      filtered = filtered.filter((log) => log.supplierId === params.supplierId);
    }
    logEvent({
      action: 'audit.exported',
      summary: `Audit export from ${params.from} to ${params.to}`,
      companyId: params.companyId,
      supplierId: params.supplierId,
      entityType: 'audit',
      entityId: `export-${Date.now()}`,
      entityName: 'audit_export',
      source: 'ui',
    });
    return delay(filtered);
  },
};
