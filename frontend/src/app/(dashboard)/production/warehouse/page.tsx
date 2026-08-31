"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 AlertTriangle,
 Truck,
 ClipboardList,
 Search,
 Filter,
 CheckCircle2,
} from "lucide-react";
import {
 OperationalDataTable,
 OperationalMetricCard,
 OperationalMetricGrid,
 OperationalPageShell,
 getOperationalStatusLabel,
} from "@/components/operational";
import { toast } from "sonner";

export default function WarehouseControlPage() {
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState("");

 const { data: requisitions, isLoading } = useQuery({
 queryKey: ["allRequisitions"],
 queryFn: async () => (await api.get("/production/requisitions")).data,
 refetchInterval: 10000,
 });

 const issueMutation = useMutation({
 mutationFn: async (id: string) =>
 (await api.post(`/production/requisitions/${id}/issue`)).data,
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["allRequisitions"] });
 toast.success("Material Issued Successfully");
 },
 });

 const shortageMutation = useMutation({
 mutationFn: async (id: string) =>
 (await api.post(`/production/requisitions/${id}/shortage`)).data,
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["allRequisitions"] });
 toast.error("Shortage Escalated to SCM");
 },
 });

 const filteredRequisitions = searchTerm
 ? requisitions?.filter((r: any) =>
 r.reqNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 r.workOrder?.woNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 r.workOrder?.lead?.brandName?.toLowerCase().includes(searchTerm.toLowerCase()),
 )
 : requisitions;

 const pendingCount = (requisitions ?? []).filter((r: any) => r.status === "PENDING").length;
 const shortageCount = (requisitions ?? []).filter((r: any) => r.status === "SHORTAGE").length;
 const issuedCount = (requisitions ?? []).filter((r: any) => r.status === "ISSUED").length;

 const statusTone = (s: string) =>
 s === "PENDING" ? "pending" : s === "ISSUED" ? "success" : s === "SHORTAGE" ? "danger" : "neutral";

 const columns = useMemo(
 () => [
 {
 accessorKey: "reqNumber",
 header: "Batch No",
 cell: ({ row }: { row: { original: any } }) => (
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-slate-900">{row.original.reqNumber}</span>
 <span className="text-[11px] text-slate-500">
 WO: {row.original.workOrder?.woNumber || "UNLINKED"}
 </span>
 </div>
 ),
 },
 {
 accessorKey: "brand",
 header: "Brand & Product",
 cell: ({ row }: { row: { original: any } }) => (
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-blue-600">
 {row.original.workOrder?.lead?.brandName || "Nex"}
 </span>
 <span className="text-[11px] text-slate-500">
 {row.original.workOrder?.lead?.productInterest || "PRIVATE LABEL"}
 </span>
 </div>
 ),
 },
 {
 accessorKey: "material",
 header: "Material Required",
 cell: ({ row }: { row: { original: any } }) => (
 <span className="text-[12px] font-medium text-slate-900">
 {row.original.material?.name || "BASE COMPOUND"}
 </span>
 ),
 },
 {
 accessorKey: "qty_requested",
 header: () => <div className="text-center">Req Qty</div>,
 cell: ({ row }: { row: { original: any } }) => (
 <div className="text-center text-[13px] font-medium tabular-nums text-slate-900">
 {row.original.qty_requested ?? "—"}{" "}
 <span className="text-[10px] text-slate-400 uppercase">
 {row.original.material?.unit || "KG"}
 </span>
 </div>
 ),
 },
 {
 accessorKey: "status",
 header: () => <div className="text-center">Status</div>,
 cell: ({ row }: { row: { original: any } }) => {
 const s = row.original.status;
 return (
 <div className="flex justify-center">
 <span className={`operational-status-badge is-${statusTone(s)}`}>
 {getOperationalStatusLabel(s)}
 </span>
 </div>
 );
 },
 },
 {
 id: "actions",
 header: () => <div className="text-right">Actions</div>,
 cell: ({ row }: { row: { original: any } }) => (
 <div className="flex justify-end gap-2">
 {row.original.status === "PENDING" && (
 <>
 <button
 type="button"
 className="operational-button is-danger h-8 px-3 text-[11px]"
 onClick={() => shortageMutation.mutate(row.original.id)}
 disabled={shortageMutation.isPending}
 >
 <AlertTriangle className="h-3.5 w-3.5" />
 <span>Shortage</span>
 </button>
 <button
 type="button"
 className="operational-button is-primary h-8 px-3 text-[11px]"
 onClick={() => issueMutation.mutate(row.original.id)}
 disabled={issueMutation.isPending}
 >
 <Truck className="h-3.5 w-3.5" />
 <span>Issue Materials</span>
 </button>
 </>
 )}
 {row.original.status === "ISSUED" && (
 <div className="flex items-center gap-1 text-emerald-600">
 <CheckCircle2 className="h-4 w-4" />
 <span className="text-[10px] font-bold uppercase">Released</span>
 </div>
 )}
 </div>
 ),
 },
 ],
 [issueMutation, shortageMutation],
 );

 return (
 <OperationalPageShell
 title="Warehouse Command Center"
 subtitle="Phase 1: Demand-Supply Signal Orchestration"
 actions={
 <div className="flex items-center gap-2">
 <div className="operational-input-wrap">
 <span className="operational-input-icon">
 <Search className="h-4 w-4" />
 </span>
 <input
 type="text"
 placeholder="Search batch or material..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-72"
 />
 </div>
 <button type="button" className="operational-button is-secondary">
 <Filter className="h-3.5 w-3.5" />
 <span>Filter Status</span>
 </button>
 </div>
 }
 >
 <div className="operational-stack">
 <OperationalMetricGrid>
 <OperationalMetricCard
 label="Pending Requests"
 value={pendingCount}
 icon={<ClipboardList className="h-4 w-4" />}
 tone="amber"
 />
 <OperationalMetricCard
 label="Material Shortages"
 value={shortageCount}
 icon={<AlertTriangle className="h-4 w-4" />}
 tone="red"
 />
 <OperationalMetricCard
 label="Total Issued (MTD)"
 value={issuedCount}
 icon={<CheckCircle2 className="h-4 w-4" />}
 tone="green"
 />
 </OperationalMetricGrid>

 <OperationalDataTable
 data={(filteredRequisitions ?? []) as any[]}
 columns={columns as any}
 getRowId={(row: any) => row.id}
 loading={isLoading}
 emptyMessage={
 isLoading
 ? "Syncing inventory signals..."
 : searchTerm
 ? "No matching requisitions found."
 : "No active requisitions from production."
 }
 toolbar={
 <div className="flex items-center gap-2 text-[11px] text-slate-500">
 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
 <span className="font-bold uppercase tracking-wider">Live Signal Active</span>
 </div>
 }
 searchPlaceholder="Cari batch, WO, atau brand..."
 />
 </div>
 </OperationalPageShell>
 );
}