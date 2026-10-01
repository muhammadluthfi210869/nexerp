"use client";

import React from "react";
import { DnaDrawer, DnaBadge, DnaButton } from "@/components/dna";
import type { ReceivingReportRow } from "../_types/report-penerimaan.types";

interface ReportPenerimaanDetailDrawerProps {
  selectedRow: ReceivingReportRow | null;
  onClose: () => void;
}

export function ReportPenerimaanDetailDrawer({
  selectedRow,
  onClose,
}: ReportPenerimaanDetailDrawerProps) {
  if (!selectedRow) return null;

  return (
    <DnaDrawer
      isOpen={!!selectedRow}
      onClose={onClose}
      title="Detail Penerimaan Barang"
      subtitle={`Nomor GRN: ${selectedRow.grnNumber}`}
      size="lg"
      footer={
        <DnaButton variant="secondary" onClick={onClose} className="w-full">
          Tutup
        </DnaButton>
      }
    >
      <div className="space-y-6">
        {/* Info Dokumen */}
        <div className="bg-slate-50/75 p-4 rounded-lg border border-slate-200/80 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Dokumen & Transaksi
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Tanggal Penerimaan:</span>
              <span className="font-medium text-slate-800">{selectedRow.receiveDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Nomor PO Referensi:</span>
              <span className="font-mono font-medium text-blue-600">{selectedRow.poNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">No. Surat Jalan (SJ):</span>
              <span className="font-mono font-medium text-slate-800">{selectedRow.deliveryOrderNo || "-"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Gudang Penyimpanan:</span>
              <span className="font-medium text-slate-800">{selectedRow.warehouseName}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Nama Supplier:</span>
              <span className="font-semibold text-slate-900">{selectedRow.vendorName}</span>
            </div>
          </div>
        </div>

        {/* Info Barang & Kuantitas */}
        <div className="border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Informasi Barang & Fisik
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <span className="text-slate-500">Nama Barang:</span>
              <span className="font-semibold text-slate-900 text-right">{selectedRow.itemName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500">Kode SKU:</span>
              <span className="font-mono text-slate-700">{selectedRow.itemCode}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500">No. Batch / Lot:</span>
              <span className="font-mono text-slate-700">{selectedRow.batchNumber || "-"}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500">Satuan Unit:</span>
              <DnaBadge variant="neutral">{selectedRow.unit}</DnaBadge>
            </div>
          </div>

          {/* Breakdown Kuantitas */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-center">
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <div className="text-[10px] text-blue-600 font-medium">Diterima</div>
              <div className="text-sm font-bold text-blue-700 mt-0.5">
                {selectedRow.qtyReceived.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="text-[10px] text-emerald-600 font-medium">Bagus</div>
              <div className="text-sm font-bold text-emerald-700 mt-0.5">
                {selectedRow.qtyGood.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
              <div className="text-[10px] text-rose-600 font-medium">Reject</div>
              <div className="text-sm font-bold text-rose-700 mt-0.5">
                {selectedRow.qtyReject.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
              <div className="text-[10px] text-purple-600 font-medium">Gratis</div>
              <div className="text-sm font-bold text-purple-700 mt-0.5">
                {selectedRow.qtyFree.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>

        {/* Catatan Tambahan */}
        {selectedRow.notes && (
          <div className="text-xs bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-amber-900">
            <span className="font-bold block mb-1">Catatan Penerimaan:</span>
            <p>{selectedRow.notes}</p>
          </div>
        )}
      </div>
    </DnaDrawer>
  );
}
