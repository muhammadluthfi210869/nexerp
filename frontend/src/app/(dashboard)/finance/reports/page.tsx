"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  Search,
  Filter,
  ArrowRight,
  Target,
  PieChart,
  ArrowRightLeft,
  ChevronRight,
  Info
} from "lucide-react";

import { DnaButton, DnaInput, DnaBadge, StatCard, DataCard, TableWrapper } from "@/components/dna";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/layout/DashboardShell";

// --- HELPERS ---
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(val || 0);
};

// --- SUB-COMPONENTS ---

function TrialBalanceTab({ startDate, endDate }: { startDate: string, endDate: string }) {
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [isBalanced, setIsBalanced] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get("/finance/reports/trial-balance/detailed", { params: { startDate, endDate } })
      .then(res => {
        setData(res.data.data);
        setTotals(res.data.totals);
        setIsBalanced(res.data.isBalanced);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const diff = Math.abs((totals.akhirDebit || 0) - (totals.akhirCredit || 0));

  return (
    <div className="space-y-6 animate-fade-slide-in">
      <div className={cn(
        "p-4 rounded-2xl border flex items-center justify-between px-6 transition-all text-xs font-black shadow-sm",
        isBalanced ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
      )}>
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <div className="p-1.5 bg-emerald-500 rounded-full shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          ) : (
            <div className="p-1.5 bg-rose-500 rounded-full shadow-sm">
              <XCircle className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
          )}
          <span className="text-xs font-black uppercase tracking-tight">
            {isBalanced ? "VERIFIED: NERACA SALDO BALANCE" : `NOT BALANCED: SELISIH ${formatCurrency(diff)}`}
          </span>
        </div>
        <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">Status Audit Otomatis</span>
      </div>

      <TableWrapper>
        <Table className="table-dense">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead rowSpan={2} className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-tight">Kode</TableHead>
              <TableHead rowSpan={2} className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-tight">Nama Akun</TableHead>
              <TableHead colSpan={2} className="px-4 py-2 text-center text-table-header text-slate-400 uppercase tracking-tight border-l border-slate-100">Saldo Awal</TableHead>
              <TableHead colSpan={2} className="px-4 py-2 text-center text-table-header text-slate-400 uppercase tracking-tight border-l border-slate-100">Perubahan</TableHead>
              <TableHead colSpan={2} className="px-4 py-2 text-center text-table-header text-slate-400 uppercase tracking-tight border-l border-slate-100">Saldo Akhir</TableHead>
            </TableRow>
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="px-4 py-2 text-right text-table-header text-slate-400 uppercase tracking-tight border-l border-slate-100">Debit</TableHead>
              <TableHead className="px-4 py-2 text-right text-table-header text-slate-400 uppercase tracking-tight">Kredit</TableHead>
              <TableHead className="px-4 py-2 text-right text-table-header text-slate-400 uppercase tracking-tight border-l border-slate-100">Debit</TableHead>
              <TableHead className="px-4 py-2 text-right text-table-header text-slate-400 uppercase tracking-tight">Kredit</TableHead>
              <TableHead className="px-4 py-2 text-right text-table-header text-slate-400 uppercase tracking-tight border-l border-slate-100">Debit</TableHead>
              <TableHead className="px-4 py-2 text-right text-table-header text-slate-400 uppercase tracking-tight">Kredit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={`${item.id}-${index}`} className="hover:bg-slate-50/30 transition-all duration-300 group">
                <TableCell className="px-4 py-3 text-left font-black font-sans text-blue-600">{item.code}</TableCell>
                <TableCell className="px-4 py-3 text-left font-medium text-slate-700">{item.name}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono tabular-nums text-[11px] text-slate-500 border-l border-slate-50">{item.awalDebit > 0 ? formatCurrency(item.awalDebit) : "-"}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono tabular-nums text-[11px] text-slate-500">{item.awalCredit > 0 ? formatCurrency(item.awalCredit) : "-"}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono tabular-nums text-[11px] text-slate-600 border-l border-slate-100">{item.perubahanDebit > 0 ? formatCurrency(item.perubahanDebit) : "-"}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono tabular-nums text-[11px] text-slate-600">{item.perubahanCredit > 0 ? formatCurrency(item.perubahanCredit) : "-"}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono tabular-nums text-[11px] font-black text-slate-900 border-l border-slate-200">{item.akhirDebit > 0 ? formatCurrency(item.akhirDebit) : "-"}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono tabular-nums text-[11px] font-black text-slate-900">{item.akhirCredit > 0 ? formatCurrency(item.akhirCredit) : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <tfoot className="bg-slate-900 text-white font-black uppercase text-[10px]">
            <tr>
              <td colSpan={2} className="px-4 py-4 text-xs italic text-left pl-6">Total Konsolidasi</td>
              <td className="px-4 py-4 text-right text-xs text-slate-300 font-mono border-l border-slate-700">{formatCurrency(totals.awalDebit)}</td>
              <td className="px-4 py-4 text-right text-xs text-slate-300 font-mono">{formatCurrency(totals.awalCredit)}</td>
              <td className="px-4 py-4 text-right text-xs text-amber-300 font-mono border-l border-slate-700">{formatCurrency(totals.perubahanDebit)}</td>
              <td className="px-4 py-4 text-right text-xs text-amber-300 font-mono">{formatCurrency(totals.perubahanCredit)}</td>
              <td className="px-4 py-4 text-right text-xs text-emerald-300 font-mono border-l border-slate-700">{formatCurrency(totals.akhirDebit)}</td>
              <td className="px-4 py-4 text-right text-xs text-emerald-300 font-mono">{formatCurrency(totals.akhirCredit)}</td>
            </tr>
          </tfoot>
        </Table>
      </TableWrapper>
    </div>
  );
}

function ProfitLossTab({ startDate, endDate }: { startDate: string, endDate: string }) {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    api.get("/finance/reports/profit-loss", { params: { startDate, endDate } })
      .then(res => setReport(res.data));
  }, [startDate, endDate]);

  if (!report) return <div className="p-20 text-center animate-pulse font-black text-xs text-slate-400">MEMUAT LAPORAN LABA RUGI...</div>;

  const grossMargin = ((report.grossProfit / (report.operatingRevenue.total || 1)) * 100).toFixed(1);
  const operatingMargin = ((report.operatingIncome / (report.operatingRevenue.total || 1)) * 100).toFixed(1);
  const netMargin = ((report.netProfit / (report.operatingRevenue.total || 1)) * 100).toFixed(1);

  const renderGroupCard = (title: string, groupData: any, dotColor: string, isNegative: boolean = false) => {
    const total = groupData?.total || 0;
    return (
      <DataCard title={title} dotColor={dotColor}>
        <div className="flex justify-between items-end border-b border-slate-100 pb-3">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Group</span>
          <span className={cn("text-sm font-black font-mono", isNegative ? "text-rose-600" : "text-emerald-600")}>
            {isNegative && total > 0 ? "-" : ""}{formatCurrency(Math.abs(total))}
          </span>
        </div>
        <div className="space-y-4 pt-4">
          {Object.entries(groupData?.groups || {}).map(([groupName, accounts]: any) => (
            <div key={groupName} className="space-y-2">
              <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-wider bg-slate-50 px-2.5 py-1 rounded-lg w-max">
                {groupName.replace(/_/g, ' ')}
              </h4>
              <div className="space-y-1.5 divide-y divide-slate-50">
                {accounts.map((acc: any, accIdx: number) => (
                  <div key={`${groupName}-${acc.id}-${accIdx}`} className="flex justify-between items-center py-2.5 text-xs hover:bg-slate-50/50 px-1 rounded-lg transition-colors group">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black font-sans text-slate-300 group-hover:text-blue-600">
                        {acc.code}
                      </span>
                      <span className="font-semibold text-slate-700">{acc.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-600">{formatCurrency(acc.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!groupData?.groups || Object.keys(groupData.groups).length === 0) && (
            <div className="text-center py-6 text-slate-400 italic text-[11px]">
              Tidak ada catatan akun
            </div>
          )}
        </div>
      </DataCard>
    );
  };

  return (
    <div className="space-y-6 animate-fade-slide-in">
      {/* 4 Funnel Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pendapatan"
          value={formatCurrency(report.operatingRevenue.total)}
          icon={<TrendingUp className="text-emerald-500" />}
        />
        <StatCard
          label="Laba Kotor"
          value={formatCurrency(report.grossProfit)}
          subValue={`${grossMargin}% Gross Margin`}
          icon={<TrendingUp className="text-emerald-600" />}
        />
        <StatCard
          label="Laba Operasional"
          value={formatCurrency(report.operatingIncome)}
          subValue={`${operatingMargin}% EBIT Margin`}
          icon={<ShieldCheck className="text-blue-600" />}
        />
        <StatCard
          label="Laba Bersih"
          value={formatCurrency(report.netProfit)}
          subValue={`${netMargin}% Net Margin`}
          icon={<TrendingUp className="text-emerald-500" />}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none">LAPORAN LABA RUGI</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Profit & Loss Statement</p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tight">Period Activity</span>
            <div className="flex gap-2 text-xs font-sans font-medium text-slate-600 mt-1 justify-end">
              <span>{startDate}</span>
              <ArrowRight className="w-3 h-3 mt-0.5" />
              <span>{endDate}</span>
            </div>
          </div>
        </div>

        {/* Side-by-Side Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT COLUMN: INCOME */}
          <div className="space-y-6">
            <div className="px-1">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">PENDAPATAN / INFLOWS</h3>
            </div>
            {renderGroupCard("OPERATING REVENUE", report.operatingRevenue, "bg-emerald-500")}
            {renderGroupCard("OTHER INCOME", report.otherIncome, "bg-blue-500")}
          </div>

          {/* RIGHT COLUMN: EXPENSES */}
          <div className="space-y-6">
            <div className="px-1">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">BEBAN / OUTFLOWS</h3>
            </div>
            {renderGroupCard("COST OF GOODS SOLD (HPP)", report.cogs, "bg-rose-500", true)}
            {renderGroupCard("OPERATING EXPENSES", report.operatingExpenses, "bg-amber-500", true)}
            {renderGroupCard("OTHER EXPENSES", report.otherExpenses, "bg-rose-500", true)}
          </div>
        </div>

        {/* Final Net Profit Banner */}
        <div className="mt-8 p-6 bg-emerald-600 rounded-2xl flex justify-between items-center text-white relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/20 transition-all duration-1000" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter">LABA BERSIH</h2>
            <p className="text-[10px] font-medium text-white/70 uppercase tracking-[0.3em] mt-2">NET PROFIT/LOSS (Before Tax)</p>
          </div>
          <div className="text-right relative z-10">
            <span className="text-3xl font-black text-white drop-shadow-sm font-mono">{formatCurrency(report.netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const buildTree = (items: any[]) => {
  const map: Record<string, any> = {};
  const tree: any[] = [];

  items.forEach(item => {
    map[item.id] = { ...item, children: [] };
  });

  items.forEach(item => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children?.push(map[item.id]);
    } else {
      tree.push(map[item.id]);
    }
  });

  return tree;
};

function RenderAccountRow({ acc, level = 0, formatCurrency }: { acc: any, level?: number, formatCurrency: (v: number) => string }) {
  const hasChildren = acc.children && acc.children.length > 0;
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex justify-between items-center py-2 px-3 rounded-xl transition-all group text-xs",
          level === 0 ? "bg-slate-100/50 mb-1" : "hover:bg-slate-50",
          hasChildren ? "cursor-pointer" : ""
        )}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5" style={{ paddingLeft: `${level * 16}px` }}>
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-[8px] font-black transition-all",
            level === 0 ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-600"
          )}>
            {acc.code.substring(0, 3)}
          </div>
          <div>
            <p className={cn(
              "text-[11px] tracking-tight uppercase",
              level === 0 ? "font-black text-slate-900" : "font-medium text-slate-700",
              hasChildren ? "text-blue-900" : ""
            )}>
              {acc.name}
              {acc.isReclassified && (
                <span className="ml-2 text-[6px] bg-rose-100 text-rose-600 px-1 py-0.5 rounded font-black">RECLASSIFIED</span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-xs font-black font-mono tabular-nums",
            level === 0 ? "text-slate-900" : "text-slate-600",
            acc.balance < 0 ? "text-rose-500" : ""
          )}>
            {formatCurrency(acc.balance || (acc.creditBalance - acc.debitBalance))}
          </p>
        </div>
      </motion.div>
      {isOpen && hasChildren && acc.children?.map((child: any, childIdx: number) => (
        <RenderAccountRow key={`${child.id}-${childIdx}`} acc={child} level={level + 1} formatCurrency={formatCurrency} />
      ))}
    </>
  );
}

function BalanceSheetTab({ endDate }: { endDate: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/finance/reports/balance-sheet", { params: { date: endDate } })
      .then(res => setData(res.data));
  }, [endDate]);

  if (!data) return <div className="p-20 text-center animate-pulse font-black text-xs text-slate-400">MEMUAT LAPORAN NERACA...</div>;

  const balanceDiff = Math.abs(data.assets.total - data.totalLiabilitiesAndEquity);

  return (
    <div className="space-y-6 pb-10 animate-fade-slide-in">
      {/* Balancing Banner at top */}
      <div className={cn(
        "p-5 rounded-2xl flex items-center justify-between border shadow-sm transition-all duration-500",
        data.isBalanced 
          ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
          : "bg-rose-50 border-rose-100 text-rose-700"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl",
            data.isBalanced ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          )}>
            {data.isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">Status Neraca: {data.isBalanced ? "SEIMBANG" : "TIDAK SEIMBANG"}</h4>
            <p className="text-[10px] font-medium opacity-80 mt-1">
              {data.isBalanced 
                ? "Persamaan dasar akuntansi terpenuhi: Aset = Liabilitas + Ekuitas."
                : "Terdapat perbedaan nilai antara total Aktiva dan total Pasiva."}
            </p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase opacity-60">Total Aset</p>
            <p className="text-base font-black font-mono">{formatCurrency(data.assets.total || 0)}</p>
          </div>
          <div className="w-px h-8 bg-slate-200 mx-1" />
          <div className="text-right">
            <p className="text-[8px] font-black uppercase opacity-60">Liabilitas + Ekuitas</p>
            <p className="text-base font-black font-mono">{formatCurrency(data.totalLiabilitiesAndEquity || 0)}</p>
          </div>
          {!data.isBalanced && (
            <>
              <div className="w-px h-8 bg-rose-200 mx-1" />
              <div className="text-right text-rose-600">
                <p className="text-[8px] font-black uppercase opacity-60">Selisih (Gap)</p>
                <p className="text-base font-black font-mono">{formatCurrency(balanceDiff)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Side-by-Side 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: AKTIVA (ASSETS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
              AKTIVA <span className="text-slate-400 font-medium">(ASSETS)</span>
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Debit Balance</span>
            </div>
          </div>

          <DataCard noShadow={false}>
            <div className="space-y-1">
              {buildTree(data.assets.items).map((acc, idx) => (
                <RenderAccountRow key={`${acc.id}-${idx}`} acc={acc} formatCurrency={formatCurrency} />
              ))}
              {data.assets.items.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic text-xs">No asset records found.</div>
              )}
            </div>
            
            <div className="mt-4 p-5 bg-blue-600 rounded-xl text-white flex justify-between items-center shadow-sm">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-blue-200 block mb-0.5">Grand Total</span>
                <span className="text-xs font-black uppercase tracking-tight">TOTAL AKTIVA</span>
              </div>
              <span className="text-lg font-black text-emerald-300 font-mono tabular-nums">{formatCurrency(data.assets.total || 0)}</span>
            </div>
          </DataCard>
        </div>

        {/* RIGHT: PASIVA (LIABILITIES & EQUITIES) */}
        <div className="space-y-6">
          {/* Liabilities Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                PASIVA <span className="text-slate-400 font-medium">(LIABILITIES)</span>
              </h3>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Credit Balance</span>
            </div>

            <DataCard>
              <div className="space-y-1">
                {buildTree(data.liabilities.items).map((acc, idx) => (
                  <RenderAccountRow key={`${acc.id}-${idx}`} acc={acc} formatCurrency={formatCurrency} />
                ))}
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-500 italic">Subtotal Liabilities</span>
                <span className="text-sm font-black text-slate-950 font-mono">{formatCurrency(data.liabilities.total || 0)}</span>
              </div>
            </DataCard>
          </div>

          {/* Equity Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                EKUITAS <span className="text-slate-400 font-medium">(EQUITIES)</span>
              </h3>
            </div>

            <DataCard>
              <div className="space-y-1">
                {buildTree(data.equity.items).map((acc, idx) => (
                  <RenderAccountRow key={`${acc.id}-${idx}`} acc={acc} formatCurrency={formatCurrency} />
                ))}

                {/* Laba Tahun Berjalan (Net Income) */}
                <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/50 border border-blue-100 mt-4 shadow-sm group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-900 uppercase tracking-tight">Laba Tahun Berjalan</p>
                      <p className="text-[8px] font-medium text-blue-400 uppercase mt-0.5">Net Income (Current Year)</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-blue-700 font-mono">{formatCurrency(data.equity.netIncome || 0)}</span>
                </div>
              </div>
              <div className="mt-4 p-5 bg-blue-950 rounded-xl text-white flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-blue-300 block mb-0.5">Grand Total</span>
                  <span className="text-xs font-black uppercase tracking-tight">TOTAL PASIVA</span>
                </div>
                <span className="text-lg font-black text-amber-400 font-mono">{formatCurrency(data.totalLiabilitiesAndEquity || 0)}</span>
              </div>
            </DataCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralLedgerTab({ startDate, endDate }: { startDate: string, endDate: string }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccId, setSelectedAccId] = useState("");
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [accSearch, setAccSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/finance/accounts").then(res => setAccounts(res.data));
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccId) {
      setSelectedAccId(accounts[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  const fetchLedger = useCallback(() => {
    if (!selectedAccId) return;
    setLoading(true);
    api.get(`/finance/reports/general-ledger/${selectedAccId}`, { params: { startDate, endDate } })
      .then(res => setLedgerData(res.data))
      .finally(() => setLoading(false));
  }, [selectedAccId, startDate, endDate]);

  useEffect(() => {
    if (selectedAccId) {
      fetchLedger();
    }
  }, [selectedAccId, startDate, endDate, fetchLedger]);

  const filteredAccounts = accounts.filter(a =>
    a.code.toLowerCase().includes(accSearch.toLowerCase()) ||
    a.name.toLowerCase().includes(accSearch.toLowerCase())
  );

  const ledgerDebitTotal = ledgerData?.transactions?.reduce((sum: number, t: any) => sum + (t.debit || 0), 0) || 0;
  const ledgerCreditTotal = ledgerData?.transactions?.reduce((sum: number, t: any) => sum + (t.credit || 0), 0) || 0;

  return (
    <div className="grid grid-cols-12 gap-8 items-start animate-fade-slide-in">
      {/* Sidebar: CoA list */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <DataCard title="CHART OF ACCOUNTS" dotColor="bg-blue-600">
          <div className="space-y-4">
            <DnaInput
              placeholder="Cari akun..."
              value={accSearch}
              onChange={(e) => setAccSearch(e.target.value)}
              className="text-xs h-10 border border-slate-200"
              icon={<Search className="w-3.5 h-3.5" />}
            />
            
            <div className="max-h-[480px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {filteredAccounts.map((a, idx) => {
                const isActive = a.id === selectedAccId;
                return (
                  <button
                    key={`${a.id}-${idx}`}
                    onClick={() => setSelectedAccId(a.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-xs flex flex-col gap-1 transition-all border",
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm font-semibold"
                        : "bg-slate-50/50 hover:bg-slate-50 border-slate-100 text-slate-700 hover:text-slate-900"
                    )}
                  >
                    <span className={cn(
                      "text-[9px] font-mono tracking-wider",
                      isActive ? "text-blue-200" : "text-blue-600 font-bold"
                    )}>
                      {a.code}
                    </span>
                    <span className="truncate leading-tight">{a.name}</span>
                  </button>
                );
              })}
              {filteredAccounts.length === 0 && (
                <div className="text-center py-8 text-slate-400 italic text-[11px]">
                  Akun tidak ditemukan
                </div>
              )}
            </div>
          </div>
        </DataCard>
      </div>

      {/* Content: Mutasi ledger */}
      <div className="col-span-12 lg:col-span-9 space-y-6">
        {!selectedAccId ? (
          <DataCard className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <BookOpen className="w-12 h-12 text-slate-300 stroke-[1.5px] mb-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Silakan pilih akun dari daftar di kiri</p>
          </DataCard>
        ) : loading ? (
          <div className="p-20 text-center animate-pulse font-black text-xs text-slate-400 uppercase tracking-widest bg-white border border-slate-100 rounded-3xl shadow-sm">
            Memuat mutasi buku besar...
          </div>
        ) : ledgerData ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Saldo Awal"
                value={formatCurrency(ledgerData.beginningBalance)}
                icon={<BookOpen className="text-slate-400" />}
              />
              <StatCard
                label="Mutasi Debit"
                value={formatCurrency(ledgerDebitTotal)}
                icon={<TrendingUp className="text-emerald-500" />}
              />
              <StatCard
                label="Mutasi Kredit"
                value={formatCurrency(ledgerCreditTotal)}
                icon={<TrendingUp className="text-rose-500 rotate-180" />}
              />
              <StatCard
                label="Saldo Akhir"
                value={formatCurrency(ledgerData.endingBalance)}
                icon={<ShieldCheck className="text-blue-600" />}
              />
            </div>

            <TableWrapper
              filters={
                <div className="flex justify-between items-center bg-slate-50/30 p-4 rounded-xl border border-slate-100">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase italic">
                      BUKU BESAR: {ledgerData.account.name}
                    </h3>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-1">
                      Normal Balance: {ledgerData.account.normalBalance}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Active Audit Account</span>
                  </div>
                </div>
              }
            >
              <Table className="table-dense">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-6 py-4 text-table-header text-slate-400 uppercase tracking-tight text-left">Tanggal</TableHead>
                    <TableHead className="px-6 py-4 text-table-header text-slate-400 uppercase tracking-tight text-left">Keterangan</TableHead>
                    <TableHead className="px-6 py-4 text-table-header text-slate-400 uppercase tracking-tight text-right">Debit</TableHead>
                    <TableHead className="px-6 py-4 text-table-header text-slate-400 uppercase tracking-tight text-right">Kredit</TableHead>
                    <TableHead className="px-6 py-4 text-table-header text-slate-400 uppercase tracking-tight text-right">Saldo Berjalan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerData.transactions.map((t: any, tIdx: number) => (
                    <TableRow key={`${t.id}-${tIdx}`} className="hover:bg-slate-50/30 transition-all duration-300 group">
                      <TableCell className="px-6 py-4 text-[10px] font-medium text-slate-500 text-left">
                        {new Date(t.date).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-left">
                        <p className="text-xs font-semibold text-slate-700">{t.description}</p>
                        <p className="text-[9px] font-black text-slate-300 uppercase mt-0.5 tracking-wider">{t.reference}</p>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right text-xs font-semibold text-slate-900 font-mono tabular-nums">
                        {t.debit > 0 ? formatCurrency(t.debit) : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right text-xs font-semibold text-slate-900 font-mono tabular-nums">
                        {t.credit > 0 ? formatCurrency(t.credit) : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right text-xs font-black text-blue-600 font-mono tabular-nums">
                        {formatCurrency(t.balance)}
                        {t.attachmentUrls?.length > 0 && (
                          <div className="mt-2 flex justify-end gap-1">
                            {t.attachmentUrls.map((url: string, i: number) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer" className="p-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-md text-[8px] transition-colors font-black">
                                BUKTI
                              </a>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ledgerData.transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-slate-400 italic text-xs">
                        Tidak ada transaksi mutasi dalam periode ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <tfoot className="bg-slate-900 text-white font-black uppercase text-[10px]">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-xs italic text-left pl-8">Saldo Akhir Per Periode</td>
                    <td className="px-6 py-4 text-right text-sm text-emerald-300 font-mono">{formatCurrency(ledgerData.endingBalance)}</td>
                  </tr>
                </tfoot>
              </Table>
            </TableWrapper>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProjectBudgetingTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get("/finance/reports/project-budgeting")
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-xs text-slate-400">ANALYZING PROJECT BUDGETS...</div>;

  return (
    <div className="space-y-6 animate-fade-slide-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Total Project Budget"
          value={formatCurrency(data.reduce((s, i) => s + i.budget, 0))}
          icon={<BookOpen className="text-blue-600" />}
        />
        <StatCard
          label="Total Actual Spent"
          value={formatCurrency(data.reduce((s, i) => s + i.spent, 0))}
          icon={<XCircle className="text-rose-500" />}
        />
        <StatCard
          label="Total Material Cost"
          value={formatCurrency(data.reduce((s, i) => s + i.materialSpend, 0))}
          icon={<PieChart className="text-amber-500" />}
        />
        <StatCard
          label="Avg. Project Margin"
          value={`${((data.reduce((s, i) => s + i.margin, 0) / (data.reduce((s, i) => s + i.budget, 0) || 1)) * 100).toFixed(1)}%`}
          icon={<Target className="text-emerald-500" />}
        />
      </div>

      <TableWrapper>
        <Table className="table-dense">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="px-6 py-4 text-left text-table-header text-slate-400 uppercase tracking-tight">Project / Product</TableHead>
              <TableHead className="px-6 py-4 text-right text-table-header text-slate-400 uppercase tracking-tight">Budget</TableHead>
              <TableHead className="px-6 py-4 text-right text-table-header text-slate-400 uppercase tracking-tight">Spent</TableHead>
              <TableHead className="px-6 py-4 text-center text-table-header text-slate-400 uppercase tracking-tight">Burn Rate (%)</TableHead>
              <TableHead className="px-6 py-4 text-center text-table-header text-slate-400 uppercase tracking-tight">Status</TableHead>
              <TableHead className="px-6 py-4 text-right pr-10 text-table-header text-slate-400 uppercase tracking-tight">Margin (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, pIdx) => {
              const burnRate = (item.spent / (item.budget || 1)) * 100;
              const burnRateColor = burnRate > 100 ? "text-rose-600 font-bold animate-pulse" : burnRate >= 80 ? "text-amber-500" : "text-emerald-500";
              const burnRateBg = burnRate > 100 ? "bg-rose-500" : burnRate >= 80 ? "bg-amber-500" : "bg-emerald-500";

              return (
                <TableRow key={`${item.id}-${pIdx}`} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                  <TableCell className="px-6 py-5 text-left">
                    <p className="text-xs font-black text-slate-900 uppercase">{item.project}</p>
                    <p className="text-[9px] font-medium text-slate-400 uppercase mt-1">{item.product}</p>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right text-xs font-medium text-slate-600 font-mono tabular-nums">{formatCurrency(item.budget)}</TableCell>
                  <TableCell className="px-6 py-5 text-right text-xs font-medium text-rose-500 font-mono tabular-nums">{formatCurrency(item.spent)}</TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn("text-xs font-mono", burnRateColor)}>
                        {burnRate.toFixed(1)}%
                      </span>
                      <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full", burnRateBg)} style={{ width: `${Math.max(0, Math.min(100, burnRate))}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <DnaBadge status={item.progress === 'IN_PRODUCTION' ? 'warning' : 'info'}>
                      {item.progress}
                    </DnaBadge>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right pr-10">
                    <div className="flex flex-col items-end">
                      <span className={cn("text-xs font-black font-mono", item.marginPercent > 30 ? "text-emerald-500" : "text-rose-500")}>
                        {item.marginPercent.toFixed(1)}%
                      </span>
                      <div className="w-20 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                         <div className={cn("h-full", item.marginPercent > 30 ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${Math.max(0, Math.min(100, item.marginPercent))}%` }} />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  );
}

// --- MAIN PAGE ---

export default function FinancialReportsHub() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <DashboardShell
      title="LAPORAN"
      titleAccent="KEUANGAN"
      subtitle="Consolidated ledger, profit & loss statement, and trial balance registry"
      actions={
        <div className="flex gap-2 items-center">
          <div className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 pl-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black uppercase text-slate-400">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-[11px] font-medium text-slate-700 outline-none w-28 focus:ring-0"
              />
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 pr-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-[11px] font-medium text-slate-700 outline-none w-28 focus:ring-0"
              />
            </div>
          </div>
          <DnaButton
            onClick={() => window.location.reload()}
            variant="primary"
          >
            REFRESH SEMUA
          </DnaButton>
        </div>
      }
    >
      <Tabs defaultValue="general-ledger" className="space-y-8">
        <div className="relative">
          <TabsList className="bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl h-16 inline-flex gap-1 border border-slate-200/50 shadow-inner relative z-10">
            {[
              { id: "general-ledger", label: "Buku Besar", icon: BookOpen },
              { id: "profit-loss", label: "Laba Rugi", icon: TrendingUp },
              { id: "balance-sheet", label: "Neraca", icon: ShieldCheck },
              { id: "trial-balance", label: "Neraca Saldo", icon: CheckCircle2 },
              { id: "project-budgeting", label: "Project Budgeting", icon: PieChart }
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative rounded-xl px-8 h-full data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-500 transition-all duration-300 text-[10px] font-black uppercase tracking-tight z-20 overflow-hidden"
              >
                <div className="flex items-center relative z-30">
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <TabsContent value="trial-balance">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <TrialBalanceTab startDate={startDate} endDate={endDate} />
            </motion.div>
          </TabsContent>

          <TabsContent value="profit-loss">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ProfitLossTab startDate={startDate} endDate={endDate} />
            </motion.div>
          </TabsContent>

          <TabsContent value="balance-sheet">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <BalanceSheetTab endDate={endDate} />
            </motion.div>
          </TabsContent>

          <TabsContent value="general-ledger">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <GeneralLedgerTab startDate={startDate} endDate={endDate} />
            </motion.div>
          </TabsContent>

          <TabsContent value="project-budgeting">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ProjectBudgetingTab />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </DashboardShell>
  );
}
