// Wave 1/A1 — State Machine shared types.
//
// Re-exports the canonical EventTrigger enum from Prisma client and adds
// the orchestrator payload contract. The 9 triggers cover the full ERP
// transactional lifecycle (see Master Spec Bagian 5).

import { StateEventTrigger } from '@prisma/client';

export { StateEventTrigger };

/**
 * Payload accepted by StateMachineService.transition().
 * - entityType: domain entity ("DOWN_PAYMENT", "AP_PAYMENT", "AR_RECEIPT", ...)
 * - entityId:   UUID of the row being transitioned
 * - eventTrigger: one of the 9 canonical triggers
 * - fromState / toState: optional explicit states (otherwise inferred from DB)
 * - userId: actor UUID
 * - metadata: arbitrary JSON snapshot for audit
 */
export interface TransitionInput {
  entityType: string;
  entityId: string;
  eventTrigger: StateEventTrigger;
  fromState?: string | null;
  toState: string;
  userId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Result returned by transition(). Wraps the inserted StateTransitionLog row.
 */
export interface TransitionResult {
  id: string;
  entityType: string;
  entityId: string;
  fromState: string | null;
  toState: string;
  eventTrigger: StateEventTrigger;
  createdAt: Date;
}

/**
 * Static diagram for an entity type: current state -> allowed event triggers.
 * Used by state-machine.controller.ts GET /state-machine/diagram/:entityType
 * to drive the UI state machine view.
 */
export interface StateDiagram {
  entityType: string;
  triggers: Array<{
    trigger: StateEventTrigger;
    description: string;
  }>;
}