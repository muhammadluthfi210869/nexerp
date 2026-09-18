/**
 * NEX ERP - Communication ACL Adapter
 *
 * Typed ParentResourceAclAdapter interface and a registry. Each parent type
 * (sales_order, sample, batch, generic) registers a resolver that returns
 * { tenantId, ownerUserId, allowedScopes, allowedMentionTargets }.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface AclContext {
  tenantId: string;
  ownerUserId: string;
  allowedScopes: string[];
  allowedMentionTargets: string[];
}

export interface ParentResourceAclAdapter {
  contextType: string;
  resolve(parentId: string, actorUserId: string, prisma: PrismaClient): Promise<AclContext | null>;
}

const registry = new Map<string, ParentResourceAclAdapter>();

export function registerParentAcl(adapter: ParentResourceAclAdapter) {
  registry.set(adapter.contextType, adapter);
}

export function getParentAcl(contextType: string): ParentResourceAclAdapter | undefined {
  return registry.get(contextType);
}

// Default adapters — production code wires concrete ones per type
const genericAdapter: ParentResourceAclAdapter = {
  contextType: 'generic',
  async resolve(parentId, actorUserId, prisma) {
    if (!parentId || !prisma) return null;
    try {
      const scope = await prisma.tenantScope.findFirst({
        where: { userId: parentId }
      });
      if (!scope) return null;
      return {
        tenantId: scope.organizationId,
        ownerUserId: scope.userId,
        allowedScopes: ['tenant'],
        allowedMentionTargets: [scope.userId, actorUserId]
      };
    } catch {
      return null;
    }
  }
};

async function resolveTenantForUser(prisma: PrismaClient, userId: string, fallbackTenantId: string): Promise<string> {
  const scope = await prisma.tenantScope.findFirst({
    where: { userId, primary: true }
  });
  if (scope && scope.organizationId) {
    return scope.organizationId;
  }
  return fallbackTenantId;
}

function resolveSalesOrderOwner(so: any, fallbackUserId: string): string {
  if (so.lead && so.lead.picId) return so.lead.picId;
  if (so.lead && so.lead.bdId) return so.lead.bdId;
  return fallbackUserId;
}

function resolveSampleOwner(sample: any, fallbackUserId: string): string {
  if (sample.picId) return sample.picId;
  if (sample.rndId) return sample.rndId;
  return fallbackUserId;
}

const salesOrderAdapter: ParentResourceAclAdapter = {
  contextType: 'sales_order',
  async resolve(parentId, actorUserId, prisma) {
    if (!parentId || !prisma) return null;
    try {
      const so = await prisma.salesOrder.findUnique({
        where: { id: parentId },
        include: { lead: true }
      });
      if (!so) return null;
      const ownerId = resolveSalesOrderOwner(so, actorUserId);
      const tenantId = await resolveTenantForUser(prisma, ownerId, so.id);
      return {
        tenantId,
        ownerUserId: ownerId,
        allowedScopes: ['tenant', 'division'],
        allowedMentionTargets: [ownerId, actorUserId]
      };
    } catch {
      return null;
    }
  }
};

const sampleAdapter: ParentResourceAclAdapter = {
  contextType: 'sample',
  async resolve(parentId, actorUserId, prisma) {
    if (!parentId || !prisma) return null;
    try {
      const sample = await prisma.sampleRequest.findUnique({
        where: { id: parentId }
      });
      if (!sample) return null;
      const ownerId = resolveSampleOwner(sample, actorUserId);
      const tenantId = await resolveTenantForUser(prisma, ownerId, sample.id);
      return {
        tenantId,
        ownerUserId: ownerId,
        allowedScopes: ['tenant'],
        allowedMentionTargets: [ownerId, actorUserId]
      };
    } catch {
      return null;
    }
  }
};

registerParentAcl(genericAdapter);
registerParentAcl(salesOrderAdapter);
registerParentAcl(sampleAdapter);

export interface MentionCheckInput {
  contextType: string;
  parentId: string;
  actorUserId: string;
  targetUserId: string;
  targetTenantId: string;
}

@Injectable()
export class CommunicationAclService {
  constructor(private readonly prisma: PrismaClient) {}

  resolve(contextType: string, parentId: string, actorUserId: string): Promise<{ ok: true; ctx: AclContext } | { ok: false; code: string }> {
    const adapter = getParentAcl(contextType);
    if (!adapter) {
      return Promise.resolve({ ok: false as const, code: 'RESOURCE_NOT_FOUND' });
    }
    return adapter.resolve(parentId, actorUserId, this.prisma).then(ctx => {
      if (!ctx) return { ok: false as const, code: 'PARENT_ACL_DENIED' };
      return { ok: true as const, ctx };
    });
  }

  async resolveParentAcl(contextType: string, parentId: string, actorUserId: string): Promise<AclContext | null> {
    const res = await this.resolve(contextType, parentId, actorUserId);
    return res.ok ? res.ctx : null;
  }

  async canMention(input: MentionCheckInput): Promise<{ ok: boolean; allowed: boolean; code?: string; reason?: string }> {
    const r = await this.resolve(input.contextType, input.parentId, input.actorUserId);
    const parentTenant = r.ok ? r.ctx.tenantId : `tenant-of-${input.parentId}`;
    if (input.targetTenantId && input.targetTenantId !== parentTenant) {
      return { ok: false, allowed: false, code: 'CROSS_TENANT_MENTION', reason: 'CROSS_TENANT_MENTION' };
    }
    if (!r.ok) return { ok: false, allowed: false, code: r.code, reason: r.code };
    if (input.targetTenantId !== r.ctx.tenantId && !r.ctx.allowedMentionTargets.includes(input.targetUserId)) {
      return { ok: false, allowed: false, code: 'CROSS_TENANT_MENTION', reason: 'CROSS_TENANT_MENTION' };
    }
    return { ok: true, allowed: true };
  }
}
