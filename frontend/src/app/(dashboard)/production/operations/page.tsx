"use client";

import React, { useState, Suspense } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DataCard, TableWrapper, StatCard, DnaBadge } from "@/components/dna";
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
} from "lucide-react";
import Link from "next/link";
import { WoDetailDrawer } from "@/components/production/WoDetailDrawer";
import { toast } from "sonner";

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NOT_STARTED: { label: "Not Started", color: "text-slate-600", bg: "bg-slate-100" },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-600", bg: "bg-amber-50" },
  DONE: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50" },
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

  const handleProgressClick = (item: any, stage: string) => {
    setSelectedItem(item);
    setTargetStage(stage);
    setNotes("");
    setConfirmOpen(true);
  };

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

  const renderProgressTable = (items: any[], stageName: string, stageKey: string) => {
    const iconMap: Record<string, any> = {
      MIXING: FlaskConical,
      FILLING: Droplets,
      PACKING: Package,
    };
    const Icon = iconMap[stageKey] || Factory;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label={`Total ${stageName}`} value={items.length} />
          <StatCard label="In Progress" value={items.filter((i: any) => i.status === "IN_PROGRESS").length} />
          <StatCard label="Done" value={items.filter((i: any) => i.status === "DONE" || i.status === "COMPLETED").length} />
        </div>

        <DataCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-slate-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">{stageName} Schedule</h3>
            </div>
          </div>
          <TableWrapper>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Schedule</th>
                  <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Work Order</th>
                  <th className="text-center py-3 px-4 text-[10px] font-black uppercase text-slate-400">Progress</th>
                  <th className="text-center py-3 px-4 text-[10px] font-black uppercase text-slate-400">Aging</th>
                  <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">No {stageName.toLowerCase()} schedules</td>
                  </tr>
                ) : (
                  items.map((item: any) => {
                    const status = item.status === "COMPLETED" || item.status === "DONE" ? "DONE"
                      : item.status === "IN_PROGRESS" ? "IN_PROGRESS" : "NOT_STARTED";
                    const config = STAGE_CONFIG[status] || STAGE_CONFIG.NOT_STARTED;
                    const aging = getAgingDays(item.startTime);

                    return (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", config.bg)}>
                              <Icon className={cn("h-4 w-4", config.color)} />
                            </div>
                            <span className="text-xs font-black text-slate-900">{item.scheduleCode || item.scheduleNumber || item.id?.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {item.workOrder?.woNumber || item.woNumber || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={cn(
                                  "rounded-lg px-3 py-1.5 font-black uppercase text-[9px] shadow-sm flex items-center gap-1.5 cursor-pointer mx-auto",
                                  config.bg,
                                  config.color
                                )}
                              >
                                {config.label}
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-xl border-none shadow-sm p-2 bg-white min-w-[150px]">
                              {STAGE_OPTIONS.map((opt) => (
                                <DropdownMenuItem
                                  key={opt.value}
                                  onClick={() => handleProgressClick(item, opt.value)}
                                  className={cn(
                                    "rounded-lg h-9 px-3 font-black uppercase text-[8px] cursor-pointer flex justify-between",
                                    status === opt.value ? "bg-slate-100" : "hover:bg-slate-50"
                                  )}
                                >
                                  {opt.label}
                                  {status !== opt.value && <ArrowRight className="h-3 w-3 text-blue-500" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className={cn("h-3 w-3", aging > 3 ? "text-amber-500" : "text-slate-300")} />
                            <span className={cn("text-xs font-black", aging > 3 ? "text-amber-600" : "text-slate-500")}>
                              {aging > 0 ? `${aging}d` : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {status !== "DONE" && (
                            <button
                              onClick={() => handleProgressClick(item, status === "NOT_STARTED" ? "IN_PROGRESS" : "DONE")}
                              className="h-8 px-4 rounded-xl font-black uppercase text-[9px] bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {status === "NOT_STARTED" ? "Start" : "Complete"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableWrapper>
        </DataCard>
      </div>
    );
  };

  return (
    <DashboardShell
      title="Operasional"
      titleAccent="Produksi"
      subtitle="Work orders & progress tracking"
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-14 w-full bg-slate-100 rounded-2xl p-1 border border-slate-200">
          <TabsTrigger value="work-orders" className="h-full rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black uppercase tracking-tight text-[10px]">
            <ClipboardList className="mr-2 h-4 w-4" />
            Work Orders
          </TabsTrigger>
          <TabsTrigger value="mixing" className="h-full rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black uppercase tracking-tight text-[10px]">
            <FlaskConical className="mr-2 h-4 w-4" />
            Mixing
          </TabsTrigger>
          <TabsTrigger value="filling" className="h-full rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black uppercase tracking-tight text-[10px]">
            <Droplets className="mr-2 h-4 w-4" />
            Filling
          </TabsTrigger>
          <TabsTrigger value="packing" className="h-full rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black uppercase tracking-tight text-[10px]">
            <Package className="mr-2 h-4 w-4" />
            Packing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="work-orders" className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total WO" value={woList.length} />
            <StatCard label="Active" value={woList.filter((w: any) => w.status === "IN_PROGRESS").length} />
            <StatCard label="Finished" value={woList.filter((w: any) => w.status === "DONE" || w.status === "COMPLETED").length} />
          </div>
          <DataCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Daftar Work Orders</h3>
              <Link href="/production/work-orders" className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">
                Kelola WO <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <TableWrapper>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">WO</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Produk</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Stage</th>
                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase text-slate-400">Progress</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {woList.slice(0, 15).map((wo: any) => (
                    <tr key={wo.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Factory className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="text-xs font-black text-slate-900">{wo.woNumber || wo.id?.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{wo.productName || wo.lead?.clientName || "-"}</td>
                      <td className="py-3 px-4">
                        <DnaBadge status={wo.stage === "FINISHED_GOODS" ? "success" : wo.status === "IN_PROGRESS" ? "warning" : "default"}>
                          {wo.stage || wo.status || "PLANNING"}
                        </DnaBadge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {wo.stage === "FINISHED_GOODS" || wo.status === "DONE" ? (
                          <DnaBadge status="success">Done</DnaBadge>
                        ) : wo.status === "IN_PROGRESS" ? (
                          <DnaBadge status="warning">In Progress</DnaBadge>
                        ) : (
                          <DnaBadge status="default">Not Started</DnaBadge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-600">{wo.targetQty || "-"}</td>
                    </tr>
                  ))}
                  {woList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">Belum ada work orders</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </DataCard>
        </TabsContent>

        <TabsContent value="mixing" className="mt-6">
          {renderProgressTable(mixingList, "Mixing", "MIXING")}
        </TabsContent>

        <TabsContent value="filling" className="mt-6">
          {renderProgressTable(fillingList, "Filling", "FILLING")}
        </TabsContent>

        <TabsContent value="packing" className="mt-6">
          {renderProgressTable(packingList, "Packing", "PACKING")}
        </TabsContent>
      </Tabs>

      <WoDetailDrawer woId={selectedWoId} onClose={() => setSelectedWoId(null)} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <DialogTitle className="text-base font-black text-slate-900 uppercase tracking-tight truncate">
                Update Progress
              </DialogTitle>
            </div>

            <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-black text-slate-500 uppercase bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {selectedItem?.scheduleCode || selectedItem?.woNumber || "—"}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
              <span
                className={cn(
                  "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg",
                  STAGE_CONFIG[targetStage]?.bg || "bg-blue-100",
                  STAGE_CONFIG[targetStage]?.color || "text-blue-600"
                )}
              >
                {STAGE_CONFIG[targetStage]?.label || targetStage}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                Notes <span className="text-slate-300">(optional)</span>
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="min-h-[60px] rounded-xl border-slate-200 bg-slate-50 text-xs font-black p-3 focus:bg-white transition-all"
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
              className="h-10 px-5 rounded-xl font-black uppercase text-[10px] text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUpdate}
              disabled={updateStageMutation.isPending}
              className="h-10 px-5 rounded-xl font-black uppercase text-[10px] bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
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