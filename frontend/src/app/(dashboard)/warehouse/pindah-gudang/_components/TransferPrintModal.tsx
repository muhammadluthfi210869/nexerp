"use client";

import React from "react";
import { DnaPrintDocument } from "@/components/dna";
import type { WarehouseTransfer } from "../_types/pindah-gudang.types";

interface TransferPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: WarehouseTransfer | null;
}

export function TransferPrintModal({
  isOpen,
  onClose,
  transfer,
}: TransferPrintModalProps) {
  if (!transfer) return null;

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="SURAT PINDAH GUDANG (SPG / MUTASI INTERNAL)"
      documentNumber={transfer.transferNumber}
      statusBadge={{
        label:
          transfer.status === "VERIFIED" || transfer.status === "COMPLETED"
            ? "Telah Diterima & Diverifikasi"
            : transfer.status === "IN_TRANSIT"
            ? "Dalam Perjalanan"
            : "Draft Mutasi",
        variant:
          transfer.status === "VERIFIED" || transfer.status === "COMPLETED"
            ? "success"
            : transfer.status === "IN_TRANSIT"
            ? "warning"
            : "neutral",
      }}
      date={transfer.transferDate}
      companyInfo={{
        name: "PT AUREON KOSMETIKA INDONESIA",
        legalName: "Pabrik Maklon Kosmetik & Skincare CPKB",
        address: "Kawasan Industri Candi Blok C-12, Semarang, Jawa Tengah",
        city: "Semarang",
        phone: "(024) 7692-8819",
        email: "warehouse@aureonmaklon.co.id",
        npwp: "01.892.441.7-503.000",
      }}
      recipientInfo={{
        title: "Tujuan Pemindahan:",
        name: transfer.toWarehouse,
        companyName: `Dari: ${transfer.fromWarehouse}`,
        attention: `PIC Penerima: ${transfer.receiverPic || "Petugas Gudang Tujuan"}`,
      }}
      metaFields={[
        { label: "Nomor Dokumen", value: transfer.transferNumber },
        { label: "Tanggal Transfer", value: transfer.transferDate },
        { label: "Gudang Asal", value: transfer.fromWarehouse },
        { label: "Gudang Tujuan", value: transfer.toWarehouse },
        { label: "Dokumen Referensi", value: transfer.referenceDoc },
        { label: "PIC Pengirim", value: transfer.senderPic },
      ]}
      columns={[
        {
          key: "idx",
          header: "No",
          align: "center",
          width: "35px",
          render: (_, i) => i + 1,
        },
        {
          key: "item",
          header: "Nama Material / Produk & Kode SKU",
          render: (r) => (
            <div>
              <div className="font-bold text-slate-800">{r.materialName}</div>
              <div className="text-[10px] text-slate-500 font-mono">Kode: {r.materialCode}</div>
            </div>
          ),
        },
        {
          key: "lot",
          header: "No. Bets / Lot",
          width: "140px",
          render: (r) => <span className="font-mono text-xs font-semibold">{r.batchLot}</span>,
        },
        {
          key: "qty",
          header: "Kuantitas Transfer",
          align: "right",
          width: "130px",
          render: (r) => (
            <span className="font-bold text-slate-900">
              {r.transferQty.toLocaleString("id-ID")} {r.unit}
            </span>
          ),
        },
      ]}
      items={transfer.items}
      summaryRows={[
        {
          label: "Total Volume Pemindahan Fisik",
          value: `${transfer.totalQty.toLocaleString("id-ID")} Unit`,
          isBold: true,
          isHighlight: true,
        },
        {
          label: "Total Varian SKU Dipindahkan",
          value: `${transfer.totalItems} Macam SKU`,
        },
      ]}
      notes={[
        "1. Barang yang tercantum pada surat ini dipindahkan antar lokasi penyimpanan internal pabrik.",
        "2. Petugas pengirim dan pengangkut bertanggung jawab atas keutuhan fisik barang selama perjalanan.",
        "3. Petugas gudang tujuan wajib melakukan verifikasi fisik (hitung fisik & cek lot) sebelum menandatangani bukti penerimaan.",
        `4. Catatan Tambahan: ${transfer.notes || "Pemindahan rutin antar buffer stock gudang."}`,
      ]}
      signatures={[
        {
          title: "Pengirim (Gudang Asal)",
          name: transfer.senderPic,
          role: "Petugas Gudang Asal",
          date: transfer.transferDate,
          isSigned: true,
        },
        {
          title: "Supir / Pengangkut",
          name: "Driver Internal",
          role: "Logistik Pabrik",
          date: transfer.transferDate,
          isSigned: true,
        },
        {
          title: "Penerima (Gudang Tujuan)",
          name: transfer.receiverPic || "Petugas Penerima",
          role: "Petugas Gudang Tujuan",
          date: transfer.receivedDate || transfer.transferDate,
          isSigned: transfer.status === "VERIFIED" || transfer.status === "COMPLETED",
        },
        {
          title: "Disetujui Kepala Logistik",
          name: "Manager Logistik",
          role: "Head of Warehouse",
          date: transfer.transferDate,
          isSigned: true,
        },
      ]}
    />
  );
}
