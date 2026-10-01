"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
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
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import type { PurchaseOrderRecord } from "../_types/scm-pembelian.types";

interface ScmDetailDrawerProps {
  selectedPo: PurchaseOrderRecord | null;
  onClose: () => void;
}

export function ScmDetailDrawer({ selectedPo, onClose }: ScmDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedPo}
      onClose={onClose}
      title={selectedPo?.poCode || "Rincian Purchase Order"}
      subtitle={selectedPo ? `Supplier: ${selectedPo.supplierName} â€¢ Gudang: ${selectedPo.warehouseTarget}` : undefined}
      badge={
        selectedPo ? (
          <DnaBadge variant={selectedPo.paymentStatus === "PAID" ? "success" : "warning"}>
            {selectedPo.paymentStatus}
          </DnaBadge>
        ) : undefined
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Dibuat oleh: <span className="font-semibold text-slate-700">{selectedPo?.creatorName}</span>
          </div>
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      }
    >
      {selectedPo && (
        <div className="space-y-5 text-xs">
          {/* Quick Metrics */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">Supplier Rekanan</span>
              <span className="font-bold text-slate-900 text-sm block">{selectedPo.supplierName}</span>
              <span className="text-slate-500 text-[11px]">
                Kategori: {selectedPo.supplierCategory} â€¢ Gudang: {selectedPo.warehouseTarget}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Grand Total PO</span>
              <span className="text-base font-bold text-blue-600 tabular-nums block">
                {formatCurrency(selectedPo.totalAmount)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Tgl Terbit PO</span>
              <span className="font-bold text-slate-800 tabular-nums text-xs">{selectedPo.date}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Target Deadline Tiba</span>
              <span className="font-bold text-rose-600 tabular-nums text-xs">{selectedPo.deadlineDate}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5 text-[11px]">PIC & Digital Sign</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {selectedPo.creatorName}
              </span>
            </div>
          </div>

          {/* Sub-tabel Item dengan 3 Pilar Fisik */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Rincian 3 Pilar Fisik Penerimaan (Bagus / Reject / Free)
            </h4>
            <div className="overflow-x-auto">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <DnaTh className="py-2 px-2">#</DnaTh>
                    <DnaTh className="py-2 px-2">KODE</DnaTh>
                    <DnaTh className="py-2 px-3">NAMA BAHAN</DnaTh>
                    <DnaTh className="py-2 px-2 text-right">ORDER</DnaTh>
                    <DnaTh className="py-2 px-2 text-right text-emerald-700">BAGUS</DnaTh>
                    <DnaTh className="py-2 px-2 text-right text-rose-600">REJECT</DnaTh>
                    <DnaTh className="py-2 px-2 text-right text-amber-600">FREE</DnaTh>
                    <DnaTh className="py-2 px-3 text-right">SUBTOTAL</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {selectedPo.items.map((it, i) => (
                    <DnaTableRow key={it.id}>
                      <DnaTd className="py-2 px-2 text-slate-400 font-bold">{i + 1}</DnaTd>
                      <DnaTd className="py-2 px-2 tabular-nums text-slate-600 text-[11px]">{it.materialCode}</DnaTd>
                      <DnaTd className="py-2 px-3 font-semibold text-slate-900">{it.materialName}</DnaTd>
                      <DnaTd className="py-2 px-2 text-right font-bold text-slate-800">
                        {it.orderedQty} {it.unit}
                      </DnaTd>
                      <DnaTd className="py-2 px-2 text-right font-bold text-emerald-700 bg-emerald-50/50">
                        {it.goodQty}
                      </DnaTd>
                      <DnaTd className="py-2 px-2 text-right font-bold text-rose-600 bg-rose-50/50">
                        {it.rejectQty}
                      </DnaTd>
                      <DnaTd className="py-2 px-2 text-right font-bold text-amber-600 bg-amber-50/50">
                        {it.freeQty}
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

          {/* Financial Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Barang:</span>
              <span className="tabular-nums">{formatCurrency(selectedPo.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Diskon Pembelian (Rp):</span>
              <span className="tabular-nums">- {formatCurrency(selectedPo.discountRp)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Ongkos Kirim:</span>
              <span className="tabular-nums">+ {formatCurrency(selectedPo.shippingCostRp)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
              <span>Grand Total:</span>
              <span className="text-blue-600 tabular-nums">{formatCurrency(selectedPo.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
