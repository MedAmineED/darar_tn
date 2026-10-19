import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<Request>();
    const authUser = user as AuthenticatedUser | undefined;
    if (!authUser) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        code: 'FORBIDDEN_PERMISSION',
      });
    }

    if (authUser.isSuperAdmin) {
      return true;
    }

    const granted = new Set(authUser.permissions);
    const hasAll = required.every((perm) => granted.has(perm));
    if (!hasAll) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        code: 'FORBIDDEN_PERMISSION',
      });
    }
    return true;
  }
}
