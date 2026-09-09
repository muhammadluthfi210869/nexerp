"use client";

import React from "react";
import {
  ApprovalPageShell,
  ApprovalColumn,
  ApprovalDetailData,
  DnaCell,
  DnaBadge,
  formatRupiah,
} from "@/components/dna";

interface SalesOrderApprovalItem {
  id: string;
  code: string;
  customer: string;
  brand: string;
  itemsCount: number;
  totalAmount: number;
  paymentTerm: string;
  salesPic: string;
  creditStatus: "Aman" | "Mendekati Plafon" | "Melebihi Limit";
  date: string;
  dueDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
  lineItems: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    qty: number;
    unit: string;
    unitPrice: number;
    discount?: number;
    tax?: number;
    total: number;
    notes?: string;
  }>;
}

const INITIAL_SALES_DATA: SalesOrderApprovalItem[] = [
  {
    id: "so-app-1",
    code: "SO-2026-0512",
    customer: "PT Glow Skin Global",
    brand: "GlowSkin Aesthetic",
    itemsCount: 2,
    totalAmount: 385000000,
    paymentTerm: "DP 50% CBD, Pelunasan Sebelum Kirim",
    salesPic: "Fitri Handayani",
    creditStatus: "Aman",
    date: "25/08/2026",
    dueDate: "29/08/2026",
    status: "PENDING",
    notes: "Batch produksi repeat order 20.000 botol Sunscreen Glow Gel SPF 50 dan 10.000 pcs Facial Wash.",
    lineItems: [
      {
        id: "soi-1",
        itemCode: "FG-GLOW-SUN50",
        itemName: "Sunscreen Glow Gel SPF 50 PA++++ 30ml (Finished Goods)",
        qty: 20000,
        unit: "Pcs",
        unitPrice: 14500,
        discount: 5000000,
        tax: 31350000,
        total: 316350000,
        notes: "Termasuk cetak inner box hologram dan BPOM NA tertera.",
      },
      {
        id: "soi-2",
        itemCode: "FG-GLOW-FW100",
        itemName: "Gentle Facial Cleanser Low pH Oat 100ml",
        qty: 10000,
        unit: "Pcs",
        unitPrice: 6200,
        discount: 0,
        tax: 6820000,
        total: 68650000,
        notes: "Formula foaming mild surfactant.",
      },
    ],
  },
  {
    id: "so-app-2",
    code: "SO-2026-0508",
    customer: "PT Cantika Herbal Nusantara",
    brand: "HerbalCare Botanica",
    itemsCount: 1,
    totalAmount: 125000000,
    paymentTerm: "TOP 30 Hari",
    salesPic: "Budi Hermawan",
    creditStatus: "Mendekati Plafon",
    date: "22/08/2026",
    dueDate: "28/08/2026",
    status: "APPROVED",
    notes: "Kredit piutang telah diverifikasi Finance dengan plafon Rp 150.000.000.",
    lineItems: [
      {
        id: "soi-3",
        itemCode: "FG-CICA-ACNE",
        itemName: "Soothing Acne Gel Cica + Tea Tree 30gr",
        qty: 10000,
        unit: "Pcs",
        unitPrice: 12500,
        discount: 0,
        tax: 0,
        total: 125000000,
      },
    ],
  },
  {
    id: "so-app-3",
    code: "SO-2026-0499",
    customer: "CV Sinar Kosmetika Utama",
    brand: "Sinar Skin",
    itemsCount: 1,
    totalAmount: 92000000,
    paymentTerm: "TOP 45 Hari",
    salesPic: "Budi Hermawan",
    creditStatus: "Melebihi Limit",
    date: "19/08/2026",
    dueDate: "25/08/2026",
    status: "REJECTED",
    notes: "Ditolak: Invoice piutang sebelumnya telah jatuh tempo menunggak 18 hari.",
    lineItems: [
      {
        id: "soi-4",
        itemCode: "FG-LIP-TINT",
        itemName: "Velvet Lip Tint Hydrating Berry 4.5ml",
        qty: 8000,
        unit: "Pcs",
        unitPrice: 11500,
        discount: 0,
        tax: 0,
        total: 92000000,
        notes: "Ditolak oleh Finance Credit Control.",
      },
    ],
  },
];

export default function SalesApprovalPage() {
  const columns: ApprovalColumn<SalesOrderApprovalItem>[] = [
    {
      header: "Nomor SO",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.code>{item.code}</DnaCell.code>,
    },
    {
      header: "Pelanggan & Brand",
      accessor: "customer",
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.customer}</p>
          <p className="text-[11px] text-blue-600 font-medium">{item.brand}</p>
        </div>
      ),
    },
    {
      header: "Sales PIC & Tgl",
      accessor: "salesPic",
      render: (item) => (
        <div>
          <p className="font-medium text-slate-700">{item.salesPic}</p>
          <p className="text-[11px] text-slate-400">Order: {item.date}</p>
        </div>
      ),
    },
    {
      header: "Termin & Plafon",
      accessor: "creditStatus",
      render: (item) => (
        <div>
          <p className="text-xs font-semibold text-slate-700">{item.paymentTerm}</p>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
              item.creditStatus === "Aman"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : item.creditStatus === "Mendekati Plafon"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {item.creditStatus}
          </span>
        </div>
      ),
    },
    {
      header: "Total Kontrak",
      accessor: "totalAmount",
      align: "right",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-slate-900">
          {formatRupiah(item.totalAmount)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      align: "center",
      render: (item) => (
        <DnaBadge
          status={
            item.status === "APPROVED"
              ? "SUCCESS"
              : item.status === "REJECTED"
              ? "DANGER"
              : "WARNING"
          }
        >
          {item.status === "APPROVED"
            ? "DISETUJUI"
            : item.status === "REJECTED"
            ? "DITOLAK"
            : "MENUNGGU"}
        </DnaBadge>
      ),
    },
  ];

  const buildDetailData = (item: SalesOrderApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Persetujuan Sales Order: ${item.customer} (${item.brand})`,
    category: "PENJUALAN PRODUK JADI",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.salesPic,
    creatorRole: "Sales Executive",
    partnerName: item.customer,
    partnerLabel: "Klien Maklon (Pelanggan)",
    warehouseName: "Gudang Barang Jadi (GBJ)",
    totalAmount: item.totalAmount,
    notes: `${item.notes} | Syarat Pembayaran: ${item.paymentTerm}`,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "Sales Order Dibuat oleh Sales",
        actor: item.salesPic,
        role: "Sales Department",
        timestamp: `${item.date} 10:30 WIB`,
        status: "completed",
        notes: "Purchase order resmi dari klien telah ditandatangani dan dilampirkan.",
      },
      {
        id: "tl-2",
        action: "Pengecekan Plafon Piutang (Credit Check AR)",
        actor: "Finance Credit Control",
        role: "Finance AR",
        timestamp: `${item.date} 13:00 WIB`,
        status: "completed",
        notes: `Status Plafon: ${item.creditStatus}. Ketentuan termin: ${item.paymentTerm}.`,
      },
      {
        id: "tl-3",
        action: "Persetujuan Direktur Komersial / Busdev Head",
        actor: "Commercial Director",
        role: "Management",
        timestamp: item.status === "APPROVED" ? `${item.date} 16:00 WIB` : "Menunggu Eksekusi",
        status: item.status === "APPROVED" ? "completed" : item.status === "REJECTED" ? "failed" : "pending",
        notes: item.status === "REJECTED" ? item.notes : undefined,
      },
    ],
  });

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PENJUALAN PRODUK (SALES ORDER)"
      subtitle="Otorisasi pemesanan maklon klien, verifikasi plafon kredit piutang (AR), dan penerbitan Surat Perintah Kerja (SPK) produksi."
      categoryBadge="PENJUALAN PRODUK ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Penjualan Produk" },
      ]}
      items={INITIAL_SALES_DATA}
      columns={columns}
      getDetailData={buildDetailData}
      searchPlaceholder="Cari nomor SO, nama pelanggan, brand..."
    />
  );
}
