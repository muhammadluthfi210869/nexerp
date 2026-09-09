"use client";

import React, { useState } from "react";
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
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface ApAgingItem {
  id: string;
  supplierName: string;
  billNo: string;
  dueDate: string;
  current: number;
  days1_30: number;
  days31_60: number;
  daysOver60: number;
  totalDue: number;
  category: string;
}

const FALLBACK_AP: ApAgingItem[] = [
  { id: "1", supplierName: "PT Bahan Kimia Aktif Nusantara", billNo: "BILL-2609-012", dueDate: "2026-09-25", current: 280000000, days1_30: 0, days31_60: 0, daysOver60: 0, totalDue: 280000000, category: "Bahan Baku" },
  { id: "2", supplierName: "CV Botol & Jar Kemas Lestari", billNo: "BILL-2608-088", dueDate: "2026-09-02", current: 0, days1_30: 160000000, days31_60: 0, daysOver60: 0, totalDue: 160000000, category: "Bahan Kemas" },
  { id: "3", supplierName: "PT Percetakan Box & Folding Karton", billNo: "BILL-2608-041", dueDate: "2026-08-15", current: 0, days1_30: 0, days31_60: 95000000, daysOver60: 0, totalDue: 95000000, category: "Bahan Sekunder" },
  { id: "4", supplierName: "PT Aroma Fragrance Essential", billNo: "BILL-2607-010", dueDate: "2026-07-20", current: 0, days1_30: 0, days31_60: 0, daysOver60: 155000000, totalDue: 155000000, category: "Bahan Baku" },
];

export default function ApAgingReportPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");

  const totalCurrent = FALLBACK_AP.reduce((acc, r) => acc + r.current, 0);
  const total1_30 = FALLBACK_AP.reduce((acc, r) => acc + r.days1_30, 0);
  const total31_60 = FALLBACK_AP.reduce((acc, r) => acc + r.days31_60, 0);
  const totalOver60 = FALLBACK_AP.reduce((acc, r) => acc + r.daysOver60, 0);
  const grandTotal = FALLBACK_AP.reduce((acc, r) => acc + r.totalDue, 0);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Umur Hutang Supplier (AP Aging Report)"
        description="Monitoring jatuh tempo kewajiban pembayaran faktur supplier bahan baku, kemasan, dan pihak ketiga."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Total Kewajiban Hutang: {formatRupiah(grandTotal)}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting AP Aging ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Hutang Supplier"
          value={formatRupiah(grandTotal)}
          icon={<DollarSign className="w-5 h-5 text-rose-600" />}
          subtext="Total Tagihan Supplier Aktif"
          variant="critical"
        />
        <DnaStatCard
          label="Hutang Lancar (Aktif)"
          value={formatRupiah(totalCurrent)}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Jatuh Tempo Normal", isPositive: true }}
          subtext="Belum lewat jatuh tempo"
          variant="success"
        />
        <DnaStatCard
          label="Jatuh Tempo (1 - 30 Hari)"
          value={formatRupiah(total1_30)}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Prioritas Bayar", isPositive: false }}
          subtext="Perlu dijadwalkan Kas Keluar"
          variant="warning"
        />
        <DnaStatCard
          label="Tertunggak (> 30 Hari)"
          value={formatRupiah(total31_60 + totalOver60)}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          delta={{ value: "Urgent Settlement", isPositive: false }}
          subtext="Risiko hold pengiriman bahan"
          variant="critical"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Tagihan Hutang per Supplier"
        badge={<DnaBadge variant="default">{FALLBACK_AP.length} Supplier</DnaBadge>}
        customToolbar={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari supplier/tagihan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Nama Supplier</th>
                <th className="px-3.5 py-3">No. Faktur Beli</th>
                <th className="px-3.5 py-3">Kategori</th>
                <th className="px-3.5 py-3">Jatuh Tempo</th>
                <th className="px-3.5 py-3 text-right">Lancar</th>
                <th className="px-3.5 py-3 text-right">1-30 Hari</th>
                <th className="px-3.5 py-3 text-right">31-60 Hari</th>
                <th className="px-3.5 py-3 text-right">&gt;60 Hari</th>
                <th className="px-3.5 py-3 text-right">Total Hutang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FALLBACK_AP.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{item.supplierName}</td>
                  <td className="px-3.5 py-2.5 font-mono text-rose-700 font-semibold">{item.billNo}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600">{item.dueDate}</td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-emerald-700">
                    {item.current > 0 ? formatRupiah(item.current) : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-amber-700">
                    {item.days1_30 > 0 ? formatRupiah(item.days1_30) : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-amber-800">
                    {item.days31_60 > 0 ? formatRupiah(item.days31_60) : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-rose-800 font-bold">
                    {item.daysOver60 > 0 ? formatRupiah(item.daysOver60) : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900">
                    {formatRupiah(item.totalDue)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                <td colSpan={4} className="px-3.5 py-3 text-slate-900 font-black text-right">TOTAL KESELURUHAN HUTANG:</td>
                <td className="px-3.5 py-3 text-right text-emerald-900 font-extrabold">{formatRupiah(totalCurrent)}</td>
                <td className="px-3.5 py-3 text-right text-amber-900 font-extrabold">{formatRupiah(total1_30)}</td>
                <td className="px-3.5 py-3 text-right text-amber-950 font-extrabold">{formatRupiah(total31_60)}</td>
                <td className="px-3.5 py-3 text-right text-rose-950 font-black">{formatRupiah(totalOver60)}</td>
                <td className="px-3.5 py-3 text-right text-slate-950 font-black text-sm">{formatRupiah(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
