import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { OrdersModule } from '../orders/orders.module';
import { PacksModule } from '../packs/packs.module';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

/**
 * Public storefront module. Reuses the products/categories repositories and
 * the OrdersService (no duplicated business logic) and exposes only read-only,
 * public-safe data plus a rate-limited cash-on-delivery checkout.
 */
@Module({
  imports: [
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    SettingsModule,
    PacksModule,
  ],
  controllers: [StorefrontController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
