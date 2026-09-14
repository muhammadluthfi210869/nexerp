"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Printer,
  Calendar,
  DollarSign,
  PieChart,
  Filter,
  Eye,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaCheckbox
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

interface StatementRow {
  code: string;
  name: string;
  level: number;
  isHeader?: boolean;
  isTotal?: boolean;
  currentAmount: number;
  prevAmount: number;
  growthPct: number;
}

const FALLBACK_P_AND_L_ROWS: StatementRow[] = [
  // 1. REVENUE
  { code: "4000", name: "I. PENDAPATAN OPERASIONAL (REVENUE)", level: 0, isHeader: true, currentAmount: 1875000000, prevAmount: 1650000000, growthPct: 13.6 },
  { code: "4110", name: "  Penjualan Produksi Maklon OEM/ODM Kosmetik", level: 1, currentAmount: 1450000000, prevAmount: 1280000000, growthPct: 13.3 },
  { code: "4120", name: "  Penjualan Batch Sample & Prototipe R&D", level: 1, currentAmount: 45000000, prevAmount: 40000000, growthPct: 12.5 },
  { code: "4130", name: "  Jasa Notifikasi BPOM & Pendaftaran HKI Merk", level: 1, currentAmount: 125000000, prevAmount: 110000000, growthPct: 13.6 },
  { code: "4140", name: "  Jasa Desain Kemasan & Packaging Printing", level: 1, currentAmount: 80000000, prevAmount: 70000000, growthPct: 14.3 },
  { code: "4190", name: "  Pendapatan Operasional Lainnya", level: 1, currentAmount: 175000000, prevAmount: 150000000, growthPct: 16.7 },
  { code: "TOT_REV", name: "TOTAL PENDAPATAN OPERASIONAL", level: 0, isTotal: true, currentAmount: 1875000000, prevAmount: 1650000000, growthPct: 13.6 },

  // 2. COGS (HPP)
  { code: "5000", name: "II. BEBAN POKOK PENJUALAN / PRODUKSI (COGS / HPP)", level: 0, isHeader: true, currentAmount: 950000000, prevAmount: 860000000, growthPct: 10.5 },
  { code: "5110", name: "  Beban Bahan Baku Aktif, Ekstrak & Emulsifier", level: 1, currentAmount: 480000000, prevAmount: 430000000, growthPct: 11.6 },
  { code: "5120", name: "  Beban Bahan Kemas Primer (Botol/Jar/Tube)", level: 1, currentAmount: 220000000, prevAmount: 200000000, growthPct: 10.0 },
  { code: "5130", name: "  Beban Bahan Kemas Sekunder (Box/Folding/Segel)", level: 1, currentAmount: 70000000, prevAmount: 65000000, growthPct: 7.7 },
  { code: "5140", name: "  Upah Tenaga Kerja Langsung Line Mixing & Filling", level: 1, currentAmount: 110000000, prevAmount: 105000000, growthPct: 4.8 },
  { code: "5150", name: "  Overhead Pabrik, Utilitas Listrik & Boiler Mesin", level: 1, currentAmount: 70000000, prevAmount: 60000000, growthPct: 16.7 },
  { code: "TOT_COGS", name: "TOTAL BEBAN POKOK PRODUKSI (HPP)", level: 0, isTotal: true, currentAmount: 950000000, prevAmount: 860000000, growthPct: 10.5 },

  // 3. GROSS PROFIT
  { code: "GROSS_PRF", name: "LABA KOTOR (GROSS PROFIT)", level: 0, isTotal: true, currentAmount: 925000000, prevAmount: 790000000, growthPct: 17.1 },

  // 4. OPEX
  { code: "6000", name: "III. BEBAN OPERASIONAL & ADMINISTRASI (OPEX)", level: 0, isHeader: true, currentAmount: 380000000, prevAmount: 340000000, growthPct: 11.8 },
  { code: "6110", name: "  Gaji & Tunjangan Karyawan Manajerial / Admin", level: 1, currentAmount: 165000000, prevAmount: 150000000, growthPct: 10.0 },
  { code: "6120", name: "  Beban Pemasaran, Iklan & Business Development", level: 1, currentAmount: 85000000, prevAmount: 75000000, growthPct: 13.3 },
  { code: "6130", name: "  Sewa Fasilitas, Maintenance Kantor & Listrik Admin", level: 1, currentAmount: 55000000, prevAmount: 50000000, growthPct: 10.0 },
  { code: "6140", name: "  Beban Depresiasi Mesin & Peralatan Pabrik", level: 1, currentAmount: 45000000, prevAmount: 40000000, growthPct: 12.5 },
  { code: "6190", name: "  Beban Administrasi Umum, Legalitas & ATK", level: 1, currentAmount: 30000000, prevAmount: 25000000, growthPct: 20.0 },
  { code: "TOT_OPEX", name: "TOTAL BEBAN OPERASIONAL (OPEX)", level: 0, isTotal: true, currentAmount: 380000000, prevAmount: 340000000, growthPct: 11.8 },

  // 5. NET PROFIT
  { code: "NET_OP_PRF", name: "LABA OPERASIONAL BERSIH (EBIT)", level: 0, isTotal: true, currentAmount: 545000000, prevAmount: 450000000, growthPct: 21.1 },
  { code: "NET_PRF", name: "TOTAL LABA RUGI BERSIH SETELAH PAJAK", level: 0, isTotal: true, currentAmount: 490500000, prevAmount: 405000000, growthPct: 21.1 },
];

export default function LabaRugiReportPage() {
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [showComparison, setShowComparison] = useState(true);
  const [selectedRow, setSelectedRow] = useState<StatementRow | null>(null);

  // Totals for the 5 cards (Poin 31-34)
  const totalPendapatan = 1875000000;
  const labaKotor = 925000000;
  const totalHpp = 950000000;
  const labaOperasional = 545000000;
  const labaBersih = 490500000;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Laba Rugi (Income Statement)"
        description="Ringkasan performa finansial komprehensif berformat hierarkis G-SERP: Pendapatan, HPP Produksi, Laba Kotor, OPEX, dan Laba Bersih."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-163 (Poin 31-34): Format G-SERP & 5 KPI Cards</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Laporan
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting Laporan Laba Rugi ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* 5 KPI CARDS DENGAN URUTAN PERSIS SPESIFIKASI POIN 31-34 */}
      <DnaKpiGrid cols={5}>
        <DnaStatCard
          label="Total Pendapatan"
          value={formatRupiah(totalPendapatan)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+13.6% MoM", isPositive: true }}
          subtext="Revenue Maklon & Jasa"
          variant="success"
        />
        <DnaStatCard
          label="Laba Kotor (Gross Profit)"
          value={formatRupiah(labaKotor)}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          delta={{ value: "49.3% Gross Margin", isPositive: true }}
          subtext="Margin Kotor Manufaktur"
          variant="info"
        />
        <DnaStatCard
          label="Total Beban HPP (COGS)"
          value={formatRupiah(totalHpp)}
          icon={<ArrowDownRight className="w-5 h-5 text-amber-600" />}
          delta={{ value: "50.7% dari Revenue", isPositive: false }}
          subtext="Bahan Baku & Upah Line"
          variant="warning"
        />
        <DnaStatCard
          label="Laba Operasional Bersih"
          value={formatRupiah(labaOperasional)}
          icon={<PieChart className="w-5 h-5 text-purple-600" />}
          delta={{ value: "29.1% EBIT", isPositive: true }}
          subtext="Laba Sebelum Bunga & Pajak"
          variant="purple"
        />
        <DnaStatCard
          label="Total Laba Rugi Bersih"
          value={formatRupiah(labaBersih)}
          icon={<Sparkles className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "26.2% Net Margin", isPositive: true }}
          subtext="Net Profit Margin Final"
          variant="success"
        />
      </DnaKpiGrid>

      {/* DATA TABLE CARD G-SERP HIERARCHICAL STRUCTURE */}
      <DnaDataTableCard
        title="Laporan Laba Rugi Komparatif (Format G-SERP)"
        badge={<DnaBadge variant="purple">Periode: {dateRange.start} s/d {dateRange.end}</DnaBadge>}
        customToolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
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
            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
              <DnaCheckbox
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Tampilkan Komparasi Bulan Lalu</span>
            </label>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3 w-28">Kode Akun</th>
                <th className="px-3.5 py-3">Uraian / Deskripsi Akun (Hierarki G-SERP)</th>
                <th className="px-3.5 py-3 text-right">Periode Berjalan (Rp)</th>
                {showComparison && <th className="px-3.5 py-3 text-right">Periode Lalu (Rp)</th>}
                {showComparison && <th className="px-3.5 py-3 text-right">Pertumbuhan (%)</th>}
                <th className="px-3.5 py-3 text-center">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FALLBACK_P_AND_L_ROWS.map((row, idx) => {
                const isHeader = row.isHeader;
                const isTotal = row.isTotal;

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isHeader
                        ? "bg-slate-100/80 font-bold text-slate-900 border-t border-slate-200"
                        : isTotal
                        ? "bg-emerald-50/60 font-black text-slate-900 border-t border-b border-emerald-300"
                        : "hover:bg-slate-50/50 text-slate-700"
                    }`}
                  >
                    <td className="px-3.5 py-2 font-mono text-[11px] text-slate-500 font-semibold">
                      {row.code.startsWith("TOT_") || row.code === "GROSS_PRF" || row.code.startsWith("NET_") ? "" : row.code}
                    </td>
                    <td className={`px-3.5 py-2 ${row.level === 1 ? "pl-8 text-slate-800" : "font-extrabold text-slate-900"}`}>
                      {row.name}
                    </td>
                    <td className={`px-3.5 py-2 text-right ${isTotal ? "font-black text-sm text-slate-900" : "font-semibold"}`}>
                      {isHeader ? "" : formatRupiah(row.currentAmount)}
                    </td>
                    {showComparison && (
                      <td className="px-3.5 py-2 text-right text-slate-500 font-medium">
                        {isHeader ? "" : formatRupiah(row.prevAmount)}
                      </td>
                    )}
                    {showComparison && (
                      <td className="px-3.5 py-2 text-right font-bold text-emerald-700">
                        {isHeader ? "" : `+${row.growthPct}%`}
                      </td>
                    )}
                    <td className="px-3.5 py-2 text-center">
                      {!isHeader && !isTotal && (
                        <button
                          onClick={() => setSelectedRow(row)}
                          className="text-slate-400 hover:text-emerald-600 p-0.5 rounded"
                          title="Drilldown ke Buku Besar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* DRILLDOWN MODAL AJAX DETAIL (SCR-163) */}
      <DnaModal
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        title={`Drilldown Buku Besar: ${selectedRow?.code} - ${selectedRow?.name.trim()}`}
        size="lg"
      >
        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium">Kode & Nama Akun:</span>
              <p className="text-slate-900 font-bold">{selectedRow?.code} - {selectedRow?.name.trim()}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">Realisasi Bulan Ini:</span>
              <p className="text-emerald-700 font-black text-base">{selectedRow ? formatRupiah(selectedRow.currentAmount) : "0"}</p>
            </div>
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-slate-700 font-semibold mb-2">Daftar Jurnal Transaksi Pembentuk Saldo:</p>
            <DnaTable className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-1">Tanggal</th>
                  <th className="py-1">No. Jurnal</th>
                  <th className="py-1">Deskripsi Transaksi</th>
                  <th className="py-1 text-right">Debit</th>
                  <th className="py-1 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 text-slate-600">2026-09-08</td>
                  <td className="py-2 font-mono text-blue-700 font-semibold">DL-FIN-JRN-08092026-0001</td>
                  <td className="py-2 text-slate-800">Realisasi Termin PO-8821 PT Glowing</td>
                  <td className="py-2 text-right text-emerald-700 font-bold">Rp 450.000.000</td>
                  <td className="py-2 text-right text-slate-400">-</td>
                </tr>
              </tbody>
            </DnaTable>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedRow(null)}>
              Tutup
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
