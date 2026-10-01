"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FinanceDashboardMetrics,
  UseFinanceDashboardOperationsResult,
} from "../_types/dashboard.types";

export function useFinanceDashboardOperations(): UseFinanceDashboardOperationsResult {
  const { data: metrics, isLoading, error, refetch } = useQuery<FinanceDashboardMetrics>({
    queryKey: ["finance-dashboard-metrics"],
    queryFn: async () => {
      const resp = await api.get("/finance/dashboard/advanced");
      return resp.data.metrics;
    },
    staleTime: 30000,
  });

  return {
    metrics,
    isLoading,
    error: (error as Error) || null,
    refetch,
  };
}
