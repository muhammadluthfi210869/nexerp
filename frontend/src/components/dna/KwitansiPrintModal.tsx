"use client";

import React from "react";
import { DnaPrintDocument, PrintCompanyInfo } from "./DnaPrintDocument";
import { formatRupiah, terbilangRupiah } from "@/lib/utils";

export interface KwitansiData {
  code: string;
  date: string;
  customerName: string;
  brandName?: string;
  address?: string;
  phone?: string;
  amount: number;
  paymentMethod?: string;
  invoiceNumber?: string;
  notes?: string;
  items?: Array<{
    name: string;
    qty?: number;
    price?: number;
    total?: number;
  }>;
}

interface KwitansiPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: KwitansiData | null;
  companyInfo?: PrintCompanyInfo;
}

export function KwitansiPrintModal({
  isOpen,
  onClose,
  data,
  companyInfo,
}: KwitansiPrintModalProps) {
  if (!data) return null;

  const items = data.items?.length
    ? data.items
    : [
        {
          name: `Pembayaran Pelunasan / Uang Muka${data.invoiceNumber ? ` - Ref ${data.invoiceNumber}` : ""}`,
          qty: 1,
          price: data.amount,
          total: data.amount,
        },
      ];

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="KWITANSI PEMBAYARAN"
      documentNumber={data.code}
      stampBadge="LUNAS"
      date={data.date}
      companyInfo={companyInfo}
      recipientInfo={{
        title: "Telah Diterima Dari:",
        name: data.customerName,
        companyName: data.brandName ? `Brand: ${data.brandName}` : undefined,
        address: data.address,
        phone: data.phone,
      }}
      metaFields={[
        { label: "Metode Bayar", value: data.paymentMethod || "Transfer Bank" },
        { label: "Ref Invoice", value: data.invoiceNumber || "-" },
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
          key: "name",
          header: "Keterangan Pembayaran",
          render: (r) => (
            <div>
              <div className="font-bold text-slate-800">{r.name}</div>
              {data.notes && (
                <div className="text-[10px] text-slate-500">{data.notes}</div>
              )}
            </div>
          ),
        },
        {
          key: "qty",
          header: "Qty",
          align: "center",
          width: "60px",
          render: (r) => r.qty || 1,
        },
        {
          key: "price",
          header: "Nominal",
          align: "right",
          width: "140px",
          render: (r) => formatRupiah(r.price || r.total || 0),
        },
      ]}
      items={items}
      summaryRows={[
        {
          label: "Total Diterima (Lunas)",
          value: formatRupiah(data.amount),
          isBold: true,
          isHighlight: true,
        },
      ]}
      totalAmountForTerbilang={data.amount}
      notes={data.notes}
      signatures={[
        {
          title: "Disetujui & Diterima Oleh,",
          name: "Finance & Accounting",
          role: "Kasir / Finance Dept",
        },
      ]}
    />
  );
}
