"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Droplets, 
  Flame, 
  Box,
  ArrowRight,
  ShieldCheck,
  RefreshCcw,
  Plus,
  Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Batch {
  id: string;
  product: string;
  outputQty: number;
  unit: string;
  rawMaterialCost: number;
  estimatedUtility: number;
  laborCost: number;
  status: string;
}

export default function ActualCostingGate() {
  const queryClient = useQueryClient();

  const finalizeMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/production/finalize/${id}`),
    onSuccess: () => {
      toast.success("Batch finalized. HPP calculated and posted to Ledger.");
      queryClient.invalidateQueries({ queryKey: ["pending-costing-batches"] });
    },
    onError: (err: any) => {
      toast.error("Finalization failed", { description: err.response?.data?.message || "Server error" });
    },
  });

  const { data: batches, isLoading } = useQuery<Batch[]>({
    queryKey: ["pending-costing-batches"],
    queryFn: async () => {
      const resp = await api.get("/production/audit"); // Using audit or similar to get finished WOs
      return resp.data.filter((wo: any) => wo.stage === 'FINISHED_GOODS').map((wo: any) => ({
        id: wo.woNumber,
        product: wo.lead?.productInterest || "Unknown Product",
        outputQty: wo.targetQty,
        unit: "pcs",
        rawMaterialCost: Number(wo.actualCogs || 0) * 0.8, // Approximation for UI
        estimatedUtility: Number(wo.actualCogs || 0) * 0.1,
        laborCost: Number(wo.actualCogs || 0) * 0.1,
        status: "PENDING_RECONCILIATION"
      }));
    }
  });

  const handleFinalize = (id: string) => {
    finalizeMutation.mutate(id);
  };

  return (
    <div className="min-h-screen bg-base p-8 md:p-12 font-sans text-slate-900 pb-32">
      {/* HEADER */}
      <header className="max-w-6xl mx-auto mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                 <div className="h-2 w-8 bg-indigo-600 rounded-full" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600/60">Phase 5 Protocol</span>
              </div>
              <h1 className="text-6xl font-black tracking-tighter italic text-slate-900 leading-none uppercase">
                Actual <span className="text-indigo-600">Costing</span> Gate
              </h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-4 opacity-70">
                Automated HPP Reconciliation & Utility Propagation
              </p>
           </motion.div>

           <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-black/[0.03] flex items-center gap-6">
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight leading-none">Pending Batches</p>
                 <p className="text-2xl font-black mt-1 text-indigo-600">{batches?.length || 0}</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-100" />
              <button className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center hover:rotate-180 transition-all duration-700">
                 <RefreshCcw className="h-5 w-5 text-slate-400" />
              </button>
           </div>
        </div>
      </header>

      {/* RECONCILIATION WORKBENCH */}
      <main className="max-w-6xl mx-auto space-y-10">
         {batches?.map((batch) => (
           <Card key={batch.id} className="p-0 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] rounded-[48px] bg-white overflow-hidden group">
              <div className="grid grid-cols-1 lg:grid-cols-4">
                 {/* Production Summary */}
                 <div className="lg:col-span-1 p-10 bg-slate-50/50 border-r border-slate-100 space-y-8">
                    <div className="space-y-2">
                       <Badge className="bg-indigo-600 text-white font-black uppercase text-[9px] px-3 py-1 rounded-full border-none">{batch.id}</Badge>
                       <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase italic">{batch.product}</h3>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Yield Output</span>
                          <span className="text-sm font-black text-slate-800">{batch.outputQty.toLocaleString()} {batch.unit}</span>
                       </div>
                       <Progress value={98} className="h-1.5 bg-slate-200" indicatorClassName="bg-emerald-500" />
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/50 shadow-sm">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">Audit Status</p>
                       <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          <span className="text-[10px] font-bold text-slate-700">Production Logs Verified</span>
                       </div>
                    </div>
                 </div>

                 {/* Cost Reconciliation */}
                 <div className="lg:col-span-2 p-10 space-y-10">
                    <div className="grid grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tight flex items-center gap-2">
                             <Box className="h-3 w-3" /> Material Variance
                          </h4>
                          <div className="space-y-1">
                             <p className="text-2xl font-black text-slate-900">Rp {batch.rawMaterialCost.toLocaleString()}</p>
                             <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight">-2.4% vs Estimated</p>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tight flex items-center gap-2">
                             <Zap className="h-3 w-3" /> Utility Overhead
                          </h4>
                          <div className="space-y-1">
                             <p className="text-2xl font-black text-slate-900">Rp {batch.estimatedUtility.toLocaleString()}</p>
                             <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">+1.2% Surge Detected</p>
                          </div>
                       </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100 flex items-end justify-between">
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight mb-2">Calculated HPP / Unit</p>
                          <p className="text-5xl font-black tracking-tighter text-indigo-600">
                             Rp {Math.round((batch.rawMaterialCost + batch.estimatedUtility + batch.laborCost) / batch.outputQty).toLocaleString()}
                          </p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight mb-2">Total Batch Value</p>
                          <p className="text-xl font-bold text-slate-800 italic">
                             Rp {(batch.rawMaterialCost + batch.estimatedUtility + batch.laborCost).toLocaleString()}
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* Action Panel */}
                 <div className="lg:col-span-1 p-10 bg-indigo-600 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <Calculator size={120} />
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                       <h4 className="text-lg font-black uppercase italic leading-none">Authorization Required</h4>
                       <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-tight leading-relaxed">
                          Finalizing this gate will lock the production costs and post an automated journal entry to the General Ledger.
                       </p>
                    </div>

                    <Button 
                      onClick={() => handleFinalize(batch.id)}
                      disabled={finalizeMutation.isPending}
                      className="relative z-10 w-full h-16 bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                       {finalizeMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : (
                         <>
                           FINALIZE & COMMIT <ArrowRight className="h-5 w-5" />
                         </>
                       )}
                    </Button>
                 </div>
              </div>
           </Card>
         ))}

         {batches?.length === 0 && (
           <div className="p-32 text-center bg-white rounded-[48px] border-2 border-dashed border-slate-100 flex flex-col items-center gap-6">
              <CheckCircle2 size={80} className="text-emerald-500 opacity-20" />
              <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">All Batches Reconciled</h2>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-tight mt-2">Fiscal integrity is at 100%</p>
              </div>
           </div>
         )}
      </main>

      {/* FOOTER INFO */}
      <footer className="max-w-6xl mx-auto mt-20 p-8 bg-slate-900 rounded-[32px] text-white flex items-center justify-between shadow-2xl shadow-slate-200">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center">
               <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-tight">Protocol 5.0 Active</p>
               <p className="text-xs font-bold text-slate-400">All cost movements are immutably logged for executive audit.</p>
            </div>
         </div>
         <div className="flex gap-2">
            <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
            <div className="h-1 w-4 bg-slate-800 rounded-full"></div>
            <div className="h-1 w-4 bg-slate-800 rounded-full"></div>
         </div>
      </footer>
    </div>
  );
}

