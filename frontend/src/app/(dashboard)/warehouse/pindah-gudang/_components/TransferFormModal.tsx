import React from "react";
import { Send, Trash2, Plus } from "lucide-react";
import {
  DnaModal,
  DnaButton,
  DnaSelect,
  DnaInput,
  DnaTextarea,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { generateAutoDocNumber } from "@/lib/document-number";
import type {
  TransferCartItem,
  AvailableCatalogItem,
} from "../_types/pindah-gudang.types";

interface TransferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseOptions: string[];
  fromWarehouse: string;
  onFromWarehouseChange: (val: string) => void;
  toWarehouse: string;
  onToWarehouseChange: (val: string) => void;
  referenceDoc: string;
  onReferenceDocChange: (val: string) => void;
  notes: string;
  onNotesChange: (val: string) => void;
  availableItems: AvailableCatalogItem[];
  cartItems: TransferCartItem[];
  selectedMaterialCode: string;
  onSelectMaterialCode: (val: string) => void;
  inputQty: number;
  onInputQtyChange: (val: number) => void;
  onAddItem: () => void;
  onRemoveItem: (code: string) => void;
  onSubmit: () => void;
}

export function TransferFormModal({
  isOpen,
  onClose,
  warehouseOptions,
  fromWarehouse,
  onFromWarehouseChange,
  toWarehouse,
  onToWarehouseChange,
  referenceDoc,
  onReferenceDocChange,
  notes,
  onNotesChange,
  availableItems,
  cartItems,
  selectedMaterialCode,
  onSelectMaterialCode,
  inputQty,
  onInputQtyChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
}: TransferFormModalProps) {
  const selectedItemObj = availableItems.find(
    (i) => i.code === selectedMaterialCode
  );

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Dokumen Transfer Antar Gudang"
      description="Penerbitan surat perintah pemindahan fisik barang antar lokasi gudang atau unit produksi."
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
            Terbitkan Transfer SPK
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Origin & Destination Warehouse */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Gudang Asal (Pengirim) *
            </label>
            <DnaSelect
              aria-label="Gudang Asal"
              value={fromWarehouse}
              onChange={onFromWarehouseChange}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
            >
              {warehouseOptions.map((wh) => (
                <option key={`from-${wh}`} value={wh}>
                  {wh}
                </option>
              ))}
            </DnaSelect>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Gudang Tujuan (Penerima) *
            </label>
            <DnaSelect
              aria-label="Gudang Tujuan"
              value={toWarehouse}
              onChange={onToWarehouseChange}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
            >
              {warehouseOptions.map((wh) => (
                <option key={`to-${wh}`} value={wh}>
                  {wh}
                </option>
              ))}
            </DnaSelect>
          </div>
        </div>

        {/* Reference Document */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-700 font-bold">
              No. Dokumen Referensi (SPK / Memo Produksi) *
            </label>
            <button
              type="button"
              onClick={() => onReferenceDocChange(generateAutoDocNumber("SPK"))}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
            >
              + Auto No. Ref SPK
            </button>
          </div>
          <DnaInput
            type="text"
            placeholder="Contoh: SPK-202609-0045"
            value={referenceDoc}
            onChange={(e) => onReferenceDocChange(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums"
          />
        </div>

        {/* Add Item to Transfer Cart */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Tambah Material / Produk yang Dipindahkan
          </div>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-7">
              <label className="block text-slate-600 text-[11px] mb-1">
                Pilih Material (Stok Gudang Asal)
              </label>
              <DnaSelect
                aria-label="Pilih Material"
                value={selectedMaterialCode}
                onChange={onSelectMaterialCode}
                className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-medium"
              >
                <option value="">-- Pilih Material dari Katalog --</option>
                {availableItems.map((it) => (
                  <option key={it.code} value={it.code}>
                    {it.code} - {it.name} (Stok: {it.stock} {it.unit})
                  </option>
                ))}
              </DnaSelect>
            </div>
            <div className="col-span-3">
              <label className="block text-slate-600 text-[11px] mb-1">
                Qty Transfer ({selectedItemObj?.unit || "Unit"})
              </label>
              <DnaInput
                type="number"
                min={1}
                max={selectedItemObj?.stock || 999999}
                placeholder="Qty"
                value={inputQty || ""}
                onChange={(e) => onInputQtyChange(Number(e.target.value))}
                className="w-full text-xs border border-slate-300 rounded-lg p-1.5 tabular-nums text-right"
              />
            </div>
            <div className="col-span-2">
              <DnaButton
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={onAddItem}
                className="w-full h-8 text-xs font-semibold"
              >
                Tambah
              </DnaButton>
            </div>
          </div>
        </div>

        {/* Cart Table */}
        <div className="space-y-1.5">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Daftar Barang Transfer ({cartItems.length} Item)
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
            <DnaTable className="w-full text-left text-xs">
              <DnaTableHead>
                <DnaTableRow className="bg-slate-50/90 text-[10px] uppercase font-bold text-slate-600">
                  <DnaTh className="px-3 py-2">Material</DnaTh>
                  <DnaTh className="px-3 py-2">Batch / Lot</DnaTh>
                  <DnaTh className="px-3 py-2 text-right">Qty Transfer</DnaTh>
                  <DnaTh className="px-3 py-2 text-right w-12">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {cartItems.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={4} className="py-6 text-center text-slate-400">
                      Belum ada item material yang dimasukkan ke daftar transfer.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  cartItems.map((c) => (
                    <DnaTableRow key={c.materialCode}>
                      <DnaTd className="px-3 py-2">
                        <div className="font-semibold text-slate-800">{c.materialName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.materialCode}</div>
                      </DnaTd>
                      <DnaTd className="px-3 py-2 font-mono text-slate-600">{c.batchLot}</DnaTd>
                      <DnaTd className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
                        {c.transferQty.toLocaleString("id-ID")} {c.unit}
                      </DnaTd>
                      <DnaTd className="px-3 py-2 text-right">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(c.materialCode)}
                          className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </DnaButton>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">Catatan Mutasi / Serah Terima</label>
          <DnaTextarea
            placeholder="Keterangan tambahan keperluan produksi, instruksi penanganan khusus, dll."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
            className="w-full text-xs border border-slate-300 rounded-lg p-2"
          />
        </div>
      </div>
    </DnaModal>
  );
}
