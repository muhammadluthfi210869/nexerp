"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import type { MrpItemRecord } from "../_types/kebutuhan.types";

interface KebutuhanDetailDrawerProps {
  selectedItem: MrpItemRecord | null;
  onClose: () => void;
  onGeneratePo: (item: MrpItemRecord) => void;
}

export function KebutuhanDetailDrawer({
  selectedItem,
  onClose,
  onGeneratePo,
}: KebutuhanDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedItem}
      onClose={onClose}
      title={selectedItem?.materialName || "Detail Analisis Kebutuhan MRP"}
      subtitle={selectedItem ? `${selectedItem.materialCode} â€¢ ${selectedItem.category}` : undefined}
      badge={
        selectedItem ? (
          <DnaBadge variant={selectedItem.status === "SAFE_STOCK" ? "success" : "critical"}>
            {selectedItem.status === "SAFE_STOCK" ? "Stok Aman" : "Perlu PO"}
          </DnaBadge>
        ) : undefined
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Tutup
          </DnaButton>
          {selectedItem && selectedItem.netNeedQty > 0 && (
            <DnaButton
              variant="primary"
              size="sm"
              icon={<ShoppingCart className="w-4 h-4" />}
              onClick={() => onGeneratePo(selectedItem)}
            >
              Buat Purchase Order
            </DnaButton>
          )}
        </div>
      }
    >
      {selectedItem && (
        <div className="space-y-5 text-xs">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">SO Terkait & Produk</span>
              <span className="font-bold text-slate-900 tabular-nums text-sm block">{selectedItem.salesOrderRef}</span>
              <span className="text-slate-500 text-[11px] mt-0.5">{selectedItem.brandProduct} ({selectedItem.clientName})</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Total Biaya Pengadaan</span>
              <span className="font-bold text-blue-600 tabular-nums text-sm block">
                {selectedItem.netNeedQty > 0 ? formatCurrency(selectedItem.estimatedTotalCost) : "Rp 0 (Cukup)"}
              </span>
              <span className="text-slate-500 text-[11px] mt-0.5">Supplier: {selectedItem.primarySupplier}</span>
            </div>
          </div>

          {/* Matrix Perhitungan MRP */}
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Gross Need</span>
              <span className="font-bold text-slate-900 text-sm tabular-nums">
                {selectedItem.grossRequirement} {selectedItem.unit}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Real Stok</span>
              <span className="font-bold text-emerald-700 text-sm tabular-nums">
                {selectedItem.realStockQty} {selectedItem.unit}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5 text-[11px]">On-Order</span>
              <span className="font-bold text-blue-700 text-sm tabular-nums">
                {selectedItem.onOrderQty} {selectedItem.unit}
              </span>
            </div>
            <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200">
              <span className="text-rose-600 block mb-0.5 text-[11px] font-bold">Defisit (Perlu PO)</span>
              <span className="font-black text-rose-700 text-sm tabular-nums">
                {selectedItem.netNeedQty} {selectedItem.unit}
              </span>
            </div>
          </div>

          {/* Rekomendasi Mitra */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
              Rekomendasi Pengadaan Supplier & Estimasi Harga
            </span>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Mitra Supplier Utama:</span>
              <span className="font-bold text-slate-900">{selectedItem.primarySupplier}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Estimasi Harga Satuan:</span>
              <span className="tabular-nums font-semibold text-slate-800">
                {formatCurrency(selectedItem.estimatedUnitPrice)} / {selectedItem.unit}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-600 font-semibold">Total Biaya Pengadaan Defisit:</span>
              <span className="tabular-nums font-bold text-blue-600 text-sm">
                {formatCurrency(selectedItem.estimatedTotalCost)}
              </span>
            </div>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
