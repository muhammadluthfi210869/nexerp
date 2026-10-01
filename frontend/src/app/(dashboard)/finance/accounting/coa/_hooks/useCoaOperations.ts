"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import { unwrapResponse } from "@/lib/unwrap-response";
import { AccountModel, AccountType, NormalBalance, CoaKpis } from "../_types/coa.types";

export function useCoaOperations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const tabParam = searchParams.get("tab")?.toUpperCase() || "ALL";
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/finance/accounting/coa?tab=${tabId.toLowerCase()}`);
  };

  // Sync with API query
  const { data: rawAccounts = [], isLoading } = useQuery<AccountModel[]>({
    queryKey: ["finance-accounts"],
    queryFn: async (): Promise<AccountModel[]> => {
      try {
        const res = await api.get("/finance/accounts");
        const body = unwrapResponse<any[]>(res);
        if (Array.isArray(body)) {
          return body.map((acc: any) => ({
            id: acc.id,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            normalBalance: acc.normalBalance || (acc.type === "ASSET" || acc.type === "EXPENSE" ? "DEBIT" : "CREDIT"),
            category: acc.category || acc.reportGroup || "General",
            parentId: acc.parentId || null,
            parent: acc.parent || null,
            allowManualJournal: acc.allowManualJournal !== false,
            isHeader: acc.allowManualJournal === false,
            currency: acc.currency || "IDR",
            balance: typeof acc.balance === "number" ? acc.balance : 0,
            isActive: acc.isActive !== false,
          }));
        }
        return [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const accountsList = rawAccounts;

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/finance/accounts", payload),
    onSuccess: () => {
      toast.success("Akun baru berhasil ditambahkan.");
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat akun");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      api.patch(`/finance/accounts/${id}`, payload),
    onSuccess: () => {
      toast.success("Akun berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal memperbarui akun");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/finance/accounts/${id}`),
    onSuccess: () => {
      toast.success("Akun berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      setAccountToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menghapus akun");
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => api.post("/finance/accounts/seed", {}),
    onSuccess: () => {
      toast.success("Master akun COA standar berhasil diinisialisasi!");
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal inisialisasi akun COA");
    },
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string>("ALL");
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<string>("category");
  const [filterColumnValue, setFilterColumnValue] = useState<string>("ALL");

  const statusOptions = [
    { value: "ALL", label: "Semua Status Akun" },
    { value: "ACTIVE", label: "Akun Aktif (Postable)", color: "success" as const },
    { value: "INACTIVE", label: "Akun Non-Aktif", color: "default" as const },
  ];

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedKpiFilter("ALL");
    setSelectedFilterColumn("category");
    setFilterColumnValue("ALL");
  };

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<AccountModel | null>(null);
  const [editingAccount, setEditingAccount] = useState<AccountModel | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountModel | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("ASSET");
  const [formNormalBalance, setFormNormalBalance] = useState<NormalBalance>("DEBIT");
  const [formCategory, setFormCategory] = useState("Kas & Bank");
  const [formParentId, setFormParentId] = useState("");
  const [formIsHeader, setFormIsHeader] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  const handleExportExcel = () => {
    const csvHeader = "No,Kode Akun,Nama Rekening,Tipe Laporan,Induk Akun,Saldo Normal,Header Akun,Status\n";
    const csvRows = filteredAccounts
      .map((acc, idx) => {
        const parentName = acc.parent?.name || "-";
        const headerStatus = acc.allowManualJournal === false ? "Header (Non-Jurnal)" : "Akun Transaksi";
        const statusStr = acc.isActive ? "Aktif" : "Non-Aktif";
        return `${idx + 1},"${acc.code}","${acc.name.replace(/"/g, '""')}","${acc.type}","${parentName}","${acc.normalBalance}","${headerStatus}","${statusStr}"`;
      })
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CoA_Master_Data_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data Chart of Accounts berhasil diekspor.");
  };

  // â”€â”€ Stats Calculations â”€â”€
  const totalAccounts = accountsList.length;
  const assetCount = accountsList.filter((a) => a.type === "ASSET").length;
  const liabilityCount = accountsList.filter((a) => a.type === "LIABILITY").length;
  const equityCount = accountsList.filter((a) => a.type === "EQUITY").length;
  const revenueCount = accountsList.filter((a) => a.type === "REVENUE").length;
  const expenseCount = accountsList.filter((a) => a.type === "EXPENSE").length;

  const kpis: CoaKpis = {
    totalAccounts,
    assetCount,
    liabilityCount,
    equityCount,
    revenueCount,
    expenseCount,
  };

  // â”€â”€ Filtered & Sorted Pipeline â”€â”€
  const filteredAccounts = useMemo(() => {
    return accountsList
      .filter((item) => {
        // 1. Top Tab Filter
        if (activeTab !== "ALL" && item.type !== activeTab) {
          return false;
        }

        // 2. Status Dropdown Filter
        if (selectedStatus !== "ALL") {
          const statusStr = item.isActive ? "ACTIVE" : "INACTIVE";
          if (statusStr !== selectedStatus) return false;
        }

        // 3. KPI Filter
        if (selectedKpiFilter !== "ALL" && item.type !== selectedKpiFilter) {
          return false;
        }

        // 4. Toolbar Dropdown Filter
        if (filterColumnValue !== "ALL") {
          if (selectedFilterColumn === "type" && item.type !== filterColumnValue) {
            return false;
          }
          if (selectedFilterColumn === "category" && item.category !== filterColumnValue) {
            return false;
          }
          if (selectedFilterColumn === "normalBalance" && item.normalBalance !== filterColumnValue) {
            return false;
          }
          if (selectedFilterColumn === "status") {
            const statusStr = item.isActive ? "ACTIVE" : "INACTIVE";
            if (statusStr !== filterColumnValue) return false;
          }
        }

        // 4. Global Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = item.code.toLowerCase().includes(q);
          const matchName = item.name.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchType = item.type.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchCat && !matchType) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (!sortColumn) return 0;
        const dir = sortDirection === "asc" ? 1 : -1;
        switch (sortColumn) {
          case "code":
            return dir * a.code.localeCompare(b.code);
          case "name":
            return dir * a.name.localeCompare(b.name);
          case "type":
            return dir * a.type.localeCompare(b.type);
          case "normalBalance":
            return dir * a.normalBalance.localeCompare(b.normalBalance);
          case "category":
            return dir * a.category.localeCompare(b.category);
          default:
            return 0;
        }
      });
  }, [
    accountsList,
    activeTab,
    selectedKpiFilter,
    selectedFilterColumn,
    filterColumnValue,
    searchQuery,
    sortColumn,
    sortDirection,
  ]);

  // Pagination Slice
  const totalEntries = filteredAccounts.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

  // Options for parent account dropdown
  const parentOptions = useMemo(() => {
    return [
      { value: "", label: "-- Tanpa Induk (Akun Tingkat Utama) --" },
      ...accountsList
        .filter((a) => !editingAccount || a.id !== editingAccount.id)
        .map((a) => ({
          value: a.id,
          label: `${a.code} - ${a.name} (${a.type})`,
        })),
    ];
  }, [accountsList, editingAccount]);

  // â”€â”€ Selection Handlers â”€â”€
  const toggleSelectAll = () => {
    if (selectedRowIds.length === paginatedAccounts.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(paginatedAccounts.map((a) => a.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // â”€â”€ Sort Toggle â”€â”€
  const handleHeaderSortToggle = (col: string) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  // â”€â”€ KPI Click Filter â”€â”€
  const handleKpiClick = (filterKey: string) => {
    setSelectedKpiFilter((prev) => (prev === filterKey ? "ALL" : filterKey));
    setCurrentPage(1);
  };

  // â”€â”€ Modal Handlers â”€â”€
  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormCode("");
    setFormName("");
    setFormType("ASSET");
    setFormNormalBalance("DEBIT");
    setFormCategory("Kas & Bank");
    setFormParentId("");
    setFormIsHeader(false);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AccountModel) => {
    setEditingAccount(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormType(item.type);
    setFormNormalBalance(item.normalBalance);
    setFormCategory(item.category);
    setFormParentId(item.parentId || "");
    setFormIsHeader(item.allowManualJournal === false);
    setFormIsActive(item.isActive);
    setIsModalOpen(true);
  };

  const handleOpenView = (item: AccountModel) => {
    setViewingAccount(item);
    setIsDetailModalOpen(true);
  };

  const handleSaveAccount = () => {
    if (!formCode.trim() || !formName.trim()) {
      toast.error("Kode akun dan nama akun wajib diisi!");
      return;
    }

    const payload = {
      code: formCode.trim(),
      name: formName.trim(),
      type: formType,
      normalBalance: formNormalBalance,
      category: formCategory,
      parentId: formParentId || undefined,
      allowManualJournal: !formIsHeader,
      isActive: formIsActive,
    };

    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteAccount = () => {
    if (!accountToDelete) return;
    deleteMutation.mutate(accountToDelete.id);
  };

  const getTypeBadgeStatus = (type: AccountType) => {
    switch (type) {
      case "ASSET":
        return "blue";
      case "LIABILITY":
        return "rose";
      case "EQUITY":
        return "purple";
      case "REVENUE":
        return "success";
      case "EXPENSE":
        return "orange";
      default:
        return "slate";
    }
  };

  return {
    router,
    toast,
    // Tabs & Navigation
    activeTab,
    handleTabChange,
    // Data & Loading
    accountsList,
    isLoading,
    isSeeding: seedMutation.isPending,
    seedAccount: () => seedMutation.mutate(),
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    // KPIs
    kpis,
    selectedKpiFilter,
    handleKpiClick,
    // Filter & Search
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    statusOptions,
    handleResetAll,
    selectedFilterColumn,
    setSelectedFilterColumn,
    filterColumnValue,
    setFilterColumnValue,
    // Sorting
    sortColumn,
    sortDirection,
    handleHeaderSortToggle,
    // Selection
    selectedRowIds,
    toggleSelectAll,
    toggleSelectRow,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    totalEntries,
    // Paginated / Filtered List
    filteredAccounts,
    paginatedAccounts,
    parentOptions,
    // Modals
    isModalOpen,
    setIsModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    viewingAccount,
    setViewingAccount,
    editingAccount,
    setEditingAccount,
    accountToDelete,
    setAccountToDelete,
    // Form state & setters
    formCode,
    setFormCode,
    formName,
    setFormName,
    formType,
    setFormType,
    formNormalBalance,
    setFormNormalBalance,
    formCategory,
    setFormCategory,
    formParentId,
    setFormParentId,
    formIsHeader,
    setFormIsHeader,
    formIsActive,
    setFormIsActive,
    // Action handlers
    handleExportExcel,
    handleCopyCoa: () => seedMutation.mutate(),
    handleNavigateAutoCoa: () => router.push("/finance/jurnal-umum"),
    handleOpenCreate,
    handleOpenEdit,
    handleOpenView,
    handleSaveAccount,
    handleDeleteAccount,
    getTypeBadgeStatus,
    createMutation,
    updateMutation,
    deleteMutation,
    seedMutation,
  };
}

export type UseCoaOperationsReturn = ReturnType<typeof useCoaOperations>;
