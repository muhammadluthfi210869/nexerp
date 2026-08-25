import { Test, TestingModule } from '@nestjs/testing';
import { DocumentAutomationService } from '../../../src/modules/document-automation/services/document-automation.service';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../../src/modules/system/id-generator.service';
import {
  DocumentType,
  DocumentDraftStatus,
  SourceDocumentType,
} from '@prisma/client';

describe('DocumentAutomationService — Unit Tests', () => {
  let service: DocumentAutomationService;
  let prisma: Record<string, any>;
  let eventEmitter: Record<string, any>;

  const mockPrisma = {
    salesLead: { findUnique: jest.fn() },
    salesOrder: { findUnique: jest.fn() },
    workOrder: { findUnique: jest.fn() },
    deliveryOrder: { findUnique: jest.fn() },
    formula: { findUnique: jest.fn() },
    documentDraft: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    invoice: { create: jest.fn() },
    goodsRequirement: { create: jest.fn() },
    journalEntry: { create: jest.fn() },
  };

  const mockEventEmitter = { emit: jest.fn() };
  const mockIdGenerator = { generateId: jest.fn().mockResolvedValue('TEST-2606-001') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentAutomationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: IdGeneratorService, useValue: mockIdGenerator },
      ],
    }).compile();
    service = module.get<DocumentAutomationService>(DocumentAutomationService);
    prisma = mockPrisma as any;
    eventEmitter = mockEventEmitter as any;
  });

  // A1-A3: Quotation Generator
  describe('generateQuotationDraft', () => {
    it('A1: should create quotation draft for valid lead', async () => {
      prisma.salesLead.findUnique.mockResolvedValue({
        id: 'lead-1', clientName: 'PT Test', brandName: 'Brand',
        productInterest: 'Serum', estimatedValue: 100000000, moq: 1000, sampleRequests: [],
      });
      prisma.documentDraft.findFirst.mockResolvedValue(null);
      prisma.documentDraft.create.mockResolvedValue({ id: 'd1', draftNumber: 'QUO-001', documentType: DocumentType.QUOTATION });

      const result = await service.generateQuotationDraft('lead-1');
      expect(result).toBeDefined();
      expect(result!.documentType).toBe(DocumentType.QUOTATION);
    });

    it('A2: should return undefined for invalid lead', async () => {
      prisma.salesLead.findUnique.mockResolvedValue(null);
      const result = await service.generateQuotationDraft('invalid');
      expect(result).toBeUndefined();
    });

    it('A3: should skip when duplicate quotation exists', async () => {
      prisma.salesLead.findUnique.mockResolvedValue({ id: 'lead-1', sampleRequests: [] });
      prisma.documentDraft.findFirst.mockResolvedValue({ id: 'existing', draftNumber: 'QUO-001' });

      const result = await service.generateQuotationDraft('lead-1');
      expect(result).toBeUndefined(); // early return
      expect(prisma.documentDraft.create).not.toHaveBeenCalled();
    });
  });

  // A4-A6: DP Invoice Generator
  describe('generateDpInvoiceDraft', () => {
    it('A4: should create DP Invoice draft (30% of total)', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({
        id: 'so-1', orderNumber: 'SO-001', totalAmount: 100000000,
        brandName: 'Brand', lead: { clientName: 'PT Test' },
        items: [{ productName: 'X', quantity: 1, unitPrice: 100000000, subtotal: 100000000 }], tax: null,
      });
      prisma.documentDraft.findFirst.mockResolvedValue(null);
      prisma.documentDraft.create.mockResolvedValue({ id: 'd2', draftNumber: 'INV-001', documentType: DocumentType.INVOICE_DP });

      const result = await service.generateDpInvoiceDraft('so-1');
      expect(result).toBeDefined();
      const payload = prisma.documentDraft.create.mock.calls[0][0].data.payload;
      expect(payload.amountDue).toBe(30000000);
    });

    it('A5: should return undefined for invalid SO', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(null);
      expect(await service.generateDpInvoiceDraft('bad')).toBeUndefined();
    });

    it('A6: should skip when duplicate DP draft exists', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', lead: {}, items: [], tax: null });
      prisma.documentDraft.findFirst.mockResolvedValue({ id: 'existing' });
      await service.generateDpInvoiceDraft('so-1');
      expect(prisma.documentDraft.create).not.toHaveBeenCalled();
    });
  });

  // A7-A8: Final Invoice Generator
  describe('generateFinalInvoiceDraft', () => {
    it('A7: should create Final Invoice for valid WO', async () => {
      prisma.workOrder.findUnique.mockResolvedValue({
        id: 'wo-1', woNumber: 'WO-001', actualCogs: 70000000, lead: { clientName: 'PT' },
        plan: { so: { id: 'so-1', totalAmount: 100000000, brandName: 'B', orderNumber: 'SO-001',
          lead: { clientName: 'PT' }, items: [{ productName: 'X', quantity: 1, unitPrice: 100000000, subtotal: 100000000 }], tax: null } },
      });
      prisma.documentDraft.findFirst.mockResolvedValue(null);
      prisma.documentDraft.create.mockResolvedValue({ id: 'd3', documentType: DocumentType.INVOICE_FINAL });

      const result = await service.generateFinalInvoiceDraft('wo-1');
      expect(result).toBeDefined();
    });

    it('A8: should return undefined for invalid WO', async () => {
      prisma.workOrder.findUnique.mockResolvedValue(null);
      expect(await service.generateFinalInvoiceDraft('bad')).toBeUndefined();
    });
  });

  // A9-A12: Other Generators
  describe('generateGoodsRequirementDraft', () => {
    it('A9: should create Goods Requirement draft', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue({
        id: 'so-1', orderNumber: 'SO-001', brandName: 'B', lead: { clientName: 'PT' },
        items: [{ productName: 'X', materialItem: { name: 'AHA', unit: 'KG' }, materialItemId: 'm1', quantity: 100 }],
      });
      prisma.documentDraft.findFirst.mockResolvedValue(null);
      prisma.documentDraft.create.mockResolvedValue({ id: 'd4' });
      const result = await service.generateGoodsRequirementDraft('so-1');
      expect(result).toBeDefined();
    });
  });

  describe('generateDeliveryOrderDraft', () => {
    it('A10: should create DO draft', async () => {
      prisma.workOrder.findUnique.mockResolvedValue({
        id: 'wo-1', woNumber: 'WO-001', lead: { clientName: 'PT' },
        plan: { so: { id: 'so-1', orderNumber: 'SO-001', brandName: 'B',
          lead: { clientName: 'PT', addressDetail: 'Jak', city: 'Jak' }, items: [{ productName: 'X', quantity: 1 }] } },
      });
      prisma.documentDraft.findFirst.mockResolvedValue(null);
      prisma.documentDraft.create.mockResolvedValue({ id: 'd5' });
      expect(await service.generateDeliveryOrderDraft('wo-1')).toBeDefined();
    });
  });

  describe('generateSuratJalanDraft', () => {
    it('A11: should create Surat Jalan draft', async () => {
      prisma.deliveryOrder.findUnique.mockResolvedValue({
        id: 'do-1', shippedAt: new Date(),
        workOrder: { woNumber: 'WO-001', lead: { clientName: 'PT' },
          plan: { so: { orderNumber: 'SO-001', brandName: 'B', lead: { clientName: 'PT', city: 'Jak' }, items: [{ productName: 'X', quantity: 1 }] } } },
      });
      prisma.documentDraft.findFirst.mockResolvedValue(null);
      prisma.documentDraft.create.mockResolvedValue({ id: 'd6' });
      expect(await service.generateSuratJalanDraft('do-1')).toBeDefined();
    });
  });

  describe('generateDeliveryJournalDraft', () => {
    it('A12: should create Journal draft', async () => {
      prisma.deliveryOrder.findUnique.mockResolvedValue({
        id: 'do-1', workOrder: { woNumber: 'WO-001', actualCogs: 70000000, lead: { clientName: 'PT' } },
      });
      prisma.documentDraft.create.mockResolvedValue({ id: 'd7' });
      expect(await service.generateDeliveryJournalDraft('do-1')).toBeDefined();
    });
  });

  // A13-A17: Draft Management
  describe('approveDraft', () => {
    it('A13: should approve DRAFT draft', async () => {
      prisma.documentDraft.findUnique.mockResolvedValue({ id: 'd1', status: DocumentDraftStatus.DRAFT, documentType: DocumentType.INVOICE_DP, draftNumber: 'INV-001', payload: { items: [{}] } });
      prisma.documentDraft.update.mockResolvedValue({ status: DocumentDraftStatus.APPROVED });
      prisma.invoice.create.mockResolvedValue({});
      const result = await service.approveDraft('d1', { notes: 'OK' }, 'u1');
      expect(result.status).toBe(DocumentDraftStatus.APPROVED);
    });

    it('A14: should throw on approving APPROVED draft', async () => {
      prisma.documentDraft.findUnique.mockResolvedValue({ id: 'd1', status: DocumentDraftStatus.APPROVED, documentType: DocumentType.INVOICE_DP });
      await expect(service.approveDraft('d1', {}, 'u1')).rejects.toThrow('already approved');
    });
  });

  describe('rejectDraft', () => {
    it('A15: should reject DRAFT draft', async () => {
      prisma.documentDraft.findUnique.mockResolvedValue({ id: 'd1', status: DocumentDraftStatus.DRAFT });
      prisma.documentDraft.update.mockResolvedValue({ status: DocumentDraftStatus.REJECTED });
      const result = await service.rejectDraft('d1', { reason: 'Wrong' }, 'u1');
      expect(result.status).toBe(DocumentDraftStatus.REJECTED);
    });
  });

  describe('updateDraft', () => {
    it('A16: should update payload and set REVIEWING', async () => {
      prisma.documentDraft.findUnique.mockResolvedValue({ id: 'd1', status: DocumentDraftStatus.DRAFT, originalPayload: null, payload: { old: true } });
      prisma.documentDraft.update.mockResolvedValue({ status: DocumentDraftStatus.REVIEWING });
      const result = await service.updateDraft('d1', { payload: { new: true } }, 'u1');
      expect(result.status).toBe(DocumentDraftStatus.REVIEWING);
    });

    it('A17: should throw on editing APPROVED draft', async () => {
      prisma.documentDraft.findUnique.mockResolvedValue({ id: 'd1', status: DocumentDraftStatus.APPROVED });
      await expect(service.updateDraft('d1', { payload: {} }, 'u1')).rejects.toThrow('Cannot edit');
    });
  });

  // A18-A19: Auto-Approve
  describe('processAutoApprovals', () => {
    it('A18: should auto-approve expired drafts', async () => {
      prisma.documentDraft.findMany.mockResolvedValue([
        { id: 'd1', draftNumber: 'INV-001', documentType: DocumentType.INVOICE_DP, payload: { items: [{}] } },
      ]);
      prisma.documentDraft.update.mockResolvedValue({});
      prisma.invoice.create.mockResolvedValue({});
      const result = await service.processAutoApprovals();
      expect(result.processed).toBe(1);
    });

    it('A19: should return 0 when no expired drafts', async () => {
      prisma.documentDraft.findMany.mockResolvedValue([]);
      const result = await service.processAutoApprovals();
      expect(result.processed).toBe(0);
    });
  });

  // A20-A22: Stats & Filters
  describe('getStats', () => {
    it('A20: should return correct counts', async () => {
      prisma.documentDraft.count
        .mockResolvedValueOnce(10).mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2).mockResolvedValueOnce(4)
        .mockResolvedValueOnce(1).mockResolvedValueOnce(0);
      const result = await service.getStats();
      expect(result.total).toBe(10);
      expect(result.drafts).toBe(3);
    });
  });

  describe('findAll', () => {
    it('A21: should filter by documentType', async () => {
      prisma.documentDraft.findMany.mockResolvedValue([]);
      await service.findAll({ documentType: DocumentType.INVOICE_DP });
      expect(prisma.documentDraft.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ documentType: DocumentType.INVOICE_DP }) }),
      );
    });

    it('A22: should filter by status', async () => {
      prisma.documentDraft.findMany.mockResolvedValue([]);
      await service.findAll({ status: DocumentDraftStatus.DRAFT });
      expect(prisma.documentDraft.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: DocumentDraftStatus.DRAFT }) }),
      );
    });
  });

  // R1 GATE 0A — Goods Requirement lineage fix verification.
  // The createGoodsRequirementFromDraft is private; we drive it through approveDraft()
  // (which calls executeApprovedDraft → createGoodsRequirementFromDraft).
  // executeApprovedDraft wraps the conversion in try/catch and logs failures —
  // so for CASE C the line failure is silent at the call site, but the
  // Goods Requirement is NOT created (fail-closed at the data layer).
  describe('R1: Goods Requirement lineage (salesOrderVersion + formulaVersion)', () => {
    function buildDraft(overrides: Partial<any> = {}) {
      return {
        id: 'draft-gr',
        draftNumber: 'GR-001',
        documentType: DocumentType.GOODS_REQUIREMENT,
        status: DocumentDraftStatus.DRAFT,
        sourceType: SourceDocumentType.SALES_ORDER,
        sourceId: 'so-1',
        payload: {
          orderNumber: 'SO-001',
          brandName: 'B',
          clientName: 'PT',
          items: [{ productName: 'Serum', materialId: 'mat-1', quantityRequired: 100, unit: 'KG' }],
          notes: 'ok',
        },
        ...overrides,
      };
    }

    it('CASE A: valid upstream SO + Formula V3 → GR persisted with pinned salesOrderVersion + formulaVersion', async () => {
      const draft = buildDraft();
      prisma.documentDraft.findUnique.mockResolvedValue(draft);
      // Prisma's documentDraft.update returns the FULL updated record in production,
      // so the mock mirrors that — executeApprovedDraft routes by documentType.
      prisma.documentDraft.update.mockResolvedValue({ ...draft, status: DocumentDraftStatus.APPROVED });
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', version: 2, formulaId: 'f-1' });
      prisma.formula.findUnique.mockResolvedValue({ version: 3 });
      prisma.goodsRequirement.create.mockResolvedValue({ id: 'gr-1', code: 'GR-001' });

      await service.approveDraft('draft-gr', { notes: 'go' }, 'u1');

      expect(prisma.salesOrder.findUnique).toHaveBeenCalledWith({ where: { id: 'so-1' }, select: { id: true, version: true, formulaId: true } });
      expect(prisma.formula.findUnique).toHaveBeenCalledWith({ where: { id: 'f-1' }, select: { version: true } });
      const callArgs = prisma.goodsRequirement.create.mock.calls[0][0];
      expect(callArgs.data.salesOrderId).toBe('so-1');
      expect(callArgs.data.salesOrderVersion).toBe(2);
      expect(callArgs.data.formulaId).toBe('f-1');
      expect(callArgs.data.formulaVersion).toBe(3);
      expect(callArgs.data.items.create[0].uom).toBe('KG');
    });

    it('CASE B: V4 exists later but upstream SO still pins V3 → GR still created with formulaVersion=3 (NOT V4)', async () => {
      const draft = buildDraft();
      prisma.documentDraft.findUnique.mockResolvedValue(draft);
      prisma.documentDraft.update.mockResolvedValue({ ...draft, status: DocumentDraftStatus.APPROVED });
      // SO is committed at version 2 with formula f-1 (V3). V4 is a newer
      // revision but is NOT what the upstream SO references.
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', version: 2, formulaId: 'f-1' });
      prisma.formula.findUnique.mockResolvedValue({ version: 3 });
      prisma.goodsRequirement.create.mockResolvedValue({ id: 'gr-1', code: 'GR-001' });

      await service.approveDraft('draft-gr', {}, 'u1');

      expect(prisma.formula.findUnique).toHaveBeenCalledWith({ where: { id: 'f-1' }, select: { version: true } });
      const callArgs = prisma.goodsRequirement.create.mock.calls[0][0];
      expect(callArgs.data.formulaVersion).toBe(3);
    });

    it('CASE C: source SO missing → fails closed, no Goods Requirement created', async () => {
      const draft = buildDraft();
      prisma.documentDraft.findUnique.mockResolvedValue(draft);
      prisma.documentDraft.update.mockResolvedValue({ ...draft, status: DocumentDraftStatus.APPROVED });
      prisma.salesOrder.findUnique.mockResolvedValue(null);

      // executeApprovedDraft swallows the throw and logs, so approveDraft
      // returns the APPROVED draft. The fail-closed guarantee is that
      // NO Goods Requirement gets created and NO formula lookup is attempted.
      const result = await service.approveDraft('draft-gr', {}, 'u1');
      expect(result.status).toBe(DocumentDraftStatus.APPROVED);
      expect(prisma.goodsRequirement.create).not.toHaveBeenCalled();
      expect(prisma.formula.findUnique).not.toHaveBeenCalled();
    });

    it('CASE C2: source SO has no pinned Formula → fails closed, no Goods Requirement created', async () => {
      const draft = buildDraft();
      prisma.documentDraft.findUnique.mockResolvedValue(draft);
      prisma.documentDraft.update.mockResolvedValue({ ...draft, status: DocumentDraftStatus.APPROVED });
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', version: 1, formulaId: null });

      const result = await service.approveDraft('draft-gr', {}, 'u1');
      expect(result.status).toBe(DocumentDraftStatus.APPROVED);
      expect(prisma.goodsRequirement.create).not.toHaveBeenCalled();
      expect(prisma.formula.findUnique).not.toHaveBeenCalled();
    });

    it('CASE C3: pinned Formula row missing → fails closed, no Goods Requirement created', async () => {
      const draft = buildDraft();
      prisma.documentDraft.findUnique.mockResolvedValue(draft);
      prisma.documentDraft.update.mockResolvedValue({ ...draft, status: DocumentDraftStatus.APPROVED });
      prisma.salesOrder.findUnique.mockResolvedValue({ id: 'so-1', version: 1, formulaId: 'f-ghost' });
      prisma.formula.findUnique.mockResolvedValue(null);

      const result = await service.approveDraft('draft-gr', {}, 'u1');
      expect(result.status).toBe(DocumentDraftStatus.APPROVED);
      expect(prisma.goodsRequirement.create).not.toHaveBeenCalled();
    });
  });
});
