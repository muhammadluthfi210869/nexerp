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
  DnaCheckbox,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd
} from "@/components/dna";

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

export default function LabaRugiReportPage() {
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0]
  });
  const [showComparison, setShowComparison] = useState(false);
  const [selectedRow, setSelectedRow] = useState<StatementRow | null>(null);

  // 1. Fetch live Profit & Loss Report
  const { data: plData, isLoading, refetch } = useQuery<any>({
    queryKey: ["finance-report-profit-loss", dateRange.start, dateRange.end],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/reports/profit-loss", {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end
          }
        });
        return unwrapResponse<any>(res);
      } catch {
        return null;
      }
    }
  });

  // 2. Fetch drilldown General Ledger for selected account
  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery<any>({
    queryKey: ["finance-report-gl-drilldown", selectedRow?.code, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!selectedRow?.code) return null;
      try {
        const res = await api.get(`/finance/reports/general-ledger/${selectedRow.code}`, {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end
          }
        });
        return unwrapResponse<any>(res);
      } catch {
        return null;
      }
    },
    enabled: !!selectedRow && !selectedRow.isHeader && !selectedRow.isTotal
  });

  // Transform backend report to rows
  const { rows, totalPendapatan, totalHpp, labaKotor, labaOperasional, labaBersih } = useMemo(() => {
    const revTotal = Number(plData?.operatingRevenue?.total || 0);
    const cogsTotal = Number(plData?.cogs?.total || 0);
    const gross = Number(plData?.grossProfit || (revTotal - cogsTotal));
    const opexTotal = Number(plData?.operatingExpenses?.total || 0);
    const opIncome = Number(plData?.operatingIncome || (gross - opexTotal));
    const net = Number(plData?.netProfit || (opIncome + Number(plData?.otherIncome?.total || 0) - Number(plData?.otherExpenses?.total || 0)));

    const resultRows: StatementRow[] = [];

    // Header 1: REVENUE
    resultRows.push({
      code: "4000",
      name: "I. PENDAPATAN OPERASIONAL (REVENUE)",
      level: 0,
      isHeader: true,
      currentAmount: revTotal,
      prevAmount: 0,
      growthPct: 0
    });
    const revGroups = plData?.operatingRevenue?.groups || {};
    Object.keys(revGroups).forEach((grp) => {
      (revGroups[grp] || []).forEach((acc: any) => {
        resultRows.push({
          code: acc.code,
          name: `  ${acc.name}`,
          level: 1,
          currentAmount: Number(acc.balance || 0),
          prevAmount: 0,
          growthPct: 0
        });
      });
    });
    resultRows.push({
      code: "TOT_REV",
      name: "TOTAL PENDAPATAN OPERASIONAL",
      level: 0,
      isTotal: true,
      currentAmount: revTotal,
      prevAmount: 0,
      growthPct: 0
    });

    // Header 2: COGS
    resultRows.push({
      code: "5000",
      name: "II. BEBAN POKOK PENJUALAN / PRODUKSI (COGS / HPP)",
      level: 0,
      isHeader: true,
      currentAmount: cogsTotal,
      prevAmount: 0,
      growthPct: 0
    });
    const cogsGroups = plData?.cogs?.groups || {};
    Object.keys(cogsGroups).forEach((grp) => {
      (cogsGroups[grp] || []).forEach((acc: any) => {
        resultRows.push({
          code: acc.code,
          name: `  ${acc.name}`,
          level: 1,
          currentAmount: Number(acc.balance || 0),
          prevAmount: 0,
          growthPct: 0
        });
      });
    });
    resultRows.push({
      code: "TOT_COGS",
      name: "TOTAL BEBAN POKOK PRODUKSI (HPP)",
      level: 0,
      isTotal: true,
      currentAmount: cogsTotal,
      prevAmount: 0,
      growthPct: 0
    });

    // 3. GROSS PROFIT
    resultRows.push({
      code: "GROSS_PRF",
      name: "LABA KOTOR (GROSS PROFIT)",
      level: 0,
      isTotal: true,
      currentAmount: gross,
      prevAmount: 0,
      growthPct: 0
    });

    // 4. OPEX
    resultRows.push({
      code: "6000",
      name: "III. BEBAN OPERASIONAL & ADMINISTRASI (OPEX)",
      level: 0,
      isHeader: true,
      currentAmount: opexTotal,
      prevAmount: 0,
      growthPct: 0
    });
    const opexGroups = plData?.operatingExpenses?.groups || {};
    Object.keys(opexGroups).forEach((grp) => {
      (opexGroups[grp] || []).forEach((acc: any) => {
        resultRows.push({
          code: acc.code,
          name: `  ${acc.name}`,
          level: 1,
          currentAmount: Number(acc.balance || 0),
          prevAmount: 0,
          growthPct: 0
        });
      });
    });
    resultRows.push({
      code: "TOT_OPEX",
      name: "TOTAL BEBAN OPERASIONAL (OPEX)",
      level: 0,
      isTotal: true,
      currentAmount: opexTotal,
      prevAmount: 0,
      growthPct: 0
    });

    // 5. OPERATIONAL & NET PROFIT
    resultRows.push({
      code: "NET_OP_PRF",
      name: "LABA OPERASIONAL BERSIH (EBIT)",
      level: 0,
      isTotal: true,
      currentAmount: opIncome,
      prevAmount: 0,
      growthPct: 0
    });
    resultRows.push({
      code: "NET_PRF",
      name: "TOTAL LABA RUGI BERSIH SETELAH PAJAK",
      level: 0,
      isTotal: true,
      currentAmount: net,
      prevAmount: 0,
      growthPct: 0
    });

    return {
      rows: resultRows,
      totalPendapatan: revTotal,
      totalHpp: cogsTotal,
      labaKotor: gross,
      labaOperasional: opIncome,
      labaBersih: net
    };
  }, [plData]);

  const grossMarginPct = totalPendapatan > 0 ? ((labaKotor / totalPendapatan) * 100).toFixed(1) : "0.0";
  const netMarginPct = totalPendapatan > 0 ? ((labaBersih / totalPendapatan) * 100).toFixed(1) : "0.0";

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Laba Rugi (Income Statement)"
        description="Ringkasan performa finansial komprehensif berformat hierarkis G-SERP: Pendapatan, HPP Produksi, Laba Kotor, OPEX, dan Laba Bersih."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Format G-SERP & 5 KPI Cards</span>
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

      {/* 5 KPI CARDS DENGAN URUTAN PERSIS SPESIFIKASI */}
      <DnaKpiGrid cols={5}>
        <DnaStatCard
          label="Total Pendapatan"
          value={formatRupiah(totalPendapatan)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Pendapatan Operasional", isPositive: true }}
          subtext="Revenue Maklon & Jasa"
          variant="success"
        />
        <DnaStatCard
          label="Laba Kotor (Gross Profit)"
          value={formatRupiah(labaKotor)}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          delta={{ value: `${grossMarginPct}% Gross Margin`, isPositive: labaKotor >= 0 }}
          subtext="Margin Kotor Manufaktur"
          variant="info"
        />
        <DnaStatCard
          label="Total Beban HPP (COGS)"
          value={formatRupiah(totalHpp)}
          icon={<ArrowDownRight className="w-5 h-5 text-amber-600" />}
          delta={{ value: totalPendapatan > 0 ? `${((totalHpp / totalPendapatan) * 100).toFixed(1)}% dari Revenue` : "0% dari Revenue", isPositive: false }}
          subtext="Bahan Baku & Upah Line"
          variant="warning"
        />
        <DnaStatCard
          label="Laba Operasional Bersih"
          value={formatRupiah(labaOperasional)}
          icon={<PieChart className="w-5 h-5 text-purple-600" />}
          delta={{ value: "EBIT Operasional", isPositive: labaOperasional >= 0 }}
          subtext="Laba Sebelum Bunga & Pajak"
          variant="purple"
        />
        <DnaStatCard
          label="Total Laba Rugi Bersih"
          value={formatRupiah(labaBersih)}
          icon={<Sparkles className="w-5 h-5 text-emerald-600" />}
          delta={{ value: `${netMarginPct}% Net Margin`, isPositive: labaBersih >= 0 }}
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
          <DnaTable className="w-full text-left text-xs">
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="w-28">Kode Akun</DnaTh>
                <DnaTh>Uraian / Deskripsi Akun (Hierarki G-SERP)</DnaTh>
                <DnaTh className="text-right">Periode Berjalan (Rp)</DnaTh>
                {showComparison && <DnaTh className="text-right">Periode Lalu (Rp)</DnaTh>}
                {showComparison && <DnaTh className="text-right">Pertumbuhan (%)</DnaTh>}
                <DnaTh className="text-center w-12">#</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {rows.map((row, idx) => {
                const isHeader = row.isHeader;
                const isTotal = row.isTotal;

                return (
                  <DnaTableRow
                    key={idx}
                    className={`transition-colors ${
                      isHeader
                        ? "bg-slate-100/80 font-bold text-slate-900 border-t border-slate-200"
                        : isTotal
                        ? "bg-emerald-50/60 font-black text-slate-900 border-t border-b border-emerald-300"
                        : "hover:bg-slate-50/50 text-slate-700"
                    }`}
                  >
                    <DnaTd className="text-[11px] text-slate-500 font-semibold tabular-nums">
                      {row.code.startsWith("TOT_") || row.code === "GROSS_PRF" || row.code.startsWith("NET_") ? "" : row.code}
                    </DnaTd>
                    <DnaTd className={row.level === 1 ? "pl-8 text-slate-800" : "font-extrabold text-slate-900"}>
                      {row.name}
                    </DnaTd>
                    <DnaTd className={`text-right tabular-nums ${isTotal ? "font-black text-sm text-slate-900" : "font-semibold"}`}>
                      {isHeader ? "" : formatRupiah(row.currentAmount)}
                    </DnaTd>
                    {showComparison && (
                      <DnaTd className="text-right text-slate-500 font-medium tabular-nums">
                        {isHeader ? "" : formatRupiah(row.prevAmount)}
                      </DnaTd>
                    )}
                    {showComparison && (
                      <DnaTd className="text-right font-bold text-emerald-700 tabular-nums">
                        {isHeader ? "" : `${row.growthPct >= 0 ? "+" : ""}${row.growthPct}%`}
                      </DnaTd>
                    )}
                    <DnaTd className="text-center">
                      {!isHeader && !isTotal && (
                        <button
                          onClick={() => setSelectedRow(row)}
                          className="text-slate-400 hover:text-emerald-600 p-0.5 rounded"
                          title="Drilldown ke Buku Besar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </DnaTd>
                  </DnaTableRow>
                );
              })}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* DRILLDOWN MODAL AJAX DETAIL */}
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
              <span className="text-slate-500 font-medium">Realisasi Periode Ini:</span>
              <p className="text-emerald-700 font-black text-base">{selectedRow ? formatRupiah(selectedRow.currentAmount) : "0"}</p>
            </div>
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-slate-700 font-semibold mb-2">Daftar Jurnal Transaksi Pembentuk Saldo:</p>
            <DnaTable className="w-full text-left text-[11px]">
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 text-slate-500 font-semibold">
                  <DnaTh className="py-1">Tanggal</DnaTh>
                  <DnaTh className="py-1">No. Jurnal</DnaTh>
                  <DnaTh className="py-1">Deskripsi Transaksi</DnaTh>
                  <DnaTh className="py-1 text-right">Debit</DnaTh>
                  <DnaTh className="py-1 text-right">Kredit</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody className="divide-y divide-slate-100">
                {isLedgerLoading ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="py-4 text-center text-slate-400">
                      Memuat data buku besar...
                    </DnaTd>
                  </DnaTableRow>
                ) : !ledgerData?.lines || ledgerData.lines.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="py-4 text-center text-slate-400">
                      Tidak ada pergerakan jurnal untuk akun ini pada periode terpilih.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  ledgerData.lines.map((item: any, i: number) => (
                    <DnaTableRow key={i}>
                      <DnaTd className="py-2 text-slate-600 tabular-nums">
                        {item.date ? new Date(item.date).toISOString().split("T")[0] : "-"}
                      </DnaTd>
                      <DnaTd className="py-2 text-blue-700 font-semibold tabular-nums">
                        {item.journalNumber || item.reference || "-"}
                      </DnaTd>
                      <DnaTd className="py-2 text-slate-800">{item.description || "-"}</DnaTd>
                      <DnaTd className="py-2 text-right text-emerald-700 font-bold tabular-nums">
                        {Number(item.debit || 0) > 0 ? formatRupiah(Number(item.debit)) : "-"}
                      </DnaTd>
                      <DnaTd className="py-2 text-right text-slate-600 tabular-nums">
                        {Number(item.credit || 0) > 0 ? formatRupiah(Number(item.credit)) : "-"}
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
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
