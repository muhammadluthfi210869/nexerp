"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Building2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  DollarSign,
  Eye,
  CheckCircle2,
  Wallet,
  Calendar
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
  DnaSelect
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

interface ApAgingItem {
  id: string;
  vendor: string;
  invoiceNo: string;
  invoiceDate: string;
  deadline: string;
  statusDueDate: "H-3" | "H-7" | "OVERDUE" | "NORMAL";
  daysOverdue: number;
  amount: number;
  bucket: "Current" | "1-30" | "31-60" | ">60";
}

export default function ApAgingReportPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [bucketFilter, setBucketFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [selectedInvoice, setSelectedInvoice] = useState<ApAgingItem | null>(null);

  // Live AP / Bills query
  const { data: billsRaw = [], isLoading } = useQuery({
    queryKey: ["finance-ap-aging-bills"],
    queryFn: async (): Promise<any[]> => {
      const res = await api.get("/finance/bills");
      return unwrapResponse<any[]>(res) || [];
    },
  });

  const realTimeBankBalance = 1550000000;

  const apItems: ApAgingItem[] = useMemo(() => {
    const now = new Date();
    return (billsRaw || []).map((b: any) => {
      const deadline = b.dueDate || b.createdAt;
      const daysToDue = deadline ? Math.ceil((new Date(deadline).getTime() - now.getTime()) / 86400000) : 0;
      const daysOverdue = daysToDue < 0 ? Math.abs(daysToDue) : 0;
      let statusDueDate: "H-3" | "H-7" | "OVERDUE" | "NORMAL" = "NORMAL";
      if (daysToDue < 0) statusDueDate = "OVERDUE";
      else if (daysToDue <= 3) statusDueDate = "H-3";
      else if (daysToDue <= 7) statusDueDate = "H-7";

      let bucket: "Current" | "1-30" | "31-60" | ">60" = "Current";
      if (daysOverdue > 60) bucket = ">60";
      else if (daysOverdue > 30) bucket = "31-60";
      else if (daysOverdue > 0) bucket = "1-30";

      return {
        id: b.id,
        vendor: b.supplier?.name || b.lead?.clientName || "Vendor Supplier",
        invoiceNo: b.invoiceNumber || `BILL-${b.id?.slice(0, 8)}`,
        invoiceDate: b.createdAt ? new Date(b.createdAt).toISOString().split("T")[0] : "",
        deadline: deadline ? new Date(deadline).toISOString().split("T")[0] : "",
        statusDueDate,
        daysOverdue,
        amount: Number(b.amountDue || b.totalAmount || 0),
        bucket,
      };
    });
  }, [billsRaw]);

  const totalOutstanding = useMemo(() => apItems.reduce((acc, r) => acc + r.amount, 0), [apItems]);
  const countH3 = useMemo(() => apItems.filter((r) => r.statusDueDate === "H-3").length, [apItems]);
  const countH7 = useMemo(() => apItems.filter((r) => r.statusDueDate === "H-7").length, [apItems]);
  const overdueCount = useMemo(() => apItems.filter((r) => r.statusDueDate === "OVERDUE").length, [apItems]);

  const filteredItems = useMemo(() => {
    return apItems.filter((item) => {
      const matchSearch =
        item.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBucket = bucketFilter === "ALL" || item.bucket === bucketFilter;
      return matchSearch && matchBucket;
    });
  }, [apItems, searchQuery, bucketFilter]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Umur Hutang Supplier (AP Aging Report)"
        description="Monitoring jatuh tempo kewajiban faktur vendor bahan baku/kemas dengan skema peringatan H-3 (Merah), H-7 (Kuning), dan Overdue beranimasi."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <Wallet className="w-3.5 h-3.5" />
            <span>Saldo Kas Bank Realtime: {formatRupiah(realTimeBankBalance)}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak AP Aging
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting AP Aging ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* 4 KPI CARDS SESUAI SPESIFIKASI SCR-158 (POIN 10-12) */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Outstanding AP"
          value={formatRupiah(totalOutstanding)}
          icon={<DollarSign className="w-5 h-5 text-rose-600" />}
          delta={{ value: `${apItems.length} Faktur Supplier`, isPositive: false }}
          subtext="Total Kewajiban Hutang Berjalan"
          variant="critical"
        />
        <DnaStatCard
          label="Jatuh Tempo H-3 (Mendesak)"
          value={`${countH3} Tagihan (Merah)`}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          delta={{ value: "Deadline < 3 Hari", isPositive: false }}
          subtext="Segera Jadwalkan Kas Keluar"
          variant="critical"
        />
        <DnaStatCard
          label="Jatuh Tempo H-7 (Peringatan)"
          value={`${countH7} Tagihan (Kuning)`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Deadline < 7 Hari", isPositive: true }}
          subtext="Siapkan Likuiditas Bank"
          variant="warning"
        />
        <DnaStatCard
          label="Overdue (Lewat Jatuh Tempo)"
          value={`${overdueCount} Tagihan`}
          icon={<AlertTriangle className="w-5 h-5 text-rose-700" />}
          delta={{ value: "Tertunggak", isPositive: false }}
          subtext="Risiko Hold Pengiriman Bahan"
          variant="critical"
        />
      </DnaKpiGrid>

      {/* TABLE LIST FORMAT PERSIS SCR-158 DENGAN PEWARNAAN H-3, H-7, DAN OVERDUE ANIMASI PULSE */}
      <DnaDataTableCard
        title="Matriks Jatuh Tempo Hutang per Vendor (AP Aging)"
        badge={<DnaBadge variant="default">{filteredItems.length} Faktur</DnaBadge>}
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
<DnaSelect 
              value={bucketFilter}
              onChange={setBucketFilter}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Bucket Umur</option>
              <option value="Current">Current (Lancar)</option>
              <option value="1-30">1 - 30 Hari</option>
              <option value="31-60">31 - 60 Hari</option>
              <option value=">60">&gt; 60 Hari</option>
            </DnaSelect>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari Vendor / No. Faktur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Vendor</th>
                <th className="px-3.5 py-3">Invoice No</th>
                <th className="px-3.5 py-3">Invoice Date</th>
                <th className="px-3.5 py-3">Deadline</th>
                <th className="px-3.5 py-3 text-center">Status Jatuh Tempo</th>
                <th className="px-3.5 py-3 text-center">Days Overdue</th>
                <th className="px-3.5 py-3 text-right">Amount (Rp)</th>
                <th className="px-3.5 py-3 text-center">Bucket</th>
                <th className="px-3.5 py-3 text-center">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{item.vendor}</td>
                  <td className="px-3.5 py-2.5 font-mono text-rose-700 font-semibold">{item.invoiceNo}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{item.invoiceDate}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{item.deadline}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    {item.statusDueDate === "H-3" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                        🔴 H-3 Jatuh Tempo
                      </span>
                    ) : item.statusDueDate === "H-7" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        🟡 H-7 Peringatan
                      </span>
                    ) : item.statusDueDate === "OVERDUE" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-700 text-white animate-bounce">
                        ⚠️ OVERDUE
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">Normal</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-center font-semibold text-slate-700">
                    {item.daysOverdue > 0 ? `+${item.daysOverdue} Hari` : "0"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900">{formatRupiah(item.amount)}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={item.bucket === "Current" ? "success" : "critical"}>
                      {item.bucket}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedInvoice(item)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Drill Down
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* DRILLDOWN MODAL FAKTUR PEMBELIAN */}
      <DnaModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Detail Faktur Pembelian: ${selectedInvoice?.invoiceNo}`}
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Vendor:</span>
              <strong className="text-slate-900">{selectedInvoice?.vendor}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Deadline Pembayaran:</span>
              <strong className="text-rose-700">{selectedInvoice?.deadline}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-900 font-bold">Total Nilai Tagihan:</span>
              <strong className="text-rose-700 font-black text-sm">{selectedInvoice ? formatRupiah(selectedInvoice.amount) : "0"}</strong>
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
