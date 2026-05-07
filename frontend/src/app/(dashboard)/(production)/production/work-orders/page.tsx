"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Factory, 
  Search, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  ClipboardList,
  Timer,
  Zap,
  Activity,
  History,
  Play,
  ArrowRight,
  FlaskConical,
  Package,
  Trash2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger 
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

const STAGE_MAP: Record<string, { label: string; color: string; icon: any }> = {
  WAITING_MATERIAL: { label: "Waiting Material", color: "bg-slate-100 text-slate-600", icon: Clock },
  WAITING_PROCUREMENT: { label: "Waiting Procurement", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  MIXING: { label: "Mixing", color: "bg-blue-600 text-white animate-pulse", icon: FlaskConical },
  FILLING: { label: "Filling", color: "bg-indigo-600 text-white animate-pulse", icon: Zap },
  PACKING: { label: "Packing", color: "bg-violet-600 text-white animate-pulse", icon: Package },
  PENDING_QC: { label: "QC Hold", color: "bg-amber-500 text-white", icon: AlertCircle },
  FINISHED_GOODS: { label: "Finished", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  DELIVERED: { label: "Delivered", color: "bg-emerald-500 text-white", icon: CheckCircle2 },
};

export default function WorkOrdersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState("");
  const [targetQty, setTargetQty] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [now] = useState(() => Date.now());

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
    createMutation.mutate({
      leadId: selectedLead,
      targetQty: Number(targetQty),
      targetCompletion: targetDate,
    });
  };

  const activeCount = workOrders?.filter((w: any) => ['MIXING', 'FILLING', 'PACKING'].includes(w.stage))?.length || 0;
  const waitingCount = workOrders?.filter((w: any) => w.stage === 'WAITING_MATERIAL')?.length || 0;

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-indigo-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Manufacturing Execution System</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Work <span className="text-indigo-500">Orders</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Batch manufacturing records & plant-floor scheduling
           </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-tighter text-sm border-none">
               <PlusCircle className="mr-2 h-5 w-5 stroke-[3px]" /> Schedule Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
            <div className="bg-indigo-900 p-10 text-white">
               <h2 className="text-3xl font-bold tracking-tight">New Work Order</h2>
               <p className="text-indigo-200 text-xs font-medium mt-2">Manufacturing Batch Scheduling Protocol</p>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Product (Sales Lead)</label>
                <Select onValueChange={(val: string | null) => setSelectedLead(val || "")}>
                  <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium"><SelectValue placeholder="Select product..." /></SelectTrigger>
                  <SelectContent>
                    {leads?.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.brandName} - {l.productInterest} ({l.clientName})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Target Quantity (pcs)</label>
                  <Input type="number" value={targetQty} onChange={(e) => setTargetQty(e.target.value)} placeholder="e.g. 5000" className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Target Completion</label>
                  <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-14 px-8">Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending} className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold">
                  Generate Work Order & Material Requisition
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Live Plant Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <PlantStatCard label="Active Batches" value={String(activeCount)} color="text-indigo-600" icon={Activity} />
         <PlantStatCard label="Awaiting Material" value={String(waitingCount)} color="text-amber-600" icon={Clock} />
         <PlantStatCard label="Total Orders" value={String(workOrders?.length || 0)} color="text-slate-900" icon={Factory} />
         <PlantStatCard label="Critical Alerts" value="0" color="text-slate-300" icon={AlertCircle} />
      </div>

      {/* Work Orders Table */}
      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
         <Table>
            <TableHeader className="bg-slate-50/70">
               <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Order ID</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Product / Client</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Target</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Deadline</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Stage</TableHead>
                  <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Plant Action</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {workOrders?.map((wo: any) => {
                 const stageInfo = STAGE_MAP[wo.stage] || { label: wo.stage, color: "bg-slate-100 text-slate-500" };
                 const deadline = new Date(wo.targetCompletion);
                 const diffDays = Math.ceil((deadline.getTime() - now) / (1000*3600*24));

                 return (
                   <TableRow key={wo.id} className="group hover:bg-indigo-50/30 transition-all duration-300 border-b border-slate-50">
                      <TableCell className="py-8 pl-10">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                               <Factory className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div className="flex flex-col">
                               <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{wo.woNumber}</span>
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Target: {wo.targetQty} pcs</span>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                               <FlaskConical className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm uppercase italic">{wo.lead?.productInterest || wo.lead?.brandName || 'N/A'}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{wo.lead?.clientName || ''}</p>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell>
                         <p className="font-black text-slate-900 text-sm">{wo.targetQty} pcs</p>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1">
                            <p className="font-bold text-slate-500 text-xs uppercase">{deadline.toLocaleDateString()}</p>
                            <span className={cn("text-[9px] font-black uppercase", diffDays < 0 ? "text-rose-600" : diffDays <= 3 ? "text-amber-600" : "text-slate-400")}>
                              {diffDays < 0 ? `LATE ${Math.abs(diffDays)}d` : `H-${diffDays}`}
                            </span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge className={cn(
                           "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                           stageInfo.color
                         )}>
                            {stageInfo.label}
                         </Badge>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                         {wo.stage === 'WAITING_MATERIAL' && (
                           <Button 
                             onClick={() => startMutation.mutate(wo.id)}
                             className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-tight text-[10px] rounded-xl shadow-md border-none transition-all"
                           >
                             <Play className="mr-2 h-3.5 w-3.5" /> Start Production
                           </Button>
                         )}
                         {['MIXING', 'FILLING', 'PACKING'].includes(wo.stage) && (
                           <Button 
                             onClick={() => window.location.href = '/production/terminal'}
                             className="h-11 px-6 bg-slate-900 text-white hover:bg-indigo-600 font-black uppercase tracking-tight text-[10px] rounded-xl shadow-md border-none transition-all italic"
                           >
                             Open Terminal <ChevronRight className="ml-2 h-3.5 w-3.5" />
                           </Button>
                         )}
                         {!['WAITING_MATERIAL', 'MIXING', 'FILLING', 'PACKING'].includes(wo.stage) && (
                           <Button 
                             onClick={() => window.location.href = '/production/batch-records'}
                             className="h-11 px-6 bg-white text-slate-900 border-2 border-slate-50 hover:bg-slate-900 hover:text-white font-black uppercase tracking-tight text-[10px] rounded-xl shadow-md transition-all italic"
                           >
                             View Record <ChevronRight className="ml-2 h-3.5 w-3.5" />
                           </Button>
                         )}
                      </TableCell>
                   </TableRow>
                 );
               })}
            </TableBody>
         </Table>
      </Card>
    </div>
  );
}

function PlantStatCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: any }) {
  return (
     <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-100 p-6 bg-white flex items-center gap-6 group">
        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
           <Icon className="h-6 w-6 text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </div>
        <div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">{label}</p>
           <p className={cn("text-2xl font-black italic tracking-tighter", color)}>{value}</p>
        </div>
     </Card>
  );
}

