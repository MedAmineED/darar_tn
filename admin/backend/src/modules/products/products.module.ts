import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductImagesController } from './product-images.controller';
import { ProductImagesService } from './product-images.service';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  imports: [CategoriesModule, InventoryModule],
  controllers: [ProductsController, ProductImagesController],
  providers: [ProductsService, ProductsRepository, ProductImagesService],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
