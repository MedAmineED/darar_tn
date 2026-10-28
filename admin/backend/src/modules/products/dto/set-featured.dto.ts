import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsString } from 'class-validator';

export class SetFeaturedDto {
  @ApiProperty({
    type: [String],
    description:
      'Product IDs shown on the homepage, in display order. Products not listed are no longer featured.',
  })
  @IsArray()
  @ArrayMaxSize(48)
  @ArrayUnique()
  @IsString({ each: true })
  productIds!: string[];
}
