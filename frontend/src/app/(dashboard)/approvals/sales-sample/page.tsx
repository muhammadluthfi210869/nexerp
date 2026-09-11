"use client";

import React from "react";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaCell,
  DnaBadge,
} from "@/components/dna";

interface SalesSampleApprovalItem {
  id: string;
  code: string;
  client: string;
  brand: string;
  productName: string;
  category: string;
  formulator: string;
  revision: string;
  targetClaim: string;
  salesPic: string;
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
    notes?: string;
  }>;
}

const INITIAL_SAMPLE_DATA: SalesSampleApprovalItem[] = [
  {
    id: "smp-app-1",
    code: "SMP-2026-0312",
    client: "PT Glow Skin Global",
    brand: "GlowSkin Aesthetic",
    productName: "Brightening Essence Toner Galactomyces 5%",
    category: "Skincare / Face Care",
    formulator: "dr. Rian Pratama",
    revision: "Rev 2 (Penyesuaian Viskositas)",
    targetClaim: "Mencerahkan flek hitam dalam 14 hari, Non-comedogenic, pH Balance 5.5",
    salesPic: "Fitri Handayani (Busdev)",
    date: "25/08/2026",
    dueDate: "29/08/2026",
    status: "PENDING",
    notes: "Klien meminta penambahan aroma floral lembut 0.05% dan tekstur sedikit lebih kental dari Rev 1.",
    lineItems: [
      {
        id: "smpi-1",
        itemCode: "SMP-BTL-01",
        itemName: "Botol Uji Klinis Sample Lab 100ml (Formula B)",
        qty: 3,
        unit: "Botol Lab",
        notes: "Uji stabilitas centifuge dan oven 45°C lolos 24 jam.",
      },
      {
        id: "smpi-2",
        itemCode: "SMP-DOC-01",
        itemName: "Dossier Uji Sensori, Mikrobiologi & Rekomendasi Registrasi BPOM",
        qty: 1,
        unit: "Dokumen",
        notes: "Dokumen regulatori klaim bahan aktif lengkap.",
      },
    ],
  },
  {
    id: "smp-app-2",
    code: "SMP-2026-0308",
    client: "PT Cantika Herbal Nusantara",
    brand: "HerbalCare Botanica",
    productName: "Soothing Acne Gel Cica + Tea Tree 2%",
    category: "Acne Care",
    formulator: "Aisyah Putri, S.Si",
    revision: "Rev 1 (Formulasi Awal)",
    targetClaim: "Meredakan kemerahan jerawat aktif 48 jam, cooling sensation",
    salesPic: "Budi Hermawan (Sales)",
    date: "23/08/2026",
    dueDate: "28/08/2026",
    status: "APPROVED",
    notes: "Formula disetujui klien, persiapan pembuatan dummy kemasan primer dan uji stabilitas 3 bulan.",
    lineItems: [
      {
        id: "smpi-3",
        itemCode: "SMP-JAR-01",
        itemName: "Jar Akrilik Sample 30gr (Formula Standard)",
        qty: 5,
        unit: "Jar",
        notes: "Tekstur lightweight water-gel, cepat meresap tanpa residu lengket.",
      },
    ],
  },
  {
    id: "smp-app-3",
    code: "SMP-2026-0299",
    client: "CV Royal Beauty Luxe",
    brand: "Royal Glow Luxe",
    productName: "Anti-Aging Peptide Miracle Serum with Retinol Encapsulated",
    category: "Anti-Aging Serum",
    formulator: "dr. Rian Pratama",
    revision: "Rev 3",
    targetClaim: "Menyamarkan garis halus, formulasi aman untuk kulit sensitif",
    salesPic: "Fitri Handayani (Busdev)",
    date: "20/08/2026",
    dueDate: "26/08/2026",
    status: "REJECTED",
    notes: "Ditolak: Bahan aktif turunan retinol yang diajukan melebihi target anggaran HPP dari klien.",
    lineItems: [
      {
        id: "smpi-4",
        itemCode: "SMP-BTL-02",
        itemName: "Dropper Bottle Sample 20ml",
        qty: 2,
        unit: "Botol",
        notes: "HPP formula melebihi pagu Rp 35.000/pcs yang disyaratkan klien.",
      },
    ],
  },
];

export default function SalesSampleApprovalPage() {
  const columns: ApprovalColumn<SalesSampleApprovalItem>[] = [
    {
      header: "No. Sample",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.code>{item.code}</DnaCell.code>,
    },
    {
      header: "Klien & Brand",
      accessor: "client",
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.client}</p>
          <p className="text-[11px] text-blue-600 font-medium">{item.brand}</p>
        </div>
      ),
    },
    {
      header: "Nama Produk & Kategori",
      accessor: "productName",
      render: (item) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{item.productName}</p>
          <p className="text-[11px] text-slate-500">{item.category} • {item.revision}</p>
        </div>
      ),
    },
    {
      header: "Formulator & Sales",
      accessor: "formulator",
      render: (item) => (
        <div>
          <p className="text-xs font-medium text-slate-700">{item.formulator}</p>
          <p className="text-[11px] text-slate-500">PIC: {item.salesPic}</p>
        </div>
      ),
    },
    {
      header: "Target Klaim BPOM",
      accessor: "targetClaim",
      render: (item) => (
        <p className="text-[11px] text-slate-600 line-clamp-2 max-w-xs">{item.targetClaim}</p>
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

  const buildDetailData = (item: SalesSampleApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Persetujuan Sample Lab: ${item.productName}`,
    category: "SAMPLE R&D DAN FORMULASI",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.formulator,
    creatorRole: "R&D Formulator",
    requesterName: item.salesPic,
    partnerName: item.client,
    partnerLabel: "Klien Pemesan (Brand Owner)",
    warehouseName: "Laboratorium R&D Formulasi",
    notes: `Target Klaim: ${item.targetClaim} | Catatan Revisi: ${item.notes}`,
    lineItems: item.lineItems.map((li) => ({
      ...li,
      unitPrice: 0,
      total: 0,
    })),
    timeline: [
      {
        id: "tl-1",
        action: "Permintaan Sample Dibuat oleh Sales",
        actor: item.salesPic,
        role: "Business Development",
        timestamp: `${item.date} 09:00 WIB`,
        status: "completed",
        notes: "Brief produk dan target khasiat diterima dari klien.",
      },
      {
        id: "tl-2",
        action: "Formulasi & Uji Lab R&D Selesai",
        actor: item.formulator,
        role: "R&D Specialist",
        timestamp: `${item.date} 14:20 WIB`,
        status: "completed",
        notes: "Uji organoleptik, pH, dan viskositas memenuhi kriteria standar.",
      },
      {
        id: "tl-3",
        action: "Otorisasi Kirim Sample ke Klien",
        actor: "R&D Manager / Business Director",
        role: "Management",
        timestamp: item.status === "APPROVED" ? `${item.date} 17:00 WIB` : "Menunggu Eksekusi",
        status: item.status === "APPROVED" ? "completed" : item.status === "REJECTED" ? "failed" : "pending",
        notes: item.status === "REJECTED" ? item.notes : undefined,
      },
    ],
  });

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PENJUALAN SAMPLE (R&D)"
      subtitle="Validasi formulasi sampel kosmetik, klaim uji klinis, kesesuaian regulasi BPOM, dan persetujuan pengiriman prototipe ke klien."
      categoryBadge="PENJUALAN SAMPLE ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Penjualan Sample" },
      ]}
      items={INITIAL_SAMPLE_DATA}
      columns={columns}
      getDetailData={buildDetailData}
      searchPlaceholder="Cari nomor sample, nama produk, brand, formulator..."
    />
  );
}
