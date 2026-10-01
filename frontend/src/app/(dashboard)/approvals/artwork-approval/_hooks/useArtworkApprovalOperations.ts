"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  DecisionStatus,
  DesignTaskHistoryResponse,
  DesignTaskRow,
  DrawerTab,
  latestVersionOf,
} from "../_types/artwork-approval.types";

export function useArtworkApprovalOperations() {
  const qc = useQueryClient();
  const queryKey = ["creative-tasks-approval"];

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState<DesignTaskRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("detail");

  const [isApjModalOpen, setIsApjModalOpen] = useState(false);
  const [apjDecision, setApjDecision] = useState<DecisionStatus>("APPROVED");
  const [apjPin, setApjPin] = useState("");
  const [apjNotes, setApjNotes] = useState("");

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientDecision, setClientDecision] = useState<DecisionStatus>("APPROVED");
  const [clientNotes, setClientNotes] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery<DesignTaskRow[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/creative/tasks", { params: { limit: 100 } });
      const body = unwrapResponse<any>(resp);
      if (Array.isArray(body)) return body;
      return Array.isArray(body?.data) ? body.data : [];
    },
  });

  const selectedId = selectedTask?.id;
  const {
    data: history,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useQuery<DesignTaskHistoryResponse>({
    queryKey: ["creative-task-history", selectedId],
    enabled: Boolean(selectedId && isDrawerOpen),
    queryFn: async () => {
      const resp = await api.get(`/creative/tasks/${selectedId}/history`);
      return unwrapResponse<DesignTaskHistoryResponse>(resp);
    },
  });

  const clientReview = useMutation({
    mutationFn: (p: { id: string; status: DecisionStatus; versionId: string; notes: string }) =>
      api
        .patch(`/creative/task/${p.id}/client-review`, {
          status: p.status,
          versionId: p.versionId,
          notes: p.notes,
          reason: p.status === "REJECTED" ? p.notes : undefined,
        })
        .then((r) => unwrapResponse(r)),
    onSuccess: (_res, p) => {
      toast.success(
        p.status === "APPROVED" ? "Artwork disetujui klien (final)." : "Artwork dikembalikan untuk revisi.",
      );
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["creative-task-history", p.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyimpan keputusan klien."),
  });

  const apjReview = useMutation({
    mutationFn: (p: { id: string; status: DecisionStatus; versionId: string; notes: string; pin: string }) =>
      api
        .patch(`/creative/task/${p.id}/apj-review`, {
          status: p.status,
          versionId: p.versionId,
          notes: p.notes,
          pin: p.pin,
        })
        .then((r) => unwrapResponse(r)),
    onSuccess: (_res, p) => {
      toast.success(p.status === "APPROVED" ? "Review APJ/Legal disetujui." : "Review APJ/Legal menolak artwork.");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["creative-task-history", p.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyimpan review APJ."),
  });

  const tasks = useMemo<DesignTaskRow[]>(() => (Array.isArray(data) ? data : []), [data]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          (t.brief || "").toLowerCase().includes(q) ||
          (t.lead?.clientName || "").toLowerCase().includes(q) ||
          (t.lead?.brandName || "").toLowerCase().includes(q);
        const matchState = stateFilter === "ALL" || t.kanbanState === stateFilter;
        return matchSearch && matchState;
      }),
    [tasks, searchQuery, stateFilter],
  );

  const counts = useMemo(
    () => ({
      total: tasks.length,
      waitingApj: tasks.filter((t) => t.kanbanState === "WAITING_APJ").length,
      waitingClient: tasks.filter((t) => t.kanbanState === "WAITING_CLIENT").length,
      final: tasks.filter((t) => t.kanbanState === "LOCKED" || t.isFinal).length,
    }),
    [tasks],
  );

  const openDrawer = (task: DesignTaskRow) => {
    setSelectedTask(task);
    setDrawerTab("detail");
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const startClientDecision = (task: DesignTaskRow, status: DecisionStatus) => {
    setClientDecision(status);
    setClientNotes("");
    setIsClientModalOpen(true);
  };

  const closeClientModal = () => {
    setIsClientModalOpen(false);
  };

  const startApjDecision = (task: DesignTaskRow, status: DecisionStatus) => {
    setApjDecision(status);
    setApjPin("");
    setApjNotes("");
    setIsApjModalOpen(true);
  };

  const closeApjModal = () => {
    setIsApjModalOpen(false);
  };

  const submitClientDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    const ver = latestVersionOf(selectedTask);
    if (!ver) {
      toast.error("Belum ada versi desain yang diunggah, keputusan tidak dapat dicatat.");
      return;
    }
    if (clientDecision === "REJECTED" && !clientNotes.trim()) {
      toast.error("Catatan revisi wajib diisi untuk penolakan.");
      return;
    }
    clientReview.mutate(
      { id: selectedTask.id, status: clientDecision, versionId: ver.id, notes: clientNotes },
      { onSuccess: () => setIsClientModalOpen(false) },
    );
  };

  const submitApjDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    const ver = latestVersionOf(selectedTask);
    if (!ver) {
      toast.error("Belum ada versi desain yang diunggah, keputusan tidak dapat dicatat.");
      return;
    }
    if (!apjPin.trim()) {
      toast.error("PIN approval wajib diisi (e-signature).");
      return;
    }
    apjReview.mutate(
      { id: selectedTask.id, status: apjDecision, versionId: ver.id, notes: apjNotes, pin: apjPin },
      { onSuccess: () => setIsApjModalOpen(false) },
    );
  };

  const selectedVersion = selectedTask ? latestVersionOf(selectedTask) : undefined;

  return {
    // state
    searchQuery,
    setSearchQuery,
    stateFilter,
    setStateFilter,
    selectedTask,
    isDrawerOpen,
    drawerTab,
    setDrawerTab,
    isApjModalOpen,
    apjDecision,
    apjPin,
    setApjPin,
    apjNotes,
    setApjNotes,
    isClientModalOpen,
    clientDecision,
    clientNotes,
    setClientNotes,

    // queries
    isLoading,
    isError,
    error,
    refetch,
    history,
    isHistoryLoading,
    isHistoryError,
    refetchHistory,

    // mutations
    clientReview,
    apjReview,

    // derived
    tasks,
    filteredTasks,
    counts,
    selectedVersion,

    // handlers
    openDrawer,
    closeDrawer,
    startClientDecision,
    closeClientModal,
    startApjDecision,
    closeApjModal,
    submitClientDecision,
    submitApjDecision,
  };
}

export type ArtworkApprovalOperations = ReturnType<typeof useArtworkApprovalOperations>;
