"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  MasterSupplierItem,
  KategoriSupplierItem,
  SupplierFormData,
  SupplierCategoryFormData,
  SupplierKpiFilterType,
} from "../_types/supplier.types";

export function useSupplierOperations() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

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

  // States
  const [suppliersList, setSuppliersList] = useState<MasterSupplierItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<KategoriSupplierItem[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<SupplierKpiFilterType>("ALL");
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
  const [importFile, setImportFile] = useState<File | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<MasterSupplierItem | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<MasterSupplierItem | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<MasterSupplierItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KategoriSupplierItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<KategoriSupplierItem | null>(null);

  // Forms
  const [supplierForm, setSupplierForm] = useState<SupplierFormData>({
    vendorCode: "",
    nama: "",
    pic: "",
    phone: "",
    email: "",
    categoryId: "",
    kategoriBahan: "Bahan Baku",
    provinsi: "Jawa Timur",
    kota: "Kota Surabaya",
    alamatLengkap: "",
    pajakPersen: 11,
    description: "",
    isPkp: true,
    npwp: "",
    paymentTerm: "Net 30",
    bankAccount: "",
    realStokSupplier: "Ready Stock",
    status: "ACTIVE",
  });

  const [categoryForm, setCategoryForm] = useState<SupplierCategoryFormData>({
    kode: "",
    kategori: "",
    deskripsi: "",
  });

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      if (tabParam === "categories") {
        setIsCategoryModalOpen(true);
      } else {
        setIsSupplierModalOpen(true);
      }
    }
  }, [searchParams, tabParam]);

  // â”€â”€ Backend API Queries â”€â”€
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

  const {
    data: apiCategories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["master-categories-supplier"],
    queryFn: async () => {
      const res = await api.get("/master/categories?type=SUPPLIER");
      const body = unwrapResponse(res);
      return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (apiCategories && Array.isArray(apiCategories)) {
      const mapped: KategoriSupplierItem[] = apiCategories.map((c: any) => ({
        id: c.id,
        kode: c.code,
        kategori: c.name,
        deskripsi: c.description || "-",
        totalSupplier: c._count?.suppliers || 0,
      }));
      setCategoriesList(mapped);
    }
  }, [apiCategories]);

  useEffect(() => {
    if (apiSuppliers && Array.isArray(apiSuppliers)) {
      const mapped: MasterSupplierItem[] = apiSuppliers.map((s: any) => ({
        id: s.id,
        vendorCode: s.code || `VND-${s.id.substring(0, 6)}`,
        nama: s.name,
        pic: s.contact || "-",
        phone: s.phone || "-",
        email: s.email || undefined,
        categoryId: s.categoryId || undefined,
        kategoriBahan: s.category?.name || "Bahan Baku",
        kota: s.city || "-",
        provinsi: s.province || "-",
        alamatLengkap: s.address || s.city || "-",
        pajakPersen: Number(s.tax ?? 11),
        description: s.description || "",
        isPkp: Number(s.tax ?? 11) > 0,
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

  // â”€â”€ Stats â”€â”€
  const totalSuppliers = suppliersList.length;
  const rawMaterialSuppliers = suppliersList.filter((s) => s.kategoriBahan === "Bahan Baku").length;
  const packagingSuppliers = suppliersList.filter(
    (s) => s.kategoriBahan === "Kemasan Primer" || s.kategoriBahan === "Kemasan Sekunder"
  ).length;
  const pkpSuppliers = suppliersList.filter((s) => s.isPkp).length;

  // â”€â”€ Filtered & Sorted Suppliers Pipeline â”€â”€
  const filteredSuppliers = useMemo(() => {
    return suppliersList
      .filter((item) => {
        if (selectedKpiFilter === "BBK" && item.kategoriBahan !== "Bahan Baku") return false;
        if (
          selectedKpiFilter === "KEMASAN" &&
          item.kategoriBahan !== "Kemasan Primer" &&
          item.kategoriBahan !== "Kemasan Sekunder"
        )
          return false;
        if (selectedKpiFilter === "PKP" && !item.isPkp) return false;

        if (filterColumnValue !== "ALL") {
          if (selectedFilterColumn === "kategori" && item.kategoriBahan !== filterColumnValue) {
            return false;
          }
          if (selectedFilterColumn === "pajak") {
            if (filterColumnValue === "PKP" && !item.isPkp) return false;
            if (filterColumnValue === "NON" && item.isPkp) return false;
          }
        }

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

  const totalEntries = filteredSuppliers.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage, pageSize]);

  // Handlers
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

  // â”€â”€ Mutations â”€â”€
  const invalidateSuppliers = () => {
    queryClient.invalidateQueries({ queryKey: ["master-suppliers"] });
    queryClient.invalidateQueries({ queryKey: ["master-categories-supplier"] });
  };

  const saveSupplierMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: supplierForm.nama.trim(),
        contact: supplierForm.pic.trim(),
        pic: supplierForm.pic.trim(),
        phone: supplierForm.phone.trim(),
        email: supplierForm.email.trim() || undefined,
        address: supplierForm.alamatLengkap.trim() || undefined,
        city: supplierForm.kota.trim() || undefined,
        province: supplierForm.provinsi.trim() || undefined,
        tax: Number(supplierForm.pajakPersen),
        taxPercentage: Number(supplierForm.pajakPersen),
        description: supplierForm.description?.trim() || undefined,
        categoryId: supplierForm.categoryId || undefined,
        termOfPayment: Number(supplierForm.paymentTerm.replace(/\D/g, "")) || 0,
      };
      const res = editingSupplier
        ? await api.patch(`/master/suppliers/${editingSupplier.id}`, payload)
        : await api.post("/master/suppliers", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      toast.success(
        editingSupplier
          ? `Data supplier ${supplierForm.nama} berhasil diperbarui.`
          : `Supplier baru ${supplierForm.nama} berhasil ditambahkan.`
      );
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      invalidateSuppliers();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteSupplierMut = useMutation({
    mutationFn: async (id: string) => unwrapResponse(await api.delete(`/master/suppliers/${id}`)),
    onSuccess: () => {
      toast.success(`Supplier ${supplierToDelete?.nama} berhasil dihapus.`);
      setSupplierToDelete(null);
      invalidateSuppliers();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const importSuppliersMut = useMutation({
    mutationFn: async (csvContent: string) =>
      unwrapResponse(
        await api.post("/master/suppliers/import", {
          csvContent,
          idempotencyKey: `supplier-import-${Date.now()}`,
        })
      ),
    onSuccess: (result: any) => {
      const n = result?.importedRows ?? 0;
      const rejected = result?.errors?.length ?? 0;
      if (result?.success === false || (n === 0 && rejected > 0)) {
        toast.error(`Import gagal: ${rejected} baris ditolak.`);
        return;
      }
      toast.success(
        `${n} dari ${result?.totalRows ?? n} baris diimpor${rejected ? `, ${rejected} ditolak` : ""}.`
      );
      setIsImportModalOpen(false);
      setImportFile(null);
      invalidateSuppliers();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const saveCategoryMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: categoryForm.kategori.trim(),
        code: categoryForm.kode.trim() || undefined,
        description: categoryForm.deskripsi.trim() || undefined,
        type: "SUPPLIER",
      };
      const res = editingCategory
        ? await api.patch(`/master/categories/${editingCategory.id}`, payload)
        : await api.post("/master/categories", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      toast.success(
        editingCategory
          ? `Kategori ${categoryForm.kategori} berhasil diperbarui.`
          : `Kategori baru ${categoryForm.kategori} berhasil ditambahkan.`
      );
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ["master-categories-supplier"] });
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteCategoryMut = useMutation({
    mutationFn: async (id: string) => unwrapResponse(await api.delete(`/master/categories/${id}`)),
    onSuccess: () => {
      toast.success("Kategori supplier berhasil dihapus.");
      setCategoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["master-categories-supplier"] });
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const handleOpenCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      vendorCode: `VND-BBK-${String(suppliersList.length + 1).padStart(3, "0")}`,
      nama: "",
      pic: "",
      phone: "",
      email: "",
      categoryId: categoriesList[0]?.id || "",
      kategoriBahan: categoriesList[0]?.kategori || "Bahan Baku",
      provinsi: "Jawa Timur",
      kota: "Kota Surabaya",
      alamatLengkap: "",
      pajakPersen: 11,
      description: "",
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
      categoryId: item.categoryId || (categoriesList.find((c) => c.kategori === item.kategoriBahan)?.id || ""),
      kategoriBahan: item.kategoriBahan,
      provinsi: item.provinsi,
      kota: item.kota,
      alamatLengkap: item.alamatLengkap,
      pajakPersen: item.pajakPersen,
      description: item.description || "",
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
    saveSupplierMut.mutate();
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
    toast.success("Export master supplier selesai (CSV).");
  };

  const IMPORT_HEADERS = ["name", "contact", "phone", "email", "address", "city"];

  const handleDownloadTemplate = () => {
    const sample = [
      "PT Contoh Supplier",
      "Ibu Contoh",
      "081200000000",
      "kontak@contoh.co.id",
      "Jalan Industri No. 1",
      "Surabaya",
    ];
    const csv = [IMPORT_HEADERS.join(","), sample.map((v) => `"${v}"`).join(",")].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_supplier.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template import supplier diunduh (CSV).");
  };

  const handleStartImport = async () => {
    if (!importFile) {
      toast.error("Pilih file CSV terlebih dahulu.");
      return;
    }
    try {
      const csvContent = await importFile.text();
      importSuppliersMut.mutate(csvContent);
    } catch {
      toast.error("Gagal membaca file. Pastikan file CSV yang dipilih valid.");
    }
  };

  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      kode: `SUP-CAT-${Date.now().toString().slice(-4)}`,
      kategori: "",
      deskripsi: "",
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: KategoriSupplierItem) => {
    setEditingCategory(cat);
    setCategoryForm({
      kode: cat.kode,
      kategori: cat.kategori,
      deskripsi: cat.deskripsi,
    });
    setIsCategoryModalOpen(true);
  };

  return {
    activeTab,
    handleTabChange,
    searchQuery,
    setSearchQuery,
    selectedKpiFilter,
    setSelectedKpiFilter,
    selectedFilterColumn,
    setSelectedFilterColumn,
    filterColumnValue,
    setFilterColumnValue,
    // Sorting & Selection
    sortColumn,
    sortDirection,
    handleHeaderSortToggle,
    selectedRowIds,
    toggleSelectAll,
    toggleSelectRow,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    totalEntries,
    totalPages,
    // Lists
    suppliersList,
    categoriesList,
    filteredSuppliers,
    paginatedSuppliers,
    // Loading & Error
    isLoadingSuppliers,
    isErrorSuppliers,
    suppliersError,
    refetchSuppliers,
    isLoadingCategories,
    refetchCategories,
    // Stats
    totalSuppliers,
    rawMaterialSuppliers,
    packagingSuppliers,
    pkpSuppliers,
    // Modals
    isSupplierModalOpen,
    setIsSupplierModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    importFile,
    setImportFile,
    selectedSupplier,
    setSelectedSupplier,
    editingSupplier,
    setEditingSupplier,
    supplierToDelete,
    setSupplierToDelete,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    editingCategory,
    setEditingCategory,
    categoryToDelete,
    setCategoryToDelete,
    // Forms
    supplierForm,
    setSupplierForm,
    categoryForm,
    setCategoryForm,
    // Actions
    handleOpenCreateSupplier,
    handleOpenEditSupplier,
    handleSaveSupplier,
    handleOpenCreateCategory,
    handleOpenEditCategory,
    handleExportExcel,
    handleDownloadTemplate,
    handleStartImport,
    saveSupplierMut,
    deleteSupplierMut,
    importSuppliersMut,
    saveCategoryMut,
    deleteCategoryMut,
  };
}
