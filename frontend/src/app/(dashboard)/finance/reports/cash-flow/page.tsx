"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Building2,
  PieChart
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

export default function CashFlowReportPage() {
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });

  const cashBeginning = 1850000000;
  const cashOperating = 485000000;
  const cashInvesting = -120000000;
  const cashFinancing = -150000000;
  const netCashChange = cashOperating + cashInvesting + cashFinancing;
  const cashEnding = cashBeginning + netCashChange;

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
          delta={{ value: "+Inflow Sehat", isPositive: true }}
          subtext="Penerimaan Pelanggan - Supplier"
          variant="success"
        />
        <DnaStatCard
          label="Arus Kas Keluar Investasi & Pendanaan"
          value={formatRupiah(Math.abs(cashInvesting + cashFinancing))}
          icon={<ArrowDownRight className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Capex & Cicilan Bank", isPositive: false }}
          subtext="Beli Mesin & Pelunasan Kewajiban"
          variant="warning"
        />
        <DnaStatCard
          label="Saldo Kas Bersih Akhir (Cash Ending)"
          value={formatRupiah(cashEnding)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          delta={{ value: "+" + formatRupiah(netCashChange) + " Net Change", isPositive: true }}
          subtext="Total Likuiditas Kas & Bank Tersedia"
          variant="info"
        />
      </DnaKpiGrid>

      {/* FILTER DATE RANGE */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Periode Laporan Arus Kas:</span>
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
            />
            <span className="text-slate-400 font-semibold">s/d</span>
            <input
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
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Penerimaan Kas dari Pelanggan Maklon & Pembelian Produk</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">Rp 1.450.000.000</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pembayaran Kas kepada Pemasok Bahan Baku & Kemasan</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">(Rp 620.000.000)</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pembayaran Gaji, Upah Kerja & Tunjangan BPJS Karyawan</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">(Rp 245.000.000)</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pembayaran Biaya Operasional, Utilitas Listrik & Administrasi</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">(Rp 100.000.000)</td>
                </tr>
                <tr className="bg-emerald-50/60 font-bold border-t border-emerald-300">
                  <td className="px-3.5 py-3 text-emerald-950 font-extrabold">ARUS KAS BERSIH DARI OPERASIONAL (CFO):</td>
                  <td className="px-3.5 py-3 text-right text-emerald-900 font-black">{formatRupiah(cashOperating)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>

        {/* 2. INVESTING ACTIVITIES */}
        <DnaDataTableCard title="2. Arus Kas dari Aktivitas Investasi (Investing Activities)">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pembelian Mesin Homogenizer High Shear R&D Baru</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">(Rp 85.000.000)</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Upgrade Fasilitas Cleanroom CPKB & Ruang HVAC</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">(Rp 35.000.000)</td>
                </tr>
                <tr className="bg-amber-50/60 font-bold border-t border-amber-300">
                  <td className="px-3.5 py-3 text-amber-950 font-extrabold">ARUS KAS BERSIH DARI INVESTASI (CFI):</td>
                  <td className="px-3.5 py-3 text-right text-amber-900 font-black">({formatRupiah(Math.abs(cashInvesting))})</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>

        {/* 3. FINANCING ACTIVITIES */}
        <DnaDataTableCard title="3. Arus Kas dari Aktivitas Pendanaan (Financing Activities)">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pembayaran Pokok Pinjaman Investasi Bank BCA</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">(Rp 150.000.000)</td>
                </tr>
                <tr className="bg-rose-50/60 font-bold border-t border-rose-300">
                  <td className="px-3.5 py-3 text-rose-950 font-extrabold">ARUS KAS BERSIH DARI PENDANAAN (CFF):</td>
                  <td className="px-3.5 py-3 text-right text-rose-900 font-black">({formatRupiah(Math.abs(cashFinancing))})</td>
                </tr>
                <tr className="bg-blue-100/70 font-black border-t-2 border-blue-500">
                  <td className="px-3.5 py-3.5 text-blue-950 font-black text-sm">TOTAL KENAIKAN BERSIH KAS & SALDO AKHIR:</td>
                  <td className="px-3.5 py-3.5 text-right text-blue-950 font-black text-sm">{formatRupiah(cashEnding)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      </div>
    </DnaPageContainer>
  );
}
