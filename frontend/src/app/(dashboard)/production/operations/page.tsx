"use client";

import React, { useState, Suspense, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
 Tabs,
 TabsContent,
 TabsList,
 TabsTrigger,
} from "@/components/ui/tabs";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
 MetricCard,
 CanonicalMetricGrid,
 DataTable,
 StatusBadge,
 mapStatus,
} from "@/components/canonical";
import {
 ClipboardList,
 FlaskConical,
 Droplets,
 Package,
 ArrowRight,
 Clock,
 ChevronDown,
 Send,
 Loader2,
 Factory,
 ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { WoDetailDrawer } from "@/components/production/WoDetailDrawer";
import { toast } from "sonner";

const STAGE_CONFIG: Record<string, { label: string; variant: "info" | "warning" | "success" | "default" }> = {
 NOT_STARTED: { label: "Not Started", variant: "default" },
 IN_PROGRESS: { label: "In Progress", variant: "warning" },
 DONE: { label: "Done", variant: "success" },
};

const STAGE_OPTIONS = [
 { value: "NOT_STARTED", label: "Not Started" },
 { value: "IN_PROGRESS", label: "In Progress" },
 { value: "DONE", label: "Done" },
];

function OperationsContent() {
 const queryClient = useQueryClient();
 const searchParams = useSearchParams();
 const initialTab = searchParams.get("tab") || "work-orders";
 const [tab, setTab] = useState(initialTab);
 const [selectedWoId, setSelectedWoId] = useState<string | null>(null);

 const [confirmOpen, setConfirmOpen] = useState(false);
 const [selectedItem, setSelectedItem] = useState<any>(null);
 const [targetStage, setTargetStage] = useState<string>("");
 const [notes, setNotes] = useState("");
 const [woSort, setWoSort] = useState<"woNumber" | "product" | "stage" | "progress" | "target">("woNumber");
 const [woSortDir, setWoSortDir] = useState<"asc" | "desc">("asc");

 const { data: workOrders } = useQuery({
 queryKey: ["ops-work-orders"],
 queryFn: async () => (await api.get("/production/work-orders")).data,
 });

 const { data: mixingSchedules } = useQuery({
 queryKey: ["ops-mixing"],
 queryFn: async () => (await api.get("/production/schedules?stage=MIXING")).data,
 });

 const { data: fillingSchedules } = useQuery({
 queryKey: ["ops-filling"],
 queryFn: async () => (await api.get("/production/schedules?stage=FILLING")).data,
 });

 const { data: packingSchedules } = useQuery({
 queryKey: ["ops-packing"],
 queryFn: async () => (await api.get("/production/schedules?stage=PACKING")).data,
 });

 const updateStageMutation = useMutation({
 mutationFn: async (data: { id: string; stage: string; status: string; notes?: string }) =>
 api.post(`/production/${data.id}/submit-log`, {
 stage: data.stage,
 status: data.status,
 notes: data.notes || "",
 inputQty: 0,
 goodQty: 0,
 rejectQty: 0,
 }),
 onSuccess: () => {
 toast.success("Progress updated");
 queryClient.invalidateQueries({ queryKey: ["ops-mixing"] });
 queryClient.invalidateQueries({ queryKey: ["ops-filling"] });
 queryClient.invalidateQueries({ queryKey: ["ops-packing"] });
 setConfirmOpen(false);
 setNotes("");
 setSelectedItem(null);
 setTargetStage("");
 },
 onError: (err: any) => {
 toast.error(err.response?.data?.message || "Failed to update progress");
 },
 });

 const woList = Array.isArray(workOrders) ? workOrders : [];
 const mixingList = Array.isArray(mixingSchedules) ? mixingSchedules : [];
 const fillingList = Array.isArray(fillingSchedules) ? fillingSchedules : [];
 const packingList = Array.isArray(packingSchedules) ? packingSchedules : [];

 const filteredWoList = useMemo(() => {
 const progressRank = (s: string) => (s === "DONE" || s === "COMPLETED" ? 2 : s === "IN_PROGRESS" ? 1 : 0);
 const sorted = [...woList].sort((a: any, b: any) => {
 let av: any = "";
 let bv: any = "";
 if (woSort === "woNumber") { av = a.woNumber || ""; bv = b.woNumber || ""; }
 else if (woSort === "product") { av = a.productName || a.lead?.clientName || ""; bv = b.productName || b.lead?.clientName || ""; }
 else if (woSort === "stage") { av = a.stage || a.status || ""; bv = b.stage || b.status || ""; }
 else if (woSort === "progress") { av = progressRank(a.status); bv = progressRank(b.status); }
 else if (woSort === "target") { av = Number(a.targetQty || 0); bv = Number(b.targetQty || 0); }
 if (av < bv) return woSortDir === "asc" ? -1 : 1;
 if (av > bv) return woSortDir === "asc" ? 1 : -1;
 return 0;
 });
 return sorted;
 }, [woList, woSort, woSortDir]);

 const handleConfirmUpdate = () => {
 if (!selectedItem || !targetStage) return;
 updateStageMutation.mutate({
 id: selectedItem.id || selectedItem.workOrderId,
 stage: selectedItem.stage || targetStage,
 status: targetStage,
 notes,
 });
 };

 const getAgingDays = (date: string | undefined) => {
 if (!date) return 0;
 const start = new Date(date).getTime();
 const now = new Date().getTime();
 return Math.floor((now - start) / (1000 * 60 * 60 * 24));
 };

 const woColumns = useMemo<ColumnDef<any, any>[]>(() => [
 {
 id: "wo",
 header: "WO",
 cell: ({ row }) => {
 const wo = row.original;
 return (
 <div className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
 <Factory className="h-4 w-4" />
 </div>
 <span className="font-medium text-slate-900">{wo.woNumber || wo.id?.slice(0, 8)}</span>
 </div>
 );
 },
 },
 {
 id: "product",
 header: "Produk",
 cell: ({ row }) => <span className="text-slate-700">{row.original.productName || row.original.lead?.clientName || "—"}</span>,
 },
 {
 id: "stage",
 header: "Stage",
 cell: ({ row }) => (
 <StatusBadge variant={mapStatus(row.original.stage || row.original.status || "PLANNING")}>
 {row.original.stage || row.original.status || "PLANNING"}
 </StatusBadge>
 ),
 },
 {
 id: "progress",
 header: () => <div className="text-center">Progress</div>,
 cell: ({ row }) => {
 const s = row.original.status;
 const v: "success" | "warning" | "default" =
 s === "DONE" || s === "COMPLETED" ? "success" :
 s === "IN_PROGRESS" ? "warning" :
 "default";
 const lbl = s === "DONE" || s === "COMPLETED" ? "Done" :
 s === "IN_PROGRESS" ? "In Progress" :
 "Not Started";
 return (
 <div className="text-center">
 <StatusBadge variant={v}>{lbl}</StatusBadge>
 </div>
 );
 },
 },
 {
 id: "target",
 header: () => <div className="text-right">Target</div>,
 cell: ({ row }) => <span className="tabular-nums text-slate-700">{row.original.targetQty || "—"}</span>,
 },
 ], []);

 const stageColumns = useMemo<ColumnDef<any, any>[]>(() => [
 {
 id: "schedule",
 header: "Schedule",
 cell: ({ row }) => (
 <div className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
 <ClipboardList className="h-4 w-4" />
 </div>
 <span className="font-medium text-slate-900">{row.original.scheduleCode || row.original.scheduleNumber || row.original.id?.slice(0, 8)}</span>
 </div>
 ),
 },
 {
 id: "wo",
 header: "Work Order",
 cell: ({ row }) => <span className="text-slate-700">{row.original.workOrder?.woNumber || row.original.woNumber || "—"}</span>,
 },
 {
 id: "progress",
 header: () => <div className="text-center">Progress</div>,
 cell: ({ row }) => {
 const s = row.original.status === "COMPLETED" || row.original.status === "DONE" ? "DONE"
 : row.original.status === "IN_PROGRESS" ? "IN_PROGRESS" : "NOT_STARTED";
 return (
 <div className="text-center">
 <StatusBadge variant={STAGE_CONFIG[s].variant}>{STAGE_CONFIG[s].label}</StatusBadge>
 </div>
 );
 },
 },
 {
 id: "aging",
 header: () => <div className="text-center">Aging</div>,
 cell: ({ row }) => {
 const aging = getAgingDays(row.original.startTime);
 return (
 <div className="text-center">
 <span className={cn("tabular-nums font-medium", aging > 3 ? "text-amber-600" : "text-slate-500")}>
 {aging > 0 ? `${aging}d` : "—"}
 </span>
 </div>
 );
 },
 },
 ], []);

 const renderProgressTable = (items: any[], stageName: string) => {
 const inProgress = items.filter((i: any) => i.status === "IN_PROGRESS").length;
 const done = items.filter((i: any) => i.status === "DONE" || i.status === "COMPLETED").length;
 return (
 <div className="space-y-4">
 <CanonicalMetricGrid>
 <MetricCard label={`Total ${stageName}`} value={items.length} helper="All" icon={<ClipboardList />} variant="info" />
 <MetricCard label="In Progress" value={inProgress} helper="Active" icon={<Clock />} variant="warning" />
 <MetricCard label="Done" value={done} helper="Completed" icon={<ClipboardList />} variant="success" />
 </CanonicalMetricGrid>
 <DataTable
 title={`${stageName} Schedule`}
 data={items}
 columns={stageColumns}
 getRowId={(row) => row.id}
 enableSearch={false}
 emptyMessage={`No ${stageName.toLowerCase()} schedules`}
 emptyDescription="Schedules will appear here as work orders progress."
 />
 </div>
 );
 };

 return (
 <DashboardShell
 title="Operasional Produksi"
 subtitle="Work orders & progress tracking"
 >
 <Tabs value={tab} onValueChange={setTab} className="space-y-4">
 <TabsList className="h-auto p-1 bg-white border border-[#E2E8F0] rounded-lg w-fit">
 <TabsTrigger value="work-orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium inline-flex items-center gap-2">
 <ClipboardList className="h-3.5 w-3.5" /> Work Orders
 </TabsTrigger>
 <TabsTrigger value="mixing" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium inline-flex items-center gap-2">
 <FlaskConical className="h-3.5 w-3.5" /> Mixing
 </TabsTrigger>
 <TabsTrigger value="filling" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium inline-flex items-center gap-2">
 <Droplets className="h-3.5 w-3.5" /> Filling
 </TabsTrigger>
 <TabsTrigger value="packing" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium inline-flex items-center gap-2">
 <Package className="h-3.5 w-3.5" /> Packing
 </TabsTrigger>
 </TabsList>

 <TabsContent value="work-orders" className="space-y-4">
 <CanonicalMetricGrid>
 <MetricCard label="Total WO" value={woList.length} helper="All" icon={<ClipboardList />} variant="info" />
 <MetricCard label="Active" value={woList.filter((w: any) => w.status === "IN_PROGRESS").length} helper="In Progress" icon={<Clock />} variant="warning" />
 <MetricCard label="Finished" value={woList.filter((w: any) => w.status === "DONE" || w.status === "COMPLETED").length} helper="Done" icon={<ClipboardList />} variant="success" />
 </CanonicalMetricGrid>

 <DataTable
 title="Daftar Work Orders"
 data={filteredWoList}
 columns={woColumns}
 getRowId={(row) => row.id}
 searchPlaceholder="Cari WO / produk..."
 pageSize={15}
 emptyMessage="Belum ada work orders"
 emptyDescription="Work orders akan muncul di sini setelah dibuat."
 toolbar={
 <>
 <select
 value={woSort}
 onChange={(e) => setWoSort(e.target.value as typeof woSort)}
 className="h-9 rounded-md border border-[#E2E8F0] bg-white px-2 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
 aria-label="Sort Work Orders"
 >
 <option value="woNumber">Sort: WO</option>
 <option value="product">Sort: Produk</option>
 <option value="stage">Sort: Stage</option>
 <option value="progress">Sort: Progress</option>
 <option value="target">Sort: Target</option>
 </select>
 <button
 type="button"
 onClick={() => setWoSortDir((d) => (d === "asc" ? "desc" : "asc"))}
 className="h-9 w-9 grid place-items-center rounded-md border border-[#E2E8F0] bg-white text-slate-500 hover:bg-slate-50"
 aria-label="Toggle sort direction"
 >
 <ArrowUpDown className="h-3.5 w-3.5" />
 </button>
 </>
 }
 toolbarRight={
 <Link href="/production/work-orders" className="inline-flex items-center gap-1 h-9 px-3 rounded-md bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700">
 Kelola WO <ArrowRight className="h-3 w-3" />
 </Link>
 }
 />
 </TabsContent>

 <TabsContent value="mixing">{renderProgressTable(mixingList, "Mixing")}</TabsContent>
 <TabsContent value="filling">{renderProgressTable(fillingList, "Filling")}</TabsContent>
 <TabsContent value="packing">{renderProgressTable(packingList, "Packing")}</TabsContent>
 </Tabs>

 <WoDetailDrawer woId={selectedWoId} onClose={() => setSelectedWoId(null)} />

 <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
 <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white border border-[#E2E8F0] rounded-[12px]">
 <div className="p-5 space-y-4">
 <DialogHeader>
 <DialogTitle className="text-[14px] font-semibold text-slate-900">Update Progress</DialogTitle>
 </DialogHeader>

 <div className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-md">
 <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-1 rounded border border-[#E2E8F0]">
 {selectedItem?.scheduleCode || selectedItem?.woNumber || "—"}
 </span>
 <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
 <StatusBadge variant={STAGE_CONFIG[targetStage]?.variant ?? "default"}>
 {STAGE_CONFIG[targetStage]?.label || targetStage}
 </StatusBadge>
 </div>

 <div className="space-y-1">
 <label className="text-[11px] font-medium text-slate-500">
 Notes <span className="text-slate-400">(optional)</span>
 </label>
 <Textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder="Add notes..."
 className="min-h-[60px] rounded-md border-[#E2E8F0] bg-slate-50 text-[12px] p-3 focus:bg-white"
 />
 </div>
 </div>

 <div className="p-4 pt-0 flex gap-2 justify-end">
 <button
 onClick={() => {
 setConfirmOpen(false);
 setNotes("");
 setSelectedItem(null);
 setTargetStage("");
 }}
 className="h-9 px-4 rounded-md border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
 >
 Cancel
 </button>
 <button
 onClick={handleConfirmUpdate}
 disabled={updateStageMutation.isPending}
 className="h-9 px-4 rounded-md bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-50"
 >
 {updateStageMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
 <Send className="h-3.5 w-3.5" />
 Update
 </button>
 </div>
 </DialogContent>
 </Dialog>
 </DashboardShell>
 );
}

export default function OperationsPage() {
 return (
 <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>}>
 <OperationsContent />
 </Suspense>
 );
}
