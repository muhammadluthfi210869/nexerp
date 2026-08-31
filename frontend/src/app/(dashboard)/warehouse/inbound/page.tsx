"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
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
  Trash2,
  ClipboardList,
  Activity,
  Boxes,
  MapPin,
} from "lucide-react";
import {
  PageShell,
  CanonicalMetricGrid,
  MetricCard,
  DataTable,
  StatusBadge,
  mapStatus,
  SectionCard,
  SectionCardContent,
} from "@/components/canonical";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import type { ColumnDef } from "@tanstack/react-table";

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
  const [items, setItems] = useState<InboundItem[]>([]);

  const [newItemMaterialId, setNewItemMaterialId] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemBatch, setNewItemBatch] = useState("");
  const [newItemExp, setNewItemExp] = useState("");

  const { data: inbounds, isLoading } = useQuery<any[]>({
    queryKey: ["warehouse-inbounds"],
    queryFn: async () => {
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
      return res.data
        .filter((po: any) => po.status === 'ORDERED' || po.status === 'PARTIAL')
        .map((po: any) => ({
          id: po.id,
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

  const derivedWarehouseId = selectedWarehouseId || warehouses?.[0]?.id || "";

  const createInboundMutation = useMutation({
    mutationFn: async (data: any) => {
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

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      id: "grn",
      header: "GRN Protocol",
      cell: ({ row }: any) => {
        const grn = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600">
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
      header: () => <div className="text-center">Contract Ref</div>,
      cell: ({ getValue }: any) => (
        <div className="text-center">
          <p className="text-[12px] font-medium tabular-nums">{String(getValue() ?? "—")}</p>
          <p className="text-[10px] text-blue-500">Verified contract</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ getValue }: any) => {
        const value = String(getValue());
        return (
          <div className="flex justify-center">
            <StatusBadge variant={mapStatus(value)}>
              {getOperationalStatusLabel(value)}
            </StatusBadge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: () => (
        <div className="flex justify-end">
          <button
            type="button"
            className="h-8 px-3 inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ClipboardList className="h-3 w-3" />
            <span>Review GRN</span>
          </button>
        </div>
      ),
    },
  ], []);

  const qcPassPct = inbounds?.length
    ? `${Math.round(inbounds.filter((g: any) => g.status === 'COMPLETED').length / inbounds.length * 100)}%`
    : '0%';

  return (
    <PageShell
      title="Goods Receiving"
      subtitle="Material intake & batch integrity terminal"
      actions={
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-9 px-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Receive Shipment</span>
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        <CanonicalMetricGrid>
          <MetricCard label="Today's Intake" value={String(inbounds?.length || 0).padStart(2, '0')} icon={<LogIn />} variant="info" />
          <MetricCard label="QC Passed" value={qcPassPct} icon={<ShieldCheck />} variant="success" />
          <MetricCard label="Avg. Cycle Time" value="45M" icon={<Activity />} variant="warning" />
          <MetricCard label="SKUs Added" value={String(inbounds?.reduce((s: number, g: any) => s + (g.itemsCount || 0), 0) || 0)} icon={<Boxes />} variant="neutral" />
        </CanonicalMetricGrid>

        <DataTable
          data={(inbounds || []) as any[]}
          columns={columns}
          getRowId={(item: any) => item.id}
          loading={isLoading}
          searchPlaceholder="Cari GRN..."
          emptyMessage="Belum ada GRN"
          title="Daftar Penerimaan Barang"
        />
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[850px] bg-white rounded-[12px] border border-[#E2E8F0] p-0 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white relative">
            <h2 className="text-[18px] font-semibold tracking-tight">Inbound Entry Portal</h2>
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">Verifying physical arrival vs purchase order record</p>
            <LogIn className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 text-white/10" />
          </div>
          <div className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-700">PO Reference (Contract)</label>
                <Select value={selectedPO} onValueChange={(v) => setSelectedPO(v ?? '')}>
                  <SelectTrigger className="h-10 bg-slate-50 border-[#E2E8F0] rounded-lg font-medium text-[12px]">
                    <SelectValue placeholder="Select purchase order..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activePOs?.map((po: any) => (
                      <SelectItem key={po.id} value={po.id} className="font-medium text-[12px]">{po.poNumber ?? po.id} - {po.supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-700">Gudang (Warehouse)</label>
                <Select value={selectedWarehouseId} onValueChange={(v) => setSelectedWarehouseId(v ?? '')}>
                  <SelectTrigger className="h-10 bg-slate-50 border-[#E2E8F0] rounded-lg font-medium text-[12px]">
                    <SelectValue placeholder={warehouses?.[0]?.name ?? "Pilih gudang..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((w: any) => (
                      <SelectItem key={w.id} value={w.id} className="font-medium text-[12px]">{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-slate-700">Received Date</label>
              <Input type="date" className="h-10 bg-slate-50 border-[#E2E8F0] rounded-lg font-medium text-[12px]" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-[#E2E8F0]">
              <label className="text-[10px] font-medium uppercase text-slate-700 tracking-[0.2em]">Material Inspection & Batch Entry</label>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <Select value={newItemMaterialId} onValueChange={(v) => setNewItemMaterialId(v ?? '')}>
                    <SelectTrigger className="h-10 bg-slate-50 border-[#E2E8F0] rounded-lg font-medium text-[11px]">
                      <SelectValue placeholder="Material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {materials?.map((m: any) => (
                        <SelectItem key={m.id} value={m.id} className="font-medium text-[12px]">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="QTY" type="number" className="h-10 bg-slate-50 border-[#E2E8F0] rounded-lg font-medium text-[11px] col-span-2" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} />
                <Input placeholder="BATCH #" className="h-10 bg-slate-50 border-[#E2E8F0] rounded-lg font-medium text-[11px] col-span-3" value={newItemBatch} onChange={(e) => setNewItemBatch(e.target.value)} />
                <Input type="date" className="h-10 bg-slate-50 border-[#E2E8F0] rounded-lg font-medium text-[11px] col-span-2" value={newItemExp} onChange={(e) => setNewItemExp(e.target.value)} />
                <button
                  type="button"
                  onClick={addItem}
                  className="h-10 col-span-1 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  aria-label="Add"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <SectionCard>
                <SectionCardContent className="p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-[#E2E8F0]">
                        <th className="px-4 py-2 text-[10px] font-medium uppercase text-slate-500">Material</th>
                        <th className="px-4 py-2 text-[10px] font-medium uppercase text-slate-500 text-center">Qty</th>
                        <th className="px-4 py-2 text-[10px] font-medium uppercase text-slate-500">Batch</th>
                        <th className="px-4 py-2 text-[10px] font-medium uppercase text-slate-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-4 py-2 text-[12px] font-medium">{item.materialName}</td>
                          <td className="px-4 py-2 text-[12px] font-medium text-center text-blue-600 tabular-nums">{item.qtyActual}</td>
                          <td className="px-4 py-2 text-[12px] text-slate-500">{item.lotNumber ?? "—"}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="h-7 w-7 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 inline-flex items-center justify-center"
                              aria-label="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={4} className="h-16 text-center text-[10px] font-medium text-slate-400 uppercase">Awaiting material entry</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </SectionCardContent>
              </SectionCard>
            </div>

            <button
              type="button"
              onClick={() => {
                if (items.length === 0) return toast.error("Add at least one material item.");
                if (!derivedWarehouseId) return toast.error("Pilih gudang terlebih dahulu (tidak ada gudang default).");
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
              disabled={createInboundMutation.isPending}
              className="h-10 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {createInboundMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Commit to Inventory"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
