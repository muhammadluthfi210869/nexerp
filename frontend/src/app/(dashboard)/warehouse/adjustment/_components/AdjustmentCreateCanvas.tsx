"use client";

import React, { useState, useMemo } from "react";
import {
  SlidersHorizontal,
  Building2,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Receipt,
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
  DnaBadge,
} from "@/components/dna";
import type {
  AdjustmentFormData,
  AdjustmentType,
  CatalogItemOption,
  AdjustmentItem,
} from "../_types/adjustment.types";

interface AdjustmentCreateCanvasProps {
  onClose: () => void;
  formData: AdjustmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AdjustmentFormData>>;
  catalogOptions: CatalogItemOption[];
  onSubmit: () => void;
}

export function AdjustmentCreateCanvas({
  onClose,
  formData,
  setFormData,
  catalogOptions,
  onSubmit,
}: AdjustmentCreateCanvasProps) {
  const [selectedItemCode, setSelectedItemCode] = useState<string>("");
  const [actualQty, setActualQty] = useState<number>(0);
  const [itemNotes, setItemNotes] = useState<string>("");

  const selectedCatalog = useMemo(() => {
    return catalogOptions.find((c) => c.code === selectedItemCode) || null;
  }, [catalogOptions, selectedItemCode]);

  const handleAddItem = () => {
    if (!selectedCatalog) return;

    const systemQty = selectedCatalog.currentStock;
    const diff = actualQty - systemQty;
    const hpp = selectedCatalog.hpp;

    const newItem: AdjustmentItem = {
      itemCode: selectedCatalog.code,
      itemName: selectedCatalog.name,
      batchLot: selectedCatalog.batch || "LOT-SYS",
      systemQty: systemQty,
      actualQty: actualQty,
      differenceQty: diff,
      unit: selectedCatalog.unit,
      unitHpp: hpp,
      varianceValuation: diff * hpp,
      itemNotes: itemNotes || undefined,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items.filter((i) => i.itemCode !== selectedCatalog.code), newItem],
    }));

    setSelectedItemCode("");
    setActualQty(0);
    setItemNotes("");
  };

  const handleRemoveItem = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.itemCode !== code),
    }));
  };

  const totalVarianceValuation = useMemo(() => {
    return formData.items.reduce((sum, it) => sum + it.varianceValuation, 0);
  }, [formData.items]);

  const totalVarianceQty = useMemo(() => {
    return formData.items.reduce((sum, it) => sum + it.differenceQty, 0);
  }, [formData.items]);

  return (
    <div className="space-y-6">
      {/* Header Canvas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-semibold text-zinc-900">Form Pengajuan Penyesuaian Stok (Stock Adjustment)</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
              ADJ-{new Date().getFullYear()}-XXXX
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Koreksi stok fisik gudang terhadap sistem dengan jurnal penyesuaian otomatis pasca otorisasi Finance.
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
            disabled={formData.items.length === 0}
          >
            Ajukan Penyesuaian Stok
          </DnaButton>
        </div>
      </div>

      {/* 2-Column Upper Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Gudang & Klasifikasi */}
        <DnaCard className="p-5 space-y-4 border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <Building2 className="w-4 h-4 text-zinc-900" />
              1. Lokasi Gudang & Klasifikasi Akuntansi
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Lokasi Gudang *
              </label>
              <DnaSelect
                value={formData.warehouseCode}
                onChange={(val) => {
                  let name = "WH-01 Gudang Bahan Baku";
                  if (val === "WH-02") name = "WH-02 Gudang Kemas & Box";
                  if (val === "WH-03") name = "WH-03 Gudang Produk Jadi";
                  if (val === "WH-04") name = "WH-04 Gudang Karantina & QC";
                  setFormData({ ...formData, warehouseCode: val, warehouseName: name });
                }}
                options={[
                  { label: "WH-01 Gudang Bahan Baku Utama", value: "WH-01" },
                  { label: "WH-02 Gudang Kemas & Box", value: "WH-02" },
                  { label: "WH-03 Gudang Produk Jadi", value: "WH-03" },
                  { label: "WH-04 Gudang Karantina & QC", value: "WH-04" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Tipe Penyesuaian *
              </label>
              <DnaSelect
                value={formData.adjustmentType}
                onChange={(val) =>
                  setFormData({ ...formData, adjustmentType: val as AdjustmentType })
                }
                options={[
                  { label: "Koreksi Selisih Hitung (Opname)", value: "CORRECTION" },
                  { label: "Write-Off Kerusakan Material", value: "WRITE_OFF" },
                  { label: "Pemusnahan Limbah Kedaluwarsa", value: "DISPOSAL" },
                  { label: "Pengambilan Sampel QC Laboratorium", value: "QC_SAMPLING" },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Akun Beban / Selisih (CoA) *
            </label>
            <DnaSelect
              value={formData.adjustmentAccountCode}
              onChange={(val) => {
                let name = "Beban Selisih Stok Persediaan";
                if (val === "510502") name = "Beban Kerusakan & Write-Off";
                if (val === "510503") name = "Beban Pemusnahan Limbah";
                if (val === "510504") name = "Beban Sampling QC";
                setFormData({
                  ...formData,
                  adjustmentAccountCode: val,
                  adjustmentAccountName: `${val} - ${name}`,
                });
              }}
              options={[
                { label: "510501 - Beban Selisih Stok Persediaan", value: "510501" },
                { label: "510502 - Beban Kerusakan & Write-Off", value: "510502" },
                { label: "510503 - Beban Pemusnahan Limbah", value: "510503" },
                { label: "510504 - Beban Sampling QC", value: "510504" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Alasan / Keterangan Penyesuaian
            </label>
            <DnaInput
              placeholder="Jelaskan alasan terjadinya selisih fisik gudang atau disposal..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </DnaCard>

        {/* Right Column: Input Item Material & Opname */}
        <DnaCard className="p-5 space-y-4 border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <Package className="w-4 h-4 text-zinc-900" />
              2. Input Material & Perhitungan Fisik
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Pilih Material dari Master / Katalog *
            </label>
            <DnaSelect
              placeholder="-- Cari Material --"
              value={selectedItemCode}
              onChange={setSelectedItemCode}
              options={catalogOptions.map((c) => ({
                label: `${c.code} — ${c.name} (Sistem: ${c.currentStock} ${c.unit})`,
                value: c.code,
              }))}
            />
          </div>

          {selectedCatalog && (
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs grid grid-cols-3 gap-2">
              <div>
                <span className="text-zinc-500 block text-[11px]">Stok Sistem</span>
                <span className="font-semibold text-zinc-900 block mt-0.5">
                  {selectedCatalog.currentStock} {selectedCatalog.unit}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">HPP Satuan</span>
                <span className="font-semibold text-zinc-900 block mt-0.5">
                  Rp {selectedCatalog.hpp.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">No. Batch</span>
                <span className="font-mono text-zinc-600 block mt-0.5">{selectedCatalog.batch}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Qty Aktual Fisik Terhitung *
              </label>
              <DnaInput
                type="number"
                min="0"
                value={actualQty}
                onChange={(e) => setActualQty(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Keterangan Item / Batch
              </label>
              <DnaInput
                placeholder="Contoh: Kemasan bocor"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />
            </div>
          </div>

          {selectedCatalog && (
            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
              <div>
                <span className="text-zinc-600">Selisih Hitung: </span>
                <span
                  className={`font-semibold ${
                    actualQty - selectedCatalog.currentStock >= 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {actualQty - selectedCatalog.currentStock > 0 ? "+" : ""}
                  {actualQty - selectedCatalog.currentStock} {selectedCatalog.unit}
                </span>
              </div>
              <div>
                <span className="text-zinc-600">Valuasi: </span>
                <span className="font-semibold text-zinc-900">
                  Rp {((actualQty - selectedCatalog.currentStock) * selectedCatalog.hpp).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          )}

          <DnaButton
            variant="primary"
            size="md"
            className="w-full"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddItem}
            disabled={!selectedItemCode}
          >
            + Tambahkan Item ke Daftar Penyesuaian
          </DnaButton>
        </DnaCard>
      </div>

      {/* Bottom Full-Width Table */}
      <DnaCard className="p-5 space-y-4 border border-zinc-200">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
            <Receipt className="w-4 h-4 text-zinc-900" />
            3. Rincian Barang yang Disesuaikan ({formData.items.length} Item)
          </div>
          {formData.items.length > 0 && (
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span>
                Total Selisih Qty:{" "}
                <span className="text-zinc-900 font-bold">{totalVarianceQty}</span> Unit
              </span>
              <span>
                Net Valuasi:{" "}
                <span
                  className={`font-bold ${
                    totalVarianceValuation >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  Rp {totalVarianceValuation.toLocaleString("id-ID")}
                </span>
              </span>
            </div>
          )}
        </div>

        {formData.items.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            Belum ada item material dalam pengajuan adjustment ini. Pilih material di atas dan klik "+ Tambahkan Item".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-2.5 px-3 w-[50px] text-center">No</DnaTh>
                  <DnaTh className="py-2.5 px-3 w-[140px]">Kode Barang</DnaTh>
                  <DnaTh className="py-2.5 px-3">Nama Material</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[110px]">Qty Sistem</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[110px]">Qty Aktual</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[120px]">Selisih Qty</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[140px]">Valuasi HPP (Rp)</DnaTh>
                  <DnaTh className="py-2.5 px-3 min-w-[150px]">Keterangan</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right w-[70px]">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {formData.items.map((it, idx) => (
                  <DnaTableRow key={it.itemCode} className="hover:bg-slate-50/60">
                    <DnaTd className="py-2.5 px-3 text-center font-mono text-xs text-slate-400">
                      {idx + 1}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 font-mono text-xs font-bold text-slate-700">
                      {it.itemCode}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 font-medium text-xs text-slate-900">
                      {it.itemName}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right text-xs tabular-nums text-slate-600">
                      {it.systemQty.toLocaleString("id-ID")} {it.unit}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right text-xs tabular-nums font-bold text-slate-900">
                      {it.actualQty.toLocaleString("id-ID")} {it.unit}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right text-xs tabular-nums">
                      <span
                        className={`font-bold ${
                          it.differenceQty >= 0 ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {it.differenceQty > 0 ? `+${it.differenceQty}` : it.differenceQty} {it.unit}
                      </span>
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right text-xs tabular-nums font-bold">
                      <span
                        className={
                          it.varianceValuation >= 0 ? "text-emerald-700" : "text-rose-600"
                        }
                      >
                        Rp {it.varianceValuation.toLocaleString("id-ID")}
                      </span>
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-xs text-slate-500">
                      {it.itemNotes || "-"}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.itemCode)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
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
