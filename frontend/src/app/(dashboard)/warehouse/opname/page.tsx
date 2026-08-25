"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Barcode,
  PlusCircle,
  FileSpreadsheet,
  Zap,
  Box,
  Warehouse,
  Lock,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  OperationalButton,
  OperationalInput,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalDate } from "@/lib/operational-formatters";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StockOpnamePage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedOpnameId, setSelectedOpnameId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [opnameItems, setOpnameItems] = useState<any[]>([]);
  const [opnameNotes, setOpnameNotes] = useState("");

  const { data: opnameSessions, isLoading } = useQuery({
    queryKey: ["opname-sessions"],
    queryFn: () => api.get("/warehouse/opname").then(r => r.data),
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => api.get("/master/warehouses").then(r => r.data),
  });

  const { data: materials } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: () => api.get("/master/materials").then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.post("/warehouse/opname", data),
    onSuccess: () => {
      toast.success("Stock Opname session created.");
      queryClient.invalidateQueries({ queryKey: ["opname-sessions"] });
      setIsModalOpen(false);
      setOpnameItems([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create opname")
  });

  const pinApproveMutation = useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin: string }) =>
      api.post(`/warehouse/opname/${id}/approve-pin`, { userId: "system", pin }),
    onSuccess: () => {
      toast.success("Opname approved with Manager PIN. Inventory adjusted.");
      queryClient.invalidateQueries({ queryKey: ["opname-sessions"] });
      setIsPinModalOpen(false);
      setPin("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "PIN Verification Failed")
  });

  const addMaterial = (materialId: string) => {
    const mat = materials?.find((m: any) => m.id === materialId);
    if (!mat || opnameItems.find(i => i.materialId === materialId)) return;
    setOpnameItems([...opnameItems, { materialId: mat.id, name: mat.name, systemQty: Number(mat.stockQty), actualQty: Number(mat.stockQty) }]);
  };

  const handleCreate = () => {
    if (!selectedWarehouse) return toast.error("Select a warehouse.");
    if (opnameItems.length === 0) return toast.error("Add at least one material.");
    createMutation.mutate({
      warehouseId: selectedWarehouse,
      picId: "system",
      notes: opnameNotes,
      items: opnameItems.map(i => ({ materialId: i.materialId, systemQty: i.systemQty, actualQty: i.actualQty }))
    });
  };

  const draftCount = opnameSessions?.filter((s: any) => s.status === 'DRAFT')?.length || 0;
  const completedCount = opnameSessions?.filter((s: any) => s.status === 'COMPLETED')?.length || 0;

  return (
    <OperationalPageShell
      title="Stock Opname"
      subtitle="Physical Stock Reconciliation & Variance Analysis Terminal"
      actions={
        <OperationalButton variant="primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          <span>New Audit Session</span>
        </OperationalButton>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total Sessions"
            value={String(opnameSessions?.length || 0).padStart(2, '0')}
            icon={<Box className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Draft / Pending"
            value={String(draftCount).padStart(2, '0')}
            icon={<AlertCircle className="h-4 w-4" />}
            tone="amber"
          />
          <OperationalMetricCard
            label="Completed"
            value={String(completedCount).padStart(2, '0')}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="green"
          />
          <OperationalMetricCard
            label="Nodes Audited"
            value={String(warehouses?.length || 0).padStart(2, '0')}
            icon={<Warehouse className="h-4 w-4" />}
            tone="purple"
          />
        </OperationalMetricGrid>

        <OperationalPanel>
          <h3 className="text-[13px] font-semibold uppercase text-slate-700">Audit Sessions</h3>
          {isLoading ? (
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-56 bg-slate-50 rounded-md animate-pulse" />
              ))}
            </div>
          ) : (opnameSessions?.length ?? 0) === 0 ? (
            <div className="mt-3 rounded-md border border-dashed border-slate-200 py-12 text-center">
              <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="text-[13px] font-medium text-slate-400">Belum ada sesi opname</p>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
              {opnameSessions?.map((session: any) => {
                const totalDiff = session.items?.reduce((sum: number, i: any) => sum + Number(i.difference || 0), 0) || 0;
                const isDraft = session.status === 'DRAFT';
                return (
                  <OperationalPanel key={session.id} className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "grid h-12 w-12 place-items-center rounded-md",
                        isDraft ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {isDraft ? <ClipboardCheck className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                      </div>
                      <OperationalStatusBadge status={isDraft ? "pending" : "success"}>
                        {getOperationalStatusLabel(session.status)}
                      </OperationalStatusBadge>
                    </div>

                    <div>
                      <h3 className="text-[16px] font-semibold text-slate-900">
                        {session.warehouse?.name || "—"}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-medium uppercase text-slate-500">
                        ID: {session.opnameNumber} • {formatOperationalDate(session.createdAt) || "—"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[10px] font-medium uppercase text-slate-500">Items</p>
                        <p className="mt-1 text-[16px] font-semibold text-slate-900">{session.items?.length || 0}</p>
                      </div>
                      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[10px] font-medium uppercase text-slate-500">Variance</p>
                        <p className={cn(
                          "mt-1 text-[16px] font-semibold tabular-nums",
                          totalDiff < 0 ? "text-rose-600" : "text-emerald-600"
                        )}>
                          {totalDiff > 0 ? '+' : ''}{totalDiff}
                        </p>
                      </div>
                    </div>

                    {isDraft ? (
                      <OperationalButton
                        variant="primary"
                        onClick={() => { setSelectedOpnameId(session.id); setIsPinModalOpen(true); }}
                        className="w-full"
                      >
                        <Lock className="h-4 w-4" />
                        <span>Authorize PIN</span>
                      </OperationalButton>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 py-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-[11px] font-semibold uppercase text-emerald-700">Synced & Verified</span>
                      </div>
                    )}
                  </OperationalPanel>
                );
              })}
            </div>
          )}
        </OperationalPanel>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <OperationalPanel className="relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-md bg-slate-50 text-slate-400">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-slate-900">Bulk Reconciliation</h4>
                <p className="mt-1 text-[11px] font-medium uppercase text-slate-500">Import physical counts from Excel to mass-verify inventory locations.</p>
                <OperationalButton variant="primary" className="mt-3">
                  Upload Spreadsheet
                </OperationalButton>
              </div>
            </div>
            <Zap className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 text-slate-50" />
          </OperationalPanel>

          <OperationalPanel className="relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-md bg-slate-50 text-slate-400">
                <Barcode className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-slate-900">Scanner Protocol</h4>
                <p className="mt-1 text-[11px] font-medium uppercase text-slate-500">Connect wireless barcode scanners for high-speed physical stock counting.</p>
                <OperationalButton variant="primary" className="mt-3">
                  Enable Scanner
                </OperationalButton>
              </div>
            </div>
            <ClipboardCheck className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 text-slate-50" />
          </OperationalPanel>
        </div>
      </div>

      {/* PIN Approval Dialog */}
      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-xl border border-slate-200 bg-white p-0">
          <div className="bg-slate-900 p-8 text-center text-white">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-md bg-amber-500 text-slate-900">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-[16px] font-semibold uppercase">Manager Authorization</h3>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">Enter 6-digit escalation PIN to commit adjustment</p>
          </div>
          <div className="space-y-5 p-8">
            <Input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              className="h-14 rounded-md border border-slate-200 bg-slate-50 text-center text-2xl tracking-[0.5em] font-medium focus:ring-amber-500/20"
            />
            <OperationalButton
              variant="primary"
              onClick={() => selectedOpnameId && pinApproveMutation.mutate({ id: selectedOpnameId, pin })}
              disabled={pin.length < 4 || pinApproveMutation.isPending}
              className="w-full h-12"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Verify & Execute Adjustment</span>
            </OperationalButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[1000px] rounded-xl border border-slate-200 bg-white p-0">
          <div className="bg-slate-900 p-8 text-white relative">
            <h2 className="text-[18px] font-semibold">Physical Stock Count</h2>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">Inventory Audit Protocol v4.0</p>
            <ClipboardCheck className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 text-white/5" />
          </div>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto p-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="operational-field">
                <span>Audit Date</span>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 font-medium text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="operational-field">
                <span>Lead Auditor (PIC)</span>
                <Select defaultValue="system">
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 rounded-md font-medium text-[12px]">
                    <SelectValue placeholder="Select PIC..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system" className="text-[12px] font-medium">Zaki (System Admin)</SelectItem>
                    <SelectItem value="wh_sup" className="text-[12px] font-medium">Andi (WH Supervisor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="operational-field">
                <span>Target Warehouse</span>
                <Select onValueChange={(v) => setSelectedWarehouse((v as string) ?? '')}>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 rounded-md font-medium text-[12px]">
                    <SelectValue placeholder="Select warehouse..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((w: any) => <SelectItem key={w.id} value={w.id} className="text-[12px] font-medium">{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="operational-field">
                <span>Audit Notes</span>
                <Input value={opnameNotes} onChange={(e) => setOpnameNotes(e.target.value)} placeholder="Routine cycle count..." className="h-9 bg-slate-50 border border-slate-200 rounded-md font-medium text-[12px]" />
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <span className="text-[10px] font-semibold uppercase text-slate-700">Append Material to Audit</span>
              <Select onValueChange={(v) => addMaterial((v as string) ?? '')}>
                <SelectTrigger className="h-9 border-2 border-dashed border-slate-200 bg-white rounded-md font-medium text-[11px] text-slate-500">
                  <SelectValue placeholder="+ Append material to audit" />
                </SelectTrigger>
                <SelectContent>
                  {materials?.map((m: any) => <SelectItem key={m.id} value={m.id} className="text-[12px] font-medium">{m.name} (System: {Number(m.stockQty)})</SelectItem>)}
                </SelectContent>
              </Select>

              {opnameItems.length > 0 && (
                <div className="overflow-hidden rounded-md border border-slate-200">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2 text-[10px] font-medium uppercase text-slate-500">Material</th>
                        <th className="px-3 py-2 text-[10px] font-medium uppercase text-slate-500 text-center">System Qty</th>
                        <th className="px-3 py-2 text-[10px] font-medium uppercase text-slate-500 text-center">Actual Qty</th>
                        <th className="px-3 py-2 text-[10px] font-medium uppercase text-slate-500 text-center">Diff</th>
                        <th className="px-3 py-2 text-[10px] font-medium uppercase text-slate-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {opnameItems.map((item, idx) => {
                        const diff = item.actualQty - item.systemQty;
                        return (
                          <tr key={idx} className="bg-white">
                            <td className="px-3 py-2 text-[11px] font-medium text-slate-700">{item.name}</td>
                            <td className="px-3 py-2 text-[11px] font-medium tabular-nums text-center text-slate-500">{item.systemQty}</td>
                            <td className="px-3 py-2 text-center">
                              <Input
                                type="number" value={item.actualQty}
                                onChange={(e) => {
                                  const newItems = [...opnameItems];
                                  newItems[idx].actualQty = Number(e.target.value);
                                  setOpnameItems(newItems);
                                }}
                                className="h-8 w-20 mx-auto rounded-md border border-amber-200 bg-slate-50 text-center font-medium text-[11px] text-amber-600"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={cn("text-[11px] font-semibold tabular-nums", diff < 0 ? "text-rose-600" : diff > 0 ? "text-emerald-600" : "text-slate-300")}>
                                {diff > 0 ? "+" : ""}{diff}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => setOpnameItems(opnameItems.filter((_, i) => i !== idx))}
                                className="grid h-7 w-7 place-items-center rounded-md text-rose-500 hover:bg-rose-50"
                                aria-label="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <OperationalButton
              variant="primary"
              onClick={handleCreate}
              className="w-full h-12"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Processing..." : "Submit Audit Results"}
            </OperationalButton>
          </div>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
