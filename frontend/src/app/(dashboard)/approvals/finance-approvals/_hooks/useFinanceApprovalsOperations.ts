"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { FundRequest, INITIAL_FUND_REQUESTS } from "../_types/finance-approvals.types";

export function useFinanceApprovalsOperations() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: requests = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<FundRequest[]>({
    queryKey: ["finance-fund-approvals"],
    queryFn: async () => {
      const resp = await api.get("/finance/fund-requests");
      return resp.data;
    },
    initialData: INITIAL_FUND_REQUESTS,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/finance/fund-request/${id}/approve`, {}),
    onSuccess: () => {
      toast.success("Pengajuan disetujui.");
      queryClient.invalidateQueries({ queryKey: ["finance-fund-approvals"] });
    },
  });

  const disburseMutation = useMutation({
    mutationFn: (id: string) => api.post(`/finance/fund-request/${id}/disburse`, {}),
    onSuccess: () => {
      toast.success("Dana dicairkan & Jurnal diposting.");
      queryClient.invalidateQueries({ queryKey: ["finance-fund-approvals"] });
    },
  });

  const filteredRequests = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return requests.filter((req: FundRequest) => {
      return (
        req.reason?.toLowerCase().includes(term) ||
        req.departmentId?.toLowerCase().includes(term) ||
        req.user?.fullName?.toLowerCase().includes(term) ||
        req.status?.toLowerCase().includes(term)
      );
    });
  }, [requests, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    requests,
    filteredRequests,
    isLoading,
    isError,
    refetch,
    approveMutation,
    disburseMutation,
    handleApprove: (id: string) => approveMutation.mutate(id),
    handleDisburse: (id: string) => disburseMutation.mutate(id),
    isApproving: approveMutation.isPending,
    isDisbursing: disburseMutation.isPending,
  };
}

export type FinanceApprovalsOperations = ReturnType<typeof useFinanceApprovalsOperations>;
