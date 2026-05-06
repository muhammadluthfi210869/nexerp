"use client";

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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
      <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      <p className="text-xs font-semibold text-slate-400 tracking-wider">Synchronizing Inbox...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-slate-100">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900">
             Sample <span className="text-indigo-600">Inbox</span>
           </h1>
            <p className="text-slate-700 text-sm font-bold mt-1">
              Manage intake requests for verified sample payments.
            </p>
        </div>

        <div className="relative w-full md:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <Input 
             placeholder="Search queue..." 
             className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-lg text-sm"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </header>

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
                        ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                        : "bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
                    )}
                  >
                     <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className={cn(
                          "px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-wider",
                          selectedId === sample.id ? "bg-indigo-100 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                        )}>
                           VERIFIED
                        </Badge>
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(sample.requestedAt).toLocaleDateString()}
                        </span>
                     </div>
                     <h3 className="font-bold text-slate-900 leading-tight">
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
                   <Card className="rounded-xl border-slate-200 shadow-sm bg-white min-h-[calc(100vh-280px)] flex flex-col overflow-hidden">
                      {/* DETAIL HEADER */}
                      <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
                               {selectedSample.productName.charAt(0)}
                            </div>
                            <div>
                               <h2 className="text-xl font-bold text-slate-900 leading-none">
                                 {selectedSample.productName}
                               </h2>
                               <div className="flex items-center gap-3 mt-1.5">
                                  <Badge variant="outline" className="text-[9px] font-bold text-slate-400 border-slate-200">
                                     #{selectedSample.id.slice(0, 8)}
                                  </Badge>
                                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                     <Calendar className="h-3 w-3" /> Due: {selectedSample.targetDeadline ? new Date(selectedSample.targetDeadline).toLocaleDateString() : "TBD"}
                                  </span>
                               </div>
                            </div>
                         </div>
                         <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Payment Verified</span>
                         </div>
                      </div>

                      {/* DETAIL BODY */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                         <div className="space-y-6">
                            <div className="space-y-3">
                               <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-tight px-1">Specifications</h4>
                               <div className="space-y-2">
                                  <InfoRow label="Function" value={selectedSample.targetFunction} />
                                  <InfoRow label="Texture" value={selectedSample.textureReq} />
                                  <InfoRow label="Color" value={selectedSample.colorReq} />
                                  <InfoRow label="Aroma" value={selectedSample.aromaReq} />
                               </div>
                            </div>

                            <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                               <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight mb-1">Target HPP Threshold</p>
                               <p className="text-2xl font-bold text-slate-900 tracking-tight">
                                  Rp {Number(selectedSample.targetHpp || 0).toLocaleString()}
                               </p>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="space-y-3">
                               <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-tight px-1">Context</h4>
                               <div className="space-y-2">
                                  <InfoRow label="Client / Brand" value={selectedSample.lead?.clientName || "-"} />
                                  <InfoRow label="PIC BusDev" value={selectedSample.pic?.fullName || "-"} />
                               </div>
                               <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-2 flex items-center gap-1.5">
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
                         <Button 
                          variant="ghost" 
                          className="flex-1 h-12 text-rose-600 font-bold text-xs"
                         >
                            <XCircle className="h-4 w-4 mr-2" /> Reject Brief
                         </Button>
                         <Button 
                          onClick={() => acceptMutation.mutate(selectedSample.id)}
                          disabled={acceptMutation.isPending}
                          className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                         >
                            {acceptMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            Accept & Start Formula
                         </Button>
                      </div>
                   </Card>
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
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
       <span className="text-[11px] font-medium text-slate-500">{label}</span>
       <span className="text-[11px] font-bold text-slate-900">{value || "-"}</span>
    </div>
  );
}

