/**
 * Shape attached to `request.user` after the access token is validated.
 * Roles and permissions are resolved per-request so revocation is immediate.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';
