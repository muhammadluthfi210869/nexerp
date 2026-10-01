"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  MasterBarangItem,
  KategoriBarangItem,
  PurchaseHistoryItem,
  AccountOptionItem,
  BarangFormData,
  CategoryFormData,
} from "../_types/goods.types";

export function useGoodsOperations() {
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

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // â”€â”€ Backend API Queries â”€â”€
  // 1. Materials List
  const {
    data: materialsApiResponse,
    isLoading: isLoadingMaterials,
    isError: isErrorMaterials,
    error: materialsError,
    refetch: refetchMaterials,
  } = useQuery({
    queryKey: ["master-materials", currentPage, pageSize, searchQuery, selectedCategoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCategoryFilter !== "ALL") params.set("categoryId", selectedCategoryFilter);

      const res = await api.get(`/master/materials?${params.toString()}`);
      return res.data;
    },
    staleTime: 10000,
  });

  // 2. Categories List
  const {
    data: categoriesApiResponse,
    isLoading: isLoadingCategories,
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

  // 3. Accounts List for 8 CoA Mappings
  const { data: accountsApiResponse } = useQuery({
    queryKey: ["finance-accounts"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/accounts");
        const body = unwrapResponse(res);
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
      } catch (e) {
        return [];
      }
    },
    staleTime: 60000,
  });

  const accountsList: AccountOptionItem[] = useMemo(() => {
    if (!accountsApiResponse || !Array.isArray(accountsApiResponse)) return [];
    return accountsApiResponse.map((acc: any) => ({
      id: acc.id,
      code: acc.code,
      name: acc.name,
      label: `${acc.code} - ${acc.name}`,
    }));
  }, [accountsApiResponse]);

  // Transformed Data
  const goodsList: MasterBarangItem[] = useMemo(() => {
    const rawData = Array.isArray(materialsApiResponse)
      ? materialsApiResponse
      : Array.isArray(materialsApiResponse?.data)
      ? materialsApiResponse.data
      : null;

    if (!rawData) return [];

    return rawData.map((m: any) => ({
      id: m.id,
      kode: m.code || m.kode || `BRG-${m.id.substring(0, 6)}`,
      nama: m.name || m.nama || "-",
      supplierAsal: m.lastSupplierName || "â€”",
      wujudFisik: m.physicalForm || "â€”",
      realStok: Number(m.stockQty || m.realStok || 0),
      stokMin: Number(m.minLevel || m.stokMin || 0),
      hargaBeli: Number(m.unitPrice || m.hargaBeli || 0),
      kategori: m.category?.name || m.kategori || "Umum",
      categoryId: m.categoryId || m.category?.id,
      subKategori: m.subCategory || "â€”",
      satuan: m.unit || m.satuan || "pcs",
      description: m.description,
      imageUrl: m.imageUrl,
      lastPoDate: m.lastPoDate ? String(m.lastPoDate).split("T")[0] : null,
      lastPoNumber: m.lastPoNumber || "â€”",
      lastSupplierName: m.lastSupplierName || "â€”",
      lastPoQty: Number(m.lastPoQty || 0),
      lastPoPrice: Number(m.lastPoPrice || 0),
      coaMapping: m.coaMapping,
      inventoryAccount: m.inventoryAccount,
      salesAccount: m.salesAccount,
    }));
  }, [materialsApiResponse]);

  const categoriesList: KategoriBarangItem[] = useMemo(() => {
    if (!categoriesApiResponse || !Array.isArray(categoriesApiResponse)) return [];
    return categoriesApiResponse.map((c: any) => ({
      id: c.id,
      code: c.code || "",
      name: c.name || "",
      description: c.description || "-",
      type: c.type || "GOODS",
      _count: c._count,
    }));
  }, [categoriesApiResponse]);

  const totalEntries = typeof materialsApiResponse?.total === "number"
    ? materialsApiResponse.total
    : goodsList.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;

  // â”€â”€ Modals & Dialogs States â”€â”€
  const [isBarangModalOpen, setIsBarangModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<MasterBarangItem | null>(null);
  const [editingBarang, setEditingBarang] = useState<MasterBarangItem | null>(null);
  const [barangToDelete, setBarangToDelete] = useState<MasterBarangItem | null>(null);

  // Kategori Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KategoriBarangItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<KategoriBarangItem | null>(null);

  // Form State Barang (With 8 CoA Accounts)
  const [barangForm, setBarangForm] = useState<BarangFormData>({
    kode: "",
    nama: "",
    categoryId: "",
    kategori: "Bahan Baku",
    subKategori: "",
    satuan: "pcs",
    hargaBeli: 0,
    stokMin: 10,
    description: "",
    imageUrl: "",
    coa_1: "",
    coa_2: "",
    coa_3: "",
    coa_4: "",
    coa_5: "",
    coa_6: "",
    coa_7: "",
    coa_8: "",
  });

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    code: "",
    name: "",
    description: "",
  });

  // Query Purchase History for Selected Item (#modal-purchase-history)
  const { data: purchaseHistoryData, isLoading: isLoadingPurchaseHistory } = useQuery({
    queryKey: ["purchase-history", selectedBarang?.id],
    queryFn: async () => {
      if (!selectedBarang?.id) return [];
      const res = await api.get(`/master/materials/${selectedBarang.id}/purchase-history`);
      const body = unwrapResponse(res);
      return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    },
    enabled: isPurchaseHistoryOpen && !!selectedBarang?.id,
  });

  // â”€â”€ Mutations â”€â”€
  const invalidateGoods = () => {
    queryClient.invalidateQueries({ queryKey: ["master-materials"] });
    queryClient.invalidateQueries({ queryKey: ["master-categories"] });
  };

  const saveBarangMut = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: barangForm.nama.trim(),
        code: barangForm.kode.trim() || undefined,
        unit: barangForm.satuan.trim(),
        unitPrice: Number(barangForm.hargaBeli) || 0,
        price: Number(barangForm.hargaBeli) || 0,
        reorderPoint: Number(barangForm.stokMin) || 0,
        minLevel: Number(barangForm.stokMin) || 0,
        lowest_stock: Number(barangForm.stokMin) || 0,
        categoryId: barangForm.categoryId || undefined,
        subCategory: barangForm.subKategori.trim() || undefined,
        description: barangForm.description?.trim() || undefined,
        imageUrl: barangForm.imageUrl?.trim() || undefined,
        coa_1: barangForm.coa_1 || undefined,
        coa_2: barangForm.coa_2 || undefined,
        coa_3: barangForm.coa_3 || undefined,
        coa_4: barangForm.coa_4 || undefined,
        coa_5: barangForm.coa_5 || undefined,
        coa_6: barangForm.coa_6 || undefined,
        coa_7: barangForm.coa_7 || undefined,
        coa_8: barangForm.coa_8 || undefined,
        coaMapping: {
          coa_1: barangForm.coa_1 || null,
          coa_2: barangForm.coa_2 || null,
          coa_3: barangForm.coa_3 || null,
          coa_4: barangForm.coa_4 || null,
          coa_5: barangForm.coa_5 || null,
          coa_6: barangForm.coa_6 || null,
          coa_7: barangForm.coa_7 || null,
          coa_8: barangForm.coa_8 || null,
        },
      };

      const res = editingBarang
        ? await api.patch(`/master/materials/${editingBarang.id}`, payload)
        : await api.post("/master/materials", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      toast.success(
        editingBarang
          ? `Barang ${barangForm.nama} berhasil diperbarui.`
          : `Barang baru ${barangForm.nama} berhasil ditambahkan.`
      );
      setIsBarangModalOpen(false);
      setEditingBarang(null);
      invalidateGoods();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteBarangMut = useMutation({
    mutationFn: async (id: string) => unwrapResponse(await api.delete(`/master/materials/${id}`)),
    onSuccess: () => {
      toast.success(`Barang ${barangToDelete?.nama} berhasil dihapus.`);
      setBarangToDelete(null);
      invalidateGoods();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const saveCategoryMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: categoryForm.name.trim(),
        code: categoryForm.code.trim() || undefined,
        description: categoryForm.description.trim() || undefined,
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
          ? `Kategori ${categoryForm.name} berhasil diperbarui.`
          : `Kategori baru ${categoryForm.name} berhasil ditambahkan.`
      );
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      invalidateGoods();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteCategoryMut = useMutation({
    mutationFn: async (id: string) => unwrapResponse(await api.delete(`/master/categories/${id}`)),
    onSuccess: () => {
      toast.success("Kategori barang berhasil dihapus.");
      setCategoryToDelete(null);
      invalidateGoods();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  // Handlers
  const handleOpenCreateBarang = () => {
    setEditingBarang(null);
    setBarangForm({
      kode: `BRG-${Date.now().toString().slice(-4)}`,
      nama: "",
      categoryId: categoriesList[0]?.id || "",
      kategori: categoriesList[0]?.name || "Bahan Baku",
      subKategori: "",
      satuan: "pcs",
      hargaBeli: 0,
      stokMin: 10,
      description: "",
      imageUrl: "",
      coa_1: accountsList[0]?.id || "",
      coa_2: accountsList[1]?.id || "",
      coa_3: accountsList[2]?.id || "",
      coa_4: accountsList[3]?.id || "",
      coa_5: accountsList[4]?.id || "",
      coa_6: accountsList[5]?.id || "",
      coa_7: accountsList[6]?.id || "",
      coa_8: accountsList[7]?.id || "",
    });
    setIsBarangModalOpen(true);
  };

  const handleOpenEditBarang = (item: MasterBarangItem) => {
    setEditingBarang(item);
    setBarangForm({
      kode: item.kode,
      nama: item.nama,
      categoryId: item.categoryId || "",
      kategori: item.kategori,
      subKategori: item.subKategori === "â€”" ? "" : item.subKategori,
      satuan: item.satuan,
      hargaBeli: item.hargaBeli,
      stokMin: item.stokMin,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      coa_1: item.coaMapping?.coa_1 || item.inventoryAccount?.id || "",
      coa_2: item.coaMapping?.coa_2 || item.salesAccount?.id || "",
      coa_3: item.coaMapping?.coa_3 || "",
      coa_4: item.coaMapping?.coa_4 || "",
      coa_5: item.coaMapping?.coa_5 || "",
      coa_6: item.coaMapping?.coa_6 || "",
      coa_7: item.coaMapping?.coa_7 || "",
      coa_8: item.coaMapping?.coa_8 || "",
    });
    setIsBarangModalOpen(true);
  };

  const handleSaveBarang = () => {
    if (!barangForm.nama.trim()) {
      toast.error("Nama barang wajib diisi!");
      return;
    }
    saveBarangMut.mutate();
  };

  const handleOpenPurchaseHistory = (item: MasterBarangItem) => {
    setSelectedBarang(item);
    setIsPurchaseHistoryOpen(true);
  };

  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ code: `CAT-${Date.now().toString().slice(-4)}`, name: "", description: "" });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: KategoriBarangItem) => {
    setEditingCategory(cat);
    setCategoryForm({
      code: cat.code,
      name: cat.name,
      description: cat.description,
    });
    setIsCategoryModalOpen(true);
  };

  const handleExportExcel = () => {
    const csvHeader = "No,Kode,Barang,Harga Beli,Kategori,Sub Kategori,Satuan,Tanggal PO,No. PO,Supplier,Qty,Harga Satuan\n";
    const csvRows = goodsList
      .map((g, idx) =>
        [
          idx + 1,
          `"${g.kode}"`,
          `"${g.nama}"`,
          g.hargaBeli,
          `"${g.kategori}"`,
          `"${g.subKategori}"`,
          `"${g.satuan}"`,
          `"${g.lastPoDate || '-'}"`,
          `"${g.lastPoNumber}"`,
          `"${g.lastSupplierName}"`,
          g.lastPoQty,
          g.lastPoPrice,
        ].join(",")
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Master_Barang_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Daftar barang berhasil diekspor ke Excel (CSV)!");
  };

  return {
    activeTab,
    handleTabChange,
    searchQuery,
    setSearchQuery,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    totalEntries,
    totalPages,
    // Lists
    goodsList,
    categoriesList,
    accountsList,
    // Loading & Error
    isLoadingMaterials,
    isErrorMaterials,
    materialsError,
    refetchMaterials,
    isLoadingCategories,
    refetchCategories,
    // Purchase history
    purchaseHistoryData,
    isLoadingPurchaseHistory,
    // Modals
    isBarangModalOpen,
    setIsBarangModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isPurchaseHistoryOpen,
    setIsPurchaseHistoryOpen,
    selectedBarang,
    setSelectedBarang,
    editingBarang,
    setEditingBarang,
    barangToDelete,
    setBarangToDelete,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    editingCategory,
    setEditingCategory,
    categoryToDelete,
    setCategoryToDelete,
    // Forms
    barangForm,
    setBarangForm,
    categoryForm,
    setCategoryForm,
    // Actions
    handleOpenCreateBarang,
    handleOpenEditBarang,
    handleSaveBarang,
    handleOpenPurchaseHistory,
    handleOpenCreateCategory,
    handleOpenEditCategory,
    handleExportExcel,
    saveBarangMut,
    deleteBarangMut,
    saveCategoryMut,
    deleteCategoryMut,
  };
}
