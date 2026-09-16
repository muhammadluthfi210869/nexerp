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
  DnaInput,
  formatRupiah,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { DollarSign, Printer, FileSpreadsheet, Search, Calendar, Eye, CheckCircle2, Clock } from "lucide-react";

interface SalesSummaryItem {
  id: string;
  customer: string;
  contractType: "Jasa Maklon" | "Jual Putus";
  invoiceCount: number;
  totalAmount: number;
  totalReceived: number;
  outstanding: number;
}

const SALES_SUMMARY_DATA: SalesSummaryItem[] = [
  {
    id: "ss-1",
    customer: "PT Cantika Jelita Nusantara",
    contractType: "Jasa Maklon",
    invoiceCount: 4,
    totalAmount: 285000000,
    totalReceived: 211250000,
    outstanding: 73750000
  },
  {
    id: "ss-2",
    customer: "CV Derma Medika",
    contractType: "Jasa Maklon",
    invoiceCount: 2,
    totalAmount: 120000000,
    totalReceived: 58000000,
    outstanding: 62000000
  },
  {
    id: "ss-3",
    customer: "Glow & Shine Co",
    contractType: "Jasa Maklon",
    invoiceCount: 3,
    totalAmount: 195000000,
    totalReceived: 195000000,
    outstanding: 0
  },
  {
    id: "ss-4",
    customer: "Alpha Men Grooming",
    contractType: "Jual Putus",
    invoiceCount: 2,
    totalAmount: 65000000,
    totalReceived: 65000000,
    outstanding: 0
  },
  {
    id: "ss-5",
    customer: "CV Herbal Alami Indonesia",
    contractType: "Jasa Maklon",
    invoiceCount: 1,
    totalAmount: 45000000,
    totalReceived: 0,
    outstanding: 45000000
  }
];

export default function ReportSalesSummaryPage() {
  const [data] = useState<SalesSummaryItem[]>(SALES_SUMMARY_DATA);
  const [search, setSearch] = useState("");
  const [contractTypeFilter, setContractTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-09-30");

  const filtered = data.filter((d) => {
    const matchSearch = d.customer.toLowerCase().includes(search.toLowerCase());
    const matchType = contractTypeFilter === "ALL" || d.contractType === contractTypeFilter;
    return matchSearch && matchType;
  });

  const totalOmzet = filtered.reduce((acc, c) => acc + c.totalAmount, 0);
  const totalReceived = filtered.reduce((acc, c) => acc + c.totalReceived, 0);
  const totalOutstanding = filtered.reduce((acc, c) => acc + c.outstanding, 0);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Rekapitulasi Penjualan (Sales Financial Summary)"
        subtitle="Analisis perbandingan omzet bruto, realisasi penerimaan pembayaran, dan sisa saldo piutang tertagih per pelanggan"
        breadcrumbs={[{ label: "Laporan", href: "/reports" }, { label: "Rekap Penjualan" }]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Cetak Rekap
            </DnaButton>
            <DnaButton variant="secondary" icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Omzet Penjualan"
          value={formatRupiah(totalOmzet)}
          icon={<DollarSign className="w-4 h-4" />}
          delta={{ value: "Bruto Seluruh Faktur", isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Kas Diterima (Realized)"
          value={formatRupiah(totalReceived)}
          icon={<CheckCircle2 className="w-4 h-4" />}
          delta={{ value: `${((totalReceived / (totalOmzet || 1)) * 100).toFixed(1)}% Tertagih`, isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Piutang Outstanding"
          value={formatRupiah(totalOutstanding)}
          icon={<Clock className="w-4 h-4" />}
          delta={{ value: "Menunggu Pelunasan", isPositive: false }}
          variant="danger"
        />
        <DnaStatCard
          label="Jumlah Klien Aktif"
          value={`${filtered.length} Perusahaan`}
          icon={<DollarSign className="w-4 h-4" />}
          delta={{ value: "Kontrak Berjalan", isPositive: true }}
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Rekapitulasi Penjualan per Pelanggan"
        count={filtered.length}
        totalItems={data.length}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-64">
              <DnaInput
                placeholder="Cari nama pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <select
              value={contractTypeFilter}
              onChange={(e) => setContractTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
            >
              <option value="ALL">Semua Tipe Kontrak</option>
              <option value="Jasa Maklon">Jasa Maklon</option>
              <option value="Jual Putus">Jual Putus</option>
            </select>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-0 text-xs p-1 text-slate-700"
              />
              <span className="text-slate-400 font-bold">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-0 text-xs p-1 text-slate-700"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contract Type</th>
                <th className="px-4 py-3 text-center">Jumlah Invoice</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Total Diterima</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{item.customer}</td>
                  <td className="px-4 py-3">
                    <DnaBadge variant={item.contractType === "Jasa Maklon" ? "blue" : "purple"}>
                      {item.contractType}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-semibold">{item.invoiceCount}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(item.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                    {formatRupiah(item.totalReceived)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                    {formatRupiah(item.outstanding)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DnaButton variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                      Detail
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
