import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

// --- Types ---
export type EntityType =
  | 'SalesLead'
  | 'SampleStage'
  | 'SOStatus'
  | 'FormulaStatus'
  | 'LifecycleStatus'
  | 'DesignState'
  | 'RegStage';

export interface StateTransitionEvent {
  entityType: EntityType;
  entityId: string;
  fromState?: string;
  toState: string;
  changedById?: string;
  reason?: string;
  metadata?: any;
}

export type GateType = 'G1_SAMPLE' | 'G2_PRODUCTION' | 'G3_DELIVERY';

interface GateInfo {
  gate: GateType;
  description: string;
}

// --- Canonical Transition Map ---
const TRANSITION_MAP: Record<EntityType, Record<string, string[]>> = {
  SalesLead: {
    NEW_LEAD: ['CONTACTED', 'LOST'],
    CONTACTED: ['FOLLOW_UP_1', 'NEGOTIATION', 'LOST'],
    FOLLOW_UP_1: ['FOLLOW_UP_2', 'NEGOTIATION', 'LOST'],
    FOLLOW_UP_2: ['FOLLOW_UP_3', 'NEGOTIATION', 'LOST'],
    FOLLOW_UP_3: ['NEGOTIATION', 'LOST'],
    NEGOTIATION: ['SAMPLE_REQUESTED', 'SPK_SIGNED', 'LOST'],
    SAMPLE_REQUESTED: ['WAITING_FINANCE_APPROVAL', 'LOST'],
    WAITING_FINANCE_APPROVAL: ['SAMPLE_SENT', 'DP_PAID', 'LOST'],
    SAMPLE_SENT: ['SAMPLE_APPROVED', 'LOST'],
    SAMPLE_APPROVED: ['SPK_SIGNED', 'LOST'],
    SPK_SIGNED: ['WAITING_FINANCE_APPROVAL', 'LOST'],
    DP_PAID: ['PRODUCTION_PLAN', 'LOST'],
    PRODUCTION_PLAN: ['READY_TO_SHIP', 'LOST'],
    READY_TO_SHIP: ['WON_DEAL', 'LOST'],
    WON_DEAL: [],
    LOST: [],
    ABORTED: [],
  },
  SampleStage: {
    WAITING_FINANCE: ['QUEUE', 'CANCELLED'],
    QUEUE: ['FORMULATING', 'CANCELLED'],
    FORMULATING: ['LAB_TEST', 'CANCELLED'],
    LAB_TEST: ['READY_TO_SHIP', 'CANCELLED'],
    READY_TO_SHIP: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['RECEIVED', 'CANCELLED'],
    RECEIVED: ['CLIENT_REVIEW', 'CANCELLED'],
    CLIENT_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
    APPROVED: [],
    REJECTED: [],
    CANCELLED: [],
  },
  SOStatus: {
    PENDING_DP: ['LOCKED_ACTIVE', 'CANCELLED'],
    LOCKED_ACTIVE: ['READY_TO_PRODUCE', 'COMPLETED', 'CANCELLED'],
    READY_TO_PRODUCE: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    ACTIVE: ['LOCKED_ACTIVE', 'CANCELLED'],
  },
  FormulaStatus: {
    DRAFT: ['WAITING_APPROVAL', 'ARCHIVED'],
    WAITING_APPROVAL: ['SAMPLE_LOCKED', 'REVISION_REQUIRED', 'ARCHIVED'],
    SAMPLE_LOCKED: [
      'PRODUCTION_LOCKED',
      'BPOM_REGISTRATION_PROCESS',
      'MINOR_COMPLIANCE_FIX',
      'SUPERSEDED',
    ],
    MINOR_COMPLIANCE_FIX: ['SAMPLE_LOCKED', 'SUPERSEDED'],
    BPOM_REGISTRATION_PROCESS: ['PRODUCTION_LOCKED', 'REVISION_REQUIRED'],
    PRODUCTION_LOCKED: ['SUPERSEDED', 'ARCHIVED'],
    REVISION_REQUIRED: ['DRAFT', 'ARCHIVED'],
    SUPERSEDED: ['ARCHIVED'],
    ARCHIVED: [],
  },
  LifecycleStatus: {
    PLANNING: ['WAITING_MATERIAL', 'CANCELLED'],
    WAITING_MATERIAL: ['WAITING_PROCUREMENT', 'READY_TO_PRODUCE', 'CANCELLED'],
    WAITING_PROCUREMENT: ['READY_TO_PRODUCE', 'CANCELLED'],
    READY_TO_PRODUCE: ['MIXING', 'CANCELLED'],
    MIXING: ['PENDING_QC', 'QC_HOLD', 'CANCELLED'],
    PENDING_QC: ['FILLING', 'REWORK', 'QC_HOLD', 'CANCELLED'],
    QC_HOLD: ['REWORK', 'CANCELLED'],
    REWORK: ['MIXING', 'FILLING', 'CANCELLED'],
    FILLING: ['PACKING', 'QC_HOLD', 'CANCELLED'],
    PACKING: ['PENDING_QC', 'FINISHED_GOODS', 'CANCELLED'],
    FINISHED_GOODS: ['DONE', 'CANCELLED'],
    DONE: ['DELIVERED', 'CLOSED', 'CANCELLED'],
    DELIVERED: ['CLOSED', 'CANCELLED'],
    CLOSED: [],
    CANCELLED: [],
  },
  DesignState: {
    INBOX: ['IN_PROGRESS', 'LOCKED'],
    IN_PROGRESS: ['WAITING_APJ', 'REVISION', 'LOCKED'],
    WAITING_APJ: ['WAITING_CLIENT', 'REVISION', 'LOCKED'],
    WAITING_CLIENT: ['REVISION', 'LOCKED'],
    REVISION: ['IN_PROGRESS', 'LOCKED'],
    LOCKED: [],
  },
  RegStage: {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['EVALUATION', 'REVISION'],
    EVALUATION: ['REVISION', 'PUBLISHED'],
    REVISION: ['SUBMITTED', 'PUBLISHED'],
    PUBLISHED: [],
  },
};

// --- Gate-controlled transitions ---
const GATE_CONTROLLED_TRANSITIONS: Record<string, GateInfo> = {
  'WAITING_FINANCE→QUEUE': {
    gate: 'G1_SAMPLE',
    description: 'Pembayaran sampel harus diverifikasi Finance (Gate 1)',
  },
  'SPK_SIGNED→DP_PAID': {
    gate: 'G2_PRODUCTION',
    description: 'DP ≥ 50% harus diverifikasi Finance (Gate 2)',
  },
  'READY_TO_SHIP→WON_DEAL': {
    gate: 'G3_DELIVERY',
    description: 'Pelunasan harus diverifikasi Finance (Gate 3)',
  },
  'PENDING_DP→LOCKED_ACTIVE': {
    gate: 'G2_PRODUCTION',
    description: 'DP ≥ 50% harus diverifikasi Finance (Gate 2)',
  },
};

@Injectable()
export class StateTransitionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate that a state transition is allowed by the canonical map.
   */
  validateTransition(
    entityType: EntityType,
    fromState: string,
    toState: string,
  ): void {
    const entityMap = TRANSITION_MAP[entityType];
    if (!entityMap) {
      throw new BadRequestException(
        `STATE_MACHINE_ERROR: Unknown entity type "${entityType}".`,
      );
    }

    const allowedNext = entityMap[fromState];
    if (!allowedNext) {
      throw new BadRequestException(
        `STATE_MACHINE_ERROR: Status "${fromState}" tidak dikenal untuk ${entityType}.`,
      );
    }

    if (!allowedNext.includes(toState)) {
      throw new BadRequestException(
        `STATE_TRANSITION_INVALID: Tidak bisa berpindah dari "${fromState}" ke "${toState}" pada ${entityType}. ` +
          `Transisi yang diizinkan: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'Tidak ada (final state)'}.`,
      );
    }
  }

  /**
   * Check if a transition is gate-controlled and return gate info.
   */
  getGateInfo(
    entityType: EntityType,
    fromState: string,
    toState: string,
  ): GateInfo | null {
    const key = `${fromState}→${toState}`;
    return GATE_CONTROLLED_TRANSITIONS[key] || null;
  }

  /**
   * Execute a state transition with full validation, audit logging, and optional override.
   */
  async executeTransition(
    entityType: EntityType,
    entityId: string,
    fromState: string,
    toState: string,
    options?: {
      changedById?: string;
      reason?: string;
      metadata?: any;
      overridePin?: string; // SUPER_ADMIN PIN for emergency override
    },
  ): Promise<void> {
    // 1. Validate the transition
    this.validateTransition(entityType, fromState, toState);

    // 2. Check if gate-controlled
    const gateInfo = this.getGateInfo(entityType, fromState, toState);
    if (gateInfo) {
      if (!options?.overridePin) {
        throw new ForbiddenException(
          `GATE_BLOCKED: ${gateInfo.description}. Hubungi Finance untuk verifikasi, atau gunakan Emergency Override (PIN Super Admin).`,
        );
      }
      // Verify override PIN
      await this.verifyOverridePin(
        options.overridePin,
        entityType,
        entityId,
        fromState,
        toState,
        options.changedById,
      );
    }

    // 3. Log the transition
    await this.prisma.stateTransitionLog.create({
      data: {
        entityType,
        entityId,
        fromState,
        toState,
        changedById: options?.changedById,
        reason:
          options?.reason ||
          (gateInfo ? `GATE_OVERRIDE: ${gateInfo.description}` : null),
        metadata: options?.metadata || {},
      },
    });
  }

  /**
   * Verify SUPER_ADMIN override PIN and create audit trail.
   */
  private async verifyOverridePin(
    pin: string,
    entityType: EntityType,
    entityId: string,
    fromState: string,
    toState: string,
    changedById?: string,
  ): Promise<void> {
    // Find SUPER_ADMIN users and check PIN
    const admins = await this.prisma.user.findMany({
      where: { roles: { has: 'SUPER_ADMIN' }, status: 'ACTIVE' },
    });

    let pinValid = false;
    for (const admin of admins) {
      if (admin.managerPin && (await bcrypt.compare(pin, admin.managerPin))) {
        pinValid = true;
        break;
      }
      // Plain-text fallback for development (remove in production)
      if (admin.managerPin === pin) {
        pinValid = true;
        break;
      }
    }

    if (!pinValid) {
      throw new ForbiddenException(
        'EMERGENCY_OVERRIDE_FAILED: PIN Super Admin tidak valid. Override ditolak.',
      );
    }

    // Log successful override
    await this.prisma.systemOverrideLog.create({
      data: {
        documentId: entityId,
        documentType: entityType,
        gateType:
          GATE_CONTROLLED_TRANSITIONS[`${fromState}→${toState}`]?.gate ||
          'UNKNOWN',
        reason: `Gate bypass by SUPER_ADMIN: ${fromState} → ${toState}.`,
        authorizedById: changedById || '00000000-0000-0000-0000-000000000000',
      },
    });
  }

  /**
   * Get allowed next states for a given entity type and current state.
   */
  getAllowedTransitions(
    entityType: EntityType,
    currentState: string,
  ): string[] {
    const entityMap = TRANSITION_MAP[entityType];
    if (!entityMap) return [];
    return entityMap[currentState] || [];
  }

  // --- Event Listener (existing, kept for backward compatibility) ---
  @OnEvent('state.transition')
  async handleStateTransition(event: StateTransitionEvent) {
    await this.prisma.stateTransitionLog.create({
      data: {
        entityType: event.entityType,
        entityId: event.entityId,
        fromState: event.fromState,
        toState: event.toState,
        changedById: event.changedById,
        reason: event.reason,
        metadata: event.metadata || {},
      },
    });
  }

  async getAllLogs(limit = 100) {
    return this.prisma.stateTransitionLog.findMany({
      include: {
        changedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
