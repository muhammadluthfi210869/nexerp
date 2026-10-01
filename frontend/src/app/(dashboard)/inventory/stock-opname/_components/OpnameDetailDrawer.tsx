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
  DnaBadge,
} from "@/components/dna";
import { OpnameRecord } from "../_types/stock-opname.types";

interface OpnameDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOpn: OpnameRecord | null;
}

export function OpnameDetailDrawer({
  isOpen,
  onClose,
  selectedOpn,
}: OpnameDetailDrawerProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <DnaBadge variant="success">Selesai (Approved)</DnaBadge>;
      case "DRAFT":
        return <DnaBadge variant="warning">Draft Opname</DnaBadge>;
      default:
        return <DnaBadge variant="default">{status}</DnaBadge>;
    }
  };

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Stock Opname: ${selectedOpn?.code || ""}`}
      size="lg"
    >
      {selectedOpn && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Opname</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedOpn.code}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Opname</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedOpn.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Gudang</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedOpn.warehouse}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Petugas</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedOpn.creator}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Status Approval</p>
              <div className="mt-0.5">{getStatusBadge(selectedOpn.status)}</div>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Catatan</p>
              <p className="text-xs text-slate-700 mt-0.5">{selectedOpn.notes}</p>
            </div>
          </div>

          {/* Sub-table Detail */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Hasil Penghitungan Fisik
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="w-10 text-center">#</DnaTh>
                    <DnaTh>Nama Barang</DnaTh>
                    <DnaTh className="text-center">Satuan</DnaTh>
                    <DnaTh className="text-right">Stok Sistem</DnaTh>
                    <DnaTh className="text-right">Stok Fisik</DnaTh>
                    <DnaTh className="text-right">Selisih</DnaTh>
                    <DnaTh>Catatan</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {selectedOpn.items.map((it, idx) => (
                    <DnaTableRow key={idx}>
                      <DnaTd className="text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                      <DnaTd className="font-medium text-slate-800">{it.name}</DnaTd>
                      <DnaTd className="text-center text-slate-600">{it.unit}</DnaTd>
                      <DnaTd className="text-right text-slate-500 tabular-nums">{it.systemQty.toLocaleString()}</DnaTd>
                      <DnaTd className="text-right font-semibold text-slate-900 tabular-nums">{it.actualQty.toLocaleString()}</DnaTd>
                      <DnaTd className={`text-right font-bold tabular-nums ${it.difference === 0 ? "text-slate-400" : it.difference < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {it.difference > 0 ? `+${it.difference}` : it.difference}
                      </DnaTd>
                      <DnaTd className="text-slate-500">{it.notes || "-"}</DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        </div>
      )}
    </DnaModal>
  );
}

export { OpnameDetailDrawer as OpnameDetailModal };
