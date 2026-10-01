"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import {
  DnaModal,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import {
  AdjustmentFormData,
  AdjustmentNewItem,
  WarehouseOption,
  CatalogMaterialOption,
} from "../_types/stock-adjustment.types";

interface AdjustmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: AdjustmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AdjustmentFormData>>;
  newItem: AdjustmentNewItem;
  setNewItem: React.Dispatch<React.SetStateAction<AdjustmentNewItem>>;
  warehouseList: WarehouseOption[];
  catalogMaterials: CatalogMaterialOption[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function AdjustmentFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  newItem,
  setNewItem,
  warehouseList,
  catalogMaterials,
  onAddItem,
  onRemoveItem,
  onSubmit,
}: AdjustmentFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Penyesuaian Stok"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Gudang *
            </label>
            <select
              value={formData.warehouseId || (warehouseList[0]?.id ?? "")}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white font-medium text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              {warehouseList.length === 0 ? (
                <option value="">Gudang Utama</option>
              ) : (
                warehouseList.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} {wh.code ? `(${wh.code})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Tanggal Penyesuaian *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Akun Penyesuaian (CoA) *
            </label>
            <select
              value={formData.account}
              onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white font-medium text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              <option value="5100 - Beban Selisih Persediaan">5100 - Beban Selisih Persediaan (Susut/Rusak)</option>
              <option value="7100 - Pendapatan Lain-lain (Bonus Sample)">7100 - Pendapatan Lain-lain (Bonus Sample/Surplus)</option>
              <option value="5200 - Beban Pemakaian Internal Laboratorium">5200 - Beban Pemakaian Internal Laboratorium</option>
            </select>
          </div>
        </div>

        {/* Sub-form Tambah Item */}
        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
          <h5 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide">
            Barang yang Disesuaikan
          </h5>
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-4">
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Barang *</label>
              <select
                value={newItem.materialId}
                onChange={(e) => {
                  const selectedMat = catalogMaterials.find((m) => m.id === e.target.value);
                  const stockVal = Number(selectedMat?.stock || selectedMat?.currentStock || 0);
                  setNewItem({
                    ...newItem,
                    materialId: e.target.value,
                    name: selectedMat?.name || e.target.value,
                    unit: selectedMat?.unit || "Unit",
                    systemQty: stockVal,
                    actualQty: stockVal,
                    difference: 0,
                  });
                }}
                className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                <option value="">-- Pilih Barang --</option>
                {catalogMaterials.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} ({mat.unit || "Unit"})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Stok Sistem</label>
              <input
                type="number"
                readOnly
                value={newItem.systemQty}
                className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-zinc-100 text-right font-medium text-zinc-600 cursor-not-allowed"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Stok Aktual *</label>
              <input
                type="number"
                value={newItem.actualQty}
                onChange={(e) => setNewItem({ ...newItem, actualQty: Number(e.target.value) })}
                className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white text-right font-semibold text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div className="col-span-4 flex gap-2">
              <input
                type="text"
                placeholder="Alasan selisih..."
                value={newItem.reason}
                onChange={(e) => setNewItem({ ...newItem, reason: e.target.value })}
                className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
              <DnaButton type="button" variant="primary" size="sm" onClick={onAddItem}>
                + Tambah
              </DnaButton>
            </div>
          </div>
        </div>

        {/* Tabel Item Keranjang */}
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
          <DnaTable className="w-full text-xs text-left">
            <DnaTableHead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-medium">
              <DnaTableRow>
                <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                <DnaTh className="py-2.5 px-3">Barang</DnaTh>
                <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                <DnaTh className="py-2.5 px-3 text-right">Stok Sistem</DnaTh>
                <DnaTh className="py-2.5 px-3 text-right">Stok Aktual</DnaTh>
                <DnaTh className="py-2.5 px-3 text-right">Selisih</DnaTh>
                <DnaTh className="py-2.5 px-3">Alasan</DnaTh>
                <DnaTh className="py-2.5 px-3 text-center w-12">Hapus</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody className="divide-y divide-zinc-100">
              {formData.items.map((it, idx) => (
                <DnaTableRow key={idx}>
                  <DnaTd className="py-2 px-3 text-center text-zinc-400">{idx + 1}</DnaTd>
                  <DnaTd className="py-2 px-3 font-medium text-zinc-900">{it.name}</DnaTd>
                  <DnaTd className="py-2 px-3 text-center text-zinc-600">{it.unit}</DnaTd>
                  <DnaTd className="py-2 px-3 text-right text-zinc-500 tabular-nums">{it.systemQty.toLocaleString()}</DnaTd>
                  <DnaTd className="py-2 px-3 text-right font-semibold text-zinc-900 tabular-nums">{it.actualQty.toLocaleString()}</DnaTd>
                  <DnaTd className={`py-2 px-3 text-right font-semibold tabular-nums ${it.difference < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    {it.difference > 0 ? `+${it.difference}` : it.difference}
                  </DnaTd>
                  <DnaTd className="py-2 px-3 text-zinc-500">{it.reason || "-"}</DnaTd>
                  <DnaTd className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      className="text-zinc-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            Catatan Penyesuaian
          </label>
          <textarea
            rows={2}
            placeholder="Catatan tambahan..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
          <DnaButton
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Batal
          </DnaButton>
          <DnaButton type="submit" variant="primary">
            Simpan Penyesuaian Stok
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
