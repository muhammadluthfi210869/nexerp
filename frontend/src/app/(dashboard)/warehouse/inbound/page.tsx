"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  LogIn,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Package,
  MapPin,
  ClipboardList,
  Activity,
  Boxes,
} from "lucide-react";
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

interface InboundItem {
  materialId: string;
  materialName: string;
  qtyActual: number;
  lotNumber?: string;
  expDate?: string;
}

export default function GoodsReceivingPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedPO, setSelectedPO] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InboundItem[]>([]);

  const [newItemMaterialId, setNewItemMaterialId] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemBatch, setNewItemBatch] = useState("");
  const [newItemExp, setNewItemExp] = useState("");

  const { data: inbounds, isLoading } = useQuery<any[]>({
    queryKey: ["warehouse-inbounds"],
    queryFn: async () => {
      // Canonical SCM receiving endpoint (Day-1 source of truth).
      const res = await api.get("/scm/inbounds");
      return res.data.map((grn: any) => ({
        id: grn.inboundNumber || grn.id,
        date: grn.receivedAt?.split('T')[0] || '',
        supplier: grn.po?.supplier?.name || 'Direct Inbound',
        po: grn.po?.poNumber || '-',
        status: grn.status,
      }));
    },
  });

  const { data: activePOs = [] } = useQuery<any[]>({
    queryKey: ["purchase-orders-active"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      // Canonical backend uses po.id (UUID). Keep poNumber for display only.
      return res.data
        .filter((po: any) => po.status === 'ORDERED' || po.status === 'PARTIAL')
        .map((po: any) => ({
          id: po.id, // canonical: UUID
          poNumber: po.poNumber || po.id,
          supplier: { name: po.supplier?.name || 'Unknown' },
        }));
    }
  });

  const { data: warehouses = [] } = useQuery<any[]>({
    queryKey: ["warehouses"],
    queryFn: () => api.get("/master/warehouses").then(r => r.data),
  });

  const { data: materials } = useQuery<any[]>({
    queryKey: ["materials"],
    queryFn: () => api.get("/master/materials").then(r => r.data),
  });

  // Deterministic warehouse fallback if the operator has not chosen one.
  const derivedWarehouseId = selectedWarehouseId || warehouses?.[0]?.id || "";

  const createInboundMutation = useMutation({
    mutationFn: async (data: any) => {
      // Canonical SCM inbound endpoint. Backend DTO requires
      //   { poId: UUID, warehouseId: UUID, items: [{ materialId, qtyActual, lotNumber?, expDate? }] }
      const res = await api.post("/scm/inbounds", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Goods successfully received and entered into system inventory.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-inbounds"] });
      queryClient.invalidateQueries({ queryKey: ["scm-inbounds"] });
      queryClient.invalidateQueries({ queryKey: ["scm-purchase-orders"] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create inbound");
    }
  });

  const resetForm = () => {
    setSelectedPO("");
    setSelectedWarehouseId("");
    setNotes("");
    setItems([]);
  };

  const addItem = () => {
    if (!newItemMaterialId || !newItemQty || !newItemBatch) return;
    const material = materials?.find((m: any) => m.id === newItemMaterialId);
    if (!material) return;

    setItems([...items, {
      materialId: newItemMaterialId,
      materialName: material.name,
      qtyActual: Number(newItemQty),
      lotNumber: newItemBatch,
      expDate: newItemExp || undefined,
    }]);
    setNewItemMaterialId("");
    setNewItemQty("");
    setNewItemBatch("");
    setNewItemExp("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const columns = [
    {
      id: "grn",
      header: "GRN Protocol",
      cell: ({ row }: any) => {
        const grn = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-600">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-900 truncate">{grn.id || "—"}</p>
              <p className="text-[11px] text-slate-500">{grn.date || "—"}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "vendor",
      header: "Vendor / Source",
      cell: ({ row }: any) => {
        const grn = row.original;
        return (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-3 w-3 text-blue-500" />
              <p className="text-[12px] font-medium text-slate-900">{grn.supplier || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] text-slate-500">Central Dock</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "po",
      header: () => <span className="block text-center">Contract Ref</span>,
      cell: ({ getValue }: any) => (
        <div className="text-center">
          <p className="text-[12px] font-medium tabular-nums">{getValue() || "—"}</p>
          <p className="text-[10px] text-blue-500">Verified contract</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <span className="block text-center">Status</span>,
      cell: ({ getValue }: any) => {
        const value = String(getValue());
        const tone = value === "COMPLETED" ? "success" : "pending";
        return <div className="flex justify-center"><OperationalStatusBadge status={tone}>{getOperationalStatusLabel(value)}</OperationalStatusBadge></div>;
      },
    },
    {
      id: "actions",
      header: () => <span className="block text-right">Action</span>,
      cell: () => (
        <div className="flex justify-end">
          <button type="button" className="operational-button is-secondary">
            <ClipboardList className="h-3 w-3" />
            <span>Review GRN</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <OperationalPageShell
      title="Goods Receiving"
      subtitle="Material intake & batch integrity terminal"
      actions={
        <OperationalButton variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Receive Shipment</span>
        </OperationalButton>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard label="Today's Intake" value={String(inbounds?.length || 0).padStart(2, '0')} icon={<LogIn />} tone="blue" />
          <OperationalMetricCard label="QC Passed" value={inbounds?.length ? `${Math.round(inbounds.filter((g: any) => g.status === 'COMPLETED').length / inbounds.length * 100)}%` : '0%'} icon={<ShieldCheck />} tone="green" />
          <OperationalMetricCard label="Avg. Cycle Time" value="45M" icon={<Activity />} tone="amber" />
          <OperationalMetricCard label="SKUs Added" value={String(inbounds?.reduce((s: number, g: any) => s + (g.itemsCount || 0), 0) || 0)} icon={<Boxes />} />
        </OperationalMetricGrid>

        <OperationalDataTable
          data={(inbounds || []) as any[]}
          columns={columns as any}
          getRowId={(item: any) => item.id}
          loading={isLoading}
          searchPlaceholder="Cari GRN..."
        />
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[850px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white relative">
            <h2 className="text-2xl font-semibold tracking-tight">Inbound <span className="text-slate-400">Entry Portal</span></h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Verifying physical arrival vs purchase order record</p>
            <LogIn className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 text-white/10" />
          </div>
          <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              <div className="operational-field">
                <span>PO Reference (Contract)</span>
                <Select value={selectedPO} onValueChange={(v) => setSelectedPO(v ?? '')}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-xs">
                    <SelectValue placeholder="Select purchase order..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activePOs?.map((po: any) => (
                      <SelectItem key={po.id} value={po.id} className="font-semibold text-[10px]">{po.poNumber ?? po.id} - {po.supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="operational-field">
                <span>Gudang (Warehouse)</span>
                <Select value={selectedWarehouseId} onValueChange={(v) => setSelectedWarehouseId(v ?? '')}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-xs">
                    <SelectValue placeholder={warehouses?.[0]?.name ?? "Pilih gudang..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((w: any) => (
                      <SelectItem key={w.id} value={w.id} className="font-semibold text-[10px]">{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="operational-field">
              <span>Received Date</span>
              <Input type="date" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-xs" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-[10px] font-bold uppercase text-slate-700 tracking-widest">Material Inspection & Batch Entry</label>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4">
                  <Select value={newItemMaterialId} onValueChange={(v) => setNewItemMaterialId(v ?? '')}>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-[10px]">
                      <SelectValue placeholder="Material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {materials?.map((m: any) => (
                        <SelectItem key={m.id} value={m.id} className="font-semibold text-[10px]">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="QTY" type="number" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-[10px] col-span-2" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} />
                <Input placeholder="BATCH #" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-[10px] col-span-3" value={newItemBatch} onChange={(e) => setNewItemBatch(e.target.value)} />
                <Input type="date" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-semibold text-[10px] col-span-2" value={newItemExp} onChange={(e) => setNewItemExp(e.target.value)} />
                <OperationalButton variant="primary" onClick={addItem} className="col-span-1">
                  <Plus className="h-4 w-4" />
                </OperationalButton>
              </div>

              <OperationalPanel className="p-0 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Material</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 text-center">Qty</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Batch</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-4 py-3 text-[12px] font-medium">{item.materialName}</td>
                        <td className="px-4 py-3 text-[12px] font-medium tabular text-center text-blue-600">{item.qtyActual}</td>
                        <td className="px-4 py-3 text-[12px] text-slate-500">{item.lotNumber ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="operational-button is-danger p-2"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={4} className="h-20 text-center text-[10px] font-bold text-slate-400 uppercase">Awaiting material entry</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </OperationalPanel>
            </div>

            <OperationalButton
              variant="primary"
              onClick={() => {
                if (items.length === 0) return toast.error("Add at least one material item.");
                if (!derivedWarehouseId) return toast.error("Pilih gudang terlebih dahulu (tidak ada gudang default).");
                // Canonical backend DTO: poId is UUID, warehouseId is UUID, items use qtyActual/lotNumber/expDate.
                createInboundMutation.mutate({
                  poId: selectedPO || undefined,
                  warehouseId: derivedWarehouseId,
                  items: items.map(i => ({
                    materialId: i.materialId,
                    qtyActual: i.qtyActual,
                    lotNumber: i.lotNumber,
                    expDate: i.expDate,
                  })),
                });
              }}
              className="w-full"
              disabled={createInboundMutation.isPending}
            >
              {createInboundMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Commit to Inventory"}
            </OperationalButton>
          </div>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
