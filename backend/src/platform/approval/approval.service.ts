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

  private validateApprovalRules(a: any, actorId: string, expectedVersion?: number): string[] {
    if (!a) throw Object.assign(new Error('Approval not found'), { code: 'APPROVAL_NOT_FOUND' });
    if (a.decision) throw Object.assign(new Error('Already decided'), { code: 'ALREADY_DECIDED' });
    if (a.requestedById === actorId) {
      throw Object.assign(new Error('Maker cannot approve own request'), { code: 'SELF_APPROVAL_FORBIDDEN' });
    }
    if (expectedVersion !== undefined && a.version !== expectedVersion) {
      throw Object.assign(new Error('Approval version mismatch'), { code: 'VERSION_MISMATCH' });
    }
    const checkers: string[] = Array.isArray(a.decidedByIds) ? a.decidedByIds : [];
    if (checkers.includes(actorId)) {
      throw Object.assign(new Error('Actor has already submitted a decision for this threshold'), { code: 'DUPLICATE_CHECKER' });
    }
    return checkers;
  }

  private async updateApprovalDecision(
    tx: any,
    id: string,
    decision: ApprovalDecision | null,
    actorId: string,
    thresholdCount: number,
    decidedByIds: string[]
  ) {
    return tx.approval.update({
      where: { id },
      data: {
        decision,
        decidedById: actorId,
        decidedAt: decision ? new Date() : undefined,
        thresholdCount,
        decidedByIds
      }
    });
  }

  async decide(approvalId: string, actorId: string, decision: ApprovalDecision, expectedVersion?: number) {
    return await this.prisma.$transaction(async tx => {
      const rows = await tx.$queryRawUnsafe<Array<any>>(
        `SELECT id, "requestedById", "version", "decision", "thresholdRequired", "thresholdCount", "decidedByIds"
         FROM approvals WHERE id = $1 FOR UPDATE`,
        approvalId
      );
      const a = rows[0];
      const checkers = this.validateApprovalRules(a, actorId, expectedVersion);
      const newCheckers = [...checkers, actorId];
      const newCount = a.thresholdCount + 1;

      if (decision === ApprovalDecision.REJECTED) {
        await this.updateApprovalDecision(tx, approvalId, decision, actorId, newCount, newCheckers);
        return { state: 'REJECTED', thresholdCount: newCount, thresholdRequired: a.thresholdRequired, reason_code: 'REJECTED' };
      }

      if (newCount < a.thresholdRequired) {
        await this.updateApprovalDecision(tx, approvalId, null, actorId, newCount, newCheckers);
        return { state: 'PENDING', thresholdCount: newCount, thresholdRequired: a.thresholdRequired, reason_code: 'MISSING_THRESHOLD' };
      }

      await this.updateApprovalDecision(tx, approvalId, decision, actorId, newCount, newCheckers);
      return { state: 'APPROVED', thresholdCount: newCount, thresholdRequired: a.thresholdRequired, reason_code: 'PASS' };
    });
  }

  async listPending() {
    return await this.prisma.approval.findMany({ where: { decision: null } });
  }
}
