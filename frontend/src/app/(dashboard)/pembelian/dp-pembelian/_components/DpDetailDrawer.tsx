import React from "react";
import { CheckCircle2 } from "lucide-react";
import {
  DnaDetailDrawer as DnaDetailDrawerBase,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { PurchaseDp } from "../_types/dp-pembelian.types";
import { getStatusBadge } from "./getStatusBadge";

interface DpDetailDrawerProps {
  selectedDp: PurchaseDp | null;
  onClose: () => void;
  onApprovePayment: (id: string) => void;
}

export function DpDetailDrawer({
  selectedDp,
  onClose,
  onApprovePayment,
}: DpDetailDrawerProps) {
  return (
    <DnaDetailDrawerBase
      isOpen={!!selectedDp}
      onClose={onClose}
      title={selectedDp?.dpNumber || "Rincian DP Pembelian"}
      subtitle={
        selectedDp
          ? `Supplier: ${selectedDp.vendorName} â€¢ PO: ${selectedDp.poNumber}`
          : undefined
      }
      badge={selectedDp ? getStatusBadge(selectedDp.status) : undefined}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Dicatat oleh:{" "}
            <span className="font-semibold text-slate-700">
              {selectedDp?.pic}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedDp?.status === "PENDING_APPROVAL" && (
              <DnaButton
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => {
                  if (selectedDp) onApprovePayment(selectedDp.id);
                  onClose();
                }}
              >
                Setujui Pembayaran
              </DnaButton>
            )}
            <DnaButton variant="outline" size="sm" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        </div>
      }
    >
      {selectedDp && (
        <div className="space-y-5 text-xs">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">
                Total Nilai PO
              </span>
              <span className="font-bold text-slate-900 tabular-nums text-sm">
                Rp {selectedDp.totalPoAmount.toLocaleString("id-ID")}
              </span>
              <span className="text-slate-500 block text-[11px] mt-0.5">
                PO: {selectedDp.poNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">
                Nominal Uang Muka ({selectedDp.dpPercentage}%)
              </span>
              <span className="font-bold text-emerald-600 tabular-nums text-sm">
                Rp {selectedDp.dpAmount.toLocaleString("id-ID")}
              </span>
              <span className="text-slate-500 block text-[11px] mt-0.5">
                Tgl: {selectedDp.dpDate}
              </span>
            </div>
          </div>

          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Akun Sumber Pembayaran</span>
              <span className="font-medium text-slate-800 text-right">
                {selectedDp.paymentAccount}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">No. Referensi Transfer</span>
              <span className="tabular-nums text-slate-800">
                {selectedDp.referenceNumber || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status DP</span>
              <div>{getStatusBadge(selectedDp.status)}</div>
            </div>
          </div>

          {selectedDp.allocatedBillNumber && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 flex items-center justify-between">
              <div>
                <span className="font-bold block text-xs">
                  Dialokasikan ke Faktur:
                </span>
                <span className="tabular-nums text-[11px]">
                  {selectedDp.allocatedBillNumber}
                </span>
              </div>
              <DnaBadge variant="success">Faktur Berkurang</DnaBadge>
            </div>
          )}

          {/* Jurnal Akuntansi Preview */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Pencatatan Otomatis Jurnal Finansial (Double-Entry)
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="py-2.5 px-3">Kode COA</DnaTh>
                    <DnaTh className="py-2.5 px-3">Nama Akun Akuntansi</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Debit (Rp)</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Kredit (Rp)</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  <DnaTableRow className="hover:bg-slate-50">
                    <DnaTd className="py-2.5 px-3 text-indigo-600 font-medium">
                      110801
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-slate-800 font-sans font-medium">
                      Uang Muka Pembelian (Prepaid Expense)
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {selectedDp.dpAmount.toLocaleString("id-ID")}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right text-slate-400">
                      0
                    </DnaTd>
                  </DnaTableRow>
                  <DnaTableRow className="hover:bg-slate-50">
                    <DnaTd className="py-2.5 px-3 text-indigo-600 font-medium">
                      110201
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-slate-800 font-sans font-medium pl-6">
                      Kas & Bank (BCA Operasional)
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right text-slate-400">
                      0
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {selectedDp.dpAmount.toLocaleString("id-ID")}
                    </DnaTd>
                  </DnaTableRow>
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>
        </div>
      )}
    </DnaDetailDrawerBase>
  );
}
