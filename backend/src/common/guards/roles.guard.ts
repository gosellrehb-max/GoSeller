import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ApiException } from '../exceptions/api.exception';
import {
  grantedRoles,
  requestUserFromPayload,
} from '../auth/request-user.roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    const roleSet = new Set(grantedRoles(requestUserFromPayload(user)));
    const allowed = requiredRoles.some((r) => roleSet.has(r));
    if (!allowed) {
      throw ApiException.forbidden('You do not have permission to perform this action.');
    }
    return true;
  }
}
