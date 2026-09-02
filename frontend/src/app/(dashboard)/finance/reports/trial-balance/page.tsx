"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, 
  Calendar, 
  ArrowRightLeft, 
  Download, 
  CheckCircle2, 
  XCircle,
  FileSearch,
  ChevronRight
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaInput, DnaButton, DnaBadge, TableWrapper, DataCard } from "@/components/dna";
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

interface TrialBalanceItem {
  id: string;
  code: string;
  name: string;
  type: string;
  awalDebit: number;
  awalCredit: number;
  perubahanDebit: number;
  perubahanCredit: number;
  akhirDebit: number;
  akhirCredit: number;
}

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalanceItem[]>([]);
  const [totals, setTotals] = useState({ 
    awalDebit: 0, awalCredit: 0, 
    perubahanDebit: 0, perubahanCredit: 0, 
    akhirDebit: 0, akhirCredit: 0 
  });
  const [isBalanced, setIsBalanced] = useState(true);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/finance/reports/trial-balance/detailed", {
        params: { startDate, endDate }
      });
      setData(res.data.data);
      setTotals(res.data.totals);
      setIsBalanced(res.data.isBalanced);
    } catch (err) {
      console.error("Failed to fetch trial balance", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (val: number) => {
    if (val === 0) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <DashboardShell title="TRIAL" titleAccent="BALANCE" subtitle="Verifikasi keseimbangan Debit & Kredit seluruh akun buku besar secara real-time.">
      <div className="animate-fade-slide-in space-y-10">
        <div className="flex gap-4 items-end bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mulai Dari</label>
            <DnaInput 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
              className="text-xs font-black"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sampai</label>
            <DnaInput 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
              className="text-xs font-black"
            />
          </div>
          <DnaButton 
            variant="primary"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? "MEMUAT..." : "FILTER DATA"}
          </DnaButton>
        </div>

        {/* Audit Status Banner */}
        <div className={cn(
          "p-5 rounded-2xl flex items-center justify-between border shadow-sm transition-all duration-500",
          isBalanced 
            ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
            : "bg-rose-50 border-rose-100 text-rose-700"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-2xl",
              isBalanced ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            )}>
              {isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">Status Audit: {isBalanced ? "NERACA SALDO SEIMBANG" : "NERACA SALDO SELISIH"}</h4>
              <p className="text-[10px] font-medium opacity-80 mt-1">
                {isBalanced 
                  ? "Semua buku pembantu debit dan kredit memiliki total yang sama (seimbang sempurna)."
                  : "Terdapat perbedaan saldo akumulasi antara kolom Debit dan Kredit."}
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="text-[8px] font-black uppercase opacity-60">Total Debit</p>
              <p className="text-base font-black font-mono">{formatCurrency(totals.akhirDebit)}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 mx-1" />
            <div className="text-right">
              <p className="text-[8px] font-black uppercase opacity-60">Total Kredit</p>
              <p className="text-base font-black font-mono">{formatCurrency(totals.akhirCredit)}</p>
            </div>
            {!isBalanced && (
              <>
                <div className="w-px h-8 bg-rose-200 mx-1" />
                <div className="text-right text-rose-600">
                  <p className="text-[8px] font-black uppercase opacity-60">Selisih (Gap)</p>
                  <p className="text-base font-black font-mono">{formatCurrency(Math.abs(totals.akhirDebit - totals.akhirCredit))}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Full-width Table */}
        <TableWrapper>
          <div className="overflow-x-auto">
            <Table className="table-dense min-w-[1000px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead rowSpan={2} className="px-4 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px] border-r border-slate-100">Kode</TableHead>
                  <TableHead rowSpan={2} className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px] border-r border-slate-100">Nama Akun</TableHead>
                  <TableHead colSpan={2} className="px-4 py-2 text-center font-black text-slate-400 uppercase tracking-tight text-[9px] border-b border-r border-slate-100">Saldo Awal</TableHead>
                  <TableHead colSpan={2} className="px-4 py-2 text-center font-black text-slate-400 uppercase tracking-tight text-[9px] border-b border-r border-slate-100">Perubahan</TableHead>
                  <TableHead colSpan={2} className="px-4 py-2 text-center font-black text-slate-400 uppercase tracking-tight text-[9px] border-b border-slate-100">Saldo Akhir</TableHead>
                </TableRow>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="px-4 py-2 text-[9px] font-black uppercase tracking-tight text-right border-r border-slate-100 text-slate-400">Debit</TableHead>
                  <TableHead className="px-4 py-2 text-[9px] font-black uppercase tracking-tight text-right border-r border-slate-100 text-slate-400">Kredit</TableHead>
                  <TableHead className="px-4 py-2 text-[9px] font-black uppercase tracking-tight text-right border-r border-slate-100 text-slate-400">Debit</TableHead>
                  <TableHead className="px-4 py-2 text-[9px] font-black uppercase tracking-tight text-right border-r border-slate-100 text-slate-400">Kredit</TableHead>
                  <TableHead className="px-4 py-2 text-[9px] font-black uppercase tracking-tight text-right border-r border-slate-100 text-slate-400">Debit</TableHead>
                  <TableHead className="px-4 py-2 text-[9px] font-black uppercase tracking-tight text-right text-slate-400">Kredit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {data.map((item) => (
                    <TableRow 
                      key={item.id}
                      className="group hover:bg-blue-50/30 transition-colors"
                    >
                      <TableCell className="px-4 py-4 border-r border-slate-50 text-left">
                        <span className="text-[10px] font-black font-sans text-slate-400 group-hover:text-blue-600">
                          {item.code}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 border-r border-slate-50 text-left">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800 group-hover:text-blue-900 transition-colors">{item.name}</span>
                          <span className="text-[8px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5">{item.type}</span>
                        </div>
                      </TableCell>
                      {/* Saldo Awal */}
                      <TableCell className="px-4 py-4 text-right border-r border-slate-50 font-mono text-xs tabular-nums text-slate-500">
                        {formatCurrency(item.awalDebit)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right border-r border-slate-50 font-mono text-xs tabular-nums text-slate-500">
                        {formatCurrency(item.awalCredit)}
                      </TableCell>
                      {/* Perubahan */}
                      <TableCell className="px-4 py-4 text-right border-r border-slate-50 font-mono font-black text-xs tabular-nums text-blue-600">
                        {formatCurrency(item.perubahanDebit)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right border-r border-slate-50 font-mono font-black text-xs tabular-nums text-blue-600">
                        {formatCurrency(item.perubahanCredit)}
                      </TableCell>
                      {/* Saldo Akhir */}
                      <TableCell className="px-4 py-4 text-right border-r border-slate-50 font-mono font-black text-xs tabular-nums text-slate-900">
                        {formatCurrency(item.akhirDebit)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right font-mono font-black text-xs tabular-nums text-slate-900">
                        {formatCurrency(item.akhirCredit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </AnimatePresence>
              </TableBody>
              <tfoot className="bg-slate-900 text-white font-black uppercase text-[10px]">
                <tr>
                  <td colSpan={2} className="px-6 py-6 border-r border-slate-800 text-center uppercase tracking-tight text-xs">
                    Total Akumulasi
                  </td>
                  <td className="px-4 py-6 text-right border-r border-slate-800 tabular-nums font-mono">
                    {formatCurrency(totals.awalDebit)}
                  </td>
                  <td className="px-4 py-6 text-right border-r border-slate-800 tabular-nums font-mono">
                    {formatCurrency(totals.awalCredit)}
                  </td>
                  <td className="px-4 py-6 text-right border-r border-slate-800 tabular-nums font-mono">
                    {formatCurrency(totals.perubahanDebit)}
                  </td>
                  <td className="px-4 py-6 text-right border-r border-slate-800 tabular-nums font-mono">
                    {formatCurrency(totals.perubahanCredit)}
                  </td>
                  <td className="px-4 py-6 text-right border-r border-slate-800 tabular-nums font-mono">
                    {formatCurrency(totals.akhirDebit)}
                  </td>
                  <td className="px-4 py-6 text-right border-r border-slate-800 tabular-nums font-mono">
                    {formatCurrency(totals.akhirCredit)}
                  </td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </TableWrapper>
      </div>
    </DashboardShell>
  );
}
