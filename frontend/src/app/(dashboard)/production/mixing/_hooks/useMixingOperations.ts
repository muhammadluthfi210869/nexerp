"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import { MixingProductionItem, MixingKpis } from "../_types/mixing.types";

const INITIAL_MIXING_DATA: MixingProductionItem[] = [];

export function useMixingOperations() {
  const toast = useDnaToast();

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["production-mixing-items"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules?stage=MIXING");
        const list = res.data?.data || res.data || [];
        return list.map((item: any) => ({
          id: item.id,
          scheduleCode: item.scheduleNumber || item.code || item.id,
          date: item.startTime ? String(item.startTime).slice(0, 10) : new Date().toISOString().slice(0, 10),
          batchRecord: item.workOrder?.woNumber || "BR-2026-0001",
          salesOrder: item.workOrder?.lead?.clientName || "SO-2026",
          customer: item.workOrder?.lead?.clientName || "Farah Derma Clinic",
          category: "Skincare",
          product: item.workOrder?.lead?.brandName || "Day Cream SPF 30",
          formulaName: "FORM-MIX-V1",
          targetPcs: Number(item.targetQty) || 3000,
          nettoGram: 50,
          baseResultKg: 150.0,
          upscalePct: 5.0,
          upscaleResultKg: 157.5,
          actualMixingKg: item.resultQty ? Number(item.resultQty) : undefined,
          status: item.status === "COMPLETED" ? "SELESAI" : item.status === "IN_PROGRESS" ? "PROSES" : "MENUNGGU",
          notes: item.notes || "",
          historyLogs: [],
        }));
      } catch {
        return [];
      }
    },
  });

  const [localData, setLocalData] = useState<MixingProductionItem[]>(INITIAL_MIXING_DATA);
  const data = useMemo(() => {
    return [...localData, ...(serverData || [])];
  }, [localData, serverData]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modals & Drawer state
  const [selectedDetail, setSelectedDetail] = useState<MixingProductionItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [produceModalItem, setProduceModalItem] = useState<MixingProductionItem | null>(null);
  const [actualProduceQty, setActualProduceQty] = useState<number>(0);
  const [produceNote, setProduceNote] = useState<string>("");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.scheduleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchRecord.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "ALL" || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [data, searchTerm, filterStatus]);

  const kpis: MixingKpis = useMemo(() => {
    const total = data.length;
    const proses = data.filter((d) => d.status === "PROSES").length;
    const pending = data.filter((d) => d.status === "PENDING").length;
    const selesai = data.filter((d) => d.status === "SELESAI").length;
    return { total, proses, pending, selesai };
  }, [data]);

  const handleStartProduce = (item: MixingProductionItem) => {
    setLocalData((prev) =>
      prev.map((d) =>
        d.id === item.id
          ? {
              ...d,
              status: "PROSES",
              historyLogs: [
                ...(d.historyLogs || []),
                {
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  note: "Proses produksi mixing dimulai",
                  operator: "Operator Mixing",
                },
              ],
            }
          : d
      )
    );
    toast.success("Produksi Dimulai", `Jadwal ${item.scheduleCode} berstatus PROSES.`);
    setIsDetailDrawerOpen(false);
  };

  const handleTogglePending = (item: MixingProductionItem) => {
    const newStatus = item.status === "PENDING" ? "MENUNGGU" : "PENDING";
    setLocalData((prev) =>
      prev.map((d) =>
        d.id === item.id
          ? {
              ...d,
              status: newStatus,
              historyLogs: [
                ...(d.historyLogs || []),
                {
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  note: `Status diubah menjadi ${newStatus}`,
                  operator: "Supervisor Produksi",
                },
              ],
            }
          : d
      )
    );
    toast.info("Status Diperbarui", `${item.scheduleCode} diubah menjadi ${newStatus}.`);
    setIsDetailDrawerOpen(false);
  };

  const handleCompleteProduce = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!produceModalItem) return;

    setLocalData((prev) =>
      prev.map((d) =>
        d.id === produceModalItem.id
          ? {
              ...d,
              status: "SELESAI",
              actualMixingKg: actualProduceQty,
              historyLogs: [
                ...(d.historyLogs || []),
                {
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  note: `Mixing selesai: ${actualProduceQty} Kg (${produceNote || "Sesuai spesifikasi"})`,
                  operator: "Supervisor Mixing",
                },
              ],
            }
          : d
      )
    );

    toast.success(
      "Mixing Selesai",
      `Realisasi mixing ${produceModalItem.scheduleCode} berhasil dicatat (${actualProduceQty} Kg).`
    );
    setProduceModalItem(null);
    setIsDetailDrawerOpen(false);
  };

  const handleOpenDetail = (item: MixingProductionItem) => {
    setSelectedDetail(item);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDrawerOpen(false);
  };

  const handleOpenProduceModal = (item: MixingProductionItem) => {
    setProduceModalItem(item);
    setActualProduceQty(item.upscaleResultKg);
  };

  const handleCloseProduceModal = () => {
    setProduceModalItem(null);
  };

  const handleExportExcel = () => {
    exportToCsv({
      filename: `produksi-mixing-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Produksi Tahap Mixing",
      data: filteredData,
      columns: [
        { header: "Kode Jadwal", accessor: "scheduleCode" },
        { header: "Tanggal", accessor: "date" },
        { header: "Batch Record", accessor: "batchRecord" },
        { header: "No. SO", accessor: "salesOrder" },
        { header: "Customer", accessor: "customer" },
        { header: "Produk", accessor: "product" },
        { header: "Formula", accessor: "formulaName" },
        { header: "Target (Pcs)", accessor: "targetPcs" },
        { header: "Netto (Gram)", accessor: "nettoGram" },
        { header: "Target Mixing (Kg)", accessor: "upscaleResultKg" },
        { header: "Aktual Mixing (Kg)", accessor: "actualMixingKg" },
        { header: "Status", accessor: "status" },
        { header: "Catatan", accessor: "notes" },
      ],
    });
  };

  return {
    isLoading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredData,
    kpis,
    selectedDetail,
    setSelectedDetail,
    isDetailDrawerOpen,
    setIsDetailDrawerOpen,
    produceModalItem,
    setProduceModalItem,
    actualProduceQty,
    setActualProduceQty,
    produceNote,
    setProduceNote,
    handleStartProduce,
    handleTogglePending,
    handleCompleteProduce,
    handleOpenDetail,
    handleCloseDetail,
    handleOpenProduceModal,
    handleCloseProduceModal,
    handleExportExcel,
  };
}
