import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';

const base = { nameAr: 'كرسي', nameFr: 'Chaise', price: 10 };

describe('product opening stock validation', () => {
  it.each([
    { initialQuantity: -1 },
    { initialQuantity: 1.5 },
    { initialQuantity: null },
    { initialQuantity: 1000000001 },
    { lowStockThreshold: -1 },
    { lowStockThreshold: 1.5 },
    { lowStockThreshold: null },
    { lowStockThreshold: 1000000001 },
    { initialQuantity: 1 },
    { lowStockThreshold: 1 },
    { initialQuantity: 1, stockReason: '   ' },
    { initialQuantity: 1, stockReason: null },
    { stockReason: null },
    { stockReason: 1 },
    { initialQuantity: 1, stockReason: 'a'.repeat(501) },
  ])('rejects invalid opening stock %j', async (stock) => {
    expect(
      await validate(plainToInstance(CreateProductDto, { ...base, ...stock })),
    ).not.toHaveLength(0);
  });

  it.each([
    {},
    { initialQuantity: 0, lowStockThreshold: 0 },
    {
      initialQuantity: 1000000000,
      lowStockThreshold: 1000000000,
      stockReason: 'Initial count',
    },
    { lowStockThreshold: 2, stockReason: 'Reorder policy' },
  ])('accepts opening stock %j', async (stock) => {
    expect(
      await validate(plainToInstance(CreateProductDto, { ...base, ...stock })),
    ).toHaveLength(0);
  });

  it('trims the stock reason before validation', () => {
    const dto = plainToInstance(CreateProductDto, {
      ...base,
      initialQuantity: 1,
      stockReason: '  Count  ',
    });
    expect(dto.stockReason).toBe('Count');
  });

  it.each(['initialQuantity', 'lowStockThreshold', 'stockReason'])(
    'rejects creation-only %s in product updates',
    async (field) => {
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
      await expect(
        pipe.transform(
          { [field]: field === 'stockReason' ? 'Count' : 1 },
          { type: 'body', metatype: UpdateProductDto },
        ),
      ).rejects.toThrow();
    },
  );
});
