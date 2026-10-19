import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Requires the current user to have at least one of the given role names. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
