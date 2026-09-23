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

interface CogsApprovalItem {
  id: string;
  code: string;
  client: string;
  productName: string;
  sampleRef: string;
  moq: number;
  formulaHpp: number;
  packagingHpp: number;
  overheadHpp: number;
  totalHpp: number;
  marginPercent: number;
  sellingPrice: number;
  requesterName: string;
  creatorRole: string;
  date: string;
  dueDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
}

const INITIAL_COGS_DATA: CogsApprovalItem[] = [
  {
    id: "cogs-1",
    code: "HPP-2026-0128",
    client: "PT Glow Skin Global",
    productName: "Sunscreen Glow Gel SPF 50 PA++++ 30ml",
    sampleRef: "SMP-2026-0312",
    moq: 10000,
    formulaHpp: 8250,
    packagingHpp: 4450,
    overheadHpp: 1500,
    totalHpp: 14200,
    marginPercent: 35,
    sellingPrice: 21850,
    requesterName: "Aisyah Putri, S.Si",
    creatorRole: "R&D Costing Specialist",
    date: "25/08/2026",
    dueDate: "29/08/2026",
    status: "PENDING",
    notes: "Kalkulasi HPP berdasarkan harga bahan baku Q3 dan kurs USD 16.200. Kemasan menggunakan botol tube doff lokal.",
  },
  {
    id: "cogs-2",
    code: "HPP-2026-0125",
    client: "PT Cantika Herbal Nusantara",
    productName: "Soothing Acne Gel Cica + Tea Tree 30gr",
    sampleRef: "SMP-2026-0308",
    moq: 5000,
    formulaHpp: 5800,
    packagingHpp: 3200,
    overheadHpp: 1400,
    totalHpp: 10400,
    marginPercent: 40,
    sellingPrice: 17350,
    requesterName: "Aisyah Putri, S.Si",
    creatorRole: "R&D Costing Specialist",
    date: "23/08/2026",
    dueDate: "28/08/2026",
    status: "PENDING",
    notes: "Formula airless jar akrilik impor dengan MOQ minimum 5.000 pcs.",
  },
  {
    id: "cogs-3",
    code: "HPP-2026-0119",
    client: "CV Royal Beauty Luxe",
    productName: "Brightening Essence Toner Galactomyces 100ml",
    sampleRef: "SMP-2026-0290",
    moq: 20000,
    formulaHpp: 7500,
    packagingHpp: 5100,
    overheadHpp: 1600,
    totalHpp: 14200,
    marginPercent: 32,
    sellingPrice: 20900,
    requesterName: "Aisyah Putri, S.Si",
    creatorRole: "R&D Costing Specialist",
    date: "21/08/2026",
    dueDate: "27/08/2026",
    status: "APPROVED",
    notes: "HPP disetujui Finance & Komersial untuk penerbitan penawaran harga resmi (Quotation).",
  },
  {
    id: "cogs-4",
    code: "HPP-2026-0112",
    client: "CV Sinar Kosmetika Utama",
    productName: "Hydrating Lip Oil Peptide Tint 5ml",
    sampleRef: "SMP-2026-0275",
    moq: 3000,
    formulaHpp: 6200,
    packagingHpp: 6500,
    overheadHpp: 1800,
    totalHpp: 14500,
    marginPercent: 18,
    sellingPrice: 17700,
    requesterName: "Aisyah Putri, S.Si",
    creatorRole: "R&D Costing Specialist",
    date: "17/08/2026",
    dueDate: "23/08/2026",
    status: "REJECTED",
    notes: "Ditolak: Margin laba kotor 18% di bawah ambang batas minimum perusahaan (30%) untuk batch kecil MOQ 3.000 pcs.",
  },
];

export default function RequestCogsApprovalPage() {
  const columns: ApprovalColumn<CogsApprovalItem>[] = [
    {
      header: "No. HPP",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.Code value={item.code} />,
    },
    {
      header: "Produk & Klien",
      accessor: "productName",
      sortable: true,
      render: (item) => (
        <DnaCell.Text
          primary={item.productName}
          secondary={item.client}
        />
      ),
    },
    {
      header: "Target MOQ",
      accessor: "moq",
      align: "right",
      sortable: true,
      render: (item) => <DnaCell.Number value={item.moq} suffix="pcs" />,
    },
    {
      header: "HPP / Unit",
      accessor: "totalHpp",
      align: "right",
      sortable: true,
      render: (item) => <DnaCell.Currency value={item.totalHpp} />,
    },
    {
      header: "Margin",
      accessor: "marginPercent",
      align: "center",
      sortable: true,
      render: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums">
          +{item.marginPercent}%
        </span>
      ),
    },
    {
      header: "Rekomendasi Jual",
      accessor: "sellingPrice",
      align: "right",
      sortable: true,
      render: (item) => <DnaCell.Currency value={item.sellingPrice} />,
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

  const buildDetailData = (item: CogsApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Persetujuan HPP Produk: ${item.productName}`,
    category: "KALKULASI HPP DAN HARGA JUAL",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.client,
    partnerLabel: "Klien Pemesan",
    warehouseName: "R&D Costing Department",
    totalAmount: item.sellingPrice * item.moq,
    notes: `${item.notes} [Sample Ref: ${item.sampleRef}] | Margin Gross Target: ${item.marginPercent}% | Rekomendasi Harga Jual: ${formatRupiah(item.sellingPrice)}/pcs`,
    lineItems: [
      {
        id: "c-1",
        itemCode: "COMP-FORMULA",
        itemName: "Biaya Bahan Baku Formulasi (BOM Formula per Unit)",
        qty: item.moq,
        unit: "Pcs",
        unitPrice: item.formulaHpp,
        total: item.formulaHpp * item.moq,
        notes: "Berdasarkan Bill of Materials approved R&D Lab.",
      },
      {
        id: "c-2",
        itemCode: "COMP-PKG",
        itemName: "Biaya Bahan Kemasan Primer & Sekunder (Packaging per Unit)",
        qty: item.moq,
        unit: "Pcs",
        unitPrice: item.packagingHpp,
        total: item.packagingHpp * item.moq,
        notes: "Botol/Jar + Inner Box + Label + Shrink wrap.",
      },
      {
        id: "c-3",
        itemCode: "COMP-OVERHEAD",
        itemName: "Direct Labor, Mesin & Factory Overhead per Unit",
        qty: item.moq,
        unit: "Pcs",
        unitPrice: item.overheadHpp,
        total: item.overheadHpp * item.moq,
        notes: "Depresiasi reaktor, listrik, uji QC rilis batch.",
      },
    ],
    timeline: [
      {
        id: "tl-1",
        action: "Simulasi HPP Dibuat oleh R&D Costing",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: `${item.date} 10:15 WIB`,
        status: "completed",
        notes: "Komponen formulasi dan kemasan dihitung sesuai spesifikasi sample.",
      },
      {
        id: "tl-2",
        action: "Verifikasi Audit Biaya oleh Cost Accounting Finance",
        actor: "Finance Cost Controller",
        role: "Finance Dept",
        timestamp: `${item.date} 13:30 WIB`,
        status: "completed",
        notes: `Kesesuaian margin: ${item.marginPercent}%. Batas threshold minimal terpenuhi.`,
      },
      {
        id: "tl-3",
        action: "Persetujuan Direktur Keuangan (CFO) & GM",
        actor: "Chief Financial Officer",
        role: "Executive Management",
        timestamp: item.status === "APPROVED" ? `${item.date} 16:00 WIB` : "Menunggu Eksekusi",
        status: item.status === "APPROVED" ? "completed" : item.status === "REJECTED" ? "failed" : "pending",
        notes: item.status === "REJECTED" ? item.notes : undefined,
      },
    ],
  });

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PERMINTAAN HPP (COGS)"
      subtitle="Verifikasi struktur Harga Pokok Penjualan (HPP) maklon kosmetik, kalkulasi biaya formula dan kemasan, margin profit, dan penentuan harga jual resmi."
      categoryBadge="PERMINTAAN HPP ~2"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Permintaan HPP" },
      ]}
      items={INITIAL_COGS_DATA}
      columns={columns}
      getDetailData={buildDetailData}
      searchPlaceholder="Cari nomor HPP, nama klien, nama produk..."
    />
  );
}
