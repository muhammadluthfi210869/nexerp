"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Printer,
  Calendar,
  TrendingUp,
  Building2,
  RefreshCw,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  formatRupiah,
  useDnaToast,
  DnaInput,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

interface CashFlowResponse {
  operating_cash_flow?: number;
  investing_cash_flow?: number;
  financing_cash_flow?: number;
  net_cash_flow?: number;
  operating?: { in: number; out: number; net: number };
  investing?: { in: number; out: number; net: number };
  financing?: { in: number; out: number; net: number };
  // Alternative backend response structure
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  netCashFlow?: number;
  beginningCash?: number;
  endingCash?: number;
}

export default function CashFlowReportPage() {
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });

  const { data: rawReport, isLoading, refetch } = useQuery<any>({
    queryKey: ["reports-cash-flow", dateRange.start, dateRange.end],
    queryFn: async () => {
      try {
        const res = await api.get("/reports/cash-flow", {
          params: { startDate: dateRange.start, endDate: dateRange.end },
        });
        return unwrapResponse<any>(res);
      } catch {
        // Fallback to finance controller alias if needed
        const res2 = await api.get("/finance/reports/cash-flow", {
          params: { startDate: dateRange.start, endDate: dateRange.end },
        });
        return unwrapResponse<any>(res2);
      }
    },
  });

  const report: CashFlowResponse = useMemo(() => {
    const d = rawReport?.data || rawReport || {};
    return d;
  }, [rawReport]);

  const cashOperating = Number(report.operating_cash_flow ?? report.operating?.net ?? report.operatingCashFlow ?? 0);
  const cashInvesting = Number(report.investing_cash_flow ?? report.investing?.net ?? report.investingCashFlow ?? 0);
  const cashFinancing = Number(report.financing_cash_flow ?? report.financing?.net ?? report.financingCashFlow ?? 0);
  const netCashChange = Number(report.net_cash_flow ?? report.netCashFlow ?? (cashOperating + cashInvesting + cashFinancing));

  // Beginning cash can be estimated or zeroed if no historical balance
  const cashBeginning = Number(report.beginningCash ?? 0);
  const cashEnding = Number(report.endingCash ?? (cashBeginning + netCashChange));

  const operatingIn = Number(report.operating?.in ?? (cashOperating > 0 ? cashOperating : 0));
  const operatingOut = Number(report.operating?.out ?? (cashOperating < 0 ? Math.abs(cashOperating) : 0));

  const investingIn = Number(report.investing?.in ?? (cashInvesting > 0 ? cashInvesting : 0));
  const investingOut = Number(report.investing?.out ?? (cashInvesting < 0 ? Math.abs(cashInvesting) : 0));

  const financingIn = Number(report.financing?.in ?? (cashFinancing > 0 ? cashFinancing : 0));
  const financingOut = Number(report.financing?.out ?? (cashFinancing < 0 ? Math.abs(cashFinancing) : 0));

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Arus Kas (Cash Flow Statement)"
        description="Analisis pergerakan kas masuk dan keluar dari Aktivitas Operasional (CFO), Investasi Aset (CFI), dan Pendanaan (CFF)."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-161: Rekonsiliasi Kas Bersih</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => refetch()} loading={isLoading}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Muat Ulang
            </DnaButton>
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Arus Kas
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting Arus Kas ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS (SCR-161) */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Arus Kas Masuk Operasional (CFO)"
          value={formatRupiah(cashOperating)}
          icon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />}
          delta={{ value: cashOperating >= 0 ? "+Inflow Positif" : "Defisit Operasional", isPositive: cashOperating >= 0 }}
          subtext="Penerimaan Operasional vs Pengeluaran"
          variant={cashOperating >= 0 ? "success" : "danger"}
        />
        <DnaStatCard
          label="Arus Kas Investasi & Pendanaan"
          value={formatRupiah(cashInvesting + cashFinancing)}
          icon={<ArrowDownRight className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Capex & Pembiayaan", isPositive: false }}
          subtext="Aset Tetap & Transaksi Modal/Utang"
          variant="warning"
        />
        <DnaStatCard
          label="Kenaikan/Penurunan Kas Bersih"
          value={formatRupiah(netCashChange)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          delta={{ value: `${formatRupiah(netCashChange)} Net Cash Flow`, isPositive: netCashChange >= 0 }}
          subtext="Perubahan Likuiditas Periode Ini"
          variant={netCashChange >= 0 ? "info" : "danger"}
        />
      </DnaKpiGrid>

      {/* FILTER DATE RANGE */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Periode Laporan Arus Kas:</span>
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <DnaInput
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
            />
            <span className="text-slate-400 font-semibold">s/d</span>
            <DnaInput
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. OPERATING ACTIVITIES */}
        <DnaDataTableCard title="1. Arus Kas dari Aktivitas Operasional (Operating Activities)">
          <div className="overflow-x-auto">
            <DnaTable className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Penerimaan Kas Operasional (Penjualan / Jasa)</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">{formatRupiah(operatingIn)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pengeluaran Kas Operasional (HPP, Beban Operasional & Gaji)</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">({formatRupiah(operatingOut)})</td>
                </tr>
                <tr className="bg-emerald-50/60 font-bold border-t border-emerald-300">
                  <td className="px-3.5 py-3 text-emerald-950 font-extrabold">ARUS KAS BERSIH DARI OPERASIONAL (CFO):</td>
                  <td className="px-3.5 py-3 text-right text-emerald-900 font-black">{formatRupiah(cashOperating)}</td>
                </tr>
              </tbody>
            </DnaTable>
          </div>
        </DnaDataTableCard>

        {/* 2. INVESTING ACTIVITIES */}
        <DnaDataTableCard title="2. Arus Kas dari Aktivitas Investasi (Investing Activities)">
          <div className="overflow-x-auto">
            <DnaTable className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Penerimaan Kas dari Pelepasan Aset & Investasi</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">{formatRupiah(investingIn)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pengeluaran Kas Pembelian Aset Tetap & Investasi Mesin</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">({formatRupiah(investingOut)})</td>
                </tr>
                <tr className="bg-amber-50/60 font-bold border-t border-amber-300">
                  <td className="px-3.5 py-3 text-amber-950 font-extrabold">ARUS KAS BERSIH DARI INVESTASI (CFI):</td>
                  <td className="px-3.5 py-3 text-right text-amber-900 font-black">
                    {cashInvesting < 0 ? `(${formatRupiah(Math.abs(cashInvesting))})` : formatRupiah(cashInvesting)}
                  </td>
                </tr>
              </tbody>
            </DnaTable>
          </div>
        </DnaDataTableCard>

        {/* 3. FINANCING ACTIVITIES */}
        <DnaDataTableCard title="3. Arus Kas dari Aktivitas Pendanaan (Financing Activities)">
          <div className="overflow-x-auto">
            <DnaTable className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Penerimaan Modal Disetor & Penarikan Pinjaman Bank</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">{formatRupiah(financingIn)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pelunasan Pokok Pinjaman & Pembagian Dividen/Prive</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">({formatRupiah(financingOut)})</td>
                </tr>
                <tr className="bg-rose-50/60 font-bold border-t border-rose-300">
                  <td className="px-3.5 py-3 text-rose-950 font-extrabold">ARUS KAS BERSIH DARI PENDANAAN (CFF):</td>
                  <td className="px-3.5 py-3 text-right text-rose-900 font-black">
                    {cashFinancing < 0 ? `(${formatRupiah(Math.abs(cashFinancing))})` : formatRupiah(cashFinancing)}
                  </td>
                </tr>
                <tr className="bg-blue-100/70 font-black border-t-2 border-blue-500">
                  <td className="px-3.5 py-3.5 text-blue-950 font-black text-sm">TOTAL PERUBAHAN BERSIH KAS & SALDO AKHIR:</td>
                  <td className="px-3.5 py-3.5 text-right text-blue-950 font-black text-sm">{formatRupiah(cashEnding)}</td>
                </tr>
              </tbody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      </div>
    </DnaPageContainer>
  );
}
