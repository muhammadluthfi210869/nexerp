"use client";

import React from "react";
import {
  CheckCircle2,
  Printer,
  ArrowRight,
  ArrowRightLeft,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  PackageCheck,
  Boxes,
} from "lucide-react";
import {
  DnaInspectionModal,
  DnaBadge,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { WarehouseTransfer } from "../_types/pindah-gudang.types";
import { TransferStatusBadge } from "./TransferBadges";

interface TransferDetailDrawerProps {
  selectedTransfer: WarehouseTransfer | null;
  onClose: () => void;
  onConfirmReceive: (trfId: string) => void;
  onPrintTransfer?: (transfer: WarehouseTransfer) => void;
}

export function TransferDetailDrawer({
  selectedTransfer,
  onClose,
  onConfirmReceive,
  onPrintTransfer,
}: TransferDetailDrawerProps) {
  if (!selectedTransfer) return null;

  const isCompleted =
    selectedTransfer.status === "VERIFIED" || selectedTransfer.status === "COMPLETED";

  return (
    <DnaInspectionModal
      isOpen={!!selectedTransfer}
      onClose={onClose}
      title="Surat Pindah Gudang (Mutasi Antar Gudang)"
      documentCode={selectedTransfer.transferNumber}
      subtitle={`Dari: ${selectedTransfer.fromWarehouse} ➔ Ke: ${selectedTransfer.toWarehouse} • Ref: ${selectedTransfer.referenceDoc}`}
      statusBadge={<TransferStatusBadge status={selectedTransfer.status} />}
      metrics={[
        {
          label: "Total Kuantitas Transfer",
          value: `${selectedTransfer.totalQty.toLocaleString("id-ID")} Unit`,
          subtext: `${selectedTransfer.totalItems} Macam SKU`,
          variant: "brand",
        },
        {
          label: "Status Serah Terima",
          value: isCompleted ? "Verifikasi Selesai" : "Dalam Pengiriman",
          variant: isCompleted ? "success" : "warning",
        },
        {
          label: "Gudang Asal (Pengirim)",
          value: selectedTransfer.fromWarehouse.split("(")[0].trim(),
          subtext: `PIC: ${selectedTransfer.senderPic}`,
          variant: "neutral",
        },
        {
          label: "Gudang Tujuan (Penerima)",
          value: selectedTransfer.toWarehouse.split("(")[0].trim(),
          subtext: selectedTransfer.receiverPic ? `PIC: ${selectedTransfer.receiverPic}` : "Menunggu Penerima",
          variant: "neutral",
        },
      ]}
      referenceDocuments={[
        {
          label: "Dokumen Referensi",
          code: selectedTransfer.referenceDoc,
          href: selectedTransfer.referenceDoc.startsWith("SPK") ? "/production/schedule" : undefined,
        },
        {
          label: "Gudang Asal",
          code: selectedTransfer.fromWarehouse,
          href: "/warehouse/gudang",
        },
        {
          label: "Gudang Tujuan",
          code: selectedTransfer.toWarehouse,
          href: "/warehouse/gudang",
        },
      ]}
      onPrint={onPrintTransfer ? () => onPrintTransfer(selectedTransfer) : undefined}
      primaryAction={
        !isCompleted
          ? {
              label: "Verifikasi & Terima Fisik",
              icon: <CheckCircle2 className="w-3.5 h-3.5" />,
              onClick: () => onConfirmReceive(selectedTransfer.id),
              variant: "success",
            }
          : onPrintTransfer
          ? {
              label: "Cetak Surat Pindah Gudang (A4)",
              icon: <Printer className="w-3.5 h-3.5" />,
              onClick: () => onPrintTransfer(selectedTransfer),
              variant: "primary",
            }
          : undefined
      }
      tabs={[
        {
          key: "items",
          label: "Rincian Barang Dipindahkan",
          icon: <Boxes className="w-3.5 h-3.5" />,
          count: selectedTransfer.items.length,
          content: (
            <div className="space-y-4 text-xs">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-[10.5px] font-bold uppercase tracking-wider">
                      <DnaTh className="p-2.5">Material & Kode</DnaTh>
                      <DnaTh className="p-2.5">No. Bets / Lot</DnaTh>
                      <DnaTh className="p-2.5 text-right">Kuantitas Transfer</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedTransfer.items.map((it) => (
                      <DnaTableRow key={it.id} className="hover:bg-slate-50/50">
                        <DnaTd className="p-2.5 font-bold text-slate-800">
                          <div>{it.materialName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{it.materialCode}</div>
                        </DnaTd>
                        <DnaTd className="p-2.5 font-mono text-slate-700 font-semibold">{it.batchLot}</DnaTd>
                        <DnaTd className="p-2.5 text-right font-bold text-slate-900 tabular-nums">
                          {it.transferQty.toLocaleString("id-ID")} {it.unit}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>

              {/* Catatan Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-700">Catatan Mutasi:</span>
                <p className="text-slate-600">
                  {selectedTransfer.notes || "Pemindahan barang antar lokasi internal pabrik sesuai memo otorisasi logistik."}
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "handover",
          label: "Jalur Serah Terima (2-Step Handover)",
          icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
          content: (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Rute & PIC Serah Terima
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Gudang Asal (Pengirim)</span>
                    <div className="font-bold text-slate-800">{selectedTransfer.fromWarehouse}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Petugas: {selectedTransfer.senderPic}</div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Gudang Tujuan (Penerima)</span>
                    <div className="font-bold text-blue-700">{selectedTransfer.toWarehouse}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Petugas: {selectedTransfer.receiverPic || "Menunggu Konfirmasi"}
                    </div>
                  </div>
                </div>
              </div>

              {isCompleted && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verifikasi Fisik Telah Selesai
                  </div>
                  <p className="text-emerald-700 text-[11px]">
                    Diterima oleh {selectedTransfer.receiverPic || "Petugas Penerima"} pada {selectedTransfer.receivedDate || selectedTransfer.transferDate}. Saldo persediaan gudang asal berkurang dan gudang tujuan telah bertambah otomatis.
                  </p>
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
