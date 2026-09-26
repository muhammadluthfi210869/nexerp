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
  accountId: string;
  accountCode: string;
  accountName: string;
  opening: number;
  debit: number;
  credit: number;
  change: number;
  saldo: number;
}

export default function GeneralLedgerPage() {
  const toast = useDnaToast();
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0]
  });
  const [selectedDrilldown, setSelectedDrilldown] = useState<LedgerAccountSummary | null>(null);

  // 1. Fetch live detailed trial balance
  const { data: rawTbData, isLoading, refetch } = useQuery<any>({
    queryKey: ["finance-detailed-tb", dateRange.start, dateRange.end],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/reports/trial-balance/detailed", {
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

  // 2. Fetch drilldown transactions for selected account
  const { data: drilldownData, isLoading: isDrilldownLoading } = useQuery<any>({
    queryKey: ["finance-gl-drilldown", selectedDrilldown?.accountId || selectedDrilldown?.accountCode, dateRange.start, dateRange.end],
    queryFn: async () => {
      const targetId = selectedDrilldown?.accountId || selectedDrilldown?.accountCode;
      if (!targetId) return null;
      try {
        const res = await api.get(`/finance/reports/general-ledger/${targetId}`, {
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
    enabled: !!selectedDrilldown
  });

  const accounts: LedgerAccountSummary[] = useMemo(() => {
    const list = rawTbData?.data || [];
    return list.map((a: any) => {
      const opening = Number(a.awalDebit || 0) - Number(a.awalCredit || 0);
      const debit = Number(a.perubahanDebit || 0);
      const credit = Number(a.perubahanCredit || 0);
      const change = debit - credit;
      const saldo = Number(a.akhirDebit || 0) - Number(a.akhirCredit || 0);

      return {
        accountId: a.id || a.code,
        accountCode: a.code || "-",
        accountName: a.name || "-",
        opening,
        debit,
        credit,
        change,
        saldo
      };
    });
  }, [rawTbData]);

  const activeAccount = useMemo(() => {
    if (selectedCode) {
      const found = accounts.find((a) => a.accountCode === selectedCode);
      if (found) return found;
    }
    return accounts[0] || {
      accountId: "",
      accountCode: "-",
      accountName: "Pilih Akun",
      opening: 0,
      debit: 0,
      credit: 0,
      change: 0,
      saldo: 0
    };
  }, [accounts, selectedCode]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      return a.accountCode.includes(searchQuery) || a.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [accounts, searchQuery]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Buku Besar (General Ledger Report)"
        description="Ringkasan saldo awal, mutasi debit/kredit, perubahan bersih, dan saldo akhir per akun COA dengan drill-down ke jurnal dan dokumen sumber."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Filter Lintas Periode</span>
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

      {/* KPI CARDS */}
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
          icon={<Scale className="w-5 h-5 text-rose-600" />}
          delta={{ value: "-Mutasi Kredit", isPositive: false }}
          subtext="Akumulasi Keluar Sisi Kredit"
          variant="warning"
        />
        <DnaStatCard
          label="Closing Balance (Saldo Akhir)"
          value={formatRupiah(activeAccount.saldo)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          delta={{ value: activeAccount.change >= 0 ? `+${formatRupiah(activeAccount.change)} Net` : `${formatRupiah(activeAccount.change)} Net`, isPositive: activeAccount.change >= 0 }}
          subtext={"Per " + dateRange.end}
          variant="info"
        />
      </DnaKpiGrid>

      {/* FILTER PERIODE BEBAS */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Rentang Periode Lintas Bulan:</span>
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
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

        <div className="flex items-center gap-2">
          <DnaButton variant="secondary" size="md" onClick={() => refetch()}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Buku Besar
          </DnaButton>
        </div>
      </div>

      {/* MAIN DATA TABLE CARD */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari nomor kode akun atau nama akun COA...",
        }}
      >
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="w-[100px]">Kode Akun</DnaTh>
              <DnaTh>Nama Akun COA</DnaTh>
              <DnaTh align="right" className="w-[140px]">Saldo Awal</DnaTh>
              <DnaTh align="right" className="w-[140px]">Debet</DnaTh>
              <DnaTh align="right" className="w-[140px]">Kredit</DnaTh>
              <DnaTh align="right" className="w-[140px]">Perubahan</DnaTh>
              <DnaTh align="right" className="w-[150px]">Saldo Akhir</DnaTh>
              <DnaTh align="center" className="w-[80px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredAccounts.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={8} className="py-12 text-center text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Belum ada akun atau transaksi pada rentang tanggal ini.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredAccounts.map((row) => (
                <DnaTableRow
                  key={row.accountCode}
                  className={`cursor-pointer ${selectedCode === row.accountCode ? "bg-blue-50/60" : "hover:bg-slate-50/50"}`}
                  onClick={() => setSelectedCode(row.accountCode)}
                >
                  <DnaTd>
                    <DnaCell.Code value={row.accountCode} />
                  </DnaTd>
                  <DnaTd>
                    <div className="font-semibold text-slate-900 text-xs">{row.accountName}</div>
                  </DnaTd>
                  <DnaTd align="right">
                    <span className="font-medium text-slate-600 text-xs tabular-nums">
                      {formatRupiah(row.opening)}
                    </span>
                  </DnaTd>
                  <DnaTd align="right">
                    <span className="font-semibold text-emerald-700 text-xs tabular-nums">
                      {formatRupiah(row.debit)}
                    </span>
                  </DnaTd>
                  <DnaTd align="right">
                    <span className="font-semibold text-rose-700 text-xs tabular-nums">
                      {formatRupiah(row.credit)}
                    </span>
                  </DnaTd>
                  <DnaTd align="right">
                    <span className={`font-semibold text-xs tabular-nums ${row.change >= 0 ? "text-blue-700" : "text-amber-700"}`}>
                      {row.change >= 0 ? "+" : ""}{formatRupiah(row.change)}
                    </span>
                  </DnaTd>
                  <DnaTd align="right">
                    <span className="font-bold text-slate-900 text-xs tabular-nums">
                      {formatRupiah(row.saldo)}
                    </span>
                  </DnaTd>
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
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>

      {/* DRILLDOWN MODAL */}
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
              <DnaTableRow>
                <DnaTh className="p-2">Tgl</DnaTh>
                <DnaTh className="p-2">No. Jurnal</DnaTh>
                <DnaTh className="p-2">Deskripsi Transaksi</DnaTh>
                <DnaTh align="right" className="p-2">Debet</DnaTh>
                <DnaTh align="right" className="p-2">Kredit</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isDrilldownLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={5} className="p-4 text-center text-slate-400">
                    Memuat rincian jurnal transaksi...
                  </DnaTd>
                </DnaTableRow>
              ) : !drilldownData?.lines || drilldownData.lines.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={5} className="p-4 text-center text-slate-400">
                    Tidak ada mutasi jurnal pembentuk saldo pada periode ini.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                drilldownData.lines.map((item: any, i: number) => (
                  <DnaTableRow key={i}>
                    <DnaTd className="p-2 text-slate-600">{item.date ? new Date(item.date).toISOString().split("T")[0] : "-"}</DnaTd>
                    <DnaTd className="p-2 text-blue-700 font-semibold tabular-nums">{item.journalNumber || item.reference || "-"}</DnaTd>
                    <DnaTd className="p-2 text-slate-800">{item.description || "-"}</DnaTd>
                    <DnaTd align="right" className="p-2 font-bold tabular-nums text-emerald-700">
                      {Number(item.debit || 0) > 0 ? formatRupiah(Number(item.debit)) : "-"}
                    </DnaTd>
                    <DnaTd align="right" className="p-2 text-slate-400 tabular-nums">
                      {Number(item.credit || 0) > 0 ? formatRupiah(Number(item.credit)) : "-"}
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
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
