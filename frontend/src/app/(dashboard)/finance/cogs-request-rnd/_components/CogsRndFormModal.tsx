"use client";

import React from "react";
import { X } from "lucide-react";
import { DnaButton, Input } from "@/components/dna";
import type { CogsFormData } from "../_types/cogs-request-rnd.types";

interface CogsRndFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: CogsFormData;
  setFormData: React.Dispatch<React.SetStateAction<CogsFormData>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function CogsRndFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}: CogsRndFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Buat Permintaan HPP Baru</h3>
            <p className="text-xs text-slate-500">Kalkulasi biaya pokok penjualan maklon (G-SERP Row 140)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Pelanggan <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={formData.pelanggan}
                onChange={(e) => setFormData({ ...formData, pelanggan: e.target.value })}
                className="h-8 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Tanggal Request <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="h-8 text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Sales Sample Ref</label>
              <Input
                value={formData.salesSample}
                onChange={(e) => setFormData({ ...formData, salesSample: e.target.value })}
                className="h-8 text-xs tabular-nums font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Formula Code</label>
              <Input
                value={formData.formula}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                className="h-8 text-xs tabular-nums font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Kemasan Primer</label>
              <Input
                value={formData.kemasanPrimer}
                onChange={(e) => setFormData({ ...formData, kemasanPrimer: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Kemasan Primer 2</label>
              <Input
                value={formData.kemasanPrimer2}
                onChange={(e) => setFormData({ ...formData, kemasanPrimer2: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Kemasan Sekunder</label>
              <Input
                value={formData.kemasanSekunder}
                onChange={(e) => setFormData({ ...formData, kemasanSekunder: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Netto Produk <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={formData.netto}
                onChange={(e) => setFormData({ ...formData, netto: e.target.value })}
                className="h-8 text-xs font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Jumlah Target MOQ (Pcs) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                required
                value={formData.jumlahMoq}
                onChange={(e) => setFormData({ ...formData, jumlahMoq: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs tabular-nums font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <DnaButton type="button" variant="outline" onClick={onClose}>
              Kembali
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Permintaan HPP
            </DnaButton>
          </div>
        </form>
      </div>
    </div>
  );
}
