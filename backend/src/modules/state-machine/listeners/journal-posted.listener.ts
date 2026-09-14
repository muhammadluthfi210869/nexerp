// Wave 2/A5 — journal-posted listener.
//
// Reacts to JOURNAL_POSTED transitions (BILL, SALES_INVOICE, AR_RECEIPT,
// DOWN_PAYMENT, AP_PAYMENT, TAX_TRANSACTION — all registered):
//   - logs the event
//   - flags the entity for KPI / dashboard recalculation.
//
// Ponytail: in-memory Set, single-process — switch to Redis pub/sub or
// a `reporting.recalc_queue` table when multi-instance matters.

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
export class JournalPostedListener {
  private readonly logger = new Logger(JournalPostedListener.name);

  private static readonly dirtyRecalcs = new Set<string>();

  @OnEvent('state.transition')
  handleJournalPosted(event: StateTransitionEvent) {
    if (event.eventTrigger !== StateEventTrigger.JOURNAL_POSTED) return;

    const key = `${event.entityType}:${event.entityId}`;
    JournalPostedListener.dirtyRecalcs.add(key);

    this.logger.log(
      `[JOURNAL_POSTED] entity=${event.entityType}/${event.entityId} ` +
        `toState=${event.toState} dirtySize=${JournalPostedListener.dirtyRecalcs.size}`,
    );
  }

  /**
   * Test/inspection helper: which entities still need recalc?
   */
  static getDirty(): string[] {
    return Array.from(JournalPostedListener.dirtyRecalcs);
  }

  static clearDirty(): void {
    JournalPostedListener.dirtyRecalcs.clear();
  }
}
