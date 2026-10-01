"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import type { DpCategory, DpRecord } from "../_types/down-payment.types";

export function useDownPaymentOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("sample");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedColumn, setSelectedColumn] = useState("ALL");
  const [filterValue, setFilterValue] = useState("ALL");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleResetAll = () => {
    setSearchTerm("");
    setSelectedStatus("ALL");
    setSelectedColumn("ALL");
    setFilterValue("ALL");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  const [selectedRecord, setSelectedRecord] = useState<DpRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [formCategory, setFormCategory] = useState<DpCategory>("sample");
  const [selectedSoId, setSelectedSoId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formRef, setFormRef] = useState("");
  const [formBank, setFormBank] = useState("BCA Maklon (264-035-1589)");
  const [formAmount, setFormAmount] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [applySampleFeeOffset, setApplySampleFeeOffset] = useState(false);

  // Auto Generate Reference Code
  const autoGenerateRef = (cat: DpCategory) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    const prefix = cat === "sample" ? "SMP" : cat === "legalitas" ? "BPOM" : "SO";
    const gen = `${prefix}-${year}${month}-${rand}`;
    setFormRef(gen);
    return gen;
  };

  // Auto-Pull when SO is selected
  const handleSelectSo = (soId: string) => {
    setSelectedSoId(soId);
    if (!soId) {
      setFormRef("");
      setFormCustomer("");
      setFormBrand("");
      setFormAmount("");
      return;
    }

    const so = salesOrders.find((s: any) => s.id === soId);
    if (so) {
      setFormRef(so.orderNumber || "-");
      setFormCustomer(so.lead?.clientName || so.customerName || "Pelanggan Maklon");
      setFormBrand(so.brandName || so.lead?.brandName || "Brand");
      const soTotal = Number(so.totalAmount) || 0;
      const recDp = Math.round(soTotal * 0.5);
      if (recDp > 0) {
        setFormAmount(String(recDp));
      }
      setFormNotes(`Penerimaan DP 50% untuk pesanan ${so.orderNumber} - ${so.brandName || "Produk Maklon"}`);
    }
  };

  // Live Query for Down Payments
  const {
    data: records = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DpRecord[]>({
    queryKey: ["commercial-down-payments"],
    queryFn: async () => {
      const resp = await api.get("/commercial/down-payments");
      return (resp.data || []).map((dp: any) => {
        const cat = (dp.category || "").toLowerCase() as DpCategory;
        const validCat: DpCategory =
          cat === "sample" || cat === "legalitas" || cat === "produksi" ? cat : "produksi";
        const amt = Number(dp.amount) || 0;
        const used = Number(dp.usedAmount) || 0;
        const rem = Math.max(0, amt - used);
        return {
          id: dp.id,
          code:
            dp.dpNumber ||
            `DP-${validCat.slice(0, 3).toUpperCase()}-${dp.id.slice(0, 6).toUpperCase()}`,
          category: validCat,
          date: dp.createdAt ? new Date(dp.createdAt).toISOString().split("T")[0] : "",
          customerName: dp.salesOrder?.lead?.clientName || dp.customerName || "Pelanggan",
          brandName: dp.salesOrder?.brandName || dp.brandName || "Brand",
          refNumber: dp.salesOrder?.orderNumber || dp.referenceNumber || "-",
          bankAccount: dp.bankAccount || "BCA Maklon (264-035-1589)",
          amount: amt,
          usedAmount: used,
          remainingAmount: rem,
          status: (used >= amt ? "FULL" : used > 0 ? "PARTIAL" : "UNUSED") as DpRecord["status"],
          notes: dp.notes || "",
        };
      });
    },
  });

  // Live Query for Sales Orders
  const { data: salesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders-dropdown"],
    queryFn: async () => {
      try {
        const resp = await api.get("/commercial/sales-orders");
        return resp.data || [];
      } catch {
        return [];
      }
    },
  });

  const customerOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.customerName).filter(Boolean))) as string[],
    [records]
  );
  const bankOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.bankAccount).filter(Boolean))) as string[],
    [records]
  );

  const filterColumns = useMemo(
    () => [
      { key: "bank", label: "Rekening Bank", type: "select" as const, options: bankOptions },
      { key: "customer", label: "Pelanggan", type: "select" as const, options: customerOptions },
      { key: "sort_amount", label: "Nominal DP (Tertinggi / Terendah)", type: "sort_numeric" as const },
      { key: "sort_remaining", label: "Sisa Saldo DP (Tertinggi / Terendah)", type: "sort_numeric" as const },
      { key: "sort_date", label: "Tanggal DP (Terbaru / Terlama)", type: "sort_alpha" as const },
    ],
    [bankOptions, customerOptions]
  );

  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "Semua Status" },
      { value: "UNUSED", label: "Belum Digunakan", color: "blue" as const },
      { value: "PARTIAL", label: "Terpakai Sebagian", color: "amber" as const },
      { value: "FULL", label: "Lunas / Selesai", color: "emerald" as const },
    ],
    []
  );

  const filteredRecords = useMemo(() => {
    let result = records.filter((r) => {
      const matchesTab = r.category === activeTab;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        r.code.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.brandName.toLowerCase().includes(q) ||
        r.refNumber.toLowerCase().includes(q);

      const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;

      let matchesColumn = true;
      if (selectedColumn === "bank" && filterValue !== "ALL") {
        matchesColumn = r.bankAccount === filterValue;
      } else if (selectedColumn === "customer" && filterValue !== "ALL") {
        matchesColumn = r.customerName === filterValue;
      }

      let matchesDate = true;
      if (dateMode !== "ALL" && r.date) {
        const itemDate = new Date(r.date);
        if (!isNaN(itemDate.getTime())) {
          const now = new Date();
          if (dateMode === "1_DAY") {
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            matchesDate = itemDate >= oneDayAgo && itemDate <= now;
          } else if (dateMode === "1_WEEK") {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = itemDate >= oneWeekAgo && itemDate <= now;
          } else if (dateMode === "1_MONTH") {
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = itemDate >= oneMonthAgo && itemDate <= now;
          } else if (dateMode === "1_YEAR") {
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            matchesDate = itemDate >= oneYearAgo && itemDate <= now;
          } else if (dateMode === "CUSTOM" && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = itemDate >= start && itemDate <= end;
          }
        }
      }

      return matchesTab && matchesSearch && matchesStatus && matchesColumn && matchesDate;
    });

    if (selectedColumn === "sort_amount") {
      result = [...result].sort((a, b) =>
        filterValue === "asc" ? a.amount - b.amount : b.amount - a.amount
      );
    } else if (selectedColumn === "sort_remaining") {
      result = [...result].sort((a, b) =>
        filterValue === "asc" ? a.remainingAmount - b.remainingAmount : b.remainingAmount - a.remainingAmount
      );
    } else if (selectedColumn === "sort_date") {
      result = [...result].sort((a, b) =>
        filterValue === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
      );
    }

    return result;
  }, [records, activeTab, searchTerm, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  // Calculate KPIs for current tab or globally
  const currentTabRecords = records.filter((r) => r.category === activeTab);
  const totalAmount = currentTabRecords.reduce((acc, r) => acc + r.amount, 0);
  const totalUsed = currentTabRecords.reduce((acc, r) => acc + r.usedAmount, 0);
  const totalRemaining = currentTabRecords.reduce((acc, r) => acc + r.remainingAmount, 0);
  const conversionRate = totalAmount > 0 ? Math.round((totalUsed / totalAmount) * 100) : 0;

  const sampleCount = records.filter((r) => r.category === "sample").length;
  const legalitasCount = records.filter((r) => r.category === "legalitas").length;
  const produksiCount = records.filter((r) => r.category === "produksi").length;

  const createDpMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/commercial/down-payments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-down-payments"] });
      toast.success("Uang Muka Diterima", "Penerimaan DP berhasil dicatat.");
      setIsCreateOpen(false);

      // Reset Form
      setSelectedSoId("");
      setFormCustomer("");
      setFormBrand("");
      setFormRef("");
      setFormAmount("");
      setFormNotes("");
      setApplySampleFeeOffset(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal mencatat DP";
      toast.error("Validasi Gagal", msg);
    },
  });

  const handleCreateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error("Validasi Gagal", "Harap isi nominal DP dengan benar.");
      return;
    }

    const matchedSO = salesOrders.find(
      (so: any) =>
        (selectedSoId && so.id === selectedSoId) ||
        so.orderNumber?.toLowerCase() === formRef.trim().toLowerCase() ||
        so.lead?.clientName?.toLowerCase() === formCustomer.trim().toLowerCase()
    );
    const soId = matchedSO?.id || selectedSoId || (salesOrders[0]?.id ?? "00000000-0000-0000-0000-000000000001");

    createDpMutation.mutate({
      soId,
      category: formCategory.toUpperCase(),
      amount: Number(formAmount),
      bankAccount: formBank,
      notes: formNotes,
      applySampleFeeOffset,
    });
  };

  const handleOpenCreate = () => {
    setFormCategory(activeTab as DpCategory);
    if (!formRef) {
      autoGenerateRef(activeTab as DpCategory);
    }
    setIsCreateOpen(true);
  };

  const handleAllocate = (dp: DpRecord) => {
    toast.success(
      "Alokasikan DP",
      `Membuka pembuatan faktur dengan offset DP Rp ${dp.remainingAmount.toLocaleString("id-ID")}...`
    );
    window.location.href = `/penjualan/faktur-penjualan?action=create&soNumber=${encodeURIComponent(dp.refNumber)}&customer=${encodeURIComponent(dp.customerName)}&brand=${encodeURIComponent(dp.brandName)}&dpOffset=${dp.remainingAmount}`;
  };

  const handleAllocateFromDrawer = (record: DpRecord) => {
    toast.success("Alokasikan DP", `Membuka pembuatan faktur untuk DP ${record.code}...`);
    window.location.href = `/penjualan/faktur-penjualan?action=create&soNumber=${encodeURIComponent(record.refNumber)}&customer=${encodeURIComponent(record.customerName)}&brand=${encodeURIComponent(record.brandName)}&dpOffset=${record.remainingAmount}`;
  };

  return {
    toast,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
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
    statusOptions,
    filterColumns,
    handleResetAll,
    selectedRecord,
    setSelectedRecord,
    isCreateOpen,
    setIsCreateOpen,
    formCategory,
    setFormCategory,
    selectedSoId,
    setSelectedSoId,
    formDate,
    setFormDate,
    formCustomer,
    setFormCustomer,
    formBrand,
    setFormBrand,
    formRef,
    setFormRef,
    formBank,
    setFormBank,
    formAmount,
    setFormAmount,
    formNotes,
    setFormNotes,
    applySampleFeeOffset,
    setApplySampleFeeOffset,
    autoGenerateRef,
    handleSelectSo,
    records,
    isLoading,
    isError,
    error,
    refetch,
    salesOrders,
    filteredRecords,
    currentTabRecords,
    totalAmount,
    totalUsed,
    totalRemaining,
    conversionRate,
    sampleCount,
    legalitasCount,
    produksiCount,
    createDpMutation,
    handleCreateSubmit,
    handleOpenCreate,
    handleAllocate,
    handleAllocateFromDrawer,
  };
}
