"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Plus,
  FileEdit,
  Truck,
  PackageCheck,
  User,
  Package,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  Send,
  Loader2,
  XCircle,
  Receipt,
  BadgeCheck,
  Ban,
  Eye,
  Percent,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { formatOperationalDate } from "@/lib/operational-formatters";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { QueryLoading } from "@/components/query-states";
import { EmptyState } from "@/components/empty-state";

interface CartItem {
  materialId: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
}

const STATUS_TONE: Record<string, "neutral" | "pending" | "success" | "danger" | "process" | "purple"> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "pending",
  APPROVED: "success",
  REJECTED: "danger",
  ORDERED: "process",
  SHIPPED: "process",
  RECEIVED: "success",
  CANCELLED: "danger",
  SUBMITTED: "pending",
};

export default function PurchasingPage() {
  const queryClient = useQueryClient();
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [taxPercent, setTaxPercent] = useState("11");
  const [approveDialog, setApproveDialog] = useState<{ id: string; type: string } | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ id: string; type: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await api.get("/scm/vendors");
      return unwrapResponse(res) || [];
    }
  });

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: async () => {
      const res = await api.get("/scm/materials");
      return (unwrapResponse(res) || []).filter((m: any) => m.type === "RAW_MATERIAL" || m.type === "PACKAGING" || m.type === "LABEL" || m.type === "BOX");
    }
  });

  const { data: warehouses, isLoading: whLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get("/master/warehouses/active");
      return unwrapResponse(res) || [];
    }
  });

  const { data: prs, isLoading: prsLoading } = useQuery({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-requests");
      return unwrapResponse(res);
    }
  });

  const { data: purchaseOrders, isLoading: poLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return unwrapResponse(res) || [];
    }
  });

  const createPOMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/scm/purchase-orders", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Purchase Order berhasil dibuat.");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setIsPOModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal membuat PO.");
    }
  });

  const approvePOMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await api.patch(`/scm/purchase-orders/${id}/status`, { status: "APPROVED" });
      return res.data;
    },
    onSuccess: () => {
      toast.success("PO berhasil disetujui.");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setApproveDialog(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyetujui PO.");
    }
  });

  const rejectPOMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.patch(`/scm/purchase-orders/${id}/status`, { status: "REJECTED", reason });
      return res.data;
    },
    onSuccess: () => {
      toast.success("PO ditolak.");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setRejectDialog(null);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menolak PO.");
    }
  });

  const approvePRMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/scm/purchase-requests/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("PR disetujui, PO dibuat.");
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setApproveDialog(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyetujui PR.");
    }
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
    }
  });

  const resetForm = () => {
    setItems([]);
    setSelectedVendor("");
    setSelectedWarehouse("");
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setSelectedDueDate("");
    setNotes("");
    setTaxPercent("11");
  };

  const addItem = (materialId: string) => {
    const material = materials?.find((m: any) => m.id === materialId);
    if (!material) return;
    if (items.find((i) => i.materialId === materialId)) {
      toast.error("Barang sudah ada di keranjang.");
      return;
    }
    setItems([...items, { materialId: material.id, name: material.name, unit: material.unit, qty: 1, price: Number(material.unitPrice || 0) }]);
  };

  const removeItem = (materialId: string) => {
    setItems(items.filter((i) => i.materialId !== materialId));
  };

  const updateItem = (materialId: string, field: keyof CartItem, value: any) => {
    setItems(items.map((i) => (i.materialId === materialId ? { ...i, [field]: value } : i)));
  };

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const tax = subtotal * (Number(taxPercent) / 100);
  const grandTotal = subtotal + tax;

  const handleCreatePO = () => {
    if (!selectedVendor) { toast.error("Pilih supplier."); return; }
    if (items.length === 0) { toast.error("Tambah minimal satu barang."); return; }
    createPOMutation.mutate({
      supplierId: selectedVendor,
      estArrival: selectedDate,
      dueDate: selectedDueDate || undefined,
      notes: notes || undefined,
      taxPercent: Number(taxPercent),
      totalAmount: grandTotal,
      items: items.map((i) => ({
        materialId: i.materialId,
        quantity: i.qty,
        unitPrice: i.price,
      })),
    });
  };

  const handleApprove = () => {
    if (!approveDialog) return;
    if (approveDialog.type === "PO") {
      approvePOMutation.mutate({ id: approveDialog.id });
    } else {
      approvePRMutation.mutate(approveDialog.id);
    }
  };

  const handleReject = () => {
    if (!rejectDialog) return;
    if (rejectDialog.type === "PO") {
      rejectPOMutation.mutate({ id: rejectDialog.id, reason: rejectReason });
    } else {
      rejectPRMutation.mutate({ id: rejectDialog.id, reason: rejectReason });
    }
  };

  const pendingPrCount = prs?.filter((r: any) => r.status === 'DRAFT' || r.status === 'SUBMITTED').length || 0;
  const activePoCount = purchaseOrders?.filter((po: any) => po.status === 'APPROVED' || po.status === 'ORDERED').length || 0;
  const awaitingGrnCount = purchaseOrders?.filter((po: any) => po.status === 'ORDERED').length || 0;
  const totalPoValue = (purchaseOrders || []).reduce((sum: number, po: any) => sum + Number(po.totalValue || 0), 0);

  const poColumns = useMemo(
    () => [
      {
        accessorKey: "poNumber",
        header: "No. PO",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-3 min-w-[150px]">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-slate-100 text-slate-700">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <span className="text-[12px] font-semibold uppercase text-slate-900 whitespace-nowrap">
              {row.original.poNumber}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }: { row: { original: any } }) => (
          <span className="text-[12px] font-medium text-slate-700">{row.original.supplier?.name || "—"}</span>
        ),
      },
      {
        accessorKey: "estArrival",
        header: "Tgl",
        cell: ({ row }: { row: { original: any } }) => {
          const dateValue = row.original.estArrival || row.original.createdAt;
          return (
            <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">
              {formatOperationalDate(dateValue) || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "scm",
        header: "Pembuat",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
            <User className="h-3 w-3 text-slate-400" />
            <span>{row.original.scm?.fullName || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "totalValue",
        header: () => <div className="text-right">Nilai</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <span className="block text-right text-[12px] font-semibold tabular-nums text-slate-900">
            Rp {Number(row.original.totalValue || 0).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }: { row: { original: any } }) => {
          const s = row.original.status || "DRAFT";
          return (
            <div className="flex justify-center">
              <OperationalStatusBadge status={STATUS_TONE[s] || "neutral"}>
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
            {(row.original.status === 'DRAFT' || row.original.status === 'PENDING_APPROVAL') && (
              <>
                <OperationalButton
                  variant="primary"
                  onClick={() => setApproveDialog({ id: row.original.id, type: "PO" })}
                  className="h-8 px-2 text-[11px]"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span>Setuju</span>
                </OperationalButton>
                <OperationalButton
                  variant="secondary"
                  onClick={() => setRejectDialog({ id: row.original.id, type: "PO" })}
                  className="h-8 px-2 text-[11px]"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Tolak</span>
                </OperationalButton>
              </>
            )}
            {row.original.status === 'APPROVED' && (
              <OperationalButton variant="primary" className="h-8 px-2 text-[11px]">
                <Send className="h-3.5 w-3.5" />
                <span>Kirim PO</span>
              </OperationalButton>
            )}
            <OperationalButton variant="ghost" className="h-8 w-8 p-0" aria-label="Detail">
              <Eye className="h-4 w-4" />
            </OperationalButton>
          </div>
        ),
      },
    ],
    [],
  );

  const prColumns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-3 min-w-[120px]">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold">
              PR
            </div>
            <span className="text-[12px] font-semibold uppercase text-slate-900 whitespace-nowrap">
              #{row.original.id?.split('-')[0]}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "warehouse",
        header: "Gudang",
        cell: ({ row }: { row: { original: any } }) => (
          <span className="text-[12px] font-medium text-slate-700">{row.original.warehouse?.name || "—"}</span>
        ),
      },
      {
        accessorKey: "creator",
        header: "Pembuat",
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
            <User className="h-3 w-3 text-slate-400" />
            <span>{row.original.creator?.fullName || row.original.createdBy || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "items",
        header: () => <div className="text-right">Jml Item</div>,
        cell: ({ row }: { row: { original: any } }) => (
          <span className="block text-right text-[12px] font-semibold text-slate-900">{row.original.items?.length || 0}</span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }: { row: { original: any } }) => {
          const s = row.original.status || "DRAFT";
          return (
            <div className="flex justify-center">
              <OperationalStatusBadge status={STATUS_TONE[s] || "neutral"}>
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
            {row.original.status === 'SUBMITTED' && (
              <>
                <OperationalButton
                  variant="primary"
                  onClick={() => setApproveDialog({ id: row.original.id, type: "PR" })}
                  className="h-8 px-2 text-[11px]"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span>Setuju</span>
                </OperationalButton>
                <OperationalButton
                  variant="secondary"
                  onClick={() => setRejectDialog({ id: row.original.id, type: "PR" })}
                  className="h-8 px-2 text-[11px]"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Tolak</span>
                </OperationalButton>
              </>
            )}
            <OperationalButton variant="ghost" className="h-8 w-8 p-0" aria-label="Detail">
              <Eye className="h-4 w-4" />
            </OperationalButton>
          </div>
        ),
      },
    ],
    [],
  );

  if (vendorsLoading || materialsLoading || whLoading || prsLoading || poLoading) {
    return (
      <OperationalPageShell title="Pengadaan" subtitle="Memuat data...">
        <QueryLoading message="Memuat data pengadaan..." />
      </OperationalPageShell>
    );
  }

  return (
    <OperationalPageShell
      title="Pengadaan Pembelian"
      subtitle="Purchase Order & Requisisi — Supply Chain Management"
      actions={
        <OperationalButton variant="primary" onClick={() => setIsPOModalOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Buat PO Baru</span>
        </OperationalButton>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard
            label="PR Menunggu"
            value={String(pendingPrCount).padStart(2, '0')}
            icon={<FileEdit className="h-4 w-4" />}
            tone="blue"
          />
          <OperationalMetricCard
            label="PO Aktif"
            value={String(activePoCount).padStart(2, '0')}
            icon={<Truck className="h-4 w-4" />}
            tone="purple"
          />
          <OperationalMetricCard
            label="Menunggu GRN"
            value={String(awaitingGrnCount).padStart(2, '0')}
            icon={<PackageCheck className="h-4 w-4" />}
            tone="green"
          />
          <OperationalMetricCard
            label="Total Nilai PO"
            value={`Rp ${(totalPoValue / 1000000).toFixed(1)}jt`}
            icon={<Receipt className="h-4 w-4" />}
            tone="amber"
          />
        </OperationalMetricGrid>

        <OperationalPanel>
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-900">Daftar Purchase Order</h3>
          </div>
          <div className="mt-3">
            {(purchaseOrders?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="h-8 w-8 text-slate-300" />}
                title="Belum Ada PO"
                description="Buat purchase order baru untuk memulai pengadaan."
                action={
                  <OperationalButton variant="primary" onClick={() => setIsPOModalOpen(true)}>
                    Buat PO Baru
                  </OperationalButton>
                }
              />
            ) : (
              <OperationalDataTable
                data={purchaseOrders as any}
                columns={poColumns as any}
                getRowId={(row: any) => row.id}
                searchPlaceholder="Cari PO..."
              />
            )}
          </div>
        </OperationalPanel>

        <OperationalPanel>
          <h3 className="text-[14px] font-semibold text-slate-900">Daftar Purchase Request</h3>
          <div className="mt-3">
            {(prs?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<FileEdit className="h-8 w-8 text-slate-300" />}
                title="Belum Ada Purchase Request"
                description="Permintaan pembelian akan muncul di sini setelah dibuat."
              />
            ) : (
              <OperationalDataTable
                data={prs as any}
                columns={prColumns as any}
                getRowId={(row: any) => row.id}
                searchPlaceholder="Cari PR..."
              />
            )}
          </div>
        </OperationalPanel>
      </div>

      {/* PO Creation Dialog */}
      <Dialog open={isPOModalOpen} onOpenChange={setIsPOModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl rounded-xl border border-slate-100 bg-white p-0">
          <div className="bg-blue-600 p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-[16px] font-semibold">Buat Purchase Order</h2>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-blue-100">Procurement Order Protocol v4.0</p>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-md border border-white/20 bg-white/10">
              <ShoppingCart className="h-5 w-5 text-blue-300" />
            </div>
          </div>

          <div className="max-h-[calc(90vh-120px)] space-y-6 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="operational-field">
                <span>Supplier <span className="text-rose-500">*</span></span>
                <Select value={selectedVendor} onValueChange={(val: string | null) => setSelectedVendor(val || "")}>
                  <SelectTrigger className="h-9 bg-slate-50 border border-slate-200 rounded-md font-medium text-[12px]">
                    <SelectValue placeholder="Pilih Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors?.map((v: any) => (
                      <SelectItem key={v.id} value={v.id} className="text-[12px] font-medium">{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="operational-field">
                <span>Gudang Tujuan</span>
                <Select value={selectedWarehouse} onValueChange={(val: string | null) => setSelectedWarehouse(val || "")}>
                  <SelectTrigger className="h-9 bg-slate-50 border border-slate-200 rounded-md font-medium text-[12px]">
                    <SelectValue placeholder="Pilih Gudang" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((w: any) => (
                      <SelectItem key={w.id} value={w.id} className="text-[12px] font-medium">{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="operational-field">
                <span>Tanggal</span>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 font-medium text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="operational-field">
                <span>Jatuh Tempo</span>
                <input type="date" value={selectedDueDate} onChange={(e) => setSelectedDueDate(e.target.value)} className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 font-medium text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="operational-field">
                <span>Pajak (%)</span>
                <div className="relative">
                  <Percent className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 font-medium text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="operational-field">
              <span>Pilih Barang</span>
              <Select onValueChange={(val: string | null) => val && addItem(val)}>
                <SelectTrigger className="h-9 bg-slate-50 border border-slate-200 rounded-md font-medium text-[12px]">
                  <SelectValue placeholder="+ Tambah Barang ke Keranjang" />
                </SelectTrigger>
                <SelectContent>
                  {materials?.map((m: any) => (
                    <SelectItem key={m.id} value={m.id} className="text-[12px] font-medium">
                      {m.name} <span className="text-[10px] text-slate-500">({m.unit})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
                <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  <ShoppingCart className="h-3.5 w-3.5" /> Keranjang ({items.length} item)
                </span>
                {items.length > 0 && (
                  <button
                    onClick={() => setItems([])}
                    className="flex items-center gap-1 text-[10px] font-semibold uppercase text-rose-500 hover:bg-rose-50 rounded px-2 py-1"
                  >
                    <Trash2 className="h-3 w-3" /> Bersihkan
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">Barang</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500 text-center">Qty</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500 text-right">Harga</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500 text-right">Subtotal</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center">
                          <ShoppingCart className="mx-auto mb-2 h-7 w-7 text-slate-200" />
                          <p className="text-[12px] font-medium text-slate-400">Belum ada barang. Pilih barang di atas.</p>
                        </td>
                      </tr>
                    ) : items.map((item) => (
                      <tr key={item.materialId}>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="grid h-8 w-8 place-items-center rounded-md bg-blue-50 text-blue-600">
                              <Package className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-[12px] font-medium text-slate-900">{item.name}</p>
                              <p className="text-[10px] text-slate-500">Unit: {item.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(item.materialId, "qty", Number(e.target.value))}
                            className="mx-auto h-8 w-20 rounded-md border border-slate-200 bg-white text-center font-medium text-[12px]"
                            min={0}
                          />
                        </td>
                        <td className="py-2 text-right">
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(item.materialId, "price", Number(e.target.value))}
                            className="ml-auto h-8 w-24 rounded-md border border-slate-200 bg-white text-right font-medium text-[12px]"
                            min={0}
                          />
                        </td>
                        <td className="py-2 text-right text-[12px] font-semibold text-blue-600">
                          Rp {(item.qty * item.price).toLocaleString()}
                        </td>
                        <td className="py-2 text-right">
                          <OperationalButton variant="ghost" onClick={() => removeItem(item.materialId)} className="h-7 w-7 p-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </OperationalButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">Rp {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-slate-600">Pajak ({taxPercent}%)</span>
                <span className="font-semibold text-slate-900">Rp {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-[14px]">
                <span className="font-semibold text-slate-700">Grand Total</span>
                <span className="font-semibold tabular-nums text-blue-600">Rp {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="operational-field">
              <span>Catatan</span>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk supplier..."
                className="min-h-16 rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] font-medium text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
            <OperationalButton variant="ghost" onClick={() => { setIsPOModalOpen(false); resetForm(); }}>
              Batal
            </OperationalButton>
            <OperationalButton
              variant="primary"
              onClick={handleCreatePO}
              disabled={createPOMutation.isPending || items.length === 0}
            >
              {createPOMutation.isPending ? "Menyimpan..." : "Simpan Pembelian"}
            </OperationalButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <Dialog open={!!approveDialog} onOpenChange={(open) => { if (!open) setApproveDialog(null); }}>
        <DialogContent className="sm:max-w-md rounded-xl border border-slate-200 bg-white p-0">
          <DialogHeader className="p-4">
            <DialogTitle className="flex items-center gap-2 text-[14px] font-semibold">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Konfirmasi Persetujuan
            </DialogTitle>
            <DialogDescription>
              Setujui {approveDialog?.type === "PO" ? "Purchase Order" : "Purchase Request"} ini? Tindakan ini akan mengubah status menjadi APPROVED.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 border-t border-slate-100 p-4">
            <OperationalButton variant="ghost" onClick={() => setApproveDialog(null)}>
              Batal
            </OperationalButton>
            <OperationalButton variant="primary" onClick={handleApprove}>
              Ya, Setujui
            </OperationalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(null); setRejectReason(""); } }}>
        <DialogContent className="sm:max-w-md rounded-xl border border-slate-200 bg-white p-0">
          <DialogHeader className="p-4">
            <DialogTitle className="flex items-center gap-2 text-[14px] font-semibold">
              <Ban className="h-5 w-5 text-rose-500" />
              Konfirmasi Penolakan
            </DialogTitle>
            <DialogDescription>
              Tolak {rejectDialog?.type === "PO" ? "Purchase Order" : "Purchase Request"} ini. Berikan alasan penolakan.
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 py-2">
            <Label className="text-[10px] font-semibold uppercase text-slate-500">Alasan Penolakan</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan mengapa ditolak..."
              className="mt-1 min-h-20 rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] font-medium text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
            />
          </div>
          <DialogFooter className="flex justify-end gap-2 border-t border-slate-100 p-4">
            <OperationalButton variant="ghost" onClick={() => { setRejectDialog(null); setRejectReason(""); }}>
              Batal
            </OperationalButton>
            <OperationalButton variant="danger" onClick={handleReject}>
              Ya, Tolak
            </OperationalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationalPageShell>
  );
}
