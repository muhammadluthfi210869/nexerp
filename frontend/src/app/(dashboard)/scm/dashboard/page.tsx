"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  Warehouse,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Activity,
  DollarSign,
  Trophy,
  Database,
  Search,
  Plus,
  ArrowRight,
  Layers,
  Container,
  Droplets,
  Box,
  Tag,
  Scale,
  Target,
  ChevronRight,
  Filter,
  PackageX,
  ClipboardCheck,
  FileSearch,
  AlertCircle,
  Loader2,
  MoreVertical,
  Send,
  History,
  Info,
  User,
  Calendar,
  CreditCard,
  Building2,
  X,
  Save,
  ChevronDown,
  Download,
  ArrowLeft,
  MessageSquare,
  Coins,
  ClipboardList,
  FileEdit,
  PackageCheck,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DataCard, TableWrapper, DnaBadge, DnaButton, DnaInput } from "@/components/dna";
import { KpiCard } from "@/components/dna/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";


interface ScmDashboardData {
  cards: {
    inventory: {
      accuracy: number;
      totalSku: number;
      criticalStock: number;
      insight: string;
    };
    procurement: {
      leadTime: number;
      supplierPerf: number;
      savingPercent: number;
      insight: string;
    };
    warehouse: {
      putawaySpeed: string;
      fulfillment: number;
      returnRate: number;
      insight: string;
    };
    logistics: {
      shippingPerUnit: number;
      damageRate: string;
      otd: number;
      insight: string;
    };
  };
  tables: {
    reconciliation: Array<{
      sku: string;
      name: string;
      systemStock: number;
      actualStock: number;
      variance: number;
      lastAudit: string;
      status: string;
    }>;
    procurementTracker: Array<{
      poId: string;
      vendor: string;
      item: string;
      poDate: string;
      recvDate: string;
      leadTime: number;
      quality: string;
    }>;
    expirationWatch: Array<{
      sku: string;
      batch: string;
      expDate: string;
      daysRemaining: number;
      value: number;
      action: string;
    }>;
  };
}

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

export default function ScmDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedWO, setSelectedWO] = useState<any | null>(null);
  const [viewingCommitment, setViewingCommitment] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const { data: dashboard, isLoading } = useQuery<ScmDashboardData>({
    queryKey: ["scm-executive-dashboard"],
    queryFn: async () => {
      const res = await api.get("/scm/dashboard");
      return unwrapResponse(res);
    },
  });

  const { data: dashStats, isLoading: statsLoading } = useQuery<DashStats>({
    queryKey: ["scm-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/scm/dashboard");
      return unwrapResponse(res);
    },
  });

  const { data: workOrders, isLoading: woLoading } = useQuery<any[]>({
    queryKey: ["scm-active-work-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/work-orders/active");
      return unwrapResponse(res);
    },
  });

  const filteredWOs = useMemo(() => {
    return workOrders?.filter(wo => 
      wo.woNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.product.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [workOrders, searchTerm]);

  if (isLoading || statsLoading || woLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-base">
        <div className="h-16 w-16 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Syncing SCM Intelligence...</p>
      </div>
    );
  }

  return (
    <DashboardShell
      title="SUPPLY CHAIN MANAGEMENT"
      titleAccent="(SCM)"
      subtitle="Pusat Komando & Audit Kinerja"
    >
      {/* I. SCM STRATEGIC OVERVIEW (Executive Command) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="STOCK VALUE" value="Rp 6.8 M" targetPct={50} subValue="Total Inventory" icon={<Package className="w-4 h-4" />} />
        <KpiCard label="EXCESS STOCK" value="Rp 450 Jt" targetPct={0} icon={<AlertTriangle className="w-4 h-4" />} />
        <KpiCard label="DEAD STOCK" value="Rp 120 Jt" targetPct={0} icon={<TrendingDown className="w-4 h-4" />} />
        <KpiCard label="TURNOVER DAYS" value="18 DAYS" targetPct={18 <= 30 ? 100 : Math.max(0, 100 - (18 - 30) * 5)} icon={<Clock className="w-4 h-4" />} />
        <KpiCard label="MATERIAL READINESS" value="92%" targetPct={92} icon={<Target className="w-4 h-4" />} />
        <KpiCard label="SHORTAGE" value="5" targetPct={0} icon={<AlertTriangle className="w-4 h-4" />} />
        <KpiCard label="COST VARIANCE" value="+2.4%" targetPct={2.4 <= 3 ? 80 : 40} subValue="Rp 85 Jt Saved" icon={<DollarSign className="w-4 h-4" />} />
        <KpiCard label="ON-TIME PURCHASE" value="88.5%" targetPct={88.5} icon={<Clock className="w-4 h-4" />} />
      </div>

      {/* II. WORK ORDER READINESS */}
      <div className="space-y-8">
        <h3 className="section-label">II. WORK ORDER READINESS (ACTIVE PIPELINE)</h3>
        <TableWrapper
          filters={
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <DnaInput 
                  icon={<Search className="h-4 w-4" />}
                  placeholder="Search active pipeline..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                 <DnaBadge status="default">
                    {workOrders?.length} ACTIVE PIPELINE
                 </DnaBadge>
              </div>
            </div>
          }
        >
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase">Work Order / Product</TableHead>
                <TableHead className="py-4 text-right text-[10px] font-black text-slate-400 uppercase">Target Qty</TableHead>
                <TableHead className="py-4 text-center text-[10px] font-black text-slate-400 uppercase">BO Status (Gap)</TableHead>
                <TableHead className="py-4 text-center text-[10px] font-black text-slate-400 uppercase">PO Tracking</TableHead>
                <TableHead className="py-4 text-center text-[10px] font-black text-slate-400 uppercase">Impact</TableHead>
                <TableHead className="py-4 text-right pr-6 text-[10px] font-black text-slate-400 uppercase">Supplier Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWOs.map((wo) => {
                const isReady = wo.boStatus === 'READY';
                return (
                  <TableRow 
                    key={wo.id} 
                    onClick={() => setSelectedWO(wo)} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer border-slate-50"
                  >
                    <TableCell className="py-5 px-6 text-left">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{wo.product}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">WO: {wo.woNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      <span className="text-sm font-black text-slate-900">{wo.targetQty.toLocaleString()}</span>
                      <span className="text-[10px] font-black text-slate-400 ml-1">PCS</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2">
                         <div className={cn("w-1.5 h-1.5 rounded-full", wo.gap > 0 ? "bg-rose-500" : "bg-emerald-500")} />
                         <span className={cn("text-[11px] font-black uppercase", wo.gap > 0 ? "text-rose-500" : "text-emerald-500")}>
                           {wo.gap > 0 ? `MISSING ${wo.gap} UNITS` : 'READY'}
                         </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex flex-col items-center">
                          <p className="text-xs font-black text-blue-600 uppercase">{wo.poStatus}</p>
                          {wo.estArrival && (
                            <p className="text-[9px] font-medium text-slate-400 uppercase mt-1">
                              EST. {new Date(wo.estArrival).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
                            </p>
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <DnaBadge status={isReady ? "success" : "critical"}>
                          {isReady ? 'BUFFER_OK' : 'DELAY_RISK'}
                       </DnaBadge>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-mono tabular-nums">
                       <span className="text-sm font-black text-slate-900">{wo.supplierScore}</span>
                       <span className="text-[10px] font-black text-slate-300 ml-1">/ 5</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>

      {/* 🤝 III. SCM-PRODUCTION BRIDGE (COMMUNICATION PROTOCOL) */}
      <div className="space-y-6">
        <h2 className="section-label">III. SCM-PRODUCTION BRIDGE (COMMUNICATION PROTOCOL)</h2>
        
        {/* EXECUTIVE CATEGORY VELOCITY CLOUD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: '1. BAHAN BAKU (RAW)', score: '92', status: 'STABLE', pulse: 'bg-emerald-500',
              stats: { fast: 3, ontime: 12, late: 1, pending: 4 },
              arrival: '85% READY', theme: 'bg-rose-500' 
            },
            { 
              label: '2. BAHAN KEMAS (PACK)', score: '78', status: 'DELAYED', pulse: 'bg-rose-500',
              stats: { fast: 0, ontime: 8, late: 5, pending: 2 },
              arrival: '62% READY', theme: 'bg-amber-500' 
            },
            { 
              label: '3. LABEL AUDIT', score: '88', status: 'STABLE', pulse: 'bg-emerald-500',
              stats: { fast: 2, ontime: 18, late: 2, pending: 5 },
              arrival: '92% READY', theme: 'bg-purple-500' 
            },
            { 
              label: '4. BOX & CARDBOARD', score: '98', status: 'FAST', pulse: 'bg-emerald-500',
              stats: { fast: 8, ontime: 15, late: 0, pending: 1 },
              arrival: '98% READY', theme: 'bg-amber-900' 
            }
          ].map((cat, i) => (
            <DataCard key={i} className="relative overflow-hidden py-5 px-5" noShadow={false}>
              <div className={cn("absolute top-0 left-0 w-1 h-full", cat.theme)} />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">{cat.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-sm", cat.pulse)} />
                    <span className="text-[10px] font-black text-slate-900">{cat.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-black text-slate-400 uppercase">SCORE</p>
                  <p className={cn("text-lg font-black tabular", cat.score < '85' ? 'text-rose-500' : 'text-emerald-500')}>{cat.score}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {[
                  { l: 'FAST', v: cat.stats.fast, c: 'text-emerald-500' },
                  { l: 'REG', v: cat.stats.ontime, c: 'text-blue-500' },
                  { l: 'LATE', v: cat.stats.late, c: 'text-rose-500' },
                  { l: 'OUT', v: cat.stats.pending, c: 'text-slate-400' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-1.5 rounded-lg text-center border border-slate-100">
                    <p className="text-[6px] font-black text-slate-400 uppercase">{s.l}</p>
                    <p className={cn("text-[10px] font-black tabular", s.c)}>{s.v}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                 <div className="flex items-center gap-1.5">
                    <Database className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-900 uppercase">{cat.arrival}</span>
                 </div>
                 <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                   <div className={cn("h-full", cat.theme)} style={{ width: cat.arrival.split('%')[0] + '%' }} />
                 </div>
              </div>
            </DataCard>
          ))}
        </div>

        {/* MASSIVE WO TRACKING TABLE */}
        <TableWrapper className="bento-card">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase">WORK ORDER / PRODUCT</TableHead>
                <TableHead className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase">TARGET QTY</TableHead>
                <TableHead className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase">BO STATUS (NEEDS / WH / GAP)</TableHead>
                <TableHead className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase">PO TRACKING (QTY / STATUS)</TableHead>
                <TableHead className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase">EST. ARRIVAL</TableHead>
                <TableHead className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase">IMPACT / ANOMALY</TableHead>
                <TableHead className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase">SUPPLIER SCORE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { wo: 'WO-2024-001', prod: 'Serum Brightening X', target: '50,000 Pcs', needs: '500 Kg', wh: '320 Kg', gap: '180 Kg', poQty: '200 Kg', poStatus: 'IN TRANSIT', eta: '2024-04-05', impact: 'READY', score: '4.8/5' },
                { wo: 'WO-2024-005', prod: 'Acne Cream Night', target: '25,000 Pcs', needs: '125 Kg', wh: '20 Kg', gap: '105 Kg', poQty: '105 Kg', poStatus: 'WAITING DP', eta: '2024-04-12', impact: 'DELAYED', reason: 'Nego Pending', score: '4.2/5' },
                { wo: 'WO-2024-008', prod: 'Body Lotion Ultra', target: '10,000 Pcs', needs: '400 Kg', wh: '450 Kg', gap: '0', poQty: '-', poStatus: 'COMPLETE', eta: '-', impact: 'READY', score: '5.0/5' },
              ].map((row, i) => (
                <TableRow key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                  <TableCell className="px-6 py-4">
                    <p className="text-xs font-black text-slate-900">{row.wo}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase">{row.prod}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center text-xs font-black tabular">{row.target}</TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <p className="text-xs font-black tabular">{row.needs} / {row.wh} / <span className={row.gap !== '0' ? 'text-rose-500' : 'text-emerald-500'}>{row.gap}</span></p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <p className="text-xs font-black text-blue-600 tabular">{row.poQty}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase">{row.poStatus}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center text-[10px] font-black tabular text-slate-500">{row.eta}</TableCell>
                  <TableCell className="px-6 py-4 text-center">
                     <DnaBadge status={row.impact === 'READY' ? 'success' : 'critical'}>
                        {row.impact}
                     </DnaBadge>
                     {row.reason && <p className="text-[8px] text-rose-500 mt-1 font-black italic">{row.reason}</p>}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center text-xs font-black text-slate-900 tabular">{row.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>

      {/* 🔴 IV. MATERIAL MASTER & STOCK AUDIT (UNIFIED REPOSITORY) */}
      <div className="space-y-6">
        <h2 className="section-label">IV. MATERIAL MASTER & STOCK AUDIT (UNIFIED REPOSITORY)</h2>
        <TableWrapper className="bento-card">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase">MATERIAL NAME / TYPE</TableHead>
                <TableHead className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase">STOCK (CURR / RES / AVAIL)</TableHead>
                <TableHead className="py-4 px-6 text-right text-[10px] font-black text-slate-400 uppercase">UNIT PRICE / TOTAL</TableHead>
                <TableHead className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase">LEVELS (MIN / MAX / ROP)</TableHead>
                <TableHead className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase">USAGE / LEAD TIME</TableHead>
                <TableHead className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase">STATUS AUDIT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: 'Niacinamide Alpha', type: 'RAW', cat: 'Chemical', u: 'Kg', curr: '120', res: '80', avail: '40', price: '12.5k', total: '1.5M', levels: '50 / 500 / 100', usage: '5 Kg/d', lt: '14d', status: 'SHORTAGE' },
                { name: 'Retinol Kapsul', type: 'RAW', cat: 'Active', u: 'Kg', curr: '450', res: '50', avail: '400', price: '110k', total: '49.5M', levels: '50 / 800 / 150', usage: '2 Kg/d', lt: '30d', status: 'HEALTHY' },
                { name: 'Botol Serum 30ml', type: 'PACKAGING', cat: 'Glass', u: 'Pcs', curr: '15k', res: '12k', avail: '3k', price: '2.5k', total: '37.5M', levels: '5k / 50k / 10k', usage: '500 Pcs/d', lt: '7d', status: 'SHORTAGE' },
                { name: 'Box Acne Serum', type: 'BOX', cat: 'Printing', u: 'Pcs', curr: '45k', res: '5k', avail: '40k', price: '1.2k', total: '54M', levels: '5k / 40k / 10k', usage: '500 Pcs/d', lt: '5d', status: 'EXCESS' },
                { name: 'Dead Sample Kemasan', type: 'PACKAGING', cat: 'N/A', u: 'Pcs', curr: '120', res: '0', avail: '120', price: '5k', total: '0.6M', levels: '0 / 0 / 0', usage: '0', lt: '-', status: 'DEAD STOCK' },
              ].map((row, i) => (
                <TableRow key={i} className={cn("border-b border-slate-50 hover:bg-slate-50/30 transition-colors", row.status === 'SHORTAGE' && 'bg-rose-50/30')}>
                  <TableCell className="px-6 py-5">
                     <p className="text-xs font-black text-slate-900">{row.name}</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase">{row.type} | {row.cat}</p>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                     <p className="text-xs font-black text-slate-900 tabular">{row.curr} / {row.res} / <span className={row.status === 'SHORTAGE' ? 'text-rose-500' : 'text-emerald-500'}>{row.avail}</span></p>
                     <p className="text-[9px] font-black text-slate-400 uppercase">UNIT: {row.u}</p>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                     <p className="text-xs font-black text-slate-900 tabular">Rp {row.total}</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase">@{row.price} / {row.u}</p>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                     <p className="text-xs font-black text-slate-900 tabular">{row.levels}</p>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                     <p className="text-[11px] font-black text-slate-900 tabular">{row.usage}</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase">Lead: {row.lt}</p>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                     <DnaBadge status={row.status === 'SHORTAGE' ? 'critical' : row.status === 'EXCESS' ? 'warning' : row.status === 'HEALTHY' ? 'success' : 'default'}>
                        {row.status}
                     </DnaBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>

      {/* V. CATEGORY-SPECIFIC PERFORMANCE AUDIT */}
      <div className="space-y-12 py-8">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
          V. CATEGORY-SPECIFIC PERFORMANCE AUDIT
        </h3>

        {/* A. RAW MATERIAL PERFORMANCE */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded-sm" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">A. RAW MATERIAL PERFORMANCE (QUALITY & CONTINUITY)</h4>
           </div>
           <TableWrapper className="bento-card">
              <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                       <TableHead className="py-4 px-5 text-left text-[10px] font-black text-slate-400 uppercase">SUPPLIER / MATERIAL</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">PERIOD</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">VOLUME (QTY/CNT)</TableHead>
                       <TableHead className="py-4 px-5 text-right text-[10px] font-black text-slate-400 uppercase">COST (PRICE/VAR/TOTAL)</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">TIMELINESS (OTD/DELY)</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">QUALITY (REJ/SCR)</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">BATCH REJ RATE</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">RISK AUDIT</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {[
                      { name: 'PT Surya Kimia', mat: 'Niacinamide Alpha', p: 'Monthly', qty: '500 Kg', cnt: '5', price: '12.5k', var: '+2.1%', spend: '125M', otd: '85%', dly: '1', rej: '5Kg', score: '90', brr: '0.5%', risk: 'LOW', critical: true },
                      { name: 'Indo Chemical', mat: 'Retinol Kapsul', p: 'Monthly', qty: '100 Kg', cnt: '2', price: '110k', var: '+5.4%', spend: '11M', otd: '72%', dly: '1', rej: '2Kg', score: '78', brr: '2.0%', risk: 'MEDIUM', critical: true },
                    ].map((row, i) => (
                      <TableRow key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                         <TableCell className="px-5 py-4">
                            <p className="text-xs font-black text-slate-900">{row.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{row.mat} {row.critical && <span className="text-rose-500 font-black italic">(CRITICAL)</span>}</p>
                         </TableCell>
                         <TableCell className="px-5 py-4 text-center text-[11px] font-black tabular text-slate-600">{row.p}</TableCell>
                         <TableCell className="px-5 py-4 text-center">
                            <p className="text-xs font-black tabular">{row.qty}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase">{row.cnt} ORDERS</p>
                         </TableCell>
                         <TableCell className="px-5 py-4 text-right">
                            <p className="text-xs font-black tabular">Rp {row.spend}</p>
                            <p className={cn("text-[9px] font-black uppercase", row.var.includes('+') ? 'text-rose-500' : 'text-emerald-500')}>{row.var} @{row.price}</p>
                         </TableCell>
                         <TableCell className="px-5 py-4 text-center">
                            <p className="text-xs font-black tabular text-slate-900">{row.otd}</p>
                            <p className="text-[9px] font-black text-rose-500 uppercase">{row.dly} DELAYED</p>
                         </TableCell>
                         <TableCell className="px-5 py-4 text-center">
                            <p className="text-xs font-black tabular text-slate-900">{row.score}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase">REJ: {row.rej}</p>
                         </TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular text-amber-600">{row.brr}</TableCell>
                         <TableCell className="px-5 py-4 text-center">
                            <DnaBadge status={row.risk === 'LOW' ? 'success' : 'warning'}>
                               {row.risk}
                            </DnaBadge>
                         </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </TableWrapper>
        </div>

        {/* B. PACKAGING PERFORMANCE */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-sm" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">B. PACKAGING PERFORMANCE (MOQ & OVERSTOCK FOCUS)</h4>
           </div>
           <TableWrapper className="bento-card">
              <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                       <TableHead className="py-4 px-5 text-left text-[10px] font-black text-slate-400 uppercase">SUPPLIER / MATERIAL</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">VOLUME</TableHead>
                       <TableHead className="py-4 px-5 text-right text-[10px] font-black text-slate-400 uppercase">COST AUDIT</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">OTD %</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">MOQ EXCESS</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">USAGE MISMATCH</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">RISK</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {[
                      { name: 'Global Kemasindo', mat: 'Botol Serum 30ml', qty: '10,000 Pcs', spend: '25M', otd: '100%', excess: '1,000', mismatch: '1.2%', risk: 'LOW' },
                      { name: 'Putra Pack', mat: 'Cap Pump White', qty: '15,000 Pcs', spend: '15M', otd: '92%', excess: '2,500', mismatch: '4.8%', risk: 'MEDIUM' },
                    ].map((row, i) => (
                      <TableRow key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                         <TableCell className="px-5 py-4">
                            <p className="text-xs font-black text-slate-900">{row.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{row.mat}</p>
                         </TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular">{row.qty}</TableCell>
                         <TableCell className="px-5 py-4 text-right text-xs font-black tabular">Rp {row.spend}</TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular text-emerald-500">{row.otd}</TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular text-rose-500">{row.excess}</TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular text-amber-600">{row.mismatch}</TableCell>
                         <TableCell className="px-5 py-4 text-center">
                            <DnaBadge status={row.risk === 'LOW' ? 'success' : 'warning'}>
                               {row.risk}
                            </DnaBadge>
                         </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </TableWrapper>
        </div>

        {/* C. BOX PERFORMANCE */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-900 rounded-sm" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">C. BOX PERFORMANCE (VOLUME & COST EFFICIENCY)</h4>
           </div>
           <TableWrapper className="bento-card">
              <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                       <TableHead className="py-4 px-5 text-left text-[10px] font-black text-slate-400 uppercase">SUPPLIER / MATERIAL</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">VOLUME</TableHead>
                       <TableHead className="py-4 px-5 text-right text-[10px] font-black text-slate-400 uppercase">COST PER UNIT</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">SPEND (TOTAL)</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">VOL UTIL %</TableHead>
                       <TableHead className="py-4 px-5 text-right text-[10px] font-black text-slate-400 uppercase">RISK FLAG</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {[
                      { name: 'Sinar Printing', mat: 'Box Acne Serum', qty: '5,000 Pcs', unit: '1.2k', spend: '6M', util: '98%', risk: 'LOW' },
                      { name: 'Berkat Alam', mat: 'Box Master Carton', qty: '1,000 Pcs', unit: '8.5k', spend: '8.5M', util: '95%', risk: 'LOW' },
                    ].map((row, i) => (
                      <TableRow key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                         <TableCell className="px-5 py-4">
                            <p className="text-xs font-black text-slate-900">{row.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{row.mat}</p>
                         </TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular">{row.qty}</TableCell>
                         <TableCell className="px-5 py-4 text-right text-xs font-black tabular">Rp {row.unit}</TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular">Rp {row.spend}</TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular text-blue-600">{row.util}</TableCell>
                         <TableCell className="px-5 py-4 text-right">
                            <DnaBadge status={row.risk === 'LOW' ? 'success' : 'warning'}>
                               {row.risk}
                            </DnaBadge>
                         </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </TableWrapper>
        </div>

        {/* D. LABEL PERFORMANCE */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-sm" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">D. LABEL PERFORMANCE (ACCURACY & REVISION FOCUS)</h4>
           </div>
           <TableWrapper className="bento-card">
              <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                       <TableHead className="py-4 px-5 text-left text-[10px] font-black text-slate-400 uppercase">SUPPLIER / MATERIAL</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">REVISIONS</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">MISPRINT RATE</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">OTD RATE</TableHead>
                       <TableHead className="py-4 px-5 text-center text-[10px] font-black text-slate-400 uppercase">SCORE</TableHead>
                       <TableHead className="py-4 px-5 text-right text-[10px] font-black text-slate-400 uppercase">RISK</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {[
                      { name: 'Sinar Print', mat: 'Label Glow-Up', rev: '2', mis: '2.5%', otd: '80%', score: '75', risk: 'MEDIUM' },
                      { name: 'Labelindo', mat: 'Label Aqua Pure', rev: '0', mis: '0.1%', otd: '100%', score: '98', risk: 'LOW' },
                    ].map((row, i) => (
                      <TableRow key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                         <TableCell className="px-5 py-4">
                            <p className="text-xs font-black text-slate-900">{row.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{row.mat}</p>
                         </TableCell>
                         <TableCell className={cn("px-5 py-4 text-center text-sm font-black tabular", row.rev !== '0' ? 'text-rose-500' : 'text-emerald-500')}>{row.rev}</TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular text-amber-600">{row.mis}</TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular">{row.otd}</TableCell>
                         <TableCell className="px-5 py-4 text-center text-xs font-black tabular text-slate-900">{row.score}</TableCell>
                         <TableCell className="px-5 py-4 text-right">
                            <DnaBadge status={row.risk === 'LOW' ? 'success' : 'warning'}>
                               {row.risk}
                            </DnaBadge>
                         </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </TableWrapper>
        </div>
      </div>

      {/* VI. SMART PROCUREMENT RECOMMENDATIONS */}
      <div className="space-y-8">
        <h3 className="section-label">VI. SMART PROCUREMENT RECOMMENDATIONS</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashStats?.procurementSuggestions.slice(0, 6).map((rec, i) => (
             <DataCard 
                key={i}
                title={`${rec.type}`}
                titleColor="text-slate-400"
             >
                <div className="flex justify-between items-start mb-4 -mt-2">
                   <DnaBadge status={rec.priority === 'URGENT' ? 'critical' : 'default'}>
                      {rec.priority} PRIORITY
                   </DnaBadge>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight font-mono">STOCK: {rec.currentStock}</span>
                </div>
                <div className="space-y-6">
                   <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight">{rec.name}</h4>
                   </div>
                   <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">SUPPLIER</p>
                        <p className="text-sm font-black text-blue-600">{rec.suggestedSupplier}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">OTD EXP.</p>
                        <p className="text-sm font-black text-emerald-500 font-mono tabular-nums">{rec.expectedOtd}%</p>
                      </div>
                   </div>
                   <DnaButton 
                      variant="primary"
                      onClick={() => initPurchaseMutation.mutate(rec.materialId)}
                      disabled={initPurchaseMutation.isPending}
                      className="w-full"
                   >
                      {initPurchaseMutation.isPending ? "INITIALIZING..." : "INITIALIZE PURCHASE"}
                   </DnaButton>
                   <button 
                      onClick={() => setViewingCommitment(rec)}
                      className="w-full mt-2 text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors tracking-widest text-center"
                   >
                      VIEW GLOBAL SUMMARY BREAKDOWN
                   </button>
                </div>
             </DataCard>
          ))}
        </div>
      </div>

      {/* VII. CONSOLIDATED PROCUREMENT SUMMARY */}
      <div className="space-y-8 pt-8">
        <h3 className="section-label">VII. CONSOLIDATED PROCUREMENT SUMMARY (GLOBAL)</h3>
        <TableWrapper>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-6 px-8 text-left text-[10px] font-black uppercase text-slate-400">Material Item</TableHead>
                <TableHead className="py-6 text-right text-[10px] font-black uppercase text-slate-400">Net Requirement</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 text-center">Status / Gap</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 text-center">Consolidated From (Projects)</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 text-right pr-8">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashStats?.procurementSuggestions.map((rec, i) => (
                <TableRow key={i} className="hover:bg-slate-50 transition-colors border-slate-50">
                  <td className="py-6 px-8 text-left">
                    <p className="text-sm font-black text-slate-900 uppercase">{rec.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{rec.type} • Stock: {rec.currentStock}</p>
                  </td>
                  <td className="py-6 text-right font-mono tabular-nums">
                    <div className="inline-flex flex-col items-end">
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
                    <div className="flex justify-center -space-x-3 overflow-hidden">
                      {rec.commitmentsBreakdown?.slice(0, 5).map((cb: any, idx: number) => (
                        <div key={idx} className={cn("inline-block h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-black", 
                          idx % 2 === 0 ? "bg-blue-600 text-white" : "bg-white text-slate-900 border border-slate-200"
                        )} title={`${cb.woNumber} - ${cb.clientName}`}>
                          {cb.clientName[0]}
                        </div>
                      ))}
                      {rec.commitmentsBreakdown?.length > 5 && (
                        <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 text-[10px] font-black text-slate-400">
                          +{rec.commitmentsBreakdown.length - 5}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 text-right pr-8">
                    <DnaButton 
                      variant="outline"
                      size="sm"
                      onClick={() => initPurchaseMutation.mutate(rec.materialId)}
                    >
                      CONSOLIDATE & ORDER
                    </DnaButton>
                  </td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>

      {/* VIII. VELOCITY & DEMAND AUDIT */}
      <div className="space-y-6 pb-20">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
          VIII. VELOCITY & DEMAND AUDIT (TOP 10 HIGH-FREQUENCY)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* RAW MATERIAL */}
          <TableWrapper
            filters={
              <div className="flex items-center gap-3 bg-slate-50/30">
                 <div className="w-8 h-8 rounded-lg bg-white border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
                    <Droplets className="h-4 w-4" />
                 </div>
                 <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">RAW MATERIAL FREQUENCY</h4>
              </div>
            }
          >
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[9px] font-black text-slate-400 pl-6 text-left uppercase tracking-tight">Material</TableHead>
                  <TableHead className="text-[9px] font-black text-slate-400 uppercase tracking-tight text-center">Freq</TableHead>
                  <TableHead className="text-[9px] font-black text-slate-400 text-right pr-6 uppercase tracking-tight">Turnover</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {dashStats?.highFrequency.raw.map((item, i) => (
                   <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 py-4 text-left">
                         <span className="text-[11px] font-black text-slate-900">{item.name}</span>
                      </TableCell>
                      <TableCell className="text-center text-[11px] font-black text-blue-600 uppercase font-mono tabular-nums">{item.freq}</TableCell>
                      <TableCell className="text-right pr-6 text-[10px] font-black text-slate-400 uppercase font-mono tabular-nums">{item.turnover}</TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
          </TableWrapper>

          {/* PACKAGING */}
          <TableWrapper
            filters={
              <div className="flex items-center gap-3 bg-slate-50/30">
                 <div className="w-8 h-8 rounded-lg bg-white border border-orange-600/10 flex items-center justify-center text-orange-600 shadow-sm">
                    <Box className="h-4 w-4" />
                 </div>
                 <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">PACKAGING FREQUENCY</h4>
              </div>
            }
          >
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[9px] font-black text-slate-400 pl-6 text-left uppercase tracking-tight">Material</TableHead>
                  <TableHead className="text-[9px] font-black text-slate-400 uppercase tracking-tight text-center">Freq</TableHead>
                  <TableHead className="text-[9px] font-black text-slate-400 text-right pr-6 uppercase tracking-tight">Turnover</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {dashStats?.highFrequency.pack.map((item, i) => (
                   <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 py-4 text-left">
                         <span className="text-[11px] font-black text-slate-900">{item.name}</span>
                      </TableCell>
                      <TableCell className="text-center text-[11px] font-black text-blue-600 uppercase font-mono tabular-nums">{item.freq}</TableCell>
                      <TableCell className="text-right pr-6 text-[10px] font-black text-slate-400 uppercase font-mono tabular-nums">{item.turnover}</TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
          </TableWrapper>

          {/* BOX & CRATES */}
          <TableWrapper
            filters={
              <div className="flex items-center gap-3 bg-slate-50/30">
                 <div className="w-8 h-8 rounded-lg bg-white border border-blue-600/10 flex items-center justify-center text-blue-600 shadow-sm">
                    <Package className="h-4 w-4" />
                 </div>
                 <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">BOX & CRATES AUDIT</h4>
              </div>
            }
          >
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[9px] font-black text-slate-400 pl-6 text-left uppercase tracking-tight">Box Type</TableHead>
                  <TableHead className="text-[9px] font-black text-slate-400 uppercase tracking-tight text-center">Freq</TableHead>
                  <TableHead className="text-[9px] font-black text-slate-400 text-right pr-6 uppercase tracking-tight">Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {dashStats?.highFrequency.box.map((item, i) => (
                   <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 py-4 text-left">
                         <span className="text-[11px] font-black text-slate-900">{item.name}</span>
                      </TableCell>
                      <TableCell className="text-center text-[11px] font-black text-blue-600 uppercase font-mono tabular-nums">{item.freq}</TableCell>
                      <TableCell className="text-right pr-6 text-[11px] font-black text-slate-900 font-mono tabular-nums">{item.consumption}</TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
          </TableWrapper>

          {/* LABEL */}
          <TableWrapper
            filters={
              <div className="flex items-center gap-3 bg-slate-50/30">
                 <div className="w-8 h-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm">
                    <Tag className="h-4 w-4" />
                 </div>
                 <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">LABEL ACCURACY AUDIT</h4>
              </div>
            }
          >
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[9px] font-black text-slate-400 pl-6 text-left uppercase tracking-tight">Label</TableHead>
                  <TableHead className="text-[9px] font-black text-slate-400 uppercase tracking-tight text-center">Freq</TableHead>
                  <TableHead className="text-[9px] font-black text-slate-400 text-right pr-6 uppercase tracking-tight">Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {dashStats?.highFrequency.label.map((item, i) => (
                   <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 py-4 text-left">
                         <span className="text-[11px] font-black text-slate-900">{item.name}</span>
                      </TableCell>
                      <TableCell className="text-center text-[11px] font-black text-blue-600 uppercase font-mono tabular-nums">{item.freq}</TableCell>
                      <TableCell className="text-right pr-6 text-[11px] font-black text-slate-900 font-mono tabular-nums">{item.consumption}</TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>
      </div>

      {/* IX. SUPPLIER PERFORMANCE AUDIT */}
      <div className="space-y-8 pt-8">
         <div className="flex items-center gap-3 ml-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase">IX. SUPPLIER PERFORMANCE AUDIT (QUALITY & CONTINUITY)</h2>
         </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: 'A. RAW MATERIAL PERFORMANCE', icon: Droplets, color: 'text-rose-500', badge: 'OTD FOCUS', data: dashStats?.tables.perfRaw },
            { title: 'B. PACKAGING PERFORMANCE', icon: Box, color: 'text-orange-600', badge: 'MOQ AUDIT', data: dashStats?.tables.perfPack },
            { title: 'C. BOX PERFORMANCE', icon: Package, color: 'text-blue-600', badge: 'CAPACITY AUDIT', data: dashStats?.tables.perfBox },
            { title: 'D. LABEL PERFORMANCE', icon: Tag, color: 'text-emerald-500', badge: 'ACCURACY FOCUS', data: dashStats?.tables.perfLabel }
          ].map((table, idx) => (
            <TableWrapper
              key={idx}
              filters={
                <div className="flex items-center justify-between bg-slate-50/30">
                   <div className="flex items-center gap-4">
                     <div className={cn("w-10 h-10 rounded-xl bg-white border flex items-center justify-center shadow-sm", table.color)}>
                       <table.icon className="h-5 w-5" />
                     </div>
                     <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">{table.title}</h4>
                   </div>
                   <DnaBadge status="default">{table.badge}</DnaBadge>
                </div>
              }
            >
               <Table>
                 <TableHeader className="bg-slate-50/50">
                   <TableRow className="border-none">
                     <TableHead className="text-[10px] font-black text-slate-400 uppercase pl-10 py-6 text-left">Supplier</TableHead>
                     <TableHead className="text-[10px] font-black text-slate-400 uppercase text-right py-6">Volume</TableHead>
                     <TableHead className="text-[10px] font-black text-slate-400 uppercase text-center py-6">OTD %</TableHead>
                     <TableHead className="text-[10px] font-black text-slate-400 uppercase text-center pr-10 py-6">Risk Audit</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody className="divide-y divide-slate-50">
                    {table.data?.map((s, i) => (
                      <TableRow key={i} className="hover:bg-slate-50/50 transition-colors border-none">
                         <TableCell className="pl-10 py-5 text-sm font-black text-slate-900 uppercase text-left">{s.supplier}</TableCell>
                         <TableCell className="text-right text-[11px] font-black text-slate-400 font-mono tabular-nums">{s.volume.toLocaleString()}</TableCell>
                         <TableCell className="text-center font-black text-emerald-600 text-sm font-mono tabular-nums">{s.otd}%</TableCell>
                         <TableCell className="text-center pr-10">
                            <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase border inline-block", 
                              s.risk === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                            )}>
                              {s.risk}
                            </span>
                         </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </TableWrapper>
          ))}
        </div>
      </div>

      {/* COMMITMENT AUDIT SHEET */}
      <Sheet open={!!viewingCommitment} onOpenChange={(open) => !open && setViewingCommitment(null)}>
        <SheetContent className="sm:max-w-2xl p-0 border-none bg-white rounded-l-2xl overflow-hidden shadow-2xl">
            <SheetHeader className="p-10 bg-white text-slate-900 border-b border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Layers className="h-6 w-6 text-orange-600" />
                 </div>
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">COMMITMENT AUDIT</h2>
              </div>
              <SheetTitle className="text-4xl font-black text-slate-900 uppercase italic leading-none">{viewingCommitment?.name}</SheetTitle>
              <SheetDescription className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mt-4">
                 DETAILED AGGREGATION FROM ACTIVE SALES ORDERS
              </SheetDescription>
           </SheetHeader>
           
           <div className="p-10 space-y-8 overflow-y-auto max-h-[calc(100vh-250px)]">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total Aggregated Needs</p>
                    <p className="text-3xl font-black text-slate-900 font-mono tabular-nums">{viewingCommitment?.suggestedQty.toLocaleString()}</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Affected Projects</p>
                    <p className="text-3xl font-black text-orange-600 font-mono tabular-nums">{viewingCommitment?.commitmentsBreakdown?.length || 0}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">INDIVIDUAL DEMAND SOURCE</h4>
                 {viewingCommitment?.commitmentsBreakdown?.map((cb: any, idx: number) => (
                    <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-100 flex justify-between items-center hover:border-blue-600 transition-all group">
                       <div>
                          <p className="text-xs font-black text-slate-900 uppercase italic group-hover:text-blue-600 transition-colors">{cb.clientName}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase mt-1">
                            WO: {cb.woNumber} • FORMULA: <span className="text-blue-600">{cb.formulaCode}</span>
                          </p>
                          <p className="text-[8px] font-medium text-slate-400 uppercase mt-0.5">
                            PKG: {cb.packagingDetail} • TARGET: {new Date(cb.targetCompletion).toLocaleDateString()}
                          </p>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-black text-slate-900 font-mono tabular-nums mb-1">{cb.qtyNeeded.toLocaleString()}</p>
                          <DnaBadge status={cb.isHighValue ? "warning" : "default"}>
                             {cb.isHighValue ? "VVIP PRIORITY" : "STANDARD"}
                          </DnaBadge>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </SheetContent>
      </Sheet>

      {/* READINESS ANALYSIS SHEET */}
      <Sheet open={!!selectedWO} onOpenChange={(open) => !open && setSelectedWO(null)}>
        <SheetContent className="sm:max-w-2xl p-0 border-none bg-white rounded-l-2xl overflow-hidden shadow-2xl">
          <SheetHeader className="p-10 bg-white text-slate-900 border-b border-slate-200 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <SheetTitle className="text-3xl font-black text-slate-900 uppercase tracking-tight">Readiness Analysis</SheetTitle>
              <SheetDescription className="text-slate-400 font-black uppercase text-[10px] tracking-tight mt-2">
                WO: {selectedWO?.woNumber} • CLIENT: {selectedWO?.lead.clientName}
              </SheetDescription>
            </div>
          </SheetHeader>
          
          <div className="p-10 space-y-10 overflow-y-auto max-h-[calc(100vh-280px)]">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-600 rounded-full" />
                Material Bill Breakdown (The Gap)
              </h4>
              <div className="space-y-4">
                {selectedWO?.readinessDetails.map((detail: any, idx: number) => (
                  <DataCard 
                    key={idx} 
                    title="Domestic Warehouse Protocol"
                  >
                    <div className="flex justify-between items-start -mt-4">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                        {detail.materialName}
                      </span>
                      <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase border", 
                        detail.status === 'READY' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      )}>
                        {detail.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">Required</p>
                        <p className="font-black text-slate-900 text-lg font-mono tabular-nums">{detail.totalRequired}</p>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">Available</p>
                        <p className="font-black text-slate-900 text-lg font-mono tabular-nums">{detail.actualStock}</p>
                      </div>
                      <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-center">
                        <p className="text-[8px] font-black text-rose-500 uppercase tracking-tight mb-1">Shortage</p>
                        <p className="font-black text-rose-600 text-lg font-mono tabular-nums">-{detail.shortage}</p>
                      </div>
                    </div>
                  </DataCard>
                ))}
              </div>
            </div>

            {selectedWO?.materialReadiness === 'SHORTAGE' && (
              <div className="p-10 rounded-2xl bg-rose-600 text-white flex flex-col items-center text-center gap-4 shadow-sm">
                <AlertCircle className="h-10 w-10 text-white animate-bounce" />
                <div className="space-y-2">
                  <h5 className="text-2xl font-black uppercase tracking-tight">Production Halt Required</h5>
                  <p className="text-[10px] font-black text-rose-100 uppercase tracking-tight opacity-80 max-w-xs">
                    The supply chain protocol forbids start initialization until all backorders are verified.
                  </p>
                </div>
                <DnaButton variant="primary" size="lg" className="w-full mt-4 bg-white text-rose-600 hover:bg-slate-900 hover:text-white">
                   CREATE EMERGENCY PURCHASE REQ
                </DnaButton>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </DashboardShell>
  );
}
