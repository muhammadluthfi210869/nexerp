// Wave 2/A5 — approval-granted listener.
//
// Reacts to APPROVAL_GRANTED transitions (any entity):
//   - logs the event
//   - emits a `notification.approval_granted` event for downstream Wave 3
//     Comms (notes/reply/mention/attach) and notification dispatch.
//
// This is the placeholder bridge between state-machine and the future
// Comms module — when Comms lands in Wave 3, the same listener subscribes
// without a code change in the upstream services.

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
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
export class ApprovalGrantedListener {
  private readonly logger = new Logger(ApprovalGrantedListener.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent('state.transition')
  handleApprovalGranted(event: StateTransitionEvent) {
    if (event.eventTrigger !== StateEventTrigger.APPROVAL_GRANTED) return;

    this.logger.log(
      `[APPROVAL_GRANTED] entity=${event.entityType}/${event.entityId} ` +
        `by=${event.changedById ?? 'system'}`,
    );

    // Placeholder re-emit for Wave 3 Comms. Notification / inbox /
    // activity-stream modules can subscribe to `notification.approval_granted`
    // without coupling to state-machine internals.
    this.eventEmitter.emit('notification.approval_granted', {
      entityType: event.entityType,
      entityId: event.entityId,
      approverId: event.changedById,
      reason: event.reason,
      metadata: event.metadata,
      emittedAt: new Date().toISOString(),
    });
  }
}
