import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const STOREFRONT_SORTS = [
  'popular',
  'newest',
  'price_asc',
  'price_desc',
] as const;

export type StorefrontSort = (typeof STOREFRONT_SORTS)[number];

/** Public, read-only query parameters for the storefront product listing. */
export class StorefrontProductQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 48 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(48)
  limit = 12;

  @ApiPropertyOptional({ description: 'Free-text search over product names' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Category slug filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: STOREFRONT_SORTS, default: 'popular' })
  @IsOptional()
  @IsIn(STOREFRONT_SORTS)
  sort: StorefrontSort = 'popular';

  @ApiPropertyOptional({ description: 'Only featured products', type: Boolean })
  @IsOptional()
  @IsBooleanString()
  featured?: string;
}
