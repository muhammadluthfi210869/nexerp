"use client";

import React, { useState, useEffect } from "react";
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
  PieChart
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="space-y-6">
      <div className={cn(
        "p-4 rounded-3xl border flex items-center justify-between px-8 transition-all animate-in fade-in slide-in-from-top-2",
        isBalanced ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"
      )}>
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <div className="p-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="p-2 bg-rose-500 rounded-full shadow-lg shadow-rose-500/40">
              <XCircle className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-xs font-black uppercase tracking-tight">
            {isBalanced ? "VERIFIED: NERACA SALDO BALANCE" : `NOT BALANCED: SELISIH ${formatCurrency(diff)}`}
          </span>
        </div>
        <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">Status Audit Otomatis</span>
      </div>

      <Card className="overflow-x-auto border-slate-100 shadow-xl rounded-3xl">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th rowSpan={2} className="px-4 py-6 text-[10px] font-black uppercase tracking-tight text-slate-400 sticky left-0 bg-slate-50 z-10">Kode</th>
              <th rowSpan={2} className="px-4 py-6 text-[10px] font-black uppercase tracking-tight text-slate-400 sticky left-20 bg-slate-50 z-10">Nama Akun</th>
              <th colSpan={2} className="px-4 py-3 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center border-l border-slate-200">Saldo Awal</th>
              <th colSpan={2} className="px-4 py-3 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center border-l border-slate-200">Perubahan</th>
              <th colSpan={2} className="px-4 py-3 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center border-l border-slate-200">Saldo Akhir</th>
            </tr>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-right border-l border-slate-200">Debit</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-right">Kredit</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-right border-l border-slate-200">Debit</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-right">Kredit</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-right border-l border-slate-200">Debit</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-right">Kredit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-3 text-[11px] font-black font-sans text-brand-blue sticky left-0 bg-white group-hover:bg-slate-50">{item.code}</td>
                <td className="px-4 py-3 text-[11px] font-bold text-slate-700 sticky left-20 bg-white group-hover:bg-slate-50">{item.name}</td>
                <td className="px-4 py-3 text-right text-[11px] font-medium text-slate-500 border-l border-slate-50">{item.awalDebit > 0 ? formatCurrency(item.awalDebit) : "-"}</td>
                <td className="px-4 py-3 text-right text-[11px] font-medium text-slate-500">{item.awalCredit > 0 ? formatCurrency(item.awalCredit) : "-"}</td>
                <td className="px-4 py-3 text-right text-[11px] font-medium text-slate-600 border-l border-slate-100">{item.perubahanDebit > 0 ? formatCurrency(item.perubahanDebit) : "-"}</td>
                <td className="px-4 py-3 text-right text-[11px] font-medium text-slate-600">{item.perubahanCredit > 0 ? formatCurrency(item.perubahanCredit) : "-"}</td>
                <td className="px-4 py-3 text-right text-[11px] font-black text-slate-900 border-l border-slate-200">{item.akhirDebit > 0 ? formatCurrency(item.akhirDebit) : "-"}</td>
                <td className="px-4 py-3 text-right text-[11px] font-black text-slate-900">{item.akhirCredit > 0 ? formatCurrency(item.akhirCredit) : "-"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-black uppercase">
            <tr>
              <td colSpan={2} className="px-4 py-6 text-xs italic">Total Konsolidasi</td>
              <td className="px-4 py-6 text-right text-xs text-brand-blue/50 border-l border-white/10">{formatCurrency(totals.awalDebit)}</td>
              <td className="px-4 py-6 text-right text-xs text-brand-blue/50">{formatCurrency(totals.awalCredit)}</td>
              <td className="px-4 py-6 text-right text-xs text-amber-400 border-l border-white/10">{formatCurrency(totals.perubahanDebit)}</td>
              <td className="px-4 py-6 text-right text-xs text-amber-400">{formatCurrency(totals.perubahanCredit)}</td>
              <td className="px-4 py-6 text-right text-xs text-emerald-400 border-l border-white/10">{formatCurrency(totals.akhirDebit)}</td>
              <td className="px-4 py-6 text-right text-xs text-emerald-400">{formatCurrency(totals.akhirCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}

function ProfitLossTab({ startDate, endDate }: { startDate: string, endDate: string }) {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    api.get("/finance/reports/profit-loss", { params: { startDate, endDate } })
      .then(res => setReport(res.data));
  }, [startDate, endDate]);

  if (!report) return <div className="p-20 text-center animate-pulse">Loading report data...</div>;

  const renderGroup = (title: string, groupData: any, isNegative: boolean = false) => (
    <div className="space-y-4">
      <div className="flex justify-between items-end border-b-2 border-slate-200 pb-2">
        <h3 className="text-lg font-black italic uppercase text-slate-500">{title}</h3>
        <span className={cn("text-lg font-black", isNegative ? "text-rose-600" : "text-emerald-600")}>
          {isNegative && groupData.total > 0 ? "-" : ""}{formatCurrency(Math.abs(groupData.total))}
        </span>
      </div>
      <div className="space-y-6 pl-4">
        {Object.entries(groupData.groups).map(([groupName, accounts]: any) => (
          <div key={groupName} className="space-y-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{groupName.replace(/_/g, ' ')}</h4>
            <div className="space-y-1">
              {accounts.map((acc: any) => (
                <div key={acc.id} className="flex justify-between text-sm hover:bg-slate-50 p-1 transition-colors group">
                  <div className="flex gap-4">
                    <span className="text-[10px] font-sans text-slate-300 group-hover:text-brand-blue">{acc.code}</span>
                    <span className="font-bold text-slate-600">{acc.name}</span>
                  </div>
                  <span className="font-sans font-medium text-slate-500">{formatCurrency(acc.balance)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="p-8 border-none shadow-2xl rounded-[3rem] bg-white/80 backdrop-blur-xl">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">LABA RUGI</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.5em] mt-4">Profit & Loss Statement</p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tight">Period Activity</span>
            <div className="flex gap-2 text-sm font-sans font-bold text-slate-600 mt-1">
              <span>{startDate}</span>
              <ArrowRight className="w-3 h-3 mt-1" />
              <span>{endDate}</span>
            </div>
          </div>
        </div>

        <section className="space-y-12">
          {/* REVENUE */}
          {renderGroup("OPERATING REVENUE", report.operatingRevenue)}

          {/* COGS */}
          {renderGroup("COST OF GOODS SOLD", report.cogs, true)}

          {/* GROSS PROFIT */}
          <div className="flex justify-between bg-emerald-500 p-6 rounded-[2rem] shadow-lg shadow-emerald-500/20 text-white">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Gross Profit Margin</span>
              <h4 className="text-xl font-black uppercase italic">GROSS PROFIT</h4>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black">{formatCurrency(report.grossProfit)}</span>
            </div>
          </div>

          {/* OPERATING EXPENSES */}
          {renderGroup("OPERATING EXPENSES", report.operatingExpenses, true)}

          {/* OPERATING INCOME */}
          <div className="flex justify-between bg-slate-800 p-6 rounded-[2rem] shadow-lg text-white">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">EBIT</span>
              <h4 className="text-xl font-black uppercase italic">INCOME FROM OPERATION</h4>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">{formatCurrency(report.operatingIncome)}</span>
            </div>
          </div>

          {/* OTHER INCOME */}
          {renderGroup("OTHER INCOME", report.otherIncome)}

          {/* OTHER EXPENSES */}
          {renderGroup("OTHER EXPENSES", report.otherExpenses, true)}
        </section>

        {/* FINAL NET PROFIT */}
        <div className="mt-16 p-12 bg-slate-900 rounded-[3rem] flex justify-between items-center text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-emerald-500/20 transition-all duration-1000" />
          <div className="relative z-10">
            <h2 className="text-5xl font-black italic uppercase leading-none tracking-tighter">LABA BERSIH</h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-4">NET PROFIT/LOSS (Before Tax)</p>
          </div>
          <div className="text-right relative z-10">
            <span className="text-6xl font-black text-emerald-400 drop-shadow-2xl">{formatCurrency(report.netProfit)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BalanceSheetTab({ endDate }: { endDate: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/finance/reports/balance-sheet", { params: { date: endDate } })
      .then(res => setData(res.data));
  }, [endDate]);

  if (!data) return null;

  const balanceDiff = Math.abs(data.assets.total - data.totalLiabilitiesAndEquity);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className={cn(
        "p-4 rounded-3xl border flex items-center justify-between px-8 transition-all",
        data.isBalanced ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"
      )}>
        <div className="flex items-center gap-3">
          {data.isBalanced ? (
            <div className="p-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="p-2 bg-rose-500 rounded-full shadow-lg shadow-rose-500/40">
              <XCircle className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-xs font-black uppercase tracking-tight">
            {data.isBalanced ? "VERIFIED: NERACA BALANCE (AKTIVA = PASIVA)" : `NOT BALANCED: SELISIH ${formatCurrency(balanceDiff)}`}
          </span>
        </div>
        <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">Status Audit Aktiva & Pasiva</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT: ASSETS */}
        <div className="space-y-8">
          <header className="flex justify-between items-end border-b-4 border-slate-900 pb-4">
            <div>
              <h2 className="text-3xl font-black italic uppercase text-slate-900">ASSETS</h2>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Aktiva Kekayaan Perusahaan</p>
            </div>
            <span className="text-2xl font-black text-brand-blue">{formatCurrency(data.assets.total)}</span>
          </header>

          {/* Current Assets */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-tight text-slate-500">CURRENT ASSETS (Lancar)</h3>
              <span className="text-sm font-black text-slate-900">{formatCurrency(data.assets.items.filter((a: any) => !a.code.startsWith('15')).reduce((s: number, a: any) => s + a.balance, 0))}</span>
            </div>
            <div className="grid gap-2 pl-4">
              {data.assets.items.filter((a: any) => !a.code.startsWith('15')).map((acc: any) => (
                <div key={acc.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-all group">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{acc.code}</span>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-brand-blue transition-colors">{acc.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{formatCurrency(acc.balance)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed Assets */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-tight text-slate-500">FIXED ASSETS (Tetap)</h3>
              <span className="text-sm font-black text-slate-900">{formatCurrency(data.assets.items.filter((a: any) => a.code.startsWith('15')).reduce((s: number, a: any) => s + a.balance, 0))}</span>
            </div>
            <div className="grid gap-2 pl-4">
              {data.assets.items.filter((a: any) => a.code.startsWith('15')).map((acc: any) => (
                <div key={acc.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-all">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{acc.code}</span>
                    <span className="text-xs font-bold text-slate-700">{acc.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{formatCurrency(acc.balance)}</span>
                </div>
              ))}
              {data.assets.items.filter((a: any) => a.code.startsWith('15')).length === 0 && (
                <p className="text-[10px] italic text-slate-300 pl-4">Belum ada data aktiva tetap</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: LIABILITIES & EQUITY */}
        <div className="space-y-8">
          <header className="flex justify-between items-end border-b-4 border-indigo-900 pb-4">
            <div>
              <h2 className="text-3xl font-black italic uppercase text-indigo-900">LIABILITIES & EQUITIES</h2>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Pasiva & Kewajiban</p>
            </div>
            <span className="text-2xl font-black text-brand-blue">{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
          </header>

          {/* Liabilities */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <h3 className="text-xs font-black uppercase tracking-tight text-indigo-500">LIABILITIES (Kewajiban)</h3>
              <span className="text-sm font-black text-indigo-900">{formatCurrency(data.liabilities.total)}</span>
            </div>
            <div className="grid gap-2 pl-4">
              {data.liabilities.items.map((acc: any) => (
                <div key={acc.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-all">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{acc.code}</span>
                    <span className="text-xs font-bold text-slate-700">{acc.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{formatCurrency(acc.balance)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Equity */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-brand-blue/10 p-4 rounded-2xl border border-brand-blue/20">
              <h3 className="text-xs font-black uppercase tracking-tight text-brand-blue">EQUITIES (Modal & Laba)</h3>
              <span className="text-sm font-black text-brand-blue">{formatCurrency(data.equity.total)}</span>
            </div>
            <div className="grid gap-2 pl-4">
              {data.equity.items.map((acc: any) => (
                <div key={acc.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-all">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{acc.code}</span>
                    <span className="text-xs font-bold text-slate-700">{acc.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{formatCurrency(acc.creditBalance - acc.debitBalance)}</span>
                </div>
              ))}
              <div className="mt-4 p-6 bg-slate-900 rounded-[2rem] text-white flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight text-emerald-400">Current Earnings</p>
                  <h4 className="text-sm font-black italic">LABA BERJALAN TAHUN INI</h4>
                </div>
                <span className="text-xl font-black text-emerald-400">{formatCurrency(data.equity.netIncome)}</span>
              </div>
            </div>
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

  useEffect(() => {
    api.get("/finance/accounts").then(res => setAccounts(res.data));
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccId) {
      setSelectedAccId(accounts[0].id);
    }
  }, [accounts]);

  const fetchLedger = () => {
    if (!selectedAccId) return;
    api.get(`/finance/reports/general-ledger/${selectedAccId}`, { params: { startDate, endDate } })
      .then(res => setLedgerData(res.data));
  };

  useEffect(() => {
    if (selectedAccId) {
      fetchLedger();
    }
  }, [selectedAccId, startDate, endDate]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-end gap-4 max-w-2xl">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Pilih Akun Audit</label>
          <select
            value={selectedAccId}
            onChange={(e) => setSelectedAccId(e.target.value)}
            className="w-full h-11 bg-slate-50 border-none rounded-xl text-xs font-bold px-4 focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">-- Cari Akun --</option>
            {accounts.map(a => <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>)}
          </select>
        </div>
        <Button
          onClick={fetchLedger}
          className="h-11 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl px-8 font-black uppercase tracking-tight text-[10px]"
        >
          TAMPILKAN MUTASI
        </Button>
      </div>

      {ledgerData && (
        <Card className="overflow-hidden border-slate-100 shadow-xl rounded-[2rem]">
          <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase italic">BUKU BESAR: {ledgerData.account.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Saldo Normal: {ledgerData.account.normalBalance}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Saldo Awal</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(ledgerData.beginningBalance)}</p>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tight text-slate-400">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tight text-slate-400">Keterangan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-right">Debit</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-right">Kredit</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-right">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ledgerData.transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{new Date(t.date).toLocaleDateString("id-ID")}</td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-700">{t.description}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase">{t.reference}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-slate-900">{t.debit > 0 ? formatCurrency(t.debit) : "-"}</td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-slate-900">{t.credit > 0 ? formatCurrency(t.credit) : "-"}</td>
                  <td className="px-6 py-4 text-right text-xs font-black text-brand-blue">
                    {formatCurrency(t.balance)}
                    {t.attachmentUrls?.length > 0 && (
                      <div className="mt-2 flex justify-end gap-1">
                        {t.attachmentUrls.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-100 hover:bg-brand-blue hover:text-white rounded-md text-[8px] transition-colors">
                            BUKTI
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white">
              <tr>
                <td colSpan={4} className="px-6 py-6 text-xs font-black uppercase">Saldo Akhir Per Periode</td>
                <td className="px-6 py-6 text-right text-sm font-black text-emerald-400">{formatCurrency(ledgerData.endingBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}
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

  if (loading) return <div className="p-20 text-center animate-pulse">Analyzing project budgets...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-slate-900 text-white rounded-3xl">
          <p className="text-[10px] font-black uppercase opacity-40 mb-2">Total Project Budget</p>
          <h3 className="text-2xl font-black">{formatCurrency(data.reduce((s, i) => s + i.budget, 0))}</h3>
        </Card>
        <Card className="p-6 bg-white border-slate-100 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total Actual Spent</p>
          <h3 className="text-2xl font-black text-rose-500">{formatCurrency(data.reduce((s, i) => s + i.spent, 0))}</h3>
        </Card>
        <Card className="p-6 bg-white border-slate-100 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total Material Cost</p>
          <h3 className="text-2xl font-black text-brand-blue">{formatCurrency(data.reduce((s, i) => s + i.materialSpend, 0))}</h3>
        </Card>
        <Card className="p-6 bg-emerald-500 text-white rounded-3xl">
          <p className="text-[10px] font-black uppercase opacity-40 mb-2">Avg. Project Margin</p>
          <h3 className="text-2xl font-black">
            {((data.reduce((s, i) => s + i.margin, 0) / (data.reduce((s, i) => s + i.budget, 0) || 1)) * 100).toFixed(1)}%
          </h3>
        </Card>
      </div>

      <Card className="overflow-hidden border-slate-100 shadow-xl rounded-[2rem]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400">Project / Product</th>
              <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 text-right">Budget</th>
              <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 text-right">Spent</th>
              <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 text-center">Status</th>
              <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 text-right">Margin (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-5">
                  <p className="text-xs font-black text-slate-900 uppercase">{item.project}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{item.product}</p>
                </td>
                <td className="px-6 py-5 text-right text-xs font-bold text-slate-600">{formatCurrency(item.budget)}</td>
                <td className="px-6 py-5 text-right text-xs font-bold text-rose-500">{formatCurrency(item.spent)}</td>
                <td className="px-6 py-5 text-center">
                  <Badge className={cn("px-3 py-1 rounded-lg text-[9px] font-black border-none", 
                    item.progress === 'IN_PRODUCTION' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {item.progress}
                  </Badge>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex flex-col items-end">
                    <span className={cn("text-xs font-black", item.marginPercent > 30 ? "text-emerald-500" : "text-rose-500")}>
                      {item.marginPercent.toFixed(1)}%
                    </span>
                    <div className="w-20 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                       <div className={cn("h-full", item.marginPercent > 30 ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${Math.max(0, Math.min(100, item.marginPercent))}%` }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const Badge = ({ children, className }: any) => (
  <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", className)}>
    {children}
  </span>
);

// --- MAIN PAGE ---

export default function FinancialReportsHub() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="p-1 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      <header className="border-b border-slate-100 pb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-brand-blue" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nex Finance</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            LAPORAN <span className="text-slate-400 font-light">KEUANGAN</span>
          </h1>
        </div>

        <div className="flex gap-4 items-end bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Dari</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 bg-slate-50 border-none rounded-xl text-xs font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sampai</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11 bg-slate-50 border-none rounded-xl text-xs font-bold"
            />
          </div>
          <Button
            className="h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 font-black uppercase tracking-tight text-[10px]"
          >
            REFRESH SEMUA TAB
          </Button>
        </div>
      </header>

      <Tabs defaultValue="general-ledger" className="space-y-8">
        <div className="relative">
          <TabsList className="bg-slate-100/50 backdrop-blur-md p-1.5 rounded-[1.5rem] h-16 inline-flex gap-1 border border-slate-200/50 shadow-inner relative z-10">
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
                className="relative rounded-xl px-8 h-full data-[state=active]:text-slate-900 text-slate-500 transition-all duration-300 text-[10px] font-black uppercase tracking-tight z-20 overflow-hidden"
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
    </div>
  );
}

