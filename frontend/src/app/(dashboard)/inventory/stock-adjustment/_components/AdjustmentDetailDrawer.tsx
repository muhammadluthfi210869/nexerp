"use client";

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
import { AdjustmentItem } from "../_types/stock-adjustment.types";

interface AdjustmentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAdj: AdjustmentItem | null;
}

export function AdjustmentDetailDrawer({
  isOpen,
  onClose,
  selectedAdj,
}: AdjustmentDetailDrawerProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Penyesuaian Stok: ${selectedAdj?.code || ""}`}
      size="lg"
    >
      {selectedAdj && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Adjustment</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAdj.code}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAdj.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Gudang</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAdj.warehouse}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Pembuat</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAdj.creator}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Akun Lawan CoA</p>
              <p className="text-xs font-bold text-blue-600 mt-0.5">{selectedAdj.account}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Catatan</p>
              <p className="text-xs text-slate-700 mt-0.5">{selectedAdj.notes}</p>
            </div>
          </div>

          {/* Sub-table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Rincian Barang Disesuaikan
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable className="w-full text-xs text-left">
                <DnaTableHead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <DnaTableRow>
                    <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                    <DnaTh className="py-2.5 px-3">Nama Barang</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Stok Sistem</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Stok Aktual</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Selisih</DnaTh>
                    <DnaTh className="py-2.5 px-3">Alasan / Keterangan</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody className="divide-y divide-slate-100">
                  {selectedAdj.items.map((it, idx) => (
                    <DnaTableRow key={idx}>
                      <DnaTd className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</DnaTd>
                      <DnaTd className="py-2.5 px-3 font-medium text-slate-800">{it.name}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-center text-slate-600">{it.unit}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right text-slate-600 tabular-nums">{it.systemQty.toLocaleString()}</DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right font-semibold text-slate-900 tabular-nums">{it.actualQty.toLocaleString()}</DnaTd>
                      <DnaTd className={`py-2.5 px-3 text-right font-bold tabular-nums ${it.difference < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {it.difference > 0 ? `+${it.difference}` : it.difference}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-slate-500">{it.reason || "-"}</DnaTd>
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
