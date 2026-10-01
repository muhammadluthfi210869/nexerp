import { useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  type SalesReturnApprovalItem,
  buildDetailData,
  toItem,
} from "../_types/sales-return.types";

export function useSalesReturnApprovalOperations() {
  const qc = useQueryClient();
  const queryKey = ["sales-returns-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/bussdev/returns");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api
        .patch(`/bussdev/returns/${id}`, { returnStatus: "APPROVED" })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Retur penjualan disetujui.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui retur penjualan."),
  });

  const rejectMutation = useMutation({
    mutationFn: (p: { id: string; reason: string }) =>
      api
        .patch(`/bussdev/returns/${p.id}`, { returnStatus: "REJECTED", notes: p.reason })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Retur penjualan ditolak.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menolak retur penjualan."),
  });

  const items = useMemo<SalesReturnApprovalItem[]>(
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
