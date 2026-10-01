"use client";

import React from "react";
import { DnaPrintDocument } from "@/components/dna";
import { formatRupiah } from "@/lib/utils";
import type { DpRecord } from "../_types/down-payment.types";

interface DpPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DpRecord | null;
}

export function DpPrintModal({ isOpen, onClose, record }: DpPrintModalProps) {
  if (!record) return null;

  const categoryLabel =
    record.category === "sample"
      ? "Sample R&D"
      : record.category === "legalitas"
      ? "Legalitas BPOM"
      : "Produksi Massal (PO)";

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="BUKTI PENERIMAAN UANG MUKA / KWITANSI DP"
      documentNumber={record.code}
      statusBadge={{
        label:
          record.status === "FULL"
            ? "Lunas Terpakai"
            : record.status === "PARTIAL"
            ? "Terpakai Sebagian"
            : "Aktif / Tersedia",
        variant:
          record.status === "FULL"
            ? "success"
            : record.status === "PARTIAL"
            ? "warning"
            : "neutral",
      }}
      date={record.date}
      companyInfo={{
        name: "PT AUREON KOSMETIKA INDONESIA",
        legalName: "Pabrik Maklon Kosmetik & Skincare CPKB",
        address: "Kawasan Industri Candi Blok C-12, Semarang, Jawa Tengah",
        city: "Semarang",
        phone: "(024) 7692-8819",
        email: "finance@aureonmaklon.co.id",
        npwp: "01.892.441.7-503.000",
      }}
      recipientInfo={{
        title: "Telah Diterima Dari (Klien):",
        name: record.customerName,
        companyName: `${record.customerName} (${record.brandName})`,
        attention: `Brand: ${record.brandName}`,
      }}
      metaFields={[
        { label: "Kategori DP", value: categoryLabel },
        { label: "No. Referensi", value: record.refNumber || "—" },
        { label: "Bank Penerima", value: record.bankAccount },
        { label: "Sisa Saldo Unused", value: formatRupiah(record.remainingAmount) },
      ]}
      columns={[
        {
          key: "idx",
          header: "No",
          align: "center",
          width: "40px",
          render: (_, i) => i + 1,
        },
        {
          key: "description",
          header: "Deskripsi Pembayaran Uang Muka",
          render: () => (
            <div>
              <div className="font-bold text-slate-800">
                Penerimaan Down Payment — {categoryLabel}
              </div>
              <div className="text-[10px] text-slate-500">
                Referensi Dokumen: {record.refNumber || "Non-Contract Reference"} • Rekening: {record.bankAccount}
              </div>
            </div>
          ),
        },
        {
          key: "amount",
          header: "Nominal Diterima",
          align: "right",
          width: "160px",
          render: () => formatRupiah(record.amount),
        },
      ]}
      items={[record]}
      summaryRows={[
        {
          label: "Total Penerimaan DP",
          value: formatRupiah(record.amount),
          isBold: true,
          isHighlight: true,
        },
        {
          label: "Telah Dialokasikan ke Tagihan",
          value: record.usedAmount > 0 ? formatRupiah(record.usedAmount) : "Rp 0",
        },
        {
          label: "Sisa Saldo Uang Muka Tersedia",
          value: formatRupiah(record.remainingAmount),
          isBold: true,
        },
      ]}
      totalAmountForTerbilang={record.amount}
      notes={[
        "Kwitansi ini merupakan bukti sah penerimaan dana uang muka ke rekening korporasi PT Aureon Kosmetika Indonesia.",
        "Saldo uang muka akan didebet secara otomatis saat penerbitan Faktur Penjualan resmi.",
        `Catatan Transaksi: ${record.notes || "Tidak ada catatan khusus."}`,
      ]}
      signatures={[
        {
          title: "Diterima Kasir / Finance",
          name: "Finance & Accounting",
          role: "Treasury Aureon",
          date: record.date,
          isSigned: true,
        },
        {
          title: "Disetor Oleh (Klien)",
          name: record.customerName,
          role: "Pelanggan / Klien",
          date: record.date,
          isSigned: true,
        },
        {
          title: "Diperiksa Oleh",
          name: "Supervisor Keuangan",
          role: "Finance Spv",
          date: record.date,
          isSigned: true,
        },
        {
          title: "Disahkan Oleh",
          name: "Manager Keuangan",
          role: "Head of Finance",
          date: record.date,
          isSigned: true,
        },
      ]}
    />
  );
}
