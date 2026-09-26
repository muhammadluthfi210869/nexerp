"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Scale,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
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
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
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

export default function TrialBalancePage() {
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rawData, isLoading, refetch } = useQuery<any>({
    queryKey: ["reports-trial-balance", dateRange.start, dateRange.end],
    queryFn: async () => {
      try {
        const res = await api.get("/reports/trial-balance", {
          params: { startDate: dateRange.start, endDate: dateRange.end },
        });
        return unwrapResponse<any>(res);
      } catch {
        const res2 = await api.get("/finance/reports/trial-balance/detailed", {
          params: { startDate: dateRange.start, endDate: dateRange.end },
        });
        return unwrapResponse<any>(res2);
      }
    },
  });

  const rows: TrialBalanceRow[] = useMemo(() => {
    const list = Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData)
      ? rawData
      : [];

    return list.map((a: any) => {
      const openingDr = Number(a.awalDebit || 0);
      const openingCr = Number(a.awalCredit || 0);
      const mutasiDr = Number(a.perubahanDebit || a.debit || a.totalDebit || 0);
      const mutasiCr = Number(a.perubahanCredit || a.credit || a.totalCredit || 0);
      const endingDr = Number(a.akhirDebit || (a.debitBalance > 0 ? a.debitBalance : 0));
      const endingCr = Number(a.akhirCredit || (a.creditBalance > 0 ? a.creditBalance : 0));

      return {
        code: a.code || a.coa_code || "-",
        name: a.name || a.coa_name || "-",
        openingDr,
        openingCr,
        mutasiDr,
        mutasiCr,
        endingDr,
        endingCr,
      };
    });
  }, [rawData]);

  const totalOpeningDr = useMemo(() => rows.reduce((acc, r) => acc + r.openingDr, 0), [rows]);
  const totalOpeningCr = useMemo(() => rows.reduce((acc, r) => acc + r.openingCr, 0), [rows]);
  const totalMutasiDr = useMemo(() => rows.reduce((acc, r) => acc + r.mutasiDr, 0), [rows]);
  const totalMutasiCr = useMemo(() => rows.reduce((acc, r) => acc + r.mutasiCr, 0), [rows]);
  const totalEndingDr = useMemo(() => rows.reduce((acc, r) => acc + r.endingDr, 0), [rows]);
  const totalEndingCr = useMemo(() => rows.reduce((acc, r) => acc + r.endingCr, 0), [rows]);

  const diff = Math.abs(totalEndingDr - totalEndingCr);
  const isMatched = diff < 1;

  const filteredRows = useMemo(() => {
    return rows.filter(
      (r) => r.code.includes(searchQuery) || r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rows, searchQuery]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Neraca Saldo (Trial Balance Report)"
        description="Pengecekan integritas keseimbangan debit dan kredit seluruh akun COA: Saldo Awal, Mutasi Periode, dan Saldo Akhir sebelum tutup buku."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-165: Balance Status {isMatched ? "MATCH" : "SELISIH"}</span>
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
          label="Total Saldo Akhir (Dr)"
          value={formatRupiah(totalEndingDr)}
          icon={<CheckCircle2 className="w-4 h-4 text-blue-600" />}
          subtext="Ending Net Debit"
          variant="info"
        />
        <DnaStatCard
          label="Balance Status"
          value={isMatched ? "MATCH (OK)" : `SELISIH ${formatRupiah(diff)}`}
          icon={isMatched ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          delta={{ value: isMatched ? "Zero Variance" : "Perlu Rekonsiliasi", isPositive: isMatched }}
          subtext={isMatched ? "Dr = Cr Seimbang" : "Selisih Terdeteksi"}
          variant={isMatched ? "success" : "danger"}
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
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <DnaTh className="px-3 py-3" rowSpan={2}>Kode Akun</DnaTh>
                <DnaTh className="px-3 py-3" rowSpan={2}>Nama Akun COA</DnaTh>
                <DnaTh className="px-3 py-1.5 text-center border-b border-slate-200" colSpan={2}>Saldo Awal</DnaTh>
                <DnaTh className="px-3 py-1.5 text-center border-b border-slate-200" colSpan={2}>Mutasi Periode</DnaTh>
                <DnaTh className="px-3 py-1.5 text-center border-b border-slate-200" colSpan={2}>Saldo Akhir</DnaTh>
              </DnaTableRow>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-bold uppercase">
                <DnaTh className="px-3 py-1.5 text-right">Debit (Rp)</DnaTh>
                <DnaTh className="px-3 py-1.5 text-right">Kredit (Rp)</DnaTh>
                <DnaTh className="px-3 py-1.5 text-right">Debit (Rp)</DnaTh>
                <DnaTh className="px-3 py-1.5 text-right">Kredit (Rp)</DnaTh>
                <DnaTh className="px-3 py-1.5 text-right">Debit (Rp)</DnaTh>
                <DnaTh className="px-3 py-1.5 text-right">Kredit (Rp)</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredRows.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={8} className="text-center py-8 text-slate-400 italic text-xs">
                    {isLoading ? "Memuat neraca saldo dari server..." : "Tidak ada data neraca saldo pada periode ini."}
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredRows.map((r) => (
                  <DnaTableRow key={r.code} className="hover:bg-slate-50/50 transition-colors">
                    <DnaTd className="px-3 py-2 tabular-nums text-blue-700 font-bold">{r.code}</DnaTd>
                    <DnaTd className="px-3 py-2 font-semibold text-slate-900">{r.name}</DnaTd>
                    <DnaTd className="px-3 py-2 text-right font-medium text-slate-700">{r.openingDr > 0 ? formatRupiah(r.openingDr) : "-"}</DnaTd>
                    <DnaTd className="px-3 py-2 text-right font-medium text-slate-700">{r.openingCr > 0 ? formatRupiah(r.openingCr) : "-"}</DnaTd>
                    <DnaTd className="px-3 py-2 text-right font-bold text-emerald-700">{r.mutasiDr > 0 ? formatRupiah(r.mutasiDr) : "-"}</DnaTd>
                    <DnaTd className="px-3 py-2 text-right font-bold text-rose-700">{r.mutasiCr > 0 ? formatRupiah(r.mutasiCr) : "-"}</DnaTd>
                    <DnaTd className="px-3 py-2 text-right font-black text-slate-900">{r.endingDr > 0 ? formatRupiah(r.endingDr) : "-"}</DnaTd>
                    <DnaTd className="px-3 py-2 text-right font-black text-slate-900">{r.endingCr > 0 ? formatRupiah(r.endingCr) : "-"}</DnaTd>
                  </DnaTableRow>
                ))
              )}
              <DnaTableRow className="bg-emerald-50/75 font-black border-t-2 border-emerald-400">
                <DnaTd colSpan={2} className="px-3 py-3 text-emerald-950 font-black text-right text-xs">TOTAL TRIAL BALANCE:</DnaTd>
                <DnaTd className="px-3 py-3 text-right text-slate-900 font-bold">{formatRupiah(totalOpeningDr)}</DnaTd>
                <DnaTd className="px-3 py-3 text-right text-slate-900 font-bold">{formatRupiah(totalOpeningCr)}</DnaTd>
                <DnaTd className="px-3 py-3 text-right text-emerald-900 font-black">{formatRupiah(totalMutasiDr)}</DnaTd>
                <DnaTd className="px-3 py-3 text-right text-rose-900 font-black">{formatRupiah(totalMutasiCr)}</DnaTd>
                <DnaTd className="px-3 py-3 text-right text-emerald-950 font-black text-sm">{formatRupiah(totalEndingDr)}</DnaTd>
                <DnaTd className="px-3 py-3 text-right text-emerald-950 font-black text-sm">{formatRupiah(totalEndingCr)}</DnaTd>
              </DnaTableRow>
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
