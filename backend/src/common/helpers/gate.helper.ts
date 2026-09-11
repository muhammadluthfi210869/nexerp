import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import {
  GateBlockedException,
  PeriodLockedException,
  SoDViolationException,
} from '../exceptions/api-exception';

/**
 * FinanceGate = central gate enforcement for all posting operations.
 * Checks:
 *   1. Period not locked (monthly close)
 *   2. SoD — same user can't prepare and verify the same document
 */
@Injectable()
export class FinanceGateHelper {
  constructor(private prisma: PrismaService) {}

  /**
   * Throws PeriodLockedException if the period containing `date` is locked.
   */
  async assertPeriodOpen(date: Date, _label: string): Promise<void> {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const lock = await this.prisma.periodLock.findUnique({
      where: { period: monthStart },
    });
    if (lock?.isLocked) {
      throw new PeriodLockedException(monthStart.toISOString().slice(0, 7));
    }
  }

  /**
   * Throws GateBlockedException if the document is fully reconciled/closed.
   */
  async assertNotClosed(label: string, closed: boolean): Promise<void> {
    if (closed) {
      throw new GateBlockedException(label, `Document already closed/finalized`, { label });
    }
  }

  /**
   * Throws SoDViolationException if verifier === creator.
   * Use for: AP verify, adjustment journal review/approve,
   * bank reconciliation finalize, etc.
   */
  assertDifferentUser(action: string, createdBy: string | null, actorId: string | null): void {
    if (!createdBy || !actorId) return;
    if (createdBy === actorId) {
      throw new SoDViolationException(action);
    }
  }

  /**
   * Composite gate: check period + SoD in one call for posting operations.
   */
  async assertCanPost(opts: {
    date: Date;
    label: string;
    preparedBy?: string | null;
    actorId: string;
    sodAction?: string;
  }): Promise<void> {
    await this.assertPeriodOpen(opts.date, opts.label);
    if (opts.sodAction && opts.preparedBy) {
      this.assertDifferentUser(opts.sodAction, opts.preparedBy, opts.actorId);
    }
  }
}
