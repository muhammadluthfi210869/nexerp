"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import type { DpCategory } from "../_types/down-payment.types";

interface DpFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formCategory: DpCategory;
  setFormCategory: (cat: DpCategory) => void;
  formCustomer: string;
  setFormCustomer: (val: string) => void;
  formBrand: string;
  setFormBrand: (val: string) => void;
  formRef: string;
  setFormRef: (val: string) => void;
  formBank: string;
  setFormBank: (val: string) => void;
  formAmount: string;
  setFormAmount: (val: string) => void;
  formNotes: string;
  setFormNotes: (val: string) => void;
}

export function DpFormModal({
  isOpen,
  onClose,
  onSubmit,
  formCategory,
  setFormCategory,
  formCustomer,
  setFormCustomer,
  formBrand,
  setFormBrand,
  formRef,
  setFormRef,
  formBank,
  setFormBank,
  formAmount,
  setFormAmount,
  formNotes,
  setFormNotes,
}: DpFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Penerimaan Uang Muka (Down Payment)"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Kategori Uang Muka *</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "sample", label: "Sample R&D" },
              { id: "legalitas", label: "Legalitas BPOM" },
              { id: "produksi", label: "Produksi (PO)" },
            ].map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setFormCategory(cat.id as DpCategory)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  formCategory === cat.id
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Nama Klien Pemesan *</label>
          <DnaInput
            placeholder="Contoh: PT Cantika Jelita Nusantara"
            value={formCustomer}
            onChange={(e) => setFormCustomer(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Nama Brand</label>
            <DnaInput
              placeholder="Contoh: C-Jelita Herbal"
              value={formBrand}
              onChange={(e) => setFormBrand(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Nomor Referensi (SO/SMP/BPOM)</label>
            <DnaInput
              placeholder="Contoh: SO-202609-0001"
              value={formRef}
              onChange={(e) => setFormRef(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jumlah DP (Rp) *</label>
            <DnaInput
              type="number"
              placeholder="Contoh: 10000000"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Kas / Bank Penerima</label>
            <select
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={formBank}
              onChange={(e) => setFormBank(e.target.value)}
            >
              <option value="BCA Maklon (264-035-1589)">BCA Maklon (264-035-1589)</option>
              <option value="Mandiri Corp (137-00-9821-44)">Mandiri Corp (137-00-9821-44)</option>
              <option value="Kas Utama Kantor">Kas Utama Kantor</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Catatan Penerimaan</label>
          <textarea
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Contoh: DP 50% produksi batch 1 serum brightening."
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton type="button" variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton type="submit" variant="primary">
            Simpan Uang Muka
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
