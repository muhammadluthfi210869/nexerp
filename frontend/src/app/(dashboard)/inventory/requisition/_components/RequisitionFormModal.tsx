import React from "react";
import { Plus, Send, Trash2 } from "lucide-react";
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
import { CartItem, TARGET_DIVISIONS } from "../_types/requisition.types";

interface RequisitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseList: any[];
  catalogMaterials: any[];
  rawSalesOrders: any[];
  fromWarehouse: string;
  setFromWarehouse: (val: string) => void;
  toDivision: string;
  setToDivision: (val: string) => void;
  selectedSalesOrderId: string;
  setSelectedSalesOrderId: (val: string) => void;
  spkNumber: string;
  setSpkNumber: (val: string) => void;
  batchNumber: string;
  setBatchNumber: (val: string) => void;
  purpose: string;
  setPurpose: (val: string) => void;
  cartItems: CartItem[];
  selectedMaterialId: string;
  setSelectedMaterialId: (val: string) => void;
  itemQty: number;
  setItemQty: (val: number) => void;
  onAddItem: () => void;
  onRemoveItem: (identifier: string) => void;
  onSubmit: () => void;
}

export const RequisitionFormModal: React.FC<RequisitionFormModalProps> = ({
  isOpen,
  onClose,
  warehouseList,
  catalogMaterials,
  rawSalesOrders,
  fromWarehouse,
  setFromWarehouse,
  toDivision,
  setToDivision,
  selectedSalesOrderId,
  setSelectedSalesOrderId,
  spkNumber,
  setSpkNumber,
  batchNumber,
  setBatchNumber,
  purpose,
  setPurpose,
  cartItems,
  selectedMaterialId,
  setSelectedMaterialId,
  itemQty,
  setItemQty,
  onAddItem,
  onRemoveItem,
  onSubmit,
}) => {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Form Pengajuan Bon Permintaan Barang"
      description="Isi form untuk meminta transfer material dari gudang penyimpanan ke line produksi atau divisi lain."
      size="2xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<Send className="w-4 h-4" />}
            onClick={onSubmit}
          >
            Ajukan Permintaan
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Warehouse & Destination */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Gudang Asal (Pengeluaran)</label>
            <select
              aria-label="Gudang Asal"
              value={fromWarehouse}
              onChange={(e) => setFromWarehouse(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {warehouseList.length === 0 ? (
                <option value="">Gudang Belum Tersedia</option>
              ) : (
                warehouseList.map((wh) => (
                  <option key={wh.id} value={wh.name}>
                    {wh.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Tujuan / Divisi Pemohon</label>
            <select
              aria-label="Tujuan Divisi"
              value={toDivision}
              onChange={(e) => setToDivision(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {TARGET_DIVISIONS.map((div: string) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Referensi Sales Order *</label>
            <select
              aria-label="Referensi Sales Order"
              value={selectedSalesOrderId}
              onChange={(e) => {
                setSelectedSalesOrderId(e.target.value);
                const found = rawSalesOrders.find((so: any) => so.id === e.target.value);
                if (found) {
                  setSpkNumber(found.orderNumber || found.id.slice(0, 8));
                }
              }}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {rawSalesOrders.length === 0 ? (
                <option value="">Tidak ada Sales Order aktif</option>
              ) : (
                rawSalesOrders.map((so: any) => (
                  <option key={so.id} value={so.id}>
                    {so.orderNumber || so.id.slice(0, 8)} - {so.customer?.name || "Customer"}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">No. Batch / Lot (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: LOT-2026-09"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Keperluan / Keterangan Penggunaan *
          </label>
          <input
            type="text"
            placeholder="Contoh: Kebutuhan bahan baku produksi Face Wash Batch 1"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Item Adder */}
        <div className="border-t border-slate-200 pt-3">
          <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center justify-between">
            <span>Tambahkan Material</span>
            <span className="text-[11px] font-normal text-slate-500">
              {cartItems.length} Item dalam Keranjang
            </span>
          </h4>
          <div className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 items-end">
            <div className="col-span-6">
              <label className="block text-[11px] text-slate-600 font-medium mb-1">
                Pilih Material / Bahan
              </label>
              <select
                aria-label="Pilih Material"
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Material --</option>
                {catalogMaterials.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    [{m.sku || m.code || m.id.slice(0, 6)}] {m.name} (Stok: {m.stock || 0}{" "}
                    {m.unit || "PCS"})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-[11px] text-slate-600 font-medium mb-1">
                Qty Diminta
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={itemQty}
                onChange={(e) => setItemQty(parseFloat(e.target.value) || 0)}
                className="w-full text-xs border border-slate-300 rounded-lg p-1.5 text-right tabular-nums"
              />
            </div>
            <div className="col-span-3">
              <DnaButton
                variant="secondary"
                size="sm"
                className="w-full"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={onAddItem}
              >
                Tambah
              </DnaButton>
            </div>
          </div>
        </div>

        {/* Cart Table */}
        {cartItems.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <DnaTable className="w-full text-left text-xs text-slate-600">
              <DnaTableHead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                <DnaTableRow>
                  <DnaTh className="py-2 px-3">Kode</DnaTh>
                  <DnaTh className="py-2 px-3">Nama Material</DnaTh>
                  <DnaTh className="py-2 px-3 text-right">Stok Real</DnaTh>
                  <DnaTh className="py-2 px-3 text-right">Qty Diminta</DnaTh>
                  <DnaTh className="py-2 px-3">Satuan</DnaTh>
                  <DnaTh className="py-2 px-3 text-center">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody className="divide-y divide-slate-100">
                {cartItems.map((c) => (
                  <DnaTableRow key={c.materialCode}>
                    <DnaTd className="py-2 px-3 font-medium text-indigo-600 tabular-nums">
                      {c.materialCode}
                    </DnaTd>
                    <DnaTd className="py-2 px-3 font-semibold text-slate-800">
                      {c.materialName}
                    </DnaTd>
                    <DnaTd className="py-2 px-3 text-right tabular-nums text-slate-600">
                      {c.availableStock}
                    </DnaTd>
                    <DnaTd className="py-2 px-3 text-right font-bold text-indigo-700 tabular-nums">
                      {c.requestedQty}
                    </DnaTd>
                    <DnaTd className="py-2 px-3 text-slate-500">{c.unit}</DnaTd>
                    <DnaTd className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(c.materialCode)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}
      </div>
    </DnaModal>
  );
};
