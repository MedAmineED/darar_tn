import type { RoleWithPermissions } from './roles.repository';

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: { id: string; name: string; resource: string; action: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export function toRoleResponse(role: RoleWithPermissions): RoleResponse {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    userCount: role._count.users,
    permissions: role.permissions.map((rp) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      resource: rp.permission.resource,
      action: rp.permission.action,
    })),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
