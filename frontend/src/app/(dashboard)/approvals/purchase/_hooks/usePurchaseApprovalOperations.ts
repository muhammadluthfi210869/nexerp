"use client";

import { useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  type PurchaseApprovalItem,
  type RejectPurchasePayload,
  toItem,
} from "../_types/purchase.types";

export function usePurchaseApprovalOperations() {
  const qc = useQueryClient();
  const queryKey = ["purchase-orders-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/scm/purchase-orders");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/scm/purchase-orders/${id}/approve`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Purchase order disetujui.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui purchase order."),
  });

  const rejectMutation = useMutation({
    mutationFn: (p: RejectPurchasePayload) =>
      api
        .post(`/scm/purchase-orders/${p.id}/reject`, { reason: p.reason })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Purchase order ditolak.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menolak purchase order."),
  });

  const items = useMemo<PurchaseApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data],
  );

  const handleApprove = useCallback(
    (id: string) => approveMutation.mutateAsync(id),
    [approveMutation],
  );

  const handleReject = useCallback(
    (id: string, reason: string) => rejectMutation.mutateAsync({ id, reason }),
    [rejectMutation],
  );

  return {
    items,
    handleApprove,
    handleReject,
    isLoading,
    isError,
    error,
    refetch,
    approveMutation,
    rejectMutation,
  };
}
