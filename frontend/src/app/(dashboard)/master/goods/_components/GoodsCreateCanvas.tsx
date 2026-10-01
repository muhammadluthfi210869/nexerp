"use client";

import React from "react";
import {
  ArrowLeft,
  Package,
  Boxes,
  DollarSign,
  Save,
  Layers,
  Sparkles,
} from "lucide-react";
import { DnaButton, DnaBadge, formatRupiah } from "@/components/dna";
import type {
  MasterBarangItem,
  KategoriBarangItem,
  AccountOptionItem,
  BarangFormData,
} from "../_types/goods.types";

interface GoodsCreateCanvasProps {
  onBack: () => void;
  editingBarang: MasterBarangItem | null;
  barangForm: BarangFormData;
  setBarangForm: React.Dispatch<React.SetStateAction<BarangFormData>>;
  categoriesList: KategoriBarangItem[];
  accountsList: AccountOptionItem[];
  isPending: boolean;
  onSave: () => void;
}

export function GoodsCreateCanvas({
  onBack,
  editingBarang,
  barangForm,
  setBarangForm,
  categoriesList,
  accountsList,
  isPending,
  onSave,
}: GoodsCreateCanvasProps) {
  return (
    <div className="space-y-6">
      {/* TOP HEADER WITH AUTO-NUMBER & ACTIONS */}
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
                {editingBarang ? `Sunting Barang: ${editingBarang.nama}` : "Pendaftaran Master Barang & Material"}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-zinc-100 text-zinc-900 border border-zinc-200">
                🏷️ {barangForm.kode || "SKU-AUTO"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Master katalog bahan baku, kemasan, dan produk jadi dengan integrasi akun buku besar persediaan.
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
            onClick={onSave}
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : editingBarang ? "Perbarui Barang" : "Simpan Barang"}
          </DnaButton>
        </div>
      </div>

      {/* 2-COLUMN IN-PLACE CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CARD 1: IDENTITAS MATERIAL & SATUAN */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-zinc-900" />
              <span>1. Identitas Material & Parameter Stok</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 1 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Kode SKU / Material (Auto)
                </label>
                <input
                  type="text"
                  value={barangForm.kode}
                  readOnly
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-100 font-mono font-bold text-zinc-600 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Nama Barang / Material <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={barangForm.nama}
                  onChange={(e) => setBarangForm({ ...barangForm, nama: e.target.value })}
                  placeholder="Contoh: Niacinamide 99% USP Grade"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-bold text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Kategori Material <span className="text-rose-500">*</span>
                </label>
                <select
                  value={barangForm.categoryId}
                  onChange={(e) => {
                    const val = e.target.value;
                    const found = categoriesList.find((c) => c.id === val || c.name === val);
                    setBarangForm({
                      ...barangForm,
                      categoryId: found ? found.id : val,
                      kategori: found ? found.name : val,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-semibold text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                >
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Sub Kategori / Tipe</label>
                <input
                  type="text"
                  value={barangForm.subKategori}
                  onChange={(e) => setBarangForm({ ...barangForm, subKategori: e.target.value })}
                  placeholder="Active Ingredient / Bottle"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Satuan Standar <span className="text-rose-500">*</span></label>
                <select
                  value={barangForm.satuan}
                  onChange={(e) => setBarangForm({ ...barangForm, satuan: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                >
                  <option value="Kg">Kg (Kilogram)</option>
                  <option value="Gram">Gram (g)</option>
                  <option value="Pcs">Pcs (Pieces)</option>
                  <option value="Liter">Liter (L)</option>
                  <option value="Roll">Roll</option>
                  <option value="Pack">Pack / Box</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Safety Stock (Min)</label>
                <input
                  type="number"
                  min={0}
                  value={barangForm.minimumStock}
                  onChange={(e) => setBarangForm({ ...barangForm, minimumStock: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Lead Time (Hari)</label>
                <input
                  type="number"
                  min={0}
                  value={barangForm.leadTimeDays}
                  onChange={(e) => setBarangForm({ ...barangForm, leadTimeDays: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Spesifikasi / Deskripsi Bahan</label>
              <textarea
                rows={2}
                value={barangForm.deskripsi}
                onChange={(e) => setBarangForm({ ...barangForm, deskripsi: e.target.value })}
                placeholder="Contoh: Kemurnian 99.5%, Cosmetical Grade USP/BP, Simpan pada suhu ruang sejuk."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: PARAMETER FINANSIAL & AKUN COA */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-zinc-900" />
              <span>2. Parameter Finansial & Akun CoA</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 2 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Harga Beli Standar (Rp / Satuan) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={barangForm.hargaBeli}
                  onChange={(e) => setBarangForm({ ...barangForm, hargaBeli: Number(e.target.value) || 0 })}
                  placeholder="450000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-bold text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-0.5 block font-mono">
                  {formatRupiah(barangForm.hargaBeli)} / {barangForm.satuan}
                </span>
              </div>
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Harga Jual Standar (Rp / Satuan)
                </label>
                <input
                  type="number"
                  min={0}
                  value={barangForm.hargaJual}
                  onChange={(e) => setBarangForm({ ...barangForm, hargaJual: Number(e.target.value) || 0 })}
                  placeholder="550000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-bold text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
                <span className="text-[10px] text-zinc-500 mt-0.5 block font-mono">
                  {formatRupiah(barangForm.hargaJual || 0)} / {barangForm.satuan}
                </span>
              </div>
            </div>

            {/* Akun CoA Selector */}
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
              <span className="font-bold text-zinc-800 block">Pemetaan Akun Buku Besar (CoA)</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-zinc-600 text-[11px] font-semibold mb-1">Akun Persediaan (Inventory Asset)</label>
                  <select
                    value={barangForm.accountPersediaan}
                    onChange={(e) => setBarangForm({ ...barangForm, accountPersediaan: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-medium text-zinc-800 focus:border-zinc-900"
                  >
                    <option value="110401 - Persediaan Bahan Baku">110401 - Persediaan Bahan Baku</option>
                    <option value="110402 - Persediaan Bahan Kemas">110402 - Persediaan Bahan Kemas</option>
                    <option value="110403 - Persediaan Barang Jadi">110403 - Persediaan Barang Jadi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-600 text-[11px] font-semibold mb-1">Akun Beban Pokok / HPP (COGS)</label>
                  <select
                    value={barangForm.accountHpp}
                    onChange={(e) => setBarangForm({ ...barangForm, accountHpp: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-medium text-zinc-800 focus:border-zinc-900"
                  >
                    <option value="510101 - Beban Pokok Bahan Baku">510101 - Beban Pokok Bahan Baku</option>
                    <option value="510102 - Beban Pokok Bahan Kemas">510102 - Beban Pokok Bahan Kemas</option>
                    <option value="510103 - Beban Pokok Produksi Maklon">510103 - Beban Pokok Produksi Maklon</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Status Keaktifan */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1">Status Keaktifan Material</label>
              <select
                value={barangForm.status}
                onChange={(e) => setBarangForm({ ...barangForm, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-semibold text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value="ACTIVE">✓ Aktif Digunakan (Active)</option>
                <option value="INACTIVE">Non-Aktif / Discontinue</option>
              </select>
            </div>

            {/* Live Summary Footer */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Kategori & Satuan:</span>
                <span className="font-bold text-zinc-900">{barangForm.kategori} ({barangForm.satuan})</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-zinc-200 pt-2">
                <span className="font-bold text-zinc-800">Estimasi HPP Standar:</span>
                <span className="font-extrabold text-zinc-900 text-sm tabular-nums font-mono">
                  {formatRupiah(barangForm.hargaBeli)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
