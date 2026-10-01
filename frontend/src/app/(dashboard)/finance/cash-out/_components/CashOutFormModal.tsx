import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaButton,
} from "@/components/dna";
import { generateAutoDocNumber } from "@/lib/document-number";
import { CashOutFormData } from "../_types/cash-out.types";

interface CashOutFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: CashOutFormData;
  setFormData: React.Dispatch<React.SetStateAction<CashOutFormData>>;
  onSave: () => void;
}

export const CashOutFormModal: React.FC<CashOutFormModalProps> = ({
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
      title="Buat Kas Bank Keluar (Other Payment)"
      size="lg"
    >
      <div className="space-y-3.5 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tanggal Pembayaran *</label>
            <DnaInput
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Kas / Bank Akun Pembayaran *</label>
            <DnaSelect
              value={formData.account}
              onChange={(value) => setFormData({ ...formData, account: value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="BCA Operasional (521-009182)">1120 - Bank BCA Operasional (521-009182)</option>
              <option value="Mandiri Payroll (137-00123)">1130 - Bank Mandiri Payroll & Pajak (137-00123)</option>
              <option value="Kas Tunai Petty Cash">1110 - Kas Tunai Petty Cash Kantor</option>
            </DnaSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Kepada (Nama Penerima / Vendor)</label>
            <DnaInput
              type="text"
              placeholder="e.g. PT Bahan Kimia Nusantara"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">No. Tagihan / Invoice Ref</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, billNo: generateAutoDocNumber("BILL") })}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
              >
                + Auto No. Bill
              </button>
            </div>
            <DnaInput
              type="text"
              placeholder="e.g. BILL-202609-1001"
              value={formData.billNo}
              onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Chart of Account (CoA) Beban/Biaya *</label>
            <DnaSelect
              value={formData.coaExpense}
              onChange={(value) => setFormData({ ...formData, coaExpense: value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="5110 - Beban Pokok Bahan Baku">5110 - Beban Pokok Bahan Baku Aktif</option>
              <option value="5120 - Beban Kemasan Packaging">5120 - Beban Kemasan Packaging</option>
              <option value="6130 - Biaya Utilitas Listrik/Air">6130 - Biaya Utilitas Listrik & Boiler</option>
              <option value="6190 - Beban Operasional Umum">6190 - Beban Operasional Umum & Petty Cash</option>
            </DnaSelect>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Jumlah Nilai Pembayaran (Rp) *</label>
            <DnaInput
              type="number"
              placeholder="e.g. 120000000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-rose-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Deskripsi Umum Pembayaran *</label>
          <DnaInput
            type="text"
            placeholder="e.g. Pembayaran Pelunasan Invoice Bahan Baku Centella"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Keterangan Entry Khusus (Opsional)</label>
          <DnaInput
            type="text"
            placeholder="Catatan tambahan..."
            value={formData.entryNotes}
            onChange={(e) => setFormData({ ...formData, entryNotes: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 flex justify-between items-center">
          <span className="text-rose-900 font-medium">Jurnal Otomatis yang Terbentuk:</span>
          <span className="tabular-nums text-xs font-bold text-rose-800">
            Dr Beban/Biaya / Cr Kas/Bank ({formData.account.split(" ")[0]})
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={onSave}>
            Simpan Kas Bank Keluar
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
};
