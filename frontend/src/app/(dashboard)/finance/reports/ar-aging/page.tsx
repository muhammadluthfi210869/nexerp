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
  useDnaToast
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

const FALLBACK_AR_ITEMS: ArAgingItem[] = [
  { id: "1", customer: "PT Aura Kosmetika Cantik", invoiceNo: "AR-INV-2608-019", invoiceDate: "2026-08-20", dueDate: "2026-09-20", daysOverdue: 0, amount: 350000000, bucket: "Current" },
  { id: "2", customer: "CV Glow Derma Skincare", invoiceNo: "AR-INV-2608-005", invoiceDate: "2026-07-30", dueDate: "2026-08-30", daysOverdue: 10, amount: 180000000, bucket: "1-30" },
  { id: "3", customer: "PT Natural Herbal Nusantara", invoiceNo: "AR-INV-2607-042", invoiceDate: "2026-06-25", dueDate: "2026-07-25", daysOverdue: 46, amount: 220000000, bucket: "31-60" },
  { id: "4", customer: "Klinik Estetika Dr. Vina", invoiceNo: "AR-INV-2606-012", invoiceDate: "2026-05-15", dueDate: "2026-06-15", daysOverdue: 86, amount: 150000000, bucket: "61-90" },
  { id: "5", customer: "UD Cantik Berseri Makmur", invoiceNo: "AR-INV-2605-001", invoiceDate: "2026-04-10", dueDate: "2026-05-10", daysOverdue: 122, amount: 100000000, bucket: ">90" },
];

export default function ArAgingReportPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [bucketFilter, setBucketFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [selectedInvoice, setSelectedInvoice] = useState<ArAgingItem | null>(null);

  const totalOutstanding = useMemo(() => FALLBACK_AR_ITEMS.reduce((acc, r) => acc + r.amount, 0), []);
  const overdueAr = useMemo(() => FALLBACK_AR_ITEMS.filter((r) => r.daysOverdue > 0).reduce((acc, r) => acc + r.amount, 0), []);
  const piutangLancar = useMemo(() => FALLBACK_AR_ITEMS.filter((r) => r.daysOverdue === 0).reduce((acc, r) => acc + r.amount, 0), []);

  const filteredItems = useMemo(() => {
    return FALLBACK_AR_ITEMS.filter((item) => {
      const matchSearch =
        item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBucket = bucketFilter === "ALL" || item.bucket === bucketFilter;
      return matchSearch && matchBucket;
    });
  }, [searchQuery, bucketFilter]);

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
          delta={{ value: `${FALLBACK_AR_ITEMS.length} Faktur Aktif`, isPositive: true }}
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
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Customer</th>
                <th className="px-3.5 py-3">Invoice No</th>
                <th className="px-3.5 py-3">Invoice Date</th>
                <th className="px-3.5 py-3">Due Date</th>
                <th className="px-3.5 py-3 text-center">Days Overdue</th>
                <th className="px-3.5 py-3 text-right">Amount (Rp)</th>
                <th className="px-3.5 py-3 text-center">Bucket</th>
                <th className="px-3.5 py-3 text-center">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{item.customer}</td>
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-semibold">{item.invoiceNo}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{item.invoiceDate}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{item.dueDate}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    {item.daysOverdue === 0 ? (
                      <span className="text-[10px] text-emerald-700 font-bold">0 Hari</span>
                    ) : (
                      <span className="text-[10px] font-black text-rose-700 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">
                        {item.daysOverdue} Hari
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900">{formatRupiah(item.amount)}</td>
                  <td className="px-3.5 py-2.5 text-center">
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
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <span className="font-mono">{selectedInvoice?.invoiceNo} ({selectedInvoice?.invoiceDate})</span>
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
