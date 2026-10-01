"use client";

import React from "react";
import { DnaPrintDocument } from "@/components/dna";
import { formatRupiah } from "@/lib/utils";
import type { SalesOrderItem } from "../_types/sales-orders.types";

interface SalesOrderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SalesOrderItem | null;
}

export function SalesOrderPrintModal({
  isOpen,
  onClose,
  order,
}: SalesOrderPrintModalProps) {
  if (!order) return null;

  const totalQty = order.items.reduce((acc, it) => acc + it.qty, 0);
  const totalDiscount = order.items.reduce((acc, it) => acc + (it.discount || 0), 0);
  const subtotalGross = order.items.reduce((acc, it) => acc + it.qty * it.unitPrice, 0);

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="SURAT PESANAN / SALES ORDER (SO)"
      documentNumber={order.soCode}
      statusBadge={{
        label: order.approvalStatus.replace(/_/g, " "),
        variant:
          order.approvalStatus === "COMPLETED"
            ? "success"
            : order.approvalStatus === "APPROVED" || order.approvalStatus === "IN_PRODUCTION"
            ? "neutral"
            : "warning",
      }}
      date={order.orderDate}
      dueDate={order.deadlineFinal}
      companyInfo={{
        name: "PT AUREON KOSMETIKA INDONESIA",
        legalName: "Pabrik Maklon Kosmetik & Skincare CPKB",
        address: "Kawasan Industri Candi Blok C-12, Semarang, Jawa Tengah",
        city: "Semarang",
        phone: "(024) 7692-8819",
        email: "sales@aureonmaklon.co.id",
        npwp: "01.892.441.7-503.000",
      }}
      recipientInfo={{
        title: "Pemesan / Customer:",
        name: order.customerName,
        companyName: `${order.customerName} (${order.brandName})`,
        address: "Alamat terdaftar pada master data klien",
        attention: `Brand: ${order.brandName}`,
      }}
      metaFields={[
        { label: "Kategori Order", value: order.category.replace(/_/g, " ") },
        { label: "Target Produksi", value: order.deadlinePic.production },
        { label: "Target Desain", value: order.deadlinePic.design },
        { label: "Gatekeeper DO", value: order.gatekeeperStatus },
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
          key: "itemName",
          header: "Nama Produk & Spesifikasi",
          render: (r) => (
            <div>
              <div className="font-bold text-slate-800">{r.itemName}</div>
              <div className="text-[10px] text-slate-500">Netto: {r.netto}</div>
            </div>
          ),
        },
        {
          key: "qty",
          header: "Qty",
          align: "right",
          width: "80px",
          render: (r) => `${r.qty.toLocaleString("id-ID")} pcs`,
        },
        {
          key: "unitPrice",
          header: "Harga Satuan",
          align: "right",
          width: "110px",
          render: (r) => formatRupiah(r.unitPrice),
        },
        {
          key: "discount",
          header: "Diskon",
          align: "right",
          width: "90px",
          render: (r) => (r.discount > 0 ? formatRupiah(r.discount) : "-"),
        },
        {
          key: "subtotal",
          header: "Subtotal",
          align: "right",
          width: "120px",
          render: (r) => formatRupiah(r.subtotal),
        },
      ]}
      items={order.items}
      summaryRows={[
        {
          label: "Subtotal Produk",
          value: formatRupiah(subtotalGross),
        },
        {
          label: "Total Diskon",
          value: totalDiscount > 0 ? `-${formatRupiah(totalDiscount)}` : "Rp 0",
        },
        {
          label: "Grand Total Nilai Order",
          value: formatRupiah(order.grandTotal),
          isBold: true,
          isHighlight: true,
        },
      ]}
      totalAmountForTerbilang={order.grandTotal}
      notes={[
        "Dokumen ini merupakan konfirmasi pesanan produksi maklon resmi yang mengikat kedua belah pihak.",
        "Jadwal pengerjaan R&D, Desain Kemasan, dan Produksi Pabrik mengacu pada matriks SLA terlampir.",
        "Pelunasan tagihan mengikuti syarat pembayaran Term of Payment yang disepakati.",
        `Catatan Tambahan: ${order.notes || "Tidak ada catatan khusus."}`,
      ]}
      signatures={[
        {
          title: "Dipesan Oleh",
          name: order.customerName,
          role: "Pelanggan / Klien",
          date: order.orderDate,
          isSigned: true,
        },
        {
          title: "Sales Executive",
          name: "Account Manager",
          role: "Komersial Aureon",
          date: order.orderDate,
          isSigned: true,
        },
        {
          title: "PPIC / SCM",
          name: "Manager PPIC",
          role: "Perencanaan Produksi",
          date: order.orderDate,
          isSigned: true,
        },
        {
          title: "Disahkan Oleh",
          name: "Direktur Operasional",
          role: "Manajemen Pabrik",
          date: order.orderDate,
          isSigned: true,
        },
      ]}
    />
  );
}
