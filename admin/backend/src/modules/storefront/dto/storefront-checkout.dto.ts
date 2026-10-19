import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class StorefrontCheckoutItemDto {
  @ApiProperty({ description: 'Public product slug' })
  @IsString()
  @Length(1, 200)
  slug!: string;

  @ApiProperty({ minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class StorefrontCheckoutPackDto {
  @ApiProperty({ description: 'Public pack slug' })
  @IsString()
  @Length(1, 200)
  slug!: string;

  @ApiProperty({ minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

/**
 * Public checkout payload from the storefront. Prices are NEVER taken from the
 * client — the server recomputes them from the database. Cash on delivery.
 */
export class StorefrontCheckoutDto {
  @ApiProperty()
  @IsString()
  @Length(2, 200)
  customerName!: string;

  @ApiProperty()
  @IsString()
  @Length(6, 30)
  customerPhone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 150)
  customerEmail?: string;

  @ApiProperty()
  @IsString()
  @Length(5, 500)
  shippingAddress!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;

  @ApiPropertyOptional({ type: [StorefrontCheckoutItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => StorefrontCheckoutItemDto)
  items: StorefrontCheckoutItemDto[] = [];

  @ApiPropertyOptional({ type: [StorefrontCheckoutPackDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => StorefrontCheckoutPackDto)
  packs: StorefrontCheckoutPackDto[] = [];
}
