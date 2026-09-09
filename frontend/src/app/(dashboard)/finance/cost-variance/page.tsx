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
import { Scale, AlertTriangle, TrendingDown, CheckCircle2, FileSpreadsheet } from "lucide-react";

interface CostVarianceBatch {
  id: string;
  batchNumber: string;
  productName: string;
  brandName: string;
  plannedQty: number;
  actualYieldQty: number;
  standardBomCost: number;
  actualProductionCost: number;
  varianceAmount: number;
  variancePercentage: number;
  mainCause: string;
}

const SAMPLE_VARIANCES: CostVarianceBatch[] = [
  { id: "cv-1", batchNumber: "BCH-202609-001", productName: "Day Cream SPF 30 (50gr)", brandName: "Aura Glow", plannedQty: 5000, actualYieldQty: 4920, standardBomCost: 62500000, actualProductionCost: 64200000, varianceAmount: 1700000, variancePercentage: 2.7, mainCause: "Penyusutan ruahan mixing saat transfer ke hopper filling" },
  { id: "cv-2", batchNumber: "BCH-202609-002", productName: "Facial Wash Tea Tree (100ml)", brandName: "Derma Pure", plannedQty: 10000, actualYieldQty: 10050, standardBomCost: 95000000, actualProductionCost: 93800000, varianceAmount: -1200000, variancePercentage: -1.3, mainCause: "Efisiensi pengisian cairan viscous (Favorable)" },
  { id: "cv-3", batchNumber: "BCH-202609-003", productName: "Extrait De Parfum Noctivus (30ml)", brandName: "Conscentra", plannedQty: 2000, actualYieldQty: 1980, standardBomCost: 48000000, actualProductionCost: 48900000, varianceAmount: 900000, variancePercentage: 1.9, mainCause: "Reject kemasan botol kaca pecah saat sealing pump" },
];

export default function CostVariancePage() {
  const [batches, setBatches] = useState<CostVarianceBatch[]>(SAMPLE_VARIANCES);
  const [search, setSearch] = useState("");

  const totalStd = batches.reduce((acc, b) => acc + b.standardBomCost, 0);
  const totalAct = batches.reduce((acc, b) => acc + b.actualProductionCost, 0);
  const netVariance = totalAct - totalStd;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Analisis Variansi Biaya Produksi (Cost Variance)"
        subtitle="Evaluasi selisih antara HPP Standar Formula BOM vs Biaya Aktual Realisasi Lantai Pabrik"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Cost Variance" }]}
        actions={
          <DnaButton variant="secondary" onClick={() => alert("Ekspor laporan variansi (.xlsx) berhasil disiapkan.")}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Ekspor Analisis Variansi
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Biaya Standar (BOM)"
          value={formatRupiah(totalStd)}
          variant="blue"
          icon={<Scale className="h-4 w-4" />}
          delta={{ value: "Ekspektasi Formula Lab", isPositive: true }}
        />
        <DnaStatCard
          label="Total Biaya Aktual Riil"
          value={formatRupiah(totalAct)}
          variant="amber"
          icon={<TrendingDown className="h-4 w-4" />}
          delta={{ value: "Konsumsi Material + Upah", isPositive: false }}
        />
        <DnaStatCard
          label="Net Variansi Biaya"
          value={formatRupiah(Math.abs(netVariance))}
          variant={netVariance <= 0 ? "emerald" : "danger"}
          icon={<AlertTriangle className="h-4 w-4" />}
          delta={{ value: netVariance <= 0 ? "Favorable (Hemat)" : "Unfavorable (Over)", isPositive: netVariance <= 0 }}
        />
        <DnaStatCard
          label="Deviasi Rata-rata"
          value={`${((netVariance / totalStd) * 100).toFixed(2)}%`}
          variant="slate"
          delta={{ value: "Dalam Ambang Batas Toleransi ±3%", isPositive: true }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        searchPlaceholder="Cari nomor batch, produk kosmetik, atau brand owner..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">No. Batch Produksi</th>
                <th className="px-4 py-3">Produk & Brand</th>
                <th className="px-4 py-3 text-right">Target vs Hasil Riil</th>
                <th className="px-4 py-3 text-right">HPP Standar (BOM)</th>
                <th className="px-4 py-3 text-right">HPP Aktual Riil</th>
                <th className="px-4 py-3 text-right">Selisih Variansi</th>
                <th className="px-4 py-3">Penyebab Utama Variansi</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <DnaCell.Code value={b.batchNumber} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{b.productName}</div>
                    <div className="text-[11px] text-slate-400">{b.brandName}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <div className="text-slate-900 font-medium">{b.actualYieldQty.toLocaleString()} Pcs</div>
                    <div className="text-[11px] text-slate-400">Plan: {b.plannedQty.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {formatRupiah(b.standardBomCost)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                    {formatRupiah(b.actualProductionCost)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">
                    <span className={b.varianceAmount <= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {b.varianceAmount <= 0 ? "-" : "+"}{formatRupiah(Math.abs(b.varianceAmount))}
                      <span className="text-[10px] block font-normal">({b.variancePercentage}%)</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={b.mainCause}>
                    {b.mainCause}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DnaBadge variant={b.varianceAmount <= 0 ? "emerald" : b.variancePercentage < 3 ? "amber" : "danger"}>
                      {b.varianceAmount <= 0 ? "Efisien" : b.variancePercentage < 3 ? "Toleransi" : "Investigasi"}
                    </DnaBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
