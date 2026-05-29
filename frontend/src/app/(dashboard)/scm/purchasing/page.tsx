"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Plus,
  Search,
  FileEdit,
  Truck,
  PackageCheck,
  ChevronRight,
  User,
  Package,
  ShoppingCart,
  Calendar,
  Trash2,
  ShieldAlert,
  ClipboardList,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  Send,
  Droplets,
  Zap,
  Filter,
  Loader2,
  XCircle,
  AlertCircle,
  Receipt,
  BadgeCheck,
  Ban,
  Eye,
  FileInput,
  Building2,
  Hash,
  DollarSign,
  Percent,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DnaButton, DnaBadge, DnaInput, StatCard, TableWrapper } from "@/components/dna";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";
import { EmptyState } from "@/components/empty-state";

interface CartItem {
  materialId: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
}

const STATUS_BADGE_MAP: Record<string, "success" | "warning" | "default" | "info" | "critical"> = {
  DRAFT: "default",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "critical",
  ORDERED: "info",
  SHIPPED: "info",
  RECEIVED: "success",
  CANCELLED: "default",
  SUBMITTED: "warning",
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

  const pendingPrCount = String(prs?.filter((r: any) => r.status === 'DRAFT' || r.status === 'SUBMITTED').length || 0).padStart(2, '0');
  const activePoCount = String(purchaseOrders?.filter((po: any) => po.status === 'APPROVED' || po.status === 'ORDERED').length || 0).padStart(2, '0');
  const awaitingGrnCount = String(purchaseOrders?.filter((po: any) => po.status === 'ORDERED').length || 0).padStart(2, '0');
  const totalPoValue = (purchaseOrders || []).reduce((sum: number, po: any) => sum + Number(po.totalValue || 0), 0);

  return (
    <DashboardShell
      title="PENGADAAN"
      titleAccent="PEMBELIAN"
      subtitle="Purchase Order & Requisisi — Supply Chain Management"
      actions={
        <DnaButton variant="primary" size="lg" onClick={() => setIsPOModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
          Buat PO Baru
        </DnaButton>
      }
    >
      {vendorsLoading || materialsLoading || whLoading || prsLoading || poLoading ? (
        <QueryLoading message="Memuat data pengadaan..." />
      ) : (
        <>
          {/* PO Creation Dialog */}
          <Dialog open={isPOModalOpen} onOpenChange={setIsPOModalOpen}>
            <DialogContent className="sm:max-w-4xl bg-white rounded-[24px] border border-slate-100 shadow-2xl p-0 overflow-hidden max-h-[90vh]">
              <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-xl font-black tracking-tight">Buat Purchase Order</h2>
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">Procurement Order Protocol v4.0</p>
                </div>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                  <ShoppingCart className="h-6 w-6 text-blue-300" />
                </div>
              </div>

              <div className="p-8 space-y-8 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase block">Supplier <span className="text-red-500">*</span></Label>
                    <Select value={selectedVendor} onValueChange={(val: string | null) => setSelectedVendor(val || "")}>
                      <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                        <SelectValue placeholder="Pilih Supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors?.map((v: any) => (
                          <SelectItem key={v.id} value={v.id} className="font-medium py-3">{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase block">Gudang Tujuan</Label>
                    <Select value={selectedWarehouse} onValueChange={(val: string | null) => setSelectedWarehouse(val || "")}>
                      <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                        <SelectValue placeholder="Pilih Gudang" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses?.map((w: any) => (
                          <SelectItem key={w.id} value={w.id} className="font-medium py-3">{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase block">Tanggal</Label>
                    <DnaInput type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase block">Jatuh Tempo</Label>
                    <DnaInput type="date" value={selectedDueDate} onChange={(e) => setSelectedDueDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase block">Pajak (%)</Label>
                    <DnaInput type="number" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} icon={<Percent className="h-3.5 w-3.5" />} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-slate-400 uppercase block">Pilih Barang</Label>
                  <Select onValueChange={(val: string | null) => val && addItem(val)}>
                    <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                      <SelectValue placeholder="+ Tambah Barang ke Keranjang" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials?.map((m: any) => (
                        <SelectItem key={m.id} value={m.id} className="font-medium py-3">
                          {m.name} <span className="text-[10px] text-slate-400 ml-2">({m.unit})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <ShoppingCart className="h-3.5 w-3.5" /> Keranjang Belanja ({items.length} item)
                    </span>
                    {items.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setItems([])} className="text-rose-500 hover:bg-rose-50 h-7 text-[10px] font-black uppercase">
                        <Trash2 className="h-3 w-3 mr-1" /> Bersihkan
                      </Button>
                    )}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[9px] font-black text-slate-400 uppercase">Barang</TableHead>
                        <TableHead className="text-[9px] font-black text-slate-400 uppercase text-center">Qty</TableHead>
                        <TableHead className="text-[9px] font-black text-slate-400 uppercase text-right">Harga</TableHead>
                        <TableHead className="text-[9px] font-black text-slate-400 uppercase text-right">Subtotal</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center">
                            <ShoppingCart className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-slate-300 font-medium text-sm">Belum ada barang. Pilih barang di atas.</p>
                          </TableCell>
                        </TableRow>
                      ) : items.map((item) => (
                        <TableRow key={item.materialId} className="group">
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Package className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                                <p className="text-[10px] text-slate-400">Unit: {item.unit}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateItem(item.materialId, "qty", Number(e.target.value))}
                              className="w-20 h-9 text-center mx-auto font-black text-xs"
                              min={0}
                            />
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateItem(item.materialId, "price", Number(e.target.value))}
                              className="w-28 h-9 text-right ml-auto font-black text-xs"
                              min={0}
                            />
                          </TableCell>
                          <TableCell className="py-3 text-right font-black text-blue-600 text-sm">
                            Rp {(item.qty * item.price).toLocaleString()}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.materialId)} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 space-y-2 border border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-500">Subtotal</span>
                    <span className="font-black text-slate-900">Rp {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-500">Pajak ({taxPercent}%)</span>
                    <span className="font-black text-slate-900">Rp {tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-base">
                    <span className="font-black text-slate-700">Grand Total</span>
                    <span className="font-black text-blue-600 text-lg">Rp {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-slate-400 uppercase block">Catatan</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan untuk supplier..."
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium resize-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 p-6 flex gap-4 justify-end">
                <DnaButton variant="ghost" onClick={() => { setIsPOModalOpen(false); resetForm(); }}>Batal</DnaButton>
                <DnaButton variant="primary" onClick={handleCreatePO} disabled={createPOMutation.isPending || items.length === 0}>
                  {createPOMutation.isPending ? "Menyimpan..." : "Simpan Pembelian"}
                </DnaButton>
              </div>
            </DialogContent>
          </Dialog>

          {/* Approve Confirmation */}
          <Dialog open={!!approveDialog} onOpenChange={(open) => { if (!open) setApproveDialog(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Konfirmasi Persetujuan
                </DialogTitle>
                <DialogDescription>
                  Setujui {approveDialog?.type === "PO" ? "Purchase Order" : "Purchase Request"} ini? Tindakan ini akan mengubah status menjadi APPROVED.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <DnaButton variant="ghost" onClick={() => setApproveDialog(null)}>Batal</DnaButton>
                <DnaButton variant="primary" onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700">
                  Ya, Setujui
                </DnaButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reject Dialog */}
          <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(null); setRejectReason(""); } }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-rose-500" />
                  Konfirmasi Penolakan
                </DialogTitle>
                <DialogDescription>
                  Tolak {rejectDialog?.type === "PO" ? "Purchase Order" : "Purchase Request"} ini. Berikan alasan penolakan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Label className="text-[9px] font-black text-slate-400 uppercase">Alasan Penolakan</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Alasan mengapa ditolak..."
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium resize-none"
                  rows={3}
                />
              </div>
              <DialogFooter className="gap-2">
                <DnaButton variant="ghost" onClick={() => { setRejectDialog(null); setRejectReason(""); }}>Batal</DnaButton>
                <DnaButton variant="primary" onClick={handleReject} className="bg-rose-600 hover:bg-rose-700">
                  Ya, Tolak
                </DnaButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="PR Menunggu" value={pendingPrCount} icon={<FileEdit className="text-blue-600" />} />
            <StatCard label="PO Aktif" value={activePoCount} icon={<Truck className="text-blue-600" />} />
            <StatCard label="Menunggu GRN" value={awaitingGrnCount} icon={<PackageCheck className="text-emerald-600" />} />
            <StatCard label="Total Nilai PO" value={`Rp ${(totalPoValue / 1000000).toFixed(1)}jt`} icon={<Receipt className="text-amber-600" />} />
          </div>

          {/* PO Registry */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Daftar Purchase Order</h3>
              </div>
              <div className="flex items-center gap-3">
                <DnaInput placeholder="Cari PO..." icon={<Search />} className="w-64" />
              </div>
            </div>

            <TableWrapper>
              <Table className="table-dense">
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">No. PO</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Supplier</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Tgl</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Pembuat</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Nilai</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-center">Status</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!purchaseOrders || purchaseOrders.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <EmptyState
                          icon={<ShoppingCart className="h-8 w-8 text-slate-300" />}
                          title="Belum Ada PO"
                          description="Buat purchase order baru untuk memulai pengadaan."
                          action={<DnaButton variant="primary" onClick={() => setIsPOModalOpen(true)}>Buat PO Baru</DnaButton>}
                        />
                      </TableCell>
                    </TableRow>
                  ) : purchaseOrders?.map((po: any) => (
                    <TableRow key={po.id} className="group hover:bg-slate-50/30 transition-all">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm border border-slate-200">
                            <ClipboardList className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 text-xs uppercase italic">{po.poNumber}</span>
                            <p className="text-[9px] font-black text-slate-400 mt-0.5 uppercase">{po.createdAt ? new Date(po.createdAt).toLocaleDateString() : '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 font-medium text-slate-700 text-xs">{po.supplier?.name || '-'}</TableCell>
                      <TableCell className="py-3 px-4 text-slate-500 text-[10px] font-medium">
                        {po.estArrival ? new Date(po.estArrival).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-600">{po.scm?.fullName || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-black text-slate-900 text-xs tabular-nums">
                        Rp {Number(po.totalValue).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <DnaBadge status={STATUS_BADGE_MAP[po.status] || "default"}>
                          {po.status?.replace('_', ' ') || 'DRAFT'}
                        </DnaBadge>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {po.status === 'DRAFT' && (
                            <>
                              <DnaButton variant="primary" size="sm" onClick={() => setApproveDialog({ id: po.id, type: "PO" })} className="bg-emerald-600 hover:bg-emerald-700">
                                <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Setuju
                              </DnaButton>
                              <DnaButton variant="outline" size="sm" onClick={() => setRejectDialog({ id: po.id, type: "PO" })} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Tolak
                              </DnaButton>
                            </>
                          )}
                          {po.status === 'APPROVED' && (
                            <DnaButton variant="primary" size="sm" icon={<Send className="h-3.5 w-3.5" />}>
                              Kirim PO
                            </DnaButton>
                          )}
                          {po.status === 'PENDING_APPROVAL' && (
                            <>
                              <DnaButton variant="primary" size="sm" onClick={() => setApproveDialog({ id: po.id, type: "PO" })} className="bg-emerald-600 hover:bg-emerald-700">
                                <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Setuju
                              </DnaButton>
                              <DnaButton variant="outline" size="sm" onClick={() => setRejectDialog({ id: po.id, type: "PO" })} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Tolak
                              </DnaButton>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </div>

          {/* PR Registry */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Daftar Purchase Request</h3>
              </div>
            </div>

            <TableWrapper>
              <Table className="table-dense">
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">ID</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Gudang</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase">Pembuat</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Jml Item</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-center">Status</TableHead>
                    <TableHead className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!prs || prs.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center">
                        <p className="text-slate-400 font-medium">Belum ada permintaan pembelian.</p>
                      </TableCell>
                    </TableRow>
                  ) : prs?.map((pr: any) => (
                    <TableRow key={pr.id} className="group hover:bg-slate-50/30 transition-all">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-[10px] italic">
                            PR
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-xs uppercase italic">#{pr.id?.split('-')[0]}</p>
                            <p className="text-[9px] font-black text-slate-400 mt-0.5">{new Date(pr.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 font-medium text-slate-700 text-xs">{pr.warehouse?.name || '-'}</TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-600">{pr.creator?.fullName || pr.createdBy || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-black text-slate-900 text-xs">{pr.items?.length || 0}</TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <DnaBadge status={STATUS_BADGE_MAP[pr.status] || "default"}>
                          {pr.status?.replace('_', ' ') || 'DRAFT'}
                        </DnaBadge>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {pr.status === 'SUBMITTED' && (
                            <>
                              <DnaButton variant="primary" size="sm" onClick={() => setApproveDialog({ id: pr.id, type: "PR" })} className="bg-emerald-600 hover:bg-emerald-700">
                                <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Setuju
                              </DnaButton>
                              <DnaButton variant="outline" size="sm" onClick={() => setRejectDialog({ id: pr.id, type: "PR" })} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Tolak
                              </DnaButton>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
