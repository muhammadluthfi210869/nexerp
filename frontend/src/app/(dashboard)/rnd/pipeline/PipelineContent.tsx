"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DnaInput, DnaButton } from "@/components/dna";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Activity, 
  Gauge,
  AlertCircle,
  Clock,
  RefreshCcw,
  ArrowRight, ShieldCheck, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableShell } from "@/components/layout/TableShell";

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  QUEUE: { label: "Waitlist", color: "text-slate-500", bg: "bg-slate-100" },
  FORMULATING: { label: "Formulating", color: "text-blue-600", bg: "bg-blue-50" },
  LAB_TEST: { label: "Internal QC", color: "text-purple-600", bg: "bg-purple-50" },
  READY_TO_SHIP: { label: "Shipping Sample", color: "text-amber-600", bg: "bg-amber-50" },
  CLIENT_REVIEW: { label: "Client Review", color: "text-orange-600", bg: "bg-orange-50" },
  APPROVED: { label: "LOCKED / DEAL", color: "text-emerald-600", bg: "bg-emerald-50" },
  REJECTED: { label: "Revision Needed", color: "text-red-600", bg: "bg-red-50" },
};

const REVISION_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NOT_STARTED: { label: "Not Started", className: "bg-slate-100 text-slate-600 border border-slate-100" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-50 text-amber-600 border border-amber-100" },
  DONE: { label: "Done", className: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  CANCELLED: { label: "Cancelled", className: "bg-rose-50 text-rose-600 border border-rose-100" },
};

export function PipelineContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [updateStage, setUpdateStage] = useState<string | null>(null);
  const [findings, setFindings] = useState("");
  const [confirmAdvance, setConfirmAdvance] = useState(false);

  const { data: samples } = useQuery<any[]>({
    queryKey: ["rnd-samples"], 
    queryFn: async () => (await api.get("/rnd/samples")).data,
    staleTime: 10000,
  });

  const { data: staffs } = useQuery<any[]>({
    queryKey: ["rnd-staffs"],
    queryFn: async () => (await api.get("/rnd/staffs")).data,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; newStage: string; feedback: string }) =>
      api.patch(`/rnd/sample/${data.id}/advance`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
      toast.success("Laboratory status synchronized.");
      setIsUpdateOpen(false);
      setFindings("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Sync error");
    },
  });

  const assignMutation = useMutation({
    mutationFn: (data: { sampleId: string; picId: string }) => 
      api.patch(`/rnd/sample/${data.sampleId}/assign`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rnd-samples"] });
      toast.success("PIC allocated successfully.");
    },
  });

  const calculateActualHpp = (sample: any) => {
    const latestFormula = sample.formulas?.[0];
    if (!latestFormula) return 0;
    
    let totalHpp = 0;
    latestFormula.phases?.forEach((phase: any) => {
      phase.items?.forEach((item: any) => {
        const cost = Number(item.costSnapshot || 0);
        const percentage = Number(item.dosagePercentage || 0);
        totalHpp += (percentage / 100) * cost;
      });
    });
    return totalHpp;
  };

  const getAgingDays = (date: string) => {
    const start = new Date(date).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  const filteredSamples = samples?.filter(s => 
    s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lead?.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lead?.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <TableShell
      title="FORMULA"
      titleAccent="Pipeline"
      subtitle="Technical Laboratory Workflow & Version Control"
      actions={
         <div className="flex gap-3">
            <DnaButton variant="outline" size="sm" className="h-10 px-6">
               History
            </DnaButton>
            <DnaButton variant="primary" size="sm" className="h-10 px-6" icon={<Plus />}>
               New Formula
            </DnaButton>
         </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <KpiMiniCard 
           icon={<Gauge className="h-4 w-4 text-blue-600" />} 
           label="In Development" 
           value={samples?.filter(s => s.stage === 'FORMULATING').length || 0} 
           subValue="Active Lab"
         />
         <KpiMiniCard 
           icon={<Activity className="h-4 w-4 text-blue-600" />} 
           label="SLA Compliance" 
           value="94%" 
           subValue="On Track"
         />
         <KpiMiniCard 
           icon={<AlertCircle className="h-4 w-4 text-rose-600" />} 
           label="Overbudget" 
           value={samples?.filter(s => {
             const actual = calculateActualHpp(s);
             return s.targetHpp && actual > Number(s.targetHpp);
           }).length || 0} 
           subValue="Needs Revision"
         />
         <KpiMiniCard 
           icon={<Clock className="h-4 w-4 text-emerald-600" />} 
           label="Ready to Ship" 
           value={samples?.filter(s => s.stage === 'READY_TO_SHIP').length || 0} 
           subValue="QC Passed"
         />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="w-full md:w-80">
              <DnaInput 
                placeholder="Search projects..." 
                className="h-10"
                icon={<Search />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-2">
              <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm bg-slate-50 text-slate-600 border border-slate-100">
                Real-time Pipeline
              </span>
           </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="py-4 px-4 text-[10px] font-black uppercase tracking-tight text-slate-400">Project Identity</TableHead>
              <TableHead className="py-4 px-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">Type</TableHead>
              <TableHead className="py-4 px-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">Version</TableHead>
              <TableHead className="py-4 px-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">PIC Analyst</TableHead>
              <TableHead className="py-4 px-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">Costing (HPP/Kg)</TableHead>
              <TableHead className="py-4 px-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">Status</TableHead>
              <TableHead className="py-4 px-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">Revision Status</TableHead>
              <TableHead className="py-4 px-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-center">Aging</TableHead>
              <TableHead className="py-4 px-4 text-[10px] font-black uppercase tracking-tight text-slate-400 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSamples?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-slate-400 text-sm italic">
                  No active projects found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSamples.map((sample) => {
                const config = STAGE_CONFIG[sample.stage] || STAGE_CONFIG.QUEUE;
                const actualHpp = calculateActualHpp(sample);
                const targetHpp = Number(sample.targetHpp || 0);
                const isOverbudget = targetHpp > 0 && actualHpp > targetHpp;
                const aging = getAgingDays(sample.requestedAt);
                const version = sample.formulas?.[0]?.version || 1;

                return (
                  <TableRow key={sample.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                    <TableCell className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                          {sample.productName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-[13px] tracking-tight">{sample.productName}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">{sample.sampleNumber} • {sample.lead?.brandName || sample.lead?.clientName}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-4 text-center">
                       <span className={cn(
                         "rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm",
                         version === 1 
                           ? "bg-blue-600 text-white border border-blue-600" 
                          : "bg-amber-500 text-white border border-amber-600"
                       )}>
                          {version === 1 ? "ORIGINAL" : "REVISION"}
                       </span>
                    </TableCell>

                    <TableCell className="py-4 px-4 text-center">
                       <span className="text-[11px] font-black text-slate-400">
                          v{version}.0
                       </span>
                    </TableCell>

                    <TableCell className="py-4 px-4 text-center">
                      <Select 
                        defaultValue={sample.picId} 
                        onValueChange={(val) => assignMutation.mutate({ sampleId: sample.id, picId: val })}
                      >
                         <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase text-slate-600">
                            <SelectValue placeholder="Assign" />
                         </SelectTrigger>
                         <SelectContent>
                            {staffs?.map((s: any) => (
                              <SelectItem key={s.id} value={s.id} className="text-xs font-medium">
                                 {s.fullName || s.name}
                              </SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="py-4 px-4 text-center">
                       <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                             <span className={cn(
                               "text-[12px] font-black tracking-tight",
                               isOverbudget ? "text-rose-600" : "text-emerald-600"
                             )}>
                                Rp{actualHpp.toLocaleString()}
                             </span>
                             {!isOverbudget && actualHpp > 0 && (
                               <ShieldCheck className="h-3 w-3 text-emerald-500" />
                             )}
                          </div>
                          {targetHpp > 0 && (
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                Target: {targetHpp.toLocaleString()}
                             </span>
                          )}
                       </div>
                    </TableCell>

                    <TableCell className="py-4 px-4 text-center">
                       <span className={cn(
                         "rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm",
                         config.bg.includes('emerald') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                         config.bg.includes('rose') || config.bg.includes('red') ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                         config.bg.includes('blue') ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                         config.bg.includes('amber') || config.bg.includes('orange') ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                         config.bg.includes('purple') ? 'bg-purple-50 text-purple-600 border border-purple-100' : 
                         'bg-slate-50 text-slate-600 border border-slate-100'
                       )}>
                           {config.label}
                        </span>
                     </TableCell>

                     <TableCell className="py-4 px-4 text-center">
                        {sample.revisionStatus ? (
                           <span className={cn(
                              "rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm",
                              REVISION_STATUS_CONFIG[sample.revisionStatus]?.className || "bg-slate-50 text-slate-600 border border-slate-100"
                           )}>
                              {REVISION_STATUS_CONFIG[sample.revisionStatus]?.label || sample.revisionStatus}
                           </span>
                        ) : (
                           <span className="text-[11px] font-black text-slate-300">—</span>
                        )}
                     </TableCell>

                     <TableCell className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                           <Clock className={cn("h-3 w-3", aging > 7 ? "text-rose-500" : "text-slate-300")} />
                          <span className={cn(
                            "text-[11px] font-black",
                            aging > 7 ? "text-rose-600" : "text-slate-500"
                          )}>
                            {aging}d
                          </span>
                       </div>
                    </TableCell>

                     <TableCell className="py-4 px-4 text-right">
                       <div className="flex justify-end gap-2">
                          <DnaButton 
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/rnd/formula/${sample.formulas?.[0]?.id}`)}
                            className="h-7"
                          >
                             Open Lab
                          </DnaButton>

                          {sample.stage !== 'APPROVED' && sample.stage !== 'REJECTED' && (
                            <DnaButton 
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setSelectedSample(sample);
                                setUpdateStage(null);
                                setIsUpdateOpen(true);
                              }}
                              className="h-7 bg-emerald-600 hover:bg-emerald-700"
                            >
                               Advance
                            </DnaButton>
                          )}

                          {sample.stage === 'READY_TO_SHIP' && (
                             <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm bg-slate-50 text-slate-600 border border-slate-100 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" /> Waiting Shipment
                             </span>
                          )}
                       </div>
                     </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isUpdateOpen} onOpenChange={(open) => { setIsUpdateOpen(open); if (!open) setConfirmAdvance(false); }}>
         <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl p-0 overflow-hidden border-none shadow-sm">
            <div className="p-8 bg-blue-600 text-white relative">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <RefreshCcw className="h-24 w-24 rotate-12" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="h-6 w-6 rounded bg-blue-500 flex items-center justify-center text-[10px] font-black">RND</div>
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">Stage Override</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Manual Status Control</h3>
                  <p className="text-slate-400 text-xs mt-1 font-medium italic opacity-80">You are manually updating the sample's progression in the R&D pipeline.</p>
               </div>
            </div>

            <div className="p-8 space-y-8">
               {confirmAdvance && (
                 <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                   <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2">Confirmation Summary</p>
                   <div className="space-y-1">
                     <p className="text-xs text-slate-700">
                       <span className="font-bold">Sample:</span> {selectedSample?.productName}
                     </p>
                     <p className="text-xs text-slate-700">
                       <span className="font-bold">Stage:</span> {selectedSample?.stage} → {updateStage || selectedSample?.stage}
                     </p>
                     {findings && (
                       <p className="text-xs text-slate-700">
                         <span className="font-bold">Notes:</span> {findings}
                       </p>
                     )}
                   </div>
                 </div>
               )}

               <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                     <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Select Next Stage</Label>
                     <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Current: {selectedSample?.stage}</span>
                  </div>
                  <Select value={updateStage || selectedSample?.stage || ""} onValueChange={(val) => val && setUpdateStage(val)}>
                     <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase text-slate-900 px-4 focus:ring-2 focus:ring-blue-500 transition-all">
                        <SelectValue placeholder="Move to stage..." />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-slate-100 shadow-sm">
                        {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                           <SelectItem key={key} value={key} className="text-xs font-black py-3 hover:bg-slate-50 transition-colors">
                              <div className="flex flex-col gap-0.5">
                                 <span className={cn(key === selectedSample?.stage ? "text-blue-600" : "text-slate-900")}>
                                    {cfg.label} {key === selectedSample?.stage && "(Current)"}
                                 </span>
                                 <span className="text-[9px] text-slate-400 font-medium opacity-70">Move this sample into the {cfg.label.toLowerCase()} phase.</span>
                              </div>
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tight px-1 text-right block">Analyst Findings & Notes</Label>
                  <Textarea 
                    placeholder="Enter technical findings, stability issues, or client feedback notes here..." 
                    className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50 text-slate-900 font-medium p-4 text-xs focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                  />
               </div>
            </div>

            <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex gap-4">
               <DnaButton 
                variant="ghost"
                className="flex-1 h-12"
                onClick={() => { setIsUpdateOpen(false); setConfirmAdvance(false); }}
              >
                Cancel
              </DnaButton>
              {!confirmAdvance ? (
                <DnaButton 
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setConfirmAdvance(true)}
                  icon={<ArrowRight />}
                >
                  Review Changes
                </DnaButton>
              ) : (
                <DnaButton 
                  variant="primary"
                  size="lg"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => updateMutation.mutate({ 
                    id: selectedSample.id, 
                    newStage: updateStage || selectedSample.stage,
                    feedback: findings,
                  })}
                  disabled={updateMutation.isPending}
                  icon={updateMutation.isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                >
                  {updateMutation.isPending ? "Syncing..." : "Confirm & Advance"}
                </DnaButton>
              )}
            </div>
         </DialogContent>
      </Dialog>
    </TableShell>
  );
}

function KpiMiniCard({ icon, label, value, subValue }: { icon: any; label: string; value: string | number; subValue?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-sm transition-all relative overflow-hidden group">
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-slate-900 rotate-12 group-hover:rotate-0 transition-transform duration-500 pointer-events-none scale-150">
         {icon}
      </div>

      <div className="relative z-10 space-y-4">
         <div className="h-10 w-10 rounded-xl bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center transition-colors">
            {React.cloneElement(icon as React.ReactElement<any>, { className: "h-5 w-5 text-slate-500 group-hover:text-slate-900 transition-colors" })}
         </div>
         <div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight mb-1">{label}</p>
            <h4 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h4>
            {subValue && <p className="text-[10px] font-black text-slate-500 uppercase tracking-tight mt-1">{subValue}</p>}
         </div>
      </div>
    </div>
  );
}

