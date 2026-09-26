"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
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
import { DnaTable } from "@/components/dna";
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

export default function CostVariancePage() {
  const [search, setSearch] = useState("");

  // 1. Fetch live cost variances
  const { data: rawVariances = [], isLoading } = useQuery<any[]>({
    queryKey: ["finance-cost-variances"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/cost-variances");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch cogs-requests as supplementary source
  const { data: rawCogs = [] } = useQuery<any[]>({
    queryKey: ["finance-cogs-requests-cv"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/cogs-requests");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  const batches: CostVarianceBatch[] = useMemo(() => {
    if (rawVariances.length > 0) {
      return rawVariances.map((v: any) => {
        const std = Number(v.standardCost || 0);
        const act = Number(v.actualCost || 0);
        const varianceAmount = Number(v.varianceAmount || (act - std));
        const variancePercentage = std > 0 ? Number(((varianceAmount / std) * 100).toFixed(1)) : 0;

        return {
          id: v.id,
          batchNumber: v.jobOrderId || v.referenceNumber || v.id.slice(0, 8),
          productName: v.description || v.productName || "Formula Batch",
          brandName: v.brandName || "Maklon",
          plannedQty: Number(v.plannedQty || 1),
          actualYieldQty: Number(v.actualYieldQty || v.plannedQty || 1),
          standardBomCost: std,
          actualProductionCost: act,
          varianceAmount,
          variancePercentage,
          mainCause: v.notes || v.varianceType || "Variansi biaya material & upah",
        };
      });
    }

    if (rawCogs.length > 0) {
      return rawCogs.map((c: any) => {
        const std = Number(c.hppTotal || c.totalCost || c.standardCost || 0);
        const act = Number(c.actualCost || std);
        const diff = act - std;
        const pct = std > 0 ? Number(((diff / std) * 100).toFixed(1)) : 0;

        return {
          id: c.id,
          batchNumber: c.jobOrderNumber || c.id.slice(0, 8),
          productName: c.productName || c.description || "Batch Produksi",
          brandName: c.pelanggan || c.customer || "Klien",
          plannedQty: Number(c.quantity || 1000),
          actualYieldQty: Number(c.quantity || 1000),
          standardBomCost: std,
          actualProductionCost: act,
          varianceAmount: diff,
          variancePercentage: pct,
          mainCause: diff === 0 ? "Sesuai Standar Formulasi" : "Penyesuaian biaya material riil",
        };
      });
    }

    return [];
  }, [rawVariances, rawCogs]);

  const filteredBatches = useMemo(() => {
    return batches.filter(
      (b) =>
        b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.productName.toLowerCase().includes(search.toLowerCase()) ||
        b.brandName.toLowerCase().includes(search.toLowerCase())
    );
  }, [batches, search]);

  const totalStd = filteredBatches.reduce((acc, b) => acc + b.standardBomCost, 0);
  const totalAct = filteredBatches.reduce((acc, b) => acc + b.actualProductionCost, 0);
  const netVariance = totalAct - totalStd;
  const avgDevPct = totalStd > 0 ? ((netVariance / totalStd) * 100).toFixed(2) : "0.00";

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
          value={`${avgDevPct}%`}
          variant="slate"
          delta={{ value: "Ambang Batas Toleransi ±3%", isPositive: Math.abs(Number(avgDevPct)) <= 3 }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        searchPlaceholder="Cari nomor batch, produk kosmetik, atau brand owner..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
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
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Belum ada data variansi biaya produksi pada sistem.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <DnaCell.Code value={b.batchNumber} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{b.productName}</div>
                      <div className="text-[11px] text-slate-400">{b.brandName}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <div className="text-slate-900 font-medium">{b.actualYieldQty.toLocaleString()} Pcs</div>
                      <div className="text-[11px] text-slate-400">Plan: {b.plannedQty.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatRupiah(b.standardBomCost)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                      {formatRupiah(b.actualProductionCost)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold">
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
                ))
              )}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
