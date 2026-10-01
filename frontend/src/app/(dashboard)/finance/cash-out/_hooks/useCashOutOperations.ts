import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  CashOutItem,
  CashOutFormData,
  CashOutDateRange,
  CashOutStatusTab,
  CashOutReconciliationStatus,
  CashOutApprovalStatus,
} from "../_types/cash-out.types";

export function useCashOutOperations() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<CashOutItem | null>(null);

  // Live Cash Out / Journals query
  const {
    data: journalsRaw = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["finance-cash-out-journals"],
    queryFn: async (): Promise<any[]> => {
      const res = await api.get("/finance/journals");
      return unwrapResponse<any[]>(res) || [];
    },
  });

  const { data: accountsRaw = [] } = useQuery({
    queryKey: ["finance-accounts-for-cash-out"],
    queryFn: async (): Promise<any[]> => {
      try {
        const res = await api.get("/finance/accounts");
        return unwrapResponse<any[]>(res) || [];
      } catch {
        return [];
      }
    },
  });

  const cashOutItems: CashOutItem[] = useMemo(() => {
    return (journalsRaw || [])
      .filter(
        (j: any) =>
          j.reference?.includes("KK") ||
          j.reference?.includes("CASH-OUT") ||
          j.reference?.includes("FUND-DISB") ||
          j.lines?.some((l: any) => l.account?.type === "EXPENSE")
      )
      .map((j: any) => {
        const debitLine = j.lines?.find((l: any) => Number(l.debit) > 0);
        const creditLine = j.lines?.find((l: any) => Number(l.credit) > 0);
        const isReconciled = Boolean(j.reconciled || j.bankTransaction?.reconciled);
        const reconStatus: CashOutReconciliationStatus = isReconciled ? "RECONCILED" : "UNRECONCILED";
        const appStatus: CashOutApprovalStatus = j.status === "DRAFT" ? "PENDING" : "POSTED";
        return {
          id: j.id,
          code: j.reference || `KK-${j.id?.slice(0, 8)}`,
          date: j.date ? new Date(j.date).toISOString().split("T")[0] : "",
          description: j.description || "Pengeluaran Kas",
          to: j.sourceDocumentType && j.sourceDocumentType !== "MANUAL" ? j.sourceDocumentType : (j.entityName || "Vendor/Staff"),
          billNo: j.sourceDocument || j.reference || "-",
          account: creditLine?.account?.name || "Kas/Bank BCA",
          amount: Number(debitLine?.debit || creditLine?.credit || 0),
          reconciliationStatus: reconStatus,
          approvalStatus: appStatus,
          status: j.status === "DRAFT" ? ("DRAFT" as const) : ("POSTED" as const),
          category: debitLine?.account?.name || "Beban Operasional",
        };
      });
  }, [journalsRaw]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Form states (SCR-084)
  const initialFormData: CashOutFormData = {
    date: new Date().toISOString().split("T")[0],
    description: "",
    account: "BCA Operasional (521-009182)",
    to: "",
    billNo: "",
    coaExpense: "5110 - Beban Pokok Bahan Baku",
    amount: "",
    entryNotes: "",
  };

  const [formData, setFormData] = useState<CashOutFormData>(initialFormData);

  const totalKasKeluar = useMemo(() => {
    return cashOutItems.reduce((acc, r) => acc + r.amount, 0);
  }, [cashOutItems]);

  const totalReconciled = useMemo(() => {
    return cashOutItems.filter((item) => item.reconciliationStatus === "RECONCILED").length;
  }, [cashOutItems]);

  const totalUnreconciled = useMemo(() => {
    return cashOutItems.filter((item) => item.reconciliationStatus === "UNRECONCILED").length;
  }, [cashOutItems]);

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn("");
    setFilterValue("");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  const statusOptions = [
    { value: "ALL", label: "Semua Status Mutasi" },
    { value: "POSTED", label: "Posted (Jurnal)", color: "success" as const },
    { value: "DRAFT", label: "Draft", color: "warning" as const },
  ];

  const uniqueAccounts = Array.from(new Set(cashOutItems.map((c) => c.account).filter(Boolean))) as string[];
  const uniqueCategories = Array.from(new Set(cashOutItems.map((c) => c.category).filter(Boolean))) as string[];
  const uniqueTo = Array.from(new Set(cashOutItems.map((c) => c.to).filter(Boolean))) as string[];

  const filterColumns = [
    {
      key: "account",
      label: "Akun Kas / Bank",
      type: "select" as const,
      options: uniqueAccounts,
    },
    {
      key: "category",
      label: "Kategori Pengeluaran",
      type: "select" as const,
      options: uniqueCategories,
    },
    {
      key: "to",
      label: "Dibayarkan Kepada (Payee)",
      type: "select" as const,
      options: uniqueTo,
    },
    {
      key: "amount",
      label: "Urutkan: Nominal Keluar",
      type: "sort_numeric" as const,
    },
    {
      key: "date",
      label: "Urutkan: Tanggal Mutasi",
      type: "sort_alpha" as const,
    },
  ];

  const filteredItems = useMemo(() => {
    let result = cashOutItems.filter((item) => {
      // Dedicated Status Filter
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) return false;

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTo = item.to.toLowerCase().includes(q);
        const matchBill = item.billNo.toLowerCase().includes(q);
        const matchAcc = item.account.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchTo && !matchBill && !matchAcc && !matchCat) return false;
      }

      // Secondary Column Filter
      if (selectedColumn && filterValue && !filterValue.startsWith("sort_")) {
        if (selectedColumn === "account" && item.account !== filterValue) return false;
        if (selectedColumn === "category" && item.category !== filterValue) return false;
        if (selectedColumn === "to" && item.to !== filterValue) return false;
      }

      // Hybrid Date Filter
      if (dateMode !== "ALL" && item.date) {
        const itemDate = new Date(item.date);
        if (!isNaN(itemDate.getTime())) {
          const now = new Date();
          if (dateMode === "1_DAY") {
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            if (itemDate < oneDayAgo || itemDate > now) return false;
          } else if (dateMode === "1_WEEK") {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (itemDate < oneWeekAgo || itemDate > now) return false;
          } else if (dateMode === "1_MONTH") {
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (itemDate < oneMonthAgo || itemDate > now) return false;
          } else if (dateMode === "1_YEAR") {
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            if (itemDate < oneYearAgo || itemDate > now) return false;
          } else if (dateMode === "CUSTOM") {
            if (startDate) {
              const s = new Date(startDate);
              s.setHours(0, 0, 0, 0);
              if (itemDate < s) return false;
            }
            if (endDate) {
              const e = new Date(endDate);
              e.setHours(23, 59, 59, 999);
              if (itemDate > e) return false;
            }
          }
        }
      }

      return true;
    });

    // Column sorting
    if (selectedColumn && filterValue) {
      if (filterValue === "sort_numeric_asc" || filterValue === "sort_alpha_asc") {
        result = [...result].sort((a: any, b: any) => {
          const valA = a[selectedColumn] ?? "";
          const valB = b[selectedColumn] ?? "";
          return typeof valA === "number" ? valA - valB : String(valA).localeCompare(String(valB));
        });
      } else if (filterValue === "sort_numeric_desc" || filterValue === "sort_alpha_desc") {
        result = [...result].sort((a: any, b: any) => {
          const valA = a[selectedColumn] ?? "";
          const valB = b[selectedColumn] ?? "";
          return typeof valA === "number" ? valB - valA : String(valB).localeCompare(String(valA));
        });
      }
    }

    return result;
  }, [cashOutItems, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const handleSave = async () => {
    if (!formData.description || !formData.amount) {
      toast.error("Mohon lengkapi seluruh kolom bertanda bintang (*)");
      return;
    }

    try {
      const cashAcc =
        accountsRaw.find(
          (a: any) =>
            a.type === "ASSET" &&
            (a.name.toLowerCase().includes("kas") ||
              a.name.toLowerCase().includes("bank"))
        ) || accountsRaw.find((a: any) => a.type === "ASSET");
      const expAcc =
        accountsRaw.find((a: any) => a.type === "EXPENSE") || accountsRaw[0];

      if (cashAcc?.id && expAcc?.id) {
        await api.post("/finance/cash/disburse", {
          date: new Date(formData.date).toISOString(),
          cashAccountId: cashAcc.id,
          category: "BEBAN_OPERASIONAL",
          debitAccountId: expAcc.id,
          amount: Number(formData.amount),
          entityName: formData.to || "Vendor/Staff",
          notes: formData.description,
        });
      } else {
        await api.post("/finance/journals", {
          date: formData.date,
          reference: `KK-${Date.now().toString().slice(-6)}`,
          description: `Kas Keluar: ${formData.to || "Pihak Terkait"} - ${formData.description}`,
          lines: [
            {
              accountId: expAcc?.id || "default-exp",
              debit: Number(formData.amount),
              credit: 0,
            },
            {
              accountId: cashAcc?.id || "default-cash",
              debit: 0,
              credit: Number(formData.amount),
            },
          ],
        });
      }

      toast.success(
        "Bukti Kas Bank Keluar berhasil disimpan dan diposting ke Jurnal!"
      );
      refetch();
      setIsCreateModalOpen(false);
      setFormData(initialFormData);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menyimpan kas keluar");
    }
  };

  const handlePrintItem = (item: CashOutItem) => {
    toast.success(`Mencetak Bukti Kas Keluar ${item.code}...`);
  };

  const handleApplyDateFilter = () => {
    toast.success("Filter tanggal diaplikasikan");
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    statusOptions,
    selectedColumn,
    setSelectedColumn,
    filterValue,
    setFilterValue,
    filterColumns,
    dateMode,
    setDateMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleResetAll,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedDetail,
    setSelectedDetail,
    formData,
    setFormData,
    cashOutItems,
    filteredItems,
    totalKasKeluar,
    totalReconciled,
    totalUnreconciled,
    isLoading,
    refetch,
    handleSave,
    handlePrintItem,
  };
}
