import React from "react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { Receipt } from "../_types/receiving.types";

interface ReceivingDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReceipt: Receipt | null;
}

export function ReceivingDetailDrawer({
  isOpen,
  onClose,
  selectedReceipt,
}: ReceivingDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedReceipt?.id || "Rincian Penerimaan Barang"}
      subtitle={selectedReceipt ? `Supplier: ${selectedReceipt.vendor} â€¢ PO: ${selectedReceipt.poId}` : undefined}
      badge={
        selectedReceipt ? (
          <DnaBadge variant={selectedReceipt.qc === "PASSED" ? "success" : "warning"}>
            QC: {selectedReceipt.qc}
          </DnaBadge>
        ) : undefined
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500">Status Siklus: {selectedReceipt?.status}</span>
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      }
    >
      {selectedReceipt && (
        <div className="space-y-5 text-xs">
          {/* 3-Pilar Grid Breakdown */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-center">
              <span className="text-slate-500 block text-[11px]">Bagus (Lolos QC)</span>
              <span className="font-bold text-emerald-700 tabular-nums text-lg">{selectedReceipt.qtyBagus}</span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block text-[11px]">Reject (Cacat)</span>
              <span className="font-bold text-rose-700 tabular-nums text-lg">{selectedReceipt.qtyReject}</span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block text-[11px]">Free (Bonus HPP 0)</span>
              <span className="font-bold text-amber-700 tabular-nums text-lg">{selectedReceipt.qtyFree}</span>
            </div>
          </div>

          {/* Inbound Items */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Item Material Diterima
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="py-2.5 px-3">Nama Material</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Qty Aktual</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-center">Status QC</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {(selectedReceipt.items || []).map((it, idx) => (
                    <DnaTableRow key={idx} className="hover:bg-slate-50">
                      <DnaTd className="py-2 px-3 font-sans font-medium text-slate-800">{it.name}</DnaTd>
                      <DnaTd className="py-2 px-3 text-right font-bold text-slate-900">{it.qtyActual}</DnaTd>
                      <DnaTd className="py-2 px-3 text-center">
                        <DnaBadge variant={it.qcStatus === "GOOD" ? "success" : "warning"}>
                          {it.qcStatus}
                        </DnaBadge>
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
