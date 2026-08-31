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

 const shortageCount = dashStats?.procurementSuggestions?.filter(p => p.priority === 'URGENT').length || 0;
 const mustBuyCount = dashStats?.procurementSuggestions?.length || 0;

 const avgOtd = (arr: any[]) => arr?.length ? Math.round(arr.reduce((sum, s) => sum + (s.otd || 0), 0) / arr.length) : null;

 const perfScore = [
 { label: "SCM GENERAL", key: null as any[] | null, color: "#1E293B" },
 { label: "BAHAN BAKU (RAW)", key: dashStats?.tables?.perfRaw, color: "#EF4444" },
 { label: "BAHAN KEMAS (PACK)", key: dashStats?.tables?.perfPack, color: "#10B981" },
 { label: "BOX AUDIT", key: dashStats?.tables?.perfBox, color: "#78350F" },
 { label: "LABEL ACCURACY", key: dashStats?.tables?.perfLabel, color: "#8B5CF6" },
 ];

 const velocityCategories = useMemo(() => {
 const hf = dashStats?.highFrequency;
 const entries = [
 { key: 'raw' as const, label: "BAHAN BAKU (RAW)", color: "#EF4444", icon: Droplets },
 { key: 'pack' as const, label: "BAHAN KEMAS (PACK)", color: "#F59E0B", icon: Box },
 { key: 'box' as const, label: "BOX & CARDBOARD", color: "#78350F", icon: Package },
 { key: 'label' as const, label: "LABEL AUDIT", color: "#8B5CF6", icon: Tag },
 ];
 return entries.map(({ key, label, color, icon }) => {
 const items = hf?.[key] || [];
 const fast = items.filter((i: any) => i.freq > 5).length;
 const ontime = items.filter((i: any) => i.freq >= 2 && i.freq <= 5).length;
 const late = items.filter((i: any) => i.freq === 1).length;
 const pending = items.filter((i: any) => i.freq === 0).length;
 const activeCount = items.filter((i: any) => i.freq > 0).length;
 const score = items.length ? Math.round((activeCount / items.length) * 100) : 0;
 const status = score >= 90 ? "FAST" : score >= 70 ? "STABLE" : "DELAYED";
 const arrival = `${score}% READY`;
 const pulse = score >= 70 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
 return { label, color, icon, score, status, pulse, stats: { fast, ontime, late, pending }, arrival };
 });
 }, [dashStats?.highFrequency]);

 if (statsLoading || woLoading) {
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
 <div className="macro-grid">
 {/* Card A: Stock Health */}
 <div className="macro-card">
 <div className="flex items-center gap-2 mb-5">
 <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
 <p className="font-black text-[11px] text-slate-900 tracking-[0.05em] uppercase">A. STOCK HEALTH</p>
 </div>
 <div className="mb-4">
 <p className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider margin-0">TOTAL ACTIVE SKU</p>
 <p className="font-black text-2xl text-slate-900 mt-1 mb-2">{dashStats?.cards.inventory.totalSku ?? "—"}</p>
 </div>
 <div className="flex flex-col gap-2">
 <div className="flex justify-between">
 <span className="text-[10px] font-extrabold text-slate-500 uppercase">CRITICAL STOCK</span>
 <span className="text-[11px] font-black text-rose-600">{dashStats?.cards.inventory.criticalStock ?? "—"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-[10px] font-extrabold text-slate-500 uppercase">DEAD STOCK</span>
 <span className="text-[11px] font-black text-slate-900">—</span>
 </div>
 <div className="flex justify-between pt-1.5 border-t border-slate-100 mt-1">
 <span className="text-[10px] font-extrabold text-blue-600 uppercase">FULFILLMENT</span>
 <span className="text-[11px] font-black text-blue-600">{dashStats?.cards.warehouse.fulfillment ?? "—"}%</span>
 </div>
 </div>
 </div>

 {/* Card B: Material Readiness */}
 <div className="macro-card" style={{ background: "#F0FDF4", borderColor: "#DCFCE7" }}>
 <div className="flex items-center gap-2 mb-5">
 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
 <p className="font-black text-[11px] text-emerald-800 tracking-[0.05em] uppercase">B. MATERIAL READINESS</p>
 </div>
 <div className="text-center mb-5">
 <p className="font-black text-3xl text-slate-900 m-0">{dashStats?.cards.inventory.accuracy ?? "—"}%</p>
 <p className="font-extrabold text-[9px] text-emerald-800 m-0">INVENTORY ACCURACY</p>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
 <p className="text-[8px] font-extrabold text-slate-500 m-0">SHORTAGE</p>
 <p className="text-sm font-black text-rose-500 m-0">{shortageCount}</p>
 </div>
 <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
 <p className="text-[8px] font-extrabold text-rose-800 m-0">MUST BUY</p>
 <p className="text-sm font-black text-rose-600 m-0">{mustBuyCount}</p>
 </div>
 </div>
 </div>

 {/* Card C: Cost Efficiency */}
 <div className="macro-card">
 <div className="flex items-center gap-2 mb-5">
 <DollarSign className="w-4 h-4 text-amber-500" />
 <p className="font-black text-[11px] text-slate-900 tracking-[0.05em] uppercase">C. COST EFFICIENCY</p>
 </div>
 <div className="flex flex-col gap-3">
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-extrabold text-slate-500 uppercase">SAVING %</span>
 <span className="text-[12px] font-black text-emerald-500">{dashStats?.cards.procurement.savingPercent ?? "—"}%</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-extrabold text-slate-500 uppercase">COST SAVING</span>
 <span className="text-[12px] font-black text-emerald-500">—</span>
 </div>
 <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
 <p className="text-[8px] font-extrabold text-rose-800 m-0">PENDING PROCUREMENT</p>
 <p className="text-sm font-black text-slate-900 m-0 mt-0.5">{mustBuyCount} <span className="text-[9px] font-bold">ITEMS</span></p>
 </div>
 </div>
 </div>

 {/* Card D: Purchase Performance */}
 <div className="macro-card">
 <div className="flex items-center gap-2 mb-5">
 <Zap className="w-4 h-4 text-blue-500" />
 <p className="font-black text-[11px] text-slate-900 tracking-[0.05em] uppercase">D. PURCHASE PERFORMANCE</p>
 </div>
 <div className="flex flex-col gap-2.5">
 <div className="flex justify-between">
 <span className="text-[10px] font-extrabold text-slate-500 uppercase">ON-TIME DELIVERY</span>
 <span className="text-[12px] font-black text-blue-700">{dashStats?.cards.logistics.otd ?? "—"}%</span>
 </div>
 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-blue-500" style={{ width: `${dashStats?.cards.logistics.otd ?? 0}%` }} />
 </div>
 <div className="flex justify-between mt-1">
 <span className="text-[10px] font-extrabold text-slate-500 uppercase">AVG LEAD TIME</span>
 <span className="text-[12px] font-black text-slate-900">{dashStats?.cards.procurement.leadTime ?? "—"}d</span>
 </div>
 </div>
 </div>

 {/* Card E: Cost Savings */}
 <div className="macro-card">
 <div className="flex items-center gap-2 mb-5">
 <ShieldCheck className="w-4 h-4 text-purple-500" />
 <p className="font-black text-[11px] text-slate-900 tracking-[0.05em] uppercase">E. SUPPLIER QUALITY</p>
 </div>
 <div className="mb-3">
 <p className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider m-0">SUPPLIER PERF. SCORE</p>
 <p className="font-black text-2xl text-purple-600 mt-1 mb-2">{dashStats?.cards.procurement.supplierPerf ?? "—"}%</p>
 </div>
 <div className="flex flex-col gap-2.5">
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-extrabold text-slate-500 uppercase">WAREHOUSE RETURN</span>
 <span className="text-[12px] font-black text-rose-500">{dashStats?.cards.warehouse.returnRate ?? "—"}%</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-extrabold text-slate-500 uppercase">SHIPPING / UNIT</span>
 <span className="text-[12px] font-black text-slate-900">{dashStats?.cards.logistics.shippingPerUnit ?? "—"}</span>
 </div>
 </div>
 </div>

 {/* Card F: Performance Scorecard */}
 <div className="macro-card" style={{ background: "#F8FAFC" }}>
 <div className="flex items-center gap-2 mb-4">
 <Trophy className="w-4 h-4 text-slate-800" />
 <p className="font-black text-[11px] text-slate-900 tracking-[0.05em] uppercase">F. PERFORMANCE SCORECARD</p>
 </div>
 <div className="flex flex-col gap-1.5">
 {perfScore.map((e, idx) => {
 const val = idx === 0
 ? (dashStats?.cards.logistics.otd !== undefined ? `${dashStats.cards.logistics.otd}%` : "—")
 : (e.key ? `${avgOtd(e.key)}%` : "—");
 return (
 <div key={idx} className="flex justify-between py-1 border-b border-black/5 last:border-0 last:pb-0">
 <span className="text-[9px] font-black text-slate-400">{e.label}</span>
 <span className="text-[11px] font-black" style={{ color: e.color }}>{val}</span>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 {/* II. WORK ORDER READINESS */}
 <div style={{ marginBottom: "4rem" }}>
 <h3 className="section-label">II. WORK ORDER READINESS (ACTIVE PIPELINE)</h3>
 
 {/* Filters Wrapper */}
 <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 p-5 bg-white rounded-3xl border border-slate-100">
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

 {/* Prototype Styled Table Card */}
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", minWidth: "1400px", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>WORK ORDER / PRODUCT</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>TARGET QTY</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>BO STATUS (GAP)</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>PO TRACKING</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>IMPACT</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "right", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>SUPPLIER SCORE</th>
 </tr>
 </thead>
 <tbody>
 {filteredWOs.map((wo) => {
 const isReady = wo.boStatus === "READY";
 return (
 <tr 
 key={wo.id} 
 onClick={() => setSelectedWO(wo)} 
 style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer" }}
 className="hover:bg-slate-50/50 transition-colors"
 >
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "left" }}>
 <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{wo.woNumber}</div>
 <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748B" }}>{wo.product}</div>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "11px", fontWeight: 900, color: "#1E293B" }}>
 {wo.targetQty.toLocaleString()} Pcs
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 <div style={{ fontSize: "11px", fontWeight: 950, color: wo.gap > 0 ? "#EF4444" : "#10B981" }}>
 {wo.gap > 0 ? `MISSING ${wo.gap} UNITS` : "READY"}
 </div>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 <div style={{ fontSize: "10px", fontWeight: 950, color: "#2563EB" }}>{wo.poStatus}</div>
 {wo.estArrival && (
 <div style={{ fontSize: "8px", fontWeight: 800, color: "#64748B" }}>
 EST. {new Date(wo.estArrival).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
 </div>
 )}
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 <span style={{ background: isReady ? "#10B981" : "#EF4444", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "8px", fontWeight: 950 }}>
 {isReady ? "READY" : "DELAYED"}
 </span>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "right", fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>
 {wo.supplierScore}/5
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* 🤝 III. SCM-PRODUCTION BRIDGE (COMMUNICATION PROTOCOL) */}
 <div style={{ marginBottom: "4rem" }}>
 <h3 className="section-label">🤝 III. SCM-PRODUCTION BRIDGE (COMMUNICATION PROTOCOL)</h3>
 
 {/* EXECUTIVE CATEGORY VELOCITY CLOUD */}
 <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2.5rem" }}>
 {velocityCategories.map((cat, i) => (
 <div 
 key={i} 
 style={{ background: "white", padding: "1.25rem", borderRadius: "24px", border: "1px solid #E2E8F0", position: "relative", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
 >
 <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: cat.color }} />
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
 <div>
 <p style={{ fontSize: "9px", fontWeight: 950, color: "#64748B", margin: 0, textTransform: "uppercase" }}>{cat.label}</p>
 <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
 <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: cat.pulse, boxShadow: `0 0 10px ${cat.pulse}` }} />
 <span style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B" }}>{cat.status}</span>
 </div>
 </div>
 <div style={{ textAlign: "right" }}>
 <p style={{ fontSize: "7px", fontWeight: 850, color: "#94A3B8", margin: 0 }}>SCORE</p>
 <p style={{ fontSize: "18px", fontWeight: 950, color: cat.pulse === "#EF4444" ? "#EF4444" : "#10B981", margin: 0 }}>{cat.score}</p>
 </div>
 </div>
 
 <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "3px", marginBottom: "1rem" }}>
 {[
 { l: "FAST", v: cat.stats.fast, c: "#10B981" },
 { l: "REG", v: cat.stats.ontime, c: "#3B82F6" },
 { l: "LATE", v: cat.stats.late, c: "#EF4444" },
 { l: "OUT", v: cat.stats.pending, c: "#94A3B8" }
 ].map((s, idx) => (
 <div key={idx} style={{ background: "#F8FAFC", padding: "5px 2px", borderRadius: "8px", textAlign: "center", border: "1px solid #F1F5F9" }}>
 <p style={{ fontSize: "6px", fontWeight: 950, color: "#64748B", margin: 0 }}>{s.l}</p>
 <p style={{ fontSize: "11px", fontWeight: 950, color: s.c, margin: 0 }}>{s.v}</p>
 </div>
 ))}
 </div>

 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
 <Database className="w-2.5 h-2.5 text-slate-400" />
 <span style={{ fontSize: "9px", fontWeight: 950, color: "#1E293B" }}>{cat.arrival}</span>
 </div>
 <div style={{ width: "50px", height: "3px", background: "#F1F5F9", borderRadius: "2px", overflow: "hidden" }}>
 <div style={{ height: "100%", background: cat.color, width: `${cat.arrival.split("%")[0]}%` }} />
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* MASSIVE WO TRACKING TABLE */}
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", minWidth: "1400px", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>WORK ORDER / PRODUCT</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>TARGET QTY</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>BO STATUS (NEEDS / WH / GAP)</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>PO TRACKING (QTY / STATUS)</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>EST. ARRIVAL</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>IMPACT / ANOMALY</th>
 <th style={{ padding: "1rem 1.5rem", textAlign: "right", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>SUPPLIER SCORE</th>
 </tr>
 </thead>
 <tbody>
 {filteredWOs.map((wo, i) => {
 const isReady = wo.boStatus === "READY";
 return (
 <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedWO(wo)}>
 <td style={{ padding: "1rem 1.5rem", textAlign: "left" }}>
 <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{wo.woNumber}</div>
 <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748B" }}>{wo.product}</div>
 </td>
 <td style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "11px", fontWeight: 900, color: "#1E293B" }}>{wo.targetQty?.toLocaleString?.() ?? wo.targetQty} Pcs</td>
 <td style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "11px", fontWeight: 950 }}>
 {wo.gap > 0 ? `MISSING ${wo.gap} UNITS` : "READY"}
 </td>
 <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
 <div style={{ fontSize: "10px", fontWeight: 950, color: "#2563EB" }}>{wo.poStatus || "—"}</div>
 </td>
 <td style={{ padding: "1rem 1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 800, color: "#64748B" }}>
 {wo.estArrival ? new Date(wo.estArrival).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
 </td>
 <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
 <span style={{ background: isReady ? "#10B981" : "#EF4444", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "8px", fontWeight: 950 }}>
 {isReady ? "READY" : "DELAYED"}
 </span>
 </td>
 <td style={{ padding: "1rem 1.5rem", textAlign: "right", fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{wo.supplierScore}/5</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* 🔴 IV. MATERIAL MASTER & STOCK AUDIT (UNIFIED REPOSITORY) */}
 <div style={{ marginBottom: "5rem" }}>
 <h3 className="section-label">🔴 III. MATERIAL MASTER & STOCK AUDIT (UNIFIED REPOSITORY)</h3>
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", minWidth: "1800px", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>MATERIAL NAME / TYPE</th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>STOCK (CURR / RES / AVAIL)</th>
 <th style={{ padding: "1.5rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>UNIT PRICE / TOTAL</th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>LEVELS (MIN / MAX / ROP)</th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>USAGE / LEAD TIME</th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>STATUS AUDIT</th>
 </tr>
 </thead>
 <tbody>
 {[
 { name: "Niacinamide Alpha", type: "RAW", cat: "Chemical", u: "Kg", curr: "120", res: "80", avail: "40", price: "12.5k", total: "1.5M", levels: "50 / 500 / 100", usage: "5 Kg/d", lt: "14d", status: "SHORTAGE" },
 { name: "Retinol Kapsul", type: "RAW", cat: "Active", u: "Kg", curr: "450", res: "50", avail: "400", price: "110k", total: "49.5M", levels: "50 / 800 / 150", usage: "2 Kg/d", lt: "30d", status: "HEALTHY" },
 { name: "Botol Serum 30ml", type: "PACKAGING", cat: "Glass", u: "Pcs", curr: "15k", res: "12k", avail: "3k", price: "2.5k", total: "37.5M", levels: "5k / 50k / 10k", usage: "500 Pcs/d", lt: "7d", status: "SHORTAGE" },
 { name: "Box Acne Serum", type: "BOX", cat: "Printing", u: "Pcs", curr: "45k", res: "5k", avail: "40k", price: "1.2k", total: "54M", levels: "5k / 40k / 10k", usage: "500 Pcs/d", lt: "5d", status: "EXCESS" },
 { name: "Dead Sample Kemasan", type: "PACKAGING", cat: "N/A", u: "Pcs", curr: "120", res: "0", avail: "120", price: "5k", total: "0.6M", levels: "0 / 0 / 0", usage: "0", lt: "-", status: "DEAD STOCK" },
 ].map((row, i) => (
 <tr 
 key={i} 
 style={{ borderBottom: "1px solid #F1F5F9", background: row.status === "SHORTAGE" ? "#FFF1F2" : "transparent" }}
 >
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "left" }}>
 <div style={{ fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{row.name}</div>
 <div style={{ fontSize: "9px", fontWeight: 800, color: "#64748B" }}>{row.type} | {row.cat}</div>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 <div style={{ fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
 {row.curr} / {row.res} / <span style={{ color: row.status === "SHORTAGE" ? "#EF4444" : "#10B981" }}>{row.avail}</span>
 </div>
 <div style={{ fontSize: "9px", color: "#64748B", fontWeight: 700 }}>UNIT: {row.u}</div>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
 <div style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>Rp {row.total}</div>
 <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748B" }}>@{row.price} / {row.u}</div>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{row.levels}</td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 <div style={{ fontSize: "11px", fontWeight: 800, color: "#1E293B" }}>{row.usage}</div>
 <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748B" }}>Lead: {row.lt}</div>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 <span style={{ background: row.status === "SHORTAGE" ? "#EF4444" : row.status === "EXCESS" ? "#F59E0B" : row.status === "HEALTHY" ? "#10B981" : "#64748B", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "9px", fontWeight: 950 }}>
 {row.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 {/* V. CATEGORY-SPECIFIC PERFORMANCE AUDIT */}
 <div style={{ marginTop: "5rem", marginBottom: "3rem" }}>
 <h3 style={{ margin: "5rem 0 2rem 0", fontSize: "16px", fontWeight: 950, color: "#1E293B", borderBottom: "2px solid #1E293B", display: "inline-block", paddingBottom: "8px" }}>
 CATEGORY-SPECIFIC PERFORMANCE AUDIT
 </h3>

 <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "3rem" }}>
 {/* A. RAW MATERIAL PERFORMANCE */}
 <div>
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
 <div style={{ width: "12px", height: "12px", background: "#EF4444", borderRadius: "2px" }} />
 <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
 A. RAW MATERIAL PERFORMANCE (QUALITY & CONTINUITY)
 </h4>
 </div>
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", minWidth: "1600px", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>SUPPLIER / MATERIAL</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>PERIOD</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>VOLUME (QTY/CNT)</th>
 <th style={{ padding: "1.25rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>COST (PRICE/VAR/TOTAL)</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>TIMELINESS (OTD/DELY)</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>QUALITY (REJ/SCR)</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>BATCH REJ RATE</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>RISK AUDIT</th>
 </tr>
 </thead>
 <tbody>
 {(dashStats?.tables.perfRaw || []).map((s: any, i: number) => (
 <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
 <td style={{ padding: "1.25rem" }}>
 <div style={{ fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{s.supplier}</div>
 <div style={{ fontSize: "10px", color: "#64748B", fontWeight: 700 }}>{s.material || "—"}</div>
 </td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "11px", fontWeight: 800, color: "#64748B" }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "center" }}>
 <div style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{s.volume?.toLocaleString?.() ?? s.volume ?? "—"}</div>
 <div style={{ fontSize: "9px", color: "#64748B" }}>—</div>
 </td>
 <td style={{ padding: "1.25rem", textAlign: "right" }}>
 <div style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>—</div>
 <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748B" }}>—</div>
 </td>
 <td style={{ padding: "1.25rem", textAlign: "center" }}>
 <div style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{s.otd}%</div>
 <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748B" }}>—</div>
 </td>
 <td style={{ padding: "1.25rem", textAlign: "center" }}>
 <div style={{ fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{s.quality || "—"}</div>
 <div style={{ fontSize: "9px", color: "#64748B" }}>—</div>
 </td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#64748B" }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "center" }}>
 <span style={{ background: s.risk === "LOW" ? "#10B981" : "#F59E0B", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "9px", fontWeight: 950 }}>
 {s.risk}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* B. PACKAGING PERFORMANCE */}
 <div>
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
 <div style={{ width: "12px", height: "12px", background: "#F59E0B", borderRadius: "2px" }} />
 <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
 B. PACKAGING PERFORMANCE (MOQ & OVERSTOCK FOCUS)
 </h4>
 </div>
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", minWidth: "1600px", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>SUPPLIER / MATERIAL</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>VOLUME</th>
 <th style={{ padding: "1.25rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>COST AUDIT</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>OTD %</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>MOQ EXCESS</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>USAGE MISMATCH</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>RISK</th>
 </tr>
 </thead>
 <tbody>
 {(dashStats?.tables.perfPack || []).map((s: any, i: number) => (
 <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
 <td style={{ padding: "1.25rem" }}>
 <div style={{ fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{s.supplier}</div>
 <div style={{ fontSize: "10px", color: "#64748B", fontWeight: 700 }}>{s.material || "—"}</div>
 </td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{s.volume?.toLocaleString?.() ?? s.volume ?? "—"}</td>
 <td style={{ padding: "1.25rem", textAlign: "right", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#10B981" }}>{s.otd}%</td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#64748B" }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#64748B" }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "center" }}>
 <span style={{ background: s.risk === "LOW" ? "#10B981" : "#F59E0B", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "9px", fontWeight: 950 }}>
 {s.risk}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* C. BOX PERFORMANCE */}
 <div>
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
 <div style={{ width: "12px", height: "12px", background: "#78350F", borderRadius: "2px" }} />
 <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
 C. BOX PERFORMANCE (VOLUME & COST EFFICIENCY)
 </h4>
 </div>
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", minWidth: "1600px", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>SUPPLIER / MATERIAL</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>VOLUME</th>
 <th style={{ padding: "1.25rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>COST PER UNIT</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>SPEND (TOTAL)</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>VOL UTIL %</th>
 <th style={{ padding: "1.25rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>RISK FLAG</th>
 </tr>
 </thead>
 <tbody>
 {(dashStats?.tables.perfBox || []).map((s: any, i: number) => (
 <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
 <td style={{ padding: "1.25rem" }}>
 <div style={{ fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{s.supplier}</div>
 <div style={{ fontSize: "10px", color: "#64748B", fontWeight: 700 }}>{s.material || "—"}</div>
 </td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{s.volume?.toLocaleString?.() ?? s.volume ?? "—"}</td>
 <td style={{ padding: "1.25rem", textAlign: "right", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#3B82F6" }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "right" }}>
 <span style={{ background: s.risk === "LOW" ? "#10B981" : "#F59E0B", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "9px", fontWeight: 950 }}>{s.risk}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* D. LABEL PERFORMANCE */}
 <div>
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
 <div style={{ width: "12px", height: "12px", background: "#8B5CF6", borderRadius: "2px" }} />
 <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
 D. LABEL PERFORMANCE (ACCURACY & REVISION FOCUS)
 </h4>
 </div>
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", minWidth: "1600px", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "1.25rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>SUPPLIER / MATERIAL</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>REVISIONS</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>MISPRINT RATE</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>OTD RATE</th>
 <th style={{ padding: "1.25rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>SCORE</th>
 <th style={{ padding: "1.25rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>RISK</th>
 </tr>
 </thead>
 <tbody>
 {(dashStats?.tables.perfLabel || []).map((s: any, i: number) => (
 <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
 <td style={{ padding: "1.25rem" }}>
 <div style={{ fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>{s.supplier}</div>
 <div style={{ fontSize: "10px", color: "#64748B", fontWeight: 700 }}>{s.material || "—"}</div>
 </td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "14px", fontWeight: 950, color: "#64748B" }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#64748B" }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950, color: "#10B981" }}>{s.otd}%</td>
 <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "12px", fontWeight: 950 }}>—</td>
 <td style={{ padding: "1.25rem", textAlign: "right" }}>
 <span style={{ background: s.risk === "LOW" ? "#10B981" : "#F59E0B", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "9px", fontWeight: 950 }}>
 {s.risk}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* VI. SMART PROCUREMENT RECOMMENDATIONS */}
 <div style={{ marginBottom: "4rem" }}>
 <h3 className="section-label">VI. SMART PROCUREMENT RECOMMENDATIONS</h3>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }} className="macro-grid-procurement">
 {dashStats?.procurementSuggestions.slice(0, 6).map((rec, i) => (
 <div 
 key={i}
 style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: "24px", padding: "2rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", position: "relative" }}
 className="hover:translate-y-[-4px] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05)] transition-all duration-300"
 >
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
 <span style={{ background: rec.priority === "URGENT" ? "#fef2f2" : "#f1f5f9", color: rec.priority === "URGENT" ? "#dc2626" : "#64748B", textTransform: "uppercase", borderRadius: "8px", padding: "6px 12px", fontSize: "10px", fontWeight: 900 }}>
 {rec.priority} PRIORITY
 </span>
 <span style={{ fontSize: "9px", fontWeight: 900, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>STOCK: {rec.currentStock}</span>
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
 <div>
 <p style={{ margin: 0, textTransform: "uppercase", fontSize: "10px", fontWeight: 800, color: "#6B7280" }}>{rec.type}</p>
 <h4 style={{ margin: "5px 0 0 0", fontSize: "20px", fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>{rec.name}</h4>
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
 <div>
 <p style={{ fontSize: "9px", fontWeight: 900, color: "#9CA3AF", textTransform: "uppercase", margin: "0 0 4px 0" }}>SUPPLIER</p>
 <p style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#2563EB" }}>{rec.suggestedSupplier}</p>
 </div>
 <div style={{ textAlign: "right" }}>
 <p style={{ fontSize: "9px", fontWeight: 900, color: "#9CA3AF", textTransform: "uppercase", margin: "0 0 4px 0" }}>OTD EXP.</p>
 <p style={{ margin: 0, fontSize: "13px", fontWeight: 950, color: "#10B981" }}>{rec.expectedOtd}%</p>
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
 style={{ background: "none", border: "none", cursor: "pointer", width: "full", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", color: "#9CA3AF", letterSpacing: "0.1em", textAlign: "center" }}
 className="hover:text-blue-600 transition-colors"
 >
 VIEW GLOBAL SUMMARY BREAKDOWN
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* VII. CONSOLIDATED PROCUREMENT SUMMARY */}
 <div style={{ marginBottom: "4rem" }}>
 <h3 className="section-label">VII. CONSOLIDATED PROCUREMENT SUMMARY (GLOBAL)</h3>
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>Material Item</th>
 <th style={{ padding: "1.5rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>Net Requirement</th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>Status / Gap</th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>Consolidated From (Projects)</th>
 <th style={{ padding: "1.5rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>Action</th>
 </tr>
 </thead>
 <tbody>
 {dashStats?.procurementSuggestions.map((rec, i) => (
 <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }} className="hover:bg-slate-50 transition-colors">
 <td style={{ padding: "1.5rem", textAlign: "left" }}>
 <p style={{ margin: 0, fontSize: "14px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase" }}>{rec.name}</p>
 <p style={{ margin: "4px 0 0 0", fontSize: "9px", fontWeight: 900, color: "#64748B", textTransform: "uppercase" }}>{rec.type} • Stock: {rec.currentStock}</p>
 </td>
 <td style={{ padding: "1.5rem", textAlign: "right", fontSize: "16px", fontWeight: 950, color: "#1E293B" }}>
 {rec.suggestedQty.toLocaleString()} Pcs
 </td>
 <td style={{ padding: "1.5rem", textAlign: "center" }}>
 <span style={{ 
 background: rec.currentStock < rec.suggestedQty ? "#FFF1F2" : "#ECFDF5", 
 color: rec.currentStock < rec.suggestedQty ? "#E11D48" : "#059669", 
 padding: "6px 12px", 
 borderRadius: "8px", 
 fontSize: "11px", 
 fontWeight: 950,
 border: rec.currentStock < rec.suggestedQty ? "1px solid #FECDD3" : "1px solid #A7F3D0"
 }}>
 {rec.currentStock < rec.suggestedQty ? `-${(rec.suggestedQty - rec.currentStock).toLocaleString()}` : "SURPLUS"}
 </span>
 </td>
 <td style={{ padding: "1.5rem", textAlign: "center" }}>
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
 <td style={{ padding: "1.5rem", textAlign: "right" }}>
 <DnaButton 
 variant="outline"
 size="sm"
 onClick={() => initPurchaseMutation.mutate(rec.materialId)}
 >
 CONSOLIDATE & ORDER
 </DnaButton>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* VIII. VELOCITY & DEMAND AUDIT */}
 <div style={{ marginBottom: "5rem" }}>
 <h3 style={{ margin: "5rem 0 2rem 0", fontSize: "16px", fontWeight: 950, color: "#1E293B", borderBottom: "2px solid #1E293B", display: "inline-block", paddingBottom: "8px" }}>
 VELOCITY & DEMAND AUDIT (TOP 10 HIGH-FREQUENCY)
 </h3>

 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
 {/* RAW MATERIAL */}
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", padding: "1.5rem" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem" }}>
 <Droplets className="h-4 w-4 text-rose-500" />
 <p style={{ margin: 0, fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>TOP 10 HIGH-FREQUENCY: RAW MATERIAL</p>
 </div>
 <table style={{ width: "100%", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>MATERIAL NAME</th>
 <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>PURCHASE FREQ</th>
 <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>AVG CONSUMPTION</th>
 <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>TURNOVER</th>
 </tr>
 </thead>
 <tbody>
 {dashStats?.highFrequency.raw.map((item, i) => (
 <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
 <td style={{ padding: "10px 12px", fontSize: "11px", fontWeight: 850, color: "#1E293B", textAlign: "left" }}>{item.name}</td>
 <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", fontWeight: 950, color: "#2563EB" }}>{item.freq}</td>
 <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{item.consumption || item.turnover}</td>
 <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "10px", fontWeight: 850, color: "#64748B" }}>{item.turnover}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* PACKAGING */}
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", padding: "1.5rem" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem" }}>
 <Box className="h-4 w-4 text-orange-600" />
 <p style={{ margin: 0, fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>TOP 10 HIGH-FREQUENCY: PACKAGING</p>
 </div>
 <table style={{ width: "100%", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>MATERIAL NAME</th>
 <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>PURCHASE FREQ</th>
 <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>AVG CONSUMPTION</th>
 <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>TURNOVER</th>
 </tr>
 </thead>
 <tbody>
 {dashStats?.highFrequency.pack.map((item, i) => (
 <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
 <td style={{ padding: "10px 12px", fontSize: "11px", fontWeight: 850, color: "#1E293B", textAlign: "left" }}>{item.name}</td>
 <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", fontWeight: 950, color: "#2563EB" }}>{item.freq}</td>
 <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{item.consumption || item.turnover}</td>
 <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "10px", fontWeight: 850, color: "#64748B" }}>{item.turnover}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* IX. SUPPLIER PERFORMANCE AUDIT */}
 <div style={{ marginBottom: "5rem" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "2rem" }}>
 <div style={{ width: "4px", height: "16px", background: "#2563EB", borderRadius: "2px" }} />
 <h3 style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
 IX. SUPPLIER PERFORMANCE AUDIT (QUALITY & CONTINUITY)
 </h3>
 </div>
 
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
 {[
 { title: "A. RAW MATERIAL PERFORMANCE", icon: Droplets, color: "#EF4444", badge: "OTD FOCUS", data: dashStats?.tables.perfRaw },
 { title: "B. PACKAGING PERFORMANCE", icon: Box, color: "#F59E0B", badge: "MOQ AUDIT", data: dashStats?.tables.perfPack },
 { title: "C. BOX PERFORMANCE", icon: Package, color: "#2563EB", badge: "CAPACITY AUDIT", data: dashStats?.tables.perfBox },
 { title: "D. LABEL PERFORMANCE", icon: Tag, color: "#10B981", badge: "ACCURACY FOCUS", data: dashStats?.tables.perfLabel }
 ].map((table, idx) => (
 <div 
 key={idx}
 style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", padding: "1.5rem" }}
 >
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
 <table.icon style={{ height: "16px", width: "16px", color: table.color }} />
 <p style={{ margin: 0, fontSize: "12px", fontWeight: 950, color: "#1E293B" }}>{table.title}</p>
 </div>
 <span style={{ fontSize: "9px", fontWeight: 900, background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", color: "#64748B" }}>{table.badge}</span>
 </div>
 <table style={{ width: "100%", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>Supplier</th>
 <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>Volume</th>
 <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>OTD %</th>
 <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "9px", fontWeight: 950, color: "#64748B" }}>Risk Audit</th>
 </tr>
 </thead>
 <tbody>
 {table.data?.map((s, i) => (
 <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
 <td style={{ padding: "10px 12px", fontSize: "11px", fontWeight: 850, color: "#1E293B", textAlign: "left", textTransform: "uppercase" }}>{s.supplier}</td>
 <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "11px", fontWeight: 950, color: "#64748B" }}>{s.volume.toLocaleString()}</td>
 <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", fontWeight: 950, color: "#10B981" }}>{s.otd}%</td>
 <td style={{ padding: "10px 12px", textAlign: "right" }}>
 <span style={{ 
 background: s.risk === "LOW" ? "#ECFDF5" : "#FEF2F2", 
 color: s.risk === "LOW" ? "#059669" : "#DC2626", 
 padding: "4px 8px", 
 borderRadius: "6px", 
 fontSize: "9px", 
 fontWeight: 950,
 border: s.risk === "LOW" ? "1px solid #A7F3D0" : "1px solid #FCA5A5"
 }}>
 {s.risk}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ))}
 </div> </div>
 </div>

 {/* COMMITMENT AUDIT SHEET */}
 <Sheet open={!!viewingCommitment} onOpenChange={(open) => !open && setViewingCommitment(null)}>
 <SheetContent className="sm:max-w-2xl p-0 border-none bg-white rounded-l-2xl overflow-hidden">
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
 <SheetContent className="sm:max-w-2xl p-0 border-none bg-white rounded-l-2xl overflow-hidden">
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
