import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DocumentAutomationService } from '../../../src/modules/document-automation/services/document-automation.service';
import { PdfEngineService } from '../../../src/modules/document-automation/services/pdf-engine.service';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../../src/modules/system/id-generator.service';
import {
  DocumentType,
  DocumentDraftStatus,
  SourceDocumentType,
} from '@prisma/client';

/**
 * Integration Tests — Event-Driven Document Flow
 *
 * Tests that events trigger the correct document draft generators.
 * Uses real EventEmitterModule to verify @OnEvent wiring.
 * Uses mocked Prisma to isolate from database.
 */

describe('Document Flow — Event Integration', () => {
  let app: INestApplication;
  let service: DocumentAutomationService;
  let prisma: Record<string, any>;
  let eventEmitter: EventEmitter2;

  const mockPrisma = {
    salesLead: { findUnique: jest.fn() },
    salesOrder: { findUnique: jest.fn() },
    workOrder: { findUnique: jest.fn() },
    deliveryOrder: { findUnique: jest.fn() },
    documentDraft: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn().mockImplementation((args: any) =>
        Promise.resolve({ id: 'draft-' + Math.random(), ...args.data })
      ),
      update: jest.fn().mockImplementation((args: any) => Promise.resolve(args.data)),
      count: jest.fn().mockResolvedValue(0),
    },
    invoice: { create: jest.fn().mockImplementation((args: any) =>
      Promise.resolve({ id: 'inv-' + Math.random(), ...args.data })
    )},
    goodsRequirement: { create: jest.fn().mockImplementation((args: any) =>
      Promise.resolve({ id: 'gr-' + Math.random(), ...args.data })
    )},
    journalEntry: { create: jest.fn().mockImplementation((args: any) =>
      Promise.resolve({ id: 'jrn-' + Math.random(), ...args.data })
    )},
  };

  const mockIdGenerator = {
    generateId: jest.fn().mockImplementation((prefix: string) =>
      Promise.resolve(`${prefix}-2606-001`)
    ),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        DocumentAutomationService,
        PdfEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: IdGeneratorService, useValue: mockIdGenerator },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get<DocumentAutomationService>(DocumentAutomationService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    prisma = mockPrisma as any;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.documentDraft.findFirst.mockResolvedValue(null);
    prisma.documentDraft.create.mockImplementation((args: any) =>
      Promise.resolve({ id: 'draft-' + Math.random(), ...args.data })
    );
  });

  const waitForEvents = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

  // C1-C2: Lead Status Events
  describe('lead.status.changed event', () => {
    it('C1: NEGOTIATION → Quotation draft created', async () => {
      prisma.salesLead.findUnique.mockResolvedValue({
        id: 'lead-1', clientName: 'PT Test', brandName: 'Brand',
        productInterest: 'Serum', estimatedValue: 100000000, moq: 1000, sampleRequests: [],
      });

      await eventEmitter.emitAsync('lead.status.changed', {
        leadId: 'lead-1', previousStatus: 'CONTACTED', newStatus: 'NEGOTIATION',
      });
      await waitForEvents();

      expect(prisma.documentDraft.create).toHaveBeenCalled();
      expect(prisma.documentDraft.create.mock.calls[0][0].data.documentType).toBe(DocumentType.QUOTATION);
    });

    it('C2: CONTACTED → No draft created', async () => {
      await eventEmitter.emitAsync('lead.status.changed', {
        leadId: 'lead-1', previousStatus: 'NEW_LEAD', newStatus: 'CONTACTED',
      });
      await waitForEvents();

      expect(prisma.documentDraft.create).not.toHaveBeenCalled();
    });
  });

  // C3-C4: Sales Order Events
  describe('sales_order.created event', () => {
    it('C3: SO Created → DP Invoice draft', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({
        id: 'so-1', orderNumber: 'SO-001', totalAmount: 100000000, brandName: 'Brand',
        lead: { clientName: 'PT Test' },
        items: [{ productName: 'Serum', quantity: 1000, unitPrice: 100000, subtotal: 100000000 }],
        tax: null,
      });

      await eventEmitter.emitAsync('sales_order.created', { salesOrderId: 'so-1' });
      await waitForEvents();

      expect(prisma.documentDraft.create).toHaveBeenCalled();
      expect(prisma.documentDraft.create.mock.calls[0][0].data.documentType).toBe(DocumentType.INVOICE_DP);
    });
  });

  describe('sales_order.activated event', () => {
    it('C4: SO Activated → Goods Requirement draft', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({
        id: 'so-1', orderNumber: 'SO-001', brandName: 'Brand',
        lead: { clientName: 'PT Test' },
        items: [{ productName: 'Serum', materialItem: { name: 'AHA', unit: 'KG' }, materialItemId: 'm1', quantity: 100 }],
      });

      await eventEmitter.emitAsync('sales_order.activated', { salesOrderId: 'so-1' });
      await waitForEvents();

      expect(prisma.documentDraft.create).toHaveBeenCalled();
      expect(prisma.documentDraft.create.mock.calls[0][0].data.documentType).toBe(DocumentType.GOODS_REQUIREMENT);
    });
  });

  // C5: Production Completed
  describe('production.qc_final_passed event', () => {
    it('C5: QC Passed → Final Invoice + DO drafts', async () => {
      prisma.workOrder.findUnique.mockResolvedValue({
        id: 'wo-1', woNumber: 'WO-001', actualCogs: 70000000, lead: { clientName: 'PT' },
        plan: { so: {
          id: 'so-1', orderNumber: 'SO-001', totalAmount: 100000000, brandName: 'Brand',
          lead: { clientName: 'PT', addressDetail: 'Jak', city: 'Jak' },
          items: [{ productName: 'Serum', quantity: 1000, unitPrice: 100000, subtotal: 100000000 }],
          tax: null,
        }},
      });

      await eventEmitter.emitAsync('production.qc_final_passed', { workOrderId: 'wo-1', loggedBy: 'tester' });
      await waitForEvents(300);

      expect(prisma.documentDraft.create).toHaveBeenCalledTimes(2);
      const types = prisma.documentDraft.create.mock.calls.map((c: any) => {
        const arg = c[0] || c;
        return arg?.data?.documentType || arg?.documentType;
      });
      expect(types).toContain(DocumentType.INVOICE_FINAL);
      expect(types).toContain(DocumentType.DELIVERY_ORDER);
    });
  });

  // C6: Delivery Order Created
  describe('delivery_order.created event', () => {
    it('C6: DO Created → Surat Jalan + Journal drafts', async () => {
      prisma.deliveryOrder.findUnique.mockResolvedValue({
        id: 'do-1', shippedAt: new Date(),
        workOrder: {
          woNumber: 'WO-001', actualCogs: 70000000, lead: { clientName: 'PT' },
          plan: { so: {
            orderNumber: 'SO-001', brandName: 'Brand',
            lead: { clientName: 'PT', city: 'Jak' },
            items: [{ productName: 'Serum', quantity: 1000 }],
          }},
        },
      });

      await eventEmitter.emitAsync('delivery_order.created', { deliveryOrderId: 'do-1' });
      await waitForEvents(300);

      expect(prisma.documentDraft.create).toHaveBeenCalledTimes(2);
      const types = prisma.documentDraft.create.mock.calls.map((c: any) => {
        const arg = c[0] || c;
        return arg?.data?.documentType || arg?.documentType;
      });
      expect(types).toContain(DocumentType.SURAT_JALAN);
      expect(types).toContain(DocumentType.JOURNAL_ENTRY);
    });
  });

  // C7: Duplicate Prevention
  describe('duplicate prevention', () => {
    it('C7: same event twice → only 1 draft', async () => {
      prisma.salesLead.findUnique.mockResolvedValue({
        id: 'lead-1', clientName: 'PT', sampleRequests: [],
      });
      prisma.documentDraft.findFirst.mockResolvedValueOnce(null);
      prisma.documentDraft.findFirst.mockResolvedValueOnce({ id: 'existing' });

      await eventEmitter.emitAsync('lead.status.changed', {
        leadId: 'lead-1', newStatus: 'NEGOTIATION',
      });
      await waitForEvents();

      await eventEmitter.emitAsync('lead.status.changed', {
        leadId: 'lead-1', newStatus: 'NEGOTIATION',
      });
      await waitForEvents();

      expect(prisma.documentDraft.create).toHaveBeenCalledTimes(1);
    });
  });
});
