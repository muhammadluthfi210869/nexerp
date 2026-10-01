import React from "react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import { BankAccountItem } from "../_types/bank-reconciliation.types";

interface BankReconDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccount?: BankAccountItem;
  difference: number;
  onPostJournal: () => void;
  isPostingJournal: boolean;
}

export function BankReconDetailDrawer({
  isOpen,
  onClose,
  selectedAccount,
  difference,
  onPostJournal,
  isPostingJournal,
}: BankReconDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Jurnal Penyesuaian Rekonsiliasi Bank"
      subtitle="Mencatat selisih biaya administrasi bank dan pendapatan bunga giro"
      badge={<DnaBadge variant="warning">RECON ADJUSTMENT</DnaBadge>}
      tabs={[
        {
          id: "entries",
          label: "Detail Jurnal Selisih",
          content: (
            <div className="space-y-4 p-4 text-xs">
              <p className="text-slate-600">
                Jurnal otomatis untuk mencatat selisih biaya administrasi bank dan pendapatan bunga giro yang tercatat di rekening koran:
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                <div className="flex justify-between">
                  <span>Rekening Bank Terkait:</span>
                  <strong className="text-slate-900">
                    {selectedAccount?.bankName || "-"} ({selectedAccount?.accountNumber || "-"})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Selisih Buku vs Koran:</span>
                  <strong className={difference === 0 ? "text-emerald-700" : "text-amber-700"}>
                    {formatRupiah(difference)}
                  </strong>
                </div>
              </div>
            </div>
          )
        }
      ]}
      footerActions={
        <div className="flex items-center justify-between w-full">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="md"
            onClick={onPostJournal}
            disabled={isPostingJournal}
          >
            Posting Jurnal Rekonsiliasi
          </DnaButton>
        </div>
      }
    />
  );
}
