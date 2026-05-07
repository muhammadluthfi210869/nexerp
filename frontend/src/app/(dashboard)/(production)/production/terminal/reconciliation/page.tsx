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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ReconciliationTerminal() {
  const queryClient = useQueryClient();
  const [selectedWO, setSelectedWO] = useState<string | null>(null);
  const [returnQty, setReturnQty] = useState("");
  const [reason, setReason] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const { data: activeWOs } = useQuery({
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
    <div className="min-h-screen bg-black text-white p-12 font-sans selection:bg-[#d4af37]/30">
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-6">
          <Link href="/production/terminal">
            <Button variant="ghost" className="h-16 w-16 rounded-[2rem] bg-white/5 hover:bg-white/10 text-white border-white/5">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
              Material <span className="text-[#d4af37]">Returns</span>
            </h1>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-2 underline decoration-[#d4af37]/30">Warehouse Reconciliation Protocol</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
        {/* Left: WO Selection & Material List */}
        <section className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Select Active Work Order</label>
            <div className="grid grid-cols-1 gap-3">
              {activeWOs?.map((wo: any) => (
                <button 
                  key={wo.id}
                  onClick={() => setSelectedWO(wo.id)}
                  className={cn(
                    "p-6 rounded-3xl border transition-all flex items-center justify-between text-left",
                    selectedWO === wo.id ? "bg-[#d4af37] border-white text-black" : "bg-white/5 border-white/5 text-white hover:bg-white/10"
                  )}
                >
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-60 leading-none mb-1">{wo.woNumber}</p>
                    <p className="text-lg font-black tracking-tight">{wo.lead?.sampleRequests?.[0]?.productName || "Unknown Product"}</p>
                  </div>
                  <ChevronRight className={cn("h-5 w-5", selectedWO === wo.id ? "text-black" : "text-white/20")} />
                </button>
              ))}
            </div>
          </div>

          {selectedWO && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Allocated Materials</label>
               <div className="grid grid-cols-1 gap-3">
                  {activeWOData?.requisitions?.map((req: any) => (
                    <button 
                      key={req.id}
                      onClick={() => setSelectedMaterial(req.material)}
                      className={cn(
                        "p-6 rounded-3xl border transition-all flex items-center justify-between text-left",
                        selectedMaterial?.id === req.materialId ? "bg-white text-black" : "bg-white/5 border-white/5 text-white hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", selectedMaterial?.id === req.materialId ? "bg-black/5" : "bg-white/5")}>
                          <Scale className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase opacity-60 leading-none mb-1">{req.material.code}</p>
                          <p className="text-sm font-black tracking-tight uppercase italic">{req.material.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase opacity-40">Issued</p>
                        <p className="font-black italic">{req.qtyIssued} {req.material.unit}</p>
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
            <Card className="bg-[#d4af37] border-none rounded-[3.5rem] p-12 text-black space-y-10 shadow-2xl shadow-[#d4af37]/20 sticky top-12">
              <div className="flex justify-between items-start">
                <div className="h-20 w-20 bg-black rounded-[2.5rem] flex items-center justify-center">
                  <Undo2 className="h-10 w-10 text-[#d4af37]" />
                </div>
                <Badge className="bg-black text-[#d4af37] font-black border-none uppercase text-[10px] px-4 py-1">Return Registry</Badge>
              </div>

              <div>
                <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none mb-2">{selectedMaterial.name}</h2>
                <p className="text-black/60 text-[10px] font-black uppercase tracking-widest">Material Identity: {selectedMaterial.code}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-black/40 tracking-widest ml-1">Return Quantity ({selectedMaterial.unit})</label>
                  <Input 
                    type="number"
                    value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value)}
                    className="h-24 bg-black/5 border-black/10 rounded-[2rem] text-4xl font-black italic text-center focus:ring-0 focus:border-black/20"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-black/40 tracking-widest ml-1">Reason / Condition</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-32 bg-black/5 border-black/10 rounded-[2rem] p-6 font-bold text-sm focus:outline-none focus:ring-0 focus:border-black/20"
                    placeholder="e.g., Sisa produksi, kemasan rusak, etc."
                  />
                </div>
              </div>

              <Button 
                onClick={() => {
                  if (!returnQty) return toast.error("Quantity is required.");
                  returnMutation.mutate({
                    workOrderId: selectedWO,
                    materialId: selectedMaterial.id,
                    qtyReturned: returnQty,
                    reason
                  });
                }}
                disabled={returnMutation.isPending}
                className="w-full h-24 bg-black text-[#d4af37] hover:bg-white hover:text-black rounded-[2rem] font-black italic uppercase text-xl shadow-2xl transition-all"
              >
                {returnMutation.isPending ? "PROCESSING..." : "REGISTER RETURN"}
              </Button>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[3.5rem] opacity-20">
              <Database className="h-24 w-24 mb-6" />
              <p className="text-sm font-black uppercase tracking-widest">Select Material to Begin Return Protocol</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

