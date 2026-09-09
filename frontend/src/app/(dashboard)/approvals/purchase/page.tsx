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

interface PurchaseApprovalItem {
  id: string;
  code: string;
  supplier: string;
  warehouse: string;
  itemsCount: number;
  totalAmount: number;
  paymentTerm: string;
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
    discount?: number;
    tax?: number;
    total: number;
    notes?: string;
  }>;
}

const INITIAL_PURCHASE_DATA: PurchaseApprovalItem[] = [
  {
    id: "po-app-1",
    code: "PO-2026-0881",
    supplier: "PT Chemindo Makmur Abadi",
    warehouse: "Gudang Bahan Baku (GBB-01)",
    itemsCount: 3,
    totalAmount: 145200000,
    paymentTerm: "TOP 30 Hari",
    requesterName: "Siti Rahma, S.Farm",
    creatorRole: "Procurement Specialist",
    date: "24/08/2026",
    dueDate: "30/08/2026",
    status: "PENDING",
    notes: "Pengadaan urgent bahan aktif Niacinamide PC Grade dan Hyaluronic Acid untuk batch produksi WO-2608-01.",
    lineItems: [
      {
        id: "poi-1",
        itemCode: "RAW-NIA-01",
        itemName: "Niacinamide PC Grade USP 99.8%",
        qty: 250,
        unit: "Kg",
        unitPrice: 350000,
        discount: 2500000,
        tax: 9350000,
        total: 94350000,
        notes: "Sertifikat CoA dan Halal terlampir.",
      },
      {
        id: "poi-2",
        itemCode: "RAW-HA-02",
        itemName: "Sodium Hyaluronate 1% Solution",
        qty: 100,
        unit: "Kg",
        unitPrice: 420000,
        discount: 0,
        tax: 4620000,
        total: 46620000,
        notes: "Simpan pada suhu ruang sejuk (15-25°C).",
      },
      {
        id: "poi-3",
        itemCode: "RAW-GLY-01",
        itemName: "Glycerin USP 99.7% Food Grade",
        qty: 150,
        unit: "Kg",
        unitPrice: 28000,
        discount: 0,
        tax: 462000,
        total: 4230000,
        notes: "Kemasan drum 250kg tersegel.",
      },
    ],
  },
  {
    id: "po-app-2",
    code: "PO-2026-0882",
    supplier: "CV Botol Packaging Sejahtera",
    warehouse: "Gudang Kemasan (GK-02)",
    itemsCount: 2,
    totalAmount: 48500000,
    paymentTerm: "Cash Before Delivery (CBD)",
    requesterName: "Ahmad Fauzi",
    creatorRole: "Procurement Officer",
    date: "25/08/2026",
    dueDate: "02/09/2026",
    status: "PENDING",
    notes: "Pengadaan botol serum pipet matte white 30ml untuk brand GlowSkin Series batch 3.",
    lineItems: [
      {
        id: "poi-4",
        itemCode: "PKG-BTL-030",
        itemName: "Botol Pipet Serum 30ml Matte White + Gold Collar",
        qty: 10000,
        unit: "Pcs",
        unitPrice: 3800,
        discount: 500000,
        tax: 4125000,
        total: 41625000,
        notes: "Uji drop test dan leak proof lolos QC pack.",
      },
      {
        id: "poi-5",
        itemCode: "PKG-BOX-030",
        itemName: "Inner Box Outer Emboss Hologram 30ml",
        qty: 10000,
        unit: "Pcs",
        unitPrice: 650,
        discount: 0,
        tax: 715000,
        total: 6875000,
        notes: "Finishing doff + hotprint silver.",
      },
    ],
  },
  {
    id: "po-app-3",
    code: "PO-2026-0879",
    supplier: "PT Aroma Essensial Indonesia",
    warehouse: "Gudang Bahan Baku (GBB-01)",
    itemsCount: 1,
    totalAmount: 32000000,
    paymentTerm: "TOP 14 Hari",
    requesterName: "Rian Hidayat",
    creatorRole: "SCM Specialist",
    date: "22/08/2026",
    dueDate: "28/08/2026",
    status: "APPROVED",
    notes: "Pewangi Fragrance Hypoallergenic Green Tea untuk body lotion batch Agustus.",
    lineItems: [
      {
        id: "poi-6",
        itemCode: "RAW-FRG-GT01",
        itemName: "Fragrance Green Tea Blossom Hypoallergenic IFRA-Compliant",
        qty: 40,
        unit: "Kg",
        unitPrice: 800000,
        discount: 0,
        tax: 0,
        total: 32000000,
      },
    ],
  },
  {
    id: "po-app-4",
    code: "PO-2026-0875",
    supplier: "PT Sentra Kimia Nusantara",
    warehouse: "Gudang Bahan Baku (GBB-01)",
    itemsCount: 2,
    totalAmount: 18700000,
    paymentTerm: "TOP 30 Hari",
    requesterName: "Siti Rahma, S.Farm",
    creatorRole: "Procurement Specialist",
    date: "20/08/2026",
    dueDate: "26/08/2026",
    status: "REJECTED",
    notes: "Harga per kilogram melebihi plafon budget HPP formulasi approved.",
    lineItems: [
      {
        id: "poi-7",
        itemCode: "RAW-EXT-CEN",
        itemName: "Centella Asiatica Hydro Extract 10:1",
        qty: 25,
        unit: "Kg",
        unitPrice: 748000,
        discount: 0,
        tax: 0,
        total: 18700000,
        notes: "Ditolak: harga vendor naik 30% dari kontrak tahunan.",
      },
    ],
  },
];

export default function PurchaseApprovalPage() {
  const columns: ApprovalColumn<PurchaseApprovalItem>[] = [
    {
      header: "Nomor PO",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.code>{item.code}</DnaCell.code>,
    },
    {
      header: "Supplier & Gudang Tujuan",
      accessor: "supplier",
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.supplier}</p>
          <p className="text-[11px] text-slate-500">{item.warehouse}</p>
        </div>
      ),
    },
    {
      header: "Pemohon",
      accessor: "requesterName",
      render: (item) => (
        <div>
          <p className="font-medium text-slate-700">{item.requesterName}</p>
          <p className="text-[11px] text-slate-400">{item.creatorRole}</p>
        </div>
      ),
    },
    {
      header: "Termin & Tgl",
      accessor: "date",
      render: (item) => (
        <div>
          <p className="text-slate-700 text-xs font-semibold">{item.paymentTerm}</p>
          <p className="text-[11px] text-slate-500">Tgl: {item.date}</p>
        </div>
      ),
    },
    {
      header: "Total Nominal",
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

  const buildDetailData = (item: PurchaseApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Persetujuan Purchase Order: ${item.supplier}`,
    category: "PENGADAAN PEMBELIAN",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.supplier,
    partnerLabel: "Supplier Vendor",
    warehouseName: item.warehouse,
    totalAmount: item.totalAmount,
    notes: item.notes,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "PO Diterbitkan oleh Procurement",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: `${item.date} 09:30 WIB`,
        status: "completed",
        notes: "Purchase order diverifikasi sesuai PR dan ketersediaan supplier.",
      },
      {
        id: "tl-2",
        action: "Verifikasi Plafon Anggaran Finance",
        actor: "Finance Review Bot / AP Staff",
        role: "Finance Dept",
        timestamp: `${item.date} 11:15 WIB`,
        status: "completed",
        notes: "Budget belanja bahan baku tersedia dalam pagu Q3.",
      },
      {
        id: "tl-3",
        action: "Persetujuan Direktur / General Manager",
        actor: "Executive Approver",
        role: "Management",
        timestamp: item.status === "APPROVED" ? `${item.date} 14:00 WIB` : "Menunggu Eksekusi",
        status: item.status === "APPROVED" ? "completed" : item.status === "REJECTED" ? "failed" : "pending",
        notes: item.status === "REJECTED" ? "Ditolak karena tidak sesuai plafon harga." : undefined,
      },
    ],
  });

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PEMBELIAN (PURCHASE ORDER)"
      subtitle="Verifikasi dan otorisasi pengadaan purchase order, plafon harga vendor supplier, dan jadwal kedatangan gudang."
      categoryBadge="PEMBELIAN ~4"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Pembelian" },
      ]}
      items={INITIAL_PURCHASE_DATA}
      columns={columns}
      getDetailData={buildDetailData}
      searchPlaceholder="Cari nomor PO, nama vendor supplier, pemohon..."
    />
  );
}
