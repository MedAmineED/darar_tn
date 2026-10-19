import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../audit/audit.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @RequirePermissions('role:read')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('role:read')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('role:create')
  async create(@Body() dto: CreateRoleDto, @CurrentUser('id') actorId: string) {
    const role = await this.rolesService.create(dto);
    await this.auditService.record({
      userId: actorId,
      action: 'role.created',
      entity: 'Role',
      entityId: role.id,
    });
    return role;
  }

  @Patch(':id')
  @RequirePermissions('role:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser('id') actorId: string,
  ) {
    const role = await this.rolesService.update(id, dto);
    await this.auditService.record({
      userId: actorId,
      action: 'role.updated',
      entity: 'Role',
      entityId: id,
    });
    return role;
  }

  @Patch(':id/permissions')
  @RequirePermissions('role:update')
  async setPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser('id') actorId: string,
  ) {
    const role = await this.rolesService.setPermissions(id, dto.permissionIds);
    await this.auditService.record({
      userId: actorId,
      action: 'role.permissions_changed',
      entity: 'Role',
      entityId: id,
      metadata: { permissionIds: dto.permissionIds },
    });
    return role;
  }

  @Delete(':id')
  @RequirePermissions('role:delete')
  async remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    const result = await this.rolesService.remove(id);
    await this.auditService.record({
      userId: actorId,
      action: 'role.deleted',
      entity: 'Role',
      entityId: id,
    });
    return result;
  }
}
