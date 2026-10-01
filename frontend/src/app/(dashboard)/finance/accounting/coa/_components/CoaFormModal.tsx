"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput, DnaSelect } from "@/components/dna";
import { AccountModel, AccountType, NormalBalance } from "../_types/coa.types";

interface CoaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount: AccountModel | null;
  formCode: string;
  setFormCode: (value: string) => void;
  formName: string;
  setFormName: (value: string) => void;
  formType: AccountType;
  setFormType: (value: AccountType) => void;
  formNormalBalance: NormalBalance;
  setFormNormalBalance: (value: NormalBalance) => void;
  formCategory: string;
  setFormCategory: (value: string) => void;
  formParentId: string;
  setFormParentId: (value: string) => void;
  formIsHeader: boolean;
  setFormIsHeader: (value: boolean) => void;
  formIsActive: boolean;
  setFormIsActive: (value: boolean) => void;
  parentOptions: Array<{ value: string; label: string }>;
  onSave: () => void;
  isSaving?: boolean;
}

export function CoaFormModal({
  isOpen,
  onClose,
  editingAccount,
  formCode,
  setFormCode,
  formName,
  setFormName,
  formType,
  setFormType,
  formNormalBalance,
  setFormNormalBalance,
  formCategory,
  setFormCategory,
  formParentId,
  setFormParentId,
  formIsHeader,
  setFormIsHeader,
  formIsActive,
  setFormIsActive,
  parentOptions,
  onSave,
  isSaving = false,
}: CoaFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAccount ? `Sunting Akun: ${editingAccount.code}` : "Tambah Akun Baru"}
      subtitle="Definisikan nomor akun rekening, klasifikasi tipe laporan, dan saldo normal pembukuan"
      size="lg"
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Nomor Kode Akun *</label>
              <button
                type="button"
                onClick={() => {
                  const basePrefix = formType === "ASSET" ? "1" : formType === "LIABILITY" ? "2" : formType === "EQUITY" ? "3" : formType === "REVENUE" ? "4" : "6";
                  const rand = Math.floor(100 + Math.random() * 900);
                  setFormCode(`${basePrefix}1${rand}`);
                }}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
              >
                ⚡ Auto-Gen
              </button>
            </div>
            <DnaInput
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="e.g. 11110"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Rekening Akun *</label>
            <DnaInput
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Kas Operasional Pabrik"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DnaSelect
            label="Tipe Laporan *"
            value={formType}
            onChange={(val) => setFormType(val as AccountType)}
            options={[
              { value: "ASSET", label: "Asset (Aktiva / Harta)" },
              { value: "LIABILITY", label: "Liability (Kewajiban / Hutang)" },
              { value: "EQUITY", label: "Equity (Modal / Ekuitas)" },
              { value: "REVENUE", label: "Revenue (Pendapatan Maklon)" },
              { value: "EXPENSE", label: "Expense (HPP & Beban Operasional)" },
            ]}
          />
          <DnaSelect
            label="Saldo Normal *"
            value={formNormalBalance}
            onChange={(val) => setFormNormalBalance(val as NormalBalance)}
            options={[
              { value: "DEBIT", label: "DEBIT (Bertambah di Debit)" },
              { value: "CREDIT", label: "CREDIT (Bertambah di Kredit)" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DnaSelect
            label="Induk Akun (Parent)"
            value={formParentId}
            onChange={(val) => setFormParentId(val)}
            options={parentOptions}
          />
          <div className="flex flex-col justify-center pt-2 md:pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsHeader}
                onChange={(e) => setFormIsHeader(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Header Akun (Induk Klasifikasi)</span>
                <span className="text-[11px] text-slate-500 block">Akun header hanya untuk grouping, tidak bisa dijurnal langsung</span>
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DnaSelect
            label="Kelompok Kategori *"
            value={formCategory}
            onChange={(val) => setFormCategory(val)}
            options={[
              { value: "Kas & Bank", label: "Kas & Bank" },
              { value: "Piutang", label: "Piutang" },
              { value: "Uang Muka", label: "Uang Muka" },
              { value: "Persediaan", label: "Persediaan" },
              { value: "Pajak Dibayar Dimuka", label: "Pajak Dibayar Dimuka" },
              { value: "Aset Tetap", label: "Aset Tetap" },
              { value: "Hutang Lancar", label: "Hutang Lancar" },
              { value: "Hutang Pajak", label: "Hutang Pajak" },
              { value: "Ekuitas", label: "Ekuitas" },
              { value: "Pendapatan Operasional", label: "Pendapatan Operasional" },
              { value: "Pengurang Pendapatan", label: "Pengurang Pendapatan" },
              { value: "Harga Pokok Penjualan", label: "Harga Pokok Penjualan" },
              { value: "Beban Operasional", label: "Beban Operasional" },
            ]}
          />
          <DnaSelect
            label="Status Akun *"
            value={formIsActive ? "ACTIVE" : "INACTIVE"}
            onChange={(val) => setFormIsActive(val === "ACTIVE")}
            options={[
              { value: "ACTIVE", label: "ACTIVE (Dapat Dijurnal)" },
              { value: "INACTIVE", label: "INACTIVE (Nonaktif)" },
            ]}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSave} loading={isSaving}>
            Simpan Akun
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
