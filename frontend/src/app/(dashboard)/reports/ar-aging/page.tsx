"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Users,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  DollarSign,
  Eye,
  Send,
  Calendar,
  CheckCircle2
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
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

interface ArAgingItem {
  id: string;
  customer: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  daysOverdue: number;
  amount: number;
  bucket: "Current" | "1-30" | "31-60" | "61-90" | ">90";
}

export default function ArAgingReportPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [bucketFilter, setBucketFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [selectedInvoice, setSelectedInvoice] = useState<ArAgingItem | null>(null);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["reports-ar-aging", dateRange.end],
    queryFn: async () => {
      const res = await api.get("/reports/ar-aging", {
        params: { asOfDate: dateRange.end },
      });
      return res.data;
    },
  });

  const arItems: ArAgingItem[] = useMemo(() => {
    const rawList = reportData?.data || [];
    return rawList.map((it: any) => ({
      id: it.id,
      customer: it.customer || "Pelanggan",
      invoiceNo: it.invoiceNo || it.id,
      invoiceDate: it.invoiceDate ? it.invoiceDate.split("T")[0] : "",
      dueDate: it.dueDate ? it.dueDate.split("T")[0] : "",
      daysOverdue: it.daysOverdue || 0,
      amount: it.outstandingAmount || it.totalAmount || 0,
      bucket: it.bucket || "Current",
    }));
  }, [reportData]);

  const summary = reportData?.summary || {
    totalOutstanding: 0,
    currentTotal: 0,
    overdueTotal: 0,
    overdue90Pct: 0,
    isHealthy: true,
  };

  const totalOutstanding = summary.totalOutstanding;
  const overdueAr = summary.overdueTotal;
  const piutangLancar = summary.currentTotal;

  const filteredItems = useMemo(() => {
    return arItems.filter((item) => {
      const matchSearch =
        item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBucket = bucketFilter === "ALL" || item.bucket === bucketFilter;
      return matchSearch && matchBucket;
    });
  }, [arItems, searchQuery, bucketFilter]);

  const handleSendReminder = (customer: string, invoice: string) => {
    toast.success(`Surat Pengingat Tagihan ${invoice} telah dikirim ke WhatsApp / Email ${customer}`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Umur Piutang (AR Aging Report)"
        description="Analisis jatuh tempo piutang tagihan pelanggan maklon kosmetik (Current, 1-30, 31-60, 61-90, >90 hari) terintegrasi dengan CRM BusDev."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-159 (Poin 17): Cross-module BusDev Visibility</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak AR Aging
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting AR Aging ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS PERSIS SCR-159 */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Outstanding AR"
          value={formatRupiah(totalOutstanding)}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          delta={{ value: `${arItems.length} Faktur Aktif`, isPositive: true }}
          subtext="Total Piutang Belum Dilunasi Klien"
          variant="info"
        />
        <DnaStatCard
          label="Overdue AR (Jatuh Tempo)"
          value={formatRupiah(overdueAr)}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          delta={{ value: "Perlu Follow-up BusDev", isPositive: false }}
          subtext="Total Piutang Melewati Deadline"
          variant="critical"
        />
        <DnaStatCard
          label="Piutang Lancar (Current)"
          value={formatRupiah(piutangLancar)}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Aman Terkendali", isPositive: true }}
          subtext="Jatuh Tempo Normal < 30 Hari"
          variant="success"
        />
      </DnaKpiGrid>

      {/* TABLE LIST FORMAT PERSIS SCR-159 */}
      <DnaDataTableCard
        title="Matriks Umur Piutang per Pelanggan (AR Aging Bucket)"
        badge={<DnaBadge variant="purple">{filteredItems.length} Tagihan</DnaBadge>}
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
            <select
              value={bucketFilter}
              onChange={(e) => setBucketFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Bucket Umur</option>
              <option value="Current">Current (Lancar)</option>
              <option value="1-30">1 - 30 Hari</option>
              <option value="31-60">31 - 60 Hari</option>
              <option value="61-90">61 - 90 Hari</option>
              <option value=">90">&gt; 90 Hari (Kritis)</option>
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Customer / No. Invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <DnaTh className="px-3.5 py-3">Customer</DnaTh>
                <DnaTh className="px-3.5 py-3">Invoice No</DnaTh>
                <DnaTh className="px-3.5 py-3">Invoice Date</DnaTh>
                <DnaTh className="px-3.5 py-3">Due Date</DnaTh>
                <DnaTh className="px-3.5 py-3 text-center">Days Overdue</DnaTh>
                <DnaTh className="px-3.5 py-3 text-right">Amount (Rp)</DnaTh>
                <DnaTh className="px-3.5 py-3 text-center">Bucket</DnaTh>
                <DnaTh className="px-3.5 py-3 text-center">#</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredItems.map((item) => (
                <DnaTableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <DnaTd className="px-3.5 py-2.5 font-bold text-slate-900">{item.customer}</DnaTd>
                  <DnaTd className="px-3.5 py-2.5 tabular-nums text-blue-700 font-semibold">{item.invoiceNo}</DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{item.invoiceDate}</DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{item.dueDate}</DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    {item.daysOverdue === 0 ? (
                      <span className="text-[10px] text-emerald-700 font-bold">0 Hari</span>
                    ) : (
                      <span className="text-[10px] font-black text-rose-700 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">
                        {item.daysOverdue} Hari
                      </span>
                    )}
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-right font-extrabold text-slate-900">{formatRupiah(item.amount)}</DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        item.bucket === "Current"
                          ? "success"
                          : item.bucket === "1-30"
                          ? "warning"
                          : item.bucket === "31-60"
                          ? "warning"
                          : "critical"
                      }
                    >
                      {item.bucket}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedInvoice(item)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Detail
                      </DnaButton>
                      <button
                        onClick={() => handleSendReminder(item.customer, item.invoiceNo)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        title="Kirim Peringatan WA"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* DRILLDOWN MODAL DETAIL INVOICE & KONTRAK MAKLON */}
      <DnaModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Rincian Piutang: ${selectedInvoice?.invoiceNo} - ${selectedInvoice?.customer}`}
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Pelanggan:</span>
              <strong className="text-slate-900">{selectedInvoice?.customer}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">No. Faktur / Tgl:</span>
              <span className="tabular-nums">{selectedInvoice?.invoiceNo} ({selectedInvoice?.invoiceDate})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jatuh Tempo:</span>
              <strong className="text-rose-700">{selectedInvoice?.dueDate} ({selectedInvoice?.daysOverdue} hari overdue)</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-900 font-bold">Total Tagihan:</span>
              <strong className="text-blue-700 font-black text-sm">{selectedInvoice ? formatRupiah(selectedInvoice.amount) : "0"}</strong>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedInvoice(null)}>
              Tutup
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
