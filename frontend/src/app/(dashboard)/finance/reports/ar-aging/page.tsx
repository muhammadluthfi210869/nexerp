"use client";

import React, { useState } from "react";
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
  Mail,
  Send
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
  customerName: string;
  invoiceNo: string;
  dueDate: string;
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  daysOver90: number;
  totalDue: number;
  status: "CURRENT" | "OVERDUE" | "CRITICAL";
}

const FALLBACK_AR: ArAgingItem[] = [
  { id: "1", customerName: "PT Aura Kosmetika Cantik", invoiceNo: "INV-2608-019", dueDate: "2026-09-20", current: 350000000, days1_30: 0, days31_60: 0, days61_90: 0, daysOver90: 0, totalDue: 350000000, status: "CURRENT" },
  { id: "2", customerName: "CV Glow Derma Skincare", invoiceNo: "INV-2608-005", dueDate: "2026-08-30", current: 0, days1_30: 180000000, days31_60: 0, days61_90: 0, daysOver90: 0, totalDue: 180000000, status: "OVERDUE" },
  { id: "3", customerName: "PT Natural Herbal Nusantara", invoiceNo: "INV-2607-042", dueDate: "2026-07-25", current: 0, days1_30: 0, days31_60: 220000000, days61_90: 0, daysOver90: 0, totalDue: 220000000, status: "OVERDUE" },
  { id: "4", customerName: "Klinik Estetika Dr. Vina", invoiceNo: "INV-2606-012", dueDate: "2026-06-15", current: 0, days1_30: 0, days31_60: 0, days61_90: 150000000, daysOver90: 0, totalDue: 150000000, status: "CRITICAL" },
  { id: "5", customerName: "UD Cantik Berseri Makmur", invoiceNo: "INV-2605-001", dueDate: "2026-05-10", current: 0, days1_30: 0, days31_60: 0, days61_90: 0, daysOver90: 100000000, totalDue: 100000000, status: "CRITICAL" },
];

export default function ArAgingReportPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<ArAgingItem | null>(null);

  const totalCurrent = FALLBACK_AR.reduce((acc, r) => acc + r.current, 0);
  const total1_30 = FALLBACK_AR.reduce((acc, r) => acc + r.days1_30, 0);
  const total31_60 = FALLBACK_AR.reduce((acc, r) => acc + r.days31_60, 0);
  const total61_90 = FALLBACK_AR.reduce((acc, r) => acc + r.days61_90, 0);
  const totalOver90 = FALLBACK_AR.reduce((acc, r) => acc + r.daysOver90, 0);
  const grandTotal = FALLBACK_AR.reduce((acc, r) => acc + r.totalDue, 0);

  const handleSendReminder = (customer: string) => {
    toast.success(`Surat Pengingat Jatuh Tempo terkirim ke ${customer}`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Umur Piutang (AR Aging Report)"
        description="Analisis jatuh tempo tagihan pelanggan per rentang waktu (0-30, 31-60, 61-90, >90 hari) untuk kontrol penagihan kas."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Total Overdue: {formatRupiah(grandTotal - totalCurrent)}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting AR Aging ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Piutang Berjalan"
          value={formatRupiah(grandTotal)}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          subtext="Total Piutang Belum Lunas"
          variant="info"
        />
        <DnaStatCard
          label="Lancar (Belum Jatuh Tempo)"
          value={formatRupiah(totalCurrent)}
          icon={<Clock className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Aman", isPositive: true }}
          subtext="Jatuh tempo < 30 hari"
          variant="success"
        />
        <DnaStatCard
          label="Jatuh Tempo (1 - 60 Hari)"
          value={formatRupiah(total1_30 + total31_60)}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Follow Up", isPositive: false }}
          subtext="Perlu Surat Peringatan 1/2"
          variant="warning"
        />
        <DnaStatCard
          label="Kritis (> 60 Hari)"
          value={formatRupiah(total61_90 + totalOver90)}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          delta={{ value: "Koleksi Khusus", isPositive: false }}
          subtext="Risiko Piutang Tak Tertagih"
          variant="critical"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Matriks Umur Piutang per Pelanggan"
        badge={<DnaBadge variant="default">{FALLBACK_AR.length} Pelanggan</DnaBadge>}
        customToolbar={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pelanggan/invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Pelanggan</th>
                <th className="px-3.5 py-3">No. Invoice</th>
                <th className="px-3.5 py-3">Jatuh Tempo</th>
                <th className="px-3.5 py-3 text-right">Lancar</th>
                <th className="px-3.5 py-3 text-right">1-30 Hari</th>
                <th className="px-3.5 py-3 text-right">31-60 Hari</th>
                <th className="px-3.5 py-3 text-right">61-90 Hari</th>
                <th className="px-3.5 py-3 text-right">&gt;90 Hari</th>
                <th className="px-3.5 py-3 text-right">Total Piutang</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FALLBACK_AR.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{item.customerName}</td>
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-semibold">{item.invoiceNo}</td>
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
                  <td className="px-3.5 py-2.5 text-right font-medium text-rose-600">
                    {item.days61_90 > 0 ? formatRupiah(item.days61_90) : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-rose-800 font-bold">
                    {item.daysOver90 > 0 ? formatRupiah(item.daysOver90) : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900">
                    {formatRupiah(item.totalDue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleSendReminder(item.customerName)}
                        title="Kirim Peringatan"
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                <td colSpan={3} className="px-3.5 py-3 text-slate-900 font-black text-right">TOTAL KESELURUHAN:</td>
                <td className="px-3.5 py-3 text-right text-emerald-900 font-extrabold">{formatRupiah(totalCurrent)}</td>
                <td className="px-3.5 py-3 text-right text-amber-900 font-extrabold">{formatRupiah(total1_30)}</td>
                <td className="px-3.5 py-3 text-right text-amber-950 font-extrabold">{formatRupiah(total31_60)}</td>
                <td className="px-3.5 py-3 text-right text-rose-800 font-extrabold">{formatRupiah(total61_90)}</td>
                <td className="px-3.5 py-3 text-right text-rose-950 font-black">{formatRupiah(totalOver90)}</td>
                <td className="px-3.5 py-3 text-right text-slate-950 font-black text-sm">{formatRupiah(grandTotal)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
