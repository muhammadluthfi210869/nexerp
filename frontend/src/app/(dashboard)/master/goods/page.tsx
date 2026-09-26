"use client";

/**
 * Master Barang & Kategori Barang — Unified Enterprise Data Hub
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 28-31)
 * dan MASTER_DATA/BARANG.csv + KATEGORI-BARANG.csv.
 *
 * Fitur:
 * - 2 Sub-nav Tab: "Master Barang" & "Kategori Barang"
 * - Kolom Audit Legacy: Kode Barang, Nama Barang, Supplier Asal, Wujud Fisik, Real Stok, Harga Beli, Kategori, Sub Kategori, Satuan, Aging Barang, Aksi
 * - 5-Layer Visual DNA Golden Reference Standard
 * - 0 raw @/components/ui imports (Strict ADR-007)
 */

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Tags,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  Boxes,
  Clock,
  TrendingDown,
  Layers,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  FolderTree,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaCurrencyInput,
  DnaNumberInput,
  DnaSelect,
  DnaTextarea,
  DnaModal,
  DnaConfirmDialog,
  DnaCell,
  DnaDetailDrawer,
  DnaTable,
  useDnaToast,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

// ── Types ──
export interface MasterBarangItem {
  id: string;
  kode: string;
  nama: string;
  supplierAsal: string;
  wujudFisik: string;
  realStok: number;
  stokMin: number;
  hargaBeli: number;
  kategori: string;
  kategoriKode: string; // BBK, KPR, KSR, BRU, BSJ, BPB, BJD
  subKategori: string;
  satuan: string;
  agingHari: number;
  imageUrl?: string;
  akunPersediaan?: string;
  akunCogs?: string;
}

export interface KategoriBarangItem {
  id: string;
  kode: string;
  kategori: string;
  deskripsi: string;
  totalSku: number;
  akunPersediaan: string;
  akunCogs: string;
}

function MasterGoodsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === "categories" ? "categories" : "goods"
  );

  useEffect(() => {
    if (tabParam === "categories" || tabParam === "goods") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/master/goods?tab=${tabId}`);
  };

  // ── State Data ──
  const [goodsList, setGoodsList] = useState<MasterBarangItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<KategoriBarangItem[]>([]);
  const [serverTotal, setServerTotal] = useState<number | null>(null);

  // Filter & Search Barang
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedFilterColumn, setSelectedFilterColumn] = useState("kategori");
  const [filterColumnValue, setFilterColumnValue] = useState("ALL");

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Backend API Queries ──
  const {
    data: materialsApiResponse,
    isLoading: isLoadingMaterials,
    isError: isErrorMaterials,
    error: materialsError,
    refetch: refetchMaterials,
  } = useQuery({
    queryKey: ["master-materials", currentPage, pageSize, searchQuery, filterColumnValue],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const res = await api.get(`/master/materials?${params.toString()}`);
      return unwrapResponse(res);
    },
    staleTime: 30000,
  });

  const {
    data: categoriesApiResponse,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["master-categories"],
    queryFn: async () => {
      const res = await api.get("/master/categories");
      const body = unwrapResponse(res);
      return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    },
    staleTime: 60000,
  });

  // Sync materials from backend
  useEffect(() => {
    if (materialsApiResponse && Array.isArray(materialsApiResponse.data)) {
      const mapped: MasterBarangItem[] = materialsApiResponse.data.map((m: any) => ({
        id: m.id,
        kode: m.code || `BRG-${m.id.substring(0, 6)}`,
        nama: m.name,
        supplierAsal: m.supplierHistory?.[0]?.supplier?.name || "Lokal",
        wujudFisik: m.physicalForm || "-",
        realStok: Number(m.stockQty || 0),
        stokMin: Number(m.reorderPoint || m.minLevel || 0),
        hargaBeli: Number(m.unitPrice || 0),
        kategori: m.category?.name || (m.type === "PACKAGING" ? "Kemasan" : "Bahan Baku"),
        kategoriKode: m.category?.code || (m.type === "PACKAGING" ? "KPR" : "BBK"),
        subKategori: m.bahanType || "-",
        satuan: m.unit || "gr",
        agingHari: 1,
        imageUrl: m.imageUrl || undefined,
        akunPersediaan: m.inventoryAccount ? `${m.inventoryAccount.code} - ${m.inventoryAccount.name}` : undefined,
        akunCogs: undefined,
      }));
      setGoodsList(mapped);
      if (typeof materialsApiResponse.total === "number") {
        setServerTotal(materialsApiResponse.total);
      }
    } else if (!isLoadingMaterials && !isErrorMaterials) {
      setGoodsList([]);
    }
  }, [materialsApiResponse, isLoadingMaterials, isErrorMaterials]);

  // Sync categories from backend
  useEffect(() => {
    if (categoriesApiResponse && Array.isArray(categoriesApiResponse)) {
      const mapped: KategoriBarangItem[] = categoriesApiResponse.map((c: any) => ({
        id: c.id,
        kode: c.code,
        kategori: c.name,
        deskripsi: c.description || "-",
        totalSku: c._count?.materials || 0,
        akunPersediaan: "11310 - Persediaan",
        akunCogs: "51010 - Beban Pokok",
      }));
      setCategoriesList(mapped);
    } else if (!isLoadingCategories && !isErrorCategories) {
      setCategoriesList([]);
    }
  }, [categoriesApiResponse, isLoadingCategories, isErrorCategories]);

  // ── Mutations ──
  // The barang and category writes used to edit `goodsList`/`categoriesList` and toast "berhasil",
  // so a refresh lost them. They now hit /master/materials and /master/categories.
  const invalidateGoods = () => {
    queryClient.invalidateQueries({ queryKey: ["master-materials"] });
    queryClient.invalidateQueries({ queryKey: ["master-categories"] });
  };

  // The form carries a category CODE ("BBK") and a display label; the backend needs MaterialType.
  // Category codes are free text in this DB, so the enum is derived from the label, which is the
  // only field with a known vocabulary. `ponytail:` a category whose code is unknown and whose name
  // matches nothing falls back to RAW_MATERIAL; teach this table if new categories appear.
  const materialTypeFor = (kategori: string, kode: string): "RAW_MATERIAL" | "PACKAGING" | "LABEL" | "BOX" => {
    const s = `${kategori} ${kode}`.toLowerCase();
    if (s.includes("label")) return "LABEL";
    if (s.includes("box") || s.includes("kardus") || s.includes("dus")) return "BOX";
    if (s.includes("kemasan") || s.includes("packaging") || s.includes("kpr") || s.includes("ksr")) return "PACKAGING";
    return "RAW_MATERIAL";
  };

  const saveBarangMut = useMutation({
    mutationFn: async () => {
      const category = categoriesList.find((c) => c.kode === barangForm.kategoriKode);
      const payload: Record<string, unknown> = {
        name: barangForm.nama.trim(),
        code: barangForm.kode.trim() || undefined,
        type: materialTypeFor(barangForm.kategori, barangForm.kategoriKode),
        unit: barangForm.satuan.trim(),
        unitPrice: Number(barangForm.hargaBeli) || 0,
        reorderPoint: Number(barangForm.stokMin) || 0,
        minLevel: Number(barangForm.stokMin) || 0,
        physicalForm: barangForm.wujudFisik.trim() || undefined,
        ...(category?.id ? { categoryId: category.id } : {}),
      };
      // ponytail: `stockQty` is deliberately NOT sent. Writing it here would set on-hand stock with
      // no inventory ledger entry, desyncing this page from the stock cards. On-hand starts at 0 and
      // moves only through goods receipt / opening balance. Add when this form owns that flow.
      const res = editingBarang
        ? await api.patch(`/master/materials/${editingBarang.id}`, payload)
        : await api.post("/master/materials", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      toast.success(
        editingBarang
          ? `Barang ${barangForm.kode} berhasil diperbarui.`
          : `Barang baru ${barangForm.kode} berhasil ditambahkan.`,
      );
      setIsBarangModalOpen(false);
      setEditingBarang(null);
      invalidateGoods();
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const deleteBarangMut = useMutation({
    mutationFn: async (id: string) => unwrapResponse(await api.delete(`/master/materials/${id}`)),
    onSuccess: () => {
      toast.success(`Barang ${barangToDelete?.kode} berhasil dihapus.`);
      setBarangToDelete(null);
      invalidateGoods();
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const saveCategoryMut = useMutation({
    mutationFn: async () => {
      // CategoryType is GOODS/SUPPLIER/CUSTOMER; this page only owns goods categories.
      const payload = {
        name: categoryForm.kategori.trim(),
        code: categoryForm.kode.trim() || undefined,
        description: categoryForm.deskripsi.trim() || undefined,
        type: "GOODS" as const,
      };
      const res = editingCategory
        ? await api.patch(`/master/categories/${editingCategory.id}`, payload)
        : await api.post("/master/categories", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      toast.success(
        editingCategory
          ? `Kategori ${categoryForm.kode} berhasil diperbarui.`
          : `Kategori baru ${categoryForm.kode} berhasil ditambahkan.`,
      );
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      invalidateGoods();
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  // Unique lists
  const uniqueSuppliers = useMemo(() => Array.from(new Set(goodsList.map((g) => g.supplierAsal))), [goodsList]);

  // Modal State Barang
  const [isBarangModalOpen, setIsBarangModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<MasterBarangItem | null>(null);
  const [editingBarang, setEditingBarang] = useState<MasterBarangItem | null>(null);
  const [barangToDelete, setBarangToDelete] = useState<MasterBarangItem | null>(null);

  // Modal State Kategori
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KategoriBarangItem | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      if (tabParam === "categories") {
        setIsCategoryModalOpen(true);
      } else {
        setIsBarangModalOpen(true);
      }
    }
  }, [searchParams, tabParam]);

  // Form State Barang
  const [barangForm, setBarangForm] = useState({
    kode: "",
    nama: "",
    supplierAsal: "",
    wujudFisik: "",
    realStok: 0,
    stokMin: 0,
    hargaBeli: 0,
    kategori: "Bahan Baku",
    kategoriKode: "BBK",
    subKategori: "Active",
    satuan: "gr",
    agingHari: 1,
    akunPersediaan: "11310 - Persediaan Bahan Baku",
    akunCogs: "51010 - Beban Pokok Bahan Baku",
  });

  // Form State Kategori
  const [categoryForm, setCategoryForm] = useState({
    kode: "",
    kategori: "",
    deskripsi: "",
    akunPersediaan: "",
    akunCogs: "",
  });

  // ── Stats Calculations ──
  const totalSku = goodsList.length;
  const criticalStockCount = goodsList.filter((g) => g.realStok <= g.stokMin).length;
  const activeRawMaterials = goodsList.filter((g) => g.kategoriKode === "BBK").length;
  const totalValuation = goodsList.reduce((acc, curr) => acc + curr.realStok * curr.hargaBeli, 0);

  // ── Filtered & Sorted Goods Pipeline ──
  const filteredAndSortedGoods = useMemo(() => {
    return goodsList
      .filter((item) => {
        if (selectedCategoryFilter === "CRITICAL" && item.realStok > item.stokMin) return false;
        if (selectedCategoryFilter !== "ALL" && selectedCategoryFilter !== "CRITICAL" && item.kategoriKode !== selectedCategoryFilter) return false;
        if (filterColumnValue !== "ALL") {
          if (selectedFilterColumn === "kategori" && item.kategori !== filterColumnValue) return false;
          if (selectedFilterColumn === "supplier" && item.supplierAsal !== filterColumnValue) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.nama.toLowerCase().includes(q) ||
            item.kode.toLowerCase().includes(q) ||
            item.supplierAsal.toLowerCase().includes(q) ||
            item.subKategori.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (!sortColumn) return 0;
        const dir = sortDirection === "asc" ? 1 : -1;
        switch (sortColumn) {
          case "kode":
            return dir * a.kode.localeCompare(b.kode);
          case "nama":
            return dir * a.nama.localeCompare(b.nama);
          case "supplierAsal":
            return dir * a.supplierAsal.localeCompare(b.supplierAsal);
          case "realStok":
            return dir * (a.realStok - b.realStok);
          case "hargaBeli":
            return dir * (a.hargaBeli - b.hargaBeli);
          case "kategori":
            return dir * a.kategori.localeCompare(b.kategori);
          case "agingHari":
            return dir * (a.agingHari - b.agingHari);
          default:
            return 0;
        }
      });
  }, [
    goodsList,
    selectedCategoryFilter,
    filterColumnValue,
    selectedFilterColumn,
    searchQuery,
    sortColumn,
    sortDirection,
  ]);

  const totalEntries = serverTotal !== null ? serverTotal : filteredAndSortedGoods.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedGoods = useMemo(() => {
    if (serverTotal !== null) {
      return goodsList;
    }
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedGoods.slice(start, start + pageSize);
  }, [serverTotal, goodsList, filteredAndSortedGoods, currentPage, pageSize]);

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

  const toggleSelectAll = () => {
    if (selectedRowIds.length === paginatedGoods.length) setSelectedRowIds([]);
    else setSelectedRowIds(paginatedGoods.map((g) => g.id));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // ── Handlers Barang ──
  const handleOpenCreateBarang = () => {
    setEditingBarang(null);
    setBarangForm({
      kode: `BBK${String(goodsList.length + 1).padStart(5, "0")}`,
      nama: "",
      supplierAsal: "",
      wujudFisik: "",
      realStok: 0,
      stokMin: 1000,
      hargaBeli: 0,
      kategori: "Bahan Baku",
      kategoriKode: "BBK",
      subKategori: "Active",
      satuan: "gr",
      agingHari: 1,
      akunPersediaan: "11310 - Persediaan Bahan Baku",
      akunCogs: "51010 - Beban Pokok Bahan Baku",
    });
    setIsBarangModalOpen(true);
  };

  const handleOpenEditBarang = (item: MasterBarangItem) => {
    setEditingBarang(item);
    setBarangForm({
      kode: item.kode,
      nama: item.nama,
      supplierAsal: item.supplierAsal,
      wujudFisik: item.wujudFisik,
      realStok: item.realStok,
      stokMin: item.stokMin,
      hargaBeli: item.hargaBeli,
      kategori: item.kategori,
      kategoriKode: item.kategoriKode,
      subKategori: item.subKategori,
      satuan: item.satuan,
      agingHari: item.agingHari,
      akunPersediaan: item.akunPersediaan || "",
      akunCogs: item.akunCogs || "",
    });
    setIsBarangModalOpen(true);
  };

  const handleSaveBarang = () => {
    if (!barangForm.nama.trim() || !barangForm.kode.trim()) {
      toast.error("Nama barang dan kode wajib diisi!");
      return;
    }
    saveBarangMut.mutate();
  };

  const handleDeleteBarang = () => {
    if (!barangToDelete) return;
    deleteBarangMut.mutate(barangToDelete.id);
  };

  // ── Handlers Kategori ──
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      kode: "",
      kategori: "",
      deskripsi: "",
      akunPersediaan: "11310 - Persediaan",
      akunCogs: "51010 - Beban Pokok",
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: KategoriBarangItem) => {
    setEditingCategory(cat);
    setCategoryForm({
      kode: cat.kode,
      kategori: cat.kategori,
      deskripsi: cat.deskripsi,
      akunPersediaan: cat.akunPersediaan,
      akunCogs: cat.akunCogs,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = () => {
    if (!categoryForm.kode.trim() || !categoryForm.kategori.trim()) {
      toast.error("Kode prefix dan nama kategori wajib diisi!");
      return;
    }
    saveCategoryMut.mutate();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <DnaPageHeader
        backLink={{ href: "/master", label: "Kembali ke Master Hub" }}
        title="MASTER DATA BARANG & KATEGORI"
        tabs={[
          {
            key: "goods",
            label: "Master Barang",
            count: goodsList.length,
            icon: <Package className="w-3.5 h-3.5" />,
          },
          {
            key: "categories",
            label: "Kategori Barang",
            count: categoriesList.length,
            icon: <Tags className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* ── TAB 1: MASTER BARANG ── */}
      {activeTab === "goods" && (
        <div className="space-y-6">
          {/* ── 02. MODULAR 4 KPI METRIC CARDS ── */}
          <DnaKpiGrid
            cards={[
              {
                key: "TOTAL",
                title: "TOTAL SKU TERDAFTAR",
                value: totalSku.toLocaleString("id-ID"),
                deltaText: "Katalog aktif sistem inventory",
                isDeltaPositive: true,
                icon: <Package className="w-4 h-4" />,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                isSelected: selectedCategoryFilter === "ALL",
                onClick: () => setSelectedCategoryFilter("ALL"),
              },
              {
                key: "CRITICAL",
                title: "STOK KRITIS (ROP ALERT)",
                value: `${criticalStockCount} SKU`,
                deltaText: `${criticalStockCount} butuh PO segera`,
                isDeltaPositive: false,
                icon: <AlertTriangle className="w-4 h-4" />,
                iconBg: "bg-rose-50",
                iconColor: "text-rose-600",
                isSelected: selectedCategoryFilter === "CRITICAL",
                onClick: () => setSelectedCategoryFilter(selectedCategoryFilter === "CRITICAL" ? "ALL" : "CRITICAL"),
              },
              {
                key: "BBK",
                title: "BAHAN BAKU (ACTIVE/BASE)",
                value: `${activeRawMaterials} SKU`,
                deltaText: "Formula ready di laboratorium",
                isDeltaPositive: true,
                icon: <Layers className="w-4 h-4" />,
                iconBg: "bg-purple-50",
                iconColor: "text-purple-600",
                isSelected: selectedCategoryFilter === "BBK",
                onClick: () => setSelectedCategoryFilter(selectedCategoryFilter === "BBK" ? "ALL" : "BBK"),
              },
              {
                key: "VALUATION",
                title: "VALUASI ASET BARANG",
                value: `Rp ${(totalValuation / 1_000_000).toFixed(1)} Jt`,
                deltaText: "Estimasi total persediaan gudang",
                isDeltaPositive: true,
                icon: <Boxes className="w-4 h-4" />,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                isSelected: false,
              },
            ]}
          />

          {/* ── 03. MODULAR DATA TABLE CARD ── */}
          <DnaDataTableCard
            toolbarProps={{
              searchQuery,
              onSearchChange: setSearchQuery,
              searchPlaceholder: "Cari kode atau nama barang...",
              filterColumns: [
                {
                  key: "kategori",
                  label: "Kategori Barang",
                  type: "select",
                  options: categoriesList.map((c) => c.kategori),
                },
              ],
              selectedColumn: "kategori",
              onSelectColumn: () => {},
              filterValue: filterColumnValue,
              onFilterValueChange: setFilterColumnValue,
              actionButton: {
                label: "Tambah Barang",
                onClick: handleOpenCreateBarang,
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
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 font-bold uppercase tracking-wider text-[11px] select-none">
                  <DnaTh className="px-4 py-2.5 w-[140px]">Kode Barang</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Nama Barang</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px]">Kategori</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px]">Sub Kategori</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[100px] text-center">Satuan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px] text-center">Wujud Fisik</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px] text-right">Stok Aktual</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px] text-right">Min. Stok</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Harga Beli</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[80px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {isLoadingMaterials ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Memuat data barang...</span>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ) : isErrorMaterials ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="p-8 text-center text-rose-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span>Gagal memuat data barang: {(materialsError as any)?.message || "Terjadi kesalahan"}</span>
                        <DnaButton
                          variant="secondary"
                          size="sm"
                          onClick={() => refetchMaterials()}
                        >
                          Coba Lagi
                        </DnaButton>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ) : paginatedGoods.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="p-8 text-center text-slate-400">
                      Tidak ada barang yang sesuai dengan kriteria filter saat ini.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  paginatedGoods.map((item) => {
                    const isCritical = item.realStok <= item.stokMin;
                    return (
                      <DnaTableRow
                        key={item.id}
                        className="h-[48px] hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedBarang(item);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Code code={item.kode} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{item.nama}</span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-800 line-clamp-1">{item.kategori}</span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Text text={item.subKategori || "-"} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-center">
                          <DnaCell.Text text={item.satuan} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.wujudFisik || "-"}
                          </span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-right tabular-nums tabular-nums">
                          <span className={`text-[12px] font-semibold ${isCritical ? "text-rose-600" : "text-slate-800"}`}>
                            {item.realStok.toLocaleString("id-ID")}
                          </span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-right tabular-nums tabular-nums text-slate-500">
                          {item.stokMin.toLocaleString("id-ID")}
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-right">
                          <DnaCell.Numeric value={item.hargaBeli} prefix="Rp " />
                        </DnaTd>
                        <DnaTd className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <DnaButton
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              onClick={() => {
                                setSelectedBarang(item);
                                setIsDetailModalOpen(true);
                              }}
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </DnaButton>
                            <DnaButton
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              onClick={() => handleOpenEditBarang(item)}
                              title="Edit Barang"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </DnaButton>
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                    );
                  })
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── TAB 2: KATEGORI BARANG ── */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <DnaDataTableCard
            toolbarProps={{
              searchPlaceholder: "Kategori klasifikasi inventory...",
              actionButton: {
                label: "Tambah Kategori",
                onClick: handleOpenCreateCategory,
              },
            }}
          >
            <DnaTable className="w-full text-xs text-left table-fixed">
              <DnaTableHead>
                <DnaTableRow className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <DnaTh className="p-3 w-[20%]">Kode Prefix</DnaTh>
                  <DnaTh className="p-3 w-[25%]">Kategori Barang</DnaTh>
                  <DnaTh className="p-3 w-[35%]">Deskripsi Pemetaan</DnaTh>
                  <DnaTh className="p-3 w-[10%] text-center">Total SKU</DnaTh>
                  <DnaTh className="p-3 w-[10%] text-right pr-4">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {isLoadingCategories ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Memuat data kategori...</span>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ) : isErrorCategories ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="p-8 text-center text-rose-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span>Gagal memuat data kategori: {(categoriesError as any)?.message || "Terjadi kesalahan"}</span>
                        <DnaButton
                          variant="secondary"
                          size="sm"
                          onClick={() => refetchCategories()}
                        >
                          Coba Lagi
                        </DnaButton>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ) : categoriesList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="p-8 text-center text-slate-400">
                      Tidak ada data kategori.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  categoriesList.map((cat) => (
                    <DnaTableRow key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <DnaTd className="p-3">
                        <span className="tabular-nums font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {cat.kode}
                        </span>
                      </DnaTd>
                      <DnaTd className="p-3 font-bold text-slate-900 uppercase">{cat.kategori}</DnaTd>
                      <DnaTd className="p-3 text-slate-600 truncate">{cat.deskripsi}</DnaTd>
                      <DnaTd className="p-3 text-center tabular-nums font-semibold text-slate-700">
                        {cat.totalSku} SKU
                      </DnaTd>
                      <DnaTd className="p-3 text-right pr-4">
                        <DnaButton
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => handleOpenEditCategory(cat)}
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Sunting
                        </DnaButton>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── MODAL TAMBAH / EDIT BARANG ── */}
      <DnaModal
        isOpen={isBarangModalOpen}
        onClose={() => setIsBarangModalOpen(false)}
        title={editingBarang ? `Sunting Barang: ${editingBarang.kode}` : "Tambah Barang Baru"}
        description="Lengkapi informasi master barang sesuai spesifikasi formulasi dan COA accounting"
        size="lg"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Kode Unik Barang *"
              value={barangForm.kode}
              onChange={(e) => setBarangForm({ ...barangForm, kode: e.target.value })}
              placeholder="e.g. BBK00001"
            />
            <DnaInput
              label="Nama Lengkap Barang *"
              value={barangForm.nama}
              onChange={(e) => setBarangForm({ ...barangForm, nama: e.target.value })}
              placeholder="e.g. Hydro Marine Collagen"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DnaSelect
              label="Kategori *"
              value={barangForm.kategoriKode}
              onChange={(val) => {
                const found = categoriesList.find((c) => c.kode === val);
                setBarangForm({
                  ...barangForm,
                  kategoriKode: val,
                  kategori: found?.kategori || "Bahan Baku",
                  akunPersediaan: found?.akunPersediaan || barangForm.akunPersediaan,
                  akunCogs: found?.akunCogs || barangForm.akunCogs,
                });
              }}
              options={categoriesList.map((c) => ({ value: c.kode, label: `${c.kode} - ${c.kategori}` }))}
            />
            <DnaInput
              label="Sub Kategori (Active/Base/Packaging)"
              value={barangForm.subKategori}
              onChange={(e) => setBarangForm({ ...barangForm, subKategori: e.target.value })}
              placeholder="Active, Base, Fragrance..."
            />
            <DnaSelect
              label="Satuan Unit *"
              value={barangForm.satuan}
              onChange={(val) => setBarangForm({ ...barangForm, satuan: val })}
              options={[
                { value: "gr", label: "gr (Gram)" },
                { value: "kg", label: "kg (Kilogram)" },
                { value: "pcs", label: "pcs (Pieces)" },
                { value: "botol", label: "botol (Botol)" },
                { value: "tube", label: "tube (Tube)" },
                { value: "pot", label: "pot (Pot Jar)" },
                { value: "sak", label: "sak (Sak 25kg)" },
                { value: "drum", label: "drum (Drum 200L)" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Supplier Asal"
              value={barangForm.supplierAsal}
              onChange={(e) => setBarangForm({ ...barangForm, supplierAsal: e.target.value })}
              placeholder="e.g. DKSH, Iberchem, Kemas Indah..."
            />
            <DnaInput
              label="Wujud Fisik & Kondisi"
              value={barangForm.wujudFisik}
              onChange={(e) => setBarangForm({ ...barangForm, wujudFisik: e.target.value })}
              placeholder="e.g. Serbuk Putih, Cairan Bening..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DnaCurrencyInput
              label="Harga Beli (Rp) *"
              value={barangForm.hargaBeli}
              onChange={(val) => setBarangForm({ ...barangForm, hargaBeli: val })}
            />
            <DnaNumberInput
              label="Real Stok Gudang"
              value={barangForm.realStok}
              onChange={(val: number) => setBarangForm({ ...barangForm, realStok: val })}
            />
            <DnaNumberInput
              label="Stok Terendah (ROP Alert) *"
              value={barangForm.stokMin}
              onChange={(val: number) => setBarangForm({ ...barangForm, stokMin: val })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <DnaInput
              label="Akun Persediaan (Neraca)"
              value={barangForm.akunPersediaan}
              onChange={(e) => setBarangForm({ ...barangForm, akunPersediaan: e.target.value })}
            />
            <DnaInput
              label="Akun COGS / Beban Pokok"
              value={barangForm.akunCogs}
              onChange={(e) => setBarangForm({ ...barangForm, akunCogs: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <DnaButton variant="ghost" onClick={() => setIsBarangModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveBarang}>
              Simpan Data Barang
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* ── QUICK PEEK DRAWER: DETAIL SKU ── */}
      <DnaDetailDrawer
        isOpen={isDetailModalOpen && !!selectedBarang}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedBarang(null);
        }}
        title={selectedBarang?.nama || "Detail Master Barang"}
        subtitle={`${selectedBarang?.kode} • ${selectedBarang?.kategori}`}
        badge={
          selectedBarang ? (
            <DnaBadge variant={selectedBarang.realStok <= selectedBarang.stokMin ? "critical" : "success"}>
              {selectedBarang.realStok <= selectedBarang.stokMin ? "Stok Kritis" : "Stok Aman"}
            </DnaBadge>
          ) : undefined
        }
        tabs={[
          {
            id: "spec",
            label: "Spesifikasi & Fisik",
            content: selectedBarang && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kode Unik SKU:</span>
                      <span className="tabular-nums font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {selectedBarang.kode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kategori Barang:</span>
                      <strong className="text-slate-900">{selectedBarang.kategori} ({selectedBarang.subKategori || "-"})</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Supplier Rekanan Utama:</span>
                      <strong className="text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {selectedBarang.supplierAsal || "Lokal Pabrik"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Wujud Fisik & Karakteristik:</span>
                      <strong className="text-slate-900 block mt-0.5">{selectedBarang.wujudFisik || "Liquid/Powder"}</strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Harga Beli Pokok Standar:</span>
                    <span className="tabular-nums font-bold text-slate-900 text-sm">
                      Rp {selectedBarang.hargaBeli.toLocaleString("id-ID")} / {selectedBarang.satuan}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Estimasi Umur Simpan (Aging):</span>
                    <span className="tabular-nums font-bold text-amber-700 text-sm">
                      {selectedBarang.agingHari} Hari di Gudang
                    </span>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: "stock-acc",
            label: "Stok & Akuntansi Persediaan",
            content: selectedBarang && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 text-xs uppercase">
                    Monitoring Stok Gudang & Reorder Point
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Real Stok Saat Ini:</span>
                      <span className="tabular-nums font-black text-slate-900 text-sm">
                        {selectedBarang.realStok.toLocaleString("id-ID")} {selectedBarang.satuan}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Batas Reorder Point (ROP):</span>
                      <span className="tabular-nums font-bold text-rose-600 text-sm">
                        {selectedBarang.stokMin.toLocaleString("id-ID")} {selectedBarang.satuan}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Total Nilai Valuasi Persediaan:</span>
                    <span className="tabular-nums font-bold text-emerald-700 text-sm">
                      Rp {(selectedBarang.hargaBeli * selectedBarang.realStok).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 text-xs uppercase flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    Pemetaan Chart of Accounts (COA)
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Akun Persediaan (Asset):</span>
                      <span className="tabular-nums font-bold text-slate-800">{selectedBarang.akunPersediaan}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Akun Beban Pokok (COGS):</span>
                      <span className="tabular-nums font-bold text-slate-800">{selectedBarang.akunCogs}</span>
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
                if (selectedBarang) handleOpenEditBarang(selectedBarang);
              }}
            >
              <Edit2 className="w-4 h-4 mr-1.5" />
              Sunting Data
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => toast.success(`Label barcode SKU ${selectedBarang?.kode} siap dicetak!`)}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Cetak Barcode
            </DnaButton>
          </div>
        }
      />

      {/* ── MODAL TAMBAH / EDIT KATEGORI ── */}
      <DnaModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? `Sunting Kategori: ${editingCategory.kode}` : "Tambah Kategori Barang"}
        description="Tentukan kode prefix taksonomi dan pemetaan akun buku besar akuntansi"
      >
        <div className="space-y-4 py-2 text-xs">
          <DnaInput
            label="Kode Prefix Kategori (e.g. BBK, KPR, BJD) *"
            value={categoryForm.kode}
            onChange={(e) => setCategoryForm({ ...categoryForm, kode: e.target.value.toUpperCase() })}
            placeholder="e.g. BBK"
          />
          <DnaInput
            label="Nama Kategori *"
            value={categoryForm.kategori}
            onChange={(e) => setCategoryForm({ ...categoryForm, kategori: e.target.value })}
            placeholder="e.g. Bahan Baku Formulasi"
          />
          <DnaTextarea
            label="Deskripsi / Ruang Lingkup"
            value={categoryForm.deskripsi}
            onChange={(e) => setCategoryForm({ ...categoryForm, deskripsi: e.target.value })}
            placeholder="Penjelasan cakupan kategori..."
          />
          <DnaInput
            label="Akun Persediaan (Neraca) *"
            value={categoryForm.akunPersediaan}
            onChange={(e) => setCategoryForm({ ...categoryForm, akunPersediaan: e.target.value })}
            placeholder="11310 - Persediaan Bahan Baku"
          />
          <DnaInput
            label="Akun Beban Pokok (COGS) *"
            value={categoryForm.akunCogs}
            onChange={(e) => setCategoryForm({ ...categoryForm, akunCogs: e.target.value })}
            placeholder="51010 - Beban Pokok Bahan Baku"
          />

          <div className="flex justify-end gap-2 pt-4">
            <DnaButton variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveCategory}>
              Simpan Kategori
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* Confirmation Dialog Delete Barang */}
      <DnaConfirmDialog
        isOpen={!!barangToDelete}
        onClose={() => setBarangToDelete(null)}
        onConfirm={handleDeleteBarang}
        title="Hapus Barang Master?"
        description={`Apakah Anda yakin ingin menghapus barang ${barangToDelete?.kode} - ${barangToDelete?.nama}? Tindakan ini tidak dapat dibatalkan jika belum ada referensi transaksi.`}
        confirmText="Hapus Permanen"
        variant="critical"
      />
    </div>
  );
}

export default function MasterGoodsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Master Barang...</div>}>
      <MasterGoodsContent />
    </Suspense>
  );
}
