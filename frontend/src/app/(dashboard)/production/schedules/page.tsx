"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const STAGE_CONFIG: Record<string, { label: string; prefix: string; color: string; bgColor: string; icon: any }> = {
  MIXING: { label: "Jadwal Mixing", prefix: "SM", color: "text-blue-600", bgColor: "bg-blue-600", icon: FlaskConical },
  FILLING: { label: "Jadwal Filing", prefix: "SF", color: "text-indigo-600", bgColor: "bg-indigo-600", icon: Zap },
  PACKING: { label: "Jadwal Packaging", prefix: "SP", color: "text-violet-600", bgColor: "bg-violet-600", icon: Package },
};

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("MIXING");
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
  const { data: schedules } = useQuery({
    queryKey: ["production-schedules", activeTab],
    queryFn: async () => {
      const res = await api.get(`/production/schedules?stage=${activeTab}`);
      return res.data;
    }
  });

  const { data: workOrders } = useQuery({
    queryKey: ["work-orders-select"],
    queryFn: async () => {
      const res = await api.get("/production/active");
      return res.data;
    }
  });

  const { data: machines } = useQuery({
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
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className={cn("w-8 h-1 rounded-full", stageConf.bgColor)} />
              <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", stageConf.color)}>Production Scheduling</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Batch <span className={stageConf.color}>Schedules</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Jadwal produksi per-stage dengan upscale intelligence
           </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className={cn("h-14 px-8 text-white rounded-2xl shadow-xl font-black uppercase tracking-tighter text-sm border-none", stageConf.bgColor)}>
               <CalendarPlus className="mr-2 h-5 w-5 stroke-[3px]" /> Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
            <div className={cn("p-10 text-white", stageConf.bgColor === "bg-blue-600" ? "bg-blue-900" : stageConf.bgColor === "bg-indigo-600" ? "bg-indigo-900" : "bg-violet-900")}>
               <h2 className="text-3xl font-bold tracking-tight">New {STAGE_CONFIG[activeTab].label}</h2>
               <p className="text-white/60 text-xs font-medium mt-2">Automated schedule number generation with formula tracking</p>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Work Order</label>
                  <Select onValueChange={(val: string | null) => setSelectedWO(val || "")}>
                    <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium"><SelectValue placeholder="Select WO..." /></SelectTrigger>
                    <SelectContent>
                      {workOrders?.map((wo: any) => (
                        <SelectItem key={wo.id} value={wo.id}>{wo.woNumber} — {wo.lead?.productInterest || wo.lead?.brandName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Machine</label>
                  <Select onValueChange={(val: string | null) => setSelectedMachine(val || "")}>
                    <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium"><SelectValue placeholder="Select machine..." /></SelectTrigger>
                    <SelectContent>
                      {machines?.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.type})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Target Qty (pcs)</label>
                  <Input type="number" value={targetQty} onChange={(e) => setTargetQty(e.target.value)} placeholder="5000" className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Start Time</label>
                  <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">End Time</label>
                  <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-14 bg-slate-50 border-slate-200 rounded-xl font-medium" />
                </div>
              </div>

              {/* Upscale Intelligence */}
              {activeTab === "MIXING" && (
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">Upscale Intelligence</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-blue-400">Base Result</label>
                      <div className="h-12 bg-white border border-blue-200 rounded-xl flex items-center justify-center font-bold text-blue-900">{targetQty || "—"}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-blue-400">Upscale %</label>
                      <Input type="number" value={upscalePercent} onChange={(e) => setUpscalePercent(e.target.value)} placeholder="e.g. 5" className="h-12 bg-white border-blue-200 rounded-xl font-medium text-center" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-blue-400">Upscale Result</label>
                      <div className="h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg">
                        {upscaleResult ? Math.round(upscaleResult).toLocaleString() : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan jadwal..." className="h-14 bg-slate-50 border-slate-200 rounded-xl" />

              <div className="flex gap-4 pt-4">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-14 px-8">Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className={cn("flex-1 h-14 text-white rounded-2xl font-semibold", stageConf.bgColor)}>
                  Create Schedule (Auto-Numbered)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stage Tabs */}
      <Tabs defaultValue="MIXING" onValueChange={setActiveTab}>
        <TabsList className="h-16 w-full bg-slate-50 rounded-2xl p-1.5 grid grid-cols-3">
          {Object.entries(STAGE_CONFIG).map(([key, conf]) => {
            const Icon = conf.icon;
            return (
              <TabsTrigger key={key} value={key} className="h-full rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-black uppercase tracking-tight text-xs">
                <Icon className="mr-2 h-4 w-4" /> {conf.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-100 p-6 bg-white flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center"><Clock className="h-6 w-6 text-amber-500" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">Scheduled</p>
            <p className="text-2xl font-black italic tracking-tighter text-amber-600">{scheduledCount}</p>
          </div>
        </Card>
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-100 p-6 bg-white flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">Completed</p>
            <p className="text-2xl font-black italic tracking-tighter text-emerald-600">{completedCount}</p>
          </div>
        </Card>
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-100 p-6 bg-white flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-indigo-500" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">Total</p>
            <p className="text-2xl font-black italic tracking-tighter text-indigo-600">{schedules?.length || 0}</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Kode Jadwal</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Work Order / Product</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Machine</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Target</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Upscale</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Status</TableHead>
              <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Jadwal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-slate-300 font-bold uppercase text-xs">
                  No schedules found for this stage. Create one above.
                </TableCell>
              </TableRow>
            )}
            {schedules?.map((sch: any) => {
              const stConf = STAGE_CONFIG[sch.stage] || STAGE_CONFIG.MIXING;
              return (
                <TableRow key={sch.id} className="group hover:bg-indigo-50/30 transition-all duration-300 border-b border-slate-50">
                  <TableCell className="py-6 pl-10">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-xl text-white flex items-center justify-center shadow", stConf.bgColor)}>
                        <stConf.icon className="h-5 w-5" />
                      </div>
                      <span className="font-black text-slate-900 tracking-tight text-sm uppercase italic">{sch.scheduleNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{sch.workOrder?.woNumber}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{sch.workOrder?.lead?.productInterest || sch.workOrder?.lead?.brandName || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-slate-600 text-xs">{sch.machine?.name || "—"}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-slate-900 text-sm">{sch.targetQty} pcs</p>
                    {sch.resultQty > 0 && <p className="text-[10px] text-emerald-600 font-bold">Hasil: {sch.resultQty}</p>}
                  </TableCell>
                  <TableCell>
                    {sch.upscalePercent ? (
                      <div className="space-y-1">
                        <Badge className="bg-blue-50 text-blue-700 border-none text-[9px] font-black">+{Number(sch.upscalePercent)}%</Badge>
                        <p className="text-[10px] text-blue-500 font-bold">{Number(sch.upscaleResult || 0).toLocaleString()}</p>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "rounded-xl px-4 py-1.5 font-black uppercase tracking-tight text-[9px] border-none shadow-sm",
                      sch.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                      sch.status === "IN_PROGRESS" ? "bg-blue-600 text-white animate-pulse" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {sch.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-10 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <p className="font-bold text-slate-500 text-xs">{new Date(sch.startTime).toLocaleDateString()}</p>
                      <p className="text-[9px] text-slate-300">{new Date(sch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(sch.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
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

