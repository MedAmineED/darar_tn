import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionsService } from './permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('role:read')
  @ApiQuery({ name: 'grouped', required: false, type: Boolean })
  findAll(@Query('grouped') grouped?: string) {
    return grouped === 'true'
      ? this.permissionsService.findGrouped()
      : this.permissionsService.findAll();
  }
}
