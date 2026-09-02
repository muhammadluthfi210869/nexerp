"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Search, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Save, 
  Calendar, 
  User, 
  Filter, 
  MoreVertical, 
  Clock, 
  ArrowRight, 
  FileText, 
  Beaker, 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  History, 
  LayoutGrid, 
  Zap, 
  Upload, 
  ChevronRight,
  Info,
  DollarSign,
  Workflow,
  MessageSquare,
  ShieldCheck,
  Expand,
  Maximize2,
  Loader2,
  Inbox,
  FileSearch
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { DnaBadge } from "@/components/dna/DnaBadge";
import { TableWrapper } from "@/components/dna/TableWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Types ---
import type { PipelineLead, AuditLogEntry } from "@/types/pipeline-v2";
import { usePipelineV2 } from "@/hooks/use-pipeline-v2";
import { DashboardShell } from "@/components/layout/DashboardShell";

// --- Constants & Logic ---

const STAGES: Record<string, { label: string, color: string, bg: string }> = {
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

const stageToBadgeStatus: Record<string, "success" | "info" | "warning" | "critical" | "purple" | "default"> = {
  NEW_LEAD: "default",
  CONTACTED: "info",
  FOLLOW_UP_1: "info",
  FOLLOW_UP_2: "info",
  FOLLOW_UP_3: "info",
  NEGOTIATION: "warning",
  SAMPLE_REQUESTED: "info",
  WAITING_FINANCE_APPROVAL: "warning",
  SAMPLE_SENT: "info",
  SAMPLE_APPROVED: "success",
  SPK_SIGNED: "critical",
  DP_PAID: "success",
  PRODUCTION_PLAN: "success",
  READY_TO_SHIP: "info",
  WON_DEAL: "success",
  LOST: "critical",
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
  if (toStage === "SAMPLE_REQUESTED") return "â†’ R&D: NPF & Sample Request dibuat";
  if (toStage === "WAITING_FINANCE_APPROVAL" && fromStage === "SAMPLE_REQUESTED") return "â†’ Finance: Notif G1 Sample Payment";
  if (toStage === "WAITING_FINANCE_APPROVAL" && fromStage === "SPK_SIGNED") return "â†’ Finance: Notif G2 Production DP â‰¥50%";
  if (toStage === "SPK_SIGNED") return "â†’ System: Sales Order PENDING_DP dibuat";
  if (toStage === "SAMPLE_SENT") return "â†’ R&D: Sample Request â†’ QUEUE";
  if (toStage === "SAMPLE_APPROVED") return "â†’ Client: Sample disetujui";
  if (toStage === "READY_TO_SHIP") return "â†’ Warehouse: Pesanan siap dikirim";
  if (toStage === "WON_DEAL") return "â†’ Finance: Pelunasan diverifikasi. Sistem: Lead marked WON.";
  return "â€” System: Status updated and logged in audit trail.";
}

// Data will be fetched from API via usePipelineV2 hook

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
    isExecuting,
  } = usePipelineV2();

  const isLoading = activeTab === "active" ? isLeadsLoading : isAuditLoading;
  const data = activeTab === "active" ? leads : audit;

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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

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
    <DashboardShell
      title="PIPELINE"
      titleAccent="V2.0"
      subtitle="(State-Machine Driven Commercial Workflow & Conversion Engine)"
      actions={
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="h-12 px-6 border border-slate-200 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-sm hover:bg-slate-50 transition-all"
          >
            <History className="mr-2 h-4 w-4 text-blue-500" /> Pipeline Snapshot
          </Button>
          <Button 
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-sm shadow-blue-100 font-black uppercase tracking-tighter text-sm border-none transition-all hover:scale-105"
          >
            <Plus className="mr-2 h-5 w-5" /> Provision New Lead
          </Button>
        </div>
      }
    >
      {isError && (
        <Card className="rounded-2xl border-none shadow-sm p-8 bg-rose-50 border-l-4 border-rose-500 flex items-center gap-6">
           <div className="h-14 w-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <AlertTriangle className="h-6 w-6" />
           </div>
           <div>
              <h3 className="text-lg font-black text-rose-900 uppercase italic tracking-tight">Connection Error</h3>
              <p className="text-xs font-black text-rose-700 uppercase italic mt-1">{errorMessage || "Pipeline data unavailable. Check your connection or try again."}</p>
           </div>
        </Card>
      )}

      <Tabs defaultValue="active" className="space-y-10" onValueChange={setActiveTab}>
        <TabsList className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-16 w-fit inline-flex">
          <TabsTrigger value="active" className="rounded-2xl px-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Active Pipeline</TabsTrigger>
          <TabsTrigger value="audit" className="rounded-2xl px-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Audit Trail</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === "active" ? (
             <motion.div
               key="active"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="space-y-8"
             >
                <Card className="rounded-2xl border-none shadow-sm shadow-slate-200/30 overflow-hidden bg-white">
                  <TableWrapper><table>
                    <thead className="bg-slate-50/50">
                      <tr className="hover:bg-transparent border-slate-100">
                        <th className="py-4 px-4 text-table-header text-slate-400 w-12 text-center">#</th>
                        <th className="py-4 px-4 text-table-header text-slate-400">Customer & Brand</th>
                        <th className="py-4 px-4 text-table-header text-slate-400 text-right">Est. Nilai</th>
                        <th className="py-4 px-4 text-table-header text-slate-400 text-center">Current Stage & SLA</th>
                        <th className="py-4 px-4 text-table-header text-slate-400">Last Action</th>
                        <th className="py-4 px-4 text-table-header text-slate-400 text-right pr-6">Workflow Protocol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="border-b border-slate-50">
                            <td className="py-4 px-4 text-center"><div className="h-4 w-4 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                            <td className="py-4 px-4"><div className="space-y-2"><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /><div className="h-3 w-20 bg-slate-50 rounded animate-pulse" /></div></td>
                            <td className="py-4 px-4 text-right"><div className="h-4 w-24 bg-slate-100 rounded animate-pulse ml-auto" /></td>
                            <td className="py-4 px-4 text-center"><div className="h-8 w-28 bg-slate-100 rounded-xl animate-pulse mx-auto" /></td>
                            <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-100 rounded animate-pulse" /></td>
                            <td className="py-4 px-4 text-right pr-6"><div className="h-10 w-36 bg-slate-100 rounded-xl animate-pulse ml-auto" /></td>
                          </tr>
                        ))
                      ) : data.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="py-24 text-center">
                              <div className="flex flex-col items-center gap-4">
                                 <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                                    <Inbox className="h-12 w-12" />
                                 </div>
                                 <div className="space-y-1">
                                    <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">No Active Leads</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">All caught up! New leads will appear here once intake is submitted.</p>
                                 </div>
                              </div>
                           </td>
                        </tr>
                      ) : (data as PipelineLead[]).map((lead, idx) => (
                        <tr key={lead.id} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                          <td className="py-3 px-4 text-center font-medium italic text-slate-300">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{lead.clientName}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{lead.productInterest}</span>
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded-md">{lead.category || '—'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                             <span className="text-xs font-black text-slate-900 tabular-nums italic">Rp {lead.estimatedValue.toLocaleString()}</span>
                          </td>
                          <td className="py-3 px-4">
                             <div className="flex flex-col items-center gap-1.5">
                                 <DnaBadge status={stageToBadgeStatus[lead.status] || "default"}>
                                  {STAGES[lead.status].label}
                                </DnaBadge>
                               <div className="flex items-center gap-2 text-[9px] font-medium text-slate-400">
                                 <span className={cn("tabular-nums", lead.slaDays > 7 ? "text-rose-600 font-black animate-pulse" : "")}>
                                   SLA: {lead.slaDays}d
                                 </span>
                                 {lead.status === 'WAITING_FINANCE_APPROVAL' && (
                                     <DnaBadge status="warning">Finance</DnaBadge>
                                 )}
                                 {lead.status === 'SAMPLE_REQUESTED' && (
                                     <DnaBadge status="info">R&amp;D</DnaBadge>
                                 )}
                                 {lead.status === 'DP_PAID' && (
                                     <DnaBadge status="success">Gate Cleared</DnaBadge>
                                 )}
                               </div>
                             </div>
                          </td>
                          <td className="py-3 px-4">
                             <div className="flex items-center gap-3">
                                   <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-700 italic border border-slate-100 shadow-sm">
                                    {lead.lastActionBy ? lead.lastActionBy.charAt(0) : '?'}
                                  </div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-700 uppercase italic tracking-tight">{lead.notes || "Initial Intake"}</span>
                                    <span className="text-[8px] font-medium text-slate-400 uppercase">By {lead.lastActionBy || '—'}</span>
                                 </div>
                             </div>
                          </td>
                          <td className="py-3 px-4 pr-6 text-right">
                             <div className="flex items-center gap-2 justify-end">
                                <DropdownMenu>
                                   <DropdownMenuTrigger asChild disabled={TRANSITIONS[lead.status].length === 0}>
                                      <Button variant="outline" className={cn(
                                        "h-8 px-3 rounded-lg border-slate-200 bg-white font-black uppercase text-[8px] tracking-wider gap-1.5 shadow-sm",
                                        TRANSITIONS[lead.status].length === 0 && "opacity-50 grayscale"
                                      )}>
                                         {TRANSITIONS[lead.status].length === 0 ? "LOCKED" : "Protocol"}
                                         <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
                                      </Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent className="rounded-xl border-none shadow-sm p-2 bg-white min-w-[180px]">
                                      {TRANSITIONS[lead.status].map(stage => (
                                        <DropdownMenuItem 
                                          key={stage} 
                                          onClick={() => handleAction(lead, stage)}
                                          className="rounded-lg h-9 px-3 font-black uppercase text-[8px] hover:bg-blue-50 cursor-pointer flex justify-between"
                                        >
                                           {STAGES[stage].label}
                                           <ArrowRight className="h-3 w-3 text-blue-500" />
                                        </DropdownMenuItem>
                                      ))}
                                   </DropdownMenuContent>
                                </DropdownMenu>

                                <Button 
                                  onClick={() => lead.status !== 'WAITING_FINANCE_APPROVAL' && handleAction(lead, TRANSITIONS[lead.status][0])}
                                  disabled={TRANSITIONS[lead.status].length === 0}
                                    className="h-8 px-4 bg-slate-800 hover:bg-blue-600 text-white rounded-lg shadow font-black uppercase text-[8px] tracking-wider transition-all group"
                                >
                                   Exec <Zap className="ml-1.5 h-2.5 w-2.5 text-amber-400 group-hover:scale-110 transition-transform" />
                                </Button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></TableWrapper>
                </Card>
             </motion.div>
          ) : (
             <motion.div
               key="audit"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-8"
             >
                <Card className="rounded-2xl border-none shadow-sm shadow-slate-200/30 overflow-hidden bg-white">
                   <TableWrapper><table>
                      <thead className="bg-slate-50/50">
                        <tr className="hover:bg-transparent border-slate-100">
                          <th className="py-6 pl-10 text-table-header text-slate-400 w-48">Timestamp</th>
                          <th className="text-table-header text-slate-400">Customer</th>
                          <th className="text-table-header text-slate-400">Transition</th>
                          <th className="text-table-header text-slate-400 text-center">System Triggers</th>
                          <th className="text-table-header text-slate-400">Artifacts</th>
                          <th className="pr-10 text-table-header text-slate-400 text-right">Performed By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                           [...Array(5)].map((_, i) => (
                             <tr key={i} className="border-b border-slate-50">
                               <td className="py-6 pl-10"><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /></td>
                               <td><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></td>
                               <td><div className="h-6 w-48 bg-slate-100 rounded animate-pulse" /></td>
                               <td className="text-center"><div className="h-6 w-24 bg-slate-100 rounded-xl animate-pulse mx-auto" /></td>
                               <td><div className="h-7 w-7 bg-slate-100 rounded-lg animate-pulse" /></td>
                               <td className="pr-10 text-right"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse ml-auto" /></td>
                             </tr>
                           ))
                         ) : data.length === 0 ? (
                            <tr>
                               <td colSpan={6} className="py-24 text-center">
                                  <div className="flex flex-col items-center gap-4">
                                     <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                                        <FileSearch className="h-12 w-12" />
                                     </div>
                                     <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">No History Found</h3>
                                  </div>
                               </td>
                            </tr>
                         ) : (data as AuditLogEntry[]).map((item) => (
                          <tr key={item.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                             <td className="py-6 pl-10">
                                <div className="flex items-center gap-2">
                                   <Clock className="h-4 w-4 text-slate-400" />
                                   <span className="text-[10px] font-black text-slate-400 uppercase tabular-nums">{item.timestamp}</span>
                                </div>
                             </td>
                             <td>
                                <span className="font-black text-slate-900 uppercase italic text-xs tracking-tight">{item.clientName}</span>
                             </td>
                             <td>
                                <div className="flex items-center gap-3">
                                     <DnaBadge status="default">{item.fromStage ? STAGES[item.fromStage]?.label || item.fromStage : '—'}</DnaBadge>
                                    <ArrowRight className="h-3 w-3 text-blue-500" />
                                     <DnaBadge status={item.toStage ? (stageToBadgeStatus[item.toStage] || "default") : "default"}>{item.toStage ? STAGES[item.toStage]?.label || item.toStage : '—'}</DnaBadge>
                                </div>
                             </td>
                             <td className="text-center">
                                <div className="flex justify-center gap-1">
                                   {item.effects.map((e, idx) => (
                                      <DnaBadge key={idx} status="success">✅ {e}</DnaBadge>
                                   ))}
                                </div>
                             </td>
                             <td>
                                <div className="flex gap-1">
                                   {item.artifacts.map((d, idx) => (
                                      <div key={idx} className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-200 hover:text-slate-900 transition-all">
                                        <FileText className="h-4 w-4" />
                                     </div>
                                   ))}
                                   {item.artifacts.length === 0 && <span className="text-[10px] font-black text-slate-300 uppercase">None</span>}
                                </div>
                             </td>
                             <td className="pr-10 text-right">
                                <div className="flex items-center justify-end gap-2">
                                   <span className="text-[10px] font-black text-slate-700 uppercase italic underline decoration-slate-200 underline-offset-4">{item.performedBy}</span>
                                     <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700 italic">
                                      {item.performedBy.charAt(0)}
                                   </div>
                                </div>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                   </table></TableWrapper>
                </Card>
             </motion.div>
          )}
        </AnimatePresence>
      </Tabs>

      {/* Workflow Execution Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl rounded-2xl border-none shadow-sm p-0 overflow-hidden bg-white">
          <div className="bg-white border-b border-slate-200 p-10 text-slate-900 relative">
             <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-2">
                   <div className="flex items-center gap-2">
                      <Workflow className="h-4 w-4 text-blue-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Workflow Protocol Execution</span>
                   </div>
                   <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Transition <span className="text-blue-600">Protocol</span></DialogTitle>
                </div>
                {selectedLead && (
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 font-black text-[10px] uppercase px-4 py-2 rounded-lg">
                       Lead ID: #{selectedLead.id}
                    </span>
                )}
             </div>
              <Workflow className="h-48 w-48 text-black/5 absolute -right-12 -bottom-12 rotate-12" />
          </div>

          <div className="p-12 space-y-10">
             <div className="flex items-center justify-center gap-10">
                <div className="flex flex-col items-center gap-4">
                   <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Current Stage</span>
<DnaBadge status={selectedLead ? (stageToBadgeStatus[selectedLead.status] || "default") : "default"}>
                        {selectedLead ? STAGES[selectedLead.status].label : ""}
                     </DnaBadge>
                 </div>
                 <ArrowRight className="h-8 w-8 text-blue-600" />
                 <div className="flex flex-col items-center gap-4">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Next State</span>
<DnaBadge status={nextStage ? (stageToBadgeStatus[nextStage] || "default") : "default"}>
                        {nextStage ? STAGES[nextStage].label : ""}
                     </DnaBadge>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-10 pt-6 border-t border-slate-50">
                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Required Artifacts</label>
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
                              <label htmlFor={`file-upload-${i}`} className="h-16 w-full border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between px-6 group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-all cursor-pointer">
                                 <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                       {uploadedFiles[i] ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Upload className="h-5 w-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black uppercase text-slate-900 italic tracking-tight line-clamp-1">{uploadedFiles[i] ? uploadedFiles[i].name : docLabel}</span>
                                       <span className="text-[8px] font-medium text-slate-400 uppercase">{uploadedFiles[i] ? "Uploaded Successfully" : "PDF, JPG or XLSX Max 10MB"}</span>
                                    </div>
                                 </div>
                                 <span className="text-[8px] font-black uppercase text-blue-600 underline underline-offset-4 opacity-0 group-hover:opacity-100">Attach</span>
                              </label>
                           </div>
                         ))}
                         {(!selectedLead || getRequiredDocsForTransition(selectedLead.status, nextStage).length === 0) && (
                            <div className="h-16 w-full border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 flex items-center justify-center">
                               <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-widest">â€” No Artifacts Required â€”</span>
                            </div>
                         )}
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Notes</label>
                      <textarea 
                        placeholder="Detail transition rationale or client feedback..." 
                        className="w-full h-40 bg-slate-50 border-none rounded-2xl p-6 font-black text-xs uppercase italic text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                      />
                   </div>
                </div>
             </div>

             <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-100 space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-2 relative z-10">
                   <Zap className="h-4 w-4 text-emerald-600" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Automated Side Effects</span>
                </div>
                <p className="text-xs font-black text-emerald-700 italic uppercase relative z-10 leading-relaxed">
                   {selectedLead ? getSideEffect(selectedLead.status, nextStage) : "â€” System: Status updated and logged in audit trail."}
                </p>
                <CheckCircle2 className="h-24 w-24 text-emerald-500/10 absolute -right-6 -bottom-6" />
             </div>
          </div>

          <div className="p-8 bg-slate-50 flex justify-between items-center px-12 border-t border-slate-100">
             <div className="flex items-center gap-4">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <p className="text-[9px] font-medium text-slate-400 uppercase italic max-w-xs leading-relaxed">
                   By executing, you confirm all required documents are valid and the transition follows standard protocol.
                </p>
             </div>
             <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-rose-50 hover:text-rose-600">Abandon</Button>
                <Button 
                   onClick={handleExecuteWorkflow}
                   disabled={isExecutionDisabled}
                   className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-sm shadow-blue-200 font-black uppercase text-xs tracking-tighter disabled:opacity-50"
                >
                   {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Execute Workflow"}
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function ChevronDown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
