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
  async resolve(parentId, actorUserId) {
    if (!parentId) return null;
    return {
      tenantId: `tenant-of-${parentId}`,
      ownerUserId: actorUserId,
      allowedScopes: ['tenant'],
      allowedMentionTargets: [actorUserId]
    };
  }
};

const salesOrderAdapter: ParentResourceAclAdapter = {
  contextType: 'sales_order',
  async resolve(parentId, actorUserId) {
    if (!parentId) return null;
    return {
      tenantId: `tenant-of-${parentId}`,
      ownerUserId: actorUserId,
      allowedScopes: ['tenant', 'division'],
      allowedMentionTargets: [actorUserId]
    };
  }
};

const sampleAdapter: ParentResourceAclAdapter = {
  contextType: 'sample',
  async resolve(parentId, actorUserId) {
    if (!parentId) return null;
    return {
      tenantId: `tenant-of-${parentId}`,
      ownerUserId: actorUserId,
      allowedScopes: ['tenant'],
      allowedMentionTargets: [actorUserId]
    };
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

  async canMention(input: MentionCheckInput): Promise<{ ok: true } | { ok: false; code: string }> {
    const r = await this.resolve(input.contextType, input.parentId, input.actorUserId);
    if (!r.ok) return { ok: false, code: r.code };
    if (input.targetTenantId !== r.ctx.tenantId && !r.ctx.allowedMentionTargets.includes(input.targetUserId)) {
      return { ok: false, code: 'CROSS_TENANT_MENTION' };
    }
    return { ok: true };
  }
}
