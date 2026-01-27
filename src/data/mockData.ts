import type { CRMData } from '../types';

export const seedData: CRMData = {
  users: [],
  suppliers: [],
  buyerTiers: [
    {
      id: 'tier-standard',
      name: 'Standard',
      description: 'Base list pricing for independents',
      multiplier: 1,
      defaultPaymentTerms: 'Prepaid',
    },
    {
      id: 'tier-gold',
      name: 'Gold Tier',
      description: 'Preferred regional chains with volume commitments',
      multiplier: 0.9,
      defaultPaymentTerms: 'Net 30',
    },
    {
      id: 'tier-vip',
      name: 'VIP / Distributor',
      description: 'Distributors and master wholesalers',
      multiplier: 0.8,
      defaultPaymentTerms: 'Net 45',
    },
  ],
  orderStatuses: [
    { id: 'pending', name: 'Pending', order: 1 },
    { id: 'confirmed', name: 'Confirmed', order: 2 },
    { id: 'shipped', name: 'Shipped', order: 3 },
    { id: 'completed', name: 'Completed', order: 4 },
  ],
  buyers: [],
  products: [],
  orders: [],
  auditLogs: [],
};

