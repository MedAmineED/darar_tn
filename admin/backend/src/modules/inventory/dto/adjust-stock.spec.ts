import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdjustStockDto, ThresholdDto } from './adjust-stock.dto';

describe('stock adjustment validation', () => {
  it.each([
    { delta: 0, reason: 'count' },
    { delta: 1.5, reason: 'count' },
    { delta: 1, reason: '   ' },
    { delta: 1, reason: 'count', lowStockThreshold: -1 },
    { delta: 1, reason: 'count', lowStockThreshold: null },
    { delta: 1000000001, reason: 'count' },
  ])('rejects an invalid adjustment %j', async (input) => {
    expect(
      (await validate(plainToInstance(AdjustStockDto, input))).length,
    ).toBeGreaterThan(0);
  });
  it('accepts a signed adjustment and trims its required reason', async () => {
    const dto = plainToInstance(AdjustStockDto, {
      delta: -3,
      reason: '  Damaged in warehouse  ',
      lowStockThreshold: 2,
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.reason).toBe('Damaged in warehouse');
  });
  it('requires a reason for threshold-only changes', async () => {
    expect(
      (await validate(plainToInstance(ThresholdDto, { lowStockThreshold: 2 })))
        .length,
    ).toBeGreaterThan(0);
  });
});
