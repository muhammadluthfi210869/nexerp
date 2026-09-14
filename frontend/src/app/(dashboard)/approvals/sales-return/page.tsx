"use client";

import React from "react";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaCell,
  DnaBadge,
  formatRupiah,
} from "@/components/dna";

interface SalesReturnApprovalItem {
  id: string;
  code: string;
  refInvoice: string;
  customer: string;
  returnReason: string;
  totalAmount: number;
  requesterName: string;
  creatorRole: string;
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
    total: number;
    notes?: string;
  }>;
}

const INITIAL_SALES_RETURN_DATA: SalesReturnApprovalItem[] = [
  {
    id: "srt-1",
    code: "RET-SO-2026-0018",
    refInvoice: "INV-2026-0412",
    customer: "PT Glow Skin Global",
    returnReason: "Kemasan pump botol macet / defect manufaktur",
    totalAmount: 14500000,
    requesterName: "Rina Maharani",
    creatorRole: "Customer Care Lead",
    date: "24/08/2026",
    dueDate: "28/08/2026",
    status: "PENDING",
    notes: "Ditemukan 1.000 botol dari batch FG-GLOW-SUN50 mengalami kendala dispenser pump macet tidak keluar produk.",
    lineItems: [
      {
        id: "srti-1",
        itemCode: "FG-GLOW-SUN50",
        itemName: "Sunscreen Glow Gel SPF 50 PA++++ 30ml",
        qty: 1000,
        unit: "Pcs",
        unitPrice: 14500,
        total: 14500000,
        notes: "Uji sampling lab konfirmasi pegas pump kemasan vendor supplier cacat produksi.",
      },
    ],
  },
  {
    id: "srt-2",
    code: "RET-SO-2026-0015",
    refInvoice: "INV-2026-0390",
    customer: "PT Cantika Herbal Nusantara",
    returnReason: "Kardus penyok basah saat pengiriman ekspedisi logistik",
    totalAmount: 6250000,
    requesterName: "Fitri Handayani",
    creatorRole: "Key Account Manager",
    date: "20/08/2026",
    dueDate: "26/08/2026",
    status: "APPROVED",
    notes: "Klaim asuransi ekspedisi telah diajukan, produk pengganti telah dikirimkan kembali ke klien.",
    lineItems: [
      {
        id: "srti-2",
        itemCode: "FG-CICA-ACNE",
        itemName: "Soothing Acne Gel Cica + Tea Tree 30gr",
        qty: 500,
        unit: "Pcs",
        unitPrice: 12500,
        total: 6250000,
        notes: "Retur fisik telah diterima gudang karantina.",
      },
    ],
  },
  {
    id: "srt-3",
    code: "RET-SO-2026-0012",
    refInvoice: "INV-2026-0355",
    customer: "CV Sinar Kosmetika Utama",
    returnReason: "Klaim produk slow-moving mendekati kadaluarsa di gudang distributor klien",
    totalAmount: 18000000,
    requesterName: "Budi Hermawan",
    creatorRole: "Sales Executive",
    date: "16/08/2026",
    dueDate: "22/08/2026",
    status: "REJECTED",
    notes: "Ditolak: Perjanjian maklon sistem jual putus (FOB Factory), pabrik tidak menanggung retur barang tidak laku klien.",
    lineItems: [
      {
        id: "srti-3",
        itemCode: "FG-LIP-TINT",
        itemName: "Velvet Lip Tint Hydrating Berry 4.5ml",
        qty: 1500,
        unit: "Pcs",
        unitPrice: 12000,
        total: 18000000,
        notes: "Tidak memenuhi syarat klausul garansi cacat produksi pabrik.",
      },
    ],
  },
];

export default function SalesReturnApprovalPage() {
  const columns: ApprovalColumn<SalesReturnApprovalItem>[] = [
    {
      header: "No. Retur",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.code>{item.code}</DnaCell.code>,
    },
    {
      header: "Ref Invoice & Klien",
      accessor: "customer",
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.customer}</p>
          <p className="text-[11px] text-blue-600 font-mono font-medium">Ref: {item.refInvoice}</p>
        </div>
      ),
    },
    {
      header: "Alasan Klaim Retur",
      accessor: "returnReason",
      render: (item) => (
        <p className="text-xs text-slate-700 line-clamp-2 max-w-xs">{item.returnReason}</p>
      ),
    },
    {
      header: "Petugas & Tanggal",
      accessor: "requesterName",
      render: (item) => (
        <div>
          <p className="font-medium text-slate-700">{item.requesterName}</p>
          <p className="text-[11px] text-slate-500">Tgl: {item.date}</p>
        </div>
      ),
    },
    {
      header: "Total Nilai Retur",
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

  const buildDetailData = (item: SalesReturnApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Retur Penjualan: ${item.customer} (${item.refInvoice})`,
    category: "RETUR PENJUALAN KLIEN",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.customer,
    partnerLabel: "Pelanggan Maklon",
    warehouseName: "Gudang Karantina Retur",
    totalAmount: item.totalAmount,
    notes: `${item.returnReason} — Catatan: ${item.notes}`,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "Klaim Retur Diterima dari Klien",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: `${item.date} 11:00 WIB`,
        status: "completed",
        notes: "Foto bukti defect kemasan dan sampling batch telah didokumentasikan.",
      },
      {
        id: "tl-2",
        action: "Investigasi QC & Validasi Garansi Pabrik",
        actor: "dr. Rian Pratama",
        role: "QC & R&D Lead",
        timestamp: `${item.date} 14:15 WIB`,
        status: "completed",
        notes: "Evaluasi cacat produksi vs kelalaian pihak ketiga (ekspedisi/klien).",
      },
      {
        id: "tl-3",
        action: "Otorisasi Nota Kredit (Credit Memo) AR",
        actor: "Finance & Commercial Director",
        role: "Management",
        timestamp: item.status === "APPROVED" ? `${item.date} 16:45 WIB` : "Menunggu Eksekusi",
        status: item.status === "APPROVED" ? "completed" : item.status === "REJECTED" ? "failed" : "pending",
        notes: item.status === "REJECTED" ? item.notes : undefined,
      },
    ],
  });

  return (
    <ApprovalPageShell
      title="PERSETUJUAN RETUR PENJUALAN"
      subtitle="Otorisasi penerimaan kembali barang jadi dari pelanggan, verifikasi penyebab cacat produk, dan penerbitan nota kredit (Credit Memo)."
      categoryBadge="RETUR PENJUALAN ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Retur Penjualan" },
      ]}
      items={INITIAL_SALES_RETURN_DATA}
      columns={columns}
      getDetailData={buildDetailData}
      searchPlaceholder="Cari nomor retur, ref invoice, nama pelanggan..."
    />
  );
}
