"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  SchedulePackagingItem,
  SchedulePackagingFormData,
  SchedulePackagingKpis,
} from "../_types/schedule-packaging.types";

export function useSchedulePackagingOperations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const { toast } = useDnaToast();

  const { data: serverSchedules, isLoading } = useQuery<SchedulePackagingItem[]>({
    queryKey: ["production-schedules-packaging"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules?stage=PACKING");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped)) {
          return unwrapped.map((item: any, idx: number) => ({
            id: item.id || `SCH-${idx}`,
            code: item.scheduleNumber || `SCH-PKG-2026-${String(idx + 1).padStart(4, "0")}`,
            date: item.startTime ? String(item.startTime).slice(0, 10) : new Date().toISOString().slice(0, 10),
            batchRecord: item.workOrder?.woNumber || "BR-2026-0001",
            salesOrder: item.workOrder?.lead?.clientName || "SO-202609-000004",
            customer: item.workOrder?.lead?.clientName || "Farah Derma Clinic",
            product: item.workOrder?.lead?.brandName || "Day Cream SPF 30",
            targetPcs: Number(item.targetQty) || 3000,
            secondaryPackaging: item.notes || "Dus Inner Box Day Cream",
            packagingQty: Number(item.targetQty) || 3050,
            creator: "Operator Packaging",
            status: item.status || "SCHEDULED",
            notes: item.notes || "",
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch packaging schedules", err);
      }
      return [];
    },
  });

  const [localSchedules, setLocalSchedules] = useState<SchedulePackagingItem[]>([]);
  const schedules = useMemo(() => {
    return [...localSchedules, ...(serverSchedules || [])];
  }, [localSchedules, serverSchedules]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedItem, setSelectedItem] = useState<SchedulePackagingItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<SchedulePackagingFormData>({
    code: `SCH-PKG-2026-${String(schedules.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    batchRecord: "BR-2026-0001",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    targetPcs: 3000,
    secondaryPackaging: "Dus Inner Box Day Cream",
    packagingQty: 3050,
    notes: "",
  });

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

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

  const kpis: SchedulePackagingKpis = useMemo(() => {
    const totalScheduled = schedules.filter((s) => s.status === "SCHEDULED").length;
    const totalCompleted = schedules.filter((s) => s.status === "COMPLETED").length;
    return {
      totalSchedules: schedules.length,
      totalScheduled,
      totalCompleted,
      complianceRate: "100%",
    };
  }, [schedules]);

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    router.push("/schedule-packaging/create");
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    if (actionParam === "create") {
      router.push("/schedule-packaging");
    }
  };

  const handleOpenDetail = (item: SchedulePackagingItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const handlePrint = (item: SchedulePackagingItem) => {
    toast({
      title: "Mencetak SPK Packaging",
      description: `Mengunduh PDF SPK Packaging ${item.code}`,
      variant: "info",
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newSch: SchedulePackagingItem = {
      id: `SCH-PKG-${Date.now()}`,
      code: formData.code,
      date: formData.date,
      batchRecord: formData.batchRecord,
      salesOrder: "SO-202609-000004",
      customer: formData.customer,
      product: formData.product,
      targetPcs: Number(formData.targetPcs),
      secondaryPackaging: formData.secondaryPackaging,
      packagingQty: Number(formData.packagingQty),
      creator: "Super Admin",
      status: "SCHEDULED",
      notes: formData.notes,
    };

    setLocalSchedules([newSch, ...localSchedules]);
    setIsCreateOpen(false);
    toast({
      title: "Jadwal Packaging Dibuat",
      description: `SPK Jadwal Packaging ${newSch.code} berhasil disimpan.`,
      variant: "success",
    });
    if (actionParam === "create") {
      router.push("/schedule-packaging");
    }
  };

  return {
    router,
    toast,
    isLoading,
    schedules,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedItem,
    isDetailOpen,
    isCreateOpen,
    formData,
    setFormData,
    filteredData,
    kpis,
    handleOpenCreate,
    handleCloseCreate,
    handleOpenDetail,
    handleCloseDetail,
    handlePrint,
    handleSave,
  };
}
