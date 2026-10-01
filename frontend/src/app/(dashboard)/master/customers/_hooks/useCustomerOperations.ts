"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  MasterCustomerItem,
  CustomerCategoryItem,
  CustomerFormData,
  CustomerCategoryFormData,
  CustomerKpiFilterType,
} from "../_types/customer.types";

export function useCustomerOperations() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

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

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<CustomerKpiFilterType>("ALL");
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  // â”€â”€ Queries â”€â”€
  const {
    data: apiCustomers,
    isLoading: isLoadingCustomers,
    isError: isErrorCustomers,
    error: customersError,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["master-customers", searchQuery, selectedStaffFilter, selectedCategoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedStaffFilter !== "ALL") params.set("userId", selectedStaffFilter);
      if (selectedCategoryFilter !== "ALL") params.set("categoryId", selectedCategoryFilter);

      const qs = params.toString();
      const res = await api.get(`/master/customers${qs ? `?${qs}` : ""}`);
      const body = unwrapResponse(res);
      return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    },
    staleTime: 10000,
  });

  const {
    data: apiCategories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["master-customer-categories"],
    queryFn: async () => {
      const res = await api.get("/master/categories?type=CUSTOMER");
      const body = unwrapResponse(res);
      return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    },
    staleTime: 30000,
  });

  const { data: salesStaffList } = useQuery({
    queryKey: ["master-customers-sales-staff"],
    queryFn: async () => {
      const res = await api.get("/master/customers/sales-staff");
      const body = unwrapResponse(res);
      return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    },
    staleTime: 60000,
  });

  // Transform Data
  const customersList: MasterCustomerItem[] = useMemo(() => {
    if (!apiCustomers || !Array.isArray(apiCustomers)) return [];
    return apiCustomers.map((c: any) => ({
      id: c.id,
      customerCode: c.customerCode || c.brandCode || `CUST-${c.id.substring(0, 4).toUpperCase()}`,
      nama: c.nama || c.clientName || "-",
      clientName: c.clientName || c.nama || "-",
      brandName: c.brandName || c.clientName || "-",
      brandCode: c.brandCode,
      pic: c.pic || c.penginput || "Admin",
      penginput: c.penginput || c.pic || "Admin",
      picId: c.picId,
      phone: c.phone || c.contactInfo || "-",
      email: c.email || undefined,
      birthDate: c.birthDate ? String(c.birthDate).split("T")[0] : "",
      kategori: c.kategori || c.category?.name || "Calon Pelanggan",
      categoryId: c.categoryId || c.category?.id,
      kota: c.kota || c.city || "-",
      provinsi: c.provinsi || c.province || "",
      alamatLengkap: c.alamatLengkap || c.addressDetail || "-",
      contractType: "Jasa Maklon",
      nominalSoProduk: Number(c.nominalSoProduk || 0),
      soSampleCount: Number(c.soSampleCount || 0),
      soProdukCount: Number(c.soProdukCount || 0),
      status: c.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      sampleFeeTotal: Number(c.sampleFeeTotal || 0),
      sampleStatus: c.sampleStatus || "-",
      produksiBatchTotal: Number(c.produksiBatchTotal || 0),
      produksiStatus: c.produksiStatus || "-",
      legalitasBpom: c.legalitasBpom || "Belum Diajukan",
      legalitasHalal: c.legalitasHalal || "Belum",
      legalitasHki: c.legalitasHki || "Belum",
      escrowDeposit: Number(c.escrowDeposit || 0),
      salesOrders: c.salesOrders,
      sampleRequests: c.sampleRequests,
      registrations: c.registrations,
    }));
  }, [apiCustomers]);

  const categoriesList: CustomerCategoryItem[] = useMemo(() => {
    if (!apiCategories || !Array.isArray(apiCategories)) return [];
    return apiCategories.map((cat: any) => ({
      id: cat.id,
      code: cat.code || "",
      name: cat.name || "",
      description: cat.description || "",
      type: cat.type || "CUSTOMER",
      _count: cat._count,
    }));
  }, [apiCategories]);

  const currentSalesPic = salesStaffList?.[0]?.name || "Fadilah Syahab";

  // â”€â”€ States & Modals â”€â”€
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<MasterCustomerItem | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<MasterCustomerItem | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<MasterCustomerItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomerCategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CustomerCategoryItem | null>(null);

  const [customerForm, setCustomerForm] = useState<CustomerFormData>({
    customerCode: "",
    nama: "",
    brandName: "",
    pic: "",
    phone: "",
    email: "",
    birthDate: "",
    kategori: "Pelanggan Sample",
    categoryId: "",
    penginput: currentSalesPic,
    salesAssignee: "",
    kota: "Kota Surabaya",
    provinsi: "Jawa Timur",
    alamatLengkap: "",
    nominalSoProduk: 0,
    escrowDeposit: 0,
    legalitasBpom: "Belum Diajukan",
    legalitasHalal: "Belum",
    legalitasHki: "Belum",
    contractType: "Jasa Maklon",
    status: "ACTIVE",
  });

  const [categoryForm, setCategoryForm] = useState<CustomerCategoryFormData>({
    code: "",
    name: "",
    description: "",
  });

  // â”€â”€ KPI Stats â”€â”€
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
  const totalRoCount = customersList.filter((c) => c.kategori === "Pelanggan RO" || c.soProdukCount > 1).length;
  const totalLeadsCount = customersList.filter((c) => c.kategori === "Calon Pelanggan").length;

  // â”€â”€ Filtered Customers â”€â”€
  const filteredCustomers = useMemo(() => {
    return customersList.filter((item) => {
      if (activeTab === "my" && item.penginput !== currentSalesPic) {
        return false;
      }
      if (selectedKpiFilter === "RO" && item.kategori !== "Pelanggan RO" && item.soProdukCount <= 1) return false;
      if (selectedKpiFilter === "LEADS" && item.kategori !== "Calon Pelanggan") return false;
      if (selectedKpiFilter === "SAMPLE" && item.kategori !== "Pelanggan Sample" && item.soSampleCount <= 0) return false;
      if (selectedKpiFilter === "PRODUKSI" && item.nominalSoProduk <= 0) return false;
      if (selectedKpiFilter === "ESCROW" && item.escrowDeposit <= 0) return false;
      return true;
    });
  }, [customersList, activeTab, selectedKpiFilter, currentSalesPic]);

  const totalEntries = filteredCustomers.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // â”€â”€ Mutations â”€â”€
  const invalidateCustomers = () => {
    queryClient.invalidateQueries({ queryKey: ["master-customers"] });
  };

  const saveCustomerMut = useMutation({
    mutationFn: async () => {
      const payload: any = {
        clientName: customerForm.nama.trim(),
        name: customerForm.nama.trim(),
        brandName: customerForm.brandName.trim() || customerForm.nama.trim(),
        brandCode: customerForm.customerCode.trim() || undefined,
        code: customerForm.customerCode.trim() || undefined,
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim() || undefined,
        birthDate: customerForm.birthDate ? new Date(customerForm.birthDate).toISOString() : undefined,
        kota: customerForm.kota.trim() || undefined,
        provinsi: customerForm.provinsi.trim() || undefined,
        alamatDetail: customerForm.alamatLengkap.trim() || undefined,
        address: customerForm.alamatLengkap.trim() || undefined,
        salesAssignee: customerForm.salesAssignee || undefined,
        categoryId: customerForm.categoryId || undefined,
        kategori: customerForm.kategori || undefined,
        creditLimit: customerForm.escrowDeposit || 0,
      };

      const res = editingCustomer
        ? await api.patch(`/master/customers/${editingCustomer.id}`, payload)
        : await api.post("/master/customers", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      toast.success(
        editingCustomer
          ? `Data pelanggan ${customerForm.brandName} berhasil diperbarui.`
          : `Pelanggan baru ${customerForm.brandName} berhasil ditambahkan.`
      );
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      invalidateCustomers();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteCustomerMut = useMutation({
    mutationFn: async (id: string) => unwrapResponse(await api.delete(`/master/customers/${id}`)),
    onSuccess: () => {
      toast.success(`Pelanggan ${customerToDelete?.nama} berhasil dihapus.`);
      setCustomerToDelete(null);
      invalidateCustomers();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const saveCategoryMut = useMutation({
    mutationFn: async () => {
      const payload = {
        code: categoryForm.code?.trim() || `CUST-${Date.now().toString().slice(-4)}`,
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
        type: "CUSTOMER",
      };
      const res = editingCategory
        ? await api.patch(`/master/categories/${editingCategory.id}`, payload)
        : await api.post("/master/categories", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      toast.success(
        editingCategory
          ? "Kategori pelanggan berhasil diperbarui."
          : "Kategori pelanggan baru berhasil ditambahkan."
      );
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      refetchCategories();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteCategoryMut = useMutation({
    mutationFn: async (id: string) => unwrapResponse(await api.delete(`/master/categories/${id}`)),
    onSuccess: () => {
      toast.success("Kategori pelanggan berhasil dihapus.");
      setCategoryToDelete(null);
      refetchCategories();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  // Action Helpers
  const handleOpenCreateCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      customerCode: `CUST-${String(customersList.length + 1).padStart(3, "0")}`,
      nama: "",
      brandName: "",
      pic: "",
      phone: "",
      email: "",
      birthDate: "",
      kategori: categoriesList[0]?.name || "Calon Pelanggan",
      categoryId: categoriesList[0]?.id || "",
      penginput: currentSalesPic,
      salesAssignee: salesStaffList?.[0]?.id || "",
      kota: "Kota Surabaya",
      provinsi: "Jawa Timur",
      alamatLengkap: "",
      nominalSoProduk: 0,
      escrowDeposit: 0,
      legalitasBpom: "Belum Diajukan",
      legalitasHalal: "Belum",
      legalitasHki: "Belum",
      contractType: "Jasa Maklon",
      status: "ACTIVE",
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
      birthDate: item.birthDate || "",
      kategori: item.kategori,
      categoryId: item.categoryId || "",
      penginput: item.penginput,
      salesAssignee: item.picId || "",
      kota: item.kota,
      provinsi: item.provinsi,
      alamatLengkap: item.alamatLengkap,
      nominalSoProduk: item.nominalSoProduk,
      escrowDeposit: item.escrowDeposit,
      legalitasBpom: item.legalitasBpom,
      legalitasHalal: item.legalitasHalal,
      legalitasHki: item.legalitasHki,
      contractType: item.contractType || "Jasa Maklon",
      status: item.status || "ACTIVE",
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = () => {
    if (!customerForm.nama.trim() || !customerForm.phone.trim()) {
      toast.error("Nama pelanggan dan nomor telepon wajib diisi!");
      return;
    }
    saveCustomerMut.mutate();
  };

  const handleExportExcel = () => {
    const csvHeader = "No,Kode Klien,Nama,Brand,Telepon,Kota,Kategori,Penginput,SO Sample,SO Produk,Nominal SO Produk\n";
    const csvRows = filteredCustomers
      .map((c, idx) =>
        [
          idx + 1,
          `"${c.customerCode}"`,
          `"${c.nama}"`,
          `"${c.brandName}"`,
          `"${c.phone}"`,
          `"${c.kota}"`,
          `"${c.kategori}"`,
          `"${c.penginput}"`,
          c.soSampleCount,
          c.soProdukCount,
          c.nominalSoProduk,
        ].join(",")
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Master_Pelanggan_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data berhasil diexport ke format CSV/Excel.");
  };

  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      code: `CUST-CAT-${String(categoriesList.length + 1).padStart(2, "0")}`,
      name: "",
      description: "",
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CustomerCategoryItem) => {
    setEditingCategory(cat);
    setCategoryForm({
      code: cat.code || "",
      name: cat.name || cat.kategori || "",
      description: cat.description || cat.deskripsi || "",
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
    selectedStaffFilter,
    setSelectedStaffFilter,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    // Data & Lists
    customersList,
    categoriesList,
    salesStaffList,
    filteredCustomers,
    paginatedCustomers,
    // Loading & Error
    isLoadingCustomers,
    isErrorCustomers,
    customersError,
    refetchCustomers,
    isLoadingCategories,
    refetchCategories,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    totalEntries,
    totalPages,
    // KPIs
    totalSampleFee,
    totalProduksiSo,
    totalEscrow,
    totalRoCount,
    totalLeadsCount,
    // Modals state
    isCustomerModalOpen,
    setIsCustomerModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedCustomer,
    setSelectedCustomer,
    editingCustomer,
    setEditingCustomer,
    customerToDelete,
    setCustomerToDelete,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    editingCategory,
    setEditingCategory,
    categoryToDelete,
    setCategoryToDelete,
    // Form states
    customerForm,
    setCustomerForm,
    categoryForm,
    setCategoryForm,
    // Action Handlers
    handleOpenCreateCustomer,
    handleOpenEditCustomer,
    handleSaveCustomer,
    handleOpenCreateCategory,
    handleOpenEditCategory,
    handleExportExcel,
    saveCustomerMut,
    deleteCustomerMut,
    saveCategoryMut,
    deleteCategoryMut,
  };
}
