export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  totalSpent: number;
  recentOrders: CustomerOrderSummary[];
}

export interface CustomerInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  productNameAr: string;
  productNameFr: string;
  productSku: string | null;
  productPrice: number;
  quantity: number;
  total: number;
  packId: string | null;
  packNameAr: string | null;
  packNameFr: string | null;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerId: string | null;
  customer: { id: string; firstName: string; lastName: string } | null;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  stockState: 'LEGACY' | 'UNCOMMITTED' | 'DEDUCTED' | 'RESTORED' | null;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  customerId: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  shippingAddress: string | null;
  notes: string | null;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  requestKey?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  notes?: string;
  paymentMethod?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  discountAmount?: number;
  shippingAmount?: number;
  items: { productId: string; quantity: number }[];
  packs?: { packId: string; quantity: number }[];
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
}
