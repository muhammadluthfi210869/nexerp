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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { TableWrapper, DnaBadge, DnaButton } from "@/components/dna";

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
      toast.success("Pipeline berhasil disinkronkan");
    }
  });

  const stages = [
    { value: "ALL", label: "Semua Proyek" },
    { value: "DRAFT", label: "Draf" },
    { value: "SUBMITTED", label: "Diajukan" },
    { value: "EVALUATION", label: "Evaluasi" },
    { value: "REVISION", label: "Revisi" },
    { value: "PUBLISHED", label: "Diterbitkan" },
  ];

  const getDnaStageBadge = (stage: string) => {
    switch (stage) {
      case "DRAFT": return <DnaBadge status="default">Draf</DnaBadge>;
      case "SUBMITTED": return <DnaBadge status="info">Diajukan</DnaBadge>;
      case "EVALUATION": return <DnaBadge status="warning">Evaluasi</DnaBadge>;
      case "REVISION": return <DnaBadge status="critical">Revisi</DnaBadge>;
      case "PUBLISHED": return <DnaBadge status="success">Diterbitkan</DnaBadge>;
      default: return <DnaBadge status="default">{getOperationalStatusLabel(stage)}</DnaBadge>;
    }
  };

  return (
    <OperationalMigrationShell
      title="Pipeline Regulasi"
      subtitle="Pelacakan paspor produk dan pengelolaan siklus hidup"
    >
      <div className="space-y-6 animate-fade-slide-in">
        <TableWrapper
          filters={
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between w-full">
              {/* Search input */}
              <div className="relative w-full lg:w-[400px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Cari klien atau merek..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] tracking-wider uppercase placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Stage Filter Buttons Switches */}
              <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                {stages.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStageFilter(s.value)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight whitespace-nowrap transition-all cursor-pointer",
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
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">Identitas Proyek</th>
                  <th className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">Tahap Siklus Hidup</th>
                  <th className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">Gerbang Validasi</th>
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">PIC & Klien</th>
                  <th className="px-4 py-4 text-right text-table-header text-slate-400 uppercase tracking-widest">Operasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Memuat pipeline regulasi...
                    </td>
                  </tr>
                ) : !pipelines || pipelines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tidak ada proyek registrasi ditemukan
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {pipelines.map((pipe: any) => (
                      <tr key={pipe.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                              <ShieldCheck className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <DnaBadge status="info">{pipe.type}</DnaBadge>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight leading-none">{pipe.registrationNo || "Belum bernomor"}</span>
                              </div>
                              <h4 className="text-[11px] font-black italic tracking-tight text-slate-900 uppercase group-hover:text-blue-600 transition-colors leading-none">
                                {pipe.lead?.brandName || pipe.lead?.clientName}
                              </h4>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getDnaStageBadge(pipe.currentStage)}
                          <div className="mt-1 flex items-center justify-center gap-1 text-[8px] font-bold text-slate-300 uppercase leading-none">
                            <Clock className="w-3.5 h-3.5" /> {pipe.daysInStage} hari
                          </div>
                        </td>
                        <td className="px-4 py-3">
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
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight leading-none">PIC: {pipe.legalPIC?.name || "Belum ditugaskan"}</span>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Building2 className="w-3 h-3 text-slate-300 shrink-0" />
                              <span className="text-[9px] font-bold uppercase truncate max-w-[120px] leading-none">{pipe.lead?.clientName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="flex justify-end">
                                <DnaButton 
                                  size="sm" 
                                  variant="ghost" 
                                  icon={<MoreVertical className="w-3.5 h-3.5" />} 
                                />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xl">
                              <div className="px-2.5 py-1.5 border-b border-slate-50 mb-1">
                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 leading-none">Pengelolaan Siklus Hidup</p>
                              </div>
                              {stages.slice(1).map((s) => (
                                <DropdownMenuItem 
                                  key={s.value}
                                  onClick={() => updateStageMutation.mutate({ id: pipe.id, stage: s.value })}
                                  className="p-2.5 rounded-lg cursor-pointer text-[10px] font-black uppercase tracking-tight italic gap-2 hover:bg-blue-50 hover:text-blue-600 outline-none"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" /> Pindahkan ke {s.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator className="bg-slate-50" />
                              <DropdownMenuItem 
                                onClick={() => setSelectedPipeline(pipe)}
                                className="p-2.5 rounded-lg cursor-pointer text-[10px] font-black uppercase tracking-tight italic gap-2 hover:bg-slate-50 outline-none"
                              >
                                <History className="w-4 h-4 text-slate-400" /> Jejak Audit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </TableWrapper>
      </div>

      {/* Dialog for Audit Trail */}
      <Dialog open={!!selectedPipeline} onOpenChange={() => setSelectedPipeline(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl p-0 overflow-hidden border border-slate-100 shadow-2xl">
          <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-2 leading-none">
              <History className="w-4 h-4 text-blue-600" />
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Auditory Trail</span>
            </div>
            <DialogTitle className="text-xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
              {selectedPipeline?.lead?.brandName || selectedPipeline?.lead?.clientName}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {selectedPipeline?.logHistory?.map((log: any, idx: number) => (
              <div key={idx} className="relative flex gap-4">
                <div className="h-5 w-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DnaBadge status="info">{getOperationalStatusLabel(log.stage)}</DnaBadge>
                    <span className="text-[8px] font-black text-slate-300 uppercase leading-none">{new Date(log.date).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 italic uppercase">{log.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </OperationalMigrationShell>
  );
}
