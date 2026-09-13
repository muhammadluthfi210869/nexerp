// Wave 1/A1 — State Machine central orchestrator.
//
// Single entry point for every state change in the ERP. Replaces the
// scattered `prisma.x.update({ status: ... })` pattern with a centralized
// service that:
//   1. Validates the event trigger against the registered entity map
//   2. Inserts a StateTransitionLog row (NO_DUAL_WRITE via DB unique
//      constraint on (entityId, eventTrigger))
//   3. Emits a `state.transition` event for downstream listeners
//      (activity-log, notifications, ws-gateway, ...)
//   4. Returns the inserted log row
//
// See docs/ssot/PHASE_4_PLAN.md §WS-A + docs/legacy-erp/NEX_ERP_MASTER_SPECIFICATION.md
// Bagian 5 (state engine).

import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import {
  StateEventTrigger,
  TransitionInput,
  TransitionResult,
} from './state-transition.types';

/**
 * Canonical map: which entity types are allowed to emit which event trigger.
 * Adding a new entity here is the contract for "this entity participates in
 * the state machine". Service-level validation enforces NO_DUAL_WRITE.
 */
const ENTITY_TRIGGER_MAP: Record<string, StateEventTrigger[]> = {
  DOWN_PAYMENT: [
    StateEventTrigger.PAYMENT_SENT,
    StateEventTrigger.APPROVAL_REQUESTED,
    StateEventTrigger.APPROVAL_GRANTED,
    StateEventTrigger.JOURNAL_POSTED,
  ],
  AP_PAYMENT: [
    StateEventTrigger.PAYMENT_SENT,
    StateEventTrigger.APPROVAL_REQUESTED,
    StateEventTrigger.APPROVAL_GRANTED,
    StateEventTrigger.JOURNAL_POSTED,
  ],
  AR_RECEIPT: [
    StateEventTrigger.PAYMENT_RECEIVED,
    StateEventTrigger.JOURNAL_POSTED,
  ],
  SALES_ORDER: [
    StateEventTrigger.SO_CREATED,
    StateEventTrigger.APPROVAL_REQUESTED,
    StateEventTrigger.APPROVAL_GRANTED,
  ],
  PURCHASE_ORDER: [
    StateEventTrigger.PO_CREATED,
    StateEventTrigger.APPROVAL_REQUESTED,
    StateEventTrigger.APPROVAL_GRANTED,
  ],
  SALES_INVOICE: [
    StateEventTrigger.INVOICE_ISSUED,
    StateEventTrigger.JOURNAL_POSTED,
  ],
  BILL: [
    StateEventTrigger.JOURNAL_POSTED,
  ],
  FINANCIAL_PERIOD: [StateEventTrigger.PERIOD_LOCKED],
};

@Injectable()
export class StateMachineService {
  private readonly logger = new Logger(StateMachineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Validate that (entityType, eventTrigger) is registered in the canonical
   * map. Throws BadRequestException for unknown pairs — this is the contract
   * for "you must register your entity before emitting transitions".
   */
  validateEventTrigger(entityType: string, trigger: StateEventTrigger): void {
    const allowed = ENTITY_TRIGGER_MAP[entityType];
    if (!allowed) {
      throw new BadRequestException(
        `STATE_MACHINE_ERROR: Unknown entity type "${entityType}". ` +
          `Register it in ENTITY_TRIGGER_MAP before emitting transitions.`,
      );
    }
    if (!allowed.includes(trigger)) {
      throw new BadRequestException(
        `STATE_MACHINE_ERROR: Trigger "${trigger}" is not allowed for entity "${entityType}". ` +
          `Allowed: ${allowed.join(', ')}.`,
      );
    }
  }

  /**
   * Apply a state transition. Orchestrator contract:
   *   1. Validate (entityType, eventTrigger) is registered
   *   2. Insert StateTransitionLog row — NO_DUAL_WRITE enforced by DB
   *      unique constraint on (entityId, eventTrigger). Duplicate
   *      insert throws ConflictException.
   *   3. Emit `state.transition` event for downstream listeners
   *      (activity-log already listens, see activity-log.service.ts).
   *   4. Return the inserted row.
   *
   * Atomic per-call: the row insert + emit are sequential; emit failure
   * is logged but does not roll back the log row (audit durability wins
   * over notification best-effort).
   */
  async transition(input: TransitionInput): Promise<TransitionResult> {
    this.validateEventTrigger(input.entityType, input.eventTrigger);

    let row;
    try {
      row = await this.prisma.stateTransitionLog.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          fromState: input.fromState ?? null,
          toState: input.toState,
          eventTrigger: input.eventTrigger,
          changedById: input.userId ?? null,
          reason: input.reason ?? null,
          metadata: input.metadata
            ? (input.metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
    } catch (err) {
      // Prisma P2002 = unique constraint violation on (entityId, eventTrigger)
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `NO_DUAL_WRITE_VIOLATION: Trigger "${input.eventTrigger}" already ` +
            `executed for ${input.entityType} ${input.entityId}.`,
        );
      }
      throw err;
    }

    // Best-effort event emit — activity-log listener already wired.
    try {
      this.eventEmitter.emit('state.transition', {
        entityType: row.entityType,
        entityId: row.entityId,
        fromState: row.fromState,
        toState: row.toState,
        eventTrigger: row.eventTrigger,
        changedById: row.changedById,
        reason: row.reason,
        metadata: row.metadata,
      });
    } catch (err) {
      this.logger.error(
        'state.transition emit failed',
        err instanceof Error ? err.stack : String(err),
      );
    }

    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      fromState: row.fromState,
      toState: row.toState,
      eventTrigger: row.eventTrigger as StateEventTrigger,
      createdAt: row.createdAt,
    };
  }

  /**
   * Lookup the latest transition for a given (entityId, eventTrigger).
   * Used by services that need to check "did this transition already fire?"
   * without triggering a NO_DUAL_WRITE violation.
   */
  async findLatest(
    entityId: string,
    trigger: StateEventTrigger,
  ): Promise<TransitionResult | null> {
    const row = await this.prisma.stateTransitionLog.findFirst({
      where: { entityId, eventTrigger: trigger },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) return null;
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      fromState: row.fromState,
      toState: row.toState,
      eventTrigger: row.eventTrigger as StateEventTrigger,
      createdAt: row.createdAt,
    };
  }

  /**
   * Return the canonical trigger map for one entity type. Used by the
   * REST controller to render the state diagram in the UI.
   */
  getAllowedTriggers(entityType: string): StateEventTrigger[] {
    return ENTITY_TRIGGER_MAP[entityType] ?? [];
  }

  /**
   * List all registered entity types and their triggers.
   */
  listEntityTypes(): Array<{ entityType: string; triggers: StateEventTrigger[] }> {
    return Object.entries(ENTITY_TRIGGER_MAP).map(([entityType, triggers]) => ({
      entityType,
      triggers,
    }));
  }

  /**
   * Lookup helper used by controllers and tests.
   */
  isRegistered(entityType: string): boolean {
    return entityType in ENTITY_TRIGGER_MAP;
  }

  /**
   * Lookup the trigger map for one entity. Convenience for callers that
   * want to know which triggers are valid before calling transition().
   */
  getTriggerMap(entityType: string): StateEventTrigger[] {
    return ENTITY_TRIGGER_MAP[entityType] ?? [];
  }
}