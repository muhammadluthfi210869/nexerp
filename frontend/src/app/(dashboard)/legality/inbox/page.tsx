"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Inbox, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  MessageSquare, 
  Send,
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "text-rose-600 bg-rose-50 border-rose-100";
      case "MEDIUM": return "text-amber-600 bg-amber-50 border-amber-100";
      default: return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white overflow-hidden rounded-[2rem] border border-slate-200 shadow-sm">
      {/* Left Sidebar: Task List */}
      <aside className="w-[380px] border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/10">
                        <Inbox className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-black tracking-tighter italic uppercase text-slate-900">Compliance <span className="text-blue-600">Inbox</span></h1>
                </div>
                <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-8 w-8 rounded-lg hover:bg-white border border-transparent hover:border-slate-100">
                    <RefreshCcw className={cn("w-3.5 h-3.5 text-slate-400", isLoading && "animate-spin")} />
                </Button>
            </div>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    placeholder="Filter tasks..." 
                    className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-600/20 transition-all"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
            {isLoading && (
                <div className="p-10 flex flex-col items-center justify-center gap-4">
                    <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Synchronizing Hub...</p>
                </div>
            )}

            {isError && (
                <div className="p-10 text-center space-y-4">
                    <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto opacity-40" />
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-tight">Connection Interrupted</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl text-[10px] font-black uppercase tracking-tight h-8">Try Again</Button>
                </div>
            )}
            
            {!isLoading && !isError && (!tasks || tasks.length === 0) && (
                <div className="p-10 text-center space-y-6">
                    <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                        <Sparkles className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-900 uppercase italic tracking-tight">System is Clean</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">No pending regulatory tasks detected.</p>
                    </div>
                    <Link href="/legality/pipeline">
                        <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black italic uppercase text-xs gap-2">
                            <PlusCircle className="w-4 h-4" /> Start Pipeline
                        </Button>
                    </Link>
                </div>
            )}

            {tasks?.map((task: any) => (
                <button
                    key={task.id}
                    onClick={() => { setSelectedTaskId(task.id); setActiveTask(task); }}
                    className={cn(
                        "w-full text-left p-5 rounded-[1.5rem] transition-all border relative overflow-hidden group",
                        selectedTaskId === task.id 
                            ? "bg-white border-blue-600/20 shadow-md ring-1 ring-blue-600/5" 
                            : "bg-transparent border-transparent hover:bg-white/60 hover:border-slate-100"
                    )}
                >
                    {selectedTaskId === task.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                    )}
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md", getPriorityColor(task.priority))}>
                            {task.priority}
                        </Badge>
                        <span className="text-[9px] font-bold text-slate-400 uppercase italic">{new Date(task.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <h3 className={cn("text-xs font-black uppercase tracking-tight italic mb-2 transition-colors", selectedTaskId === task.id ? "text-blue-600" : "text-slate-600 group-hover:text-slate-900")}>
                        {task.title}
                    </h3>
                    <div className="flex items-center gap-2">
                        {task.type === "FORMULA_VALIDATION" && <Beaker className="w-3 h-3 text-indigo-500" />}
                        {task.type === "ARTWORK_REVIEW" && <ImageIcon className="w-3 h-3 text-blue-500" />}
                        {task.type === "PNBP_FILING" && <CreditCard className="w-3 h-3 text-emerald-500" />}
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">{task.type.replace('_', ' ')}</span>
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col h-full"
                >
                    <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-black uppercase tracking-tight text-slate-400">Workspace / {activeTask.type}</span>
                                <ChevronRight className="w-2 h-2 text-slate-300" />
                                <span className="text-[9px] font-black uppercase tracking-tight text-blue-600">ID: {activeTask.pipelineId.substring(0,8)}</span>
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter italic uppercase text-slate-900 leading-none">{activeTask.title}</h2>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 font-black italic gap-2 text-slate-500 hover:text-slate-900 transition-all text-xs">
                                <MessageSquare className="w-4 h-4" /> Reject
                            </Button>
                            <Button className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black italic gap-2 shadow-lg shadow-blue-600/10 text-xs">
                                <CheckCircle2 className="w-4 h-4" /> Approve
                            </Button>
                        </div>
                    </header>

                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        {activeTask.type === "ARTWORK_REVIEW" && (
                            <div className="grid grid-cols-12 gap-8 h-full">
                                <div className="col-span-8 space-y-6">
                                    <div className="aspect-video bg-slate-100 border border-slate-200 rounded-[2.5rem] relative overflow-hidden group flex items-center justify-center">
                                        <ImageIcon className="w-16 h-16 text-slate-300 absolute" />
                                        <Image 
                                            src="https://placehold.co/1200x800/f8fafc/cbd5e1?text=ARTWORK+PREVIEW" 
                                            alt="Artwork Preview"
                                            width={1200}
                                            height={800}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                        <div className="absolute bottom-6 right-6 flex gap-2">
                                            <Button size="icon" className="h-10 w-10 rounded-xl bg-white/90 border border-slate-200 text-slate-600 shadow-sm hover:bg-white"><ZoomIn className="w-4 h-4" /></Button>
                                            <Button size="icon" className="h-10 w-10 rounded-xl bg-white/90 border border-slate-200 text-slate-600 shadow-sm hover:bg-white"><Maximize2 className="w-4 h-4" /></Button>
                                            <Button size="icon" className="h-10 w-10 rounded-xl bg-white/90 border border-slate-200 text-slate-600 shadow-sm hover:bg-white"><Download className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <Card className="bg-slate-50/50 border-slate-100 p-6 rounded-2xl shadow-none">
                                            <h4 className="text-[9px] font-black uppercase tracking-tight text-slate-400 mb-3">Regulatory Checklist</h4>
                                            <div className="space-y-2">
                                                {["Batch Number", "Composition", "Net Weight", "Manufacturer"].map((check) => (
                                                    <div key={check} className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span className="text-[11px] font-bold text-slate-600">{check}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                        <Card className="bg-slate-50/50 border-slate-100 p-6 rounded-2xl shadow-none">
                                            <h4 className="text-[9px] font-black uppercase tracking-tight text-slate-400 mb-3">Designer Notes</h4>
                                            <p className="text-[11px] font-medium text-slate-500 italic leading-relaxed">
                                                "Updated version based on revision #3. Adjusted font size to meet requirements."
                                            </p>
                                        </Card>
                                    </div>
                                </div>

                                <div className="col-span-4 space-y-6">
                                    <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-tight text-blue-600">Final Verdict</h4>
                                        <div className="flex flex-col gap-2">
                                            <Button 
                                                onClick={() => submitReviewMutation.mutate({ pipelineId: activeTask.pipelineId, isApproved: true, notes: "Approved" })}
                                                className="h-14 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-100 font-black italic uppercase transition-all"
                                            >
                                                Pass Artwork
                                            </Button>
                                            <Button className="h-14 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-100 font-black italic uppercase transition-all">
                                                Fail & Revise
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-tight text-slate-400">Comments</label>
                                            <textarea className="w-full h-32 bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-bold italic focus:outline-none focus:ring-1 focus:ring-blue-600/10" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTask.type === "FORMULA_VALIDATION" && (
                            <div className="space-y-8">
                                <Card className="bg-white border-slate-200 rounded-[2rem] p-8 shadow-sm">
                                    <div className="flex justify-between items-end mb-8">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Beaker className="w-4 h-4 text-indigo-500" />
                                                <span className="text-[9px] font-black uppercase tracking-tight text-slate-400">AI Screening Hub</span>
                                            </div>
                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Formula Shield V4</h3>
                                        </div>
                                        {isValidating ? (
                                            <div className="animate-pulse bg-slate-100 h-8 w-32 rounded-lg" />
                                        ) : (
                                            <Badge className={cn(
                                                "px-3 py-1 rounded-lg font-black italic text-[10px]",
                                                validationResult?.riskScore === "LOW" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                validationResult?.riskScore === "MEDIUM" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {validationResult?.riskScore} RISK
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="p-4 text-[9px] font-black uppercase tracking-tight text-slate-400">Ingredient</th>
                                                    <th className="p-4 text-[9px] font-black uppercase tracking-tight text-slate-400 text-center">Conc (%)</th>
                                                    <th className="p-4 text-[9px] font-black uppercase tracking-tight text-slate-400 text-center">Limit</th>
                                                    <th className="p-4 text-[9px] font-black uppercase tracking-tight text-slate-400 text-right">Violation</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {validationResult?.violations?.length > 0 ? (
                                                    validationResult.violations.map((v: any) => (
                                                        <tr key={v.ingredient}>
                                                            <td className="p-4 font-black italic text-slate-700 uppercase text-xs">{v.ingredient}</td>
                                                            <td className="p-4 font-sans text-slate-600 text-xs text-center">{v.actual}%</td>
                                                            <td className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase italic">{v.limit}%</td>
                                                            <td className="p-4 text-right">
                                                                <Badge className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-50 text-rose-500">
                                                                    {v.type}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="p-10 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                                                            {isValidating ? "Validating..." : "No violations detected. Formula is clean."}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {validationResult?.violations?.length > 0 && (
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-6 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex gap-4 items-center">
                                            <AlertTriangle className="w-6 h-6 text-rose-500" />
                                            <div>
                                                <h4 className="text-xs font-black uppercase italic text-rose-600">Critical Breach Detected</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                                                    {validationResult.violations[0].message}
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => submitReviewMutation.mutate({ pipelineId: activeTask.pipelineId, isApproved: false, notes: "Formula violation detected." })}
                                            className="h-20 w-56 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black italic flex flex-col gap-1 shadow-lg shadow-indigo-600/10"
                                        >
                                            <Send className="w-4 h-4" />
                                            <span className="text-xs">Re-work Order</span>
                                            <span className="text-[7px] opacity-60 uppercase tracking-tight">To R&D Lab</span>
                                        </Button>
                                    </div>
                                )}
                                {validationResult && validationResult.violations?.length === 0 && (
                                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[1.5rem] flex justify-between items-center">
                                        <div className="flex gap-4 items-center">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                            <div>
                                                <h4 className="text-xs font-black uppercase italic text-emerald-600">Formula Verified Safe</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">All ingredients within regulatory limits.</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => submitReviewMutation.mutate({ pipelineId: activeTask.pipelineId, isApproved: true, notes: "Formula verified." })}
                                            className="h-14 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black italic uppercase text-xs"
                                        >
                                            Approve Formula
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTask.type === "PNBP_FILING" && (
                            <div className="max-w-2xl mx-auto space-y-8">
                                <Card className="bg-white border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                                            <CreditCard className="w-7 h-7 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">PNBP Filing Portal</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Generate billing request for Finance</p>
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
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Total Amount (IDR)</label>
                                                <Input name="amount" type="number" defaultValue="500000" className="h-12 rounded-xl bg-slate-50 border-slate-200 font-sans font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Billing Code / SPS</label>
                                                <Input name="billingCode" placeholder="E.g. 82739182" className="h-12 rounded-xl bg-slate-50 border-slate-200 font-sans font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Context / Description</label>
                                            <textarea name="description" className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold italic focus:outline-none focus:ring-1 focus:ring-blue-600/10" defaultValue={`PNBP Registration for ${activeTask.title}`} />
                                        </div>
                                        <Button type="submit" className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black italic uppercase text-sm shadow-xl shadow-blue-600/20">
                                            Submit Billing to Finance
                                        </Button>
                                    </form>
                                </Card>

                                <div className="p-6 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex gap-4 items-center">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                    <div>
                                        <h4 className="text-xs font-black uppercase italic text-amber-600">Finance Gate Interlock</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                                            Pipeline will remain in SUBMITTED stage until Finance verifies the payment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-center">
                    <Inbox className="w-12 h-12 text-slate-200 mb-6" />
                    <h3 className="text-xl font-black italic uppercase text-slate-300">Select a curation task</h3>
                </div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );
}

