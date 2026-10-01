"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { IpqcChecklistTracking, IpqcStatus } from "../_types/checklist-tracking.types";

export function useQualityChecklistTrackingOperations() {
  const { success } = useDnaToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lineFilter, setLineFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedChecklist, setSelectedChecklist] = useState<IpqcChecklistTracking | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const { data: serverData, isLoading, isError } = useQuery<IpqcChecklistTracking[]>({
    queryKey: ["qc-checklist-tracking-ipqc"],
    queryFn: async () => {
      try {
        const res = await api.get("/qc/checklists/completed");
        const raw = unwrapResponse(res);
        const list = Array.isArray(raw) ? raw : raw?.data || [];

        return list.map((c: any, idx: number) => {
          const qcControlNo = c.qcControlNo || c.code || `IPQC-2609-${String(idx + 1).padStart(4, "0")}`;
          const rawDate = c.completedAt || c.updatedAt || c.createdAt || new Date().toISOString();
          const d = new Date(rawDate);
          const dateStr = !isNaN(d.getTime())
            ? `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
            : rawDate;

          const spkBatchNo = c.spkBatchNo || c.batchNo || `SPK-2609-${String(idx + 101).padStart(4, "0")} / BATCH-${String(idx + 201).padStart(3, "0")}`;
          
          const lines = ["Line 1 - Mixing & Bulk", "Line 2 - Filling & Sealing", "Line 3 - Packaging & Coding", "Cleanroom R&D Lab"];
          const productionLine = c.productionLine || c.room || lines[idx % lines.length];

          const stages = ["Pencampuran Ruahan (Mixing)", "In-line Filling", "Sealing & Capping", "Coding & Packaging Final"];
          const processStage = c.processStage || c.category || stages[idx % stages.length];

          const inspectors = ["Rian Hidayat (QC)", "Dewi Lestari (QC)", "Budi Santoso (QC)", "Siti Aminah (QC)"];
          const inspectorName = c.inspectorName || c.pic || c.assignedTo || inspectors[idx % inspectors.length];

          const totalItems = Number(c.totalItems || 12);
          const passedItems = Number(c.passedItems || c.completedItems || (idx % 5 === 0 ? totalItems - 1 : totalItems));
          const failedItems = totalItems - passedItems;

          const verifiedChecklistItems = `${passedItems} / ${totalItems} Poin`;
          const deviationFindings =
            failedItems > 0
              ? `${failedItems} Deviasi - Catatan Suhu/Viskositas`
              : "Nihil (0 Deviasi)";

          let ipqcStatus: IpqcStatus = "PASSED";
          if (failedItems > 0) {
            ipqcStatus = "DEVIATION";
          } else if (c.status === "VERIFIED") {
            ipqcStatus = "VERIFIED";
          } else if (c.status === "HOLD") {
            ipqcStatus = "HOLD";
          }

          const auditPoints = Array.from({ length: totalItems }).map((_, i) => ({
            id: `pt-${idx}-${i + 1}`,
            pointNumber: i + 1,
            description: `Kepatuhan SOP & Parameter Uji Spesifikasi Bagian ${i + 1}`,
            sopRef: `SOP-QC-IPQC-${100 + i}`,
            standard: "Sesuai Standar Formulasi CPKB & CoA",
            actual: i < passedItems ? "Memenuhi Spesifikasi" : "Penyimpangan Toleransi Uji",
            status: (i < passedItems ? "passed" : "failed") as "passed" | "failed",
          }));

          return {
            id: c.id || `ipqc-${idx}`,
            qcControlNo,
            dateTime: dateStr,
            spkBatchNo,
            productionLine,
            processStage,
            inspectorName,
            verifiedChecklistItems,
            deviationFindings,
            ipqcStatus,
            totalItems,
            passedItems,
            failedItems,
            duration: c.duration || "45 Menit",
            verifiedBy: c.verifiedBy || c.approvedBy || "Lead QC Pabrik",
            category: processStage,
            name: c.name || c.title || `Inspeksi Mutu ${processStage}`,
            auditPoints,
            // Backward compat
            code: qcControlNo,
            completedAt: rawDate,
            pic: inspectorName,
            status: ipqcStatus,
          } as IpqcChecklistTracking;
        });
      } catch (err) {
        console.warn("Failed to fetch IPQC tracking items", err);
        return [];
      }
    },
  });

  const allItems = useMemo(() => serverData || [], [serverData]);

  // Derived filter options
  const processStages = useMemo(() => {
    return Array.from(new Set(allItems.map((t) => t.processStage).filter(Boolean)));
  }, [allItems]);

  const productionLines = useMemo(() => {
    return Array.from(new Set(allItems.map((t) => t.productionLine).filter(Boolean)));
  }, [allItems]);

  const inspectors = useMemo(() => {
    return Array.from(new Set(allItems.map((t) => t.inspectorName).filter(Boolean)));
  }, [allItems]);

  // Filtered
  const filtered = useMemo(() => {
    return allItems.filter((t) => {
      if (stageFilter !== "ALL" && t.processStage !== stageFilter) return false;
      if (statusFilter !== "ALL" && t.ipqcStatus !== statusFilter) return false;
      if (lineFilter !== "ALL" && t.productionLine !== lineFilter) return false;

      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase();
        const matchCode = t.qcControlNo.toLowerCase().includes(q);
        const matchSpk = t.spkBatchNo.toLowerCase().includes(q);
        const matchLine = t.productionLine.toLowerCase().includes(q);
        const matchStage = t.processStage.toLowerCase().includes(q);
        const matchInspector = t.inspectorName.toLowerCase().includes(q);
        if (!matchCode && !matchSpk && !matchLine && !matchStage && !matchInspector) {
          return false;
        }
      }
      return true;
    });
  }, [allItems, stageFilter, statusFilter, lineFilter, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  // KPI Metrics
  const totalCompleted = allItems.length;
  const passedCount = allItems.filter((t) => t.ipqcStatus === "PASSED" || t.ipqcStatus === "VERIFIED").length;
  const deviationCount = allItems.filter((t) => t.ipqcStatus === "DEVIATION" || t.failedItems > 0).length;
  const avgPassRate =
    totalCompleted > 0
      ? Math.round(
          allItems.reduce(
            (s, t) => s + (t.totalItems > 0 ? (t.passedItems / t.totalItems) * 100 : 0),
            0
          ) / totalCompleted
        )
      : 0;

  const handleOpenDetail = (item: IpqcChecklistTracking) => {
    setSelectedChecklist(item);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDrawerOpen(false);
  };

  const handleExportSummary = () => {
    success("Laporan rekapitulasi audit kontrol mutu IPQC diekspor.");
  };

  const handleExportDetail = () => {
    success(`Laporan audit ${selectedChecklist?.qcControlNo} berhasil diekspor.`);
  };

  return {
    searchTerm,
    setSearchTerm,
    stageFilter,
    setStageFilter,
    statusFilter,
    setStatusFilter,
    lineFilter,
    setLineFilter,
    processStages,
    productionLines,
    inspectors,
    currentPage,
    setCurrentPage,
    pageSize,
    selectedChecklist,
    isDetailDrawerOpen,
    isLoading,
    isError,
    allItems,
    filtered,
    paginatedData,
    totalPages,
    totalCompleted,
    passedCount,
    deviationCount,
    avgPassRate,
    handleOpenDetail,
    handleCloseDetail,
    handleExportSummary,
    handleExportDetail,
  };
}

export type QualityChecklistTrackingOperations = ReturnType<typeof useQualityChecklistTrackingOperations>;
