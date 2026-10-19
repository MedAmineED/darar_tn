import type { CustomerWithCount } from './customers.repository';

export interface CustomerResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  orderCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toCustomerResponse(
  customer: CustomerWithCount,
): CustomerResponse {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    orderCount: customer._count.orders,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}
