"use client";

import React from "react";
import {
  ArrowRightLeft,
  Building2,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import {
  DnaCard,
  DnaButton,
  DnaSelect,
  DnaInput,
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

interface TransferCreateCanvasProps {
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

export function TransferCreateCanvas({
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
}: TransferCreateCanvasProps) {
  const selectedItemObj = availableItems.find(
    (i) => i.code === selectedMaterialCode
  );

  const totalKoli = cartItems.reduce((sum, item) => sum + (item.transferQty || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Canvas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
              <ArrowRightLeft className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-semibold text-zinc-900">Buat Dokumen Transfer Antar Gudang</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
              TRF-{new Date().getFullYear()}-XXXX
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Penerbitan surat perintah pemindahan fisik barang antar lokasi gudang dengan 2-step handover tracking (In Transit ke Verified).
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={onSubmit}
            disabled={cartItems.length === 0}
          >
            Terbitkan Transfer SPK
          </DnaButton>
        </div>
      </div>

      {/* 2-Column Upper Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Rute & Lokasi Gudang */}
        <DnaCard className="p-5 space-y-4 border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <Building2 className="w-4 h-4 text-zinc-900" />
              1. Rute Gudang & Dokumen Referensi
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Gudang Asal (Pengirim) *
              </label>
              <DnaSelect
                value={fromWarehouse}
                onChange={onFromWarehouseChange}
                options={warehouseOptions.map((wh) => ({ label: wh, value: wh }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Gudang Tujuan (Penerima) *
              </label>
              <DnaSelect
                value={toWarehouse}
                onChange={onToWarehouseChange}
                options={warehouseOptions.map((wh) => ({ label: wh, value: wh }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              No. Dokumen Referensi (SPK / Memo)
            </label>
            <DnaInput
              placeholder="Auto: SPK-202609-XXXX"
              value={referenceDoc}
              onChange={(e) => onReferenceDocChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Keperluan / Catatan Pemindahan
            </label>
            <DnaInput
              placeholder="Contoh: Pemindahan raw material untuk batch produksi LOT-2026-A"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>
        </DnaCard>

        {/* Right Column: Pemilihan & Input Material */}
        <DnaCard className="p-5 space-y-4 border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <Package className="w-4 h-4 text-zinc-900" />
              2. Pilih Material & Kuantitas
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Pilih Material dari Gudang Asal *
            </label>
            <DnaSelect
              placeholder="-- Pilih Material dari Katalog --"
              value={selectedMaterialCode}
              onChange={onSelectMaterialCode}
              options={availableItems.map((item) => ({
                label: `${item.code} — ${item.name} (Stok: ${item.stock} ${item.unit})`,
                value: item.code,
              }))}
            />
          </div>

          {selectedItemObj && (
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs grid grid-cols-3 gap-2">
              <div>
                <span className="text-zinc-500 block text-[11px]">Nama Item</span>
                <span className="font-semibold text-zinc-900 block truncate">{selectedItemObj.name}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Stok Tersedia</span>
                <span className="font-semibold text-emerald-700 block">
                  {selectedItemObj.stock} {selectedItemObj.unit}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">No. Batch/Lot</span>
                <span className="font-mono text-zinc-700 block">{selectedItemObj.lot}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 items-end">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Kuantitas Transfer ({selectedItemObj?.unit || "Unit"}) *
              </label>
              <DnaInput
                type="number"
                min={1}
                max={selectedItemObj?.stock || 999999}
                value={inputQty || ""}
                onChange={(e) => onInputQtyChange(parseFloat(e.target.value) || 0)}
                placeholder="Jumlah unit..."
              />
            </div>
            <div>
              <DnaButton
                variant="primary"
                size="md"
                className="w-full"
                icon={<Plus className="w-4 h-4" />}
                onClick={onAddItem}
                disabled={!selectedMaterialCode || inputQty <= 0 || (selectedItemObj && inputQty > selectedItemObj.stock)}
              >
                + Tambah
              </DnaButton>
            </div>
          </div>
        </DnaCard>
      </div>

      {/* Bottom Full-Width Table: Daftar Item Ditransfer */}
      <DnaCard className="p-5 space-y-4 border border-zinc-200">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
            <FileSpreadsheet className="w-4 h-4 text-zinc-900" />
            3. Rincian Item Barang Dalam Surat Perintah Transfer ({cartItems.length} Material)
          </div>
          {cartItems.length > 0 && (
            <span className="text-xs font-semibold text-zinc-700">
              Total Fisik: <span className="text-zinc-900 font-bold">{totalKoli}</span> Unit
            </span>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs">
            Belum ada item material yang ditambahkan ke daftar transfer. Pilih material di atas dan klik "+ Tambah".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-2.5 px-3 w-[50px] text-center">No</DnaTh>
                  <DnaTh className="py-2.5 px-3 w-[140px]">Kode Barang</DnaTh>
                  <DnaTh className="py-2.5 px-3">Nama Material / Barang</DnaTh>
                  <DnaTh className="py-2.5 px-3 w-[150px]">No. Batch / Lot</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[140px]">Qty Transfer</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center w-[100px]">Satuan</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[80px]">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {cartItems.map((item, idx) => (
                  <DnaTableRow key={item.materialCode} className="hover:bg-zinc-50/60">
                    <DnaTd className="py-2.5 px-3 text-center font-mono text-xs text-zinc-400">
                      {idx + 1}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 font-mono text-xs font-semibold text-zinc-700">
                      {item.materialCode}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 font-medium text-xs text-zinc-900">
                      {item.materialName}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 font-mono text-xs text-zinc-500">
                      {item.batchLot}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right font-semibold text-xs tabular-nums text-zinc-900">
                      {item.transferQty.toLocaleString("id-ID")}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-center text-xs text-zinc-600">
                      {item.unit}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.materialCode)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}
      </DnaCard>
    </div>
  );
}
