"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  BatchRecordItem,
  BatchRecordStatus,
  BatchRecordKpis,
  mapToBatchRecordItem,
} from "../_types/batch-records.types";

const FALLBACK_BATCH_RECORDS: BatchRecordItem[] = [
  {
    id: "bmr-1",
    batchRecordCode: "BMR-2026-03-001",
    spkRef: "SPK-PRD-2026-001",
    formulaRef: "FOR-SKN-2026-012 v2",
    productName: "Brightening Facial Serum 30ml",
    batchSizeKg: 250,
    formulatorPic: "apt. Siti Nurhaliza",
    startDate: "2026-03-25",
    yieldPct: 98.4,
    qcReleaseStatus: "PASSED_RELEASED",
    customerName: "PT Cantika Glow Nusantara",
    brandName: "Aura Glow",
    targetPcs: 5000,
    notes: "Batch memenuhi spesifikasi CPKB, pH 5.5, viskositas 3200 cPs.",
  },
  {
    id: "bmr-2",
    batchRecordCode: "BMR-2026-03-002",
    spkRef: "SPK-PRD-2026-002",
    formulaRef: "FOR-CLN-2026-005 v1",
    productName: "Acne Clarifying Facial Cleanser 100ml",
    batchSizeKg: 1000,
    formulatorPic: "apt. Rian Hidayat",
    startDate: "2026-03-27",
    yieldPct: 97.8,
    qcReleaseStatus: "IN_TESTING",
    customerName: "PT Herbal Estetika Medika",
    brandName: "BioHerb",
    targetPcs: 10000,
    notes: "Sampel inkubasi mikrobiologi 48 jam sedang berjalan.",
  },
  {
    id: "bmr-3",
    batchRecordCode: "BMR-2026-03-003",
    spkRef: "SPK-PRD-2026-003",
    formulaRef: "FOR-MST-2026-008 v3",
    productName: "Hydrating Barrier Gel Cream 50g",
    batchSizeKg: 150,
    formulatorPic: "apt. Siti Nurhaliza",
    startDate: "2026-03-26",
    yieldPct: 99.1,
    qcReleaseStatus: "PASSED_RELEASED",
    customerName: "PT Sinar Kosmetik Prima",
    brandName: "GlowSkin",
    targetPcs: 3000,
    notes: "Uji organoleptik, pH, dan bobot jenis sesuai spesifikasi release.",
  },
  {
    id: "bmr-4",
    batchRecordCode: "BMR-2026-03-004",
    spkRef: "SPK-PRD-2026-004",
    formulaRef: "FOR-SUN-2026-003 v1",
    productName: "Sunscreen Invisible Gel SPF 50",
    batchSizeKg: 400,
    formulatorPic: "apt. Rian Hidayat",
    startDate: "2026-03-28",
    yieldPct: 96.5,
    qcReleaseStatus: "PENDING_QC",
    customerName: "PT Pesona Derma Indonesia",
    brandName: "DermaPure",
    targetPcs: 8000,
    notes: "Proses mixing selesai, menunggu penarikan sampel oleh QC sampler.",
  },
];

export function useBatchRecordsOperations() {
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
  const [selectedItem, setSelectedItem] = useState<BatchRecordItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState("");
  const [formSpkRef, setFormSpkRef] = useState("");
  const [formFormulaRef, setFormFormulaRef] = useState("FOR-SKN-2026-012 v2");
  const [formProductName, setFormProductName] = useState("");
  const [formBatchSizeKg, setFormBatchSizeKg] = useState<number>(250);
  const [formFormulator, setFormFormulator] = useState("apt. Siti Nurhaliza");
  const [formNotes, setFormNotes] = useState("");

  // Query live Sales Orders for Auto-Pulling
  const { data: rawSalesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders-for-bmr"],
    queryFn: async () => {
      try {
        const resp = await api.get("/commercial/sales-orders");
        return Array.isArray(resp.data) ? resp.data : [];
      } catch {
        return [];
      }
    },
  });

  const salesOrderOptions = useMemo(() => {
    return rawSalesOrders.map((so: any) => {
      const isPendingDp = so.status === "PENDING_DP";
      return {
        value: so.id,
        label: `${so.orderNumber || so.id} • ${so.lead?.clientName || so.customerName || "Customer"} (${so.brandName || so.lead?.brandName || "Brand"})${isPendingDp ? " [🔒 Menunggu DP 50%]" : " [✅ DP Terverifikasi]"}`,
        isPendingDp,
      };
    });
  }, [rawSalesOrders]);

  const handleSelectSalesOrder = (soId: string) => {
    setSelectedSalesOrderId(soId);
    if (!soId) return;
    const so = rawSalesOrders.find((s: any) => s.id === soId);
    if (so) {
      if (so.status === "PENDING_DP") {
        toast.warning(
          "Gatekeeper Produksi: Belum DP 50%",
          `SO ${so.orderNumber} masih berstatus PENDING_DP. Finance harus memverifikasi pembayaran uang muka sebelum BMR dapat dieksekusi.`
        );
      }
      const firstItem = so.items?.[0];
      const prodName = firstItem?.productName || firstItem?.itemName || (so.brandName ? `Produk ${so.brandName}` : "Bulk Liquid Maklon");
      setFormProductName(prodName);
      setFormSpkRef(so.orderNumber || "");
      setFormFormulaRef(so.formulaCode || `FOR-${(so.orderNumber || "BM").replace(/[^a-zA-Z0-9]/g, "")}-v1`);
      
      const totalQty = (so.items || []).reduce((acc: number, it: any) => acc + (Number(it.quantity) || 0), 0);
      const estKg = totalQty > 0 ? Math.max(50, Math.round(totalQty * 0.03)) : 250;
      setFormBatchSizeKg(estKg);
      setFormNotes(`Target produksi ${so.orderNumber} untuk klien ${so.lead?.clientName || so.customerName || "Klien"}. Memenuhi standar CPKB.`);
      toast.info("Auto-Pull SO Berhasil", `Data produk, formula, dan target batch berhasil ditarik dari SO ${so.orderNumber}.`);
    }
  };

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
    { value: "ALL", label: "Semua Status Release QC" },
    { value: "PASSED_RELEASED", label: "Lolos Release APJ", color: "success" as const },
    { value: "IN_TESTING", label: "Pengujian Lab QC", color: "info" as const },
    { value: "PENDING_QC", label: "Menunggu QC", color: "warning" as const },
    { value: "QUARANTINED", label: "Karantina", color: "purple" as const },
    { value: "REJECTED", label: "Ditolak / Afkir", color: "critical" as const },
  ];

  const { data: serverRecords = [], isLoading } = useQuery({
    queryKey: ["production-batch-records-list"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/batch-records");
        const body = unwrapResponse<any>(res);
        const list = Array.isArray(body) ? body : (body?.data ?? []);
        if (Array.isArray(list) && list.length > 0) {
          return list.map(mapToBatchRecordItem);
        }
        return FALLBACK_BATCH_RECORDS;
      } catch {
        return FALLBACK_BATCH_RECORDS;
      }
    },
  });

  const records = serverRecords.length > 0 ? serverRecords : FALLBACK_BATCH_RECORDS;

  const uniqueFormulators = Array.from(new Set(records.map((r) => r.formulatorPic).filter(Boolean))) as string[];
  const uniqueBrands = Array.from(new Set(records.map((r) => r.brandName).filter(Boolean))) as string[];

  const filterColumns = [
    {
      key: "formulator",
      label: "Formulator PIC",
      type: "select" as const,
      options: uniqueFormulators,
    },
    {
      key: "brand",
      label: "Brand Klien",
      type: "select" as const,
      options: uniqueBrands,
    },
    {
      key: "batchSize",
      label: "Urutkan: Ukuran Batch",
      type: "sort_numeric" as const,
    },
    {
      key: "yieldPct",
      label: "Urutkan: Yield (%)",
      type: "sort_numeric" as const,
    },
    {
      key: "startDate",
      label: "Urutkan: Tanggal Mulai",
      type: "sort_alpha" as const,
    },
  ];

  const filteredList = useMemo(() => {
    let result = records.filter((item) => {
      // Dedicated Status Filter
      if (selectedStatus !== "ALL" && item.qcReleaseStatus !== selectedStatus) return false;

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.batchRecordCode.toLowerCase().includes(q);
        const matchSpk = item.spkRef.toLowerCase().includes(q);
        const matchFormula = item.formulaRef.toLowerCase().includes(q);
        const matchProduct = item.productName.toLowerCase().includes(q);
        const matchFormulator = item.formulatorPic.toLowerCase().includes(q);
        const matchBrand = item.brandName?.toLowerCase().includes(q);
        if (!matchCode && !matchSpk && !matchFormula && !matchProduct && !matchFormulator && !matchBrand) {
          return false;
        }
      }

      // Secondary Column Filter
      if (selectedColumn && filterValue && !filterValue.startsWith("sort_")) {
        if (selectedColumn === "formulator" && item.formulatorPic !== filterValue) return false;
        if (selectedColumn === "brand" && item.brandName !== filterValue) return false;
      }

      // Hybrid Date Filter
      if (dateMode !== "ALL" && item.startDate) {
        const itemDate = new Date(item.startDate);
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
        if (selectedColumn === "batchSize") {
          return filterValue === "sort_desc" ? b.batchSizeKg - a.batchSizeKg : a.batchSizeKg - b.batchSizeKg;
        }
        if (selectedColumn === "yieldPct") {
          return filterValue === "sort_desc" ? b.yieldPct - a.yieldPct : a.yieldPct - b.yieldPct;
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
  }, [records, selectedStatus, searchQuery, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const kpis: BatchRecordKpis = useMemo(() => {
    const total = records.length;
    const pendingQc = records.filter((r) => r.qcReleaseStatus === "PENDING_QC" || r.qcReleaseStatus === "IN_TESTING").length;
    const released = records.filter((r) => r.qcReleaseStatus === "PASSED_RELEASED").length;
    const avgYield = total > 0 ? records.reduce((acc, r) => acc + r.yieldPct, 0) / total : 0;

    return {
      totalRecords: total,
      pendingQcCount: pendingQc,
      releasedCount: released,
      avgYieldPct: Number(avgYield.toFixed(1)),
    };
  }, [records]);

  const handleOpenDetail = (item: BatchRecordItem) => {
    setSelectedItem(item);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDrawerOpen(false);
  };

  const handleCreateBatchRecord = async () => {
    if (!formProductName) {
      toast.error("Validasi Gagal", "Nama produk wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      const targetSoId = selectedSalesOrderId || (rawSalesOrders.length > 0 ? rawSalesOrders[0]?.id : undefined);
      const targetSo = rawSalesOrders.find((s: any) => s.id === targetSoId);
      if (targetSo && targetSo.status === "PENDING_DP") {
        toast.error(
          "Gatekeeper Produksi Terkunci (G2)",
          `Sales Order ${targetSo.orderNumber} belum membayar DP minimal 50%. SPK / Batch Record tidak dapat dirilis ke lantai pabrik sebelum diverifikasi Finance.`
        );
        setIsSubmitting(false);
        return;
      }

      await api.post("/production/batch-records", {
        productName: formProductName,
        formulaCode: formFormulaRef,
        batchSizeKg: formBatchSizeKg,
        formulatorName: formFormulator,
        notes: formNotes,
        salesOrderId: targetSoId,
      });

      toast.success("Batch Manufacturing Record (BMR) baru berhasil dibuat!");
      setIsCreateModalOpen(false);
      setSelectedSalesOrderId("");
      queryClient.invalidateQueries({ queryKey: ["production-batch-records-list"] });
    } catch (err: any) {
      toast.error("Gagal membuat batch record", err?.response?.data?.message || "Terjadi kesalahan pada server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    records,
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
    handleCreateBatchRecord,
    // Form props
    selectedSalesOrderId,
    setSelectedSalesOrderId,
    salesOrderOptions,
    handleSelectSalesOrder,
    formSpkRef,
    setFormSpkRef,
    formFormulaRef,
    setFormFormulaRef,
    formProductName,
    setFormProductName,
    formBatchSizeKg,
    setFormBatchSizeKg,
    formFormulator,
    setFormFormulator,
    formNotes,
    setFormNotes,
  };
}
