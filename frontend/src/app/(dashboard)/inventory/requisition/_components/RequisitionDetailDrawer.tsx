import React from "react";
import { CheckCircle2, Send } from "lucide-react";
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
import { MaterialRequisition } from "../_types/requisition.types";
import { getStatusBadge } from "./RequisitionStatusBadge";

interface RequisitionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReq: MaterialRequisition | null;
  onApprove: (id: string) => void;
  onHandoverComplete: (id: string) => void;
}

export const RequisitionDetailDrawer: React.FC<RequisitionDetailDrawerProps> = ({
  isOpen,
  onClose,
  selectedReq,
  onApprove,
  onHandoverComplete,
}) => {
  if (!selectedReq) return null;

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Permintaan Barang: ${selectedReq.requisitionNumber}`}
      description={`Pengajuan dari ${selectedReq.fromWarehouse} menuju ${selectedReq.toDivision}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Diajukan oleh:{" "}
            <span className="font-semibold text-slate-700">{selectedReq.requestedBy}</span> (
            {selectedReq.requestDate})
          </div>
          <div className="flex items-center gap-2">
            {selectedReq.status === "PENDING" && (
              <DnaButton
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => {
                  onApprove(selectedReq.id);
                  onClose();
                }}
              >
                Setujui Permintaan
              </DnaButton>
            )}
            {selectedReq.status === "APPROVED" && (
              <DnaButton
                variant="primary"
                size="sm"
                icon={<Send className="w-4 h-4" />}
                onClick={() => {
                  onHandoverComplete(selectedReq.id);
                  onClose();
                }}
              >
                Konfirmasi Serah Terima Barang
              </DnaButton>
            )}
            <DnaButton variant="outline" size="sm" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-500 block">No. SPK / Referensi</span>
            <span className="font-bold text-slate-900 tabular-nums text-sm">
              {selectedReq.spkNumber}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Status Pengajuan</span>
            <div className="mt-0.5">{getStatusBadge(selectedReq.status)}</div>
          </div>
          <div>
            <span className="text-slate-500 block">Keperluan / Keterangan</span>
            <span className="text-slate-700">{selectedReq.purpose}</span>
          </div>
        </div>

        {selectedReq.approvalNotes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
            <span className="font-bold block mb-1">Catatan Persetujuan / Penolakan:</span>
            {selectedReq.approvalNotes}
          </div>
        )}

        {/* Items Table */}
        <div>
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
            Daftar Material yang Diminta
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <DnaTable className="w-full text-left text-xs text-slate-600">
              <DnaTableHead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                <DnaTableRow>
                  <DnaTh className="py-2.5 px-3">Kode</DnaTh>
                  <DnaTh className="py-2.5 px-3">Nama Material</DnaTh>
                  <DnaTh className="py-2.5 px-3">Kategori</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right">Stok Gudang</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right">Qty Diminta</DnaTh>
                  <DnaTh className="py-2.5 px-3">Satuan</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center">Status Stok</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody className="divide-y divide-slate-100">
                {selectedReq.items.map((it) => {
                  const isSufficient = it.availableStock >= it.requestedQty;
                  return (
                    <DnaTableRow key={it.id} className="hover:bg-slate-50">
                      <DnaTd className="py-2.5 px-3 font-medium text-indigo-600 tabular-nums">
                        {it.materialCode}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 font-semibold text-slate-800">
                        {it.materialName}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                          {it.category}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right font-medium text-slate-600 tabular-nums">
                        {it.availableStock.toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right font-bold text-indigo-700 tabular-nums">
                        {it.requestedQty.toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-slate-500">{it.unit}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-center">
                        {isSufficient ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-semibold">
                            Tersedia
                          </span>
                        ) : (
                          <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[10px] font-semibold">
                            Stok Defisit
                          </span>
                        )}
                      </DnaTd>
                    </DnaTableRow>
                  );
                })}
              </DnaTableBody>
            </DnaTable>
          </div>
        </div>
      </div>
    </DnaModal>
  );
};
