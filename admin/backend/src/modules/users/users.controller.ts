import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../audit/audit.service';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @RequirePermissions('user:create')
  async create(@Body() dto: CreateUserDto, @CurrentUser('id') actorId: string) {
    const user = await this.usersService.create(dto);
    await this.auditService.record({
      userId: actorId,
      action: 'user.created',
      entity: 'User',
      entityId: user.id,
    });
    return user;
  }

  @Get()
  @RequirePermissions('user:read')
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('user:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') actorId: string,
  ) {
    const user = await this.usersService.update(id, dto, actorId);
    await this.auditService.record({
      userId: actorId,
      action: 'user.updated',
      entity: 'User',
      entityId: id,
    });
    return user;
  }

  @Patch(':id/roles')
  @RequirePermissions('user:update')
  async assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser('id') actorId: string,
  ) {
    const user = await this.usersService.assignRoles(id, dto.roleIds);
    await this.auditService.record({
      userId: actorId,
      action: 'user.roles_changed',
      entity: 'User',
      entityId: id,
      metadata: { roleIds: dto.roleIds },
    });
    return user;
  }

  @Patch(':id/password')
  @RequirePermissions('user:update')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser('id') actorId: string,
  ) {
    const result = await this.usersService.resetPassword(id, dto.password);
    await this.auditService.record({
      userId: actorId,
      action: 'user.password_reset',
      entity: 'User',
      entityId: id,
    });
    return result;
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  async remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    const result = await this.usersService.remove(id, actorId);
    await this.auditService.record({
      userId: actorId,
      action: 'user.deleted',
      entity: 'User',
      entityId: id,
    });
    return result;
  }
}
