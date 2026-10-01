import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  CashInItem,
  CashInFormData,
  CashInDateRange,
  CashInStatusTab,
  ReconciliationStatus,
  ApprovalStatus,
} from "../_types/cash-in.types";

export function useCashInOperations() {
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
  const [selectedDetail, setSelectedDetail] = useState<CashInItem | null>(null);

  // Live Cash In / Journals query
  const {
    data: journalsRaw = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["finance-cash-in-journals"],
    queryFn: async (): Promise<any[]> => {
      const res = await api.get("/finance/journals");
      return unwrapResponse<any[]>(res) || [];
    },
  });

  const { data: accountsRaw = [] } = useQuery({
    queryKey: ["finance-accounts-for-cash-in"],
    queryFn: async (): Promise<any[]> => {
      try {
        const res = await api.get("/finance/accounts");
        return unwrapResponse<any[]>(res) || [];
      } catch {
        return [];
      }
    },
  });

  const cashInItems: CashInItem[] = useMemo(() => {
    return (journalsRaw || [])
      .filter(
        (j: any) =>
          j.reference?.includes("KM") ||
          j.reference?.includes("CASH-IN") ||
          j.sourceDocumentType === "MANUAL" ||
          j.lines?.some((l: any) => l.account?.type === "REVENUE")
      )
      .map((j: any) => {
        const debitLine = j.lines?.find((l: any) => Number(l.debit) > 0);
        const creditLine = j.lines?.find((l: any) => Number(l.credit) > 0);
        const isReconciled = Boolean(j.reconciled || j.bankTransaction?.reconciled);
        const reconStatus: ReconciliationStatus = isReconciled ? "RECONCILED" : "UNRECONCILED";
        const appStatus: ApprovalStatus = j.status === "DRAFT" ? "PENDING" : "POSTED";
        return {
          id: j.id,
          code: j.reference || `KM-${j.id?.slice(0, 8)}`,
          date: j.date ? new Date(j.date).toISOString().split("T")[0] : "",
          description: j.description || "Penerimaan Kas",
          from: j.sourceDocumentType && j.sourceDocumentType !== "MANUAL" ? j.sourceDocumentType : (j.entityName || "Pelanggan"),
          account: debitLine?.account?.name || "Kas/Bank BCA",
          amount: Number(debitLine?.debit || creditLine?.credit || 0),
          reconciliationStatus: reconStatus,
          approvalStatus: appStatus,
          status: j.status === "DRAFT" ? ("DRAFT" as const) : ("POSTED" as const),
          category: creditLine?.account?.name || "Pendapatan Operasional",
          reference: j.reference || "-",
        };
      });
  }, [journalsRaw]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Form states (SCR-082)
  const initialFormData: CashInFormData = {
    date: new Date().toISOString().split("T")[0],
    account: "BCA Operasional (521-009182)",
    description: "",
    from: "",
    coaRevenue: "4110 - Pendapatan Produksi Maklon",
    memo: "",
    amount: "",
  };

  const [formData, setFormData] = useState<CashInFormData>(initialFormData);

  const totalKasMasuk = useMemo(() => {
    return cashInItems.reduce((acc, r) => acc + r.amount, 0);
  }, [cashInItems]);

  const totalReconciled = useMemo(() => {
    return cashInItems.filter((item) => item.reconciliationStatus === "RECONCILED").length;
  }, [cashInItems]);

  const totalUnreconciled = useMemo(() => {
    return cashInItems.filter((item) => item.reconciliationStatus === "UNRECONCILED").length;
  }, [cashInItems]);

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

  const uniqueAccounts = Array.from(new Set(cashInItems.map((c) => c.account).filter(Boolean))) as string[];
  const uniqueCategories = Array.from(new Set(cashInItems.map((c) => c.category).filter(Boolean))) as string[];
  const uniqueFrom = Array.from(new Set(cashInItems.map((c) => c.from).filter(Boolean))) as string[];

  const filterColumns = [
    {
      key: "account",
      label: "Akun Kas / Bank",
      type: "select" as const,
      options: uniqueAccounts,
    },
    {
      key: "category",
      label: "Kategori Penerimaan",
      type: "select" as const,
      options: uniqueCategories,
    },
    {
      key: "from",
      label: "Diterima Dari (Payer)",
      type: "select" as const,
      options: uniqueFrom,
    },
    {
      key: "amount",
      label: "Urutkan: Nominal Diterima",
      type: "sort_numeric" as const,
    },
    {
      key: "date",
      label: "Urutkan: Tanggal Mutasi",
      type: "sort_alpha" as const,
    },
  ];

  const filteredItems = useMemo(() => {
    let result = cashInItems.filter((item) => {
      // Dedicated Status Filter
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) return false;

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchFrom = item.from.toLowerCase().includes(q);
        const matchAcc = item.account.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchFrom && !matchAcc && !matchCat) return false;
      }

      // Secondary Column Filter
      if (selectedColumn && filterValue && !filterValue.startsWith("sort_")) {
        if (selectedColumn === "account" && item.account !== filterValue) return false;
        if (selectedColumn === "category" && item.category !== filterValue) return false;
        if (selectedColumn === "from" && item.from !== filterValue) return false;
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
  }, [cashInItems, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

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
      const revAcc =
        accountsRaw.find((a: any) => a.type === "REVENUE") || accountsRaw[0];

      if (cashAcc?.id && revAcc?.id) {
        await api.post("/finance/cash/receive", {
          date: new Date(formData.date).toISOString(),
          cashAccountId: cashAcc.id,
          category: "DP_PENJUALAN",
          creditAccountId: revAcc.id,
          amount: Number(formData.amount),
          entityName: formData.from || "Pelanggan",
          notes: formData.description,
        });
      } else {
        await api.post("/finance/journals", {
          date: formData.date,
          reference: `KM-${Date.now().toString().slice(-6)}`,
          description: `Kas Masuk: ${formData.from || "Klien"} - ${formData.description}`,
          lines: [
            {
              accountId: cashAcc?.id || "default-cash",
              debit: Number(formData.amount),
              credit: 0,
            },
            {
              accountId: revAcc?.id || "default-rev",
              debit: 0,
              credit: Number(formData.amount),
            },
          ],
        });
      }

      toast.success(
        "Bukti Kas Bank Masuk berhasil disimpan dan diposting ke Jurnal!"
      );
      refetch();
      setIsCreateModalOpen(false);
      setFormData(initialFormData);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menyimpan kas masuk");
    }
  };

  const handlePrintItem = (item: CashInItem) => {
    toast.success(`Mencetak Bukti Kas Masuk ${item.code}...`);
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
    cashInItems,
    filteredItems,
    totalKasMasuk,
    totalReconciled,
    totalUnreconciled,
    isLoading,
    refetch,
    handleSave,
    handlePrintItem,
  };
}
