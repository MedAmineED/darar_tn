import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  Max,
  Min,
  ValidateNested,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DashboardQueryDto } from '../../dashboard/dto/dashboard-query.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const ID = /^[A-Za-z0-9_-]{8,64}$/;

export class CollectViewDto {
  @ApiProperty({ example: '/shop' })
  @IsString()
  @MaxLength(500)
  path!: string;

  @ApiProperty({ description: 'Milliseconds since the page was viewed' })
  @IsInt()
  @Min(0)
  @Max(86_400_000)
  ago!: number;
}

/**
 * One batched beacon per visitor: the browser queues page views and sends
 * them together (every few pages / seconds, and when the tab is hidden).
 * Client clocks are never trusted — times are relative ("ago") to receipt.
 */
export class CollectDto {
  @ApiProperty({ description: 'Random session id (client generated)' })
  @Matches(ID)
  sid!: string;

  @ApiProperty({ description: 'Random visitor id (client generated)' })
  @Matches(ID)
  vid!: string;

  @ApiPropertyOptional({ description: 'External referrer host' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ref?: string;

  @ApiProperty({ type: [CollectViewDto], maxItems: 20 })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CollectViewDto)
  views!: CollectViewDto[];

  @ApiPropertyOptional({ description: 'Milliseconds since last activity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400_000)
  activeAgo?: number;
}

export class TrafficQueryDto extends DashboardQueryDto {
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], default: 'day' })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month';
}

export class SessionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @ApiPropertyOptional({ example: 'TN' })
  @IsOptional()
  @Matches(/^[A-Z]{2}$/)
  country?: string;

  @ApiPropertyOptional({ enum: ['mobile', 'tablet', 'desktop'] })
  @IsOptional()
  @IsIn(['mobile', 'tablet', 'desktop'])
  device?: string;

  @ApiPropertyOptional({ description: 'Only sessions that viewed this path' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  path?: string;
}
