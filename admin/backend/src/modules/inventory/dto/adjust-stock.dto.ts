import { Transform } from 'class-transformer';
import {
  IsInt,
  ValidateIf,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotEquals,
} from 'class-validator';

export class AdjustStockDto {
  @IsInt() @Min(-1000000000) @Max(1000000000) @NotEquals(0) delta!: number;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(1000000000)
  lowStockThreshold?: number;
}
export class ThresholdDto {
  @IsInt() @Min(0) @Max(1000000000) lowStockThreshold!: number;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}
