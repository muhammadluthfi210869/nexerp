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
import { DeliveryOutItem } from "../_types/outbound.types";
import { OutboundStatusBadge } from "./OutboundBadges";

interface OutboundDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDo: DeliveryOutItem | null;
  onUpdateStatus: (id: string, status: "DELIVERED" | "SHIPPED") => void;
}

export function OutboundDetailDrawer({
  isOpen,
  onClose,
  selectedDo,
  onUpdateStatus,
}: OutboundDetailDrawerProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Pengiriman: ${selectedDo?.code || ""}`}
      size="lg"
    >
      {selectedDo && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Pengiriman</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.code}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Kirim</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">No. Sales Order</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.soNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Sales</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.soDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Customer / Klien</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.customer}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Ekspedisi / Kurir</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDo.courier}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">No. Resi Pelacakan</p>
              <p className="text-xs font-bold text-blue-600 mt-0.5">{selectedDo.trackingNo}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Status Logistik</p>
              <div className="mt-0.5">
                <OutboundStatusBadge status={selectedDo.status} />
              </div>
            </div>
          </div>

          {/* Sub-table Detail Barang */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Rincian Barang Terkirim
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                    <DnaTh className="py-2.5 px-3">Nama Barang</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Qty Kirim</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {selectedDo.items.map((it, idx) => (
                    <DnaTableRow key={idx}>
                      <DnaTd className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</DnaTd>
                      <DnaTd className="py-2.5 px-3 font-medium text-slate-800">{it.name}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-center text-slate-600">{it.unit}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {it.qtyShip.toLocaleString("id-ID")}
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>

          {selectedDo.notes && (
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
              <span className="font-bold">Catatan Pengiriman:</span> {selectedDo.notes}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={onClose}>
              Tutup
            </DnaButton>
            {selectedDo.status !== "DELIVERED" && (
              <DnaButton
                variant="primary"
                onClick={() => onUpdateStatus(selectedDo.id, "DELIVERED")}
              >
                Konfirmasi Diterima (Delivered)
              </DnaButton>
            )}
          </div>
        </div>
      )}
    </DnaModal>
  );
}
