"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
 Calendar,
 TrendingUp,
 CheckCircle2,
 XCircle,
 FileText,
 Download,
 Info,
} from "lucide-react";
import {
 PageShell,
 SectionCard,
 SectionCardContent,
} from "@/components/canonical";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatOperationalCurrency } from "@/lib/operational-formatters";

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

 const fetchData = useCallback(async () => {
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
 }, [date]);

 useEffect(() => {
 fetchData();
 }, [fetchData]);

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

 const RenderAccountRow = ({ acc, level = 0 }: { acc: AccountItem; level?: number }) => {
 const hasChildren = acc.children && acc.children.length > 0;
 const [isOpen, setIsOpen] = useState(true);

 return (
 <>
 <div
 className={cn(
 "flex justify-between items-center py-2 px-3 rounded-[10px] transition-all group text-xs",
 level === 0 ? "bg-slate-50 mb-1" : "hover:bg-slate-50",
 hasChildren ? "cursor-pointer" : ""
 )}
 onClick={() => hasChildren && setIsOpen(!isOpen)}
 >
 <div className="flex items-center gap-2.5" style={{ paddingLeft: `${level * 16}px` }}>
 <div className={cn(
 "w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-medium transition-all",
 level === 0 ? "bg-blue-600 text-white" : "bg-white border border-[#E2E8F0] text-slate-500"
 )}>
 {acc.code.substring(0, 3)}
 </div>
 <div>
 <p className={cn(
 "text-[12px]",
 level === 0 ? "font-semibold text-slate-900" : "font-medium text-slate-700",
 )}>
 {acc.name}
 {acc.isReclassified && (
 <span className="ml-2 text-[9px] bg-rose-100 text-rose-600 px-1 py-0.5 rounded font-medium">RECLASSIFIED</span>
 )}
 </p>
 {level === 0 && <p className="text-[10px] text-slate-400 mt-0.5">{acc.reportGroup.replace('_', ' ')}</p>}
 </div>
 </div>
 <div className="text-right">
 <p className={cn(
 "text-[12px] font-medium tabular-nums",
 level === 0 ? "text-slate-900" : "text-slate-600",
 acc.balance < 0 ? "text-rose-500" : ""
 )}>
 {formatOperationalCurrency(acc.balance || (acc.creditBalance - acc.debitBalance))}
 </p>
 <button className="text-[9px] font-medium text-blue-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Detail Ledger</button>
 </div>
 </div>
 {isOpen && hasChildren && acc.children?.map(child => (
 <RenderAccountRow key={child.id} acc={child} level={level + 1} />
 ))}
 </>
 );
 };

 if (!data && loading) {
 return (
 <PageShell title="Neraca" subtitle="Laporan posisi keuangan perusahaan — aset, liabilitas, dan ekuitas.">
 <div className="py-20 text-center text-slate-400 font-medium animate-pulse">Memuat Laporan...</div>
 </PageShell>
 );
 }

 return (
 <PageShell title="Neraca" subtitle="Laporan posisi keuangan perusahaan — aset, liabilitas, dan ekuitas.">
 <div className="flex flex-col gap-6">
 <SectionCard>
 <SectionCardContent>
 <div className="flex gap-4 items-end">
 <div className="flex flex-col gap-1.5">
 <label className="text-[11px] font-medium text-slate-700">Posisi Per Tanggal</label>
 <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400 w-[200px]">
 <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
 <input
 type="date"
 value={date}
 onChange={(e) => setDate(e.target.value)}
 className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700"
 />
 </label>
 </div>
 <button
 type="button"
 onClick={fetchData}
 disabled={loading}
 className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700 disabled:opacity-50"
 >
 {loading ? "Memuat..." : "Perbarui"}
 </button>
 </div>
 </SectionCardContent>
 </SectionCard>

 <div className={cn(
 "p-5 rounded-[12px] flex items-center justify-between border transition-all",
 data?.isBalanced
 ? "bg-emerald-50 border-emerald-100 text-emerald-700"
 : "bg-rose-50 border-rose-100 text-rose-700"
 )}>
 <div className="flex items-center gap-4">
 <div className={cn(
 "p-3 rounded-lg",
 data?.isBalanced ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
 )}>
 {data?.isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
 </div>
 <div>
 <h4 className="text-[13px] font-semibold uppercase">Status Neraca: {data?.isBalanced ? "Seimbang" : "Tidak Seimbang"}</h4>
 <p className="text-[11px] font-medium opacity-80 mt-1">
 {data?.isBalanced
 ? "Persamaan dasar akuntansi terpenuhi: Aset = Liabilitas + Ekuitas."
 : "Terdapat perbedaan nilai antara total Aktiva dan total Pasiva."}
 </p>
 </div>
 </div>
 <div className="flex gap-4 items-center">
 <div className="text-right">
 <p className="text-[10px] font-medium uppercase opacity-60">Total Aset</p>
 <p className="text-[14px] font-semibold tabular-nums">{formatOperationalCurrency(data?.assets.total || 0)}</p>
 </div>
 <div className="w-px h-8 bg-slate-200 mx-1" />
 <div className="text-right">
 <p className="text-[10px] font-medium uppercase opacity-60">Liabilitas + Ekuitas</p>
 <p className="text-[14px] font-semibold tabular-nums">{formatOperationalCurrency(data?.totalLiabilitiesAndEquity || 0)}</p>
 </div>
 {!data?.isBalanced && (
 <>
 <div className="w-px h-8 bg-rose-200 mx-1" />
 <div className="text-right text-rose-600">
 <p className="text-[10px] font-medium uppercase opacity-60">Selisih (Gap)</p>
 <p className="text-[14px] font-semibold tabular-nums">{formatOperationalCurrency(Math.abs((data?.assets.total || 0) - (data?.totalLiabilitiesAndEquity || 0)))}</p>
 </div>
 </>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="flex flex-col gap-4">
 <div className="flex items-center justify-between px-2">
 <h3 className="text-[16px] font-semibold tracking-tight">
 AKTIVA <span className="text-slate-400">(Assets)</span>
 </h3>
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-emerald-500" />
 <span className="text-[10px] font-medium text-slate-400 uppercase">Debit Balance</span>
 </div>
 </div>

 <SectionCard>
 <SectionCardContent>
 <div className="flex flex-col gap-1">
 {data && buildTree(data.assets.items).map(acc => (
 <RenderAccountRow key={acc.id} acc={acc} />
 ))}
 {data?.assets.items.length === 0 && (
 <div className="py-20 text-center text-slate-300 italic text-[12px]">No asset records found.</div>
 )}
 </div>
 <div className="mt-2 p-6 bg-blue-600 rounded-[12px] text-white flex justify-between items-center">
 <div>
 <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-200 block mb-1">Grand Total</span>
 <span className="text-[13px] font-semibold uppercase">Total Aktiva</span>
 </div>
 <span className="text-[20px] font-semibold text-emerald-300 tabular-nums">{formatOperationalCurrency(data?.assets.total || 0)}</span>
 </div>
 </SectionCardContent>
 </SectionCard>
 </div>

 <div className="flex flex-col gap-6">
 <div className="flex flex-col gap-4">
 <div className="flex items-center justify-between px-2">
 <h3 className="text-[16px] font-semibold tracking-tight">
 PASIVA <span className="text-slate-400">(Liabilities)</span>
 </h3>
 <span className="text-[10px] font-medium text-slate-400 uppercase">Credit Balance</span>
 </div>

 <SectionCard>
 <SectionCardContent>
 <div className="flex flex-col gap-1">
 {data && buildTree(data.liabilities.items).map(acc => (
 <RenderAccountRow key={acc.id} acc={acc} />
 ))}
 </div>
 <div className="mt-2 p-4 bg-slate-50 rounded-[12px] flex justify-between items-center border border-[#E2E8F0]">
 <span className="text-[12px] font-medium uppercase text-slate-500">Subtotal Liabilities</span>
 <span className="text-[14px] font-semibold text-slate-900 tabular-nums">{formatOperationalCurrency(data?.liabilities.total || 0)}</span>
 </div>
 </SectionCardContent>
 </SectionCard>
 </div>

 <div className="flex flex-col gap-4">
 <div className="flex items-center justify-between px-2">
 <h3 className="text-[16px] font-semibold tracking-tight">
 EKUITAS <span className="text-slate-400">(Equities)</span>
 </h3>
 </div>

 <SectionCard>
 <SectionCardContent>
 <div className="flex flex-col gap-1">
 {data && buildTree(data.equity.items).map(acc => (
 <RenderAccountRow key={acc.id} acc={acc} />
 ))}

 <div className="flex justify-between items-center p-4 rounded-[10px] bg-blue-50/50 border border-blue-100 mt-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
 <TrendingUp className="w-4 h-4" />
 </div>
 <div>
 <p className="text-[12px] font-semibold text-blue-900">Laba Tahun Berjalan</p>
 <p className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
 <Info className="w-3 h-3" /> Net Income (Revenue - Expense)
 </p>
 </div>
 </div>
 <span className="text-[14px] font-semibold text-blue-700 tabular-nums">{formatOperationalCurrency(data?.equity.netIncome || 0)}</span>
 </div>
 </div>
 <div className="mt-2 p-6 bg-blue-950 rounded-[12px] text-white flex justify-between items-center">
 <div>
 <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-300 block mb-1">Grand Total</span>
 <span className="text-[13px] font-semibold uppercase">Total Pasiva</span>
 </div>
 <span className="text-[20px] font-semibold text-amber-400 tabular-nums">{formatOperationalCurrency(data?.totalLiabilitiesAndEquity || 0)}</span>
 </div>
 </SectionCardContent>
 </SectionCard>
 </div>
 </div>
 </div>

 <footer className="flex justify-center gap-3 pt-6 border-t border-[#E2E8F0]">
 <button
 type="button"
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700"
 >
 <Download className="w-4 h-4" />
 <span>Cetak PDF Laporan</span>
 </button>
 <button
 type="button"
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
 >
 <FileText className="w-4 h-4" />
 <span>Audit Ledger</span>
 </button>
 </footer>
 </div>
 </PageShell>
 );
}
