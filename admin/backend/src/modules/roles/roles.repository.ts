import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const roleWithPermissionsInclude = {
  permissions: { include: { permission: true } },
  _count: { select: { users: true } },
} satisfies Prisma.RoleInclude;

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: typeof roleWithPermissionsInclude;
}>;

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<RoleWithPermissions[]> {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: roleWithPermissionsInclude,
    });
  }

  findById(id: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: roleWithPermissionsInclude,
    });
  }

  findByName(name: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { name },
      include: roleWithPermissionsInclude,
    });
  }

  create(
    data: Prisma.RoleCreateInput,
    permissionIds: string[],
  ): Promise<RoleWithPermissions> {
    return this.prisma.role.create({
      data: {
        ...data,
        permissions: {
          create: permissionIds.map((permissionId) => ({
            permission: { connect: { id: permissionId } },
          })),
        },
      },
      include: roleWithPermissionsInclude,
    });
  }

  update(
    id: string,
    data: Prisma.RoleUpdateInput,
  ): Promise<RoleWithPermissions> {
    return this.prisma.role.update({
      where: { id },
      data,
      include: roleWithPermissionsInclude,
    });
  }

  async replacePermissions(
    id: string,
    permissionIds: string[],
  ): Promise<RoleWithPermissions> {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
        skipDuplicates: true,
      }),
    ]);
    return this.findById(id) as Promise<RoleWithPermissions>;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }
}
