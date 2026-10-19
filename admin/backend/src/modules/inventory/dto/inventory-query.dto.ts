import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { ProductStatus, StockMovementKind } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InventoryQueryDto extends PaginationQueryDto {
  @IsOptional() @IsIn(['IN', 'LOW', 'OUT']) availability?: 'IN' | 'LOW' | 'OUT';
  @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
  @IsOptional() @IsString() categoryId?: string;
}
export class MovementQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(StockMovementKind) kind?: StockMovementKind;
}
