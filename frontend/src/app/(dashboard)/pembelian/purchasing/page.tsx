"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Plus,
  Search,
  FileEdit,
  Truck,
  PackageCheck,
  User,
  Package,
  ShoppingCart,
  Trash2,
  ClipboardList,
  Send,
  Receipt,
  BadgeCheck,
  Ban,
  Eye,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { DnaButton, DnaBadge, DnaInput, DnaStatCard, DnaDataTableCard, DnaModal, DnaSelect, DnaTextarea, DnaCell } from "@/components/dna";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";
import { EmptyState } from "@/components/empty-state";

// SPEC: SCR-SCM-PO-001 — Purchase Order & 3-Way Matching (PO ↔ GRN ↔ Invoice)
// Business rules preserved:
//  - Diskon Rp + Ongkir (Shipping Cost) terpisah, di luar PPN
//  - taxableSubtotal = max(0, subtotal - discountAmount)
//  - tax = taxableSubtotal * (taxPercent/100)
//  - grandTotal = taxableSubtotal + shippingCost + tax
//  - PO 3-way: status ORDERED → menunggu GRN (Penerimaan) → lanjut Invoice & Payment

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
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [approveDialog, setApproveDialog] = useState<{ id: string; type: string } | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ id: string; type: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchPo, setSearchPo] = useState("");
  const [searchItemName, setSearchItemName] = useState("");
  const [searchMinQty, setSearchMinQty] = useState("");
  const [searchMaxQty, setSearchMaxQty] = useState("");
  const [searchMinPrice, setSearchMinPrice] = useState("");
  const [searchMaxPrice, setSearchMaxPrice] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");

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
    setDiscountAmount(0);
    setShippingCost(0);
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
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = taxableSubtotal * (Number(taxPercent) / 100);
  const grandTotal = taxableSubtotal + Number(shippingCost) + tax;

  const handleCreatePO = () => {
    if (!selectedVendor) { toast.error("Pilih supplier."); return; }
    if (items.length === 0) { toast.error("Tambah minimal satu barang."); return; }
    createPOMutation.mutate({
      supplierId: selectedVendor,
      estArrival: selectedDate,
      dueDate: selectedDueDate || undefined,
      notes: notes || undefined,
      discountAmount: Number(discountAmount),
      shippingCost: Number(shippingCost),
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

  const filteredPurchaseOrders = useMemo(() => {
    if (!purchaseOrders) return [];
    return purchaseOrders.filter((po: any) => {
      const q = searchPo.toLowerCase();
      const matchSearch = !q || (po.poNumber || '').toLowerCase().includes(q) ||
        (po.supplier?.name || po.supplierName || '').toLowerCase().includes(q) ||
        (po.scm?.fullName || '').toLowerCase().includes(q);
      const matchItem = !searchItemName || (po.items || []).some((i: any) =>
        (i.itemName || i.name || '').toLowerCase().includes(searchItemName.toLowerCase()));
      const matchQty = (!searchMinQty || (po.items || []).some((i: any) => Number(i.quantity || i.qty || 0) >= Number(searchMinQty))) &&
        (!searchMaxQty || (po.items || []).some((i: any) => Number(i.quantity || i.qty || 0) <= Number(searchMaxQty)));
      const matchPrice = (!searchMinPrice || Number(po.totalValue || 0) >= Number(searchMinPrice)) &&
        (!searchMaxPrice || Number(po.totalValue || 0) <= Number(searchMaxPrice));
      const poDate = po.estArrival || po.orderDate || '';
      const matchDate = (!searchDateFrom || poDate >= searchDateFrom) && (!searchDateTo || poDate <= searchDateTo);
      return matchSearch && matchItem && matchQty && matchPrice && matchDate;
    });
  }, [purchaseOrders, searchPo, searchItemName, searchMinQty, searchMaxQty, searchMinPrice, searchMaxPrice, searchDateFrom, searchDateTo]);
  const awaitingGrnCount = String(purchaseOrders?.filter((po: any) => po.status === 'ORDERED').length || 0).padStart(2, '0');
  const totalPoValue = (purchaseOrders || []).reduce((sum: number, po: any) => sum + Number(po.totalValue || 0), 0);

  const vendorOptions = (vendors || []).map((v: any) => ({ label: v.name, value: v.id }));
  const warehouseOptions = (warehouses || []).map((w: any) => ({ label: w.name, value: w.id }));
  const materialOptions = (materials || []).map((m: any) => ({ label: `${m.name} (${m.unit})`, value: m.id }));

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
          <DnaModal
            isOpen={isPOModalOpen}
            onClose={() => { setIsPOModalOpen(false); resetForm(); }}
            title="Buat Purchase Order"
            subtitle="Procurement Order Protocol v4.0"
            size="3xl"
            badge="PO"
            footer={
              <>
                <DnaButton variant="ghost" onClick={() => { setIsPOModalOpen(false); resetForm(); }}>Batal</DnaButton>
                <DnaButton variant="primary" onClick={handleCreatePO} disabled={createPOMutation.isPending || items.length === 0}>
                  {createPOMutation.isPending ? "Menyimpan..." : "Simpan Pembelian"}
                </DnaButton>
              </>
            }
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <DnaSelect
                  label="Supplier"
                  required
                  placeholder="Pilih Supplier"
                  value={selectedVendor}
                  onChange={setSelectedVendor}
                  options={vendorOptions}
                />
                <DnaSelect
                  label="Gudang Tujuan"
                  placeholder="Pilih Gudang"
                  value={selectedWarehouse}
                  onChange={setSelectedWarehouse}
                  options={warehouseOptions}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <DnaInput label="Tanggal PO (Auto)" type="date" value={selectedDate} readOnly className="bg-slate-100 text-slate-500 font-bold cursor-not-allowed" />
                <DnaInput label="Deadline Pengiriman" type="date" required value={selectedDueDate} onChange={(e) => setSelectedDueDate(e.target.value)} />
                <DnaInput
                  label="Diskon (Rp)"
                  type="number"
                  value={discountAmount || ""}
                  placeholder="0"
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  icon={<DollarSign className="h-3.5 w-3.5 text-slate-400" />}
                />
                <DnaInput
                  label="Ongkir (Rp)"
                  type="number"
                  value={shippingCost || ""}
                  placeholder="0"
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  icon={<Truck className="h-3.5 w-3.5 text-slate-400" />}
                />
              </div>

              <div>
                <DnaSelect
                  label="Pilih Barang"
                  placeholder="+ Tambah Barang ke Keranjang"
                  value=""
                  onChange={(val) => val && addItem(val)}
                  options={materialOptions}
                />
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingCart className="h-3.5 w-3.5" /> Keranjang Belanja ({items.length} item)
                  </span>
                  {items.length > 0 && (
                    <DnaButton variant="ghost" size="sm" onClick={() => setItems([])} icon={<Trash2 className="h-3 w-3" />} className="text-rose-500">
                      Bersihkan
                    </DnaButton>
                  )}
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-4">Barang</th>
                      <th className="py-2 px-4 text-center">Qty</th>
                      <th className="py-2 px-4 text-right">Harga</th>
                      <th className="py-2 px-4 text-right">Subtotal</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <ShoppingCart className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-slate-300 font-medium text-sm">Belum ada barang. Pilih barang di atas.</p>
                        </td>
                      </tr>
                    ) : items.map((item) => (
                      <tr key={item.materialId}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                              <Package className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                              <p className="text-[10px] text-slate-400">Unit: {item.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <DnaInput
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(item.materialId, "qty", Number(e.target.value))}
                            className="w-20 text-center font-bold text-xs"
                            min={0}
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DnaInput
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(item.materialId, "price", Number(e.target.value))}
                            className="w-28 text-right font-bold text-xs"
                            min={0}
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-blue-600 text-sm">
                          Rp {(item.qty * item.price).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DnaButton variant="ghost" size="icon" onClick={() => removeItem(item.materialId)} icon={<Trash2 className="h-4 w-4" />} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-2 border border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Subtotal Barang</span>
                  <span className="font-bold text-slate-900">Rp {subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="font-medium">Potongan Diskon</span>
                    <span className="font-bold">- Rp {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {shippingCost > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span className="font-medium">Ongkos Kirim</span>
                    <span className="font-bold">+ Rp {shippingCost.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Pajak PPN ({taxPercent}%)</span>
                  <span className="font-bold text-slate-900">Rp {tax.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-base">
                  <span className="font-bold text-slate-700">Grand Total PO</span>
                  <span className="font-bold text-blue-600 text-lg tabular-nums">Rp {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 uppercase">Otorisasi & Digital Signature</p>
                    <p className="text-[10px] text-slate-500">PO disahkan dengan tanda tangan digital terenkripsi ERP</p>
                  </div>
                </div>
                <DnaBadge status="success">DIGITAL SIGNED</DnaBadge>
              </div>

              <DnaTextarea
                label="Catatan"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk supplier..."
                rows={2}
              />
            </div>
          </DnaModal>

          <DnaModal
            isOpen={!!approveDialog}
            onClose={() => setApproveDialog(null)}
            title="Konfirmasi Persetujuan"
            subtitle={`Setujui ${approveDialog?.type === "PO" ? "Purchase Order" : "Purchase Request"} ini? Tindakan ini akan mengubah status menjadi APPROVED.`}
            size="md"
            badge={<CheckCircle2 className="h-3 w-3 text-emerald-500" />}
            footer={
              <>
                <DnaButton variant="ghost" onClick={() => setApproveDialog(null)}>Batal</DnaButton>
                <DnaButton variant="primary" onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700">
                  Ya, Setujui
                </DnaButton>
              </>
            }
          />

          <DnaModal
            isOpen={!!rejectDialog}
            onClose={() => { setRejectDialog(null); setRejectReason(""); }}
            title="Konfirmasi Penolakan"
            subtitle={`Tolak ${rejectDialog?.type === "PO" ? "Purchase Order" : "Purchase Request"} ini. Berikan alasan penolakan.`}
            size="md"
            badge={<Ban className="h-3 w-3 text-rose-500" />}
            footer={
              <>
                <DnaButton variant="ghost" onClick={() => { setRejectDialog(null); setRejectReason(""); }}>Batal</DnaButton>
                <DnaButton variant="danger" onClick={handleReject} className="bg-rose-600 hover:bg-rose-700 text-white">
                  Ya, Tolak
                </DnaButton>
              </>
            }
          >
            <DnaTextarea
              label="Alasan Penolakan"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan mengapa ditolak..."
              rows={3}
            />
          </DnaModal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DnaStatCard label="PR Menunggu" value={pendingPrCount} icon={<FileEdit />} variant="blue" />
            <DnaStatCard label="PO Aktif" value={activePoCount} icon={<Truck />} variant="blue" />
            <DnaStatCard label="Menunggu GRN" value={awaitingGrnCount} icon={<PackageCheck />} variant="emerald" />
            <DnaStatCard label="Total Nilai PO" value={`Rp ${(totalPoValue / 1000000).toFixed(1)}jt`} icon={<Receipt />} variant="amber" />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Purchase Order</h3>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <DnaInput placeholder="Cari PO, supplier..." value={searchPo} onChange={(e) => setSearchPo(e.target.value)} icon={<Search />} className="w-48" />
                <DnaInput placeholder="Nama item..." value={searchItemName} onChange={(e) => setSearchItemName(e.target.value)} className="w-40" />
                <div className="flex items-center gap-1">
                  <DnaInput type="number" placeholder="Qty min" value={searchMinQty} onChange={(e) => setSearchMinQty(e.target.value)} className="w-20" />
                  <span className="text-slate-400 text-xs">-</span>
                  <DnaInput type="number" placeholder="Qty max" value={searchMaxQty} onChange={(e) => setSearchMaxQty(e.target.value)} className="w-20" />
                </div>
                <div className="flex items-center gap-1">
                  <DnaInput type="date" placeholder="Tgl dari" value={searchDateFrom} onChange={(e) => setSearchDateFrom(e.target.value)} className="w-36" />
                  <span className="text-slate-400 text-xs">-</span>
                  <DnaInput type="date" placeholder="Tgl sampai" value={searchDateTo} onChange={(e) => setSearchDateTo(e.target.value)} className="w-36" />
                </div>
                {(searchPo || searchItemName || searchMinQty || searchMaxQty || searchDateFrom || searchDateTo) && (
                  <button onClick={() => { setSearchPo(''); setSearchItemName(''); setSearchMinQty(''); setSearchMaxQty(''); setSearchDateFrom(''); setSearchDateTo(''); }} className="text-xs text-blue-600 hover:text-blue-800 font-bold">Reset</button>
                )}
              </div>
            </div>

            <DnaDataTableCard>
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                    <th className="py-3 px-4">No. PO</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Tgl</th>
                    <th className="py-3 px-4">Pembuat</th>
                    <th className="py-3 px-4 text-right">Nilai</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!filteredPurchaseOrders || filteredPurchaseOrders.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-6">
                        <EmptyState
                          icon={<ShoppingCart className="h-8 w-8 text-slate-300" />}
                          title="Belum Ada PO"
                          description="Buat purchase order baru untuk memulai pengadaan."
                          action={<DnaButton variant="primary" onClick={() => setIsPOModalOpen(true)}>Buat PO Baru</DnaButton>}
                        />
                      </td>
                    </tr>
                  ) : filteredPurchaseOrders?.map((po: any) => (
                    <tr key={po.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm border border-slate-200">
                            <ClipboardList className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs uppercase italic">{po.poNumber}</span>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">{po.createdAt ? new Date(po.createdAt).toLocaleDateString() : '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><DnaCell.Text primary={po.supplier?.name || '-'} /></td>
                      <td className="py-3 px-4"><DnaCell.Date value={po.estArrival} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-600">{po.scm?.fullName || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right"><DnaCell.Currency value={Number(po.totalValue || 0)} /></td>
                      <td className="py-3 px-4 text-center">
                        <DnaBadge status={STATUS_BADGE_MAP[po.status] || "default"}>
                          {po.status?.replace('_', ' ') || 'DRAFT'}
                        </DnaBadge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {(po.status === 'DRAFT' || po.status === 'PENDING_APPROVAL') && (
                            <>
                              <DnaButton variant="primary" size="sm" onClick={() => setApproveDialog({ id: po.id, type: "PO" })} className="bg-emerald-600 hover:bg-emerald-700" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                                Setuju
                              </DnaButton>
                              <DnaButton variant="outline" size="sm" onClick={() => setRejectDialog({ id: po.id, type: "PO" })} className="text-rose-600 border-rose-200 hover:bg-rose-50" icon={<XCircle className="h-3.5 w-3.5" />}>
                                Tolak
                              </DnaButton>
                            </>
                          )}
                          {po.status === 'APPROVED' && (
                            <DnaButton variant="primary" size="sm" icon={<Send className="h-3.5 w-3.5" />}>
                              Kirim PO
                            </DnaButton>
                          )}
                          <DnaButton variant="ghost" size="icon" icon={<Eye className="h-4 w-4" />} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DnaDataTableCard>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Purchase Request</h3>
              </div>
            </div>

            <DnaDataTableCard>
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Gudang</th>
                    <th className="py-3 px-4">Pembuat</th>
                    <th className="py-3 px-4 text-right">Jml Item</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!prs || prs.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <p className="text-slate-400 font-medium">Belum ada permintaan pembelian.</p>
                      </td>
                    </tr>
                  ) : prs?.map((pr: any) => (
                    <tr key={pr.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-[10px] italic">
                            PR
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs uppercase italic">#{pr.id?.split('-')[0]}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{new Date(pr.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><DnaCell.Text primary={pr.warehouse?.name || '-'} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-600">{pr.creator?.fullName || pr.createdBy || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right"><DnaCell.Number value={pr.items?.length || 0} /></td>
                      <td className="py-3 px-4 text-center">
                        <DnaBadge status={STATUS_BADGE_MAP[pr.status] || "default"}>
                          {pr.status?.replace('_', ' ') || 'DRAFT'}
                        </DnaBadge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {pr.status === 'SUBMITTED' && (
                            <>
                              <DnaButton variant="primary" size="sm" onClick={() => setApproveDialog({ id: pr.id, type: "PR" })} className="bg-emerald-600 hover:bg-emerald-700" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                                Setuju
                              </DnaButton>
                              <DnaButton variant="outline" size="sm" onClick={() => setRejectDialog({ id: pr.id, type: "PR" })} className="text-rose-600 border-rose-200 hover:bg-rose-50" icon={<XCircle className="h-3.5 w-3.5" />}>
                                Tolak
                              </DnaButton>
                            </>
                          )}
                          <DnaButton variant="ghost" size="icon" icon={<Eye className="h-4 w-4" />} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DnaDataTableCard>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
