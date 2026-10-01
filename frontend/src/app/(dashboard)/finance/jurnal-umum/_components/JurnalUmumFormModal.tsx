"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { DnaModal, DnaInput, DnaButton, formatRupiah } from "@/components/dna";
import {
  JournalHeaderForm,
  JournalLineForm,
  AccountOption,
} from "../_types/jurnal-umum.types";

interface JurnalUmumFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  headerForm: JournalHeaderForm;
  setHeaderForm: React.Dispatch<React.SetStateAction<JournalHeaderForm>>;
  linesForm: JournalLineForm[];
  setLinesForm: React.Dispatch<React.SetStateAction<JournalLineForm[]>>;
  accounts: AccountOption[];
  formTotalDebit: number;
  formTotalCredit: number;
  isFormBalanced: boolean;
  addRow: () => void;
  removeRow: (index: number) => void;
  handleSaveJournal: () => void;
  isPending: boolean;
}

export function JurnalUmumFormModal({
  isOpen,
  onClose,
  headerForm,
  setHeaderForm,
  linesForm,
  setLinesForm,
  accounts,
  formTotalDebit,
  formTotalCredit,
  isFormBalanced,
  addRow,
  removeRow,
  handleSaveJournal,
  isPending,
}: JurnalUmumFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Jurnal Umum Baru (Double-Entry)"
      size="lg"
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tanggal Transaksi *</label>
            <DnaInput
              type="date"
              value={headerForm.date}
              onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Nomor Referensi Dokumen</label>
            <DnaInput
              placeholder="Misal: MEMO-2609-01 atau BUKTI-KAS-01"
              value={headerForm.reference}
              onChange={(e) => setHeaderForm({ ...headerForm, reference: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Keterangan / Deskripsi Jurnal *</label>
          <DnaInput
            placeholder="Misal: Penyesuaian Biaya Sewa atau Reklasifikasi Kas"
            value={headerForm.description}
            onChange={(e) => setHeaderForm({ ...headerForm, description: e.target.value })}
          />
        </div>

        <div className="border border-slate-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">Rincian Baris Debit & Kredit</span>
            <DnaButton variant="secondary" size="sm" onClick={addRow}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Tambah Baris
            </DnaButton>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {linesForm.map((line, idx) => (
              <div key={line.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="col-span-4">
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Akun COA</label>
                  <select
                    value={line.accountCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = accounts.find((a: any) => a.code === val || a.id === val);
                      const next = [...linesForm];
                      next[idx].accountCode = matched?.code || val;
                      next[idx].accountName = matched?.name || "Akun Terpilih";
                      next[idx].accountId = matched?.id || val;
                      setLinesForm(next);
                    }}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white"
                  >
                    <option value="">â€” Pilih Akun â€”</option>
                    {accounts.map((a: any) => (
                      <option key={a.id || a.code} value={a.code}>
                        {a.code} â€” {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Keterangan Baris</label>
                  <DnaInput
                    placeholder="Memo baris"
                    value={line.lineDescription}
                    onChange={(e) => {
                      const next = [...linesForm];
                      next[idx].lineDescription = e.target.value;
                      setLinesForm(next);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-emerald-600 font-semibold block mb-0.5">Debit (Rp)</label>
                  <DnaInput
                    type="number"
                    value={line.debit || ""}
                    onChange={(e) => {
                      const next = [...linesForm];
                      next[idx].debit = Number(e.target.value) || 0;
                      setLinesForm(next);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-rose-600 font-semibold block mb-0.5">Kredit (Rp)</label>
                  <DnaInput
                    type="number"
                    value={line.credit || ""}
                    onChange={(e) => {
                      const next = [...linesForm];
                      next[idx].credit = Number(e.target.value) || 0;
                      setLinesForm(next);
                    }}
                  />
                </div>
                <div className="col-span-1 text-center pt-3">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Hapus Baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg font-bold text-xs mt-2">
            <span className="text-slate-700">Total Debit & Kredit:</span>
            <div className="flex gap-4">
              <span className="text-emerald-700">Dr: {formatRupiah(formTotalDebit)}</span>
              <span className="text-rose-700">Cr: {formatRupiah(formTotalCredit)}</span>
              <span className={isFormBalanced ? "text-emerald-600 font-extrabold" : "text-amber-600 font-extrabold"}>
                {isFormBalanced ? "BALANCED" : `SELISIH: ${formatRupiah(Math.abs(formTotalDebit - formTotalCredit))}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="md"
            onClick={handleSaveJournal}
            disabled={isPending || !isFormBalanced}
          >
            {isPending ? "Menyimpan..." : "Posting Jurnal"}
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
