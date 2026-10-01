"use client";

import React from "react";
import { Printer, ArrowDownLeft, CheckCircle2, DollarSign } from "lucide-react";
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
import { CashInItem } from "../_types/cash-in.types";

interface CashInDetailDrawerProps {
  selectedDetail: CashInItem | null;
  onClose: () => void;
  onPrint: (item: CashInItem) => void;
}

export const CashInDetailDrawer: React.FC<CashInDetailDrawerProps> = ({
  selectedDetail,
  onClose,
  onPrint,
}) => {
  if (!selectedDetail) return null;

  return (
    <DnaInspectionModal
      isOpen={!!selectedDetail}
      onClose={onClose}
      title="Bukti Kas / Bank Masuk (BKM)"
      documentCode={selectedDetail.code}
      subtitle={`Sumber: ${selectedDetail.from} • Kategori: ${selectedDetail.category}`}
      statusBadge={
        <div className="flex items-center gap-1.5">
          <DnaBadge variant={selectedDetail.status === "POSTED" ? "success" : "default"}>
            {selectedDetail.status}
          </DnaBadge>
          <DnaBadge variant={selectedDetail.reconciliationStatus === "RECONCILED" ? "success" : "warning"}>
            {selectedDetail.reconciliationStatus}
          </DnaBadge>
        </div>
      }
      metrics={[
        {
          label: "Total Nominal Masuk",
          value: formatRupiah(selectedDetail.amount),
          variant: "brand",
        },
        {
          label: "Akun Kas / Rekening",
          value: selectedDetail.account,
          variant: "neutral",
        },
        {
          label: "Status Rekonsiliasi",
          value: selectedDetail.reconciliationStatus === "RECONCILED" ? "Reconciled" : "Pending Match",
          variant: selectedDetail.reconciliationStatus === "RECONCILED" ? "success" : "warning",
        },
        {
          label: "Tgl Transaksi",
          value: selectedDetail.date,
          variant: "neutral",
        },
      ]}
      referenceDocuments={[
        {
          label: "Dokumen Referensi / Invoice",
          code: selectedDetail.reference || "N/A",
          href: selectedDetail.reference ? `/penjualan/faktur-penjualan` : undefined,
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
        {/* Source & Account Allocation Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 block mb-0.5">Diterima Dari (Penyetor):</span>
            <span className="font-bold text-slate-900 text-sm">{selectedDetail.from}</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">
              Ref: <strong className="font-mono text-slate-700">{selectedDetail.reference || "-"}</strong>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Rekening Penerima / Kas:</span>
            <span className="font-bold text-slate-900 text-sm">{selectedDetail.account}</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">
              Alokasi: <strong className="text-slate-700">{selectedDetail.category}</strong>
            </span>
          </div>
          <div className="md:col-span-2 pt-2 border-t border-slate-200">
            <span className="text-slate-400 block mb-0.5">Keterangan / Uraian:</span>
            <span className="text-slate-700 font-medium">{selectedDetail.description}</span>
          </div>
        </div>

        {/* Double-entry Journal Table */}
        <div className="space-y-2">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Entri Jurnal Akuntansi Kas Masuk (Double-Entry Ledger)
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
                    [Debit] {selectedDetail.account}
                  </DnaTd>
                  <DnaTd className="p-2.5 text-right font-bold text-emerald-700 tabular-nums">
                    {formatRupiah(selectedDetail.amount)}
                  </DnaTd>
                  <DnaTd className="p-2.5 text-right text-slate-400">-</DnaTd>
                </DnaTableRow>
                <DnaTableRow className="hover:bg-slate-50/60">
                  <DnaTd className="p-2.5 font-semibold text-slate-800 pl-6">
                    [Kredit] {selectedDetail.category}
                  </DnaTd>
                  <DnaTd className="p-2.5 text-right text-slate-400">-</DnaTd>
                  <DnaTd className="p-2.5 text-right font-bold text-emerald-700 tabular-nums">
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

