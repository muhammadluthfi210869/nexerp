"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import { useAuth } from "@/hooks/useAuth";
import type {
  LabTestResult,
  LabTestFormData,
  FormulaItem,
} from "../_types/lab-test.types";

const INITIAL_FORM_STATE: LabTestFormData = {
  formulaId: "",
  batchNumber: "",
  productName: "",
  testType: "Fisikokimia & Organoleptik",
  parameterName: "pH, Viskositas, Densitas, Organoleptik, Mikro",
  actualPh: "5.50",
  actualViscosity: "4200",
  actualDensity: "1.02",
  microbiologyResult: "ALT < 10 CFU/g (Negatif Patogen)",
  colorResult: "Bening Sedikit Kekuningan",
  aromaResult: "Khas Chamomile Lembut",
  textureResult: "Gel Ringan & Mudah Meresap",
  standardSpec: "pH 5.0 - 6.5 | Visk 3500-5000 cps | ALT < 100",
  stability40C: "STABLE",
  stabilityRT: "STABLE",
  stability4C: "STABLE",
  status: "PASS",
  notes: "",
};

export function useLabTestOperations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useDnaToast();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedFormulaId, setSelectedFormulaId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<LabTestResult | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [form, setForm] = useState<LabTestFormData>(INITIAL_FORM_STATE);

  const { data: formulas } = useQuery<FormulaItem[]>({
    queryKey: ["formulas"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/formulas");
        const raw = res.data?.data || res.data || [];
        return Array.isArray(raw) ? raw : [];
      } catch {
        return [];
      }
    },
  });

  // Set default formula once loaded
  useEffect(() => {
    if (!selectedFormulaId && Array.isArray(formulas) && formulas.length > 0) {
      setSelectedFormulaId(formulas[0].id);
    }
  }, [formulas, selectedFormulaId]);

  const { data: rawResults, isLoading, refetch } = useQuery({
    queryKey: ["lab-test-results", selectedFormulaId],
    queryFn: async () => {
      if (!selectedFormulaId) return [];
      try {
        const res = await api.get(`/rnd/lab-test-results/${selectedFormulaId}`);
        const data = res.data?.data || res.data || [];
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedFormulaId,
  });

  const results: LabTestResult[] = useMemo(() => {
    const list = Array.isArray(rawResults) ? rawResults : [];
    const activeFormula = formulas?.find((f) => f.id === selectedFormulaId);

    return list.map((r, idx) => {
      const isStable =
        r.stability40C === "STABLE" &&
        r.stabilityRT === "STABLE" &&
        r.stability4C === "STABLE";

      return {
        ...r,
        testNumber: r.testNumber || `LAB-${new Date(r.testDate || Date.now()).getFullYear()}-${String(idx + 1).padStart(3, "0")}`,
        batchNumber: r.batchNumber || r.formulaCode || activeFormula?.formulaCode || `BATCH-${r.formulaId?.slice(0, 6) || "QC"}`,
        productName: r.productName || r.formulaName || activeFormula?.name || activeFormula?.productName || "Formula Sample",
        testType: r.testType || "Fisikokimia & Mikro",
        parameterName: r.parameterName || "pH, Viskositas, Organoleptik, ALT",
        actualValue: r.actualValue || `pH ${r.actualPh || "5.5"} / ${r.actualViscosity || "4200"} cps`,
        standardSpec: r.standardSpec || "pH 5.0 - 6.5 / 3500 - 5000 cps",
        microbiologyResult: r.microbiologyResult || "ALT < 10 CFU/g (Negatif)",
        status: isStable ? ("PASS" as const) : ("UNSTABLE" as const),
      };
    });
  }, [rawResults, formulas, selectedFormulaId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post("/rnd/lab-test-results", {
        ...form,
        formulaId: selectedFormulaId || form.formulaId,
        testerId: user?.id,
      });
    },
    onSuccess: () => {
      toast.success(
        "Uji Lab Disimpan",
        "Hasil analisis laboratorium berhasil dicatat."
      );
      queryClient.invalidateQueries({ queryKey: ["lab-test-results"] });
      setIsModalOpen(false);
      setForm(INITIAL_FORM_STATE);
    },
    onError: (err: any) => {
      toast.error(
        "Gagal Menyimpan",
        err.response?.data?.message || "Terjadi kesalahan."
      );
    },
  });

  const handleResetAll = () => {
    setSearch("");
    setSelectedStatus("ALL");
    setSelectedColumn("");
    setFilterValue("");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  const statusOptions = [
    { value: "ALL", label: "Semua Hasil QC" },
    { value: "PASS", label: "Lolos Baku Mutu (LULUS)", color: "success" as const },
    { value: "UNSTABLE", label: "Perlu Review / Evaluasi", color: "critical" as const },
    { value: "CONDITIONAL", label: "Lulus Bersyarat", color: "warning" as const },
  ];

  const uniqueTestTypes = Array.from(new Set(results.map((r) => r.testType).filter(Boolean))) as string[];
  const uniqueTesters = Array.from(new Set(results.map((r) => r.tester?.fullName).filter(Boolean))) as string[];

  const filterColumns = [
    {
      key: "testType",
      label: "Tipe Pengujian",
      type: "select" as const,
      options: uniqueTestTypes,
    },
    {
      key: "tester",
      label: "Petugas / Tester Lab",
      type: "select" as const,
      options: uniqueTesters,
    },
    {
      key: "actualPh",
      label: "Urutkan: Nilai pH",
      type: "sort_numeric" as const,
    },
    {
      key: "testDate",
      label: "Urutkan: Tanggal Uji",
      type: "sort_alpha" as const,
    },
  ];

  const filteredResults = useMemo(() => {
    let list = results.filter((r) => {
      const isStable =
        r.stability40C === "STABLE" &&
        r.stabilityRT === "STABLE" &&
        r.stability4C === "STABLE";

      // Dedicated Status Filter
      if (selectedStatus !== "ALL") {
        if (selectedStatus === "PASS" && !(r.status === "PASS" || isStable)) return false;
        if (selectedStatus === "UNSTABLE" && isStable) return false;
        if (selectedStatus === "CONDITIONAL" && r.status !== "CONDITIONAL") return false;
      }

      // Keyword Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSearch =
          (r.testNumber && r.testNumber.toLowerCase().includes(q)) ||
          (r.actualPh && r.actualPh.toLowerCase().includes(q)) ||
          (r.productName && r.productName.toLowerCase().includes(q)) ||
          (r.batchNumber && r.batchNumber.toLowerCase().includes(q)) ||
          (r.colorResult && r.colorResult.toLowerCase().includes(q)) ||
          (r.tester?.fullName && r.tester.fullName.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Secondary Column Filter
      if (selectedColumn && filterValue && !filterValue.startsWith("sort_")) {
        if (selectedColumn === "testType" && r.testType !== filterValue) return false;
        if (selectedColumn === "tester" && r.tester?.fullName !== filterValue) return false;
      }

      // Hybrid Date Filter
      if (dateMode !== "ALL" && r.testDate) {
        const itemDate = new Date(r.testDate);
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
        list = [...list].sort((a: any, b: any) => {
          const valA = a[selectedColumn] ?? "";
          const valB = b[selectedColumn] ?? "";
          return typeof valA === "number" ? valA - valB : String(valA).localeCompare(String(valB));
        });
      } else if (filterValue === "sort_numeric_desc" || filterValue === "sort_alpha_desc") {
        list = [...list].sort((a: any, b: any) => {
          const valA = a[selectedColumn] ?? "";
          const valB = b[selectedColumn] ?? "";
          return typeof valA === "number" ? valB - valA : String(valB).localeCompare(String(valA));
        });
      }
    }

    return list;
  }, [results, search, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const totalTests = results.length;
  const stableTests = results.filter(
    (r) =>
      r.stability40C === "STABLE" &&
      r.stabilityRT === "STABLE" &&
      r.stability4C === "STABLE"
  ).length;
  const unstableTests = totalTests - stableTests;
  const activeFormula = formulas?.find((f) => f.id === selectedFormulaId);

  const handleOpenCreateModal = () => {
    setForm({
      ...INITIAL_FORM_STATE,
      formulaId: selectedFormulaId,
      productName: activeFormula?.name || activeFormula?.productName || "",
      batchNumber: activeFormula?.formulaCode || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenDetailDrawer = (result: LabTestResult) => {
    setSelectedResult(result);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
    setSelectedResult(null);
  };

  const handleSubmitForm = () => {
    createMutation.mutate();
  };

  return {
    search,
    setSearch,
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
    selectedFormulaId,
    setSelectedFormulaId,
    isModalOpen,
    selectedResult,
    isDetailDrawerOpen,
    form,
    setForm,
    formulas,
    results,
    filteredResults,
    isLoading,
    isPending: createMutation.isPending,
    totalTests,
    stableTests,
    unstableTests,
    refetch,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleOpenDetailDrawer,
    handleCloseDetailDrawer,
    handleSubmitForm,
  };
}
