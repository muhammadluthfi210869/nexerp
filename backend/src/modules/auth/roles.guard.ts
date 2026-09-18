import { Injectable, CanActivate, ExecutionContext, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { PolicyService } from '../../platform/policy/policy.service';
import { REQUIRE_KEY } from '../../platform/policy/policy.guard';
import * as crypto from 'crypto';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly policy: PolicyService;

  constructor(
    private readonly reflector: Reflector,
    @Optional() policy?: PolicyService
  ) {
    this.policy = policy || new PolicyService();
  }

  canActivate(context: ExecutionContext): boolean {
    // 1. Check for canonical P05 permission metadata first
    const requireMeta = this.reflector.getAllAndOverride<{ permission: string; dataScope?: string } | undefined>(
      REQUIRE_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requireMeta) {
      return this.evaluatePermissionPolicy(context, requireMeta);
    }

    // 2. Legacy / role-based metadata check
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userRoles: UserRole[] = user.roles || [];

    // Global bypass for SUPER_ADMIN or DIRECTOR per production-light policy
    if (userRoles.includes(UserRole.SUPER_ADMIN) || userRoles.includes(UserRole.DIRECTOR)) {
      return true;
    }

    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    if (!hasRole) {
      const decisionId = crypto
        .createHash('sha256')
        .update(JSON.stringify({ actor: user.id, required: requiredRoles }))
        .digest('hex')
        .slice(0, 16);
      console.log(JSON.stringify({
        level: 'warn',
        gate_id: 'roles_guard',
        decision_id: decisionId,
        reason_code: 'ROLE_DENIED'
      }));
    }
    return hasRole;
  }

  private evaluatePermissionPolicy(context: ExecutionContext, requireMeta: { permission: string; dataScope?: string }): boolean {
    const req = context.switchToHttp().getRequest();
    const actor = req.user || { id: 'anonymous', roles: [] };
    const resId = req.params?.id;
    const resource = resId ? { type: context.getClass().name.toLowerCase(), id: resId } : { type: context.getClass().name.toLowerCase() };
    const decision = {
      actor,
      action: context.getHandler().name,
      resource,
      clientInjectedTenantId: req.body?.tenantId || req.query?.tenantId,
      requiredPermission: requireMeta.permission,
      dataScope: (requireMeta.dataScope as any) || 'tenant'
    };
    const result = this.policy.decide(decision);
    if (!result.allow) {
      console.log(JSON.stringify({
        level: 'info',
        gate_id: 'role_permission_matrix',
        reason_code: result.reason_code
      }));
      return false;
    }
    return true;
  }
}
