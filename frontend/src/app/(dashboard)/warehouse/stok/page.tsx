"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/dna/StatCard";
import { DataCard } from "@/components/dna/DataCard";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { DnaBadge } from "@/components/dna/DnaBadge";
import {
  Package,
  ClipboardCheck,
  SlidersHorizontal,
  Map,
  Box,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  BadgeDollarSign,
  TrendingDown,
  Warehouse,
  ShieldCheck,
  Search,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StokPage() {
  const [tab, setTab] = useState("stok");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");

  const { data: catalog, isLoading: catalogLoading } = useQuery({
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
    queryFn: async () => {
      const res = await api.get("/warehouse/opname");
      return res.data;
    },
  });

  const { data: adjustments } = useQuery({
    queryKey: ["warehouse-adjustments-stok"],
    queryFn: async () => {
      const res = await api.get("/warehouse/adjustments");
      return res.data;
    },
  });

  const totalValuation = catalog?.reduce((acc: number, item: any) => {
    const price = item.valuations?.[0]?.movingAveragePrice || Number(item.unitPrice);
    return acc + (Number(item.stockQty) * price);
  }, 0) || 0;

  const criticalItems = catalog?.filter((item: any) => Number(item.stockQty) <= Number(item.minLevel)).length || 0;

  return (
    <DashboardShell title="Stok" titleAccent="Gudang" subtitle="Stock Inventory, Opname, Adjustment & Warehouse Map Terminal">
      <Tabs value={tab} onValueChange={setTab} className="space-y-8">
        <TabsList className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-14 w-fit">
          <TabsTrigger value="stok" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <Package className="w-4 h-4" /> Stok
          </TabsTrigger>
          <TabsTrigger value="opname" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <ClipboardCheck className="w-4 h-4" /> Stok Opname
          </TabsTrigger>
          <TabsTrigger value="adjustment" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Penyesuaian Stok
          </TabsTrigger>
          <TabsTrigger value="map" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <Map className="w-4 h-4" /> Peta Gudang
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stok" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total SKU" value={catalog?.length || 0} subValue="Active Materials" icon={<Box />} />
            <StatCard label="Total Valuation" value={`Rp ${(totalValuation / 1000000).toFixed(1)}M`} subValue="Inventory Value" icon={<BadgeDollarSign />} />
            <StatCard label="Stok Kritis" value={criticalItems} subValue="Below Min Level" icon={<AlertTriangle />} />
            <StatCard label="Unique Categories" value={String(new Set(catalog?.map((i: any) => i.category?.name).filter(Boolean)).size || 0)} subValue="Material Types" icon={<Package />} />
          </div>

          <Card className="bg-white border-slate-200 p-4 rounded-[1.5rem] mb-6 flex gap-4 items-center shadow-sm">
            <Warehouse className="w-4 h-4 text-slate-400" />
            <Select value={warehouseFilter} onValueChange={(v) => v && setWarehouseFilter(v)}>
              <SelectTrigger className="w-64 bg-slate-50 border-slate-200 rounded-xl h-[46px] text-[10px] font-black uppercase italic tracking-widest">
                <SelectValue placeholder="Semua Gudang" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="ALL">Semua Gudang</SelectItem>
                {(warehouses as any[])?.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Min Level</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Valuation</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catalogLoading ? (
                    <tr>
                      <td colSpan={6} className="h-32 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 opacity-20" />
                      </td>
                    </tr>
                  ) : catalog?.map((item: any) => {
                    const isCritical = Number(item.stockQty) <= Number(item.minLevel);
                    const hpp = item.valuations?.[0]?.movingAveragePrice || Number(item.unitPrice);
                    return (
                      <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs uppercase",
                              isCritical ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                            )}>
                              {item.code?.substring(0, 2) || 'MT'}
                            </div>
                            <div>
                              <p className="text-[11px] font-black uppercase">{item.name}</p>
                              <p className="text-[9px] font-bold text-slate-400">{item.code} • {item.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <DnaBadge status="default">{item.category?.name || 'Uncategorized'}</DnaBadge>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={cn(
                            "text-sm font-black tabular",
                            isCritical ? "text-rose-600" : "text-slate-900"
                          )}>
                            {Number(item.stockQty).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center text-sm font-bold text-slate-400 tabular">{Number(item.minLevel).toLocaleString()}</td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-black text-emerald-600">Rp {hpp.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              isCritical ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                            )} />
                            <span className={cn(
                              "text-[10px] font-black uppercase",
                              isCritical ? "text-rose-600" : "text-emerald-600"
                            )}>
                              {isCritical ? 'KRITIS' : 'OPTIMAL'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!catalogLoading && (!catalog || catalog.length === 0) && (
                    <tr>
                      <td colSpan={6} className="h-32 text-center text-slate-400 text-xs font-bold uppercase italic">No catalog items found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </TabsContent>

        <TabsContent value="opname" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Sessions" value={String(opnames?.length || 0)} subValue="All Audit Sessions" icon={<ClipboardCheck />} />
            <StatCard label="Completed" value={String(opnames?.filter((s: any) => s.status === 'COMPLETED').length || 0)} subValue="Synced & Verified" icon={<ShieldCheck />} />
            <StatCard label="Draft / Pending" value={String(opnames?.filter((s: any) => s.status === 'DRAFT').length || 0)} subValue="Awaiting Auth" icon={<Clock />} />
            <StatCard label="Warehouses" value={String(new Set(opnames?.map((s: any) => s.warehouse?.name).filter(Boolean)).size || 0)} subValue="Audited Nodes" icon={<Warehouse />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {opnames?.map((session: any) => {
              const isDraft = session.status === 'DRAFT';
              const totalDiff = session.items?.reduce((sum: number, i: any) => sum + Number(i.difference || 0), 0) || 0;
              return (
                <Card key={session.id} className={cn(
                  "bento-card overflow-hidden group transition-all duration-500",
                  isDraft ? "bg-brand-black text-white border-amber-500/20" : "bg-white border-slate-100"
                )}>
                  <div className="p-8 space-y-8">
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:-rotate-12 shadow-xl",
                        isDraft ? "bg-amber-500 text-brand-black shadow-amber-500/20" : "bg-slate-50 text-slate-300"
                      )}>
                        {isDraft ? <ClipboardCheck className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6 text-emerald-500" />}
                      </div>
                      <DnaBadge status={isDraft ? 'warning' : 'success'}>{session.status}</DnaBadge>
                    </div>
                    <div>
                      <h3 className={cn("text-xl font-black italic uppercase tracking-tighter", isDraft ? "text-white" : "text-brand-black")}>
                        {session.warehouse?.name || 'Unknown'}
                      </h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">
                        {session.opnameNumber || session.id} • {session.createdAt?.split('T')[0] || '-'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={cn("p-4 rounded-2xl border", isDraft ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100")}>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Items</p>
                        <p className={cn("text-lg font-black tabular", isDraft ? "text-white" : "text-brand-black")}>{session.items?.length || 0}</p>
                      </div>
                      <div className={cn("p-4 rounded-2xl border", isDraft ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100")}>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Variance</p>
                        <p className={cn("text-lg font-black tabular", totalDiff < 0 ? "text-rose-500" : totalDiff > 0 ? "text-emerald-500" : "text-slate-400")}>
                          {totalDiff > 0 ? '+' : ''}{totalDiff}
                        </p>
                      </div>
                    </div>
                    {isDraft && (
                      <div className="h-12 flex items-center justify-center bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest italic">AWAITING AUTHORIZATION</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
            {(!opnames || opnames.length === 0) && (
              <div className="col-span-3 h-32 flex items-center justify-center text-slate-400 text-xs font-bold uppercase italic">No opname sessions found</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="adjustment" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Adjustments" value={String(adjustments?.length || 0)} subValue="All Records" icon={<SlidersHorizontal />} />
            <StatCard label="Approved" value={String(adjustments?.filter((a: any) => a.status === 'APPROVED').length || 0)} subValue="Applied" icon={<CheckCircle2 />} />
            <StatCard label="Pending" value={String(adjustments?.filter((a: any) => a.status === 'PENDING').length || 0)} subValue="Awaiting Review" icon={<Clock />} />
            <StatCard label="SKU Adjusted" value={String(adjustments?.reduce((s: number, a: any) => s + (a.items?.length || 0), 0) || 0)} subValue="Total Lines" icon={<Package />} />
          </div>

          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Adjustment #</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adjustments?.map((adj: any) => (
                    <tr key={adj.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-5">
                        <span className="text-[11px] font-black uppercase italic">{adj.adjustmentNumber || adj.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-600">{adj.type || 'MANUAL'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-[10px] font-black tabular">{adj.items?.length || 0}</td>
                      <td className="px-6 py-5 text-center">
                        <DnaBadge status={adj.status === 'APPROVED' ? 'success' : adj.status === 'PENDING' ? 'warning' : 'default'}>{adj.status}</DnaBadge>
                      </td>
                      <td className="px-6 py-5 text-right text-[10px] font-bold text-slate-400">{adj.createdAt?.split('T')[0] || '-'}</td>
                    </tr>
                  ))}
                  {(!adjustments || adjustments.length === 0) && (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-slate-400 text-xs font-bold uppercase italic">No adjustment records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </TabsContent>

        <TabsContent value="map" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Warehouse Zones" value="4" subValue="Active Layout" icon={<Warehouse />} />
            <StatCard label="Total Racks" value="24" subValue="Storage Units" icon={<Package />} />
            <StatCard label="Capacity Util" value="78%" subValue="Current Load" icon={<Map />} />
          </div>

          <Card className="bento-card overflow-hidden bg-white">
            <div className="p-10 text-center">
              <div className="h-64 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                <Map className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-black uppercase italic text-slate-400">Peta Gudang</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Interactive warehouse map will be rendered here</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
