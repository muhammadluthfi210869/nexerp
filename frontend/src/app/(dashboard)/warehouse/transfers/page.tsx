"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowRight,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  Clock,
  PlusCircle,
  Play,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  OperationalButton,
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";

export default function TransferOrdersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceWarehouse, setSourceWarehouse] = useState<string>("");
  const [destWarehouse, setDestWarehouse] = useState<string>("");
  const [transferItems, setTransferItems] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: transfers, isLoading } = useQuery({
    queryKey: ["transfer-orders"],
    queryFn: () => api.get("/warehouse/transfers").then(r => r.data),
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
    mutationFn: async (data: any) => api.post("/warehouse/transfers", data),
    onSuccess: () => {
      toast.success("Transfer Order created.");
      queryClient.invalidateQueries({ queryKey: ["transfer-orders"] });
      setIsModalOpen(false);
      setTransferItems([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const executeMutation = useMutation({
    mutationFn: async (id: string) =>
      api.post(`/warehouse/transfers/${id}/execute`, { userId: "system" }),
    onSuccess: () => {
      toast.success("Transfer executed. Inventory synced.");
      queryClient.invalidateQueries({ queryKey: ["transfer-orders"] });
    },
  });

  const addMaterial = (materialId: string) => {
    const mat = materials?.find((m: any) => m.id === materialId);
    if (!mat || transferItems.find((i) => i.materialId === materialId)) return;
    setTransferItems([
      ...transferItems,
      {
        materialId: mat.id,
        name: mat.name,
        qty: 1,
        stockAvailable: Number(mat.stockQty),
      },
    ]);
  };

  const handleSubmit = () => {
    if (!sourceWarehouse || !destWarehouse)
      return toast.error("Select both warehouses.");
    if (transferItems.length === 0)
      return toast.error("Add at least one material.");
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    createMutation.mutate({
      sourceWarehouseId: sourceWarehouse,
      destWarehouseId: destWarehouse,
      notes,
      items: transferItems.map((i) => ({
        materialId: i.materialId,
        qty: i.qty,
      })),
    });
  };

  const pendingCount =
    transfers?.filter((t: any) => t.status === "PENDING")?.length || 0;
  const completedCount =
    transfers?.filter((t: any) => t.status === "COMPLETED")?.length || 0;

  const columns = React.useMemo(() => [
    {
      id: "transfer",
      header: "Transfer #",
      cell: ({ row }: any) => {
        const trf = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-600">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-900 truncate">{trf.transferNumber || trf.id || "—"}</p>
              <p className="text-[11px] text-slate-500">{trf.date || "—"}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "route",
      header: "Movement Route",
      cell: ({ row }: any) => {
        const trf = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-slate-900">{trf.sourceWarehouse?.name || "—"}</span>
            <ArrowRight className="h-3 w-3 text-indigo-500" />
            <span className="text-[12px] font-medium text-slate-900">{trf.destWarehouse?.name || "—"}</span>
          </div>
        );
      },
    },
    {
      id: "items",
      header: () => <span className="block text-right">Items</span>,
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Boxes className="h-4 w-4 text-slate-400" />
          <span className="text-[13px] font-medium tabular-nums">{row.original.items?.length ?? 0}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <span className="block text-center">Status</span>,
      cell: ({ getValue }: any) => {
        const value = String(getValue());
        const tone = value === "COMPLETED" ? "success" : value === "PENDING" ? "pending" : "neutral";
        return <div className="flex justify-center"><OperationalStatusBadge status={tone}>{getOperationalStatusLabel(value)}</OperationalStatusBadge></div>;
      },
    },
    {
      id: "operations",
      header: () => <span className="block text-right">Operations</span>,
      cell: ({ row }: any) => {
        const trf = row.original;
        if (trf.status === "PENDING") {
          return (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => executeMutation.mutate(trf.id)}
                className="operational-button is-primary"
              >
                <Play className="h-3 w-3" />
                <span>Execute</span>
              </button>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Synced</span>
          </div>
        );
      },
    },
  ], []);

  return (
    <OperationalPageShell
      title="Transfer Orders"
      subtitle="Inter-warehouse movement & stock relocation protocols"
      actions={
        <OperationalButton variant="primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          <span>Create Transfer</span>
        </OperationalButton>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard label="Pending" value={String(pendingCount).padStart(2, "0")} icon={<Clock />} tone="amber" />
          <OperationalMetricCard label="Completed" value={String(completedCount).padStart(2, "0")} icon={<CheckCircle2 />} tone="green" />
          <OperationalMetricCard label="Total Transfers" value={String(transfers?.length || 0).padStart(2, "0")} icon={<Truck />} tone="blue" />
          <OperationalMetricCard label="Active Nodes" value={String(warehouses?.length || 0).padStart(2, "0")} icon={<Warehouse />} />
        </OperationalMetricGrid>

        <OperationalDataTable
          data={(transfers || []) as any[]}
          columns={columns}
          getRowId={(item: any) => item.id}
          loading={isLoading}
          searchPlaceholder="Cari transfer..."
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[900px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white relative">
            <h2 className="text-2xl font-semibold tracking-tight">Transfer <span className="text-slate-400">Protocol</span></h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Inter-warehouse stock relocation protocol v4.0</p>
            <ArrowRightLeft className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 text-white/10" />
          </div>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              <div className="operational-field">
                <span>Source Warehouse *</span>
                <Select
                  onValueChange={(v) => setSourceWarehouse(v as string ?? "")}
                >
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-xs">
                    <SelectValue placeholder="Select origin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((w: any) => (
                      <SelectItem
                        key={w.id}
                        value={w.id}
                        className="font-semibold text-[10px]"
                      >
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="operational-field">
                <span>Destination Warehouse *</span>
                <Select
                  onValueChange={(v) => setDestWarehouse(v as string ?? "")}
                >
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-xs">
                    <SelectValue placeholder="Select destination..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      ?.filter((w: any) => w.id !== sourceWarehouse)
                      .map((w: any) => (
                        <SelectItem
                          key={w.id}
                          value={w.id}
                          className="font-semibold text-[10px]"
                        >
                          {w.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="operational-field">
                <span>Vehicle Plate (Logistics)</span>
                <Input
                  placeholder="e.g. B 1234 ABC"
                  className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-xs"
                />
              </div>
              <div className="operational-field">
                <span>Transfer Notes</span>
                <Input
                  placeholder="Relocation protocol..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-xs"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest">
                Append Material to Transfer
              </label>
              <Select onValueChange={(v) => addMaterial(v as string ?? "")}>
                <SelectTrigger className="h-12 border-2 border-dashed border-slate-200 bg-white rounded-xl font-semibold text-[10px] text-slate-400">
                  <SelectValue placeholder="+ Append material to transfer" />
                </SelectTrigger>
                <SelectContent>
                  {materials?.map((m: any) => (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      className="font-semibold text-[10px]"
                    >
                      {m.name} (Avail: {Number(m.stockQty)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {transferItems.length > 0 && (
                <div className="operational-panel overflow-hidden p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Material</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 text-center">Available</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 text-center">Transfer Qty</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transferItems.map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-4 py-3 text-[12px] font-medium">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-[12px] font-medium tabular text-center text-slate-400">
                            {item.stockAvailable}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val > item.stockAvailable)
                                  return toast.error(
                                    "Exceeds available stock"
                                  );
                                const newItems = [...transferItems];
                                newItems[idx].qty = val;
                                setTransferItems(newItems);
                              }}
                              className="w-20 h-9 bg-slate-50 border-indigo-100 rounded-lg text-center font-medium text-xs text-indigo-600"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setTransferItems(
                                  transferItems.filter((_, i) => i !== idx)
                                )
                              }
                              className="operational-button is-danger p-2"
                              aria-label="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <OperationalButton
              variant="primary"
              onClick={handleSubmit}
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Commit Transfer Order"}
            </OperationalButton>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menyimpan data ini?</p>
          <DialogFooter>
            <OperationalButton variant="secondary" onClick={() => setShowConfirm(false)}>
              Batal
            </OperationalButton>
            <OperationalButton variant="primary" onClick={confirmSubmit}>
              Ya, Simpan
            </OperationalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
