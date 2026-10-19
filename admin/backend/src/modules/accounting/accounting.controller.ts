import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../audit/audit.service';
import { AccountingService } from './accounting.service';
import {
  CreateExpenseDto,
  CreatePartnerDto,
  CreatePartnerEntryDto,
  DateRangeQueryDto,
  EntryQueryDto,
  ExpenseQueryDto,
  UpdatePartnerDto,
} from './dto/accounting.dto';

@ApiTags('Accounting')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly accounting: AccountingService,
    private readonly audit: AuditService,
  ) {}

  @Get('summary')
  @RequirePermissions('accounting:read')
  summary(@Query() query: DateRangeQueryDto) {
    return this.accounting.summary(query);
  }

  @Get('partners')
  @RequirePermissions('accounting:read')
  listPartners() {
    return this.accounting.listPartners();
  }

  @Post('partners')
  @RequirePermissions('accounting:manage')
  async createPartner(
    @Body() dto: CreatePartnerDto,
    @CurrentUser('id') actorId: string,
  ) {
    const partner = await this.accounting.createPartner(dto);
    await this.log(actorId, 'partner.created', 'Partner', partner.id, {
      name: partner.name,
    });
    return partner;
  }

  @Patch('partners/:id')
  @RequirePermissions('accounting:manage')
  async updatePartner(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerDto,
    @CurrentUser('id') actorId: string,
  ) {
    const partner = await this.accounting.updatePartner(id, dto);
    await this.log(actorId, 'partner.updated', 'Partner', id, {
      name: partner.name,
      isActive: partner.isActive,
    });
    return partner;
  }

  @Delete('partners/:id')
  @RequirePermissions('accounting:manage')
  async deletePartner(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    const result = await this.accounting.deletePartner(id);
    await this.log(actorId, 'partner.deleted', 'Partner', id);
    return result;
  }

  @Get('entries')
  @RequirePermissions('accounting:read')
  listEntries(@Query() query: EntryQueryDto) {
    return this.accounting.listEntries(query);
  }

  @Post('entries')
  @RequirePermissions('accounting:manage')
  async createEntry(
    @Body() dto: CreatePartnerEntryDto,
    @CurrentUser('id') actorId: string,
  ) {
    const entry = await this.accounting.createEntry(dto);
    await this.log(actorId, 'partner_entry.created', 'PartnerEntry', entry.id, {
      partnerId: entry.partnerId,
      kind: entry.kind,
      amount: entry.amount,
    });
    return entry;
  }

  @Delete('entries/:id')
  @RequirePermissions('accounting:manage')
  async deleteEntry(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    const entry = await this.accounting.deleteEntry(id);
    await this.log(actorId, 'partner_entry.deleted', 'PartnerEntry', id, {
      partnerId: entry.partnerId,
      kind: entry.kind,
      amount: Number(entry.amount),
    });
    return { id };
  }

  @Get('expenses')
  @RequirePermissions('accounting:read')
  listExpenses(@Query() query: ExpenseQueryDto) {
    return this.accounting.listExpenses(query);
  }

  @Post('expenses')
  @RequirePermissions('accounting:manage')
  async createExpense(
    @Body() dto: CreateExpenseDto,
    @CurrentUser('id') actorId: string,
  ) {
    const expense = await this.accounting.createExpense(dto);
    await this.log(actorId, 'expense.created', 'Expense', expense.id, {
      label: expense.label,
      amount: expense.amount,
    });
    return expense;
  }

  @Delete('expenses/:id')
  @RequirePermissions('accounting:manage')
  async deleteExpense(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    const expense = await this.accounting.deleteExpense(id);
    await this.log(actorId, 'expense.deleted', 'Expense', id, {
      label: expense.label,
      amount: Number(expense.amount),
    });
    return { id };
  }

  private log(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    metadata?: Record<string, string | number | boolean | null>,
  ) {
    return this.audit.record({ userId, action, entity, entityId, metadata });
  }
}
