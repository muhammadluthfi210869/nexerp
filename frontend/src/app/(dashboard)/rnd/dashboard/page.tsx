"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
 Loader2,
 Plus,
 TestTube,
 ClipboardCheck,
 Dna,
 Binary,
 Clock,
 CheckCircle2,
 FlaskConical,
 TrendingUp,
 AlertTriangle,
 X,
 Calendar,
 Users
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { FormulaBuilder } from "@/components/rnd/formula-builder";
import { DnaButton } from "@/components/dna";

// --- Custom Stage Visualizer matching prototype cj ---
function StageVisualizer({ stage }: { stage: string }) {
 const steps = ["NOT START", "REV 1", "REV 2", "EXTRA", "DEAL"];
 // Map SampleStage to index
 const stageMap: Record<string, number> = {
 QUEUE: 0,
 FORMULATING: 1,
 LAB_TEST: 2,
 READY_TO_SHIP: 3,
 SHIPPED: 3,
 RECEIVED: 3,
 CLIENT_REVIEW: 3,
 REVISION_QUEUE: 3,
 APPROVED: 4
 };
 const currentIdx = stageMap[stage] ?? 0;
 return (
 <div style={{ display: "flex", gap: "3px", justifyContent: "center", alignItems: "center" }}>
 {steps.map((step, idx) => (
 <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
 <div
 style={{
 width: "32px",
 height: "6px",
 borderRadius: "3px",
 background: idx <= currentIdx ? (idx === currentIdx ? "#2563EB" : "#93C5FD") : "#F1F5F9",
 border: idx === currentIdx ? "1px solid #1D4ED8" : "none"
 }}
 />
 <span style={{ fontSize: "7px", fontWeight: 950, color: idx === currentIdx ? "#1E293B" : "#94A3B8" }}>
 {step}
 </span>
 </div>
 ))}
 </div>
 );
}

export default function RndExecutiveDashboard() {
 const queryClient = useQueryClient();
 const [activeFormula, setActiveFormula] = useState<{ id: string; name: string } | null>(null);
 const [isBuilderOpen, setIsBuilderOpen] = useState(false);

 const metricsQuery = useQuery({
 queryKey: ["rnd-metrics"],
 queryFn: async () => {
 const res = await api.get("/rnd/dashboard");
 return res.data?.data || res.data;
 },
 refetchInterval: 30000,
 });

 const { data: npfs, isLoading: loadingNpfs } = useQuery({
 queryKey: ["rnd-npfs"],
 queryFn: () => api.get("/rnd/npf").then(res => res.data)
 });

 const { data: samples, isLoading: loadingSamples } = useQuery<any[]>({
 queryKey: ["rnd-samples"],
 queryFn: () => api.get("/rnd/samples").then(res => res.data)
 });

 const createSample = useMutation({
 mutationFn: (npfId: string) => {
 const user = JSON.parse(localStorage.getItem("user") || "{}");
 return api.post("/rnd/samples", {
 npf_id: npfId,
 rnd_id: user.id || "00000000-0000-0000-0000-000000000000",
 status: "DRAFT"
 });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
 toast.success("Formulation track initialized for this product.");
 },
 onError: () => toast.error("Track collision. Failed to initiate formulation sample.")
 });

 const handleOpenBuilder = (sample: { id: string; version: number; npf?: { product_name: string } }) => {
 setActiveFormula({ id: sample.id, name: sample.npf?.product_name || `Sample V${sample.version}` });
 setIsBuilderOpen(true);
 };

 const metrics = metricsQuery.data;

 // Pipeline Master rows mapping
 const pipelineRows = useMemo(() => {
 const raw = metrics?.tables?.pipelineMaster;
 if (!raw || raw.length === 0) return [];
 return raw.map((r: any) => {
 const daysStr = r.timeAudit ? r.timeAudit.replace("In Stage: ", "") : "—";
 const totalStr = r.totalTime ? r.totalTime.replace("Total: ", "") : "—";
 const revNum = parseInt(r.revisions) || 0;
 return {
 id: r.id || "RD-24-001",
 brand: r.brand || "Generic",
 prod: r.product || "—",
 pic: r.pic || "TBD",
 bd: r.bd || "System",
 stage: r.stage || "QUEUE",
 days: daysStr,
 total: totalStr,
 rev: String(revNum),
 first: revNum === 0,
 status: r.status || "ONGOING",
 onTime: !r.timeAudit?.includes("Delayed") && !r.timeAudit?.includes("Overdue"),
 delay: 0
 };
 });
 }, [metrics]);

 // PIC Evaluation rows mapping
 const picRows = useMemo(() => {
 const raw = metrics?.tables?.performanceEvaluation;
 if (!raw || raw.length === 0) return [];
 return raw.map((r: any) => ({
 name: r.picName || "—",
 output: r.output || "—",
 eff: r.efficiency || "—",
 avg: (r.efficiency || "").includes("OT") ? (r.efficiency || "").split(" ")[0] : "—",
 quality: r.quality || "—",
 qualNote: "FIRST-TIME",
 util: r.utilization || "—",
 }));
 }, [metrics]);

 // Failure Logs mapping
 const failureRows = useMemo(() => {
 const raw = metrics?.tables?.failureLogs;
 if (!raw || raw.length === 0) return [];
 return raw.map((r: any) => ({
 prod: r.productName || "—",
 stage: r.stage || "—",
 reason: r.reason || "—",
 pic: r.picName || "—",
 }));
 }, [metrics]);

 if (metricsQuery.isLoading) return (
 <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
 <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
 <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Syncing Intelligence...</p>
 </div>
 );

 return (
 <div
 className="view-section active"
 style={{ paddingBottom: "5rem", background: "#F8FAFC", minHeight: "100vh" }}
 >
 {/* Executive Command Header */}
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
 <div>
 <h2 className="dashboard-title" style={{ margin: 0 }}>
 DIVISI R&D (Product Innovation Lab)
 </h2>
 <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "14px", fontWeight: 500 }}>
 (Pusat Kendali Formula & Sampel)
 </p>
 </div>
 <div
 style={{
 background: "white",
 padding: "10px 18px",
 borderRadius: "12px",
 border: "1px solid #E2E8F0",
 display: "flex",
 alignItems: "center",
 gap: "8px",
 }}
 >
 <Calendar size={14} color="#64748B" />
 <span style={{ fontSize: "12px", fontWeight: 800, color: "#1E293B" }}>
 LAB REPORT ACTIVE
 </span>
 </div>
 </div>

 <Tabs defaultValue="executive" className="w-full">
 <TabsList className="bg-white border-slate-200 mb-6">
 <TabsTrigger value="executive" className="flex items-center gap-2">
 Executive
 </TabsTrigger>
 <TabsTrigger value="npf" className="flex items-center gap-2">
 <ClipboardCheck className="h-4 w-4" />
 NPF Inbox
 {npfs?.length > 0 && (
 <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm bg-emerald-500/20 text-emerald-400">
 {npfs.length}
 </span>
 )}
 </TabsTrigger>
 <TabsTrigger value="lab" className="flex items-center gap-2">
 <TestTube className="h-4 w-4" />
 Active Lab
 </TabsTrigger>
 </TabsList>

 {/* ════════════════════════════════════════════ */}
 {/* TAB 1 — EXECUTIVE DASHBOARD */}
 {/* ════════════════════════════════════════════ */}
 <TabsContent value="executive">
 {/* Executive KPI Cards */}
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(4, 1fr)",
 gap: "1.5rem",
 marginBottom: "3rem",
 }}
 >
 {/* Card A: Timeliness */}
 <div
 style={{
 background: "white",
 padding: "1.5rem",
 borderRadius: "24px",
 border: "1px solid #E2E8F0",
 boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
 <div style={{ width: "8px", height: "8px", background: "#EF4444", borderRadius: "50%" }} />
 <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>
 🔴 A. TIMELINESS
 </p>
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
 <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "16px" }}>
 <p style={{ fontSize: "9px", fontWeight: 900, color: "#64748B", margin: 0 }}>
 ON-TIME SAMPLE RATE
 </p>
 <p style={{ fontSize: "20px", fontWeight: 950, color: "#10B981", margin: "4px 0" }}>
 {metrics?.timeliness?.onTimeRate ?? 85.4}%
 </p>
 </div>
 <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
 <div>
 <p style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>AVG CYCLE</p>
 <p style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
 {metrics?.timeliness?.avgCycleTime ?? "4.2"}{" "}
 <span style={{ fontSize: "9px" }}>DAYS</span>
 </p>
 </div>
 <div style={{ textAlign: "right" }}>
 <p style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>OVERDUE</p>
 <p style={{ fontSize: "14px", fontWeight: 950, color: "#EF4444", margin: 0 }}>
 {metrics?.timeliness?.overdueCount ?? 3}{" "}
 <span style={{ fontSize: "9px" }}>SAMPLES</span>
 </p>
 </div>
 </div>
 </div>
 <p
 style={{
 fontSize: "9px",
 fontWeight: 800,
 color: "#94A3B8",
 marginTop: "1rem",
 borderTop: "1px solid #F1F5F9",
 paddingTop: "8px",
 margin: 0
 }}
 >
 Insight: <span style={{ color: "#1E293B" }}>{metrics?.timeliness?.insight || "Velocity is within operational SLA"}</span>
 </p>
 </div>

 {/* Card B: Accuracy */}
 <div
 style={{
 background: "white",
 padding: "1.5rem",
 borderRadius: "24px",
 border: "1px solid #E2E8F0",
 boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
 <div style={{ width: "8px", height: "8px", background: "#F59E0B", borderRadius: "50%" }} />
 <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>
 🟠 B. ACCURACY
 </p>
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
 <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "16px" }}>
 <p style={{ fontSize: "9px", fontWeight: 900, color: "#64748B", margin: 0 }}>
 FIRST-TIME APPROVAL
 </p>
 <p style={{ fontSize: "20px", fontWeight: 950, color: "#2563EB", margin: "4px 0" }}>
 {metrics?.accuracy?.firstTimeApprovalRate ?? 72.1}%
 </p>
 </div>
 <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
 <div>
 <p style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>AVG REVISION</p>
 <p style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
 {metrics?.accuracy?.avgRevision ?? "1.4"}{" "}
 <span style={{ fontSize: "9px" }}>X</span>
 </p>
 </div>
 <div style={{ textAlign: "right" }}>
 <p style={{ fontSize: "8px", fontWeight: 800, color: "#94A3B8", margin: 0 }}>FAILED</p>
 <p style={{ fontSize: "14px", fontWeight: 950, color: "#EF4444", margin: 0 }}>
 {metrics?.accuracy?.failedItemsCount ?? 5}{" "}
 <span style={{ fontSize: "9px" }}>ITEMS</span>
 </p>
 </div>
 </div>
 </div>
 <p
 style={{
 fontSize: "9px",
 fontWeight: 800,
 color: "#94A3B8",
 marginTop: "1rem",
 borderTop: "1px solid #F1F5F9",
 paddingTop: "8px",
 margin: 0
 }}
 >
 Insight: <span style={{ color: "#1E293B" }}>{metrics?.accuracy?.insight || "Formulation accuracy is stabilizing"}</span>
 </p>
 </div>

 {/* Card C: Approval Performance */}
 <div
 style={{
 background: "white",
 padding: "1.5rem",
 borderRadius: "24px",
 border: "1px solid #E2E8F0",
 boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
 <div style={{ width: "8px", height: "8px", background: "#EAB308", borderRadius: "50%" }} />
 <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>
 🟡 C. APPROVAL PERFORMANCE
 </p>
 </div>
 <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
 <p style={{ fontSize: "28px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
 {metrics?.approval?.overallRate ?? 84.4}%
 </p>
 <p style={{ fontSize: "9px", fontWeight: 850, color: "#64748B", margin: 0 }}>
 OVERALL APPROVAL RATE
 </p>
 </div>
 <div style={{ display: "flex", justifyContent: "space-between", background: "#FFFBEB", padding: "10px", borderRadius: "12px" }}>
 <div style={{ textAlign: "center", flex: 1 }}>
 <p style={{ fontSize: "8px", fontWeight: 800, color: "#B45309", margin: 0 }}>SUBMITTED</p>
 <p style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
 {metrics?.approval?.submitted ?? 45}
 </p>
 </div>
 <div style={{ width: "1px", background: "#FEF3C7" }} />
 <div style={{ textAlign: "center", flex: 1 }}>
 <p style={{ fontSize: "8px", fontWeight: 800, color: "#B45309", margin: 0 }}>APPROVED</p>
 <p style={{ fontSize: "14px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
 {metrics?.approval?.approved ?? 38}
 </p>
 </div>
 </div>
 <p
 style={{
 fontSize: "9px",
 fontWeight: 800,
 color: "#94A3B8",
 marginTop: "1rem",
 borderTop: "1px solid #F1F5F9",
 paddingTop: "8px",
 margin: 0
 }}
 >
 Insight: <span style={{ color: "#1E293B" }}>{metrics?.approval?.insight || "Lead-to-Sample conversion flow is healthy"}</span>
 </p>
 </div>

 {/* Card D: R&D Performance */}
 <div
 style={{
 background: "white",
 padding: "1.5rem",
 borderRadius: "24px",
 border: "1px solid #E2E8F0",
 boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
 <div style={{ width: "8px", height: "8px", background: "#3B82F6", borderRadius: "50%" }} />
 <p style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em", margin: 0 }}>
 🔵 D. R&D PERFORMANCE
 </p>
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
 <div style={{ background: "#EFF6FF", padding: "10px", borderRadius: "12px" }}>
 <p style={{ fontSize: "8px", fontWeight: 800, color: "#1D4ED8", margin: 0 }}>ACTIVE PJKT</p>
 <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
 {metrics?.performance?.activeProjects ?? 12}
 </p>
 </div>
 <div style={{ background: "#F0FDF4", padding: "10px", borderRadius: "12px" }}>
 <p style={{ fontSize: "8px", fontWeight: 800, color: "#166534", margin: 0 }}>COMPLETED</p>
 <p style={{ fontSize: "16px", fontWeight: 950, color: "#1E293B", margin: 0 }}>
 {metrics?.performance?.completedProjects ?? 28}
 </p>
 </div>
 </div>
 <div style={{ marginTop: "1rem" }}>
 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
 <span style={{ fontSize: "9px", fontWeight: 850, color: "#64748B" }}>UTILIZATION RATE</span>
 <span style={{ fontSize: "10px", fontWeight: 950, color: "#1E293B" }}>
 {metrics?.performance?.utilizationRate ?? 92}%
 </span>
 </div>
 <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
 <div style={{ width: `${metrics?.performance?.utilizationRate ?? 92}%`, height: "100%", background: "#3B82F6" }} />
 </div>
 </div>
 <p
 style={{
 fontSize: "9px",
 fontWeight: 800,
 color: "#94A3B8",
 marginTop: "1rem",
 borderTop: "1px solid #F1F5F9",
 paddingTop: "8px",
 margin: 0
 }}
 >
 Insight: <span style={{ color: "#1E293B" }}>{metrics?.performance?.insight || "Resource utilization is optimized"}</span>
 </p>
 </div>
 </div>

 {/* R&D Pipeline Master Table */}
 <div style={{ marginBottom: "3.5rem" }}>
 <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
 🔴 1. R&D PIPELINE MASTER (FLOW VELOCITY)
 </h3>
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", minWidth: "1600px", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 RND ID / BRAND
 </th>
 <th style={{ padding: "1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 PRODUCT NAME
 </th>
 <th style={{ padding: "1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 TEAM (BD / PIC)
 </th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 CURRENT STAGE
 </th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 TIME AUDIT
 </th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 QUALITY (REV)
 </th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 STATUS
 </th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 TIMELINESS
 </th>
 </tr>
 </thead>
 <tbody>
 {pipelineRows.length === 0 ? (
 <tr>
 <td colSpan={8} style={{ padding: "1.5rem", textAlign: "center" }}>
 <p style={{ fontSize: "10px", fontWeight: 500, color: "#94A3B8", textTransform: "uppercase" }}>
 No pipeline data available
 </p>
 </td>
 </tr>
 ) : (
 pipelineRows.map((row: any, idx: number) => (
 <tr
 key={idx}
 style={{
 borderBottom: "1px solid #F1F5F9",
 background: row.onTime ? "transparent" : "#FFF1F2",
 }}
 >
 <td style={{ padding: "1.25rem 1.5rem" }}>
 <div style={{ fontSize: "11px", fontWeight: 900, color: "#64748B" }}>
 #{row.id}
 </div>
 <div style={{ fontSize: "13px", fontWeight: 950, color: "#1E293B" }}>
 {row.brand}
 </div>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", fontSize: "13px", fontWeight: 900, color: "#1E293B" }}>
 {row.prod}
 </td>
 <td style={{ padding: "1.25rem 1.5rem" }}>
 <div style={{ fontSize: "11px", fontWeight: 800, color: "#1E293B" }}>
 {row.pic}
 </div>
 <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748B" }}>
 BD: {row.bd}
 </div>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 <StageVisualizer stage={row.stage} />
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 <div style={{ fontSize: "11px", fontWeight: 900, color: "#1E293B" }}>
 In Stage: {row.days} Days
 </div>
 <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748B" }}>
 Total: {row.total} Days
 </div>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 <div
 style={{
 fontSize: "14px",
 fontWeight: 950,
 color: row.rev === "0" ? "#10B981" : "#F59E0B",
 }}
 >
 {row.rev} <span style={{ fontSize: "9px" }}>X</span>
 </div>
 {row.first && (
 <div style={{ fontSize: "8px", fontWeight: 900, color: "#10B981" }}>
 FIRST-TIME
 </div>
 )}
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 <span
 style={{
 background: row.status === "APPROVED" ? "#10B981" : row.status === "REJECTED" ? "#EF4444" : "#64748B",
 color: "white",
 padding: "4px 10px",
 borderRadius: "6px",
 fontSize: "9px",
 fontWeight: 950,
 }}
 >
 {row.status}
 </span>
 </td>
 <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
 {row.onTime ? (
 <span style={{ color: "#10B981", fontWeight: 950, fontSize: "10px" }}>
 ON-TIME
 </span>
 ) : (
 <div style={{ color: "#E11D48" }}>
 <span style={{ fontWeight: 950, fontSize: "10px" }}>DELAY</span>
 <div style={{ fontSize: "9px", fontWeight: 800 }}>+{row.delay} DAYS</div>
 </div>
 )}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Section 2 & 3 Grid */}
 <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "2rem" }}>
 {/* PIC Performance Evaluation */}
 <div>
 <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "12px", fontWeight: 950, color: "#1E293B", letterSpacing: "0.05em" }}>
 🟠 2. R&D PERFORMANCE EVALUATION (PER PERSON)
 </h3>
 <div style={{ background: "white", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
 <table style={{ width: "100%", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
 <th style={{ padding: "1.5rem", textAlign: "left", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 PIC NAME / PERIOD
 </th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 OUTPUT (COMP/APP)
 </th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 EFFICIENCY
 </th>
 <th style={{ padding: "1.5rem", textAlign: "center", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 QUALITY
 </th>
 <th style={{ padding: "1.5rem", textAlign: "right", fontSize: "10px", fontWeight: 950, color: "#64748B" }}>
 UTILIZATION
 </th>
 </tr>
 </thead>
 <tbody>
 {picRows.length === 0 ? (
 <tr>
 <td colSpan={5} style={{ padding: "1.5rem", textAlign: "center" }}>
 <p style={{ fontSize: "10px", fontWeight: 500, color: "#94A3B8", textTransform: "uppercase" }}>
 No performance data available
 </p>
 </td>
 </tr>
 ) : (
 picRows.map((row: any, idx: number) => (
 <tr
 key={idx}
 style={{
 borderBottom: idx < picRows.length - 1 ? "1px solid #F1F5F9" : "none",
 }}
 >
 <td style={{ padding: "1.5rem", fontSize: "13px", fontWeight: 900, color: "#1E293B", textTransform: "uppercase" }}>
 {row.name}
 </td>
 <td style={{ padding: "1.5rem", textAlign: "center", fontSize: "14px", fontWeight: 900 }}>
 {row.output}
 </td>
 <td style={{ padding: "1.5rem", textAlign: "center" }}>
 <p style={{ fontSize: "12px", fontWeight: 800, color: "#059669", margin: 0 }}>
 {row.eff}
 </p>
 <p style={{ fontSize: "9px", fontWeight: 700, color: "#94A3B8", margin: "2px 0 0 0" }}>
 Avg: {row.avg}
 </p>
 </td>
 <td style={{ padding: "1.5rem", textAlign: "center" }}>
 <p style={{ fontSize: "12px", fontWeight: 800, color: "#2563EB", margin: 0 }}>
 {row.quality}
 </p>
 <p style={{ fontSize: "9px", fontWeight: 700, color: "#94A3B8", margin: "2px 0 0 0" }}>
 {row.qualNote}
 </p>
 </td>
 <td style={{ padding: "1.5rem", textAlign: "right", fontSize: "14px", fontWeight: 900 }}>
 {row.util}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Failure Reject Log */}
 <div>
 <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "12px", fontWeight: 950, color: "#EF4444", letterSpacing: "0.05em" }}>
 🔴 3. FAILURE / REJECT LOG
 </h3>
 <div style={{ background: "#FFF1F2", borderRadius: "24px", border: "1px solid #FECDD3", padding: "1.5rem" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid #FEE2E2", paddingBottom: "10px" }}>
 <p style={{ fontSize: "10px", fontWeight: 950, color: "#9F1239", margin: 0 }}>PRODUCT / STAGE</p>
 <p style={{ fontSize: "10px", fontWeight: 950, color: "#9F1239", margin: 0 }}>REASON</p>
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
 {failureRows.length === 0 ? (
 <p style={{ fontSize: "10px", fontWeight: 500, color: "#9F1239", textAlign: "center", padding: "1rem" }}>
 No failures logged
 </p>
 ) : (
 failureRows.map((row: any, idx: number) => (
 <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
 <div>
 <p style={{ fontSize: "13px", fontWeight: 900, color: "#1E293B", margin: 0 }}>{row.prod}</p>
 <p style={{ fontSize: "9px", fontWeight: 700, color: "#64748B", margin: "2px 0 0 0", textTransform: "uppercase" }}>
 STAGE: {row.stage}
 </p>
 </div>
 <div style={{ textAlign: "right" }}>
 <p style={{ fontSize: "13px", fontWeight: 900, color: "#EF4444", margin: 0 }}>{row.reason}</p>
 <p style={{ fontSize: "9px", fontWeight: 700, color: "#64748B", margin: "2px 0 0 0", textTransform: "uppercase" }}>
 PIC: {row.pic}
 </p>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </div>
 </TabsContent>

 {/* ════════════════════════════════════════════ */}
 {/* TAB 2 — NPF INBOX */}
 {/* ════════════════════════════════════════════ */}
 <TabsContent value="npf">
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
 <div className="border-b border-slate-200 px-6 py-4 flex flex-row items-center justify-between">
 <div>
 <p className="text-lg font-black text-slate-900">NEW PRODUCT FORMULATION (NPF) REQUESTS</p>
 <p className="text-xs text-slate-500">Incoming mission-parameters from Commercial - Business Development.</p>
 </div>
 </div>
 <Table>
 <TableHeader className="bg-slate-50">
 <TableRow className="border-slate-200">
 <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Product Name</TableHead>
 <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Client</TableHead>
 <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Target Price</TableHead>
 <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10 text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loadingNpfs ? (
 Array.from({ length: 3 }).map((_, i) => (
 <TableRow key={i} className="border-slate-200"><TableCell colSpan={4}><Skeleton className="h-10 w-full bg-white" /></TableCell></TableRow>
 ))
 ) : npfs?.map((npf: { id: string; product_name: string; target_usage?: string; client_name?: string; target_price: number }) => (
 <TableRow key={npf.id} className="border-slate-200 group hover:bg-slate-50 transition-colors">
 <TableCell className="font-black text-slate-900">
 <p>{npf.product_name}</p>
 <p className="text-[10px] text-slate-500 font-sans italic">{npf.target_usage || 'Daily Cosmetics'}</p>
 </TableCell>
 <TableCell className="text-slate-600 text-sm">{npf.client_name || 'N/A'}</TableCell>
 <TableCell className="text-emerald-500 font-sans font-black">${npf.target_price}</TableCell>
 <TableCell className="text-right">
 <DnaButton
 variant="outline"
 size="sm"
 className="bg-emerald-600/10 border-emerald-600/30 text-emerald-500 hover:bg-emerald-600 hover:text-white h-8"
 onClick={() => createSample.mutate(npf.id)}
 disabled={createSample.isPending}
 icon={<Plus className="h-3 w-3" />}
 >
 Initialize Track
 </DnaButton>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </TabsContent>

 {/* ════════════════════════════════════════════ */}
 {/* TAB 3 — ACTIVE FORMULATION LAB */}
 {/* ════════════════════════════════════════════ */}
 <TabsContent value="lab">
 <div className="grid grid-cols-1 gap-6">
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden p-0">
 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] -mr-16 -mt-16" />
 <div className="border-b border-slate-200 px-6 py-4 flex flex-row items-center justify-between">
 <div>
 <p className="text-lg font-black text-slate-900">ACTIVE SAMPLES LAB</p>
 <p className="text-xs text-slate-500">Live development cycle of product prototypes.</p>
 </div>
 </div>
 <Table>
 <TableHeader className="bg-slate-50">
 <TableRow className="border-slate-200">
 <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Sample Tracker</TableHead>
 <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Origin NPF</TableHead>
 <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10">Status</TableHead>
 <TableHead className="text-slate-500 text-[10px] uppercase font-black tracking-tight h-10 text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loadingSamples ? (
 Array.from({ length: 3 }).map((_, i) => (
 <TableRow key={i} className="border-slate-200"><TableCell colSpan={4}><Skeleton className="h-10 w-full bg-white" /></TableCell></TableRow>
 ))
 ) : samples?.map((sample: { id: string; version: number; created_at: string; status: string; npf?: { product_name: string } }) => (
 <TableRow key={sample.id} className="border-slate-200 hover:bg-slate-50">
 <TableCell>
 <div className="flex items-center gap-3">
 <span className="h-8 w-8 rounded bg-white flex items-center justify-center text-emerald-500 font-sans text-[10px] border border-slate-200 font-black">V{sample.version}</span>
 <div>
 <p className="text-xs text-slate-700 font-black uppercase tracking-tighter">SAMP-ID-{(sample.id.split('-')[0]).toUpperCase()}</p>
 <p className="text-[10px] text-slate-600 font-sans">{new Date(sample.created_at).toLocaleDateString()}</p>
 </div>
 </div>
 </TableCell>
 <TableCell className="text-slate-900 font-black text-xs uppercase">{sample.npf?.product_name || 'Generic Sample'}</TableCell>
 <TableCell>
 <span className={`rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border shadow-sm ${
 sample.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white text-slate-500 border-slate-200'
 }`}>
 {sample.status}
 </span>
 </TableCell>
 <TableCell className="text-right">
 <DnaButton
 variant="ghost"
 size="sm"
 className="text-slate-500 hover:text-white hover:bg-slate-100 h-8"
 onClick={() => handleOpenBuilder(sample)}
 icon={<Binary className="h-4 w-4" />}
 >
 Build Formula
 </DnaButton>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </div>
 </TabsContent>
 </Tabs>

 <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
 <DialogContent className="max-w-[70vw] bg-white border-slate-200 text-slate-900 p-0 overflow-hidden">
 {activeFormula && (
 <FormulaBuilder
 sampleId={activeFormula.id}
 sampleName={activeFormula.name}
 onSuccess={() => {
 setIsBuilderOpen(false);
 queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
 }}
 />
 )}
 </DialogContent>
 </Dialog>
 </div>
 );
}
