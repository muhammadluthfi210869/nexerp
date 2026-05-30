"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  ArrowLeft,
  Box,
  ChevronRight,
  Database,
  History,
  Info,
  Scale,
  Search,
  Undo2
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaButton, DnaBadge } from "@/components/dna";

export default function ReconciliationTerminal() {
  const queryClient = useQueryClient();
  const [selectedWO, setSelectedWO] = useState<string | null>(null);
  const [returnQty, setReturnQty] = useState("");
  const [reason, setReason] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const { data: activeWOs, isLoading } = useQuery({
    queryKey: ["active-wos-reconcile"],
    queryFn: async () => {
      const res = await api.get("/production/work-orders");
      return res.data.filter((wo: any) => wo.stage !== 'COMPLETED');
    }
  });

  const returnMutation = useMutation({
    mutationFn: async (data: any) => api.post("/production/reconciliation/return", data),
    onSuccess: () => {
      toast.success("Material return registered. Waiting for warehouse receipt.");
      setReturnQty("");
      setReason("");
      setSelectedMaterial(null);
    },
    onError: () => {
      toast.error("Failed to register return.");
    }
  });

  const activeWOData = activeWOs?.find((wo: any) => wo.id === selectedWO);

  return (
    <DashboardShell
      title="Material"
      titleAccent="Reconciliation"
      subtitle="Warehouse returns & plant-floor material reconciliation"
      actions={
        <Link href="/production/terminal">
          <DnaButton variant="outline" size="sm" icon={<ArrowLeft />}>
            Back to Terminal
          </DnaButton>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Left: WO Selection & Material List */}
        <section className="space-y-6">
          <div className="space-y-3 text-left">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Active Work Order</label>
            <div className="grid grid-cols-1 gap-3">
              {activeWOs?.map((wo: any) => (
                <button 
                  key={wo.id}
                  onClick={() => {
                    setSelectedWO(wo.id);
                    setSelectedMaterial(null);
                  }}
                  className={cn(
                    "p-5 rounded-2xl border transition-all flex items-center justify-between text-left",
                    selectedWO === wo.id ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                  )}
                >
                  <div>
                    <p className={cn("text-[8px] font-black uppercase tracking-wider leading-none mb-1", selectedWO === wo.id ? "text-slate-400" : "text-slate-400")}>{wo.woNumber}</p>
                    <p className="text-sm font-black tracking-tight uppercase italic">{wo.lead?.productInterest || wo.lead?.brandName || "Unknown Product"}</p>
                  </div>
                  <ChevronRight className={cn("h-4 w-4", selectedWO === wo.id ? "text-white" : "text-slate-400")} />
                </button>
              ))}
              {(!activeWOs || activeWOs.length === 0) && !isLoading && (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Database className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">No Active Work Orders</p>
                </div>
              )}
            </div>
          </div>

          {selectedWO && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Allocated Materials</label>
              <div className="grid grid-cols-1 gap-3">
                {activeWOData?.requisitions?.map((req: any) => (
                  <button 
                    key={req.id}
                    onClick={() => setSelectedMaterial(req.material)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex items-center justify-between text-left",
                      selectedMaterial?.id === req.materialId ? "bg-emerald-50 border-emerald-250 text-slate-900" : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center border", selectedMaterial?.id === req.materialId ? "bg-white border-emerald-100" : "bg-slate-50 border-slate-100")}>
                        <Scale className="h-4.5 w-4.5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase opacity-60 leading-none mb-1">{req.material.code}</p>
                        <p className="text-xs font-black tracking-tight uppercase italic">{req.material.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase opacity-40">Issued</p>
                      <p className="text-xs font-black italic tabular-nums">{req.qtyIssued} {req.material.unit}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right: Return Entry Form */}
        <section>
          {selectedMaterial ? (
            <Card className="bg-slate-900 border-none rounded-[24px] p-8 text-white space-y-8 shadow-2xl sticky top-12">
              <div className="flex justify-between items-center">
                <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                  <Undo2 className="h-6 w-6 text-emerald-500" />
                </div>
                <DnaBadge status="success" className="py-0.5 px-2 rounded-md">Return Registry</DnaBadge>
              </div>

              <div className="text-left">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none mb-2">{selectedMaterial.name}</h2>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Material Identity: {selectedMaterial.code}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Return Quantity ({selectedMaterial.unit})</label>
                  <Input 
                    type="number"
                    value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value)}
                    className="h-14 bg-slate-800 border-slate-700 rounded-xl text-2xl font-black italic text-center focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-white placeholder:text-slate-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Reason / Condition</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-24 bg-slate-800 border border-slate-700 rounded-xl p-4 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder:text-slate-500 resize-none"
                    placeholder="e.g., Sisa produksi, kemasan rusak, etc."
                  />
                </div>
              </div>

              <DnaButton 
                variant="primary"
                onClick={() => {
                  if (!returnQty) return toast.error("Quantity is required.");
                  returnMutation.mutate({
                    workOrderId: selectedWO,
                    materialId: selectedMaterial.id,
                    qtyReturned: Number(returnQty),
                    reason
                  });
                }}
                disabled={returnMutation.isPending}
                className="w-full h-14 bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl font-black italic uppercase text-sm shadow-lg transition-all"
              >
                {returnMutation.isPending ? "PROCESSING..." : "REGISTER RETURN"}
              </DnaButton>
            </Card>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-200 rounded-[24px] bg-slate-50/50">
              <Database className="h-12 w-12 mb-4 text-slate-300" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 text-center max-w-[200px] leading-relaxed">Select Material to Begin Return Protocol</p>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
