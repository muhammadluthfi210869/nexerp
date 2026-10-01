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
import { SchedulePackagingItem } from "../_types/schedule-packaging.types";

interface SchedulePackagingDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: SchedulePackagingItem | null;
}

export const SchedulePackagingDetailDrawer: React.FC<SchedulePackagingDetailDrawerProps> = ({
  isOpen,
  onClose,
  selectedItem,
}) => {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Jadwal Packaging: ${selectedItem?.code || ""}`}
      size="lg"
    >
      {selectedItem && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Jadwal</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.code}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Batch Record</p>
              <p className="text-xs font-bold text-blue-600 mt-0.5">{selectedItem.batchRecord}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Sales Order Ref</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.salesOrder}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Pelanggan</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.customer}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Produk</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.product}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Target Qty (PCS)</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.targetPcs.toLocaleString()} PCS</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Dibuat Oleh</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.creator}</p>
            </div>
          </div>

          {/* Sub-table Kemasan Sekunder */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Rincian Kebutuhan Kemasan Sekunder
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                    <DnaTh className="py-2.5 px-3">Nama Kemasan</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Qty Dibutuhkan</DnaTh>
                    <DnaTh className="py-2.5 px-3">Catatan</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  <DnaTableRow>
                    <DnaTd className="py-2.5 px-3 text-center text-slate-400">1</DnaTd>
                    <DnaTd className="py-2.5 px-3 font-medium text-slate-800">{selectedItem.secondaryPackaging}</DnaTd>
                    <DnaTd className="py-2.5 px-3 text-center text-slate-600">pcs</DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right font-bold text-blue-600">
                      {selectedItem.packagingQty.toLocaleString()}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-slate-500">Termasuk safety allowance 1.5%</DnaTd>
                  </DnaTableRow>
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>

          {selectedItem.notes && (
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
              <span className="font-bold">Instruksi Khusus:</span> {selectedItem.notes}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        </div>
      )}
    </DnaModal>
  );
};
