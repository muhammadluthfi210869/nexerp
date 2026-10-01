import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaButton,
} from "@/components/dna";
import { CashInFormData } from "../_types/cash-in.types";

interface CashInFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: CashInFormData;
  setFormData: React.Dispatch<React.SetStateAction<CashInFormData>>;
  onSave: () => void;
}

export const CashInFormModal: React.FC<CashInFormModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
}) => {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Kas Bank Masuk (Other Deposit)"
      size="lg"
    >
      <div className="space-y-3.5 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tanggal Penerimaan *</label>
            <DnaInput
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Kas / Bank Akun Penerimaan *</label>
            <DnaSelect
              value={formData.account}
              onChange={(value) => setFormData({ ...formData, account: value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="BCA Operasional (521-009182)">1120 - Bank BCA Operasional (521-009182)</option>
              <option value="Mandiri Payroll (137-00123)">1130 - Bank Mandiri Payroll & Pajak (137-00123)</option>
              <option value="Kas Tunai Operasional">1110 - Kas Tunai Petty Cash Kantor</option>
            </DnaSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Dari (Nama Pengirim / Klien)</label>
            <DnaInput
              type="text"
              placeholder="e.g. PT Glowing Beauty Indonesia"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Chart of Account (CoA) Pendapatan *</label>
            <DnaSelect
              value={formData.coaRevenue}
              onChange={(value) => setFormData({ ...formData, coaRevenue: value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="4110 - Pendapatan Produksi Maklon">4110 - Pendapatan Produksi Maklon OEM</option>
              <option value="4120 - Pendapatan Sample R&D">4120 - Pendapatan Sample & Prototipe R&D</option>
              <option value="4130 - Jasa Notifikasi BPOM">4130 - Jasa Notifikasi BPOM & HKI</option>
              <option value="4190 - Pendapatan Bunga & Lainnya">4190 - Pendapatan Bunga & Lainnya</option>
            </DnaSelect>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Deskripsi / Keterangan Penerimaan *</label>
          <DnaInput
            type="text"
            placeholder="e.g. Penerimaan DP 50% Produksi Batch Serum Niacinamide"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Jumlah Nominal (Rp) *</label>
            <DnaInput
              type="number"
              placeholder="e.g. 450000000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Memo / Catatan Item</label>
            <DnaInput
              type="text"
              placeholder="Catatan tambahan..."
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
          <span className="text-emerald-900 font-medium">Jurnal Otomatis yang Terbentuk:</span>
          <span className="tabular-nums text-xs font-bold text-emerald-800">
            Dr Kas/Bank ({formData.account.split(" ")[0]}) / Cr Pendapatan
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={onSave}>
            Simpan & Posting
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
};
