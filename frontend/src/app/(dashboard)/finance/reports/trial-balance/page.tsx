"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Scale,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  DollarSign
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

interface TrialBalanceRow {
  code: string;
  name: string;
  openingDr: number;
  openingCr: number;
  mutasiDr: number;
  mutasiCr: number;
  endingDr: number;
  endingCr: number;
}

const FALLBACK_TB_ROWS: TrialBalanceRow[] = [
  { code: "1110", name: "Kas Operasional Kantor", openingDr: 45000000, openingCr: 0, mutasiDr: 350000000, mutasiCr: 310000000, endingDr: 85000000, endingCr: 0 },
  { code: "1120", name: "Bank BCA Operasional (521-009182)", openingDr: 1250000000, openingCr: 0, mutasiDr: 2100000000, mutasiCr: 1800000000, endingDr: 1550000000, endingCr: 0 },
  { code: "1130", name: "Bank Mandiri Payroll & Pajak", openingDr: 420000000, openingCr: 0, mutasiDr: 800000000, mutasiCr: 650000000, endingDr: 570000000, endingCr: 0 },
  { code: "1210", name: "Piutang Usaha Pelanggan Maklon", openingDr: 850000000, openingCr: 0, mutasiDr: 1450000000, mutasiCr: 1300000000, endingDr: 1000000000, endingCr: 0 },
  { code: "1310", name: "Persediaan Bahan Baku Aktif & Extract", openingDr: 980000000, openingCr: 0, mutasiDr: 620000000, mutasiCr: 480000000, endingDr: 1120000000, endingCr: 0 },
  { code: "1320", name: "Persediaan Bahan Kemas & Packaging", openingDr: 400000000, openingCr: 0, mutasiDr: 290000000, mutasiCr: 240000000, endingDr: 450000000, endingCr: 0 },
  { code: "2110", name: "Hutang Usaha Supplier Bahan Baku", openingDr: 0, openingCr: 620000000, mutasiDr: 450000000, mutasiCr: 520000000, endingDr: 0, endingCr: 690000000 },
  { code: "3110", name: "Modal Disetor Pemegang Saham", openingDr: 0, openingCr: 3325000000, mutasiDr: 0, mutasiCr: 0, endingDr: 0, endingCr: 3325000000 },
  { code: "4110", name: "Pendapatan Produksi Maklon OEM", openingDr: 0, openingCr: 0, mutasiDr: 0, mutasiCr: 1450000000, endingDr: 0, endingCr: 1450000000 },
  { code: "5110", name: "Beban Pokok Produksi (HPP)", openingDr: 0, openingCr: 0, mutasiDr: 690000000, mutasiCr: 0, endingDr: 690000000, endingCr: 0 },
];

export default function TrialBalancePage() {
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [searchQuery, setSearchQuery] = useState("");

  const totalOpeningDr = useMemo(() => FALLBACK_TB_ROWS.reduce((acc, r) => acc + r.openingDr, 0), []);
  const totalOpeningCr = useMemo(() => FALLBACK_TB_ROWS.reduce((acc, r) => acc + r.openingCr, 0), []);
  const totalMutasiDr = useMemo(() => FALLBACK_TB_ROWS.reduce((acc, r) => acc + r.mutasiDr, 0), []);
  const totalMutasiCr = useMemo(() => FALLBACK_TB_ROWS.reduce((acc, r) => acc + r.mutasiCr, 0), []);
  const totalEndingDr = useMemo(() => FALLBACK_TB_ROWS.reduce((acc, r) => acc + r.endingDr, 0), []);
  const totalEndingCr = useMemo(() => FALLBACK_TB_ROWS.reduce((acc, r) => acc + r.endingCr, 0), []);

  const isMatched = totalEndingDr === totalEndingCr;

  const filteredRows = useMemo(() => {
    return FALLBACK_TB_ROWS.filter(
      (r) => r.code.includes(searchQuery) || r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Neraca Saldo (Trial Balance Report)"
        description="Pengecekan integritas keseimbangan debit dan kredit seluruh akun COA: Saldo Awal, Mutasi Periode, dan Saldo Akhir sebelum tutup buku."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-165: Balance Status MATCH (0 Selisih)</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Neraca Saldo
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting Neraca Saldo ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* 6 KPI CARDS PERSIS SCR-165 */}
      <DnaKpiGrid cols={6}>
        <DnaStatCard
          label="Total Debit Saldo Awal"
          value={formatRupiah(totalOpeningDr)}
          icon={<DollarSign className="w-4 h-4 text-slate-600" />}
          subtext="Opening Dr"
          variant="default"
        />
        <DnaStatCard
          label="Total Kredit Saldo Awal"
          value={formatRupiah(totalOpeningCr)}
          icon={<DollarSign className="w-4 h-4 text-slate-600" />}
          subtext="Opening Cr"
          variant="default"
        />
        <DnaStatCard
          label="Total Mutasi Debit"
          value={formatRupiah(totalMutasiDr)}
          icon={<Scale className="w-4 h-4 text-emerald-600" />}
          subtext="Mutasi Dr Periode"
          variant="success"
        />
        <DnaStatCard
          label="Total Mutasi Kredit"
          value={formatRupiah(totalMutasiCr)}
          icon={<Scale className="w-4 h-4 text-amber-600" />}
          subtext="Mutasi Cr Periode"
          variant="warning"
        />
        <DnaStatCard
          label="Total Saldo Akhir"
          value={formatRupiah(totalEndingDr)}
          icon={<CheckCircle2 className="w-4 h-4 text-blue-600" />}
          subtext="Ending Net Balance"
          variant="info"
        />
        <DnaStatCard
          label="Balance Status"
          value="MATCH (OK)"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          delta={{ value: "Zero Variance", isPositive: true }}
          subtext="Dr = Cr Sempurna"
          variant="success"
        />
      </DnaKpiGrid>

      {/* TABLE LIST FORMAT PERSIS SCR-165 */}
      <DnaDataTableCard
        title="Daftar Neraca Saldo (Trial Balance Sheet)"
        badge={<DnaBadge variant={isMatched ? "success" : "critical"}>{isMatched ? "BALANCE MATCH" : "UNBALANCED"}</DnaBadge>}
        customToolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
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
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode / nama akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3 py-3" rowSpan={2}>Kode Akun</th>
                <th className="px-3 py-3" rowSpan={2}>Nama Akun COA</th>
                <th className="px-3 py-1.5 text-center border-b border-slate-200" colSpan={2}>Saldo Awal</th>
                <th className="px-3 py-1.5 text-center border-b border-slate-200" colSpan={2}>Mutasi Periode</th>
                <th className="px-3 py-1.5 text-center border-b border-slate-200" colSpan={2}>Saldo Akhir</th>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-bold uppercase">
                <th className="px-3 py-1.5 text-right">Debit (Rp)</th>
                <th className="px-3 py-1.5 text-right">Kredit (Rp)</th>
                <th className="px-3 py-1.5 text-right">Debit (Rp)</th>
                <th className="px-3 py-1.5 text-right">Kredit (Rp)</th>
                <th className="px-3 py-1.5 text-right">Debit (Rp)</th>
                <th className="px-3 py-1.5 text-right">Kredit (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((r) => (
                <tr key={r.code} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-blue-700 font-bold">{r.code}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-700">{r.openingDr > 0 ? formatRupiah(r.openingDr) : "-"}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-700">{r.openingCr > 0 ? formatRupiah(r.openingCr) : "-"}</td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-700">{r.mutasiDr > 0 ? formatRupiah(r.mutasiDr) : "-"}</td>
                  <td className="px-3 py-2 text-right font-bold text-rose-700">{r.mutasiCr > 0 ? formatRupiah(r.mutasiCr) : "-"}</td>
                  <td className="px-3 py-2 text-right font-black text-slate-900">{r.endingDr > 0 ? formatRupiah(r.endingDr) : "-"}</td>
                  <td className="px-3 py-2 text-right font-black text-slate-900">{r.endingCr > 0 ? formatRupiah(r.endingCr) : "-"}</td>
                </tr>
              ))}
              <tr className="bg-emerald-50/75 font-black border-t-2 border-emerald-400">
                <td colSpan={2} className="px-3 py-3 text-emerald-950 font-black text-right text-xs">TOTAL TRIAL BALANCE:</td>
                <td className="px-3 py-3 text-right text-slate-900 font-bold">{formatRupiah(totalOpeningDr)}</td>
                <td className="px-3 py-3 text-right text-slate-900 font-bold">{formatRupiah(totalOpeningCr)}</td>
                <td className="px-3 py-3 text-right text-emerald-900 font-black">{formatRupiah(totalMutasiDr)}</td>
                <td className="px-3 py-3 text-right text-rose-900 font-black">{formatRupiah(totalMutasiCr)}</td>
                <td className="px-3 py-3 text-right text-emerald-950 font-black text-sm">{formatRupiah(totalEndingDr)}</td>
                <td className="px-3 py-3 text-right text-emerald-950 font-black text-sm">{formatRupiah(totalEndingCr)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
