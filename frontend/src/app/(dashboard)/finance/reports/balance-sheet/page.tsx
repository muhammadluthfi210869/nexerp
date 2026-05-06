"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Calendar, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  FileText,
  Download,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AccountItem {
  id: string;
  code: string;
  name: string;
  type: string;
  reportGroup: string;
  parentId: string | null;
  balance: number;
  debitBalance: number;
  creditBalance: number;
  isReclassified?: boolean;
  children?: AccountItem[];
}

interface BalanceSheetData {
  date: string;
  assets: { items: AccountItem[]; total: number };
  liabilities: { items: AccountItem[]; total: number };
  equity: { items: AccountItem[]; netIncome: number; total: number };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/finance/reports/balance-sheet", {
        params: { date }
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch balance sheet", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2
    }).format(val);
  };

  const buildTree = (items: AccountItem[]) => {
    const map: Record<string, AccountItem> = {};
    const tree: AccountItem[] = [];

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

  const RenderAccountRow = ({ acc, level = 0 }: { acc: AccountItem, level?: number }) => {
    const hasChildren = acc.children && acc.children.length > 0;
    const [isOpen, setIsOpen] = useState(true);

    return (
      <>
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex justify-between items-center py-3 px-4 rounded-xl transition-all group",
            level === 0 ? "bg-slate-100/50 mb-1" : "hover:bg-slate-50",
            hasChildren ? "cursor-pointer" : ""
          )}
          onClick={() => hasChildren && setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3" style={{ paddingLeft: `${level * 24}px` }}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black transition-all",
              level === 0 ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-600"
            )}>
              {acc.code.substring(0, 3)}
            </div>
            <div>
              <p className={cn(
                "text-xs tracking-tight uppercase",
                level === 0 ? "font-black text-slate-900" : "font-bold text-slate-700",
                hasChildren ? "text-indigo-900" : ""
              )}>
                {acc.name}
                {acc.isReclassified && (
                  <span className="ml-2 text-[7px] bg-rose-100 text-rose-600 px-1 py-0.5 rounded font-black">RECLASSIFIED</span>
                )}
              </p>
              {level === 0 && <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{acc.reportGroup.replace('_', ' ')}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-sm font-black tabular-nums",
              level === 0 ? "text-slate-900" : "text-slate-600",
              acc.balance < 0 ? "text-rose-500" : ""
            )}>
              {formatCurrency(acc.balance || (acc.creditBalance - acc.debitBalance))}
            </p>
            <button className="text-[7px] font-black text-indigo-500 uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Detail Ledger</button>
          </div>
        </motion.div>
        {isOpen && hasChildren && acc.children?.map(child => (
          <RenderAccountRow key={child.id} acc={child} level={level + 1} />
        ))}
      </>
    );
  };

  if (!data && loading) return <div className="p-20 text-center font-black animate-pulse">MEMUAT LAPORAN...</div>;

  return (
    <div className="p-1 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      <header className="border-b border-slate-100 pb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Statement of Financial Position</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            LAPORAN <span className="text-slate-400 font-light">NERACA</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-md font-medium">
            Representasi posisi keuangan perusahaan yang terintegrasi secara otomatis.
          </p>
        </div>

        <div className="flex gap-4 items-end bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Posisi Per Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-none rounded-xl text-xs font-bold w-[200px]"
              />
            </div>
          </div>
          <Button 
            onClick={fetchData}
            disabled={loading}
            className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 font-black uppercase tracking-tight text-[10px]"
          >
            {loading ? "MEMUAT..." : "PERBARUI"}
          </Button>
        </div>
      </header>

      {/* Balancing Banner */}
      <div className={cn(
        "p-6 rounded-3xl flex items-center justify-between border shadow-sm transition-all duration-500",
        data?.isBalanced 
          ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
          : "bg-rose-50 border-rose-100 text-rose-700"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl",
            data?.isBalanced ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          )}>
            {data?.isBalanced ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">Status Laporan: {data?.isBalanced ? "SEIMBANG" : "TIDAK SEIMBANG"}</h4>
            <p className="text-[10px] font-bold opacity-80">
              {data?.isBalanced 
                ? "Total Aset sama dengan Total Liabilitas dan Ekuitas. Laporan valid untuk audit."
                : "Terdapat perbedaan nilai antara sisi Aset dan sisi Liabilitas + Ekuitas."}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <p className="text-[8px] font-black uppercase opacity-60">Total Aset</p>
              <p className="text-lg font-black">{formatCurrency(data?.assets.total || 0)}</p>
           </div>
           <div className="w-px h-10 bg-slate-200 mx-2" />
           <div className="text-right">
              <p className="text-[8px] font-black uppercase opacity-60">Liabilitas + Ekuitas</p>
              <p className="text-lg font-black">{formatCurrency(data?.totalLiabilitiesAndEquity || 0)}</p>
           </div>
           {!data?.isBalanced && (
             <>
               <div className="w-px h-10 bg-rose-200 mx-2" />
               <div className="text-right text-rose-600">
                  <p className="text-[8px] font-black uppercase opacity-60">Selisih (Gap)</p>
                  <p className="text-lg font-black">{formatCurrency(Math.abs((data?.assets.total || 0) - (data?.totalLiabilitiesAndEquity || 0)))}</p>
               </div>
             </>
           )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* ASSETS SIDE */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-300">
              AKTIVA <span className="text-slate-900">(ASSETS)</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Debit Balance</span>
            </div>
          </div>
          
          <Card className="p-2 border-slate-100 shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white/50 backdrop-blur-xl">
            <div className="p-6 space-y-1">
              {data && buildTree(data.assets.items).map(acc => (
                <RenderAccountRow key={acc.id} acc={acc} />
              ))}
              
              {data?.assets.items.length === 0 && (
                <div className="p-20 text-center text-slate-300 italic text-sm font-medium">No asset records found.</div>
              )}
            </div>
            <div className="m-2 p-8 bg-slate-900 rounded-[2rem] text-white flex justify-between items-center shadow-lg shadow-slate-900/20">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-1">Grand Total</span>
                <span className="text-sm font-black uppercase tracking-tight">TOTAL AKTIVA</span>
              </div>
              <span className="text-3xl font-black text-emerald-400 tabular-nums tracking-tighter">{formatCurrency(data?.assets.total || 0)}</span>
            </div>
          </Card>
        </div>

        {/* LIABILITIES & EQUITY SIDE */}
        <div className="space-y-8">
          {/* Liabilities Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-300">
                PASIVA <span className="text-slate-900">(LIABILITIES)</span>
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Credit Balance</span>
            </div>

            <Card className="p-2 border-slate-100 shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white/50 backdrop-blur-xl">
              <div className="p-6 space-y-1">
                {data && buildTree(data.liabilities.items).map(acc => (
                  <RenderAccountRow key={acc.id} acc={acc} />
                ))}
              </div>
              <div className="m-2 p-6 bg-slate-100 rounded-[1.5rem] flex justify-between items-center border border-slate-200/50">
                <span className="text-xs font-black uppercase tracking-tight text-slate-500 italic">Subtotal Liabilities</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">{formatCurrency(data?.liabilities.total || 0)}</span>
              </div>
            </Card>
          </div>

          {/* Equity Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-300">
                EKUITAS <span className="text-slate-900">(EQUITIES)</span>
              </h3>
            </div>

            <Card className="p-2 border-slate-100 shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white/50 backdrop-blur-xl">
              <div className="p-6 space-y-1">
                {data && buildTree(data.equity.items).map(acc => (
                  <RenderAccountRow key={acc.id} acc={acc} />
                ))}
                
                {/* Laba Tahun Berjalan (Net Income) */}
                <div className="flex justify-between items-center p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 mt-4 shadow-sm group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">Laba Tahun Berjalan</p>
                      <p className="text-[8px] font-black text-indigo-400 uppercase flex items-center gap-1">
                        <Info className="w-3 h-3" /> Net Income (Revenue - Expense)
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-indigo-700 tabular-nums">{formatCurrency(data?.equity.netIncome || 0)}</span>
                </div>
              </div>
              <div className="m-2 p-8 bg-indigo-950 rounded-[2rem] text-white flex justify-between items-center shadow-lg shadow-indigo-900/30">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 block mb-1">Grand Total</span>
                  <span className="text-sm font-black uppercase tracking-tight">TOTAL PASIVA</span>
                </div>
                <span className="text-3xl font-black text-amber-400 tabular-nums tracking-tighter">{formatCurrency(data?.totalLiabilitiesAndEquity || 0)}</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="flex justify-center gap-4 pt-10">
         <Button className="bg-slate-900 text-white h-14 px-10 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-xl shadow-slate-200">
           <Download className="w-4 h-4 mr-2" />
           Cetak PDF Laporan
         </Button>
         <Button variant="outline" className="border-slate-200 h-14 px-10 rounded-2xl font-black uppercase tracking-tight text-[10px]">
           <FileText className="w-4 h-4 mr-2" />
           Audit Ledger
         </Button>
      </footer>
    </div>
  );
}

