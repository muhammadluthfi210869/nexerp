"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { DnaModal, DnaButton, DnaInput, DnaSelect } from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import type { PRItemDetail, PRPriority, PRRequesterRole } from "../_types/purchase-requests.types";

interface PrFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formDept: string;
  setFormDept: (val: string) => void;
  formCoa: string;
  setFormCoa: (val: string) => void;
  formRequester: string;
  setFormRequester: (val: string) => void;
  formRole: PRRequesterRole;
  setFormRole: (val: PRRequesterRole) => void;
  formPriority: PRPriority;
  setFormPriority: (val: PRPriority) => void;
  cartItems: PRItemDetail[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, field: keyof PRItemDetail, val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PrFormModal({
  isOpen,
  onClose,
  formDept,
  setFormDept,
  formCoa,
  setFormCoa,
  formRequester,
  setFormRequester,
  formRole,
  setFormRole,
  formPriority,
  setFormPriority,
  cartItems,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onSubmit,
}: PrFormModalProps) {
  return (
    <DnaModal isOpen={isOpen} onClose={onClose} title="Buat Permintaan Pembelian (PR)" size="lg">
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Departemen Pengaju *</label>
            <DnaSelect
              options={[
                { value: "Produksi Pabrik", label: "Produksi Pabrik" },
                { value: "Packaging & Finishing", label: "Packaging & Finishing" },
                { value: "R&D Formulation Lab", label: "R&D Formulation Lab" },
                { value: "Quality Control (QC)", label: "Quality Control (QC)" },
                { value: "Gudang & Logistik", label: "Gudang & Logistik" },
              ]}
              value={formDept}
              onChange={(val) => setFormDept(val)}
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Kategori Pengadaan (COA) *</label>
            <DnaSelect
              options={[
                { value: "110401 - Persediaan Bahan Baku", label: "110401 - Persediaan Bahan Baku" },
                { value: "110402 - Persediaan Bahan Kemas", label: "110402 - Persediaan Bahan Kemas" },
                { value: "510201 - Perlengkapan & Reagen QC", label: "510201 - Perlengkapan & Reagen QC" },
              ]}
              value={formCoa}
              onChange={(val) => setFormCoa(val)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nama PIC Pengaju *</label>
            <DnaInput value={formRequester} onChange={(e) => setFormRequester(e.target.value)} />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Jenjang Jabatan *</label>
            <DnaSelect
              options={[
                { value: "STAFF", label: "Staff (Butuh Approval Head)" },
                { value: "HEAD", label: "Head Departemen (Langsung ke Finance/Dir)" },
              ]}
              value={formRole}
              onChange={(val) => setFormRole(val as PRRequesterRole)}
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Prioritas *</label>
            <DnaSelect
              options={[
                { value: "LOW", label: "Low (Rutin Bulanan)" },
                { value: "MEDIUM", label: "Medium (Batch Berikutnya)" },
                { value: "URGENT", label: "Urgent (Stok Kritis Produksi)" },
              ]}
              value={formPriority}
              onChange={(val) => setFormPriority(val as PRPriority)}
            />
          </div>
        </div>

        {/* Dynamic Multi-line Cart */}
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 uppercase text-[10px]">
              Keranjang Item Barang / Bahan ({cartItems.length})
            </span>
            <DnaButton type="button" size="sm" variant="secondary" onClick={onAddItem}>
              + Tambah Baris Bahan
            </DnaButton>
          </div>

          <div className="space-y-2">
            {cartItems.map((item, idx) => (
              <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                <div className="flex-1">
                  <DnaInput
                    placeholder="Nama Bahan Baku / Kemasan"
                    value={item.materialName}
                    onChange={(e) => onUpdateItem(item.id, "materialName", e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <DnaInput
                    type="number"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => onUpdateItem(item.id, "qty", Number(e.target.value))}
                  />
                </div>
                <div className="w-20">
                  <DnaSelect
                    options={[
                      { value: "kg", label: "kg" },
                      { value: "gram", label: "gram" },
                      { value: "pcs", label: "pcs" },
                      { value: "pack", label: "pack" },
                    ]}
                    value={item.unit}
                    onChange={(val) => onUpdateItem(item.id, "unit", val)}
                  />
                </div>
                <div className="w-32">
                  <DnaInput
                    type="number"
                    placeholder="Est. Harga"
                    value={item.estimatedPrice}
                    onChange={(e) => onUpdateItem(item.id, "estimatedPrice", Number(e.target.value))}
                  />
                </div>
                <div className="w-28 text-right font-bold text-blue-600 tabular-nums text-[11px]">
                  {formatCurrency(item.subtotal)}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
            <span className="font-bold text-slate-600">Total Estimasi Anggaran PR:</span>
            <span className="text-sm font-black text-blue-600 tabular-nums">
              {formatCurrency(cartItems.reduce((sum, it) => sum + it.subtotal, 0))}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <DnaButton type="button" variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton type="submit" variant="primary">
            Ajukan Permintaan Pembelian
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
