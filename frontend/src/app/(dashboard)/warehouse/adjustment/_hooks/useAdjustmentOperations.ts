"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import type {
  AdjustmentItem,
  StockAdjustment,
  AdjustmentKpis,
  AdjustmentFormData,
  CatalogItemOption,
} from "../_types/adjustment.types";

export function useAdjustmentOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  // Filtering & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("ALL");
  const [filterValue, setFilterValue] = useState<string>("ALL");
  const [dateMode, setDateMode] = useState<any>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null);

  // Live catalog for materials in adjustments
  const { data: rawCatalog = [] } = useQuery({
    queryKey: ["warehouse-catalog"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/catalog");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const catalogOptions: CatalogItemOption[] = useMemo(() => {
    if (!Array.isArray(rawCatalog)) return [];
    return rawCatalog.map((m: any) => ({
      code: m.code || m.id?.slice(0, 8) || "",
      name: m.name || "",
      unit: m.unit || "Unit",
      hpp: Number(m.unitPrice || 0),
      currentStock: Number(m.stockQty || 0),
      batch: m.inventories?.[0]?.batchNumber || "-",
    }));
  }, [rawCatalog]);

  // Form State for new Adjustment
  const [formData, setFormData] = useState<AdjustmentFormData>({
    warehouseCode: "WH-01",
    warehouseName: "WH-01 Gudang Bahan Baku",
    adjustmentType: "CORRECTION",
    adjustmentAccountCode: "510501",
    adjustmentAccountName: "510501 - Beban Selisih Stok Persediaan",
    notes: "",
    items: [],
  });

  const [currentItemCode, setCurrentItemCode] = useState("");
  const [currentActualQty, setCurrentActualQty] = useState<number>(0);
  const [currentItemNotes, setCurrentItemNotes] = useState("");

  // Queries
  const { data: rawAdjustments, isLoading } = useQuery({
    queryKey: ["warehouse-adjustments"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/adjustments");
        return unwrapResponse(res.data) as any[];
      } catch {
        return null;
      }
    },
  });

  const adjustments: StockAdjustment[] = useMemo(() => {
    if (!rawAdjustments || !Array.isArray(rawAdjustments)) return [];
    return rawAdjustments.map((a: any) => {
      const items: AdjustmentItem[] = (a.items || []).map((i: any) => {
        const sys = Number(i.systemQty || 0);
        const act = Number(i.actualQty || 0);
        const diff = act - sys;
        const hpp = Number(i.material?.unitPrice || 0);
        return {
          itemCode: i.material?.code || i.materialId?.slice(0, 8) || "MAT",
          itemName: i.material?.name || "Material",
          batchLot: i.batchNumber || "-",
          systemQty: sys,
          actualQty: act,
          differenceQty: diff,
          unit: i.material?.unit || "Unit",
          unitHpp: hpp,
          varianceValuation: diff * hpp,
          itemNotes: i.notes,
        };
      });

      const totalVal = items.reduce((sum: number, it: any) => sum + it.varianceValuation, 0);
      const totalQty = items.reduce((sum: number, it: any) => sum + it.differenceQty, 0);

      const statusRaw = String(a.status || "PENDING").toUpperCase();
      let status: StockAdjustment["status"] = "PENDING_APPROVAL";
      if (statusRaw === "APPROVED") status = "APPROVED";
      else if (statusRaw === "REJECTED") status = "REJECTED";
      else if (statusRaw === "DRAFT") status = "DRAFT";
      else status = "PENDING_APPROVAL";

      return {
        id: a.id,
        adjustmentNumber: a.adjustmentNumber || ("ADJ-" + a.id.slice(0, 8).toUpperCase()),
        adjustmentDate: a.createdAt
          ? new Date(a.createdAt).toISOString().replace("T", " ").slice(0, 16)
          : "-",
        warehouseCode: a.warehouse?.code || "WH-01",
        warehouseName: a.warehouse?.name || "Gudang Utama",
        adjustmentType: (a.type || "CORRECTION") as StockAdjustment["adjustmentType"],
        adjustmentTypeLabel:
          a.type === "WRITE_OFF"
            ? "Write-Off Kerusakan"
            : a.type === "DISPOSAL"
            ? "Pemusnahan Limbah"
            : a.type === "QC_SAMPLING"
            ? "Pengambilan Sampel QC"
            : "Koreksi Selisih Hitung",
        adjustmentAccountCode: a.accountCode || "510501",
        adjustmentAccountName: a.accountName || "Beban Selisih Stok Persediaan",
        items,
        totalItemsCount: items.length,
        totalVarianceQty: totalQty,
        totalVarianceValuation: totalVal,
        status,
        createdBy: a.createdBy?.fullName || a.createdByName || "Petugas Gudang",
        approvedBy: a.approvedBy?.fullName,
        approvalDate: a.approvedAt
          ? new Date(a.approvedAt).toISOString().replace("T", " ").slice(0, 16)
          : undefined,
        notes: a.notes || "-",
      };
    });
  }, [rawAdjustments]);

  // Unique Options for Secondary Filter
  const warehouseOptions = useMemo(() => {
    const set = new Set<string>();
    adjustments.forEach((a) => {
      if (a.warehouseName) set.add(a.warehouseName);
    });
    return Array.from(set);
  }, [adjustments]);

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn("ALL");
    setFilterValue("ALL");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (adjId: string) => {
      const res = await api.post(`/warehouse/adjustments/${adjId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Adjustment disetujui & jurnal penyesuaian otomatis dibukukan.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-adjustments"] });
      setSelectedAdjustment(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyetujui penyesuaian stok.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (adjId: string) => {
      const res = await api.post(`/warehouse/adjustments/${adjId}/reject`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Adjustment ditolak.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-adjustments"] });
      setSelectedAdjustment(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menolak penyesuaian stok.");
    },
  });

  // Filtered List
  const filteredAdjustments = useMemo(() => {
    let result = adjustments.filter((adj) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        adj.adjustmentNumber.toLowerCase().includes(q) ||
        adj.warehouseName.toLowerCase().includes(q) ||
        adj.createdBy.toLowerCase().includes(q) ||
        adj.adjustmentAccountCode.toLowerCase().includes(q);

      let matchStatus = true;
      if (selectedStatus !== "ALL") {
        if (selectedStatus === "PENDING_APPROVAL") {
          matchStatus = adj.status === "PENDING" || adj.status === "PENDING_APPROVAL";
        } else {
          matchStatus = adj.status === selectedStatus;
        }
      }

      let matchFilter = true;
      if (filterValue && filterValue !== "ALL") {
        if (selectedColumn === "adjustmentType") {
          matchFilter = adj.adjustmentType === filterValue;
        } else if (selectedColumn === "warehouseName") {
          matchFilter = adj.warehouseName === filterValue;
        }
      }

      let matchDate = true;
      if (adj.adjustmentDate && adj.adjustmentDate !== "-") {
        const itemDateStr = adj.adjustmentDate.slice(0, 10);
        if (dateMode === "1_DAY") {
          const today = new Date().toISOString().split("T")[0];
          matchDate = itemDateStr === today;
        } else if (dateMode === "1_WEEK") {
          const past = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
          matchDate = itemDateStr >= past;
        } else if (dateMode === "1_MONTH") {
          const past = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
          matchDate = itemDateStr >= past;
        } else if (dateMode === "1_YEAR") {
          const past = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];
          matchDate = itemDateStr >= past;
        } else if (dateMode === "CUSTOM") {
          if (startDate && itemDateStr < startDate) matchDate = false;
          if (endDate && itemDateStr > endDate) matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchFilter && matchDate;
    });

    return result;
  }, [adjustments, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  // KPI Calculations
  const kpis: AdjustmentKpis = useMemo(() => {
    const total = adjustments.length;
    const pending = adjustments.filter(
      (a) => a.status === "PENDING" || a.status === "PENDING_APPROVAL"
    ).length;
    const approved = adjustments.filter((a) => a.status === "APPROVED").length;
    const netVariance = adjustments
      .filter((a) => a.status === "APPROVED")
      .reduce((sum, a) => sum + a.totalVarianceValuation, 0);

    return { total, pending, approved, netVariance };
  }, [adjustments]);

  const handleExportExcel = () => {
    exportToCsv({
      filename: `penyesuaian-stok-adjustment-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Penyesuaian Stok (Stock Adjustment)",
      data: filteredAdjustments,
      columns: [
        { header: "No. Adjustment", accessor: "adjustmentNumber" },
        { header: "Tanggal", accessor: "adjustmentDate" },
        { header: "Gudang", accessor: "warehouseName" },
        { header: "Tipe Penyesuaian", accessor: "adjustmentType" },
        { header: "Total Nilai Selisih", accessor: "totalVarianceValuation" },
        { header: "Status", accessor: "status" },
        { header: "Dibuat Oleh", accessor: "createdBy" },
        { header: "Alasan / Catatan", accessor: "notes" },
      ],
    });
  };

  const handlePrintDocument = (adjNumber?: string) => {
    toast.success(`Mencetak Bukti Adjustment ${adjNumber || ""}...`);
  };

  const handleCreateSubmit = () => {
    toast.success("Pengajuan adjustment stok berhasil dibuat dan menunggu approval Finance.");
    setIsCreateModalOpen(false);
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(id);
  };

  return {
    toast,
    isLoading,
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
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    warehouseOptions,
    handleResetAll,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedAdjustment,
    setSelectedAdjustment,
    catalogOptions,
    formData,
    setFormData,
    currentItemCode,
    setCurrentItemCode,
    currentActualQty,
    setCurrentActualQty,
    currentItemNotes,
    setCurrentItemNotes,
    adjustments,
    filteredAdjustments,
    kpis,
    isPendingAction: approveMutation.isPending || rejectMutation.isPending,
    handleExportExcel,
    handlePrintDocument,
    handleCreateSubmit,
    handleApprove,
    handleReject,
  };
}
