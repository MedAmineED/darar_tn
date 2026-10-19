import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PartnerEntryKind } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePartnerDto {
  @ApiProperty({ example: 'Amine' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePartnerDto extends PartialType(CreatePartnerDto) {}

export class CreatePartnerEntryDto {
  @ApiProperty()
  @IsString()
  partnerId!: string;

  @ApiProperty({ enum: PartnerEntryKind })
  @IsEnum(PartnerEntryKind)
  kind!: PartnerEntryKind;

  @ApiProperty({ example: 1500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: '2026-10-18' })
  @Matches(DATE)
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateExpenseDto {
  @ApiProperty({ example: 'Publicité Facebook' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @ApiPropertyOptional({ example: 'publicité' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ example: 120 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: '2026-10-18' })
  @Matches(DATE)
  date!: string;

  @ApiPropertyOptional({ description: 'Partner who paid it out of pocket' })
  @IsOptional()
  @IsString()
  paidByPartnerId?: string;
}

export class DateRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @Matches(DATE)
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @Matches(DATE)
  to?: string;
}

export class EntryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional({ enum: PartnerEntryKind })
  @IsOptional()
  @IsEnum(PartnerEntryKind)
  kind?: PartnerEntryKind;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATE)
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATE)
  to?: string;
}

export class ExpenseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATE)
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATE)
  to?: string;
}
