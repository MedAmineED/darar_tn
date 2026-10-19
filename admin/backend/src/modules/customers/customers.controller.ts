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
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../audit/audit.service';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @RequirePermissions('customer:read')
  findAll(@Query() query: PaginationQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('customer:read')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @RequirePermissions('customer:create')
  async create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser('id') actorId: string,
  ) {
    const customer = await this.customersService.create(dto);
    await this.auditService.record({
      userId: actorId,
      action: 'customer.created',
      entity: 'Customer',
      entityId: customer.id,
    });
    return customer;
  }

  @Patch(':id')
  @RequirePermissions('customer:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser('id') actorId: string,
  ) {
    const customer = await this.customersService.update(id, dto);
    await this.auditService.record({
      userId: actorId,
      action: 'customer.updated',
      entity: 'Customer',
      entityId: id,
    });
    return customer;
  }

  @Delete(':id')
  @RequirePermissions('customer:delete')
  async remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    const result = await this.customersService.remove(id);
    await this.auditService.record({
      userId: actorId,
      action: 'customer.deleted',
      entity: 'Customer',
      entityId: id,
    });
    return result;
  }
}
