"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  LedgerTransaction,
  LedgerAccountSummary,
  LedgerKpiStats,
  DateRange,
} from "../_types/ledger.types";

export function useLedgerOperations() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("1_MONTH");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const [selectedTransaction, setSelectedTransaction] = useState<LedgerTransaction | null>(null);

  // 1. Fetch live detailed trial balance
  const { data: rawTbData, isLoading: isTbLoading, refetch: refetchTb } = useQuery<any>({
    queryKey: ["finance-detailed-tb", startDate, endDate],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/reports/trial-balance/detailed", {
          params: {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        });
        return unwrapResponse<any>(res);
      } catch {
        return null;
      }
    },
  });

  // 2. Fetch all journals to flatten into GL transactions
  const { data: rawJournals = [], isLoading: isJournalsLoading, refetch: refetchJournals } = useQuery<any[]>({
    queryKey: ["finance-journals", startDate, endDate],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/journals", {
          params: {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        });
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  // Build Account Summaries
  const accounts: LedgerAccountSummary[] = useMemo(() => {
    const list = rawTbData?.data || [];
    return list.map((a: any) => {
      const opening = Number(a.awalDebit || 0) - Number(a.awalCredit || 0);
      const debit = Number(a.perubahanDebit || 0);
      const credit = Number(a.perubahanCredit || 0);
      const change = debit - credit;
      const saldo = Number(a.akhirDebit || 0) - Number(a.akhirCredit || 0);

      return {
        accountId: a.id || a.code,
        accountCode: a.code || "-",
        accountName: a.name || "-",
        opening,
        debit,
        credit,
        change,
        saldo,
      };
    });
  }, [rawTbData]);

  // Flatten journals into Ledger Transactions and calculate cumulative running balance per account
  const ledgerTransactions: LedgerTransaction[] = useMemo(() => {
    const allLines: Array<{
      id: string;
      postingDate: string;
      journalRef: string;
      accountCode: string;
      accountName: string;
      description: string;
      debit: number;
      credit: number;
      reconciliationStatus: "RECONCILED" | "UNRECONCILED";
    }> = [];

    rawJournals.forEach((j: any) => {
      const postingDate = j.date ? new Date(j.date).toISOString().split("T")[0] : "-";
      const journalRef = j.reference || j.code || j.id?.slice(0, 12) || "-";
      const lines = j.lines || [];

      lines.forEach((l: any, lIdx: number) => {
        allLines.push({
          id: l.id || `${j.id}-${lIdx}`,
          postingDate,
          journalRef,
          accountCode: l.account?.code || l.accountCode || l.accountId || "-",
          accountName: l.account?.name || l.accountName || "Bagan Akun",
          description: l.description || j.description || "Transaksi Jurnal",
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          reconciliationStatus: j.status === "POSTED" ? "RECONCILED" : "UNRECONCILED",
        });
      });
    });

    // Sort by date ascending to calculate accurate running balance
    allLines.sort((a, b) => a.postingDate.localeCompare(b.postingDate));

    // Calculate running balance per account
    const balanceTracker: Record<string, number> = {};
    
    // Seed initial balance from opening if available
    accounts.forEach((acc) => {
      balanceTracker[acc.accountCode] = acc.opening || 0;
    });

    return allLines.map((line) => {
      const current = balanceTracker[line.accountCode] || 0;
      // Normal balance progression: + Debit - Credit
      const nextBalance = current + line.debit - line.credit;
      balanceTracker[line.accountCode] = nextBalance;

      return {
        ...line,
        runningBalance: nextBalance,
      };
    });
  }, [rawJournals, accounts]);

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
    { value: "ALL", label: "Semua Status Rekon" },
    { value: "RECONCILED", label: "Terekonsiliasi (POSTED)", color: "success" as const },
    { value: "UNRECONCILED", label: "Belum Rekon (DRAFT)", color: "warning" as const },
  ];

  const uniqueAccountCodes = Array.from(new Set(accounts.map((a) => a.accountCode).filter(Boolean))) as string[];

  const filterColumns = [
    {
      key: "accountCode",
      label: "Filter Akun CoA",
      type: "select" as const,
      options: uniqueAccountCodes,
    },
    {
      key: "debit",
      label: "Urutkan: Nominal Debit",
      type: "sort_numeric" as const,
    },
    {
      key: "credit",
      label: "Urutkan: Nominal Kredit",
      type: "sort_numeric" as const,
    },
    {
      key: "runningBalance",
      label: "Urutkan: Saldo Berjalan",
      type: "sort_numeric" as const,
    },
    {
      key: "postingDate",
      label: "Urutkan: Tanggal Posting",
      type: "sort_alpha" as const,
    },
  ];

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let result = ledgerTransactions.filter((tx) => {
      // Dedicated Status Filter
      if (selectedStatus !== "ALL" && tx.reconciliationStatus !== selectedStatus) return false;

      // Secondary Column Filter
      if (selectedColumn && filterValue && !filterValue.startsWith("sort_")) {
        if (selectedColumn === "accountCode" && tx.accountCode !== filterValue) return false;
      }

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = tx.journalRef.toLowerCase().includes(q);
        const matchCode = tx.accountCode.toLowerCase().includes(q);
        const matchName = tx.accountName.toLowerCase().includes(q);
        const matchDesc = tx.description.toLowerCase().includes(q);
        if (!matchRef && !matchCode && !matchName && !matchDesc) return false;
      }

      // Hybrid Date Filter
      if (dateMode !== "ALL" && tx.postingDate && tx.postingDate !== "-") {
        const itemDate = new Date(tx.postingDate);
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
  }, [ledgerTransactions, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  // KPI Calculations
  const kpis: LedgerKpiStats = useMemo(() => {
    let opening = 0;
    let debit = 0;
    let credit = 0;
    let closing = 0;

    const selectedAcc = selectedColumn === "accountCode" && filterValue && !filterValue.startsWith("sort_") ? filterValue : null;

    if (selectedAcc) {
      const acc = accounts.find((a) => a.accountCode === selectedAcc);
      if (acc) {
        opening = acc.opening;
        debit = acc.debit;
        credit = acc.credit;
        closing = acc.saldo;
      }
    } else {
      opening = accounts.reduce((sum, a) => sum + a.opening, 0);
      debit = accounts.reduce((sum, a) => sum + a.debit, 0);
      credit = accounts.reduce((sum, a) => sum + a.credit, 0);
      closing = accounts.reduce((sum, a) => sum + a.saldo, 0);
    }

    return {
      openingBalance: opening,
      totalDebit: debit,
      totalCredit: credit,
      closingBalance: closing,
    };
  }, [accounts, selectedColumn, filterValue]);

  const handleExportExcel = () => {
    const csvHeader = "No,Tanggal Posting,No Jurnal Ref,Kode Akun,Nama Akun CoA,Keterangan Transaksi,Debit,Kredit,Saldo Berjalan,Status Rekon\n";
    const csvRows = filteredTransactions
      .map((tx, idx) => {
        return `${idx + 1},"${tx.postingDate}","${tx.journalRef}","${tx.accountCode}","${tx.accountName.replace(/"/g, '""')}","${tx.description.replace(/"/g, '""')}",${tx.debit},${tx.credit},${tx.runningBalance},"${tx.reconciliationStatus}"`;
      })
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Buku_Besar_GL_${startDate || "ALL"}_${endDate || "ALL"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan Buku Besar berhasil diekspor.");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    refetchTb();
    refetchJournals();
    toast.success("Buku Besar berhasil diperbarui.");
  };

  return {
    accounts,
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
    selectedTransaction,
    setSelectedTransaction,
    filteredTransactions,
    kpis,
    isLoading: isTbLoading || isJournalsLoading,
    handleExportExcel,
    handlePrint,
    handleRefresh,
  };
}
