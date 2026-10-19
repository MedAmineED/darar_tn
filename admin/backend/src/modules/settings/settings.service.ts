import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliverySettings } from './delivery-fee';
import { UpdateDeliverySettingDto } from './dto/update-delivery-setting.dto';

const DELIVERY_KEY = 'delivery';
const DEFAULT_DELIVERY: DeliverySettings = { fee: 0, freeShippingThreshold: 0 };

/** Reads/writes store settings held as JSON rows in the `Setting` table. */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDelivery(): Promise<DeliverySettings> {
    const row = await this.prisma.setting.findUnique({
      where: { key: DELIVERY_KEY },
    });
    return row ? this.parseDelivery(row.value) : { ...DEFAULT_DELIVERY };
  }

  async updateDelivery(
    dto: UpdateDeliverySettingDto,
  ): Promise<DeliverySettings> {
    const value: DeliverySettings = {
      fee: dto.fee,
      freeShippingThreshold: dto.freeShippingThreshold,
    };
    const json = JSON.stringify(value);
    await this.prisma.setting.upsert({
      where: { key: DELIVERY_KEY },
      update: { value: json },
      create: { key: DELIVERY_KEY, value: json },
    });
    return value;
  }

  /** Tolerates a missing/corrupt row so a bad setting can never break checkout. */
  private parseDelivery(raw: string): DeliverySettings {
    try {
      const parsed = JSON.parse(raw) as Partial<DeliverySettings>;
      return {
        fee: this.nonNegative(parsed.fee),
        freeShippingThreshold: this.nonNegative(parsed.freeShippingThreshold),
      };
    } catch {
      return { ...DEFAULT_DELIVERY };
    }
  }

  private nonNegative(n: unknown): number {
    return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : 0;
  }
}
