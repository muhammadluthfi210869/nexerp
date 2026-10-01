"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ProjectRow,
  ProjectControlSummary,
  unwrapList,
} from "../_types/project-control.types";

export function useProjectControlOperations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ProjectRow[]>({
    queryKey: ["marketing-projects"],
    queryFn: async () => {
      try {
        const res = await api.get("/marketing/projects", {
          params: { limit: 100 },
        });
        return unwrapList(res.data).map(
          (row: any): ProjectRow => ({
            id: row.id,
            projectCode: row.projectCode || "â€”",
            name: row.name || "â€”",
            channel: row.channel || "â€”",
            category: row.category || "â€”",
            status: row.canonicalStatus || row.status || "PLANNED",
            progress: Number(row.progress ?? 0),
            startDate: row.startDate || null,
            deadline: row.deadline || null,
            summary: row.summary || null,
            blockers: row.blockers || null,
            taskCount: Number(row._count?.tasks ?? 0),
            ownerName: row.owner?.fullName || row.owner?.name || "â€”",
            brandName: row.brand?.name || null,
            updatedAt: row.updatedAt,
          })
        );
      } catch {
        return [];
      }
    },
  });

  const summary: ProjectControlSummary = useMemo(() => {
    const active = data.filter(
      (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED"
    );
    const avgProgress = active.length
      ? Math.round(
          active.reduce((acc, p) => acc + p.progress, 0) / active.length
        )
      : 0;
    return {
      totalActive: active.length,
      onTrack: active.filter((p) => p.status === "ON_TRACK").length,
      atRisk: active.filter((p) => p.status === "AT_RISK").length,
      onHold: active.filter((p) => p.status === "ON_HOLD").length,
      planned: active.filter((p) => p.status === "PLANNED").length,
      completed: data.filter((p) => p.status === "COMPLETED").length,
      blocked: active.filter((p) => Boolean(p.blockers?.trim())).length,
      avgProgress,
    };
  }, [data]);

  const attentionProjects = useMemo(
    () =>
      data.filter(
        (p) => p.status === "AT_RISK" || Boolean(p.blockers?.trim())
      ),
    [data]
  );

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data
      .filter((p) => {
        const matchSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(q) ||
          p.projectCode.toLowerCase().includes(q) ||
          p.ownerName.toLowerCase().includes(q) ||
          (p.brandName || "").toLowerCase().includes(q);
        const matchStatus =
          statusFilter === "ALL" || p.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const order: Record<string, number> = {
          AT_RISK: 0,
          ON_HOLD: 1,
          PLANNED: 2,
          ON_TRACK: 3,
          COMPLETED: 4,
          CANCELLED: 5,
        };
        return (order[a.status] ?? 99) - (order[b.status] ?? 99);
      });
  }, [data, searchQuery, statusFilter]);

  const onTrackPct = Math.round(
    (summary.onTrack / (summary.totalActive || 1)) * 100
  );

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    data,
    isLoading,
    isError,
    refetch,
    summary,
    attentionProjects,
    filteredProjects,
    onTrackPct,
  };
}
