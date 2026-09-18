/**
 * NEX ERP - Audit Service (immutable audit log + transactional withAudit)
 *
 * withAudit runs the caller's mutation function and audit row write in a single
 * Prisma $transaction. The audit_immutable trigger (migration 20260918) enforces
 * no UPDATE/DELETE on audit_logs. The txId is captured via SET LOCAL.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface AuditInput {
  actorUserId?: string;
  actorRoleSlug?: string;
  actorPermissionSnapshot: unknown;
  tenantId?: string;
  correlationId: string;
  idempotencyKey?: string;
  source: string;
  entityType: string;
  entityId: string;
  entityVersion?: number;
  action: string;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Capture a transaction id by issuing SET LOCAL inside the same tx.
   * Caller MUST pass `tx` from `prisma.$transaction(async tx => ...)`.
   */
  async withAudit<T>(
    tx: Prisma.TransactionClient,
    audit: AuditInput,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { deferAudit?: boolean }
  ): Promise<T> {
    if (options?.deferAudit) {
      throw new Error('AUDIT_NOT_ATOMIC: audit must be written in the same transaction as the mutation');
    }
    const txId = `audit:${randomUUID()}`;
    // Use raw SQL to capture txId within the same transaction.
    await tx.$executeRawUnsafe(`SET LOCAL application_name = '${txId}'`);
    const readBack = await tx.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT current_setting('application_name') AS name`
    );
    const realTxId = readBack[0]?.name || txId;
    const result = await fn(tx);
    await tx.auditLog.create({
      data: {
        actorUserId: audit.actorUserId || null,
        actorRoleSlug: audit.actorRoleSlug || null,
        actorPermissionSnapshot: audit.actorPermissionSnapshot as any,
        tenantId: audit.tenantId || null,
        correlationId: audit.correlationId,
        idempotencyKey: audit.idempotencyKey || null,
        source: audit.source,
        entityType: audit.entityType,
        entityId: audit.entityId,
        entityVersion: audit.entityVersion || null,
        action: audit.action,
        beforeSnapshot: (audit.beforeSnapshot ?? Prisma.JsonNull) as any,
        afterSnapshot: (audit.afterSnapshot ?? Prisma.JsonNull) as any,
        txId: realTxId
      }
    });
    return result;
  }

  async writeDirectAudit(audit: AuditInput): Promise<{ id: string; txId: string }> {
    // Direct write (not inside a tx) — only used by tests that want to seed audit rows.
    const txId = `audit:${randomUUID()}`;
    const rec = await this.prisma.auditLog.create({
      data: {
        actorUserId: audit.actorUserId || null,
        actorRoleSlug: audit.actorRoleSlug || null,
        actorPermissionSnapshot: audit.actorPermissionSnapshot as any,
        tenantId: audit.tenantId || null,
        correlationId: audit.correlationId,
        idempotencyKey: audit.idempotencyKey || null,
        source: audit.source,
        entityType: audit.entityType,
        entityId: audit.entityId,
        entityVersion: audit.entityVersion || null,
        action: audit.action,
        beforeSnapshot: (audit.beforeSnapshot ?? Prisma.JsonNull) as any,
        afterSnapshot: (audit.afterSnapshot ?? Prisma.JsonNull) as any,
        txId
      }
    });
    return { id: rec.id, txId };
  }
}
