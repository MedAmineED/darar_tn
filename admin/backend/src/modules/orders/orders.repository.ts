import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const orderDetailInclude = {
  items: true,
  inventory: { select: { state: true } },
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
} satisfies Prisma.OrderInclude;

export const orderListInclude = {
  _count: { select: { items: true } },
  customer: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.OrderInclude;

export type OrderDetail = Prisma.OrderGetPayload<{
  include: typeof orderDetailInclude;
}>;
export type OrderListItem = Prisma.OrderGetPayload<{
  include: typeof orderListInclude;
}>;

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<OrderDetail | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: orderDetailInclude,
    });
  }

  findMany(params: {
    skip: number;
    take: number;
    where: Prisma.OrderWhereInput;
    orderBy: Prisma.OrderOrderByWithRelationInput;
  }): Promise<[OrderListItem[], number]> {
    return this.prisma.$transaction([
      this.prisma.order.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: orderListInclude,
      }),
      this.prisma.order.count({ where: params.where }),
    ]);
  }

  create(data: Prisma.OrderCreateInput): Promise<OrderDetail> {
    return this.prisma.order.create({
      data,
      include: orderDetailInclude,
    });
  }

  update(id: string, data: Prisma.OrderUpdateInput): Promise<OrderDetail> {
    return this.prisma.order.update({
      where: { id },
      data,
      include: orderDetailInclude,
    });
  }
}
