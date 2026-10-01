"use client";

import React from "react";
import { Send, RotateCcw } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import { ApBill, BankBalance } from "../_types/bayar-pembelian.types";

interface PaymentDetailDrawerProps {
  selectedBill: ApBill | null;
  onClose: () => void;
  bankBalances: BankBalance[];
  paymentDate: string;
  setPaymentDate: (val: string) => void;
  selectedAccountCode: string;
  setSelectedAccountCode: (val: string) => void;
  payAmount: number;
  setPayAmount: (val: number) => void;
  useDebitNote: boolean;
  setUseDebitNote: (val: boolean) => void;
  refNumber: string;
  setRefNumber: (val: string) => void;
  paymentNotes: string;
  setPaymentNotes: (val: string) => void;
  onProcessPayment: () => void;
}

export function PaymentDetailDrawer({
  selectedBill,
  onClose,
  bankBalances,
  paymentDate,
  setPaymentDate,
  selectedAccountCode,
  setSelectedAccountCode,
  payAmount,
  setPayAmount,
  useDebitNote,
  setUseDebitNote,
  refNumber,
  setRefNumber,
  paymentNotes,
  setPaymentNotes,
  onProcessPayment,
}: PaymentDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedBill}
      onClose={onClose}
      title={selectedBill?.billNumber || "Pembayaran Faktur Hutang"}
      subtitle={selectedBill ? `Supplier: ${selectedBill.vendorName} â€¢ PO: ${selectedBill.poNumber}` : undefined}
      badge={
        selectedBill ? (
          <DnaBadge variant={selectedBill.daysToDue < 0 ? "critical" : "warning"}>
            {selectedBill.daysToDue < 0 ? "Overdue" : `H-${selectedBill.daysToDue}`}
          </DnaBadge>
        ) : undefined
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<Send className="w-4 h-4" />}
            onClick={onProcessPayment}
          >
            Konfirmasi & Eksekusi Pembayaran
          </DnaButton>
        </div>
      }
    >
      {selectedBill && (
        <div className="space-y-5 text-xs">
          {/* Tagihan Summary */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Sisa Hutang Faktur</span>
              <span className="font-bold text-slate-900 tabular-nums text-sm block">
                Rp {selectedBill.remainingAmount.toLocaleString("id-ID")}
              </span>
              <span className="text-slate-500 text-[11px]">Total PO: {selectedBill.poNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Status Termin</span>
              <span className="font-bold text-rose-600 block text-xs mt-1">
                {selectedBill.daysToDue < 0 ? `Overdue ${Math.abs(selectedBill.daysToDue)} Hari` : `H-${selectedBill.daysToDue} Jatuh Tempo`}
              </span>
              <span className="text-slate-500 text-[11px]">Due: {selectedBill.dueDate}</span>
            </div>
          </div>

          {/* Potongan Otomatis Debit Note */}
          {selectedBill.availableDebitNote > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-700" />
                  <div>
                    <div className="font-bold text-emerald-900 text-xs">Tersedia Potongan Debit Note</div>
                    <div className="text-[11px] text-emerald-700">
                      Klaim retur disetujui: Rp {selectedBill.availableDebitNote.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDebitNote}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUseDebitNote(checked);
                      const net = checked
                        ? Math.max(0, selectedBill.remainingAmount - selectedBill.availableDebitNote)
                        : selectedBill.remainingAmount;
                      setPayAmount(net);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <span className="font-bold text-emerald-900 text-xs">Gunakan</span>
                </label>
              </div>
            </div>
          )}

          {/* Payment Inputs */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Tanggal Bayar *</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Sumber Kas / Bank *</label>
                <select
                  aria-label="Akun Kas Bank"
                  value={selectedAccountCode}
                  onChange={(e) => setSelectedAccountCode(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {bankBalances.map((b) => (
                    <option key={b.accountCode} value={b.accountCode}>
                      [{b.accountCode}] {b.accountName} (Rp {b.balance.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nominal Transfer (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-bold tabular-nums text-indigo-700 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">No. Referensi Transfer / Giro</label>
                <input
                  type="text"
                  placeholder="Contoh: TRF-BCA-992140"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Catatan Pelunasan</label>
              <textarea
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Catatan pelunasan untuk bukti transaksi..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
