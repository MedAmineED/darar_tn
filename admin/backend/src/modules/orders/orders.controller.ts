import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions('order:read')
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('order:read')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @RequirePermissions('order:create')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Reuse a unique key (8-128 URL-safe characters) for retries of the same creation payload',
  })
  async create(
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') requestKey: string | undefined,
    @CurrentUser('id') actorId: string,
  ) {
    const order = await this.ordersService.create(dto, actorId, requestKey);
    return order;
  }

  @Patch(':id')
  @RequirePermissions('order:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser('id') actorId: string,
  ) {
    const order = await this.ordersService.update(id, dto, actorId);
    return order;
  }
}
