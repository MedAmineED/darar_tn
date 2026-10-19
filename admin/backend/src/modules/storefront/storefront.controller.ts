import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { StorefrontCheckoutDto } from './dto/storefront-checkout.dto';
import { StorefrontProductQueryDto } from './dto/storefront-product-query.dto';
import { StorefrontService } from './storefront.service';

/**
 * Public, read-only storefront API consumed by the Next.js storefront.
 * All routes are unauthenticated (`@Public`) and rate-limited.
 */
@ApiTags('Storefront')
@Public()
@Throttle({ default: { limit: 120, ttl: 60_000 } })
@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @Get('delivery')
  getDelivery() {
    return this.storefront.getDelivery();
  }

  @Get('categories')
  getCategories() {
    return this.storefront.getCategories();
  }

  @Get('products')
  getProducts(@Query() query: StorefrontProductQueryDto) {
    return this.storefront.getProducts(query);
  }

  @Get('products/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.storefront.getProductBySlug(slug);
  }

  @Get('packs')
  getPacks() {
    return this.storefront.getPacks();
  }

  @Get('packs/:slug')
  getPack(@Param('slug') slug: string) {
    return this.storefront.getPackBySlug(slug);
  }

  // Stricter limit for the write endpoint to curb spam/abuse.
  @Post('orders')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Body() dto: StorefrontCheckoutDto, @Req() req: Request) {
    return this.storefront.createOrder(dto, req.ip);
  }
}
