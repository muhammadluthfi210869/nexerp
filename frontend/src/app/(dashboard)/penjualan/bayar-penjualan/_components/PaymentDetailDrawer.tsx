import React from "react";
import { ShieldCheck, Percent } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaCell,
  DnaButton,
  DnaInput,
} from "@/components/dna";
import { ReceivablePayment, statusBadgeConfig } from "../_types/bayar-penjualan.types";

interface PaymentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPayment: ReceivablePayment | null;
  formDate: string;
  setFormDate: (val: string) => void;
  formBank: string;
  setFormBank: (val: string) => void;
  formPayAmount: string;
  setFormPayAmount: (val: string) => void;
  formPph23: string;
  setFormPph23: (val: string) => void;
  formPph21: string;
  setFormPph21: (val: string) => void;
  formNotes: string;
  setFormNotes: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PaymentDetailDrawer({
  isOpen,
  onClose,
  selectedPayment,
  formDate,
  setFormDate,
  formBank,
  setFormBank,
  formPayAmount,
  setFormPayAmount,
  formPph23,
  setFormPph23,
  formPph21,
  setFormPph21,
  formNotes,
  setFormNotes,
  onSubmit,
}: PaymentDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Pencatatan Pembayaran & Withholding Pajak"
      subtitle={selectedPayment ? `${selectedPayment.customerName} â€¢ Faktur ${selectedPayment.invoiceNumber}` : undefined}
      badge={
        selectedPayment ? (
          <DnaCell.Badge
            status={statusBadgeConfig[selectedPayment.status]?.status || "default"}
            label={statusBadgeConfig[selectedPayment.status]?.label || selectedPayment.status}
          />
        ) : undefined
      }
      actions={
        <div className="flex items-center justify-between w-full">
          <DnaButton type="button" variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            type="button"
            variant="primary"
            icon={<ShieldCheck className="w-4 h-4" />}
            onClick={onSubmit as any}
          >
            Validasi & Catat Kas Masuk
          </DnaButton>
        </div>
      }
    >
      {selectedPayment && (
        <form onSubmit={onSubmit} className="space-y-5 text-xs">
          {/* Summary Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Faktur Penjualan
              </span>
              <span className="tabular-nums font-bold text-blue-600 text-xs">{selectedPayment.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total Nilai Faktur:</span>
              <span className="tabular-nums font-bold text-slate-800">
                Rp {selectedPayment.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-1.5">
              <span className="text-slate-500 font-semibold">Sisa Tagihan Tertunggak:</span>
              <span className="font-bold text-rose-600 tabular-nums text-sm">
                Rp {selectedPayment.remainingAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Tanggal Bayar *</label>
              <DnaInput
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Akun Kas / Bank Penerima *</label>
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
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jumlah Pembayaran Diterima (Bruto Rp) *</label>
            <DnaInput
              type="number"
              value={formPayAmount}
              onChange={(e) => {
                const val = e.target.value;
                setFormPayAmount(val);
                setFormPph23(String(Math.round(Number(val) * 0.02)));
              }}
              required
            />
          </div>

          {/* Withholding Tax PPh 21 & PPh 23 */}
          <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 space-y-3">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Potongan Pajak (Withholding Tax)
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-purple-800 block mb-1">
                  PPh 23 (2% Jasa Maklon)
                </label>
                <DnaInput
                  type="number"
                  value={formPph23}
                  onChange={(e) => setFormPph23(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-purple-800 block mb-1">
                  PPh 21 (Tenaga Ahli/Komisi)
                </label>
                <DnaInput
                  type="number"
                  value={formPph21}
                  onChange={(e) => setFormPph21(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-purple-100">
              <span className="font-semibold text-purple-900">Estimasi Kas Bersih Masuk Bank:</span>
              <span className="font-bold text-emerald-700 tabular-nums text-sm">
                Rp{" "}
                {Math.max(
                  0,
                  (Number(formPayAmount) || 0) - (Number(formPph23) || 0) - (Number(formPph21) || 0)
                ).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nomor Referensi & Catatan</label>
            <textarea
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Contoh: Transfer BCA No. Ref: TRX-992144. Bukti setor PPh 23 terlampir."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
        </form>
      )}
    </DnaDetailDrawer>
  );
}
