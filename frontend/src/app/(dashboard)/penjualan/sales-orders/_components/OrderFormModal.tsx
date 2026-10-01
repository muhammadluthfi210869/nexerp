"use client";

import React from "react";
import { Calendar, Plus, Trash2, ShoppingCart } from "lucide-react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import type {
  SalesOrderFormData,
  SalesOrderItemLine,
  CodeFormatType,
} from "../_types/sales-orders.types";
import { formatCurrency } from "@/lib/utils";

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeType: CodeFormatType;
  setCodeType: (type: CodeFormatType) => void;
  form: SalesOrderFormData;
  setForm: React.Dispatch<React.SetStateAction<SalesOrderFormData>>;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof SalesOrderItemLine, val: any) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function OrderFormModal({
  isOpen,
  onClose,
  codeType,
  setCodeType,
  form,
  setForm,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onSubmit,
  isSubmitting,
}: OrderFormModalProps) {
  const totalCart = form.items.reduce(
    (acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0),
    0
  );

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Sales Order (SO) Baru"
      subtitle="Formulir Kontrak Penjualan Produk & Matriks Alokasi Deadline per Departemen"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs">
            <span className="text-slate-500 mr-2">Total Estimasi Nilai SO:</span>
            <span className="font-bold text-slate-900 text-sm">{formatCurrency(totalCart)}</span>
          </div>
          <div className="flex items-center gap-2">
            <DnaButton variant="ghost" onClick={onClose}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Menerbitkan..." : "Terbitkan Sales Order"}
            </DnaButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-medium">
        {/* Format Kode Universal Selector (Poin 148) */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">
              Format Penomoran Kode SO Universal
            </span>
            <span className="text-[10px] text-slate-500">
              Pilih format standar kode transaksi sesuai SOP perusahaan (Poin 148)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCodeType("SHORT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                codeType === "SHORT"
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              Ringkas (SO-202609-0001)
            </button>
            <button
              type="button"
              onClick={() => setCodeType("FULL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                codeType === "FULL"
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              Lengkap (DL-BUS-SO-...)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
              Nama Pelanggan *
            </label>
            <DnaInput
              placeholder="Contoh: PT Cantik Jelita"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
              Brand Produk
            </label>
            <DnaInput
              placeholder="Contoh: Jelita Glow"
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
              Kategori Order
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as any })}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            >
              <option value="MAKLON_BARU">Maklon Baru (Batch 1)</option>
              <option value="REPEAT_ORDER">Repeat Order (Batch Lanjutan)</option>
              <option value="JUAL_PUTUS">Jual Putus / Distribusi</option>
            </select>
          </div>
        </div>

        {/* Deadlines per PIC Section (Requirement Poin 38) */}
        <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-[11px] uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-zinc-700" />
            Alokasi Deadline per PIC / Departemen (Poin 38)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                1. PIC Desain & Kemas:
              </span>
              <input
                type="date"
                value={form.deadlineDesign}
                onChange={(e) => setForm({ ...form, deadlineDesign: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                2. PIC Formulasi R&D:
              </span>
              <input
                type="date"
                value={form.deadlineRnd}
                onChange={(e) => setForm({ ...form, deadlineRnd: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                3. PIC Pengadaan SCM:
              </span>
              <input
                type="date"
                value={form.deadlineScm}
                onChange={(e) => setForm({ ...form, deadlineScm: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                4. PIC Produksi Pabrik:
              </span>
              <input
                type="date"
                value={form.deadlineProduction}
                onChange={(e) => setForm({ ...form, deadlineProduction: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Multi-line Product Cart Section */}
        <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-slate-600" />
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Keranjang Item Produk SO ({form.items.length} Baris)
              </span>
            </div>
            <DnaButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={onAddItem}
              className="gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris Produk
            </DnaButton>
          </div>

          <div className="space-y-2.5">
            {form.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 items-end"
              >
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Nama Produk *
                  </label>
                  <DnaInput
                    placeholder="Contoh: Sunscreen Brightening SPF 50"
                    value={item.itemName}
                    onChange={(e) => onUpdateItem(idx, "itemName", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Netto
                  </label>
                  <DnaInput
                    placeholder="30g / 50ml"
                    value={item.netto}
                    onChange={(e) => onUpdateItem(idx, "netto", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Qty (Pcs)
                  </label>
                  <DnaInput
                    type="number"
                    placeholder="1000"
                    value={item.qty.toString()}
                    onChange={(e) => onUpdateItem(idx, "qty", parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <DnaInput
                    type="number"
                    placeholder="35000"
                    value={item.unitPrice.toString()}
                    onChange={(e) => onUpdateItem(idx, "unitPrice", parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div className="md:col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                    title="Hapus baris item"
                    disabled={form.items.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catatan / Keterangan */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
            Catatan Tambahan
          </label>
          <DnaInput
            placeholder="Keterangan packaging, aroma khusus, atau instruksi pengiriman..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>
    </DnaModal>
  );
}
