"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaCell,
  formatRupiah,
} from "@/components/dna";
import { Clock, AlertTriangle, AlertCircle, CheckCircle2, FileSpreadsheet, Building2 } from "lucide-react";

interface ArAgingEntry {
  id: string;
  invoiceNo: string;
  customerName: string;
  brandName: string;
  invoiceDate: string;
  dueDate: string;
  daysToDue: number; // negatif = lewat jatuh tempo
  currentAmount: number;
  bucket1_30: number;
  bucket31_60: number;
  bucket61_90: number;
  bucketOver90: number;
  totalOutstanding: number;
}

const SAMPLE_AR_AGING: ArAgingEntry[] = [
  { id: "ar-1", invoiceNo: "INV-202609-0012", customerName: "PT Aura Makmur Kosmetika", brandName: "Aura Glow", invoiceDate: "2026-08-20", dueDate: "2026-09-10", daysToDue: 2, currentAmount: 185000000, bucket1_30: 0, bucket31_60: 0, bucket61_90: 0, bucketOver90: 0, totalOutstanding: 185000000 },
  { id: "ar-2", invoiceNo: "INV-202609-0018", customerName: "CV Derma Medika", brandName: "Derma Pure", invoiceDate: "2026-08-15", dueDate: "2026-09-14", daysToDue: 6, currentAmount: 62000000, bucket1_30: 0, bucket31_60: 0, bucket61_90: 0, bucketOver90: 0, totalOutstanding: 62000000 },
  { id: "ar-3", invoiceNo: "INV-202608-0099", customerName: "PT Aroma Nirwana", brandName: "Conscentra", invoiceDate: "2026-07-25", dueDate: "2026-08-25", daysToDue: -14, currentAmount: 0, bucket1_30: 45000000, bucket31_60: 0, bucket61_90: 0, bucketOver90: 0, totalOutstanding: 45000000 },
  { id: "ar-4", invoiceNo: "INV-202607-0045", customerName: "CV Herbal Alami", brandName: "Botanical Herbs", invoiceDate: "2026-06-20", dueDate: "2026-07-20", daysToDue: -50, currentAmount: 0, bucket1_30: 0, bucket31_60: 28000000, bucket61_90: 0, bucketOver90: 0, totalOutstanding: 28000000 },
];

export default function ArAgingReportPage() {
  const [entries, setEntries] = useState<ArAgingEntry[]>(SAMPLE_AR_AGING);
  const [search, setSearch] = useState("");

  const totalOutstanding = entries.reduce((acc, e) => acc + e.totalOutstanding, 0);
  const totalH3 = entries.filter((e) => e.daysToDue > 0 && e.daysToDue <= 3).reduce((acc, e) => acc + e.totalOutstanding, 0);
  const totalH7 = entries.filter((e) => e.daysToDue > 3 && e.daysToDue <= 7).reduce((acc, e) => acc + e.totalOutstanding, 0);
  const totalOverdue = entries.filter((e) => e.daysToDue < 0).reduce((acc, e) => acc + e.totalOutstanding, 0);

  const bankGiroBalance = 1250000000; // Saldo bank di navbar (Poin 12)

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Penuaan Piutang Usaha (AR Aging Report)"
        subtitle="Analisis penagihan piutang per pelanggan dengan pewarnaan jatuh tempo H-3 merah, H-7 kuning (Poin 10-12, 30)"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Laporan AR Aging" }]}
        actions={
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[12px] flex items-center space-x-1.5 text-blue-700">
              <Building2 className="h-4 w-4" />
              <span>Saldo Bank Kas: <strong>{formatRupiah(bankGiroBalance)}</strong></span>
            </div>
            <DnaButton variant="secondary" onClick={() => alert("Laporan AR Aging (.xlsx) berhasil diekspor.")}>
              <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Ekspor Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Piutang Usaha (AR)"
          value={formatRupiah(totalOutstanding)}
          variant="blue"
          delta={{ value: "Konsolidasi Seluruh Brand", isPositive: true }}
        />
        <DnaStatCard
          label="🚨 Kritis: Jatuh Tempo H-3"
          value={formatRupiah(totalH3)}
          variant="danger"
          icon={<AlertCircle className="h-4 w-4" />}
          delta={{ value: "Segera Konfirmasi Pembayaran", isPositive: false }}
        />
        <DnaStatCard
          label="⚠️ Peringatan: Jatuh Tempo H-7"
          value={formatRupiah(totalH7)}
          variant="amber"
          icon={<Clock className="h-4 w-4" />}
          delta={{ value: "Pemberitahuan Invoice Dikirim", isPositive: true }}
        />
        <DnaStatCard
          label="Overdue (Lewat Jatuh Tempo)"
          value={formatRupiah(totalOverdue)}
          variant="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
          delta={{ value: "Masuk Tim Collections", isPositive: false }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        searchPlaceholder="Cari nama brand, nomor faktur, atau customer..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-3 py-3">No. Faktur AR</th>
                <th className="px-3 py-3">Brand & Klien</th>
                <th className="px-3 py-3">Tgl Jatuh Tempo</th>
                <th className="px-3 py-3 text-right">Belum Jatuh Tempo</th>
                <th className="px-3 py-3 text-right">1 - 30 Hari</th>
                <th className="px-3 py-3 text-right">31 - 60 Hari</th>
                <th className="px-3 py-3 text-right">&gt; 90 Hari</th>
                <th className="px-3 py-3 text-right font-bold">Total Piutang</th>
                <th className="px-3 py-3 text-center">Status Jatuh Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {entries.map((e) => {
                const isOverdue = e.daysToDue < 0;
                const isH3 = e.daysToDue > 0 && e.daysToDue <= 3;
                const isH7 = e.daysToDue > 3 && e.daysToDue <= 7;

                return (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-3">
                      <DnaCell.Code value={e.invoiceNo} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-900">{e.brandName}</div>
                      <div className="text-[11px] text-slate-400">{e.customerName}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{e.dueDate}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-700">
                      {e.currentAmount > 0 ? formatRupiah(e.currentAmount) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-amber-700">
                      {e.bucket1_30 > 0 ? formatRupiah(e.bucket1_30) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-rose-700">
                      {e.bucket31_60 > 0 ? formatRupiah(e.bucket31_60) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-rose-900 font-bold">
                      {e.bucketOver90 > 0 ? formatRupiah(e.bucketOver90) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(e.totalOutstanding)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {isOverdue && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          Lewat {Math.abs(e.daysToDue)} Hari
                        </span>
                      )}
                      {isH3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          H-3 Merah
                        </span>
                      )}
                      {isH7 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          H-7 Kuning
                        </span>
                      )}
                      {!isOverdue && !isH3 && !isH7 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Lancar
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
