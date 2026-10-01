import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../system/id-generator.service';
import { ScmService } from '../../scm/services/scm.service';
import { CreativeService } from '../../creative/creative.service';
import {
  Division,
  StreamEventType,
  PaymentStatus,
  RegStage,
  SOStatus,
  WorkflowStatus,
} from '@prisma/client';
import { ACTIVITY_EVENT } from '../../activity-stream/events/activity.events';
import {
  VerifyArPaymentDto,
  ArPaymentType,
} from '../dto/verify-ar-payment.dto';
import { CustomerLinkHelper } from '../../../common/helpers/customer-link.helper';

@Injectable()
export class FinanceInvoiceService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    @Inject(forwardRef(() => ScmService))
    private scmService: ScmService,
    private creativeService: CreativeService,
    private customerLink: CustomerLinkHelper,
  ) {}

  /**
   * Create a customer sales invoice (DRAFT).
   * Auto-generates invoiceNumber SI-YYMM-XXXXX.
   */
  async createSalesInvoice(
    userIdOrDto:
      | string
      | {
          customerId: string;
          invoiceDate?: string;
          dueDate: string;
          notes?: string;
          lineItems: Array<{
            itemCode: string;
            itemName: string;
            qty: number;
            unit: string;
            price: number;
            discount?: number;
          }>;
        },
    maybeDto?: {
      customerId: string;
      invoiceDate?: string;
      dueDate: string;
      notes?: string;
      lineItems: Array<{
        itemCode: string;
        itemName: string;
        qty: number;
        unit: string;
        price: number;
        discount?: number;
      }>;
    },
  ) {
    const dto =
      typeof userIdOrDto === 'string'
        ? maybeDto!
        : userIdOrDto;

    // Accepts a `customers` id or the `sales_leads` id the UI holds. See CustomerLinkHelper.
    const customer = await this.customerLink.resolveCustomer(dto.customerId);

    if (!dto.lineItems || dto.lineItems.length === 0) {
      throw new BadRequestException(
        `Sales invoice must have at least one line item`,
      );
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = dto.lineItems.map((item) => {
      const lineTotal = item.qty * item.price - (item.discount || 0);
      subtotal += lineTotal;
      return { ...item, discount: item.discount || 0, total: lineTotal };
    });
    // Tax 11% (PPN)
    const taxAmount = subtotal * 0.11;
    const totalAmount = subtotal + taxAmount;

    // Generate invoiceNumber SI-YYMM-XXXXX
    const now = new Date(dto.invoiceDate || Date.now());
    const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.salesInvoice.count({
      where: { invoiceNumber: { startsWith: `SI-${yymm}-` } },
    });
    const invoiceNumber = `SI-${yymm}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.salesInvoice.create({
      data: {
        invoiceNumber,
        customerId: customer.id,
        invoiceDate: now,
        dueDate: new Date(dto.dueDate),
        subtotal,
        taxAmount,
        totalAmount,
        notes: dto.notes,
        lineItems: { create: processedItems },
        paymentStatus: PaymentStatus.PENDING,
        deliveryStatus: 'PENDING',
      },
      include: { lineItems: true, customer: true },
    });
  }

  /**
   * Get sales invoices
   */
  async getSalesInvoices(filter?: {
    customerId?: string;
    status?: PaymentStatus;
  }) {
    return this.prisma.salesInvoice.findMany({
      where: filter,
      include: {
        customer: { select: { id: true, name: true } },
        lineItems: true,
        receipts: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  /**
   * Create a vendor bill in the unified invoice table.
   */
  async createBill(dto: {
    vendorId: string;
    billRef: string;
    issueDate: string;
    dueDate: string;
    amount: number;
  }) {
    const invoiceNumber = await this.idGenerator.generateId('BILL');
    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        category: 'PAYABLE',
        status: 'UNPAID',
        amountDue: dto.amount,
        outstandingAmount: dto.amount,
        supplierId: dto.vendorId,
        issuedAt: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        description: dto.billRef,
      },
    });
  }

  /**
   * Get vendor bills alias.
   */
  async getBills(category: 'RECEIVABLE' | 'PAYABLE' = 'PAYABLE') {
    return this.getInvoices(category);
  }

  /**
   * Create down payment.
   */
  async createDownPayment(
    userIdOrDto:
      | string
      | {
          vendorId: string;
          amount: number;
          dpDate?: string;
          notes?: string;
        },
    maybeDto?: {
      vendorId: string;
      amount: number;
      dpDate?: string;
      notes?: string;
    },
  ) {
    const userId = typeof userIdOrDto === 'string' ? userIdOrDto : 'SYSTEM';
    const dto =
      typeof userIdOrDto === 'string'
        ? maybeDto!
        : userIdOrDto;

    const vendor = await this.prisma.supplier.findUnique({
      where: { id: dto.vendorId },
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
    }

    const now = new Date(dto.dpDate || Date.now());
    const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.downPayment.count({
      where: { dpNumber: { startsWith: `DPB-${yymm}-` } },
    });
    const dpNumber = `DPB-${yymm}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.downPayment.create({
      data: {
        dpNumber,
        vendorId: dto.vendorId,
        date: now,
        amount: dto.amount,
        remainingAmount: dto.amount,
        status: PaymentStatus.PENDING,
        notes: dto.notes
          ? `${dto.notes} [created by ${userId}]`
          : `[created by ${userId}]`,
      },
    });
  }

  /**
   * Get active invoices.
   */
  async getActiveInvoices(limit: number = 5) {
    return this.prisma.invoice.findMany({
      where: { status: 'UNPAID', category: 'RECEIVABLE' },
      take: limit,
      include: { workOrder: { include: { lead: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get invoices with enriched fields for UI display.
   */
  async getInvoices(category?: 'RECEIVABLE' | 'PAYABLE') {
    const invoices = await this.prisma.invoice.findMany({
      where: category ? { category } : undefined,
      include: {
        so: { include: { lead: true } },
        supplier: true,
        workOrder: { include: { lead: true } },
      },
      orderBy: { dueDate: 'desc' },
    });
    return invoices.map((inv) => ({
      ...inv,
      customerName:
        inv.so?.lead?.clientName || inv.workOrder?.lead?.clientName || null,
      vendorName: inv.supplier?.name || null,
      billNumber: inv.invoiceNumber,
      totalAmount: Number(inv.amountDue ?? 0),
      paidAmount:
        Number(inv.amountDue ?? 0) - Number(inv.outstandingAmount ?? 0),
      remaining: Number(inv.outstandingAmount ?? 0),
    }));
  }

  /**
   * Get deliveries pending invoicing.
   */
  async getDeliveries() {
    return this.prisma.deliveryOrder.findMany({
      where: { invoice: null },
      include: { workOrder: { include: { lead: true } } },
    });
  }

  /**
   * Generate final invoice for a delivery order.
   */
  async generateFinalInvoice(deliveryOrderId: string) {
    const doObj = await this.prisma.deliveryOrder.findUnique({
      where: { id: deliveryOrderId },
      include: { workOrder: true },
    });
    if (!doObj) throw new NotFoundException('Delivery Order not found');

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: await this.idGenerator.generateId('INV'),
        category: 'RECEIVABLE',
        deliveryOrderId,
        workOrderId: doObj.workOrderId,
        amountDue: doObj.workOrder.actualCogs || 0,
        outstandingAmount: doObj.workOrder.actualCogs || 0,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      },
    });
  }

  /**
   * Get all final invoices tied to delivery orders.
   */
  async getAllFinalInvoices() {
    return this.prisma.invoice.findMany({
      where: { deliveryOrderId: { not: null } },
      include: {
        workOrder: { include: { lead: true } },
        deliveryOrder: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Validate invoice payment.
   */
  async validatePayment(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID' || Number(invoice.outstandingAmount) <= 0) {
      throw new BadRequestException('Invoice already validated');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        outstandingAmount: 0,
      },
    });
  }

  /**
   * Get pending receivable verifications.
   */
  async getPendingVerifications() {
    return this.prisma.invoice.findMany({
      where: {
        category: 'RECEIVABLE',
        status: { in: ['UNPAID', 'PARTIAL'] },
      },
      include: {
        so: { include: { lead: true } },
        workOrder: { include: { lead: true } },
        payments: {
          where: { attachmentUrls: { isEmpty: false } },
        },
      },
    });
  }

  /**
   * Verify invoice payment with transaction and gate opening events.
   */
  async verifyPayment(invoiceId: string, verifiedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { so: true },
      });

      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status === 'PAID' || Number(invoice.outstandingAmount) <= 0) {
        throw new BadRequestException('Invoice already verified');
      }

      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          outstandingAmount: 0,
        },
      });

      this.eventEmitter.emit('INVOICE_PAID_ON_TIME', {
        employeeId: verifiedBy,
        referenceId: invoiceId,
        metadata: {
          invoiceNumber: updated.invoiceNumber,
          amount: Number(updated.amountDue) || 0,
          soId: invoice.so?.id,
        },
      });

      // Emit Finance Gate Opened Event if it was a DP
      if (invoice.type === 'DP' && invoice.soId) {
        await tx.salesOrder.update({
          where: { id: invoice.soId },
          data: { status: 'ACTIVE' },
        });

        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: invoice.so?.leadId,
          senderDivision: Division.FINANCE,
          eventType: StreamEventType.GATE_OPENED,
          notes: `VERIFIED: DP 50% divalidasi. Membuka gembok SCM & Produksi.`,
          loggedBy: verifiedBy,
        });
      }

      return updated;
    });
  }

  /**
   * Get sample requests for payment verification.
   */
  async getSamplePayments() {
    return this.prisma.sampleRequest.findMany({
      include: {
        lead: {
          include: { pic: true },
        },
        pic: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Verify order / sample payment from sales.
   */
  async verifyOrderPayment(dto: {
    type: string;
    id: string;
    verifiedBy: string;
    isFoc?: boolean;
    bankAccount?: string;
    notes?: string;
  }) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        dto.id,
      );

    if (dto.type === 'SAMPLE') {
      let lead: any = null;
      let sample: any = null;

      if (isUuid) {
        lead = await this.prisma.salesLead.findUnique({
          where: { id: dto.id },
        });
        sample = await this.prisma.sampleRequest.findUnique({
          where: { id: dto.id },
          include: { lead: true },
        });
        if (sample && !lead && sample.lead) {
          lead = sample.lead;
        }
      }

      if (!lead && !sample) {
        sample = await this.prisma.sampleRequest.findFirst({
          where: { sampleCode: dto.id },
          include: { lead: true },
        });
        if (sample && sample.lead) {
          lead = sample.lead;
        }
      }

      if (!lead && !sample) {
        throw new NotFoundException(`Sample or Lead '${dto.id}' not found`);
      }

      return this.prisma.$transaction(async (tx) => {
        if (sample) {
          await tx.sampleRequest.update({
            where: { id: sample.id },
            data: {
              paymentApprovedAt: new Date(),
              stage: 'QUEUE',
            },
          });
        }

        if (lead) {
          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              activityType: 'SAMPLE_PAYMENT',
              amount: lead.estimatedValue || 0,
              isValidated: true,
              validatedBy: dto.verifiedBy,
              notes:
                dto.notes ||
                `Sample payment verified for lead ${lead.clientName} (${lead.brandName || ''})`,
              metadata: {
                sampleId: sample?.id || lead.id,
                isFoc: !!dto.isFoc,
                bankAccount: dto.bankAccount,
              },
            },
          });

          await tx.salesLead.update({
            where: { id: lead.id },
            data: {
              status: 'SAMPLE_REQUESTED' as any,
              convertedToSampleAt: new Date(),
            },
          });
        }

        return {
          success: true,
          leadId: lead?.id,
          sampleId: sample?.id,
          status: 'SAMPLE_REQUESTED',
        };
      });
    }

    let so: any = null;
    if (isUuid) {
      so = await this.prisma.salesOrder.findUnique({
        where: { id: dto.id },
        include: { lead: true },
      });
    } else {
      so = await this.prisma.salesOrder.findFirst({
        where: { orderNumber: dto.id },
        include: { lead: true },
      });
    }

    if (!so) throw new NotFoundException(`Sales Order '${dto.id}' not found`);
    if (so.status === 'LOCKED_ACTIVE' || so.status === 'COMPLETED') {
      throw new BadRequestException('Sales Order already verified');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create a lead activity to track payment verification
      if (so.leadId) {
        await tx.leadActivity.create({
          data: {
            leadId: so.leadId,
            activityType: 'DOWN_PAYMENT',
            amount: so.totalAmount,
            isValidated: true,
            validatedBy: dto.verifiedBy,
            notes: dto.notes || `Payment verified for SO ${so.orderNumber}`,
            metadata: { salesOrderId: so.id, bankAccount: dto.bankAccount },
          },
        });

        await tx.salesLead.update({
          where: { id: so.leadId },
          data: { status: 'DP_PAID' as any },
        });
      }

      await tx.salesOrder.update({
        where: { id: so.id },
        data: { status: 'LOCKED_ACTIVE' as any },
      });

      return { success: true, orderId: so.id };
    });
  }

  /**
   * Validate payment from Business Development activity.
   */
  async validateBussdevPayment(activityId: string, validatedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.leadActivity.findUnique({
        where: { id: activityId },
        include: { lead: true },
      });

      if (!activity) throw new NotFoundException('Lead Activity not found');
      if (activity.isValidated) {
        throw new BadRequestException('Payment already validated');
      }

      const updatedActivity = await tx.leadActivity.update({
        where: { id: activityId },
        data: {
          isValidated: true,
          validatedBy: validatedBy,
        },
      });

      // Emit Activity Stream Event
      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: activity.leadId,
        senderDivision: Division.FINANCE,
        eventType: StreamEventType.GATE_OPENED,
        notes: `VALIDATED: Pembayaran Rp ${Number(activity.amount || 0).toLocaleString()} telah divalidasi.`,
        loggedBy: validatedBy,
      });

      // Trigger Parallel Events if it's a DEAL stage
      if (
        activity.lead.status === 'SPK_SIGNED' ||
        activity.lead.status === 'PRODUCTION_PLAN' ||
        activity.activityType === 'DOWN_PAYMENT'
      ) {
        this.eventEmitter.emit('finance.payment_validated', {
          leadId: activity.leadId,
          activityId: activity.id,
          amount: Number(activity.amount || 0),
          verifiedBy: validatedBy,
        });
      }

      // PHASE 1: Handle Sample Payment
      if (activity.activityType === 'SAMPLE_PAYMENT') {
        await tx.sampleRequest.updateMany({
          where: { leadId: activity.leadId, stage: 'WAITING_FINANCE' },
          data: {
            stage: 'QUEUE',
            paymentApprovedAt: new Date(),
            paymentApprovedById: validatedBy,
          },
        });

        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: activity.leadId,
          senderDivision: Division.RND,
          eventType: StreamEventType.HANDOVER,
          notes: `DANA MASUK: Pembayaran sample telah divalidasi. Request Sample kini aktif di Inbox R&D.`,
          loggedBy: validatedBy,
        });
      }

      return updatedActivity;
    });
  }

  /**
   * Get AR Hub pending requests.
   */
  async getArHubPending() {
    const samples = await this.prisma.leadActivity.findMany({
      where: {
        activityType: { in: ['SAMPLE_PAYMENT', 'DOWN_PAYMENT'] },
        isValidated: false,
      },
      include: { lead: true },
    });

    const orders = await this.prisma.invoice.findMany({
      where: {
        category: 'RECEIVABLE',
        status: { in: ['UNPAID', 'PARTIAL'] },
      },
      include: {
        so: { include: { lead: true } },
        workOrder: { include: { lead: true } },
      },
    });

    return {
      samples,
      orders,
    };
  }

  /**
   * Verify AR payment with full accounting entries and parallel triggers.
   */
  async verifyArHubPayment(dto: VerifyArPaymentDto, verifiedBy: string) {
    const {
      type,
      id,
      receivingAccountId,
      actualAmount,
      bankAdminFee,
      taxAmount,
      notes,
    } = dto;

    return await this.prisma.$transaction(async (tx) => {
      let clientName = '';
      let leadId = '';

      if (String(type) === 'SAMPLE') {
        const activity = await tx.leadActivity.findUnique({
          where: { id },
          include: { lead: true },
        });
        if (!activity) throw new NotFoundException('Sample Activity not found');
        clientName = activity.lead.clientName;
        leadId = activity.leadId;

        // Update Activity
        await tx.leadActivity.update({
          where: { id },
          data: { isValidated: true, validatedBy: verifiedBy },
        });

        // Update Sample Request
        await tx.sampleRequest.updateMany({
          where: { leadId, stage: 'WAITING_FINANCE' },
          data: {
            stage: 'QUEUE',
            paymentApprovedAt: new Date(),
            paymentApprovedById: verifiedBy,
          },
        });
      } else if (type === ArPaymentType.DP_ORDER) {
        const activity = await tx.leadActivity.findUnique({
          where: { id },
          include: { lead: true },
        });
        if (!activity)
          throw new NotFoundException('Down Payment Activity not found');
        clientName = activity.lead.clientName;
        leadId = activity.leadId;

        // 1. Update Activity
        await tx.leadActivity.update({
          where: { id },
          data: { isValidated: true, validatedBy: verifiedBy },
        });

        // 2. Update Sales Order status to LOCKED_ACTIVE
        await tx.salesOrder.updateMany({
          where: { leadId: leadId, status: 'PENDING_DP' },
          data: { status: 'LOCKED_ACTIVE' },
        });

        // 3. Update Lead Status to DP_PAID
        await tx.salesLead.update({
          where: { id: leadId },
          data: { status: 'DP_PAID' as any },
        });

        // 4. TRIPLE PARALLEL TRIGGER
        // A. Legal Pipeline
        const complianceUser = await tx.user.findFirst({
          where: { roles: { has: 'COMPLIANCE' } },
        });

        await tx.regulatoryPipeline.create({
          data: {
            leadId: leadId,
            currentStage: RegStage.DRAFT,
            type: 'BPOM',
            legalPicId: complianceUser?.id || verifiedBy, // Fallback to current user if no compliance officer found
            logHistory: [
              {
                stage: RegStage.DRAFT,
                date: new Date().toISOString(),
                notes:
                  'AUTO-GEN: Financial Gate 2 Passed. Registration initiated.',
              },
            ],
          },
        });

        // B. Emit Event for SCM Stock Check
        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: leadId,
          senderDivision: Division.FINANCE,
          eventType: StreamEventType.STOCK_CHECK_READY,
          notes: `TRIPLE PARALLEL: DP divalidasi. SCM mohon lakukan pengecekan BOM untuk brand ${activity.lead.brandName}.`,
          loggedBy: verifiedBy,
        });

        // C. Activity Stream for Legal
        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: leadId,
          senderDivision: Division.FINANCE,
          eventType: StreamEventType.HKI_BPOM_REGISTRATION,
          notes: `TRIPLE PARALLEL: Registrasi HKI/BPOM untuk ${activity.lead.brandName} dimulai.`,
          loggedBy: verifiedBy,
        });

        // D. PHASE 3: SCM PR AUTOMATION
        const prResult =
          await this.scmService.autoCreatePurchaseRequestFromLead(leadId);
        if (prResult.status === 'PR_CREATED') {
          this.eventEmitter.emit(ACTIVITY_EVENT, {
            leadId: leadId,
            senderDivision: Division.SCM,
            eventType: StreamEventType.STOCK_CHECK_SHORTAGE,
            notes: `SCM AUTOMATION: Kekurangan stok dideteksi. Purchase Request (PR) otomatis dibuat untuk material yang kurang.`,
            loggedBy: 'SYSTEM_SCM',
            payload: {
              prId: (prResult as any).prId,
              itemCount: (prResult as any).itemCount,
            },
          });
        }

        // E. PHASE 4: CREATIVE AUTOMATION
        await this.creativeService.createTask({
          leadId,
          brief: `AUTO-GEN: Desain Kemasan untuk ${activity.lead.brandName} (${activity.lead.productInterest}). DP Produksi telah lunas.`,
          soId: (activity.metadata as any)?.salesOrderId,
        });

        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: leadId,
          senderDivision: Division.CREATIVE,
          eventType: StreamEventType.HKI_BPOM_REGISTRATION,
          notes: `CREATIVE AUTOMATION: Task desain kemasan otomatis dibuat.`,
          loggedBy: 'SYSTEM_CREATIVE',
        });

        // F. PHASE 4: WAREHOUSE READINESS (Decoupled Event)
        this.eventEmitter.emit(
          'finance.payment_verified_warehouse_check',
          { leadId },
        );
      } else if (type === ArPaymentType.PELUNASAN) {
        const activity = await tx.leadActivity.findUnique({
          where: { id },
          include: { lead: true },
        });
        if (!activity)
          throw new NotFoundException('Final Payment Activity not found');
        clientName = activity.lead.clientName;
        leadId = activity.leadId;

        // G. PHASE 5: FINAL PAYMENT GATES & CLOSURE
        const salesOrderId = (activity.metadata as any)?.salesOrderId;
        if (salesOrderId) {
          const so = await tx.salesOrder.findUnique({
            where: { id: salesOrderId },
            include: { lead: true },
          });

          // Early payment protection: only transition to COMPLETED if already SHIPPED
          if (
            so &&
            (so.status === SOStatus.SHIPPED || so.status === SOStatus.COMPLETED)
          ) {
            await tx.salesOrder.update({
              where: { id: salesOrderId },
              data: { status: SOStatus.COMPLETED },
            });
          }

          if (leadId) {
            const lead = await tx.salesLead.findUnique({
              where: { id: leadId },
            });
            if (
              lead &&
              (lead.status === WorkflowStatus.READY_TO_SHIP ||
                lead.status === WorkflowStatus.WON_DEAL)
            ) {
              await tx.salesLead.update({
                where: { id: leadId },
                data: { status: WorkflowStatus.WON_DEAL, wonAt: new Date() },
              });
            }
          }

          // Auto-create JournalEntry for Final Payment
          if (so) {
            const ppnAcc = await tx.account.findFirst({
              where: { code: '2201' },
            });
            const baseAmount = actualAmount + bankAdminFee - taxAmount;

            const lines: {
              accountId: string;
              debit: number;
              credit: number;
            }[] = [
              { accountId: receivingAccountId, debit: actualAmount, credit: 0 },
            ];
            if (bankAdminFee > 0) {
              const adminAcc = await tx.account.findFirst({
                where: { OR: [{ code: '6224' }, { code: '8100' }] },
              });
              if (adminAcc)
                lines.push({
                  accountId: adminAcc.id,
                  debit: bankAdminFee,
                  credit: 0,
                });
            }
            const revenueAcc = await tx.account.findFirst({
              where: { code: { startsWith: '4' }, type: 'REVENUE' },
            });
            if (revenueAcc) {
              lines.push({
                accountId: revenueAcc.id,
                debit: 0,
                credit: baseAmount,
              });
            }
            if (taxAmount > 0 && ppnAcc) {
              lines.push({
                accountId: ppnAcc.id,
                debit: 0,
                credit: taxAmount,
              });
            }

            await tx.journalEntry.create({
              data: {
                date: new Date(),
                reference: `PELUNASAN-${so.orderNumber}`,
                description: `Pelunasan Sales Order ${so.orderNumber} \u2014 ${so.lead?.clientName || 'Unknown'}`,
                soId: salesOrderId,
                sourceDocumentType: 'SALES_ORDER',
                lines: { create: lines },
              },
            });
          }

          this.eventEmitter.emit(ACTIVITY_EVENT, {
            leadId: leadId,
            senderDivision: Division.FINANCE,
            eventType: StreamEventType.STATE_CHANGE,
            notes: `PROJECT CLOSED: Pelunasan akhir diverifikasi. Lead status: WON_DEAL. Jurnal akuntansi tercatat.`,
            loggedBy: verifiedBy,
          });
        }
      } else {
        const invoice = await tx.invoice.findUnique({
          where: { id },
          include: {
            so: { include: { lead: true } },
            workOrder: { include: { lead: true } },
          },
        });

        if (!invoice) throw new NotFoundException('Invoice not found');
        clientName =
          invoice.so?.lead?.clientName ||
          invoice.workOrder?.lead?.clientName ||
          'Unknown';
        leadId = invoice.so?.leadId || invoice.workOrderId || '';

        // Update Invoice
        await tx.invoice.update({
          where: { id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            outstandingAmount: 0,
          },
        });

        if (invoice.soId) {
          await tx.salesOrder.update({
            where: { id: invoice.soId },
            data: { status: 'ACTIVE' },
          });
        }
      }

      // Skip shared journal for PELUNASAN (already created above)
      if (type === ArPaymentType.PELUNASAN) {
        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: leadId,
          senderDivision: Division.FINANCE,
          eventType: StreamEventType.GATE_OPENED,
          notes: `VALIDATED: Pembayaran [${type}] sebesar Rp ${actualAmount.toLocaleString()} telah divalidasi.`,
          loggedBy: verifiedBy,
        });
        return { success: true };
      }

      // 1. Determine Credit Account by type
      let creditAccountId = '';
      if (type === ArPaymentType.SAMPLE) {
        const acc = await tx.account.findFirst({
          where: {
            OR: [{ code: '4101' }, { code: '2102' }, { code: '2300' }],
          },
        });
        creditAccountId = acc?.id || '';
      } else {
        const acc = await tx.account.findFirst({
          where: { OR: [{ code: '2102' }, { code: '2301' }] },
        });
        creditAccountId = acc?.id || '';
      }

      // 2. Determine Supporting Accounts
      const adminAcc = await tx.account.findFirst({
        where: { OR: [{ code: '6224' }, { code: '8100' }] },
      });
      const ppnAcc = await tx.account.findFirst({
        where: {
          OR: [{ code: '2301' }, { code: '2201' }, { code: '2105' }],
        },
      });

      if (bankAdminFee > 0 && !adminAcc)
        throw new BadRequestException(
          'Account 6224/8100 (Admin Fee) not found',
        );
      if (taxAmount > 0 && !ppnAcc)
        throw new BadRequestException(
          'Account 2301/2201 (Tax Account) not found',
        );

      // 3. Calculate Base Amount
      const baseAmount = actualAmount + bankAdminFee - taxAmount;

      // 4. Create Journal Entry
      const lines = [];
      lines.push({
        accountId: receivingAccountId,
        debit: actualAmount,
        credit: 0,
      });
      if (bankAdminFee > 0)
        lines.push({ accountId: adminAcc!.id, debit: bankAdminFee, credit: 0 });
      lines.push({ accountId: creditAccountId, debit: 0, credit: baseAmount });
      if (taxAmount > 0)
        lines.push({ accountId: ppnAcc!.id, debit: 0, credit: taxAmount });

      await tx.journalEntry.create({
        data: {
          date: new Date(),
          description: `AR HUB VERIFICATION [${type}] - ${clientName} - ${notes || ''}`,
          lines: { create: lines },
        },
      });

      // Emit Activity Stream Event
      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: leadId,
        senderDivision: Division.FINANCE,
        eventType: StreamEventType.GATE_OPENED,
        notes: `VALIDATED: Pembayaran [${type}] sebesar Rp ${actualAmount.toLocaleString()} telah divalidasi.`,
        loggedBy: verifiedBy,
      });

      return { success: true };
    });
  }

  /**
   * Verify AR payment alias.
   */
  async verifyArPayment(dto: VerifyArPaymentDto, verifiedBy: string) {
    return this.verifyArHubPayment(dto, verifiedBy);
  }
}
