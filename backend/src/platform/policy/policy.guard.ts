/**
 * NEX ERP - Policy Guard (P05 canonical RBAC + tenant isolation enforcement)
 *
 * Reads @Require(permission-slug, { dataScope: 'owner' }) decorator metadata
 * and delegates to PolicyService.decide(). Never trusts req.body.tenantId.
 */

import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';
import { PolicyService, DecisionContext } from './policy.service';

export const REQUIRE_KEY = 'p05:require';
export const Require = (permission: string, opts?: { dataScope?: 'tenant' | 'organization' | 'division' | 'owner' }) =>
  SetMetadata(REQUIRE_KEY, { permission, dataScope: opts?.dataScope });

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly policy: PolicyService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const meta = this.reflector.getAllAndOverride<{ permission: string; dataScope?: string } | undefined>(REQUIRE_KEY, [
      ctx.getHandler(),
      ctx.getClass()
    ]);
    if (!meta) return false;
    const req = ctx.switchToHttp().getRequest();
    const actor = req.user || { id: 'anonymous', roles: [] };
    const resource = req.params && req.params.id ? { type: ctx.getClass().name.toLowerCase(), id: req.params.id } : { type: ctx.getClass().name.toLowerCase() };
    const decision: DecisionContext = {
      actor,
      action: ctx.getHandler().name,
      resource,
      clientInjectedTenantId: req.body?.tenantId || req.query?.tenantId,
      requiredPermission: meta.permission,
      dataScope: meta.dataScope as 'tenant' | 'organization' | 'division' | 'owner' | undefined || 'tenant'
    };
    const result = this.policy.decide(decision);
    if (!result.allow) {
      // never log user.email / role; only the decision_id (hash of ctx) + gate_id + reason_code
      const decisionId = crypto.createHash('sha256').update(JSON.stringify({ actor: actor.id, action: decision.action, resource: decision.resource })).digest('hex').slice(0, 16);
      console.log(JSON.stringify({
        level: 'info',
        gate_id: 'role_permission_matrix',
        decision_id: decisionId,
        reason_code: result.reason_code
      }));
      return false;
    }
    return true;
  }
}
