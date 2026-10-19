import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponse, toRoleResponse } from './role.mapper';
import { RolesRepository, RoleWithPermissions } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async findAll(): Promise<RoleResponse[]> {
    const roles = await this.rolesRepository.findAll();
    return roles.map(toRoleResponse);
  }

  async findOne(id: string): Promise<RoleResponse> {
    return toRoleResponse(await this.getOrThrow(id));
  }

  async create(dto: CreateRoleDto): Promise<RoleResponse> {
    const existing = await this.rolesRepository.findByName(dto.name);
    if (existing) {
      throw new BadRequestException({
        message: 'A role with this name already exists',
        code: 'ROLE_NAME_TAKEN',
      });
    }
    const role = await this.rolesRepository.create(
      { name: dto.name, description: dto.description },
      dto.permissionIds ?? [],
    );
    return toRoleResponse(role);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponse> {
    await this.getOrThrow(id);
    const { permissionIds, ...rest } = dto;
    const updated = await this.rolesRepository.update(id, rest);
    const withPerms = permissionIds
      ? await this.rolesRepository.replacePermissions(id, permissionIds)
      : updated;
    return toRoleResponse(withPerms);
  }

  async setPermissions(
    id: string,
    permissionIds: string[],
  ): Promise<RoleResponse> {
    await this.getOrThrow(id);
    const role = await this.rolesRepository.replacePermissions(
      id,
      permissionIds,
    );
    return toRoleResponse(role);
  }

  async remove(id: string): Promise<{ id: string }> {
    const role = await this.getOrThrow(id);
    if (role.isSystem) {
      throw new ForbiddenException({
        message: 'System roles cannot be deleted',
        code: 'SYSTEM_ROLE_PROTECTED',
      });
    }
    if (role._count.users > 0) {
      throw new BadRequestException({
        message: 'Cannot delete a role that is assigned to users',
        code: 'ROLE_IN_USE',
      });
    }
    await this.rolesRepository.delete(id);
    return { id };
  }

  private async getOrThrow(id: string): Promise<RoleWithPermissions> {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException({
        message: 'Role not found',
        code: 'ROLE_NOT_FOUND',
      });
    }
    return role;
  }
}
