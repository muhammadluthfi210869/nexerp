"use client";

import React from "react";
import { DnaModal, DnaButton, DnaBadge, formatRupiah } from "@/components/dna";
import { LedgerTransaction } from "../_types/ledger.types";

interface LedgerDrilldownModalProps {
  transaction: LedgerTransaction | null;
  onClose: () => void;
}

export function LedgerDrilldownModal({
  transaction,
  onClose,
}: LedgerDrilldownModalProps) {
  if (!transaction) return null;

  return (
    <DnaModal
      isOpen={!!transaction}
      onClose={onClose}
      title={`Detail Transaksi Buku Besar: ${transaction.journalRef}`}
      size="md"
    >
      <div className="space-y-4 text-xs">
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">No. Jurnal Referensi:</span>
            <span className="font-mono font-bold text-blue-700">{transaction.journalRef}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Tanggal Posting:</span>
            <span className="font-mono text-slate-800">{transaction.postingDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Akun Rekening:</span>
            <span className="font-bold text-slate-900">{transaction.accountCode} - {transaction.accountName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Status Rekonsiliasi:</span>
            <DnaBadge variant={transaction.reconciliationStatus === "RECONCILED" ? "success" : "warning"}>
              {transaction.reconciliationStatus}
            </DnaBadge>
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
          <div>
            <span className="text-slate-400 font-bold block mb-1 text-[10px] uppercase">Keterangan / Memo</span>
            <p className="text-slate-800 font-medium">{transaction.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Debit</span>
              <span className="font-bold text-emerald-700 tabular-nums">{formatRupiah(transaction.debit)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Kredit</span>
              <span className="font-bold text-rose-700 tabular-nums">{formatRupiah(transaction.credit)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Saldo Berjalan</span>
              <span className="font-black text-slate-900 tabular-nums">{formatRupiah(transaction.runningBalance)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
