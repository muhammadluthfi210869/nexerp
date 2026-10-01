"use client";

import React from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { DnaButton, DnaInput } from "@/components/dna";
import {
  OperationalLeadItem,
  AVAILABLE_RECEIVERS,
} from "../_types/crm-leads.types";

interface CreateLeadBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  formTanggal: string;
  setFormTanggal: (val: string) => void;
  formCatatan: string;
  setFormCatatan: (val: string) => void;
  formItems: OperationalLeadItem[];
  onAddFormItem: () => void;
  onRemoveFormItem: (index: number) => void;
  onItemChange: (index: number, field: keyof OperationalLeadItem, val: any) => void;
  onSaveBatch: (e: React.FormEvent) => void;
}

export function CreateLeadBatchModal({
  isOpen,
  onClose,
  formTanggal,
  setFormTanggal,
  formCatatan,
  setFormCatatan,
  formItems,
  onAddFormItem,
  onRemoveFormItem,
  onItemChange,
  onSaveBatch,
}: CreateLeadBatchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-slate-800 text-base">Buat Distribusi Leads Baru</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSaveBatch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Tanggal Leads <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                type="date"
                required
                value={formTanggal}
                onChange={(e) => setFormTanggal(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Catatan</label>
              <DnaInput
                placeholder="Contoh: Leads Iklan TikTok Batch 1"
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Sub-tabel Keranjang Penerima Leads */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Daftar Alokasi Penerima</span>
              <button
                type="button"
                onClick={onAddFormItem}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Penerima
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase px-1">
                <span className="col-span-7">Penerima Leads *</span>
                <span className="col-span-4">Qty Leads *</span>
                <span className="col-span-1 text-center">Aksi</span>
              </div>

              {formItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-7">
                    <select
                      value={item.penerima}
                      onChange={(e) => onItemChange(idx, "penerima", e.target.value)}
                      className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 focus:outline-none"
                    >
                      {AVAILABLE_RECEIVERS.map((recv) => (
                        <option key={recv} value={recv}>
                          {recv}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <DnaInput
                      type="number"
                      min="1"
                      required
                      value={item.qty}
                      onChange={(e) => onItemChange(idx, "qty", parseInt(e.target.value) || 0)}
                      className="h-8 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => onRemoveFormItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600">Total Qty Leads Terbagi:</span>
              <span className="text-blue-600">
                {formItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0)} Leads
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DnaButton
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Kembali
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Leads
            </DnaButton>
          </div>
        </form>
      </div>
    </div>
  );
}
