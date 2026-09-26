/**
 * Financial statements — the read-only half of the ledger.
 *
 * Extracted from `FinanceService` in Fase 3C: trial balance, balance sheet,
 * profit & loss, cash flow and the general ledger. 481 lines that share one
 * property the rest of `FinanceService` does not — they only read. They never
 * post, never emit an event, never touch SCM or the warehouse, and they need
 * nothing but `prisma.account` / `prisma.journalLine` / `prisma.journalEntry`.
 *
 * That is why this is the seam: a statement builder that needs the journal
 * engine is not a statement builder.
 *
 * `FinanceService` keeps six one-line delegators so the published contract
 * (4 production callers, the p15/p20 e2e specs, finance-coa-integrity) does not
 * change just because the file was split.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { AccountType, NormalBalance, ReportGroup } from '@prisma/client';

/** One line of the profit-and-loss statement. */
type ReportLine = {
  id: string;
  code: string;
  name: string;
  balance: number;
};

/** One section of the profit-and-loss statement. */
type ReportBucket = {
  groups: Record<string, ReportLine[]>;
  total: number;
};

/** An account the statement could not place, kept so the omission is visible. */
type UnplacedAccount = ReportLine & {
  reason: 'REPORT_GROUP_NOT_MAPPED' | 'HEADER_ACCOUNT_HAS_OWN_LINES';
};

@Injectable()
export class FinanceReportService {
  constructor(private prisma: PrismaService) {}

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

    const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

    return {
      data: trialBalance,
      totals: {
        totalDebit: totals.debit,
        totalCredit: totals.credit,
        isBalanced,
        ...totals,
      },
      isBalanced,
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

    const isBalanced = Math.abs(totals.akhirDebit - totals.akhirCredit) < 0.01;

    return {
      data: detailedData,
      totals: {
        totalDebit: totals.akhirDebit,
        totalCredit: totals.akhirCredit,
        isBalanced,
        ...totals,
      },
      isBalanced,
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
      netIncome,
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
      operatingRevenue: { groups: {} as Record<string, ReportLine[]>, total: 0 } as ReportBucket,
      cogs: { groups: {} as Record<string, ReportLine[]>, total: 0 } as ReportBucket,
      operatingExpenses: { groups: {} as Record<string, ReportLine[]>, total: 0 } as ReportBucket,
      otherIncome: { groups: {} as Record<string, ReportLine[]>, total: 0 } as ReportBucket,
      otherExpenses: { groups: {} as Record<string, ReportLine[]>, total: 0 } as ReportBucket,
      grossProfit: 0,
      operatingIncome: 0,
      netProfit: 0,
    };

    const unplacedAccounts: UnplacedAccount[] = [];

    const bucketByReportGroup: Partial<Record<ReportGroup, ReportBucket>> = {
      [ReportGroup.OPERATING_REVENUE]: report.operatingRevenue,
      [ReportGroup.COGS]: report.cogs,
      [ReportGroup.OPEX]: report.operatingExpenses,
      [ReportGroup.OTHER_REVENUE]: report.otherIncome,
      [ReportGroup.OTHER_EXPENSE]: report.otherExpenses,
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

      const item: ReportLine = { id: acc.id, code: acc.code, name: acc.name, balance };

      const target = bucketByReportGroup[acc.reportGroup as ReportGroup];
      if (!target) {
        // Do not drop this silently. An account with no usable `reportGroup` is
        // absent from the statement, and an absent account is indistinguishable
        // from an account with no activity — which is how a misconfigured COA
        // produces a plausible, entirely wrong report.
        unplacedAccounts.push({ ...item, reason: 'REPORT_GROUP_NOT_MAPPED' });
        return;
      }

      // A header account holds children and the children carry the amounts, so
      // listing the header too would double-count. A parentless account is an
      // ordinary leaf — the live COA is flat (every account has `parentId = NULL`),
      // so dropping parentless accounts emptied the whole statement.
      if ((acc.children?.length ?? 0) > 0) {
        if (balance !== 0) {
          unplacedAccounts.push({ ...item, reason: 'HEADER_ACCOUNT_HAS_OWN_LINES' });
        }
        return;
      }

      const groupName = acc.parent ? acc.parent.name : 'LAINNYA';
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

    const revenueTotal = report.operatingRevenue.total + report.otherIncome.total;
    const expensesTotal = report.cogs.total + report.operatingExpenses.total + report.otherExpenses.total;
    const netIncome = report.netProfit;

    const revenue = {
      total: revenueTotal,
      operating: report.operatingRevenue,
      other: report.otherIncome,
    };
    const expenses = {
      total: expensesTotal,
      cogs: report.cogs,
      operating: report.operatingExpenses,
      other: report.otherExpenses,
    };

    return {
      revenue,
      expenses,
      netIncome,
      // Empty means every account was placed. Non-empty means the statement is
      // incomplete and the caller must not present it as final.
      unplacedAccounts,
      ...report,
    };
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
          acc.type === AccountType.ASSET &&
          (acc.code.startsWith('111') ||
            acc.code.startsWith('112') ||
            acc.code.startsWith('11'));

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
            if (acc.code.startsWith('12') || acc.code.startsWith('15'))
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
}
