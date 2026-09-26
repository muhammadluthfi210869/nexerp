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

export default function CustomerProfitabilityPage() {
  const [search, setSearch] = useState("");

  // 1. Fetch live product profitabilities
  const { data: rawProfitability = [], isLoading } = useQuery<any[]>({
    queryKey: ["finance-product-profitabilities"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/product-profitabilities");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch cogs-requests as supplementary real-time costing source
  const { data: rawCogsRequests = [] } = useQuery<any[]>({
    queryKey: ["finance-cogs-requests-prof"],
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

  const data: CustomerProfitability[] = useMemo(() => {
    if (rawProfitability.length > 0) {
      return rawProfitability.map((p: any) => {
        const totalRevenue = Number(p.revenue || p.totalRevenue || 0);
        const materialCogs = Number(p.materialCost || p.materialCogs || 0);
        const laborOverheadCogs = Number(p.laborCost || p.overheadCost || p.laborOverheadCogs || 0);
        const totalCogs = Number(p.cogs || p.totalCost || materialCogs + laborOverheadCogs);
        const grossProfit = Number(p.grossProfit || (totalRevenue - totalCogs));
        const grossMarginPct = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0;

        return {
          id: p.id,
          customerCode: p.customerCode || p.product?.code || "PROD",
          brandName: p.product?.name || p.brandName || "Produk Maklon",
          companyName: p.customer?.name || p.companyName || "-",
          contractType: (p.contractType || "JASA_MAKLON") as "JASA_MAKLON" | "JUAL_PUTUS",
          totalRevenue,
          materialCogs,
          laborOverheadCogs,
          totalCogs,
          grossProfit,
          grossMarginPct,
          orderCount: Number(p.unitsSold || p.orderCount || 1),
        };
      });
    }

    // Supplementary derive from cogs requests if profitabilities table is still empty
    if (rawCogsRequests.length > 0) {
      return rawCogsRequests.map((req: any) => {
        const totalRevenue = Number(req.totalRevenue || req.priceEstimate || 0);
        const totalCogs = Number(req.totalCost || req.hppTotal || req.standardCost || 0);
        const materialCogs = Number(req.materialCost || totalCogs * 0.7);
        const laborOverheadCogs = totalCogs - materialCogs;
        const grossProfit = totalRevenue - totalCogs;
        const grossMarginPct = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0;

        return {
          id: req.id,
          customerCode: req.jobOrderNumber || req.productCode || "REQ",
          brandName: req.productName || req.description || "Produk Formulasi",
          companyName: req.pelanggan || req.customer || "-",
          contractType: "JASA_MAKLON",
          totalRevenue,
          materialCogs,
          laborOverheadCogs,
          totalCogs,
          grossProfit,
          grossMarginPct,
          orderCount: 1,
        };
      });
    }

    return [];
  }, [rawProfitability, rawCogsRequests]);

  const filteredData = useMemo(() => {
    return data.filter(
      (d) =>
        d.brandName.toLowerCase().includes(search.toLowerCase()) ||
        d.customerCode.toLowerCase().includes(search.toLowerCase()) ||
        d.companyName.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const totalRev = filteredData.reduce((acc, d) => acc + d.totalRevenue, 0);
  const totalCogs = filteredData.reduce((acc, d) => acc + d.totalCogs, 0);
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
          delta={{ value: "Kontribusi Margin Pabrik", isPositive: totalProfit >= 0 }}
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
          <DnaTable className="w-full text-left text-[12px]">
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
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Belum ada data profitabilitas transaksi produk yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredData.map((d) => (
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
                    <td className="px-4 py-3 text-center tabular-nums">{d.orderCount} Order</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                      {formatRupiah(d.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {formatRupiah(d.materialCogs)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {formatRupiah(d.laborOverheadCogs)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                      {formatRupiah(d.grossProfit)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`tabular-nums font-bold px-2 py-0.5 rounded-md text-[11px] ${
                          d.grossMarginPct >= 35
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {d.grossMarginPct}%
                      </span>
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
