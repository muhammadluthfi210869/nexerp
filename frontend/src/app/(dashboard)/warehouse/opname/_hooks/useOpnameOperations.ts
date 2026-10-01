"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import type {
  OpnameItem,
  OpnameSession,
  NewSessionFormState,
  WarehouseOption,
  OpnameKpis,
} from "../_types/opname.types";

export function useOpnameOperations() {
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
  const [selectedSession, setSelectedSession] = useState<OpnameSession | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [newSessionForm, setNewSessionForm] = useState<NewSessionFormState>({
    warehouseId: "",
    warehouseCode: "",
    warehouseName: "",
    auditorLead: "",
    auditorTeam: "",
    notes: "",
    freezeInventory: true,
  });

  // Query warehouse list
  const { data: warehouseList = [] } = useQuery<WarehouseOption[]>({
    queryKey: ["warehouse-list-options"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/warehouses");
        return (unwrapResponse(res.data) as WarehouseOption[]) || [];
      } catch {
        return [];
      }
    },
  });

  // Query sessions
  const { data: rawSessions } = useQuery({
    queryKey: ["warehouse-opname-sessions"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/opname");
        return unwrapResponse(res.data) as OpnameSession[];
      } catch {
        return null;
      }
    },
  });

  const handleCreateOpname = async () => {
    if (!newSessionForm.warehouseId && warehouseList.length > 0) {
      toast.error("Pilih gudang terlebih dahulu");
      return;
    }
    const targetWhId = newSessionForm.warehouseId || warehouseList[0]?.id;
    if (!targetWhId) {
      toast.error("Gudang tidak tersedia");
      return;
    }
    try {
      await api.post("/warehouse/opname", {
        warehouseId: targetWhId,
        picId: newSessionForm.auditorLead || "SYSTEM",
        notes: newSessionForm.notes || undefined,
        items: [],
      });
      toast.success("Sesi opname dimulai. Transaksi di gudang terpilih telah dibekukan (FROZEN).");
      queryClient.invalidateQueries({ queryKey: ["warehouse-opname-sessions"] });
      setIsCreateModalOpen(false);
      setNewSessionForm({
        warehouseId: "",
        warehouseCode: "",
        warehouseName: "",
        auditorLead: "",
        auditorTeam: "",
        notes: "",
        freezeInventory: true,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal memulai sesi opname");
    }
  };

  const handleApproveOpname = async (id: string) => {
    try {
      await api.post(`/warehouse/opname/${id}/approve`, {});
      toast.success("Rekonsiliasi opname disetujui & penyesuaian stok otomatis dibukukan.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-opname-sessions"] });
      setSelectedSession(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyetujui opname");
    }
  };



  const handlePrintForm = (sessionCode?: string) => {
    toast.success(`Mencetak Formulir Hitung Fisik ${sessionCode || ""}...`);
  };

  const sessions: OpnameSession[] = useMemo(() => {
    if (!rawSessions || !Array.isArray(rawSessions)) return [];
    return rawSessions.map((s: any) => {
      const items: OpnameItem[] = (s.items || []).map((i: any) => {
        const sys = Number(i.systemQty || 0);
        const act = i.actualQty !== null && i.actualQty !== undefined ? Number(i.actualQty) : null;
        const diff = act !== null ? act - sys : 0;
        const hpp = Number(i.material?.unitPrice || 0);
        const val = diff * hpp;
        const status: OpnameItem["status"] = act === null ? "PENDING_COUNT" : diff === 0 ? "MATCH" : diff > 0 ? "SURPLUS" : "DEFICIT";
        return {
          itemCode: i.material?.code || i.materialId?.slice(0, 8) || "MAT",
          itemName: i.material?.name || "Material",
          batchLot: i.batchNumber || "-",
          binLocation: i.binLocation || "A-01",
          systemQty: sys,
          actualQty: act,
          differenceQty: diff,
          unit: i.material?.unit || "Unit",
          unitHpp: hpp,
          varianceValuation: val,
          status,
          notes: i.notes,
        };
      });
      const counted = items.filter((it: any) => it.actualQty !== null).length;
      const matched = items.filter((it: any) => it.status === "MATCH").length;
      const variance = items.filter((it: any) => it.status === "DEFICIT" || it.status === "SURPLUS").length;
      const netVal = items.reduce((sum: number, it: any) => sum + it.varianceValuation, 0);

      return {
        id: s.id,
        sessionCode: s.opnameNumber || ("OPN-" + s.id.slice(0, 8).toUpperCase()),
        sessionDate: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        warehouseCode: s.warehouse?.code || "WH-01",
        warehouseName: s.warehouse?.name || "Gudang Utama",
        auditorLead: s.pic?.name || s.picId || "Auditor Lead",
        auditorTeam: [],
        totalSkus: items.length,
        countedSkus: counted,
        matchedSkus: matched,
        varianceSkus: variance,
        netVarianceValuation: netVal,
        status: (s.status === "COMPLETED" ? "RECONCILED_CLOSED" : s.status === "PENDING_APPROVAL" ? "IN_COUNT" : "DRAFT_FREEZE") as OpnameSession["status"],
        notes: s.notes,
        isInventoryFrozen: s.status !== "COMPLETED",
        items,
      };
    });
  }, [rawSessions]);

  // Filter Options
  const warehouseOptions = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.warehouseName) set.add(s.warehouseName);
    });
    return Array.from(set);
  }, [sessions]);

  const auditorOptions = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.auditorLead) set.add(s.auditorLead);
    });
    return Array.from(set);
  }, [sessions]);

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn("ALL");
    setFilterValue("ALL");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  // Filtering
  const filteredSessions = useMemo(() => {
    let result = sessions.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.sessionCode.toLowerCase().includes(q) ||
        s.warehouseName.toLowerCase().includes(q) ||
        s.auditorLead.toLowerCase().includes(q);

      let matchStatus = true;
      if (selectedStatus !== "ALL") {
        matchStatus = s.status === selectedStatus;
      }

      let matchFilter = true;
      if (filterValue && filterValue !== "ALL") {
        if (selectedColumn === "warehouseName") {
          matchFilter = s.warehouseName === filterValue;
        } else if (selectedColumn === "auditorLead") {
          matchFilter = s.auditorLead === filterValue;
        }
      }

      let matchDate = true;
      if (s.sessionDate) {
        if (dateMode === "1_DAY") {
          const today = new Date().toISOString().split("T")[0];
          matchDate = s.sessionDate === today;
        } else if (dateMode === "1_WEEK") {
          const past = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
          matchDate = s.sessionDate >= past;
        } else if (dateMode === "1_MONTH") {
          const past = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
          matchDate = s.sessionDate >= past;
        } else if (dateMode === "1_YEAR") {
          const past = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];
          matchDate = s.sessionDate >= past;
        } else if (dateMode === "CUSTOM") {
          if (startDate && s.sessionDate < startDate) matchDate = false;
          if (endDate && s.sessionDate > endDate) matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchFilter && matchDate;
    });

    return result;
  }, [sessions, searchQuery, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  // KPIs
  const kpis: OpnameKpis = useMemo(() => {
    const total = sessions.length;
    const active = sessions.filter((s) => s.status !== "RECONCILED_CLOSED").length;
    const closed = sessions.filter((s) => s.status === "RECONCILED_CLOSED").length;
    const netVariance = sessions.reduce((acc, s) => acc + s.netVarianceValuation, 0);
    return { total, active, closed, netVariance };
  }, [sessions]);

  const handleExportExcel = () => {
    exportToCsv({
      filename: `stock-opname-rekonsiliasi-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Rekonsiliasi Stock Opname Gudang",
      data: filteredSessions,
      columns: [
        { header: "Kode Sesi Opname", accessor: "sessionCode" },
        { header: "Tanggal Pelaksanaan", accessor: "sessionDate" },
        { header: "Gudang", accessor: "warehouseName" },
        { header: "Auditor Lead", accessor: "auditorLead" },
        { header: "Total SKU", accessor: "totalSkus" },
        { header: "SKU Terhitung", accessor: "countedSkus" },
        { header: "SKU Sesuai (Match)", accessor: "matchedSkus" },
        { header: "SKU Selisih", accessor: "varianceSkus" },
        { header: "Valuasi Selisih Bersih", accessor: "netVarianceValuation" },
        { header: "Status", accessor: "status" },
        { header: "Catatan", accessor: "notes" },
      ],
    });
  };

  return {
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
    auditorOptions,
    handleResetAll,
    selectedSession,
    setSelectedSession,
    isCreateModalOpen,
    setIsCreateModalOpen,
    newSessionForm,
    setNewSessionForm,
    warehouseList,
    sessions,
    filteredSessions,
    kpis,
    handleCreateOpname,
    handleApproveOpname,
    handleExportExcel,
    handlePrintForm,
  };
}
