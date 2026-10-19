import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../audit/audit.service';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { ProductImagesService, UploadedImage } from './product-images.service';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

function imageFileFilter(
  _req: Request,
  file: { mimetype: string },
  cb: (error: Error | null, accept: boolean) => void,
): void {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException({
        message: 'Only image files are allowed',
        code: 'INVALID_FILE_TYPE',
      }),
      false,
    );
  }
}

@ApiTags('Product Images')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('products/:productId/images')
export class ProductImagesController {
  constructor(
    private readonly imagesService: ProductImagesService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @RequirePermissions('product:read')
  list(@Param('productId') productId: string) {
    return this.imagesService.list(productId);
  }

  @Post()
  @RequirePermissions('product:update')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: imageFileFilter,
    }),
  )
  async upload(
    @Param('productId') productId: string,
    @UploadedFiles() files: UploadedImage[],
    @CurrentUser('id') actorId: string,
  ) {
    const images = await this.imagesService.upload(productId, files ?? []);
    await this.auditService.record({
      userId: actorId,
      action: 'product.images_uploaded',
      entity: 'Product',
      entityId: productId,
      metadata: { count: files?.length ?? 0 },
    });
    return images;
  }

  @Patch(':imageId/primary')
  @RequirePermissions('product:update')
  setPrimary(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.imagesService.setPrimary(productId, imageId);
  }

  @Patch('reorder')
  @RequirePermissions('product:update')
  reorder(
    @Param('productId') productId: string,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.imagesService.reorder(productId, dto.imageIds);
  }

  @Delete(':imageId')
  @RequirePermissions('product:update')
  async remove(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @CurrentUser('id') actorId: string,
  ) {
    const images = await this.imagesService.remove(productId, imageId);
    await this.auditService.record({
      userId: actorId,
      action: 'product.image_deleted',
      entity: 'Product',
      entityId: productId,
      metadata: { imageId },
    });
    return images;
  }
}
