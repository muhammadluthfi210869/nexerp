import React from "react";
import { CheckCircle2 } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { PurchaseReturn } from "../_types/purchase-returns.types";
import { getStatusBadge, getCompensationBadge } from "./ReturnBadges";

interface ReturnDetailDrawerProps {
  selectedReturn: PurchaseReturn | null;
  onClose: () => void;
  onApproveVendor: (id: string) => void;
  onCompleteReturn: (id: string) => void;
  isApprovePending: boolean;
  isCompletePending: boolean;
}

export function ReturnDetailDrawer({
  selectedReturn,
  onClose,
  onApproveVendor,
  onCompleteReturn,
  isApprovePending,
  isCompletePending,
}: ReturnDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedReturn}
      onClose={onClose}
      title={selectedReturn?.returnNumber || "Rincian Retur Pembelian"}
      subtitle={
        selectedReturn
          ? `Supplier: ${selectedReturn.vendorName} â€¢ PO: ${selectedReturn.poNumber}`
          : undefined
      }
      badge={selectedReturn ? getStatusBadge(selectedReturn.status) : undefined}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            PIC Pengajuan:{" "}
            <span className="font-semibold text-slate-700">{selectedReturn?.pic}</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedReturn?.status === "WAITING_APPROVAL" && (
              <DnaButton
                variant="primary"
                size="sm"
                loading={isApprovePending}
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => onApproveVendor(selectedReturn.id)}
              >
                Setujui Klaim Retur
              </DnaButton>
            )}
            {selectedReturn?.status === "DRAFT" && (
              <DnaButton
                variant="primary"
                size="sm"
                loading={isCompletePending}
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => onCompleteReturn(selectedReturn.id)}
              >
                Tandai Kompensasi Selesai
              </DnaButton>
            )}
            <DnaButton variant="outline" size="sm" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        </div>
      }
    >
      {selectedReturn && (
        <div className="space-y-5 text-xs">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Referensi Inbound</span>
              <span className="font-bold text-slate-900 tabular-nums text-xs block">
                {selectedReturn.poNumber}
              </span>
              <span className="text-slate-500 text-[11px] mt-0.5">GRN: {selectedReturn.grnNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Total Nilai Debit Note</span>
              <span className="font-bold text-red-600 tabular-nums text-sm block">
                Rp {selectedReturn.totalAmount.toLocaleString("id-ID")}
              </span>
              <div className="mt-0.5">{getCompensationBadge(selectedReturn.compensationType)}</div>
            </div>
          </div>

          {/* Sub-tabel Item Retur */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Daftar Barang yang Diretur ({selectedReturn.items.length} Item)
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="py-2.5 px-3">Kode</DnaTh>
                    <DnaTh className="py-2.5 px-3">Nama Barang</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Qty</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Harga</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Total Nilai</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {selectedReturn.items.map((it) => (
                    <DnaTableRow key={it.id} className="hover:bg-slate-50">
                      <DnaTd className="py-2.5 px-3 text-indigo-600 font-medium">{it.itemCode}</DnaTd>
                      <DnaTd className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                        {it.itemName}
                        <p className="text-[10px] text-rose-600 font-normal font-sans">{it.rejectReason}</p>
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right text-slate-700">
                        {it.qtyReturned} {it.unit}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right text-slate-600">
                        Rp {it.unitPrice.toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="py-2.5 px-3 text-right font-bold text-red-600">
                        Rp {it.totalPrice.toLocaleString("id-ID")}
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
