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
  buyerId?: string; // buyer org association
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

export type BuyerTier = {
  id: string;
  name: string;
  description?: string;
  multiplier: number;
  defaultPaymentTerms?: string;
};

export type Buyer = {
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
  priceTierId: BuyerTier['id'];
  paymentTerms: string;
  lastOrderDate?: string;
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
  buyerId: string;
  supplierId?: string;
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

export type ProductStock = {
  stockLevel: number;
  minThreshold: number;
  reserved?: number;
  leadTimeDays?: number;
};

export type TierPrice = {
  tierId: BuyerTier['id'];
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
  | 'user.updated'
  | 'user.deleted'
  | 'supplier.created'
  | 'supplier.updated'
  | 'supplier.deleted'
  | 'buyer.created'
  | 'buyer.updated'
  | 'buyer.deleted'
  | 'audit.exported'
  | 'audit.cleared';

export type AuditLog = {
  id: string;
  timestamp: string;
  action: AuditAction;
  summary: string;
  actorId?: string;
  actorName?: string;
  actorRole?: User['role'];
  buyerId?: string;
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
  buyers: Buyer[];
  suppliers: Supplier[];
  orders: Order[];
  products: Product[];
  orderStatuses: OrderStatus[];
  buyerTiers: BuyerTier[];
  auditLogs: AuditLog[];
};
