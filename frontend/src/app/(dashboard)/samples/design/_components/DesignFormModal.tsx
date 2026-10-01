"use client";

import React from "react";
import { X } from "lucide-react";
import { DnaButton, DnaTextarea } from "@/components/dna";
import {
  AvailableSalesOrder,
  DesignFormData,
  TASK_TYPES,
} from "../_types/design.types";

interface DesignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: DesignFormData;
  setFormData: React.Dispatch<React.SetStateAction<DesignFormData>>;
  salesOrders: AvailableSalesOrder[];
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function DesignFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  salesOrders,
  onSubmit,
  isPending,
}: DesignFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Buat Task Desain Kemasan</h3>
            <p className="text-xs text-slate-500">
              Task dibuat dari Sales Order aktif; leadId dan batas SLA ditetapkan server.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Sales Order <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.soId}
              onChange={(e) => setFormData({ ...formData, soId: e.target.value })}
              className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 font-medium"
            >
              <option value="">â€” Pilih Sales Order â€”</option>
              {salesOrders.map((so) => (
                <option key={so.id} value={so.id}>
                  {so.orderNumber} â€¢ {so.lead?.clientName || "â€”"} ({so.brandName || so.lead?.brandName || "â€”"})
                </option>
              ))}
            </select>
            {salesOrders.length === 0 && (
              <p className="text-[11px] text-amber-700 mt-1">
                Tidak ada Sales Order aktif (PENDING_DP / ACTIVE) yang dapat dipilih, atau Anda tidak
                memiliki akses ke daftar ini.
              </p>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Tipe Task <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.taskType}
              onChange={(e) =>
                setFormData({ ...formData, taskType: e.target.value as (typeof TASK_TYPES)[number] })
              }
              className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 font-medium"
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Brief Desain <span className="text-rose-500">*</span>
            </label>
            <DnaTextarea
              required
              rows={4}
              placeholder="Contoh: Label 85x35mm, inner box foil emas, klaim dermatologis sesuai arahan regulasi..."
              value={formData.brief}
              onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <DnaButton type="button" variant="outline" onClick={onClose}>
              Kembali
            </DnaButton>
            <DnaButton type="submit" variant="primary" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Task Desain"}
            </DnaButton>
          </div>
        </form>
      </div>
    </div>
  );
}
