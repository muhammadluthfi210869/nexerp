/**
 * NEX ERP - Tenant Scope Service
 *
 * applyTenantFilter / applyOwnerFilter / maskField are pure helpers; the actual
 * query constraints are applied via Prisma `where` clause composed by the caller.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface ActorContext {
  userId: string;
  organizationId: string;
  divisionId?: string;
  departmentId?: string;
}

@Injectable()
export class ScopeService {
  constructor(private readonly prisma: PrismaClient) {}

  async resolveActorScopes(userId: string): Promise<ActorContext[]> {
    const rows = await this.prisma.tenantScope.findMany({
      where: {
        userId,
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }]
      }
    });
    return rows.map(r => ({
      userId: r.userId,
      organizationId: r.organizationId,
      divisionId: r.divisionId || undefined,
      departmentId: r.departmentId || undefined
    }));
  }

  applyTenantFilter<T extends { organizationId?: string }>(q: any, ctx: ActorContext): T {
    if (q && typeof q.where === 'object') {
      q.where = { ...q.where, organizationId: ctx.organizationId };
    }
    return q;
  }

  applyOwnerFilter<T extends { ownerUserId?: string }>(q: any, ctx: ActorContext): T {
    if (q && typeof q.where === 'object') {
      q.where = { ...q.where, ownerUserId: ctx.userId };
    }
    return q;
  }

  applyDivisionFilter<T extends { divisionId?: string }>(q: any, ctx: ActorContext): T {
    if (q && typeof q.where === 'object' && ctx.divisionId) {
      q.where = { ...q.where, divisionId: ctx.divisionId };
    }
    return q;
  }

  maskField<T extends Record<string, unknown>>(entity: T, fields: string[], actor: ActorContext): T {
    if (!entity || typeof entity !== 'object') return entity;
    const out: Record<string, unknown> = { ...entity };
    for (const f of fields) {
      if (f in out && entity.ownerUserId !== actor.userId && entity.divisionId !== actor.divisionId) {
        out[f] = '[REDACTED_FIELD_SCOPE_LEAK]';
      }
    }
    return out as T;
  }
}
