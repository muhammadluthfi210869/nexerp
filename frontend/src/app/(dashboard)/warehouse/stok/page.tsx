"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  MetricCard,
  CanonicalMetricGrid,
  DataTable,
  StatusBadge,
} from "@/components/canonical";
import {
  Package,
  ClipboardCheck,
  SlidersHorizontal,
  Map,
  Box,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BadgeDollarSign,
  TrendingDown,
  Warehouse,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatOperationalCurrency, formatOperationalCompactCurrency } from "@/lib/operational-formatters";
import type { ColumnDef } from "@tanstack/react-table";

export default function StokPage() {
  const [tab, setTab] = useState("stok");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");

  const { data: catalog } = useQuery({
    queryKey: ["warehouse-catalog-stok", warehouseFilter],
    queryFn: async () => {
      const params = warehouseFilter !== "ALL" ? { warehouseId: warehouseFilter } : {};
      const res = await api.get("/warehouse/catalog", { params });
      return res.data;
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouse-list-active"],
    queryFn: async () => {
      const res = await api.get("/warehouse/warehouses");
      return res.data || [];
    },
  });

  const { data: opnames } = useQuery({
    queryKey: ["warehouse-opname-stok"],
    queryFn: async () => (await api.get("/warehouse/opname")).data,
  });

  const { data: adjustments } = useQuery({
    queryKey: ["warehouse-adjustments-stok"],
    queryFn: async () => (await api.get("/warehouse/adjustments")).data,
  });

  const totalValuation = (catalog ?? []).reduce((acc: number, item: any) => {
    const rawPrice = item.valuations?.[0]?.movingAveragePrice ?? item.unitPrice;
    const price = Number(rawPrice);
    if (!Number.isFinite(price)) return acc;
    const qty = Number(item.stockQty);
    if (!Number.isFinite(qty)) return acc;
    return acc + qty * price;
  }, 0);

  const criticalItems = (catalog ?? []).filter((item: any) => Number(item.stockQty) <= Number(item.minLevel)).length;
  const skuCount = (catalog ?? []).length;
  const uniqueCategories = new Set((catalog ?? []).map((i: any) => i.category?.name).filter(Boolean)).size;

  const catalogColumns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      id: "material",
      header: "Material",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <p className="font-medium text-slate-900">{item.name}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{item.code} • {item.unit}</p>
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <StatusBadge variant="default">{row.original.category?.name || "Uncategorized"}</StatusBadge>
      ),
    },
    {
      id: "stock",
      header: () => <div className="text-center">Stock</div>,
      cell: ({ row }) => {
        const isCritical = Number(row.original.stockQty) <= Number(row.original.minLevel);
        return (
          <div className="text-center">
            <span className={cn("tabular-nums font-medium", isCritical ? "text-rose-600" : "text-slate-900")}>
              {Number(row.original.stockQty).toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      id: "min",
      header: () => <div className="text-center">Min Level</div>,
      cell: ({ row }) => (
        <span className="tabular-nums text-slate-500 font-medium">{Number(row.original.minLevel).toLocaleString()}</span>
      ),
    },
    {
      id: "valuation",
      header: "Valuation",
      cell: ({ row }) => {
        const rawHpp = row.original.valuations?.[0]?.movingAveragePrice ?? row.original.unitPrice;
        const hpp = rawHpp === null || rawHpp === undefined || rawHpp === "" || !Number.isFinite(Number(rawHpp))
          ? null
          : Number(rawHpp);
        return (
          <span className="text-emerald-600 font-medium">
            {formatOperationalCurrency(hpp)}
          </span>
        );
      },
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const isCritical = Number(row.original.stockQty) <= Number(row.original.minLevel);
        return (
          <div className="text-center">
            <StatusBadge variant={isCritical ? "destructive" : "success"}>
              {isCritical ? "KRITIS" : "OPTIMAL"}
            </StatusBadge>
          </div>
        );
      },
    },
  ], []);

  const opnamesList = opnames ?? [];
  const completedOpnames = opnamesList.filter((s: any) => s.status === "COMPLETED").length;
  const draftOpnames = opnamesList.filter((s: any) => s.status === "DRAFT").length;
  const auditedWarehouses = new Set(opnamesList.map((s: any) => s.warehouse?.name).filter(Boolean)).size;

  const opnameColumns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      id: "warehouse",
      header: "Gudang",
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">{row.original.warehouse?.name || "Unknown"}</span>
      ),
    },
    {
      id: "id",
      header: "ID Opname",
      cell: ({ row }) => (
        <span className="text-slate-700 text-[12px]">{row.original.opnameNumber || row.original.id}</span>
      ),
    },
    {
      id: "date",
      header: () => <div className="text-center">Tanggal</div>,
      cell: ({ row }) => (
        <span className="text-slate-500 text-[12px] tabular-nums">
          {row.original.createdAt?.split("T")[0] || "—"}
        </span>
      ),
    },
    {
      id: "items",
      header: () => <div className="text-right">Items</div>,
      cell: ({ row }) => (
        <span className="tabular-nums font-medium text-slate-900">{row.original.items?.length || 0}</span>
      ),
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <StatusBadge variant={row.original.status === "COMPLETED" ? "success" : "warning"}>
            {row.original.status}
          </StatusBadge>
        </div>
      ),
    },
  ], []);

  const adjustmentsList = adjustments ?? [];
  const approvedAdj = adjustmentsList.filter((a: any) => a.status === "APPROVED").length;
  const pendingAdj = adjustmentsList.filter((a: any) => a.status === "PENDING").length;
  const skuAdjusted = adjustmentsList.reduce((s: number, a: any) => s + (a.items?.length || 0), 0);

  const adjustmentColumns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      id: "no",
      header: "Adjustment #",
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">{row.original.adjustmentNumber || row.original.id}</span>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <TrendingDown className="h-3 w-3 text-slate-400" />
          <span className="text-slate-700 text-[12px]">{row.original.type || "MANUAL"}</span>
        </div>
      ),
    },
    {
      id: "items",
      header: () => <div className="text-center">Items</div>,
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">{row.original.items?.length || 0}</span>
      ),
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <StatusBadge
            variant={row.original.status === "APPROVED" ? "success" : row.original.status === "PENDING" ? "warning" : "default"}
          >
            {row.original.status}
          </StatusBadge>
        </div>
      ),
    },
    {
      id: "date",
      header: () => <div className="text-right">Date</div>,
      cell: ({ row }) => (
        <span className="text-slate-500 text-[12px] tabular-nums">
          {row.original.createdAt?.split("T")[0] || "—"}
        </span>
      ),
    },
  ], []);

  return (
    <DashboardShell title="Stok Gudang" subtitle="Stock Inventory, Opname, Adjustment & Warehouse Map Terminal">
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="h-auto p-1 bg-white border border-[#E2E8F0] rounded-lg w-fit">
          <TabsTrigger value="stok" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium inline-flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Stok
          </TabsTrigger>
          <TabsTrigger value="opname" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium inline-flex items-center gap-2">
            <ClipboardCheck className="w-3.5 h-3.5" /> Stok Opname
          </TabsTrigger>
          <TabsTrigger value="adjustment" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium inline-flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Penyesuaian
          </TabsTrigger>
          <TabsTrigger value="map" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium inline-flex items-center gap-2">
            <Map className="w-3.5 h-3.5" /> Peta Gudang
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stok" className="space-y-4">
          <CanonicalMetricGrid>
            <MetricCard label="Total SKU" value={skuCount} helper="Active Materials" icon={<Box />} variant="info" />
            <MetricCard label="Total Valuation" value={formatOperationalCompactCurrency(totalValuation)} helper="Inventory Value" icon={<BadgeDollarSign />} variant="neutral" />
            <MetricCard label="Stok Kritis" value={criticalItems} helper="Below Min Level" icon={<AlertTriangle />} variant="danger" />
            <MetricCard label="Categories" value={uniqueCategories} helper="Material Types" icon={<Package />} variant="neutral" />
          </CanonicalMetricGrid>

          <DataTable
            title="Material Catalog"
            data={catalog ?? []}
            columns={catalogColumns}
            getRowId={(row) => row.id}
            enableSearch={false}
            emptyMessage="Tidak ada material"
            emptyDescription="Material akan muncul di sini setelah didaftarkan."
            toolbar={
              <Select value={warehouseFilter} onValueChange={(v) => v && setWarehouseFilter(v)}>
                <SelectTrigger className="w-64 bg-slate-50 border-[#E2E8F0] rounded-md h-9 text-[12px] font-medium text-slate-700">
                  <SelectValue placeholder="Semua Gudang" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E2E8F0] text-slate-900">
                  <SelectItem value="ALL">Semua Gudang</SelectItem>
                  {(warehouses as any[])?.map((wh: any) => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
        </TabsContent>

        <TabsContent value="opname" className="space-y-4">
          <CanonicalMetricGrid>
            <MetricCard label="Total Sessions" value={opnamesList.length} helper="All Sessions" icon={<ClipboardCheck />} variant="info" />
            <MetricCard label="Completed" value={completedOpnames} helper="Verified" icon={<ShieldCheck />} variant="success" />
            <MetricCard label="Draft / Pending" value={draftOpnames} helper="Awaiting" icon={<Clock />} variant="warning" />
            <MetricCard label="Warehouses" value={auditedWarehouses} helper="Audited Nodes" icon={<Warehouse />} variant="neutral" />
          </CanonicalMetricGrid>
          <DataTable
            title="Opname Sessions"
            data={opnamesList}
            columns={opnameColumns}
            getRowId={(row) => row.id}
            enableSearch={false}
            emptyMessage="Belum ada opname session"
            emptyDescription="Stock opname sessions akan muncul di sini."
          />
        </TabsContent>

        <TabsContent value="adjustment" className="space-y-4">
          <CanonicalMetricGrid>
            <MetricCard label="Total Adjustments" value={adjustmentsList.length} helper="All Records" icon={<SlidersHorizontal />} variant="info" />
            <MetricCard label="Approved" value={approvedAdj} helper="Applied" icon={<CheckCircle2 />} variant="success" />
            <MetricCard label="Pending" value={pendingAdj} helper="Awaiting" icon={<Clock />} variant="warning" />
            <MetricCard label="SKU Adjusted" value={skuAdjusted} helper="Total Lines" icon={<Package />} variant="neutral" />
          </CanonicalMetricGrid>
          <DataTable
            title="Stock Adjustments"
            data={adjustmentsList}
            columns={adjustmentColumns}
            getRowId={(row) => row.id}
            enableSearch={false}
            emptyMessage="Belum ada adjustment"
            emptyDescription="Penyesuaian stok akan muncul di sini."
          />
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <CanonicalMetricGrid>
            <MetricCard label="Warehouse Zones" value={4} helper="Active Layout" icon={<Warehouse />} variant="info" />
            <MetricCard label="Total Racks" value={24} helper="Storage Units" icon={<Package />} variant="neutral" />
            <MetricCard label="Capacity Util" value="78%" helper="Current Load" icon={<Map />} variant="success" />
          </CanonicalMetricGrid>
          <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#E2E8F0] bg-white p-12">
            <Map className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-[13px] font-medium text-slate-700">Peta Gudang</p>
            <p className="text-[11px] text-slate-400 mt-1">Interactive warehouse map will be rendered here</p>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
