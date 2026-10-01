"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  ScheduleFillingItem,
  ScheduleFillingFormData,
  ScheduleFillingKpis,
} from "../_types/schedule-filling.types";

export function useScheduleFillingOperations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const { toast } = useDnaToast();

  const { data: serverSchedules } = useQuery({
    queryKey: ["production-schedules-filling"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules?stage=FILLING");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped)) {
          return unwrapped.map((item: any, idx: number) => ({
            id: item.id || `SCH-${idx}`,
            code: item.scheduleNumber || `SCH-FIL-2026-${String(idx + 1).padStart(4, "0")}`,
            date: item.startTime ? String(item.startTime).slice(0, 10) : new Date().toISOString().slice(0, 10),
            batchRecord: item.workOrder?.woNumber || "BR-2026-0001",
            salesOrder: item.workOrder?.lead?.clientName || "SO-202609-000004",
            customer: item.workOrder?.lead?.clientName || "Farah Derma Clinic",
            product: item.workOrder?.lead?.brandName || "Day Cream SPF 30",
            targetPcs: Number(item.targetQty) || 3000,
            primaryPackaging: item.notes || "Pot Akrilik 15gr Putih",
            packagingQty: Number(item.targetQty) || 3050,
            creator: "Operator Filling",
            status: item.status || "SCHEDULED",
            notes: item.notes || "",
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch filling schedules", err);
      }
      return [];
    },
  });

  const [localSchedules, setLocalSchedules] = useState<ScheduleFillingItem[]>([]);
  const schedules = useMemo(() => {
    return [...localSchedules, ...(serverSchedules || [])];
  }, [localSchedules, serverSchedules]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedItem, setSelectedItem] = useState<ScheduleFillingItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ScheduleFillingFormData>({
    code: `SCH-FIL-2026-${String(schedules.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    batchRecord: "BR-2026-0001",
    customer: "Farah Derma Clinic",
    product: "Day Cream SPF 30",
    targetPcs: 3000,
    primaryPackaging: "Pot Akrilik 15gr Putih",
    packagingQty: 3050,
    notes: "",
  });

  // Keep default code updated if schedules change and modal opens
  useEffect(() => {
    if (isCreateOpen && !formData.code) {
      setFormData((prev) => ({
        ...prev,
        code: `SCH-FIL-2026-${String(schedules.length + 1).padStart(4, "0")}`,
      }));
    }
  }, [isCreateOpen, schedules.length, formData.code]);

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

  const totalScheduled = useMemo(() => schedules.filter((s) => s.status === "SCHEDULED").length, [schedules]);
  const totalCompleted = useMemo(() => schedules.filter((s) => s.status === "COMPLETED").length, [schedules]);

  const kpis: ScheduleFillingKpis = useMemo(
    () => ({
      totalSchedules: schedules.length,
      totalScheduled,
      totalCompleted,
      nozzlePrecision: "99.8%",
    }),
    [schedules.length, totalScheduled, totalCompleted]
  );

  const handleOpenCreate = () => {
    setFormData({
      code: `SCH-FIL-2026-${String(schedules.length + 1).padStart(4, "0")}`,
      date: new Date().toISOString().split("T")[0],
      batchRecord: "BR-2026-0001",
      customer: "Farah Derma Clinic",
      product: "Day Cream SPF 30",
      targetPcs: 3000,
      primaryPackaging: "Pot Akrilik 15gr Putih",
      packagingQty: 3050,
      notes: "",
    });
    setIsCreateOpen(true);
    router.push("/schedule-filling/create");
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    if (actionParam === "create") {
      router.push("/schedule-filling");
    }
  };

  const handleOpenDetail = (item: ScheduleFillingItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const handlePrint = (item: ScheduleFillingItem) => {
    toast({
      title: "Mencetak SPK Filling",
      description: `Mengunduh PDF SPK Filling ${item.code}`,
      variant: "info",
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newSch: ScheduleFillingItem = {
      id: `SCH-FIL-${Date.now()}`,
      code: formData.code,
      date: formData.date,
      batchRecord: formData.batchRecord,
      salesOrder: "SO-202609-000004",
      customer: formData.customer,
      product: formData.product,
      targetPcs: Number(formData.targetPcs),
      primaryPackaging: formData.primaryPackaging,
      packagingQty: Number(formData.packagingQty),
      creator: "Super Admin",
      status: "SCHEDULED",
      notes: formData.notes,
    };

    setLocalSchedules((prev) => [newSch, ...prev]);
    setIsCreateOpen(false);
    toast({
      title: "Jadwal Filling Dibuat",
      description: `SPK Jadwal Filling ${newSch.code} berhasil disimpan.`,
      variant: "success",
    });
    if (actionParam === "create") {
      router.push("/schedule-filling");
    }
  };

  return {
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
