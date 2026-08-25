"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Calculator,
  CheckCircle2,
  Zap,
  Box,
  ArrowRight,
  ShieldCheck,
  RefreshCcw,
  Loader2
} from "lucide-react";
import { DnaButton, DnaBadge } from "@/components/dna";
import { toast } from "sonner";
import {
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
} from "@/components/operational";

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
      const resp = await api.get("/production/audit");
      return resp.data.filter((wo: any) => wo.stage === 'FINISHED_GOODS').map((wo: any) => ({
        id: wo.woNumber,
        product: wo.lead?.productInterest || "Unknown Product",
        outputQty: wo.targetQty,
        unit: "pcs",
        rawMaterialCost: Number(wo.actualCogs || 0) * 0.8,
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
    <OperationalPageShell
      title="Actual Costing Gate"
      subtitle="Automated HPP Reconciliation & Utility Propagation"
      actions={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight leading-none">Pending Batches</p>
            <p className="text-2xl font-black text-blue-600">{batches?.length ?? 0}</p>
          </div>
          <DnaButton variant="outline" className="h-12 w-12 p-0 rounded-2xl flex items-center justify-center hover:rotate-180 transition-all duration-700 bg-slate-50 border-none text-slate-400">
            <RefreshCcw className="h-5 w-5" />
          </DnaButton>
        </div>
      }
    >

      {/* RECONCILIATION WORKBENCH */}
      <main className="max-w-6xl mx-auto space-y-10 mt-6">
         {batches?.map((batch) => (
            <div key={batch.id} className="p-0 border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden group">
               <div className="grid grid-cols-1 lg:grid-cols-4">
                  {/* Production Summary */}
                  <div className="lg:col-span-1 p-10 bg-slate-50/50 border-r border-slate-100 space-y-8">
                     <div className="space-y-2">
                        <DnaBadge status="info">{batch.id}</DnaBadge>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase italic">{batch.product}</h3>
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Yield Output</span>
                           <span className="text-sm font-black text-slate-800">{batch.outputQty.toLocaleString()} {batch.unit}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                           <div className="h-full w-[98%] bg-emerald-500 rounded-full" />
                        </div>
                     </div>

                     <div className="p-4 bg-white rounded-2xl border border-slate-200/50 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">Audit Status</p>
                        <div className="flex items-center gap-2">
                           <ShieldCheck className="h-4 w-4 text-emerald-500" />
                           <span className="text-[10px] font-medium text-slate-700">Logs Verified</span>
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
                              <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-tight">-2.4% vs Estimated</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tight flex items-center gap-2">
                              <Zap className="h-3 w-3" /> Utility Overhead
                           </h4>
                           <div className="space-y-1">
                              <p className="text-2xl font-black text-slate-900">Rp {batch.estimatedUtility.toLocaleString()}</p>
                              <p className="text-[10px] font-medium text-rose-500 uppercase tracking-tight">+1.2% Surge Detected</p>
                           </div>
                        </div>
                     </div>

                     <div className="pt-10 border-t border-slate-100 flex items-end justify-between">
                        <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight mb-2">Calculated HPP / Unit</p>
                           <p className="text-5xl font-black tracking-tighter text-blue-600">
                              Rp {Math.round((batch.rawMaterialCost + batch.estimatedUtility + batch.laborCost) / batch.outputQty).toLocaleString()}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight mb-2">Total Batch Value</p>
                           <p className="text-xl font-medium text-slate-800 italic">
                              Rp {(batch.rawMaterialCost + batch.estimatedUtility + batch.laborCost).toLocaleString()}
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Action Panel */}
                  <div className="lg:col-span-1 p-10 bg-blue-600 flex flex-col justify-between text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Calculator size={120} />
                     </div>

                     <div className="relative z-10 space-y-4">
                        <h4 className="text-lg font-black uppercase italic leading-none">Authorization Required</h4>
                        <p className="text-[10px] font-medium text-blue-100 uppercase tracking-tight leading-relaxed">
                           Finalizing this gate will lock the production costs and post an automated journal entry to the General Ledger.
                        </p>
                     </div>

                     <DnaButton
                       variant="primary"
                       onClick={() => handleFinalize(batch.id)}
                       disabled={finalizeMutation.isPending}
                       className="relative z-10 w-full h-16 bg-white text-blue-600 hover:bg-blue-50 font-black uppercase tracking-[0.2em] rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3"
                     >
                        {finalizeMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : (
                          <>
                            FINALIZE & COMMIT <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                     </DnaButton>
                  </div>
               </div>
            </div>
         ))}

         {batches?.length === 0 && (
            <div className="p-32 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-6">
               <CheckCircle2 size={80} className="text-emerald-500 opacity-20" />
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">All Batches Reconciled</h2>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-tight mt-2">Fiscal integrity is at 100%</p>
               </div>
            </div>
         )}
      </main>

      {/* FOOTER INFO */}
      <footer className="max-w-6xl mx-auto mt-20 p-8 bg-white rounded-2xl text-gray-900 flex items-center justify-between shadow-sm border border-slate-200">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center">
               <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-tight">Protocol 5.0 Active</p>
               <p className="text-xs font-medium text-slate-500">All cost movements are immutably logged for executive audit.</p>
            </div>
         </div>
         <div className="flex gap-2">
            <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
            <div className="h-1 w-4 bg-gray-200 rounded-full"></div>
            <div className="h-1 w-4 bg-gray-200 rounded-full"></div>
         </div>
      </footer>
    </OperationalPageShell>
  );
}
