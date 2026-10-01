import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  BalanceSheetQueryDto,
  DateRangeQueryDto,
  GeneralLedgerQueryDto,
} from '../dto/report-query.dto';
import { AccountType } from '@prisma/client';

@Injectable()
export class BalanceSheetReportService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDates(query: DateRangeQueryDto) {
    const fromStr = query.date_from || query.startDate;
    const toStr = query.date_to || query.endDate;

    const from = fromStr
      ? new Date(fromStr)
      : new Date(new Date().getFullYear(), 0, 1);
    const to = toStr ? new Date(toStr) : new Date();

    return { from, to };
  }

  async getBalanceSheet(query: BalanceSheetQueryDto) {
    const asOfStr = query.as_of || query.date;
    const asOf = asOfStr ? new Date(asOfStr) : new Date();

    const accounts = await this.prisma.account.findMany({
      orderBy: { code: 'asc' },
    });

    const lines = await this.prisma.journalLine.findMany({
      where: {
        journal: {
          date: { lte: asOf },
        },
      },
    });

    const accountBalances = new Map<string, { debit: number; credit: number }>();
    for (const line of lines) {
      const current = accountBalances.get(line.accountId) || { debit: 0, credit: 0 };
      current.debit += Number(line.debit);
      current.credit += Number(line.credit);
      accountBalances.set(line.accountId, current);
    }

    let revenue = 0;
    let expenses = 0;
    const assetItems: any[] = [];
    const liabilityItems: any[] = [];
    const equityItems: any[] = [];

    for (const acc of accounts) {
      const bal = accountBalances.get(acc.id) || { debit: 0, credit: 0 };
      const netDebit = bal.debit - bal.credit;
      const netCredit = bal.credit - bal.debit;

      if (acc.type === AccountType.REVENUE) {
        revenue += netCredit;
      } else if (acc.type === AccountType.EXPENSE) {
        expenses += netDebit;
      } else if (acc.type === AccountType.ASSET) {
        const balance = netDebit >= 0 ? netDebit : 0;
        assetItems.push({
          id: acc.id,
          code: acc.code,
          name: acc.name,
          balance: Math.round(balance),
          debitBalance: Math.round(bal.debit),
          creditBalance: Math.round(bal.credit),
        });
        if (netDebit < 0) {
          liabilityItems.push({
            id: acc.id,
            code: acc.code,
            name: `${acc.name} (Overdraft)`,
            balance: Math.round(Math.abs(netDebit)),
            isReclassified: true,
          });
        }
      } else if (acc.type === AccountType.LIABILITY) {
        const balance = netCredit >= 0 ? netCredit : 0;
        liabilityItems.push({
          id: acc.id,
          code: acc.code,
          name: acc.name,
          balance: Math.round(balance),
          debitBalance: Math.round(bal.debit),
          creditBalance: Math.round(bal.credit),
        });
        if (netCredit < 0) {
          assetItems.push({
            id: acc.id,
            code: acc.code,
            name: `${acc.name} (Debit Balance)`,
            balance: Math.round(Math.abs(netCredit)),
            isReclassified: true,
          });
        }
      } else if (acc.type === AccountType.EQUITY) {
        equityItems.push({
          id: acc.id,
          code: acc.code,
          name: acc.name,
          balance: Math.round(netCredit),
          debitBalance: Math.round(bal.debit),
          creditBalance: Math.round(bal.credit),
        });
      }
    }

    const netIncome = revenue - expenses;
    const totalAssets = assetItems.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilityItems.reduce((s, l) => s + l.balance, 0);
    const baseEquity = equityItems.reduce((s, e) => s + e.balance, 0);
    const totalEquity = baseEquity + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

    return {
      data: {
        date: asOf.toISOString().split('T')[0],
        assets: {
          items: assetItems,
          total: Math.round(totalAssets),
        },
        liabilities: {
          items: liabilityItems,
          total: Math.round(totalLiabilities),
        },
        equity: {
          items: equityItems,
          netIncome: Math.round(netIncome),
          total: Math.round(totalEquity),
        },
        total_assets: Math.round(totalAssets),
        total_liabilities: Math.round(totalLiabilities),
        total_equity: Math.round(totalEquity),
        totalLiabilitiesAndEquity: Math.round(totalLiabilitiesAndEquity),
        is_balanced: isBalanced,
        isBalanced,
      },
    };
  }

  async getTrialBalance(query: DateRangeQueryDto) {
    const { from, to } = this.parseDates(query);

    const accounts = await this.prisma.account.findMany({
      orderBy: { code: 'asc' },
    });

    const lines = await this.prisma.journalLine.findMany({
      where: {
        journal: {
          date: { gte: from, lte: to },
        },
      },
    });

    const accountTotals = new Map<string, { debit: number; credit: number }>();
    for (const line of lines) {
      const cur = accountTotals.get(line.accountId) || { debit: 0, credit: 0 };
      cur.debit += Number(line.debit);
      cur.credit += Number(line.credit);
      accountTotals.set(line.accountId, cur);
    }

    let totalDebit = 0;
    let totalCredit = 0;

    const data = accounts.map((acc) => {
      const cur = accountTotals.get(acc.id) || { debit: 0, credit: 0 };
      const d = Math.round(cur.debit);
      const c = Math.round(cur.credit);
      totalDebit += d;
      totalCredit += c;

      return {
        coa_id: acc.id,
        id: acc.id,
        coa_code: acc.code,
        code: acc.code,
        coa_name: acc.name,
        name: acc.name,
        type: acc.type,
        debit: d,
        credit: c,
        debitBalance: d,
        creditBalance: c,
        totalDebit: d,
        totalCredit: c,
      };
    });

    return {
      data,
      totals: {
        totalDebit,
        totalCredit,
      },
      is_balanced: totalDebit === totalCredit,
      isBalanced: totalDebit === totalCredit,
    };
  }

  async getGeneralLedger(query: GeneralLedgerQueryDto) {
    const { from, to } = this.parseDates(query);
    const coaId = query.coa_id || query.accountId;

    const whereClause: any = {
      journal: {
        date: { gte: from, lte: to },
      },
    };
    if (coaId) {
      whereClause.accountId = coaId;
    }

    const lines = await this.prisma.journalLine.findMany({
      where: whereClause,
      include: {
        journal: true,
        account: true,
      },
      orderBy: {
        journal: { date: 'asc' },
      },
    });

    let runningBalance = 0;
    const data = lines.map((l) => {
      const debit = Math.round(Number(l.debit));
      const credit = Math.round(Number(l.credit));
      runningBalance += debit - credit;

      return {
        date: l.journal.date.toISOString().split('T')[0],
        journal_code: l.journal.reference || l.journal.id.slice(0, 8),
        description: l.journal.description,
        account_code: l.account.code,
        account_name: l.account.name,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    return { data };
  }

  async getCashFlow(query: DateRangeQueryDto) {
    const { from, to } = this.parseDates(query);

    const journals = await this.prisma.journalEntry.findMany({
      where: { date: { gte: from, lte: to } },
      include: { lines: { include: { account: true } } },
    });

    let operatingIn = 0;
    let operatingOut = 0;
    let investingIn = 0;
    let investingOut = 0;
    let financingIn = 0;
    let financingOut = 0;

    for (const j of journals) {
      for (const l of j.lines) {
        const acc = l.account;
        const isCash =
          acc.type === AccountType.ASSET &&
          (acc.code.startsWith('111') || acc.code.startsWith('112'));

        if (isCash) {
          const delta = Number(l.debit) - Number(l.credit);
          const desc = (j.description || '').toLowerCase();

          if (delta > 0) {
            if (desc.includes('invest') || desc.includes('asset')) {
              investingIn += delta;
            } else if (desc.includes('capital') || desc.includes('loan') || desc.includes('modal')) {
              financingIn += delta;
            } else {
              operatingIn += delta;
            }
          } else if (delta < 0) {
            const out = Math.abs(delta);
            if (desc.includes('invest') || desc.includes('asset') || desc.includes('mesin')) {
              investingOut += out;
            } else if (desc.includes('dividend') || desc.includes('prive')) {
              financingOut += out;
            } else {
              operatingOut += out;
            }
          }
        }
      }
    }

    const netOperating = operatingIn - operatingOut;
    const netInvesting = investingIn - investingOut;
    const netFinancing = financingIn - financingOut;
    const netCashFlow = netOperating + netInvesting + netFinancing;

    return {
      data: {
        operating_cash_flow: Math.round(netOperating),
        investing_cash_flow: Math.round(netInvesting),
        financing_cash_flow: Math.round(netFinancing),
        net_cash_flow: Math.round(netCashFlow),
        operating: { in: Math.round(operatingIn), out: Math.round(operatingOut), net: Math.round(netOperating) },
        investing: { in: Math.round(investingIn), out: Math.round(investingOut), net: Math.round(netInvesting) },
        financing: { in: Math.round(financingIn), out: Math.round(financingOut), net: Math.round(netFinancing) },
      },
    };
  }
}
