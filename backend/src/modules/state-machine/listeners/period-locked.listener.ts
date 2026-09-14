// Wave 2/A5 — period-locked listener.
//
// Reacts to FINANCIAL_PERIOD.PERIOD_LOCKED transitions:
//   - logs the event (audit-friendly, single-line structured payload)
//   - sets the cache invalidation flag (placeholder for when reporting
//     cache layer lands; today this is just a process-local Set so the
//     wiring is observable end-to-end).
//
// Ponytail: in-memory Set is the ceiling — replace with Redis pub/sub
// or a TTL cache store when multi-instance invalidation matters.

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StateEventTrigger } from '@prisma/client';

interface StateTransitionEvent {
  entityType: string;
  entityId: string;
  fromState?: string | null;
  toState: string;
  eventTrigger: StateEventTrigger;
  changedById?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class PeriodLockedListener {
  private readonly logger = new Logger(PeriodLockedListener.name);

  // ponytail: in-process flag, per-account locks when throughput matters.
  private static readonly dirtyPeriods = new Set<string>();

  @OnEvent('state.transition')
  handlePeriodLocked(event: StateTransitionEvent) {
    if (event.eventTrigger !== StateEventTrigger.PERIOD_LOCKED) return;
    if (event.entityType !== 'FINANCIAL_PERIOD') return;

    const periodId = event.entityId;
    PeriodLockedListener.dirtyPeriods.add(periodId);
    this.logger.log(
      `[PERIOD_LOCKED] period=${periodId} reason="${event.reason ?? ''}" ` +
        `dirtyCacheSize=${PeriodLockedListener.dirtyPeriods.size}`,
    );
  }

  /**
   * Test/inspection helper: has a period been locked since process start?
   */
  static isDirty(periodId: string): boolean {
    return PeriodLockedListener.dirtyPeriods.has(periodId);
  }

  static clearDirty(): void {
    PeriodLockedListener.dirtyPeriods.clear();
  }
}
