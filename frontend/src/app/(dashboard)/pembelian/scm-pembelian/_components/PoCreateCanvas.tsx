"use client";

import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Package,
  Building2,
  Calendar,
  Save,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  DollarSign,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { DnaButton, formatRupiah, useDnaToast } from "@/components/dna";

interface PoCreateCanvasProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface CartItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

function unwrapList(payload: any): any[] {
  const list = payload?.data?.data || payload?.data || payload;
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data)) return list.data;
  return [];
}

export function PoCreateCanvas({ onBack, onSuccess }: PoCreateCanvasProps) {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [supplierCategory, setSupplierCategory] = useState<"Bahan Baku" | "Bahan Kemas" | "Bahan Pembantu">("Bahan Baku");
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [discountRp, setDiscountRp] = useState<string>("0");
  const [shippingCostRp, setShippingCostRp] = useState<string>("0");
  const [includeTax, setIncludeTax] = useState(true);
  const [notes, setNotes] = useState("Pengiriman wajib menyertakan CoA (Certificate of Analysis) & MSDS.");

  // Cart items
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: `item-${Date.now()}-1`,
      materialId: "mat-1",
      materialCode: "RM-NIA-01",
      materialName: "Niacinamide PC Grade (USP/EP)",
      unit: "Kg",
      qty: 25,
      unitPrice: 320000,
      subtotal: 8000000,
    },
    {
      id: `item-${Date.now()}-2`,
      materialId: "mat-2",
      materialCode: "RM-HA-02",
      materialName: "Hyaluronic Acid High Molecular Weight",
      unit: "Kg",
      qty: 5,
      unitPrice: 1850000,
      subtotal: 9250000,
    },
  ]);

  // Master Data Queries
  const { data: suppliers = [] } = useQuery({
    queryKey: ["master-suppliers-po-canvas"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/suppliers");
        return unwrapList(res.data).map((s: any) => ({
          id: s.id,
          name: s.name || s.supplierName,
          category: s.category?.name || "Bahan Baku",
        }));
      } catch {
        return [
          { id: "sup-1", name: "PT Sumber Kimia Mandiri", category: "Bahan Baku" },
          { id: "sup-2", name: "PT Chemco Prima Indonesia", category: "Bahan Baku" },
          { id: "sup-3", name: "CV Kemasan Indah Perkasa", category: "Bahan Kemas" },
          { id: "sup-4", name: "PT Lab Nusantara Reagents", category: "Bahan Pembantu" },
        ];
      }
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["master-warehouses-po-canvas"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/warehouses/active");
        return unwrapList(res.data).map((w: any) => ({ id: w.id, name: w.name }));
      } catch {
        return [
          { id: "wh-1", name: "Gudang Utama Raw Material (WH-01)" },
          { id: "wh-2", name: "Gudang Bahan Kemas & Sekunder (WH-02)" },
        ];
      }
    },
  });

  const { data: rawMaterials = [] } = useQuery({
    queryKey: ["master-materials-po-canvas"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/materials", { params: { limit: 500 } });
        return unwrapList(res.data).map((m: any) => ({
          id: m.id,
          code: m.code || "SKU-001",
          name: m.name,
          unit: m.unit || m.usageUnit || "Kg",
          unitPrice: Number(m.unitPrice ?? 50000),
        }));
      } catch {
        return [];
      }
    },
  });

  // Filtered suppliers based on category
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s: any) => {
      if (!s.category) return true;
      return s.category.toLowerCase().includes(supplierCategory.toLowerCase().slice(0, 5));
    });
  }, [suppliers, supplierCategory]);

  // Calculations
  const subtotalItems = cartItems.reduce((acc, it) => acc + it.subtotal, 0);
  const numDiscount = Number(discountRp) || 0;
  const numShipping = Number(shippingCostRp) || 0;
  const taxableDpp = Math.max(0, subtotalItems - numDiscount);
  const taxAmount = includeTax ? Math.round(taxableDpp * 0.11) : 0;
  const grandTotal = taxableDpp + taxAmount + numShipping;

  // Add Item Row
  const handleAddItem = () => {
    const newItem: CartItem = {
      id: `item-${Date.now()}`,
      materialId: "",
      materialCode: "RM-CUSTOM",
      materialName: "",
      unit: "Kg",
      qty: 1,
      unitPrice: 0,
      subtotal: 0,
    };
    setCartItems([...cartItems, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof CartItem, val: any) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "qty" || field === "unitPrice") {
          updated.subtotal = Number(updated.qty || 0) * Number(updated.unitPrice || 0);
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (cartItems.length <= 1) return;
    setCartItems(cartItems.filter((it) => it.id !== id));
  };

  // Create PO Mutation
  const createPoMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/scm/purchase-orders", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scm-purchase-orders-list"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase Order Diterbitkan", "Dokumen PO berhasil disimpan dan siap dikirim ke supplier.");
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal menerbitkan PO";
      toast.error("Validasi Gagal", msg);
    },
  });

  const handleSubmit = () => {
    if (!supplierId && filteredSuppliers.length > 0) {
      setSupplierId(filteredSuppliers[0].id);
    }
    if (cartItems.length === 0 || subtotalItems <= 0) {
      toast.error("Validasi Gagal", "Harap tambahkan minimal 1 item material dengan harga dan kuantitas valid.");
      return;
    }

    const payload = {
      supplierId: supplierId || (filteredSuppliers[0]?.id ?? "00000000-0000-0000-0000-000000000001"),
      warehouseId: warehouseId || (warehouses[0]?.id ?? "00000000-0000-0000-0000-000000000001"),
      dueDate: deadlineDate,
      discountAmount: numDiscount,
      shippingCost: numShipping,
      notes,
      items: cartItems.map((it) => ({
        materialId: it.materialId || it.id,
        quantity: it.qty,
        unitPrice: it.unitPrice,
      })),
    };

    createPoMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER WITH ACTIONS & AUTO-NUMBER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Penerbitan Pesanan Pembelian (Purchase Order)
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                🏷️ Auto-Number: PO-AUTO
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pengadaan bahan baku, kemasan, dan bahan pembantu maklon dengan validasi diskon Rupiah & deadline pengiriman.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <DnaButton variant="secondary" size="md" onClick={onBack}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="md"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSubmit}
            disabled={createPoMutation.isPending}
          >
            {createPoMutation.isPending ? "Menerbitkan..." : "Simpan & Terbitkan PO"}
          </DnaButton>
        </div>
      </div>

      {/* 2-COLUMN GROUPING TOP SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CARD 1: IDENTITAS SUPPLIER & GUDANG */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-bold text-slate-800 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>1. Identitas Supplier & Kategori Pengadaan</span>
            </div>
            <span className="text-[11px] font-normal text-slate-400">Tahap 1 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Kategori Pengadaan */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Kategori Pengadaan <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Bahan Baku", label: "Bahan Baku" },
                  { id: "Bahan Kemas", label: "Bahan Kemas" },
                  { id: "Bahan Pembantu", label: "Bahan Pembantu" },
                ].map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSupplierCategory(cat.id as any)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                      supplierCategory === cat.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Supplier Picker */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Pilih Supplier Mitra <span className="text-rose-500">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              >
                <option value="">— Pilih Supplier Terdaftar —</option>
                {filteredSuppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Gudang Penerima */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Gudang Tujuan Penerimaan <span className="text-rose-500">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
              >
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CARD 2: PARAMETER PO & DEADLINE PENGIRIMAN */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-bold text-slate-800 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>2. Parameter PO & Deadline Pengiriman</span>
            </div>
            <span className="text-[11px] font-normal text-slate-400">Tahap 2 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tanggal Input PO (Read-Only)
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Deadline Pengiriman (SLA Supplier) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Diskon Pembelian (Nominal Rp)
                </label>
                <input
                  type="number"
                  value={discountRp}
                  onChange={(e) => setDiscountRp(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Biaya Ongkos Kirim (Rp)
                </label>
                <input
                  type="number"
                  value={shippingCostRp}
                  onChange={(e) => setShippingCostRp(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* PPN Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/75">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800 text-xs">Pajak Pertambahan Nilai (PPN 11%)</div>
                <div className="text-[11px] text-slate-500">
                  Hitung faktur pajak masukan standar untuk pembelian BKP kena pajak.
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeTax}
                onChange={(e) => setIncludeTax(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH SPREADSHEET LINE ITEMS GRID */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-bold text-slate-800 text-sm">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>3. Rincian Material & Bahan Dipesan ({cartItems.length} Baris)</span>
          </div>
          <DnaButton
            variant="outline"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleAddItem}
          >
            Tambah Baris Material
          </DnaButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-[40px] text-center text-slate-400">#</th>
                <th className="py-2.5 px-3 min-w-[260px]">Nama Material / Bahan</th>
                <th className="py-2.5 px-3 w-[140px]">Kode SKU</th>
                <th className="py-2.5 px-3 w-[110px] text-right">Kuantitas</th>
                <th className="py-2.5 px-3 w-[90px]">Satuan</th>
                <th className="py-2.5 px-3 w-[150px] text-right">Harga Satuan (Rp)</th>
                <th className="py-2.5 px-3 w-[160px] text-right">Subtotal (Rp)</th>
                <th className="py-2.5 px-3 w-[60px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cartItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={item.materialName}
                      onChange={(e) => handleUpdateItem(item.id, "materialName", e.target.value)}
                      placeholder="Nama material / bahan..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={item.materialCode}
                      onChange={(e) => handleUpdateItem(item.id, "materialCode", e.target.value)}
                      placeholder="SKU-XXX"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleUpdateItem(item.id, "qty", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-right font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <select
                      value={item.unit}
                      onChange={(e) => handleUpdateItem(item.id, "unit", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Kg">Kg</option>
                      <option value="Gram">Gram</option>
                      <option value="Liter">Liter</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Botol">Botol</option>
                      <option value="Jar">Jar</option>
                      <option value="Box">Box</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(item.id, "unitPrice", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-right font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={cartItems.length <= 1}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTTOM FINANCIAL SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Catatan & Ketentuan Khusus PO</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal Material ({cartItems.length} items):</span>
              <span className="font-semibold text-slate-900 tabular-nums">Rp {subtotalItems.toLocaleString("id-ID")}</span>
            </div>
            {numDiscount > 0 && (
              <div className="flex justify-between items-center text-rose-600">
                <span>Diskon Pengadaan:</span>
                <span className="font-semibold tabular-nums">- Rp {numDiscount.toLocaleString("id-ID")}</span>
              </div>
            )}
            {includeTax && (
              <div className="flex justify-between items-center text-slate-600">
                <span>PPN 11%:</span>
                <span className="font-semibold text-slate-900 tabular-nums">+ Rp {taxAmount.toLocaleString("id-ID")}</span>
              </div>
            )}
            {numShipping > 0 && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Biaya Ongkos Kirim:</span>
                <span className="font-semibold text-slate-900 tabular-nums">+ Rp {numShipping.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
              <span>Total Nilai PO:</span>
              <span className="text-emerald-600 tabular-nums text-base">{formatRupiah(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
