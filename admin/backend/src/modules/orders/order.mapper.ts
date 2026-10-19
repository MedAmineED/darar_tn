import { OrderStockState, OrderStatus, PaymentStatus } from '@prisma/client';
import type { OrderDetail, OrderListItem } from './orders.repository';

export interface OrderItemResponse {
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

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  stockState: OrderStockState | null;
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
  items: OrderItemResponse[];
  itemCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toOrderResponse(order: OrderDetail): OrderResponse {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    stockState: order.inventory?.state ?? null,
    paymentMethod: order.paymentMethod,
    customerId: order.customerId,
    customer: order.customer,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    shippingAddress: order.shippingAddress,
    notes: order.notes,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingAmount: Number(order.shippingAmount),
    totalAmount: Number(order.totalAmount),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productNameAr: item.productNameAr,
      productNameFr: item.productNameFr,
      productSku: item.productSku,
      productPrice: Number(item.productPrice),
      quantity: item.quantity,
      total: Number(item.total),
      packId: item.packId,
      packNameAr: item.packNameAr,
      packNameFr: item.packNameFr,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function toOrderListItem(order: OrderListItem) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    customerId: order.customerId,
    customer: order.customer,
    customerName: order.customerName,
    totalAmount: Number(order.totalAmount),
    itemCount: order._count.items,
    createdAt: order.createdAt,
  };
}
