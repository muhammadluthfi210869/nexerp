"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DerivedStatus,
  TabFilter,
  SampleTrackingItem,
  SampleTimelineDetail,
  FormulaPhase,
  FormulaPhaseItem,
  StageLog,
  ChecklistCounts,
  formatDate,
  unwrapList,
  deriveStatus,
} from "../_types/checklist-tracking.types";

export function useChecklistTrackingOperations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tabFilter, setTabFilter] = useState<TabFilter>("ALL");
  const [picFilter, setPicFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [viewingTimelineId, setViewingTimelineId] = useState<string | null>(null);

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<SampleTrackingItem[]>({
    queryKey: ["rnd-samples-tracking"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/samples");
        return unwrapList(res.data).map((item: any): SampleTrackingItem => {
          const latestLog = Array.isArray(item.stageLogs) ? item.stageLogs[0] : null;
          return {
            id: item.id,
            sampleCode: item.sampleCode || "â€”",
            customer: item.lead?.clientName || "â€”",
            brand: item.lead?.brandName || "â€”",
            product: item.productName || "â€”",
            packagingType: item.suggestPackaging || "Belum ditentukan",
            difficultyLevel: Number(item.difficultyLevel ?? 1),
            busdev: item.lead?.pic?.fullName || "â€”",
            picPo: item.pic?.fullName || "Belum ditugaskan",
            requestedAt: formatDate(item.requestedAt),
            targetDeadline: item.targetDeadline || null,
            stage: item.stage || "QUEUE",
            status: deriveStatus(item.stage, item.targetDeadline),
            latestStageNotes: latestLog?.notes || null,
          };
        });
      } catch {
        return [];
      }
    },
  });

  // Full stage history for the open timeline (GET /rnd/samples/:id).
  const { data: timelineDetail, isLoading: isTimelineLoading } = useQuery<SampleTimelineDetail | null>({
    queryKey: ["rnd-sample-timeline", viewingTimelineId],
    enabled: !!viewingTimelineId,
    queryFn: async () => {
      try {
        const res = await api.get(`/rnd/samples/${viewingTimelineId}`);
        const sample = res.data?.data || res.data;
        if (!sample) return null;
        return {
          id: sample.id,
          formula: Array.isArray(sample.formulas) && sample.formulas[0]
            ? {
                id: sample.formulas[0].id,
                formulaCode: sample.formulas[0].formulaCode || "â€”",
                version: Number(sample.formulas[0].version ?? 0),
                phases: Array.isArray(sample.formulas[0].phases)
                  ? sample.formulas[0].phases.map((ph: any): FormulaPhase => ({
                      id: ph.id,
                      prefix: ph.prefix || "â€”",
                      customName: ph.customName || null,
                      instructions: ph.instructions || null,
                      items: Array.isArray(ph.items)
                        ? ph.items.map((it: any): FormulaPhaseItem => ({
                            id: it.id,
                            dosagePercentage: it.dosagePercentage ?? 0,
                            materialName: it.material?.name || it.material?.code || "â€”",
                          }))
                        : [],
                    }))
                  : [],
              }
            : null,
          stageLogs: Array.isArray(sample.stageLogs)
            ? sample.stageLogs
                .map((log: any): StageLog => ({
                  id: log.id,
                  stage: log.stage || "â€”",
                  enteredAt: log.enteredAt,
                  leftAt: log.leftAt || null,
                  durationDays: log.durationDays ?? null,
                  notes: log.notes || null,
                  rejectionReason: log.rejectionReason || null,
                }))
                .sort(
                  (a: StageLog, b: StageLog) =>
                    new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime()
                )
            : [],
        };
      } catch {
        return null;
      }
    },
  });

  const picOptions = useMemo(() => {
    const list = new Set<string>();
    data.forEach((proj) => {
      if (proj.busdev && proj.busdev !== "â€”") list.add(proj.busdev);
      if (proj.picPo && proj.picPo !== "Belum ditugaskan") list.add(proj.picPo);
    });
    return Array.from(list).sort();
  }, [data]);

  const toggleRowExpansion = (id: string) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setTabFilter("ALL");
    setPicFilter("ALL");
    setSearchQuery("");
    setPage(1);
  };

  const filteredProjects = useMemo(() => {
    return data.filter((item) => {
      if (tabFilter !== "ALL" && item.status !== tabFilter) return false;

      if (picFilter !== "ALL") {
        const matchPicPo = item.picPo.toLowerCase().includes(picFilter.toLowerCase());
        const matchBusdev = item.busdev.toLowerCase().includes(picFilter.toLowerCase());
        if (!matchPicPo && !matchBusdev) return false;
      }

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          item.sampleCode.toLowerCase().includes(q) ||
          item.customer.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.product.toLowerCase().includes(q) ||
          item.packagingType.toLowerCase().includes(q) ||
          item.picPo.toLowerCase().includes(q) ||
          item.busdev.toLowerCase().includes(q) ||
          item.stage.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [data, tabFilter, picFilter, searchQuery]);

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;

  const counts: ChecklistCounts = useMemo(
    () => ({
      all: data.length,
      onTrack: data.filter((p) => p.status === "ON_TRACK").length,
      pending: data.filter((p) => p.status === "PENDING_APPROVAL").length,
      overdue: data.filter((p) => p.status === "OVERDUE").length,
    }),
    [data]
  );

  return {
    // Search & Filter State
    searchQuery,
    setSearchQuery,
    tabFilter,
    setTabFilter,
    picFilter,
    setPicFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    expandedRowIds,
    setExpandedRowIds,
    viewingTimelineId,
    setViewingTimelineId,

    // Data & Query States
    data,
    isLoading,
    isError,
    refetch,
    timelineDetail,
    isTimelineLoading,

    // Computed Values
    picOptions,
    filteredProjects,
    paginatedProjects,
    totalPages,
    counts,

    // Actions
    toggleRowExpansion,
    handleResetFilters,
  };
}

export type UseChecklistTrackingOperationsReturn = ReturnType<typeof useChecklistTrackingOperations>;
