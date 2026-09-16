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

interface PurchaseRequestApprovalItem {
  id: string;
  code: string;
  department: string;
  requesterName: string;
  creatorRole: string;
  urgency: "Normal" | "Tinggi" | "Darurat";
  purpose: string;
  itemsCount: number;
  estimatedTotal: number;
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

const INITIAL_PR_DATA: PurchaseRequestApprovalItem[] = [
  {
    id: "pr-1",
    code: "PR-2026-0645",
    department: "Produksi & Manufaktur",
    requesterName: "Hendra Gunawan",
    creatorRole: "Production Supervisor",
    urgency: "Tinggi",
    purpose: "Buffer stock bahan aktif Niacinamide PC Grade dan Propylene Glycol mencapai batas kritis ROP",
    itemsCount: 2,
    estimatedTotal: 78500000,
    date: "25/08/2026",
    dueDate: "28/08/2026",
    status: "PENDING",
    notes: "Dibutuhkan sebelum jadwal mixing batch WO-2608-05 tanggal 2 September 2026.",
    lineItems: [
      {
        id: "pri-1",
        itemCode: "RAW-NIA-01",
        itemName: "Niacinamide PC Grade USP 99.8%",
        qty: 150,
        unit: "Kg",
        unitPrice: 360000,
        total: 54000000,
        notes: "Sisa stok di gudang hanya 12 kg (Batas ROP: 50 kg).",
      },
      {
        id: "pri-2",
        itemCode: "RAW-PG-01",
        itemName: "Propylene Glycol USP Cosmetic Grade",
        qty: 700,
        unit: "Kg",
        unitPrice: 35000,
        total: 24500000,
        notes: "Konsumsi reguler 200kg/minggu.",
      },
    ],
  },
  {
    id: "pr-2",
    code: "PR-2026-0641",
    department: "Laboratorium QC & R&D",
    requesterName: "dr. Rian Pratama",
    creatorRole: "R&D Head",
    urgency: "Normal",
    purpose: "Reagen uji mikrobiologi dan strip pH meter presisi tinggi untuk rilis batch",
    itemsCount: 3,
    estimatedTotal: 14200000,
    date: "23/08/2026",
    dueDate: "30/08/2026",
    status: "APPROVED",
    notes: "Pengadaan rutin triwulan kebutuhan consumable lab kimia dan mikrobiologi.",
    lineItems: [
      {
        id: "pri-3",
        itemCode: "LAB-MED-01",
        itemName: "Nutrient Agar Media Mikrobiologi Difco 500g",
        qty: 4,
        unit: "Botol",
        unitPrice: 1850000,
        total: 7400000,
      },
      {
        id: "pri-4",
        itemCode: "LAB-PH-STRIP",
        itemName: "Indikator pH Merck Non-Bleeding pH 0-14",
        qty: 10,
        unit: "Kotak",
        unitPrice: 680000,
        total: 6800000,
      },
    ],
  },
  {
    id: "pr-3",
    code: "PR-2026-0635",
    department: "Maintenance & Utility Pabrik",
    requesterName: "Joko Santoso",
    creatorRole: "Maintenance Lead",
    urgency: "Darurat",
    purpose: "Sparepart Mechanical Seal & Motor Impeller Homogenizer Reaktor A",
    itemsCount: 1,
    estimatedTotal: 28500000,
    date: "21/08/2026",
    dueDate: "24/08/2026",
    status: "APPROVED",
    notes: "Perbaikan mendesak reaktor emulsi 1000L guna mencegah downtime lini produksi.",
    lineItems: [
      {
        id: "pri-5",
        itemCode: "SP-MECH-HOM10",
        itemName: "Mechanical Seal Double Cartridge High Temp 150°C",
        qty: 1,
        unit: "Set",
        unitPrice: 28500000,
        total: 28500000,
      },
    ],
  },
  {
    id: "pr-4",
    code: "PR-2026-0628",
    department: "Umum & GA",
    requesterName: "Dewi Lestari",
    creatorRole: "GA Staff",
    urgency: "Normal",
    purpose: "Penggantian laptop staff baru divisi Digital Marketing",
    itemsCount: 2,
    estimatedTotal: 32000000,
    date: "18/08/2026",
    dueDate: "25/08/2026",
    status: "REJECTED",
    notes: "Ditolak: Alokasi belanja IT aset kantor telah melampaui pagu CAPEX semester II.",
    lineItems: [
      {
        id: "pri-6",
        itemCode: "IT-LAP-01",
        itemName: "Laptop Business Series Core i7 16GB RAM",
        qty: 2,
        unit: "Unit",
        unitPrice: 16000000,
        total: 32000000,
      },
    ],
  },
];

export default function PurchaseRequestApprovalPage() {
  const columns: ApprovalColumn<PurchaseRequestApprovalItem>[] = [
    {
      header: "No. PR",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.code>{item.code}</DnaCell.code>,
    },
    {
      header: "Departemen",
      accessor: "department",
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-slate-800 whitespace-nowrap">{item.department}</span>
      ),
    },
    {
      header: "Pemohon",
      accessor: "requesterName",
      sortable: true,
      render: (item) => (
        <span className="text-slate-600 whitespace-nowrap">{item.requesterName}</span>
      ),
    },
    {
      header: "Urgensi",
      accessor: "urgency",
      align: "center",
      render: (item) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            item.urgency === "Darurat"
              ? "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
              : item.urgency === "Tinggi"
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-slate-100 text-slate-700 border border-slate-200"
          }`}
        >
          {item.urgency}
        </span>
      ),
    },
    {
      header: "Tujuan Pengadaan",
      accessor: "purpose",
      render: (item) => (
        <p className="text-xs text-slate-700 line-clamp-2 max-w-xs">{item.purpose}</p>
      ),
    },
    {
      header: "Estimasi Biaya",
      accessor: "estimatedTotal",
      align: "right",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-slate-900">
          {formatRupiah(item.estimatedTotal)}
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

  const buildDetailData = (item: PurchaseRequestApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Purchase Request: ${item.department}`,
    category: "PERMINTAAN PEMBELIAN INTERNAL",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.department,
    partnerLabel: "Departemen Pemohon",
    warehouseName: "Pusat Pengadaan (Procurement)",
    totalAmount: item.estimatedTotal,
    notes: `Tingkat Urgensi: ${item.urgency} | Justifikasi: ${item.purpose} | Catatan: ${item.notes}`,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "Purchase Request Diajukan",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: `${item.date} 08:45 WIB`,
        status: "completed",
        notes: `Pengajuan internal kategori ${item.urgency}.`,
      },
      {
        id: "tl-2",
        action: "Verifikasi Kepala Departemen (HOD)",
        actor: "Head of Department",
        role: item.department,
        timestamp: `${item.date} 11:20 WIB`,
        status: "completed",
        notes: "Kebutuhan disetujui sesuai rencana kerja operasional.",
      },
      {
        id: "tl-3",
        action: "Otorisasi Budget Finance & Procurement",
        actor: "Finance / General Manager",
        role: "Management",
        timestamp: item.status === "APPROVED" ? `${item.date} 15:00 WIB` : "Menunggu Eksekusi",
        status: item.status === "APPROVED" ? "completed" : item.status === "REJECTED" ? "failed" : "pending",
        notes: item.status === "REJECTED" ? item.notes : undefined,
      },
    ],
  });

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PERMINTAAN PEMBELIAN (PURCHASE REQUEST)"
      subtitle="Validasi surat permintaan pembelian (PR) internal divisi, verifikasi anggaran belanja OPEX/CAPEX, dan penerbitan PO ke supplier."
      categoryBadge="PERMINTAAN PEMBELIAN ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Permintaan Pembelian" },
      ]}
      items={INITIAL_PR_DATA}
      columns={columns}
      getDetailData={buildDetailData}
      searchPlaceholder="Cari nomor PR, departemen pemohon, justifikasi..."
    />
  );
}
