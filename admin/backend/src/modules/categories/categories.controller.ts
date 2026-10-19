import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../audit/audit.service';
import { CategoriesService, UploadedCategoryImage } from './categories.service';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @RequirePermissions('category:read')
  findAll(@Query() query: CategoryQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get('tree')
  @RequirePermissions('category:read')
  findTree() {
    return this.categoriesService.findTree();
  }

  @Get(':id')
  @RequirePermissions('category:read')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post('upload-image')
  @RequirePermissions('category:create')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: imageFileFilter,
    }),
  )
  uploadImage(@UploadedFile() file: UploadedCategoryImage) {
    return this.categoriesService.uploadImage(file);
  }

  @Post()
  @RequirePermissions('category:create')
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser('id') actorId: string,
  ) {
    const category = await this.categoriesService.create(dto);
    await this.auditService.record({
      userId: actorId,
      action: 'category.created',
      entity: 'Category',
      entityId: category.id,
    });
    return category;
  }

  @Patch(':id')
  @RequirePermissions('category:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser('id') actorId: string,
  ) {
    const category = await this.categoriesService.update(id, dto);
    await this.auditService.record({
      userId: actorId,
      action: 'category.updated',
      entity: 'Category',
      entityId: id,
    });
    return category;
  }

  @Delete(':id')
  @RequirePermissions('category:delete')
  async remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    const result = await this.categoriesService.remove(id);
    await this.auditService.record({
      userId: actorId,
      action: 'category.deleted',
      entity: 'Category',
      entityId: id,
    });
    return result;
  }
}
