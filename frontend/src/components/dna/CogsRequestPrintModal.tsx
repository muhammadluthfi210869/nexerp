"use client";

import React from "react";
import { DnaPrintDocument, PrintCompanyInfo } from "./DnaPrintDocument";
import { formatRupiah } from "@/lib/utils";

export interface CogsItem {
  netto: number;
  moq: number;
  hppProduk: number;
  marginOp: number;
  hppPrimer1: number;
  hppPrimer2: number;
  hppSekunder: number;
  totalHpp: number;
}

export interface CogsRequestData {
  requestCode: string;
  date: string;
  customerName: string;
  address?: string;
  phone?: string;
  sampleCode: string;
  productName: string;
  nettoSample: string;
  formulaRevision: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  items: CogsItem[];
}

interface CogsRequestPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CogsRequestData | null;
  companyInfo?: PrintCompanyInfo;
}

export function CogsRequestPrintModal({
  isOpen,
  onClose,
  data,
  companyInfo,
}: CogsRequestPrintModalProps) {
  if (!data) return null;

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="PERMINTAAN HARGA POKOK PENJUALAN (HPP)"
      documentNumber={data.requestCode}
      statusBadge={{
        label: "HPP Terkalkulasi",
        variant: "neutral",
      }}
      date={data.date}
      companyInfo={companyInfo}
      recipientInfo={{
        title: "Informasi Pelanggan & Sample:",
        name: data.customerName,
        companyName: `Produk: ${data.productName} (${data.nettoSample})`,
        address: data.address,
        phone: data.phone,
        attention: `Sample: ${data.sampleCode} | ${data.formulaRevision}`,
      }}
      metaFields={[
        { label: "Dibuat Oleh", value: data.createdBy },
        { label: "Kode Sample", value: data.sampleCode },
        { label: "Formula Ref", value: data.formulaRevision },
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
          key: "moq",
          header: "MOQ (pcs)",
          align: "center",
          width: "85px",
          render: (r) => (
            <span className="font-bold">
              {Number(r.moq || 0).toLocaleString("id-ID")}
            </span>
          ),
        },
        {
          key: "hppProduk",
          header: "HPP Produk",
          align: "right",
          width: "95px",
          render: (r) => formatRupiah(r.hppProduk || 0),
        },
        {
          key: "marginOp",
          header: "Margin OP",
          align: "right",
          width: "90px",
          render: (r) => formatRupiah(r.marginOp || 0),
        },
        {
          key: "hppPrimer1",
          header: "HPP Kemasan 1",
          align: "right",
          width: "100px",
          render: (r) => formatRupiah(r.hppPrimer1 || 0),
        },
        {
          key: "hppPrimer2",
          header: "HPP Kemasan 2",
          align: "right",
          width: "100px",
          render: (r) => formatRupiah(r.hppPrimer2 || 0),
        },
        {
          key: "hppSekunder",
          header: "HPP Sekunder",
          align: "right",
          width: "95px",
          render: (r) => formatRupiah(r.hppSekunder || 0),
        },
        {
          key: "totalHpp",
          header: "Total HPP/Unit",
          align: "right",
          width: "110px",
          render: (r) => (
            <span className="font-black text-blue-700 print:text-black">
              {formatRupiah(r.totalHpp || 0)}
            </span>
          ),
        },
      ]}
      items={data.items}
      notes={data.notes}
      signatures={[
        {
          title: "Dibuat Oleh,",
          name: data.createdBy,
          role: "R&D Formulator",
        },
        {
          title: "Disetujui Oleh,",
          name: data.approvedBy || "Head of R&D",
          role: "R&D Manager",
        },
      ]}
    />
  );
}
