"use client";

import React from "react";
import { Phone, Edit2, FileSpreadsheet } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
  useDnaToast,
} from "@/components/dna";
import type { MasterSupplierItem } from "../_types/supplier.types";

interface SupplierDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSupplier: MasterSupplierItem | null;
  onEditSupplier: (supplier: MasterSupplierItem) => void;
}

export function SupplierDetailDrawer({
  isOpen,
  onClose,
  selectedSupplier,
  onEditSupplier,
}: SupplierDetailDrawerProps) {
  const toast = useDnaToast();

  return (
    <DnaDetailDrawer
      isOpen={isOpen && !!selectedSupplier}
      onClose={onClose}
      title={selectedSupplier?.nama || "Detail Profil Supplier"}
      subtitle={`${selectedSupplier?.vendorCode} â€¢ ${selectedSupplier?.kategoriBahan}`}
      badge={
        selectedSupplier ? (
          <DnaBadge variant={selectedSupplier.isPkp ? "success" : "default"}>
            {selectedSupplier.isPkp ? "PKP 11%" : "NON-PKP"}
          </DnaBadge>
        ) : undefined
      }
      tabs={[
        {
          id: "profile",
          label: "Profil & Kontak Rekening",
          content: selectedSupplier && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Kode Vendor:</span>
                    <span className="tabular-nums font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 font-mono">
                      {selectedSupplier.vendorCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Nama Perusahaan:</span>
                    <strong className="text-zinc-900">{selectedSupplier.nama}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kontak PIC Resmi:</span>
                    <strong className="text-slate-900 block mt-0.5">{selectedSupplier.pic}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">WhatsApp / Telp:</span>
                    <a
                      href={`https://wa.me/${selectedSupplier.phone.replace(/^0/, "62")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="tabular-nums font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      {selectedSupplier.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-slate-400 block text-[11px]">Alamat Pengiriman & Gudang:</span>
                <p className="text-slate-700 font-medium leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                  {selectedSupplier.alamatLengkap}
                </p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Wilayah:{" "}
                  <strong className="text-slate-800">
                    {selectedSupplier.kota}, {selectedSupplier.provinsi}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Rekening Bank Pembayaran:</span>
                  <span className="tabular-nums font-bold text-slate-900 text-xs block mt-1">
                    {selectedSupplier.bankAccount}
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Nomor NPWP Perusahaan:</span>
                  <span className="tabular-nums font-bold text-slate-900 text-xs block mt-1">
                    {selectedSupplier.npwp || "Belum Terdaftar"}
                  </span>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "supply",
          label: "Katalog Pasokan & Pajak",
          content: selectedSupplier && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase text-xs">
                  Syarat Transaksi & Pengadaan
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kategori Bahan:</span>
                    <strong className="text-slate-900 text-sm">{selectedSupplier.kategoriBahan}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Term of Payment (TOP):</span>
                    <strong className="text-blue-700 tabular-nums text-sm">
                      {selectedSupplier.paymentTerm}
                    </strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tarif PPN Faktur Pajak:</span>
                    <span className="tabular-nums font-bold text-slate-900">
                      {selectedSupplier.pajakPersen}% ({selectedSupplier.isPkp ? "Faktur Standar PKP" : "Non-PKP"})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status Ketersediaan Stok:</span>
                    <span className="font-semibold text-emerald-700">
                      {selectedSupplier.realStokSupplier || "Stok Tersedia di Supplier"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ]}
      footerActions={
        <div className="flex gap-2">
          <DnaButton
            variant="secondary"
            size="md"
            onClick={() => {
              onClose();
              if (selectedSupplier) onEditSupplier(selectedSupplier);
            }}
          >
            <Edit2 className="w-4 h-4 mr-1.5" />
            Sunting Data
          </DnaButton>
          <DnaButton
            variant="primary"
            size="md"
            onClick={() =>
              toast.success(
                `Riwayat Purchase Order supplier ${selectedSupplier?.vendorCode} berhasil diekspor!`
              )
            }
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Ekspor Riwayat PO
          </DnaButton>
        </div>
      }
    />
  );
}
