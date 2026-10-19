import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductImage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { STORAGE_PROVIDER, StorageProvider } from '../storage/storage.types';
import { ProductImageResponse } from './product.mapper';
import { ProductsService } from './products.service';

/** An uploaded file as delivered by Multer (memory storage). */
export interface UploadedImage {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

const IMAGE_FOLDER = 'products';

@Injectable()
export class ProductImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async list(productId: string): Promise<ProductImageResponse[]> {
    await this.productsService.ensureExists(productId);
    const images = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
    return images.map(toImageResponse);
  }

  async upload(
    productId: string,
    files: UploadedImage[],
  ): Promise<ProductImageResponse[]> {
    await this.productsService.ensureExists(productId);
    if (files.length === 0) {
      throw new BadRequestException({
        message: 'No image files were provided',
        code: 'NO_FILES',
      });
    }

    const existingCount = await this.prisma.productImage.count({
      where: { productId },
    });

    let sortOrder = existingCount;
    let hasPrimary = existingCount > 0;

    for (const file of files) {
      const stored = await this.storage.save(file.buffer, {
        folder: IMAGE_FOLDER,
        originalName: file.originalname,
        mimeType: file.mimetype,
      });
      await this.prisma.productImage.create({
        data: {
          productId,
          url: stored.url,
          sortOrder,
          isPrimary: !hasPrimary,
        },
      });
      hasPrimary = true;
      sortOrder += 1;
    }

    return this.list(productId);
  }

  async setPrimary(
    productId: string,
    imageId: string,
  ): Promise<ProductImageResponse[]> {
    await this.getImageOrThrow(productId, imageId);
    await this.prisma.$transaction([
      this.prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      }),
      this.prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);
    return this.list(productId);
  }

  async reorder(
    productId: string,
    imageIds: string[],
  ): Promise<ProductImageResponse[]> {
    const images = await this.prisma.productImage.findMany({
      where: { productId },
      select: { id: true },
    });
    const owned = new Set(images.map((i) => i.id));
    if (
      imageIds.length !== owned.size ||
      !imageIds.every((id) => owned.has(id))
    ) {
      throw new BadRequestException({
        message: 'The provided image IDs do not match this product',
        code: 'INVALID_IMAGE_ORDER',
      });
    }
    await this.prisma.$transaction(
      imageIds.map((id, index) =>
        this.prisma.productImage.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.list(productId);
  }

  async remove(
    productId: string,
    imageId: string,
  ): Promise<ProductImageResponse[]> {
    const image = await this.getImageOrThrow(productId, imageId);
    await this.storage.delete(keyFromUrl(image.url));
    await this.prisma.productImage.delete({ where: { id: imageId } });

    // Promote another image to primary if we just removed the primary one.
    if (image.isPrimary) {
      const next = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.productImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }
    return this.list(productId);
  }

  private async getImageOrThrow(
    productId: string,
    imageId: string,
  ): Promise<ProductImage> {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException({
        message: 'Image not found for this product',
        code: 'IMAGE_NOT_FOUND',
      });
    }
    return image;
  }
}

function toImageResponse(image: ProductImage): ProductImageResponse {
  return {
    id: image.id,
    url: image.url,
    altAr: image.altAr,
    altFr: image.altFr,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
  };
}

/** Local-storage URLs map 1:1 to keys by stripping the public prefix. */
function keyFromUrl(url: string): string {
  return url.replace(/^\/uploads\//, '');
}
