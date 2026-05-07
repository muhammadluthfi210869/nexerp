"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  CreditCard,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  History,
  AlertTriangle
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RegulatoryPipelinePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [selectedPipeline, setSelectedPipeline] = useState<any>(null);

  const { data: pipelines, isLoading } = useQuery({
    queryKey: ["regulatory-pipeline", searchTerm, stageFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (stageFilter !== "ALL") params.append("stage", stageFilter);
      const resp = await api.get(`/legality/pipeline?${params.toString()}`);
      return resp.data;
    }
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage, notes }: any) => api.patch(`/legality/pipeline/${id}`, { currentStage: stage, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulatory-pipeline"] });
      toast.success("Pipeline synchronized");
    }
  });

  const stages = [
    { value: "ALL", label: "All Projects" },
    { value: "DRAFT", label: "Draft" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "EVALUATION", label: "Evaluation" },
    { value: "REVISION", label: "Revision" },
    { value: "PUBLISHED", label: "Published" },
  ];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "DRAFT": return "bg-slate-100 text-slate-500 border-slate-200";
      case "SUBMITTED": return "bg-blue-50 text-blue-600 border-blue-100";
      case "EVALUATION": return "bg-amber-50 text-amber-600 border-amber-100";
      case "REVISION": return "bg-rose-50 text-rose-600 border-rose-100";
      case "PUBLISHED": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default: return "bg-slate-50 text-slate-400";
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <header className="mb-10 relative">
        <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-1 bg-blue-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">Control Tower</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
            Regulatory <span className="text-blue-600">Pipeline</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Real-time product passport tracking & lifecycle management.</p>

        <div className="mt-8 flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative w-full lg:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="Search Client or brand..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200"
                />
            </div>
            <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                {stages.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => setStageFilter(s.value)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                            stageFilter === s.value ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
      </header>

      <main>
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="p-6 text-[10px] font-black uppercase tracking-tight text-slate-400">Project Identity</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">Lifecycle Stage</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">Smart-Gates</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-tight text-slate-400">PIC & Client</th>
                            <th className="p-6 text-right text-[10px] font-black uppercase tracking-tight text-slate-400">Operation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        <AnimatePresence mode="popLayout">
                            {pipelines?.map((pipe: any, idx: number) => (
                                <motion.tr 
                                    key={pipe.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-slate-50/30 transition-colors group"
                                >
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                                <ShieldCheck className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{pipe.type}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{pipe.registrationNo || "PENDING"}</span>
                                                </div>
                                                <h4 className="text-sm font-black italic tracking-tight text-slate-900 uppercase group-hover:text-blue-600 transition-colors">{pipe.lead?.brandName || pipe.lead?.clientName}</h4>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <Badge variant="outline" className={cn(
                                            "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight border",
                                            getStageColor(pipe.currentStage)
                                        )}>
                                            {pipe.currentStage}
                                        </Badge>
                                        <div className="mt-1 flex items-center justify-center gap-1 text-[8px] font-bold text-slate-400 uppercase">
                                            <Clock className="w-3 h-3" /> {pipe.daysInStage} Days
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className={cn(
                                                "h-9 w-9 rounded-lg flex items-center justify-center border",
                                                pipe.pnbpStatus ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-300 border-slate-100"
                                            )}>
                                                <CreditCard className="w-4 h-4" />
                                            </div>
                                            <div className={cn(
                                                "h-9 w-9 rounded-lg flex items-center justify-center border",
                                                pipe.artworkReviews?.[0]?.isApproved ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-300 border-slate-100"
                                            )}>
                                                <ImageIcon className="w-4 h-4" />
                                            </div>
                                            <div className={cn(
                                                "h-9 w-9 rounded-lg flex items-center justify-center border",
                                                pipe.currentStage === "PUBLISHED" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-300 border-slate-100"
                                            )}>
                                                <Zap className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">PIC: {pipe.legalPIC?.name || "Unassigned"}</span>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Building2 className="w-3 h-3" />
                                                <span className="text-[10px] font-bold uppercase truncate max-w-[120px]">{pipe.lead?.clientName}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl">
                                                <div className="px-3 py-2 border-b border-slate-50 mb-1">
                                                    <p className="text-[9px] font-black uppercase tracking-tight text-slate-400">Lifecycle Management</p>
                                                </div>
                                                {stages.slice(1).map((s) => (
                                                    <DropdownMenuItem 
                                                        key={s.value}
                                                        onClick={() => updateStageMutation.mutate({ id: pipe.id, stage: s.value })}
                                                        className="p-3 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-tight italic gap-3 hover:bg-blue-50 hover:text-blue-600"
                                                    >
                                                        <ArrowRight className="w-3.5 h-3.5" /> Move to {s.label}
                                                    </DropdownMenuItem>
                                                ))}
                                                <DropdownMenuSeparator className="bg-slate-50" />
                                                <DropdownMenuItem 
                                                    onClick={() => setSelectedPipeline(pipe)}
                                                    className="p-3 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-tight italic gap-3 hover:bg-slate-50"
                                                >
                                                    <History className="w-4 h-4 text-slate-400" /> Audit Trail
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
      </main>

      <Dialog open={!!selectedPipeline} onOpenChange={() => setSelectedPipeline(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                    <History className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">Auditory Trail</span>
                </div>
                <DialogTitle className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase">
                    {selectedPipeline?.lead?.brandName || selectedPipeline?.lead?.clientName}
                </DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6 max-h-[400px] overflow-y-auto">
                {selectedPipeline?.logHistory?.map((log: any, idx: number) => (
                    <div key={idx} className="relative flex gap-4">
                        <div className="h-6 w-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        </div>
                        <div className="pb-6">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[8px] font-black border-blue-100 text-blue-600 uppercase">{log.stage}</Badge>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(log.date).toLocaleString()}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-600 italic">{log.notes}</p>
                        </div>
                    </div>
                ))}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

