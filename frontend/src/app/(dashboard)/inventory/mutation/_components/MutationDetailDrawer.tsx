import React from "react";
import {
  DnaModal,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { MutationStatusBadge } from "./MutationBadges";
import type { TransferItem } from "../_types/mutation.types";

interface MutationDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransfer: TransferItem | null;
  onExecuteTransfer: (id: string) => void;
}

export function MutationDetailDrawer({
  isOpen,
  onClose,
  selectedTransfer,
  onExecuteTransfer,
}: MutationDetailDrawerProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Mutasi Barang: ${selectedTransfer?.code || ""}`}
      size="lg"
    >
      {selectedTransfer && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Transfer</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedTransfer.code}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Transfer</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedTransfer.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Status</p>
              <div className="mt-0.5">
                <MutationStatusBadge status={selectedTransfer.status} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Gudang Asal</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedTransfer.sourceWarehouse}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Gudang Tujuan</p>
              <p className="text-xs font-bold text-blue-600 mt-0.5">{selectedTransfer.destWarehouse}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Pembuat / Operator</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedTransfer.creator}</p>
            </div>
          </div>

          {/* Sub-table Detail Item */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Rincian Barang Ditransfer
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                    <DnaTh className="py-2.5 px-3">Nama Barang</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Qty Transfer</DnaTh>
                    <DnaTh className="py-2.5 px-3">Catatan Khusus</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {selectedTransfer.items.map((it, idx) => (
                    <DnaTableRow key={idx}>
                      <DnaTd className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</DnaTd>
                      <DnaTd className="py-2.5 px-3 font-medium text-slate-800">{it.name}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-center text-slate-600">{it.unit}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right font-bold text-blue-600">
                        {it.qty.toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-slate-500">{it.notes || "-"}</DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>

          {selectedTransfer.notes && (
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
              <span className="font-bold">Catatan Mutasi:</span> {selectedTransfer.notes}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={onClose}>
              Tutup
            </DnaButton>
            {selectedTransfer.status === "PENDING" && (
              <DnaButton
                variant="primary"
                onClick={() => onExecuteTransfer(selectedTransfer.id)}
              >
                Eksekusi Mutasi (Keluarkan & Terima)
              </DnaButton>
            )}
          </div>
        </div>
      )}
    </DnaModal>
  );
}
