"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import type { MutationItem, MutationType, MutasiStokKpis } from "../_types/mutasi-stok.types";

export function useMutasiStokOperations() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("ALL");
  const [filterValue, setFilterValue] = useState<string>("ALL");
  const [dateMode, setDateMode] = useState<any>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedMutation, setSelectedMutation] = useState<MutationItem | null>(null);

  const { data: rawTransactions = [], isLoading } = useQuery({
    queryKey: ["warehouse-transactions"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/transactions");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const liveMutations: MutationItem[] = useMemo(() => {
    if (!rawTransactions || !Array.isArray(rawTransactions)) return [];
    return rawTransactions.map((tx: any) => {
      const typeStr = String(tx.type || "").toUpperCase();
      let mutationType: MutationType = "INBOUND";
      if (typeStr.includes("OUTBOUND") || typeStr.includes("SPK") || typeStr.includes("RELEASE")) {
        mutationType = "OUTBOUND";
      } else if (typeStr.includes("TRANSFER")) {
        mutationType = "TRANSFER";
      } else if (typeStr.includes("OPNAME")) {
        mutationType = "OPNAME";
      } else if (typeStr.includes("ADJUSTMENT")) {
        mutationType = "ADJUSTMENT";
      } else {
        mutationType = "INBOUND";
      }

      const isOut = mutationType === "OUTBOUND";
      const qty = Number(tx.quantity || 0);

      return {
        id: tx.id,
        datetime: tx.createdAt
          ? new Date(tx.createdAt).toISOString().replace("T", " ").slice(0, 16)
          : "-",
        docRef: tx.referenceNo || `TX-${tx.id.slice(0, 8).toUpperCase()}`,
        itemCode: tx.material?.code || tx.itemCode || "MAT-01",
        itemName: tx.material?.name || tx.itemName || "Material",
        sourceWarehouse: tx.sourceWarehouse || (isOut ? "Gudang Utama" : "Penerimaan / Vendor"),
        destWarehouse: tx.destWarehouse || (isOut ? "Produksi / Ekspedisi" : "Gudang Utama"),
        mutationType,
        qtyIn: isOut ? 0 : qty,
        qtyOut: isOut ? qty : 0,
        balance: Number(tx.balance || qty),
        unit: tx.material?.unit || tx.unit || "Unit",
        pic: tx.performedBy || tx.pic || "Petugas Gudang",
        notes: tx.notes || "-",
      };
    });
  }, [rawTransactions]);

  const warehouseOptions = useMemo(() => {
    const set = new Set<string>();
    liveMutations.forEach((m) => {
      if (m.sourceWarehouse && m.sourceWarehouse !== "-") set.add(m.sourceWarehouse);
      if (m.destWarehouse && m.destWarehouse !== "-") set.add(m.destWarehouse);
    });
    return Array.from(set);
  }, [liveMutations]);

  const filteredMutations = useMemo(() => {
    let result = liveMutations.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.docRef.toLowerCase().includes(q) ||
        m.itemCode.toLowerCase().includes(q) ||
        m.itemName.toLowerCase().includes(q) ||
        m.sourceWarehouse.toLowerCase().includes(q) ||
        m.destWarehouse.toLowerCase().includes(q);

      const matchStatus =
        selectedStatus === "ALL" ? true : m.mutationType === selectedStatus;

      // Date Range Filter
      let matchDate = true;
      if (m.datetime && m.datetime !== "-") {
        const itemDateStr = m.datetime.slice(0, 10);
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

      // Secondary column filter
      let matchCol = true;
      if (filterValue && filterValue !== "ALL") {
        if (selectedColumn === "warehouse") {
          matchCol = m.sourceWarehouse === filterValue || m.destWarehouse === filterValue;
        }
      }

      return matchSearch && matchStatus && matchDate && matchCol;
    });

    if (selectedColumn === "itemName") {
      result.sort((a, b) => a.itemName.localeCompare(b.itemName));
    }

    return result;
  }, [liveMutations, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn("ALL");
    setFilterValue("ALL");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  const kpis: MutasiStokKpis = useMemo(() => {
    const totalInbound = filteredMutations
      .filter((m) => m.mutationType === "INBOUND")
      .reduce((sum, m) => sum + m.qtyIn, 0);
    const totalOutbound = filteredMutations
      .filter((m) => m.mutationType === "OUTBOUND")
      .reduce((sum, m) => sum + m.qtyOut, 0);
    const totalTransfer = filteredMutations
      .filter((m) => m.mutationType === "TRANSFER")
      .reduce((sum, m) => sum + (m.qtyIn || m.qtyOut), 0);
    const totalAdjustment = filteredMutations
      .filter((m) => m.mutationType === "ADJUSTMENT" || m.mutationType === "OPNAME")
      .reduce((sum, m) => sum + (m.qtyIn || m.qtyOut), 0);

    return {
      totalInbound,
      totalOutbound,
      totalTransfer,
      totalAdjustment,
    };
  }, [filteredMutations]);

  const handleExportExcel = () => {
    exportToCsv({
      filename: `mutasi-stok-gudang-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Riwayat Mutasi Stok Gudang",
      data: filteredMutations,
      columns: [
        { header: "No. Dokumen Ref", accessor: "docRef" },
        { header: "Waktu Transaksi", accessor: "datetime" },
        { header: "Kode Barang", accessor: "itemCode" },
        { header: "Nama Barang", accessor: "itemName" },
        { header: "Tipe Mutasi", accessor: "mutationType" },
        { header: "Gudang Asal", accessor: "sourceWarehouse" },
        { header: "Gudang Tujuan", accessor: "destWarehouse" },
        { header: "Qty Masuk", accessor: "qtyIn" },
        { header: "Qty Keluar", accessor: "qtyOut" },
        { header: "Saldo Akhir", accessor: "balance" },
        { header: "Satuan", accessor: "unit" },
        { header: "PIC", accessor: "pic" },
        { header: "Catatan", accessor: "notes" },
      ],
    });
  };

  const handlePrint = (docRef?: string) => {
    if (docRef) {
      toast.success(`Mencetak Bukti Mutasi ${docRef}...`);
    } else {
      window.print();
    }
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
    selectedMutation,
    setSelectedMutation,
    liveMutations,
    filteredMutations,
    kpis,
    handleExportExcel,
    handlePrint,
  };
}
