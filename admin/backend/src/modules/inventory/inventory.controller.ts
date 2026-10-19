import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { InventoryService } from './inventory.service';
import { InventoryQueryDto, MovementQueryDto } from './dto/inventory-query.dto';
import { AdjustStockDto, ThresholdDto } from './dto/adjust-stock.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get()
  @RequirePermissions('inventory:read')
  findAll(@Query() query: InventoryQueryDto) {
    return this.inventory.findAll(query);
  }
  @Get(':productId/movements')
  @RequirePermissions('inventory:read')
  history(
    @Param('productId') productId: string,
    @Query() query: MovementQueryDto,
  ) {
    return this.inventory.history(productId, query);
  }
  @Post(':productId/adjustments')
  @RequirePermissions('inventory:adjust')
  adjust(
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.inventory.adjust(productId, dto, actorId);
  }
  @Patch(':productId/threshold')
  @RequirePermissions('inventory:adjust')
  threshold(
    @Param('productId') productId: string,
    @Body() dto: ThresholdDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.inventory.threshold(productId, dto, actorId);
  }
}
