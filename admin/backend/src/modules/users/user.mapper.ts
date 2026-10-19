import {
  AuthenticatedUser,
  SUPER_ADMIN_ROLE,
} from '../../common/interfaces/authenticated-user.interface';
import type { UserWithRoles } from './users.repository';

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: { id: string; name: string }[];
}

/** Public representation of a user (never includes the password hash). */
export function toUserResponse(user: UserWithRoles): UserResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.roles.map((ur) => ({ id: ur.role.id, name: ur.role.name })),
  };
}

/** Flattens roles/permissions for request-time authorization. */
export function toAuthenticatedUser(user: UserWithRoles): AuthenticatedUser {
  const roles = user.roles.map((ur) => ur.role.name);
  const permissions = new Set<string>();
  for (const ur of user.roles) {
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.name);
    }
  }
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    permissions: [...permissions],
    isSuperAdmin: roles.includes(SUPER_ADMIN_ROLE),
  };
}
