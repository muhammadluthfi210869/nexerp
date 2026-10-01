"use client";

import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  type ApiSample,
  type SalesSampleApprovalItem,
  buildDetailData,
  toItem,
} from "../_types/sales-sample.types";

export function useSalesSampleApprovalOperations() {
  const queryClient = useQueryClient();
  const queryKey = ["rnd-samples-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<ApiSample[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/rnd/samples");
      const body = resp.data;
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const handleApprove = useCallback(
    async (id: string, notes?: string) => {
      // Transition sample stage to APPROVED or call accept endpoint
      try {
        await api.patch(`/rnd/sample/${id}/advance`, {
          newStage: "APPROVED",
          feedback: notes || "Sample approved via approval portal",
        });
      } catch {
        await api.post(`/rnd/sample/${id}/accept`, {});
      }
      queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  const handleReject = useCallback(
    async (id: string, reason: string) => {
      await api.patch(`/rnd/sample/${id}/advance`, {
        newStage: "REJECTED",
        rejectionReason: reason || "Sample rejected by client / reviewer",
      });
      queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  const items = useMemo<SalesSampleApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data]
  );

  const errStatus = (error as { response?: { status?: number } })?.response?.status;
  const isAccessDenied = errStatus === 401 || errStatus === 403;
  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    "Gagal memuat daftar sample.";

  return {
    items,
    buildDetailData,
    handleApprove,
    handleReject,
    isLoading,
    isError,
    isAccessDenied,
    errorMessage,
    error,
    refetch,
  };
}

export type SalesSampleApprovalOperations = ReturnType<
  typeof useSalesSampleApprovalOperations
>;
