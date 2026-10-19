import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { buildPaginatedResult } from '../../common/utils/paginate';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerResponse, toCustomerResponse } from './customer.mapper';
import { CustomersRepository, CustomerWithCount } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

const SORTABLE = new Set(['createdAt', 'firstName', 'lastName']);

export interface CustomerDetail extends CustomerResponse {
  totalSpent: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    createdAt: Date;
  }[];
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly repository: CustomersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCustomerDto): Promise<CustomerResponse> {
    await this.assertEmailAvailable(dto.email);
    const customer = await this.repository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
    });
    return toCustomerResponse(customer);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<CustomerResponse>> {
    const where: Prisma.CustomerWhereInput = query.search
      ? {
          OR: [
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
            { email: { contains: query.search } },
            { phone: { contains: query.search } },
          ],
        }
      : {};

    const sortBy = SORTABLE.has(query.sortBy ?? '')
      ? (query.sortBy as string)
      : 'createdAt';

    const [items, total] = await this.repository.findMany({
      skip: query.skip,
      take: query.limit,
      where,
      orderBy: { [sortBy]: query.sortOrder },
    });
    return buildPaginatedResult(
      items.map(toCustomerResponse),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string): Promise<CustomerDetail> {
    const customer = await this.ensureExists(id);
    const [totalSpent, recentOrders] = await Promise.all([
      this.repository.totalSpent(id),
      this.prisma.order.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      ...toCustomerResponse(customer),
      totalSpent,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
      })),
    };
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerResponse> {
    await this.ensureExists(id);
    if (dto.email) {
      await this.assertEmailAvailable(dto.email, id);
    }
    const customer = await this.repository.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
    });
    return toCustomerResponse(customer);
  }

  async remove(id: string): Promise<{ id: string }> {
    const customer = await this.ensureExists(id);
    if (customer._count.orders > 0) {
      throw new BadRequestException({
        message: 'Cannot delete a customer that has orders',
        code: 'CUSTOMER_HAS_ORDERS',
      });
    }
    await this.repository.delete(id);
    return { id };
  }

  private async ensureExists(id: string): Promise<CustomerWithCount> {
    const customer = await this.repository.findById(id);
    if (!customer) {
      throw new NotFoundException({
        message: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND',
      });
    }
    return customer;
  }

  private async assertEmailAvailable(
    email: string | undefined,
    excludeId?: string,
  ): Promise<void> {
    if (!email) return;
    const existing = await this.repository.findByEmail(email);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException({
        message: 'A customer with this email already exists',
        code: 'CUSTOMER_EMAIL_TAKEN',
      });
    }
  }
}
