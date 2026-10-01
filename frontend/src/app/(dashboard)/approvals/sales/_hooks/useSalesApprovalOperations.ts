import { useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  type SalesOrderApprovalItem,
  buildDetailData,
  toItem,
} from "../_types/sales.types";

export function useSalesApprovalOperations() {
  const qc = useQueryClient();
  const queryKey = ["sales-orders-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/commercial/sales-orders");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api
        .patch(`/commercial/sales-orders/${id}`, { status: "ACTIVE" })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Sales order disetujui dan diaktifkan.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui sales order."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api
        .patch(`/commercial/sales-orders/${id}`, { status: "CANCELLED" })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Sales order dibatalkan.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal membatalkan sales order."),
  });

  const items = useMemo<SalesOrderApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data],
  );

  const handleApprove = useCallback(
    (id: string) => approveMutation.mutateAsync(id),
    [approveMutation],
  );

  const handleReject = useCallback(
    (id: string) => rejectMutation.mutateAsync(id),
    [rejectMutation],
  );

  const errStatus = (error as { response?: { status?: number } })?.response?.status;
  const isAccessDenied = errStatus === 401 || errStatus === 403;

  return {
    items,
    buildDetailData,
    handleApprove,
    handleReject,
    isLoading,
    isError,
    isAccessDenied,
    error,
    refetch,
    approveMutation,
    rejectMutation,
  };
}
