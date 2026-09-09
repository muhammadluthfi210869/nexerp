"use client";

/**
 * Buat Pembelian (Purchase Order Input Form)
 * Screen ID: SCR-038 & SCR-175
 *
 * Sesuai Spesifikasi:
 * - Visual DNA Design System (DnaPageHeader, DnaDataTableCard, DnaButton, DnaInput, DnaSelect, useDnaToast)
 * - Format Kode Universal Global (DL-SCM-PO-DDMMYYYY-0001 / PO-DDMMYYYY-0001)
 * - Tanggal PO Read-Only (Otomatis terisi tanggal hari ini - Poin 138)
 * - Label "Deadline" bukan "Jatuh Tempo" (Poin 37, 95)
 * - Diskon dihitung dalam Rupiah (Rp) dan Ongkir dicatat terpisah (Poin 101-102)
 * - Tanda Tangan Digital Penanggung Jawab PO (Poin 135)
 * - Multi-line Keranjang Pengadaan Barang
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  useDnaToast,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

interface CartLineItem {
  id: string;
  materialCode: string;
  materialName: string;
  category: string;
  qty: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const toast = useDnaToast();

  const todayStr = new Date().toLocaleDateString("id-ID");
  const defaultPoCode = `DL-SCM-PO-${todayStr.replace(/\//g, "")}-0005`;

  // Form Header State
  const [poCode] = useState(defaultPoCode);
  const [poDate] = useState(todayStr); // Read-only hari ini per Poin 138
  const [supplier, setSupplier] = useState("PT Chemindo Natural Indonesia");
  const [supplierCategory, setSupplierCategory] = useState("Bahan Baku");
  const [warehouse, setWarehouse] = useState("Gudang Bahan Baku A1 (Pabrik)");
  const [deadlineDate, setDeadlineDate] = useState("20/09/2026");
  const [paymentTerms, setPaymentTerms] = useState("DP 50% + Pelunasan Saat Tiba");
  const [buyerPic, setBuyerPic] = useState("Dimas Pratama (SCM Buyer)");
  const [isDigitalSigned, setIsDigitalSigned] = useState(true);
  const [notes, setNotes] = useState("");

  // Multi-line Cart State
  const [cartItems, setCartItems] = useState<CartLineItem[]>([
    {
      id: "line-1",
      materialCode: "RAW-ACT-001",
      materialName: "Niacinamide PC Grade (DSM)",
      category: "Bahan Baku",
      qty: 50,
      unit: "kg",
      unitPrice: 350000,
      subtotal: 17500000,
    },
    {
      id: "line-2",
      materialCode: "RAW-EXT-004",
      materialName: "Centella Asiatica Extract 10:1",
      category: "Bahan Baku",
      qty: 20,
      unit: "kg",
      unitPrice: 450000,
      subtotal: 9000000,
    },
  ]);

  // Financial Calculations (Poin 101-102: Diskon dalam Rp, Ongkir terpisah)
  const [discountRp, setDiscountRp] = useState<number>(500000);
  const [shippingCostRp, setShippingCostRp] = useState<number>(750000);
  const [taxRate, setTaxRate] = useState<number>(0); // 0% atau 11% PPN

  const subtotalBarang = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const afterDiscount = Math.max(0, subtotalBarang - discountRp);
  const taxAmount = (afterDiscount * taxRate) / 100;
  const grandTotal = afterDiscount + shippingCostRp + taxAmount;

  // Cart Handlers
  const handleAddItem = () => {
    const newItem: CartLineItem = {
      id: `line-${Date.now()}`,
      materialCode: "RAW-MAT-00" + (cartItems.length + 1),
      materialName: "Bahan Baru #" + (cartItems.length + 1),
      category: supplierCategory,
      qty: 10,
      unit: "kg",
      unitPrice: 150000,
      subtotal: 1500000,
    };
    setCartItems([...cartItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (cartItems.length <= 1) {
      toast.warning("Minimal 1 Item", "Pesanan pembelian wajib memiliki minimal 1 item barang.");
      return;
    }
    setCartItems(cartItems.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof CartLineItem, val: any) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          if (field === "qty" || field === "unitPrice") {
            updated.subtotal = Number(updated.qty || 0) * Number(updated.unitPrice || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) {
      toast.error("Supplier Wajib Diisi", "Mohon pilih supplier mitra pengadaan.");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang Kosong", "Tambahkan minimal 1 item barang yang dipesan.");
      return;
    }

    toast.success("PO Berhasil Dibuat", `Purchase Order ${poCode} diterbitkan dan siap diverifikasi Finance.`);
    router.push("/scm/pembelian");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900 font-sans">
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <DnaPageHeader
          title="Buat Pembelian Baru (Purchase Order / PO)"
          description="Form Penerbitan Dokumen Resmi Pengadaan Bahan Baku & Kemasan Pabrik (Standar Universal Code & 3 Pilar Fisik)"
          backLink={{ href: "/scm/pembelian", label: "Kembali ke Daftar PO" }}
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
                  Nomor Purchase Order (Auto Universal)
                </label>
                <DnaInput value={poCode} disabled className="bg-slate-100 font-mono text-xs font-bold text-blue-700" />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Format DL-SCM-PO-DDMMYYYY-XXXX</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Tanggal PO (Read-Only Hari Ini) *
                </label>
                <DnaInput value={poDate} disabled className="bg-slate-100 font-mono text-xs text-slate-700" />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Otomatis hari ini (Poin 138)</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Target Deadline Tiba di Pabrik *
                </label>
                <DnaInput
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="font-mono text-xs font-bold text-rose-600"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Label Deadline (Poin 37, 95)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Pilih Supplier Mitra *</label>
                <DnaSelect
                  options={[
                    { value: "PT Chemindo Natural Indonesia", label: "PT Chemindo Natural Indonesia (Bahan Baku)" },
                    { value: "CV Packaging Primatama", label: "CV Packaging Primatama (Bahan Kemas)" },
                    { value: "PT Multi Bintang Printing", label: "PT Multi Bintang Printing (Kemasan Sekunder)" },
                    { value: "PT Aroma Essentia Nusantara", label: "PT Aroma Essentia Nusantara (Fragrance)" },
                  ]}
                  value={supplier}
                  onChange={(val) => setSupplier(val)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Kategori Bahan (Filter Supplier) *</label>
                <DnaSelect
                  options={[
                    { value: "Bahan Baku", label: "Bahan Baku (Active / Base Ingredients)" },
                    { value: "Kemas Primer", label: "Bahan Kemas Primer (Botol / Jar / Tube)" },
                    { value: "Kemas Sekunder", label: "Bahan Kemas Sekunder (Box / Label / Segel)" },
                    { value: "Bahan Pembantu", label: "Bahan Pembantu & Reagen Lab" },
                  ]}
                  value={supplierCategory}
                  onChange={(val) => setSupplierCategory(val)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Gudang Penerima *</label>
                <DnaSelect
                  options={[
                    { value: "Gudang Bahan Baku A1 (Pabrik)", label: "Gudang Bahan Baku A1 (Pabrik)" },
                    { value: "Gudang Kemasan B2 (Pabrik)", label: "Gudang Kemasan B2 (Pabrik)" },
                    { value: "Gudang Karantina & QC", label: "Gudang Karantina & QC" },
                  ]}
                  value={warehouse}
                  onChange={(val) => setWarehouse(val)}
                />
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
              <DnaButton type="button" variant="secondary" size="sm" onClick={handleAddItem}>
                + Tambah Baris Bahan
              </DnaButton>
            </div>

            <div className="space-y-2.5">
              {cartItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs"
                >
                  <span className="font-bold text-slate-400 w-5 text-center">{idx + 1}</span>

                  <div className="flex-1 min-w-[180px]">
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Nama Bahan / Kemas</label>
                    <DnaInput
                      value={item.materialName}
                      onChange={(e) => handleUpdateItem(item.id, "materialName", e.target.value)}
                      placeholder="Nama Bahan"
                    />
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Kode Bahan</label>
                    <DnaInput
                      value={item.materialCode}
                      onChange={(e) => handleUpdateItem(item.id, "materialCode", e.target.value)}
                      placeholder="KOD-001"
                      className="font-mono text-[11px]"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Qty Pesan</label>
                    <DnaInput
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleUpdateItem(item.id, "qty", Number(e.target.value))}
                      className="font-bold"
                    />
                  </div>

                  <div className="w-20">
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Satuan</label>
                    <DnaSelect
                      options={[
                        { value: "kg", label: "kg" },
                        { value: "gram", label: "gram" },
                        { value: "pcs", label: "pcs" },
                        { value: "pack", label: "pack" },
                      ]}
                      value={item.unit}
                      onChange={(val) => handleUpdateItem(item.id, "unit", val)}
                    />
                  </div>

                  <div className="w-32">
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Harga Satuan (Rp)</label>
                    <DnaInput
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(item.id, "unitPrice", Number(e.target.value))}
                      className="font-mono"
                    />
                  </div>

                  <div className="w-32 text-right">
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Subtotal</label>
                    <span className="font-bold text-blue-600 font-mono block pt-2 text-xs">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors mt-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Kalkulasi Finansial (Diskon Rp & Ongkir) & Digital Signature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Syarat Pembayaran & Tanda Tangan Digital */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. Ketentuan Pembayaran & TTD Digital
              </h3>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Termin Pembayaran PO *</label>
                <DnaSelect
                  options={[
                    { value: "DP 50% + Pelunasan Saat Tiba", label: "DP 50% + Pelunasan Saat Tiba (Maklon Standar)" },
                    { value: "Full Payment Before Delivery (CBD)", label: "Cash Before Delivery (CBD 100%)" },
                    { value: "TOP 14 Hari Kalender", label: "Term of Payment (TOP 14 Hari)" },
                    { value: "TOP 30 Hari Kalender", label: "Term of Payment (TOP 30 Hari)" },
                  ]}
                  value={paymentTerms}
                  onChange={(val) => setPaymentTerms(val)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Penanggung Jawab PIC Purchasing *</label>
                <DnaInput value={buyerPic} onChange={(e) => setBuyerPic(e.target.value)} className="text-xs" />
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-xs text-emerald-900 block">Tanda Tangan Digital Resmi</span>
                    <span className="text-[10px] text-emerald-700">Tervalidasi secara kriptografis (Poin 135)</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isDigitalSigned}
                  onChange={(e) => setIsDigitalSigned(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Catatan Khusus PO</label>
                <textarea
                  className="w-full h-16 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Catatan instruksi packing, lot expired date, atau syarat COA..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  <span className="font-bold font-mono text-slate-900">{formatCurrency(subtotalBarang)}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-semibold block">Potongan Diskon Supplier (Rp):</span>
                    <span className="text-[10px] text-slate-400">Dihitung dalam Rupiah, bukan % (Poin 101-102)</span>
                  </div>
                  <div className="w-36">
                    <DnaInput
                      type="number"
                      value={discountRp}
                      onChange={(e) => setDiscountRp(Number(e.target.value))}
                      className="font-mono text-right font-bold text-emerald-600 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-semibold block">Biaya Ongkir (Rp):</span>
                    <span className="text-[10px] text-slate-400">Dicatat terpisah dari harga barang (Poin 101)</span>
                  </div>
                  <div className="w-36">
                    <DnaInput
                      type="number"
                      value={shippingCostRp}
                      onChange={(e) => setShippingCostRp(Number(e.target.value))}
                      className="font-mono text-right font-bold text-slate-800 text-xs"
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
                  <span className="text-lg font-black text-blue-600 font-mono">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <DnaButton type="button" variant="secondary" onClick={() => router.push("/scm/pembelian")}>
                  Batal
                </DnaButton>
                <DnaButton type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
                  Terbitkan Purchase Order
                </DnaButton>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
