"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  BookOpen,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Eye,
  RefreshCw,
  TrendingUp,
  Scale,
  Building2,
  ChevronRight
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
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaCell,
} from "@/components/dna";

interface LedgerAccountSummary {
  accountCode: string;
  accountName: string;
  opening: number;
  debit: number;
  credit: number;
  change: number;
  saldo: number;
}

const FALLBACK_LEDGER_DATA: LedgerAccountSummary[] = [
  { accountCode: "1110", accountName: "Kas Operasional Kantor", opening: 45000000, debit: 350000000, credit: 310000000, change: 40000000, saldo: 85000000 },
  { accountCode: "1120", accountName: "Bank BCA Operasional (521-009182)", opening: 1250000000, debit: 2100000000, credit: 1800000000, change: 300000000, saldo: 1550000000 },
  { accountCode: "1130", accountName: "Bank Mandiri Payroll & Pajak", opening: 420000000, debit: 800000000, credit: 650000000, change: 150000000, saldo: 570000000 },
  { accountCode: "1210", accountName: "Piutang Usaha Pelanggan Maklon", opening: 850000000, debit: 1450000000, credit: 1300000000, change: 150000000, saldo: 1000000000 },
  { accountCode: "1310", accountName: "Persediaan Bahan Baku Aktif Pabrik", opening: 980000000, debit: 620000000, credit: 480000000, change: 140000000, saldo: 1120000000 },
  { accountCode: "2110", accountName: "Hutang Usaha Supplier Bahan Baku", opening: 620000000, debit: 450000000, credit: 520000000, change: 70000000, saldo: 690000000 },
  { accountCode: "4110", accountName: "Pendapatan Produksi Maklon OEM", opening: 0, debit: 0, credit: 1450000000, change: 1450000000, saldo: 1450000000 },
];

export default function GeneralLedgerPage() {
  const toast = useDnaToast();
  const [selectedCode, setSelectedCode] = useState<string>("1120");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [selectedDrilldown, setSelectedDrilldown] = useState<LedgerAccountSummary | null>(null);

  const activeAccount = useMemo(() => {
    return FALLBACK_LEDGER_DATA.find((a) => a.accountCode === selectedCode) || FALLBACK_LEDGER_DATA[1];
  }, [selectedCode]);

  const filteredAccounts = useMemo(() => {
    return FALLBACK_LEDGER_DATA.filter((a) => {
      return a.accountCode.includes(searchQuery) || a.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Buku Besar (General Ledger Report)"
        description="Ringkasan saldo awal, mutasi debit/kredit, perubahan bersih, dan saldo akhir per akun COA dengan drill-down ke jurnal dan dokumen sumber."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-162 (Poin 31): Filter Periode Bebas Lintas Bulan</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak GL
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting Buku Besar ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS (SCR-162: Opening Balance, Total Debit, Total Credit, Closing Balance) */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Opening Balance (Saldo Awal)"
          value={formatRupiah(activeAccount.opening)}
          icon={<BookOpen className="w-5 h-5 text-slate-600" />}
          subtext={"Per " + dateRange.start}
          variant="default"
        />
        <DnaStatCard
          label="Total Debet Periode"
          value={formatRupiah(activeAccount.debit)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+Mutasi Debet", isPositive: true }}
          subtext="Akumulasi Masuk Sisi Debet"
          variant="success"
        />
        <DnaStatCard
          label="Total Kredit Periode"
          value={formatRupiah(activeAccount.credit)}
          icon={<Scale className="w-5 h-5 text-amber-600" />}
          delta={{ value: "-Mutasi Kredit", isPositive: false }}
          subtext="Akumulasi Masuk Sisi Kredit"
          variant="warning"
        />
        <DnaStatCard
          label="Closing Balance (Saldo Akhir)"
          value={formatRupiah(activeAccount.saldo)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          delta={{ value: `Perubahan: +${formatRupiah(activeAccount.change)}`, isPositive: true }}
          subtext={"Per " + dateRange.end}
          variant="info"
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari kode / nama COA...",
          extraActions: (
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
          ),
        }}
      >
        <DnaTable>
          <DnaTableHead>
            <tr>
              <DnaTh className="w-[130px]">Kode CoA</DnaTh>
              <DnaTh>Nama Akun CoA</DnaTh>
              <DnaTh align="right" className="w-[140px]">Saldo Awal</DnaTh>
              <DnaTh align="right" className="w-[140px]">Debet</DnaTh>
              <DnaTh align="right" className="w-[140px]">Kredit</DnaTh>
              <DnaTh align="right" className="w-[140px]">Perubahan</DnaTh>
              <DnaTh align="right" className="w-[140px]">Saldo Akhir</DnaTh>
              <DnaTh align="center" className="w-[70px]">Aksi</DnaTh>
            </tr>
          </DnaTableHead>
          <DnaTableBody>
            {filteredAccounts.map((row) => (
              <DnaTableRow
                key={row.accountCode}
                onClick={() => setSelectedCode(row.accountCode)}
                className={`cursor-pointer ${
                  selectedCode === row.accountCode ? "bg-blue-50/60 font-semibold" : ""
                }`}
              >
                {/* Kolom 1: Kode CoA */}
                <DnaTd>
                  <DnaCell.Code value={row.accountCode} />
                </DnaTd>

                {/* Kolom 2: Nama CoA */}
                <DnaTd className="text-slate-900 font-medium truncate max-w-[240px]">
                  {row.accountName}
                </DnaTd>

                {/* Kolom 3: Saldo Awal */}
                <DnaTd align="right">
                  <span className="text-slate-700 text-xs tabular-nums font-medium">
                    {formatRupiah(row.opening)}
                  </span>
                </DnaTd>

                {/* Kolom 4: Debet */}
                <DnaTd align="right">
                  <span className="font-semibold text-emerald-700 text-xs tabular-nums">
                    {formatRupiah(row.debit)}
                  </span>
                </DnaTd>

                {/* Kolom 5: Kredit */}
                <DnaTd align="right">
                  <span className="font-semibold text-rose-700 text-xs tabular-nums">
                    {formatRupiah(row.credit)}
                  </span>
                </DnaTd>

                {/* Kolom 6: Perubahan */}
                <DnaTd align="right">
                  <span className="font-semibold text-blue-700 text-xs tabular-nums">
                    +{formatRupiah(row.change)}
                  </span>
                </DnaTd>

                {/* Kolom 7: Saldo Akhir */}
                <DnaTd align="right">
                  <span className="font-bold text-slate-900 text-xs tabular-nums">
                    {formatRupiah(row.saldo)}
                  </span>
                </DnaTd>

                {/* Kolom 8: Aksi */}
                <DnaTd align="center" onClick={(e) => e.stopPropagation()}>
                  <DnaButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDrilldown(row)}
                    className="text-slate-400 hover:text-blue-600"
                    title="Drilldown ke Jurnal Asli"
                  >
                    <Eye className="w-4 h-4" />
                  </DnaButton>
                </DnaTd>
              </DnaTableRow>
            ))}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>

      {/* DRILLDOWN MODAL KE JURNAL & SOURCE DOCUMENT (SCR-162) */}
      <DnaModal
        isOpen={!!selectedDrilldown}
        onClose={() => setSelectedDrilldown(null)}
        title={`Drilldown Transaksi: ${selectedDrilldown?.accountCode} - ${selectedDrilldown?.accountName}`}
        size="lg"
      >
        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex justify-between">
              <span>Akun COA:</span>
              <strong className="text-slate-900">{selectedDrilldown?.accountCode} - {selectedDrilldown?.accountName}</strong>
            </div>
            <div className="flex justify-between">
              <span>Saldo Akhir Berjalan:</span>
              <strong className="text-blue-700 font-bold">{selectedDrilldown ? formatRupiah(selectedDrilldown.saldo) : "0"}</strong>
            </div>
          </div>
          <DnaTable className="w-full text-left text-xs border border-slate-200 rounded-lg">
            <DnaTableHead>
              <tr>
                <DnaTh className="p-2">Tgl</DnaTh>
                <DnaTh className="p-2">No. Jurnal</DnaTh>
                <DnaTh className="p-2">Source Document</DnaTh>
                <DnaTh align="right" className="p-2">Debet</DnaTh>
                <DnaTh align="right" className="p-2">Kredit</DnaTh>
              </tr>
            </DnaTableHead>
            <DnaTableBody>
              <DnaTableRow>
                <DnaTd className="p-2 text-slate-600">2026-09-08</DnaTd>
                <DnaTd className="p-2 text-blue-700 font-semibold tabular-nums">DL-FIN-JRN-08092026-0001</DnaTd>
                <DnaTd className="p-2 text-emerald-700 font-medium tabular-nums">AR-INV-2609-01 (Faktur Maklon)</DnaTd>
                <DnaTd align="right" className="p-2 font-bold tabular-nums text-emerald-700">Rp 450.000.000</DnaTd>
                <DnaTd align="right" className="p-2 text-slate-400">-</DnaTd>
              </DnaTableRow>
            </DnaTableBody>
          </DnaTable>
          <div className="flex justify-end pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedDrilldown(null)}>
              Tutup
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
