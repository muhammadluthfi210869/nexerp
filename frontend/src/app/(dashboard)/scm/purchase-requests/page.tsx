"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DnaButton } from "@/components/dna";
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
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Package,
  BadgeCheck,
  XCircle,
  Ban,
  User,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatOperationalDate } from "@/lib/operational-formatters";
import {
  OperationalDataTable,
  OperationalField,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";

interface PRItem {
  materialId: string;
  materialName: string;
  qtyRequired: number;
  estimatedPrice?: number;
}

interface PurchaseRequest {
  id: string;
  requestDate: string;
  warehouseId: string;
  warehouse: { name: string };
  priority: "LOW" | "MEDIUM" | "URGENT";
  status: "DRAFT" | "APPROVED" | "ORDERED" | "SUBMITTED" | "REJECTED";
  notes?: string;
  requirement?: { id: string; code: string; salesOrderVersion: number; formulaVersion: number };
  creator?: { fullName: string };
  items: Array<{
    id: string;
    material: { name: string };
    qtyRequired: number;
    estimatedPrice: number;
  }>;
}

const STATUS_TONE: Record<string, "success" | "pending" | "danger" | "neutral" | "process"> = {
  DRAFT: "neutral",
  SUBMITTED: "pending",
  APPROVED: "success",
  ORDERED: "process",
  REJECTED: "danger",
};

const PRIORITY_TONE: Record<string, "danger" | "pending" | "process"> = {
  URGENT: "danger",
  MEDIUM: "pending",
  LOW: "process",
};

export default function PurchaseRequestsPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [requiredDate, setRequiredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PRItem[]>([]);
  const [approveDialog, setApproveDialog] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [newItemMaterialId, setNewItemMaterialId] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: requests, isLoading } = useQuery<PurchaseRequest[]>({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-requests");
      return unwrapResponse(res);
    },
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get("/master/warehouses");
      return unwrapResponse(res) || [];
    },
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await api.get("/master/materials");
      return unwrapResponse(res) || [];
    },
  });

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    if (!searchTerm) return requests;
    const term = searchTerm.toLowerCase();
    return requests.filter(
      (pr: any) =>
        pr.warehouse?.name?.toLowerCase().includes(term) ||
        pr.priority?.toLowerCase().includes(term) ||
        pr.status?.toLowerCase().includes(term) ||
        pr.notes?.toLowerCase().includes(term),
    );
  }, [requests, searchTerm]);

  const createPRMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/purchase-request", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Purchase Request successfully broadcasted to SCM.");
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Protocol Error: Failed to commit request.");
    },
  });

  const approvePRMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/scm/purchase-requests/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("PR disetujui, PO berhasil dibuat.");
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setApproveDialog(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyetujui PR.");
    },
  });

  const rejectPRMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/scm/purchase-requests/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      toast.success("PR ditolak.");
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      setRejectDialog(null);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menolak PR.");
    },
  });

  const resetForm = () => {
    setSelectedWarehouse("");
    setPriority("MEDIUM");
    setNotes("");
    setItems([]);
  };

  const addItem = () => {
    if (!newItemMaterialId || !newItemQty) return;
    const material = materials?.find((m: any) => m.id === newItemMaterialId);
    if (!material) return;

    setItems([
      ...items,
      {
        materialId: newItemMaterialId,
        materialName: material.name,
        qtyRequired: Number(newItemQty),
        estimatedPrice: material.lastPurchasePrice || 0,
      },
    ]);
    setNewItemMaterialId("");
    setNewItemQty("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Payload Empty: Add at least one material.");
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    createPRMutation.mutate({
      warehouseId: selectedWarehouse,
      priority,
      requiredDate,
      notes,
      items: items.map((i) => ({
        materialId: i.materialId,
        qtyRequired: i.qtyRequired,
        estimatedPrice: i.estimatedPrice,
      })),
    });
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Data Permintaan",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold text-[10px]">
              PR
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-[12px] leading-tight">
                #{row.original.id.split("-")[0]}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {formatOperationalDate(row.original.requestDate)}
              </p>
              {row.original.requirement && (
                <p className="text-[10px] font-medium text-blue-600 mt-0.5">
                  Inherited from {row.original.requirement.code} · SO v{row.original.requirement.salesOrderVersion} · Formula v{row.original.requirement.formulaVersion}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "warehouse",
        header: "Gudang",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="space-y-1">
            <p className="text-slate-700 font-medium text-[12px] flex items-center gap-1.5">
              <Package size={12} className="text-blue-600" />
              {row.original.warehouse.name}
            </p>
            <OperationalStatusBadge status={PRIORITY_TONE[row.original.priority] ?? "process"}>
              {row.original.priority}
            </OperationalStatusBadge>
          </div>
        ),
      },
      {
        accessorKey: "creator",
        header: "Pembuat",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-1.5">
            <User size={11} className="text-slate-400" />
            <span className="text-[11px] text-slate-700">
              {row.original.creator?.fullName || "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "items",
        header: "Jml Item",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="space-y-0.5">
            <p className="font-medium text-slate-900 text-[12px]">{row.original.items.length} Materials {row.original.requirement ? "(inherited)" : ""}</p>
            <p className="text-[10px] text-slate-500 line-clamp-1 max-w-[180px]">
              {row.original.notes || "Tidak ada catatan"}
            </p>
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
              <OperationalStatusBadge status={STATUS_TONE[s] ?? "neutral"}>
                {getOperationalStatusLabel(s)}
              </OperationalStatusBadge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex justify-end gap-1.5">
            {row.original.status === "SUBMITTED" && (
              <>
                <button
                  type="button"
                  onClick={() => setApproveDialog(row.original.id)}
                  className="operational-button h-7 px-2 text-[11px]"
                  style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}
                >
                  <BadgeCheck className="h-3 w-3" />
                  <span>Setujui</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRejectDialog(row.original.id)}
                  className="operational-button is-danger h-7 px-2 text-[11px]"
                >
                  <XCircle className="h-3 w-3" />
                  <span>Tolak</span>
                </button>
              </>
            )}
            {row.original.status === "DRAFT" && (
              <button type="button" className="operational-button is-primary h-7 px-2 text-[11px]">
                Review
              </button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalPageShell
      title="Permintaan Pembelian"
      subtitle="Internal Procurement & Supply Chain Demand Logic • Protocol v1.0"
      actions={
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <DnaButton variant="primary" icon={<Plus className="h-4 w-4 stroke-[3px]" />}>
              Buat PR
            </DnaButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Kebutuhan Material</DialogTitle>
              <DialogDescription>
                Permintaan formal ke SCM untuk pengadaan
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <OperationalField label="Gudang Tujuan *">
                  <Select
                    value={selectedWarehouse}
                    onValueChange={(val) => {
                      if (typeof val === "string") setSelectedWarehouse(val);
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Gudang" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </OperationalField>
                <OperationalField label="Tingkat Prioritas *">
                  <Select
                    value={priority}
                    onValueChange={(val) => {
                      if (typeof val === "string") setPriority(val);
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">LOW</SelectItem>
                      <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                      <SelectItem value="URGENT">URGENT</SelectItem>
                    </SelectContent>
                  </Select>
                </OperationalField>
                <OperationalField label="Tgl Dibutuhkan *">
                  <input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    required
                  />
                </OperationalField>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] font-semibold text-slate-600">Item Material</Label>
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3">
                    <Select
                      value={newItemMaterialId}
                      onValueChange={(val) => {
                        if (typeof val === "string") setNewItemMaterialId(val);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cari Material..." />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <input
                    type="number"
                    placeholder="Jml"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[13px]"
                  />
                  <button type="button" onClick={addItem} className="operational-button is-primary">
                    Tambah
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/50">
                      <tr>
                        <th className="h-9 px-3 text-[10px] font-semibold uppercase">Material</th>
                        <th className="h-9 px-3 text-[10px] font-semibold uppercase">Jml</th>
                        <th className="h-9 px-3 text-[10px] font-semibold uppercase text-right">Estimasi Harga</th>
                        <th className="h-9"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="h-14 text-center text-[11px] text-slate-400">
                            Belum ada item
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={idx} className="bg-white border-b border-slate-50">
                            <td className="px-3 py-2 font-medium text-[12px]">{item.materialName}</td>
                            <td className="px-3 py-2 font-medium text-[12px] text-blue-600">{item.qtyRequired}</td>
                            <td className="px-3 py-2 text-right font-medium text-[12px]">
                              {formatCurrency(item.estimatedPrice || 0)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-rose-500 hover:bg-rose-50 h-8 w-8 rounded-lg flex items-center justify-center"
                                aria-label="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <OperationalField label="Catatan">
                <Textarea
                  placeholder="Alasan permintaan (contoh: Untuk Batch 502, Skincare Line)"
                  className="bg-slate-50 border-slate-200"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </OperationalField>

              <button
                type="submit"
                className="operational-button is-primary w-full"
                disabled={createPRMutation.isPending}
              >
                {createPRMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Kirim Permintaan"
                )}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="Total Permintaan"
            value={requests?.length ?? 0}
            icon={<FileText className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="Menunggu Approve"
            value={requests?.filter((r) => r.status === "DRAFT").length ?? 0}
            icon={<Clock className="h-4 w-4" />}
            tone="amber"
          />
          <OperationalMetricCard
            label="Mendesak"
            value={requests?.filter((r) => r.priority === "URGENT").length ?? 0}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="red"
          />
          <OperationalMetricCard
            label="Sudah Dipesan"
            value={requests?.filter((r) => r.status === "ORDERED").length ?? 0}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="green"
          />
        </OperationalMetricGrid>

        <OperationalDataTable
          data={filteredRequests as any}
          columns={columns as any}
          getRowId={(row: any) => row.id}
          searchPlaceholder="Cari gudang, prioritas, status, atau catatan..."
          emptyMessage="Belum ada permintaan."
          loading={isLoading}
        />
      </div>

      <Dialog
        open={!!approveDialog}
        onOpenChange={(open) => {
          if (!open) setApproveDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-500" />
              Konfirmasi Persetujuan PR
            </DialogTitle>
            <DialogDescription>
              Setujui Purchase Request ini? PO akan dibuat otomatis dari PR ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setApproveDialog(null)}
              className="operational-button is-ghost"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => approveDialog && approvePRMutation.mutate(approveDialog)}
              className="operational-button h-10 px-4 text-[12px]"
              style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}
            >
              Ya, Setujui & Buat PO
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rejectDialog}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-rose-500" />
              Konfirmasi Penolakan PR
            </DialogTitle>
            <DialogDescription>
              Tolak Purchase Request ini. Berikan alasan penolakan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <OperationalField label="Alasan Penolakan">
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Alasan mengapa ditolak..."
                className="bg-slate-50 border-slate-200 resize-none"
                rows={3}
              />
            </OperationalField>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => {
                setRejectDialog(null);
                setRejectReason("");
              }}
              className="operational-button is-ghost"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() =>
                rejectDialog &&
                rejectPRMutation.mutate({ id: rejectDialog, reason: rejectReason })
              }
              className="operational-button h-10 px-4 text-[12px]"
              style={{ background: "#e11d48", color: "#fff", borderColor: "#e11d48" }}
            >
              Ya, Tolak
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menyimpan data ini?</p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="operational-button is-secondary"
            >
              Batal
            </button>
            <button type="button" onClick={confirmSubmit} className="operational-button is-primary">
              Ya, Simpan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
