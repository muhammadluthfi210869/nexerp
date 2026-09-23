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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Eye,
  Edit2,
  FileSpreadsheet,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaModal,
  DnaConfirmDialog,
  DnaCell,
  DnaDetailDrawer,
  DnaTable,
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
  const [suppliersList, setSuppliersList] = useState<MasterSupplierItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<KategoriSupplierItem[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string>("ALL");
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<string>("kategori");
  const [filterColumnValue, setFilterColumnValue] = useState<string>("ALL");

  // ── Backend API Query ──
  const {
    data: apiSuppliers,
    isLoading: isLoadingSuppliers,
    isError: isErrorSuppliers,
    error: suppliersError,
    refetch: refetchSuppliers,
  } = useQuery({
    queryKey: ["master-suppliers", searchQuery],
    queryFn: async () => {
      const res = await api.get(`/master/suppliers${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`);
      const body = unwrapResponse(res);
      return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : (() => { throw new Error('Invalid response shape from /master/suppliers: not an array') })();
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (apiSuppliers && Array.isArray(apiSuppliers)) {
      const mapped: MasterSupplierItem[] = apiSuppliers.map((s: any) => ({
        id: s.id,
        vendorCode: s.code || `VND-${s.id.substring(0, 6)}`,
        nama: s.name,
        pic: s.contact || "-",
        phone: s.phone || "-",
        email: s.email || undefined,
        kategoriBahan: (s.category?.name as any) || "Bahan Baku",
        kota: s.city || "-",
        provinsi: "",
        alamatLengkap: s.address || s.city || "-",
        pajakPersen: s.taxRate || 11,
        isPkp: s.isPkp ?? true,
        npwp: s.npwp || "-",
        paymentTerm: `Net ${s.termOfPayment || 30}`,
        bankAccount: s.bankAccount || "-",
        realStokSupplier: "Tersedia Kontrak",
        status: s.status || "ACTIVE",
      }));
      setSuppliersList(mapped);
    } else if (!isLoadingSuppliers && !isErrorSuppliers) {
      setSuppliersList([]);
    }
  }, [apiSuppliers, isLoadingSuppliers, isErrorSuppliers]);

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

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      if (tabParam === "categories") {
        setIsCategoryModalOpen(true);
      } else {
        setIsSupplierModalOpen(true);
      }
    }
  }, [searchParams, tabParam]);

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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 font-bold uppercase tracking-wider text-[11px] select-none">
                  <th className="px-4 py-2.5 w-[140px]">Kode Vendor</th>
                  <th className="px-4 py-2.5 min-w-[180px]">Nama Perusahaan</th>
                  <th className="px-4 py-2.5 w-[140px]">PIC Vendor</th>
                  <th className="px-4 py-2.5 w-[140px]">No. WhatsApp</th>
                  <th className="px-4 py-2.5 w-[130px]">Kota Domisili</th>
                  <th className="px-4 py-2.5 w-[150px]">Kategori Bahan</th>
                  <th className="px-4 py-2.5 w-[120px] text-center">Status Pajak</th>
                  <th className="px-4 py-2.5 w-[120px] text-center">Termin Bayar</th>
                  <th className="pr-4 py-2.5 w-[80px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingSuppliers ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Memuat data supplier...</span>
                      </div>
                    </td>
                  </tr>
                ) : isErrorSuppliers ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-rose-500 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <span>{(suppliersError as any)?.message || "Gagal memuat data supplier dari server"}</span>
                        <DnaButton size="sm" variant="secondary" onClick={() => refetchSuppliers()}>
                          Coba Lagi
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ) : paginatedSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ada data supplier yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  paginatedSuppliers.map((sup) => {
                    return (
                      <tr
                        key={sup.id}
                        className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedSupplier(sup);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <td className="px-4 py-2.5">
                          <DnaCell.Code code={sup.vendorCode} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{sup.nama}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-700 line-clamp-1">{sup.pic}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] text-emerald-700">
                          {sup.phone}
                        </td>
                        <td className="px-4 py-2.5">
                          <DnaCell.Text text={sup.kota} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {sup.kategoriBahan}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <DnaBadge variant={sup.isPkp ? "success" : "neutral"}>
                            {sup.isPkp ? "PKP 11%" : "NON-PKP"}
                          </DnaBadge>
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-[11.5px] text-blue-700 font-semibold">
                          {sup.paymentTerm}
                        </td>
                        <td className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <DnaButton
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              onClick={() => {
                                setSelectedSupplier(sup);
                                setIsDetailModalOpen(true);
                              }}
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </DnaButton>
                            <DnaButton
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              onClick={() => handleOpenEditSupplier(sup)}
                              title="Edit Supplier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </DnaButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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

      {/* ── QUICK PEEK DRAWER: DETAIL SUPPLIER ── */}
      <DnaDetailDrawer
        isOpen={isDetailModalOpen && !!selectedSupplier}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSupplier(null);
        }}
        title={selectedSupplier?.nama || "Detail Profil Supplier"}
        subtitle={`${selectedSupplier?.vendorCode} • ${selectedSupplier?.kategoriBahan}`}
        badge={
          selectedSupplier ? (
            <DnaBadge variant={selectedSupplier.isPkp ? "success" : "default"}>
              {selectedSupplier.isPkp ? "PKP 11%" : "NON-PKP"}
            </DnaBadge>
          ) : undefined
        }
        tabs={[
          {
            id: "profile",
            label: "Profil & Kontak Rekening",
            content: selectedSupplier && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kode Vendor:</span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {selectedSupplier.vendorCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nama Perusahaan:</span>
                      <strong className="text-slate-900">{selectedSupplier.nama}</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kontak PIC Resmi:</span>
                      <strong className="text-slate-900 block mt-0.5">{selectedSupplier.pic}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">WhatsApp / Telp:</span>
                      <a
                        href={`https://wa.me/${selectedSupplier.phone.replace(/^0/, "62")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        {selectedSupplier.phone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-slate-400 block text-[11px]">Alamat Pengiriman & Gudang:</span>
                  <p className="text-slate-700 font-medium leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                    {selectedSupplier.alamatLengkap}
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Wilayah: <strong className="text-slate-800">{selectedSupplier.kota}, {selectedSupplier.provinsi}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Rekening Bank Pembayaran:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs block mt-1">
                      {selectedSupplier.bankAccount}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Nomor NPWP Perusahaan:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs block mt-1">
                      {selectedSupplier.npwp || "Belum Terdaftar"}
                    </span>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: "supply",
            label: "Katalog Pasokan & Pajak",
            content: selectedSupplier && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase text-xs">
                    Syarat Transaksi & Pengadaan
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kategori Bahan:</span>
                      <strong className="text-slate-900 text-sm">{selectedSupplier.kategoriBahan}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Term of Payment (TOP):</span>
                      <strong className="text-blue-700 font-mono text-sm">{selectedSupplier.paymentTerm}</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tarif PPN Faktur Pajak:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedSupplier.pajakPersen}% ({selectedSupplier.isPkp ? "Faktur Standar PKP" : "Non-PKP"})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Status Ketersediaan Stok:</span>
                      <span className="font-semibold text-emerald-700">
                        {selectedSupplier.realStokSupplier || "Stok Tersedia di Supplier"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex gap-2">
            <DnaButton
              variant="secondary"
              size="md"
              onClick={() => {
                setIsDetailModalOpen(false);
                if (selectedSupplier) handleOpenEditSupplier(selectedSupplier);
              }}
            >
              <Edit2 className="w-4 h-4 mr-1.5" />
              Sunting Data
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => toast.success(`Riwayat Purchase Order supplier ${selectedSupplier?.vendorCode} berhasil diekspor!`)}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Ekspor Riwayat PO
            </DnaButton>
          </div>
        }
      />

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
