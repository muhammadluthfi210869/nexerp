"use client";

import React from "react";
import {
  DnaModal,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
  formatRupiah
} from "@/components/dna";
import type { StatementRow, LedgerDrilldownResponse } from "../_types/laba-rugi.types";

interface LabaRugiDetailModalProps {
  selectedRow: StatementRow | null;
  onClose: () => void;
  ledgerData?: LedgerDrilldownResponse | null;
  isLedgerLoading: boolean;
}

export const LabaRugiDetailModal: React.FC<LabaRugiDetailModalProps> = ({
  selectedRow,
  onClose,
  ledgerData,
  isLedgerLoading
}) => {
  return (
    <DnaModal
      isOpen={!!selectedRow}
      onClose={onClose}
      title={`Drilldown Buku Besar: ${selectedRow?.code} - ${selectedRow?.name.trim()}`}
      size="lg"
    >
      <div className="space-y-3.5 text-xs">
        <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center border border-slate-200">
          <div>
            <span className="text-slate-500 font-medium">Kode & Nama Akun:</span>
            <p className="text-slate-900 font-bold">{selectedRow?.code} - {selectedRow?.name.trim()}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-medium">Realisasi Periode Ini:</span>
            <p className="text-emerald-700 font-black text-base">{selectedRow ? formatRupiah(selectedRow.currentAmount) : "0"}</p>
          </div>
        </div>
        <div className="border border-slate-200 rounded-lg p-3">
          <p className="text-slate-700 font-semibold mb-2">Daftar Jurnal Transaksi Pembentuk Saldo:</p>
          <DnaTable className="w-full text-left text-[11px]">
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 text-slate-500 font-semibold">
                <DnaTh className="py-1">Tanggal</DnaTh>
                <DnaTh className="py-1">No. Jurnal</DnaTh>
                <DnaTh className="py-1">Deskripsi Transaksi</DnaTh>
                <DnaTh className="py-1 text-right">Debit</DnaTh>
                <DnaTh className="py-1 text-right">Kredit</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody className="divide-y divide-slate-100">
              {isLedgerLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={5} className="py-4 text-center text-slate-400">
                    Memuat data buku besar...
                  </DnaTd>
                </DnaTableRow>
              ) : !ledgerData?.lines || ledgerData.lines.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={5} className="py-4 text-center text-slate-400">
                    Tidak ada pergerakan jurnal untuk akun ini pada periode terpilih.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                ledgerData.lines.map((item, i) => (
                  <DnaTableRow key={i}>
                    <DnaTd className="py-2 text-slate-600 tabular-nums">
                      {item.date ? new Date(item.date).toISOString().split("T")[0] : "-"}
                    </DnaTd>
                    <DnaTd className="py-2 text-blue-700 font-semibold tabular-nums">
                      {item.journalNumber || item.reference || "-"}
                    </DnaTd>
                    <DnaTd className="py-2 text-slate-800">{item.description || "-"}</DnaTd>
                    <DnaTd className="py-2 text-right text-emerald-700 font-bold tabular-nums">
                      {Number(item.debit || 0) > 0 ? formatRupiah(Number(item.debit)) : "-"}
                    </DnaTd>
                    <DnaTd className="py-2 text-right text-slate-600 tabular-nums">
                      {Number(item.credit || 0) > 0 ? formatRupiah(Number(item.credit)) : "-"}
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
};
