"use client";

import React from "react";
import { DnaPrintDocument } from "@/components/dna";
import type { GoodsReceiptNote } from "../_types/inbound.types";

interface GrnPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  grn: GoodsReceiptNote | null;
}

export function GrnPrintModal({ isOpen, onClose, grn }: GrnPrintModalProps) {
  if (!grn) return null;

  return (
    <DnaPrintDocument
      isOpen={isOpen}
      onClose={onClose}
      documentType="LAPORAN PENERIMAAN BARANG (LPB / GRN)"
      documentNumber={grn.grnNumber}
      statusBadge={{
        label:
          grn.status === "APPROVED"
            ? "Lolos QC (Approved)"
            : grn.status === "HAS_REJECT"
            ? "Sebagian Reject"
            : grn.status === "REJECTED"
            ? "Ditolak Total"
            : "Menunggu QC",
        variant:
          grn.status === "APPROVED"
            ? "success"
            : grn.status === "HAS_REJECT"
            ? "warning"
            : grn.status === "REJECTED"
            ? "critical"
            : "neutral",
      }}
      date={grn.receiveDate}
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
        title: "Diterima Dari Supplier:",
        name: grn.vendorName,
        companyName: `${grn.vendorName} (${grn.vendorCode})`,
        attention: `Surat Jalan Vendor: ${grn.deliveryOrderNo}`,
      }}
      metaFields={[
        { label: "Nomor LPB / GRN", value: grn.grnNumber },
        { label: "Nomor PO Ref", value: grn.poNumber },
        { label: "Gudang Penerima", value: grn.warehouseName },
        { label: "No Surat Jalan", value: grn.deliveryOrderNo },
        { label: "Inspektur QC", value: grn.qcInspector },
        { label: "Petugas Gudang", value: grn.receivedBy },
      ]}
      columns={[
        {
          key: "idx",
          header: "No",
          align: "center",
          width: "35px",
          render: (_: any, i: number) => i + 1,
        },
        {
          key: "item",
          header: "Nama Bahan / Kemasan & Kode",
          render: (r: any) => (
            <div>
              <div className="font-bold text-slate-800">{r.itemName}</div>
              <div className="text-[10px] text-slate-500">Kode: {r.itemCode}</div>
            </div>
          ),
        },
        {
          key: "batch",
          header: "No. Bets / Lot",
          width: "120px",
          render: (r: any) => (
            <div>
              <div className="font-mono text-xs font-semibold">{r.batchNumber}</div>
              {r.expiryDate && <div className="text-[10px] text-slate-400">Exp: {r.expiryDate}</div>}
            </div>
          ),
        },
        {
          key: "qtyReceived",
          header: "Datang Fisik",
          align: "right",
          width: "90px",
          render: (r: any) => `${r.qtyReceived.toLocaleString("id-ID")} ${r.unit}`,
        },
        {
          key: "qtyGood",
          header: "Qty Bagus",
          align: "right",
          width: "90px",
          render: (r: any) => (
            <span className="font-bold text-emerald-700">
              {r.qtyGood.toLocaleString("id-ID")} {r.unit}
            </span>
          ),
        },
        {
          key: "qtyReject",
          header: "Qty Reject",
          align: "right",
          width: "80px",
          render: (r: any) => (
            <span className={r.qtyReject > 0 ? "font-bold text-rose-600" : "text-slate-400"}>
              {r.qtyReject > 0 ? `${r.qtyReject.toLocaleString("id-ID")} ${r.unit}` : "-"}
            </span>
          ),
        },
        {
          key: "qtyFree",
          header: "Qty Free",
          align: "right",
          width: "80px",
          render: (r: any) => (
            <span className={r.qtyFree > 0 ? "font-bold text-blue-600" : "text-slate-400"}>
              {r.qtyFree > 0 ? `${r.qtyFree.toLocaleString("id-ID")} ${r.unit}` : "-"}
            </span>
          ),
        },
      ]}
      items={grn.items}
      summaryRows={[
        {
          label: "Total Kuantitas Bagus (Masuk Real Stok)",
          value: `${grn.totalQtyGood.toLocaleString("id-ID")} Unit`,
          isBold: true,
          isHighlight: true,
        },
        {
          label: "Total Kuantitas Reject (Retur / Nota Debit)",
          value: `${grn.totalQtyReject.toLocaleString("id-ID")} Unit`,
          isBold: grn.totalQtyReject > 0,
        },
        {
          label: "Total Kuantitas Bonus Free (HPP Rp 0)",
          value: `${grn.totalQtyFree.toLocaleString("id-ID")} Unit`,
        },
      ]}
      notes={[
        "1. Barang telah diperiksa kesesuaian fisik, kelengkapan COA bahan baku, dan nomor lot batch oleh QA/QC Incoming.",
        "2. Kuantitas bagus yang tercantum menjadi dasar sah bagian Finance untuk memproses Faktur Pembelian (AP).",
        "3. Kuantitas reject wajib segera diterbitkan Surat Jalan Retur / Nota Debit kepada supplier terkait.",
        `4. Catatan Tambahan: ${grn.notes || "Kondisi fisik kemasan baik dan tersegel sempurna."}`,
      ]}
      signatures={[
        {
          title: "Pengirim / Supir Vendor",
          name: "Driver Supplier",
          role: "Ekspedisi / Vendor",
          date: grn.receiveDate,
          isSigned: true,
        },
        {
          title: "Diterima Petugas Gudang",
          name: grn.receivedBy,
          role: "Staff Receiving Gudang",
          date: grn.receiveDate,
          isSigned: true,
        },
        {
          title: "Diinspeksi QC Incoming",
          name: grn.qcInspector,
          role: "QC Raw Material & Packaging",
          date: grn.receiveDate,
          isSigned: true,
        },
        {
          title: "Disahkan Kepala Logistik",
          name: "Manager Logistik & Gudang",
          role: "Head of Warehouse",
          date: grn.receiveDate,
          isSigned: true,
        },
      ]}
    />
  );
}
