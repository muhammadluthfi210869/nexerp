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
  const [period, setPeriod] = useState("2026-09");

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
        description="Analisis pergerakan likuiditas tunai dari Aktivitas Operasional, Investasi Mesin & Fasilitas, serta Pendanaan."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Net Cash Flow Positif (+{formatRupiah(netCashChange)})</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white shadow-sm font-medium"
            />
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting Arus Kas ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Saldo Kas Awal Periode"
          value={formatRupiah(cashBeginning)}
          icon={<Wallet className="w-5 h-5 text-slate-600" />}
          subtext="Per 01 September 2026"
          variant="default"
        />
        <DnaStatCard
          label="Arus Kas Operasional (CFO)"
          value={formatRupiah(cashOperating)}
          icon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+Inflow Sehat", isPositive: true }}
          subtext="Penerimaan Pelanggan - Supplier"
          variant="success"
        />
        <DnaStatCard
          label="Arus Kas Investasi & Finansial"
          value={formatRupiah(cashInvesting + cashFinancing)}
          icon={<ArrowDownRight className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Capex & Cicilan", isPositive: false }}
          subtext="Beli Mesin & Pelunasan Bank"
          variant="warning"
        />
        <DnaStatCard
          label="Saldo Kas Akhir (Cash Ending)"
          value={formatRupiah(cashEnding)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          delta={{ value: "+11.6% Net Growth", isPositive: true }}
          subtext="Total Likuiditas Kas & Bank"
          variant="info"
        />
      </DnaKpiGrid>

      <div className="space-y-6">
        <DnaDataTableCard title="1. Arus Kas dari Aktivitas Operasional (Operating Activities)">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Penerimaan Kas dari Pelanggan Maklon & Pembeli Produk</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">Rp 1.450.000.000</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pembayaran Kas kepada Pemasok Bahan Baku & Bahan Kemas</td>
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
                  <td className="px-3.5 py-3 text-emerald-950 font-extrabold">ARUS KAS BERSIH DARI OPERASIONAL:</td>
                  <td className="px-3.5 py-3 text-right text-emerald-900 font-black">{formatRupiah(cashOperating)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>

        <DnaDataTableCard title="2. Arus Kas dari Aktivitas Investasi (Investing Activities)">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pembelian Mesin Homogenizer High Shear R&D Baru</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">(Rp 85.000.000)</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Upgrade Sistem HVAC & Ruang Bersih Cleanroom Pabrik</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">(Rp 35.000.000)</td>
                </tr>
                <tr className="bg-amber-50/60 font-bold border-t border-amber-300">
                  <td className="px-3.5 py-3 text-amber-950 font-extrabold">ARUS KAS BERSIH DARI INVESTASI:</td>
                  <td className="px-3.5 py-3 text-right text-amber-900 font-black">({formatRupiah(Math.abs(cashInvesting))})</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>

        <DnaDataTableCard title="3. Arus Kas dari Aktivitas Pendanaan (Financing Activities)">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">Pembayaran Pokok Pinjaman Investasi Bank BCA</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">(Rp 150.000.000)</td>
                </tr>
                <tr className="bg-rose-50/60 font-bold border-t border-rose-300">
                  <td className="px-3.5 py-3 text-rose-950 font-extrabold">ARUS KAS BERSIH DARI PENDANAAN:</td>
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
