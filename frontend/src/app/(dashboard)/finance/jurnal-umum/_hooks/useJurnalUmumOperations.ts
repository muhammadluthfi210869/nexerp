import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  JournalHeader,
  JournalEntryLine,
  JournalLineForm,
  JournalHeaderForm,
  AccountOption,
} from "../_types/jurnal-umum.types";

export function useJurnalUmumOperations() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalHeader | null>(null);

  // 1. Fetch live COA accounts for form selector
  const { data: accounts = [] } = useQuery<AccountOption[]>({
    queryKey: ["finance-accounts"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/accounts");
        const body = unwrapResponse<AccountOption[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    }
  });

  // 2. Fetch live Journal Entries from BE
  const { data: rawJournals = [], isLoading } = useQuery<any[]>({
    queryKey: ["finance-journals"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/journals");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    }
  });

  const journals: JournalHeader[] = useMemo(() => {
    return rawJournals.map((j: any) => {
      const lines: JournalEntryLine[] = (j.lines || []).map((l: any) => ({
        id: l.id,
        accountCode: l.account?.code || l.accountId || "-",
        accountName: l.account?.name || "Bagan Akun",
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        lineDescription: l.description || j.description || "-"
      }));

      const totalDebit = lines.reduce((acc, l) => acc + l.debit, 0);
      const totalCredit = lines.reduce((acc, l) => acc + l.credit, 0);

      let mappedType: JournalHeader["type"] = "MANUAL";
      const src = j.sourceDocumentType || "";
      if (src.includes("AR") || src.includes("INVOICE")) mappedType = "AUTO_AR";
      else if (src.includes("AP") || src.includes("BILL")) mappedType = "AUTO_AP";
      else if (src.includes("PROD") || src.includes("STOCK")) mappedType = "AUTO_STOCK";
      else if (src.includes("ADJ") || src.includes("RECON")) mappedType = "ADJUSTMENT";

      return {
        id: j.id,
        code: j.reference || j.id.slice(0, 12),
        date: j.date ? new Date(j.date).toISOString().split("T")[0] : "-",
        description: j.description || "Jurnal Umum",
        reference: j.reference || "-",
        type: mappedType,
        status: (j.status || "POSTED") as "POSTED" | "DRAFT",
        totalDebit,
        totalCredit,
        createdBy: j.createdBy || "Finance System",
        lines
      };
    });
  }, [rawJournals]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
    const type = searchParams.get("type");
    if (type === "adjustment") {
      setSelectedColumn("type");
      setFilterValue("ADJUSTMENT");
    }
  }, [searchParams]);

  // Form states
  const [headerForm, setHeaderForm] = useState<JournalHeaderForm>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    reference: ""
  });

  const [linesForm, setLinesForm] = useState<JournalLineForm[]>([
    { id: "1", accountId: "", accountCode: "1120", accountName: "Kas / Bank", debit: 0, credit: 0, lineDescription: "" },
    { id: "2", accountId: "", accountCode: "4110", accountName: "Pendapatan / Biaya", debit: 0, credit: 0, lineDescription: "" }
  ]);

  const formTotalDebit = useMemo(() => linesForm.reduce((acc, l) => acc + (Number(l.debit) || 0), 0), [linesForm]);
  const formTotalCredit = useMemo(() => linesForm.reduce((acc, l) => acc + (Number(l.credit) || 0), 0), [linesForm]);
  const isFormBalanced = formTotalDebit > 0 && formTotalDebit === formTotalCredit;

  const totalDebitBulanIni = useMemo(() => journals.reduce((acc, j) => acc + j.totalDebit, 0), [journals]);
  const totalCreditBulanIni = useMemo(() => journals.reduce((acc, j) => acc + j.totalCredit, 0), [journals]);

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
    { value: "ALL", label: "Semua Status Posting" },
    { value: "POSTED", label: "Telah Diposting (GL)", color: "success" as const },
    { value: "DRAFT", label: "Draft Jurnal", color: "warning" as const },
  ];

  const filterColumns = [
    {
      key: "type",
      label: "Tipe Referensi",
      type: "select" as const,
      options: ["MANUAL", "AUTO_AR", "AUTO_AP", "AUTO_STOCK", "ADJUSTMENT"],
    },
    {
      key: "totalDebit",
      label: "Urutkan: Total Debit",
      type: "sort_numeric" as const,
    },
    {
      key: "totalCredit",
      label: "Urutkan: Total Kredit",
      type: "sort_numeric" as const,
    },
    {
      key: "date",
      label: "Urutkan: Tanggal Jurnal",
      type: "sort_alpha" as const,
    },
  ];

  const filteredJournals = useMemo(() => {
    let result = journals.filter((j) => {
      // Dedicated Status Filter
      if (selectedStatus !== "ALL" && j.status !== selectedStatus) return false;

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = j.code.toLowerCase().includes(q);
        const matchDesc = j.description.toLowerCase().includes(q);
        const matchRef = j.reference.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchRef) return false;
      }

      // Secondary Column Filter
      if (selectedColumn && filterValue && !filterValue.startsWith("sort_")) {
        if (selectedColumn === "type" && j.type !== filterValue) return false;
      }

      // Hybrid Date Filter
      if (dateMode !== "ALL" && j.date && j.date !== "-") {
        const itemDate = new Date(j.date);
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

    // Handle column sorting
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
  }, [journals, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const addRow = () => {
    setLinesForm([
      ...linesForm,
      { id: Date.now().toString(), accountId: "", accountCode: "", accountName: "Pilih Akun", debit: 0, credit: 0, lineDescription: "" }
    ]);
  };

  const removeRow = (index: number) => {
    if (linesForm.length <= 2) {
      toast.error("Minimal harus terdapat 2 baris akun!");
      return;
    }
    setLinesForm(linesForm.filter((_, i) => i !== index));
  };

  // Mutation to create journal entry
  const createJournalMutation = useMutation({
    mutationFn: async () => {
      const mappedLines = linesForm.map((line) => {
        // Resolve valid account ID
        const matched = accounts.find((a: any) => a.code === line.accountCode || a.id === line.accountId);
        const accountId = matched?.id || line.accountId || accounts[0]?.id;
        return {
          accountId,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0
        };
      });

      return api.post("/finance/journals", {
        date: new Date(headerForm.date).toISOString(),
        description: headerForm.description,
        reference: headerForm.reference || undefined,
        lines: mappedLines
      });
    },
    onSuccess: () => {
      toast.success("Jurnal Umum berhasil disimpan dan diposting ke Buku Besar!");
      qc.invalidateQueries({ queryKey: ["finance-journals"] });
      setIsCreateModalOpen(false);
      setHeaderForm({
        date: new Date().toISOString().split("T")[0],
        description: "",
        reference: ""
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat jurnal umum");
    }
  });

  const handleSaveJournal = () => {
    if (!isFormBalanced) {
      toast.error("Total Debit harus sama dengan Total Kredit (Balanced)!");
      return;
    }
    if (!headerForm.description) {
      toast.error("Mohon isi deskripsi jurnal!");
      return;
    }
    createJournalMutation.mutate();
  };

  const handlePrint = () => {
    window.print();
  };

  return {
    // State
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
    selectedJournal,
    setSelectedJournal,
    headerForm,
    setHeaderForm,
    linesForm,
    setLinesForm,
    accounts,
    isLoading,
    journals,
    filteredJournals,
    formTotalDebit,
    formTotalCredit,
    isFormBalanced,
    totalDebitBulanIni,
    totalCreditBulanIni,
    createJournalMutation,
    // Actions
    addRow,
    removeRow,
    handleSaveJournal,
    handlePrint,
  };
}

export type JurnalUmumOperations = ReturnType<typeof useJurnalUmumOperations>;
