/**
 * NEX ERP - Communication ACL Adapter
 *
 * Typed ParentResourceAclAdapter interface and a registry. Each parent type
 * (sales_order, sample, batch, generic) registers a resolver that returns
 * { tenantId, ownerUserId, allowedScopes, allowedMentionTargets }.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

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
      const tenantUsers = await prisma.tenantScope.findMany({
        where: { organizationId: scope.organizationId },
        select: { userId: true }
      });
      const allowedMentionTargets = tenantUsers.map(u => u.userId);
      if (!allowedMentionTargets.includes(actorUserId)) {
        allowedMentionTargets.push(actorUserId);
      }
      return {
        tenantId: scope.organizationId,
        ownerUserId: scope.userId,
        allowedScopes: ['tenant'],
        allowedMentionTargets
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

import { randomUUID } from 'crypto';

export interface MentionCheckInput {
  contextType: string;
  parentId: string;
  actorUserId: string;
  targetUserId: string;
  targetTenantId: string;
}

export interface PostNoteInput {
  contextType: string;
  parentId: string;
  actorUserId: string;
  content: string;
  mentions: string[];
  idempotencyKey?: string;
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
    if (!r.ok) {
      return { ok: false, allowed: false, code: r.code, reason: r.code };
    }
    const parentTenant = r.ctx.tenantId;
    if (input.targetTenantId && input.targetTenantId !== parentTenant) {
      return { ok: false, allowed: false, code: 'CROSS_TENANT_MENTION', reason: 'CROSS_TENANT_MENTION' };
    }
    if (r.ctx.allowedMentionTargets && r.ctx.allowedMentionTargets.length > 0 && !r.ctx.allowedMentionTargets.includes(input.targetUserId)) {
      return { ok: false, allowed: false, code: 'UNAUTHORIZED_MENTION_TARGET', reason: 'UNAUTHORIZED_MENTION_TARGET' };
    }
    return { ok: true, allowed: true };
  }

  async createNoteWithMentions(input: PostNoteInput, failSimulationHook?: () => void) {
    // 1. Resolve parent ACL
    const aclRes = await this.resolve(input.contextType, input.parentId, input.actorUserId);
    if (!aclRes.ok) {
      const err = new Error(`Parent ACL resolution failed: ${aclRes.code}`);
      (err as any).code = aclRes.code;
      (err as any).reason_code = aclRes.code;
      throw err;
    }
    const parentAcl = aclRes.ctx;

    // 2. Validate mention targets
    const uniqueMentions = Array.from(new Set(input.mentions || []));
    for (const targetUserId of uniqueMentions) {
      if (parentAcl.allowedMentionTargets && parentAcl.allowedMentionTargets.length > 0) {
        if (!parentAcl.allowedMentionTargets.includes(targetUserId)) {
          const err = new Error(`Mention target ${targetUserId} is unauthorized in this context`);
          (err as any).code = 'UNAUTHORIZED_MENTION_TARGET';
          (err as any).reason_code = 'UNAUTHORIZED_MENTION_TARGET';
          throw err;
        }
      }
    }

    // 3. Single atomic transaction: Notification(s) + OutboxEvent(s) + AuditLog
    return await this.prisma.$transaction(async tx => {
      const noteId = randomUUID();
      const corrId = randomUUID();
      const txId = `tx-note-${noteId}`;
      const idemKey = input.idempotencyKey || `comm-note-${noteId}`;

      const createdNotifications = [];
      for (const targetUserId of uniqueMentions) {
        const notif = await tx.notification.create({
          data: {
            userId: targetUserId,
            title: `Mentioned in ${input.contextType}`,
            body: input.content,
            type: 'COMMUNICATION_MENTION',
            referenceType: input.contextType,
            referenceId: input.parentId
          }
        });
        createdNotifications.push(notif);

        await tx.outboxEvent.create({
          data: {
            eventType: 'communication.mention_notified',
            aggregateType: 'Notification',
            aggregateId: notif.id,
            idempotencyKey: `notif-outbox-${notif.id}`,
            payload: {
              targetUserId,
              actorUserId: input.actorUserId,
              parentId: input.parentId,
              contextType: input.contextType
            },
            correlationId: corrId,
            tenantId: parentAcl.tenantId,
            status: 'PENDING'
          }
        });
      }

      const audit = await tx.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          actorRoleSlug: 'authenticated_user',
          actorPermissionSnapshot: {},
          tenantId: parentAcl.tenantId,
          correlationId: corrId,
          idempotencyKey: idemKey,
          source: 'communication.service',
          entityType: input.contextType,
          entityId: input.parentId,
          action: 'communication.note_created',
          beforeSnapshot: Prisma.JsonNull,
          afterSnapshot: { noteId, content: input.content, mentionCount: uniqueMentions.length },
          txId
        }
      });

      if (failSimulationHook) {
        failSimulationHook();
      }

      return {
        noteId,
        notificationsCount: createdNotifications.length,
        outboxEventsCount: createdNotifications.length,
        auditId: audit.id
      };
    });
  }

  async preventDuplicateNotification(userId: string, referenceId: string): Promise<void> {
    const existing = await this.prisma.notification.findFirst({
      where: { userId, referenceId, type: 'COMMUNICATION_MENTION' }
    });
    if (existing) {
      throw Object.assign(new Error('Duplicate mention notification prevented by deduplication control'), {
        code: 'MENTION_DUPLICATE_NOTIFICATION_REJECTED',
        reason_code: 'MENTION_DUPLICATE_NOTIFICATION_REJECTED',
        gateId: 'communication_acl'
      });
    }
  }
}
