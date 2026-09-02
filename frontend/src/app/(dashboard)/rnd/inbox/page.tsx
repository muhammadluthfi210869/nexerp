"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  ShieldCheck, 
  FlaskConical,
  Beaker,
  Search,
  ExternalLink,
  Loader2,
  Calendar
} from "lucide-react";
import { DnaInput, DnaButton } from "@/components/dna";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FormShell } from "@/components/layout/FormShell";

export default function RndInboxPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: samples, isLoading } = useQuery<any[]>({
    queryKey: ["rnd-inbox"],
    queryFn: async () => (await api.get("/rnd/inbox")).data,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.post(`/rnd/sample/${id}/accept`),
    onSuccess: (res) => {
      toast.success("Task accepted. Formula V1 initialized.");
      queryClient.invalidateQueries({ queryKey: ["rnd-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
      router.push(`/rnd/formula/${res.data.formula.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to accept task");
    }
  });

  const filteredSamples = samples?.filter(s => 
    s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lead?.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedSample = samples?.find(s => s.id === selectedId);

  React.useEffect(() => {
    if (samples?.length && !selectedId) {
      setSelectedId(samples[0].id);
    }
  }, [samples, selectedId]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      <p className="text-xs font-medium text-slate-400 tracking-wider">Synchronizing Inbox...</p>
    </div>
  );

  return (
    <FormShell
      title="SAMPLE"
      titleAccent="Inbox"
      subtitle="Manage intake requests for verified sample payments."
      actions={
        <div className="w-full md:w-72">
            <DnaInput 
              placeholder="Search queue..." 
              className="h-10"
              icon={<Search />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      }
    >
      {/* WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TASK LIST */}
        <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
               <span className="text-[11px] font-black uppercase text-slate-700 tracking-tight">Active Intake ({filteredSamples.length})</span>
            </div>
           
           <div className="space-y-2 h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {filteredSamples.length === 0 ? (
                 <div className="p-10 border-2 border-dashed rounded-xl flex flex-col items-center text-center gap-3 bg-slate-50/50">
                   <Clock className="h-5 w-5 text-slate-600" />
                   <p className="text-xs font-black text-slate-600 uppercase tracking-tight">No verified tasks in queue</p>
                 </div>
              ) : (
                filteredSamples.map((sample) => (
                  <div 
                    key={sample.id}
                    onClick={() => setSelectedId(sample.id)}
                    className={cn(
                      "p-4 cursor-pointer rounded-xl transition-all border",
                      selectedId === sample.id 
                        ? "bg-blue-50 border-blue-200 shadow-sm" 
                        : "bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
                    )}
                  >
                     <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm",
                          selectedId === sample.id ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        )}>
                            VERIFIED
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(sample.requestedAt).toLocaleDateString()}
                        </span>
                     </div>
                     <h3 className="font-black text-slate-900 leading-tight">
                       {sample.productName}
                     </h3>
                     <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                       {sample.lead?.clientName}
                     </p>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
              {selectedSample ? (
                <motion.div
                  key={selectedSample.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                   <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-0 min-h-[calc(100vh-280px)] flex flex-col overflow-hidden">
                      {/* DETAIL HEADER */}
                      <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                               {selectedSample.productName.charAt(0)}
                            </div>
                            <div>
                               <h2 className="text-xl font-black text-slate-900 leading-none">
                                 {selectedSample.productName}
                               </h2>
                               <div className="flex items-center gap-3 mt-1.5">
                                  <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm bg-slate-50 text-slate-600 border border-slate-100">
                                     #{selectedSample.id.slice(0, 8)}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                     <Calendar className="h-3 w-3" /> Due: {selectedSample.targetDeadline ? new Date(selectedSample.targetDeadline).toLocaleDateString() : "TBD"}
                                  </span>
                               </div>
                            </div>
                         </div>
                         <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Payment Verified</span>
                         </div>
                      </div>

                      {/* DETAIL BODY */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                         <div className="space-y-6">
                            <div className="space-y-3">
                               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tight px-1">Specifications</h4>
                               <div className="space-y-2">
                                  <InfoRow label="Function" value={selectedSample.targetFunction} />
                                  <InfoRow label="Texture" value={selectedSample.textureReq} />
                                  <InfoRow label="Color" value={selectedSample.colorReq} />
                                  <InfoRow label="Aroma" value={selectedSample.aromaReq} />
                               </div>
                            </div>

                            <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                               <p className="text-[10px] font-black text-blue-600 uppercase tracking-tight mb-1">Target HPP Threshold</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                                   Rp {Number(selectedSample.targetHpp || 0).toLocaleString()}
                                </p>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="space-y-3">
                               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tight px-1">Context</h4>
                               <div className="space-y-2">
                                  <InfoRow label="Client / Brand" value={selectedSample.lead?.clientName || "-"} />
                                  <InfoRow label="PIC BusDev" value={selectedSample.pic?.fullName || "-"} />
                               </div>
                               <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-2 flex items-center gap-1.5">
                                     <FileText className="h-3 w-3" /> Sales Notes
                                  </p>
                                  <p className="text-xs text-slate-600 leading-relaxed italic">
                                     "{selectedSample.lead?.notes || "No additional notes provided."}"
                                  </p>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* DETAIL ACTION */}
                      <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                        <DnaButton 
                           variant="ghost"
                           className="flex-1 h-12 text-rose-600"
                           icon={<XCircle />}
                          >
                             Reject Brief
                          </DnaButton>
                        <DnaButton 
                           variant="primary"
                           size="lg"
                           onClick={() => acceptMutation.mutate(selectedSample.id)}
                           disabled={acceptMutation.isPending}
                           className="flex-[2]"
                           icon={acceptMutation.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                          >
                             {acceptMutation.isPending ? "Accepting..." : "Accept & Start Formula"}
                          </DnaButton>
                      </div>
                   </div>
                </motion.div>
              ) : (
                 <div className="h-full min-h-[calc(100vh-280px)] flex flex-col items-center justify-center text-center p-12 gap-4">
                    <Beaker className="h-10 w-10 text-slate-400 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-tight text-slate-500">Select an intake request to view details</p>
                 </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </FormShell>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
       <span className="text-[11px] font-medium text-slate-500">{label}</span>
       <span className="text-[11px] font-black text-slate-900 tabular-nums">{value || "-"}</span>
    </div>
  );
}

