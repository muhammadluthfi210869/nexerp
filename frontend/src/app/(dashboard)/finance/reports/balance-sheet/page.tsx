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
  Info
} from "lucide-react";
import {
  OperationalPanel,
  OperationalField,
  OperationalButton,
  OperationalInput,
} from "@/components/operational";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
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

  const RenderAccountRow = ({ acc, level = 0 }: { acc: AccountItem, level?: number }) => {
    const hasChildren = acc.children && acc.children.length > 0;
    const [isOpen, setIsOpen] = useState(true);

    return (
      <>
        <div
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
              {level === 0 && <p className="text-[8px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">{acc.reportGroup.replace('_', ' ')}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-xs font-black font-mono tabular-nums",
              level === 0 ? "text-slate-900" : "text-slate-600",
              acc.balance < 0 ? "text-rose-500" : ""
            )}>
              {formatOperationalCurrency(acc.balance || (acc.creditBalance - acc.debitBalance))}
            </p>
            <button className="text-[7px] font-black text-blue-500 uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Detail Ledger</button>
          </div>
        </div>
        {isOpen && hasChildren && acc.children?.map(child => (
          <RenderAccountRow key={child.id} acc={child} level={level + 1} />
        ))}
      </>
    );
  };

  if (!data && loading) return <div className="p-20 text-center font-black animate-pulse">MEMUAT LAPORAN...</div>;

  return (
    <OperationalMigrationShell title="Neraca" subtitle="Laporan posisi keuangan perusahaan — aset, liabilitas, dan ekuitas.">
      <OperationalPanel>
        <div className="flex gap-4 items-end">
          <OperationalField label="Posisi Per Tanggal">
            <OperationalInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
              className="text-xs font-black w-[200px]"
            />
          </OperationalField>
          <OperationalButton
            variant="primary"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? "MEMUAT..." : "PERBARUI"}
          </OperationalButton>
        </div>
      </OperationalPanel>

      {/* Balancing Banner at top */}
      <div className={cn(
        "p-5 rounded-2xl flex items-center justify-between border shadow-sm transition-all duration-500",
        data?.isBalanced
          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
          : "bg-rose-50 border-rose-100 text-rose-700"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl",
            data?.isBalanced ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          )}>
            {data?.isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">Status Neraca: {data?.isBalanced ? "SEIMBANG" : "TIDAK SEIMBANG"}</h4>
            <p className="text-[10px] font-medium opacity-80 mt-1">
              {data?.isBalanced
                ? "Persamaan dasar akuntansi terpenuhi: Aset = Liabilitas + Ekuitas."
                : "Terdapat perbedaan nilai antara total Aktiva dan total Pasiva."}
            </p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase opacity-60">Total Aset</p>
            <p className="text-base font-black font-mono">{formatOperationalCurrency(data?.assets.total || 0)}</p>
          </div>
          <div className="w-px h-8 bg-slate-200 mx-1" />
          <div className="text-right">
            <p className="text-[8px] font-black uppercase opacity-60">Liabilitas + Ekuitas</p>
            <p className="text-base font-black font-mono">{formatOperationalCurrency(data?.totalLiabilitiesAndEquity || 0)}</p>
          </div>
          {!data?.isBalanced && (
            <>
              <div className="w-px h-8 bg-rose-200 mx-1" />
              <div className="text-right text-rose-600">
                <p className="text-[8px] font-black uppercase opacity-60">Selisih (Gap)</p>
                <p className="text-base font-black font-mono">{formatOperationalCurrency(Math.abs((data?.assets.total || 0) - (data?.totalLiabilitiesAndEquity || 0)))}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          <OperationalPanel>
            <div className="space-y-1">
              {data && buildTree(data.assets.items).map(acc => (
                <RenderAccountRow key={acc.id} acc={acc} />
              ))}

              {data?.assets.items.length === 0 && (
                <div className="p-20 text-center text-slate-300 italic text-sm font-medium">No asset records found.</div>
              )}
            </div>
            <div className="m-2 p-6 bg-blue-600 rounded-2xl text-white flex justify-between items-center shadow-sm">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 block mb-1">Grand Total</span>
                <span className="text-sm font-black uppercase tracking-tight">TOTAL AKTIVA</span>
              </div>
              <span className="text-2xl font-black text-emerald-300 font-mono tabular-nums tracking-tighter">{formatOperationalCurrency(data?.assets.total || 0)}</span>
            </div>
          </OperationalPanel>
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

            <OperationalPanel>
              <div className="space-y-1">
                {data && buildTree(data.liabilities.items).map(acc => (
                  <RenderAccountRow key={acc.id} acc={acc} />
                ))}
              </div>
              <div className="m-2 p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                <span className="text-xs font-black uppercase tracking-tight text-slate-500 italic">Subtotal Liabilities</span>
                <span className="text-base font-black text-slate-950 font-mono tabular-nums">{formatOperationalCurrency(data?.liabilities.total || 0)}</span>
              </div>
            </OperationalPanel>
          </div>

          {/* Equity Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-300">
                EKUITAS <span className="text-slate-900">(EQUITIES)</span>
              </h3>
            </div>

            <OperationalPanel>
              <div className="space-y-1">
                {data && buildTree(data.equity.items).map(acc => (
                  <RenderAccountRow key={acc.id} acc={acc} />
                ))}

                {/* Laba Tahun Berjalan (Net Income) */}
                <div className="flex justify-between items-center p-4 rounded-xl bg-blue-50/50 border border-blue-100 mt-4 shadow-sm group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-blue-900 uppercase tracking-tight">Laba Tahun Berjalan</p>
                      <p className="text-[8px] font-black text-blue-400 uppercase flex items-center gap-1 mt-0.5">
                        <Info className="w-3 h-3" /> Net Income (Revenue - Expense)
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-black text-blue-700 font-mono tabular-nums">{formatOperationalCurrency(data?.equity.netIncome || 0)}</span>
                </div>
              </div>
              <div className="m-2 p-6 bg-blue-950 rounded-2xl text-white flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300 block mb-1">Grand Total</span>
                  <span className="text-sm font-black uppercase tracking-tight">TOTAL PASIVA</span>
                </div>
                <span className="text-2xl font-black text-amber-400 font-mono tabular-nums tracking-tighter">{formatOperationalCurrency(data?.totalLiabilitiesAndEquity || 0)}</span>
              </div>
            </OperationalPanel>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="flex justify-center gap-4 pt-10 border-t border-slate-100">
        <OperationalButton variant="primary">
          <Download className="w-4 h-4" />
          <span>Cetak PDF Laporan</span>
        </OperationalButton>
        <OperationalButton variant="secondary">
          <FileText className="w-4 h-4" />
          <span>Audit Ledger</span>
        </OperationalButton>
      </footer>
    </OperationalMigrationShell>
  );
}