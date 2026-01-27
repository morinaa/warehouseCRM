export type User = {
  id: string;
  name: string;
  email: string;
  role:
    | 'superadmin'
    | 'admin'
    | 'supplier_admin'
    | 'supplier_manager'
    | 'buyer_admin'
    | 'buyer_manager'
    | 'supplier'
    | 'buyer';
  supplierId?: string;
  companyId?: string; // buyer org association
  permissions?: {
    viewOnly?: boolean;
    canOrder?: boolean;
    canApprove?: boolean;
  };
  password?: string;
};

export type Supplier = {
  id: string;
  name: string;
  region?: string;
  website?: string;
  categories: string[];
  tags?: string[];
  rating?: number;
};

export type AccountTier = {
  id: string;
  name: string;
  description?: string;
  multiplier: number;
  defaultPaymentTerms?: string;
};

export type Account = {
  id: string;
  name: string;
  channel?: string;
  region?: string;
  website?: string;
  tags: string[];
  ownerId?: string;
  health?: 'healthy' | 'watch' | 'at-risk';
  createdAt: string;
  creditLimit: number;
  creditUsed: number;
  priceTierId: AccountTier['id'];
  paymentTerms: string;
  lastOrderDate?: string;
};

export type Retailer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  accountId?: string;
  tags: string[];
  ownerId?: string;
  status: 'Active' | 'Prospect' | 'Dormant';
  createdAt: string;
};

export type OrderStatusId =
  | 'draft'
  | 'pending_buyer_approval'
  | 'rejected_by_buyer'
  | 'sent_to_supplier'
  | 'accepted_by_supplier'
  | 'rejected_by_supplier'
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'completed';

export type OrderStatus = {
  id: OrderStatusId;
  name: string;
  order: number;
};

export type OrderLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  accountId: string;
  supplierId?: string;
  retailerId?: string;
  status: OrderStatusId;
  orderValue: number;
  expectedShipDate?: string;
  paymentTerms?: string;
  warehouse?: string;
  notes?: string;
  items: OrderLine[];
  createdAt: string;
  createdBy: string;
  approvalStatus: 'pending' | 'accepted' | 'rejected';
  approvedBy?: string;
  approverNote?: string;
};

export type ActivityType = 'note' | 'call' | 'meeting' | 'task' | 'email';

export type Activity = {
  id: string;
  type: ActivityType;
  subject: string;
  content: string;
  status?: 'open' | 'done';
  dueDate?: string;
  retailerId?: string;
  accountId?: string;
  orderId?: string;
  createdAt: string;
  ownerId?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  retailerId?: string;
  orderId?: string;
  location?: string;
  type?: string;
};

export type ProductStock = {
  stockLevel: number;
  minThreshold: number;
  reserved?: number;
  leadTimeDays?: number;
};

export type TierPrice = {
  tierId: AccountTier['id'];
  price: number;
};

export type Product = {
  id: string;
  supplierId?: string;
  name: string;
  sku: string;
  basePrice: number;
  currency: string;
  description?: string;
  originCountry?: string;
  active: boolean;
  category?: string;
  image?: string;
  images?: string[];
  stock: ProductStock;
  tierPrices: TierPrice[];
};

export type QuoteItem = {
  productId: string;
  quantity: number;
  price: number;
};

export type Quote = {
  id: string;
  name: string;
  retailerId?: string;
  orderId?: string;
  status: 'draft' | 'sent' | 'accepted' | 'lost';
  total: number;
  items: QuoteItem[];
  createdAt: string;
};

export type Invoice = {
  id: string;
  quoteId?: string;
  orderId?: string;
  retailerId?: string;
  status: 'unpaid' | 'paid' | 'overdue';
  total: number;
  dueDate: string;
  createdAt: string;
};

export type AuditAction =
  | 'order.created'
  | 'order.updated'
  | 'order.deleted'
  | 'order.status_changed'
  | 'order.duplicated'
  | 'order.status_added'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'user.created'
  | 'supplier.created'
  | 'retailer.created'
  | 'retailer.updated'
  | 'account.created'
  | 'account.updated'
  | 'activity.created'
  | 'activity.toggled'
  | 'event.created'
  | 'quote.created'
  | 'quote.updated'
  | 'invoice.created'
  | 'invoice.updated'
  | 'audit.exported';

export type AuditLog = {
  id: string;
  timestamp: string;
  action: AuditAction;
  summary: string;
  actorId?: string;
  actorName?: string;
  actorRole?: User['role'];
  companyId?: string;
  supplierId?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  status?: 'success' | 'error';
  metadata?: Record<string, string | number | boolean | null>;
  source?: 'ui' | 'api' | 'system';
};

export type CRMData = {
  users: User[];
  retailers: Retailer[];
  accounts: Account[];
  suppliers: Supplier[];
  orders: Order[];
  activities: Activity[];
  events: CalendarEvent[];
  products: Product[];
  quotes: Quote[];
  invoices: Invoice[];
  orderStatuses: OrderStatus[];
  accountTiers: AccountTier[];
  auditLogs: AuditLog[];
};
