"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import { Loader2, Search, AlertTriangle, Users, DollarSign, XCircle } from "lucide-react";
import {
 OperationalInput,
 OperationalMetricCard,
 OperationalMetricGrid,
 OperationalPageShell,
 OperationalPanel,
 getOperationalStatusLabel,
} from "@/components/operational";

const LOST_REASON_LABELS: Record<string, { label: string; status: "danger" | "pending" | "neutral" }> = {
 PRICE_ISSUE: { label: "Harga", status: "danger" },
 MOQ_TOO_HIGH: { label: "MOQ Tinggi", status: "pending" },
 QUALITY: { label: "Kualitas", status: "pending" },
 GHOSTING: { label: "Ghosting", status: "neutral" },
 COMPETITOR: { label: "Kompetitor", status: "pending" },
 NOT_READY: { label: "Belum Siap", status: "pending" },
 OTHER: { label: "Lainnya", status: "neutral" },
};

const STAGE_LABELS: Record<string, string> = {
 NEW_LEAD: "Buku Tamu",
 CONTACTED: "Contacted",
 NEGOTIATION: "Negosiasi",
 SAMPLE_PROCESS: "Sample",
 SAMPLE_REVISION: "Sample Revisi",
 SAMPLE_APPROVED: "Sample Approved",
 SPK_SIGNED: "SPK Signed",
 PRODUCTION_PROCESS: "Produksi",
 READY_TO_SHIP: "Ready Ship",
 WON_DEAL: "Won Deal",
 LOST: "Lost",
};

export default function LostPage() {
 const [searchQuery, setSearchQuery] = useState("");

 const { data: analytics } = useQuery({
 queryKey: ["bussdev-analytics", "lost"],
 queryFn: async () => {
 try { return (await api.get("/bussdev/analytics/lost")).data; }
 catch { return null; }
 },
 });

 const { data: leads, isLoading } = useQuery({
 queryKey: ["bussdev-leads-group", "lost"],
 queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/lost")).data,
 });

 // Section A: Lost before deal (prospect fail) = never reached SPK_SIGNED
 const prospectFail = leads?.filter(l =>
 !["SPK_SIGNED", "PRODUCTION_PROCESS", "READY_TO_SHIP", "WON_DEAL"].includes(l.stage)
 );

 // Section B: Lost after delivery (churn) = reached at least SPK_SIGNED
 const churnClient = leads?.filter(l =>
 ["SPK_SIGNED", "PRODUCTION_PROCESS", "READY_TO_SHIP", "WON_DEAL"].includes(l.lastKnownStage || l.stage)
 );

 const filteredProspects = prospectFail?.filter(l =>
 l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 l.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const filteredChurn = churnClient?.filter(l =>
 l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 l.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const totalLost = leads?.length || 0;
 const totalProspect = prospectFail?.length || 0;
 const totalChurn = churnClient?.length || 0;
 const lostValue = leads?.reduce((sum: number, l: any) => sum + Number(l.estimatedValue || 0), 0) || 0;

 if (isLoading) {
 return (
 <div className="flex justify-center items-center min-h-[60vh]">
 <Loader2 className="animate-spin h-10 w-10 text-rose-600" />
 </div>
 );
 }

 return (
 <OperationalPageShell
 title="Pipeline Lost"
 subtitle="Lost deals & churn customers — root cause & recovery tracking"
 actions={
 <span className="operational-status-badge is-danger">
 <AlertTriangle className="h-3.5 w-3.5" />
 <span>{totalLost} Total Lost</span>
 </span>
 }
 >
 <div className="operational-stack">
 <OperationalMetricGrid>
 <OperationalMetricCard
 label="Total Lost"
 value={totalLost}
 icon={<AlertTriangle className="h-4 w-4" />}
 tone="red"
 />
 <OperationalMetricCard
 label="Lost Prospect"
 value={totalProspect}
 icon={<Users className="h-4 w-4" />}
 tone="amber"
 />
 <OperationalMetricCard
 label="Churn Customer"
 value={totalChurn}
 icon={<Users className="h-4 w-4" />}
 tone="purple"
 />
 <OperationalMetricCard
 label="Est. Value Lost"
 value={formatCurrency(lostValue)}
 icon={<DollarSign className="h-4 w-4" />}
 tone="red"
 />
 </OperationalMetricGrid>

 <OperationalPanel>
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div className="flex items-center gap-2">
 <div className="h-4 w-1 rounded-full bg-rose-600" />
 <h3 className="text-[14px] font-semibold text-slate-900">Filter Lost Records</h3>
 </div>
 <OperationalInput
 icon={<Search className="h-4 w-4" />}
 placeholder="Cari brand / client..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="md:w-80"
 />
 </div>
 </OperationalPanel>

 {/* Section A: Prospect Gagal */}
 <OperationalPanel>
 <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
 <div className="h-2 w-2 rounded-full bg-rose-500" />
 <h3 className="text-[14px] font-semibold text-slate-900">Section A — Lost Sebelum Deal (Prospect Gagal)</h3>
 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
 {filteredProspects?.length || 0}
 </span>
 </div>
 {filteredProspects && filteredProspects.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full table-fixed border-collapse text-left">
 <colgroup>
 <col className="w-[28%]" />
 <col className="w-[17%]" />
 <col className="w-[18%]" />
 <col className="w-[17%]" />
 <col className="w-[20%]" />
 </colgroup>
 <thead>
 <tr className="border-b border-slate-200 bg-slate-50">
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Brand & Produk</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">PIC BD</th>
 <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500">Est. Value Deal</th>
 <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">Stage Terakhir</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-rose-600">Alasan Lost</th>
 </tr>
 </thead>
 <tbody>
 {filteredProspects.map((lead: any) => {
 const lostReasonCfg = LOST_REASON_LABELS[lead.lostReason] || LOST_REASON_LABELS.OTHER;
 return (
 <tr key={lead.id} className="border-b border-slate-100 transition hover:bg-rose-50/30">
 <td className="px-3 py-2.5">
 <div className="text-[12px] font-semibold text-slate-900 uppercase">
 {(lead.brandName || lead.clientName || "—")}
 </div>
 <div className="text-[10px] text-slate-500">{lead.productInterest || "—"}</div>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[10px] text-slate-600">👤</div>
 <span className="text-[12px] font-medium text-slate-900">
 {lead.pic?.name || "Unassigned"}
 </span>
 </div>
 </td>
 <td className="px-3 py-2.5 text-right text-[12px] font-semibold tabular-nums text-rose-600">
 {formatCurrency(Number(lead.estimatedValue || 0))}
 </td>
 <td className="px-3 py-2.5 text-center">
 <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
 {STAGE_LABELS[lead.stage] || getOperationalStatusLabel(lead.stage)}
 </span>
 </td>
 <td className="px-3 py-2.5">
 <span className={cn("operational-status-badge", `is-${lostReasonCfg.status}`)}>
 <XCircle className="h-3 w-3" />
 <span>{lostReasonCfg.label}</span>
 </span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 ) : (
 <p className="py-10 text-center text-[12px] text-slate-400">
 Tidak ada data lost sebelum deal.
 </p>
 )}
 </OperationalPanel>

 {/* Section B: Churn Customer */}
 <OperationalPanel>
 <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
 <div className="h-2 w-2 rounded-full bg-purple-500" />
 <h3 className="text-[14px] font-semibold text-slate-900">Section B — Lost Setelah Delivery (Churn Customer)</h3>
 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
 {filteredChurn?.length || 0}
 </span>
 </div>
 {filteredChurn && filteredChurn.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full table-fixed border-collapse text-left">
 <colgroup>
 <col className="w-[28%]" />
 <col className="w-[14%]" />
 <col className="w-[22%]" />
 <col className="w-[14%]" />
 <col className="w-[22%]" />
 </colgroup>
 <thead>
 <tr className="border-b border-slate-200 bg-slate-50">
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Brand & Produk Terakhir</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Qty Terakhir</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Tgl Terakhir Order</th>
 <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">Status</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-rose-600">Alasan Churn</th>
 </tr>
 </thead>
 <tbody>
 {filteredChurn.map((lead: any) => {
 const lostReasonCfg = LOST_REASON_LABELS[lead.lostReason] || LOST_REASON_LABELS.OTHER;
 const lastDateStr = lead.wonAt
 ? new Date(lead.wonAt).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
 : "—";
 const estNextStr = lead.wonAt
 ? new Date(new Date(lead.wonAt).getTime() + 60 * 24 * 3600 * 1000).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
 : "—";

 return (
 <tr key={lead.id} className="border-b border-slate-100 transition hover:bg-rose-50/30">
 <td className="px-3 py-2.5">
 <div className="text-[12px] font-semibold text-slate-900 uppercase">
 {(lead.brandName || lead.clientName || "—")}
 </div>
 <div className="text-[10px] text-slate-500">{lead.productInterest || "—"}</div>
 </td>
 <td className="px-3 py-2.5 text-[12px] font-medium tabular-nums text-slate-900">
 {lead.moq ? `${Number(lead.moq).toLocaleString()} Pcs` : "—"}
 </td>
 <td className="px-3 py-2.5">
 <div className="text-[11px] font-medium tabular-nums text-slate-700">{lastDateStr}</div>
 <div className="text-[10px] text-slate-500">EST. REPEAT: {estNextStr}</div>
 </td>
 <td className="px-3 py-2.5 text-center">
 <span className="operational-status-badge is-danger">
 LOST
 </span>
 </td>
 <td className="px-3 py-2.5">
 <span className={cn("operational-status-badge", `is-${lostReasonCfg.status}`)}>
 <XCircle className="h-3 w-3" />
 <span>{lostReasonCfg.label}</span>
 </span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 ) : (
 <p className="py-10 text-center text-[12px] text-slate-400">
 Tidak ada data churn customer.
 </p>
 )}
 </OperationalPanel>
 </div>
 </OperationalPageShell>
 );
}
