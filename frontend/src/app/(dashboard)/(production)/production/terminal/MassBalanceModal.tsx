"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Scale, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkOrder {
  id: string;
  woNumber: string;
  targetQty: number;
  stage: string;
  logs: Array<{
    id: string;
    stage: string;
    inputQty: number;
    goodQty: number;
  }>;
}

interface MassBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  machineId?: string;
}

export function MassBalanceModal({ isOpen, onClose, workOrder, machineId }: MassBalanceModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    inputQty: 0,
    goodQty: 0,
    quarantineQty: 0,
    rejectQty: 0,
    downtimeMinutes: 0,
    notes: "",
  });

  // UX HUKUM ABSOLUT: Basis Handover (Relay Logic)
  useEffect(() => {
    if (workOrder) {
      let basisQty = workOrder.targetQty;
      
      // If there's a previous stage log, its "Good Qty" becomes the "Input Qty" of this stage
      const lastCompletedLog = [...(workOrder.logs || [])].reverse().find(l => l.goodQty > 0);
      if (lastCompletedLog) {
         basisQty = lastCompletedLog.stage === workOrder.stage ? lastCompletedLog.inputQty : lastCompletedLog.goodQty;
      }

      setFormData(prev => ({
        ...prev, 
        inputQty: basisQty,
        goodQty: basisQty,
        quarantineQty: 0,
        rejectQty: 0,
        downtimeMinutes: 0
      }));
    }
  }, [workOrder]);

  // UX HUKUM ABSOLUT (Real-Time Validation)
  const totalOutput = useMemo(() => {
    return Number(formData.goodQty) + Number(formData.quarantineQty) + Number(formData.rejectQty);
  }, [formData.goodQty, formData.quarantineQty, formData.rejectQty]);

  const balanceDiff = useMemo(() => {
    return Number(formData.inputQty) - totalOutput;
  }, [formData.inputQty, totalOutput]);

  const isBalanceValid = balanceDiff === 0 && Number(formData.inputQty) > 0;

  const getNextStage = (currentStage: string) => {
    switch (currentStage) {
      case 'MIXING': return 'FILLING';
      case 'FILLING': return 'PACKING';
      case 'PACKING': return 'FINISHED_GOODS';
      default: return undefined;
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        stage: workOrder?.stage,
        machineId: machineId,
        nextStage: getNextStage(workOrder?.stage || ""),
      };
      return api.post(`/production/${workOrder?.id}/submit-log`, payload);
    },
    onSuccess: () => {
      const next = getNextStage(workOrder?.stage || "");
      toast.success(`Event Finalized. Batch moved to ${next}`);
      queryClient.invalidateQueries({ queryKey: ["activeWorkOrders"] });
      queryClient.invalidateQueries({ queryKey: ["prodAnalytics"] });
      onClose();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Protocol Violation: Data Mismatch";
      toast.error(message);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[2.5rem] p-10 bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex justify-between items-start">
             <div className="h-14 w-14 rounded-[1.25rem] bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
               <Scale className="h-7 w-7 text-white" />
             </div>
             <Badge variant="outline" className="font-black text-[10px] border-slate-100 text-slate-400">
                OEE FINALIZATION
             </Badge>
          </div>
          <div>
             <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none text-left">Phase Review</DialogTitle>
             <DialogDescription className="text-[11px] font-bold uppercase tracking-tight text-slate-400 mt-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Ending Session: {workOrder?.woNumber} Stage {workOrder?.stage}
             </DialogDescription>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Good Units</Label>
              <Input
                type="number"
                value={formData.goodQty}
                onChange={(e) => setFormData({ ...formData, goodQty: Number(e.target.value) })}
                className="rounded-2xl border-slate-100 bg-emerald-50/20 font-black text-lg h-14"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight text-rose-500">Waste/Reject</Label>
              <Input
                type="number"
                value={formData.rejectQty}
                onChange={(e) => setFormData({ ...formData, rejectQty: Number(e.target.value) })}
                className="rounded-2xl border-slate-100 bg-rose-50/20 font-black text-lg h-14"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Downtime (Min)</Label>
              <Input
                type="number"
                value={formData.downtimeMinutes}
                onChange={(e) => setFormData({ ...formData, downtimeMinutes: Number(e.target.value) })}
                className="rounded-2xl border-slate-100 font-bold h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Quarantine</Label>
              <Input
                type="number"
                value={formData.quarantineQty}
                onChange={(e) => setFormData({ ...formData, quarantineQty: Number(e.target.value) })}
                className="rounded-2xl border-slate-100 font-bold h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Shift Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-2xl border-slate-100 text-xs min-h-[60px]"
              placeholder="Any issues with machine speed or material quality?"
            />
          </div>

          {/* BALANCE STATUS */}
          <div className={cn(
            "p-5 rounded-3xl flex items-center justify-between",
            isBalanceValid ? "bg-emerald-600 text-white shadow-xl" : "bg-rose-50 text-rose-600"
          )}>
             <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                <p className="text-[10px] font-black uppercase tracking-tight">Balance Protocol</p>
             </div>
             <p className="text-xl font-black">{totalOutput} / {formData.inputQty}</p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!isBalanceValid || submitMutation.isPending}
            className="rounded-2xl font-black text-[12px] uppercase h-16 w-full bg-slate-900 text-white hover:bg-black"
          >
            {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "FINALIZE LOG & ADVANCE"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


