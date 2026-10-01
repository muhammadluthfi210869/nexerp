"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import {
  DnaModal,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
} from "@/components/dna";
import {
  OpnameFormData,
  OpnameNewItem,
  WarehouseOption,
  CatalogMaterialOption,
} from "../_types/stock-opname.types";

interface OpnameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: OpnameFormData;
  setFormData: React.Dispatch<React.SetStateAction<OpnameFormData>>;
  newItem: OpnameNewItem;
  setNewItem: React.Dispatch<React.SetStateAction<OpnameNewItem>>;
  warehouses: WarehouseOption[];
  catalogMaterials: CatalogMaterialOption[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function OpnameFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  newItem,
  setNewItem,
  warehouses,
  catalogMaterials,
  onAddItem,
  onRemoveItem,
  onSubmit,
}: OpnameFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Berita Acara Stock Opname"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Gudang Diperiksa *
            </label>
            <select
              value={formData.warehouseId}
              onChange={(e) => {
                const selWh = warehouses.find((w: any) => w.id === e.target.value);
                setFormData({
                  ...formData,
                  warehouseId: e.target.value,
                  warehouse: selWh?.name || e.target.value,
                });
              }}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white font-medium text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              {warehouses.length === 0 ? (
                <option value="">Tidak ada gudang</option>
              ) : (
                warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Tanggal Pelaksanaan *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        {/* Sub-form Input Item */}
        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
          <h5 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide">
            Barang yang Di-Opname
          </h5>
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-4">
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Barang *</label>
              <select
                value={newItem.materialId}
                onChange={(e) => {
                  const selMat = catalogMaterials.find((m: any) => m.id === e.target.value);
                  const stock = Number(selMat?.currentStock ?? selMat?.stockQty ?? 0);
                  setNewItem({
                    ...newItem,
                    materialId: e.target.value,
                    name: selMat?.name || e.target.value,
                    unit: selMat?.unit || "Unit",
                    systemQty: stock,
                    actualQty: stock,
                  });
                }}
                className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                <option value="">Pilih Material...</option>
                {catalogMaterials.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.code ? `[${m.code}] ` : ""}{m.name} ({m.unit || "Unit"})
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
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Stok Fisik *</label>
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
                placeholder="Catatan kondisi/lot..."
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
              <DnaButton type="button" variant="primary" size="sm" onClick={onAddItem}>
                + Tambah
              </DnaButton>
            </div>
          </div>
        </div>

        {/* Tabel Hasil Opname */}
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="w-10 text-center">#</DnaTh>
                <DnaTh>Barang</DnaTh>
                <DnaTh className="text-center">Satuan</DnaTh>
                <DnaTh className="text-right">Stok Sistem</DnaTh>
                <DnaTh className="text-right">Stok Fisik</DnaTh>
                <DnaTh className="text-right">Selisih</DnaTh>
                <DnaTh>Catatan</DnaTh>
                <DnaTh className="text-center w-12">Hapus</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {formData.items.map((it, idx) => (
                <DnaTableRow key={idx}>
                  <DnaTd className="text-center text-zinc-400 tabular-nums">{idx + 1}</DnaTd>
                  <DnaTd className="font-medium text-zinc-900">{it.name}</DnaTd>
                  <DnaTd className="text-center text-zinc-600">{it.unit}</DnaTd>
                  <DnaTd className="text-right text-zinc-500 tabular-nums">{it.systemQty.toLocaleString()}</DnaTd>
                  <DnaTd className="text-right font-semibold text-zinc-900 tabular-nums">{it.actualQty.toLocaleString()}</DnaTd>
                  <DnaTd className={`text-right font-semibold tabular-nums ${it.difference === 0 ? "text-zinc-400" : it.difference < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    {it.difference > 0 ? `+${it.difference}` : it.difference}
                  </DnaTd>
                  <DnaTd className="text-zinc-500">{it.notes || "-"}</DnaTd>
                  <DnaTd className="text-center">
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
            Catatan Pelaksanaan Opname
          </label>
          <textarea
            rows={2}
            placeholder="Kondisi gudang, saksi auditor, penanggung jawab..."
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
            Simpan Hasil Opname Fisik
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
