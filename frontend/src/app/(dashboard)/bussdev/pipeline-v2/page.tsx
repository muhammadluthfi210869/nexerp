"use client";

import { useState, useEffect } from "react";
import {
 Plus,
 ArrowRight,
 Clock,
 FileText,
 CheckCircle2,
 AlertTriangle,
 History,
 Zap,
 Upload,
 ChevronDown,
 Loader2,
 Inbox,
 FileSearch,
 Workflow,
 ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
 OperationalButton,
 OperationalField,
 OperationalPageShell,
 OperationalPanel,
 OperationalStatusBadge,
 OperationalTabs,
 OperationalTabsContent,
 OperationalTabsList,
 OperationalTabsTrigger,
 getOperationalStatusLabel,
} from "@/components/operational";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 Dialog,
 DialogContent,
 DialogTitle,
} from "@/components/ui/dialog";

// --- Types ---
import type { PipelineLead, AuditLogEntry } from "@/types/pipeline-v2";
import { usePipelineV2 } from "@/hooks/use-pipeline-v2";

// --- Constants & Logic ---

const STAGES: Record<string, { label: string; color: string; bg: string }> = {
 NEW_LEAD: { label: "New Lead", color: "text-slate-500", bg: "bg-slate-100" },
 CONTACTED: { label: "Contacted", color: "text-blue-500", bg: "bg-blue-100" },
 FOLLOW_UP_1: { label: "Follow Up 1", color: "text-blue-500", bg: "bg-blue-100" },
 FOLLOW_UP_2: { label: "Follow Up 2", color: "text-blue-500", bg: "bg-blue-100" },
 FOLLOW_UP_3: { label: "Follow Up 3", color: "text-blue-500", bg: "bg-blue-100" },
 NEGOTIATION: { label: "Negotiation", color: "text-amber-500", bg: "bg-amber-100" },
 SAMPLE_REQUESTED: { label: "Sample Requested", color: "text-blue-500", bg: "bg-blue-100" },
 WAITING_FINANCE_APPROVAL: { label: "Waiting Finance", color: "text-orange-500", bg: "bg-orange-100" },
 SAMPLE_SENT: { label: "Sample Sent", color: "text-cyan-500", bg: "bg-cyan-100" },
 SAMPLE_APPROVED: { label: "Sample Approved", color: "text-teal-500", bg: "bg-teal-100" },
 SPK_SIGNED: { label: "SPK Signed", color: "text-rose-500", bg: "bg-rose-100" },
 DP_PAID: { label: "DP Paid", color: "text-emerald-500", bg: "bg-emerald-100" },
 PRODUCTION_PLAN: { label: "Production Plan", color: "text-green-500", bg: "bg-green-100" },
 READY_TO_SHIP: { label: "Ready to Ship", color: "text-blue-600", bg: "bg-blue-100" },
 WON_DEAL: { label: "Won Deal", color: "text-emerald-600", bg: "bg-emerald-100" },
 LOST: { label: "Lost", color: "text-rose-600", bg: "bg-rose-100" }
};

const stageToBadgeStatus: Record<string, "neutral" | "process" | "pending" | "success" | "danger" | "purple"> = {
 NEW_LEAD: "neutral",
 CONTACTED: "process",
 FOLLOW_UP_1: "process",
 FOLLOW_UP_2: "process",
 FOLLOW_UP_3: "process",
 NEGOTIATION: "pending",
 SAMPLE_REQUESTED: "process",
 WAITING_FINANCE_APPROVAL: "pending",
 SAMPLE_SENT: "process",
 SAMPLE_APPROVED: "success",
 SPK_SIGNED: "danger",
 DP_PAID: "success",
 PRODUCTION_PLAN: "success",
 READY_TO_SHIP: "process",
 WON_DEAL: "success",
 LOST: "danger",
};

const TRANSITIONS: Record<string, string[]> = {
 NEW_LEAD: ["CONTACTED", "LOST"],
 CONTACTED: ["FOLLOW_UP_1", "NEGOTIATION", "LOST"],
 FOLLOW_UP_1: ["FOLLOW_UP_2", "NEGOTIATION", "LOST"],
 FOLLOW_UP_2: ["FOLLOW_UP_3", "NEGOTIATION", "LOST"],
 FOLLOW_UP_3: ["NEGOTIATION", "LOST"],
 NEGOTIATION: ["SAMPLE_REQUESTED", "SPK_SIGNED", "LOST"],
 SAMPLE_REQUESTED: ["WAITING_FINANCE_APPROVAL", "LOST"],
 SAMPLE_SENT: ["SAMPLE_APPROVED", "LOST"],
 SAMPLE_APPROVED: ["SPK_SIGNED", "LOST"],
 SPK_SIGNED: ["WAITING_FINANCE_APPROVAL", "LOST"],
 PRODUCTION_PLAN: ["READY_TO_SHIP", "LOST"],
 READY_TO_SHIP: ["WON_DEAL", "LOST"],
 WAITING_FINANCE_APPROVAL: [],
 DP_PAID: [],
 LOST: [],
 WON_DEAL: []
};

function getRequiredDocsForTransition(fromStage: string, toStage: string): string[] {
 if (toStage === "SAMPLE_REQUESTED") return ["NPF File", "Client Expectations"];
 if (toStage === "WAITING_FINANCE_APPROVAL" && fromStage === "SAMPLE_REQUESTED") return ["Payment Proof"];
 if (toStage === "WAITING_FINANCE_APPROVAL" && fromStage === "SPK_SIGNED") return ["Payment Proof + SPK File"];
 if (toStage === "SPK_SIGNED") return ["SPK Signed"];
 return [];
}

function getSideEffect(fromStage: string, toStage: string): string {
 if (toStage === "SAMPLE_REQUESTED") return "→ R&D: NPF & Sample Request dibuat";
 if (toStage === "WAITING_FINANCE_APPROVAL" && fromStage === "SAMPLE_REQUESTED") return "→ Finance: Notif G1 Sample Payment";
 if (toStage === "WAITING_FINANCE_APPROVAL" && fromStage === "SPK_SIGNED") return "→ Finance: Notif G2 Production DP ≥50%";
 if (toStage === "SPK_SIGNED") return "→ System: Sales Order PENDING_DP dibuat";
 if (toStage === "SAMPLE_SENT") return "→ R&D: Sample Request → QUEUE";
 if (toStage === "SAMPLE_APPROVED") return "→ Client: Sample disetujui";
 if (toStage === "READY_TO_SHIP") return "→ Warehouse: Pesanan siap dikirim";
 if (toStage === "WON_DEAL") return "→ Finance: Pelunasan diverifikasi. Sistem: Lead marked WON.";
 return "— System: Status updated and logged in audit trail.";
}

export default function PipelineV2Prototype() {
 const [activeTab, setActiveTab] = useState("active");
 const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
 const [nextStage, setNextStage] = useState<string>("");
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isError, setIsError] = useState(false);
 const [errorMessage, setErrorMessage] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

 const {
 leads,
 isLeadsLoading,
 leadsError,
 audit,
 isAuditLoading,
 auditError,
 executeWorkflow,
 } = usePipelineV2();

 const isLoading = activeTab === "active" ? isLeadsLoading : isAuditLoading;
 const data = (activeTab === "active" ? leads : audit) ?? [];

 useEffect(() => {
 const err = activeTab === "active" ? leadsError : auditError;
 if (err) {
 setIsError(true);
 setErrorMessage((err as any)?.message || "Failed to fetch data");
 } else {
 setIsError(false);
 setErrorMessage("");
 }
 }, [leadsError, auditError, activeTab]);

 const handleAction = (lead: PipelineLead, stage: string) => {
 setSelectedLead(lead);
 setNextStage(stage);
 setUploadedFiles([]);
 setIsModalOpen(true);
 };

 const handleExecuteWorkflow = async () => {
 if (!selectedLead) return;
 setIsSubmitting(true);
 try {
 const notesEl = document.querySelector('textarea') as HTMLTextAreaElement;
 await executeWorkflow({
 leadId: selectedLead.id,
 targetStage: nextStage,
 files: uploadedFiles,
 notes: notesEl?.value || '',
 });
 setIsModalOpen(false);
 } finally {
 setIsSubmitting(false);
 }
 };

 const requiredDocsCount = selectedLead ? getRequiredDocsForTransition(selectedLead.status, nextStage).length : 0;
 const isExecutionDisabled = isSubmitting || (requiredDocsCount > 0 && uploadedFiles.length < requiredDocsCount);

 return (
 <OperationalPageShell
 title="Pipeline V2.0"
 subtitle="(State-Machine Driven Commercial Workflow & Conversion Engine)"
 actions={
 <div className="flex gap-2">
 <button type="button" className="operational-button is-secondary">
 <History className="h-4 w-4" />
 <span>Pipeline Snapshot</span>
 </button>
 <OperationalButton variant="primary">
 <Plus className="h-4 w-4" />
 <span>Provision New Lead</span>
 </OperationalButton>
 </div>
 }
 >
 {isError && (
 <Card className="flex items-center gap-4 rounded-md border-l-4 border-rose-500 bg-rose-50 p-6">
 <div className="grid h-12 w-12 place-items-center rounded-md bg-rose-500 text-white">
 <AlertTriangle className="h-5 w-5" />
 </div>
 <div>
 <h3 className="text-[16px] font-semibold text-rose-900">Connection Error</h3>
 <p className="mt-1 text-[12px] font-medium text-rose-700">
 {errorMessage || "Pipeline data unavailable. Check your connection or try again."}
 </p>
 </div>
 </Card>
 )}

 <OperationalTabs value={activeTab} onValueChange={setActiveTab}>
 <OperationalTabsList>
 <OperationalTabsTrigger value="active">
 <Workflow className="h-4 w-4" />
 Active Pipeline
 </OperationalTabsTrigger>
 <OperationalTabsTrigger value="audit">
 <FileText className="h-4 w-4" />
 Audit Trail
 </OperationalTabsTrigger>
 </OperationalTabsList>

 <OperationalTabsContent value="active">
 <AnimatePresence mode="wait">
 <motion.div
 key="active"
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 className="operational-stack"
 >
 <OperationalPanel>
 {isLoading ? (
 <div className="space-y-2 py-4">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="h-12 animate-pulse rounded-md bg-slate-50" />
 ))}
 </div>
 ) : data.length === 0 ? (
 <div className="flex flex-col items-center gap-3 py-16">
 <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-50 text-slate-300">
 <Inbox className="h-10 w-10" />
 </div>
 <div className="space-y-1 text-center">
 <h3 className="text-[16px] font-semibold text-slate-900">No Active Leads</h3>
 <p className="text-[12px] text-slate-500">
 All caught up! New leads will appear here once intake is submitted.
 </p>
 </div>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full table-fixed border-collapse text-left">
 <colgroup>
 <col className="w-[5%]" />
 <col className="w-[22%]" />
 <col className="w-[13%]" />
 <col className="w-[20%]" />
 <col className="w-[20%]" />
 <col className="w-[20%]" />
 </colgroup>
 <thead>
 <tr className="border-b border-slate-200 bg-slate-50">
 <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">#</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Customer & Brand</th>
 <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500">Est. Nilai</th>
 <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">Current Stage & SLA</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Last Action</th>
 <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500">Workflow Protocol</th>
 </tr>
 </thead>
 <tbody>
 {(data as PipelineLead[]).map((lead, idx) => (
 <tr key={lead.id} className="border-b border-slate-100 transition hover:bg-blue-50/30">
 <td className="px-3 py-2.5 text-center text-[12px] font-medium text-slate-400">{idx + 1}</td>
 <td className="px-3 py-2.5">
 <div className="flex flex-col">
 <span className="text-[12px] font-semibold text-slate-900">{lead.clientName}</span>
 <div className="mt-0.5 flex items-center gap-2">
 <span className="text-[10px] text-slate-500">{lead.productInterest}</span>
 <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
 {lead.category || "—"}
 </span>
 </div>
 </div>
 </td>
 <td className="px-3 py-2.5 text-right text-[12px] font-semibold tabular-nums text-slate-900">
 Rp {lead.estimatedValue.toLocaleString()}
 </td>
 <td className="px-3 py-2.5">
 <div className="flex flex-col items-center gap-1">
 <OperationalStatusBadge status={stageToBadgeStatus[lead.status] || "neutral"}>
 {STAGES[lead.status]?.label ?? getOperationalStatusLabel(lead.status)}
 </OperationalStatusBadge>
 <div className="flex items-center gap-2 text-[9px] font-medium text-slate-500">
 <span className={cn("tabular-nums", lead.slaDays > 7 ? "font-semibold text-rose-600" : "")}>
 SLA: {lead.slaDays}d
 </span>
 {lead.status === "WAITING_FINANCE_APPROVAL" && (
 <OperationalStatusBadge status="pending">Finance</OperationalStatusBadge>
 )}
 {lead.status === "SAMPLE_REQUESTED" && (
 <OperationalStatusBadge status="process">R&D</OperationalStatusBadge>
 )}
 {lead.status === "DP_PAID" && (
 <OperationalStatusBadge status="success">Gate Cleared</OperationalStatusBadge>
 )}
 </div>
 </div>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-[8px] font-semibold text-slate-700">
 {lead.lastActionBy ? lead.lastActionBy.charAt(0) : "?"}
 </div>
 <div className="flex flex-col">
 <span className="text-[10px] font-semibold text-slate-700">
 {lead.notes || "Initial Intake"}
 </span>
 <span className="text-[8px] text-slate-500">By {lead.lastActionBy || "—"}</span>
 </div>
 </div>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center justify-end gap-2">
 <DropdownMenu>
 <DropdownMenuTrigger asChild disabled={TRANSITIONS[lead.status].length === 0}>
 <button
 type="button"
 className={cn(
 "operational-button is-secondary h-8 px-3 text-[11px]",
 TRANSITIONS[lead.status].length === 0 && "opacity-50 cursor-not-allowed",
 )}
 >
 <span>{TRANSITIONS[lead.status].length === 0 ? "LOCKED" : "Protocol"}</span>
 <ChevronDown className="h-3 w-3" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent className="min-w-[180px] rounded-md border-slate-200 p-1">
 {TRANSITIONS[lead.status].map(stage => (
 <DropdownMenuItem
 key={stage}
 onClick={() => handleAction(lead, stage)}
 className="flex h-8 cursor-pointer justify-between rounded-md px-2 text-[10px] font-medium hover:bg-blue-50"
 >
 {STAGES[stage]?.label ?? getOperationalStatusLabel(stage)}
 <ArrowRight className="h-3 w-3 text-blue-500" />
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 <button
 type="button"
 onClick={() => lead.status !== "WAITING_FINANCE_APPROVAL" && handleAction(lead, TRANSITIONS[lead.status][0])}
 disabled={TRANSITIONS[lead.status].length === 0}
 className={cn(
 "operational-button h-8 px-3 text-[11px]",
 TRANSITIONS[lead.status].length === 0
 ? "is-secondary opacity-50 cursor-not-allowed"
 : "is-primary",
 )}
 >
 <span>Exec</span>
 <Zap className="h-3 w-3" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </OperationalPanel>
 </motion.div>
 </AnimatePresence>
 </OperationalTabsContent>

 <OperationalTabsContent value="audit">
 <AnimatePresence mode="wait">
 <motion.div
 key="audit"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="operational-stack"
 >
 <OperationalPanel>
 {isLoading ? (
 <div className="space-y-2 py-4">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="h-12 animate-pulse rounded-md bg-slate-50" />
 ))}
 </div>
 ) : data.length === 0 ? (
 <div className="flex flex-col items-center gap-3 py-16">
 <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-50 text-slate-300">
 <FileSearch className="h-10 w-10" />
 </div>
 <h3 className="text-[16px] font-semibold text-slate-900">No History Found</h3>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full table-fixed border-collapse text-left">
 <colgroup>
 <col className="w-[18%]" />
 <col className="w-[17%]" />
 <col className="w-[26%]" />
 <col className="w-[17%]" />
 <col className="w-[12%]" />
 <col className="w-[10%]" />
 </colgroup>
 <thead>
 <tr className="border-b border-slate-200 bg-slate-50">
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Timestamp</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Customer</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Transition</th>
 <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">System Triggers</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Artifacts</th>
 <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500">Performed By</th>
 </tr>
 </thead>
 <tbody>
 {(data as AuditLogEntry[]).map((item) => (
 <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50/50">
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 <Clock className="h-4 w-4 text-slate-400" />
 <span className="text-[10px] font-medium tabular-nums text-slate-500">{item.timestamp}</span>
 </div>
 </td>
 <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-900">{item.clientName}</td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 <OperationalStatusBadge status="neutral">
 {item.fromStage ? STAGES[item.fromStage]?.label ?? item.fromStage : "—"}
 </OperationalStatusBadge>
 <ArrowRight className="h-3 w-3 text-blue-500" />
 <OperationalStatusBadge status={item.toStage ? (stageToBadgeStatus[item.toStage] || "neutral") : "neutral"}>
 {item.toStage ? STAGES[item.toStage]?.label ?? item.toStage : "—"}
 </OperationalStatusBadge>
 </div>
 </td>
 <td className="px-3 py-2.5 text-center">
 <div className="flex justify-center gap-1">
 {(item.effects ?? []).map((e: string, idx: number) => (
 <OperationalStatusBadge key={idx} status="success">
 {e}
 </OperationalStatusBadge>
 ))}
 </div>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex gap-1">
 {(item.artifacts ?? []).map((_d: string, idx: number) => (
 <div key={idx} className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-slate-500">
 <FileText className="h-3.5 w-3.5" />
 </div>
 ))}
 {item.artifacts?.length === 0 && <span className="text-[10px] font-medium text-slate-400">None</span>}
 </div>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center justify-end gap-2">
 <span className="text-[10px] font-medium text-slate-700">{item.performedBy ?? "—"}</span>
 <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
 {(item.performedBy ?? "—").charAt(0)}
 </div>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </OperationalPanel>
 </motion.div>
 </AnimatePresence>
 </OperationalTabsContent>
 </OperationalTabs>

 {/* Workflow Execution Modal */}
 <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
 <DialogContent className="max-w-3xl rounded-md border-none p-0">
 <div className="relative border-b border-slate-200 p-6">
 <div className="relative z-10 flex items-start justify-between">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <Workflow className="h-4 w-4 text-blue-600" />
 <span className="text-[10px] font-medium uppercase tracking-wider text-blue-600">Workflow Protocol Execution</span>
 </div>
 <DialogTitle className="text-[24px] font-semibold uppercase tracking-tight text-slate-900">
 Transition Protocol
 </DialogTitle>
 </div>
 {selectedLead && (
 <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-700">
 Lead ID: #{selectedLead.id}
 </span>
 )}
 </div>
 </div>

 <div className="space-y-6 p-8">
 <div className="flex items-center justify-center gap-8">
 <div className="flex flex-col items-center gap-3">
 <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Current Stage</span>
 <OperationalStatusBadge
 status={selectedLead ? (stageToBadgeStatus[selectedLead.status] || "neutral") : "neutral"}
 >
 {selectedLead ? STAGES[selectedLead.status]?.label ?? selectedLead.status : "—"}
 </OperationalStatusBadge>
 </div>
 <ArrowRight className="h-6 w-6 text-blue-600" />
 <div className="flex flex-col items-center gap-3">
 <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Next State</span>
 <OperationalStatusBadge status={nextStage ? (stageToBadgeStatus[nextStage] || "neutral") : "neutral"}>
 {nextStage ? STAGES[nextStage]?.label ?? nextStage : "—"}
 </OperationalStatusBadge>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-4">
 <div className="space-y-3">
 <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-500">Required Artifacts</label>
 <div className="space-y-3">
 {selectedLead && getRequiredDocsForTransition(selectedLead.status, nextStage).map((docLabel, i) => (
 <div key={i} className="group relative">
 <input
 type="file"
 className="hidden"
 id={`file-upload-${i}`}
 onChange={(e) => {
 if (e.target.files?.[0]) setUploadedFiles(prev => [...prev, e.target.files![0]]);
 }}
 />
 <label
 htmlFor={`file-upload-${i}`}
 className="flex h-14 w-full cursor-pointer items-center justify-between rounded-md border-2 border-dashed border-slate-200 bg-slate-50 px-4 transition hover:border-blue-400 hover:bg-blue-50/50"
 >
 <div className="flex items-center gap-3">
 <div className="grid h-9 w-9 place-items-center rounded-md bg-white text-slate-400">
 {uploadedFiles[i] ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Upload className="h-4 w-4" />}
 </div>
 <div className="flex flex-col">
 <span className="line-clamp-1 text-[10px] font-semibold text-slate-900">
 {uploadedFiles[i] ? uploadedFiles[i].name : docLabel}
 </span>
 <span className="text-[9px] text-slate-500">
 {uploadedFiles[i] ? "Uploaded Successfully" : "PDF, JPG or XLSX Max 10MB"}
 </span>
 </div>
 </div>
 <span className="text-[9px] font-medium text-blue-600 underline opacity-0 transition group-hover:opacity-100">
 Attach
 </span>
 </label>
 </div>
 ))}
 {(!selectedLead || getRequiredDocsForTransition(selectedLead.status, nextStage).length === 0) && (
 <div className="flex h-14 w-full items-center justify-center rounded-md border-2 border-dashed border-slate-100 bg-slate-50/50">
 <span className="text-[10px] font-medium text-slate-400">— No Artifacts Required —</span>
 </div>
 )}
 </div>
 </div>

 <OperationalField label="Operational Notes">
 <textarea
 placeholder="Detail transition rationale or client feedback..."
 className="min-h-[120px] w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 </OperationalField>
 </div>

 <div className="relative overflow-hidden rounded-md border border-emerald-100 bg-emerald-50 p-4">
 <div className="relative z-10 flex items-center gap-2">
 <Zap className="h-4 w-4 text-emerald-600" />
 <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">Automated Side Effects</span>
 </div>
 <p className="relative z-10 mt-2 text-[12px] font-medium text-emerald-700">
 {selectedLead ? getSideEffect(selectedLead.status, nextStage) : "— System: Status updated and logged in audit trail."}
 </p>
 </div>
 </div>

 <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-8 py-4">
 <div className="flex items-center gap-3">
 <ShieldCheck className="h-5 w-5 text-blue-600" />
 <p className="max-w-xs text-[10px] leading-relaxed text-slate-500">
 By executing, you confirm all required documents are valid and the transition follows standard protocol.
 </p>
 </div>
 <div className="flex gap-2">
 <button type="button" className="operational-button is-secondary" onClick={() => setIsModalOpen(false)}>
 Abandon
 </button>
 <OperationalButton variant="primary" onClick={handleExecuteWorkflow} disabled={isExecutionDisabled}>
 {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
 <span>Execute Workflow</span>
 </OperationalButton>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </OperationalPageShell>
 );
}
