import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

/** Admin payload to set the flat delivery fee and free-shipping threshold. */
export class UpdateDeliverySettingDto {
  @ApiProperty({
    minimum: 0,
    maximum: 100000,
    description: 'Flat delivery fee',
  })
  @IsNumber()
  @Min(0)
  @Max(100000)
  fee!: number;

  @ApiProperty({
    minimum: 0,
    maximum: 1000000,
    description: 'Subtotal at/above which delivery is free; 0 disables it',
  })
  @IsNumber()
  @Min(0)
  @Max(1000000)
  freeShippingThreshold!: number;
}
