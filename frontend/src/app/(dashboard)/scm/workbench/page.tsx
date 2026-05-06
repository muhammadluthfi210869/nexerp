"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  Filter,
  Layers,
  Container,
  ArrowUpRight,
  Activity,
  Droplets,
  Box,
  Tag,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  Scale,
  Zap,
  ShoppingCart,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// --- Types ---
interface DashStats {
  cards: {
    inventory: { accuracy: number; totalSku: number; criticalStock: number; insight: string };
    procurement: { leadTime: number; supplierPerf: number; savingPercent: number; insight: string };
    warehouse: { putawaySpeed: string; fulfillment: number; returnRate: number; insight: string };
    logistics: { shippingPerUnit: number; damageRate: string; otd: number; insight: string };
  };
  tables: {
    reconciliation: any[];
    procurementTracker: any[];
    expirationWatch: any[];
    workOrders: any[];
    perfRaw: any[];
    perfPack: any[];
    perfBox: any[];
    perfLabel: any[];
  };
  procurementSuggestions: Array<{
    materialId: string;
    name: string;
    type: string;
    currentStock: number;
    reorderPoint: number;
    suggestedSupplier: string;
    expectedOtd: number;
    priority: 'URGENT' | 'MEDIUM' | 'LOW';
    suggestedQty: number;
    commitmentsBreakdown: any[];
  }>;
  categories: any[];
  highFrequency: {
    raw: any[];
    pack: any[];
    box: any[];
    label: any[];
  };
}

export default function ScmWorkbenchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWO, setSelectedWO] = useState<any | null>(null);
  const [viewingCommitment, setViewingCommitment] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const initPurchaseMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const res = await api.post("/scm/purchase-orders/initialize", { materialId });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`PO Created: ${data.poNumber}`, {
        description: `Draft PO created for ${data.supplier?.name || 'Vendor'}. Go to Purchase Orders to finalize.`
      });
      queryClient.invalidateQueries({ queryKey: ["scm-dashboard-stats"] });
    },
    onError: (err: any) => {
      toast.error("Initialization Failed", {
        description: err.response?.data?.message || "Check vendor linkage for this material."
      });
    }
  });

  const { data: dashboard, isLoading: statsLoading } = useQuery<DashStats>({
    queryKey: ["scm-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/scm/dashboard");
      return res.data;
    },
  });

  const { data: workOrders, isLoading: woLoading } = useQuery<any[]>({
    queryKey: ["scm-active-work-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/work-orders/active");
      return res.data;
    },
  });

  const formatIDR = (val: number) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)} M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(0)} Jt`;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val);
  };

  const filteredWOs = workOrders?.filter(wo => 
    wo.woNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.lead.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (statsLoading || woLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-base">
        <div className="h-20 w-20 border-4 border-brand-orange/10 border-t-brand-orange rounded-full animate-spin shadow-2xl" />
        <p className="text-text-muted font-heading font-black text-xs uppercase tracking-[0.5em] animate-pulse">Warping to SCM Command Center...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-12 bg-base min-h-screen">
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center mb-8">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-black uppercase">
              Supply Chain <span className="text-primary">Command</span>
            </h1>
            <p className="text-audit-label mt-2">
              Live Inventory Intelligence • Performance Audit V4.0
            </p>
         </div>
         <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-border shadow-sm">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Protocol: Nominal</span>
         </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bento-card p-6 bento-card-hover">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-rose-500 border border-slate-100">
                <Package className="h-5 w-5" />
              </div>
              <h4 className="text-audit-label uppercase tracking-tighter">Inventory Health</h4>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Stock Accuracy</p>
              <h2 className="text-3xl font-bold text-brand-black tracking-tight">{dashboard?.cards.inventory.accuracy}%</h2>
            </div>
            <div className="pt-4 border-t border-slate-50 flex justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400">TOTAL SKU</p>
                <p className="text-sm font-bold text-brand-black">{dashboard?.cards.inventory.totalSku}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400">CRITICAL</p>
                <p className="text-sm font-bold text-rose-500">{dashboard?.cards.inventory.criticalStock}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bento-card p-6 bento-card-hover">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary border border-slate-100">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <h4 className="text-audit-label uppercase tracking-tighter">Procurement Effy</h4>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Lead Time (Avg)</p>
              <h2 className="text-3xl font-bold text-brand-black tracking-tight">{dashboard?.cards.procurement.leadTime} Days</h2>
            </div>
            <div className="pt-4 border-t border-slate-50 flex justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400">SUPPLIER SCORE</p>
                <p className="text-sm font-bold text-brand-black">{dashboard?.cards.procurement.supplierPerf}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400">SAVINGS %</p>
                <p className="text-sm font-bold text-emerald-500">{dashboard?.cards.procurement.savingPercent}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bento-card p-6 bento-card-hover">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-500 border border-slate-100">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="text-audit-label uppercase tracking-tighter">Warehouse Ops</h4>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fulfillment Rate</p>
              <h2 className="text-3xl font-bold text-brand-black tracking-tight">{dashboard?.cards.warehouse.fulfillment}%</h2>
            </div>
            <div className="pt-4 border-t border-slate-50 flex justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400">SPEED</p>
                <p className="text-sm font-bold text-brand-black">{dashboard?.cards.warehouse.putawaySpeed}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400">RETURNS</p>
                <p className="text-sm font-bold text-rose-500">{dashboard?.cards.warehouse.returnRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bento-card p-6 bento-card-hover bg-slate-900">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-sm">
                <Truck className="h-5 w-5" />
              </div>
              <h4 className="text-audit-label text-white/60">LOGISTICS OTD</h4>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-2">
            <h2 className="text-5xl font-black text-white italic tracking-tighter">{dashboard?.cards.logistics.otd}%</h2>
            <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-2">Distribution Status: Stable</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="bento-heading pl-4 border-l-4 border-primary">II. SCM-PRODUCTION BRIDGE</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {dashboard?.categories.map((cat, i) => (
            <div key={i} className="bento-card p-6 bento-card-hover">
              <div className="flex justify-between items-start mb-6">
                <p className="text-audit-label">{i+1}. {cat.name}</p>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">SCORE</p>
                  <p className={cn("text-2xl font-bold leading-none", cat.score > 90 ? "text-emerald-500" : "text-rose-500")}>{cat.score}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-6">
                 <div className={cn("w-2 h-2 rounded-full", cat.score > 85 ? "bg-emerald-500" : "bg-rose-500")} />
                 <span className="text-[10px] font-bold uppercase text-brand-black tracking-wider">{cat.score > 85 ? "STABLE" : "DELAY_RISK"}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-1 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                 <div><p className="text-[8px] font-bold text-slate-400 mb-1">FAST</p><p className="text-xs font-bold text-emerald-500">{cat.fast}</p></div>
                 <div><p className="text-[8px] font-bold text-slate-400 mb-1">REG</p><p className="text-xs font-bold text-primary">{cat.reg}</p></div>
                 <div><p className="text-[8px] font-bold text-slate-400 mb-1">LATE</p><p className="text-xs font-bold text-rose-500">{cat.late}</p></div>
                 <div><p className="text-[8px] font-bold text-slate-400 mb-1">OUT</p><p className="text-xs font-bold text-brand-black">{cat.out}</p></div>
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                 <p className="text-[11px] font-bold text-brand-black tracking-tight">{cat.ready}% READY</p>
                 <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", i===1 ? "bg-brand-orange" : "bg-emerald-500")} style={{ width: `${cat.ready}%` }} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bento-card overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search active pipeline..." 
              className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-primary font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
             <Badge variant="secondary" className="px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-slate-600">
                {workOrders?.length} ACTIVE PIPELINE
             </Badge>
          </div>
        </div>
        <div className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 px-6 text-audit-label">Work Order / Product</TableHead>
                <TableHead className="py-4 text-audit-label text-center">Target Qty</TableHead>
                <TableHead className="py-4 text-audit-label">BO Status (Gap)</TableHead>
                <TableHead className="py-4 text-audit-label text-center">PO Tracking</TableHead>
                <TableHead className="py-4 text-audit-label">Impact</TableHead>
                <TableHead className="py-4 text-right pr-6 text-audit-label">Supplier Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {dashboard?.tables.workOrders.map((wo) => {
                  const isReady = wo.boStatus === 'READY';
                  return (
                    <TableRow key={wo.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer border-slate-50">
                      <TableCell className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-brand-black uppercase tracking-tight">{wo.product}</span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Active Pipeline</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-bold text-brand-black">{wo.targetQty.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">PCS</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <div className={cn("w-1.5 h-1.5 rounded-full", wo.gap > 0 ? "bg-rose-500" : "bg-emerald-500")} />
                           <span className={cn("text-[11px] font-bold uppercase", wo.gap > 0 ? "text-rose-500" : "text-emerald-500")}>
                             {wo.gap > 0 ? `MISSING ${wo.gap} UNITS` : 'READY'}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <div className="flex flex-col items-center">
                            <p className="text-xs font-bold text-primary uppercase">{wo.poStatus}</p>
                            {wo.estArrival && (
                              <p className="text-[9px] font-medium text-slate-400 uppercase mt-1">
                                EST. {new Date(wo.estArrival).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
                              </p>
                            )}
                         </div>
                      </TableCell>
                      <TableCell>
                         <Badge className={cn("px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider border-none", isReady ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                            {isReady ? 'BUFFER_OK' : 'DELAY_RISK'}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         <span className="text-sm font-bold text-brand-black">{wo.supplierScore}</span>
                         <span className="text-[10px] font-bold text-slate-300 ml-1">/ 5</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

      <div className="space-y-8">
        <h3 className="bento-heading pl-4 border-l-4 border-primary">IV. SMART PROCUREMENT RECOMMENDATIONS</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboard?.procurementSuggestions.slice(0, 6).map((rec, i) => (
             <div key={i} className="bento-card p-6 bento-card-hover">
                <div className="flex justify-between items-start mb-6">
                   <Badge variant={rec.priority === 'URGENT' ? 'destructive' : 'secondary'} className="px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider">
                      {rec.priority} PRIORITY
                   </Badge>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">STOCK: {rec.currentStock}</span>
                </div>
                <div className="space-y-6">
                   <div>
                      <h4 className="text-xl font-bold text-brand-black tracking-tight">{rec.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{rec.type}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-50">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">SUPPLIER</p>
                        <p className="text-sm font-bold text-primary">{rec.suggestedSupplier}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">OTD EXP.</p>
                        <p className="text-sm font-bold text-emerald-500">{rec.expectedOtd}%</p>
                      </div>
                   </div>
                   <Button 
                      onClick={() => initPurchaseMutation.mutate(rec.materialId)}
                      disabled={initPurchaseMutation.isPending}
                      className="w-full bg-brand-black text-white hover:bg-primary rounded-xl h-12 font-bold text-[10px] uppercase tracking-tight transition-all disabled:opacity-50"
                   >
                      {initPurchaseMutation.isPending ? "INITIALIZING..." : "INITIALIZE PURCHASE"}
                   </Button>
                   <button 
                      onClick={() => setViewingCommitment(rec)}
                      className="w-full mt-3 text-[9px] font-black uppercase text-slate-400 hover:text-primary transition-colors tracking-widest"
                   >
                      VIEW GLOBAL SUMMARY BREAKDOWN
                   </button>
                </div>
             </div>
          ))}
        </div>
      </div>

      {/* GLOBAL SUMMARY TABLE - THE AGGREGATOR */}
      <div className="space-y-8 pt-8">
        <h3 className="bento-heading pl-4 border-l-4 border-brand-orange">V. CONSOLIDATED PROCUREMENT SUMMARY (GLOBAL)</h3>
        <Card className="bento-card overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase text-white/40">Material Item</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase text-white/40 text-center">Net Requirement</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase text-white/40 text-center">Status / Gap</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase text-white/40">Consolidated From (Projects)</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase text-white/40 text-right pr-8">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard?.procurementSuggestions.map((rec, i) => (
                <TableRow key={i} className="hover:bg-slate-50 transition-colors border-slate-50">
                  <td className="py-6 px-8">
                    <p className="text-sm font-black text-slate-900 uppercase">{rec.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{rec.type} • Stock: {rec.currentStock}</p>
                  </td>
                  <td className="py-6 text-center">
                    <div className="inline-flex flex-col items-center">
                       <span className="text-xl font-black text-slate-900">{rec.suggestedQty.toLocaleString()}</span>
                       <span className="text-[8px] font-black text-slate-300 uppercase">REQUIRED TOTAL</span>
                    </div>
                  </td>
                  <td className="py-6 text-center">
                    <div className={cn(
                      "inline-flex flex-col items-center px-4 py-2 rounded-xl",
                      rec.currentStock < rec.suggestedQty ? "bg-rose-500/10 text-rose-600 border border-rose-200" : "bg-emerald-500/10 text-emerald-600 border border-emerald-200"
                    )}>
                       <span className="text-sm font-black uppercase">
                         {rec.currentStock < rec.suggestedQty ? `-${(rec.suggestedQty - rec.currentStock).toLocaleString()}` : "SURPLUS"}
                       </span>
                       <span className="text-[8px] font-black uppercase opacity-60">GAP INDICATOR</span>
                    </div>
                  </td>
                  <td className="py-6">
                    <div className="flex -space-x-3 overflow-hidden">
                      {(rec as any).commitmentsBreakdown?.slice(0, 5).map((cb: any, idx: number) => (
                        <div key={idx} className={cn("inline-block h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-black", 
                          idx % 2 === 0 ? "bg-primary text-white" : "bg-slate-900 text-white"
                        )} title={`${cb.woNumber} - ${cb.clientName}`}>
                          {cb.clientName[0]}
                        </div>
                      ))}
                      {(rec as any).commitmentsBreakdown?.length > 5 && (
                        <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 text-[10px] font-black text-slate-400">
                          +{(rec as any).commitmentsBreakdown.length - 5}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 text-right pr-8">
                    <Button 
                      onClick={() => initPurchaseMutation.mutate(rec.materialId)}
                      variant="outline"
                      className="border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white rounded-xl h-10 px-6 font-black text-[9px] uppercase tracking-tighter"
                    >
                      CONSOLIDATE & ORDER
                    </Button>
                  </td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Sheet open={!!viewingCommitment} onOpenChange={(open) => !open && setViewingCommitment(null)}>
        <SheetContent className="sm:max-w-2xl p-0 border-none bg-base rounded-l-3xl overflow-hidden shadow-2xl">
           <SheetHeader className="p-10 bg-slate-900 text-white">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                    <Layers className="h-6 w-6 text-brand-orange" />
                 </div>
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">COMMITMENT AUDIT</h2>
              </div>
              <SheetTitle className="text-4xl font-black text-white uppercase italic leading-none">{viewingCommitment?.name}</SheetTitle>
              <SheetDescription className="text-white/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-4">
                 DETAILED AGGREGATION FROM ACTIVE SALES ORDERS
              </SheetDescription>
           </SheetHeader>
           
           <div className="p-10 space-y-8 overflow-y-auto max-h-[calc(100vh-250px)]">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total Aggregated Needs</p>
                    <p className="text-3xl font-black text-slate-900">{viewingCommitment?.suggestedQty.toLocaleString()}</p>
                 </div>
                 <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Affected Projects</p>
                    <p className="text-3xl font-black text-brand-orange">{viewingCommitment?.commitmentsBreakdown?.length || 0}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">INDIVIDUAL DEMAND SOURCE</h4>
                 {viewingCommitment?.commitmentsBreakdown?.map((cb: any, idx: number) => (
                    <div key={idx} className="p-6 rounded-3xl bg-white border border-slate-100 flex justify-between items-center hover:border-primary transition-all group">
                       <div>
                          <p className="text-xs font-black text-slate-900 uppercase italic group-hover:text-primary transition-colors">{cb.clientName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                            WO: {cb.woNumber} • FORMULA: <span className="text-primary">{cb.formulaCode}</span>
                          </p>
                          <p className="text-[8px] font-medium text-slate-400 uppercase mt-0.5">
                            PKG: {cb.packagingDetail} • TARGET: {new Date(cb.targetCompletion).toLocaleDateString()}
                          </p>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-black text-slate-900">{cb.qtyNeeded.toLocaleString()}</p>
                          <Badge className={cn("text-[8px] font-black border-none", cb.isHighValue ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400")}>
                             {cb.isHighValue ? "VVIP PRIORITY" : "STANDARD"}
                          </Badge>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </SheetContent>
      </Sheet>

      <div className="space-y-8 pt-8">
         <h3 className="bento-heading pl-4 border-l-4 border-emerald-500">V. VELOCITY & DEMAND AUDIT</h3>
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* TOP 10 RAW */}
         <div className="bento-card overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
               <div className="w-8 h-8 rounded-lg bg-white border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
                  <Droplets className="h-4 w-4" />
               </div>
               <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-black">RAW MATERIAL FREQUENCY</h4>
            </div>
            <div className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                   <TableRow className="hover:bg-transparent">
                     <TableHead className="text-[9px] font-bold text-slate-400 pl-6 uppercase tracking-tight">Material</TableHead>
                     <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-tight text-center">Freq</TableHead>
                     <TableHead className="text-[9px] font-bold text-slate-400 text-right pr-6 uppercase tracking-tight">Turnover</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {dashboard?.highFrequency.raw.map((item, i) => (
                      <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                         <TableCell className="pl-6 py-4">
                            <span className="text-[11px] font-bold text-brand-black">{item.name}</span>
                         </TableCell>
                         <TableCell className="text-center text-[11px] font-bold text-primary uppercase">{item.freq}</TableCell>
                         <TableCell className="text-right pr-6 text-[10px] font-bold text-slate-400 uppercase">{item.turnover}</TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </div>
         </div>

         {/* TOP 10 PACKAGING */}
         <div className="bento-card overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
               <div className="w-8 h-8 rounded-lg bg-white border border-brand-orange/10 flex items-center justify-center text-brand-orange shadow-sm">
                  <Box className="h-4 w-4" />
               </div>
               <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-black">PACKAGING FREQUENCY</h4>
            </div>
            <div className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                   <TableRow className="hover:bg-transparent">
                     <TableHead className="text-[9px] font-bold text-slate-400 pl-6 uppercase tracking-tight">Material</TableHead>
                     <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-tight text-center">Freq</TableHead>
                     <TableHead className="text-[9px] font-bold text-slate-400 text-right pr-6 uppercase tracking-tight">Turnover</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {dashboard?.highFrequency.pack.map((item, i) => (
                      <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                         <TableCell className="pl-6 py-4">
                            <span className="text-[11px] font-bold text-brand-black">{item.name}</span>
                         </TableCell>
                         <TableCell className="text-center text-[11px] font-bold text-primary uppercase">{item.freq}</TableCell>
                         <TableCell className="text-right pr-6 text-[10px] font-bold text-slate-400 uppercase">{item.turnover}</TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </div>
         </div>

         {/* TOP 5 BOX */}
         <div className="bento-card overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
               <div className="w-8 h-8 rounded-lg bg-white border border-brand-blue/10 flex items-center justify-center text-brand-blue shadow-sm">
                  <Package className="h-4 w-4" />
               </div>
               <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-black">BOX & CRATES AUDIT</h4>
            </div>
            <div className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                   <TableRow className="hover:bg-transparent">
                     <TableHead className="text-[9px] font-bold text-slate-400 pl-6 uppercase tracking-tight">Box Type</TableHead>
                     <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-tight text-center">Freq</TableHead>
                     <TableHead className="text-[9px] font-bold text-slate-400 text-right pr-6 uppercase tracking-tight">Usage</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {dashboard?.highFrequency.box.map((item, i) => (
                      <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                         <TableCell className="pl-6 py-4">
                            <span className="text-[11px] font-bold text-brand-black">{item.name}</span>
                         </TableCell>
                         <TableCell className="text-center text-[11px] font-bold text-primary uppercase">{item.freq}</TableCell>
                         <TableCell className="text-right pr-6 text-[11px] font-bold text-brand-black">{item.consumption}</TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </div>
         </div>

         {/* TOP 5 LABEL */}
         <div className="bento-card overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
               <div className="w-8 h-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm">
                  <Tag className="h-4 w-4" />
               </div>
               <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-black">LABEL ACCURACY AUDIT</h4>
            </div>
            <div className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                   <TableRow className="hover:bg-transparent">
                     <TableHead className="text-[9px] font-bold text-slate-400 pl-6 uppercase tracking-tight">Label</TableHead>
                     <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-tight text-center">Freq</TableHead>
                     <TableHead className="text-[9px] font-bold text-slate-400 text-right pr-6 uppercase tracking-tight">Usage</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {dashboard?.highFrequency.label.map((item, i) => (
                      <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                         <TableCell className="pl-6 py-4">
                            <span className="text-[11px] font-bold text-brand-black">{item.name}</span>
                         </TableCell>
                         <TableCell className="text-center text-[11px] font-bold text-primary uppercase">{item.freq}</TableCell>
                         <TableCell className="text-right pr-6 text-[11px] font-bold text-brand-black">{item.consumption}</TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </div>
         </div>
      </div>
    </div>

      <div className="space-y-8 pt-8">
         <div className="flex items-center gap-3 ml-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="text-audit-label uppercase">VI. SUPPLIER PERFORMANCE AUDIT (QUALITY & CONTINUITY)</h2>
         </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: 'A. RAW MATERIAL PERFORMANCE', icon: Droplets, color: 'text-rose-500', badge: 'OTD FOCUS', data: dashboard?.tables.perfRaw },
            { title: 'B. PACKAGING PERFORMANCE', icon: Box, color: 'text-brand-orange', badge: 'MOQ AUDIT', data: dashboard?.tables.perfPack },
            { title: 'C. BOX PERFORMANCE', icon: Package, color: 'text-brand-blue', badge: 'CAPACITY AUDIT', data: dashboard?.tables.perfBox },
            { title: 'D. LABEL PERFORMANCE', icon: Tag, color: 'text-emerald-500', badge: 'ACCURACY FOCUS', data: dashboard?.tables.perfLabel }
          ].map((table, idx) => (
            <div key={idx} className="bento-card overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                 <div className="flex items-center gap-4">
                   <div className={cn("w-10 h-10 rounded-xl bg-white border flex items-center justify-center shadow-sm", table.color)}>
                     <table.icon className="h-5 w-5" />
                   </div>
                   <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-black">{table.title}</h4>
                 </div>
                 <Badge variant="outline" className="text-[9px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider border-slate-200">{table.badge}</Badge>
              </div>
              <div className="p-0">
                 <Table>
                   <TableHeader className="bg-slate-50/50">
                     <TableRow className="border-none">
                       <TableHead className="text-audit-label pl-10 py-6">Supplier</TableHead>
                       <TableHead className="text-audit-label text-center py-6">Volume</TableHead>
                       <TableHead className="text-audit-label text-center py-6">OTD %</TableHead>
                       <TableHead className="text-audit-label text-right pr-10 py-6">Risk Audit</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody className="divide-y divide-slate-50">
                      {table.data?.map((s, i) => (
                        <TableRow key={i} className="hover:bg-slate-50/50 transition-colors border-none">
                           <TableCell className="pl-10 py-5 text-sm font-bold text-brand-black uppercase">{s.supplier}</TableCell>
                           <TableCell className="text-center text-[11px] font-bold text-slate-400">{s.volume.toLocaleString()}</TableCell>
                           <TableCell className="text-center font-bold text-emerald-600 text-sm">{s.otd}%</TableCell>
                           <TableCell className="text-right pr-10">
                              <span className={cn("px-3 py-1 rounded-lg text-[9px] font-bold uppercase border", 
                                s.risk === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                              )}>
                                {s.risk}
                              </span>
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                 </Table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Sheet open={!!selectedWO} onOpenChange={(open) => !open && setSelectedWO(null)}>
        <SheetContent className="sm:max-w-2xl p-0 border-none bg-base rounded-l-3xl overflow-hidden shadow-2xl">
          <SheetHeader className="p-10 bg-brand-black text-white space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xl">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-3xl font-bold text-white uppercase tracking-tight">Readiness Analysis</SheetTitle>
              <SheetDescription className="text-white/40 font-bold uppercase text-[10px] tracking-tight mt-2">
                WO: {selectedWO?.woNumber} • CLIENT: {selectedWO?.lead.clientName}
              </SheetDescription>
            </div>
          </SheetHeader>
          
          <div className="p-10 space-y-10 overflow-y-auto max-h-[calc(100vh-280px)]">
            <div className="space-y-6">
              <h4 className="text-audit-label flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Material Bill Breakdown (The Gap)
              </h4>
              <div className="space-y-4">
                {selectedWO?.readinessDetails.map((detail: any, idx: number) => (
                  <div key={idx} className="bento-card p-6 space-y-6 bento-card-hover group">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-brand-black uppercase tracking-tight group-hover:text-primary transition-colors">{detail.materialName}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Domestic Warehouse Protocol</span>
                      </div>
                      <span className={cn("px-3 py-1 rounded-lg text-[9px] font-bold uppercase border", 
                        detail.status === 'READY' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      )}>
                        {detail.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-50">
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mb-1">Required</p>
                        <p className="font-bold text-brand-black text-lg">{detail.totalRequired}</p>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mb-1">Available</p>
                        <p className="font-bold text-brand-black text-lg">{detail.actualStock}</p>
                      </div>
                      <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-center">
                        <p className="text-[8px] font-bold text-rose-500 uppercase tracking-tight mb-1">Shortage</p>
                        <p className="font-bold text-rose-600 text-lg">-{detail.shortage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedWO?.materialReadiness === 'SHORTAGE' && (
              <div className="p-10 rounded-2xl bg-rose-600 text-white flex flex-col items-center text-center gap-4 shadow-xl">
                <AlertCircle className="h-10 w-10 text-white" />
                <div className="space-y-2">
                  <h5 className="text-2xl font-bold uppercase tracking-tight">Production Halt Required</h5>
                  <p className="text-[10px] font-bold text-rose-100 uppercase tracking-tight opacity-80 max-w-xs">
                    The supply chain protocol forbids start initialization until all backorders are verified.
                  </p>
                </div>
                <Button className="w-full bg-white text-rose-600 hover:bg-brand-black hover:text-white font-bold text-[10px] uppercase h-14 rounded-xl tracking-tight mt-4 transition-all">
                   CREATE EMERGENCY PURCHASE REQ
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

