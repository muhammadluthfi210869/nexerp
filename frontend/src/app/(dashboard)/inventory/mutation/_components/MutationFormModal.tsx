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
import type {
  TransferFormData,
  NewItemDraft,
  WarehouseOption,
  CatalogMaterialOption,
} from "../_types/mutation.types";

interface MutationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: TransferFormData;
  setFormData: React.Dispatch<React.SetStateAction<TransferFormData>>;
  newItem: NewItemDraft;
  setNewItem: React.Dispatch<React.SetStateAction<NewItemDraft>>;
  warehouseList: WarehouseOption[];
  catalogMaterials: CatalogMaterialOption[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function MutationFormModal({
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
}: MutationFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Mutasi & Transfer Antar Gudang"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Gudang Asal *
            </label>
            <select
              value={formData.sourceWarehouseId}
              onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white font-medium text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              {warehouseList.map((wh: any) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} {wh.code ? `(${wh.code})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Gudang Tujuan *
            </label>
            <select
              value={formData.destWarehouseId}
              onChange={(e) => setFormData({ ...formData, destWarehouseId: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white font-medium text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              {warehouseList.map((wh: any) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} {wh.code ? `(${wh.code})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Tanggal Transfer *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              No. Polisi Kendaraan / Alat Angkut (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: B 9284 KIL"
              value={formData.vehicleNo}
              onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2.5 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        {/* Sub-form Tambah Item */}
        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
          <h5 className="text-xs font-semibold text-zinc-900 uppercase tracking-wide">
            Tambah Barang ke Keranjang Mutasi
          </h5>
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-5">
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Barang *</label>
              <select
                value={newItem.materialId}
                onChange={(e) => {
                  const selectedMat = catalogMaterials.find((m: any) => m.id === e.target.value);
                  const stockVal = Number(selectedMat?.stock || selectedMat?.currentStock || 0);
                  setNewItem({
                    ...newItem,
                    materialId: e.target.value,
                    name: selectedMat?.name || e.target.value,
                    unit: selectedMat?.unit || "Kg",
                    qtyStock: stockVal,
                  });
                }}
                className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                <option value="">-- Pilih Barang --</option>
                {catalogMaterials.map((mat: any) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} ({mat.unit || "Unit"})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Qty Transfer *</label>
              <input
                type="number"
                min="1"
                value={newItem.qtyTransfer}
                onChange={(e) => setNewItem({ ...newItem, qtyTransfer: Number(e.target.value) })}
                className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white text-right font-semibold text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div className="col-span-4 flex gap-2">
              <input
                type="text"
                placeholder="Catatan lot / kemasan"
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

        {/* Tabel Keranjang Item */}
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                <DnaTh className="py-2.5 px-3">Barang</DnaTh>
                <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                <DnaTh className="py-2.5 px-3 text-right">Qty Mutasi</DnaTh>
                <DnaTh className="py-2.5 px-3">Catatan</DnaTh>
                <DnaTh className="py-2.5 px-3 text-center w-12">Hapus</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {formData.cartItems.map((it, idx) => (
                <DnaTableRow key={idx}>
                  <DnaTd className="py-2 px-3 text-center text-zinc-400">{idx + 1}</DnaTd>
                  <DnaTd className="py-2 px-3 font-medium text-zinc-900">{it.name}</DnaTd>
                  <DnaTd className="py-2 px-3 text-center text-zinc-600">{it.unit}</DnaTd>
                  <DnaTd className="py-2 px-3 text-right font-semibold text-zinc-900">
                    {it.qtyTransfer.toLocaleString()}
                  </DnaTd>
                  <DnaTd className="py-2 px-3 text-zinc-500">{it.notes || "-"}</DnaTd>
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
            Catatan Transfer Antar Gudang
          </label>
          <textarea
            rows={2}
            placeholder="Instruksi handling, keperluan produksi, dsb..."
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
            Simpan & Mutasikan Stok
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
