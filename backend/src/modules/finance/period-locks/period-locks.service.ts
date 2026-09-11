import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  PeriodLockedException,
  ResourceNotFoundException,
  StateTransitionInvalidException,
} from '../../../common/exceptions/api-exception';

@Injectable()
export class PeriodLocksService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.periodLock.findMany({
      orderBy: { period: 'desc' },
    });
  }

  async findOne(id: string) {
    const lock = await this.prisma.periodLock.findUnique({ where: { id } });
    if (!lock) throw new ResourceNotFoundException('Period lock', id);
    return lock;
  }

  /**
   * Check if a given period is locked (for gate checks in other services).
   * Period = first day of month (e.g., 2026-09-01 for September 2026).
   */
  async isPeriodLocked(period: Date): Promise<boolean> {
    const monthStart = new Date(period.getFullYear(), period.getMonth(), 1);
    const lock = await this.prisma.periodLock.findUnique({
      where: { period: monthStart },
    });
    return lock?.isLocked ?? false;
  }

  /**
   * Gate helper: throws PeriodLockedException if the period is locked.
   * Use in service-layer posting operations to enforce monthly close.
   */
  async assertPeriodNotLocked(period: Date): Promise<void> {
    if (await this.isPeriodLocked(period)) {
      throw new PeriodLockedException(period.toISOString().slice(0, 7));
    }
  }

  /**
   * Lock a period — no more transactions can be posted for this month.
   * Used for monthly accounting close.
   */
  async lock(userId: string, period: Date, notes?: string) {
    const monthStart = new Date(period.getFullYear(), period.getMonth(), 1);
    const existing = await this.prisma.periodLock.findUnique({
      where: { period: monthStart },
    });
    if (existing?.isLocked) {
      throw new StateTransitionInvalidException(
        'PeriodLock',
        'LOCKED',
        'LOCKED',
        `Period ${monthStart.toISOString().slice(0, 7)} is already locked`,
      );
    }

    return this.prisma.periodLock.upsert({
      where: { period: monthStart },
      create: {
        period: monthStart,
        isLocked: true,
        lockedBy: userId,
        lockedAt: new Date(),
        notes,
      },
      update: {
        isLocked: true,
        lockedBy: userId,
        lockedAt: new Date(),
        notes: notes ? `${existing?.notes || ''}\n[re-locked] ${notes}`.trim() : existing?.notes,
      },
    });
  }

  /**
   * Unlock a period (admin override). Should require approval workflow in production.
   */
  async unlock(userId: string, id: string, reason: string) {
    const lock = await this.prisma.periodLock.findUnique({ where: { id } });
    if (!lock) throw new ResourceNotFoundException('Period lock', id);
    if (!lock.isLocked) {
      throw new StateTransitionInvalidException(
        'PeriodLock',
        'UNLOCKED',
        'UNLOCKED',
        'Period is not locked',
      );
    }

    return this.prisma.periodLock.update({
      where: { id },
      data: {
        isLocked: false,
        notes: `${lock.notes || ''}\n[UNLOCKED by ${userId}] ${reason}`.trim(),
      },
    });
  }
}
