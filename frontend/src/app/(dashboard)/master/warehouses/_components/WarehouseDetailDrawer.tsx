"use client";

import React from "react";
import { Edit2, FileSpreadsheet } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
  useDnaToast,
} from "@/components/dna";
import type {
  MasterWarehouseItem,
  WarehouseAccessItem,
} from "../_types/warehouse.types";

interface WarehouseDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWarehouse: MasterWarehouseItem | null;
  accessList: WarehouseAccessItem[];
  onOpenEditWarehouse: (item: MasterWarehouseItem) => void;
}

export function WarehouseDetailDrawer({
  isOpen,
  onClose,
  selectedWarehouse,
  accessList,
  onOpenEditWarehouse,
}: WarehouseDetailDrawerProps) {
  const toast = useDnaToast();

  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedWarehouse?.namaGudang || "Detail Fasilitas Gudang"}
      subtitle={`Kode: ${selectedWarehouse?.kodeGudang || "-"} â€¢ PIC: ${
        selectedWarehouse?.picName || "-"
      }`}
      badge={
        selectedWarehouse?.status === "ACTIVE" ? (
          <DnaBadge variant="success">FASILITAS AKTIF</DnaBadge>
        ) : (
          <DnaBadge variant="neutral">NON-AKTIF</DnaBadge>
        )
      }
      tabs={[
        {
          id: "specs",
          label: "Spesifikasi & Suhu",
          content: selectedWarehouse ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Tipe Penyimpanan & Suhu
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedWarehouse.tipePenyimpanan}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">
                    Total Bin / Slot Rak
                  </span>
                  <span className="font-bold text-zinc-900 font-mono">
                    {selectedWarehouse.totalBinLocations} Bins
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">
                    Wilayah / Kota
                  </span>
                  <span className="font-medium text-zinc-800">
                    {selectedWarehouse.lokasi}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Provinsi</span>
                  <span className="font-medium text-zinc-800">
                    {selectedWarehouse.provinsi}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">
                  Alamat Lengkap Fasilitas:
                </span>
                <div className="p-3 bg-white rounded-lg border border-zinc-200 text-zinc-700 leading-relaxed">
                  {selectedWarehouse.alamatLengkap || "-"}
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 block text-[11px]">
                    PIC Penanggung Jawab Gudang
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedWarehouse.picName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">
                    Telepon / WhatsApp
                  </span>
                  <span className="tabular-nums font-medium text-slate-800">
                    {selectedWarehouse.telepon || "-"}
                  </span>
                </div>
              </div>
            </div>
          ) : null,
        },
        {
          id: "bins_access",
          label: "Bin Slot & Hak Akses",
          content: selectedWarehouse ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-2">
                  Distribusi Blok Rak:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">
                      Blok A (Incoming / Karantina)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      6 Bin Slots â€¢ Fast Moving
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">
                      Blok B (Bahan Baku / Ruang Suhu)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      10 Bin Slots â€¢ Humidity Controlled
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">
                      Blok C (Packaging / Karton)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      8 Bin Slots â€¢ Dry Ambient
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-2">
                  Personel Berwenang untuk Gudang Ini:
                </span>
                <div className="space-y-1.5">
                  {accessList
                    .filter((acc) =>
                      acc.gudangAkses.includes(selectedWarehouse.namaGudang)
                    )
                    .map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {acc.namaPersonel}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {acc.hakAkses}
                          </div>
                        </div>
                        <DnaBadge variant="success">Diizinkan</DnaBadge>
                      </div>
                    ))}
                  {accessList.filter((acc) =>
                    acc.gudangAkses.includes(selectedWarehouse.namaGudang)
                  ).length === 0 && (
                    <div className="text-slate-400 p-2 text-center">
                      Belum ada otorisasi personel khusus
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null,
        },
      ]}
      footerActions={
        <div className="flex items-center justify-between w-full">
          <DnaButton
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={() => {
              toast.success(`Daftar slot bin ${selectedWarehouse?.namaGudang} diekspor.`);
            }}
          >
            Export Layout Rak
          </DnaButton>
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              size="sm"
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => {
                if (selectedWarehouse) {
                  onClose();
                  onOpenEditWarehouse(selectedWarehouse);
                }
              }}
            >
              Sunting Gudang
            </DnaButton>
            <DnaButton variant="primary" size="sm" onClick={onClose}>
              Selesai
            </DnaButton>
          </div>
        </div>
      }
    />
  );
}
