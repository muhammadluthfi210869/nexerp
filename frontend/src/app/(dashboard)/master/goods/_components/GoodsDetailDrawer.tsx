"use client";

import React from "react";
import { History, Edit2 } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import type { MasterBarangItem } from "../_types/goods.types";

interface GoodsDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBarang: MasterBarangItem | null;
  onOpenPurchaseHistory: (item: MasterBarangItem) => void;
  onOpenEditBarang: (item: MasterBarangItem) => void;
}

export function GoodsDetailDrawer({
  isOpen,
  onClose,
  selectedBarang,
  onOpenPurchaseHistory,
  onOpenEditBarang,
}: GoodsDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={isOpen && !!selectedBarang}
      onClose={onClose}
      title={selectedBarang?.nama || "Detail Master Barang"}
      subtitle={`${selectedBarang?.kode} â€¢ ${selectedBarang?.kategori}`}
      badge={
        selectedBarang ? (
          <DnaBadge variant={selectedBarang.realStok <= selectedBarang.stokMin ? "critical" : "success"}>
            {selectedBarang.realStok <= selectedBarang.stokMin ? "Stok Kritis" : "Stok Aman"}
          </DnaBadge>
        ) : undefined
      }
      tabs={[
        {
          id: "spec",
          label: "Spesifikasi & Riwayat",
          content: selectedBarang && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kode SKU:</span>
                    <strong className="font-mono text-blue-700">{selectedBarang.kode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kategori:</span>
                    <strong className="text-slate-900">{selectedBarang.kategori}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Harga Beli Pokok:</span>
                    <strong className="text-slate-900">
                      Rp {selectedBarang.hargaBeli.toLocaleString("id-ID")} / {selectedBarang.satuan}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Stok Terendah (ROP):</span>
                    <strong className="text-slate-900">
                      {selectedBarang.stokMin} {selectedBarang.satuan}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="text-slate-400 block text-[11px]">Transaksi Pembelian Terakhir:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Tanggal: <strong>{selectedBarang.lastPoDate || "â€”"}</strong></div>
                  <div>No. PO: <strong className="font-mono text-blue-700">{selectedBarang.lastPoNumber}</strong></div>
                  <div>Supplier: <strong>{selectedBarang.lastSupplierName}</strong></div>
                  <div>Qty: <strong>{selectedBarang.lastPoQty} {selectedBarang.satuan}</strong></div>
                </div>
              </div>
            </div>
          ),
        },
      ]}
      footerActions={
        <div className="flex gap-2">
          <DnaButton
            variant="outline"
            size="md"
            onClick={() => {
              onClose();
              if (selectedBarang) onOpenPurchaseHistory(selectedBarang);
            }}
          >
            <History className="w-4 h-4 mr-1.5" />
            Riwayat Pembelian
          </DnaButton>
          <DnaButton
            variant="secondary"
            size="md"
            onClick={() => {
              onClose();
              if (selectedBarang) onOpenEditBarang(selectedBarang);
            }}
          >
            <Edit2 className="w-4 h-4 mr-1.5" />
            Sunting
          </DnaButton>
        </div>
      }
    />
  );
}
