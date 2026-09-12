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

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
   * Apply a state transition. Skeleton — commit 2 fills in DB write + emit.
   * Kept here so commit 1 already exposes a working API surface.
   */
  async transition(input: TransitionInput): Promise<TransitionResult> {
    this.validateEventTrigger(input.entityType, input.eventTrigger);

    // ponytail: skeleton defers actual DB write to commit 2 — for now this
    // satisfies the type contract so dependent services can wire up imports.
    throw new BadRequestException(
      'STATE_MACHINE_NOT_IMPLEMENTED: commit 2 wires the orchestrator.',
    );
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
   * No-op consumer of Prisma namespace import so tree-shaking does not drop
   * the type-only reference. Keeps `@prisma/client` types aligned.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _typesRef: Prisma.InputJsonValue | null = null;
}