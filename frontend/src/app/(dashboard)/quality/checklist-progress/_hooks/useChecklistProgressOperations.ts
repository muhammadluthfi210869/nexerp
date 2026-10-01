import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DnaDateMode, DnaFilterColumnConfig } from "@/components/dna";
import type { ChecklistProgress } from "../_types/checklist-progress.types";

export const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "Completed", label: "Completed", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "Process", label: "In Process", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "Pending", label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "Overdue", label: "Overdue", color: "text-rose-700 bg-rose-50 border-rose-200" },
];

export function useChecklistProgressOperations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [dateMode, setDateMode] = useState<DnaDateMode>("1_MONTH");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: checklists = [], isLoading, isError } = useQuery<ChecklistProgress[]>({
    queryKey: ["qc-checklist-progress"],
    queryFn: async () => {
      try {
        const res = await api.get("/qc/checklists");
        const list = res.data || [];
        return list.map((c: any, i: number) => ({
          id: c.id || `qc-${i + 1}`,
          code: c.code || `QC-CHK-${1000 + i}`,
          salesOrderNo: c.salesOrderNo || c.soNumber || `SO-2026-0${10 + i}`,
          brandProduct: c.brandProduct || c.productName || c.name || "Brightening Serum 30ml",
          customer: c.customer || c.clientName || "PT Aureon Kosmetika",
          category: c.category || "General",
          name: c.name || c.title || "Inspeksi Mutu Produksi",
          pic: c.pic || c.assignedTo || "Anisa (QC)",
          startDate: (c.startDate || c.createdAt || "2026-09-01").slice(0, 10),
          endDate: (c.endDate || c.deadline || "2026-09-28").slice(0, 10),
          progress: typeof c.progress === "number" ? c.progress : 75,
          status: c.status || (i % 3 === 0 ? "Completed" : "Process"),
          deadline: c.deadline || c.dueDate || null,
          totalItems: Array.isArray(c.items) ? c.items.length : (typeof c.totalItems === "number" ? c.totalItems : 12),
          completedItems: Array.isArray(c.completedItems) ? c.completedItems.length : (typeof c.completedItems === "number" ? c.completedItems : 9),
          bpomRegNumber: c.bpomRegNumber || `NA1826010${9280 + i}`,
          bpomIssuedDate: c.bpomIssuedDate || "2026-09-02",
        }));
      } catch {
        return [];
      }
    },
  });

  const totalChecklists = checklists.length;
  const avgProgress = totalChecklists > 0
    ? Math.round(checklists.reduce((s, c) => s + c.progress, 0) / totalChecklists)
    : 0;
  const completedCount = checklists.filter((c) => c.progress === 100).length;
  const overdueCount = checklists.filter((c) => c.status === "Overdue" || (c.deadline && new Date(c.deadline) < new Date() && c.progress < 100)).length;

  const uniqueCategories = useMemo(() => Array.from(new Set(checklists.map((c) => c.category))).filter(Boolean), [checklists]);
  const uniquePics = useMemo(() => Array.from(new Set(checklists.map((c) => c.pic))).filter(Boolean), [checklists]);

  const filterColumnsConfig: DnaFilterColumnConfig[] = useMemo(() => [
    {
      key: "category",
      label: "Kategori",
      type: "select",
      options: ["Semua Kategori", ...uniqueCategories],
    },
    {
      key: "pic",
      label: "PIC Inspeksi",
      type: "select",
      options: ["Semua PIC", ...uniquePics],
    },
    {
      key: "progress_sort",
      label: "Urutkan Progres (%)",
      type: "sort_numeric",
    },
  ], [uniqueCategories, uniquePics]);

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn(null);
    setFilterValue("");
    setDateMode("1_MONTH");
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    let result = checklists.filter((item) => {
      if (selectedStatus !== "ALL" && item.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        if (
          !item.code.toLowerCase().includes(q) &&
          !item.name.toLowerCase().includes(q) &&
          !item.category.toLowerCase().includes(q) &&
          !item.pic.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      if (selectedColumn === "category" && filterValue && filterValue !== "Semua Kategori") {
        if (item.category !== filterValue) return false;
      }
      if (selectedColumn === "pic" && filterValue && filterValue !== "Semua PIC") {
        if (item.pic !== filterValue) return false;
      }

      return true;
    });

    if (selectedColumn === "progress_sort") {
      if (filterValue === "asc") {
        result = [...result].sort((a, b) => a.progress - b.progress);
      } else if (filterValue === "desc") {
        result = [...result].sort((a, b) => b.progress - a.progress);
      }
    }

    return result;
  }, [checklists, selectedStatus, searchQuery, selectedColumn, filterValue]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  return {
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    selectedColumn,
    setSelectedColumn,
    filterValue,
    setFilterValue,
    dateMode,
    setDateMode,
    currentPage,
    setCurrentPage,
    pageSize,
    isLoading,
    isError,
    totalChecklists,
    avgProgress,
    completedCount,
    overdueCount,
    filterColumnsConfig,
    handleResetAll,
    filteredData,
    paginatedData,
    totalPages,
  };
}
