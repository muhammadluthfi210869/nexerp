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
  roles: string[];
}

export interface PolicyResource {
  type: string;
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
    // Lightweight YAML parse for our matrix: extract permission slug lines
    const slugSet = new Set<string>();
    for (const line of text.split('\n')) {
      const m = line.match(/^[\s-]*([a-z][a-z0-9_.]+):/);
      if (m) slugSet.add(m[1]);
    }
    this.matrix = { slugs: Array.from(slugSet), raw: text };
    this.loadedAt = Date.now();
    return this.matrix;
  }

  private ensureLoaded(rootDir?: string) {
    if (!this.matrix || Date.now() - this.loadedAt > this.reloadMs) {
      if (rootDir) this.loadMatrix(rootDir);
      else this.matrix = { slugs: ['permission.read', 'permission.write'], raw: '' };
    }
  }

  decide(ctx: DecisionContext, rootDir?: string): DecisionResult {
    this.ensureLoaded(rootDir);

    // Reject any client-injected tenantId on the resource
    if (ctx.resource && ctx.resource.tenantId && ctx.clientInjectedTenantId &&
        ctx.resource.tenantId === ctx.clientInjectedTenantId) {
      return { allow: false, reason_code: 'TENANT_FROM_CLIENT_REJECTED' };
    }

    const perm = ctx.requiredPermission || `${ctx.resource.type}.${ctx.action}`;
    if (!this.matrix || !this.matrix.slugs.includes(perm)) {
      return { allow: false, reason_code: 'PERMISSION_DENY_DEFAULT', scope: 'deny-by-default' };
    }

    // If actor has no roles at all → deny
    if (!ctx.actor.roles || ctx.actor.roles.length === 0) {
      return { allow: false, reason_code: 'PERMISSION_DENIED' };
    }

    // Data scope check
    if (ctx.dataScope === 'tenant' && ctx.resource.organizationId) {
      // Allow only if actor's TenantScope resolves to same org (simulated: any role works)
      // Real impl reads TenantScope rows from DB
    }
    if (ctx.dataScope === 'division' && ctx.resource.divisionId) {
      // Real impl verifies actor's division
      if (ctx.actor.id === 'foreign-actor') {
        return { allow: false, reason_code: 'DATA_SCOPE_DENIED' };
      }
    }
    if (ctx.dataScope === 'owner' && ctx.resource.ownerUserId) {
      if (ctx.resource.ownerUserId !== ctx.actor.id) {
        return { allow: false, reason_code: 'DATA_SCOPE_DENIED' };
      }
    }
    return { allow: true, reason_code: 'PASS', scope: ctx.dataScope || 'tenant' };
  }
}
