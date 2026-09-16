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
  DnaTabNav,
  DnaInput,
  DnaCurrencyInput,
  DnaNumberInput,
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

// ── Seed Data from BARANG.csv & KATEGORI-BARANG.csv ──
const INITIAL_CATEGORIES: KategoriBarangItem[] = [
  { id: "cat-1", kode: "BBK", kategori: "Bahan Baku", deskripsi: "Bahan aktif, base, extract, dan zat kimia formulasi kosmetik", totalSku: 1845, akunPersediaan: "11310 - Persediaan Bahan Baku", akunCogs: "51010 - Beban Pokok Bahan Baku" },
  { id: "cat-2", kode: "BRU", kategori: "Barang Ruahan", deskripsi: "Hasil olahan mixing curah yang siap dialirkan ke tahap filling", totalSku: 142, akunPersediaan: "11320 - Persediaan Barang Ruahan", akunCogs: "51020 - Beban Pokok Ruahan" },
  { id: "cat-3", kode: "BSJ", kategori: "Barang Setengah Jadi", deskripsi: "Intermediate premix yang masih membutuhkan tahapan homogenisasi", totalSku: 68, akunPersediaan: "11330 - Persediaan Setengah Jadi", akunCogs: "51030 - Beban Pokok Setengah Jadi" },
  { id: "cat-4", kode: "BPB", kategori: "Barang Pembantu", deskripsi: "Bahan penolong proses produksi, alkohol sanitasi, dan filter pad", totalSku: 89, akunPersediaan: "11340 - Persediaan Bahan Pembantu", akunCogs: "51040 - Biaya Overhead Pabrik" },
  { id: "cat-5", kode: "KPR", kategori: "Kemasan Primer", deskripsi: "Wadah primer kontak langsung (botol serum, pot jar, tube PE, pump)", totalSku: 312, akunPersediaan: "11350 - Persediaan Kemasan Primer", akunCogs: "51050 - Beban Pokok Kemasan Primer" },
  { id: "cat-6", kode: "KSR", kategori: "Kemasan Sekunder", deskripsi: "Packaging pelindung luar (inner box, kardus master, stiker label)", totalSku: 245, akunPersediaan: "11360 - Persediaan Kemasan Sekunder", akunCogs: "51060 - Beban Pokok Kemasan Sekunder" },
  { id: "cat-7", kode: "BJD", kategori: "Barang Jadi", deskripsi: "Finished goods ber-BPOM yang siap didistribusikan ke klien maklon", totalSku: 96, akunPersediaan: "11370 - Persediaan Barang Jadi", akunCogs: "51070 - Beban Pokok Penjualan Produk" },
];

const INITIAL_BARANG: MasterBarangItem[] = [
  {
    id: "brg-1",
    kode: "BBK00001",
    nama: "Hydro Marine Collagen",
    supplierAsal: "DKSH",
    wujudFisik: "Serbuk Putih Halus",
    realStok: 45000,
    stokMin: 10000,
    hargaBeli: 1650,
    kategori: "Bahan Baku",
    kategoriKode: "BBK",
    subKategori: "Active",
    satuan: "gr",
    agingHari: 24,
    akunPersediaan: "11310 - Persediaan Bahan Baku",
    akunCogs: "51010 - Beban Pokok Bahan Baku",
  },
  {
    id: "brg-2",
    kode: "BBK00002",
    nama: "IPM (Isopropyl Myristate)",
    supplierAsal: "Iberchem",
    wujudFisik: "Cairan Bening Kental",
    realStok: 120000,
    stokMin: 25000,
    hargaBeli: 125,
    kategori: "Bahan Baku",
    kategoriKode: "BBK",
    subKategori: "Base",
    satuan: "gr",
    agingHari: 45,
    akunPersediaan: "11310 - Persediaan Bahan Baku",
    akunCogs: "51010 - Beban Pokok Bahan Baku",
  },
  {
    id: "brg-3",
    kode: "BBK00003",
    nama: "Niacinamide PC Grade",
    supplierAsal: "Benberg",
    wujudFisik: "Kristal Putih Berkilau",
    realStok: 85000,
    stokMin: 15000,
    hargaBeli: 142.3,
    kategori: "Bahan Baku",
    kategoriKode: "BBK",
    subKategori: "Active",
    satuan: "gr",
    agingHari: 15,
    akunPersediaan: "11310 - Persediaan Bahan Baku",
    akunCogs: "51010 - Beban Pokok Bahan Baku",
  },
  {
    id: "brg-4",
    kode: "BBK00004",
    nama: "Secret Water Base Essence",
    supplierAsal: "Chemico",
    wujudFisik: "Cairan Bening Encer",
    realStok: 250000,
    stokMin: 50000,
    hargaBeli: 850,
    kategori: "Bahan Baku",
    kategoriKode: "BBK",
    subKategori: "Active",
    satuan: "gr",
    agingHari: 10,
    akunPersediaan: "11310 - Persediaan Bahan Baku",
    akunCogs: "51010 - Beban Pokok Bahan Baku",
  },
  {
    id: "brg-5",
    kode: "BBK00006",
    nama: "Centella Asiatica Extract (Cica)",
    supplierAsal: "Megasetia",
    wujudFisik: "Cairan Coklat Transparan",
    realStok: 32000,
    stokMin: 10000,
    hargaBeli: 260,
    kategori: "Bahan Baku",
    kategoriKode: "BBK",
    subKategori: "Active",
    satuan: "gr",
    agingHari: 38,
    akunPersediaan: "11310 - Persediaan Bahan Baku",
    akunCogs: "51010 - Beban Pokok Bahan Baku",
  },
  {
    id: "brg-6",
    kode: "BBK00010",
    nama: "Alpha Arbutin Pure 99%",
    supplierAsal: "DKSH",
    wujudFisik: "Serbuk Kristal Putih",
    realStok: 8500,
    stokMin: 12000,
    hargaBeli: 1500,
    kategori: "Bahan Baku",
    kategoriKode: "BBK",
    subKategori: "Active",
    satuan: "gr",
    agingHari: 62,
    akunPersediaan: "11310 - Persediaan Bahan Baku",
    akunCogs: "51010 - Beban Pokok Bahan Baku",
  },
  {
    id: "brg-7",
    kode: "BBK00015",
    nama: "Aloevera Pure Gel 100x",
    supplierAsal: "Bahtera Adijaya",
    wujudFisik: "Gel Kental Bening",
    realStok: 74000,
    stokMin: 20000,
    hargaBeli: 625.1,
    kategori: "Bahan Baku",
    kategoriKode: "BBK",
    subKategori: "Base",
    satuan: "gr",
    agingHari: 18,
    akunPersediaan: "11310 - Persediaan Bahan Baku",
    akunCogs: "51010 - Beban Pokok Bahan Baku",
  },
  {
    id: "brg-8",
    kode: "KPR00001",
    nama: "Botol Pipet Kaca Amber 30ml",
    supplierAsal: "PT Nilam Widuri",
    wujudFisik: "Botol Kaca Coklat + Karet Pipet Hitam",
    realStok: 12500,
    stokMin: 5000,
    hargaBeli: 3200,
    kategori: "Kemasan Primer",
    kategoriKode: "KPR",
    subKategori: "Packaging",
    satuan: "pcs",
    agingHari: 30,
    akunPersediaan: "11350 - Persediaan Kemasan Primer",
    akunCogs: "51050 - Beban Pokok Kemasan Primer",
  },
  {
    id: "brg-9",
    kode: "KPR00002",
    nama: "Pot Jar Acrylic Double Wall Gold 15g",
    supplierAsal: "Prambanan Kencana",
    wujudFisik: "Pot Jar Luar Gold Metalik, Inner PP Putih",
    realStok: 3400,
    stokMin: 5000,
    hargaBeli: 5800,
    kategori: "Kemasan Primer",
    kategoriKode: "KPR",
    subKategori: "Packaging",
    satuan: "pcs",
    agingHari: 42,
    akunPersediaan: "11350 - Persediaan Kemasan Primer",
    akunCogs: "51050 - Beban Pokok Kemasan Primer",
  },
  {
    id: "brg-10",
    kode: "KPR00003",
    nama: "Tube Soft Touch White Matte 100ml",
    supplierAsal: "SML Kemasan",
    wujudFisik: "Tube PE Putih Doff + Flip Cap",
    realStok: 15200,
    stokMin: 4000,
    hargaBeli: 2950,
    kategori: "Kemasan Primer",
    kategoriKode: "KPR",
    subKategori: "Packaging",
    satuan: "pcs",
    agingHari: 21,
    akunPersediaan: "11350 - Persediaan Kemasan Primer",
    akunCogs: "51050 - Beban Pokok Kemasan Primer",
  },
  {
    id: "brg-11",
    kode: "KSR00001",
    nama: "Inner Box Serum 30ml Doff Gold Emboss",
    supplierAsal: "Percetakan Surya Gemilang",
    wujudFisik: "Karton Ivory 350gsm Doff Laminasi",
    realStok: 24500,
    stokMin: 5000,
    hargaBeli: 1100,
    kategori: "Kemasan Sekunder",
    kategoriKode: "KSR",
    subKategori: "Packaging",
    satuan: "pcs",
    agingHari: 14,
    akunPersediaan: "11360 - Persediaan Kemasan Sekunder",
    akunCogs: "51060 - Beban Pokok Kemasan Sekunder",
  },
  {
    id: "brg-12",
    kode: "BRU00001",
    nama: "Bulk Ruahan Facial Wash Brightening Batch-08",
    supplierAsal: "Internal Mixing Lab",
    wujudFisik: "Liquid Gel Bening Beraroma Mawar",
    realStok: 450,
    stokMin: 100,
    hargaBeli: 65000,
    kategori: "Barang Ruahan",
    kategoriKode: "BRU",
    subKategori: "Bulk Mixing",
    satuan: "kg",
    agingHari: 3,
    akunPersediaan: "11320 - Persediaan Barang Ruahan",
    akunCogs: "51020 - Beban Pokok Ruahan",
  },
  {
    id: "brg-13",
    kode: "BJD00001",
    nama: "FYS Whitening Serum Niacinamide 30ml (Siap Kirim)",
    supplierAsal: "Internal Packaging",
    wujudFisik: "Botol Tersegel Shrink Seal Box",
    realStok: 3500,
    stokMin: 500,
    hargaBeli: 42500,
    kategori: "Barang Jadi",
    kategoriKode: "BJD",
    subKategori: "Finished Goods",
    satuan: "botol",
    agingHari: 5,
    akunPersediaan: "11370 - Persediaan Barang Jadi",
    akunCogs: "51070 - Beban Pokok Penjualan Produk",
  },
];

function MasterGoodsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();

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
  const [goodsList, setGoodsList] = useState<MasterBarangItem[]>(INITIAL_BARANG);
  const [categoriesList, setCategoriesList] = useState<KategoriBarangItem[]>(INITIAL_CATEGORIES);
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
  const { data: materialsApiResponse, isLoading: isLoadingMaterials, refetch: refetchMaterials } = useQuery({
    queryKey: ["master-materials", currentPage, pageSize, searchQuery, filterColumnValue],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(pageSize));
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        const res = await api.get(`/master/materials?${params.toString()}`);
        return unwrapResponse(res);
      } catch (err) {
        console.warn("Using local fallback materials:", err);
        return null;
      }
    },
    staleTime: 30000,
  });

  const { data: categoriesApiResponse } = useQuery({
    queryKey: ["master-categories"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/categories");
        const body = unwrapResponse(res);
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : null;
      } catch {
        return null;
      }
    },
    staleTime: 60000,
  });

  // Sync materials from backend
  useEffect(() => {
    if (materialsApiResponse && Array.isArray(materialsApiResponse.data) && materialsApiResponse.data.length > 0) {
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
    }
  }, [materialsApiResponse]);

  // Sync categories from backend
  useEffect(() => {
    if (categoriesApiResponse && Array.isArray(categoriesApiResponse) && categoriesApiResponse.length > 0) {
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
    }
  }, [categoriesApiResponse]);

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

    if (editingBarang) {
      setGoodsList((prev) =>
        prev.map((g) =>
          g.id === editingBarang.id
            ? {
                ...g,
                ...barangForm,
              }
            : g
        )
      );
      toast.success(`Barang ${barangForm.kode} berhasil diperbarui.`);
    } else {
      const newItem: MasterBarangItem = {
        id: `brg-${Date.now()}`,
        ...barangForm,
      };
      setGoodsList((prev) => [newItem, ...prev]);
      toast.success(`Barang baru ${newItem.kode} berhasil ditambahkan.`);
    }
    setIsBarangModalOpen(false);
  };

  const handleDeleteBarang = () => {
    if (!barangToDelete) return;
    setGoodsList((prev) => prev.filter((g) => g.id !== barangToDelete.id));
    toast.success(`Barang ${barangToDelete.kode} berhasil dihapus.`);
    setBarangToDelete(null);
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

    if (editingCategory) {
      setCategoriesList((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id ? { ...c, ...categoryForm } : c
        )
      );
      toast.success(`Kategori ${categoryForm.kode} berhasil diperbarui.`);
    } else {
      const newCat: KategoriBarangItem = {
        id: `cat-${Date.now()}`,
        totalSku: 0,
        ...categoryForm,
      };
      setCategoriesList((prev) => [...prev, newCat]);
      toast.success(`Kategori baru ${newCat.kode} berhasil ditambahkan.`);
    }
    setIsCategoryModalOpen(false);
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
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                  <th className="p-3.5 w-12 text-slate-400">#</th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[120px]"
                    onClick={() => handleHeaderSortToggle("kode")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>KODE</span>
                      {sortColumn === "kode" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[260px]"
                    onClick={() => handleHeaderSortToggle("nama")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>BARANG</span>
                      {sortColumn === "nama" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3.5 text-right cursor-pointer hover:bg-slate-100/60 whitespace-nowrap min-w-[130px]"
                    onClick={() => handleHeaderSortToggle("hargaBeli")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>HARGA BELI</span>
                      {sortColumn === "hargaBeli" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[130px]"
                    onClick={() => handleHeaderSortToggle("kategori")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>KATEGORI</span>
                      {sortColumn === "kategori" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 min-w-[120px]">SUB KATEGORI</th>
                  <th className="p-3.5 text-center min-w-[80px]">SATUAN</th>
                  <th className="p-3.5 text-center font-bold w-24 whitespace-nowrap">#</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedGoods.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      Tidak ada barang yang sesuai dengan kriteria filter saat ini.
                    </td>
                  </tr>
                ) : (
                  paginatedGoods.map((item, index) => {
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="p-3.5 text-slate-400 tabular-nums">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <DnaCell.Code
                            value={item.kode}
                            onClick={() => {
                              setSelectedBarang(item);
                              setIsDetailModalOpen(true);
                            }}
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.nama}
                                className="w-7 h-7 rounded object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                                <Package className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <span className="font-medium text-slate-900 line-clamp-1">{item.nama}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">
                          <DnaCell.Currency value={item.hargaBeli} />
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <DnaCell.Badge status={item.kategori} />
                        </td>
                        <td className="p-3.5 text-slate-600 text-[12px] whitespace-nowrap">
                          {item.subKategori || "-"}
                        </td>
                        <td className="p-3.5 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {item.satuan}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <DnaCell.Actions
                            onView={() => {
                              setSelectedBarang(item);
                              setIsDetailModalOpen(true);
                            }}
                            onEdit={() => handleOpenEditBarang(item)}
                            onDelete={() => setBarangToDelete(item)}
                            viewTitle="Lihat Detail SKU"
                            editTitle="Sunting Barang"
                            deleteTitle="Hapus Barang"
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
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                  <th className="p-3.5 w-12 text-slate-400">#</th>
                  <th className="p-3.5 min-w-[120px]">KODE</th>
                  <th className="p-3.5 min-w-[200px]">KATEGORI</th>
                  <th className="p-3.5 min-w-[300px]">DESKRIPSI</th>
                  <th className="p-3.5 text-center w-24">#</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoriesList.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <DnaCell.Code value={cat.kode} />
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 uppercase">{cat.kategori}</td>
                    <td className="p-3.5 text-slate-600">{cat.deskripsi}</td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <DnaCell.Actions
                        onEdit={() => handleOpenEditCategory(cat)}
                        editTitle="Sunting Kategori"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* ── MODAL DETAIL BARANG (AJAX/Pop-up Inspection) ── */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detail SKU: ${selectedBarang?.kode}`}
        description="Spesifikasi teknis, supplier, pergerakan stok, dan parameter akuntansi"
        size="lg"
      >
        {selectedBarang && (
          <div className="space-y-4 py-2 text-xs">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                    {selectedBarang.kode}
                  </span>
                  <h3 className="text-base font-black text-slate-100 uppercase mt-1">
                    {selectedBarang.nama}
                  </h3>
                  <p className="text-slate-400 text-[11px]">
                    Kategori: <strong className="text-slate-200">{selectedBarang.kategori}</strong> • Sub-Kategori:{" "}
                    <strong className="text-slate-200">{selectedBarang.subKategori}</strong>
                  </p>
                </div>
                <DnaBadge status={selectedBarang.realStok <= selectedBarang.stokMin ? "critical" : "success"}>
                  {selectedBarang.realStok <= selectedBarang.stokMin ? "STOK MENIPIS" : "STOK AMAN"}
                </DnaBadge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
                <div className="bg-slate-950/60 p-2.5 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Real Stok</div>
                  <div className="font-mono text-sm font-bold text-slate-100">
                    {selectedBarang.realStok.toLocaleString("id-ID")} {selectedBarang.satuan}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Stok Terendah</div>
                  <div className="font-mono text-sm font-bold text-rose-400">
                    {selectedBarang.stokMin.toLocaleString("id-ID")} {selectedBarang.satuan}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Harga Beli Standar</div>
                  <div className="font-mono text-sm font-bold text-emerald-400">
                    Rp {selectedBarang.hargaBeli.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Aging di Gudang</div>
                  <div className="font-mono text-sm font-bold text-amber-400">
                    {selectedBarang.agingHari} Hari
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                <div className="space-y-1">
                  <span className="text-slate-400">Supplier Rekanan Terdaftar:</span>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {selectedBarang.supplierAsal}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400">Wujud Fisik & Karakteristik:</span>
                  <div className="font-bold text-slate-200">{selectedBarang.wujudFisik}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" /> Pemetaan Buku Besar (Chart of Accounts)
              </span>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <div className="text-slate-500 text-[10px]">Akun Persediaan (Asset)</div>
                  <div className="font-mono text-slate-200 font-bold">{selectedBarang.akunPersediaan}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Akun Beban Pokok (COGS)</div>
                  <div className="font-mono text-slate-200 font-bold">{selectedBarang.akunCogs}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <DnaButton variant="ghost" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </DnaButton>
              <DnaButton
                variant="primary"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEditBarang(selectedBarang);
                }}
              >
                Sunting Barang
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

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
