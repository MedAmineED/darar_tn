import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const customerListInclude = {
  _count: { select: { orders: true } },
} satisfies Prisma.CustomerInclude;

export type CustomerWithCount = Prisma.CustomerGetPayload<{
  include: typeof customerListInclude;
}>;

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.customer.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  findById(id: string): Promise<CustomerWithCount | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      include: customerListInclude,
    });
  }

  findMany(params: {
    skip: number;
    take: number;
    where: Prisma.CustomerWhereInput;
    orderBy: Prisma.CustomerOrderByWithRelationInput;
  }): Promise<[CustomerWithCount[], number]> {
    return this.prisma.$transaction([
      this.prisma.customer.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: customerListInclude,
      }),
      this.prisma.customer.count({ where: params.where }),
    ]);
  }

  create(data: Prisma.CustomerCreateInput): Promise<CustomerWithCount> {
    return this.prisma.customer.create({
      data,
      include: customerListInclude,
    });
  }

  update(
    id: string,
    data: Prisma.CustomerUpdateInput,
  ): Promise<CustomerWithCount> {
    return this.prisma.customer.update({
      where: { id },
      data,
      include: customerListInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customer.delete({ where: { id } });
  }

  /** Total spent = sum of non-cancelled order totals. */
  async totalSpent(customerId: string): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: { customerId, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    });
    return Number(result._sum.totalAmount ?? 0);
  }
}
