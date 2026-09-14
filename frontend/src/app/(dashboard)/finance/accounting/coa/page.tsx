"use client";

/**
 * Chart of Accounts (COA) — Unified Enterprise Financial Hub
 *
 * Portal sentral bagan akun neraca, laba rugi, persediaan kosmetik,
 * dan aturan posting jurnal transaksi manufaktur maklon.
 *
 * Visual DNA Golden Reference Architecture:
 * - 0 raw @/components/ui imports (Strict ADR-007)
 * - Light Enterprise Theme: bg-[#F8FAFC] min-h-screen text-slate-900
 * - DnaPageHeader with integrated 6 tabs (Semua, Aset, Kewajiban, Ekuitas, Pendapatan, Beban)
 * - DnaKpiGrid with 5 interactive click-to-filter KPI cards
 * - DnaDataTableCard with 2-level filter toolbar, sorting, and pagination
 * - Standardized cells: DnaCell.Code, DnaCell.Text, DnaCell.Badge, DnaCell.Actions
 * - Clean DnaModal dialogs for Detail, Create, and Edit
 */

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileSpreadsheet,
  Layers,
  Wallet,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Landmark,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaConfirmDialog,
  DnaCell,
  DnaCheckbox,
  DnaTable,
  useDnaToast,
} from "@/components/dna";
import { MASTER_COA_LIST, CoaAccountItem } from "@/lib/coa-utils";

export interface AccountModel {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  normalBalance: "DEBIT" | "CREDIT";
  category: string;
  parentId?: string | null;
  isActive: boolean;
}

// Convert MASTER_COA_LIST into initial state models
const INITIAL_COA_DATA: AccountModel[] = MASTER_COA_LIST.map((item, idx) => ({
  id: `coa-${item.code}`,
  code: item.code,
  name: item.name,
  type: item.type,
  normalBalance: item.normalBalance || (item.type === "ASSET" || item.type === "EXPENSE" ? "DEBIT" : "CREDIT"),
  category: item.category || "General",
  parentId: null,
  isActive: item.isActive ?? true,
}));

function ChartOfAccountsContent() {
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

  // ── States ──
  const [accountsList, setAccountsList] = useState<AccountModel[]>(INITIAL_COA_DATA);

  // Sync with API query if backend is available
  const { data: apiAccounts } = useQuery<AccountModel[]>({
    queryKey: ["finance-accounts"],
    queryFn: async (): Promise<AccountModel[]> => {
      try {
        const res = await api.get("/finance/accounts");
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
        return [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (apiAccounts && apiAccounts.length > 0) {
      setAccountsList(apiAccounts);
    }
  }, [apiAccounts]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string>("ALL");
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<string>("category");
  const [filterColumnValue, setFilterColumnValue] = useState<string>("ALL");

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

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountModel["type"]>("ASSET");
  const [formNormalBalance, setFormNormalBalance] = useState<AccountModel["normalBalance"]>("DEBIT");
  const [formCategory, setFormCategory] = useState("Kas & Bank");
  const [formIsActive, setFormIsActive] = useState(true);

  // ── Stats Calculations ──
  const totalAccounts = accountsList.length;
  const assetCount = accountsList.filter((a) => a.type === "ASSET").length;
  const liabilityCount = accountsList.filter((a) => a.type === "LIABILITY").length;
  const equityCount = accountsList.filter((a) => a.type === "EQUITY").length;
  const revenueCount = accountsList.filter((a) => a.type === "REVENUE").length;
  const expenseCount = accountsList.filter((a) => a.type === "EXPENSE").length;

  // ── Filtered & Sorted Pipeline ──
  const filteredAccounts = useMemo(() => {
    return accountsList
      .filter((item) => {
        // 1. Top Tab Filter
        if (activeTab !== "ALL" && item.type !== activeTab) {
          return false;
        }

        // 2. KPI Filter
        if (selectedKpiFilter !== "ALL" && item.type !== selectedKpiFilter) {
          return false;
        }

        // 3. Toolbar Dropdown Filter
        if (filterColumnValue !== "ALL") {
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

  // ── Selection Handlers ──
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

  // ── Sort Toggle ──
  const handleHeaderSortToggle = (col: string) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  // ── KPI Click Filter ──
  const handleKpiClick = (filterKey: string) => {
    setSelectedKpiFilter((prev) => (prev === filterKey ? "ALL" : filterKey));
    setCurrentPage(1);
  };

  // ── Modal Handlers ──
  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormCode("");
    setFormName("");
    setFormType("ASSET");
    setFormNormalBalance("DEBIT");
    setFormCategory("Kas & Bank");
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

    if (editingAccount) {
      setAccountsList((prev) =>
        prev.map((a) =>
          a.id === editingAccount.id
            ? {
                ...a,
                code: formCode,
                name: formName,
                type: formType,
                normalBalance: formNormalBalance,
                category: formCategory,
                isActive: formIsActive,
              }
            : a
        )
      );
      toast.success(`Akun ${formCode} - ${formName} berhasil diperbarui.`);
    } else {
      const newAcc: AccountModel = {
        id: `coa-${Date.now()}`,
        code: formCode,
        name: formName,
        type: formType,
        normalBalance: formNormalBalance,
        category: formCategory,
        isActive: formIsActive,
      };
      setAccountsList((prev) => [newAcc, ...prev]);
      toast.success(`Akun baru ${newAcc.code} - ${newAcc.name} berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteAccount = () => {
    if (!accountToDelete) return;
    setAccountsList((prev) => prev.filter((a) => a.id !== accountToDelete.id));
    toast.success(`Akun ${accountToDelete.code} berhasil dihapus.`);
    setAccountToDelete(null);
  };

  // Helper badge color per account type
  const getTypeBadgeStatus = (type: AccountModel["type"]) => {
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

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. MODULAR PAGE HEADER ── */}
      <DnaPageHeader
        backLink={{ href: "/master", label: "Kembali ke Master Hub" }}
        title="CHART OF ACCOUNTS (COA)"
        tabs={[
          {
            key: "ALL",
            label: "Semua Akun",
            count: totalAccounts,
            icon: <Layers className="w-3.5 h-3.5" />,
          },
          {
            key: "ASSET",
            label: "Aset & Kas",
            count: assetCount,
            icon: <Wallet className="w-3.5 h-3.5" />,
          },
          {
            key: "LIABILITY",
            label: "Kewajiban / AP",
            count: liabilityCount,
            icon: <TrendingDown className="w-3.5 h-3.5" />,
          },
          {
            key: "EQUITY",
            label: "Ekuitas Modal",
            count: equityCount,
            icon: <Landmark className="w-3.5 h-3.5" />,
          },
          {
            key: "REVENUE",
            label: "Pendapatan Maklon",
            count: revenueCount,
            icon: <TrendingUp className="w-3.5 h-3.5" />,
          },
          {
            key: "EXPENSE",
            label: "HPP & Beban",
            count: expenseCount,
            icon: <CreditCard className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* ── 02. MODULAR 5 KPI METRIC CARDS ── */}
      <DnaKpiGrid
        cols={5}
        cards={[
          {
            key: "ALL",
            title: "TOTAL AKUN BUKU BESAR",
            value: totalAccounts.toLocaleString("id-ID"),
            subtext: "Struktur COA resmi terdaftar",
            icon: <FileSpreadsheet className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            isSelected: selectedKpiFilter === "ALL",
            onClick: () => handleKpiClick("ALL"),
          },
          {
            key: "ASSET",
            title: "ASET & PERSEDIAAN",
            value: assetCount.toLocaleString("id-ID"),
            subtext: "Kas, bank, piutang, material",
            icon: <Wallet className="w-4 h-4" />,
            iconBg: "bg-cyan-50",
            iconColor: "text-cyan-600",
            isSelected: selectedKpiFilter === "ASSET",
            onClick: () => handleKpiClick("ASSET"),
          },
          {
            key: "LIABILITY",
            title: "KEWAJIBAN & AP",
            value: liabilityCount.toLocaleString("id-ID"),
            subtext: "Hutang dagang & titipan klien",
            icon: <TrendingDown className="w-4 h-4" />,
            iconBg: "bg-rose-50",
            iconColor: "text-rose-600",
            isSelected: selectedKpiFilter === "LIABILITY",
            onClick: () => handleKpiClick("LIABILITY"),
          },
          {
            key: "REVENUE",
            title: "PENDAPATAN MAKLON",
            value: revenueCount.toLocaleString("id-ID"),
            subtext: "Jasa maklon, produk, sample",
            icon: <TrendingUp className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            isSelected: selectedKpiFilter === "REVENUE",
            onClick: () => handleKpiClick("REVENUE"),
          },
          {
            key: "EXPENSE",
            title: "HPP & BEBAN OPERASI",
            value: expenseCount.toLocaleString("id-ID"),
            subtext: "Bahan, tenaga kerja & overhead",
            icon: <CreditCard className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            isSelected: selectedKpiFilter === "EXPENSE",
            onClick: () => handleKpiClick("EXPENSE"),
          },
        ]}
      />

      {/* ── 03. MODULAR DATA TABLE CARD ── */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari nomor kode akun, nama rekening, atau kategori...",
          filterColumns: [
            {
              key: "category",
              label: "Kategori Rekening",
              type: "select",
              options: [
                "Kas & Bank",
                "Piutang",
                "Uang Muka",
                "Persediaan",
                "Pajak Dibayar Dimuka",
                "Aset Tetap",
                "Hutang Lancar",
                "Hutang Pajak",
                "Ekuitas",
                "Pendapatan Operasional",
                "Pengurang Pendapatan",
                "Harga Pokok Penjualan",
                "Beban Operasional",
              ],
            },
            {
              key: "normalBalance",
              label: "Saldo Normal",
              type: "select",
              options: ["DEBIT", "CREDIT"],
            },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["ACTIVE", "INACTIVE"],
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
            label: "Tambah Akun",
            onClick: handleOpenCreate,
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
        <DnaTable className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
              {/* Select All Checkbox */}
              <th className="p-3.5 w-10 text-center">
                <DnaCheckbox
                  checked={paginatedAccounts.length > 0 && selectedRowIds.length === paginatedAccounts.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="p-3.5 w-10 text-slate-400">#</th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[110px]"
                onClick={() => handleHeaderSortToggle("code")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>KODE AKUN</span>
                  {sortColumn === "code" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[240px]"
                onClick={() => handleHeaderSortToggle("name")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>NAMA REKENING AKUN</span>
                  {sortColumn === "name" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[140px]"
                onClick={() => handleHeaderSortToggle("type")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>TIPE LAPORAN</span>
                  {sortColumn === "type" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[130px] text-center"
                onClick={() => handleHeaderSortToggle("normalBalance")}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>SALDO NORMAL</span>
                  {sortColumn === "normalBalance" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[180px]"
                onClick={() => handleHeaderSortToggle("category")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>KELOMPOK KATEGORI</span>
                  {sortColumn === "category" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th className="p-3.5 text-center min-w-[90px]">STATUS</th>
              <th className="p-3.5 text-right w-24">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedAccounts.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                  Tidak ada akun COA yang sesuai filter pencarian.
                </td>
              </tr>
            ) : (
              paginatedAccounts.map((acc, idx) => {
                const isSelected = selectedRowIds.includes(acc.id);
                return (
                  <tr
                    key={acc.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <DnaCheckbox
                        checked={isSelected}
                        onChange={() => toggleSelectRow(acc.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    {/* Number */}
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    {/* Kode Akun */}
                    <td className="p-3.5">
                      <DnaCell.Code value={acc.code} onClick={() => handleOpenView(acc)} />
                    </td>
                    {/* Nama Rekening */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200/60 text-slate-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                          {acc.code.charAt(0)}
                        </div>
                        <DnaCell.Text primary={acc.name} />
                      </div>
                    </td>
                    {/* Tipe Laporan */}
                    <td className="p-3.5">
                      <DnaCell.Badge
                        label={acc.type}
                        status={getTypeBadgeStatus(acc.type)}
                      />
                    </td>
                    {/* Saldo Normal */}
                    <td className="p-3.5 text-center">
                      <DnaCell.Badge
                        label={acc.normalBalance}
                        status={acc.normalBalance === "DEBIT" ? "blue" : "purple"}
                      />
                    </td>
                    {/* Kelompok Kategori */}
                    <td className="p-3.5">
                      <DnaCell.Text primary={acc.category} />
                    </td>
                    {/* Status */}
                    <td className="p-3.5 text-center">
                      <DnaCell.Badge
                        label={acc.isActive ? "ACTIVE" : "INACTIVE"}
                        status={acc.isActive ? "success" : "slate"}
                      />
                    </td>
                    {/* Aksi */}
                    <td className="p-3.5 text-right">
                      <DnaCell.Actions
                        onView={() => handleOpenView(acc)}
                        onEdit={() => handleOpenEdit(acc)}
                        onDelete={() => setAccountToDelete(acc)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>

      {/* ── MODAL DETAIL INSPECTION ── */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Akun Buku Besar"
        subtitle={viewingAccount ? `${viewingAccount.code} — ${viewingAccount.name}` : ""}
        size="md"
      >
        {viewingAccount && (
          <div className="space-y-6 py-2 text-xs">
            {/* Header Badge Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-mono font-black text-sm shadow-xs">
                {viewingAccount.code.substring(0, 3)}
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">{viewingAccount.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                    Kode: {viewingAccount.code}
                  </span>
                  <DnaCell.Badge
                    label={viewingAccount.isActive ? "ACTIVE" : "INACTIVE"}
                    status={viewingAccount.isActive ? "success" : "slate"}
                  />
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-slate-200/70 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Tipe Laporan Finansial
                </span>
                <DnaCell.Badge
                  label={viewingAccount.type}
                  status={getTypeBadgeStatus(viewingAccount.type)}
                />
              </div>
              <div className="p-3 rounded-lg border border-slate-200/70 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Saldo Normal
                </span>
                <DnaCell.Badge
                  label={viewingAccount.normalBalance}
                  status={viewingAccount.normalBalance === "DEBIT" ? "blue" : "purple"}
                />
              </div>
              <div className="p-3 rounded-lg border border-slate-200/70 bg-white col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Kelompok Kategori
                </span>
                <span className="font-semibold text-slate-800 text-sm">{viewingAccount.category}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <DnaButton
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEdit(viewingAccount);
                }}
              >
                Sunting Akun
              </DnaButton>
              <DnaButton variant="primary" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* ── MODAL TAMBAH / EDIT AKUN ── */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? `Sunting Akun: ${editingAccount.code}` : "Tambah Akun Baru"}
        subtitle="Definisikan nomor akun rekening, klasifikasi tipe laporan, dan saldo normal pembukuan"
        size="lg"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Nomor Kode Akun *"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="e.g. 11110"
            />
            <DnaInput
              label="Nama Rekening Akun *"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Kas Operasional Pabrik"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaSelect
              label="Tipe Laporan *"
              value={formType}
              onChange={(val) => setFormType(val as AccountModel["type"])}
              options={[
                { value: "ASSET", label: "Asset (Aktiva / Harta)" },
                { value: "LIABILITY", label: "Liability (Kewajiban / Hutang)" },
                { value: "EQUITY", label: "Equity (Modal / Ekuitas)" },
                { value: "REVENUE", label: "Revenue (Pendapatan Maklon)" },
                { value: "EXPENSE", label: "Expense (HPP & Beban Operasional)" },
              ]}
            />
            <DnaSelect
              label="Saldo Normal *"
              value={formNormalBalance}
              onChange={(val) => setFormNormalBalance(val as AccountModel["normalBalance"])}
              options={[
                { value: "DEBIT", label: "DEBIT (Bertambah di Debit)" },
                { value: "CREDIT", label: "CREDIT (Bertambah di Kredit)" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaSelect
              label="Kelompok Kategori *"
              value={formCategory}
              onChange={(val) => setFormCategory(val)}
              options={[
                { value: "Kas & Bank", label: "Kas & Bank" },
                { value: "Piutang", label: "Piutang" },
                { value: "Uang Muka", label: "Uang Muka" },
                { value: "Persediaan", label: "Persediaan" },
                { value: "Pajak Dibayar Dimuka", label: "Pajak Dibayar Dimuka" },
                { value: "Aset Tetap", label: "Aset Tetap" },
                { value: "Hutang Lancar", label: "Hutang Lancar" },
                { value: "Hutang Pajak", label: "Hutang Pajak" },
                { value: "Ekuitas", label: "Ekuitas" },
                { value: "Pendapatan Operasional", label: "Pendapatan Operasional" },
                { value: "Pengurang Pendapatan", label: "Pengurang Pendapatan" },
                { value: "Harga Pokok Penjualan", label: "Harga Pokok Penjualan" },
                { value: "Beban Operasional", label: "Beban Operasional" },
              ]}
            />
            <DnaSelect
              label="Status Akun *"
              value={formIsActive ? "ACTIVE" : "INACTIVE"}
              onChange={(val) => setFormIsActive(val === "ACTIVE")}
              options={[
                { value: "ACTIVE", label: "ACTIVE (Dapat Dijurnal)" },
                { value: "INACTIVE", label: "INACTIVE (Nonaktif)" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <DnaButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveAccount}>
              Simpan Akun
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* ── CONFIRM DELETE DIALOG ── */}
      <DnaConfirmDialog
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDeleteAccount}
        title="Hapus Akun Rekening?"
        description={`Apakah Anda yakin ingin menghapus akun ${accountToDelete?.code} - ${accountToDelete?.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Akun"
        variant="critical"
      />
    </div>
  );
}

export default function ChartOfAccountsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Memuat Chart of Accounts...</div>}>
      <ChartOfAccountsContent />
    </Suspense>
  );
}

