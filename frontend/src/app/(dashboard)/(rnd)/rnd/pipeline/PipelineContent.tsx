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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
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

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  QUEUE: { label: "Waitlist", color: "text-slate-500", bg: "bg-slate-100" },
  FORMULATING: { label: "Formulating", color: "text-blue-600", bg: "bg-blue-50" },
  LAB_TEST: { label: "Internal QC", color: "text-purple-600", bg: "bg-purple-50" },
  READY_TO_SHIP: { label: "Shipping Sample", color: "text-amber-600", bg: "bg-amber-50" },
  CLIENT_REVIEW: { label: "Client Review", color: "text-orange-600", bg: "bg-orange-50" },
  APPROVED: { label: "LOCKED / DEAL", color: "text-emerald-600", bg: "bg-emerald-50" },
  REJECTED: { label: "Revision Needed", color: "text-red-600", bg: "bg-red-50" },
};

export function PipelineContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [updateStage, setUpdateStage] = useState<string | null>(null);
  const [findings, setFindings] = useState("");

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
    <div className="p-6 md:p-8 space-y-8 bg-base min-h-screen text-slate-900">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-8 bg-white -m-6 mb-2 p-6 md:p-8">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <div className="h-2 w-2 rounded-full bg-indigo-600" />
             <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase">R&D Operations</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">
             Formula <span className="text-slate-400">Pipeline</span>
           </h1>
           <p className="text-slate-700 text-[11px] font-black uppercase tracking-tight mt-2">
             Technical Laboratory Workflow & Version Control
           </p>
        </div>

        <div className="flex gap-3">
           <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg h-10 px-6 text-xs font-bold transition-all">
              History
           </Button>
           <Button className="bg-slate-900 hover:bg-black text-white rounded-lg h-10 px-6 text-xs font-bold transition-all shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> New Formula
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <KpiMiniCard 
           icon={<Gauge className="h-4 w-4 text-indigo-600" />} 
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

      <Card className="rounded-xl border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search projects..." 
                className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1">
                Real-time Pipeline
              </Badge>
           </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-100/50 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 pl-6 text-[10px] font-black uppercase tracking-tight text-slate-700">Project Identity</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700 text-center">Type</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700 text-center">Version</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700 text-center">PIC Analyst</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700 text-center">Costing (HPP/Kg)</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700 text-center">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700 text-center">Aging</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-700 text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSamples?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-400 text-sm italic">
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
                  <TableRow key={sample.id} className="group border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {sample.productName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-[13px] tracking-tight">{sample.productName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{sample.sampleNumber} • {sample.lead?.brandName || sample.lead?.clientName}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                       <Badge variant="outline" className={cn(
                         "rounded px-2 py-0.5 text-[9px] font-bold uppercase border shadow-sm",
                         version === 1 
                          ? "bg-slate-900 text-white border-slate-900" 
                          : "bg-amber-500 text-white border-amber-600"
                       )}>
                          {version === 1 ? "ORIGINAL" : "REVISION"}
                       </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                       <span className="text-[11px] font-bold text-slate-400">
                          v{version}.0
                       </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <Select 
                        defaultValue={sample.picId} 
                        onValueChange={(val) => assignMutation.mutate({ sampleId: sample.id, picId: val })}
                      >
                         <SelectTrigger className="h-8 w-32 mx-auto bg-slate-50 border-slate-200 rounded-md font-bold text-[10px] uppercase text-slate-600">
                            <SelectValue placeholder="Assign" />
                         </SelectTrigger>
                         <SelectContent>
                            {staffs?.map((s: any) => (
                              <SelectItem key={s.id} value={s.id} className="text-xs font-bold">
                                 {s.fullName || s.name}
                              </SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="text-center">
                       <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                             <span className={cn(
                               "text-[12px] font-bold tracking-tight",
                               isOverbudget ? "text-rose-600" : "text-emerald-600"
                             )}>
                                Rp{actualHpp.toLocaleString()}
                             </span>
                             {!isOverbudget && actualHpp > 0 && (
                               <ShieldCheck className="h-3 w-3 text-emerald-500" />
                             )}
                          </div>
                          {targetHpp > 0 && (
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                Target: {targetHpp.toLocaleString()}
                             </span>
                          )}
                       </div>
                    </TableCell>

                    <TableCell className="text-center">
                       <Badge className={cn(
                         "rounded px-3 py-1 font-bold uppercase text-[9px] border shadow-sm",
                         "bg-white border-slate-200 text-slate-900"
                       )} style={{ 
                         backgroundColor: config.bg.includes('emerald') ? '#10b981' : 
                                          config.bg.includes('rose') || config.bg.includes('red') ? '#f43f5e' : 
                                          config.bg.includes('blue') ? '#2563eb' : 
                                          config.bg.includes('amber') || config.bg.includes('orange') ? '#f59e0b' : 
                                          config.bg.includes('purple') ? '#9333ea' : '#64748b',
                         color: 'white',
                         borderColor: 'transparent'
                       }}>
                          {config.label}
                       </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                       <div className="flex items-center justify-center gap-1.5">
                          <Clock className={cn("h-3 w-3", aging > 7 ? "text-rose-500" : "text-slate-300")} />
                          <span className={cn(
                            "text-[11px] font-bold",
                            aging > 7 ? "text-rose-600" : "text-slate-500"
                          )}>
                            {aging}d
                          </span>
                       </div>
                    </TableCell>

                    <TableCell className="text-right pr-6">
                       <div className="flex justify-end gap-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/rnd/formula/${sample.formulas?.[0]?.id}`)}
                            className="h-7 border-slate-200 text-slate-700 hover:bg-slate-50 text-[9px] font-bold uppercase tracking-tight px-3 rounded shadow-sm"
                          >
                             Open Lab
                          </Button>

                          {['FORMULATING', 'LAB_TEST'].includes(sample.stage) && (
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedSample(sample);
                                setUpdateStage('READY_TO_SHIP');
                                setIsUpdateOpen(true);
                              }}
                              className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold uppercase tracking-tight px-3 shadow-sm"
                            >
                              Mark Done
                            </Button>
                          )}

                          {sample.stage === 'READY_TO_SHIP' && (
                             <Badge className="h-8 bg-slate-100 text-slate-400 border-none px-3 flex items-center gap-1.5 font-bold text-[9px] uppercase">
                                <Clock className="h-3 w-3" /> Waiting Shipment
                             </Badge>
                          )}
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
         <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="p-8 bg-slate-900 text-white relative">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <RefreshCcw className="h-24 w-24 rotate-12" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="h-6 w-6 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-black">RND</div>
                     <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-300">Stage Override</span>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Manual Status Control</h3>
                  <p className="text-slate-400 text-xs mt-1 font-medium italic opacity-80">You are manually updating the sample's progression in the R&D pipeline.</p>
               </div>
            </div>

            <div className="p-8 space-y-8">
               <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                     <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Select Next Stage</Label>
                     <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Current: {selectedSample?.stage}</span>
                  </div>
                  <Select defaultValue={selectedSample?.stage} onValueChange={(val) => val && setUpdateStage(val)}>
                     <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-900 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all">
                        <SelectValue placeholder="Move to stage..." />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key} className="text-xs font-bold py-3 hover:bg-slate-50 transition-colors">
                             <div className="flex flex-col gap-0.5">
                                <span className={cn(key === "COMPLETED" ? "text-emerald-600" : "text-slate-900")}>{cfg.label}</span>
                                <span className="text-[9px] text-slate-400 font-medium opacity-70">Move this sample into the {cfg.label.toLowerCase()} phase.</span>
                             </div>
                          </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight px-1 text-right block">Analyst Findings & Notes</Label>
                  <Textarea 
                    placeholder="Enter technical findings, stability issues, or client feedback notes here..." 
                    className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50 text-slate-900 font-medium p-4 text-xs focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                  />
               </div>
            </div>

            <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex gap-4">
               <Button 
                variant="ghost"
                className="flex-1 h-12 text-slate-400 hover:text-slate-600 font-bold text-xs rounded-xl uppercase tracking-tight"
                onClick={() => setIsUpdateOpen(false)}
              >
                Cancel
              </Button>
               <Button 
                className="flex-1 h-12 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-tight"
                onClick={() => updateMutation.mutate({ 
                  id: selectedSample.id, 
                  newStage: updateStage || selectedSample.stage,
                  feedback: findings,
                })}
                disabled={updateMutation.isPending}
              >
                  {updateMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : (
                    <>
                      Update Pipeline <ArrowRight className="h-3 w-3" />
                    </>
                  )}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiMiniCard({ icon, label, value, subValue }: { icon: any; label: string; value: string | number; subValue?: string }) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm p-6 flex flex-col justify-between bg-white hover:shadow-md transition-all relative overflow-hidden group">
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
    </Card>
  );
}

