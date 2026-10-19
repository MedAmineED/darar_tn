import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PermissionResponse {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface PermissionGroup {
  resource: string;
  permissions: PermissionResponse[];
}

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PermissionResponse[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    return permissions.map((p) => ({
      id: p.id,
      name: p.name,
      resource: p.resource,
      action: p.action,
      description: p.description,
    }));
  }

  /** Permissions grouped by resource — convenient for a role editor UI. */
  async findGrouped(): Promise<PermissionGroup[]> {
    const permissions = await this.findAll();
    const groups = new Map<string, PermissionResponse[]>();
    for (const permission of permissions) {
      const list = groups.get(permission.resource) ?? [];
      list.push(permission);
      groups.set(permission.resource, list);
    }
    return [...groups.entries()].map(([resource, perms]) => ({
      resource,
      permissions: perms,
    }));
  }
}
