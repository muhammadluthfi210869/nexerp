"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  ProductionScheduleItem,
  ScheduleStage,
  ScheduleViewMode,
  ScheduleKpis,
  mapToItem,
} from "../_types/schedule.types";

const FALLBACK_SCHEDULES: ProductionScheduleItem[] = [
  {
    id: "sch-1",
    code: "SCH-MIX-001",
    spkCode: "SPK/2026/03/001",
    startDate: "2026-03-25",
    endDate: "2026-03-26",
    soNumber: "SO/2026/03/101",
    customerName: "PT Cantika Glow Nusantara",
    brandName: "Aura Glow",
    productName: "Brightening Facial Serum 30ml",
    targetQty: 5000,
    unit: "Kg",
    stage: "MIXING",
    status: "IN_PROGRESS",
    machineName: "Homogenizer Vessel 500L",
    operator: "Hendra Wijaya",
    progressPct: 65,
    notes: "Proses homogenisasi fase air dan fase minyak",
  },
  {
    id: "sch-2",
    code: "SCH-FIL-002",
    spkCode: "SPK/2026/03/002",
    startDate: "2026-03-27",
    endDate: "2026-03-28",
    soNumber: "SO/2026/03/102",
    customerName: "PT Herbal Estetika Medika",
    brandName: "BioHerb",
    productName: "Acne Clarifying Facial Cleanser 100ml",
    targetQty: 10000,
    unit: "Pcs",
    stage: "FILLING",
    status: "SCHEDULED",
    machineName: "Linear Tube Filler TF-60",
    operator: "Bambang Santoso",
    progressPct: 0,
    notes: "Menunggu rilis QC bulk batch #002",
  },
  {
    id: "sch-3",
    code: "SCH-PCK-003",
    spkCode: "SPK/2026/03/003",
    startDate: "2026-03-26",
    endDate: "2026-03-27",
    soNumber: "SO/2026/03/103",
    customerName: "PT Sinar Kosmetik Prima",
    brandName: "GlowSkin",
    productName: "Hydrating Barrier Gel Cream 50g",
    targetQty: 3000,
    unit: "Pcs",
    stage: "PACKAGING",
    status: "COMPLETED",
    machineName: "Auto Shrink Wrap Line SW-02",
    operator: "Siti Rahma",
    progressPct: 100,
    notes: "Packaging sekunder dan coding batch selesai",
  },
  {
    id: "sch-4",
    code: "SCH-MIX-004",
    spkCode: "SPK/2026/03/004",
    startDate: "2026-03-24",
    endDate: "2026-03-25",
    soNumber: "SO/2026/03/104",
    customerName: "PT Pesona Derma Indonesia",
    brandName: "DermaPure",
    productName: "Sunscreen Invisible Gel SPF 50",
    targetQty: 2500,
    unit: "Kg",
    stage: "MIXING",
    status: "DELAYED",
    machineName: "Vacuum Emulsifier 300L",
    operator: "Ahmad Fauzi",
    progressPct: 30,
    notes: "Menunggu pasokan bahan baku emulsifier",
  },
];

export function useProductionScheduleOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("TABLE");

  // Modals & Drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ProductionScheduleItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formWorkOrderId, setFormWorkOrderId] = useState("");
  const [formMachineId, setFormMachineId] = useState("");
  const [formSpk, setFormSpk] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formStage, setFormStage] = useState<ScheduleStage>("MIXING");
  const [formMachine, setFormMachine] = useState("Homogenizer Vessel 500L");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [formTargetQty, setFormTargetQty] = useState<number>(5000);
  const [formOperator, setFormOperator] = useState("Hendra Wijaya");
  const [formNotes, setFormNotes] = useState("");

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
    { value: "ALL", label: "Semua Status Produksi" },
    { value: "SCHEDULED", label: "Terjadwal", color: "info" as const },
    { value: "IN_PROGRESS", label: "Sedang Berjalan", color: "warning" as const },
    { value: "COMPLETED", label: "Selesai", color: "success" as const },
    { value: "DELAYED", label: "Tertunda / Delay", color: "critical" as const },
  ];

  const { data: serverSchedules = [], isLoading } = useQuery({
    queryKey: ["production-schedules"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          return unwrapped.map(mapToItem);
        }
        return FALLBACK_SCHEDULES;
      } catch (err) {
        return FALLBACK_SCHEDULES;
      }
    },
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["production-schedule-machines"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/machines");
        return unwrapResponse(res) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ["production-schedule-wos"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/work-orders");
        return unwrapResponse(res) || [];
      } catch {
        return [];
      }
    },
  });

  const schedules = serverSchedules.length > 0 ? serverSchedules : FALLBACK_SCHEDULES;

  const uniqueStages = ["MIXING", "FILLING", "PACKAGING"];
  const uniqueMachines = Array.from(new Set(schedules.map((s) => s.machineName).filter(Boolean))) as string[];
  const uniqueOperators = Array.from(new Set(schedules.map((s) => s.operator).filter(Boolean))) as string[];

  const filterColumns = [
    {
      key: "stage",
      label: "Tahapan Line",
      type: "select" as const,
      options: uniqueStages,
    },
    {
      key: "machine",
      label: "Mesin Produksi",
      type: "select" as const,
      options: uniqueMachines,
    },
    {
      key: "operator",
      label: "Operator PIC",
      type: "select" as const,
      options: uniqueOperators,
    },
    {
      key: "targetQty",
      label: "Urutkan: Target Batch Qty",
      type: "sort_numeric" as const,
    },
    {
      key: "startDate",
      label: "Urutkan: Tanggal Mulai",
      type: "sort_alpha" as const,
    },
  ];

  const filteredSchedules = useMemo(() => {
    let result = schedules.filter((sch) => {
      // Dedicated Status Filter
      if (selectedStatus !== "ALL" && sch.status !== selectedStatus) return false;

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = sch.code.toLowerCase().includes(q);
        const matchSpk = sch.spkCode.toLowerCase().includes(q);
        const matchSo = sch.soNumber.toLowerCase().includes(q);
        const matchProduct = sch.productName.toLowerCase().includes(q);
        const matchBrand = sch.brandName.toLowerCase().includes(q);
        const matchCustomer = sch.customerName.toLowerCase().includes(q);
        if (!matchCode && !matchSpk && !matchSo && !matchProduct && !matchBrand && !matchCustomer) return false;
      }

      // Secondary Column Filter
      if (selectedColumn && filterValue && !filterValue.startsWith("sort_")) {
        if (selectedColumn === "stage" && sch.stage !== filterValue) return false;
        if (selectedColumn === "machine" && sch.machineName !== filterValue) return false;
        if (selectedColumn === "operator" && sch.operator !== filterValue) return false;
      }

      // Hybrid Date Filter
      if (dateMode !== "ALL" && sch.startDate) {
        const itemDate = new Date(sch.startDate);
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
          } else if (dateMode === "CUSTOM" && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate < start || itemDate > end) return false;
          }
        }
      }

      return true;
    });

    // Secondary Column Sort
    if (selectedColumn && filterValue && filterValue.startsWith("sort_")) {
      result = [...result].sort((a, b) => {
        if (selectedColumn === "targetQty") {
          return filterValue === "sort_desc" ? b.targetQty - a.targetQty : a.targetQty - b.targetQty;
        }
        if (selectedColumn === "startDate") {
          return filterValue === "sort_desc"
            ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            : new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
        return 0;
      });
    }

    return result;
  }, [schedules, selectedStatus, searchQuery, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const kpis: ScheduleKpis = useMemo(() => {
    return {
      totalActive: schedules.filter((s) => s.status === "IN_PROGRESS" || s.status === "SCHEDULED").length,
      mixingCount: schedules.filter((s) => s.stage === "MIXING").length,
      fillingCount: schedules.filter((s) => s.stage === "FILLING").length,
      packingCount: schedules.filter((s) => s.stage === "PACKAGING").length,
    };
  }, [schedules]);

  const handleOpenDetail = (item: ProductionScheduleItem) => {
    setDetailItem(item);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDrawerOpen(false);
    setDetailItem(null);
  };

  const handleCreateSchedule = async () => {
    if (!formSpk && !formWorkOrderId) {
      toast.error("Nomor SPK atau Work Order wajib dipilih.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/production/schedules", {
        workOrderId: formWorkOrderId || undefined,
        machineId: formMachineId || undefined,
        stage: formStage,
        startTime: formStartDate,
        endTime: formEndDate,
        targetQty: formTargetQty,
        operatorName: formOperator,
        notes: formNotes,
      });

      toast.success("Jadwal produksi baru berhasil diterbitkan!");
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["production-schedules"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal membuat jadwal produksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    schedules,
    filteredSchedules,
    kpis,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedColumn,
    setSelectedColumn,
    filterValue,
    setFilterValue,
    selectedStatus,
    setSelectedStatus,
    statusOptions,
    filterColumns,
    dateMode,
    setDateMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleResetAll,
    viewMode,
    setViewMode,
    isCreateModalOpen,
    setIsCreateModalOpen,
    detailItem,
    isDetailDrawerOpen,
    handleOpenDetail,
    handleCloseDetail,
    isSubmitting,
    handleCreateSchedule,
    // Form props
    formWorkOrderId,
    setFormWorkOrderId,
    formMachineId,
    setFormMachineId,
    formSpk,
    setFormSpk,
    formProduct,
    setFormProduct,
    formStage,
    setFormStage,
    formMachine,
    setFormMachine,
    formStartDate,
    setFormStartDate,
    formEndDate,
    setFormEndDate,
    formTargetQty,
    setFormTargetQty,
    formOperator,
    setFormOperator,
    formNotes,
    setFormNotes,
    machines,
    workOrders,
  };
}
