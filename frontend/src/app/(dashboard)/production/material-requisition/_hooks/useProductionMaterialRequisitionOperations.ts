"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  MaterialRequisitionItem,
  MaterialRequisitionStatus,
  MaterialRequisitionKpis,
  mapToRequisitionItem,
} from "../_types/material-requisition.types";

const FALLBACK_REQUISITIONS: MaterialRequisitionItem[] = [
  {
    id: "mr-1",
    requisitionCode: "MR-PRD-2026-001",
    requestDate: "2026-03-25",
    spkRef: "SPK-PRD-2026-001",
    targetProduct: "Brightening Facial Serum 30ml",
    sourceWarehouse: "WH-01 Gudang Bahan Baku",
    totalMaterialTypes: 8,
    totalQty: 150.5,
    qtyUnit: "Kg",
    requesterPic: "Hendra Wijaya",
    status: "SUBMITTED",
    customerName: "PT Cantika Glow Nusantara",
    brandName: "Aura Glow",
    batchNumber: "BATCH-2026-001",
    notes: "Pengambilan fase A (Water Phase) dan fase B (Active Niacinamide).",
  },
  {
    id: "mr-2",
    requisitionCode: "MR-PRD-2026-002",
    requestDate: "2026-03-26",
    spkRef: "SPK-PRD-2026-002",
    targetProduct: "Acne Clarifying Facial Cleanser 100ml",
    sourceWarehouse: "WH-01 Gudang Bahan Baku",
    totalMaterialTypes: 6,
    totalQty: 600.0,
    qtyUnit: "Kg",
    requesterPic: "Bambang Santoso",
    status: "PARTIALLY_ISSUED",
    customerName: "PT Herbal Estetika Medika",
    brandName: "BioHerb",
    batchNumber: "BATCH-2026-002",
    notes: "Surfactant telah keluar 300Kg, sisa ekstrak tea tree menunggu rilis lot.",
  },
  {
    id: "mr-3",
    requisitionCode: "MR-PRD-2026-003",
    requestDate: "2026-03-24",
    spkRef: "SPK-PRD-2026-003",
    targetProduct: "Hydrating Barrier Gel Cream 50g",
    sourceWarehouse: "WH-02 Gudang Kemasan",
    totalMaterialTypes: 4,
    totalQty: 3000.0,
    qtyUnit: "Pcs",
    requesterPic: "Siti Rahma",
    status: "FULLY_ISSUED",
    customerName: "PT Sinar Kosmetik Prima",
    brandName: "GlowSkin",
    batchNumber: "BATCH-2026-003",
    notes: "Jar akrilik 50g, inner lid, spatula, dan folding box lengkap.",
  },
  {
    id: "mr-4",
    requisitionCode: "MR-PRD-2026-004",
    requestDate: "2026-03-27",
    spkRef: "SPK-PRD-2026-004",
    targetProduct: "Sunscreen Invisible Gel SPF 50",
    sourceWarehouse: "WH-01 Gudang Bahan Baku",
    totalMaterialTypes: 10,
    totalQty: 250.0,
    qtyUnit: "Kg",
    requesterPic: "Ahmad Fauzi",
    status: "DRAFT",
    customerName: "PT Pesona Derma Indonesia",
    brandName: "DermaPure",
    batchNumber: "BATCH-2026-004",
    notes: "Draft alokasi UV filter organic & organosilicone.",
  },
];

export function useProductionMaterialRequisitionOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals & Drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MaterialRequisitionItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formSpkRef, setFormSpkRef] = useState("");
  const [formTargetProduct, setFormTargetProduct] = useState("");
  const [formSourceWarehouse, setFormSourceWarehouse] = useState("WH-01 Gudang Bahan Baku");
  const [formTotalTypes, setFormTotalTypes] = useState<number>(5);
  const [formTotalQty, setFormTotalQty] = useState<number>(100);
  const [formQtyUnit, setFormQtyUnit] = useState("Kg");
  const [formRequester, setFormRequester] = useState("Hendra Wijaya");
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
    { value: "ALL", label: "Semua Status MR" },
    { value: "SUBMITTED", label: "Diajukan (Pending Alokasi)", color: "info" as const },
    { value: "PARTIALLY_ISSUED", label: "Dikeluarkan Sebagian", color: "warning" as const },
    { value: "FULLY_ISSUED", label: "Selesai Dikeluarkan", color: "success" as const },
    { value: "DRAFT", label: "Draft SPB", color: "default" as const },
  ];

  const { data: serverRequisitions = [], isLoading } = useQuery({
    queryKey: ["production-material-requisitions"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/requisitions");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          return unwrapped.map(mapToRequisitionItem);
        }
        return FALLBACK_REQUISITIONS;
      } catch {
        return FALLBACK_REQUISITIONS;
      }
    },
  });

  const requisitions = serverRequisitions.length > 0 ? serverRequisitions : FALLBACK_REQUISITIONS;

  const uniqueWarehouses = Array.from(new Set(requisitions.map((r) => r.sourceWarehouse).filter(Boolean))) as string[];
  const uniqueRequesters = Array.from(new Set(requisitions.map((r) => r.requesterPic).filter(Boolean))) as string[];

  const filterColumns = [
    {
      key: "warehouse",
      label: "Gudang Asal Bahan",
      type: "select" as const,
      options: uniqueWarehouses,
    },
    {
      key: "requester",
      label: "PIC Pemohon",
      type: "select" as const,
      options: uniqueRequesters,
    },
    {
      key: "totalQty",
      label: "Urutkan: Total Qty Bahan",
      type: "sort_numeric" as const,
    },
    {
      key: "totalTypes",
      label: "Urutkan: Macam Bahan",
      type: "sort_numeric" as const,
    },
    {
      key: "requestDate",
      label: "Urutkan: Tanggal Pengajuan",
      type: "sort_alpha" as const,
    },
  ];

  const filteredList = useMemo(() => {
    let result = requisitions.filter((item) => {
      // Dedicated Status Filter
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) return false;

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.requisitionCode.toLowerCase().includes(q);
        const matchSpk = item.spkRef.toLowerCase().includes(q);
        const matchProduct = item.targetProduct.toLowerCase().includes(q);
        const matchWarehouse = item.sourceWarehouse.toLowerCase().includes(q);
        const matchRequester = item.requesterPic.toLowerCase().includes(q);
        if (!matchCode && !matchSpk && !matchProduct && !matchWarehouse && !matchRequester) {
          return false;
        }
      }

      // Secondary Column Filter
      if (selectedColumn && filterValue && !filterValue.startsWith("sort_")) {
        if (selectedColumn === "warehouse" && item.sourceWarehouse !== filterValue) return false;
        if (selectedColumn === "requester" && item.requesterPic !== filterValue) return false;
      }

      // Hybrid Date Filter
      if (dateMode !== "ALL" && item.requestDate) {
        const itemDate = new Date(item.requestDate);
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
        if (selectedColumn === "totalQty") {
          return filterValue === "sort_desc" ? b.totalQty - a.totalQty : a.totalQty - b.totalQty;
        }
        if (selectedColumn === "totalTypes") {
          return filterValue === "sort_desc" ? b.totalMaterialTypes - a.totalMaterialTypes : a.totalMaterialTypes - b.totalMaterialTypes;
        }
        if (selectedColumn === "requestDate") {
          return filterValue === "sort_desc"
            ? new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
            : new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime();
        }
        return 0;
      });
    }

    return result;
  }, [requisitions, selectedStatus, searchQuery, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const kpis: MaterialRequisitionKpis = useMemo(() => {
    const totalSubmitted = requisitions.filter((r) => r.status === "SUBMITTED").length;
    const totalIssued = requisitions.filter((r) => r.status === "FULLY_ISSUED").length;
    const partiallyIssued = requisitions.filter((r) => r.status === "PARTIALLY_ISSUED").length;
    const shortageCount = requisitions.filter((r) => r.status === "DRAFT").length;

    return {
      totalSubmitted,
      totalIssued,
      partiallyIssued,
      shortageCount,
    };
  }, [requisitions]);

  const handleOpenDetail = (item: MaterialRequisitionItem) => {
    setSelectedItem(item);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDrawerOpen(false);
  };

  const handleCreateRequisition = async () => {
    if (!formTargetProduct) {
      toast.error("Nama produk target wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/production/requisitions", {
        productName: formTargetProduct,
        warehouseName: formSourceWarehouse,
        spkRef: formSpkRef,
        totalItems: formTotalTypes,
        totalQty: formTotalQty,
        unit: formQtyUnit,
        requester: formRequester,
        notes: formNotes,
      });

      toast.success("Permintaan Bahan Produksi (MR) baru berhasil diajukan!");
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["production-material-requisitions"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal membuat permintaan bahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    requisitions,
    filteredList,
    kpis,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    statusOptions,
    filterColumns,
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
    handleResetAll,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedItem,
    setSelectedItem,
    isDetailDrawerOpen,
    handleOpenDetail,
    handleCloseDetail,
    isSubmitting,
    handleCreateRequisition,
    // Form props
    formSpkRef,
    setFormSpkRef,
    formTargetProduct,
    setFormTargetProduct,
    formSourceWarehouse,
    setFormSourceWarehouse,
    formTotalTypes,
    setFormTotalTypes,
    formTotalQty,
    setFormTotalQty,
    formQtyUnit,
    setFormQtyUnit,
    formRequester,
    setFormRequester,
    formNotes,
    setFormNotes,
  };
}
