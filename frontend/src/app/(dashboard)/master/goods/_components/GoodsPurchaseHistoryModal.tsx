"use client";

import React from "react";
import {
  DnaModal,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
} from "@/components/dna";
import type { MasterBarangItem, PurchaseHistoryItem } from "../_types/goods.types";

interface GoodsPurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBarang: MasterBarangItem | null;
  isLoadingPurchaseHistory: boolean;
  purchaseHistoryData: PurchaseHistoryItem[] | undefined;
}

export function GoodsPurchaseHistoryModal({
  isOpen,
  onClose,
  selectedBarang,
  isLoadingPurchaseHistory,
  purchaseHistoryData,
}: GoodsPurchaseHistoryModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Riwayat Pembelian: ${selectedBarang?.nama || ""}`}
      description={`Daftar transaksi Surat Pesanan (PO) untuk barang SKU ${selectedBarang?.kode || ""}`}
      size="lg"
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <DnaTh className="p-2.5">Tanggal</DnaTh>
                <DnaTh className="p-2.5">No. Pembelian</DnaTh>
                <DnaTh className="p-2.5">Supplier</DnaTh>
                <DnaTh className="p-2.5 text-center">Qty</DnaTh>
                <DnaTh className="p-2.5 text-right">Harga Satuan</DnaTh>
                <DnaTh className="p-2.5 text-right">Total Transaksi</DnaTh>
                <DnaTh className="p-2.5 text-center">Status</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoadingPurchaseHistory ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="p-6 text-center text-slate-400">
                    Memuat riwayat transaksi pembelian...
                  </DnaTd>
                </DnaTableRow>
              ) : !purchaseHistoryData || purchaseHistoryData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="p-6 text-center text-slate-400">
                    Belum ada riwayat pesanan pembelian (PO) untuk barang ini.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                purchaseHistoryData.map((po: PurchaseHistoryItem) => (
                  <DnaTableRow key={po.id} className="hover:bg-slate-50">
                    <DnaTd className="p-2.5 tabular-nums text-slate-600">
                      {po.tanggal ? new Date(po.tanggal).toLocaleDateString("id-ID") : "â€”"}
                    </DnaTd>
                    <DnaTd className="p-2.5 font-mono font-bold text-blue-700">
                      {po.poNumber}
                    </DnaTd>
                    <DnaTd className="p-2.5 font-medium text-slate-900">
                      {po.supplierName}
                    </DnaTd>
                    <DnaTd className="p-2.5 text-center tabular-nums font-semibold">
                      {po.qty}
                    </DnaTd>
                    <DnaTd className="p-2.5 text-right tabular-nums">
                      Rp {po.harga.toLocaleString("id-ID")}
                    </DnaTd>
                    <DnaTd className="p-2.5 text-right tabular-nums font-bold text-slate-900">
                      Rp {po.total.toLocaleString("id-ID")}
                    </DnaTd>
                    <DnaTd className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {po.status}
                      </span>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
        <div className="flex justify-end pt-2">
          <DnaButton variant="secondary" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
