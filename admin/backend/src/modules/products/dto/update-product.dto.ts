import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, [
    'initialQuantity',
    'lowStockThreshold',
    'stockReason',
  ] as const),
) {}
