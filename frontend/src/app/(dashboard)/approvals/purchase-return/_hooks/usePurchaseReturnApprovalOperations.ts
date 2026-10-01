import { useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  type PurchaseReturnItem,
  buildDetailData,
  toItem,
} from "../_types/purchase-return.types";

export function usePurchaseReturnApprovalOperations() {
  const qc = useQueryClient();
  const queryKey = ["purchase-returns-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/scm/purchase-returns");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/scm/purchase-returns/${id}/approve`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Retur pembelian disetujui.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui retur pembelian."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api
        .patch(`/scm/purchase-returns/${id}/status`, {
          status: "CANCELLED",
          notes: "Ditolak dari layar persetujuan retur pembelian.",
        })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Retur pembelian dibatalkan.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal membatalkan retur pembelian."),
  });

  const items = useMemo<PurchaseReturnItem[]>(
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
