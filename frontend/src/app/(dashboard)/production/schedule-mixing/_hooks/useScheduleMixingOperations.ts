"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  ScheduleMixingItem,
  ScheduleMixingFormData,
  ScheduleMixingKpiData,
} from "../_types/schedule-mixing.types";

export function useScheduleMixingOperations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const { toast } = useDnaToast();

  const { data: serverSchedules, isLoading } = useQuery({
    queryKey: ["production-schedules-mixing"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules?stage=MIXING");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped)) {
          return unwrapped.map((item: any, idx: number) => ({
            id: item.id || `SCH-${idx}`,
            code: item.scheduleNumber || `SCH-MIX-2026-${String(idx + 1).padStart(4, "0")}`,
            date: item.startTime ? String(item.startTime).slice(0, 10) : new Date().toISOString().slice(0, 10),
            batchRecord: item.workOrder?.woNumber || "BR-2026-0001",
            salesOrder: item.workOrder?.lead?.clientName || "SO-202609-000004",
            customer: item.workOrder?.lead?.clientName || "Farah Derma Clinic",
            product: item.workOrder?.lead?.brandName || "Day Cream SPF 30",
            targetPcs: Number(item.targetQty) || 3000,
            upscalePercent: Number(item.upscalePercent) || 0,
            upscaleResult: Number(item.upscaleResult) || Number(item.targetQty) || 3000,
            unit: "kg",
            status: item.status || "SCHEDULED",
            notes: item.notes || "",
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch mixing schedules", err);
      }
      return [];
    },
  });

  const [localSchedules, setLocalSchedules] = useState<ScheduleMixingItem[]>([]);
  const schedules = useMemo(() => {
    return [...localSchedules, ...(serverSchedules || [])];
  }, [localSchedules, serverSchedules]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedItem, setSelectedItem] = useState<ScheduleMixingItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ScheduleMixingFormData>({
    code: `SCH-MIX-2026-${String(schedules.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    batchRecord: "BR-2026-0001",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    targetPcs: 3000,
    nettoPerPcs: 100, // gr
    upscalePercent: 10,
    notes: "",
  });

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  // Base Result = (targetPcs * nettoPerPcs) / 1000 in kg
  const baseResult = (formData.targetPcs * formData.nettoPerPcs) / 1000;
  // Upscale Result = baseResult * (1 + upscalePercent / 100)
  const calculatedUpscale = baseResult * (1 + formData.upscalePercent / 100);

  const filteredData = useMemo(() => {
    return schedules.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchRecord.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [schedules, searchTerm, statusFilter]);

  const totalScheduled = schedules.filter((s) => s.status === "SCHEDULED").length;
  const totalCompleted = schedules.filter((s) => s.status === "COMPLETED").length;

  const kpis: ScheduleMixingKpiData = useMemo(() => ({
    totalSchedules: schedules.length,
    totalScheduled,
    totalCompleted,
  }), [schedules.length, totalScheduled, totalCompleted]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newSch: ScheduleMixingItem = {
      id: `SCH-${Date.now()}`,
      code: formData.code,
      date: formData.date,
      batchRecord: formData.batchRecord,
      salesOrder: "SO-202609-000004",
      customer: formData.customer,
      product: formData.product,
      targetPcs: Number(formData.targetPcs),
      upscalePercent: Number(formData.upscalePercent),
      upscaleResult: Number(calculatedUpscale.toFixed(2)),
      unit: "kg",
      status: "SCHEDULED",
      notes: formData.notes,
    };

    setLocalSchedules([newSch, ...localSchedules]);
    setIsCreateOpen(false);
    toast({
      title: "Jadwal Mixing Dibuat",
      description: `SPK Jadwal Mixing ${newSch.code} berhasil disimpan.`,
      variant: "success",
    });
    if (actionParam === "create") {
      router.push("/schedule-mixing");
    }
  };

  const handleOpenDetail = (item: ScheduleMixingItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    router.push("/schedule-mixing/create");
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    if (actionParam === "create") {
      router.push("/schedule-mixing");
    }
  };

  const handlePrint = (item: ScheduleMixingItem) => {
    toast({
      title: "Mencetak SPK Mixing",
      description: `Mengunduh PDF SPK Mixing ${item.code}`,
      variant: "info",
    });
  };

  return {
    schedules,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredData,
    kpis,
    selectedItem,
    isDetailOpen,
    isCreateOpen,
    formData,
    setFormData,
    baseResult,
    calculatedUpscale,
    handleSave,
    handleOpenDetail,
    handleCloseDetail,
    handleOpenCreate,
    handleCloseCreate,
    handlePrint,
  };
}
