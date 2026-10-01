"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import { FillingProductionItem, FillingKpis } from "../_types/filling.types";

const INITIAL_FILLING_DATA: FillingProductionItem[] = [];

export function useFillingOperations() {
  const toast = useDnaToast();

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["production-filling-items"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules?stage=FILLING");
        const list = res.data?.data || res.data || [];
        return list.map((item: any) => ({
          id: item.id,
          code: item.scheduleNumber || item.code || item.id,
          date: item.startTime ? String(item.startTime).slice(0, 10) : new Date().toISOString().slice(0, 10),
          batchRecord: item.workOrder?.woNumber || "BR-2026-0001",
          salesOrder: item.workOrder?.lead?.clientName || "SO-2026",
          customer: item.workOrder?.lead?.clientName || "Farah Derma Clinic",
          category: "Skincare",
          product: item.workOrder?.lead?.brandName || "Day Cream SPF 30",
          targetPcs: Number(item.targetQty) || 3000,
          actualPcs: item.resultQty ? Number(item.resultQty) : undefined,
          rejectPcs: 0,
          machine: item.machine?.name || "Filling Line 1 (Rotary)",
          status: item.status === "COMPLETED" ? "SELESAI" : item.status === "IN_PROGRESS" ? "PROSES" : "MENUNGGU",
          notes: item.notes || "",
          detailRows: [],
          historyLogs: [],
        }));
      } catch {
        return [];
      }
    },
  });

  const [localData, setLocalData] = useState<FillingProductionItem[]>(INITIAL_FILLING_DATA);
  const data = useMemo(() => {
    return [...localData, ...(serverData || [])];
  }, [localData, serverData]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modals & Drawer state
  const [selectedDetail, setSelectedDetail] = useState<FillingProductionItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [produceModalItem, setProduceModalItem] = useState<FillingProductionItem | null>(null);
  const [produceQty, setProduceQty] = useState<number>(0);
  const [rejectQty, setRejectQty] = useState<number>(0);
  const [produceMachine, setProduceMachine] = useState<string>("");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchRecord.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "ALL" || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [data, searchTerm, filterStatus]);

  const kpis: FillingKpis = useMemo(() => {
    const total = data.length;
    const proses = data.filter((d) => d.status === "PROSES").length;
    const pending = data.filter((d) => d.status === "PENDING").length;
    const selesai = data.filter((d) => d.status === "SELESAI").length;
    return { total, proses, pending, selesai };
  }, [data]);

  const handleStartProduce = (item: FillingProductionItem) => {
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
                  note: "Line filling mulai beroperasi",
                  operator: "Operator Filling",
                },
              ],
            }
          : d
      )
    );
    toast.success("Produksi Dimulai", `Jadwal filling ${item.code} berstatus PROSES.`);
    setIsDetailDrawerOpen(false);
  };

  const handleTogglePending = (item: FillingProductionItem) => {
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
                  operator: "Supervisor Filling",
                },
              ],
            }
          : d
      )
    );
    toast.info("Status Diperbarui", `${item.code} diubah menjadi ${newStatus}.`);
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
              actualPcs: produceQty,
              rejectPcs: rejectQty,
              machine: produceMachine || d.machine,
              historyLogs: [
                ...(d.historyLogs || []),
                {
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  note: `Filling selesai: ${produceQty} pcs (Reject: ${rejectQty} pcs) via ${produceMachine || d.machine}`,
                  operator: "Supervisor Filling",
                },
              ],
            }
          : d
      )
    );

    toast.success(
      "Filling Selesai",
      `Realisasi filling ${produceModalItem.code} berhasil dicatat (${produceQty} Pcs).`
    );
    setProduceModalItem(null);
    setIsDetailDrawerOpen(false);
  };

  const handleOpenDetail = (item: FillingProductionItem) => {
    setSelectedDetail(item);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDrawerOpen(false);
  };

  const handleOpenProduceModal = (item: FillingProductionItem) => {
    setProduceModalItem(item);
    setProduceQty(item.targetPcs);
    setProduceMachine(item.machine);
  };

  const handleCloseProduceModal = () => {
    setProduceModalItem(null);
  };

  const handleExportExcel = () => {
    exportToCsv({
      filename: `produksi-filling-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Produksi Tahap Filling",
      data: filteredData,
      columns: [
        { header: "Kode Jadwal", accessor: "code" },
        { header: "Tanggal", accessor: "date" },
        { header: "Batch Record", accessor: "batchRecord" },
        { header: "No. SO", accessor: "salesOrder" },
        { header: "Customer", accessor: "customer" },
        { header: "Produk", accessor: "product" },
        { header: "Mesin Filling", accessor: "machine" },
        { header: "Target (Pcs)", accessor: "targetPcs" },
        { header: "Aktual (Pcs)", accessor: "actualPcs" },
        { header: "Reject (Pcs)", accessor: "rejectPcs" },
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
    produceQty,
    setProduceQty,
    rejectQty,
    setRejectQty,
    produceMachine,
    setProduceMachine,
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
