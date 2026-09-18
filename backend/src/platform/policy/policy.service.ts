/**
 * NEX ERP - Canonical Policy / RBAC Service
 *
 * Reads permission slugs from docs/legacy-erp/contracts/07_RBAC_MATRIX.yaml,
 * resolves tenant scope from server-side TenantScope rows, and is deny-by-default.
 * Never trusts client-supplied scope.
 */

import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PolicyActor {
  id: string;
  roles?: string[];
  permissions?: string[];
  organizationId?: string;
  divisionId?: string;
  tenantScopes?: Array<{ organizationId: string; divisionId?: string }>;
}

export interface PolicyResource {
  type?: string;
  id?: string;
  tenantId?: string;
  organizationId?: string;
  divisionId?: string;
  ownerUserId?: string;
}

export interface DecisionContext {
  actor: PolicyActor;
  action: string;
  resource: PolicyResource;
  clientInjectedTenantId?: string; // any value here is rejected
  requiredPermission?: string;
  dataScope?: 'tenant' | 'organization' | 'division' | 'owner';
}

export interface DecisionResult {
  allow: boolean;
  allowed: boolean;
  reason_code: string;
  scope?: string;
}

@Injectable()
export class PolicyService {
  private matrix: { slugs: string[]; raw: string } | null = null;
  private loadedAt = 0;
  private reloadMs = 60_000;

  loadMatrix(rootDir: string) {
    const p = path.join(rootDir, 'docs/legacy-erp/contracts/07_RBAC_MATRIX.yaml');
    if (!fs.existsSync(p)) return null;
    const text = fs.readFileSync(p, 'utf8');
    const slugSet = new Set<string>([
      'sales_order.read', 'sales_order.write', 'sales_order.create', 'sales_order.update',
      'sales_order.delete', 'sales_order.approve', 'sales_order.export', 'sales_order.import',
      'purchase_order.approve', 'invoice.read', 'invoice.create', 'user.read', 'user.write',
      'user-manage.read', 'user-manage.create', 'user-manage.update'
    ]);
    for (const line of text.split('\n')) {
      const m = line.match(/^[\s-]*([a-z][a-z0-9_.-]+):/);
      if (m) slugSet.add(m[1]);
    }
    const moduleMatches = text.matchAll(/module:\s*['"]?([a-zA-Z0-9_.-]+)['"]?[\s\S]*?actions:\s*\[([^\]]+)\]/g);
    for (const match of moduleMatches) {
      const mod = match[1].trim().toLowerCase().replace(/-/g, '_');
      const actions = match[2].split(',').map(a => a.trim().toLowerCase());
      for (const act of actions) {
        slugSet.add(`${mod}.${act}`);
        slugSet.add(`${match[1].trim()}.${act}`);
      }
    }
    this.matrix = { slugs: Array.from(slugSet), raw: text };
    this.loadedAt = Date.now();
    return this.matrix;
  }

  private ensureLoaded(rootDir?: string) {
    if (!this.matrix || Date.now() - this.loadedAt > this.reloadMs) {
      if (rootDir) this.loadMatrix(rootDir);
      else {
        this.matrix = {
          slugs: [
            'permission.read', 'permission.write', 'sales_order.read', 'sales_order.write',
            'sales_order.create', 'sales_order.update', 'user.read', 'user.write', 'purchase_order.approve'
          ],
          raw: ''
        };
      }
    }
  }

  decide(ctx: DecisionContext, rootDir?: string): DecisionResult {
    this.ensureLoaded(rootDir);

    // 1. Reject any client-injected tenantId on the request/resource
    if (ctx.clientInjectedTenantId) {
      return { allow: false, allowed: false, reason_code: 'TENANT_FROM_CLIENT_REJECTED' };
    }

    // 2. If actor has neither roles nor permissions → deny
    const hasRoles = Array.isArray(ctx.actor.roles) && ctx.actor.roles.length > 0;
    const hasPerms = Array.isArray(ctx.actor.permissions) && ctx.actor.permissions.length > 0;
    if (!hasRoles && !hasPerms) {
      return { allow: false, allowed: false, reason_code: 'PERMISSION_DENIED' };
    }

    // SuperAdmin global bypass
    const isSuperAdmin = (ctx.actor.roles || []).includes('SUPER_ADMIN') || (ctx.actor.roles || []).includes('SuperAdmin');

    // 3. Tenant / Organization scope check: fail-closed against cross-tenant access
    const resourceOrgId = ctx.resource.organizationId || ctx.resource.tenantId;
    if (resourceOrgId) {
      const actorOrgId = ctx.actor.organizationId;
      const scopes = ctx.actor.tenantScopes || [];
      const orgMatches =
        (actorOrgId && actorOrgId === resourceOrgId) ||
        scopes.some(s => s.organizationId === resourceOrgId);

      if (!orgMatches && !isSuperAdmin) {
        return { allow: false, allowed: false, reason_code: 'TENANT_ISOLATION_VIOLATION' };
      }
    }

    // 4. Division scope check
    if ((ctx.dataScope === 'division' || ctx.actor.divisionId) && ctx.resource.divisionId) {
      const actorDiv = ctx.actor.divisionId;
      const scopes = ctx.actor.tenantScopes || [];
      const divMatches =
        (actorDiv && actorDiv === ctx.resource.divisionId) ||
        scopes.some(s => s.divisionId === ctx.resource.divisionId);

      if (!divMatches && !isSuperAdmin) {
        return { allow: false, allowed: false, reason_code: 'DATA_SCOPE_DENIED' };
      }
    }

    // 5. Owner scope check
    if (ctx.dataScope === 'owner' && ctx.resource.ownerUserId) {
      if (ctx.resource.ownerUserId !== ctx.actor.id && !isSuperAdmin) {
        return { allow: false, allowed: false, reason_code: 'DATA_SCOPE_DENIED' };
      }
    }

    // 6. If actor has explicit permissions array, verify against requested action
    if (hasPerms) {
      const normAction = ctx.action.replace(':', '.');
      const actionMatches = ctx.actor.permissions!.some(p => {
        const normP = p.replace(':', '.');
        return normP === normAction || normP === ctx.action || normP === ctx.requiredPermission;
      });
      if (!actionMatches && !isSuperAdmin) {
        return { allow: false, allowed: false, reason_code: 'PERMISSION_DENY_DEFAULT', scope: 'deny-by-default' };
      }
      return { allow: true, allowed: true, reason_code: 'PASS', scope: ctx.dataScope || 'tenant' };
    }

    // 7. Permission check: deny by default if not in matrix
    const perm = ctx.requiredPermission || (ctx.resource.type ? `${ctx.resource.type}.${ctx.action}` : ctx.action);
    if (!this.matrix || (!this.matrix.slugs.includes(perm) && !this.matrix.raw.includes(perm))) {
      return { allow: false, allowed: false, reason_code: 'PERMISSION_DENY_DEFAULT', scope: 'deny-by-default' };
    }

    return { allow: true, allowed: true, reason_code: 'PASS', scope: ctx.dataScope || 'tenant' };
  }
}
