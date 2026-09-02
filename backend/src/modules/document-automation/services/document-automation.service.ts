import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  DocumentType,
  DocumentDraftStatus,
  SourceDocumentType,
  SOStatus,
  InvoiceType,
} from '@prisma/client';
import { IdGeneratorService } from '../../system/id-generator.service';
import { ApproveDraftDto, RejectDraftDto, UpdateDraftDto } from '../dto/draft.dto';

@Injectable()
export class DocumentAutomationService {
  private readonly logger = new Logger(DocumentAutomationService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
  ) {}

  // ──────────────────────────────────────────────
  // AUTO-GENERATION TRIGGERS (Event Listeners)
  // ──────────────────────────────────────────────

  @OnEvent('sales_order.created')
  async handleSalesOrderCreated(payload: { salesOrderId: string }) {
    this.logger.log(`[DOC_AUTO] SO Created: generating DP Invoice draft`);
    await this.generateDpInvoiceDraft(payload.salesOrderId);
  }

  @OnEvent('production.qc_final_passed')
  async handleProductionCompleted(payload: {
    workOrderId: string;
    loggedBy: string;
  }) {
    this.logger.log(`[DOC_AUTO] Production completed: generating Final Invoice + DO drafts`);
    await this.generateFinalInvoiceDraft(payload.workOrderId);
    await this.generateDeliveryOrderDraft(payload.workOrderId);
  }

  @OnEvent('sales_order.activated')
  async handleSalesOrderActivated(payload: { salesOrderId: string }) {
    this.logger.log(`[DOC_AUTO] SO Activated: generating Goods Requirement + PR drafts`);
    await this.generateGoodsRequirementDraft(payload.salesOrderId);
  }

  @OnEvent('delivery_order.created')
  async handleDeliveryOrderCreated(payload: { deliveryOrderId: string }) {
    this.logger.log(`[DOC_AUTO] DO Created: generating Surat Jalan + Delivery Journal drafts`);
    await this.generateSuratJalanDraft(payload.deliveryOrderId);
    await this.generateDeliveryJournalDraft(payload.deliveryOrderId);
  }

  @OnEvent('lead.status.changed')
  async handleLeadStatusChanged(payload: {
    leadId: string;
    newStatus: string;
  }) {
    if (payload.newStatus === 'NEGOTIATION') {
      this.logger.log(`[DOC_AUTO] Lead moved to NEGOTIATION: generating Quotation draft`);
      await this.generateQuotationDraft(payload.leadId);
    }
  }

  // ──────────────────────────────────────────────
  // DRAFT GENERATORS
  // ──────────────────────────────────────────────

  async generateQuotationDraft(leadId: string) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: leadId },
      include: {
        sampleRequests: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { billOfMaterials: true },
        },
      },
    });

    if (!lead) return;

    const existing = await this.prisma.documentDraft.findFirst({
      where: {
        sourceType: SourceDocumentType.SALES_ORDER,
        sourceId: leadId,
        documentType: DocumentType.QUOTATION,
        status: { in: [DocumentDraftStatus.DRAFT, DocumentDraftStatus.REVIEWING] },
      },
    });

    if (existing) return;

    const draftNumber = await this.idGenerator.generateId('QUO');

    const draft = await this.prisma.documentDraft.create({
      data: {
        draftNumber,
        documentType: DocumentType.QUOTATION,
        sourceType: SourceDocumentType.SALES_ORDER,
        sourceId: leadId,
        status: DocumentDraftStatus.DRAFT,
        autoApproveAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        payload: {
          clientName: lead.clientName,
          brandName: lead.brandName,
          productInterest: lead.productInterest,
          estimatedValue: Number(lead.estimatedValue),
          picName: lead.brandName,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paymentTerms: 'DP 30% + Pelunasan saat barang siap',
          items: lead.sampleRequests[0]?.billOfMaterials?.map((bom: any) => ({
            productName: bom.materialName || lead.productInterest,
            quantity: 1,
            unitPrice: Number(bom.estimatedCost || 0),
            subtotal: Number(bom.estimatedCost || 0),
          })) || [{
            productName: lead.productInterest,
            quantity: lead.moq || 1,
            unitPrice: Number(lead.estimatedValue) / (lead.moq || 1),
            subtotal: Number(lead.estimatedValue),
          }],
          notes: `Quotation untuk ${lead.brandName} — ${lead.productInterest}`,
        },
      },
    });

    this.logger.log(`[DOC_AUTO] Quotation draft created: ${draft.draftNumber}`);
    return draft;
  }

  async generateDpInvoiceDraft(salesOrderId: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: {
        lead: true,
        items: true,
        tax: true,
      },
    });

    if (!so) return;

    const existing = await this.prisma.documentDraft.findFirst({
      where: {
        sourceType: SourceDocumentType.SALES_ORDER,
        sourceId: salesOrderId,
        documentType: DocumentType.INVOICE_DP,
        status: { in: [DocumentDraftStatus.DRAFT, DocumentDraftStatus.REVIEWING] },
      },
    });

    if (existing) return;

    const dpAmount = Number(so.totalAmount) * 0.3; // 30% DP
    const draftNumber = await this.idGenerator.generateId('INV');

    const draft = await this.prisma.documentDraft.create({
      data: {
        draftNumber,
        documentType: DocumentType.INVOICE_DP,
        sourceType: SourceDocumentType.SALES_ORDER,
        sourceId: salesOrderId,
        status: DocumentDraftStatus.DRAFT,
        autoApproveAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        payload: {
          type: InvoiceType.DP,
          category: 'RECEIVABLE',
          amountDue: dpAmount,
          outstandingAmount: dpAmount,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          soId: salesOrderId,
          clientName: so.lead?.clientName || 'Unknown',
          brandName: so.brandName,
          soNumber: so.orderNumber,
          items: so.items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
          })),
          taxRate: so.tax ? Number(so.tax.rate) : 0,
          notes: `DP Invoice auto-generated from SO ${so.orderNumber}`,
        },
      },
    });

    this.logger.log(`[DOC_AUTO] DP Invoice draft created: ${draft.draftNumber}`);
    this.eventEmitter.emit('document.draft_created', {
      draftId: draft.id,
      documentType: DocumentType.INVOICE_DP,
      sourceType: SourceDocumentType.SALES_ORDER,
    });

    return draft;
  }

  async generateFinalInvoiceDraft(workOrderId: string) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        lead: true,
        plan: {
          include: {
            so: { include: { lead: true, items: true, tax: true } },
          },
        },
      },
    });

    if (!wo || !wo.plan?.so) return;

    const so = wo.plan.so;

    const existing = await this.prisma.documentDraft.findFirst({
      where: {
        sourceType: SourceDocumentType.WORK_ORDER,
        sourceId: workOrderId,
        documentType: DocumentType.INVOICE_FINAL,
        status: { in: [DocumentDraftStatus.DRAFT, DocumentDraftStatus.REVIEWING] },
      },
    });

    if (existing) return;

    const finalAmount = wo.actualCogs ? Number(wo.actualCogs) : Number(so.totalAmount) * 0.7;
    const draftNumber = await this.idGenerator.generateId('INV');

    const draft = await this.prisma.documentDraft.create({
      data: {
        draftNumber,
        documentType: DocumentType.INVOICE_FINAL,
        sourceType: SourceDocumentType.WORK_ORDER,
        sourceId: workOrderId,
        status: DocumentDraftStatus.DRAFT,
        autoApproveAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        payload: {
          type: InvoiceType.FINAL_PAYMENT,
          category: 'RECEIVABLE',
          amountDue: finalAmount,
          outstandingAmount: finalAmount,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          soId: so.id,
          workOrderId: workOrderId,
          clientName: so.lead?.clientName || 'Unknown',
          brandName: so.brandName,
          soNumber: so.orderNumber,
          woNumber: wo.woNumber,
          items: so.items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
          })),
          actualCogs: wo.actualCogs ? Number(wo.actualCogs) : 0,
          notes: `Final Payment Invoice auto-generated from WO ${wo.woNumber}`,
        },
      },
    });

    this.logger.log(`[DOC_AUTO] Final Invoice draft created: ${draft.draftNumber}`);
    return draft;
  }

  async generateGoodsRequirementDraft(salesOrderId: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: {
        lead: true,
        items: { include: { materialItem: true } },
      },
    });

    if (!so) return;

    const existing = await this.prisma.documentDraft.findFirst({
      where: {
        sourceType: SourceDocumentType.SALES_ORDER,
        sourceId: salesOrderId,
        documentType: DocumentType.GOODS_REQUIREMENT,
        status: { in: [DocumentDraftStatus.DRAFT, DocumentDraftStatus.REVIEWING] },
      },
    });

    if (existing) return;

    const draftNumber = await this.idGenerator.generateId('GR');

    const draft = await this.prisma.documentDraft.create({
      data: {
        draftNumber,
        documentType: DocumentType.GOODS_REQUIREMENT,
        sourceType: SourceDocumentType.SALES_ORDER,
        sourceId: salesOrderId,
        status: DocumentDraftStatus.DRAFT,
        autoApproveAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        payload: {
          orderNumber: so.orderNumber,
          brandName: so.brandName,
          clientName: so.lead?.clientName || 'Unknown',
          items: so.items.map((item: any) => ({
            productName: item.productName,
            materialName: item.materialItem?.name || item.productName,
            materialId: item.materialItemId,
            quantityRequired: item.quantity,
            unit: item.materialItem?.unit || 'PCS',
          })),
          notes: `Goods requirement auto-generated from SO ${so.orderNumber}`,
        },
      },
    });

    this.logger.log(`[DOC_AUTO] Goods Requirement draft created: ${draft.draftNumber}`);
    return draft;
  }

  async generateDeliveryOrderDraft(workOrderId: string) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        lead: true,
        plan: {
          include: {
            so: { include: { lead: true, items: true } },
          },
        },
      },
    });

    if (!wo || !wo.plan?.so) return;

    const so = wo.plan.so;

    const existing = await this.prisma.documentDraft.findFirst({
      where: {
        sourceType: SourceDocumentType.WORK_ORDER,
        sourceId: workOrderId,
        documentType: DocumentType.DELIVERY_ORDER,
        status: { in: [DocumentDraftStatus.DRAFT, DocumentDraftStatus.REVIEWING] },
      },
    });

    if (existing) return;

    const draftNumber = await this.idGenerator.generateId('DO');

    const draft = await this.prisma.documentDraft.create({
      data: {
        draftNumber,
        documentType: DocumentType.DELIVERY_ORDER,
        sourceType: SourceDocumentType.WORK_ORDER,
        sourceId: workOrderId,
        status: DocumentDraftStatus.DRAFT,
        autoApproveAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        payload: {
          clientName: so.lead?.clientName || 'Unknown',
          brandName: so.brandName,
          soNumber: so.orderNumber,
          woNumber: wo.woNumber,
          shippingAddress: so.lead?.addressDetail || so.lead?.city || '-',
          contactPerson: so.lead?.clientName,
          shipDate: new Date().toISOString().split('T')[0],
          courierName: '',
          trackingNumber: '',
          items: so.items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            unit: 'PCS',
            notes: '',
          })),
          notes: `Delivery Order auto-generated from WO ${wo.woNumber}`,
        },
      },
    });

    this.logger.log(`[DOC_AUTO] Delivery Order draft created: ${draft.draftNumber}`);
    return draft;
  }

  async generateSuratJalanDraft(deliveryOrderId: string) {
    const doObj = await this.prisma.deliveryOrder.findUnique({
      where: { id: deliveryOrderId },
      include: {
        workOrder: {
          include: {
            lead: true,
            plan: {
              include: {
                so: { include: { lead: true, items: true } },
              },
            },
          },
        },
      },
    });

    if (!doObj?.workOrder?.plan?.so) return;

    const so = doObj.workOrder.plan.so;
    const wo = doObj.workOrder;

    const existing = await this.prisma.documentDraft.findFirst({
      where: {
        sourceType: SourceDocumentType.DELIVERY_ORDER,
        sourceId: deliveryOrderId,
        documentType: DocumentType.SURAT_JALAN,
        status: { in: [DocumentDraftStatus.DRAFT, DocumentDraftStatus.REVIEWING] },
      },
    });

    if (existing) return;

    const draftNumber = await this.idGenerator.generateId('SJ');

    const draft = await this.prisma.documentDraft.create({
      data: {
        draftNumber,
        documentType: DocumentType.SURAT_JALAN,
        sourceType: SourceDocumentType.DELIVERY_ORDER,
        sourceId: deliveryOrderId,
        status: DocumentDraftStatus.DRAFT,
        autoApproveAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        payload: {
          clientName: so.lead?.clientName || 'Unknown',
          brandName: so.brandName,
          shippingAddress: so.lead?.addressDetail || so.lead?.city || '-',
          shipDate: doObj.shippedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          vehicleNumber: '',
          driverName: '',
          items: so.items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            unit: 'PCS',
            notes: '',
          })),
          notes: `Surat Jalan untuk ${wo.woNumber}`,
        },
      },
    });

    this.logger.log(`[DOC_AUTO] Surat Jalan draft created: ${draft.draftNumber}`);
    return draft;
  }

  async generateDeliveryJournalDraft(deliveryOrderId: string) {
    const doObj = await this.prisma.deliveryOrder.findUnique({
      where: { id: deliveryOrderId },
      include: {
        workOrder: { include: { lead: true } },
      },
    });

    if (!doObj) return;

    const draftNumber = await this.idGenerator.generateId('JRN');

    const draft = await this.prisma.documentDraft.create({
      data: {
        draftNumber,
        documentType: DocumentType.JOURNAL_ENTRY,
        sourceType: SourceDocumentType.DELIVERY_ORDER,
        sourceId: deliveryOrderId,
        status: DocumentDraftStatus.DRAFT,
        autoApproveAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        payload: {
          description: `Delivery Journal for ${doObj.workOrder?.woNumber || deliveryOrderId}`,
          sourceDocumentType: 'PAYMENT',
          lines: [
            {
              accountCode: '1200',
              accountName: 'Piutang Dagang',
              debit: doObj.workOrder?.actualCogs || 0,
              credit: 0,
            },
            {
              accountCode: '4100',
              accountName: 'Pendapatan Maklon',
              debit: 0,
              credit: doObj.workOrder?.actualCogs || 0,
            },
          ],
          notes: `Journal auto-generated from Delivery Order`,
        },
      },
    });

    this.logger.log(`[DOC_AUTO] Delivery Journal draft created: ${draft.draftNumber}`);
    return draft;
  }

  // ──────────────────────────────────────────────
  // DRAFT MANAGEMENT (CRUD + Approval Flow)
  // ──────────────────────────────────────────────

  async findAll(filters?: { documentType?: string; status?: string; sourceType?: string }) {
    const where: any = {};
    if (filters?.documentType) where.documentType = filters.documentType;
    if (filters?.status) where.status = filters.status;
    if (filters?.sourceType) where.sourceType = filters.sourceType;

    return this.prisma.documentDraft.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const draft = await this.prisma.documentDraft.findUnique({ where: { id } });
    if (!draft) throw new NotFoundException(`Document draft ${id} not found`);
    return draft;
  }

  async updateDraft(id: string, dto: UpdateDraftDto, userId: string) {
    const draft = await this.findOne(id);

    if (draft.status === DocumentDraftStatus.APPROVED) {
      throw new BadRequestException('Cannot edit an approved draft');
    }

    const updateData: any = { updatedAt: new Date() };
    if (dto.payload) {
      if (!draft.originalPayload) {
        updateData.originalPayload = draft.payload;
      }
      updateData.payload = dto.payload;
      updateData.status = DocumentDraftStatus.REVIEWING;
    }
    if (dto.notes) updateData.notes = dto.notes;

    return this.prisma.documentDraft.update({
      where: { id },
      data: updateData,
    });
  }

  async approveDraft(id: string, dto: ApproveDraftDto, userId: string) {
    const draft = await this.findOne(id);

    if (draft.status === DocumentDraftStatus.APPROVED) {
      throw new BadRequestException('Draft already approved');
    }

    const approved = await this.prisma.documentDraft.update({
      where: { id },
      data: {
        status: DocumentDraftStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: userId,
        notes: dto.notes || draft.notes,
      },
    });

    await this.executeApprovedDraft(approved);

    this.eventEmitter.emit('document.draft_approved', {
      draftId: id,
      documentType: draft.documentType,
    });

    return approved;
  }

  async rejectDraft(id: string, dto: RejectDraftDto, userId: string) {
    const draft = await this.findOne(id);

    return this.prisma.documentDraft.update({
      where: { id },
      data: {
        status: DocumentDraftStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedById: userId,
        rejectReason: dto.reason,
      },
    });
  }

  async getStats() {
    const [total, drafts, reviewing, approved, rejected, converted] = await Promise.all([
      this.prisma.documentDraft.count(),
      this.prisma.documentDraft.count({ where: { status: DocumentDraftStatus.DRAFT } }),
      this.prisma.documentDraft.count({ where: { status: DocumentDraftStatus.REVIEWING } }),
      this.prisma.documentDraft.count({ where: { status: DocumentDraftStatus.APPROVED } }),
      this.prisma.documentDraft.count({ where: { status: DocumentDraftStatus.REJECTED } }),
      this.prisma.documentDraft.count({ where: { status: DocumentDraftStatus.CONVERTED } }),
    ]);

    return { total, drafts, reviewing, approved, rejected, converted };
  }

  // ──────────────────────────────────────────────
  // AUTO-APPROVE TIMER
  // ──────────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoApproveCron() {
    this.logger.log('[DOC_AUTO] Running auto-approval cron job');
    await this.processAutoApprovals();
  }

  async processAutoApprovals() {
    const now = new Date();
    const expiredDrafts = await this.prisma.documentDraft.findMany({
      where: {
        status: { in: [DocumentDraftStatus.DRAFT, DocumentDraftStatus.REVIEWING] },
        autoApproveAt: { lte: now },
      },
    });

    for (const draft of expiredDrafts) {
      this.logger.log(`[DOC_AUTO] Auto-approving draft: ${draft.draftNumber}`);

      const updated = await this.prisma.documentDraft.update({
        where: { id: draft.id },
        data: {
          status: DocumentDraftStatus.APPROVED,
          approvedAt: new Date(),
          notes: 'Auto-approved: no edits within deadline',
        },
      });

      await this.executeApprovedDraft(updated);

      this.eventEmitter.emit('document.draft_auto_approved', {
        draftId: draft.id,
        documentType: draft.documentType,
      });
    }

    return { processed: expiredDrafts.length };
  }

  // ──────────────────────────────────────────────
  // EXECUTE APPROVED DRAFTS
  // ──────────────────────────────────────────────

  private async executeApprovedDraft(draft: any) {
    const payload = draft.payload as any;

    try {
      switch (draft.documentType) {
        case DocumentType.INVOICE_DP:
        case DocumentType.INVOICE_FINAL:
          await this.createInvoiceFromDraft(draft, payload);
          break;
        case DocumentType.GOODS_REQUIREMENT:
          await this.createGoodsRequirementFromDraft(draft, payload);
          break;
        case DocumentType.DELIVERY_ORDER:
          await this.createDeliveryOrderFromDraft(draft, payload);
          break;
        case DocumentType.JOURNAL_ENTRY:
          await this.createJournalFromDraft(draft, payload);
          break;
        case DocumentType.QUOTATION:
        case DocumentType.SURAT_JALAN:
        case DocumentType.PURCHASE_REQUEST:
          this.logger.log(`[DOC_AUTO] Draft ${draft.documentType} approved — no auto-conversion needed`);
          break;
        default:
          this.logger.warn(`[DOC_AUTO] No executor for document type: ${draft.documentType}`);
      }
    } catch (error: any) {
      this.logger.error(`[DOC_AUTO] Failed to execute draft ${draft.draftNumber}: ${error?.message || error}`);
    }
  }

  private async createInvoiceFromDraft(draft: any, payload: any) {
    const invoiceNumber = await this.idGenerator.generateId('INV');

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        category: payload.category || 'RECEIVABLE',
        type: payload.type || InvoiceType.DP,
        status: 'UNPAID',
        amountDue: payload.amountDue,
        outstandingAmount: payload.outstandingAmount || payload.amountDue,
        soId: payload.soId,
        workOrderId: payload.workOrderId,
        dueDate: new Date(payload.dueDate),
        notes: payload.notes || `Auto-approved from draft ${draft.draftNumber}`,
      },
    });

    await this.prisma.documentDraft.update({
      where: { id: draft.id },
      data: { finalDocumentId: invoice.id, status: DocumentDraftStatus.CONVERTED },
    });

    this.logger.log(`[DOC_AUTO] Invoice created from draft: ${invoice.invoiceNumber}`);
    return invoice;
  }

  private async createGoodsRequirementFromDraft(draft: any, payload: any) {
    const code = await this.idGenerator.generateId('GR');

    const gr = await this.prisma.goodsRequirement.create({
      data: {
        code,
        salesOrderId: draft.sourceId,
        date: new Date(),
        status: 'DRAFT',
        notes: payload.notes || `Auto-approved from draft ${draft.draftNumber}`,
        items: {
          create: (payload.items || []).map((item: any) => ({
            materialId: item.materialId,
            qty: item.quantityRequired,
            notes: item.productName,
          })),
        },
      },
    });

    await this.prisma.documentDraft.update({
      where: { id: draft.id },
      data: { finalDocumentId: gr.id, status: DocumentDraftStatus.CONVERTED },
    });

    this.logger.log(`[DOC_AUTO] Goods Requirement created from draft: ${gr.code}`);
    return gr;
  }

  private async createDeliveryOrderFromDraft(draft: any, payload: any) {
    const doObj = await this.prisma.deliveryOrder.create({
      data: {
        workOrderId: draft.sourceId,
        trackingNumber: payload.trackingNumber || null,
        courierName: payload.courierName || null,
        status: 'SHIPPED',
      },
    });

    await this.prisma.documentDraft.update({
      where: { id: draft.id },
      data: { finalDocumentId: doObj.id, status: DocumentDraftStatus.CONVERTED },
    });

    this.logger.log(`[DOC_AUTO] Delivery Order created from draft: ${doObj.id}`);
    return doObj;
  }

  private async createJournalFromDraft(draft: any, payload: any) {
    const reference = await this.idGenerator.generateId('JRN');

    const journal = await this.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference,
        description: payload.description,
        sourceDocumentType: payload.sourceDocumentType,
        lines: {
          create: (payload.lines || []).map((line: any) => ({
            accountId: line.accountId,
            debit: line.debit || 0,
            credit: line.credit || 0,
          })),
        },
      },
    });

    this.logger.log(`[DOC_AUTO] Journal Entry created from draft: ${journal.reference}`);
    return journal;
  }
}
