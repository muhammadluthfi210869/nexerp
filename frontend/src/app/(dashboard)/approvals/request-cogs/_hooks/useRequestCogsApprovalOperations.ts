"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { CogsApprovalItem, toItem } from "../_types/request-cogs.types";

export function useRequestCogsApprovalOperations() {
  const qc = useQueryClient();
  const queryKey = ["job-order-costings-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/finance/job-order-costings");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/finance/job-order-costings/${id}/close`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Permintaan HPP disetujui (job order ditutup).");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui permintaan HPP."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/finance/job-order-costings/${id}/reopen`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Job order dibuka kembali.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal membuka kembali job order."),
  });

  const items = React.useMemo<CogsApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data],
  );

  return {
    items,
    isLoading,
    isError,
    error,
    refetch,
    approveMutation,
    rejectMutation,
    handleApprove: async (id: string, _notes?: string) => {
      await approveMutation.mutateAsync(id);
    },
    handleReject: async (id: string, _reason: string) => {
      await rejectMutation.mutateAsync(id);
    },
  };
}
