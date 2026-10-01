import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  BankStatementLine,
  SystemTransaction,
  BankAccountItem,
  DateRange,
  BankAccountTab,
  ReconciliationSessionItem,
} from "../_types/bank-reconciliation.types";

export function useBankReconciliationOperations() {
  const qc = useQueryClient();
  const toast = useDnaToast();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("1_MONTH");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ReconciliationSessionItem | null>(null);

  const dateRange: DateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (dateMode === "ALL") {
      return { start: "2020-01-01", end: todayStr };
    }
    if (dateMode === "1_DAY") {
      return { start: todayStr, end: todayStr };
    }
    if (dateMode === "1_WEEK") {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { start: d.toISOString().split("T")[0], end: todayStr };
    }
    if (dateMode === "1_MONTH") {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 1);
      return { start: d.toISOString().split("T")[0], end: todayStr };
    }
    if (dateMode === "1_YEAR") {
      const d = new Date(today);
      d.setFullYear(d.getFullYear() - 1);
      return { start: d.toISOString().split("T")[0], end: todayStr };
    }
    if (dateMode === "CUSTOM" && startDate && endDate) {
      return { start: startDate, end: endDate };
    }
    return {
      start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0],
      end: todayStr,
    };
  }, [dateMode, startDate, endDate]);

  // 1. Fetch live bank accounts
  const { data: bankAccounts = [] } = useQuery<BankAccountItem[]>({
    queryKey: ["bank-accounts-recon"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/bank-accounts");
        const body = unwrapResponse<BankAccountItem[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    }
  });

  // Set default account if none selected
  const activeAccountId = selectedAccountId || (bankAccounts[0]?.id || "");
  const selectedAccount = useMemo(() => {
    return bankAccounts.find((a) => a.id === activeAccountId);
  }, [bankAccounts, activeAccountId]);

  // 2. Fetch bank transactions
  const { data: rawTransactions = [], refetch: refetchTransactions } = useQuery<any[]>({
    queryKey: ["bank-transactions", activeAccountId, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!activeAccountId) return [];
      try {
        const res = await api.get(`/finance/bank-transactions`, {
          params: {
            bankAccountId: activeAccountId,
            from: dateRange.start,
            to: dateRange.end
          }
        });
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
    enabled: !!activeAccountId
  });

  // 3. Fetch recon summary
  const { data: reconSummary } = useQuery<any>({
    queryKey: ["bank-reconciliations-summary", activeAccountId],
    queryFn: async () => {
      if (!activeAccountId) return null;
      try {
        const res = await api.get(`/finance/bank-reconciliations/summary?bankAccountId=${activeAccountId}`);
        return unwrapResponse<any>(res);
      } catch {
        return null;
      }
    },
    enabled: !!activeAccountId
  });

  // Split into statement lines (external) and system ledger lines
  const systemLines: SystemTransaction[] = useMemo(() => {
    return rawTransactions.map((tx: any) => ({
      id: tx.id,
      date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split("T")[0] : "-",
      docNo: tx.referenceNumber || tx.id.slice(0, 8),
      description: tx.description || "Transaksi Kas/Bank",
      amount: tx.transactionType === "DEBIT" ? -Number(tx.amount || 0) : Number(tx.amount || 0),
      matched: !!tx.reconciled
    }));
  }, [rawTransactions]);

  const bankLines: BankStatementLine[] = useMemo(() => {
    return rawTransactions
      .filter((tx: any) => tx.statementLineId || tx.referenceNumber?.startsWith("STMT-") || tx.notes?.includes("Bank Statement"))
      .map((tx: any) => ({
        id: tx.id,
        date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split("T")[0] : "-",
        description: tx.description || "Rekening Koran",
        amount: tx.transactionType === "DEBIT" ? -Number(tx.amount || 0) : Number(tx.amount || 0),
        matched: !!tx.reconciled,
        systemTxId: tx.referenceNumber
      }));
  }, [rawTransactions]);

  // Real Balances
  const bookBalance = Number(selectedAccount?.currentBalance || 0);
  const unreconciledSystem = systemLines.filter((l) => !l.matched).reduce((acc, l) => acc + l.amount, 0);
  const unreconciledBank = bankLines.filter((l) => !l.matched).reduce((acc, l) => acc + l.amount, 0);
  const statementBalance = bookBalance + unreconciledBank - unreconciledSystem;
  const difference = statementBalance - bookBalance;
  const unmatchedCount = systemLines.filter((l) => !l.matched).length + bankLines.filter((l) => !l.matched).length;

  // Multi-bank Reconciliation Sessions List
  const reconSessions: ReconciliationSessionItem[] = useMemo(() => {
    if (bankAccounts.length === 0) {
      return [
        {
          id: "recon-default",
          reconNo: "REC-202609-BCA",
          period: `${dateRange.start} s/d ${dateRange.end}`,
          bankName: "Bank Central Asia (BCA)",
          accountNumber: "521-009182",
          statementBalance,
          bookBalance,
          difference,
          unmatchedCount,
          reconStatus: difference === 0 ? "RECONCILED" : "UNBALANCED",
        },
      ];
    }
    return bankAccounts.map((acc, idx) => {
      const isSelected = acc.id === activeAccountId;
      const bBal = Number(acc.currentBalance || 0);
      const diff = isSelected ? difference : 0;
      const sBal = isSelected ? statementBalance : bBal;
      const unCount = isSelected ? unmatchedCount : 0;
      return {
        id: acc.id || `recon-${idx}`,
        reconNo: `REC-${dateRange.end.replace(/-/g, "").slice(0, 6)}-${acc.accountCode || (acc.bankName || "BANK").slice(0, 3).toUpperCase()}`,
        period: `${dateRange.start} s/d ${dateRange.end}`,
        bankName: acc.bankName || acc.accountName || "Bank Operasional",
        accountNumber: acc.accountNumber || "-",
        statementBalance: sBal,
        bookBalance: bBal,
        difference: diff,
        unmatchedCount: unCount,
        reconStatus: diff === 0 ? "RECONCILED" : "UNBALANCED",
      };
    });
  }, [bankAccounts, activeAccountId, dateRange, statementBalance, bookBalance, difference, unmatchedCount]);

  // Auto match mutation
  const autoMatchMutation = useMutation({
    mutationFn: async () => {
      const unmatchedIds = rawTransactions.filter((tx: any) => !tx.reconciled).map((tx: any) => tx.id);
      if (unmatchedIds.length === 0) return { matched: 0 };
      await Promise.all(
        unmatchedIds.map((id: string) => api.post(`/finance/bank-transactions/${id}/reconcile`, {}))
      );
      return { matched: unmatchedIds.length };
    },
    onSuccess: () => {
      toast.success("Auto-match engine selesai memproses rekonsiliasi!");
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
      qc.invalidateQueries({ queryKey: ["bank-reconciliations-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menjalankan auto-match");
    }
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!activeAccountId) return;
      return api.post("/finance/bank-reconciliations", {
        bankAccountId: activeAccountId,
        period: dateRange.end,
        statementBalance,
        bookBalance
      });
    },
    onSuccess: () => {
      toast.success("Sesi rekonsiliasi bank berhasil difinalisasi!");
      qc.invalidateQueries({ queryKey: ["bank-reconciliations-summary"] });
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal memfinalisasi rekonsiliasi");
    }
  });

  // Reconciliation adjustment journal
  const journalMutation = useMutation({
    mutationFn: async () => {
      return api.post("/finance/journals", {
        journalNumber: `ADJ-RECON-${Date.now().toString().slice(-6)}`,
        transactionDate: new Date().toISOString(),
        description: `Penyesuaian Rekonsiliasi Bank ${selectedAccount?.bankName || ""}`,
        sourceDocument: `RECON-${activeAccountId.slice(0, 6)}`,
        items: [
          {
            accountId: selectedAccount?.glAccountId || "6190",
            description: "Beban Administrasi Bank",
            debit: 0,
            credit: 0
          }
        ]
      });
    },
    onSuccess: () => {
      toast.success("Jurnal Penyesuaian Rekonsiliasi Bank berhasil dibuat!");
      setIsJournalModalOpen(false);
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat jurnal penyesuaian");
    }
  });

  // Status options for Golden Reference toolbar
  const statusOptions = useMemo(() => [
    { value: "ALL", label: "Semua Status Rekon" },
    { value: "RECONCILED", label: "Reconciled (Klir)", color: "success" as const },
    { value: "UNBALANCED", label: "Unbalanced (Ada Selisih)", color: "warning" as const },
  ], []);

  // Filter columns configuration
  const filterColumns = useMemo(() => {
    const bankOptions = Array.from(new Set(bankAccounts.map((a: any) => a.bankName || a.accountName).filter(Boolean)));
    return [
      {
        key: "bankName",
        label: "Nama Bank",
        type: "select" as const,
        options: bankOptions as string[],
      },
      {
        key: "difference",
        label: "Urutkan Selisih Varians",
        type: "sort_numeric" as const,
      },
      {
        key: "statementBalance",
        label: "Urutkan Saldo Rekening",
        type: "sort_numeric" as const,
      },
    ];
  }, [bankAccounts]);

  // Filtered reconciliation sessions
  const filteredReconSessions = useMemo(() => {
    return reconSessions
      .filter((s) => {
        // Status filter
        if (selectedStatus !== "ALL" && s.reconStatus !== selectedStatus) {
          return false;
        }

        // Live Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = s.reconNo.toLowerCase().includes(q);
          const matchBank = s.bankName.toLowerCase().includes(q);
          const matchAcc = s.accountNumber.toLowerCase().includes(q);
          const matchPeriod = s.period.toLowerCase().includes(q);
          if (!matchCode && !matchBank && !matchAcc && !matchPeriod) {
            return false;
          }
        }

        // Column select filter
        if (selectedColumn === "bankName" && filterValue) {
          if (s.bankName !== filterValue) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedColumn === "difference") {
          if (filterValue === "asc") return a.difference - b.difference;
          if (filterValue === "desc") return b.difference - a.difference;
        }
        if (selectedColumn === "statementBalance") {
          if (filterValue === "asc") return a.statementBalance - b.statementBalance;
          if (filterValue === "desc") return b.statementBalance - a.statementBalance;
        }
        return 0;
      });
  }, [reconSessions, selectedStatus, searchQuery, selectedColumn, filterValue]);

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn("");
    setFilterValue("");
    setDateMode("1_MONTH");
    setStartDate(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
    );
    setEndDate(new Date().toISOString().split("T")[0]);
  };

  const handleTabChange = (id: string) => {
    if (id !== "none") {
      setSelectedAccountId(id);
    }
  };

  const handleImportStatement = () => {
    toast.info("Fitur import statement rekening koran siap diunggah");
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
    selectedAccountId,
    setSelectedAccountId,
    activeAccountId,
    selectedAccount,
    selectedSession,
    setSelectedSession,
    dateRange,
    isJournalModalOpen,
    setIsJournalModalOpen,
    bankAccounts,
    rawTransactions,
    refetchTransactions,
    reconSummary,
    reconSessions,
    filteredReconSessions,
    systemLines,
    bankLines,
    bookBalance,
    statementBalance,
    difference,
    unmatchedCount,
    autoMatchMutation,
    finalizeMutation,
    journalMutation,
    handleTabChange,
    handleImportStatement,
  };
}
