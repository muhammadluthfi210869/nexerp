"use client";

import React from "react";
import {
  BookOpen,
  Calendar,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from "lucide-react";
import {
  DnaCard,
  DnaButton,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  formatRupiah,
} from "@/components/dna";
import { generateAutoDocNumber } from "@/lib/document-number";
import type {
  JournalHeaderForm,
  JournalLineForm,
  AccountOption,
} from "../_types/jurnal-umum.types";

interface JurnalUmumCreateCanvasProps {
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

export function JurnalUmumCreateCanvas({
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
}: JurnalUmumCreateCanvasProps) {
  const difference = Math.abs(formTotalDebit - formTotalCredit);

  return (
    <div className="space-y-6">
      {/* Header Canvas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Buat Jurnal Umum Baru (Double-Entry Manual)</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              🏷️ Auto-Number: JV-{new Date().getFullYear()}-XXXX
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan transaksi manual, penyesuaian akun buku besar, dan reklasifikasi dengan validasi keseimbangan Debit = Kredit.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <DnaButton variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={handleSaveJournal}
            disabled={isPending || !isFormBalanced || formTotalDebit <= 0 || linesForm.length === 0}
          >
            {isPending ? "Menyimpan..." : "Posting Jurnal ke Buku Besar"}
          </DnaButton>
        </div>
      </div>

      {/* 2-Column Upper Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Metadata Transaksi */}
        <DnaCard className="p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Calendar className="w-4 h-4 text-indigo-600" />
              1. Informasi Tanggal & Nomor Dokumen
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Transaksi *
              </label>
              <DnaInput
                type="date"
                value={headerForm.date}
                onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  No. Referensi Dokumen
                </label>
                <button
                  type="button"
                  onClick={() => setHeaderForm({ ...headerForm, reference: generateAutoDocNumber("JV") })}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  + Auto No. Ref
                </button>
              </div>
              <DnaInput
                placeholder="Misal: MEMO-2026-001"
                value={headerForm.reference}
                onChange={(e) => setHeaderForm({ ...headerForm, reference: e.target.value })}
              />
            </div>
          </div>
        </DnaCard>

        {/* Right Column: Uraian & Keterangan Transaksi */}
        <DnaCard className="p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <FileText className="w-4 h-4 text-emerald-600" />
              2. Keterangan / Deskripsi Transaksi
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi Lengkap Jurnal *
            </label>
            <DnaInput
              placeholder="Misal: Penyesuaian amortisasi biaya sewa kantor periode September 2026"
              value={headerForm.description}
              onChange={(e) => setHeaderForm({ ...headerForm, description: e.target.value })}
            />
          </div>
        </DnaCard>
      </div>

      {/* Bottom Full-Width Table: Rincian Baris Debit & Kredit */}
      <DnaCard className="p-5 space-y-4 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Scale className="w-4 h-4 text-indigo-600" />
            3. Rincian Baris Akun Debit & Kredit ({linesForm.length} Baris)
          </div>
          <DnaButton variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addRow}>
            Tambah Baris Akun
          </DnaButton>
        </div>

        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-2.5 px-3 w-[50px] text-center">No</DnaTh>
                <DnaTh className="py-2.5 px-3 min-w-[260px]">Akun Bagan Akun (CoA) *</DnaTh>
                <DnaTh className="py-2.5 px-3 min-w-[220px]">Keterangan Baris</DnaTh>
                <DnaTh className="py-2.5 px-3 text-right w-[180px] text-emerald-700 bg-emerald-50/50">
                  Debit (Rp)
                </DnaTh>
                <DnaTh className="py-2.5 px-3 text-right w-[180px] text-rose-700 bg-rose-50/50">
                  Kredit (Rp)
                </DnaTh>
                <DnaTh className="py-2.5 px-3 text-right w-[70px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {linesForm.map((line, idx) => (
                <DnaTableRow key={line.id || idx} className="hover:bg-slate-50/60">
                  <DnaTd className="py-2.5 px-3 text-center font-mono text-xs text-slate-400">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd className="py-2.5 px-3">
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
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Akun CoA --</option>
                      {accounts.map((a: any) => (
                        <option key={a.id || a.code} value={a.code}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>
                  </DnaTd>
                  <DnaTd className="py-2.5 px-3">
                    <input
                      type="text"
                      placeholder="Memo baris transaksi..."
                      value={line.lineDescription}
                      onChange={(e) => {
                        const next = [...linesForm];
                        next[idx].lineDescription = e.target.value;
                        setLinesForm(next);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </DnaTd>
                  <DnaTd className="py-2.5 px-3 bg-emerald-50/20">
                    <input
                      type="number"
                      min="0"
                      value={line.debit || ""}
                      onChange={(e) => {
                        const next = [...linesForm];
                        next[idx].debit = Number(e.target.value) || 0;
                        if (Number(e.target.value) > 0) next[idx].credit = 0;
                        setLinesForm(next);
                      }}
                      placeholder="0"
                      className="w-full text-right text-xs font-bold text-emerald-700 p-2 rounded-lg border border-emerald-200 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </DnaTd>
                  <DnaTd className="py-2.5 px-3 bg-rose-50/20">
                    <input
                      type="number"
                      min="0"
                      value={line.credit || ""}
                      onChange={(e) => {
                        const next = [...linesForm];
                        next[idx].credit = Number(e.target.value) || 0;
                        if (Number(e.target.value) > 0) next[idx].debit = 0;
                        setLinesForm(next);
                      }}
                      placeholder="0"
                      className="w-full text-right text-xs font-bold text-rose-700 p-2 rounded-lg border border-rose-200 bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </DnaTd>
                  <DnaTd className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={linesForm.length <= 2}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition-colors"
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

        {/* Footer Balance Validation Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs items-center">
          <div>
            <span className="text-slate-500 block text-[11px]">Total Debit</span>
            <span className="font-extrabold text-emerald-700 text-base tabular-nums">
              {formatRupiah(formTotalDebit)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Total Kredit</span>
            <span className="font-extrabold text-rose-700 text-base tabular-nums">
              {formatRupiah(formTotalCredit)}
            </span>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <span className="text-slate-500 block text-[11px]">Status Keseimbangan (Balance)</span>
            {isFormBalanced && formTotalDebit > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SEIMBANG (Rp 0)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                SELISIH: {formatRupiah(difference)}
              </span>
            )}
          </div>
        </div>
      </DnaCard>
    </div>
  );
}
