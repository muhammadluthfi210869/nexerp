"use client";

import React from "react";
import {
  ApprovalPageShell,
  ApprovalColumn,
  ApprovalDetailData,
  DnaCell,
  DnaBadge,
} from "@/components/dna";

interface GoodsRequestApprovalItem {
  id: string;
  code: string;
  originWarehouse: string;
  destWarehouse: string;
  requesterName: string;
  creatorRole: string;
  batchWoRef: string;
  itemsCount: number;
  date: string;
  dueDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
  lineItems: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    qty: number;
    approvedQty?: number;
    unit: string;
    notes?: string;
  }>;
}

const INITIAL_GOODS_REQUEST_DATA: GoodsRequestApprovalItem[] = [
  {
    id: "grq-1",
    code: "GRQ-2026-0521",
    originWarehouse: "Gudang Bahan Baku (GBB-01)",
    destWarehouse: "Lini Produksi Formulasi A (Reaktor 1)",
    requesterName: "Agus Santoso",
    creatorRole: "Mixing Operator Lead",
    batchWoRef: "WO-2608-01",
    itemsCount: 3,
    date: "25/08/2026",
    dueDate: "26/08/2026",
    status: "PENDING",
    notes: "Pengeluaran bahan aktif untuk batch Sunscreen SPF 50. Penimbangan bahan steril di Cleanroom Kelas D.",
    lineItems: [
      {
        id: "grqi-1",
        itemCode: "RAW-NIA-01",
        itemName: "Niacinamide PC Grade USP 99.8%",
        qty: 125,
        approvedQty: 125,
        unit: "Kg",
        notes: "Lot Batch: Chem-2607-09. Status lolos uji QC rilis.",
      },
      {
        id: "grqi-2",
        itemCode: "RAW-HA-02",
        itemName: "Sodium Hyaluronate 1% Solution",
        qty: 50,
        approvedQty: 50,
        unit: "Kg",
        notes: "Lot Batch: HA-2606-11.",
      },
      {
        id: "grqi-3",
        itemCode: "RAW-GLY-01",
        itemName: "Glycerin USP 99.7% Food Grade",
        qty: 75,
        approvedQty: 75,
        unit: "Kg",
        notes: "Lot Batch: GLY-2608-01.",
      },
    ],
  },
  {
    id: "grq-2",
    code: "GRQ-2026-0519",
    originWarehouse: "Gudang Kemasan (GK-02)",
    destWarehouse: "Lini Filling & Packaging Line B",
    requesterName: "Siti Muniroh",
    creatorRole: "Packaging Line Leader",
    batchWoRef: "WO-2608-02",
    itemsCount: 2,
    date: "25/08/2026",
    dueDate: "27/08/2026",
    status: "PENDING",
    notes: "Pengeluaran botol dropper dan inner box untuk pengisian serum Acne Gel.",
    lineItems: [
      {
        id: "grqi-4",
        itemCode: "PKG-BTL-030",
        itemName: "Botol Pipet Serum 30ml Matte White",
        qty: 5000,
        approvedQty: 5000,
        unit: "Pcs",
        notes: "Telah melewati proses UV-C sanitasi.",
      },
      {
        id: "grqi-5",
        itemCode: "PKG-BOX-030",
        itemName: "Inner Box Outer Emboss 30ml",
        qty: 5000,
        approvedQty: 5000,
        unit: "Pcs",
        notes: "Karton pallet A-04.",
      },
    ],
  },
  {
    id: "grq-3",
    code: "GRQ-2026-0514",
    originWarehouse: "Gudang Bahan Baku (GBB-01)",
    destWarehouse: "Laboratorium R&D Formulasi",
    requesterName: "Aisyah Putri, S.Si",
    creatorRole: "R&D Specialist",
    batchWoRef: "SMP-2026-0312",
    itemsCount: 2,
    date: "24/08/2026",
    dueDate: "25/08/2026",
    status: "APPROVED",
    notes: "Pengambilan bahan baku uji coba laboratorium trial batch 2.",
    lineItems: [
      {
        id: "grqi-6",
        itemCode: "RAW-CARB-940",
        itemName: "Carbomer 940 Polymer Grade",
        qty: 2,
        approvedQty: 2,
        unit: "Kg",
      },
      {
        id: "grqi-7",
        itemCode: "RAW-TEA-01",
        itemName: "Triethanolamine 99% Pure",
        qty: 1,
        approvedQty: 1,
        unit: "Kg",
      },
    ],
  },
  {
    id: "grq-4",
    code: "GRQ-2026-0508",
    originWarehouse: "Gudang Bahan Baku (GBB-01)",
    destWarehouse: "Lini Produksi Formulasi B",
    requesterName: "Hendra Gunawan",
    creatorRole: "Production Supervisor",
    batchWoRef: "WO-2608-04",
    itemsCount: 1,
    date: "22/08/2026",
    dueDate: "24/08/2026",
    status: "APPROVED",
    notes: "Disetujui kepala gudang dan formulator produksi.",
    lineItems: [
      {
        id: "grqi-8",
        itemCode: "RAW-EXT-CEN",
        itemName: "Centella Asiatica Hydro Extract 10:1",
        qty: 15,
        approvedQty: 15,
        unit: "Kg",
      },
    ],
  },
  {
    id: "grq-5",
    code: "GRQ-2026-0502",
    originWarehouse: "Gudang Karantina QC",
    destWarehouse: "Lini Produksi Formulasi A",
    requesterName: "Hendra Gunawan",
    creatorRole: "Production Supervisor",
    batchWoRef: "WO-2608-03",
    itemsCount: 1,
    date: "19/08/2026",
    dueDate: "21/08/2026",
    status: "REJECTED",
    notes: "Ditolak: Material masih berstatus Karantina QC Uji Mikrobiologi (belum rilis sertifikat CoA rilis).",
    lineItems: [
      {
        id: "grqi-9",
        itemCode: "RAW-FRG-GT01",
        itemName: "Fragrance Green Tea Blossom",
        qty: 20,
        approvedQty: 0,
        unit: "Kg",
        notes: "Uji inkubasi 5 hari belum selesai.",
      },
    ],
  },
  {
    id: "grq-6",
    code: "GRQ-2026-0498",
    originWarehouse: "Gudang Barang Jadi (GBJ)",
    destWarehouse: "Showroom & Marketing Display",
    requesterName: "Fitri Handayani",
    creatorRole: "Busdev Representative",
    batchWoRef: "MKT-EXPO-2026",
    itemsCount: 2,
    date: "17/08/2026",
    dueDate: "20/08/2026",
    status: "APPROVED",
    notes: "Pengeluaran produk jadi dummy untuk display pameran Cosmobeaute Jakarta.",
    lineItems: [
      {
        id: "grqi-10",
        itemCode: "FG-GLOW-SUN50",
        itemName: "Sunscreen Glow Gel SPF 50 (Tester)",
        qty: 50,
        approvedQty: 50,
        unit: "Pcs",
      },
      {
        id: "grqi-11",
        itemCode: "FG-CICA-ACNE",
        itemName: "Soothing Acne Gel (Tester)",
        qty: 50,
        approvedQty: 50,
        unit: "Pcs",
      },
    ],
  },
];

export default function GoodsRequestApprovalPage() {
  const columns: ApprovalColumn<GoodsRequestApprovalItem>[] = [
    {
      header: "No. Bon Permintaan",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.code>{item.code}</DnaCell.code>,
    },
    {
      header: "Gudang Asal & Tujuan",
      accessor: "originWarehouse",
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.originWarehouse}</p>
          <p className="text-[11px] text-blue-600 font-medium">➔ {item.destWarehouse}</p>
        </div>
      ),
    },
    {
      header: "Ref SPK / Batch",
      accessor: "batchWoRef",
      render: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-700">{item.batchWoRef}</span>
          <p className="text-[11px] text-slate-500">{item.itemsCount} Item Material</p>
        </div>
      ),
    },
    {
      header: "Pemohon & Tanggal",
      accessor: "requesterName",
      render: (item) => (
        <div>
          <p className="font-medium text-slate-700">{item.requesterName}</p>
          <p className="text-[11px] text-slate-400">{item.creatorRole} • {item.date}</p>
        </div>
      ),
    },
    {
      header: "Keterangan",
      accessor: "notes",
      render: (item) => (
        <p className="text-xs text-slate-600 line-clamp-2 max-w-xs">{item.notes}</p>
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

  const buildDetailData = (item: GoodsRequestApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Bon Pengeluaran Material: ${item.batchWoRef}`,
    category: "MUTASI BARANG DAN MATERIAL INTERNAL",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.destWarehouse,
    partnerLabel: "Lokasi / Lini Tujuan",
    warehouseName: item.originWarehouse,
    notes: `Ref Batch/SPK: ${item.batchWoRef} | Keterangan: ${item.notes}`,
    lineItems: item.lineItems.map((li) => ({
      ...li,
      unitPrice: 0,
      total: 0,
    })),
    timeline: [
      {
        id: "tl-1",
        action: "Bon Permintaan Material Dibuat",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: `${item.date} 07:30 WIB`,
        status: "completed",
        notes: `Permintaan bahan untuk batch ${item.batchWoRef}.`,
      },
      {
        id: "tl-2",
        action: "Verifikasi Stok & Rilis QC Gudang",
        actor: "Kepala Gudang Bahan",
        role: "Warehouse Dept",
        timestamp: `${item.date} 09:15 WIB`,
        status: "completed",
        notes: "Ketersediaan lot dan status rilis karantina divalidasi.",
      },
      {
        id: "tl-3",
        action: "Otorisasi Pengeluaran Barang (Plant Manager)",
        actor: "Plant Manager Produksi",
        role: "Management",
        timestamp: item.status === "APPROVED" ? `${item.date} 11:00 WIB` : "Menunggu Eksekusi",
        status: item.status === "APPROVED" ? "completed" : item.status === "REJECTED" ? "failed" : "pending",
        notes: item.status === "REJECTED" ? item.notes : undefined,
      },
    ],
  });

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PERMINTAAN BARANG (MATERIAL REQUISITION)"
      subtitle="Validasi bon pengeluaran bahan baku, kemasan, dan transfer antar gudang untuk kelancaran eksekusi batch produksi SPK."
      categoryBadge="PERMINTAAN BARANG ~6"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Permintaan Barang" },
      ]}
      items={INITIAL_GOODS_REQUEST_DATA}
      columns={columns}
      getDetailData={buildDetailData}
      searchPlaceholder="Cari nomor bon, ref SPK, gudang, nama pemohon..."
    />
  );
}
