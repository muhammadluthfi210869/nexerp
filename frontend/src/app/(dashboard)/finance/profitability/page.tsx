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
import { DollarSign, TrendingUp, Users, PackageCheck, Award } from "lucide-react";

interface CustomerProfitability {
  id: string;
  customerCode: string;
  brandName: string;
  companyName: string;
  contractType: "JASA_MAKLON" | "JUAL_PUTUS";
  totalRevenue: number;
  materialCogs: number;
  laborOverheadCogs: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPct: number;
  orderCount: number;
}

const SAMPLE_PROFITABILITY: CustomerProfitability[] = [
  { id: "p-1", customerCode: "CUST-001", brandName: "Aura Glow Beauty", companyName: "PT Aura Makmur Kosmetika", contractType: "JASA_MAKLON", totalRevenue: 850000000, materialCogs: 420000000, laborOverheadCogs: 110000000, totalCogs: 530000000, grossProfit: 320000000, grossMarginPct: 37.6, orderCount: 8 },
  { id: "p-2", customerCode: "CUST-002", brandName: "Derma Pure Skin", companyName: "CV Derma Medika", contractType: "JASA_MAKLON", totalRevenue: 620000000, materialCogs: 310000000, laborOverheadCogs: 85000000, totalCogs: 395000000, grossProfit: 225000000, grossMarginPct: 36.3, orderCount: 5 },
  { id: "p-3", customerCode: "CUST-003", brandName: "Conscentra Parfumerie", companyName: "PT Aroma Nirwana", contractType: "JUAL_PUTUS", totalRevenue: 450000000, materialCogs: 210000000, laborOverheadCogs: 60000000, totalCogs: 270000000, grossProfit: 180000000, grossMarginPct: 40.0, orderCount: 4 },
  { id: "p-4", customerCode: "CUST-004", brandName: "Botanical Herbs", companyName: "CV Herbal Alami Indonesia", contractType: "JASA_MAKLON", totalRevenue: 280000000, materialCogs: 165000000, laborOverheadCogs: 42000000, totalCogs: 207000000, grossProfit: 73000000, grossMarginPct: 26.1, orderCount: 2 },
];

export default function CustomerProfitabilityPage() {
  const [data, setData] = useState<CustomerProfitability[]>(SAMPLE_PROFITABILITY);
  const [search, setSearch] = useState("");

  const totalRev = data.reduce((acc, d) => acc + d.totalRevenue, 0);
  const totalCogs = data.reduce((acc, d) => acc + d.totalCogs, 0);
  const totalProfit = totalRev - totalCogs;
  const avgMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Profitabilitas Pelanggan & Produk Maklon"
        subtitle="Analisis perolehan margin laba kotor per brand owner dan efisiensi penyerapan beban COGS riil"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Profitability" }]}
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Pendapatan Maklon"
          value={formatRupiah(totalRev)}
          variant="blue"
          icon={<DollarSign className="h-4 w-4" />}
          delta={{ value: "Pendapatan Riil Diakui", isPositive: true }}
        />
        <DnaStatCard
          label="Total Beban Pokok (COGS)"
          value={formatRupiah(totalCogs)}
          variant="amber"
          icon={<PackageCheck className="h-4 w-4" />}
          delta={{ value: "Material + Upah + Overhead", isPositive: false }}
        />
        <DnaStatCard
          label="Laba Kotor Bersih (Gross Profit)"
          value={formatRupiah(totalProfit)}
          variant="emerald"
          icon={<TrendingUp className="h-4 w-4" />}
          delta={{ value: "Kontribusi Margin Pabrik", isPositive: true }}
        />
        <DnaStatCard
          label="Rata-rata Margin Laba Kotor"
          value={`${avgMargin.toFixed(1)}%`}
          variant="slate"
          icon={<Award className="h-4 w-4" />}
          delta={{ value: "Target Minimal > 30%", isPositive: avgMargin >= 30 }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        searchPlaceholder="Cari brand owner, kode customer, atau nama PT..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Brand & Klien</th>
                <th className="px-4 py-3">Tipe Kontrak</th>
                <th className="px-4 py-3 text-center">Jumlah SO</th>
                <th className="px-4 py-3 text-right">Total Pendapatan</th>
                <th className="px-4 py-3 text-right">Bahan Terpakai</th>
                <th className="px-4 py-3 text-right">Upah & Overhead</th>
                <th className="px-4 py-3 text-right">Laba Kotor</th>
                <th className="px-4 py-3 text-center">Gross Margin (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{d.brandName}</div>
                    <div className="text-[11px] text-slate-400">
                      {d.customerCode} • {d.companyName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <DnaBadge variant={d.contractType === "JASA_MAKLON" ? "blue" : "emerald"}>
                      {d.contractType === "JASA_MAKLON" ? "Jasa Maklon" : "Jual Putus"}
                    </DnaBadge>
                  </td>
                  <td className="px-4 py-3 text-center font-mono">{d.orderCount} Order</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                    {formatRupiah(d.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    {formatRupiah(d.materialCogs)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    {formatRupiah(d.laborOverheadCogs)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                    {formatRupiah(d.grossProfit)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        d.grossMarginPct >= 35
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {d.grossMarginPct}%
                    </span>
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
