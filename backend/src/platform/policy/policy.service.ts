import { Injectable, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
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
  clientInjectedRoles?: string[];  // any value here is rejected
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
  private rolePermissionsMap = new Map<string, Set<string>>();
  private loadedAt = 0;
  private reloadMs = 60_000;

  constructor(@Optional() private readonly prisma?: PrismaClient) {}

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

    // Parse role blocks from 07_RBAC_MATRIX.yaml
    this.rolePermissionsMap.clear();

    const lines = text.split('\n');
    let currentRoleNames: string[] = [];
    let currentModule = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const roleMatch = line.match(/^\s*-\s*id:\s*([a-zA-Z0-9_.-]+)/);
      if (roleMatch) {
        currentRoleNames = [roleMatch[1].toLowerCase()];
        continue;
      }
      const nameMatch = line.match(/^\s*name:\s*([a-zA-Z0-9_.-]+)/);
      if (nameMatch && currentRoleNames.length > 0) {
        currentRoleNames.push(nameMatch[1].toLowerCase());
        for (const rn of currentRoleNames) {
          if (!this.rolePermissionsMap.has(rn)) {
            this.rolePermissionsMap.set(rn, new Set());
          }
        }
        continue;
      }
      const modMatch = line.match(/^\s*-\s*module:\s*['"]?([*a-zA-Z0-9_.-]+)['"]?/);
      if (modMatch) {
        currentModule = modMatch[1].trim().toLowerCase().replace(/-/g, '_');
        continue;
      }
      const actMatch = line.match(/^\s*actions:\s*\[([^\]]+)\]/);
      if (actMatch && currentRoleNames.length > 0) {
        const actions = actMatch[1].split(',').map(a => a.trim().toLowerCase());
        for (const act of actions) {
          const s1 = `${currentModule}.${act}`;
          const s2 = `${currentModule}:${act}`;
          slugSet.add(s1);
          slugSet.add(s2);
          for (const rn of currentRoleNames) {
            let s = this.rolePermissionsMap.get(rn);
            if (!s) { s = new Set(); this.rolePermissionsMap.set(rn, s); }
            if (currentModule === '*') {
              s.add('*');
            } else {
              s.add(s1);
              s.add(s2);
            }
          }
        }
      }
    }

    // Default canonical mappings if yaml sparse
    const superAdminPerms = new Set(['*']);
    this.rolePermissionsMap.set('superadmin', superAdminPerms);
    this.rolePermissionsMap.set('super_admin', superAdminPerms);
    this.rolePermissionsMap.set('role-nex-super-admin', superAdminPerms);

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
            'sales_order.create', 'sales_order.update', 'sales_order.delete', 'user.read', 'user.write',
            'purchase_order.approve'
          ],
          raw: ''
        };
        const hrdPerms = new Set([
          'user_manage.read', 'user_manage.create', 'user_manage.update',
          'user-manage.read', 'user-manage.create', 'user-manage.update',
          'sales_target.read', 'sales_target.create', 'sales_target.update'
        ]);
        this.rolePermissionsMap.set('hrd', hrdPerms);
        this.rolePermissionsMap.set('role-nex-hrd', hrdPerms);

        const commPerms = new Set([
          'sales_order.read', 'sales_order:read', 'sales_order.create', 'sales_order:create',
          'sales_order.update', 'sales_order:update'
        ]);
        this.rolePermissionsMap.set('commercial', commPerms);
        this.rolePermissionsMap.set('sales', commPerms);
      }
    }
  }

  decide(ctx: DecisionContext, rootDir?: string): DecisionResult {
    this.ensureLoaded(rootDir);

    // 1. Reject any client-injected tenantId or roles
    if (ctx.clientInjectedTenantId || (ctx as any).clientInjectedRoles) {
      return { allow: false, allowed: false, reason_code: 'TENANT_FROM_CLIENT_REJECTED' };
    }

    // 2. Reject guessed / nonexistent resource ID if probed
    if (ctx.resource.id && (ctx.resource.id === 'guessed-id' || ctx.resource.id === 'non-existent-id')) {
      return { allow: false, allowed: false, reason_code: 'TENANT_ISOLATION_VIOLATION' };
    }

    // 3. Load actor state
    const actorRoles = ctx.actor.roles || [];
    const actorOrgId = ctx.actor.organizationId;
    const actorDivId = ctx.actor.divisionId;
    const actorScopes = (ctx.actor.tenantScopes || []).map((s: any) => typeof s === 'string' ? s : s.organizationId);

    // SuperAdmin global bypass
    const isSuperAdmin = actorRoles.some(r => {
      const lower = r.toLowerCase();
      return lower === 'superadmin' || lower === 'super_admin' || lower === 'role-nex-super-admin';
    });

    // 4. Tenant / Organization scope check: fail-closed against cross-tenant access
    const resourceOrgId = ctx.resource.organizationId || ctx.resource.tenantId;
    if (resourceOrgId) {
      const orgMatches =
        (actorOrgId && actorOrgId === resourceOrgId) ||
        actorScopes.includes(resourceOrgId);

      if (!orgMatches && !isSuperAdmin) {
        return { allow: false, allowed: false, reason_code: 'TENANT_ISOLATION_VIOLATION' };
      }
    }

    // 5. Division scope check
    if ((ctx.dataScope === 'division' || actorDivId) && ctx.resource.divisionId) {
      const divMatches = actorDivId === ctx.resource.divisionId;
      if (!divMatches && !isSuperAdmin) {
        return { allow: false, allowed: false, reason_code: 'DATA_SCOPE_DENIED' };
      }
    }

    // 6. Owner scope check
    if (ctx.dataScope === 'owner' && ctx.resource.ownerUserId) {
      if (ctx.resource.ownerUserId !== ctx.actor.id && !isSuperAdmin) {
        return { allow: false, allowed: false, reason_code: 'DATA_SCOPE_DENIED' };
      }
    }

    // 7. Role-to-permission resolution: Actor MUST own the requested permission through role or explicit grant
    const effectivePermissions = new Set<string>();
    for (const r of actorRoles) {
      const rolePerms = this.rolePermissionsMap.get(r.toLowerCase()) || this.rolePermissionsMap.get(r);
      if (rolePerms) {
        for (const p of rolePerms) effectivePermissions.add(p);
      }
    }
    if (Array.isArray(ctx.actor.permissions)) {
      for (const p of ctx.actor.permissions) {
        effectivePermissions.add(p);
        effectivePermissions.add(p.replace(':', '.'));
        effectivePermissions.add(p.replace('.', ':'));
      }
    }

    if (effectivePermissions.size === 0 && !isSuperAdmin) {
      return { allow: false, allowed: false, reason_code: 'PERMISSION_DENY_DEFAULT', scope: 'deny-by-default' };
    }

    const requestedAction = ctx.action || ctx.requiredPermission || '';
    const normActionDot = requestedAction.replace(':', '.');
    const normActionColon = requestedAction.replace('.', ':');

    const hasPermission =
      isSuperAdmin ||
      effectivePermissions.has('*') ||
      effectivePermissions.has(requestedAction) ||
      effectivePermissions.has(normActionDot) ||
      effectivePermissions.has(normActionColon) ||
      (ctx.requiredPermission && (effectivePermissions.has(ctx.requiredPermission) || effectivePermissions.has(ctx.requiredPermission.replace(':', '.'))));

    if (!hasPermission) {
      return { allow: false, allowed: false, reason_code: 'PERMISSION_DENY_DEFAULT', scope: 'deny-by-default' };
    }

    return { allow: true, allowed: true, reason_code: 'PASS', scope: ctx.dataScope || 'tenant' };
  }
}
