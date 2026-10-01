"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import { ReturnType } from "../_types/retur-penjualan.types";

interface ReturFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  salesOrders: any[];
  warehouses: any[];
  formSoId: string;
  onSoChange: (soId: string) => void;
  formProductName: string;
  setFormProductName: (val: string) => void;
  formQty: string;
  setFormQty: (val: string) => void;
  formPrice: string;
  setFormPrice: (val: string) => void;
  formWarehouseId: string;
  setFormWarehouseId: (val: string) => void;
  formType: ReturnType;
  setFormType: (val: ReturnType) => void;
  formReason: string;
  setFormReason: (val: string) => void;
}

export function ReturFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  salesOrders,
  warehouses,
  formSoId,
  onSoChange,
  formProductName,
  setFormProductName,
  formQty,
  setFormQty,
  formPrice,
  setFormPrice,
  formWarehouseId,
  setFormWarehouseId,
  formType,
  setFormType,
  formReason,
  setFormReason,
}: ReturFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Retur Penjualan Baru"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
            Pilih Sales Order Referensi *
          </label>
          <select
            className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 bg-white font-medium text-zinc-900"
            value={formSoId}
            onChange={(e) => onSoChange(e.target.value)}
            required
          >
            <option value="">-- Pilih Sales Order --</option>
            {salesOrders.map((so: any) => (
              <option key={so.id} value={so.id}>
                {so.orderNumber} - {so.lead?.clientName || so.brandName || "Client"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Nama Produk Retur</label>
          <DnaInput
            placeholder="Contoh: Brightening Niacinamide Serum 10%"
            value={formProductName}
            onChange={(e) => setFormProductName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Qty Retur (Pcs) *</label>
            <DnaInput
              type="number"
              placeholder="Contoh: 100"
              value={formQty}
              onChange={(e) => setFormQty(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Harga Satuan (Rp)</label>
            <DnaInput
              type="number"
              placeholder="Contoh: 15000"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Gudang Penerima</label>
            <select
              className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 bg-white font-medium text-zinc-900"
              value={formWarehouseId}
              onChange={(e) => setFormWarehouseId(e.target.value)}
            >
              {warehouses.length > 0 ? (
                warehouses.map((wh: any) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))
              ) : (
                <option value="">Gudang Karantina Maklon</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Metode Kompensasi</label>
            <select
              className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 bg-white font-medium text-zinc-900"
              value={formType}
              onChange={(e) => setFormType(e.target.value as ReturnType)}
            >
              <option value="POTONG_TAGIHAN">Potong Faktur / Nota Kredit</option>
              <option value="GANTI_BARANG">Ganti Barang Baru</option>
              <option value="REFUND">Pengembalian Dana Kas</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Alasan Retur / Kerusakan</label>
          <textarea
            className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            rows={2}
            placeholder="Contoh: Tutup botol bocor halus saat distribusi."
            value={formReason}
            onChange={(e) => setFormReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton type="button" variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            type="submit"
            variant="primary"
            loading={isSubmitting}
          >
            Simpan & Teruskan ke QC
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
