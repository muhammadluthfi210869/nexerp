"use client";

import React from "react";
import {
  DnaDetailDrawer,
  DnaCell,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { SalesInvoice } from "../_types/faktur-penjualan.types";

interface InvoiceDetailDrawerProps {
  detailInvoice: SalesInvoice | null;
  onClose: () => void;
  onToggleGatekeeper: () => void;
}

export function InvoiceDetailDrawer({
  detailInvoice,
  onClose,
  onToggleGatekeeper,
}: InvoiceDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!detailInvoice}
      onClose={onClose}
      title={detailInvoice?.invoiceNumber || "Rincian Faktur Penjualan"}
      subtitle={detailInvoice ? `${detailInvoice.customerName} â€¢ ${detailInvoice.brandName}` : undefined}
      badge={
        detailInvoice ? (
          <div className="flex items-center gap-2">
            <DnaCell.Badge
              status={
                detailInvoice.paymentStatus === "PAID"
                  ? "success"
                  : detailInvoice.paymentStatus === "PARTIAL"
                  ? "warning"
                  : "critical"
              }
              label={
                detailInvoice.paymentStatus === "PAID"
                  ? "Lunas"
                  : detailInvoice.paymentStatus === "PARTIAL"
                  ? "Sebagian"
                  : "Belum Bayar"
              }
            />
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold border ${
                detailInvoice.arGatekeeperStatus === "RELEASED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              DO {detailInvoice.arGatekeeperStatus}
            </span>
          </div>
        ) : undefined
      }
      actions={
        detailInvoice ? (
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant={detailInvoice.arGatekeeperStatus === "HELD" ? "primary" : "secondary"}
              onClick={onToggleGatekeeper}
            >
              {detailInvoice.arGatekeeperStatus === "HELD" ? "Rilis DO Pengiriman" : "Tahan DO (Hold)"}
            </DnaButton>
            <DnaButton variant="secondary" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        ) : undefined
      }
    >
      {detailInvoice && (
        <div className="space-y-5 text-xs">
          {/* Meta Information Cards */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Sales Order</span>
              <span className="tabular-nums font-bold text-blue-600 text-xs">{detailInvoice.soNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIC BusDev</span>
              <span className="font-semibold text-slate-800 text-xs">{detailInvoice.picBusDev}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tgl Faktur</span>
              <span className="tabular-nums text-slate-700 text-xs">{detailInvoice.invoiceDate}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jatuh Tempo</span>
              <span className="tabular-nums font-semibold text-rose-600 text-xs">{detailInvoice.dueDate}</span>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Item Barang / Jasa</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="p-2.5">Produk / Item</DnaTh>
                    <DnaTh className="p-2.5 text-right">Qty</DnaTh>
                    <DnaTh className="p-2.5 text-right">Harga Satuan</DnaTh>
                    <DnaTh className="p-2.5 text-right">Subtotal</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {detailInvoice.items.map((it) => (
                    <DnaTableRow key={it.id}>
                      <DnaTd className="p-2.5">
                        <p className="font-bold text-slate-800">{it.itemName}</p>
                        <p className="text-[10px] text-slate-400 tabular-nums">{it.itemCode}</p>
                      </DnaTd>
                      <DnaTd className="p-2.5 text-right font-medium">{it.qty.toLocaleString("id-ID")} {it.unit}</DnaTd>
                      <DnaTd className="p-2.5 text-right tabular-nums">Rp {it.price.toLocaleString("id-ID")}</DnaTd>
                      <DnaTd className="p-2.5 text-right font-bold text-slate-900 tabular-nums">Rp {it.total.toLocaleString("id-ID")}</DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>

          {/* Rekapitulasi Pembayaran & Offset DP */}
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Rincian Finansial</p>
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal Barang:</span>
              <span className="font-semibold text-slate-800 tabular-nums">Rp {detailInvoice.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Total Diskon (Rp):</span>
              <span className="tabular-nums">-Rp {detailInvoice.totalDiscount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PPN 11%:</span>
              <span className="font-semibold text-slate-800 tabular-nums">Rp {detailInvoice.taxAmount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold border-t border-slate-200 pt-1.5">
              <span>Potongan Down Payment (Kompensasi DP):</span>
              <span className="tabular-nums">-Rp {detailInvoice.downPaymentOffset.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
              <span>Grand Total Tagihan:</span>
              <span className="tabular-nums text-blue-600">Rp {detailInvoice.grandTotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 pt-1">
              <span>Sudah Dibayar:</span>
              <span className="tabular-nums text-emerald-600">Rp {detailInvoice.paidAmount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-rose-600 border-t border-slate-200 pt-1.5">
              <span>Sisa Piutang (Outstanding):</span>
              <span className="tabular-nums">Rp {(detailInvoice.grandTotal - detailInvoice.paidAmount).toLocaleString("id-ID")}</span>
            </div>
          </div>

          {detailInvoice.unpaidReason && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block mb-1">Catatan Piutang / Alasan Belum Lunas:</span>
              {detailInvoice.unpaidReason}
            </div>
          )}
        </div>
      )}
    </DnaDetailDrawer>
  );
}
