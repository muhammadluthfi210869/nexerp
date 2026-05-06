import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { User } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;

    if (!user) {
      console.warn(`[RolesGuard] No user found in request`);
      return false;
    }

    console.log(
      `[RolesGuard] User: ${user.email}, Roles: ${JSON.stringify(user.roles)}, Required: ${JSON.stringify(requiredRoles)}`,
    );

    // Super admin and Director can access everything (Director view is filtered in UI)
    if (
      user.roles.includes(UserRole.SUPER_ADMIN) ||
      user.roles.includes(UserRole.DIRECTOR)
    ) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      console.error(`[RolesGuard] Authorization failed for ${user.email}`);
    }
    return hasRole;
  }
}
