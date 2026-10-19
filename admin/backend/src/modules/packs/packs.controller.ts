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
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../audit/audit.service';
import { CreatePackDto, PackQueryDto, UpdatePackDto } from './dto/pack.dto';
import { PacksService, UploadedPackImage } from './packs.service';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

@ApiTags('Packs')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('packs')
export class PacksController {
  constructor(
    private readonly packs: PacksService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions('pack:read')
  findAll(@Query() query: PackQueryDto) {
    return this.packs.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('pack:read')
  findOne(@Param('id') id: string) {
    return this.packs.findOne(id);
  }

  @Post()
  @RequirePermissions('pack:create')
  async create(@Body() dto: CreatePackDto, @CurrentUser('id') actorId: string) {
    const pack = await this.packs.create(dto);
    await this.audit.record({
      userId: actorId,
      action: 'pack.created',
      entity: 'Pack',
      entityId: pack.id,
      metadata: { nameFr: pack.nameFr, price: pack.price },
    });
    return pack;
  }

  @Patch(':id')
  @RequirePermissions('pack:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePackDto,
    @CurrentUser('id') actorId: string,
  ) {
    const pack = await this.packs.update(id, dto);
    await this.audit.record({
      userId: actorId,
      action: 'pack.updated',
      entity: 'Pack',
      entityId: id,
      metadata: { price: pack.price, status: pack.status },
    });
    return pack;
  }

  @Post(':id/image')
  @RequirePermissions('pack:update')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  setImage(
    @Param('id') id: string,
    @UploadedFile() file: UploadedPackImage | undefined,
  ) {
    if (!file || !ALLOWED_MIME.has(file.mimetype))
      throw new BadRequestException({
        message: 'Only image files are allowed',
        code: 'INVALID_FILE_TYPE',
      });
    return this.packs.setImage(id, file);
  }

  @Delete(':id')
  @RequirePermissions('pack:delete')
  async remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    const result = await this.packs.remove(id);
    await this.audit.record({
      userId: actorId,
      action: result.archived ? 'pack.archived' : 'pack.deleted',
      entity: 'Pack',
      entityId: id,
    });
    return result;
  }
}
