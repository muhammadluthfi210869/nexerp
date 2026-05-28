"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Factory, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Zap,
  History,
  Play,
  FlaskConical,
  Package,
  Activity
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TableWrapper, StatCard, DnaBadge, DnaButton } from "@/components/dna";

const STAGE_MAP: Record<string, { label: string; status: "default" | "info" | "warning" | "critical" | "purple" | "success" }> = {
  WAITING_MATERIAL: { label: "Waiting Material", status: "default" },
  WAITING_PROCUREMENT: { label: "Waiting Procurement", status: "warning" },
  MIXING: { label: "Mixing", status: "info" },
  FILLING: { label: "Filling", status: "purple" },
  PACKING: { label: "Packing", status: "purple" },
  PENDING_QC: { label: "QC Hold", status: "critical" },
  FINISHED_GOODS: { label: "Finished", status: "success" },
  DELIVERED: { label: "Delivered", status: "success" },
};

export default function WorkOrdersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState("");
  const [targetQty, setTargetQty] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [now] = useState(() => Date.now());
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: workOrders, isLoading } = useQuery({
    queryKey: ["work-orders"],
    queryFn: async () => {
      const res = await api.get("/production/active");
      return res.data;
    }
  });

  const { data: leads } = useQuery({
    queryKey: ["production-leads"],
    queryFn: async () => {
      const res = await api.get("/production/leads");
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.post("/production/work-orders", data),
    onSuccess: () => {
      toast.success("Work Order created. Material requisition auto-generated.");
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed")
  });

  const startMutation = useMutation({
    mutationFn: async (woId: string) => api.post(`/production/start/${woId}`),
    onSuccess: () => {
      toast.success("Production started. OEE sequence initiated.");
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    }
  });

  const handleSubmit = () => {
    if (!selectedLead || !targetQty || !targetDate) return toast.error("Fill all fields.");
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    createMutation.mutate({
      leadId: selectedLead,
      targetQty: Number(targetQty),
      targetCompletion: targetDate,
    });
  };

  const activeCount = workOrders?.filter((w: any) => ['MIXING', 'FILLING', 'PACKING'].includes(w.stage))?.length || 0;
  const waitingCount = workOrders?.filter((w: any) => w.stage === 'WAITING_MATERIAL')?.length || 0;

  return (
    <DashboardShell
      title="WORK"
      titleAccent="ORDERS"
      subtitle="Batch manufacturing records & plant-floor scheduling"
      actions={
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <DnaButton variant="secondary" size="md" icon={<PlusCircle />}>
               Schedule Batch
            </DnaButton>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white">
               <h2 className="text-lg font-black uppercase tracking-tight">New Work Order</h2>
               <p className="text-slate-400 text-[8px] font-black mt-1.5 uppercase tracking-widest">Manufacturing Batch Scheduling Protocol</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Product (Sales Lead) <span className="text-red-500">*</span></label>
                 <Select onValueChange={(val: string | null) => setSelectedLead(val ?? "")}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-250 rounded-xl font-black text-[10px] uppercase tracking-wider text-slate-800 focus:bg-white transition-all"><SelectValue placeholder="Select product..." /></SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-100 shadow-xl p-1.5 max-h-[300px]">
                    {leads?.map((l: any) => <SelectItem key={l.id} value={l.id} className="rounded-lg h-12 px-3 font-bold text-[10px] uppercase tracking-wider">{l.brandName} - {l.productInterest} ({l.clientName})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Target Qty (pcs) <span className="text-red-500">*</span></label>
                  <Input type="number" value={targetQty} onChange={(e) => setTargetQty(e.target.value)} placeholder="e.g. 5000" className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold text-[10px] uppercase placeholder:text-slate-400 focus:bg-white transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Target Completion <span className="text-red-500">*</span></label>
                  <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold text-[10px] focus:bg-white transition-all text-slate-800" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <DnaButton variant="outline" size="md" onClick={() => setIsModalOpen(false)}>Cancel</DnaButton>
                <DnaButton variant="primary" size="md" onClick={handleSubmit} disabled={createMutation.isPending} className="flex-1 mb-0">
                  Generate Work Order
                </DnaButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Live Plant Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatCard label="Active Batches" value={activeCount} icon={<Activity className="text-indigo-500" />} />
         <StatCard label="Awaiting Material" value={waitingCount} icon={<Clock className="text-amber-500" />} />
         <StatCard label="Total Orders" value={workOrders?.length || 0} icon={<Factory className="text-slate-800" />} />
         <StatCard label="Critical Alerts" value="0" icon={<AlertCircle className="text-slate-300" />} />
      </div>

      {/* Work Orders Table */}
      <TableWrapper>
         <div className="overflow-x-auto">
            <Table>
               <TableHeader className="bg-slate-50/70">
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                     <TableHead className="py-4 pl-6 font-black text-slate-400 uppercase tracking-widest text-[9px]">Order ID</TableHead>
                     <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Product / Client</TableHead>
                     <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Target</TableHead>
                     <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Deadline</TableHead>
                     <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px] text-center">Stage</TableHead>
                     <TableHead className="py-4 pr-6 text-right font-black text-slate-400 uppercase tracking-widest text-[9px]">Plant Action</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody className="divide-y divide-slate-100">
                  {workOrders?.map((wo: any) => {
                    const stageInfo = STAGE_MAP[wo.stage] || { label: wo.stage, status: "default" };
                    const deadline = new Date(wo.targetCompletion);
                    const diffDays = Math.ceil((deadline.getTime() - now) / (1000*3600*24));

                    return (
                      <TableRow key={wo.id} className="group hover:bg-slate-50/30 transition-all border-none">
                         <TableCell className="py-3 pl-6">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
                                  <Factory className="h-4.5 w-4.5 text-blue-500" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{wo.woNumber}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Target: {wo.targetQty} pcs</span>
                               </div>
                            </div>
                         </TableCell>
                         <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                                  <FlaskConical className="h-3.5 w-3.5 text-slate-400" />
                               </div>
                               <div>
                                 <p className="font-black text-slate-900 text-xs uppercase italic">{wo.lead?.productInterest || wo.lead?.brandName || 'N/A'}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-0.5">{wo.lead?.clientName || ''}</p>
                               </div>
                            </div>
                         </TableCell>
                         <TableCell className="py-3 font-black text-slate-800 text-xs tabular-nums">
                            {wo.targetQty.toLocaleString()} pcs
                         </TableCell>
                         <TableCell className="py-3">
                            <div className="flex flex-col">
                               <p className="font-bold text-slate-500 text-[9px] uppercase">{deadline.toLocaleDateString()}</p>
                               <span className={cn("text-[8px] font-black uppercase mt-0.5", diffDays < 0 ? "text-rose-600" : diffDays <= 3 ? "text-amber-600" : "text-slate-400")}>
                                 {diffDays < 0 ? `LATE ${Math.abs(diffDays)}d` : `H-${diffDays}`}
                               </span>
                            </div>
                         </TableCell>
                         <TableCell className="py-3 text-center">
                            <DnaBadge status={stageInfo.status} className="shadow-none py-0.5 px-2 rounded-md">
                               {stageInfo.label}
                            </DnaBadge>
                         </TableCell>
                         <TableCell className="py-3 pr-6 text-right">
                            {wo.stage === 'WAITING_MATERIAL' && (
                              <DnaButton 
                                variant="secondary"
                                size="sm"
                                onClick={() => startMutation.mutate(wo.id)}
                                icon={<Play className="h-3.5 w-3.5 fill-current" />}
                              >
                                Start Production
                              </DnaButton>
                            )}
                            {['MIXING', 'FILLING', 'PACKING'].includes(wo.stage) && (
                              <DnaButton 
                                variant="secondary"
                                size="sm"
                                className="italic"
                                onClick={() => window.location.href = '/production/terminal'}
                              >
                                Open Terminal <ChevronRight className="h-3 w-3" />
                              </DnaButton>
                            )}
                            {!['WAITING_MATERIAL', 'MIXING', 'FILLING', 'PACKING'].includes(wo.stage) && (
                              <DnaButton 
                                variant="outline"
                                size="sm"
                                className="italic"
                                onClick={() => window.location.href = '/production/batch-records'}
                              >
                                View Record <ChevronRight className="h-3 w-3" />
                              </DnaButton>
                            )}
                         </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!workOrders || workOrders.length === 0) && (
                      <TableRow>
                         <TableCell colSpan={6} className="py-16 text-center">
                           <div className="flex flex-col items-center justify-center">
                              <Factory className="h-12 w-12 text-slate-200 mb-3" />
                              <p className="text-sm font-black italic text-slate-400 uppercase tracking-wider">No Work Orders Active</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Ready for scheduling</p>
                           </div>
                         </TableCell>
                      </TableRow>
                  )}
               </TableBody>
            </Table>
         </div>
      </TableWrapper>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menyimpan data ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
