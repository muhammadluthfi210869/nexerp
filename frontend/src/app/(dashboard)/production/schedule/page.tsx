"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
 Calendar, Loader2, ChevronLeft, ChevronRight,
 FlaskConical, Zap, Package, CalendarPlus,
 Clock, CheckCircle2, TrendingUp, Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OperationalMigrationShell } from "@/components/operational";
import { DnaBadge, DnaButton, StatCard, TableWrapper } from "@/components/dna";
import { WoDetailDrawer } from "@/components/production/WoDetailDrawer";
import { Input } from "@/components/ui/input";
import {
 Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
 Dialog, DialogContent, DialogTrigger
} from "@/components/ui/dialog";
import {
 Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { QueryLoading, QueryError } from "@/components/query-states";

const STAGE_ICONS: Record<string, any> = {
 MIXING: FlaskConical, FILLING: Zap, PACKING: Package,
};

const STAGE_COLORS: Record<string, string> = {
 MIXING: "bg-blue-500", FILLING: "bg-indigo-500", PACKING: "bg-purple-500",
};

const HOURS_TO_SHOW = 12;
const START_HOUR = 6;

const SCHEDULE_STAGE_CONFIG: Record<string, { label: string; prefix: string; color: string; bgColor: string; icon: any }> = {
 MIXING: { label: "Jadwal Mixing", prefix: "SM", color: "text-blue-600", bgColor: "bg-blue-600", icon: FlaskConical },
 FILLING: { label: "Jadwal Filing", prefix: "SF", color: "text-indigo-600", bgColor: "bg-indigo-600", icon: Zap },
 PACKING: { label: "Jadwal Packaging", prefix: "SP", color: "text-violet-600", bgColor: "bg-violet-600", icon: Package },
};

function GanttView() {
 const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
 const [stageFilter, setStageFilter] = useState<string>("ALL");
 const [dayOffset, setDayOffset] = useState(0);

 const today = useMemo(() => {
 const d = new Date();
 d.setDate(d.getDate() + dayOffset);
 return d.toISOString().slice(0, 10);
 }, [dayOffset]);

 const { data: schedules, isLoading } = useQuery({
 queryKey: ["schedules-gantt", today],
 queryFn: async () => {
 const res = await api.get("/production/schedules");
 return res.data;
 },
 });

 const machines = useMemo(() => {
 if (!schedules) return [];
 const map = new Map<string, any>();
 for (const s of schedules) {
 if (s.machine) map.set(s.machine.id, s.machine);
 }
 return Array.from(map.values());
 }, [schedules]);

 const filteredSchedules = useMemo(() => {
 if (!schedules) return [];
 return schedules.filter((s: any) => {
 const sDate = new Date(s.startTime).toISOString().slice(0, 10);
 if (sDate !== today) return false;
 if (stageFilter !== "ALL" && s.stage !== stageFilter) return false;
 return true;
 });
 }, [schedules, today, stageFilter]);

 const scheduleMap = useMemo(() => {
 const map = new Map<string, any[]>();
 for (const s of filteredSchedules) {
 const key = s.machineId || 'unassigned';
 const arr = map.get(key) || [];
 arr.push(s);
 map.set(key, arr);
 }
 return map;
 }, [filteredSchedules]);

 const toMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

 return (
 <>
 <div className="flex items-center justify-between mb-4">
 <div className="flex gap-1.5">
 {["ALL", "MIXING", "FILLING", "PACKING"].map(stage => (
 <button
 key={stage}
 onClick={() => setStageFilter(stage)}
 className={cn(
 "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
 stageFilter === stage
 ? "bg-slate-900 text-white border-[#E2E8F0]"
 : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
 )}
 >
 {stage === "ALL" ? "All Stages" : stage}
 </button>
 ))}
 </div>
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
 <button onClick={() => setDayOffset(d => d - 1)} className="p-1.5 rounded-lg hover:bg-slate-100">
 <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
 </button>
 <span className="text-[10px] font-black text-slate-600 px-2 tabular-nums">{today}</span>
 <button onClick={() => setDayOffset(d => d + 1)} className="p-1.5 rounded-lg hover:bg-slate-100">
 <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
 </button>
 </div>
 <button onClick={() => setDayOffset(0)} className="text-[9px] font-black text-blue-600 hover:underline">Today</button>
 <DnaBadge status="info" className="text-[9px]">{filteredSchedules.length} schedules</DnaBadge>
 </div>
 </div>

 {isLoading ? (
 <div className="h-[60vh] flex items-center justify-center">
 <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
 </div>
 ) : machines.length === 0 ? (
 <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
 <Calendar className="w-12 h-12 text-slate-300" />
 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No schedules for {today}</p>
 </div>
 ) : (
 <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
 <div className="flex border-b border-slate-200 bg-slate-50">
 <div className="w-48 shrink-0 p-3 border-r border-slate-200">
 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Machine</p>
 </div>
 <div className="flex-1 flex">
 {Array.from({ length: HOURS_TO_SHOW }, (_, i) => {
 const hour = START_HOUR + i;
 return (
 <div key={hour} className="flex-1 p-2 border-l border-slate-100 text-center" style={{ minWidth: `${100 / HOURS_TO_SHOW}%` }}>
 <span className="text-[8px] font-black text-slate-400 tabular-nums">{hour.toString().padStart(2, '0')}:00</span>
 </div>
 );
 })}
 </div>
 </div>
 <div className="divide-y divide-slate-100">
 {machines.map((machine: any) => {
 const schs = scheduleMap.get(machine.id) || [];
 return (
 <div key={machine.id} className="flex">
 <div className="w-48 shrink-0 p-3 border-r border-slate-100 bg-slate-50/50">
 <p className="text-[10px] font-bold text-slate-700 truncate">{machine.name}</p>
 <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">{machine.type}</p>
 </div>
 <div className="flex-1 relative min-h-[80px] bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(100%/12-1px),#f1f5f9_calc(100%/12-1px),#f1f5f9_calc(100%/12))]">
 {schs.length === 0 ? (
 <div className="absolute inset-0 flex items-center justify-center">
 <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest">Idle</p>
 </div>
 ) : (
 schs.map((s: any) => {
 const start = new Date(s.startTime);
 const end = new Date(s.endTime);
 const startMin = toMinutes(start);
 const endMin = toMinutes(end);
 const totalMin = HOURS_TO_SHOW * 60;
 const leftPct = ((startMin - START_HOUR * 60) / totalMin) * 100;
 const widthPct = ((endMin - startMin) / totalMin) * 100;
 const isActive = s.status === 'IN_PROGRESS';
 const Icon = STAGE_ICONS[s.stage] || Package;
 const color = STAGE_COLORS[s.stage] || "bg-slate-500";

 return (
 <button
 key={s.id}
 onClick={() => s.workOrderId && setSelectedWoId(s.workOrderId)}
 className={cn(
 "absolute top-2 h-12 rounded-lg px-2 py-1 border text-left transition-all hover: hover:-translate-y-0.5 overflow-hidden",
 color,
 isActive && "ring-2 ring-amber-400 ring-offset-1 animate-pulse"
 )}
 style={{
 left: `${Math.max(leftPct, 0)}%`,
 width: `${Math.min(widthPct, 100 - Math.max(leftPct, 0))}%`,
 minWidth: widthPct > 0 ? '60px' : '0px',
 }}
 >
 <div className="flex items-center gap-1 text-white">
 <Icon className="w-2.5 h-2.5 shrink-0" />
 <span className="text-[8px] font-black truncate">{s.workOrder?.woNumber || s.scheduleNumber}</span>
 </div>
 <p className="text-[6px] text-white/80 truncate mt-0.5">{s.targetQty} pcs</p>
 {widthPct > 15 && (
 <p className="text-[6px] text-white/60 mt-0.5">
 {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 )}
 </button>
 );
 })
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 <WoDetailDrawer woId={selectedWoId} onClose={() => setSelectedWoId(null)} />
 </>
 );
}

function SchedulesTableView() {
 const queryClient = useQueryClient();
 const searchParams = useSearchParams();
 const tabParam = searchParams.get("tab")?.toUpperCase();
 const initialTab = ["MIXING", "FILLING", "PACKING"].includes(tabParam || "") ? tabParam! : "MIXING";
 const [activeTab, setActiveTab] = useState(initialTab);
 const [isModalOpen, setIsModalOpen] = useState(false);

 const [selectedWO, setSelectedWO] = useState("");
 const [selectedMachine, setSelectedMachine] = useState("");
 const [targetQty, setTargetQty] = useState("");
 const [startTime, setStartTime] = useState("");
 const [endTime, setEndTime] = useState("");
 const [upscalePercent, setUpscalePercent] = useState("");
 const [notes, setNotes] = useState("");

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
 const scheduledCount = schedules?.filter((s: any) => s.status === "SCHEDULED")?.length || 0;
 const completedCount = schedules?.filter((s: any) => s.status === "COMPLETED")?.length || 0;

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div />
 <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
 <DialogTrigger asChild>
 <DnaButton variant="secondary" size="md" icon={<CalendarPlus />}>Create Schedule</DnaButton>
 </DialogTrigger>
 <DialogContent className="max-w-md bg-white rounded-2xl border-none p-0 overflow-hidden">
 <div className="bg-slate-900 p-5 text-white">
 <h2 className="text-lg font-black uppercase tracking-tight">New Schedule</h2>
 <p className="text-slate-400 text-[8px] font-black mt-1.5 uppercase tracking-widest">Automated Stage Schedule Initialization</p>
 </div>
 <div className="p-5 space-y-4 text-left">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Work Order</label>
 <Select onValueChange={(val: string | null) => setSelectedWO(val ?? "")}>
 <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-wider text-slate-800 focus:bg-white transition-all">
 <SelectValue placeholder="Select WO..." />
 </SelectTrigger>
 <SelectContent className="rounded-xl border border-slate-100 p-1.5 max-h-[300px]">
 {workOrders?.map((wo: any) => (
 <SelectItem key={wo.id} value={wo.id} className="rounded-lg h-12 px-3 font-bold text-[10px] uppercase tracking-wider">
 {wo.woNumber} — {wo.lead?.productInterest || wo.lead?.brandName}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Machine</label>
 <Select onValueChange={(val: string | null) => setSelectedMachine(val ?? "")}>
 <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-wider text-slate-800 focus:bg-white transition-all">
 <SelectValue placeholder="Select machine..." />
 </SelectTrigger>
 <SelectContent className="rounded-xl border border-slate-100 p-1.5 max-h-[300px]">
 {machines?.map((m: any) => (
 <SelectItem key={m.id} value={m.id} className="rounded-lg h-12 px-3 font-bold text-[10px] uppercase tracking-wider">
 {m.name} ({m.type})
 </SelectItem>
 ))}
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
 <DnaButton variant="primary" size="md" onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">Create Schedule</DnaButton>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="h-14 w-full bg-slate-100 rounded-2xl p-1 grid grid-cols-3 border border-slate-200">
 {Object.entries(SCHEDULE_STAGE_CONFIG).map(([key, conf]) => {
 const Icon = conf.icon;
 return (
 <TabsTrigger key={key} value={key} className="h-full rounded-xl data-[state=active]:bg-white data-[state=active]: font-black uppercase tracking-tight text-[10px]">
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
 const stConf = SCHEDULE_STAGE_CONFIG[sch.stage] || SCHEDULE_STAGE_CONFIG.MIXING;
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
 </div>
 );
}

export default function SchedulePage() {
 return (
 <OperationalMigrationShell
 title="Penjadwalan"
 titleAccent="Produksi"
 subtitle="Gantt chart & jadwal produksi per-stage"
 >
 <Tabs defaultValue="gantt">
 <TabsList className="h-12 bg-slate-100 rounded-2xl p-1 grid grid-cols-2 max-w-[320px] border border-slate-200">
 <TabsTrigger value="gantt" className="h-full rounded-xl data-[state=active]:bg-white data-[state=active]: font-black uppercase tracking-tight text-[10px]">Gantt</TabsTrigger>
 <TabsTrigger value="jadwal" className="h-full rounded-xl data-[state=active]:bg-white data-[state=active]: font-black uppercase tracking-tight text-[10px]">Jadwal</TabsTrigger>
 </TabsList>

 <TabsContent value="gantt" className="mt-6">
 <GanttView />
 </TabsContent>

 <TabsContent value="jadwal" className="mt-6">
 <Suspense fallback={<QueryLoading message="Loading schedules..." />}>
 <SchedulesTableView />
 </Suspense>
 </TabsContent>
 </Tabs>
 </OperationalMigrationShell>
 );
}
