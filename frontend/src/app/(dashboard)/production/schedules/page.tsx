"use client";

import React, { useState, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  CalendarPlus,
  FlaskConical,
  Zap,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Calculator,
  Factory
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";
import { TableWrapper, StatCard, DnaBadge, DnaButton } from "@/components/dna";

const STAGE_CONFIG: Record<string, { label: string; prefix: string; color: string; bgColor: string; icon: any }> = {
  MIXING: { label: "Jadwal Mixing", prefix: "SM", color: "text-blue-600", bgColor: "bg-blue-600", icon: FlaskConical },
  FILLING: { label: "Jadwal Filing", prefix: "SF", color: "text-indigo-600", bgColor: "bg-indigo-600", icon: Zap },
  PACKING: { label: "Jadwal Packaging", prefix: "SP", color: "text-violet-600", bgColor: "bg-violet-600", icon: Package },
};

function SchedulesContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab")?.toUpperCase();
  const initialTab = ["MIXING", "FILLING", "PACKING"].includes(tabParam || "") ? tabParam! : "MIXING";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [selectedWO, setSelectedWO] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [targetQty, setTargetQty] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [upscalePercent, setUpscalePercent] = useState("");
  const [notes, setNotes] = useState("");

  // Queries
  const { data: schedules, isLoading: schedLoading, isError: schedError } = useQuery({
    queryKey: ["production-schedules", activeTab],
    queryFn: async () => {
      const res = await api.get(`/production/schedules?stage=${activeTab}`);
      return res.data;
    }
  });

  const { data: workOrders, isLoading: woLoading } = useQuery({
    queryKey: ["work-orders-select"],
    queryFn: async () => {
      const res = await api.get("/production/active");
      return res.data;
    }
  });

  const { data: machines, isLoading: machLoading } = useQuery({
    queryKey: ["machines"],
    queryFn: async () => {
      const res = await api.get("/production/machines");
      return res.data;
    }
  });
  const createMutation = useMutation({
    mutationFn: async (data: any) => api.post("/production/schedules", data),
    onSuccess: () => {
      toast.success("Schedule created with upscale intelligence.");
      queryClient.invalidateQueries({ queryKey: ["production-schedules"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed")
  });

  if (schedLoading || woLoading || machLoading) {
    return <QueryLoading message="Loading schedules..." />;
  }
  if (schedError) {
    return <QueryError error="Failed to load schedules" onRetry={() => window.location.reload()} />;
  }

  const resetForm = () => {
    setSelectedWO(""); setSelectedMachine(""); setTargetQty(""); setStartTime(""); setEndTime(""); setUpscalePercent(""); setNotes("");
  };

  const handleCreate = () => {
    if (!selectedWO || !selectedMachine || !targetQty || !startTime || !endTime) return toast.error("Complete all required fields.");
    createMutation.mutate({
      workOrderId: selectedWO,
      machineId: selectedMachine,
      stage: activeTab,
      startTime,
      endTime,
      targetQty: Number(targetQty),
      upscalePercent: upscalePercent ? Number(upscalePercent) : undefined,
      notes,
    });
  };

  const upscaleResult = upscalePercent && targetQty ? Number(targetQty) * (1 + Number(upscalePercent) / 100) : null;

  const stageConf = STAGE_CONFIG[activeTab];
  const scheduledCount = schedules?.filter((s: any) => s.status === "SCHEDULED")?.length || 0;
  const completedCount = schedules?.filter((s: any) => s.status === "COMPLETED")?.length || 0;

  return (
    <DashboardShell
      title="Batch"
      titleAccent="Schedules"
      subtitle="Jadwal produksi per-stage dengan upscale intelligence"
      actions={
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <DnaButton variant="secondary" size="md" icon={<CalendarPlus />}>
               Create Schedule
            </DnaButton>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white">
               <h2 className="text-lg font-black uppercase tracking-tight">New Schedule</h2>
               <p className="text-slate-400 text-[8px] font-black mt-1.5 uppercase tracking-widest">Automated Stage Schedule Initialization</p>
            </div>
            <div className="p-5 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Work Order</label>
                   <Select onValueChange={(val: string | null) => setSelectedWO(val ?? "")}>
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-250 rounded-xl font-black text-[10px] uppercase tracking-wider text-slate-800 focus:bg-white transition-all"><SelectValue placeholder="Select WO..." /></SelectTrigger>
                    <SelectContent className="rounded-xl border border-slate-100 shadow-xl p-1.5 max-h-[300px]">
                      {workOrders?.map((wo: any) => (
                        <SelectItem key={wo.id} value={wo.id} className="rounded-lg h-12 px-3 font-bold text-[10px] uppercase tracking-wider">{wo.woNumber} — {wo.lead?.productInterest || wo.lead?.brandName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Machine</label>
                   <Select onValueChange={(val: string | null) => setSelectedMachine(val ?? "")}>
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-250 rounded-xl font-black text-[10px] uppercase tracking-wider text-slate-800 focus:bg-white transition-all"><SelectValue placeholder="Select machine..." /></SelectTrigger>
                    <SelectContent className="rounded-xl border border-slate-100 shadow-xl p-1.5 max-h-[300px]">
                      {machines?.map((m: any) => <SelectItem key={m.id} value={m.id} className="rounded-lg h-12 px-3 font-bold text-[10px] uppercase tracking-wider">{m.name} ({m.type})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Target Qty (pcs)</label>
                <Input type="number" value={targetQty} onChange={(e) => setTargetQty(e.target.value)} placeholder="5000" className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold text-[10px] uppercase placeholder:text-slate-400 focus:bg-white transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Start Time</label>
                  <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold text-[10px] focus:bg-white transition-all text-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">End Time</label>
                  <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold text-[10px] focus:bg-white transition-all text-slate-800" />
                </div>
              </div>

              {/* Upscale Intelligence */}
              {activeTab === "MIXING" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-[8px] font-black uppercase text-blue-600 tracking-wider">Upscale Intelligence</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold uppercase text-slate-400">Base</label>
                      <div className="h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-800 text-[10px]">{targetQty || "—"}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold uppercase text-slate-400">Upscale %</label>
                      <Input type="number" value={upscalePercent} onChange={(e) => setUpscalePercent(e.target.value)} placeholder="e.g. 5" className="h-9 bg-white border border-slate-200 rounded-xl font-bold text-[10px] text-center" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold uppercase text-slate-400">Upscaled</label>
                      <div className="h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs">
                        {upscaleResult ? Math.round(upscaleResult).toLocaleString() : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Notes</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan jadwal..." className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold text-[10px] placeholder:text-slate-400 focus:bg-white transition-all" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <DnaButton variant="outline" size="md" onClick={() => setIsModalOpen(false)}>Cancel</DnaButton>
                <DnaButton variant="primary" size="md" onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">
                  Create Schedule
                </DnaButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Stage Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="h-14 w-full bg-slate-100 rounded-2xl p-1 grid grid-cols-3 border border-slate-200">
          {Object.entries(STAGE_CONFIG).map(([key, conf]) => {
            const Icon = conf.icon;
            return (
              <TabsTrigger key={key} value={key} className="h-full rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black uppercase tracking-tight text-[10px]">
                <Icon className="mr-2 h-4 w-4" /> {conf.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Scheduled" value={scheduledCount} icon={<Clock className="text-amber-500" />} />
        <StatCard label="Completed" value={completedCount} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard label="Total Schedules" value={schedules?.length || 0} icon={<TrendingUp className="text-indigo-500" />} />
      </div>

      <TableWrapper>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="py-4 pl-6 font-black text-slate-400 uppercase tracking-widest text-[9px]">Schedule Code</TableHead>
                <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Work Order / Product</TableHead>
                <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Machine</TableHead>
                <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Target Qty</TableHead>
                <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Upscale</TableHead>
                <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px] text-center">Status</TableHead>
                <TableHead className="py-4 pr-6 text-right font-black text-slate-400 uppercase tracking-widest text-[9px]">Timing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {schedules?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarPlus className="h-12 w-12 text-slate-200 mb-3" />
                      <p className="text-sm font-black italic text-slate-400 uppercase tracking-wider">No Schedules Found</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Ready for scheduling</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                schedules?.map((sch: any) => {
                  const stConf = STAGE_CONFIG[sch.stage] || STAGE_CONFIG.MIXING;
                  return (
                    <TableRow key={sch.id} className="group hover:bg-slate-50/50 transition-all border-none">
                      <TableCell className="py-3 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-9 w-9 rounded-xl text-white flex items-center justify-center shadow-sm", stConf.bgColor)}>
                            <stConf.icon className="h-4.5 w-4.5" />
                          </div>
                          <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{sch.scheduleNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col text-left">
                          <span className="font-black text-slate-900 text-xs uppercase">{sch.workOrder?.woNumber}</span>
                          <span className="text-[8px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">{sch.workOrder?.lead?.productInterest || sch.workOrder?.lead?.brandName || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="font-black text-slate-700 text-xs uppercase">{sch.machine?.name || "—"}</p>
                      </TableCell>
                      <TableCell className="py-3 text-right font-black text-slate-900 text-xs tabular-nums">
                        {sch.targetQty.toLocaleString()} <span className="text-[9px] text-slate-400">pcs</span>
                        {sch.resultQty > 0 && <p className="text-[8px] text-emerald-600 font-bold uppercase mt-0.5">Yield: {sch.resultQty}</p>}
                      </TableCell>
                      <TableCell className="py-3">
                        {sch.upscalePercent ? (
                          <div className="space-y-1">
                            <DnaBadge status="info" className="py-0.5 px-1.5 rounded text-[8px]">+{sch.upscalePercent}%</DnaBadge>
                            <p className="text-[9px] text-slate-500 font-bold tabular-nums">{(sch.upscaleResult || 0).toLocaleString()}</p>
                          </div>
                        ) : (
                          <span className="text-slate-350 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <DnaBadge 
                          status={sch.status === "COMPLETED" ? "success" : sch.status === "IN_PROGRESS" ? "info" : "default"} 
                          className="py-0.5 px-2 rounded-md"
                        >
                          {sch.status}
                        </DnaBadge>
                      </TableCell>
                      <TableCell className="py-3 pr-6 text-right">
                        <div className="flex flex-col items-end">
                          <p className="font-bold text-slate-500 text-[10px] uppercase">{new Date(sch.startTime).toLocaleDateString()}</p>
                          <p className="text-[8px] font-black text-slate-450 uppercase mt-0.5">
                            {new Date(sch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(sch.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TableWrapper>
    </DashboardShell>
  );
}

export default function SchedulesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-slate-400 font-bold">Loading schedules...</div>}>
      <SchedulesContent />
    </Suspense>
  );
}

