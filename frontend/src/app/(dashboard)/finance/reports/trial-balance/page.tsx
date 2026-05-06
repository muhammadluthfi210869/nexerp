"use client";

import React, { useState, useEffect } from "react";
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    if (val === 0) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="p-1 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      <header className="border-b border-slate-100 pb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-brand-blue" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Financial Reports</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            NERACA <span className="text-slate-400 font-light">SALDO</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-md font-medium">
            Verifikasi keseimbangan Debit & Kredit seluruh akun buku besar secara real-time.
          </p>
        </div>

        <div className="flex gap-4 items-end bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mulai Dari</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-none rounded-xl text-xs font-bold"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sampai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-none rounded-xl text-xs font-bold"
              />
            </div>
          </div>
          <Button 
            onClick={fetchData}
            disabled={loading}
            className="h-11 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl px-8 font-black uppercase tracking-tight text-[10px]"
          >
            {loading ? "MEMUAT..." : "FILTER DATA"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Table */}
        <div className="col-span-12 space-y-6">
          <Card className="overflow-hidden border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th rowSpan={2} className="px-4 py-6 text-[10px] font-black uppercase tracking-tight border-r border-white/10">Kode</th>
                    <th rowSpan={2} className="px-6 py-6 text-[10px] font-black uppercase tracking-tight border-r border-white/10">Nama Akun</th>
                    <th colSpan={2} className="px-4 py-4 text-[10px] font-black uppercase tracking-tight text-center border-b border-r border-white/10 bg-slate-800">Saldo Awal</th>
                    <th colSpan={2} className="px-4 py-4 text-[10px] font-black uppercase tracking-tight text-center border-b border-r border-white/10 bg-slate-800">Perubahan</th>
                    <th colSpan={2} className="px-4 py-4 text-[10px] font-black uppercase tracking-tight text-center border-b border-white/10 bg-slate-800">Saldo Akhir</th>
                  </tr>
                  <tr className="bg-slate-800 text-white/70">
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-tight text-right border-r border-white/10">Debit</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-tight text-right border-r border-white/10">Kredit</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-tight text-right border-r border-white/10">Debit</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-tight text-right border-r border-white/10">Kredit</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-tight text-right border-r border-white/10">Debit</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-tight text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {data.map((item, idx) => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.01 }}
                        className="group hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="px-4 py-4 border-r border-slate-50">
                          <span className="text-[10px] font-black font-sans text-slate-400 group-hover:text-indigo-600">
                            {item.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-50">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 group-hover:text-indigo-900 transition-colors">{item.name}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{item.type}</span>
                          </div>
                        </td>
                        {/* Saldo Awal */}
                        <td className="px-4 py-4 text-right border-r border-slate-50 font-medium text-xs tabular-nums text-slate-500">
                          {formatCurrency(item.awalDebit)}
                        </td>
                        <td className="px-4 py-4 text-right border-r border-slate-50 font-medium text-xs tabular-nums text-slate-500">
                          {formatCurrency(item.awalCredit)}
                        </td>
                        {/* Perubahan */}
                        <td className="px-4 py-4 text-right border-r border-slate-50 font-black text-xs tabular-nums text-indigo-600">
                          {formatCurrency(item.perubahanDebit)}
                        </td>
                        <td className="px-4 py-4 text-right border-r border-slate-50 font-black text-xs tabular-nums text-indigo-600">
                          {formatCurrency(item.perubahanCredit)}
                        </td>
                        {/* Saldo Akhir */}
                        <td className="px-4 py-4 text-right border-r border-slate-50 font-black text-xs tabular-nums text-slate-900">
                          {formatCurrency(item.akhirDebit)}
                        </td>
                        <td className="px-4 py-4 text-right font-black text-xs tabular-nums text-slate-900">
                          {formatCurrency(item.akhirCredit)}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
                <tfoot className="bg-amber-400 text-slate-900 font-black italic">
                  <tr>
                    <td colSpan={2} className="px-6 py-6 border-r border-amber-500/20 text-center uppercase tracking-tight text-xs">
                      Total Akumulasi
                    </td>
                    <td className="px-4 py-6 text-right border-r border-amber-500/20 tabular-nums">
                      {formatCurrency(totals.awalDebit)}
                    </td>
                    <td className="px-4 py-6 text-right border-r border-amber-500/20 tabular-nums">
                      {formatCurrency(totals.awalCredit)}
                    </td>
                    <td className="px-4 py-6 text-right border-r border-amber-500/20 tabular-nums">
                      {formatCurrency(totals.perubahanDebit)}
                    </td>
                    <td className="px-4 py-6 text-right border-r border-amber-500/20 tabular-nums">
                      {formatCurrency(totals.perubahanCredit)}
                    </td>
                    <td className="px-4 py-6 text-right border-r border-amber-500/20 tabular-nums">
                      {formatCurrency(totals.akhirDebit)}
                    </td>
                    <td className="px-4 py-6 text-right tabular-nums">
                      {formatCurrency(totals.akhirCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar Status */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <Card className={cn(
            "p-8 rounded-3xl border-none shadow-2xl relative overflow-hidden",
            isBalanced ? "bg-emerald-600 shadow-emerald-200" : "bg-rose-600 shadow-rose-200"
          )}>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="w-32 h-32 rotate-12" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  {isBalanced ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <XCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-white/80">Audit Status</span>
              </div>

              <div>
                <h3 className="text-3xl font-black text-white italic leading-tight uppercase">
                  {isBalanced ? "BALANCED" : "DISCREPANCY"}
                </h3>
                <p className="text-white/70 text-[10px] font-medium mt-2 leading-relaxed">
                  {isBalanced 
                    ? "Sistem memvalidasi bahwa total Debit dan Kredit seimbang sempurna. Data siap untuk laporan Neraca."
                    : "Peringatan! Terdapat selisih antara total Debit dan Kredit. Silakan periksa kembali entri jurnal terakhir."
                  }
                </p>
              </div>

              {!isBalanced && (
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                  <div className="flex justify-between items-center text-white">
                    <span className="text-[10px] font-black uppercase">Selisih</span>
                    <span className="text-lg font-black">{formatCurrency(Math.abs(totals.akhirDebit - totals.akhirCredit))}</span>
                  </div>
                </div>
              )}

              <Button className="w-full bg-white text-slate-900 hover:bg-slate-50 h-14 rounded-2xl font-black uppercase tracking-tight text-[10px]">
                <Download className="w-4 h-4 mr-2" />
                EKSPOR LAPORAN
              </Button>
            </div>
          </Card>

          <Card className="p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-brand-blue" />
                <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">Audit Quick Links</span>
             </div>
             <div className="space-y-2">
                {[
                  { name: "Lihat Buku Besar", icon: ArrowRightLeft },
                  { name: "Verifikasi Jurnal", icon: CheckCircle2 },
                  { name: "Pengaturan CoA", icon: ChevronRight },
                ].map((link, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-brand-blue/5 group transition-all">
                    <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-brand-blue">{link.name}</span>
                    <link.icon className="w-3 h-3 text-slate-300 group-hover:text-brand-blue" />
                  </button>
                ))}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

