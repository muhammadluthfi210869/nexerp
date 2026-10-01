"use client";

import React from "react";
import { Printer } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  formatRupiah,
} from "@/components/dna";
import type { StockAdjustment } from "../_types/adjustment.types";

interface WarehouseAdjustmentDetailDrawerProps {
  selectedAdjustment: StockAdjustment | null;
  onClose: () => void;
  onPrint: (adjustmentNumber?: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isPendingAction?: boolean;
}

export function WarehouseAdjustmentDetailDrawer({
  selectedAdjustment,
  onClose,
  onPrint,
  onApprove,
  onReject,
  isPendingAction = false,
}: WarehouseAdjustmentDetailDrawerProps) {
  const getStatusBadge = (status: StockAdjustment["status"]) => {
    switch (status) {
      case "DRAFT":
        return <DnaBadge variant="neutral">Draft</DnaBadge>;
      case "PENDING":
      case "PENDING_APPROVAL":
        return <DnaBadge variant="warning">Menunggu Approval</DnaBadge>;
      case "APPROVED":
        return <DnaBadge variant="success">Disetujui (Jurnal Terbit)</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="critical">Ditolak</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  const isPending =
    selectedAdjustment?.status === "PENDING" ||
    selectedAdjustment?.status === "PENDING_APPROVAL";

  return (
    <DnaDetailDrawer
      isOpen={!!selectedAdjustment}
      onClose={onClose}
      title={selectedAdjustment?.adjustmentNumber || "Detail Penyesuaian"}
      subtitle={`Gudang: ${selectedAdjustment?.warehouseName} • Tipe: ${selectedAdjustment?.adjustmentTypeLabel}`}
      badge={selectedAdjustment && getStatusBadge(selectedAdjustment.status)}
      footerActions={
        <div className="flex items-center gap-2">
          <DnaButton
            variant="outline"
            size="sm"
            onClick={() => onPrint(selectedAdjustment?.adjustmentNumber)}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Dokumen
          </DnaButton>
          {selectedAdjustment && isPending && (
            <>
              <DnaButton
                variant="danger"
                size="sm"
                onClick={() => onReject(selectedAdjustment.id)}
                disabled={isPendingAction}
              >
                Tolak
              </DnaButton>
              <DnaButton
                variant="primary"
                size="sm"
                onClick={() => onApprove(selectedAdjustment.id)}
                disabled={isPendingAction}
              >
                Approve & Jurnal
              </DnaButton>
            </>
          )}
        </div>
      }
    >
      {selectedAdjustment && (
        <div className="space-y-6 text-xs">
          {/* Financial Impact Card */}
          <div
            className={`p-4 rounded-xl border space-y-2 ${
              selectedAdjustment.totalVarianceValuation < 0
                ? "bg-red-50/70 border-red-200"
                : "bg-emerald-50/70 border-emerald-200"
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Total Dampak Valuasi Varians
            </div>
            <div
              className={`text-2xl font-bold tabular-nums ${
                selectedAdjustment.totalVarianceValuation < 0
                  ? "text-red-700"
                  : "text-emerald-700"
              }`}
            >
              {formatRupiah(selectedAdjustment.totalVarianceValuation)}
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Alokasi Akun Beban (CoA):</span>
              <span className="tabular-nums font-semibold">
                {selectedAdjustment.adjustmentAccountCode} -{" "}
                {selectedAdjustment.adjustmentAccountName}
              </span>
            </div>
          </div>

          {/* Document Details */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Informasi Audit & Otorisasi
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Dibuat Oleh:</span>
                <span className="font-semibold text-slate-800">
                  {selectedAdjustment.createdBy}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Tanggal Pengajuan:</span>
                <span className="tabular-nums text-slate-800">
                  {selectedAdjustment.adjustmentDate}
                </span>
              </div>
              {selectedAdjustment.approvedBy && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block">Disetujui Oleh:</span>
                  <span className="font-semibold text-emerald-800">
                    {selectedAdjustment.approvedBy} ({selectedAdjustment.approvalDate})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Rincian Selisih Fisik per Material
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable className="w-full text-left text-xs">
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="py-2.5 px-3">Nama Material</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Sistem</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Fisik</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Selisih</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Nilai Varians</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {selectedAdjustment.items.map((it, idx) => (
                    <DnaTableRow key={idx}>
                      <DnaTd className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-800">{it.itemName}</div>
                        <div className="text-[10px] text-slate-400 tabular-nums">{it.itemCode}</div>
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right text-slate-600">
                        {it.systemQty} {it.unit}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {it.actualQty} {it.unit}
                      </DnaTd>
                      <DnaTd
                        className={`py-2.5 px-3 text-right font-bold ${
                          it.differenceQty < 0 ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {it.differenceQty > 0 ? `+${it.differenceQty}` : it.differenceQty}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatRupiah(it.varianceValuation)}
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>

          {selectedAdjustment.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-semibold block text-slate-700 mb-1">
                Catatan Penyesuaian:
              </span>
              <p className="text-slate-600 leading-relaxed">{selectedAdjustment.notes}</p>
            </div>
          )}
        </div>
      )}
    </DnaDetailDrawer>
  );
}
