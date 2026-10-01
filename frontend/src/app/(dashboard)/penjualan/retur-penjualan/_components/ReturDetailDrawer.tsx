"use client";

import React from "react";
import { DnaDetailDrawer, DnaCell, DnaButton } from "@/components/dna";
import { SalesReturn, statusBadgeConfig } from "../_types/retur-penjualan.types";

interface ReturDetailDrawerProps {
  detailReturn: SalesReturn | null;
  onClose: () => void;
  onCompleteReturn: (ret: SalesReturn) => void;
  isCompleting: boolean;
}

export function ReturDetailDrawer({
  detailReturn,
  onClose,
  onCompleteReturn,
  isCompleting,
}: ReturDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!detailReturn}
      onClose={onClose}
      title={detailReturn?.returnCode || "Detail Klaim Retur"}
      subtitle={detailReturn ? `${detailReturn.customerName} â€¢ ${detailReturn.soNumber}` : undefined}
      badge={
        detailReturn ? (
          <DnaCell.Badge
            status={statusBadgeConfig[detailReturn.status]?.status || "default"}
            label={statusBadgeConfig[detailReturn.status]?.label || detailReturn.status}
          />
        ) : undefined
      }
      actions={
        detailReturn ? (
          <div className="flex items-center justify-between w-full">
            {detailReturn.status !== "SELESAI" ? (
              <DnaButton
                variant="primary"
                loading={isCompleting}
                onClick={() => onCompleteReturn(detailReturn)}
              >
                Selesaikan & Offset Tagihan
              </DnaButton>
            ) : (
              <div />
            )}
            <DnaButton variant="secondary" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        ) : undefined
      }
    >
      {detailReturn && (
        <div className="space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Klien Maklon</span>
              <span className="font-semibold text-slate-800 text-xs">{detailReturn.customerName}</span>
              <p className="text-[10px] text-slate-400">{detailReturn.brandName || "Private Label"}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">No. Sales Order</span>
              <span className="tabular-nums font-bold text-blue-600 text-xs">{detailReturn.soNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tanggal Retur</span>
              <span className="tabular-nums text-slate-700 text-xs">{detailReturn.returnDate}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gudang Alokasi</span>
              <span className="font-semibold text-slate-700 text-xs">{detailReturn.warehouseName}</span>
            </div>
          </div>

          {/* Financial Details */}
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Rincian Barang & Nilai</p>
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Produk:</span>
              <span className="font-bold text-slate-800">{detailReturn.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jumlah Diretur:</span>
              <span className="font-semibold text-slate-800 tabular-nums">{detailReturn.qtyReturned.toLocaleString("id-ID")} pcs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Harga Satuan:</span>
              <span className="font-semibold text-slate-800 tabular-nums">Rp {detailReturn.unitPrice.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-rose-600">
              <span>Total Nilai Kompensasi:</span>
              <span className="tabular-nums">Rp {detailReturn.totalValue.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
            <span className="font-bold block mb-1">Alasan Pengembalian / Temuan Lapangan:</span>
            {detailReturn.reason}
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
