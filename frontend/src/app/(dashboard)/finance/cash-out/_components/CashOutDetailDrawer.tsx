"use client";

import React from "react";
import { Printer, ArrowUpRight, CheckCircle2, DollarSign } from "lucide-react";
import {
  DnaInspectionModal,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableRow,
  DnaTh,
  DnaTableBody,
  DnaTd,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import { CashOutItem } from "../_types/cash-out.types";

interface CashOutDetailDrawerProps {
  selectedDetail: CashOutItem | null;
  onClose: () => void;
  onPrint: (item: CashOutItem) => void;
}

export const CashOutDetailDrawer: React.FC<CashOutDetailDrawerProps> = ({
  selectedDetail,
  onClose,
  onPrint,
}) => {
  if (!selectedDetail) return null;

  return (
    <DnaInspectionModal
      isOpen={!!selectedDetail}
      onClose={onClose}
      title="Bukti Kas / Bank Keluar (BKK)"
      documentCode={selectedDetail.code}
      subtitle={`Penerima Dana: ${selectedDetail.to} • No. Tagihan: ${selectedDetail.billNo}`}
      statusBadge={
        <div className="flex items-center gap-1.5">
          <DnaBadge variant={selectedDetail.status === "POSTED" ? "critical" : "default"}>
            {selectedDetail.status}
          </DnaBadge>
          <DnaBadge variant={selectedDetail.reconciliationStatus === "RECONCILED" ? "success" : "warning"}>
            {selectedDetail.reconciliationStatus}
          </DnaBadge>
        </div>
      }
      metrics={[
        {
          label: "Total Nominal Keluar",
          value: formatRupiah(selectedDetail.amount),
          variant: "critical",
        },
        {
          label: "Sumber Rekening / Kas",
          value: selectedDetail.account,
          variant: "neutral",
        },
        {
          label: "Status Rekonsiliasi",
          value: selectedDetail.reconciliationStatus === "RECONCILED" ? "Reconciled" : "Pending Match",
          variant: selectedDetail.reconciliationStatus === "RECONCILED" ? "success" : "warning",
        },
        {
          label: "Tgl Pengeluaran",
          value: selectedDetail.date,
          variant: "neutral",
        },
      ]}
      referenceDocuments={[
        {
          label: "Faktur Pembelian / Tagihan",
          code: selectedDetail.billNo || "N/A",
          href: selectedDetail.billNo ? `/pembelian/faktur-pembelian` : undefined,
        },
        {
          label: "Chart of Accounts (CoA)",
          code: selectedDetail.category,
          href: `/finance/accounting/coa`,
        },
      ]}
      onPrint={() => onPrint(selectedDetail)}
    >
      <div className="space-y-5 text-xs">
        {/* Destination & Expense Allocation Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 block mb-0.5">Dibayarkan Kepada (Penerima):</span>
            <span className="font-bold text-slate-900 text-sm">{selectedDetail.to}</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">
              Tagihan Ref: <strong className="font-mono text-slate-700">{selectedDetail.billNo}</strong>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Sumber Rekening / Kas:</span>
            <span className="font-bold text-slate-900 text-sm">{selectedDetail.account}</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">
              Alokasi Beban: <strong className="text-slate-700">{selectedDetail.category}</strong>
            </span>
          </div>
          <div className="md:col-span-2 pt-2 border-t border-slate-200">
            <span className="text-slate-400 block mb-0.5">Keterangan / Keperluan Pengeluaran:</span>
            <span className="text-slate-700 font-medium">{selectedDetail.description}</span>
          </div>
        </div>

        {/* Double-entry Journal Table */}
        <div className="space-y-2">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Entri Jurnal Akuntansi Kas Keluar (Double-Entry Ledger)
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-600">
                  <DnaTh className="p-2.5">Akun COA / Buku Besar</DnaTh>
                  <DnaTh className="p-2.5 text-right w-[140px]">Debit (Rp)</DnaTh>
                  <DnaTh className="p-2.5 text-right w-[140px]">Kredit (Rp)</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                <DnaTableRow className="hover:bg-slate-50/60">
                  <DnaTd className="p-2.5 font-semibold text-slate-800">
                    [Debit] {selectedDetail.category}
                  </DnaTd>
                  <DnaTd className="p-2.5 text-right font-bold text-rose-700 tabular-nums">
                    {formatRupiah(selectedDetail.amount)}
                  </DnaTd>
                  <DnaTd className="p-2.5 text-right text-slate-400">-</DnaTd>
                </DnaTableRow>
                <DnaTableRow className="hover:bg-slate-50/60">
                  <DnaTd className="p-2.5 font-semibold text-slate-800 pl-6">
                    [Kredit] {selectedDetail.account}
                  </DnaTd>
                  <DnaTd className="p-2.5 text-right text-slate-400">-</DnaTd>
                  <DnaTd className="p-2.5 text-right font-bold text-rose-700 tabular-nums">
                    {formatRupiah(selectedDetail.amount)}
                  </DnaTd>
                </DnaTableRow>
              </DnaTableBody>
            </DnaTable>
          </div>
        </div>
      </div>
    </DnaInspectionModal>
  );
};

