import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PartnerEntryKind,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { buildPaginatedResult } from '../../common/utils/paginate';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateExpenseDto,
  CreatePartnerDto,
  CreatePartnerEntryDto,
  DateRangeQueryDto,
  EntryQueryDto,
  ExpenseQueryDto,
  UpdatePartnerDto,
} from './dto/accounting.dto';
import {
  OptionalRange,
  bookDate,
  dateFilter,
  optionalRange,
} from './date-range';

type SqlNumber = Prisma.Decimal | bigint | number | null;
const num = (v: SqlNumber): number => (v === null ? 0 : Number(v));
const round2 = (n: number): number => Math.round(n * 100) / 100;

// Same definition as the dashboard: only paid, non-cancelled orders are sales.
const eligible = Prisma.sql`o.paymentStatus = ${PaymentStatus.PAID} AND o.status <> ${OrderStatus.CANCELLED}`;

export interface ProfitFigures {
  orders: number;
  revenue: number;
  shippingCollected: number;
  discounts: number;
  cogs: number;
  linesWithoutCost: number;
  revenueWithoutCost: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
}

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Partners ────────────────────────────────────────────────

  listPartners() {
    // Partners are few (a handful of associates); bounded defensively.
    return this.prisma.partner.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      take: 200,
    });
  }

  createPartner(dto: CreatePartnerDto) {
    return this.prisma.partner.create({ data: dto });
  }

  async updatePartner(id: string, dto: UpdatePartnerDto) {
    await this.ensurePartner(id);
    return this.prisma.partner.update({ where: { id }, data: dto });
  }

  async deletePartner(id: string) {
    await this.ensurePartner(id);
    const [entries, expenses] = await Promise.all([
      this.prisma.partnerEntry.count({ where: { partnerId: id } }),
      this.prisma.expense.count({ where: { paidByPartnerId: id } }),
    ]);
    if (entries || expenses)
      throw new ConflictException({
        message:
          'Partner has accounting records; deactivate instead of deleting',
        code: 'PARTNER_HAS_RECORDS',
      });
    await this.prisma.partner.delete({ where: { id } });
    return { id };
  }

  // ── Contributions / withdrawals ────────────────────────────

  async listEntries(query: EntryQueryDto) {
    const where: Prisma.PartnerEntryWhereInput = {
      partnerId: query.partnerId,
      kind: query.kind,
      date: dateFilter(optionalRange(query.from, query.to)),
    };
    if (query.search) where.note = { contains: query.search };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.partnerEntry.findMany({
        where,
        include: { partner: { select: { id: true, name: true } } },
        orderBy: [{ date: query.sortOrder }, { createdAt: query.sortOrder }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.partnerEntry.count({ where }),
    ]);
    return buildPaginatedResult(
      items.map((e) => ({ ...e, amount: Number(e.amount) })),
      total,
      query.page,
      query.limit,
    );
  }

  async createEntry(dto: CreatePartnerEntryDto) {
    await this.ensurePartner(dto.partnerId);
    const entry = await this.prisma.partnerEntry.create({
      data: {
        partnerId: dto.partnerId,
        kind: dto.kind,
        amount: new Prisma.Decimal(dto.amount),
        date: bookDate(dto.date),
        note: dto.note,
      },
    });
    return { ...entry, amount: Number(entry.amount) };
  }

  async deleteEntry(id: string) {
    const entry = await this.prisma.partnerEntry.findUnique({ where: { id } });
    if (!entry)
      throw new NotFoundException({
        message: 'Entry not found',
        code: 'ENTRY_NOT_FOUND',
      });
    await this.prisma.partnerEntry.delete({ where: { id } });
    return entry;
  }

  // ── Expenses ────────────────────────────────────────────────

  async listExpenses(query: ExpenseQueryDto) {
    const where: Prisma.ExpenseWhereInput = {
      paidByPartnerId: query.partnerId,
      category: query.category,
      date: dateFilter(optionalRange(query.from, query.to)),
    };
    if (query.search) where.label = { contains: query.search };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: { paidBy: { select: { id: true, name: true } } },
        orderBy: [{ date: query.sortOrder }, { createdAt: query.sortOrder }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.expense.count({ where }),
    ]);
    return buildPaginatedResult(
      items.map((e) => ({ ...e, amount: Number(e.amount) })),
      total,
      query.page,
      query.limit,
    );
  }

  async createExpense(dto: CreateExpenseDto) {
    if (dto.paidByPartnerId) await this.ensurePartner(dto.paidByPartnerId);
    const expense = await this.prisma.expense.create({
      data: {
        label: dto.label,
        category: dto.category || null,
        amount: new Prisma.Decimal(dto.amount),
        date: bookDate(dto.date),
        paidByPartnerId: dto.paidByPartnerId || null,
      },
    });
    return { ...expense, amount: Number(expense.amount) };
  }

  async deleteExpense(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense)
      throw new NotFoundException({
        message: 'Expense not found',
        code: 'EXPENSE_NOT_FOUND',
      });
    await this.prisma.expense.delete({ where: { id } });
    return expense;
  }

  // ── Summary ─────────────────────────────────────────────────

  /**
   * Profit for the period = what customers paid − purchase cost of the units
   * sold − operating expenses. No VAT. Partner share of that profit follows
   * each partner's share of total money spent for the business (capital put
   * in + expenses paid out of pocket), measured up to the end of the period.
   */
  async summary(query: DateRangeQueryDto) {
    const range = optionalRange(query.from, query.to);
    const untilEnd: OptionalRange = { ...range, from: null, start: null };
    const [period, cumulative, partners, byCategory, stock] = await Promise.all(
      [
        this.profit(range),
        this.profit(untilEnd),
        this.partnerTotals(untilEnd),
        this.prisma.expense.groupBy({
          by: ['category'],
          where: { date: dateFilter(range) },
          _sum: { amount: true },
        }),
        this.prisma.$queryRaw<
          { units: SqlNumber; value: SqlNumber; missing: SqlNumber }[]
        >(Prisma.sql`
          SELECT COALESCE(SUM(i.quantity), 0) AS units,
            COALESCE(SUM(i.quantity * p.costPrice), 0) AS value,
            COALESCE(SUM(CASE WHEN p.costPrice IS NULL AND i.quantity > 0 THEN 1 ELSE 0 END), 0) AS missing
          FROM inventory_items i JOIN products p ON p.id = i.productId
          WHERE p.status <> 'ARCHIVED'
        `),
      ],
    );

    const totalSpent = round2(partners.reduce((s, p) => s + p.spent, 0));
    const partnerRows = partners.map((p) => {
      const ratio = totalSpent > 0 ? p.spent / totalSpent : 0;
      return {
        ...p,
        percent: round2(ratio * 100),
        profitShare: round2(period.netProfit * ratio),
        cumulativeProfitShare: round2(cumulative.netProfit * ratio),
        // What the business owes the partner: money in + profit share − taken out.
        balance: round2(p.spent + cumulative.netProfit * ratio - p.withdrawals),
      };
    });

    return {
      range: { from: range.from, to: range.to },
      period,
      cumulativeNetProfit: cumulative.netProfit,
      margin:
        period.revenue > 0
          ? round2((period.netProfit / period.revenue) * 100)
          : null,
      expensesByCategory: byCategory
        .map((row) => ({
          category: row.category,
          amount: num(row._sum.amount),
        }))
        .sort((a, b) => b.amount - a.amount),
      stock: {
        units: num(stock[0]?.units ?? 0),
        valueAtCost: round2(num(stock[0]?.value ?? 0)),
        productsWithoutCost: num(stock[0]?.missing ?? 0),
      },
      partners: partnerRows,
      totals: {
        spent: totalSpent,
        withdrawals: round2(partners.reduce((s, p) => s + p.withdrawals, 0)),
        balance: round2(partnerRows.reduce((s, p) => s + p.balance, 0)),
      },
    };
  }

  private async profit(range: OptionalRange): Promise<ProfitFigures> {
    const conditions = [eligible];
    if (range.start) conditions.push(Prisma.sql`o.createdAt >= ${range.start}`);
    if (range.end) conditions.push(Prisma.sql`o.createdAt < ${range.end}`);
    const where = Prisma.join(conditions, ' AND ');
    const [orders, lines, expenses] = await Promise.all([
      this.prisma.$queryRaw<
        {
          orders: SqlNumber;
          revenue: SqlNumber;
          shipping: SqlNumber;
          discounts: SqlNumber;
        }[]
      >(Prisma.sql`
        SELECT COUNT(*) AS orders, COALESCE(SUM(o.totalAmount), 0) AS revenue,
          COALESCE(SUM(o.shippingAmount), 0) AS shipping,
          COALESCE(SUM(o.discountAmount), 0) AS discounts
        FROM orders o WHERE ${where}
      `),
      this.prisma.$queryRaw<
        { cogs: SqlNumber; missing: SqlNumber; missingRevenue: SqlNumber }[]
      >(Prisma.sql`
        SELECT COALESCE(SUM(oi.unitCost * oi.quantity), 0) AS cogs,
          COALESCE(SUM(CASE WHEN oi.unitCost IS NULL THEN 1 ELSE 0 END), 0) AS missing,
          COALESCE(SUM(CASE WHEN oi.unitCost IS NULL THEN oi.total ELSE 0 END), 0) AS missingRevenue
        FROM order_items oi JOIN orders o ON o.id = oi.orderId
        WHERE ${where}
      `),
      this.prisma.expense.aggregate({
        where: { date: dateFilter(range) },
        _sum: { amount: true },
      }),
    ]);
    const revenue = round2(num(orders[0]?.revenue ?? 0));
    const cogs = round2(num(lines[0]?.cogs ?? 0));
    const expenseTotal = round2(num(expenses._sum.amount));
    return {
      orders: num(orders[0]?.orders ?? 0),
      revenue,
      shippingCollected: round2(num(orders[0]?.shipping ?? 0)),
      discounts: round2(num(orders[0]?.discounts ?? 0)),
      cogs,
      linesWithoutCost: num(lines[0]?.missing ?? 0),
      revenueWithoutCost: round2(num(lines[0]?.missingRevenue ?? 0)),
      expenses: expenseTotal,
      grossProfit: round2(revenue - cogs),
      netProfit: round2(revenue - cogs - expenseTotal),
    };
  }

  private async partnerTotals(range: OptionalRange) {
    const date = dateFilter(range);
    const [partners, entries, paid] = await Promise.all([
      this.listPartners(),
      this.prisma.partnerEntry.groupBy({
        by: ['partnerId', 'kind'],
        where: { date },
        _sum: { amount: true },
      }),
      this.prisma.expense.groupBy({
        by: ['paidByPartnerId'],
        where: { date, paidByPartnerId: { not: null } },
        _sum: { amount: true },
      }),
    ]);
    return partners.map((partner) => {
      const sum = (kind: PartnerEntryKind) =>
        num(
          entries.find((e) => e.partnerId === partner.id && e.kind === kind)
            ?._sum.amount ?? null,
        );
      const contributions = round2(sum(PartnerEntryKind.CONTRIBUTION));
      const expensesPaid = round2(
        num(
          paid.find((e) => e.paidByPartnerId === partner.id)?._sum.amount ??
            null,
        ),
      );
      return {
        id: partner.id,
        name: partner.name,
        isActive: partner.isActive,
        contributions,
        expensesPaid,
        spent: round2(contributions + expensesPaid),
        withdrawals: round2(sum(PartnerEntryKind.WITHDRAWAL)),
      };
    });
  }

  private async ensurePartner(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner)
      throw new BadRequestException({
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND',
      });
    return partner;
  }
}
