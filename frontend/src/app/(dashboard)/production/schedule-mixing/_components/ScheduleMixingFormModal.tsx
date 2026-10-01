"use client";

import React from "react";
import { DnaModal, DnaButton } from "@/components/dna";
import { ScheduleMixingFormData } from "../_types/schedule-mixing.types";

interface ScheduleMixingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ScheduleMixingFormData;
  setFormData: React.Dispatch<React.SetStateAction<ScheduleMixingFormData>>;
  baseResult: number;
  calculatedUpscale: number;
  onSubmit: (e: React.FormEvent) => void;
}

export function ScheduleMixingFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  baseResult,
  calculatedUpscale,
  onSubmit,
}: ScheduleMixingFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Jadwal Pra-Produksi Mixing"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Batch Record *
            </label>
            <select
              value={formData.batchRecord}
              onChange={(e) => setFormData({ ...formData, batchRecord: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
            >
              <option value="BR-2026-0001">BR-2026-0001 (Farah Derma - Day Cream)</option>
              <option value="BR-2026-0002">BR-2026-0002 (K-Skin Men - Facial Foam)</option>
              <option value="BR-2026-0003">BR-2026-0003 (Anita Aesthetics - Aloe Gel)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Jadwal Mixing *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Qty (PCS) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.targetPcs}
              onChange={(e) => setFormData({ ...formData, targetPcs: Number(e.target.value) })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Netto per PCS (gr/ml) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.nettoPerPcs}
              onChange={(e) => setFormData({ ...formData, nettoPerPcs: Number(e.target.value) })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Base Result (Otomatis: Target Ã— Netto)
            </label>
            <input
              type="text"
              readOnly
              value={`${baseResult.toFixed(2)} kg`}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-100 font-bold text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upscale (%) *
            </label>
            <input
              type="number"
              min="0"
              max="50"
              required
              value={formData.upscalePercent}
              onChange={(e) => setFormData({ ...formData, upscalePercent: Number(e.target.value) })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-bold text-blue-600"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hasil Upscale Total Produksi (Otomatis: Base + Upscale)
            </label>
            <input
              type="text"
              readOnly
              value={`${calculatedUpscale.toFixed(2)} kg`}
              className="w-full text-xs border border-blue-200 rounded-lg p-2.5 bg-blue-50 font-bold text-blue-800 text-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan & Instruksi Khusus Mixing
          </label>
          <textarea
            rows={2}
            placeholder="Instruksi suhu fasa air, kecepatan homogenizer, urutan bahan..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <DnaButton
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Batal
          </DnaButton>
          <DnaButton type="submit" variant="primary">
            Simpan Jadwal Mixing
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
