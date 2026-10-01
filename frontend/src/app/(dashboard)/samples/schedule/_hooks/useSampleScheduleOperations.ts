"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import {
  ProductionScheduleItem,
  CreateScheduleFormData,
  ScheduleType,
  mapToScheduleItem,
} from "../_types/schedule.types";

const INITIAL_FORM: CreateScheduleFormData = {
  workOrderId: "",
  machineId: "",
  batchRecordCode: "BR-202603-0012",
  scheduleDate: new Date().toISOString().split("T")[0] + " 08:30",
  targetQtyPcs: 5000,
  nettoPerPcs: 30,
  upscalePercent: 10,
  assignedMachine: "Vacuum Homogenizer Tank #02",
  picOperator: "Ahmad Maulana",
  packagingName: "Botol Dropper 30ml",
  notes: "",
};

export function useSampleScheduleOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<ProductionScheduleItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalScheduleType, setModalScheduleType] = useState<ScheduleType>("MIXING");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateScheduleFormData>(INITIAL_FORM);

  // Queries
  const { data: rawSchedules, isLoading } = useQuery({
    queryKey: ["rnd-production-schedules"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules");
        return unwrapResponse(res.data) as any[];
      } catch (e) {
        return [];
      }
    },
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["production-machines"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/machines");
        return unwrapResponse(res.data) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ["production-work-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/work-orders");
        return unwrapResponse(res.data) || [];
      } catch {
        return [];
      }
    },
  });

  const schedules: ProductionScheduleItem[] = useMemo(() => {
    if (rawSchedules && Array.isArray(rawSchedules)) {
      return rawSchedules.map(mapToScheduleItem);
    }
    return [];
  }, [rawSchedules]);

  // Filtering
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (activeTab === "mixing" && s.scheduleType !== "MIXING") return false;
      if (activeTab === "filling" && s.scheduleType !== "FILLING") return false;
      if (activeTab === "packaging" && s.scheduleType !== "PACKAGING") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          s.scheduleCode.toLowerCase().includes(q) ||
          s.batchRecordCode.toLowerCase().includes(q) ||
          s.clientName.toLowerCase().includes(q) ||
          s.brandName.toLowerCase().includes(q) ||
          s.productName.toLowerCase().includes(q) ||
          s.picOperator.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [schedules, activeTab, searchQuery]);

  // KPIs
  const totalSchedules = schedules.length;
  const mixingCount = schedules.filter((s) => s.scheduleType === "MIXING").length;
  const fillingCount = schedules.filter((s) => s.scheduleType === "FILLING").length;
  const packagingCount = schedules.filter((s) => s.scheduleType === "PACKAGING").length;

  const handleOpenCreateModal = (type: ScheduleType = "MIXING") => {
    setModalScheduleType(type);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleOpenDetailModal = (schedule: ProductionScheduleItem) => {
    setSelectedSchedule(schedule);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  const handleExportExcel = () => {
    exportToCsv({
      filename: `jadwal-pra-produksi-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Jadwal Pra-Produksi & Trial",
      data: filteredSchedules,
      columns: [
        { header: "Kode Jadwal", accessor: "scheduleCode" },
        { header: "Waktu Jadwal", accessor: "scheduleDate" },
        { header: "Tahapan", accessor: "scheduleType" },
        { header: "No. Batch Record", accessor: "batchRecordCode" },
        { header: "Klien", accessor: "clientName" },
        { header: "Brand", accessor: "brandName" },
        { header: "Nama Produk", accessor: "productName" },
        { header: "Target (Pcs)", accessor: "targetQtyPcs" },
        { header: "Mesin Ditugaskan", accessor: "assignedLineOrMachine" },
        { header: "Operator PIC", accessor: "picOperator" },
        { header: "Status", accessor: "status" },
      ],
    });
  };

  const handleCreateSchedule = async () => {
    const selectedWO = workOrders.find((w: any) => w.id === createForm.workOrderId || w.woNumber === createForm.batchRecordCode);
    const workOrderId = selectedWO?.id || createForm.workOrderId || (workOrders[0]?.id || "");
    const selectedMachine = machines.find((m: any) => m.id === createForm.machineId || m.name === createForm.assignedMachine);
    const machineId = selectedMachine?.id || createForm.machineId || (machines[0]?.id || "");

    if (!workOrderId || !machineId) {
      toast.warning("Data Belum Lengkap", "Pilih Work Order dan Mesin produksi yang valid.");
      return;
    }

    try {
      setIsSubmitting(true);
      const startParsed = new Date(createForm.scheduleDate);
      const validDate = isNaN(startParsed.getTime()) ? new Date() : startParsed;
      const startTime = validDate.toISOString();
      const endTime = new Date(validDate.getTime() + 4 * 3600 * 1000).toISOString();

      await api.post("/production/schedules", {
        workOrderId,
        machineId,
        stage: modalScheduleType,
        startTime,
        endTime,
        targetQty: Number(createForm.targetQtyPcs) || 1000,
        upscalePercent: Number(createForm.upscalePercent) || 0,
        notes: createForm.notes || undefined,
      });

      toast.success(
        `Jadwal ${modalScheduleType} Dibuat`,
        `Jadwal ${modalScheduleType} berhasil didaftarkan ke timeline produksi.`
      );
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["rnd-production-schedules"] });
    } catch (err: any) {
      toast.error("Gagal Menerbitkan Jadwal", err?.response?.data?.message || "Terjadi kesalahan pada server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // State
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedSchedule,
    setSelectedSchedule,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    modalScheduleType,
    setModalScheduleType,
    isSubmitting,
    createForm,
    setCreateForm,

    // Data & Computed
    isLoading,
    machines,
    workOrders,
    schedules,
    filteredSchedules,
    totalSchedules,
    mixingCount,
    fillingCount,
    packagingCount,

    // Actions & Handlers
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleOpenDetailModal,
    handleCloseDetailModal,
    handleExportExcel,
    handleCreateSchedule,
  };
}
