import React from "react";
import { Package, Warehouse, DollarSign, Layers, AlertCircle, Clock, Calendar } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  formatRupiah,
} from "@/components/dna";
import type { StockItem } from "../_types/stok.types";

interface StokDetailDrawerProps {
  item: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StokDetailDrawer({
  item,
  isOpen,
  onClose,
}: StokDetailDrawerProps) {
  if (!item) return null;

  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={item.itemName}
      subtitle={`Kode SKU: ${item.itemCode} • ${item.category}`}
      badge={
        <DnaBadge
          variant={
            item.status === "AMAN"
              ? "success"
              : item.status === "LOW_STOCK"
              ? "warning"
              : "critical"
          }
        >
          {item.status === "AMAN"
            ? "Aman (In Stock)"
            : item.status === "LOW_STOCK"
            ? "Low Stock (Reorder)"
            : "Habis (Out of Stock)"}
        </DnaBadge>
      }
    >
      <div className="space-y-6 text-xs">
        {/* Spesifikasi Item */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Spesifikasi & Identitas Material
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block text-[11px]">Nama Item:</span>
              <span className="font-semibold text-slate-900">{item.itemName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Kode SKU / Bahan:</span>
              <span className="font-mono font-bold text-blue-700">{item.itemCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Kategori:</span>
              <span className="font-medium text-slate-800">{item.category}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Satuan Dasar:</span>
              <span className="font-medium text-slate-800">{item.unit}</span>
            </div>
            {item.specifications && (
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px]">Deskripsi / Spesifikasi:</span>
                <span className="text-slate-700">{item.specifications}</span>
              </div>
            )}
          </div>
        </div>

        {/* Lokasi Gudang & Kuantitas Fisik */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-slate-500" />
            Lokasi Penyimpanan & Fisik
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block text-[11px]">Gudang Penyimpanan:</span>
              <span className="font-semibold text-slate-900">{item.warehouse}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Lokasi Bin / Rak:</span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {item.rackLocation}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Kuantitas Fisik On-Hand:</span>
              <span className="text-base font-bold text-slate-900">
                {item.qtyOnHand.toLocaleString("id-ID")} {item.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Safety Stock (Min Level):</span>
              <span className="text-sm font-semibold text-amber-700">
                {item.safetyStock.toLocaleString("id-ID")} {item.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Valuasi FIFO */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
            Valuasi Nilai Persediaan (Metode FIFO)
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-emerald-700/80 block text-[11px]">Harga Satuan FIFO:</span>
              <span className="font-mono font-semibold text-slate-900">
                {formatRupiah(item.fifoUnitCost)} / {item.unit}
              </span>
            </div>
            <div>
              <span className="text-emerald-700/80 block text-[11px]">Total Nilai Valuasi:</span>
              <span className="text-base font-bold text-emerald-800">
                {formatRupiah(item.totalValuation)}
              </span>
            </div>
          </div>
        </div>

        {/* Batch & Expiry Info */}
        {(item.batchNumber || item.expiryDate) && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Informasi Lot / Batch Aktif
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Nomor Batch / Lot:</span>
                <span className="font-mono text-slate-800">{item.batchNumber || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tanggal Kedaluwarsa:</span>
                <span className="font-mono text-slate-800">{item.expiryDate || "-"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DnaDetailDrawer>
  );
}
