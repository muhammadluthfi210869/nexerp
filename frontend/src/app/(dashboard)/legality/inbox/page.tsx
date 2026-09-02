"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Inbox, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  MessageSquare,
  Beaker,
  ImageIcon,
  CreditCard,
  ChevronRight,
  AlertTriangle,
  ZoomIn,
  Download,
  Maximize2,
  PlusCircle,
  RefreshCcw,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TableWrapper, DataCard, DnaBadge, DnaButton } from "@/components/dna";

export default function ComplianceInboxPage() {
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<any>(null);

  const { data: tasks, isLoading, isError, refetch } = useQuery({
    queryKey: ["compliance-tasks"],
    queryFn: async () => {
      const resp = await api.get("/legality/inbox/tasks");
      return resp.data || [];
    }
  });

  const submitReviewMutation = useMutation({
    mutationFn: ({ pipelineId, isApproved, notes }: any) => 
      api.post(`/legality/pipeline/${pipelineId}/artwork-review`, { isApproved, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-tasks"] });
      toast.success("Review finalized");
      setSelectedTaskId(null);
    }
  });

  const { data: validationResult, isLoading: isValidating } = useQuery({
    queryKey: ["formula-validation", activeTask?.formulaId],
    queryFn: async () => {
      const resp = await api.get(`/legality/formula/${activeTask.formulaId}/validate`);
      return resp.data;
    },
    enabled: !!activeTask && activeTask.type === "FORMULA_VALIDATION" && !!activeTask.formulaId,
  });

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      if (!selectedTaskId) {
        setSelectedTaskId(tasks[0].id);
        setActiveTask(tasks[0]);
      } else {
        const current = tasks.find((t: any) => t.id === selectedTaskId);
        if (current) setActiveTask(current);
      }
    } else {
      setActiveTask(null);
    }
  }, [tasks, selectedTaskId]);

  const getDnaPriority = (priority: string) => {
    switch (priority) {
      case "HIGH": return <DnaBadge status="critical">HIGH</DnaBadge>;
      case "MEDIUM": return <DnaBadge status="warning">MEDIUM</DnaBadge>;
      default: return <DnaBadge status="default">LOW</DnaBadge>;
    }
  };

  return (
    <DashboardShell
      title="COMPLIANCE"
      titleAccent="INBOX"
      subtitle="Regulatory curation task inbox and AI verification center"
    >
      <div className="flex h-[calc(100vh-180px)] bg-white overflow-hidden rounded-2xl border border-slate-200 shadow-card animate-fade-slide-in">
        {/* Left Sidebar: Task List */}
        <aside className="w-[360px] border-r border-slate-100 flex flex-col bg-slate-50/30 shrink-0">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/10">
                  <Inbox className="w-4.5 h-4.5 text-white" />
                </div>
                <h1 className="text-sm font-black tracking-tight italic uppercase text-slate-900">
                  COMPLIANCE <span className="text-blue-600">INBOX</span>
                </h1>
              </div>
              <button 
                onClick={() => refetch()} 
                className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <RefreshCcw className={cn("w-3.5 h-3.5 text-slate-400", isLoading && "animate-spin")} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input 
                placeholder="FILTER TASKS..." 
                className="w-full h-11 pl-9 pr-4 bg-white border border-slate-200 rounded-xl font-black text-[10px] tracking-wider uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 border-t border-slate-100">
            {isLoading && (
              <div className="p-10 flex flex-col items-center justify-center gap-3">
                <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Synchronizing Hub...</p>
              </div>
            )}

            {isError && (
              <div className="p-10 text-center space-y-3">
                <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto opacity-40 animate-pulse" />
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest leading-none">Connection Interrupted</p>
                <DnaButton variant="outline" size="sm" onClick={() => refetch()}>Try Again</DnaButton>
              </div>
            )}
            
            {!isLoading && !isError && (!tasks || tasks.length === 0) && (
              <div className="p-8 text-center space-y-4">
                <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                  <Sparkles className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase italic tracking-wider">System is Clean</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-1">No pending regulatory tasks detected.</p>
                </div>
                <Link href="/legality/pipeline">
                  <DnaButton variant="primary" className="w-full">
                    <PlusCircle className="w-4 h-4 mr-1" /> Start Pipeline
                  </DnaButton>
                </Link>
              </div>
            )}

            {tasks?.map((task: any) => (
              <button
                key={task.id}
                onClick={() => { setSelectedTaskId(task.id); setActiveTask(task); }}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-all border relative overflow-hidden group cursor-pointer",
                  selectedTaskId === task.id 
                    ? "bg-white border-blue-600/20 shadow-md ring-1 ring-blue-600/5" 
                    : "bg-transparent border-transparent hover:bg-white/60 hover:border-slate-100"
                )}
              >
                {selectedTaskId === task.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                )}
                <div className="flex justify-between items-center mb-2">
                  {getDnaPriority(task.priority)}
                  <span className="text-[8px] font-bold text-slate-400 uppercase italic leading-none">{new Date(task.createdAt).toLocaleTimeString()}</span>
                </div>
                <h3 className={cn("text-[11px] font-black uppercase tracking-tight italic mb-2 transition-colors", selectedTaskId === task.id ? "text-blue-600" : "text-slate-600 group-hover:text-slate-900")}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-2">
                  {task.type === "FORMULA_VALIDATION" && <Beaker className="w-3.5 h-3.5 text-indigo-500" />}
                  {task.type === "ARTWORK_REVIEW" && <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
                  {task.type === "PNBP_FILING" && <CreditCard className="w-3.5 h-3.5 text-emerald-500" />}
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{task.type.replace('_', ' ')}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Right Content: Workspace */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTask ? (
              <motion.div 
                key={activeTask.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
              <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/10">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Workspace / {activeTask.type}</span>
                    <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                    <span className="text-[8px] font-black uppercase tracking-wider text-blue-600">ID: {activeTask.pipelineId.substring(0,8)}</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tighter italic uppercase text-slate-900 leading-none">{activeTask.title}</h2>
                </div>
                <div className="flex gap-2">
                  <DnaButton 
                    variant="outline"
                    icon={<MessageSquare />}
                    onClick={() => toast.info("Rejection log window initiated.")}
                  >
                    Reject
                  </DnaButton>
                  <DnaButton 
                    variant="primary"
                    icon={<CheckCircle2 />}
                    onClick={() => submitReviewMutation.mutate({ pipelineId: activeTask.pipelineId, isApproved: true, notes: "Approved directly from workspace header" })}
                  >
                    Approve
                  </DnaButton>
                </div>
              </header>

              <div className="flex-1 p-6 overflow-y-auto">
                {activeTask.type === "ARTWORK_REVIEW" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                      <div className="aspect-video bg-slate-100 border border-slate-200 rounded-2xl relative overflow-hidden group flex items-center justify-center shadow-inner">
                        <ImageIcon className="w-12 h-12 text-slate-300 absolute pointer-events-none" />
                        <Image 
                          src="https://placehold.co/1200x800/f8fafc/cbd5e1?text=ARTWORK+PREVIEW" 
                          alt="Artwork Preview"
                          width={1200}
                          height={800}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <button className="h-9 w-9 rounded-lg bg-white/90 border border-slate-200 text-slate-600 shadow-sm hover:bg-white flex items-center justify-center cursor-pointer transition-colors"><ZoomIn className="w-4 h-4" /></button>
                          <button className="h-9 w-9 rounded-lg bg-white/90 border border-slate-200 text-slate-600 shadow-sm hover:bg-white flex items-center justify-center cursor-pointer transition-colors"><Maximize2 className="w-4 h-4" /></button>
                          <button className="h-9 w-9 rounded-lg bg-white/90 border border-slate-200 text-slate-600 shadow-sm hover:bg-white flex items-center justify-center cursor-pointer transition-colors"><Download className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DataCard
                          dotColor="bg-blue-500"
                          title="REGULATORY CHECKLIST"
                          titleColor="text-slate-400"
                          className="!p-5 rounded-2xl bg-slate-50/30"
                          noShadow
                        >
                          <div className="space-y-2 mt-1">
                            {["Batch Number", "Composition", "Net Weight", "Manufacturer"].map((check) => (
                              <div key={check} className="flex items-center gap-2 py-0.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="text-[11px] font-bold text-slate-600 uppercase">{check}</span>
                              </div>
                            ))}
                          </div>
                        </DataCard>
                        <DataCard
                          dotColor="bg-amber-500"
                          title="DESIGNER NOTES"
                          titleColor="text-slate-400"
                          className="!p-5 rounded-2xl bg-slate-50/30"
                          noShadow
                        >
                          <p className="text-[11px] font-bold text-slate-500 italic leading-relaxed uppercase mt-1">
                            "Updated version based on revision #3. Adjusted font size to meet requirements."
                          </p>
                        </DataCard>
                      </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4">
                      <DataCard
                        dotColor="bg-blue-600"
                        title="FINAL VERDICT"
                        titleColor="text-blue-600"
                        className="!p-5 rounded-2xl"
                      >
                        <div className="flex flex-col gap-2 mt-2">
                          <DnaButton 
                            variant="primary"
                            onClick={() => submitReviewMutation.mutate({ pipelineId: activeTask.pipelineId, isApproved: true, notes: "Approved via Pass Artwork button" })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Pass Artwork
                          </DnaButton>
                          <DnaButton 
                            variant="danger"
                            onClick={() => submitReviewMutation.mutate({ pipelineId: activeTask.pipelineId, isApproved: false, notes: "Rejected artwork review" })}
                          >
                            Fail & Revise
                          </DnaButton>
                        </div>
                        <div className="space-y-1.5 mt-4">
                          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Comments</label>
                          <textarea className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold italic focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
                        </div>
                      </DataCard>
                    </div>
                  </div>
                )}

                {activeTask.type === "FORMULA_VALIDATION" && (
                  <div className="space-y-6">
                    <DataCard
                      dotColor="bg-indigo-500"
                      title="AI SCREENING HUB"
                      titleColor="text-indigo-500"
                      className="!p-5 rounded-2xl"
                    >
                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <h3 className="text-xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">Formula Shield V4</h3>
                        </div>
                        {isValidating ? (
                          <div className="animate-pulse bg-slate-100 h-6 w-24 rounded-lg" />
                        ) : (
                          <DnaBadge 
                            status={
                              validationResult?.riskScore === "LOW" ? "success" :
                              validationResult?.riskScore === "MEDIUM" ? "warning" :
                              "critical"
                            }
                          >
                            {validationResult?.riskScore} RISK
                          </DnaBadge>
                        )}
                      </div>

                      <TableWrapper>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-4 py-3 text-left text-table-header text-slate-400 uppercase tracking-widest">Ingredient</th>
                                <th className="px-4 py-3 text-center text-table-header text-slate-400 uppercase tracking-widest">Conc (%)</th>
                                <th className="px-4 py-3 text-center text-table-header text-slate-400 uppercase tracking-widest">Limit</th>
                                <th className="px-4 py-3 text-right text-table-header text-slate-400 uppercase tracking-widest">Violation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {validationResult?.violations?.length > 0 ? (
                                validationResult.violations.map((v: any) => (
                                  <tr key={v.ingredient} className="group hover:bg-slate-50/50 transition-all cursor-default">
                                    <td className="px-4 py-2.5 font-black italic text-slate-700 uppercase text-xs">{v.ingredient}</td>
                                    <td className="px-4 py-2.5 text-center font-sans text-slate-600 text-xs">{v.actual}%</td>
                                    <td className="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase italic">{v.limit}%</td>
                                    <td className="px-4 py-2.5 text-right">
                                      <DnaBadge status="critical">
                                        {v.type}
                                      </DnaBadge>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                                    {isValidating ? "Validating..." : "No violations detected. Formula is clean."}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </TableWrapper>
                    </DataCard>

                    {validationResult?.violations?.length > 0 && (
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 p-5 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-center">
                          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                          <div>
                            <h4 className="text-xs font-black uppercase italic text-rose-600 leading-none">Critical Breach Detected</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 leading-tight">
                              {validationResult.violations[0].message}
                            </p>
                          </div>
                        </div>
                        <DnaButton 
                          variant="danger"
                          onClick={() => submitReviewMutation.mutate({ pipelineId: activeTask.pipelineId, isApproved: false, notes: "Formula violation detected." })}
                          className="bg-indigo-600 border-indigo-700 text-white font-black italic hover:bg-indigo-750 flex flex-col gap-1.5 h-16 w-56 rounded-2xl"
                        >
                          <span className="text-xs leading-none">Re-work Order</span>
                          <span className="text-[7px] opacity-60 uppercase tracking-widest leading-none">To R&D Lab</span>
                        </DnaButton>
                      </div>
                    )}
                    {validationResult && validationResult.violations?.length === 0 && (
                      <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div>
                            <h4 className="text-xs font-black uppercase italic text-emerald-600 leading-none">Formula Verified Safe</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 leading-none">All ingredients within regulatory limits.</p>
                          </div>
                        </div>
                        <DnaButton 
                          variant="primary" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => submitReviewMutation.mutate({ pipelineId: activeTask.pipelineId, isApproved: true, notes: "Formula verified." })}
                        >
                          Approve Formula
                        </DnaButton>
                      </div>
                    )}
                  </div>
                )}

                {activeTask.type === "PNBP_FILING" && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <DataCard
                      dotColor="bg-emerald-500"
                      title="PNBP FILING PORTAL"
                      titleColor="text-slate-400"
                      className="!p-5 rounded-2xl"
                    >
                      <div className="flex items-center gap-3.5 mb-6">
                        <div className="h-11 w-11 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
                          <CreditCard className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black italic tracking-tighter uppercase text-slate-900 leading-none">PNBP Filing Portal</h3>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">Generate billing request for Finance</p>
                        </div>
                      </div>

                      <form 
                        onSubmit={(e: any) => {
                          e.preventDefault();
                          const amount = e.target.amount.value;
                          const billingCode = e.target.billingCode.value;
                          const description = e.target.description.value;
                          api.post(`/legality/pipeline/${activeTask.pipelineId}/pnbp-request`, { amount, description: billingCode + " - " + description })
                            .then(() => {
                              toast.success("PNBP Request filed to Finance");
                              refetch();
                            });
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Total Amount (IDR)</label>
                            <input name="amount" type="number" defaultValue="500000" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-brand-black focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Billing Code / SPS</label>
                            <input name="billingCode" placeholder="E.g. 82739182" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-brand-black focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Context / Description</label>
                          <textarea name="description" className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold italic focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none" defaultValue={`PNBP Registration for ${activeTask.title}`} />
                        </div>
                        <DnaButton type="submit" variant="primary" className="w-full h-12">
                          Submit Billing to Finance
                        </DnaButton>
                      </form>
                    </DataCard>

                    <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-center">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase italic text-amber-600 leading-none">Finance Gate Interlock</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 leading-tight">
                          Pipeline will remain in SUBMITTED stage until Finance verifies the payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center opacity-40 text-center p-10"
            >
              <Inbox className="w-10 h-10 text-slate-200 mb-4" />
              <h3 className="text-sm font-black italic uppercase text-slate-300">Select a curation task</h3>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>
    </DashboardShell>
  );
}
