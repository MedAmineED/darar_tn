import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderImagesDto {
  @ApiProperty({
    type: [String],
    description: 'Image IDs in the desired display order',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  imageIds!: string[];
}
