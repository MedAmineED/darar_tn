import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import {
  AuthenticatedUser,
  SUPER_ADMIN_ROLE,
} from '../interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<Request>();
    const authUser = user as AuthenticatedUser | undefined;
    if (!authUser) {
      throw new ForbiddenException({
        message: 'Insufficient role',
        code: 'FORBIDDEN_ROLE',
      });
    }

    const allowed =
      authUser.roles.includes(SUPER_ADMIN_ROLE) ||
      required.some((role) => authUser.roles.includes(role));

    if (!allowed) {
      throw new ForbiddenException({
        message: 'Insufficient role',
        code: 'FORBIDDEN_ROLE',
      });
    }
    return true;
  }
}
