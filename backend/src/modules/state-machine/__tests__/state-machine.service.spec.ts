// Wave 1/A2 — StateMachineService unit tests.
//
// 9 cases: one per canonical event trigger. Each case proves:
//   - validateEventTrigger accepts the registered (entity, trigger) pair
//   - transition() inserts a StateTransitionLog row
//   - the inserted row carries eventTrigger + correct entity fields
//   - the orchestrator emits a `state.transition` event
//
// Pattern: jest.fn() mocks for PrismaService + EventEmitter2. Matches the
// style of test/unit/state-transition.unit-spec.ts (mocked Prisma + direct
// constructor injection).

import { BadRequestException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, StateEventTrigger } from '@prisma/client';
import { StateMachineService } from '../state-machine.service';

describe('StateMachineService', () => {
  let service: StateMachineService;
  let prismaMock: any;
  let eventEmitterMock: any;

  const FAKE_ROW = {
    id: 'log-1',
    entityType: 'DOWN_PAYMENT',
    entityId: 'dp-1',
    fromState: 'PENDING',
    toState: 'PAID',
    eventTrigger: StateEventTrigger.PAYMENT_SENT,
    changedById: 'user-1',
    reason: 'Bank transfer confirmed',
    metadata: { amount: 1000 },
    createdAt: new Date('2026-09-12T10:00:00Z'),
  };

  beforeEach(() => {
    prismaMock = {
      stateTransitionLog: {
        create: jest.fn().mockResolvedValue(FAKE_ROW),
        findFirst: jest.fn().mockResolvedValue(FAKE_ROW),
      },
    };
    eventEmitterMock = {
      emit: jest.fn(),
    };
    service = new StateMachineService(prismaMock, eventEmitterMock);
  });

  describe('validateEventTrigger', () => {
    it('accepts a registered (entity, trigger) pair', () => {
      expect(() =>
        service.validateEventTrigger(
          'DOWN_PAYMENT',
          StateEventTrigger.PAYMENT_SENT,
        ),
      ).not.toThrow();
    });

    it('rejects an unknown entity type', () => {
      expect(() =>
        service.validateEventTrigger(
          'MYSTERY_ENTITY',
          StateEventTrigger.PAYMENT_SENT,
        ),
      ).toThrow(BadRequestException);
    });

    it('rejects a trigger not in the entity allow-list', () => {
      // PAYMENT_RECEIVED is not registered for DOWN_PAYMENT
      expect(() =>
        service.validateEventTrigger(
          'DOWN_PAYMENT',
          StateEventTrigger.PAYMENT_RECEIVED,
        ),
      ).toThrow(BadRequestException);
    });
  });

  // 9 canonical event triggers — one happy-path test per trigger.
  // Each maps to at least one registered entity from ENTITY_TRIGGER_MAP.
  const triggerCases: Array<{
    trigger: StateEventTrigger;
    entityType: string;
    toState: string;
  }> = [
    { trigger: StateEventTrigger.SO_CREATED, entityType: 'SALES_ORDER', toState: 'DRAFT' },
    { trigger: StateEventTrigger.PO_CREATED, entityType: 'PURCHASE_ORDER', toState: 'DRAFT' },
    { trigger: StateEventTrigger.INVOICE_ISSUED, entityType: 'SALES_INVOICE', toState: 'ISSUED' },
    { trigger: StateEventTrigger.JOURNAL_POSTED, entityType: 'DOWN_PAYMENT', toState: 'POSTED' },
    { trigger: StateEventTrigger.PAYMENT_RECEIVED, entityType: 'AR_RECEIPT', toState: 'RECEIVED' },
    { trigger: StateEventTrigger.PAYMENT_SENT, entityType: 'DOWN_PAYMENT', toState: 'PAID' },
    { trigger: StateEventTrigger.APPROVAL_REQUESTED, entityType: 'AP_PAYMENT', toState: 'PENDING_APPROVAL' },
    { trigger: StateEventTrigger.APPROVAL_GRANTED, entityType: 'AP_PAYMENT', toState: 'APPROVED' },
    { trigger: StateEventTrigger.PERIOD_LOCKED, entityType: 'FINANCIAL_PERIOD', toState: 'LOCKED' },
  ];

  describe.each(triggerCases)(
    'transition() for trigger $trigger on $entityType',
    ({ trigger, entityType, toState }) => {
      it('inserts a StateTransitionLog row and emits state.transition', async () => {
        prismaMock.stateTransitionLog.create.mockResolvedValueOnce({
          ...FAKE_ROW,
          entityType,
          toState,
          eventTrigger: trigger,
        });

        const result = await service.transition({
          entityType,
          entityId: `ent-${trigger}`,
          eventTrigger: trigger,
          fromState: 'INITIAL',
          toState,
          userId: 'user-1',
          reason: `test ${trigger}`,
        });

        expect(result.eventTrigger).toBe(trigger);
        expect(result.toState).toBe(toState);
        expect(result.entityType).toBe(entityType);
        expect(prismaMock.stateTransitionLog.create).toHaveBeenCalledTimes(1);
        expect(eventEmitterMock.emit).toHaveBeenCalledWith(
          'state.transition',
          expect.objectContaining({
            entityType,
            eventTrigger: trigger,
            toState,
          }),
        );
      });
    },
  );

  describe('NO_DUAL_WRITE enforcement', () => {
    it('throws ConflictException on duplicate (entityId, eventTrigger)', async () => {
      prismaMock.stateTransitionLog.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('unique constraint', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.transition({
          entityType: 'DOWN_PAYMENT',
          entityId: 'dp-1',
          eventTrigger: StateEventTrigger.PAYMENT_SENT,
          toState: 'PAID',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findLatest', () => {
    it('returns the latest matching transition', async () => {
      const found = await service.findLatest(
        'dp-1',
        StateEventTrigger.PAYMENT_SENT,
      );
      expect(found).not.toBeNull();
      expect(found?.eventTrigger).toBe(StateEventTrigger.PAYMENT_SENT);
    });

    it('returns null when no transition exists', async () => {
      prismaMock.stateTransitionLog.findFirst.mockResolvedValueOnce(null);
      const found = await service.findLatest(
        'missing',
        StateEventTrigger.PAYMENT_SENT,
      );
      expect(found).toBeNull();
    });
  });

  describe('read-only helpers', () => {
    it('getTriggerMap returns the registered triggers for a known entity', () => {
      const triggers = service.getTriggerMap('DOWN_PAYMENT');
      expect(triggers).toContain(StateEventTrigger.PAYMENT_SENT);
    });

    it('getTriggerMap returns [] for an unknown entity', () => {
      expect(service.getTriggerMap('UNKNOWN')).toEqual([]);
    });

    it('listEntityTypes lists every registered entity', () => {
      const list = service.listEntityTypes();
      expect(list.find((e) => e.entityType === 'DOWN_PAYMENT')).toBeDefined();
      expect(list.find((e) => e.entityType === 'AR_RECEIPT')).toBeDefined();
    });

    it('isRegistered returns true for known entities', () => {
      expect(service.isRegistered('AP_PAYMENT')).toBe(true);
      expect(service.isRegistered('NOT_REAL')).toBe(false);
    });
  });
});