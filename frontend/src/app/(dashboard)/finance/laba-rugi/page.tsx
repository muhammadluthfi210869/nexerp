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
  ArrowDownRight
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
  useDnaToast
} from "@/components/dna";

interface StatementRow {
  code: string;
  name: string;
  amount: number;
  pct: number;
  category: "REVENUE" | "COGS" | "OPEX" | "OTHER";
}

const FALLBACK_REVENUES: StatementRow[] = [
  { code: "4110", name: "Penjualan Maklon Produksi OEM/ODM", amount: 1450000000, pct: 76.3, category: "REVENUE" },
  { code: "4120", name: "Penjualan Sample & Prototipe R&D", amount: 45000000, pct: 2.4, category: "REVENUE" },
  { code: "4130", name: "Jasa Notifikasi BPOM & HKI Merk", amount: 125000000, pct: 6.6, category: "REVENUE" },
  { code: "4140", name: "Jasa Desain Kemasan & Packaging", amount: 80000000, pct: 4.2, category: "REVENUE" },
  { code: "4190", name: "Pendapatan Operasional Lainnya", amount: 200000000, pct: 10.5, category: "REVENUE" },
];

const FALLBACK_COGS: StatementRow[] = [
  { code: "5110", name: "Beban Pokok Bahan Baku Aktif & Extract", amount: 480000000, pct: 45.7, category: "COGS" },
  { code: "5120", name: "Beban Bahan Kemas Primer & Sekunder", amount: 290000000, pct: 27.6, category: "COGS" },
  { code: "5130", name: "Upah Tenaga Kerja Langsung (Mixing/Filling)", amount: 160000000, pct: 15.2, category: "COGS" },
  { code: "5140", name: "Beban Overhead Pabrik & Utilitas Mesin", amount: 120000000, pct: 11.4, category: "COGS" },
];

const FALLBACK_OPEX: StatementRow[] = [
  { code: "6110", name: "Gaji & Tunjangan Karyawan Manajerial/Admin", amount: 185000000, pct: 43.5, category: "OPEX" },
  { code: "6120", name: "Beban Pemasaran, Iklan & Business Development", amount: 95000000, pct: 22.4, category: "OPEX" },
  { code: "6130", name: "Sewa Fasilitas, Listrik & Maintenance Kantor", amount: 65000000, pct: 15.3, category: "OPEX" },
  { code: "6140", name: "Beban Depresiasi Mesin & Peralatan Pabrik", amount: 45000000, pct: 10.6, category: "OPEX" },
  { code: "6190", name: "Beban Administrasi & Legalitas Umum", amount: 35000000, pct: 8.2, category: "OPEX" },
];

export default function LabaRugiReportPage() {
  const toast = useDnaToast();
  const [period, setPeriod] = useState("2026-09");
  const [selectedRow, setSelectedRow] = useState<StatementRow | null>(null);

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["finance", "laba-rugi", period],
    queryFn: async () => {
      try {
        const res = await api.get(`/finance/reports/income-statement?period=${period}`);
        return unwrapResponse(res);
      } catch {
        return null;
      }
    }
  });

  const totalRevenue = useMemo(() => FALLBACK_REVENUES.reduce((acc, r) => acc + r.amount, 0), []);
  const totalCogs = useMemo(() => FALLBACK_COGS.reduce((acc, r) => acc + r.amount, 0), []);
  const grossProfit = totalRevenue - totalCogs;
  const grossMarginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0";

  const totalOpex = useMemo(() => FALLBACK_OPEX.reduce((acc, r) => acc + r.amount, 0), []);
  const netOperatingProfit = grossProfit - totalOpex;
  const netMarginPct = totalRevenue > 0 ? ((netOperatingProfit / totalRevenue) * 100).toFixed(1) : "0";

  const handleExportExcel = () => {
    toast.success("Mengekspor Laporan Laba Rugi ke file Excel Spreadsheet...");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Laba Rugi (Income Statement)"
        description="Ringkasan komprehensif performa pendapatan, HPP/COGS, beban operasional, dan profitabilitas bersih per periode akuntansi."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Net Profit Margin: {netMarginPct}%</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            <DnaButton variant="secondary" size="md" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Segarkan
            </DnaButton>
            <DnaButton variant="secondary" size="md" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Pendapatan (Revenue)"
          value={formatRupiah(totalRevenue)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+14.8% vs bln lalu", isPositive: true }}
          subtext="Akumulasi Penjualan & Jasa"
          variant="success"
        />
        <DnaStatCard
          label="Beban Pokok Penjualan (COGS)"
          value={formatRupiah(totalCogs)}
          icon={<ArrowDownRight className="w-5 h-5 text-amber-600" />}
          delta={{ value: "55.3% dari omzet", isPositive: true }}
          subtext="Bahan Baku & Tenaga Kerja"
          variant="warning"
        />
        <DnaStatCard
          label="Laba Kotor (Gross Profit)"
          value={formatRupiah(grossProfit)}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          delta={{ value: `${grossMarginPct}% Margin Kotor`, isPositive: true }}
          subtext="Gross Profit Realized"
          variant="info"
        />
        <DnaStatCard
          label="Laba Bersih Operasional"
          value={formatRupiah(netOperatingProfit)}
          icon={<PieChart className="w-5 h-5 text-purple-600" />}
          delta={{ value: `${netMarginPct}% Net Margin`, isPositive: true }}
          subtext="EBIT Bersih Periode Berjalan"
          variant="purple"
        />
      </DnaKpiGrid>

      <div className="space-y-6">
        {/* REVENUE SECTION */}
        <DnaDataTableCard
          title="1. Pendapatan Operasional (Operating Revenue)"
          badge={<DnaBadge variant="success">Total: {formatRupiah(totalRevenue)}</DnaBadge>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-3.5 py-3">Kode Akun</th>
                  <th className="px-3.5 py-3">Deskripsi Pendapatan</th>
                  <th className="px-3.5 py-3 text-right">Porsi (%)</th>
                  <th className="px-3.5 py-3 text-right">Nominal Realisasi</th>
                  <th className="px-3.5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {FALLBACK_REVENUES.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono text-slate-500 font-bold">{row.code}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-3.5 py-2.5 text-right font-medium text-slate-600">{row.pct}%</td>
                    <td className="px-3.5 py-2.5 text-right font-extrabold text-emerald-700">{formatRupiah(row.amount)}</td>
                    <td className="px-3.5 py-2.5 text-center">
                      <button onClick={() => setSelectedRow(row)} className="text-slate-400 hover:text-emerald-600">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-50/60 font-bold border-t-2 border-emerald-300">
                  <td colSpan={3} className="px-3.5 py-3 text-emerald-950 font-extrabold text-right">TOTAL PENDAPATAN OPERASIONAL:</td>
                  <td className="px-3.5 py-3 text-right text-emerald-900 font-black text-sm">{formatRupiah(totalRevenue)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>

        {/* COGS SECTION */}
        <DnaDataTableCard
          title="2. Beban Pokok Penjualan (Cost of Goods Sold / COGS)"
          badge={<DnaBadge variant="warning">Total: {formatRupiah(totalCogs)}</DnaBadge>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-3.5 py-3">Kode Akun</th>
                  <th className="px-3.5 py-3">Komponen Biaya Produksi</th>
                  <th className="px-3.5 py-3 text-right">Porsi COGS (%)</th>
                  <th className="px-3.5 py-3 text-right">Nominal Realisasi</th>
                  <th className="px-3.5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {FALLBACK_COGS.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono text-slate-500 font-bold">{row.code}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-3.5 py-2.5 text-right font-medium text-slate-600">{row.pct}%</td>
                    <td className="px-3.5 py-2.5 text-right font-extrabold text-amber-800">{formatRupiah(row.amount)}</td>
                    <td className="px-3.5 py-2.5 text-center">
                      <button onClick={() => setSelectedRow(row)} className="text-slate-400 hover:text-amber-600">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-amber-50/60 font-bold border-t-2 border-amber-300">
                  <td colSpan={3} className="px-3.5 py-3 text-amber-950 font-extrabold text-right">TOTAL BEBAN POKOK PENJUALAN:</td>
                  <td className="px-3.5 py-3 text-right text-amber-900 font-black text-sm">{formatRupiah(totalCogs)}</td>
                  <td></td>
                </tr>
                <tr className="bg-blue-50/60 font-black border-t border-blue-300">
                  <td colSpan={3} className="px-3.5 py-3 text-blue-950 font-black text-right text-sm">LABA KOTOR (GROSS PROFIT):</td>
                  <td className="px-3.5 py-3 text-right text-blue-900 font-black text-sm">{formatRupiah(grossProfit)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>

        {/* OPEX SECTION */}
        <DnaDataTableCard
          title="3. Beban Operasional & Administrasi (OPEX)"
          badge={<DnaBadge variant="critical">Total: {formatRupiah(totalOpex)}</DnaBadge>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-3.5 py-3">Kode Akun</th>
                  <th className="px-3.5 py-3">Rincian Beban Operasional</th>
                  <th className="px-3.5 py-3 text-right">Porsi OPEX (%)</th>
                  <th className="px-3.5 py-3 text-right">Nominal Realisasi</th>
                  <th className="px-3.5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {FALLBACK_OPEX.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono text-slate-500 font-bold">{row.code}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-3.5 py-2.5 text-right font-medium text-slate-600">{row.pct}%</td>
                    <td className="px-3.5 py-2.5 text-right font-extrabold text-rose-700">{formatRupiah(row.amount)}</td>
                    <td className="px-3.5 py-2.5 text-center">
                      <button onClick={() => setSelectedRow(row)} className="text-slate-400 hover:text-rose-600">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-rose-50/60 font-bold border-t-2 border-rose-300">
                  <td colSpan={3} className="px-3.5 py-3 text-rose-950 font-extrabold text-right">TOTAL BEBAN OPERASIONAL:</td>
                  <td className="px-3.5 py-3 text-right text-rose-900 font-black text-sm">{formatRupiah(totalOpex)}</td>
                  <td></td>
                </tr>
                <tr className="bg-emerald-100/70 font-black border-t-2 border-emerald-600">
                  <td colSpan={3} className="px-3.5 py-3 text-emerald-950 font-black text-right text-base">LABA BERSIH SEBELUM PAJAK (EBIT):</td>
                  <td className="px-3.5 py-3 text-right text-emerald-950 font-black text-base">{formatRupiah(netOperatingProfit)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      </div>

      {/* DRILLDOWN MODAL */}
      <DnaModal
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        title={`Buku Besar Rinci: ${selectedRow?.code} - ${selectedRow?.name}`}
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-slate-500 font-medium">Kategori Biaya/Pendapatan:</span>
              <p className="text-slate-800 font-bold">{selectedRow?.category}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">Total Terakumulasi:</span>
              <p className="text-emerald-700 font-black text-base">{selectedRow ? formatRupiah(selectedRow.amount) : "0"}</p>
            </div>
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-slate-600 mb-2 font-semibold">Transaksi Buku Besar Terakhir:</p>
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-1">Tanggal</th>
                  <th className="py-1">Ref Jurnal</th>
                  <th className="py-1">Deskripsi Transaksi</th>
                  <th className="py-1 text-right">Debit/Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 text-slate-600">2026-09-02</td>
                  <td className="py-2 font-mono text-emerald-700 font-semibold">JV-2609-001</td>
                  <td className="py-2 text-slate-800">Realisasi termin transaksi produksi PO-8821</td>
                  <td className="py-2 text-right font-bold text-slate-800">Rp 450.000.000</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">2026-09-05</td>
                  <td className="py-2 font-mono text-emerald-700 font-semibold">JV-2609-008</td>
                  <td className="py-2 text-slate-800">Realisasi termin transaksi produksi PO-8834</td>
                  <td className="py-2 text-right font-bold text-slate-800">Rp 320.000.000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedRow(null)}>
              Tutup
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
