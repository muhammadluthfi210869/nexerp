"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ShieldAlert,
  BarChart3,
  Beaker,
  Layers,
  Factory,
  CreditCard,
  LogOut,
  LayoutDashboard,
  Zap,
  History,
  Scale,
  Truck,
  Warehouse,
  FileSearch,
  Users,
  FlaskConical,
  XCircle,
  PlusCircle,
  ClipboardCheck,
  Archive,
  Box,
  Landmark,
  Cog,
  Bell,
  BookOpen,
  DollarSign,
  Package,
  ClipboardList,
  Wallet,
  Barcode,
  RefreshCw,
  FolderTree,
  Tags,
  Building2,
  FileSpreadsheet,
  CheckSquare,
  AlertOctagon,
  UserCheck,
  UserX,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  CheckCircle2,
  Palette,
  Dot,
  Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface SubMenuItem {
  name: string;
  href: string;
  icon?: any;
  badge?: string;
  badgeVariant?: "default" | "warning" | "critical" | "info" | "purple";
}

interface NavSection {
  id: string;
  title: string;
  groupLabel?: string;
  icon: any;
  badge?: string;
  badgeVariant?: "default" | "warning" | "critical" | "info" | "purple";
  isDirect?: boolean;
  href?: string;
  items: SubMenuItem[];
}

/**
 * 1. 📱 DIGITAL MARKETING (REVITA @ revita@nexerp.id) - Exactly 4 Modules
 */
const DIGIMAR_SECTIONS: NavSection[] = [
  {
    id: "dm-dashboard",
    title: "Dashboard",
    groupLabel: "DASBOR",
    icon: LayoutDashboard,
    isDirect: true,
    href: "/marketing/dashboard",
    items: []
  },
  {
    id: "dm-omnicrm",
    title: "OmniCRM",
    groupLabel: "MARKETING & CRM",
    icon: Users,
    items: [
      { name: "Core Engine", href: "/marketing/omni-crm", icon: Layers },
      { name: "Lead Capture", href: "/marketing/omni-crm/lead-capture", icon: Inbox },
    ]
  },
  {
    id: "dm-social",
    title: "Social Media",
    groupLabel: "KONTEN & MEDIA",
    icon: Sparkles,
    isDirect: true,
    href: "/marketing/social-tracker",
    items: []
  },
  {
    id: "dm-tasks",
    title: "Management Task",
    groupLabel: "TASK MANAGEMENT",
    icon: ClipboardList,
    isDirect: true,
    href: "/marketing/management-task",
    items: []
  }
];

/**
 * 2. 🎨 DESIGN & CREATIVE (EDI @ edi@nexerp.id)
 */
const DESIGN_SECTIONS: NavSection[] = [
  {
    id: "des-dashboard",
    title: "Workspace Design",
    groupLabel: "DASBOR",
    icon: Palette,
    isDirect: true,
    href: "/design/artwork-approval",
    items: []
  },
  {
    id: "des-creative",
    title: "Creative & Artwork",
    groupLabel: "KREATIF & DESAIN",
    icon: Palette,
    items: [
      { name: "Artwork Approval & Riwayat", href: "/design/artwork-approval", icon: Palette, badge: "ACC", badgeVariant: "purple" },
      { name: "Creative Board", href: "/creative/board", icon: Layers },
    ]
  },
  {
    id: "des-tracking",
    title: "Kendali & Tracking",
    groupLabel: "KENDALI & TRACKING",
    icon: CheckSquare,
    items: [
      { name: "Tracking Progress", href: "/scm/checklist-progress", icon: CheckSquare, badge: "LIVE", badgeVariant: "warning" },
      { name: "Tracking Checklist", href: "/project-control/checklist-tracking", icon: History, badge: "3 DELAY", badgeVariant: "critical" },
    ]
  }
];

/**
 * 2. 💼 FINANCE & ACCOUNTING (EXACT 6 D365 GROUPS FOR COSMETICS OEM)
 */
const FINANCE_SECTIONS: NavSection[] = [
  // 1. DASBOR
  {
    id: "fin-dashboard",
    title: "Command Center",
    groupLabel: "DASBOR",
    icon: LayoutDashboard,
    isDirect: true,
    href: "/finance/dashboard",
    items: []
  },
  // 2. OPERASIONAL KEUANGAN
  {
    id: "fin-ap",
    title: "Hutang Usaha (AP)",
    groupLabel: "OPERASIONAL KEUANGAN",
    icon: Truck,
    items: [
      { name: "Vendor Master", href: "/master/vendors", icon: Building2 },
      { name: "Faktur Pembelian", href: "/finance/faktur-pembelian", icon: FileSpreadsheet },
      { name: "DP Pembelian", href: "/finance/dp-pembelian", icon: DollarSign },
      { name: "Bayar Pembelian", href: "/finance/bayar-pembelian", icon: CreditCard },
      { name: "AP Aging & QC Toleransi", href: "/finance/ap-aging", icon: History, badge: "H-3/H-7", badgeVariant: "warning" },
    ]
  },
  {
    id: "fin-ar",
    title: "Piutang Usaha (AR)",
    groupLabel: "OPERASIONAL KEUANGAN",
    icon: Activity,
    items: [
      { name: "Customer Master", href: "/master/customers", icon: Users },
      { name: "Faktur Penjualan", href: "/finance/faktur-penjualan", icon: FileSpreadsheet },
      { name: "DP Penjualan", href: "/finance/dp-penjualan", icon: DollarSign },
      { name: "Report Penjualan", href: "/finance/report-penjualan", icon: BarChart3 },
      { name: "AR Aging & Collections", href: "/finance/ar-aging", icon: History },
    ]
  },
  {
    id: "fin-cash",
    title: "Kas, Bank & Dana",
    groupLabel: "OPERASIONAL KEUANGAN",
    icon: Landmark,
    items: [
      { name: "Kas Bank Masuk", href: "/finance/kas-bank-masuk", icon: Landmark },
      { name: "Kas Bank Keluar", href: "/finance/kas-bank-keluar", icon: CreditCard },
      { name: "Rekonsiliasi Bank", href: "/finance/rekonsiliasi", icon: RefreshCw, badge: "COA", badgeVariant: "info" },
      { name: "Pengajuan Dana", href: "/finance/pengajuan-dana", icon: ClipboardList, badge: "4-TIER", badgeVariant: "purple" },
    ]
  },
  // 3. AKUNTANSI & LAPORAN
  {
    id: "fin-gl",
    title: "Jurnal Umum",
    groupLabel: "AKUNTANSI & LAPORAN",
    icon: FileSpreadsheet,
    isDirect: true,
    href: "/finance/jurnal-umum",
    items: []
  },
  {
    id: "fin-rep",
    title: "Laporan Keuangan",
    groupLabel: "AKUNTANSI & LAPORAN",
    icon: BarChart3,
    items: [
      { name: "Buku Besar", href: "/finance/buku-besar", icon: BookOpen },
      { name: "Laba Rugi", href: "/finance/laba-rugi", icon: BarChart3, badge: "KIL", badgeVariant: "info" },
    ]
  },
  {
    id: "fin-assets",
    title: "Aset Tetap & Depresiasi",
    groupLabel: "AKUNTANSI & LAPORAN",
    icon: Building2,
    isDirect: true,
    href: "/finance/aset-tetap",
    items: []
  },
  // 4. MASTER & SETUP
  {
    id: "fin-master",
    title: "Fondasi Akuntansi",
    groupLabel: "MASTER & SETUP",
    icon: FolderTree,
    items: [
      { name: "Chart of Accounts (CoA)", href: "/finance/accounting/coa", icon: FileSpreadsheet },
      { name: "CoA Jurnal Otomatis", href: "/finance/accounting/auto-journal", icon: FolderTree },
    ]
  }
];

/**
 * 3. 📦 PURCHASE & SCM (EXACT GSERP ACCORDION BARS & SUB-BARS)
 */
const PURCHASE_SECTIONS: NavSection[] = [
  {
    id: "pur-dashboard",
    title: "Dasbor Utama",
    groupLabel: "DASBOR",
    icon: LayoutDashboard,
    items: [
      { name: "Dashboard SCM", href: "/scm/dashboard", icon: Truck },
      { name: "Dashboard Gudang", href: "/warehouse", icon: Warehouse },
      { name: "Dashboard Produksi", href: "/production", icon: Factory },
    ]
  },
  {
    id: "pur-master",
    title: "Master Data",
    groupLabel: "MASTER & DATA",
    icon: FolderTree,
    items: [
      { name: "Barang", href: "/master/goods", icon: Package },
      { name: "Kategori Supplier", href: "/master/categories", icon: Tags },
      { name: "Supplier", href: "/master/suppliers", icon: Building2 },
    ]
  },
  {
    id: "pur-control",
    title: "Umum & Tracking",
    groupLabel: "KENDALI & TRACKING",
    icon: CheckSquare,
    items: [
      { name: "Checklist Progress", href: "/scm/checklist-progress", icon: CheckSquare, badge: "LIVE", badgeVariant: "warning" },
      { name: "Checklist Tracking", href: "/project-control/checklist-tracking", icon: History, badge: "3 DELAY", badgeVariant: "critical" },
      { name: "Checklist Tracking CRM", href: "/qc/checklist/tracking", icon: Layers, badge: "SCM", badgeVariant: "default" },
    ]
  },
  {
    id: "pur-ops",
    title: "Operasional Pembelian",
    groupLabel: "OPERASIONAL SCM",
    icon: Truck,
    items: [
      { name: "Permintaan Pembelian", href: "/scm/purchase-requests", icon: ClipboardList },
      { name: "Buat Pembelian (PO)", href: "/scm/pembelian", icon: PlusCircle, badge: "PO", badgeVariant: "default" },
      { name: "Faktur Pembelian", href: "/scm/faktur-pembelian", icon: CreditCard },
      { name: "DP Pembelian", href: "/scm/purchasing/down-payment", icon: DollarSign },
      { name: "Retur Pembelian", href: "/scm/purchase-returns", icon: XCircle },
      { name: "Kebutuhan Barang", href: "/scm/kebutuhan-barang", icon: Layers },
      { name: "Permintaan HPP", href: "/scm/hpp-requests", icon: FileSearch },
    ]
  },
  {
    id: "pur-wh",
    title: "Gudang & Stok",
    groupLabel: "GUDANG & LOGISTIK",
    icon: Box,
    items: [
      { name: "Stok", href: "/warehouse/stok", icon: Box },
      { name: "Mutasi Barang", href: "/warehouse/mutasi-stok", icon: RefreshCw },
    ]
  }
];

/**
 * 4. 🚀 BUSDEV & COMMERCIAL (EXACT GSERP ACCORDION BARS & SUB-BARS)
 */
const BUSSDEV_SECTIONS: NavSection[] = [
  {
    id: "bd-crm",
    title: "Sales Pipeline (CRM)",
    groupLabel: "SALES & CRM",
    icon: Users,
    items: [
      { name: "Buku Tamu", href: "/crm/buku-tamu", icon: ClipboardCheck },
      { name: "Client Sample", href: "/crm/client-sample", icon: FlaskConical },
      { name: "Client Produksi", href: "/crm/client-produksi", icon: Factory },
      { name: "Client RO", href: "/crm/client-ro", icon: RefreshCw },
      { name: "Client Lost", href: "/crm/client-lost", icon: UserX },
    ]
  },
  {
    id: "bd-sales",
    title: "Penjualan & Sample",
    groupLabel: "PENJUALAN",
    icon: Activity,
    items: [
      { name: "Penjualan Sample", href: "/bussdev/sample-sales", icon: FlaskConical },
      { name: "Retur Penjualan", href: "/bussdev/retur-penjualan", icon: XCircle },
      { name: "AR Aging Piutang", href: "/bussdev/ar-aging", icon: History, badge: "AR", badgeVariant: "warning" },
    ]
  },
  {
    id: "bd-master",
    title: "Master & Data",
    groupLabel: "MASTER & DATA",
    icon: FolderTree,
    items: [
      { name: "Kelola Pelanggan", href: "/bussdev/kelola-pelanggan", icon: Users },
      { name: "Permintaan HPP", href: "/scm/hpp-requests", icon: FileSearch },
      { name: "Barang", href: "/master/goods", icon: Package },
      { name: "Supplier", href: "/master/suppliers", icon: Building2 },
      { name: "Kategori Supplier", href: "/master/categories", icon: Tags },
    ]
  },
  {
    id: "bd-tracking",
    title: "Umum & Kendali",
    groupLabel: "KENDALI & TRACKING",
    icon: CheckSquare,
    items: [
      { name: "Checklist Progress", href: "/scm/checklist-progress", icon: CheckSquare },
      { name: "Checklist Tracking", href: "/project-control/checklist-tracking", icon: History },
    ]
  }
];

/**
 * 5. 🧪 RESEARCH & DEVELOPMENT (R&D / FORMULASI) - GSERP KIL + NEX ERP V4 + DAILY TRACKING
 */
const RND_SECTIONS: NavSection[] = [
  // 1. DASBOR & ANALITIK
  {
    id: "rnd-dashboard",
    title: "Dasbor Utama",
    groupLabel: "DASBOR",
    icon: LayoutDashboard,
    items: [
      { name: "Formula Analytics", href: "/rnd/dashboard", icon: LayoutDashboard },
      { name: "Active Pipeline", href: "/rnd/pipeline", icon: FlaskConical, badge: "FLOW", badgeVariant: "purple" },
      { name: "D. Jadwal Produksi", href: "/production/schedule", icon: History },
      { name: "Project Control", href: "/project-control", icon: BarChart3 },
    ]
  },
  // 2. PRA PRODUKSI & FORMULASI
  {
    id: "rnd-formulation",
    title: "Pra Produksi & Formulasi",
    groupLabel: "PRA PRODUKSI",
    icon: Beaker,
    items: [
      { name: "Sample Inbox (PNF)", href: "/rnd/inbox", icon: ClipboardCheck, badge: "NEW", badgeVariant: "warning" },
      { name: "Formulasi Repository", href: "/rnd/repository", icon: Beaker },
      { name: "Buat Formulasi Baru", href: "/rnd/formula/new", icon: PlusCircle },
      { name: "Penyesuaian Formulasi", href: "/production/formula-adjustment", icon: Layers },
      { name: "Permintaan HPP (COGS)", href: "/rnd/repository?tab=hpp", icon: DollarSign },
      { name: "Digital Batch Record", href: "/production/batch-records", icon: Barcode },
    ]
  },
  // 3. UJI LAB & KUALITAS MUTU
  {
    id: "rnd-lab",
    title: "Uji Lab & Kualitas Mutu",
    groupLabel: "LAB & MUTU",
    icon: FlaskConical,
    items: [
      { name: "Pengujian Lab & Stabilitas", href: "/rnd/lab-test", icon: FlaskConical, badge: "LAB", badgeVariant: "info" },
      { name: "Revision Tracker", href: "/rnd/revision-tracker", icon: History, badge: "REV", badgeVariant: "warning" },
      { name: "Master INCI & Regulasi", href: "/rnd/master-inci", icon: FileSearch },
    ]
  },
  // 4. KENDALI PROYEK & TRACKING (DAILY TRACKING & PROJECT MONITORING)
  {
    id: "rnd-tracking",
    title: "Daily Tracking & Project",
    groupLabel: "KENDALI & TRACKING",
    icon: CheckSquare,
    items: [
      { name: "Daily Tracking Progress", href: "/scm/checklist-progress", icon: CheckSquare, badge: "LIVE", badgeVariant: "warning" },
      { name: "Project Monitoring & SLA", href: "/project-control/checklist-tracking", icon: History, badge: "3 DELAY", badgeVariant: "critical" },
      { name: "Monitoring Projek Master", href: "/project-control", icon: BarChart3 },
    ]
  },
  // 5. OPERASIONAL & KEBUTUHAN BAHAN
  {
    id: "rnd-ops",
    title: "Operasional & Bahan Lab",
    groupLabel: "OPERASIONAL LAB",
    icon: Package,
    items: [
      { name: "Penjualan Sample (CRM)", href: "/bussdev/sample-sales", icon: Users },
      { name: "Kebutuhan Barang Lab", href: "/scm/kebutuhan-barang", icon: Layers },
      { name: "Permintaan Pembelian Bahan", href: "/scm/purchase-requests", icon: ClipboardList },
      { name: "Stok Barang & Bahan", href: "/warehouse/stok", icon: Box },
    ]
  }
];

/**
 * 6. 👑 SUPERADMIN / DIRECTOR (ALL GSERP MODULES IN ACCORDION STRUCTURE)
 */
const SUPERADMIN_SECTIONS: NavSection[] = [
  {
    id: "sa-dashboard",
    title: "Dasbor Sistem",
    groupLabel: "DASBOR UTAMA",
    icon: LayoutDashboard,
    items: [
      { name: "Dashboard SCM", href: "/scm/dashboard", icon: Truck },
      { name: "Dashboard Finance", href: "/finance/dashboard", icon: LayoutDashboard },
      { name: "Dashboard Gudang", href: "/warehouse", icon: Warehouse },
      { name: "Dashboard Produksi", href: "/production", icon: Factory },
      { name: "D. Jadwal Produksi", href: "/production/schedule", icon: History },
      { name: "D. Penjualan Sample", href: "/bussdev/sample-sales", icon: FlaskConical },
      { name: "D. Pelanggan", href: "/bussdev/kelola-pelanggan", icon: Users },
      { name: "Project Control", href: "/project-control", icon: BarChart3 },
    ]
  },
  {
    id: "sa-creative",
    title: "Creative & Design",
    groupLabel: "KREATIF",
    icon: Palette,
    items: [
      { name: "Artwork Approval", href: "/design/artwork-approval", icon: Palette, badge: "NEW", badgeVariant: "purple" },
      { name: "Creative Board", href: "/creative/board", icon: Layers },
    ]
  },
  {
    id: "sa-master",
    title: "Master Data",
    groupLabel: "MASTER SISTEM",
    icon: FolderTree,
    items: [
      { name: "Hak Akses (Roles)", href: "/master/roles", icon: ShieldAlert },
      { name: "Pengguna (Users)", href: "/master/personnel", icon: Users },
      { name: "CoA", href: "/finance/accounting/coa", icon: FileSpreadsheet },
      { name: "CoA Jurnal Otomatis", href: "/finance/accounting/auto-journal", icon: FileSpreadsheet },
      { name: "Gudang", href: "/master/warehouses", icon: Warehouse },
      { name: "Barang", href: "/master/goods", icon: Package },
      { name: "Kategori Supplier", href: "/master/categories", icon: Tags },
      { name: "Supplier", href: "/master/suppliers", icon: Building2 },
      { name: "Kelola Pelanggan", href: "/bussdev/kelola-pelanggan", icon: Users },
    ]
  },
  {
    id: "sa-tracking",
    title: "Umum & Kendali",
    groupLabel: "KENDALI & TRACKING",
    icon: CheckSquare,
    items: [
      { name: "Checklist Progress", href: "/scm/checklist-progress", icon: CheckSquare, badge: "LIVE", badgeVariant: "warning" },
      { name: "Checklist Tracking", href: "/project-control/checklist-tracking", icon: History, badge: "3 DELAY", badgeVariant: "critical" },
      { name: "Checklist Tracking CRM", href: "/qc/checklist/tracking", icon: Layers, badge: "SCM", badgeVariant: "default" },
    ]
  },
  {
    id: "sa-purchase",
    title: "Operasional: Pembelian",
    groupLabel: "OPERASIONAL",
    icon: Truck,
    items: [
      { name: "Permintaan Pembelian", href: "/scm/purchase-requests", icon: ClipboardList },
      { name: "Buat Pembelian", href: "/scm/pembelian", icon: PlusCircle, badge: "PO", badgeVariant: "default" },
      { name: "Faktur Pembelian", href: "/scm/faktur-pembelian", icon: CreditCard },
      { name: "DP Pembelian", href: "/scm/purchasing/down-payment", icon: DollarSign },
      { name: "Bayar Pembelian", href: "/finance/bayar-pembelian", icon: CreditCard },
      { name: "Retur Pembelian", href: "/scm/purchase-returns", icon: XCircle },
      { name: "Kebutuhan Barang", href: "/scm/kebutuhan-barang", icon: Layers },
      { name: "Permintaan HPP", href: "/scm/hpp-requests", icon: FileSearch },
    ]
  },
  {
    id: "sa-rnd",
    title: "Pra Produksi & Formulasi",
    groupLabel: "OPERASIONAL",
    icon: Beaker,
    items: [
      { name: "Formula Analytics", href: "/rnd/dashboard", icon: LayoutDashboard },
      { name: "Sample Inbox (PNF)", href: "/rnd/inbox", icon: ClipboardCheck },
      { name: "Formulasi Repository", href: "/rnd/repository", icon: Beaker },
      { name: "Buat Formula Baru", href: "/rnd/formula/new", icon: PlusCircle },
      { name: "Active Pipeline", href: "/rnd/pipeline", icon: FlaskConical },
      { name: "Pengujian Lab & Stabilitas", href: "/rnd/lab-test", icon: FlaskConical },
      { name: "Revision Tracker", href: "/rnd/revision-tracker", icon: History },
      { name: "Master INCI & Regulasi", href: "/rnd/master-inci", icon: FileSearch },
      { name: "Digital Batch Record", href: "/production/batch-records", icon: Barcode },
    ]
  },
  {
    id: "sa-wh",
    title: "Operasional: Gudang & Stok",
    groupLabel: "OPERASIONAL",
    icon: Warehouse,
    items: [
      { name: "Stok", href: "/warehouse/stok", icon: Box },
      { name: "Mutasi Barang", href: "/warehouse/mutasi-stok", icon: RefreshCw },
      { name: "Penyesuaian Stok", href: "/warehouse/adjustment", icon: Box },
      { name: "Gudang & Lokasi", href: "/warehouse/gudang", icon: Warehouse },
    ]
  },
  {
    id: "sa-crm",
    title: "Sales Pipeline (CRM)",
    groupLabel: "OPERASIONAL",
    icon: Users,
    items: [
      { name: "Buku Tamu", href: "/crm/buku-tamu", icon: ClipboardCheck },
      { name: "Client Sample", href: "/crm/client-sample", icon: FlaskConical },
      { name: "Client Produksi", href: "/crm/client-produksi", icon: Factory },
      { name: "Client RO", href: "/crm/client-ro", icon: RefreshCw },
      { name: "Client Lost", href: "/crm/client-lost", icon: UserX },
    ]
  },
  {
    id: "sa-sales",
    title: "Operasional: Penjualan",
    groupLabel: "OPERASIONAL",
    icon: Activity,
    items: [
      { name: "Penjualan Sample", href: "/bussdev/sample-sales", icon: FlaskConical },
      { name: "Bayar Sample", href: "/finance/bayar-sample", icon: DollarSign },
      { name: "DP Penjualan", href: "/finance/dp-penjualan", icon: DollarSign },
      { name: "Faktur Penjualan", href: "/finance/faktur-penjualan", icon: CreditCard },
      { name: "Bayar Penjualan", href: "/finance/bayar-penjualan", icon: CreditCard },
      { name: "Retur Penjualan", href: "/bussdev/retur-penjualan", icon: XCircle },
    ]
  },
  {
    id: "sa-finance",
    title: "Operasional: Akuntansi & Keuangan",
    groupLabel: "OPERASIONAL",
    icon: Landmark,
    items: [
      { name: "Jurnal Umum", href: "/finance/general-journal", icon: FileSpreadsheet },
      { name: "Kas Bank Keluar", href: "/finance/cash-out", icon: CreditCard },
      { name: "Kas Bank Masuk", href: "/finance/cash-in", icon: Landmark },
      { name: "Buku Besar", href: "/finance/ledger", icon: BookOpen },
      { name: "Laba Rugi", href: "/finance/reports", icon: BarChart3 },
      { name: "Neraca Saldo", href: "/finance/reports/trial-balance", icon: FileSpreadsheet },
      { name: "Neraca", href: "/finance/reports/balance-sheet", icon: Scale },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePersonaRole, setActivePersonaRole] = useState<string>("AUTO");

  // State to track open/closed accordions. ALL OPEN BY DEFAULT!
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
      } catch {
        // ignore
      }
    }

    api.get("/auth/profile").then((res) => {
      if (res?.data) {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      }
    }).catch(() => {
      // ignore
    });
  }, []);

  const isNavActive = (href: string) => {
    const [targetPath, targetQuery] = href.split("?");
    if (targetPath !== pathname) return false;
    if (!targetQuery) return !searchParams.toString();
    return new URLSearchParams(targetQuery).toString() === searchParams.toString();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0;";
    window.location.href = "/login";
  };

  // EXACT DYNAMIC ACCESS RESOLVER
  const activeSections = useMemo(() => {
    const userEmail = (user?.email || "").toLowerCase();
    const userRoles: string[] = (user?.roles || []).map((r: string) => r.toUpperCase());
    const isSuperAdmin = userRoles.includes("SUPER_ADMIN") || userRoles.includes("DIRECTOR");

    // If manual persona preview is selected (for testing/admin)
    if (activePersonaRole !== "AUTO") {
      if (activePersonaRole === "DIGIMAR") return DIGIMAR_SECTIONS;
      if (activePersonaRole === "DESIGN") return DESIGN_SECTIONS;
      if (activePersonaRole === "PURCHASE") return PURCHASE_SECTIONS;
      if (activePersonaRole === "FINANCE") return FINANCE_SECTIONS;
      if (activePersonaRole === "BUSDEV") return BUSSDEV_SECTIONS;
      if (activePersonaRole === "RND") return RND_SECTIONS;
      return SUPERADMIN_SECTIONS;
    }

    // 1. Digital Marketing persona / Revita / Digimar (Exactly 4 Dedicated Modules):
    if (
      userEmail.includes("revita@") ||
      userEmail.includes("gusti@") ||
      userEmail.includes("zarkasi@") ||
      userRoles.includes("DIGIMAR") ||
      userRoles.includes("DIGITAL_MARKETING")
    ) {
      return DIGIMAR_SECTIONS;
    }

    // 2. Finance controller persona / Erwin:
    if (userEmail.includes("erwin@") || userRoles.includes("FINANCE") || userRoles.includes("ACCOUNTING")) {
      return FINANCE_SECTIONS;
    }

    // 3. Creative / Designer persona / Edi:
    if (userEmail.includes("edi@") || userRoles.includes("DESIGN") || userRoles.includes("CREATIVE")) {
      return DESIGN_SECTIONS;
    }

    // 4. R&D / Formulator / Amira / Panca / Yaya / Edi / RnD Staff:
    if (
      userEmail.includes("amira@") ||
      userEmail.includes("panca@") ||
      userEmail.includes("yaya@") ||
      userEmail.includes("rnd@") ||
      userRoles.includes("RND") ||
      userRoles.includes("HEAD_RND")
    ) {
      return RND_SECTIONS;
    }

    // 5. Superadmin / Director:
    if (isSuperAdmin) {
      return SUPERADMIN_SECTIONS;
    }

    // 6. Purchasing / SCM:
    if (userRoles.includes("PURCHASING") || userRoles.includes("SCM")) {
      return PURCHASE_SECTIONS;
    }

    // 7. Commercial / BD:
    if (userRoles.includes("COMMERCIAL") || userRoles.includes("MARKETING") || userRoles.includes("BD")) {
      return BUSSDEV_SECTIONS;
    }

    return FINANCE_SECTIONS;
  }, [user, activePersonaRole]);

  // SET ALL ACCORDIONS OPEN BY DEFAULT (or keep user toggle)
  useEffect(() => {
    const nextOpenState: Record<string, boolean> = { ...openAccordions };
    activeSections.forEach((section) => {
      // Default to true (all open by default) if not explicitly set
      if (nextOpenState[section.id] === undefined) {
        nextOpenState[section.id] = true;
      }
    });
    setOpenAccordions(nextOpenState);
  }, [activeSections]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      // If undefined, it was open by default, so toggle to false; otherwise invert
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return activeSections.map((section) => {
      if (section.isDirect) {
        if (!q) return section;
        const matches = section.title.toLowerCase().includes(q) || (section.href && section.href.toLowerCase().includes(q));
        return matches ? section : null;
      }

      const allowedItems = section.items.filter((item) => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q) ||
          section.title.toLowerCase().includes(q)
        );
      });

      if (allowedItems.length === 0 && !section.title.toLowerCase().includes(q)) return null;

      return {
        ...section,
        items: allowedItems,
      };
    }).filter(Boolean) as NavSection[];
  }, [searchQuery, activeSections]);

  const isSuperAdminOrDirector = user?.roles?.some((r: string) => ["SUPER_ADMIN", "DIRECTOR"].includes(r.toUpperCase()));

  return (
    <aside className="w-72 border-r border-slate-200 bg-white h-screen fixed left-0 top-0 flex flex-col z-50 font-sans shadow-[4px_0_24px_rgba(0,0,0,0.02)] select-none">
      {/* 1. Header Branding (NEX ERP / INTELLIGENCE HUB) */}
      <div className="p-4 pb-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs ring-1 ring-slate-200/80 flex items-center justify-center bg-white shrink-0">
            <img src="/nexerp-logo.jpeg" alt="NEX ERP Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[15px] tracking-tight text-slate-900 leading-tight">
                NEX<span className="text-blue-600">ERP</span>
              </span>
            </div>
            <span className="text-[9.5px] font-extrabold tracking-wider text-slate-400 uppercase">
              INTELLIGENCE HUB
            </span>
          </div>
        </div>

        <button
          title="Sidebar Active"
          className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Quick Search Box */}
      <div className="px-3.5 pt-3 pb-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Command + K (Cari menu...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-8 py-2 text-xs bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 focus:border-blue-500 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-medium"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-700 w-4 h-4 rounded-full bg-slate-200/60 hover:bg-slate-300 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          ) : (
            <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-slate-200/50 rounded border border-slate-300/50 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* 3. Navigation Bars & Sub-Bars (Collapsible Accordion List) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        {filteredSections.map((section, idx) => {
          const prevSection = idx > 0 ? filteredSections[idx - 1] : null;
          const showGroupHeader = section.groupLabel && (!prevSection || prevSection.groupLabel !== section.groupLabel);

          // Direct Link Item (e.g. Dashboard, Jurnal Umum, etc)
          if (section.isDirect && section.href) {
            const isDirectActive = isNavActive(section.href);
            const SectionIcon = section.icon || LayoutDashboard;
            return (
              <React.Fragment key={section.id}>
                {showGroupHeader && (
                  <div className="pt-3.5 pb-1 px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                    <span>{section.groupLabel}</span>
                    <div className="h-px bg-slate-100 flex-1" />
                  </div>
                )}
                <div className="pt-0.5">
                  <Link
                    href={section.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all group",
                      isDirectActive
                        ? "bg-slate-900 text-white shadow-xs font-bold"
                        : "text-slate-700 hover:bg-slate-100 hover:text-blue-600"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SectionIcon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isDirectActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-600"
                        )}
                      />
                      <span className="truncate">{section.title}</span>
                    </div>
                    {section.badge && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider",
                          isDirectActive
                            ? "bg-white/20 text-white"
                            : section.badgeVariant === "critical"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : section.badgeVariant === "warning"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : section.badgeVariant === "purple"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        )}
                      >
                        {section.badge}
                      </span>
                    )}
                  </Link>
                </div>
              </React.Fragment>
            );
          }

          // Accordion Mother Bar
          const isOpen = openAccordions[section.id] !== false;
          const hasActiveChild = section.items.some((item) => isNavActive(item.href));
          const SectionIcon = section.icon || FolderTree;

          return (
            <React.Fragment key={section.id}>
              {showGroupHeader && (
                <div className="pt-3.5 pb-1 px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                  <span>{section.groupLabel}</span>
                  <div className="h-px bg-slate-100 flex-1" />
                </div>
              )}
              <div className="space-y-1">
                {/* Mother Accordion Bar Header: ONLY BLACK WHEN A CHILD IS ACTIVE */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-all group cursor-pointer text-left",
                    hasActiveChild
                      ? "bg-slate-900 text-white font-bold shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium bg-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SectionIcon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        hasActiveChild ? "text-blue-400" : "text-slate-500 group-hover:text-blue-600"
                      )}
                    />
                    <span className="truncate">{section.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {section.badge && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 text-[9px] font-bold rounded uppercase tracking-wider",
                          hasActiveChild
                            ? "bg-white/20 text-white"
                            : section.badgeVariant === "critical"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : section.badgeVariant === "warning"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : section.badgeVariant === "purple"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        )}
                      >
                        {section.badge}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200 shrink-0",
                        isOpen ? "rotate-180" : "",
                        hasActiveChild ? "text-slate-300" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                  </div>
                </button>

                {/* Child Sub-Bars (Nested Indented Items with Guide Line) */}
                {isOpen && section.items.length > 0 && (
                  <div className="ml-4 pl-3 border-l border-slate-200/90 space-y-0.5 py-1">
                    {section.items.map((item) => {
                      const active = isNavActive(item.href);
                      const ItemIcon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] transition-all group relative font-medium",
                            active
                              ? "bg-blue-50/90 text-blue-700 font-bold border-l-2 border-blue-600 -ml-[13px] pl-[11px] shadow-2xs"
                              : "text-slate-600 hover:bg-blue-50/50 hover:text-blue-600"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {ItemIcon && (
                              <ItemIcon
                                className={cn(
                                  "w-3.5 h-3.5 shrink-0 transition-colors",
                                  active
                                    ? "text-blue-600"
                                    : "text-slate-400 group-hover:text-blue-600"
                                )}
                              />
                            )}
                            <span className="truncate">{item.name}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={cn(
                                "px-1.5 py-0.2 text-[9px] font-bold rounded shrink-0 uppercase tracking-wider",
                                active
                                  ? "bg-blue-600 text-white"
                                  : item.badgeVariant === "critical"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : item.badgeVariant === "warning"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : item.badgeVariant === "purple"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 4. Footer Profile Card & Persona Switcher */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        {/* Persona Switcher Selector for Admin */}
        {isSuperAdminOrDirector && (
          <div className="mb-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center justify-between px-1">
              <span>Preview Mode:</span>
              <span className="text-purple-600 font-black">{activePersonaRole}</span>
            </div>
            <select
              value={activePersonaRole}
              onChange={(e) => setActivePersonaRole(e.target.value)}
              className="w-full h-7 px-2 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="AUTO">✨ Auto (Super Admin Full)</option>
              <option value="RND">🧪 R&D / Formulasi Mode</option>
              <option value="DIGIMAR">📱 Digimar / Revita (4 Module)</option>
              <option value="DESIGN">🎨 Design / Edi Mode</option>
              <option value="PURCHASE">🚚 Purchase / SCM Mode</option>
              <option value="FINANCE">💳 Finance Mode (22 Menu)</option>
              <option value="BUSDEV">💼 Busdev Mode</option>
            </select>
          </div>
        )}

        <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs border border-purple-200 shadow-2xs">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "E"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate leading-tight">
                {user?.fullName || "Edi (Design)"}
              </span>
              <span className="text-[10px] text-purple-600 font-bold truncate">
                {user?.roles?.join(", ") || "Graphic Designer"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Keluar / Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
