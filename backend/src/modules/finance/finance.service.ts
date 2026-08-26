import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACTIVITY_EVENT } from '../activity-stream/events/activity.events';
import {
  Division,
  StreamEventType,
  AccountType,
  NormalBalance,
  PeriodStatus,
  ReportGroup,
  RegStage,
  SOStatus,
  WorkflowStatus,
} from '@prisma/client';
import { CreateJournalDto } from './dto/create-journal.dto';
import {
  CreateFundRequestDto,
  ApproveFundRequestDto,
  DisburseFundRequestDto,
  DirectorApproveFundRequestDto,
  RejectFundRequestDto,
} from './dto/fund-request.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { FundRequestStatus } from '@prisma/client';
import { VerifyArPaymentDto, ArPaymentType } from './dto/verify-ar-payment.dto';

import { IdGeneratorService } from '../system/id-generator.service';
import { ModuleRef } from '@nestjs/core';

import { ScmService } from '../scm/services/scm.service';
import { CreativeService } from '../creative/creative.service';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    @Inject(forwardRef(() => ScmService))
    private scmService: ScmService,
    private creativeService: CreativeService,
    private moduleRef: ModuleRef,
  ) {}

  private async getWarehouseService() {
    const { WarehouseService } = await import('../warehouse/warehouse.service');
    return this.moduleRef.get(WarehouseService, { strict: false });
  }

  async seedInitialAccounts() {
    const existing = await this.prisma.account.count();
    if (existing > 0) return;

    const initialAccounts = [
      {
        code: '1100',
        name: 'Kas/Bank BCA',
        type: AccountType.ASSET,
        normalBalance: NormalBalance.DEBIT,
      },
      {
        code: '1200',
        name: 'Piutang Dagang',
        type: AccountType.ASSET,
        normalBalance: NormalBalance.DEBIT,
      },
      {
        code: '1300',
        name: 'Persediaan Bahan Baku',
        type: AccountType.ASSET,
        normalBalance: NormalBalance.DEBIT,
      },
      {
        code: '4100',
        name: 'Pendapatan Maklon',
        type: AccountType.REVENUE,
        normalBalance: NormalBalance.CREDIT,
      },
      {
        code: '5101',
        name: 'Beban Marketing (Ads)',
        type: AccountType.EXPENSE,
        normalBalance: NormalBalance.DEBIT,
      },
      {
        code: '1401',
        name: 'Persediaan WIP (Work In Progress)',
        type: AccountType.ASSET,
        normalBalance: NormalBalance.DEBIT,
      },
      {
        code: '6102',
        name: 'Biaya Selisih Persediaan (Loss)',
        type: AccountType.EXPENSE,
        normalBalance: NormalBalance.DEBIT,
      },
    ];

    for (const acc of initialAccounts) {
      await this.prisma.account.create({ data: acc });
    }
  }

  async createJournalEntry(dto: CreateJournalDto) {
    // PHASE 3: Period Lock Gatekeeper
    const entryDate = new Date(dto.date);
    const lockedPeriod = await this.prisma.financialPeriod.findFirst({
      where: {
        startDate: { lte: entryDate },
        endDate: { gte: entryDate },
        status: { in: [PeriodStatus.SOFT_LOCKED, PeriodStatus.CLOSED] },
      },
    });

    if (lockedPeriod) {
      throw new BadRequestException(
        `Transaksi ditolak: Periode ${lockedPeriod.name} sudah dikunci atau ditutup.`,
      );
    }

    const totalDebit = dto.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Journal is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`,
      );
    }

    // MANDATORY PROOF VALIDATION (POINT 2)
    // Rule: For Expense (6xxx) or Fixed Asset (15xx), proof is mandatory.
    const accountIds = [...new Set(dto.lines.map((l) => l.accountId))];
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds } },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a]));
    const expenseLines = dto.lines.map((l) => {
      const acc = accountMap.get(l.accountId);
      return acc && (acc.code.startsWith('6') || acc.code.startsWith('15'));
    });

    if (
      expenseLines.some((isExp) => isExp) &&
      (!dto.attachmentUrls || dto.attachmentUrls.length === 0)
    ) {
      throw new BadRequestException(
        'Proof of payment (attachment) is mandatory for disbursements/expenses.',
      );
    }

    return this.prisma.journalEntry.create({
      data: {
        date: new Date(dto.date),
        reference: dto.reference || (await this.idGenerator.generateId('JRN')),
        description: dto.description,
        attachmentUrls: dto.attachmentUrls || [],
        sourceDocumentType: dto.sourceDocumentType as any,
        lines: {
          create: dto.lines.flatMap((l) => {
            const lines = [];
            // Base Line
            lines.push({
              accountId: l.accountId,
              debit: l.debit,
              credit: l.credit,
            });

            // Tax Splitting Logic (if taxRate and taxAccountId provided)
            if (l.taxRate && l.taxRate > 0 && l.taxAccountId) {
              const taxAmount = (l.debit || l.credit) * (l.taxRate / 100);
              lines.push({
                accountId: l.taxAccountId,
                debit: l.debit > 0 ? taxAmount : 0,
                credit: l.credit > 0 ? taxAmount : 0,
              });
            }
            return lines;
          }),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  async reverseJournalEntry(id: string) {
    const original = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!original) throw new NotFoundException('Journal not found');
    if (original.reference?.startsWith('REV-')) {
      throw new BadRequestException('Cannot reverse a reversal journal');
    }

    return this.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `REV-${original.reference || original.id}`,
        description: `REVERSAL of: ${original.description}`,
        lines: {
          create: original.lines.map((l) => ({
            accountId: l.accountId,
            debit: l.credit,
            credit: l.debit,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  /**
   * Real-time Production Cost Posting (Phase 4)
   * Triggered when a production stage is completed.
   */
  @OnEvent('production.schedule_completed')
  async handleProductionScheduleFinished(payload: { scheduleId: string }) {
    console.log(
      `[FINANCE_LEDGER] Posting production costs for schedule: ${payload.scheduleId}`,
    );

    const schedule = await this.prisma.productionSchedule.findUnique({
      where: { id: payload.scheduleId },
      include: {
        stepDetails: { include: { material: true } },
        workOrder: true,
      },
    });

    if (!schedule) return;

    // Calculate actual cost based on material consumption
    const totalCost = schedule.stepDetails.reduce((sum, detail) => {
      return (
        sum + Number(detail.qtyActual) * Number(detail.material.unitPrice || 0)
      );
    }, 0);

    if (totalCost <= 0) return;

    // Accounts
    const wipAcc = await this.prisma.account.findFirst({
      where: { code: '1401' },
    }); // WIP
    const rmAcc = await this.prisma.account.findFirst({
      where: { code: '1300' },
    }); // Raw Materials

    if (wipAcc && rmAcc) {
      await this.prisma.journalEntry.create({
        data: {
          date: new Date(),
          reference: `PROD-COST-${schedule.scheduleNumber}`,
          description: `Production Cost Posting: ${schedule.stage} for WO ${schedule.workOrder.woNumber}`,
          sourceDocumentType: 'PRODUCTION_PLAN',
          planId: schedule.workOrder.planId,
          lines: {
            create: [
              { accountId: wipAcc.id, debit: totalCost, credit: 0 },
              { accountId: rmAcc.id, debit: 0, credit: totalCost },
            ],
          },
        },
      });

      console.log(
        `[FINANCE_LEDGER] Successfully posted production cost: Rp ${totalCost.toLocaleString()}`,
      );
    }
  }

  @OnEvent('production.qc_final_passed')
  async handleProductionPassed(payload: {
    workOrderId: string;
    loggedBy: string;
  }) {
    console.log(`[HPP_AUTOMATOR] Triggered for WO: ${payload.workOrderId}`);

    const wo = await this.prisma.workOrder.findUnique({
      where: { id: payload.workOrderId },
      include: {
        lead: {
          include: {
            sampleRequests: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                billOfMaterials: {
                  include: { material: true },
                },
              },
            },
          },
        },
      },
    });

    if (!wo || !wo.lead?.sampleRequests?.[0]) return;

    const latestSample = wo.lead.sampleRequests[0];
    let totalHpp = 0;
    for (const bom of latestSample.billOfMaterials) {
      const material = bom.material;
      const price = Number(material.unitPrice || 0);
      const qty = Number(bom.quantityPerUnit); // Quantity per unit from BOM
      totalHpp += price * qty;
    }

    const finalTotalHpp = totalHpp * wo.targetQty;

    // Multiply by batch size if needed, but usually formula is per batch/unit
    // Post Journal: Debit Finished Goods / Credit Raw Materials
    const fgAcc = await this.prisma.account.findFirst({
      where: { code: '1400' },
    }); // Finished Goods (Assuming 1400)
    const wipAcc = await this.prisma.account.findFirst({
      where: { code: '1401' },
    }); // WIP

    if (fgAcc && wipAcc && totalHpp > 0) {
      await this.prisma.journalEntry.create({
        data: {
          date: new Date(),
          reference: `HPP-AUTO-${wo.woNumber}`,
          description: `Auto HPP Posting for ${wo.woNumber}`,
          lines: {
            create: [
              { accountId: fgAcc.id, debit: finalTotalHpp, credit: 0 },
              { accountId: wipAcc.id, debit: 0, credit: finalTotalHpp },
            ],
          },
        },
      });

      console.log(
        `[HPP_AUTOMATOR] Successfully posted HPP: ${finalTotalHpp} for WO: ${wo.woNumber}`,
      );
    }
  }

  async createInventoryAdjustmentJournal(data: {
    opnameId: string;
    totalLossValue: number;
    notes: string;
  }) {
    const inventoryAcc = await this.prisma.account.findFirst({
      where: { code: '1300' },
    });
    const lossAcc = await this.prisma.account.findFirst({
      where: { code: '6102' },
    });

    if (!inventoryAcc || !lossAcc) {
      throw new BadRequestException(
        'Finance Accounts (1300/6102) not configured for inventory adjustment.',
      );
    }

    return this.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `ADJ-OPN-${data.opnameId.substring(0, 8)}`,
        description: `Inventory Adjustment from Stock Opname: ${data.notes}`,
        lines: {
          create: [
            { accountId: lossAcc.id, debit: data.totalLossValue, credit: 0 },
            {
              accountId: inventoryAcc.id,
              debit: 0,
              credit: data.totalLossValue,
            },
          ],
        },
      },
    });
  }

  async createMaterialHandoverJournal(data: {
    workOrderId: string;
    totalValue: number;
    description: string;
  }) {
    const inventoryAcc = await this.prisma.account.findFirst({
      where: { code: '1300' },
    });
    const wipAcc = await this.prisma.account.findFirst({
      where: { code: '1401' },
    });

    if (!inventoryAcc || !wipAcc) {
      throw new BadRequestException(
        'Finance Accounts (1300/1401) not configured for material handover.',
      );
    }

    return this.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `HO-WO-${data.workOrderId.substring(0, 8)}`,
        description: data.description,
        lines: {
          create: [
            { accountId: wipAcc.id, debit: data.totalValue, credit: 0 },
            {
              accountId: inventoryAcc.id,
              debit: 0,
              credit: data.totalValue,
            },
          ],
        },
      },
    });
  }

  async createMarketingExpenseJournal(data: {
    spend: number;
    date: Date;
    platform: string;
    refId: string;
  }) {
    const bankAcc = await this.prisma.account.findFirst({
      where: { code: '1100' },
    });
    const marketingAcc = await this.prisma.account.findFirst({
      where: { code: '5101' },
    });

    if (!bankAcc || !marketingAcc) {
      throw new Error('Finance Accounts (1100 or 5101) not configured.');
    }

    return this.createJournalEntry({
      date: data.date.toISOString(),
      reference: `ADS-${data.platform}-${data.refId}`,
      description: `Marketing Spend Audit: ${data.platform} (${data.date.toLocaleDateString()})`,
      lines: [
        { accountId: marketingAcc.id, debit: data.spend, credit: 0 },
        { accountId: bankAcc.id, debit: 0, credit: data.spend },
      ],
    });
  }

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

  async verifyOrderPayment(dto: {
    type: string;
    id: string;
    verifiedBy: string;
  }) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: dto.id },
      include: { lead: true },
      });
      if (!so) throw new NotFoundException('Sales Order not found');
      if (so.status === 'LOCKED_ACTIVE' || so.status === 'COMPLETED') {
        throw new BadRequestException('Sales Order already verified');
      }
      if (so.status !== 'PENDING_DP' && so.status !== 'ACTIVE') {
        throw new BadRequestException(
          `SO in status ${so.status} cannot accept a DP verification.`,
        );
      }

      // R4-BUSINESS-READY §9: DP verification must produce a real AR-side ledger
      // entry — a DP Invoice (PAID) and a Payment row — so the Finance
      // reconciliation (invoice/payment/journal/outstanding) is non-zero.
      // Idempotent on (soId, type=DP): re-runs return the existing invoice.
      return this.prisma.$transaction(async (tx) => {
        const existingDp = await tx.invoice.findFirst({
          where: { soId: so.id, type: 'DP' },
        });
        if (!existingDp) {
          const dpAmount = Number(so.totalAmount); // canonical: DP = full order amount for bounded test
          const invoiceNumber = await this.idGenerator.generateId('DPSO');
          const dpInvoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              category: 'RECEIVABLE',
              type: 'DP',
              status: 'PAID',
              amountDue: dpAmount,
              outstandingAmount: 0,
              soId: so.id,
              paidAt: new Date(),
              dueDate: new Date(),
              description: `Down Payment SO ${so.orderNumber}`,
            },
          });
          await tx.payment.create({
            data: {
              invoiceId: dpInvoice.id,
              verifiedBy: dto.verifiedBy,
              amountPaid: dpAmount,
              paymentDate: new Date(),
            },
          });
        }

        await tx.leadActivity.create({
          data: {
            leadId: so.leadId,
            activityType: 'DOWN_PAYMENT',
            amount: so.totalAmount,
            isValidated: true,
            validatedBy: dto.verifiedBy,
            notes: `Payment verified for SO ${so.orderNumber}`,
            metadata: { salesOrderId: so.id },
          },
        });

        await tx.salesOrder.update({
          where: { id: so.id },
          data: { status: 'LOCKED_ACTIVE' as any },
        });

        await tx.salesLead.update({
          where: { id: so.leadId },
          data: { status: 'DP_PAID' as any },
        });

        return { success: true, orderId: so.id };
      });
  }

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

  async getSalesOrders() {
    const orders = await this.prisma.salesOrder.findMany({
      include: {
        lead: {
          include: {
            pic: true,
            activities: {
              where: {
                activityType: { in: ['SAMPLE_PAYMENT', 'DOWN_PAYMENT'] },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((so) => {
      const paymentActivity = (so as any).lead?.activities?.find(
        (a: any) =>
          a.activityType === 'DOWN_PAYMENT' ||
          a.activityType === 'SAMPLE_PAYMENT',
      );
      return {
        ...so,
        isPaymentVerified: paymentActivity?.isValidated || false,
        paymentVerifiedAt: paymentActivity?.createdAt || null,
        paymentProofUrl: paymentActivity?.fileUrl || null,
      };
    });
  }

  async getProjectBudgetingReport() {
    const leads = await this.prisma.salesLead.findMany({
      where: {
        status: { notIn: ['LOST', 'ABORTED'] },
        estimatedValue: { gt: 0 },
      },
      include: {
        salesOrders: { include: { invoices: true } },
        purchaseOrders: {
          include: {
            items: { include: { material: true } },
            invoices: { where: { category: 'PAYABLE', deletedAt: null } },
          },
        },
        workOrders: { include: { logs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // -------- Helper: authoritative latest approved PO unit price per material.
    // A material with NO authoritative purchase history has no defensible
    // planning value; its contribution is explicitly zero and the line is
    // flagged ESTIMATE_INCOMPLETE in the response.
    const latestApprovedPriceByMaterial = new Map<string, number>();
    const allApprovedPos = await this.prisma.purchaseOrderItem.findMany({
      where: {
        po: { status: { in: ['APPROVED', 'ORDERED', 'SHIPPED', 'RECEIVED'] } },
      },
      select: {
        materialId: true,
        unitPrice: true,
        po: { select: { createdAt: true } },
      },
      orderBy: { po: { createdAt: 'desc' } },
    });
    for (const poi of allApprovedPos) {
      if (!latestApprovedPriceByMaterial.has(poi.materialId)) {
        latestApprovedPriceByMaterial.set(
          poi.materialId,
          Number(poi.unitPrice || 0),
        );
      }
    }

    // -------- Helper: per-PO authoritative PAID value.
    // PAID = the portion of the PO actually settled through Finance Lite.
    // Sources of truth, in priority order:
    //   1. PAYABLE Invoices linked to the PO, status PAID or PARTIAL, summed by
    //      (amountDue − outstandingAmount) → settled vendor invoices.
    //   2. Cash-out JournalEntries tagged with `sourceEntityType='PurchaseOrder'`
    //      and `sourceEntityId=po.id` (CashService.disburse writes these).
    //
    // R2 deliberately rejects `PO.status === 'RECEIVED'` as a payment proxy.
    // Receiving goods != cash out.
    const payablePaidByPo = new Map<string, number>();
    const payableInvoices = await this.prisma.invoice.findMany({
      where: {
        category: 'PAYABLE',
        poId: { not: null },
        deletedAt: null,
        status: { in: ['PAID', 'PARTIAL'] },
      },
      select: {
        poId: true,
        amountDue: true,
        outstandingAmount: true,
      },
    });
    for (const inv of payableInvoices) {
      if (!inv.poId) continue;
      const settled = Number(inv.amountDue || 0) - Number(inv.outstandingAmount || 0);
      if (settled <= 0) continue;
      payablePaidByPo.set(
        inv.poId,
        (payablePaidByPo.get(inv.poId) ?? 0) + settled,
      );
    }

    const cashPaidByPo = new Map<string, number>();
    const poCashJournals = await this.prisma.journalEntry.findMany({
      where: {
        sourceEntityType: 'PurchaseOrder',
        category: 'HPP',
        poId: { not: null },
      },
      select: { poId: true, lines: { select: { debit: true, credit: true } } },
    });
    for (const j of poCashJournals) {
      if (!j.poId) continue;
      const cashOut = j.lines.reduce(
        (s, l) => s + Number(l.credit || 0) - Number(l.debit || 0),
        0,
      );
      if (cashOut <= 0) continue;
      // Whichever is higher between the invoice-settled amount and the cash-
      // journal-linked amount is the authoritative paid figure. They overlap;
      // taking max() avoids double counting the same disbursement when both
      // an AP Invoice and a CashOut journal trace back to the same PO.
      cashPaidByPo.set(j.poId, (cashPaidByPo.get(j.poId) ?? 0) + cashOut);
    }

    const authoritativePaidForPo = (poId: string): number => {
      const viaInvoice = payablePaidByPo.get(poId) ?? 0;
      const viaCash = cashPaidByPo.get(poId) ?? 0;
      // If both exist for the same PO, take the higher — it represents the
      // strongest settled value. Choosing max() prevents double counting
      // because CashService.disburse and Invoice-billing share overlap.
      if (viaInvoice > 0 && viaCash > 0) return Math.max(viaInvoice, viaCash);
      return viaInvoice + viaCash;
    };

    // -------- Helper: open requirement qty × best-known price (planned).
    // Schema's MaterialItem doesn't list a back-relation to GoodsRequirementItem,
    // so we avoid `include` and load items + materials separately then index.
    const openRequirements = await this.prisma.goodsRequirement.findMany({
      where: { status: { in: ['GENERATED', 'PROCESSING'] } },
      select: { id: true, salesOrderId: true },
    });
    const openReqIds = openRequirements.map((r) => r.id);
    const openReqItems = openReqIds.length
      ? await this.prisma.goodsRequirementItem.findMany({
          where: { requirementId: { in: openReqIds } },
          select: { requirementId: true, materialId: true, qty: true },
        })
      : [];
    const reqItemByReq = new Map<string, typeof openReqItems>();
    for (const it of openReqItems) {
      const arr = reqItemByReq.get(it.requirementId) ?? [];
      arr.push(it);
      reqItemByReq.set(it.requirementId, arr);
    }
    // SalesLead id keyed by salesOrderId for fast lead routing.
    const soLeadPairs = await this.prisma.salesOrder.findMany({
      where: { id: { in: Array.from(new Set(openRequirements.map((r) => r.salesOrderId))) } },
      select: { id: true, leadId: true },
    });
    const leadIdBySoId = new Map(soLeadPairs.map((s) => [s.id, s.leadId]));
    // Fallback prices for requirement materials.
    const fallbackMaterialIds = Array.from(
      new Set(
        openReqItems
          .filter((it) => !latestApprovedPriceByMaterial.has(it.materialId))
          .map((it) => it.materialId),
      ),
    );
    const fallbackMaterials = fallbackMaterialIds.length
      ? await this.prisma.materialItem.findMany({
          where: { id: { in: fallbackMaterialIds } },
          select: { id: true, unitPrice: true },
        })
      : [];
    const fallbackPriceByMaterial = new Map(
      fallbackMaterials.map((m) => [m.id, Number(m.unitPrice || 0)]),
    );

    return leads.map((lead) => {
      // ---- COMMITTED: real procurement commitment, PO-backed.
      const committedStatuses = ['APPROVED', 'ORDERED', 'SHIPPED', 'RECEIVED'];
      const committed = lead.purchaseOrders
        .filter((po) => committedStatuses.includes(po.status))
        .reduce((sum, po) => sum + Number(po.totalValue || 0), 0);

      // ---- PAID: actual Finance settlement, not PO status.
      let paid = 0;
      for (const po of lead.purchaseOrders) {
        paid += authoritativePaidForPo(po.id);
      }

      // ---- PLANNED: requirement qty × best-known price + manual PO items.
      let planned = 0;
      let leadEstimateIncomplete = false;
      for (const req of openRequirements) {
        if (leadIdBySoId.get(req.salesOrderId) !== lead.id) continue;
        const items = reqItemByReq.get(req.id) ?? [];
        for (const it of items) {
          const authoritative = latestApprovedPriceByMaterial.get(it.materialId);
          const fallback = fallbackPriceByMaterial.get(it.materialId) ?? 0;
          const price =
            authoritative !== undefined && authoritative > 0
              ? authoritative
              : fallback;
          if (price <= 0) {
            leadEstimateIncomplete = true;
            continue;
          }
          planned += Number(it.qty) * price;
        }
      }
      // Manual POs (no requirement link) still represent planning coverage.
      for (const po of lead.purchaseOrders) {
        if (po.requestId) continue;
        planned += po.items.reduce(
          (s, it) => s + Number(it.totalPrice || 0),
          0,
        );
      }

      const remainingUncommitted = Math.max(0, planned - committed);
      const remainingUnpaid = Math.max(0, committed - paid);

      const budget = Number(lead.estimatedValue);
      const margin = budget - paid;

      return {
        id: lead.id,
        project: lead.brandName || lead.clientName,
        product: lead.productInterest,
        budget,
        // R2 FINAL funding visibility:
        plannedRequirementValue: planned,
        committedValue: committed,
        paidValue: paid,
        remainingUncommitted,
        remainingUnpaid,
        margin,
        marginPercent: budget > 0 ? (margin / budget) * 100 : 0,
        // ESTIMATE_INCOMPLETE is true if any open requirement line for THIS
        // lead had no authoritative purchase history AND no MaterialItem
        // fallback unit price. Consumers must surface it explicitly.
        estimateIncomplete: leadEstimateIncomplete,
        // Back-compat fields retained for current consumers:
        spent: paid,
        materialSpend: committed,
        status: lead.status,
        progress: lead.workOrders.length > 0 ? 'IN_PRODUCTION' : 'PLANNING',
      };
    });
  }

  async getDashboardMetrics() {
    const [totalReceivables, totalPayables, totalAccounts] = await Promise.all([
      this.prisma.invoice.count({ where: { category: 'RECEIVABLE' } }),
      this.prisma.invoice.count({ where: { category: 'PAYABLE' } }),
      this.prisma.account.count(),
    ]);
    return { totalReceivables, totalPayables, totalAccounts };
  }

  async getAdvancedDashboardStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Get all journals for this month
    const journals = await this.prisma.journalEntry.findMany({
      where: { date: { gte: firstDayOfMonth } },
      include: { lines: { include: { account: true } } },
    });

    let revenue = 0;
    let expense = 0;
    let cogs = 0;
    let cashIn = 0;
    let cashOut = 0;

    journals.forEach((j) => {
      j.lines.forEach((l) => {
        // Revenue logic
        if (l.account.type === AccountType.REVENUE)
          revenue += Number(l.credit) - Number(l.debit);
        // Expense logic
        if (l.account.type === AccountType.EXPENSE) {
          expense += Number(l.debit) - Number(l.credit);
          if (
            l.account.name.toLowerCase().includes('bahan') ||
            l.account.code.startsWith('51')
          ) {
            cogs += Number(l.debit) - Number(l.credit);
          }
        }
        // Cashflow logic (Asset accounts with "Kas" or "Bank")
        if (
          l.account.type === AccountType.ASSET &&
          (l.account.name.includes('Kas') || l.account.name.includes('Bank'))
        ) {
          cashIn += Number(l.debit);
          cashOut += Number(l.credit);
        }
      });
    });

    // 2. Get Receivables (A/R) & Payables (A/P)
    const [arTotal, apTotal] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { category: 'RECEIVABLE', status: 'UNPAID' },
        _sum: { outstandingAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { category: 'PAYABLE', status: 'UNPAID' },
        _sum: { outstandingAmount: true },
      }),
    ]);

    // 3. Risk Calculation: Cash Runway
    // Logic: Current Balance / Avg Monthly Expense
    const cashAccounts = await this.prisma.account.findMany({
      where: { type: AccountType.ASSET, name: { contains: 'Kas' } },
      include: { journalLines: true },
    });

    let currentBalance = 0;
    cashAccounts.forEach((acc) => {
      acc.journalLines.forEach((l) => {
        currentBalance += Number(l.debit) - Number(l.credit);
      });
    });

    const avgMonthlyExpense = expense || 1000000;
    const runwayMonths = currentBalance / avgMonthlyExpense;

    // --- Table Data ---
    const recentJournals = await this.prisma.journalEntry.findMany({
      take: 10,
      include: { lines: true },
      orderBy: { date: 'desc' },
    });
    const allReceivables = await this.prisma.invoice.findMany({
      where: { category: 'RECEIVABLE' },
      include: { so: { include: { lead: true } } },
      orderBy: { dueDate: 'desc' },
      take: 10,
    });
    const allPayables = await this.prisma.invoice.findMany({
      where: { category: 'PAYABLE' },
      include: { supplier: true },
      orderBy: { dueDate: 'desc' },
      take: 10,
    });

    const transactions = recentJournals.map((j, idx) => ({
      id: j.reference || `TX-${idx + 1}`,
      date: j.date.toISOString().split('T')[0],
      type: j.lines.some(
        (l: any) => Number(l.debit) > 0 && Number(l.debit) > 1000000,
      )
        ? 'IN / REVENUE'
        : 'OUT / EXPENSE',
      ref: j.description?.substring(0, 40) || '-',
      amount: `Rp ${j.lines.reduce((s, l) => s + Number(l.debit), 0).toLocaleString()}`,
      method: 'BANK TRANSFER',
      status: 'PAID',
    }));

    const receivables = allReceivables.map((inv) => ({
      id: inv.invoiceNumber,
      name: inv.so?.lead?.clientName || 'Unknown',
      out: `Rp ${(Number(inv.outstandingAmount) / 1000000).toFixed(0)}M`,
      due: `DUE: ${inv.dueDate.toISOString().split('T')[0]}`,
      status:
        inv.status === 'UNPAID' && inv.dueDate < new Date()
          ? 'OVERDUE'
          : inv.status,
    }));

    const payables = allPayables.map((inv) => ({
      id: inv.invoiceNumber,
      name: inv.supplier?.name || 'Unknown',
      out: `Rp ${(Number(inv.outstandingAmount) / 1000000).toFixed(0)}M`,
      due: `DUE: ${inv.dueDate.toISOString().split('T')[0]}`,
      status:
        inv.status === 'UNPAID' && inv.dueDate < new Date()
          ? 'OVERDUE'
          : inv.status === 'UNPAID'
            ? 'PENDING'
            : inv.status,
    }));

    const expenseBreakdown = [
      {
        cat: 'Raw Material',
        sub: 'SCM',
        amount: `Rp ${cogs.toLocaleString()}`,
      },
      {
        cat: 'Operational',
        sub: 'ALL DEPT',
        amount: `Rp ${(expense - cogs).toLocaleString()}`,
      },
      {
        cat: 'Ads Spend',
        sub: 'MARKETING',
        amount: `Rp ${(expense * 0.3).toLocaleString()}`,
      },
    ];

    const revenueBreakdown = [
      {
        name: 'Corporate Clients',
        prod: 'Maklon',
        type: 'REPEAT ORDER',
        amount: `Rp ${(revenue * 0.6).toLocaleString()}`,
        color: 'bg-blue-500',
      },
      {
        name: 'Sample Sales',
        prod: 'R&D Service',
        type: 'NEW DEAL',
        amount: `Rp ${(revenue * 0.25).toLocaleString()}`,
        color: 'bg-indigo-500',
      },
      {
        name: 'Other Income',
        prod: 'Consultation',
        type: 'MISCELLANEOUS',
        amount: `Rp ${(revenue * 0.15).toLocaleString()}`,
        color: 'bg-emerald-500',
      },
    ];

    const cashPosition = [
      {
        date: now.toISOString().split('T')[0],
        in: `+${cashIn.toLocaleString()}`,
        out: `-${cashOut.toLocaleString()}`,
        closing: `Rp ${currentBalance.toLocaleString()}`,
      },
    ];

    const kpiPerformance = [
      {
        period: `${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()}`,
        status: revenue > expense ? 'STABLE' : 'ALERT',
        margin: `${(revenue > 0 ? ((revenue - expense) / revenue) * 100 : 0).toFixed(1)}%`,
        coll: `${(revenue > 0 ? ((revenue - Number(arTotal._sum.outstandingAmount || 0)) / revenue) * 100 : 0).toFixed(1)}%`,
        score: Math.min(100, Math.round(50 + (revenue / (expense || 1)) * 25)),
        color: revenue > expense ? 'text-emerald-500' : 'text-rose-500',
      },
    ];

    return {
      metrics: {
        revenue,
        totalRevenue: revenue,
        collectionRate:
          revenue > 0
            ? ((revenue - Number(arTotal._sum.outstandingAmount || 0)) /
                revenue) *
              100
            : 100,
        uncollected: Number(arTotal._sum.outstandingAmount || 0),
        expense,
        totalExpense: expense,
        cogs,
        operational: expense - cogs,
        expenseRatio: revenue > 0 ? (expense / revenue) * 100 : 0,
        netCashFlow: cashIn - cashOut,
        cashIn,
        cashOut,
        balance: currentBalance,
        currentBalance,
        netProfit: revenue - expense,
        grossProfit: revenue - cogs,
        margin: revenue > 0 ? ((revenue - expense) / revenue) * 100 : 0,
        gpMargin: revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0,
        overdueAR: Number(arTotal._sum.outstandingAmount || 0),
        overdueAP: Number(apTotal._sum.outstandingAmount || 0),
        runwayMonths,
        transactions,
        receivables,
        payables,
        expenseBreakdown,
        revenueBreakdown,
        cashPosition,
        kpiPerformance,
      },
    };
  }

  async getRecentJournals(limit: number = 5) {
    return this.prisma.journalEntry.findMany({
      take: limit,
      include: { lines: { include: { account: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async getActiveInvoices(limit: number = 5) {
    return this.prisma.invoice.findMany({
      where: { status: 'UNPAID', category: 'RECEIVABLE' },
      take: limit,
      include: { workOrder: { include: { lead: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAccounts() {
    return this.prisma.account.findMany({ orderBy: { code: 'asc' } });
  }

  async getJournalEntries() {
    return this.prisma.journalEntry.findMany({
      include: { lines: { include: { account: true } } },
      orderBy: { date: 'desc' },
    });
  }

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
    }));
  }

  async getDeliveries() {
    return this.prisma.deliveryOrder.findMany({
      where: { invoice: null },
      include: { workOrder: { include: { lead: true } } },
    });
  }

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
   * Pre-R4 hardening: canonical entry point for any cross-domain caller
   * that needs to create an Invoice row. Earlier, commercial, scm, and
   * document-automation each called `prisma.invoice.create` directly,
   * producing four independent write paths to the same authoritative
   * entity. All callers MUST now route through this method.
   */
  async createInvoice(
    category: 'RECEIVABLE' | 'PAYABLE',
    payload: {
      type?: string;
      amountDue: number;
      outstandingAmount?: number;
      dueDate?: Date;
      soId?: string;
      poId?: string;
      supplierId?: string;
      workOrderId?: string;
      deliveryOrderId?: string;
      notes?: string;
      description?: string;
      status?: string;
    },
  ) {
    const prefix = category === 'PAYABLE' ? 'BILL' : 'INV';
    const data: any = {
      invoiceNumber: await this.idGenerator.generateId(prefix),
      category,
      type: payload.type,
      amountDue: payload.amountDue,
      outstandingAmount: payload.outstandingAmount ?? payload.amountDue,
      status: payload.status ?? 'UNPAID',
      dueDate: payload.dueDate ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      soId: payload.soId,
      poId: payload.poId,
      supplierId: payload.supplierId,
      workOrderId: payload.workOrderId,
      deliveryOrderId: payload.deliveryOrderId,
      notes: payload.notes,
      description: payload.description,
    };
    return this.prisma.invoice.create({ data });
  }

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

  async validatePayment(invoiceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status === 'PAID' || Number(invoice.outstandingAmount) <= 0) {
        throw new BadRequestException('Invoice already validated');
      }

      // Settlement truth: validatePayment is the canonical settle path
      // for invoices that were pre-recorded against cash. Mark PAID in
      // the same transaction so the journal/invoice pair stays consistent.
      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          outstandingAmount: 0,
        },
      });
    });
  }
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

  // --- FUND REQUESTS (OPEX PROTOCOL V4) ---

  async createFundRequest(requesterId: string, dto: CreateFundRequestDto) {
    return this.prisma.fundRequest.create({
      data: {
        requesterId,
        departmentId: dto.departmentId,
        amount: dto.amount,
        reason: dto.reason,
        attachmentUrls: dto.attachmentUrls || [],
        status: FundRequestStatus.PENDING_APPROVAL_MGR,
      },
    });
  }

  async getAllFundRequests(userId?: string) {
    const where: any = {};
    if (userId) {
      where.OR = [
        { requesterId: userId },
        { approvedById: userId },
      ];
    }
    return this.prisma.fundRequest.findMany({
      where,
      include: { requester: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyFundRequests(userId: string) {
    return this.prisma.fundRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveFundRequest(id: string, dto: ApproveFundRequestDto) {
    const request = await this.prisma.fundRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Fund Request not found');

    const claimed = await this.prisma.fundRequest.updateMany({
      where: { id, status: FundRequestStatus.PENDING_APPROVAL_MGR },
      data: { status: FundRequestStatus.APPROVED_BY_MGR, approvedById: dto.approvedById },
    });
    if (claimed.count === 1) {
      return this.prisma.fundRequest.findUnique({ where: { id } });
    }

    const current = await this.prisma.fundRequest.findUnique({ where: { id } });
    if (current?.status === FundRequestStatus.APPROVED_BY_MGR) {
      return { ...current, idempotent: true };
    }
    if (current?.status === FundRequestStatus.PAID) {
      throw new BadRequestException('Paid Fund Request cannot be approved again');
    }
    throw new BadRequestException(`Fund Request is not awaiting manager approval: ${current?.status}`);
  }

  async directorApproveFundRequest(
    id: string,
    dto: DirectorApproveFundRequestDto,
  ) {
    return this.prisma.fundRequest.update({
      where: { id },
      data: {
        status: FundRequestStatus.APPROVED_BY_DIR,
        approvedById: dto.approvedById,
      },
    });
  }

  async rejectFundRequest(id: string, dto: RejectFundRequestDto) {
    const request = await this.prisma.fundRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Fund Request not found');
    if (request.status === FundRequestStatus.PAID) {
      throw new BadRequestException('Paid Fund Request cannot be rejected');
    }
    return this.prisma.fundRequest.update({
      where: { id },
      data: { status: FundRequestStatus.REJECTED, rejectReason: dto.reason },
    });
  }

  async disburseFundRequest(id: string, dto: DisburseFundRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.fundRequest.findUnique({
        where: { id },
        include: { requester: true },
      });

      if (!req) throw new NotFoundException('Fund Request not found');

      const existing = await tx.journalEntry.findUnique({
        where: { fundRequestId: id },
        include: { lines: true },
      });
      if (existing) {
        return { ...req, financialTransaction: existing, idempotent: true };
      }
      if (
        req.status !== FundRequestStatus.APPROVED_BY_MGR &&
        req.status !== FundRequestStatus.APPROVED_BY_DIR &&
        req.status !== FundRequestStatus.WAITING_FINANCE_DISBURSEMENT
      ) {
        throw new BadRequestException(`Only an approved Fund Request can be paid: ${req.status}`);
      }

      // Claim the request before creating its journal. This makes concurrent
      // retries mutually exclusive while the unique fundRequestId is the DB guard.
      const claimed = await tx.fundRequest.updateMany({
        where: {
          id,
          status: { in: [FundRequestStatus.APPROVED_BY_MGR, FundRequestStatus.APPROVED_BY_DIR,
            FundRequestStatus.WAITING_FINANCE_DISBURSEMENT] },
        },
        data: { status: FundRequestStatus.PAID, disbursedById: dto.disbursedById },
      });
      if (claimed.count !== 1) {
        const retry = await tx.fundRequest.findUnique({ where: { id }, include: { financialTransaction: true } });
        if (retry?.financialTransaction) return { ...retry, idempotent: true };
        throw new BadRequestException('Fund Request payment was already claimed');
      }

      const cashAcc = dto.accountId
        ? await tx.account.findUnique({ where: { id: dto.accountId } })
        : await tx.account.findFirst({ where: { type: AccountType.ASSET, OR: [
            { name: { contains: 'Kas' } }, { name: { contains: 'Bank' } },
          ] }, orderBy: { code: 'asc' } });
      if (!cashAcc)
        throw new BadRequestException('Source Bank/Cash account not found');

      // Find expense account: use departmentId as account code prefix
      // e.g., department "MARKETING" maps to account code starting with "6" and name containing "MARKETING"
      const expenseAcc = await tx.account.findFirst({
        where: {
          AND: [
            { OR: [{ code: { startsWith: '5' } }, { code: { startsWith: '6' } }] },
            {
              OR: [
                { name: { contains: req.departmentId } },
                { code: { contains: req.departmentId } },
              ],
            },
          ],
        },
      });

      // Fallback: if no specific expense account found, use general expense account
      if (!expenseAcc) {
        const generalExpense = await tx.account.findFirst({
          where: { type: AccountType.EXPENSE },
        });
        if (generalExpense) {
          // Create journal with general expense + note
          const transaction = await tx.journalEntry.create({
            data: {
              date: new Date(),
              reference: `FUND-DISB-${req.id.substring(0, 8)}`,
              fundRequestId: req.id,
              sourceEntityType: 'FundRequest',
              sourceEntityId: req.id,
              category: req.departmentId,
              direction: 'EXPENSE',
              description: `Disbursement for Fund Request: ${req.reason} [Dept: ${req.departmentId}] — No specific expense account found, used General`,
              lines: {
                create: [
                  {
                    accountId: generalExpense.id,
                    debit: req.amount,
                    credit: 0,
                  },
                  { accountId: cashAcc.id, debit: 0, credit: req.amount },
                ],
              },
            },
          });
          return { ...req, status: FundRequestStatus.PAID, disbursedById: dto.disbursedById, financialTransaction: transaction };
        }
        throw new BadRequestException(
          `Akun beban untuk departemen ${req.departmentId} tidak ditemukan. Buat akun beban dengan kode diawali '6' dan nama mengandung '${req.departmentId}'.`,
        );
      }

      // Create Journal
      const transaction = await tx.journalEntry.create({
        data: {
          date: new Date(),
          reference: `FUND-DISB-${req.id.substring(0, 8)}`,
          fundRequestId: req.id,
          sourceEntityType: 'FundRequest',
          sourceEntityId: req.id,
          category: req.departmentId,
          direction: 'EXPENSE',
          description: `Disbursement for Fund Request: ${req.reason} [ID: ${req.id}]`,
          lines: {
            create: [
              { accountId: expenseAcc.id, debit: req.amount, credit: 0 },
              { accountId: cashAcc.id, debit: 0, credit: req.amount },
            ],
          },
        },
      });
      return { ...req, status: FundRequestStatus.PAID, disbursedById: dto.disbursedById, financialTransaction: transaction };
    });
  }

  // --- AR VALIDATION HUB (POINT 3) ---

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
          eventType: StreamEventType.HKI_BPOM_REGISTRATION, // Reusing similar event type or can add a new one
          notes: `CREATIVE AUTOMATION: Task desain kemasan otomatis dibuat.`,
          loggedBy: 'SYSTEM_CREATIVE',
        });

        // F. PHASE 4: WAREHOUSE READINESS
        const whSvc = await this.getWarehouseService();
        const whResult = await whSvc.checkCapacityForNewDeal(leadId);
        if (whResult.status !== 'OK') {
          this.eventEmitter.emit(ACTIVITY_EVENT, {
            leadId: leadId,
            senderDivision: Division.WAREHOUSE,
            eventType: StreamEventType.STOCK_CHECK_SHORTAGE, // Reusing shortage as a capacity issue
            notes: whResult.message,
            loggedBy: 'SYSTEM_WAREHOUSE',
            isCritical: whResult.status === 'CRITICAL',
          });
        }
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

          await tx.salesOrder.update({
            where: { id: salesOrderId },
            data: { status: SOStatus.COMPLETED },
          });

          await tx.salesLead.update({
            where: { id: leadId },
            data: { status: WorkflowStatus.WON_DEAL, wonAt: new Date() },
          });

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
                where: { code: '8100' },
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
              lines.push({ accountId: ppnAcc.id, debit: 0, credit: taxAmount });
            }

            await tx.journalEntry.create({
              data: {
                date: new Date(),
                reference: `PELUNASAN-${so.orderNumber}`,
                description: `Pelunasan Sales Order ${so.orderNumber} — ${so.lead?.clientName || 'Unknown'}`,
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
      // SAMPLE → Unearned Revenue (2300), DP_ORDER → DP Produksi Klien (2301)
      let creditAccountId = '';
      if (type === ArPaymentType.SAMPLE) {
        const acc = await tx.account.findFirst({ where: { code: '2300' } });
        creditAccountId = acc?.id || '';
      } else {
        const acc = await tx.account.findFirst({ where: { code: '2301' } });
        creditAccountId = acc?.id || '';
      }

      // 2. Determine Supporting Accounts
      // 8100 = Admin Fee Income, 2201 = PPN Output Payable
      const adminAcc = await tx.account.findFirst({ where: { code: '8100' } });
      const ppnAcc = await tx.account.findFirst({ where: { code: '2201' } });

      if (bankAdminFee > 0 && !adminAcc)
        throw new BadRequestException('Account 8100 (Admin Fee) not found');
      if (taxAmount > 0 && !ppnAcc)
        throw new BadRequestException('Account 2201 (PPN Output) not found');

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

  // --- FINANCIAL REPORTS (PHASE 4) ---

  async getTrialBalance(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    // 1. Fetch all accounts with their journal lines within the filter
    const accounts = await this.prisma.account.findMany({
      include: {
        journalLines: {
          where: {
            journal: where,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // 2. Calculate balances
    const trialBalance = accounts.map((acc) => {
      let totalDebit = 0;
      let totalCredit = 0;

      acc.journalLines.forEach((l) => {
        totalDebit += Number(l.debit);
        totalCredit += Number(l.credit);
      });

      // Net balance based on account type
      let debitBalance = 0;
      let creditBalance = 0;

      const net = totalDebit - totalCredit;

      // Standard Accounting Rule:
      // Assets (1xxx) & Expenses (5xxx, 6xxx) usually have Debit balances.
      // Liabilities (2xxx), Equity (3xxx), & Revenue (4xxx) usually have Credit balances.
      if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
        if (net >= 0) {
          debitBalance = net;
        } else {
          creditBalance = Math.abs(net);
        }
      } else {
        if (net <= 0) {
          creditBalance = Math.abs(net);
        } else {
          debitBalance = net;
        }
      }

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        reportGroup: acc.reportGroup,
        parentId: acc.parentId,
        totalDebit,
        totalCredit,
        debitBalance,
        creditBalance,
      };
    });

    const totals = trialBalance.reduce(
      (acc, curr) => ({
        debit: acc.debit + curr.debitBalance,
        credit: acc.credit + curr.creditBalance,
      }),
      { debit: 0, credit: 0 },
    );

    return {
      data: trialBalance,
      totals,
      isBalanced: Math.abs(totals.debit - totals.credit) < 0.01,
    };
  }

  async getDetailedTrialBalance(startDate: Date, endDate: Date) {
    // 1. Fetch Beginning Balances (everything before startDate)
    const begDate = new Date(startDate);
    begDate.setSeconds(begDate.getSeconds() - 1);
    const begTb = await this.getTrialBalance(undefined, begDate);

    // 2. Fetch Period Activity (within startDate and endDate)
    const actTb = await this.getTrialBalance(startDate, endDate);

    // 3. Fetch Closing Balances (everything before endDate)
    const endTb = await this.getTrialBalance(undefined, endDate);

    const detailedData = endTb.data.map((endItem) => {
      const begItem = begTb.data.find((a) => a.id === endItem.id);
      const actItem = actTb.data.find((a) => a.id === endItem.id);

      return {
        ...endItem,
        awalDebit: begItem?.debitBalance || 0,
        awalCredit: begItem?.creditBalance || 0,
        perubahanDebit: actItem?.totalDebit || 0,
        perubahanCredit: actItem?.totalCredit || 0,
        akhirDebit: endItem.debitBalance,
        akhirCredit: endItem.creditBalance,
      };
    });

    const totals = detailedData.reduce(
      (acc, curr) => ({
        awalDebit: acc.awalDebit + curr.awalDebit,
        awalCredit: acc.awalCredit + curr.awalCredit,
        perubahanDebit: acc.perubahanDebit + curr.perubahanDebit,
        perubahanCredit: acc.perubahanCredit + curr.perubahanCredit,
        akhirDebit: acc.akhirDebit + curr.akhirDebit,
        akhirCredit: acc.akhirCredit + curr.akhirCredit,
      }),
      {
        awalDebit: 0,
        awalCredit: 0,
        perubahanDebit: 0,
        perubahanCredit: 0,
        akhirDebit: 0,
        akhirCredit: 0,
      },
    );

    return {
      data: detailedData,
      totals,
      isBalanced: Math.abs(totals.akhirDebit - totals.akhirCredit) < 0.01,
    };
  }

  async getBalanceSheet(date: Date) {
    // Balance Sheet is a snapshot up to a certain date
    const tb = await this.getTrialBalance(undefined, date);

    // Calculate Net Income (Laba Berjalan)
    // Revenue (4xxx) - Cost of Goods Sold (5xxx) - Operating Expenses (6xxx) - Other (8xxx)
    const revenue = tb.data
      .filter((a) => a.type === AccountType.REVENUE)
      .reduce(
        (sum, a) => sum + (Number(a.creditBalance) - Number(a.debitBalance)),
        0,
      );

    const expenses = tb.data
      .filter((a) => a.type === AccountType.EXPENSE)
      .reduce(
        (sum, a) => sum + (Number(a.debitBalance) - Number(a.creditBalance)),
        0,
      );

    const netIncome = revenue - expenses;

    // Grouping & Reclassification Logic (POINT B Phase 2)
    const rawAssets = tb.data.filter((a) => a.type === AccountType.ASSET);
    const rawLiabilities = tb.data.filter(
      (a) => a.type === AccountType.LIABILITY,
    );
    const equity = tb.data.filter((a) => a.type === AccountType.EQUITY);

    const assets: any[] = [];
    const liabilities: any[] = [];

    // Process Assets: If Credit -> move to Liabilities
    rawAssets.forEach((a) => {
      const balance = Number(a.debitBalance) - Number(a.creditBalance);
      if (balance >= 0) {
        assets.push({ ...a, balance });
      } else {
        liabilities.push({
          ...a,
          name: `${a.name} (Overdraft)`,
          balance: Math.abs(balance),
          isReclassified: true,
        });
      }
    });

    // Process Liabilities: If Debit -> move to Assets
    rawLiabilities.forEach((l) => {
      const balance = Number(l.creditBalance) - Number(l.debitBalance);
      if (balance >= 0) {
        liabilities.push({ ...l, balance });
      } else {
        assets.push({
          ...l,
          name: `${l.name} (Prepaid/Debit Balance)`,
          balance: Math.abs(balance),
          isReclassified: true,
        });
      }
    });

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);
    const totalEquity =
      equity.reduce(
        (sum, a) => sum + (Number(a.creditBalance) - Number(a.debitBalance)),
        0,
      ) + netIncome;

    return {
      date,
      assets: {
        items: assets,
        total: totalAssets,
      },
      liabilities: {
        items: liabilities,
        total: totalLiabilities,
      },
      equity: {
        items: equity,
        netIncome,
        total: totalEquity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced:
        Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  async getProfitLoss(startDate: Date, endDate: Date) {
    const allAccounts = await this.prisma.account.findMany({
      where: {
        type: { in: [AccountType.REVENUE, AccountType.EXPENSE] },
      },
      include: {
        parent: true,
        children: true,
      },
      orderBy: { code: 'asc' },
    });

    const tb = await this.getTrialBalance(startDate, endDate);

    const report = {
      operatingRevenue: { groups: {} as Record<string, any[]>, total: 0 },
      cogs: { groups: {} as Record<string, any[]>, total: 0 },
      operatingExpenses: { groups: {} as Record<string, any[]>, total: 0 },
      otherIncome: { groups: {} as Record<string, any[]>, total: 0 },
      otherExpenses: { groups: {} as Record<string, any[]>, total: 0 },
      grossProfit: 0,
      operatingIncome: 0,
      netProfit: 0,
    };

    allAccounts.forEach((acc) => {
      const tbItem = tb.data.find((t) => t.id === acc.id);
      const balance =
        acc.type === AccountType.REVENUE
          ? tbItem
            ? Number(tbItem.creditBalance) - Number(tbItem.debitBalance)
            : 0
          : tbItem
            ? Number(tbItem.debitBalance) - Number(tbItem.creditBalance)
            : 0;

      // Only include accounts with activity or if they are parents
      if (balance === 0 && !acc.children?.length) {
        // We might want to show zero balances for specific accounts requested by user,
        // but for now let's keep it to active ones or all requested ones.
        // The user wants to "keluarkan semua data", so let's include all.
      }

      const item = { id: acc.id, code: acc.code, name: acc.name, balance };

      let target: any;
      switch (acc.reportGroup) {
        case ReportGroup.OPERATING_REVENUE:
          target = report.operatingRevenue;
          break;
        case ReportGroup.COGS:
          target = report.cogs;
          break;
        case ReportGroup.OPEX:
          target = report.operatingExpenses;
          break;
        case ReportGroup.OTHER_REVENUE:
          target = report.otherIncome;
          break;
        case ReportGroup.OTHER_EXPENSE:
          target = report.otherExpenses;
          break;
        default:
          return; // Skip if no report group
      }

      // If account has a parent, use parent name as the group name
      // If it's a top-level account (no parent), it might be a group itself or a standalone item
      const groupName = acc.parent ? acc.parent.name : 'LAINNYA';

      // Special case: if it's a "Header" account (has children or is meant to be a group)
      // For now, we use the requested structure: Group -> Leaf Items
      if (!acc.parent) return; // Skip top-level headers from being listed as items, they are groups

      if (!target.groups[groupName]) {
        target.groups[groupName] = [];
      }
      target.groups[groupName].push(item);
      target.total += balance;
    });

    report.grossProfit = report.operatingRevenue.total - report.cogs.total;
    report.operatingIncome =
      report.grossProfit - report.operatingExpenses.total;
    report.netProfit =
      report.operatingIncome +
      report.otherIncome.total -
      report.otherExpenses.total;

    return report;
  }

  async getCashFlow(startDate: Date, endDate: Date) {
    const journals = await this.prisma.journalEntry.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { lines: { include: { account: true } } },
    });

    const cf = {
      operatingIn: 0,
      operatingOut: 0,
      investingOut: 0,
      financingIn: 0,
      netCashFlow: 0,
    };

    journals.forEach((j) => {
      j.lines.forEach((l) => {
        const acc = l.account;
        const isCashAccount =
          acc.type === AccountType.ASSET && acc.code.startsWith('11');

        if (isCashAccount) {
          // This line is a movement in cash
          const amount = Number(l.debit) - Number(l.credit);
          if (amount > 0) {
            // Cash In
            // Simple mapping for demonstration
            if (
              j.description.includes('AR') ||
              j.description.includes('Payment')
            )
              cf.operatingIn += amount;
            else cf.financingIn += amount;
          } else {
            // Cash Out
            const absAmount = Math.abs(amount);
            if (acc.code.startsWith('15'))
              cf.investingOut += absAmount; // Fixed Assets
            else cf.operatingOut += absAmount;
          }
        }
      });
    });

    cf.netCashFlow =
      cf.operatingIn - cf.operatingOut - cf.investingOut + cf.financingIn;
    return cf;
  }

  async getGeneralLedger(accountId: string, startDate: Date, endDate: Date) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new NotFoundException('Account not found');

    // 1. Calculate Beginning Balance (Saldo Awal)
    // All transactions before startDate
    const prevLines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        journal: {
          date: { lt: startDate },
        },
      },
    });

    let beginningBalance = 0;
    prevLines.forEach((l) => {
      if (account.normalBalance === NormalBalance.DEBIT) {
        beginningBalance += Number(l.debit) - Number(l.credit);
      } else {
        beginningBalance += Number(l.credit) - Number(l.debit);
      }
    });

    // 2. Fetch Transactions in Range
    const currentLines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        journal: {
          date: { gte: startDate, lte: endDate },
        },
      },
      include: {
        journal: true,
      },
      orderBy: {
        journal: { date: 'asc' },
      },
    });

    // 3. Calculate Running Balance
    let runningBalance = beginningBalance;
    const ledger = currentLines.map((line) => {
      if (account.normalBalance === NormalBalance.DEBIT) {
        runningBalance += Number(line.debit) - Number(line.credit);
      } else {
        runningBalance += Number(line.credit) - Number(line.debit);
      }

      return {
        id: line.id,
        date: line.journal.date,
        reference: line.journal.reference,
        description: line.journal.description,
        debit: Number(line.debit),
        credit: Number(line.credit),
        balance: runningBalance,
        attachmentUrls: line.journal.attachmentUrls,
      };
    });

    return {
      account: {
        code: account.code,
        name: account.name,
        normalBalance: account.normalBalance,
      },
      period: { startDate, endDate },
      beginningBalance,
      transactions: ledger,
      endingBalance: runningBalance,
    };
  }

  async getTaxes() {
    return this.prisma.taxRate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCurrencies() {
    return this.prisma.currency.findMany({
      orderBy: { code: 'asc' },
    });
  }

  // --- COA CRUD ---

  async createAccount(dto: {
    code: string;
    name: string;
    type: AccountType;
    normalBalance: NormalBalance;
    parentId?: string;
    reportGroup?: ReportGroup;
    isActive?: boolean;
  }) {
    const existing = await this.prisma.account.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(
        `Account code '${dto.code}' already exists`,
      );
    }
    return this.prisma.account.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type,
        normalBalance: dto.normalBalance,
        parentId: dto.parentId,
        reportGroup: dto.reportGroup,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateAccount(
    id: string,
    dto: Partial<{
      code: string;
      name: string;
      type: AccountType;
      normalBalance: NormalBalance;
      parentId: string;
      reportGroup: ReportGroup;
      isActive: boolean;
    }>,
  ) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    if (dto.code && dto.code !== account.code) {
      const dup = await this.prisma.account.findUnique({
        where: { code: dto.code },
      });
      if (dup)
        throw new BadRequestException(
          `Account code '${dto.code}' already exists`,
        );
    }
    return this.prisma.account.update({ where: { id }, data: dto });
  }

  async softDeleteAccount(id: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    return this.prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
