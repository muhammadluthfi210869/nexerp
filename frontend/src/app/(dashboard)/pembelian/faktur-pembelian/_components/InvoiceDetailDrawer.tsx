"use client";

import React from "react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { PurchaseBill } from "../_types/faktur-pembelian.types";

interface InvoiceDetailDrawerProps {
  selectedBill: PurchaseBill | null;
  onClose: () => void;
  onOpenReasonModal: (bill: PurchaseBill) => void;
}

export function InvoiceDetailDrawer({
  selectedBill,
  onClose,
  onOpenReasonModal,
}: InvoiceDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedBill}
      onClose={onClose}
      title={selectedBill?.billNumber || "Rincian Faktur Pembelian"}
      subtitle={selectedBill ? `Supplier: ${selectedBill.vendorName} â€¢ PO: ${selectedBill.poNumber}` : undefined}
      badge={
        selectedBill ? (
          <DnaBadge variant={selectedBill.paymentStatus === "PAID" ? "success" : "warning"}>
            {selectedBill.paymentStatus === "PAID" ? "Lunas" : "Belum Lunas"}
          </DnaBadge>
        ) : undefined
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Dicatat oleh: <span className="font-semibold text-slate-700">{selectedBill?.pic}</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedBill && selectedBill.paymentStatus !== "PAID" && (
              <DnaButton
                variant="outline"
                size="sm"
                onClick={() => onOpenReasonModal(selectedBill)}
              >
                Edit Alasan Belum Lunas
              </DnaButton>
            )}
            <DnaButton variant="outline" size="sm" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        </div>
      }
    >
      {selectedBill && (
        <div className="space-y-5 text-xs">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Tgl Faktur / Deadline</span>
              <span className="font-bold text-slate-900 tabular-nums text-sm block">{selectedBill.invoiceDate}</span>
              <span className="text-amber-700 block text-[11px] font-medium mt-0.5">Deadline: {selectedBill.dueDate}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Grand Total Tagihan</span>
              <span className="font-bold text-slate-900 tabular-nums text-sm block">
                Rp {selectedBill.grandTotal.toLocaleString("id-ID")}
              </span>
              <span className="text-slate-500 block text-[11px] mt-0.5">Kategori: {selectedBill.procurementCategory}</span>
            </div>
          </div>

          {selectedBill.unpaidReason && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900">
              <span className="font-bold block mb-1">Catatan Alasan Belum Lunas:</span>
              {selectedBill.unpaidReason}
            </div>
          )}

          {/* Items Table */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Rincian Barang & Diskon Nominal (Rp)
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh className="py-2.5 px-3">Kode</DnaTh>
                    <DnaTh className="py-2.5 px-3">Nama Barang</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Qty</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Harga</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Diskon (Rp)</DnaTh>
                    <DnaTh className="py-2.5 px-3 text-right">Subtotal</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {selectedBill.items.map((it) => (
                    <DnaTableRow key={it.id} className="hover:bg-slate-50">
                      <DnaTd className="py-2 px-3 text-indigo-600 font-medium">{it.itemCode}</DnaTd>
                      <DnaTd className="py-2 px-3 font-sans font-semibold text-slate-800">{it.itemName}</DnaTd>
                      <DnaTd className="py-2 px-3 text-right text-slate-700">
                        {it.qty} {it.unit}
                      </DnaTd>
                      <DnaTd className="py-2 px-3 text-right text-slate-600">
                        Rp {it.price.toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="py-2 px-3 text-right text-emerald-600 font-bold">
                        - Rp {(it.discountRp || 0).toLocaleString("id-ID")}
                      </DnaTd>
                      <DnaTd className="py-2 px-3 text-right font-bold text-slate-900">
                        Rp {it.total.toLocaleString("id-ID")}
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Bruto:</span>
              <span className="tabular-nums">Rp {selectedBill.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Total Diskon:</span>
              <span className="tabular-nums">- Rp {selectedBill.totalDiscountRp.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>PPN (11%):</span>
              <span className="tabular-nums">Rp {selectedBill.taxAmount.toLocaleString("id-ID")}</span>
            </div>
            {selectedBill.dpDeduction > 0 && (
              <div className="flex justify-between text-purple-600 font-medium">
                <span>Potongan DP:</span>
                <span className="tabular-nums">- Rp {selectedBill.dpDeduction.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
              <span>Grand Total:</span>
              <span className="tabular-nums text-indigo-700">Rp {selectedBill.grandTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
