import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaButton,
} from "@/components/dna";
import {
  CoaAutoRule,
  AccountOption,
  STANDARD_TRANSACTION_TYPES,
} from "../_types/coa-auto.types";

interface CoaAutoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRule: CoaAutoRule | null;
  formName: string;
  setFormName: (val: string) => void;
  formDocType: string;
  setFormDocType: (val: string) => void;
  formCustomDocType: string;
  setFormCustomDocType: (val: string) => void;
  formDebit: string;
  setFormDebit: (val: string) => void;
  formCredit: string;
  setFormCredit: (val: string) => void;
  accountOptions: AccountOption[];
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export function CoaAutoFormModal({
  isOpen,
  onClose,
  editingRule,
  formName,
  setFormName,
  formDocType,
  setFormDocType,
  formCustomDocType,
  setFormCustomDocType,
  formDebit,
  setFormDebit,
  formCredit,
  setFormCredit,
  accountOptions,
  onSave,
  isSaving,
}: CoaAutoFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingRule
          ? `Sunting Aturan: ${editingRule.transactionType}`
          : "Tambah Aturan Posting Jurnal Otomatis"
      }
      subtitle="Petakan akun Debit dan Kredit yang akan terposting otomatis ke GL saat transaksi tervalidasi"
      size="md"
    >
      <form onSubmit={onSave} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Nama Deskripsi Aturan *
          </label>
          <DnaInput
            placeholder="Misal: Hutang Dagang saat Faktur Pembelian"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Kode Transaksi (Pemicu Posting) *
          </label>
          <DnaSelect
            value={formDocType}
            onChange={(v) => setFormDocType(v)}
            disabled={!!editingRule}
            options={[
              ...STANDARD_TRANSACTION_TYPES,
              { value: "CUSTOM", label: "-- Kustom Kode Transaksi Lainnya --" },
            ]}
          />
        </div>

        {formDocType === "CUSTOM" && (
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Kode Transaksi Kustom (UPPERCASE) *
            </label>
            <DnaInput
              placeholder="Misal: RETUR_PENJUALAN_KONSUMEN"
              value={formCustomDocType}
              onChange={(e) => setFormCustomDocType(e.target.value.toUpperCase())}
              disabled={!!editingRule}
              required
            />
          </div>
        )}

        <div>
          <label className="font-semibold text-blue-700 block mb-1">
            Akun Sisi Debit (Dr) *
          </label>
          <DnaSelect
            value={formDebit}
            onChange={(v) => setFormDebit(v)}
            options={accountOptions}
          />
        </div>

        <div>
          <label className="font-semibold text-emerald-700 block mb-1">
            Akun Sisi Kredit (Cr) *
          </label>
          <DnaSelect
            value={formCredit}
            onChange={(v) => setFormCredit(v)}
            options={accountOptions}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" size="md" type="submit" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Aturan"}
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
