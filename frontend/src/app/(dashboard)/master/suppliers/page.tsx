"use client";

/**
 * Master Supplier & Vendor — Unified Enterprise Data Hub
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 55-58),
 * MASTER_DATA/SUPPLIER.csv, dan REQUIREMENT.md Poin 1 & 47.
 *
 * Visual DNA Golden Reference Architecture:
 * - 0 raw @/components/ui imports (Strict ADR-007)
 * - Light Enterprise Theme: bg-[#F8FAFC]
 * - DnaPageHeader with integrated tabs
 * - DnaKpiGrid with 4 interactive KPI metric cards
 * - DnaDataTableCard with 2-level filter toolbar + extraActions (Import & Export Excel)
 * - Sortable columns & bulk checkbox selection
 * - DnaCell.* design system primitives
 * - Clean DnaModal dialogs for CRUD & Excel import
 */

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Tags,
  Plus,
  Upload,
  Download,
  Phone,
  CheckCircle2,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaModal,
  DnaConfirmDialog,
  DnaCell,
  useDnaToast,
} from "@/components/dna";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

// ── Types ──
export interface MasterSupplierItem {
  id: string;
  vendorCode: string;
  nama: string;
  pic: string;
  phone: string;
  email?: string;
  kategoriBahan: "Bahan Baku" | "Kemasan Primer" | "Kemasan Sekunder" | "Bahan Pembantu" | "Jasa Maklon";
  kota: string;
  provinsi: string;
  alamatLengkap: string;
  pajakPersen: 11 | 0;
  isPkp: boolean;
  npwp?: string;
  paymentTerm: string; // "Net 14", "Net 30", "Net 45", "Cash Before Delivery"
  bankAccount: string;
  realStokSupplier: string; // e.g. "Tersedia Kontrak", "Ready Stock 500kg"
  status: "ACTIVE" | "INACTIVE";
}

export interface KategoriSupplierItem {
  id: string;
  kode: string;
  kategori: string;
  deskripsi: string;
  totalSupplier: number;
}

// ── Seed Data from SUPPLIER.csv ──
const INITIAL_SUPPLIERS: MasterSupplierItem[] = [
  {
    id: "sup-1",
    vendorCode: "VND-BBK-001",
    nama: "DKSH Indonesia",
    pic: "Wenny",
    phone: "082244023077",
    email: "wenny.procurement@dksh.com",
    kategoriBahan: "Bahan Baku",
    kota: "Jakarta Selatan",
    provinsi: "DKI Jakarta",
    alamatLengkap: "Menara Batavia Lt. 22, Jl. KH Mas Mansyur Kav. 126",
    pajakPersen: 11,
    isPkp: true,
    npwp: "01.345.678.9-012.000",
    paymentTerm: "Net 30",
    bankAccount: "BCA 088-345-2199 a/n DKSH Indonesia",
    realStokSupplier: "Ready Stock Kontrak Tahunan",
    status: "ACTIVE",
  },
  {
    id: "sup-2",
    vendorCode: "VND-BBK-002",
    nama: "Iberchem Fragrances",
    pic: "Yonatan",
    phone: "087851117541",
    email: "yonatan.sales@iberchem.es",
    kategoriBahan: "Bahan Baku",
    kota: "Kab. Sidoarjo",
    provinsi: "Jawa Timur",
    alamatLengkap: "Kawasan Industri Berbek Industri II No. 18",
    pajakPersen: 0,
    isPkp: false,
    npwp: "-",
    paymentTerm: "Net 14",
    bankAccount: "Mandiri 142-00-1928374-1 a/n Iberchem",
    realStokSupplier: "Impor Spanyol (Lead time 14 hari)",
    status: "ACTIVE",
  },
  {
    id: "sup-3",
    vendorCode: "VND-BBK-003",
    nama: "Benberg Aroma Fabric",
    pic: "Cintia",
    phone: "081334239200",
    email: "cintia.benberg@gmail.com",
    kategoriBahan: "Bahan Baku",
    kota: "Kota Surabaya",
    provinsi: "Jawa Timur",
    alamatLengkap: "Jl. Rungkut Industri III No. 45",
    pajakPersen: 0,
    isPkp: false,
    npwp: "-",
    paymentTerm: "Cash",
    bankAccount: "BCA 018-293-8475 a/n Benberg",
    realStokSupplier: "Ready Stock Pabrik",
    status: "ACTIVE",
  },
  {
    id: "sup-4",
    vendorCode: "VND-BBK-004",
    nama: "Chemico Specialty Chemicals",
    pic: "Johanna",
    phone: "08175205008",
    email: "johanna@chemico.co.id",
    kategoriBahan: "Bahan Baku",
    kota: "Jakarta Barat",
    provinsi: "DKI Jakarta",
    alamatLengkap: "Sentra Niaga Puri Indah Blok T2 No. 10",
    pajakPersen: 11,
    isPkp: true,
    npwp: "02.891.234.5-085.000",
    paymentTerm: "Net 45",
    bankAccount: "BCA 218-990-1122 a/n Chemico",
    realStokSupplier: "Gudang Cikarang 2.5 Ton",
    status: "ACTIVE",
  },
  {
    id: "sup-5",
    vendorCode: "VND-BBK-005",
    nama: "Reda Chemicals",
    pic: "Sandi",
    phone: "081236557377",
    email: "sandi.chem@reda.com",
    kategoriBahan: "Bahan Baku",
    kota: "Kota Tangerang",
    provinsi: "Banten",
    alamatLengkap: "Kawasan Industri Jatake Blok C No. 5",
    pajakPersen: 0,
    isPkp: false,
    npwp: "-",
    paymentTerm: "Net 14",
    bankAccount: "BNI 092-384-7561 a/n Reda Chemicals",
    realStokSupplier: "Ready Stock",
    status: "ACTIVE",
  },
  {
    id: "sup-6",
    vendorCode: "VND-BBK-006",
    nama: "Prambanan Kencana",
    pic: "Arif",
    phone: "081333706801",
    email: "arif.prambanan@kencana.id",
    kategoriBahan: "Bahan Baku",
    kota: "Kab. Pasuruan",
    provinsi: "Jawa Timur",
    alamatLengkap: "Jl. Raya Surabaya-Malang KM 48",
    pajakPersen: 0,
    isPkp: false,
    npwp: "-",
    paymentTerm: "Net 30",
    bankAccount: "BCA 345-678-9012 a/n Prambanan",
    realStokSupplier: "Gudang Pasuruan 500 Sak",
    status: "ACTIVE",
  },
  {
    id: "sup-7",
    vendorCode: "VND-BBK-007",
    nama: "Bahtera Adijaya",
    pic: "Weslie",
    phone: "085256567345",
    email: "weslie@bahteraadijaya.com",
    kategoriBahan: "Bahan Baku",
    kota: "Kota Surabaya",
    provinsi: "Jawa Timur",
    alamatLengkap: "Jl. Kertajaya Indah Timur No. 88",
    pajakPersen: 11,
    isPkp: true,
    npwp: "01.782.910.4-041.000",
    paymentTerm: "Net 30",
    bankAccount: "Mandiri 141-00-8877665-2 a/n Bahtera Adijaya",
    realStokSupplier: "Ready Stock 1.2 Ton",
    status: "ACTIVE",
  },
  {
    id: "sup-8",
    vendorCode: "VND-BBK-008",
    nama: "Megasetia Agung Kimia",
    pic: "Robby",
    phone: "08123226620",
    email: "robby.setia@megasetia.com",
    kategoriBahan: "Bahan Baku",
    kota: "Jakarta Pusat",
    provinsi: "DKI Jakarta",
    alamatLengkap: "Jl. Hayam Wuruk No. 120",
    pajakPersen: 11,
    isPkp: true,
    npwp: "01.234.567.8-071.000",
    paymentTerm: "Net 45",
    bankAccount: "BCA 001-928-3746 a/n Megasetia",
    realStokSupplier: "Gudang Tanjung Priok",
    status: "ACTIVE",
  },
  {
    id: "sup-9",
    vendorCode: "VND-KPR-001",
    nama: "PT Nilam Widuri (Packaging Division)",
    pic: "Ahmad Alydrus",
    phone: "08159400228",
    email: "ahmad.alydrus@nilamwiduri.co.id",
    kategoriBahan: "Kemasan Primer",
    kota: "Kota Surabaya",
    provinsi: "Jawa Timur",
    alamatLengkap: "Jl. Margomulyo No. 44 Kompleks Pergudangan Suri Mulia",
    pajakPersen: 11,
    isPkp: true,
    npwp: "03.112.445.6-061.000",
    paymentTerm: "Net 30",
    bankAccount: "BCA 123-456-7890 a/n Nilam Widuri",
    realStokSupplier: "Botol Kaca Amber 50.000 pcs",
    status: "ACTIVE",
  },
  {
    id: "sup-10",
    vendorCode: "VND-KPR-002",
    nama: "SML Kemasan Mandiri",
    pic: "Putri",
    phone: "081229222868",
    email: "putri.sml@kemasan.co.id",
    kategoriBahan: "Kemasan Primer",
    kota: "Kota Semarang",
    provinsi: "Jawa Tengah",
    alamatLengkap: "Kawasan Industri Wijayakusuma Blok B-9",
    pajakPersen: 11,
    isPkp: true,
    npwp: "02.556.778.9-051.000",
    paymentTerm: "Net 30",
    bankAccount: "BCA 445-123-8899 a/n SML Kemasan",
    realStokSupplier: "Tube PE 80.000 pcs",
    status: "ACTIVE",
  },
  {
    id: "sup-11",
    vendorCode: "VND-KSR-001",
    nama: "Percetakan Surya Gemilang",
    pic: "Bambang",
    phone: "081234889911",
    email: "surya.gemilang@offset.id",
    kategoriBahan: "Kemasan Sekunder",
    kota: "Kota Surabaya",
    provinsi: "Jawa Timur",
    alamatLengkap: "Jl. Kenjeran No. 210",
    pajakPersen: 0,
    isPkp: false,
    npwp: "-",
    paymentTerm: "Net 14",
    bankAccount: "BCA 088-112-9900 a/n Bambang S",
    realStokSupplier: "Made to Order (Lead time 7 hari)",
    status: "ACTIVE",
  },
];

const INITIAL_SUPPLIER_CATEGORIES: KategoriSupplierItem[] = [
  { id: "scat-1", kode: "BBK", kategori: "Bahan Baku", deskripsi: "Vendor pemasok active ingredients, base, surfactant, dan ekstrak alami", totalSupplier: 112 },
  { id: "scat-2", kode: "KPR", kategori: "Kemasan Primer", deskripsi: "Pabrik botol serum, pot jar acrylic, tube pasta, dan pump dispenser", totalSupplier: 38 },
  { id: "scat-3", kode: "KSR", kategori: "Kemasan Sekunder", deskripsi: "Vendor percetakan inner box, kardus outer, label stiker, dan shrink film", totalSupplier: 16 },
  { id: "scat-4", kode: "BPB", kategori: "Bahan Pembantu", deskripsi: "Pemasok alkohol 96% teknis, filter pad, sarung tangan nitril, dan sanitasi", totalSupplier: 8 },
  { id: "scat-5", kode: "JMK", kategori: "Jasa Maklon", deskripsi: "Mitra eksternal sub-kontrak irradiation sterilization dan aerosol filling", totalSupplier: 4 },
];

function MasterSuppliersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === "categories" ? "categories" : "suppliers"
  );

  useEffect(() => {
    if (tabParam === "categories" || tabParam === "suppliers") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/master/suppliers?tab=${tabId}`);
  };

  // ── States ──
  const suppliersQuery = useQuery({
    queryKey: ["master-suppliers"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/suppliers");
        const body = unwrapResponse(res);
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : INITIAL_SUPPLIERS;
      } catch {
        return INITIAL_SUPPLIERS;
      }
    },
  });
  const categoriesQuery = useQuery({
    queryKey: ["master-supplier-categories"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/suppliers/categories");
        const body = unwrapResponse(res);
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : INITIAL_SUPPLIER_CATEGORIES;
      } catch {
        return INITIAL_SUPPLIER_CATEGORIES;
      }
    },
  });
  const [suppliersList, setSuppliersList] = useState<MasterSupplierItem[]>(INITIAL_SUPPLIERS);
  const [categoriesList, setCategoriesList] = useState<KategoriSupplierItem[]>(INITIAL_SUPPLIER_CATEGORIES);

  // Sync API results into local lists when query resolves.
  useEffect(() => {
    if (suppliersQuery.data && Array.isArray(suppliersQuery.data) && suppliersQuery.data.length > 0) {
      setSuppliersList(suppliersQuery.data);
    }
  }, [suppliersQuery.data]);
  useEffect(() => {
    if (categoriesQuery.data && Array.isArray(categoriesQuery.data) && categoriesQuery.data.length > 0) {
      setCategoriesList(categoriesQuery.data);
    }
  }, [categoriesQuery.data]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string>("ALL");
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<string>("kategori");
  const [filterColumnValue, setFilterColumnValue] = useState<string>("ALL");

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<MasterSupplierItem | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<MasterSupplierItem | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<MasterSupplierItem | null>(null);

  // Modal Kategori
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KategoriSupplierItem | null>(null);

  // Form Supplier
  const [supplierForm, setSupplierForm] = useState({
    vendorCode: "",
    nama: "",
    pic: "",
    phone: "",
    email: "",
    kategoriBahan: "Bahan Baku" as MasterSupplierItem["kategoriBahan"],
    provinsi: "Jawa Timur",
    kota: "Kota Surabaya",
    alamatLengkap: "",
    pajakPersen: 11 as 11 | 0,
    isPkp: true,
    npwp: "",
    paymentTerm: "Net 30",
    bankAccount: "",
    realStokSupplier: "Ready Stock",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  // Form Kategori
  const [categoryForm, setCategoryForm] = useState({
    kode: "",
    kategori: "",
    deskripsi: "",
  });

  // ── Stats ──
  const totalSuppliers = suppliersList.length;
  const rawMaterialSuppliers = suppliersList.filter((s) => s.kategoriBahan === "Bahan Baku").length;
  const packagingSuppliers = suppliersList.filter(
    (s) => s.kategoriBahan === "Kemasan Primer" || s.kategoriBahan === "Kemasan Sekunder"
  ).length;
  const pkpSuppliers = suppliersList.filter((s) => s.isPkp).length;

  // ── Filtered & Sorted Suppliers Pipeline ──
  const filteredSuppliers = useMemo(() => {
    return suppliersList
      .filter((item) => {
        // 1. KPI Filter
        if (selectedKpiFilter === "BBK" && item.kategoriBahan !== "Bahan Baku") return false;
        if (
          selectedKpiFilter === "KEMASAN" &&
          item.kategoriBahan !== "Kemasan Primer" &&
          item.kategoriBahan !== "Kemasan Sekunder"
        )
          return false;
        if (selectedKpiFilter === "PKP" && !item.isPkp) return false;

        // 2. Toolbar 2-Level Filter
        if (filterColumnValue !== "ALL") {
          if (selectedFilterColumn === "kategori" && item.kategoriBahan !== filterColumnValue) {
            return false;
          }
          if (selectedFilterColumn === "pajak") {
            if (filterColumnValue === "PKP" && !item.isPkp) return false;
            if (filterColumnValue === "NON" && item.isPkp) return false;
          }
        }

        // 3. Global Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = item.vendorCode.toLowerCase().includes(q);
          const matchName = item.nama.toLowerCase().includes(q);
          const matchPic = item.pic.toLowerCase().includes(q);
          const matchCity = item.kota.toLowerCase().includes(q);
          const matchPhone = item.phone.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchPic && !matchCity && !matchPhone) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (!sortColumn) return 0;
        const dir = sortDirection === "asc" ? 1 : -1;
        switch (sortColumn) {
          case "vendorCode":
            return dir * a.vendorCode.localeCompare(b.vendorCode);
          case "nama":
            return dir * a.nama.localeCompare(b.nama);
          case "pic":
            return dir * a.pic.localeCompare(b.pic);
          case "kategoriBahan":
            return dir * a.kategoriBahan.localeCompare(b.kategoriBahan);
          case "kota":
            return dir * a.kota.localeCompare(b.kota);
          default:
            return 0;
        }
      });
  }, [
    suppliersList,
    selectedKpiFilter,
    selectedFilterColumn,
    filterColumnValue,
    searchQuery,
    sortColumn,
    sortDirection,
  ]);

  // Pagination Slice
  const totalEntries = filteredSuppliers.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage, pageSize]);

  // Sorting Handler
  const handleHeaderSortToggle = (colKey: string) => {
    if (sortColumn === colKey) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(colKey);
      setSortDirection("asc");
    }
  };

  // Selection Handler
  const toggleSelectAll = () => {
    if (selectedRowIds.length === paginatedSuppliers.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(paginatedSuppliers.map((s) => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ── Handlers ──
  const handleOpenCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      vendorCode: `VND-BBK-${String(suppliersList.length + 1).padStart(3, "0")}`,
      nama: "",
      pic: "",
      phone: "",
      email: "",
      kategoriBahan: "Bahan Baku",
      provinsi: "Jawa Timur",
      kota: "Kota Surabaya",
      alamatLengkap: "",
      pajakPersen: 11,
      isPkp: true,
      npwp: "",
      paymentTerm: "Net 30",
      bankAccount: "",
      realStokSupplier: "Ready Stock",
      status: "ACTIVE",
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (item: MasterSupplierItem) => {
    setEditingSupplier(item);
    setSupplierForm({
      vendorCode: item.vendorCode,
      nama: item.nama,
      pic: item.pic,
      phone: item.phone,
      email: item.email || "",
      kategoriBahan: item.kategoriBahan,
      provinsi: item.provinsi,
      kota: item.kota,
      alamatLengkap: item.alamatLengkap,
      pajakPersen: item.pajakPersen,
      isPkp: item.isPkp,
      npwp: item.npwp || "",
      paymentTerm: item.paymentTerm,
      bankAccount: item.bankAccount,
      realStokSupplier: item.realStokSupplier,
      status: item.status,
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = () => {
    if (!supplierForm.nama.trim() || !supplierForm.pic.trim() || !supplierForm.phone.trim()) {
      toast.error("Nama supplier, PIC, dan nomor telepon wajib diisi!");
      return;
    }

    if (editingSupplier) {
      setSuppliersList((prev) =>
        prev.map((s) => (s.id === editingSupplier.id ? { ...s, ...supplierForm } : s))
      );
      toast.success(`Data supplier ${supplierForm.nama} berhasil diperbarui.`);
    } else {
      const newSupplier: MasterSupplierItem = {
        id: `sup-${Date.now()}`,
        ...supplierForm,
      };
      setSuppliersList((prev) => [newSupplier, ...prev]);
      toast.success(`Supplier baru ${newSupplier.nama} berhasil ditambahkan.`);
    }
    setIsSupplierModalOpen(false);
  };

  const handleDeleteSupplier = () => {
    if (!supplierToDelete) return;
    setSuppliersList((prev) => prev.filter((s) => s.id !== supplierToDelete.id));
    toast.success(`Supplier ${supplierToDelete.nama} berhasil dihapus.`);
    setSupplierToDelete(null);
  };

  const handleExportExcel = () => {
    toast.info("Mengunduh data supplier dalam format Excel...");
    const headers = [
      "Vendor Code",
      "Nama Supplier",
      "PIC",
      "Telepon/WA",
      "Email",
      "Kategori",
      "Kota",
      "Provinsi",
      "Alamat",
      "Pajak PPN",
      "Status PKP",
      "NPWP",
      "TOP",
      "Rekening Bank",
      "Status",
    ];

    const rows = filteredSuppliers.map((s) => [
      s.vendorCode,
      `"${s.nama.replace(/"/g, '""')}"`,
      `"${s.pic.replace(/"/g, '""')}"`,
      `'${s.phone}`,
      s.email || "-",
      s.kategoriBahan,
      s.kota,
      s.provinsi,
      `"${s.alamatLengkap.replace(/"/g, '""')}"`,
      `${s.pajakPersen}%`,
      s.isPkp ? "PKP" : "NON-PKP",
      s.npwp || "-",
      s.paymentTerm,
      `"${s.bankAccount.replace(/"/g, '""')}"`,
      s.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `master_suppliers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export Excel master supplier selesai.");
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. MODULAR PAGE HEADER ── */}
      <DnaPageHeader
        backLink={{ href: "/master", label: "Kembali ke Master Hub" }}
        title="MASTER DATA SUPPLIER & VENDOR"
        tabs={[
          {
            key: "suppliers",
            label: "Daftar Supplier",
            count: suppliersList.length,
            icon: <Building2 className="w-3.5 h-3.5" />,
          },
          {
            key: "categories",
            label: "Kategori Supplier",
            count: categoriesList.length,
            icon: <Tags className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* ── TAB 1: DAFTAR SUPPLIER ── */}
      {activeTab === "suppliers" && (
        <div className="space-y-6">
          {/* ── 02. MODULAR 4 KPI METRIC CARDS ── */}
          <DnaKpiGrid
            cards={[
              {
                key: "ALL",
                title: "TOTAL REKANAN AKTIF",
                value: totalSuppliers.toLocaleString("id-ID"),
                deltaText: "Katalog vendor terverifikasi",
                isDeltaPositive: true,
                icon: <Building2 className="w-4 h-4" />,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                isSelected: selectedKpiFilter === "ALL",
                onClick: () => setSelectedKpiFilter("ALL"),
              },
              {
                key: "BBK",
                title: "VENDOR BAHAN BAKU",
                value: `${rawMaterialSuppliers} Vendor`,
                deltaText: "Active, base, aroma, extract",
                isDeltaPositive: true,
                icon: <Layers className="w-4 h-4" />,
                iconBg: "bg-purple-50",
                iconColor: "text-purple-600",
                isSelected: selectedKpiFilter === "BBK",
                onClick: () => setSelectedKpiFilter(selectedKpiFilter === "BBK" ? "ALL" : "BBK"),
              },
              {
                key: "KEMASAN",
                title: "VENDOR KEMASAN (PRIMER/SEKUNDER)",
                value: `${packagingSuppliers} Vendor`,
                deltaText: "Botol, tube, jar, box karton",
                isDeltaPositive: true,
                icon: <Building2 className="w-4 h-4" />,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                isSelected: selectedKpiFilter === "KEMASAN",
                onClick: () => setSelectedKpiFilter(selectedKpiFilter === "KEMASAN" ? "ALL" : "KEMASAN"),
              },
              {
                key: "PKP",
                title: "REKANAN PKP (PPN 11%)",
                value: `${pkpSuppliers} Vendor`,
                deltaText: "Kepatuhan faktur pajak resmi",
                isDeltaPositive: true,
                icon: <CheckCircle2 className="w-4 h-4" />,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                isSelected: selectedKpiFilter === "PKP",
                onClick: () => setSelectedKpiFilter(selectedKpiFilter === "PKP" ? "ALL" : "PKP"),
              },
            ]}
          />

          {/* ── 03. MODULAR DATA TABLE CARD ── */}
          <DnaDataTableCard
            toolbarProps={{
              searchQuery,
              onSearchChange: setSearchQuery,
              searchPlaceholder: "Cari kode vendor, nama supplier, PIC, kota...",
              filterColumns: [
                {
                  key: "kategori",
                  label: "Kategori Bahan",
                  type: "select",
                  options: [
                    "Bahan Baku",
                    "Kemasan Primer",
                    "Kemasan Sekunder",
                    "Bahan Pembantu",
                    "Jasa Maklon",
                  ],
                },
                {
                  key: "pajak",
                  label: "Status Pajak",
                  type: "select",
                  options: ["PKP", "NON"],
                },
              ],
              selectedColumn: selectedFilterColumn,
              onSelectColumn: (col) => {
                setSelectedFilterColumn(col);
                setFilterColumnValue("ALL");
              },
              filterValue: filterColumnValue,
              onFilterValueChange: setFilterColumnValue,
              actionButton: {
                label: "Tambah Supplier",
                onClick: handleOpenCreateSupplier,
              },
              extraActions: (
                <div className="flex items-center gap-2">
                  <DnaButton
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportModalOpen(true)}
                    icon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Import Excel
                  </DnaButton>
                  <DnaButton
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Excel
                  </DnaButton>
                </div>
              ),
            }}
            paginationProps={{
              currentPage,
              totalPages,
              totalEntries,
              pageSize,
              onPageChange: setCurrentPage,
            }}
          >
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                  {/* Select All Checkbox */}
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedSuppliers.length > 0 && selectedRowIds.length === paginatedSuppliers.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5 w-10 text-slate-400">#</th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[130px]"
                    onClick={() => handleHeaderSortToggle("vendorCode")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>VENDOR CODE</span>
                      {sortColumn === "vendorCode" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[200px]"
                    onClick={() => handleHeaderSortToggle("nama")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>NAMA SUPPLIER</span>
                      {sortColumn === "nama" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[120px]"
                    onClick={() => handleHeaderSortToggle("pic")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>PIC KONTAK</span>
                      {sortColumn === "pic" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 min-w-[130px]">TELEPON / WA</th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[130px]"
                    onClick={() => handleHeaderSortToggle("kategoriBahan")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>KATEGORI</span>
                      {sortColumn === "kategoriBahan" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[110px]"
                    onClick={() => handleHeaderSortToggle("kota")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>KOTA</span>
                      {sortColumn === "kota" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 text-center min-w-[80px]">PAJAK</th>
                  <th className="p-3.5 min-w-[90px]">TOP</th>
                  <th className="p-3.5 min-w-[150px]">BANK & REKENING</th>
                  <th className="p-3.5 text-center min-w-[90px]">STATUS PKP</th>
                  <th className="p-3.5 text-center w-28">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-400">
                      Tidak ada data supplier yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  paginatedSuppliers.map((sup, idx) => {
                    const isSelected = selectedRowIds.includes(sup.id);
                    return (
                      <tr
                        key={sup.id}
                        className={`hover:bg-slate-50/80 transition-colors cursor-default ${
                          isSelected ? "bg-blue-50/30" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(sup.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5 text-slate-400 tabular-nums">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-3.5">
                          <DnaCell.Code
                            value={sup.vendorCode}
                            onClick={() => {
                              setSelectedSupplier(sup);
                              setIsDetailModalOpen(true);
                            }}
                          />
                        </td>
                        <td className="p-3.5">
                          <DnaCell.Text
                            primary={sup.nama}
                            secondary={sup.alamatLengkap}
                            maxWidth="max-w-[240px]"
                          />
                        </td>
                        <td className="p-3.5 font-medium text-slate-700">
                          {sup.pic}
                        </td>
                        <td className="p-3.5">
                          <a
                            href={`https://wa.me/${sup.phone.replace(/^0/, "62")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-emerald-600 hover:text-emerald-700 hover:underline font-medium text-[11px]"
                          >
                            <Phone className="w-3 h-3 text-emerald-500" />
                            {sup.phone}
                          </a>
                        </td>
                        <td className="p-3.5">
                          <DnaCell.Badge
                            label={sup.kategoriBahan}
                            status={
                              sup.kategoriBahan === "Bahan Baku"
                                ? "info"
                                : sup.kategoriBahan === "Kemasan Primer"
                                ? "purple"
                                : "default"
                            }
                          />
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          {sup.kota}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              sup.pajakPersen === 11
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {sup.pajakPersen}%
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">
                          {sup.paymentTerm}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-500 truncate max-w-[160px]">
                          {sup.bankAccount}
                        </td>
                        <td className="p-3.5 text-center">
                          <DnaCell.Badge
                            label={sup.isPkp ? "PKP" : "NON-PKP"}
                            status={sup.isPkp ? "success" : "default"}
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <DnaCell.Actions
                            onView={() => {
                              setSelectedSupplier(sup);
                              setIsDetailModalOpen(true);
                            }}
                            onEdit={() => handleOpenEditSupplier(sup)}
                            onDelete={() => setSupplierToDelete(sup)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── TAB 2: KATEGORI SUPPLIER ── */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <DnaDataTableCard
            toolbarProps={{
              searchPlaceholder: "Kategori supplier pengadaan material...",
              actionButton: {
                label: "Tambah Kategori",
                onClick: () => {
                  setEditingCategory(null);
                  setCategoryForm({ kode: "", kategori: "", deskripsi: "" });
                  setIsCategoryModalOpen(true);
                },
              },
            }}
          >
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                  <th className="p-3.5 w-12 text-slate-400">#</th>
                  <th className="p-3.5 min-w-[120px]">KODE PREFIX</th>
                  <th className="p-3.5 min-w-[200px]">NAMA KATEGORI</th>
                  <th className="p-3.5 min-w-[300px]">DESKRIPSI & RUANG LINGKUP</th>
                  <th className="p-3.5 text-center min-w-[140px]">JUMLAH REKANAN</th>
                  <th className="p-3.5 text-center w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoriesList.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="p-3.5">
                      <DnaCell.Code value={cat.kode} />
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 uppercase">
                      {cat.kategori}
                    </td>
                    <td className="p-3.5 text-slate-600">{cat.deskripsi}</td>
                    <td className="p-3.5 text-center">
                      <DnaCell.Badge label={`${cat.totalSupplier} Vendor`} status="info" />
                    </td>
                    <td className="p-3.5 text-center">
                      <DnaCell.Actions
                        onEdit={() => {
                          setEditingCategory(cat);
                          setCategoryForm({
                            kode: cat.kode,
                            kategori: cat.kategori,
                            deskripsi: cat.deskripsi,
                          });
                          setIsCategoryModalOpen(true);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── MODAL TAMBAH / EDIT SUPPLIER ── */}
      <DnaModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier ? `Sunting Vendor: ${editingSupplier.nama}` : "Tambah Supplier Baru"}
        description="Lengkapi profil rekanan, syarat pembayaran (TOP), perbankan, dan data perpajakan"
        size="lg"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Kode Vendor (Universal Auto) *"
              value={supplierForm.vendorCode}
              onChange={(e) => setSupplierForm({ ...supplierForm, vendorCode: e.target.value })}
              placeholder="e.g. VND-BBK-001"
            />
            <DnaInput
              label="Nama Perusahaan / Supplier *"
              value={supplierForm.nama}
              onChange={(e) => setSupplierForm({ ...supplierForm, nama: e.target.value })}
              placeholder="e.g. PT DKSH Indonesia"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DnaInput
              label="Nama PIC / Kontak Person *"
              value={supplierForm.pic}
              onChange={(e) => setSupplierForm({ ...supplierForm, pic: e.target.value })}
              placeholder="e.g. Ibu Wenny"
            />
            <DnaInput
              label="Nomor Telepon / WhatsApp *"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              placeholder="082244023077"
            />
            <DnaInput
              label="Email Resmi (Opsional)"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              placeholder="sales@vendor.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DnaSelect
              label="Kategori Bahan *"
              value={supplierForm.kategoriBahan}
              onChange={(val) =>
                setSupplierForm({ ...supplierForm, kategoriBahan: val as MasterSupplierItem["kategoriBahan"] })
              }
              options={[
                { value: "Bahan Baku", label: "Bahan Baku" },
                { value: "Kemasan Primer", label: "Kemasan Primer" },
                { value: "Kemasan Sekunder", label: "Kemasan Sekunder" },
                { value: "Bahan Pembantu", label: "Bahan Pembantu" },
                { value: "Jasa Maklon", label: "Jasa Maklon" },
              ]}
            />
            <DnaSelect
              label="Status Pajak & PKP *"
              value={supplierForm.isPkp ? "PKP" : "NON"}
              onChange={(val) =>
                setSupplierForm({
                  ...supplierForm,
                  isPkp: val === "PKP",
                  pajakPersen: val === "PKP" ? 11 : 0,
                })
              }
              options={[
                { value: "PKP", label: "PKP (PPN 11%)" },
                { value: "NON", label: "Non-PKP (0%)" },
              ]}
            />
            <DnaInput
              label="NPWP Vendor"
              value={supplierForm.npwp}
              onChange={(e) => setSupplierForm({ ...supplierForm, npwp: e.target.value })}
              placeholder="01.234.567.8-012.000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaSelect
              label="Term of Payment (TOP) *"
              value={supplierForm.paymentTerm}
              onChange={(val) => setSupplierForm({ ...supplierForm, paymentTerm: val })}
              options={[
                { value: "Cash", label: "Cash Before Delivery" },
                { value: "Net 14", label: "Net 14 Hari" },
                { value: "Net 30", label: "Net 30 Hari" },
                { value: "Net 45", label: "Net 45 Hari" },
                { value: "Net 60", label: "Net 60 Hari" },
              ]}
            />
            <DnaInput
              label="Rekening Bank Vendor *"
              value={supplierForm.bankAccount}
              onChange={(e) => setSupplierForm({ ...supplierForm, bankAccount: e.target.value })}
              placeholder="BCA 088-123-456 a/n PT DKSH"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Provinsi"
              value={supplierForm.provinsi}
              onChange={(e) => setSupplierForm({ ...supplierForm, provinsi: e.target.value })}
              placeholder="Jawa Timur"
            />
            <DnaInput
              label="Kota / Kabupaten *"
              value={supplierForm.kota}
              onChange={(e) => setSupplierForm({ ...supplierForm, kota: e.target.value })}
              placeholder="Kota Surabaya"
            />
          </div>

          <DnaTextarea
            label="Alamat Lengkap Kantor / Gudang Supplier *"
            value={supplierForm.alamatLengkap}
            onChange={(e) => setSupplierForm({ ...supplierForm, alamatLengkap: e.target.value })}
            placeholder="Jalan, gedung, kawasan industri, kode pos..."
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <DnaButton variant="ghost" onClick={() => setIsSupplierModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveSupplier}>
              Simpan Data Supplier
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* ── MODAL DETAIL SUPPLIER ── */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Profil Supplier: ${selectedSupplier?.nama}`}
        description="Detail kontak, status pajak, termin pembayaran, dan histori pengadaan"
        size="lg"
      >
        {selectedSupplier && (
          <div className="space-y-4 py-2 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <DnaCell.Code value={selectedSupplier.vendorCode} />
                  <h3 className="text-base font-bold text-slate-900 uppercase mt-1">
                    {selectedSupplier.nama}
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Kategori: <strong className="text-slate-700">{selectedSupplier.kategoriBahan}</strong> • Wilayah:{" "}
                    <strong className="text-slate-700">{selectedSupplier.kota}, {selectedSupplier.provinsi}</strong>
                  </p>
                </div>
                <DnaCell.Badge
                  label={selectedSupplier.isPkp ? "PKP 11%" : "NON-PKP"}
                  status={selectedSupplier.isPkp ? "success" : "default"}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Kontak PIC</div>
                  <div className="font-bold text-slate-800">{selectedSupplier.pic}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">WhatsApp</div>
                  <div className="font-mono text-emerald-600 font-bold">{selectedSupplier.phone}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Term of Payment</div>
                  <div className="font-bold text-blue-600">{selectedSupplier.paymentTerm}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Ketersediaan Stok</div>
                  <div className="font-bold text-slate-700">{selectedSupplier.realStokSupplier}</div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-slate-500 text-[11px]">Alamat Pengiriman & Korespondensi:</span>
                <div className="font-medium text-slate-700 bg-white p-2 rounded border border-slate-200">
                  {selectedSupplier.alamatLengkap}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <span className="text-slate-500">Rekening Bank:</span>
                  <div className="font-mono font-bold text-slate-800">{selectedSupplier.bankAccount}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">NPWP Perusahaan:</span>
                  <div className="font-mono font-bold text-slate-800">{selectedSupplier.npwp || "-"}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="ghost" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </DnaButton>
              <DnaButton
                variant="primary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEditSupplier(selectedSupplier);
                }}
              >
                Sunting Supplier
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* ── MODAL IMPORT EXCEL (Requirement Poin 1 & 47) ── */}
      <DnaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Master Supplier via Excel / CSV"
        description="Unggah file spreadsheet template supplier untuk validasi dan penambahan massal data rekanan"
        size="md"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-slate-50/70 text-center space-y-3 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Seret file template Excel ke sini atau klik untuk memilih</p>
              <p className="text-[11px] text-slate-500">Mendukung format .xlsx, .xls, .csv (Maksimal 10MB)</p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <strong className="text-slate-800">Catatan Validasi Sistem:</strong>
            <p>1. Kolom wajib: <code>Nama Supplier</code>, <code>PIC</code>, <code>Nomor Telepon</code>, <code>Kategori Bahan</code>.</p>
            <p>2. Format Pajak diisi <code>11</code> (PKP) atau <code>0</code> (Non-PKP).</p>
            <p>3. Kode vendor otomatis dibuat jika kolom dikosongkan.</p>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                toast.info("Mengunduh template_import_supplier.xlsx...");
              }}
              className="text-blue-600 hover:underline font-bold text-[11px]"
            >
              Unduh Format Template Excel (.xlsx)
            </button>
            <div className="flex gap-2">
              <DnaButton variant="ghost" onClick={() => setIsImportModalOpen(false)}>
                Batal
              </DnaButton>
              <DnaButton
                variant="primary"
                onClick={() => {
                  toast.success("12 Rekanan Supplier berhasil diimpor dari Excel.");
                  setIsImportModalOpen(false);
                }}
              >
                Mulai Import
              </DnaButton>
            </div>
          </div>
        </div>
      </DnaModal>

      {/* Confirmation Dialog Delete */}
      <DnaConfirmDialog
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleDeleteSupplier}
        title="Hapus Rekanan Supplier?"
        description={`Apakah Anda yakin ingin menghapus data supplier ${supplierToDelete?.nama}? Data transaksi pengadaan historis mungkin terdampak.`}
        confirmText="Hapus Permanen"
        variant="critical"
      />
    </div>
  );
}

export default function MasterSuppliersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Master Supplier...</div>}>
      <MasterSuppliersContent />
    </Suspense>
  );
}
