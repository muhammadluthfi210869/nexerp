"use client";

import React from "react";
import { CheckCircle2, ArrowRight, PackageCheck } from "lucide-react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaLoadingSkeleton,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  formatRupiah,
} from "@/components/dna";
import { PendingInbound } from "../_types/faktur-pembelian.types";

interface PendingInboundTableProps {
  isLoading: boolean;
  inbounds: PendingInbound[];
  onProcess: (inbound: PendingInbound) => void;
}

export function PendingInboundTable({
  isLoading,
  inbounds,
  onProcess,
}: PendingInboundTableProps) {
  if (isLoading) {
    return <DnaLoadingSkeleton rows={5} />;
  }

  return (
    <DnaDataTableCard
      title="Penerimaan Barang Siap Difakturkan (Goods Receipt / GR)"
      description="Antrean barang fisik yang sudah diterima di gudang & siap diterbitkan faktur tagihan supplier (Alur GSERP)."
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <DnaTh className="px-4 py-2.5 w-[50px] text-center">#</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px]">Kode GR</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px]">No. Purchase Order</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px]">Tgl Terima</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[180px]">Supplier</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[160px]">Gudang Penerima</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px] text-center">Item Diterima</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px] text-right">Estimasi Tagihan</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px] text-center">Status GR</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[110px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {inbounds.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={10} className="py-8 text-center">
                  <DnaEmptyState
                    title="Tidak Ada Penerimaan Pending"
                    description="Semua penerimaan barang dari gudang sudah diproses menjadi faktur pembelian."
                  />
                </DnaTd>
              </DnaTableRow>
            ) : (
              inbounds.map((ib, idx) => (
                <DnaTableRow
                  key={ib.id}
                  className="h-[48px] hover:bg-slate-50/60 transition-colors"
                >
                  <DnaTd className="px-4 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 font-mono font-bold text-slate-800 text-xs">
                    {ib.inboundNumber}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 font-mono font-medium text-indigo-700 text-xs">
                    {ib.poNumber}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-slate-600 text-xs">
                    {ib.receivedAt}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 font-medium text-slate-800 text-xs">
                    {ib.vendorName}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-slate-600 text-xs">
                    {ib.warehouseName || "Gudang Utama"}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    <DnaBadge variant="outline">
                      {ib.itemCount} Item
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 text-xs">
                    {formatRupiah(ib.totalEstimated)}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    <DnaBadge variant={ib.status === "APPROVED" ? "success" : "info"}>
                      {ib.status}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-right">
                    <DnaButton
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => onProcess(ib)}
                    >
                      Process
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
