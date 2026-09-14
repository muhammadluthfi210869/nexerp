"use client";

/**
 * Master Data Hub Overview
 *
 * Portal sentral seluruh data induk terstandarisasi untuk manufaktur kosmetik maklon.
 * 5-Layer Visual DNA Golden Reference Standard.
 *
 * Visual DNA Architecture:
 * - 0 raw @/components/ui imports (Strict ADR-007)
 * - Light Enterprise Theme: bg-[#F8FAFC] min-h-screen text-slate-900
 * - DnaPageHeader with title & description
 * - DnaKpiGrid with 5 global metrics
 * - High-density white cards with smooth hover & typography
 */

import React from "react";
import Link from "next/link";
import {
  Package,
  Building2,
  Users,
  Warehouse,
  UserCog,
  FileSpreadsheet,
  ArrowRight,
  Boxes,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaBadge,
  DnaButton,
} from "@/components/dna";

const MASTER_MODULES = [
  {
    title: "Master Barang & Kategori",
    subtitle: "Bahan Baku, Kemasan Primer/Sekunder, Ruahan, dan Barang Jadi",
    href: "/master/goods",
    icon: Package,
    badgeText: "2.797 SKU",
    badgeStatus: "info" as const,
    description:
      "Katalog material formulasi kosmetik terintegrasi dengan ROP stok minimum, harga beli standar, aging gudang, dan pemetaan akun COA.",
    quickLinks: [
      { label: "Katalog SKU", href: "/master/goods" },
      { label: "Kategori Prefix", href: "/master/goods?tab=categories" },
    ],
  },
  {
    title: "Supplier & Vendor",
    subtitle: "Rekanan Pengadaan Bahan Baku & Kemasan",
    href: "/master/suppliers",
    icon: Building2,
    badgeText: "178 Vendor",
    badgeStatus: "warning" as const,
    description:
      "Registri pemasok kimiawi aktif, pabrik botol/tube, percetakan kemasan sekunder, status kepatuhan PKP (PPN 11%), dan impor data Excel.",
    quickLinks: [
      { label: "Daftar Rekanan", href: "/master/suppliers" },
      { label: "Kategori Pengadaan", href: "/master/suppliers?tab=categories" },
    ],
  },
  {
    title: "Pelanggan & CRM",
    subtitle: "Mitra Brand Owner Maklon & Evaluasi 3 Pilar",
    href: "/master/customers",
    icon: Users,
    badgeText: "818 Klien",
    badgeStatus: "success" as const,
    description:
      "Basis data klien brand kosmetik dengan monitoring real-time 3 pilar: Sample Fee, Job Order Produksi, serta Legalitas BPOM/Halal.",
    quickLinks: [
      { label: "Semua Pelanggan", href: "/master/customers" },
      { label: "Pelanggan Saya", href: "/master/customers?tab=my" },
      { label: "Kategori Klien", href: "/master/customers?tab=categories" },
    ],
  },
  {
    title: "Gudang & Lokasi",
    subtitle: "14 Fasilitas Titik Simpan & Otorisasi Hak Akses",
    href: "/master/warehouses",
    icon: Warehouse,
    badgeText: "14 Titik",
    badgeStatus: "purple" as const,
    description:
      "Struktur gudang operasional Sidoarjo, Pasuruan PIER, dan Surabaya dengan pengaturan suhu (Cool Storage / Ambient) dan otorisasi staf.",
    quickLinks: [
      { label: "Titik Gudang", href: "/master/warehouses" },
      { label: "Hak Akses Staf", href: "/master/warehouses?tab=access" },
    ],
  },
  {
    title: "Pengguna & Personel",
    subtitle: "Identitas Karyawan & Matriks Hak Akses (RBAC)",
    href: "/master/personnel",
    icon: UserCog,
    badgeText: "24 Akun",
    badgeStatus: "default" as const,
    description:
      "Manajemen NIP staf Dreamlab, kredensial akun login, departemen kerja, dan penetapan role-based permission berjenjang.",
    quickLinks: [
      { label: "Daftar Staf", href: "/master/personnel" },
      { label: "Tingkat Otoritas Role", href: "/master/personnel?tab=roles" },
    ],
  },
  {
    title: "Chart of Accounts (COA)",
    subtitle: "Bagan Akun Finansial & Jurnal Otomatis",
    href: "/finance/accounting/coa",
    icon: FileSpreadsheet,
    badgeText: "COA Live",
    badgeStatus: "info" as const,
    description:
      "Struktur nomor akun neraca, aset lancar persediaan, hutang dagang supplier, dan aturan posting jurnal otomatis dari transaksi SCM.",
    quickLinks: [
      { label: "Bagan Akun COA", href: "/finance/accounting/coa" },
    ],
  },
];

export default function MasterOverviewPage() {
  return (
    <div className="space-y-8 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. MODULAR PAGE HEADER ── */}
      <DnaPageHeader
        title="MASTER DATA HUB"
        subtitle="Pusat konfigurasi taksonomi sistem, data induk material kosmetik, rekanan rantai pasok, dan kredensial pengguna"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/master/goods">
              <DnaButton variant="primary" icon={<Package className="w-4 h-4" />}>
                Buka Katalog Barang
              </DnaButton>
            </Link>
          </div>
        }
      />

      {/* ── 02. MODULAR 5 KPI METRIC CARDS ── */}
      <DnaKpiGrid
        cards={[
          {
            key: "SKU",
            title: "TOTAL MASTER SKU",
            value: "2.797",
            subtext: "Bahan baku, kemas & BJD",
            icon: <Package className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            isSelected: false,
          },
          {
            key: "SUPPLIER",
            title: "REKANAN SUPPLIER",
            value: "178",
            subtext: "Vendor resmi terdaftar",
            icon: <Building2 className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            isSelected: false,
          },
          {
            key: "CUSTOMER",
            title: "MITRA PELANGGAN",
            value: "818",
            subtext: "Brand owner maklon",
            icon: <Users className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            isSelected: false,
          },
          {
            key: "WAREHOUSE",
            title: "FASILITAS GUDANG",
            value: "14",
            subtext: "Sidoarjo, PIER, Surabaya",
            icon: <Warehouse className="w-4 h-4" />,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            isSelected: false,
          },
          {
            key: "USERS",
            title: "PERSONEL AKTIF",
            value: "24",
            subtext: "Staf terotorisasi sistem",
            icon: <UserCog className="w-4 h-4" />,
            iconBg: "bg-slate-100",
            iconColor: "text-slate-700",
            isSelected: false,
          },
        ]}
      />

      {/* ── 03. MODULE LAUNCHER CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MASTER_MODULES.map((mod, i) => (
          <div
            key={i}
            className="flex flex-col justify-between bg-white border border-slate-200/80 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-200 group hover:shadow-lg shadow-xs"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-100">
                  <mod.icon className="w-6 h-6" />
                </div>
                <DnaBadge status={mod.badgeStatus}>{mod.badgeText}</DnaBadge>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{mod.subtitle}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{mod.description}</p>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {mod.quickLinks.map((ql, qidx) => (
                  <Link
                    key={qidx}
                    href={ql.href}
                    className="text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200/60 px-2.5 py-1 rounded-md transition-colors"
                  >
                    {ql.label}
                  </Link>
                ))}
              </div>

              <Link
                href={mod.href}
                className="inline-flex items-center gap-2 text-xs font-black text-blue-600 group-hover:translate-x-1 transition-transform"
              >
                <span>Buka Modul</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

