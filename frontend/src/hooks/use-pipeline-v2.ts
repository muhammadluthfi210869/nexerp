"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { PipelineLead, AuditLogEntry } from "@/types/pipeline-v2";

export function usePipelineV2() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const leadsQuery = useQuery({
    queryKey: ["pipeline-v2", "leads"],
    queryFn: async (): Promise<PipelineLead[]> =>
      (await api.get("/bussdev/pipeline-v2/leads")).data,
    staleTime: 15000,
  });

  const auditQuery = useQuery({
    queryKey: ["pipeline-v2", "audit"],
    queryFn: async (): Promise<AuditLogEntry[]> =>
      (await api.get("/bussdev/pipeline-v2/audit")).data,
    staleTime: 30000,
  });

  const advanceMutation = useMutation({
    mutationFn: async ({
      leadId,
      targetStage,
      files,
      notes,
    }: {
      leadId: string | number;
      targetStage: string;
      files: File[];
      notes: string;
    }) => {
      const formData = new FormData();

      // Map files to correct field names based on target stage
      if (targetStage === "SAMPLE_REQUESTED") {
        files.forEach((file) => formData.append("pnfFile", file));
      }
      if (targetStage === "SPK_SIGNED") {
        files.forEach((file) => formData.append("spkFile", file));
      }
      if (targetStage === "WAITING_FINANCE_APPROVAL") {
        files.forEach((file) => formData.append("paymentProof", file));
      }

      formData.append("action", "STAGE_UPDATED");
      formData.append("newStatus", targetStage);
      formData.append("notes", notes);
      formData.append("loggedBy", (user as any)?.fullName || (user as any)?.username || "SYSTEM");

      return (await api.patch(`/bussdev/lead/${leadId}/advance`, formData)).data;
    },
    onSuccess: () => {
      toast.success("Workflow executed successfully!");
      queryClient.invalidateQueries({ queryKey: ["pipeline-v2"] });
      queryClient.invalidateQueries({ queryKey: ["bussdev-analytics"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Workflow execution failed.");
    },
  });

  return {
    leads: leadsQuery.data ?? [],
    isLeadsLoading: leadsQuery.isLoading,
    leadsError: leadsQuery.error,
    refetchLeads: leadsQuery.refetch,
    audit: auditQuery.data ?? [],
    isAuditLoading: auditQuery.isLoading,
    auditError: auditQuery.error,
    refetchAudit: auditQuery.refetch,
    executeWorkflow: advanceMutation.mutateAsync,
    isExecuting: advanceMutation.isPending,
  };
}
