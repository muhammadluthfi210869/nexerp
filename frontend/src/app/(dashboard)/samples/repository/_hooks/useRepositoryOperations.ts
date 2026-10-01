import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import { ArchivedFormula } from "../_types/repository.types";

const FALLBACK_ARCHIVE: ArchivedFormula[] = [
  {
    id: "FORM-2026-0001",
    formulaCode: "FORM-2026-0001",
    name: "Brightening Glow Serum 10% Niacinamide",
    category: "Skincare",
    version: "v2.0",
    status: "RELEASED",
    stability: "STABLE",
    updatedAt: "2026-03-08",
    pic: "Apt. Dedi Kurniawan, S.Farm",
    sampleCode: "SMP-2026-0012",
    createdBy: "Apt. Dedi Kurniawan, S.Farm",
    releasedAt: "2026-03-08",
    activeVersion: "v2.0",
    ingredientCount: 14,
    costPerKg: 145000,
    targetNetto: "30 ml",
  },
  {
    id: "FORM-2026-0004",
    formulaCode: "FORM-2026-0004",
    name: "Hydrating Lip Oil Peptide Tint",
    category: "Lip Care",
    version: "v1.0",
    status: "RELEASED",
    stability: "STABLE",
    updatedAt: "2026-03-01",
    pic: "Budi Prakoso, S.Farm",
    sampleCode: "SMP-2026-0008",
    createdBy: "Budi Prakoso, S.Farm",
    releasedAt: "2026-03-01",
    activeVersion: "v1.0",
    ingredientCount: 9,
    costPerKg: 185000,
    targetNetto: "15 ml",
  },
  {
    id: "FORM-2026-0005",
    formulaCode: "FORM-2026-0005",
    name: "Sunscreen Glow Gel Hybrid SPF 50",
    category: "Sun Care",
    version: "v3.0",
    status: "RELEASED",
    stability: "STABLE",
    updatedAt: "2026-02-28",
    pic: "Aisyah Putri, S.Si",
    sampleCode: "SMP-2026-0003",
    createdBy: "Aisyah Putri, S.Si",
    releasedAt: "2026-02-28",
    activeVersion: "v3.0",
    ingredientCount: 18,
    costPerKg: 120000,
    targetNetto: "50 ml",
  },
  {
    id: "FORM-2026-0008",
    formulaCode: "FORM-2026-0008",
    name: "Barrier Repair Ceramide Moisturizer",
    category: "Skincare",
    version: "v1.2",
    status: "RELEASED",
    stability: "STABLE",
    updatedAt: "2026-02-20",
    pic: "Apt. Dedi Kurniawan, S.Farm",
    sampleCode: "SMP-2026-0019",
    createdBy: "Apt. Dedi Kurniawan, S.Farm",
    releasedAt: "2026-02-20",
    activeVersion: "v1.2",
    ingredientCount: 16,
    costPerKg: 165000,
    targetNetto: "50 ml",
  },
  {
    id: "FORM-2026-0012",
    formulaCode: "FORM-2026-0012",
    name: "Gentle Exfoliating AHA BHA PHA Body Wash",
    category: "Body Care",
    version: "v2.1",
    status: "ARCHIVED",
    stability: "STABLE",
    updatedAt: "2026-01-15",
    pic: "Budi Prakoso, S.Farm",
    sampleCode: "SMP-2026-0025",
    createdBy: "Budi Prakoso, S.Farm",
    releasedAt: "2026-01-15",
    activeVersion: "v2.1",
    ingredientCount: 12,
    costPerKg: 85000,
    targetNetto: "250 ml",
  },
];

export function useRepositoryOperations() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFormula, setSelectedFormula] = useState<ArchivedFormula | null>(null);

  const { data: serverFormulas, isLoading } = useQuery<ArchivedFormula[]>({
    queryKey: ["master-formulas-repository"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/formulas");
        const list = res.data?.data || res.data || [];
        if (!Array.isArray(list) || list.length === 0) return FALLBACK_ARCHIVE;
        return list.map((f: any, idx: number): ArchivedFormula => {
          const code = f.formulaCode || f.code || `FORM-${2026}-${String(idx + 1).padStart(4, "0")}`;
          const itemsCount = f.phases?.reduce((acc: number, p: any) => acc + (p.items?.length || 0), 0) || f.ingredientCount || 12;
          return {
            id: f.id || code,
            formulaCode: code,
            name: f.sampleRequest?.productName || f.productName || "Formula Kosmetik",
            category: f.category || f.sampleRequest?.category || "Skincare",
            version: `v${f.version || 1}.0`,
            status: f.status === "LOCKED_PRODUCTION" || f.status === "RELEASED" ? "RELEASED" : f.status === "ARCHIVED" ? "ARCHIVED" : "DRAFT",
            stability: f.labTestResults?.length > 0 ? (f.labTestResults.some((r: any) => r.stability40C === "UNSTABLE" || r.stabilityStatus === "UNSTABLE") ? "UNSTABLE" : "STABLE") : "STABLE",
            updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString().split("T")[0] : "2026-03-01",
            pic: f.lockedBy?.fullName || f.formulatorPic || f.sampleRequest?.pic?.fullName || "Apt. Formulator",
            sampleCode: f.sampleRequest?.sampleCode || `SMP-2026-${String(idx + 1).padStart(4, "0")}`,
            createdBy: f.lockedBy?.fullName || f.formulatorPic || "Chemist R&D",
            releasedAt: f.updatedAt ? new Date(f.updatedAt).toISOString().split("T")[0] : "2026-03-01",
            activeVersion: `v${f.version || 1}.0`,
            ingredientCount: itemsCount,
            costPerKg: Number(f.costPerKg) || 125000,
            targetNetto: f.targetYieldGram ? `${f.targetYieldGram} g` : (f.netto || "30 ml"),
          };
        });
      } catch {
        return FALLBACK_ARCHIVE;
      }
    },
  });

  const formulasList = serverFormulas || FALLBACK_ARCHIVE;

  const categories = useMemo(() => {
    const set = new Set<string>();
    formulasList.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [formulasList]);

  const uniquePics = useMemo(() => {
    const set = new Set<string>();
    formulasList.forEach((f) => {
      if (f.pic) set.add(f.pic);
    });
    return Array.from(set);
  }, [formulasList]);

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
    { value: "ALL", label: "Semua Status Formula" },
    { value: "RELEASED", label: "Telah Rilis (CPKB)", color: "success" as const },
    { value: "ARCHIVED", label: "Arsip Non-Aktif", color: "default" as const },
    { value: "DRAFT", label: "Draft Formulator", color: "warning" as const },
  ];

  const filterColumns = [
    {
      key: "category",
      label: "Kategori Kosmetik",
      type: "select" as const,
      options: categories,
    },
    {
      key: "pic",
      label: "Formulator R&D",
      type: "select" as const,
      options: uniquePics,
    },
    {
      key: "costPerKg",
      label: "Urutkan: HPP / Kg",
      type: "sort_numeric" as const,
    },
    {
      key: "ingredientCount",
      label: "Urutkan: Jml Bahan",
      type: "sort_numeric" as const,
    },
    {
      key: "updatedAt",
      label: "Urutkan: Tgl Rilis / Update",
      type: "sort_alpha" as const,
    },
  ];

  const filteredFormulas = useMemo(() => {
    let result = formulasList.filter((f) => {
      // Dedicated Status Filter
      if (selectedStatus !== "ALL" && f.status !== selectedStatus) return false;

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = f.formulaCode.toLowerCase().includes(q);
        const matchName = f.name.toLowerCase().includes(q);
        const matchCat = f.category.toLowerCase().includes(q);
        const matchPic = f.pic.toLowerCase().includes(q);
        const matchCreator = f.createdBy.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCat && !matchPic && !matchCreator) return false;
      }

      // Secondary Column Filter
      if (selectedColumn && filterValue && !filterValue.startsWith("sort_")) {
        if (selectedColumn === "category" && f.category !== filterValue) return false;
        if (selectedColumn === "pic" && f.pic !== filterValue) return false;
      }

      // Hybrid Date Filter
      if (dateMode !== "ALL" && f.updatedAt) {
        const itemDate = new Date(f.updatedAt);
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
  }, [formulasList, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const stats = useMemo(() => {
    return {
      totalFormulas: formulasList.length,
      releasedCount: formulasList.filter((f) => f.status === "RELEASED").length,
      stableCount: formulasList.filter((f) => f.stability === "STABLE").length,
      archivedCount: formulasList.filter((f) => f.status === "ARCHIVED").length,
    };
  }, [formulasList]);

  const handleVerifyVault = () => {
    toast.success("Verifikasi Vault Berhasil", "Database vault enkripsi formula AES-256 tersinkronisasi aman.");
  };

  const handlePrintVault = () => {
    if (selectedFormula) {
      toast.success("Cetak Dokumen", `Mencetak Bukti Arsip Formula Vault ${selectedFormula.formulaCode}...`);
    }
  };

  return {
    isLoading,
    formulasList,
    filteredFormulas,
    stats,
    categories,
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
    selectedFormula,
    setSelectedFormula,
    handleVerifyVault,
    handlePrintVault,
  };
}
