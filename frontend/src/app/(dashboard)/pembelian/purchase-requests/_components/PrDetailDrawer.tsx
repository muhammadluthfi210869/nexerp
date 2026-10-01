"use client";

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
import { formatCurrency } from "@/lib/utils";
import type { PurchaseRequestRecord } from "../_types/purchase-requests.types";
import { getStatusBadge, getPriorityBadge } from "./PrBadges";

interface PrDetailDrawerProps {
  selectedPr: PurchaseRequestRecord | null;
  onClose: () => void;
  onApprove: (pr: PurchaseRequestRecord) => void;
  onOpenReject: (pr: PurchaseRequestRecord) => void;
}

export function PrDetailDrawer({
  selectedPr,
  onClose,
  onApprove,
  onOpenReject,
}: PrDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedPr}
      onClose={onClose}
      title={selectedPr?.prCode || "Rincian Permintaan Pembelian"}
      subtitle={selectedPr ? `Departemen: ${selectedPr.department} â€¢ Pemohon: ${selectedPr.requesterName}` : undefined}
      badge={selectedPr ? getStatusBadge(selectedPr.status) : undefined}
      footer={
        <div className="flex items-center justify-between w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Tutup
          </DnaButton>
          {selectedPr && ["PENDING_HEAD", "PENDING_FINANCE", "PENDING_DIRECTOR"].includes(selectedPr.status) && (
            <div className="flex items-center gap-2">
              <DnaButton
                variant="danger"
                size="sm"
                onClick={() => onOpenReject(selectedPr)}
              >
                Tolak Pengajuan
              </DnaButton>
              <DnaButton
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => onApprove(selectedPr)}
              >
                Setujui PR (Approve)
              </DnaButton>
            </div>
          )}
        </div>
      }
    >
      {selectedPr && (
        <div className="space-y-5 text-xs">
          {/* Quick Metrics */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">Departemen & Pemohon</span>
              <span className="font-bold text-slate-900 text-sm block">{selectedPr.department}</span>
              <span className="text-slate-500 text-[11px]">
                Diajukan oleh: <span className="font-semibold text-slate-700">{selectedPr.requesterName}</span> ({selectedPr.requesterRole}) â€¢ {selectedPr.date}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Total Estimasi</span>
              <span className="text-base font-bold text-blue-600 tabular-nums block">
                {formatCurrency(selectedPr.totalEstimated)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Alokasi COA</span>
              <span className="font-bold text-slate-800 tabular-nums text-xs">{selectedPr.categoryCoa}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Target Tiba</span>
              <span className="font-bold text-slate-800 tabular-nums text-xs">{selectedPr.targetDate}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Prioritas</span>
              <div>{getPriorityBadge(selectedPr.priority)}</div>
            </div>
          </div>

          {/* Sub-tabel Item Bahan */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Daftar Bahan / Barang Diminta ({selectedPr.items.length} Item)
            </h4>
            <div className="overflow-x-auto">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <DnaTh className="py-2 px-2">#</DnaTh>
                    <DnaTh className="py-2 px-2">KODE</DnaTh>
                    <DnaTh className="py-2 px-3">NAMA BAHAN</DnaTh>
                    <DnaTh className="py-2 px-2 text-right">QTY</DnaTh>
                    <DnaTh className="py-2 px-2 text-right">EST. HARGA</DnaTh>
                    <DnaTh className="py-2 px-3 text-right">SUBTOTAL</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {selectedPr.items.map((it, i) => (
                    <DnaTableRow key={it.id}>
                      <DnaTd className="py-2 px-2 text-slate-400 font-bold">{i + 1}</DnaTd>
                      <DnaTd className="py-2 px-2 tabular-nums text-slate-600 text-[11px]">{it.materialCode}</DnaTd>
                      <DnaTd className="py-2 px-3 font-semibold text-slate-900">
                        {it.materialName}
                        {it.notes && <span className="block text-[10px] text-slate-400">{it.notes}</span>}
                      </DnaTd>
                      <DnaTd className="py-2 px-2 text-right font-bold text-slate-800">
                        {it.qty} {it.unit}
                      </DnaTd>
                      <DnaTd className="py-2 px-2 text-right tabular-nums text-slate-600 text-[11px]">
                        {formatCurrency(it.estimatedPrice)}
                      </DnaTd>
                      <DnaTd className="py-2 px-3 text-right font-bold text-blue-600 tabular-nums text-[11px]">
                        {formatCurrency(it.subtotal)}
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>

          {selectedPr.approvalNotes && (
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block mb-0.5">Catatan Otorisasi / Evaluasi:</span>
              {selectedPr.approvalNotes}
            </div>
          )}
        </div>
      )}
    </DnaDetailDrawer>
  );
}
