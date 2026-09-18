/**
 * NEX ERP - Approval Service (maker-checker, optimistic locking, idempotent)
 *
 * - requestApproval: creates an Approval row in PENDING (decision=null)
 * - decide: enforces actor ≠ maker, version match, threshold count
 * - listPending: returns PENDING approvals
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient, ApprovalDecision } from '@prisma/client';

export interface ApprovalRequestInput {
  governedEntityType: string;
  governedEntityId: string;
  action: string;
  requestedById: string;
  version: number;
  thresholdRequired: number;
  idempotencyKey?: string;
}

@Injectable()
export class ApprovalService {
  constructor(private readonly prisma: PrismaClient) {}

  async requestApproval(input: ApprovalRequestInput) {
    if (input.idempotencyKey) {
      const existing = await this.prisma.approval.findFirst({
        where: { governedEntityId: input.governedEntityId, action: input.action, version: input.version }
      });
      if (existing && existing.requestedById === input.requestedById) {
        return existing;
      }
    }
    return await this.prisma.approval.create({
      data: {
        governedEntityType: input.governedEntityType,
        governedEntityId: input.governedEntityId,
        action: input.action,
        requestedById: input.requestedById,
        requestedAt: new Date(),
        decision: null,
        version: input.version,
        thresholdRequired: input.thresholdRequired,
        thresholdCount: 0
      }
    });
  }

  async decide(approvalId: string, actorId: string, decision: ApprovalDecision) {
    return await this.prisma.$transaction(async tx => {
      const rows = await tx.$queryRawUnsafe<Array<any>>(
        `SELECT id, "requestedById", "version", "decision", "thresholdRequired", "thresholdCount"
         FROM approvals WHERE id = $1 FOR UPDATE`,
        approvalId
      );
      const a = rows[0];
      if (!a) throw Object.assign(new Error('Approval not found'), { code: 'APPROVAL_NOT_FOUND' });
      if (a.decision) throw Object.assign(new Error('Already decided'), { code: 'ALREADY_DECIDED' });
      if (a.requestedById === actorId) {
        throw Object.assign(new Error('Maker cannot approve own request'), { code: 'SELF_APPROVAL_FORBIDDEN' });
      }
      const newCount = a.thresholdCount + 1;
      if (newCount < a.thresholdRequired) {
        await tx.approval.update({
          where: { id: approvalId },
          data: { thresholdCount: newCount, decidedById: actorId }
        });
        return { state: 'PENDING', thresholdCount: newCount, thresholdRequired: a.thresholdRequired, reason_code: 'MISSING_THRESHOLD' };
      }
      await tx.approval.update({
        where: { id: approvalId },
        data: { decision, decidedById: actorId, decidedAt: new Date(), thresholdCount: newCount }
      });
      return { state: 'APPROVED', thresholdCount: newCount, thresholdRequired: a.thresholdRequired, reason_code: 'PASS' };
    });
  }

  async listPending() {
    return await this.prisma.approval.findMany({ where: { decision: null } });
  }
}
