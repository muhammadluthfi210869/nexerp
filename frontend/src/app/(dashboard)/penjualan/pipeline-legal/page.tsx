"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MoreVertical, 
  Clock, 
  CreditCard,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  History
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaSelect,
  DnaCell,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

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

  const getDnaStageBadge = (stage: string) => {
    switch (stage) {
      case "DRAFT": return <DnaBadge variant="default">DRAFT</DnaBadge>;
      case "SUBMITTED": return <DnaBadge variant="info">SUBMITTED</DnaBadge>;
      case "EVALUATION": return <DnaBadge variant="warning">EVALUATION</DnaBadge>;
      case "REVISION": return <DnaBadge variant="critical">REVISION</DnaBadge>;
      case "PUBLISHED": return <DnaBadge variant="success">PUBLISHED</DnaBadge>;
      default: return <DnaBadge variant="default">{stage}</DnaBadge>;
    }
  };

  return (
    <DashboardShell
      title="Regulatory"
      titleAccent="Pipeline"
      subtitle="Real-time product passport tracking & lifecycle management."
    >
      <div className="space-y-6">
        <DnaDataTableCard
          customToolbar={
            <div className="px-5 py-3 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between w-full bg-white">
              <DnaInput
                icon={<Search className="w-4 h-4 text-slate-400" />}
                placeholder="SEARCH CLIENT OR BRAND..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-[400px]"
              />

              <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                {stages.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStageFilter(s.value)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight whitespace-nowrap transition-all cursor-pointer",
                      stageFilter === s.value
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                        : "text-slate-400 hover:text-slate-600 border border-transparent"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="bg-slate-50/50 border-b border-slate-100">
                  <DnaTh className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">PROJECT IDENTITY</DnaTh>
                  <DnaTh className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">LIFECYCLE STAGE</DnaTh>
                  <DnaTh className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">SMART-GATES</DnaTh>
                  <DnaTh className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">PIC & CLIENT</DnaTh>
                  <DnaTh className="px-4 py-4 text-right text-table-header text-slate-400 uppercase tracking-widest">OPERATION</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {isLoading ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Syncing regulatory pipeline...
                    </DnaTd>
                  </DnaTableRow>
                ) : !pipelines || pipelines.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tidak ada proyek registrasi ditemukan
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {pipelines.map((pipe: any) => (
                      <DnaTableRow key={pipe.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                        <DnaTd className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                              <ShieldCheck className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <DnaBadge variant="info">{pipe.type}</DnaBadge>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight leading-none">{pipe.registrationNo || "PENDING"}</span>
                              </div>
                              <h4 className="text-[11px] font-black italic tracking-tight text-slate-900 uppercase group-hover:text-blue-600 transition-colors leading-none">
                                {pipe.lead?.brandName || pipe.lead?.clientName}
                              </h4>
                            </div>
                          </div>
                        </DnaTd>
                        <DnaTd className="px-4 py-3 text-center">
                          {getDnaStageBadge(pipe.currentStage)}
                          <div className="mt-1 flex items-center justify-center gap-1 text-[8px] font-bold text-slate-300 uppercase leading-none">
                            <Clock className="w-3.5 h-3.5" /> {pipe.daysInStage} Days
                          </div>
                        </DnaTd>
                        <DnaTd className="px-4 py-3">
                          <div className="flex items-center justify-center gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 transition-colors",
                              pipe.pnbpStatus ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-300 border-slate-100"
                            )}>
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 transition-colors",
                              pipe.artworkReviews?.[0]?.isApproved ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-300 border-slate-100"
                            )}>
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <div className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 transition-colors",
                              pipe.currentStage === "PUBLISHED" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-300 border-slate-100"
                            )}>
                              <Zap className="w-4 h-4" />
                            </div>
                          </div>
                        </DnaTd>
                        <DnaTd className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight leading-none">PIC: {pipe.legalPIC?.name || "Unassigned"}</span>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Building2 className="w-3 h-3 text-slate-300 shrink-0" />
                              <span className="text-[9px] font-bold uppercase truncate max-w-[120px] leading-none">{pipe.lead?.clientName}</span>
                            </div>
                          </div>
                        </DnaTd>
                        <DnaTd className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <DnaSelect
                              value=""
                              onChange={(val) => val && updateStageMutation.mutate({ id: pipe.id, stage: val })}
                              options={stages.slice(1).map((s) => ({ label: `Move to ${s.label}`, value: s.value }))}
                              placeholder="Lifecycle..."
                              className="w-[150px] text-[9px] h-8"
                            />
                            <DnaButton
                              size="sm"
                              variant="ghost"
                              icon={<History className="w-3.5 h-3.5" />}
                              onClick={() => setSelectedPipeline(pipe)}
                            />
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </AnimatePresence>
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      </div>

      <DnaModal
        isOpen={!!selectedPipeline}
        onClose={() => setSelectedPipeline(null)}
        title={selectedPipeline?.lead?.brandName || selectedPipeline?.lead?.clientName || "Audit Trail"}
        subtitle="Auditory Trail"
        size="2xl"
        badge={<History className="w-3 h-3 text-blue-500" />}
      >
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {selectedPipeline?.logHistory?.map((log: any, idx: number) => (
            <div key={idx} className="relative flex gap-4">
              <div className="h-5 w-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <DnaBadge variant="info">{log.stage}</DnaBadge>
                  <span className="text-[8px] font-bold text-slate-300 uppercase leading-none">{new Date(log.date).toLocaleString()}</span>
                </div>
                <p className="text-xs font-bold text-slate-500 italic uppercase">{log.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </DnaModal>
    </DashboardShell>
  );
}
