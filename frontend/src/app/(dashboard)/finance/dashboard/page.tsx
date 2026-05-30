"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  TrendingUp, 
  Wallet, 
  Zap, 
  BarChart3, 
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  Activity,
  Briefcase,
  Users,
  Coins,
  Award,
  Factory,
  DollarSign,
  Star,
  Settings,
  Plus,
  Filter,
  Trash2,
  CreditCard,
  UserCheck,
  Receipt,
  Truck
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, TableWrapper, DataCard, DnaInput, DnaButton, DnaBadge } from "@/components/dna";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const fmtShort = (num: number | undefined | null) => {
  if (!num) return 'Rp 0';
  const jt = num / 1000000;
  if (jt >= 1000) return `Rp ${(jt / 1000).toFixed(1)} M`;
  if (jt >= 1) return `Rp ${jt.toFixed(1)} M`;
  return `Rp ${num.toLocaleString()}`;
};
const fmtShortJt = (num: number | undefined | null) => {
  if (!num) return 'Rp 0';
  const jt = num / 1000000;
  return `Rp ${jt.toFixed(0)} Jt`;
};
const fmtPct = (num: number | undefined | null) => (num ?? 0).toFixed(1) + '%';

const FALLBACK_TRANSACTIONS = [
  { id: 'TX-5001', date: '2024-04-02', type: 'IN / REVENUE', ref: 'SALES (INV-2041)', amount: 'Rp 125,000,000', method: 'BANK TRANSFER', status: 'PAID', color: 'text-emerald-500' },
  { id: 'TX-5002', date: '2024-04-02', type: 'OUT / COGS', ref: 'PURCHASE (PO-882)', amount: 'Rp 45,000,000', method: 'BANK TRANSFER', status: 'PAID', color: 'text-rose-500' },
  { id: 'TX-5003', date: '2024-04-01', type: 'OUT / EXPENSE', ref: 'PAYROLL (APRIL)', amount: 'Rp 180,000,000', method: 'VIRTUAL ACCOUNT', status: 'PENDING', color: 'text-rose-500' },
  { id: 'TX-5004', date: '2024-04-01', type: 'IN / OTHER', ref: 'MANUAL (INVESTMENT)', amount: 'Rp 500,000,000', method: 'DIRECT DEP', status: 'PAID', color: 'text-emerald-500' },
];
const FALLBACK_AR = [
  { id: 'INV-2045', name: 'Brand Aesthetic X', out: 'Rp 50M', due: 'DUE: 2024-04-10', status: 'PARTIAL', color: 'text-slate-900' },
  { id: 'INV-2041', name: 'Glow Up Clinic', out: 'Rp 125M', due: 'DUE: 2024-03-25', status: 'OVERDUE', color: 'text-rose-500' },
  { id: 'INV-2050', name: 'Sun & Skin Co.', out: 'Rp 80M', due: 'DUE: 2024-04-15', status: 'PARTIAL', color: 'text-slate-900' },
];
const FALLBACK_AP = [
  { id: 'BILL-401', name: 'PT Surya Kimia', out: 'Rp 250M', due: 'DUE: 2024-04-05', status: 'PENDING', color: 'text-slate-900' },
  { id: 'BILL-405', name: 'Global Kemasindo', out: 'Rp 40M', due: 'DUE: 2024-04-12', status: 'PARTIAL', color: 'text-slate-900' },
  { id: 'BILL-398', name: 'PLN Persero', out: 'Rp 45M', due: 'DUE: 2024-03-28', status: 'OVERDUE', color: 'text-rose-500' },
];
const FALLBACK_EXPENSE = [
  { cat: 'Raw Material', sub: 'SCM | PO-882', amount: 'Rp 2.4M' },
  { cat: 'Machine Parts', sub: 'PRODUKSI | REQ-M-01', amount: 'Rp 120Jt' },
  { cat: 'Ads Spend', sub: 'BD | FB-ADS-MAR', amount: 'Rp 450Jt' },
];
const FALLBACK_REVENUE = [
  { name: 'Glow Up Clinic', prod: 'Serum Glow 30ml', type: 'REPEAT ORDER', amount: 'Rp 450Jt', color: 'bg-blue-500' },
  { name: 'Brand Aesthetic X', prod: 'Service R&D', type: 'NEW DEAL', amount: 'Rp 150Jt', color: 'bg-blue-500' },
  { name: 'Indo Care', prod: 'Moisturizer Gel', type: 'REPEAT ORDER', amount: 'Rp 1.2M', color: 'bg-blue-500' },
];
const FALLBACK_CASH = [
  { date: new Date().toISOString().split('T')[0], in: '+0', out: '-0', closing: 'Rp 0' },
];
const FALLBACK_KPI = [
  { period: 'Current', status: 'STABLE', margin: '0%', coll: '0%', score: '0', color: 'text-slate-400' },
];

export default function FinanceDashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["finance-dashboard-metrics"],
    queryFn: async () => {
      const resp = await api.get("/finance/dashboard/advanced");
      return resp.data.metrics;
    },
    staleTime: 30000,
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
       <Activity className="h-6 w-6 text-slate-400 animate-pulse" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Fiscal DNA...</p>
    </div>
  );

  return (
    <DashboardShell
      title="FINANCIAL"
      titleAccent="COMMAND CENTER"
      subtitle="Cash Health, Profit Audit & Real-time Fiscal Pulse"
    >
      {/* I. EXECUTIVE CARDS - 5 COLUMN RECTANGULAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* A. REVENUE & COLLECTION */}
        <DataCard
          dotColor="bg-blue-500"
          title="A. REVENUE & COLLECTION"
          titleColor="text-slate-900"
          className="h-[210px] !py-4 !px-5"
        >
          <div className="mt-1">
             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">TOTAL REVENUE</p>
             <h2 className="text-[26px] font-black text-slate-900 tracking-tighter tabular leading-none">{fmtShort(metrics?.totalRevenue ?? metrics?.revenue)}</h2>
          </div>

          <div className="space-y-1.5 mt-auto">
             <div className="flex justify-between items-center">
                <span className="text-[7px] font-black text-slate-400 uppercase">COLLECTION RATE</span>
                <span className="text-[9px] font-black text-emerald-500 tabular">{fmtPct(metrics?.collectionRate)}</span>
             </div>
             <div className="h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                <div className="h-full bg-blue-500" style={{ width: `${metrics?.collectionRate || 82.5}%` }} />
             </div>
             <div className="flex justify-between items-center pt-0.5">
                <span className="text-[7px] font-black text-slate-400 uppercase">UNCOLLECTED</span>
                <span className="text-[9px] font-black text-rose-500 tabular">{fmtShort(metrics?.uncollected)}</span>
             </div>
          </div>
        </DataCard>

        {/* B. EXPENSE CONTROL */}
        <DataCard
          dotColor="bg-amber-500"
          title="B. EXPENSE CONTROL"
          titleColor="text-slate-900"
          className="h-[210px] !py-4 !px-5"
        >
          <div className="mt-1">
             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">TOTAL EXPENSE (MTD)</p>
             <h2 className="text-[26px] font-black text-amber-500 tracking-tighter tabular leading-none">{fmtShort(metrics?.totalExpense ?? metrics?.expense)}</h2>
          </div>

          <div className="space-y-1.5 mt-auto">
             <div className="flex justify-between text-[9px] font-black tabular">
                <span className="text-slate-400 font-black text-[7px] uppercase">COGS</span>
                <span>{fmtShort(metrics?.cogs)}</span>
             </div>
             <div className="flex justify-between text-[9px] font-black tabular">
                <span className="text-slate-400 font-black text-[7px] uppercase">OPERATIONAL</span>
                <span>{fmtShort(metrics?.operational)}</span>
             </div>
             <div className="mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="text-[7px] font-black text-slate-400 uppercase">EXPENSE RATIO</span>
                <span className="text-[9px] font-black text-amber-500 tabular">{fmtPct(metrics?.expenseRatio)}</span>
             </div>
          </div>
        </DataCard>

        {/* C. CASH FLOW HEALTH */}
        <DataCard
          dotColor="bg-emerald-500"
          title="C. CASH FLOW HEALTH"
          titleColor="text-slate-900"
          className="h-[210px] !py-4 !px-5 bg-emerald-50/20 border-emerald-100"
        >
          <div className="text-center mt-1">
             <h2 className="text-[26px] font-black text-slate-900 tracking-tighter tabular leading-none">{fmtShort(metrics?.netCashFlow)}</h2>
             <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mt-1 leading-none">NET CASH FLOW (MTD)</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto">
             <div className="bg-white p-2 rounded-xl border border-emerald-100 flex flex-col">
                <span className="text-[6px] font-black text-slate-400 uppercase">CASH IN</span>
                <span className="text-[9px] font-black text-emerald-500 tabular">{fmtShort(metrics?.cashIn)}</span>
             </div>
             <div className="bg-white p-2 rounded-xl border border-emerald-100 flex flex-col">
                <span className="text-[6px] font-black text-slate-400 uppercase">CASH OUT</span>
                <span className="text-[9px] font-black text-rose-500 tabular">{fmtShort(metrics?.cashOut)}</span>
             </div>
          </div>

          <div className="text-center pt-1.5 border-t border-emerald-100/30 mt-2">
             <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter italic">BALANCE: <span className="text-slate-900">{fmtShort(metrics?.balance ?? metrics?.currentBalance)}</span></p>
          </div>
        </DataCard>

        {/* D. PROFITABILITY */}
        <DataCard
          dotColor="bg-blue-500"
          title="D. PROFITABILITY"
          titleColor="text-slate-900"
          className="h-[210px] !py-4 !px-5"
        >
          <div className="flex justify-between items-end mt-1">
             <div>
                <p className="text-[7px] font-black text-slate-400 uppercase leading-none">NET PROFIT</p>
                <h2 className="text-[22px] font-black text-slate-900 tracking-tighter tabular leading-none mt-1">{fmtShort(metrics?.netProfit)}</h2>
             </div>
             <div className="text-right">
                <p className="text-[7px] font-black text-slate-400 uppercase leading-none">MARGIN</p>
                <span className="text-[16px] font-black text-blue-500 tabular leading-none">{fmtPct(metrics?.margin)}</span>
             </div>
          </div>

          <div className="space-y-1.5 mt-auto pt-2 border-t border-slate-50">
             <div className="flex justify-between items-center text-[9px] font-black tabular">
                <span className="text-slate-400 font-black text-[7px] uppercase">GROSS PROFIT</span>
                <span>{fmtShort(metrics?.grossProfit)}</span>
             </div>
             <div className="flex justify-between items-center text-[9px] font-black tabular">
                <span className="text-slate-400 font-black text-[7px] uppercase">GP MARGIN</span>
                <span>{fmtPct(metrics?.gpMargin)}</span>
             </div>
          </div>
        </DataCard>

        {/* E. FINANCIAL RISK */}
        <DataCard
          dotColor="bg-rose-500"
          title="E. FINANCIAL RISK"
          titleColor="text-rose-800"
          className="h-[210px] !py-4 !px-5 bg-rose-50/20 border-rose-100"
        >
          <div className="space-y-2 mt-1">
             <div className="bg-white p-1.5 rounded-xl border border-rose-100 flex justify-between items-center">
                <span className="text-[6.5px] font-black text-rose-500 uppercase">OVERDUE A/R</span>
                <span className="text-[9px] font-black tabular font-mono">{fmtShortJt(metrics?.overdueAR)}</span>
             </div>
             <div className="bg-white p-1.5 rounded-xl border border-rose-100 flex justify-between items-center">
                <span className="text-[6.5px] font-black text-amber-600 uppercase">OVERDUE A/P</span>
                <span className="text-[9px] font-black tabular font-mono">{fmtShortJt(metrics?.overdueAP)}</span>
             </div>
          </div>

          <button className="w-full bg-rose-900 text-white py-2 rounded-lg font-black text-[7.5px] uppercase tracking-tighter leading-tight h-9 mt-auto border-none cursor-pointer hover:bg-rose-950 transition-colors">
             RISK ALERT<br/>CASH RUNWAY &lt; 3 MONTHS
          </button>
        </DataCard>
      </div>

      {/* II. TRANSACTION LOG - ULTRA COMPACT TABLE */}
      <div className="space-y-3 mt-4">
        <TableWrapper
          filters={
            <div className="flex items-center gap-3 w-full">
              <span className="status-dot bg-rose-500 animate-pulse" />
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                  1. FINANCIAL TRANSACTION LOG (CENTRAL LEDGER)
                </h3>
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
                  Real-time • {(metrics?.transactions?.length ? metrics.transactions : FALLBACK_TRANSACTIONS).length} Records
                </p>
              </div>
            </div>
          }
        >
          <Table className="table-dense">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="px-4 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">TRANS ID / DATE</TableHead>
                <TableHead className="px-4 py-3 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">TYPE / CATEGORY</TableHead>
                <TableHead className="px-4 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">REFERENCE (REF ID)</TableHead>
                <TableHead className="px-4 py-3 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">AMOUNT</TableHead>
                <TableHead className="px-4 py-3 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">METHOD</TableHead>
                <TableHead className="px-4 py-3 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(metrics?.transactions?.length ? metrics.transactions : FALLBACK_TRANSACTIONS).map((row: any, i: number) => (
                <TableRow key={i} className="group hover:bg-slate-50/50 transition-all cursor-default border-slate-50">
                  <TableCell className="px-4 py-2.5 text-left">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{row.id}</p>
                    <p className="text-[8px] font-medium text-slate-300 uppercase leading-none mt-0.5">{row.date}</p>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-center">
                    <p className={cn("text-[9px] font-black uppercase tracking-tighter", row.color)}>{row.type}</p>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-left">
                    <p className="text-[10px] font-black text-slate-900 uppercase opacity-80">{row.ref}</p>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-mono tabular-nums">
                    <p className={cn("text-[12px] font-black", row.color)}>{row.amount}</p>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{row.method}</p>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-center">
                    <DnaBadge status={row.status === 'PAID' ? 'success' : 'warning'}>
                      {row.status}
                    </DnaBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>

      {/* III. ACCOUNTS RECEIVABLE & PAYABLE DUAL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* 🔵 2. ACCOUNTS RECEIVABLE */}
        <div className="space-y-3">
           <TableWrapper
             filters={
               <div className="flex items-center gap-2">
                 <span className="status-dot bg-blue-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">2. ACCOUNTS RECEIVABLE (PIUTANG)</h3>
               </div>
             }
           >
              <Table className="table-dense">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-4 py-2.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">INVOICE / CUSTOMER</TableHead>
                    <TableHead className="px-4 py-2.5 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">OUTSTANDING</TableHead>
                    <TableHead className="px-4 py-2.5 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(metrics?.receivables?.length ? metrics.receivables : FALLBACK_AR).map((row: any, i: number) => (
                    <TableRow key={i} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                      <TableCell className="px-4 py-2.5 text-left">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{row.id}</p>
                        <p className="text-[8px] font-medium text-slate-300 uppercase leading-none mt-0.5">{row.name}</p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right font-mono tabular-nums">
                        <p className={cn("text-[12px] font-black leading-none", row.color)}>{row.out}</p>
                        <p className={cn("text-[8px] font-black uppercase mt-1 opacity-40", row.color)}>{row.due}</p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center">
                        <DnaBadge status={row.status === 'OVERDUE' ? 'critical' : 'warning'}>
                          {row.status}
                        </DnaBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </TableWrapper>
        </div>

        {/* 🟠 3. ACCOUNTS PAYABLE */}
        <div className="space-y-3">
           <TableWrapper
             filters={
               <div className="flex items-center gap-2">
                 <span className="status-dot bg-amber-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">3. ACCOUNTS PAYABLE (HUTANG)</h3>
               </div>
             }
           >
              <Table className="table-dense">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-4 py-2.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">BILL / SUPPLIER</TableHead>
                    <TableHead className="px-4 py-2.5 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">OUTSTANDING</TableHead>
                    <TableHead className="px-4 py-2.5 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(metrics?.payables?.length ? metrics.payables : FALLBACK_AP).map((row: any, i: number) => (
                    <TableRow key={i} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                      <TableCell className="px-4 py-2.5 text-left">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{row.id}</p>
                        <p className="text-[8px] font-medium text-slate-300 uppercase leading-none mt-0.5">{row.name}</p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right font-mono tabular-nums">
                        <p className={cn("text-[12px] font-black leading-none", row.color)}>{row.out}</p>
                        <p className={cn("text-[8px] font-black uppercase mt-1 opacity-40", row.color)}>{row.due}</p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center">
                        <DnaBadge status={row.status === 'OVERDUE' ? 'critical' : row.status === 'PARTIAL' ? 'warning' : 'default'}>
                          {row.status}
                        </DnaBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </TableWrapper>
        </div>
      </div>

      {/* IV. BREAKDOWN GRID: EXPENSE & REVENUE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* 🟢 4. EXPENSE BREAKDOWN */}
        <div className="space-y-3">
           <TableWrapper
             filters={
               <div className="flex items-center gap-2">
                 <span className="status-dot bg-emerald-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">4. EXPENSE BREAKDOWN (DEPT AUDIT)</h3>
               </div>
             }
           >
              <Table className="table-dense">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-4 py-2.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">CATEGORY / DEPT</TableHead>
                    <TableHead className="px-4 py-2.5 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">AMOUNT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(metrics?.expenseBreakdown?.length ? metrics.expenseBreakdown : FALLBACK_EXPENSE).map((row: any, i: number) => (
                    <TableRow key={i} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                      <TableCell className="px-4 py-3 text-left">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{row.cat}</p>
                        <p className="text-[8px] font-medium text-slate-400 uppercase leading-none mt-1">{row.sub}</p>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono tabular-nums">
                        <p className="text-[13px] font-black text-slate-900 leading-none">{row.amount}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </TableWrapper>
        </div>

        {/* 🟡 5. REVENUE BREAKDOWN */}
        <div className="space-y-3">
           <TableWrapper
             filters={
               <div className="flex items-center gap-2">
                 <span className="status-dot bg-blue-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">5. REVENUE BREAKDOWN (GROWTH AUDIT)</h3>
               </div>
             }
           >
              <Table className="table-dense">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-4 py-2.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">CUSTOMER / PRODUCT</TableHead>
                    <TableHead className="px-4 py-2.5 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">SOURCE</TableHead>
                    <TableHead className="px-4 py-2.5 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">AMOUNT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(metrics?.revenueBreakdown?.length ? metrics.revenueBreakdown : FALLBACK_REVENUE).map((row: any, i: number) => (
                    <TableRow key={i} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                      <TableCell className="px-4 py-2.5 text-left">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{row.name}</p>
                        <p className="text-[8px] font-medium text-slate-300 uppercase leading-none mt-1">{row.prod}</p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center">
                        <span className={cn("px-2 py-0.5 rounded text-[8px] font-black text-white whitespace-nowrap", row.color)}>
                          {row.type}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right font-mono tabular-nums">
                        <p className="text-[13px] font-black text-emerald-500 leading-none">{row.amount}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </TableWrapper>
        </div>
      </div>

      {/* V. CONCLUDING GRID: CASH POSITION & KPI SCORE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* 🏦 6. DAILY CASH POSITION */}
        <div className="space-y-3">
           <TableWrapper
             filters={
               <div className="flex items-center gap-2">
                 <span className="status-dot bg-slate-700" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">6. DAILY CASH POSITION</h3>
               </div>
             }
           >
              <Table className="table-dense">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-4 py-2.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">DATE</TableHead>
                    <TableHead className="px-4 py-2.5 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">IN / OUT</TableHead>
                    <TableHead className="px-4 py-2.5 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">CLOSING</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(metrics?.cashPosition?.length ? metrics.cashPosition : FALLBACK_CASH).map((row: any, i: number) => (
                    <TableRow key={i} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                      <TableCell className="px-4 py-2.5 text-left">
                        <p className="text-[11px] font-black text-slate-900 font-mono tabular-nums leading-none">{row.date}</p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center font-mono tabular-nums">
                        <p className="text-[10px] font-black text-emerald-500 leading-none">{row.in}</p>
                        <p className="text-[10px] font-black text-rose-500 leading-none mt-0.5">{row.out}</p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right font-mono tabular-nums">
                        <p className="text-[13px] font-black text-slate-900 leading-none">{row.closing}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </TableWrapper>
        </div>

        {/* 📊 7. KPI PERFORMANCE */}
        <div className="space-y-3">
           <TableWrapper
             filters={
               <div className="flex items-center gap-2">
                 <span className="status-dot bg-pink-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">7. KPI PERFORMANCE (FINANCIAL SCORE)</h3>
               </div>
             }
           >
              <Table className="table-dense">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-4 py-2.5 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">PERIOD</TableHead>
                    <TableHead className="px-4 py-2.5 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">MARGIN / COLL</TableHead>
                    <TableHead className="px-4 py-2.5 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">HEALTH SCORE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(metrics?.kpiPerformance?.length ? metrics.kpiPerformance : FALLBACK_KPI).map((row: any, i: number) => (
                    <TableRow key={i} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                      <TableCell className="px-4 py-2.5 text-left">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">{row.period}</p>
                        <p className={cn("text-[7px] font-black uppercase mt-1 leading-none", row.status === 'ALERT' ? 'text-rose-500' : 'text-blue-500')}>{row.status}</p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center font-mono tabular-nums">
                        <p className="text-[11px] font-black text-slate-900 leading-none">{row.margin} / {row.coll}</p>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right font-mono tabular-nums">
                        <p className={cn("text-[18px] font-black leading-none", row.color)}>{row.score}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </TableWrapper>
        </div>
      </div>
    </DashboardShell>
  );
}
