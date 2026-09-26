"use client";

/**
 * Buat Pembelian (Purchase Order Input Form)
 * Screen ID: SCR-038 & SCR-175
 *
 * Wired to the real NestJS backend:
 * - GET  /master/suppliers   → daftar supplier mitra
 * - GET  /master/warehouses  → gudang penerima
 * - GET  /master/materials   → katalog bahan/kemasan (qty, unit, harga acuan)
 * - POST /purchase/orders    → penerbitan PO (poNumber di-generate server-side)
 */

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import {
  Package,
  Trash2,
  Save,
  Plus,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  useDnaToast,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

interface SupplierOption {
  id: string;
  name: string;
  categoryName?: string;
}

interface WarehouseOption {
  id: string;
  name: string;
}

interface MaterialOption {
  id: string;
  code: string;
  name: string;
  unit: string;
  unitPrice: number;
  type: string;
  categoryName?: string;
}

interface CartLineItem {
  id: string;
  materialId: string;
  qty: number;
  unitPrice: number;
}

function unwrapList(payload: any): any[] {
  const list = payload?.data?.data || payload?.data || payload;
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data)) return list.data;
  return [];
}

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [estArrival, setEstArrival] = useState("");
  const [noteText, setNoteText] = useState("");
  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);

  const [discountRp, setDiscountRp] = useState<number>(0);
  const [shippingCostRp, setShippingCostRp] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);

  const suppliersQuery = useQuery<SupplierOption[]>({
    queryKey: ["master-suppliers-po-form"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/suppliers");
        return unwrapList(res.data).map((s: any) => ({
          id: s.id,
          name: s.name,
          categoryName: s.category?.name,
        }));
      } catch {
        return [];
      }
    },
  });

  const warehousesQuery = useQuery<WarehouseOption[]>({
    queryKey: ["master-warehouses-po-form"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/warehouses/active");
        return unwrapList(res.data).map((w: any) => ({ id: w.id, name: w.name }));
      } catch {
        return [];
      }
    },
  });

  const materialsQuery = useQuery<MaterialOption[]>({
    queryKey: ["master-materials-po-form"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/materials", { params: { limit: 500 } });
        return unwrapList(res.data).map((m: any) => ({
          id: m.id,
          code: m.code || "—",
          name: m.name,
          unit: m.unit || m.usageUnit || "unit",
          unitPrice: Number(m.unitPrice ?? 0),
          type: m.type || "—",
          categoryName: m.category?.name,
        }));
      } catch {
        return [];
      }
    },
  });

  const suppliers = suppliersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const materials = materialsQuery.data ?? [];

  const materialById = useMemo(() => {
    const map = new Map<string, MaterialOption>();
    materials.forEach((m) => map.set(m.id, m));
    return map;
  }, [materials]);

  const cartRows = cartItems.map((line) => {
    const material = materialById.get(line.materialId);
    return {
      ...line,
      materialName: material?.name || "—",
      materialCode: material?.code || "—",
      unit: material?.unit || "unit",
      subtotal: Number(line.qty || 0) * Number(line.unitPrice || 0),
    };
  });

  const subtotalBarang = cartRows.reduce((sum, item) => sum + item.subtotal, 0);
  const afterDiscount = Math.max(0, subtotalBarang - discountRp);
  const taxAmount = (afterDiscount * taxRate) / 100;
  const grandTotal = afterDiscount + shippingCostRp + taxAmount;

  const handleAddItem = () => {
    const first = materials[0];
    setCartItems([
      ...cartItems,
      {
        id: `line-${Date.now()}`,
        materialId: first?.id || "",
        qty: 1,
        unitPrice: first?.unitPrice || 0,
      },
    ]);
  };

  const handleSelectMaterial = (lineId: string, materialId: string) => {
    const material = materialById.get(materialId);
    setCartItems(
      cartItems.map((line) =>
        line.id === lineId
          ? {
              ...line,
              materialId,
              unitPrice: line.unitPrice || material?.unitPrice || 0,
            }
          : line
      )
    );
  };

  const handleUpdateItem = (lineId: string, field: "qty" | "unitPrice", val: number) => {
    setCartItems(
      cartItems.map((line) => (line.id === lineId ? { ...line, [field]: val } : line))
    );
  };

  const handleRemoveItem = (lineId: string) => {
    setCartItems(cartItems.filter((line) => line.id !== lineId));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/purchase/orders", {
        supplierId,
        warehouseId: warehouseId || undefined,
        items: cartItems.map((line) => ({
          materialId: line.materialId,
          quantity: Number(line.qty),
          unitPrice: Number(line.unitPrice),
        })),
        discountManual: discountRp || undefined,
        shippingCost: shippingCostRp || undefined,
        taxPercent: taxRate || undefined,
        estArrival: estArrival || undefined,
        notes: noteText || undefined,
      });
      return res.data?.data || res.data;
    },
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success(
        "PO Berhasil Dibuat",
        `Purchase Order ${created?.poNumber || ""} diterbitkan dan siap diverifikasi Finance.`
      );
      router.push("/purchase");
    },
    onError: (error) => {
      const { message } = extractApiError(error);
      toast.error("Gagal Membuat PO", message || "Server menolak permintaan pembuatan PO.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error("Supplier Wajib Dipilih", "Mohon pilih supplier mitra pengadaan.");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang Kosong", "Tambahkan minimal 1 item barang yang dipesan.");
      return;
    }
    if (cartItems.some((line) => !line.materialId || Number(line.qty) <= 0)) {
      toast.error("Item Tidak Lengkap", "Setiap baris wajib punya bahan dan qty lebih dari 0.");
      return;
    }
    createMutation.mutate();
  };

  const isLoading =
    suppliersQuery.isLoading || warehousesQuery.isLoading || materialsQuery.isLoading;
  const isError =
    suppliersQuery.isError || warehousesQuery.isError || materialsQuery.isError;

  const refetchAll = () => {
    suppliersQuery.refetch();
    warehousesQuery.refetch();
    materialsQuery.refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900 font-sans">
        <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          <DnaPageHeader
            title="Buat Pembelian Baru (Purchase Order / PO)"
            description="Form Penerbitan Dokumen Resmi Pengadaan Bahan Baku & Kemasan Pabrik"
            backLink={{ href: "/purchase", label: "Kembali ke Daftar PO" }}
          />
          <DnaLoadingSkeleton rows={6} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900 font-sans">
        <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          <DnaPageHeader
            title="Buat Pembelian Baru (Purchase Order / PO)"
            description="Form Penerbitan Dokumen Resmi Pengadaan Bahan Baku & Kemasan Pabrik"
            backLink={{ href: "/purchase", label: "Kembali ke Daftar PO" }}
          />
          <DnaErrorState
            title="Gagal Memuat Master Data"
            message="Tidak dapat mengambil master supplier / gudang / bahan dari backend."
            onRetry={refetchAll}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900 font-sans">
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <DnaPageHeader
          title="Buat Pembelian Baru (Purchase Order / PO)"
          description="Form Penerbitan Dokumen Resmi Pengadaan Bahan Baku & Kemasan Pabrik (Standar Universal Code & 3 Pilar Fisik)"
          backLink={{ href: "/purchase", label: "Kembali ke Daftar PO" }}
        />

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Informasi Dokumen & Supplier */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Identitas Dokumen & Mitra Supplier
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Nomor Purchase Order
                </label>
                <DnaInput
                  value=""
                  disabled
                  placeholder="Digenerate sistem saat simpan"
                  className="bg-slate-100 tabular-nums text-xs font-bold text-blue-700"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  poNumber dibuat otomatis oleh server (idGenerator)
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Tanggal PO (Read-Only Hari Ini) *
                </label>
                <DnaInput
                  value={new Date().toLocaleDateString("id-ID")}
                  disabled
                  className="bg-slate-100 tabular-nums text-xs text-slate-700"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Otomatis hari ini (BUS-RULE-016)
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Target Deadline Tiba di Pabrik *
                </label>
                <DnaInput
                  type="date"
                  value={estArrival}
                  onChange={(e) => setEstArrival(e.target.value)}
                  className="tabular-nums text-xs font-bold text-rose-600"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dikirim sebagai estArrival
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Pilih Supplier Mitra *</label>
                <DnaSelect
                  options={suppliers.map((s) => ({
                    value: s.id,
                    label: s.categoryName ? `${s.name} (${s.categoryName})` : s.name,
                  }))}
                  value={supplierId}
                  onChange={(val) => setSupplierId(val)}
                  placeholder="— Pilih Supplier —"
                />
                {suppliers.length === 0 && (
                  <span className="text-[10px] text-rose-500 mt-0.5 block">
                    Belum ada supplier terdaftar di master.
                  </span>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="font-bold text-slate-700 block mb-1 text-xs">Gudang Penerima *</label>
                <DnaSelect
                  options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                  value={warehouseId}
                  onChange={(val) => setWarehouseId(val)}
                  placeholder="— Pilih Gudang —"
                />
                {warehouses.length === 0 && (
                  <span className="text-[10px] text-rose-500 mt-0.5 block">
                    Belum ada gudang aktif terdaftar di master.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Keranjang Multi-line Pengadaan Barang */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  2. Keranjang Multi-Line Bahan / Kemasan ({cartItems.length} Item)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hanya kuantitas kondisi bagus yang akan dibayar pada faktur pembelian (Poin 53-55).
                </p>
              </div>
              <DnaButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
                disabled={materials.length === 0}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Tambah Baris Bahan
              </DnaButton>
            </div>

            {materials.length === 0 ? (
              <DnaEmptyState
                title="Belum Ada Master Bahan"
                description="Katalog bahan/kemasan kosong di /master/materials, sehingga baris PO tidak dapat diisi."
              />
            ) : cartRows.length === 0 ? (
              <DnaEmptyState
                icon={<Package className="w-6 h-6" />}
                title="Keranjang Masih Kosong"
                description="Klik “Tambah Baris Bahan” untuk memilih bahan dari master materials."
              />
            ) : (
              <div className="space-y-2.5">
                {cartRows.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-wrap items-end gap-3 text-xs"
                  >
                    <span className="font-bold text-slate-400 w-5 text-center pb-2.5">{idx + 1}</span>

                    <div className="flex-1 min-w-[220px]">
                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                        Bahan / Kemas (Master Materials)
                      </label>
                      <DnaSelect
                        options={materials.map((m) => ({
                          value: m.id,
                          label: `${m.code} — ${m.name}`,
                        }))}
                        value={item.materialId}
                        onChange={(val) => handleSelectMaterial(item.id, val)}
                        placeholder="— Pilih Bahan —"
                      />
                    </div>

                    <div className="w-24">
                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Satuan</label>
                      <DnaInput value={item.unit} disabled className="bg-slate-100 text-[11px]" />
                    </div>

                    <div className="w-28">
                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Qty Pesan</label>
                      <DnaInput
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(item.id, "qty", Number(e.target.value))}
                        className="font-bold"
                      />
                    </div>

                    <div className="w-36">
                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                        Harga Satuan (Rp)
                      </label>
                      <DnaInput
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(item.id, "unitPrice", Number(e.target.value))}
                        className="tabular-nums"
                      />
                    </div>

                    <div className="w-32 text-right">
                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Subtotal</label>
                      <span className="font-bold text-blue-600 tabular-nums block py-3 text-xs">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors mb-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Catatan & Kalkulasi Finansial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. Catatan Khusus PO
              </h3>
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Catatan Khusus PO</label>
                <textarea
                  className="w-full h-32 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Catatan instruksi packing, lot expired date, atau syarat COA..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
            </div>

            {/* Rincian Finansial & Kalkulator */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                4. Ringkasan Kalkulasi Finansial
              </h3>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between items-center py-1">
                  <span>Subtotal Barang ({cartItems.length} Item):</span>
                  <span className="font-bold tabular-nums text-slate-900">{formatCurrency(subtotalBarang)}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-semibold block">Potongan Diskon Supplier (Rp):</span>
                    <span className="text-[10px] text-slate-400">Dikirim sebagai discountManual</span>
                  </div>
                  <div className="w-36">
                    <DnaInput
                      type="number"
                      min={0}
                      value={discountRp}
                      onChange={(e) => setDiscountRp(Number(e.target.value))}
                      className="tabular-nums text-right font-bold text-emerald-600 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-semibold block">Biaya Ongkir (Rp):</span>
                    <span className="text-[10px] text-slate-400">Dikirim sebagai shippingCost</span>
                  </div>
                  <div className="w-36">
                    <DnaInput
                      type="number"
                      min={0}
                      value={shippingCostRp}
                      onChange={(e) => setShippingCostRp(Number(e.target.value))}
                      className="tabular-nums text-right font-bold text-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span>Pajak Pertambahan Nilai (PPN):</span>
                  <div className="w-36">
                    <DnaSelect
                      options={[
                        { value: "0", label: "0% (Bebas PPN)" },
                        { value: "11", label: "11% (PPN Masukan)" },
                      ]}
                      value={String(taxRate)}
                      onChange={(val) => setTaxRate(Number(val))}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Grand Total Tagihan PO:</span>
                  <span className="text-lg font-black text-blue-600 tabular-nums">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <DnaButton type="button" variant="secondary" onClick={() => router.push("/purchase")}>
                  Batal
                </DnaButton>
                <DnaButton
                  type="submit"
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Menerbitkan..." : "Terbitkan Purchase Order"}
                </DnaButton>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}