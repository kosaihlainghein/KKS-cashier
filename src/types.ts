export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  barcode: string;
  badge?: string;
  purity?: string;
  description: string;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customDiscountPercent?: number;
}

export interface LoyaltyMember {
  id: string;
  name: string;
  tier: 'Gold Reserve' | 'Platinum Elite' | 'Royal Black';
  points: number;
  discountRate: number;
  vipStatus: boolean;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'bank_transfer';

export interface CompletedSale {
  id: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  loyaltyMember?: LoyaltyMember | null;
  cashierName: string;
  registerId: string;
}

export interface DailyStats {
  totalSales: number;
  itemsSold: number;
  transactionsCount: number;
  topProduct: {
    name: string;
    units: number;
    revenue: number;
  };
  hourlySales: { hour: string; sales: number }[];
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
}
