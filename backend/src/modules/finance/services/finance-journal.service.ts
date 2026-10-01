import {
  Injectable,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { BusinessException } from '../../../common/exceptions/api-exception';
import { IdGeneratorService } from '../../system/id-generator.service';
import {
  AccountType,
  NormalBalance,
  PeriodStatus,
  ReportGroup,
} from '@prisma/client';
import { CreateJournalDto } from '../dto/create-journal.dto';

@Injectable()
export class FinanceJournalService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  /**
   * Ensure every account the journal-posting code resolves actually exists.
   *
   * Upserts each required code idempotently to repair partially populated charts of accounts.
   */
  async seedInitialAccounts() {
    const initialAccounts = [
      {
        code: '1151',
        name: 'Persediaan Bahan Baku',
        type: AccountType.ASSET,
        normalBalance: NormalBalance.DEBIT,
        reportGroup: ReportGroup.CURRENT_ASSET,
      },
      {
        code: '2101',
        name: 'Hutang Dagang',
        type: AccountType.LIABILITY,
        normalBalance: NormalBalance.CREDIT,
        reportGroup: ReportGroup.CURRENT_LIABILITY,
      },
      {
        code: '2102',
        name: 'Penjualan di terima di muka',
        type: AccountType.LIABILITY,
        normalBalance: NormalBalance.CREDIT,
        reportGroup: ReportGroup.CURRENT_LIABILITY,
      },
      {
        // AR-side receivable that sales-invoice posting debits (sales-invoices.service.ts).
        // Seeding production requires this: the post() path fails closed without it.
        code: '1201',
        name: 'Piutang Usaha Klien Maklon',
        type: AccountType.ASSET,
        normalBalance: NormalBalance.DEBIT,
        reportGroup: ReportGroup.CURRENT_ASSET,
      },
      {
        // PPN (VAT) output payable — the third leg of a sales-invoice journal.
        code: '2104',
        name: 'PPN Keluaran',
        type: AccountType.LIABILITY,
        normalBalance: NormalBalance.CREDIT,
        reportGroup: ReportGroup.CURRENT_LIABILITY,
      },
      {
        code: '4101',
        name: 'Penjualan - sample',
        type: AccountType.REVENUE,
        normalBalance: NormalBalance.CREDIT,
        reportGroup: ReportGroup.OPERATING_REVENUE,
      },
      {
        code: '4102',
        name: 'Penjualan - kosmetik',
        type: AccountType.REVENUE,
        normalBalance: NormalBalance.CREDIT,
        reportGroup: ReportGroup.OPERATING_REVENUE,
      },
      {
        code: '6101',
        name: 'Beban Iklan dan Promosi Penjualan',
        type: AccountType.EXPENSE,
        normalBalance: NormalBalance.DEBIT,
        reportGroup: ReportGroup.OPEX,
      },
      {
        code: '6224',
        name: 'Beban Administrasi Bank',
        type: AccountType.EXPENSE,
        normalBalance: NormalBalance.DEBIT,
        reportGroup: ReportGroup.OPEX,
      },
      {
        code: '6232',
        name: 'Beban Operasional Perusahaan',
        type: AccountType.EXPENSE,
        normalBalance: NormalBalance.DEBIT,
        reportGroup: ReportGroup.OPEX,
      },
    ];

    const created: string[] = [];
    const existing: string[] = [];

    for (const acc of initialAccounts) {
      const already = await this.prisma.account.findFirst({
        where: { code: acc.code },
        select: { id: true },
      });
      if (already) {
        existing.push(acc.code);
        continue;
      }
      await this.prisma.account.upsert({
        where: { code: acc.code },
        update: {},
        create: acc,
      });
      created.push(acc.code);
    }

    return { created, existing, required: initialAccounts.length };
  }

  /**
   * Create a manual or system journal entry with full balance and control account validation.
   */
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

    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException(
        'Jurnal transaksi wajib memiliki minimal dua baris akun (Debit & Kredit).',
      );
    }

    const totalDebit = dto.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Total Debit (Rp ${totalDebit.toLocaleString()}) harus sama dengan Total Kredit (Rp ${totalCredit.toLocaleString()}). Jurnal tidak seimbang. [UNBALANCED_JOURNAL_ENTRY]`,
      );
    }

    // BUS-RULE-068: Control accounts block manual posting
    const accountIds = [...new Set(dto.lines.map((l) => l.accountId))];
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds } },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    if (!dto.sourceDocumentType || dto.sourceDocumentType === 'MANUAL') {
      for (const l of dto.lines) {
        const acc = accountMap.get(l.accountId);
        if (acc && acc.allowManualJournal === false) {
          throw new BadRequestException(
            `Akun ${acc.code} (${acc.name}) tidak boleh diposting manual. Gunakan Adjustment Journal. [MANUAL_JOURNAL_BLOCKED]`,
          );
        }
      }
    }
    const expenseLines = dto.lines.map((l) => {
      const acc = accountMap.get(l.accountId);
      return (
        acc &&
        (acc.code.startsWith('6') ||
          acc.code.startsWith('12') ||
          acc.code.startsWith('15'))
      );
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

  /** Alias for createJournalEntry to satisfy contract requirements */
  async createJournal(dto: CreateJournalDto) {
    return this.createJournalEntry(dto);
  }

  /** Alias for postJournal to satisfy contract requirements */
  async postJournal(dto: CreateJournalDto) {
    return this.createJournalEntry(dto);
  }

  /**
   * Reverse an existing journal entry with reversal reference and inverted debit/credit lines.
   */
  async reverseJournalEntry(id: string) {
    const original = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!original) throw new NotFoundException('Journal not found');
    if (original.reference?.startsWith('REV-')) {
      throw new BadRequestException('Cannot reverse a reversal journal');
    }

    const entryDate = new Date();
    const lockedPeriod = await this.prisma.financialPeriod.findFirst({
      where: {
        startDate: { lte: entryDate },
        endDate: { gte: entryDate },
        status: { in: [PeriodStatus.SOFT_LOCKED, PeriodStatus.CLOSED] },
      },
    });
    if (lockedPeriod) {
      throw new BadRequestException(
        `Transaksi ditolak: Periode ${lockedPeriod.name} sudah dikunci atau ditutup. [PERIOD_HARD_LOCKED]`,
      );
    }

    return this.prisma.journalEntry.create({
      data: {
        date: entryDate,
        reference: `REV-${original.reference || original.id}`,
        description: `REVERSAL of: ${original.description}`,
        sourceDocumentType: 'ADJUSTMENT' as any,
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

  /** Alias for voidJournal (reversing an entry) */
  async voidJournal(id: string) {
    return this.reverseJournalEntry(id);
  }

  /**
   * Get all journal entries ordered by date desc with included accounts.
   */
  async getJournalEntries() {
    return this.prisma.journalEntry.findMany({
      include: { lines: { include: { account: true } } },
      orderBy: { date: 'desc' },
    });
  }

  /** Alias for getJournalEntries */
  async getJournals() {
    return this.getJournalEntries();
  }

  /**
   * Find a single journal entry by ID.
   */
  async getJournalById(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: { include: { account: true } } },
    });
    if (!entry) throw new NotFoundException(`Journal entry '${id}' not found`);
    return entry;
  }

  /**
   * Get recent journal entries with limit.
   */
  async getRecentJournals(limit: number = 5) {
    return this.prisma.journalEntry.findMany({
      take: limit,
      include: { lines: { include: { account: true } } },
      orderBy: { date: 'desc' },
    });
  }

  // ──────────────────────────────────────────────
  // Automatic Posting Chains & Handlers
  // ──────────────────────────────────────────────

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

    const wipAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1302' }, { code: '1153' }, { code: '1401' }] },
    }); // WIP
    const rmAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1151' }, { code: '1300' }] },
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

  /**
   * Real-time HPP Cost Posting (Phase 4)
   * Triggered when final QC passes for a Work Order.
   */
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
      const qty = Number(bom.quantityPerUnit);
      totalHpp += price * qty;
    }

    const finalTotalHpp = totalHpp * wo.targetQty;

    const fgAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1303' }, { code: '1154' }, { code: '1400' }] },
    }); // Finished Goods
    const wipAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1302' }, { code: '1153' }, { code: '1401' }] },
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
    let inventoryAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1151' }, { code: '1300' }] },
    });
    if (!inventoryAcc) {
      inventoryAcc = await this.prisma.account.create({
        data: {
          code: '1151',
          name: 'Persediaan Barang',
          type: 'ASSET' as any,
          normalBalance: 'DEBIT' as any,
        },
      });
    }

    let lossAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '6232' }, { code: '6102' }] },
    });
    if (!lossAcc) {
      lossAcc = await this.prisma.account.create({
        data: {
          code: '6232',
          name: 'Beban Selisih Stok Opname',
          type: 'EXPENSE' as any,
          normalBalance: 'DEBIT' as any,
        },
      });
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
      where: { OR: [{ code: '1151' }, { code: '1300' }] },
    });
    const wipAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1302' }, { code: '1153' }, { code: '1401' }] },
    });

    if (!inventoryAcc || !wipAcc) {
      throw new BadRequestException(
        'Finance Accounts (1151/1153) not configured for material handover.',
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
      where: { OR: [{ code: '1110' }, { code: '1121' }, { code: '1100' }] },
    });
    const marketingAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '6101' }, { code: '5101' }] },
    });

    if (!bankAcc || !marketingAcc) {
      throw new BusinessException(
        'FINANCE_COA_NOT_CONFIGURED',
        'Akun finance untuk posting iklan (1110/1100/1121 atau 6101/5101) belum ada di COA.',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          missing: [
            ...(bankAcc ? [] : ['1110/1100/1121']),
            ...(marketingAcc ? [] : ['6101/5101']),
          ],
        },
      );
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

  // ──────────────────────────────────────────────
  // Chart of Accounts (COA) Lookups & CRUD
  // ──────────────────────────────────────────────

  async getAccounts() {
    return this.prisma.account.findMany({
      include: {
        parent: { select: { id: true, code: true, name: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getAccountById(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, code: true, name: true } },
      },
    });
    if (!account) throw new NotFoundException(`Account '${id}' not found`);
    return account;
  }

  async getAccountByCode(code: string) {
    const account = await this.prisma.account.findUnique({
      where: { code },
      include: {
        parent: { select: { id: true, code: true, name: true } },
      },
    });
    if (!account) throw new NotFoundException(`Account with code '${code}' not found`);
    return account;
  }

  async createAccount(dto: {
    code: string;
    name: string;
    type: AccountType;
    normalBalance: NormalBalance;
    parentId?: string;
    reportGroup?: ReportGroup;
    isActive?: boolean;
    allowManualJournal?: boolean;
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
        parentId: dto.parentId || null,
        reportGroup: dto.reportGroup,
        isActive: dto.isActive ?? true,
        allowManualJournal:
          dto.allowManualJournal !== undefined
            ? dto.allowManualJournal
            : true,
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
      parentId: string | null;
      reportGroup: ReportGroup;
      isActive: boolean;
      allowManualJournal: boolean;
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
    const updateData: any = { ...dto };
    if (dto.parentId === '') updateData.parentId = null;
    return this.prisma.account.update({ where: { id }, data: updateData });
  }

  async softDeleteAccount(id: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    return this.prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ──────────────────────────────────────────────
  // Auto Journal Configs CRUD & Seeding
  // ──────────────────────────────────────────────

  async getAutoJournalConfigs() {
    let configs = await this.prisma.autoJournalConfig.findMany({
      orderBy: { transactionType: 'asc' },
    });
    if (configs.length === 0) {
      await this.seedDefaultAutoJournalConfigs();
      configs = await this.prisma.autoJournalConfig.findMany({
        orderBy: { transactionType: 'asc' },
      });
    }
    return configs;
  }

  async seedDefaultAutoJournalConfigs() {
    const allAccounts = await this.prisma.account.findMany();
    if (allAccounts.length === 0) return [];

    const findAcc = (code: string, fallbackType: string) => {
      const byCode = allAccounts.find((a) => a.code === code);
      if (byCode) return byCode.id;
      const byType = allAccounts.find((a) => a.type === (fallbackType as any));
      return byType ? byType.id : allAccounts[0]?.id;
    };

    const apAcc = findAcc('2100', 'LIABILITY') || findAcc('2101', 'LIABILITY');
    const discBuyAcc = findAcc('5102', 'EXPENSE') || findAcc('5101', 'EXPENSE');
    const extraExpAcc = findAcc('5201', 'EXPENSE') || findAcc('5101', 'EXPENSE');
    const ppnInAcc = findAcc('1108', 'ASSET') || findAcc('11600', 'ASSET');
    const stockCorrAcc = findAcc('5301', 'EXPENSE') || findAcc('5101', 'EXPENSE');
    const transitAcc = findAcc('1105', 'ASSET') || findAcc('1300', 'ASSET');
    const arAcc = findAcc('1103', 'ASSET') || findAcc('1200', 'ASSET');
    const discSaleAcc = findAcc('4102', 'REVENUE') || findAcc('4101', 'REVENUE');
    const ppnOutAcc = findAcc('2104', 'LIABILITY') || findAcc('2100', 'LIABILITY');
    const dpBuyAcc = findAcc('1106', 'ASSET') || findAcc('1101', 'ASSET');
    const dpSaleAcc = findAcc('2105', 'LIABILITY') || findAcc('2100', 'LIABILITY');
    const retDiffAcc = findAcc('5103', 'EXPENSE') || findAcc('5101', 'EXPENSE');
    const invAcc = findAcc('1300', 'ASSET') || allAccounts[0]?.id;
    const revAcc = findAcc('4101', 'REVENUE') || allAccounts[0]?.id;
    const bankAcc = findAcc('1101', 'ASSET') || allAccounts[0]?.id;

    const defaultRules = [
      {
        transactionType: 'FAKTUR_PEMBELIAN_HUTANG',
        description: 'Hutang Dagang saat penerbitan Faktur Pembelian',
        coaDebetId: invAcc,
        coaCreditId: apAcc,
      },
      {
        transactionType: 'FAKTUR_PEMBELIAN_DISKON',
        description: 'Potongan Pembayaran saat penerbitan Faktur Pembelian',
        coaDebetId: apAcc,
        coaCreditId: discBuyAcc,
      },
      {
        transactionType: 'FAKTUR_PEMBELIAN_BIAYA_LAIN',
        description: 'Beban Lainnya saat penerbitan Faktur Pembelian',
        coaDebetId: extraExpAcc,
        coaCreditId: apAcc,
      },
      {
        transactionType: 'FAKTUR_PEMBELIAN_PPN_MASUKAN',
        description: 'PPN Masukan saat penerbitan Faktur Pembelian',
        coaDebetId: ppnInAcc,
        coaCreditId: apAcc,
      },
      {
        transactionType: 'STOK_OPNAME_KOREKSI',
        description: 'Koreksi Stok lawan persediaan pada Stok Opname',
        coaDebetId: stockCorrAcc,
        coaCreditId: invAcc,
      },
      {
        transactionType: 'PENGIRIMAN_BARANG_TRANSIT',
        description: 'Persediaan Dalam Perjalanan saat Pengiriman Barang',
        coaDebetId: transitAcc,
        coaCreditId: invAcc,
      },
      {
        transactionType: 'FAKTUR_PENJUALAN_PIUTANG',
        description: 'Piutang Dagang saat penerbitan Faktur Penjualan',
        coaDebetId: arAcc,
        coaCreditId: revAcc,
      },
      {
        transactionType: 'PENJUALAN_POTONGAN',
        description: 'Potongan Penjualan saat Faktur dan Pelunasan Penjualan',
        coaDebetId: discSaleAcc,
        coaCreditId: arAcc,
      },
      {
        transactionType: 'PENJUALAN_PPN_KELUARAN',
        description: 'PPN Keluaran saat penerbitan Faktur Penjualan',
        coaDebetId: arAcc,
        coaCreditId: ppnOutAcc,
      },
      {
        transactionType: 'UANG_MUKA_PEMBELIAN',
        description: 'Uang Muka Pembelian ke Supplier',
        coaDebetId: dpBuyAcc,
        coaCreditId: bankAcc,
      },
      {
        transactionType: 'UANG_MUKA_PENJUALAN',
        description: 'Uang Muka Penjualan dari Pelanggan',
        coaDebetId: bankAcc,
        coaCreditId: dpSaleAcc,
      },
      {
        transactionType: 'RETUR_PEMBELIAN_SELISIH',
        description: 'Selisih Harga Pembelian saat Retur Pembelian',
        coaDebetId: retDiffAcc,
        coaCreditId: invAcc,
      },
    ];

    const results = [];
    for (const rule of defaultRules) {
      if (rule.coaDebetId && rule.coaCreditId) {
        const item = await this.prisma.autoJournalConfig.upsert({
          where: { transactionType: rule.transactionType },
          update: {
            description: rule.description,
            coaDebetId: rule.coaDebetId,
            coaCreditId: rule.coaCreditId,
          },
          create: rule,
        });
        results.push(item);
      }
    }
    return results;
  }

  async upsertAutoJournalConfig(dto: {
    transactionType: string;
    coaDebetId: string;
    coaCreditId: string;
    description?: string;
  }) {
    return this.prisma.autoJournalConfig.upsert({
      where: { transactionType: dto.transactionType },
      update: {
        coaDebetId: dto.coaDebetId,
        coaCreditId: dto.coaCreditId,
        description: dto.description,
      },
      create: {
        transactionType: dto.transactionType,
        coaDebetId: dto.coaDebetId,
        coaCreditId: dto.coaCreditId,
        description: dto.description,
      },
    });
  }

  async deleteAutoJournalConfig(transactionType: string) {
    return this.prisma.autoJournalConfig.delete({
      where: { transactionType },
    });
  }
}
