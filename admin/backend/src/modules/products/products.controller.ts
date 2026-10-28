import {
  Body,
  Controller,
  Delete,
  Get,
  ForbiddenException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { SetFeaturedDto } from './dto/set-featured.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @RequirePermissions('product:read')
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('product:read')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @RequirePermissions('product:create')
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    if (
      ((dto.initialQuantity ?? 0) > 0 || (dto.lowStockThreshold ?? 0) > 0) &&
      !actor.isSuperAdmin &&
      !actor.permissions.includes('inventory:adjust')
    ) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        code: 'FORBIDDEN_PERMISSION',
      });
    }
    return this.productsService.create(dto, actor.id);
  }

  @Put('featured')
  @RequirePermissions('product:update')
  async setFeatured(
    @Body() dto: SetFeaturedDto,
    @CurrentUser('id') actorId: string,
  ) {
    const result = await this.productsService.setFeatured(dto);
    await this.auditService.record({
      userId: actorId,
      action: 'product.featured_updated',
      entity: 'Product',
      metadata: { productIds: dto.productIds },
    });
    return result;
  }

  @Patch(':id')
  @RequirePermissions('product:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser('id') actorId: string,
  ) {
    const product = await this.productsService.update(id, dto);
    await this.auditService.record({
      userId: actorId,
      action: 'product.updated',
      entity: 'Product',
      entityId: id,
      metadata: dto.status ? { status: dto.status } : undefined,
    });
    return product;
  }

  @Delete(':id')
  @RequirePermissions('product:delete')
  async remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    const result = await this.productsService.remove(id);
    await this.auditService.record({
      userId: actorId,
      action: 'product.deleted',
      entity: 'Product',
      entityId: id,
    });
    return result;
  }
}
