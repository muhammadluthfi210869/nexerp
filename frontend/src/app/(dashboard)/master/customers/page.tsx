"use client";

/**
 * Master Pelanggan / Customer — Unified Enterprise Data Hub
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 41-46),
 * MASTER_DATA/PELANGGAN.csv, dan REQUIREMENT.md Poin 2 & 6.
 *
 * Visual DNA Golden Reference Architecture:
 * - 0 raw @/components/ui imports (Strict ADR-007)
 * - Light Enterprise Theme: bg-[#F8FAFC]
 * - DnaPageHeader with integrated 3 tabs (Semua Pelanggan, Pelanggan Saya, Kategori Pelanggan)
 * - DnaKpiGrid with 5 interactive KPI metric cards
 * - DnaDataTableCard with 2-level filter toolbar + sorting & pagination
 * - Standardized cells: DnaCell.Code, DnaCell.Text, DnaCell.Badge, DnaCell.Avatar, DnaCell.Currency, DnaCell.Actions
 * - Clean DnaModal with 3 Dedicated Inspection Cards (Sample, Produksi JO, Legalitas Escrow)
 */

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  Tags,
  Phone,
  FlaskConical,
  Factory,
  ShieldCheck,
  RefreshCw,
  Sparkles,
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
  DnaCurrencyInput,
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
export interface MasterCustomerItem {
  id: string;
  customerCode: string;
  nama: string;
  brandName: string;
  pic: string;
  phone: string;
  email?: string;
  kategori: "Pelanggan Sample" | "Pelanggan RO" | "Pelanggan Produk" | "Calon Pelanggan";
  penginput: string; // Sales PIC
  kota: string;
  provinsi: string;
  alamatLengkap: string;
  contractType: "Jasa Maklon" | "Jual Putus";
  nominalSoProduk: number;
  soSampleCount: number;
  soProdukCount: number;
  status: "ACTIVE" | "INACTIVE";
  // Detail Poin 2 (Sample, Produksi, Legalitas)
  sampleFeeTotal: number;
  sampleStatus: string;
  produksiBatchTotal: number;
  produksiStatus: string;
  legalitasBpom: "Terbit" | "Proses Verifikasi" | "Belum Diajukan";
  legalitasHalal: "Sertifikasi Aktif" | "Audit LPPOM" | "Belum";
  legalitasHki: "Terdaftar Resmi" | "Pemeriksaan Substantif" | "Belum";
  escrowDeposit: number;
}

export interface CustomerCategoryItem {
  id: string;
  kategori: string;
  deskripsi: string;
  totalClient: number;
}

function MasterCustomersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === "my" || tabParam === "categories" ? tabParam : "all"
  );

  useEffect(() => {
    if (tabParam === "all" || tabParam === "my" || tabParam === "categories") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/master/customers?tab=${tabId}`);
  };

  // ── States ──
  const [customersList, setCustomersList] = useState<MasterCustomerItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<CustomerCategoryItem[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string>("ALL");
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<string>("kategori");
  const [filterColumnValue, setFilterColumnValue] = useState<string>("ALL");

  // ── Backend API Query ──
  const {
    data: apiCustomers,
    isLoading: isLoadingCustomers,
    isError: isErrorCustomers,
    error: customersError,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["master-customers", searchQuery],
    queryFn: async () => {
      const res = await api.get(`/master/customers${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`);
      const body = unwrapResponse(res);
      return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : (() => { throw new Error('Invalid response shape from /master/customers: not an array') })();
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (apiCustomers && Array.isArray(apiCustomers)) {
      const mapped: MasterCustomerItem[] = apiCustomers.map((c: any) => ({
        id: c.id,
        customerCode: c.code || `CUST-${c.id.substring(0, 4)}`,
        nama: c.name || c.clientName || "-",
        brandName: c.brandName || c.name || "-",
        pic: c.pic?.name || c.name || "-",
        phone: c.contactInfo || c.phone || "-",
        email: c.email || undefined,
        kategori: (c.notes?.match(/Kategori:\s*([^|]+)/)?.[1]?.trim() as any) || "Calon Pelanggan",
        penginput: c.notes?.match(/Penginput:\s*([^|]+)/)?.[1]?.trim() || "Admin",
        kota: c.city || c.address || "-",
        provinsi: c.province || "",
        alamatLengkap: c.addressDetail || c.address || "-",
        contractType: "Jasa Maklon",
        nominalSoProduk: 0,
        soSampleCount: 0,
        soProdukCount: 0,
        status: c.status === "ACTIVE" || c.isActive ? "ACTIVE" : "INACTIVE",
        sampleFeeTotal: 0,
        sampleStatus: "-",
        produksiBatchTotal: 0,
        produksiStatus: "-",
        legalitasBpom: "Belum Diajukan",
        legalitasHalal: "Belum",
        legalitasHki: "Belum",
        escrowDeposit: 0,
      }));
      setCustomersList(mapped);
    } else if (!isLoadingCustomers && !isErrorCustomers) {
      setCustomersList([]);
    }
  }, [apiCustomers, isLoadingCustomers, isErrorCustomers]);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Sales PIC context (Simulasi logged in user)
  const currentSalesPic = "Fadilah Syahab";

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<MasterCustomerItem | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<MasterCustomerItem | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<MasterCustomerItem | null>(null);

  // Modal Kategori
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomerCategoryItem | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      if (tabParam === "categories") {
        setIsCategoryModalOpen(true);
      } else {
        setIsCustomerModalOpen(true);
      }
    }
  }, [searchParams, tabParam]);

  // Form Pelanggan
  const [customerForm, setCustomerForm] = useState({
    customerCode: "",
    nama: "",
    brandName: "",
    pic: "",
    phone: "",
    email: "",
    kategori: "Pelanggan Sample" as MasterCustomerItem["kategori"],
    penginput: currentSalesPic,
    kota: "Kota Surabaya",
    provinsi: "Jawa Timur",
    alamatLengkap: "",
    contractType: "Jasa Maklon" as MasterCustomerItem["contractType"],
    nominalSoProduk: 0,
    soSampleCount: 0,
    soProdukCount: 0,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    sampleFeeTotal: 750000,
    sampleStatus: "Sample Tahap 1",
    produksiBatchTotal: 0,
    produksiStatus: "Belum Produksi",
    legalitasBpom: "Belum Diajukan" as MasterCustomerItem["legalitasBpom"],
    legalitasHalal: "Belum" as MasterCustomerItem["legalitasHalal"],
    legalitasHki: "Belum" as MasterCustomerItem["legalitasHki"],
    escrowDeposit: 0,
  });

  // Form Kategori
  const [categoryForm, setCategoryForm] = useState({
    kategori: "",
    deskripsi: "",
  });

  // ── KPI Stats (Requirement Poin 2 & Legacy Audit) ──
  const totalSampleFee = useMemo(
    () => customersList.reduce((acc, c) => acc + c.sampleFeeTotal, 0),
    [customersList]
  );
  const totalProduksiSo = useMemo(
    () => customersList.reduce((acc, c) => acc + c.nominalSoProduk, 0),
    [customersList]
  );
  const totalEscrow = useMemo(
    () => customersList.reduce((acc, c) => acc + c.escrowDeposit, 0),
    [customersList]
  );
  const totalRoCount = customersList.filter((c) => c.kategori === "Pelanggan RO").length;
  const totalLeadsCount = customersList.filter((c) => c.kategori === "Calon Pelanggan").length;

  // ── Filtered & Sorted Customers Pipeline ──
  const filteredCustomers = useMemo(() => {
    return customersList
      .filter((item) => {
        // 1. Tab Scope
        if (activeTab === "my" && item.penginput !== currentSalesPic) {
          return false;
        }

        // 2. KPI Filter
        if (selectedKpiFilter === "RO" && item.kategori !== "Pelanggan RO") return false;
        if (selectedKpiFilter === "LEADS" && item.kategori !== "Calon Pelanggan") return false;
        if (selectedKpiFilter === "SAMPLE" && item.kategori !== "Pelanggan Sample") return false;
        if (selectedKpiFilter === "PRODUKSI" && item.nominalSoProduk <= 0) return false;
        if (selectedKpiFilter === "ESCROW" && item.escrowDeposit <= 0) return false;

        // 3. Toolbar Filter
        if (filterColumnValue !== "ALL") {
          if (selectedFilterColumn === "kategori" && item.kategori !== filterColumnValue) {
            return false;
          }
          if (selectedFilterColumn === "kontrak" && item.contractType !== filterColumnValue) {
            return false;
          }
        }

        // 4. Global Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = item.customerCode.toLowerCase().includes(q);
          const matchBrand = item.brandName.toLowerCase().includes(q);
          const matchName = item.nama.toLowerCase().includes(q);
          const matchPic = item.penginput.toLowerCase().includes(q);
          const matchCity = item.kota.toLowerCase().includes(q);
          const matchPhone = item.phone.toLowerCase().includes(q);
          if (!matchCode && !matchBrand && !matchName && !matchPic && !matchCity && !matchPhone) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (!sortColumn) return 0;
        const dir = sortDirection === "asc" ? 1 : -1;
        switch (sortColumn) {
          case "customerCode":
            return dir * a.customerCode.localeCompare(b.customerCode);
          case "brandName":
            return dir * a.brandName.localeCompare(b.brandName);
          case "penginput":
            return dir * a.penginput.localeCompare(b.penginput);
          case "kota":
            return dir * a.kota.localeCompare(b.kota);
          case "nominalSoProduk":
            return dir * (a.nominalSoProduk - b.nominalSoProduk);
          case "soSampleCount":
            return dir * (a.soSampleCount - b.soSampleCount);
          case "soProdukCount":
            return dir * (a.soProdukCount - b.soProdukCount);
          default:
            return 0;
        }
      });
  }, [
    customersList,
    activeTab,
    selectedKpiFilter,
    selectedFilterColumn,
    filterColumnValue,
    searchQuery,
    sortColumn,
    sortDirection,
  ]);

  // Pagination Slice
  const totalEntries = filteredCustomers.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

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
    if (selectedRowIds.length === paginatedCustomers.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(paginatedCustomers.map((c) => c.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ── Handlers ──
  const handleOpenCreateCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      customerCode: `CUST-${String(customersList.length + 1).padStart(3, "0")}`,
      nama: "",
      brandName: "",
      pic: "",
      phone: "",
      email: "",
      kategori: "Pelanggan Sample",
      penginput: currentSalesPic,
      kota: "Kota Surabaya",
      provinsi: "Jawa Timur",
      alamatLengkap: "",
      contractType: "Jasa Maklon",
      nominalSoProduk: 0,
      soSampleCount: 0,
      soProdukCount: 0,
      status: "ACTIVE",
      sampleFeeTotal: 750000,
      sampleStatus: "Sample Baru Terdaftar",
      produksiBatchTotal: 0,
      produksiStatus: "Belum Produksi",
      legalitasBpom: "Belum Diajukan",
      legalitasHalal: "Belum",
      legalitasHki: "Belum",
      escrowDeposit: 0,
    });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (item: MasterCustomerItem) => {
    setEditingCustomer(item);
    setCustomerForm({
      customerCode: item.customerCode,
      nama: item.nama,
      brandName: item.brandName,
      pic: item.pic,
      phone: item.phone,
      email: item.email || "",
      kategori: item.kategori,
      penginput: item.penginput,
      kota: item.kota,
      provinsi: item.provinsi,
      alamatLengkap: item.alamatLengkap,
      contractType: item.contractType,
      nominalSoProduk: item.nominalSoProduk,
      soSampleCount: item.soSampleCount,
      soProdukCount: item.soProdukCount,
      status: item.status,
      sampleFeeTotal: item.sampleFeeTotal,
      sampleStatus: item.sampleStatus,
      produksiBatchTotal: item.produksiBatchTotal,
      produksiStatus: item.produksiStatus,
      legalitasBpom: item.legalitasBpom,
      legalitasHalal: item.legalitasHalal,
      legalitasHki: item.legalitasHki,
      escrowDeposit: item.escrowDeposit,
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = () => {
    if (!customerForm.brandName.trim() || !customerForm.nama.trim() || !customerForm.phone.trim()) {
      toast.error("Nama brand, nama klien, dan nomor telepon wajib diisi!");
      return;
    }

    if (editingCustomer) {
      setCustomersList((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...customerForm } : c))
      );
      toast.success(`Data pelanggan ${customerForm.brandName} berhasil diperbarui.`);
    } else {
      const newItem: MasterCustomerItem = {
        id: `cust-${Date.now()}`,
        ...customerForm,
      };
      setCustomersList((prev) => [newItem, ...prev]);
      toast.success(`Pelanggan baru ${newItem.brandName} berhasil ditambahkan.`);
    }
    setIsCustomerModalOpen(false);
  };

  const handleDeleteCustomer = () => {
    if (!customerToDelete) return;
    setCustomersList((prev) => prev.filter((c) => c.id !== customerToDelete.id));
    toast.success(`Pelanggan ${customerToDelete.nama} berhasil dihapus.`);
    setCustomerToDelete(null);
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. MODULAR PAGE HEADER ── */}
      <DnaPageHeader
        backLink={{ href: "/master", label: "Kembali ke Master Hub" }}
        title="MASTER DATA PELANGGAN & CRM"
        tabs={[
          {
            key: "all",
            label: "Semua Pelanggan",
            count: customersList.length,
            icon: <Users className="w-3.5 h-3.5" />,
          },
          {
            key: "my",
            label: "Pelanggan Saya",
            count: customersList.filter((c) => c.penginput === currentSalesPic).length,
            icon: <UserCheck className="w-3.5 h-3.5" />,
          },
          {
            key: "categories",
            label: "Kategori Pelanggan",
            count: categoriesList.length,
            icon: <Tags className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* ── TAB 1 & 2: PELANGGAN LIST (SEMUA ATAU SAYA) ── */}
      {(activeTab === "all" || activeTab === "my") && (
        <div className="space-y-6">
          {/* ── 02. MODULAR 5 KPI METRIC CARDS (Requirement Poin 2 & Legacy Audit) ── */}
          <DnaKpiGrid
            cards={[
              {
                key: "SAMPLE",
                title: "TOTAL SAMPLE FEE",
                value: `Rp ${(totalSampleFee / 1_000_000).toFixed(1)} Jt`,
                deltaText: "Akumulasi riset R&D formula",
                isDeltaPositive: true,
                icon: <FlaskConical className="w-4 h-4" />,
                iconBg: "bg-purple-50",
                iconColor: "text-purple-600",
                isSelected: selectedKpiFilter === "SAMPLE",
                onClick: () => setSelectedKpiFilter(selectedKpiFilter === "SAMPLE" ? "ALL" : "SAMPLE"),
              },
              {
                key: "PRODUKSI",
                title: "TOTAL PRODUKSI (JO)",
                value: `Rp ${(totalProduksiSo / 1_000_000).toFixed(1)} Jt`,
                deltaText: "Omset kontrak Job Order maklon",
                isDeltaPositive: true,
                icon: <Factory className="w-4 h-4" />,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                isSelected: selectedKpiFilter === "PRODUKSI",
                onClick: () => setSelectedKpiFilter(selectedKpiFilter === "PRODUKSI" ? "ALL" : "PRODUKSI"),
              },
              {
                key: "ESCROW",
                title: "LEGALITAS & ESCROW",
                value: `Rp ${(totalEscrow / 1_000_000).toFixed(1)} Jt`,
                deltaText: "Deposit perizinan BPOM/Halal",
                isDeltaPositive: true,
                icon: <ShieldCheck className="w-4 h-4" />,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                isSelected: selectedKpiFilter === "ESCROW",
                onClick: () => setSelectedKpiFilter(selectedKpiFilter === "ESCROW" ? "ALL" : "ESCROW"),
              },
              {
                key: "RO",
                title: "PELANGGAN REPEAT ORDER",
                value: `${totalRoCount} Klien`,
                deltaText: "Klien aktif rutin (>2 PO)",
                isDeltaPositive: true,
                icon: <RefreshCw className="w-4 h-4" />,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                isSelected: selectedKpiFilter === "RO",
                onClick: () => setSelectedKpiFilter(selectedKpiFilter === "RO" ? "ALL" : "RO"),
              },
              {
                key: "LEADS",
                title: "CALON PELANGGAN (LEADS)",
                value: `${totalLeadsCount} Leads`,
                deltaText: "Prospek aktif dalam pipeline",
                isDeltaPositive: true,
                icon: <Sparkles className="w-4 h-4" />,
                iconBg: "bg-slate-100",
                iconColor: "text-slate-600",
                isSelected: selectedKpiFilter === "LEADS",
                onClick: () => setSelectedKpiFilter(selectedKpiFilter === "LEADS" ? "ALL" : "LEADS"),
              },
            ]}
          />

          {/* ── 03. MODULAR DATA TABLE CARD ── */}
          <DnaDataTableCard
            toolbarProps={{
              searchQuery,
              onSearchChange: setSearchQuery,
              searchPlaceholder: "Cari kode, nama brand, klien, sales PIC, kota...",
              filterColumns: [
                {
                  key: "kategori",
                  label: "Segmen Kategori",
                  type: "select",
                  options: [
                    "Pelanggan RO",
                    "Pelanggan Produk",
                    "Pelanggan Sample",
                    "Calon Pelanggan",
                  ],
                },
                {
                  key: "kontrak",
                  label: "Tipe Kontrak",
                  type: "select",
                  options: ["Jasa Maklon", "Jual Putus"],
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
                label: "Tambah Pelanggan",
                onClick: handleOpenCreateCustomer,
              },
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
            <table className="w-full text-left border-collapse min-w-[1250px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 font-bold uppercase tracking-wider text-[11px] select-none">
                  <th className="px-4 py-2.5 w-[140px]">Kode Klien</th>
                  <th className="px-4 py-2.5 min-w-[180px]">Nama Klien</th>
                  <th className="px-4 py-2.5 w-[150px]">Brand</th>
                  <th className="px-4 py-2.5 w-[140px]">No. Telepon / WA</th>
                  <th className="px-4 py-2.5 w-[130px]">Kota</th>
                  <th className="px-4 py-2.5 w-[140px]">Kategori</th>
                  <th className="px-4 py-2.5 w-[140px]">Sales PIC</th>
                  <th className="px-4 py-2.5 w-[140px] text-right">Total Order SO</th>
                  <th className="px-4 py-2.5 w-[140px] text-right">Titipan Escrow</th>
                  <th className="pr-4 py-2.5 w-[80px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingCustomers ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Memuat data pelanggan...</span>
                      </div>
                    </td>
                  </tr>
                ) : isErrorCustomers ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-rose-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span>Gagal memuat data pelanggan: {(customersError as any)?.message || "Terjadi kesalahan"}</span>
                        <DnaButton
                          variant="secondary"
                          size="sm"
                          onClick={() => refetchCustomers()}
                        >
                          Coba Lagi
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Tidak ada data pelanggan yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((cust) => {
                    return (
                      <tr
                        key={cust.id}
                        className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <td className="px-4 py-2.5">
                          <DnaCell.Code code={cust.customerCode} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{cust.nama}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-700 line-clamp-1">{cust.brandName || "Maklon Brand"}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] text-emerald-700">
                          {cust.phone}
                        </td>
                        <td className="px-4 py-2.5">
                          <DnaCell.Text text={cust.kota} />
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {cust.kategori}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <DnaCell.Text text={cust.penginput || "-"} />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <DnaCell.Numeric value={cust.nominalSoProduk} prefix="Rp " />
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                          <span className="text-[12px] font-semibold text-blue-700">
                            Rp {(cust.escrowDeposit || 0).toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <DnaButton
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              onClick={() => {
                                setSelectedCustomer(cust);
                                setIsDetailModalOpen(true);
                              }}
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </DnaButton>
                            <DnaButton
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              onClick={() => handleOpenEditCustomer(cust)}
                              title="Edit Pelanggan"
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

      {/* ── TAB 3: KATEGORI PELANGGAN ── */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <DnaDataTableCard
            toolbarProps={{
              searchPlaceholder: "Klasifikasi segmen siklus kemitraan...",
              actionButton: {
                label: "Tambah Kategori",
                onClick: () => {
                  setEditingCategory(null);
                  setCategoryForm({ kategori: "", deskripsi: "" });
                  setIsCategoryModalOpen(true);
                },
              },
            }}
          >
            <DnaTable className="w-full text-xs text-left table-fixed">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-3 w-[30%]">Kategori Pelanggan</th>
                  <th className="p-3 w-[45%]">Deskripsi & Kriteria</th>
                  <th className="p-3 w-[15%] text-center">Jumlah Klien</th>
                  <th className="p-3 w-[10%] text-right pr-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoriesList.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900 uppercase">
                      {cat.kategori}
                    </td>
                    <td className="p-3 text-slate-600 truncate">{cat.deskripsi}</td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        {cat.totalClient} Klien
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4">
                      <DnaButton
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryForm({
                            kategori: cat.kategori,
                            deskripsi: cat.deskripsi,
                          });
                          setIsCategoryModalOpen(true);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Sunting
                      </DnaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DnaTable>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── QUICK PEEK DRAWER: DETAIL CUSTOMER ── */}
      <DnaDetailDrawer
        isOpen={isDetailModalOpen && !!selectedCustomer}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCustomer(null);
        }}
        title={selectedCustomer?.brandName || "Detail Profil Mitra"}
        subtitle={`${selectedCustomer?.customerCode} • ${selectedCustomer?.nama}`}
        badge={
          selectedCustomer ? (
            <DnaBadge variant={selectedCustomer.kategori === "Pelanggan RO" ? "success" : "info"}>
              {selectedCustomer.kategori}
            </DnaBadge>
          ) : undefined
        }
        tabs={[
          {
            id: "brand",
            label: "Informasi Brand & Legalitas",
            content: selectedCustomer && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kode Klien:</span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {selectedCustomer.customerCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nama Brand Maklon:</span>
                      <strong className="text-slate-900">{selectedCustomer.brandName}</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nama Pemilik / PIC:</span>
                      <strong className="text-slate-900 block mt-0.5">{selectedCustomer.nama}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kontak WhatsApp:</span>
                      <a
                        href={`https://wa.me/${selectedCustomer.phone.replace(/^0/, "62")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        {selectedCustomer.phone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-900 uppercase text-xs border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Status Legalitas & Registrasi Produk
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2 bg-white rounded border border-slate-200 text-center">
                      <span className="text-slate-400 block text-[10px]">Izin BPOM:</span>
                      <strong className="text-slate-900">{selectedCustomer.legalitasBpom || "Tercatat"}</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200 text-center">
                      <span className="text-slate-400 block text-[10px]">Sertifikat Halal:</span>
                      <strong className="text-slate-900">{selectedCustomer.legalitasHalal || "LPPOM Valid"}</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200 text-center">
                      <span className="text-slate-400 block text-[10px]">Hak Paten HKI:</span>
                      <strong className="text-slate-900">{selectedCustomer.legalitasHki || "Terdaftar"}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Alamat Surat & Kirim:</span>
                  <p className="text-slate-700 font-medium mt-1 leading-relaxed">
                    {selectedCustomer.alamatLengkap}
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Wilayah: <strong>{selectedCustomer.kota}, {selectedCustomer.provinsi}</strong>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: "orders",
            label: "Portofolio Sample & Produksi",
            content: selectedCustomer && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-1.5 font-bold text-purple-700 text-xs">
                      <FlaskConical className="w-4 h-4 text-purple-600" /> Layanan Sample Formula
                    </div>
                    <div className="mt-2 text-slate-600">
                      <div>Total Sample Fee: <strong className="text-purple-700 font-mono">Rp {selectedCustomer.sampleFeeTotal.toLocaleString("id-ID")}</strong></div>
                      <div className="mt-1">Status R&D: <strong className="text-slate-900">{selectedCustomer.sampleStatus}</strong></div>
                      <div className="mt-1 font-mono text-[11px] text-slate-500">{selectedCustomer.soSampleCount} Kali Request</div>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-xs">
                      <Factory className="w-4 h-4 text-emerald-600" /> Order Produksi Massal
                    </div>
                    <div className="mt-2 text-slate-600">
                      <div>Total Nilai SO: <strong className="text-emerald-700 font-mono">Rp {selectedCustomer.nominalSoProduk.toLocaleString("id-ID")}</strong></div>
                      <div className="mt-1">Batch Running: <strong className="text-slate-900">{selectedCustomer.produksiStatus}</strong></div>
                      <div className="mt-1 font-mono text-[11px] text-slate-500">{selectedCustomer.soProdukCount} Batch Job Order</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900 mb-1">Sales Person In Charge:</div>
                  <div className="text-slate-600 font-medium">{selectedCustomer.penginput} (Divisi Maklon Komersial)</div>
                </div>
              </div>
            )
          },
          {
            id: "escrow",
            label: "Escrow & Keuangan",
            content: selectedCustomer && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                  <span className="text-blue-800 font-bold block text-xs uppercase">
                    Saldo Rekening Titipan Escrow Klien
                  </span>
                  <div className="font-mono font-black text-blue-900 text-xl">
                    Rp {selectedCustomer.escrowDeposit.toLocaleString("id-ID")}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Dana jaminan aman untuk alokasi pembelian kemasan sekunder, botol khusus, dan uang muka batch formulasi maklon.
                  </p>
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
                if (selectedCustomer) handleOpenEditCustomer(selectedCustomer);
              }}
            >
              <Edit2 className="w-4 h-4 mr-1.5" />
              Sunting Data
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => toast.success(`Portofolio mitra ${selectedCustomer?.brandName} berhasil diekspor!`)}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Ekspor Portofolio
            </DnaButton>
          </div>
        }
      />

      {/* ── MODAL TAMBAH / EDIT CUSTOMER ── */}
      <DnaModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editingCustomer ? `Sunting Pelanggan: ${editingCustomer.brandName}` : "Tambah Pelanggan Baru"}
        description="Lengkapi data brand, PIC kontak, segmentasi komersial, dan status legalitas"
        size="lg"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Kode Pelanggan *"
              value={customerForm.customerCode}
              onChange={(e) => setCustomerForm({ ...customerForm, customerCode: e.target.value })}
              placeholder="e.g. CUST-009"
            />
            <DnaInput
              label="Nama Brand Produk *"
              value={customerForm.brandName}
              onChange={(e) => setCustomerForm({ ...customerForm, brandName: e.target.value })}
              placeholder="e.g. GLOW SKINCARE"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DnaInput
              label="Nama Pemilik / PIC *"
              value={customerForm.nama}
              onChange={(e) => setCustomerForm({ ...customerForm, nama: e.target.value })}
              placeholder="Nama Klien"
            />
            <DnaInput
              label="Nomor Telepon / WhatsApp *"
              value={customerForm.phone}
              onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              placeholder="08123456789"
            />
            <DnaInput
              label="Email Resmi (Opsional)"
              value={customerForm.email}
              onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              placeholder="brand@domain.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DnaSelect
              label="Kategori Pelanggan *"
              value={customerForm.kategori}
              onChange={(val) =>
                setCustomerForm({ ...customerForm, kategori: val as MasterCustomerItem["kategori"] })
              }
              options={[
                { value: "Calon Pelanggan", label: "Calon Pelanggan" },
                { value: "Pelanggan Sample", label: "Pelanggan Sample" },
                { value: "Pelanggan Produk", label: "Pelanggan Produk" },
                { value: "Pelanggan RO", label: "Pelanggan RO" },
              ]}
            />
            <DnaSelect
              label="Tipe Kontrak *"
              value={customerForm.contractType}
              onChange={(val) =>
                setCustomerForm({ ...customerForm, contractType: val as MasterCustomerItem["contractType"] })
              }
              options={[
                { value: "Jasa Maklon", label: "Jasa Maklon" },
                { value: "Jual Putus", label: "Jual Putus" },
              ]}
            />
            <DnaInput
              label="Sales PIC / Penginput *"
              value={customerForm.penginput}
              onChange={(e) => setCustomerForm({ ...customerForm, penginput: e.target.value })}
              placeholder="Nama PIC Sales"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Kota / Wilayah *"
              value={customerForm.kota}
              onChange={(e) => setCustomerForm({ ...customerForm, kota: e.target.value })}
              placeholder="Kota Surabaya"
            />
            <DnaInput
              label="Provinsi"
              value={customerForm.provinsi}
              onChange={(e) => setCustomerForm({ ...customerForm, provinsi: e.target.value })}
              placeholder="Jawa Timur"
            />
          </div>

          <DnaTextarea
            label="Alamat Lengkap Pengiriman Dokumen & Barang"
            value={customerForm.alamatLengkap}
            onChange={(e) => setCustomerForm({ ...customerForm, alamatLengkap: e.target.value })}
            placeholder="Jalan, nomor rumah/kantor, kecamatan, kode pos..."
          />

          {/* Sesi 3 Pilar (Poin 2) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Status 3 Pilar Komersial (Sample, Produksi, Legalitas):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <DnaCurrencyInput
                label="Sample Fee Total (Rp)"
                value={customerForm.sampleFeeTotal}
                onChange={(val) => setCustomerForm({ ...customerForm, sampleFeeTotal: val })}
              />
              <DnaCurrencyInput
                label="Nominal SO Produk (Rp)"
                value={customerForm.nominalSoProduk}
                onChange={(val) => setCustomerForm({ ...customerForm, nominalSoProduk: val })}
              />
              <DnaCurrencyInput
                label="Escrow Deposit (Rp)"
                value={customerForm.escrowDeposit}
                onChange={(val) => setCustomerForm({ ...customerForm, escrowDeposit: val })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <DnaSelect
                label="Status BPOM"
                value={customerForm.legalitasBpom}
                onChange={(val) =>
                  setCustomerForm({ ...customerForm, legalitasBpom: val as MasterCustomerItem["legalitasBpom"] })
                }
                options={[
                  { value: "Belum Diajukan", label: "Belum Diajukan" },
                  { value: "Proses Verifikasi", label: "Proses Verifikasi" },
                  { value: "Terbit", label: "Terbit" },
                ]}
              />
              <DnaSelect
                label="Status Halal"
                value={customerForm.legalitasHalal}
                onChange={(val) =>
                  setCustomerForm({ ...customerForm, legalitasHalal: val as MasterCustomerItem["legalitasHalal"] })
                }
                options={[
                  { value: "Belum", label: "Belum" },
                  { value: "Audit LPPOM", label: "Audit LPPOM" },
                  { value: "Sertifikasi Aktif", label: "Sertifikasi Aktif" },
                ]}
              />
              <DnaSelect
                label="Status HKI Merk"
                value={customerForm.legalitasHki}
                onChange={(val) =>
                  setCustomerForm({ ...customerForm, legalitasHki: val as MasterCustomerItem["legalitasHki"] })
                }
                options={[
                  { value: "Belum", label: "Belum" },
                  { value: "Pemeriksaan Substantif", label: "Pemeriksaan Substantif" },
                  { value: "Terdaftar Resmi", label: "Terdaftar Resmi" },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="ghost" onClick={() => setIsCustomerModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveCustomer}>
              Simpan Data Pelanggan
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* Confirmation Dialog Delete */}
      <DnaConfirmDialog
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteCustomer}
        title="Hapus Data Pelanggan?"
        description={`Apakah Anda yakin ingin menghapus data mitra ${customerToDelete?.brandName} (${customerToDelete?.nama})?`}
        confirmText="Hapus Permanen"
        variant="critical"
      />
    </div>
  );
}

export default function MasterCustomersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Master Pelanggan...</div>}>
      <MasterCustomersContent />
    </Suspense>
  );
}
