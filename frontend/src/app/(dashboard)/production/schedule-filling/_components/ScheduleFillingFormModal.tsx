"use client";

import React from "react";
import { DnaModal, DnaButton } from "@/components/dna";
import { ScheduleFillingFormData } from "../_types/schedule-filling.types";

interface ScheduleFillingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ScheduleFillingFormData;
  setFormData: React.Dispatch<React.SetStateAction<ScheduleFillingFormData>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function ScheduleFillingFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}: ScheduleFillingFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Jadwal Pra-Produksi Filling"
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
              Tanggal Jadwal Filling *
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
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData({ ...formData, targetPcs: val, packagingQty: Math.ceil(val * 1.02) });
              }}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kemasan Primer *
            </label>
            <select
              value={formData.primaryPackaging}
              onChange={(e) => setFormData({ ...formData, primaryPackaging: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
            >
              <option value="Pot Akrilik 15gr Putih">Pot Akrilik 15gr Putih</option>
              <option value="Tube Plastik 100ml Matte">Tube Plastik 100ml Matte</option>
              <option value="Jar Kaca 50gr Frost">Jar Kaca 50gr Frost</option>
              <option value="Botol Dropper Amber 20ml">Botol Dropper Amber 20ml</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Qty Kemasan Dibutuhkan (Termasuk Buffer 2%)
            </label>
            <input
              type="number"
              required
              value={formData.packagingQty}
              onChange={(e) => setFormData({ ...formData, packagingQty: Number(e.target.value) })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-bold text-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan & Instruksi Khusus Filling
          </label>
          <textarea
            rows={2}
            placeholder="Instruksi nozzle filling, pembersihan pipa transfer, suhu bulk..."
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
            Simpan Jadwal Filling
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
