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

interface PurchaseReturnItem {
  id: string;
  code: string;
  refPo: string;
  supplier: string;
  warehouse: string;
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

const INITIAL_PURCHASE_RETURN_DATA: PurchaseReturnItem[] = [
  {
    id: "prt-1",
    code: "RET-PO-2026-0042",
    refPo: "PO-2026-0812",
    supplier: "PT Chemindo Makmur Abadi",
    warehouse: "Gudang Bahan Baku (GBB-01)",
    returnReason: "Reject QC Lab: Viskositas dan pH di luar spesifikasi CoA",
    totalAmount: 24500000,
    requesterName: "Bambang Trianto",
    creatorRole: "QC Inspector",
    date: "25/08/2026",
    dueDate: "29/08/2026",
    status: "PENDING",
    notes: "Lot RAW-CARB-940 batch CN2608 ditemukan menggumpal dan pH 4.1 (batas standar 5.0 - 6.5). Klaim penggantian batch baru atau Nota Kredit.",
    lineItems: [
      {
        id: "prti-1",
        itemCode: "RAW-CARB-940",
        itemName: "Carbomer 940 Polymer Grade",
        qty: 50,
        unit: "Kg",
        unitPrice: 490000,
        total: 24500000,
        notes: "Drum tersegel ditandai Karantina REJECT QC.",
      },
    ],
  },
  {
    id: "prt-2",
    code: "RET-PO-2026-0039",
    refPo: "PO-2026-0798",
    supplier: "CV Botol Packaging Sejahtera",
    warehouse: "Gudang Kemasan (GK-02)",
    returnReason: "Pecah & Gores pada leher botol kaca saat unboxing kedatangan",
    totalAmount: 11200000,
    requesterName: "Agus Supriyadi",
    creatorRole: "Kepala Gudang Kemasan",
    date: "21/08/2026",
    dueDate: "27/08/2026",
    status: "APPROVED",
    notes: "Supplier telah menerbitkan Surat Kesanggupan Retur Barang pengganti maksimal 3 hari kerja.",
    lineItems: [
      {
        id: "prti-2",
        itemCode: "PKG-BTL-050",
        itemName: "Botol Kaca Amber 50ml Dropper Pipet",
        qty: 3200,
        unit: "Pcs",
        unitPrice: 3500,
        total: 11200000,
        notes: "Retur fisik telah diambil armada ekspedisi supplier.",
      },
    ],
  },
  {
    id: "prt-3",
    code: "RET-PO-2026-0035",
    refPo: "PO-2026-0775",
    supplier: "PT Sentra Kimia Nusantara",
    warehouse: "Gudang Bahan Baku (GBB-01)",
    returnReason: "Masa Expired < 12 Bulan saat penerimaan",
    totalAmount: 8500000,
    requesterName: "Siti Rahma, S.Farm",
    creatorRole: "Procurement Specialist",
    date: "18/08/2026",
    dueDate: "24/08/2026",
    status: "REJECTED",
    notes: "Ditolak: Perjanjian PO khusus diskon clearance menyepakati batas minimum shelf-life 8 bulan.",
    lineItems: [
      {
        id: "prti-3",
        itemCode: "RAW-VITE-01",
        itemName: "Vitamin E Tocopherol Acetate 98%",
        qty: 10,
        unit: "Kg",
        unitPrice: 850000,
        total: 8500000,
        notes: "Sesuai klausul addendum PO harga promosi.",
      },
    ],
  },
];

export default function PurchaseReturnApprovalPage() {
  const columns: ApprovalColumn<PurchaseReturnItem>[] = [
    {
      header: "No. Retur",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.code>{item.code}</DnaCell.code>,
    },
    {
      header: "Ref PO & Supplier",
      accessor: "supplier",
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.supplier}</p>
          <p className="text-[11px] text-blue-600 font-mono font-medium">Ref: {item.refPo}</p>
        </div>
      ),
    },
    {
      header: "Alasan Retur",
      accessor: "returnReason",
      render: (item) => (
        <p className="text-xs text-slate-700 line-clamp-2 max-w-xs">{item.returnReason}</p>
      ),
    },
    {
      header: "Pemohon & Lokasi",
      accessor: "requesterName",
      render: (item) => (
        <div>
          <p className="font-medium text-slate-700">{item.requesterName}</p>
          <p className="text-[11px] text-slate-500">{item.warehouse}</p>
        </div>
      ),
    },
    {
      header: "Total Nilai Klaim",
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

  const buildDetailData = (item: PurchaseReturnItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Retur Pembelian: ${item.supplier} (${item.refPo})`,
    category: "RETUR PEMBELIAN VENDOR",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.supplier,
    partnerLabel: "Supplier Vendor",
    warehouseName: item.warehouse,
    totalAmount: item.totalAmount,
    notes: `${item.returnReason} — Catatan Tambahan: ${item.notes}`,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "Tiket Retur Dibuat oleh Gudang / QC",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: `${item.date} 10:00 WIB`,
        status: "completed",
        notes: "Barang reject dipisahkan ke area karantina retur gudang.",
      },
      {
        id: "tl-2",
        action: "Konfirmasi Nota Debit & Penyesuaian Hutang Dagang (AP)",
        actor: "Finance AP Specialist",
        role: "Accounting Dept",
        timestamp: `${item.date} 13:45 WIB`,
        status: "completed",
        notes: "Penyesuaian faktur pembelian disiapkan menunggu approval manajemen.",
      },
      {
        id: "tl-3",
        action: "Otorisasi Direktur Operasional / SCM Head",
        actor: "Head of Supply Chain",
        role: "Management",
        timestamp: item.status === "APPROVED" ? `${item.date} 16:30 WIB` : "Menunggu Eksekusi",
        status: item.status === "APPROVED" ? "completed" : item.status === "REJECTED" ? "failed" : "pending",
        notes: item.status === "REJECTED" ? item.notes : undefined,
      },
    ],
  });

  return (
    <ApprovalPageShell
      title="PERSETUJUAN RETUR PEMBELIAN"
      subtitle="Verifikasi nota retur pengadaan material reject, klaim garansi vendor supplier, dan penyesuaian hutang dagang (AP)."
      categoryBadge="RETUR PEMBELIAN ~1"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Retur Pembelian" },
      ]}
      items={INITIAL_PURCHASE_RETURN_DATA}
      columns={columns}
      getDetailData={buildDetailData}
      searchPlaceholder="Cari nomor retur, ref PO, nama vendor..."
    />
  );
}
