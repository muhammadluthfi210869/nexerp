"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  StabilityStudy,
  NewStudyFormState,
  LogResultFormState,
} from "../_types/stability.types";

const INITIAL_NEW_STUDY: NewStudyFormState = {
  product: "",
  batch: "",
  chamber: "A",
  startDate: new Date().toISOString().split("T")[0],
  interval: "1M",
  notes: "",
};

const INITIAL_LOG_RESULT: LogResultFormState = {
  date: new Date().toISOString().split("T")[0],
  month: 1,
  ph: "",
  viscosity: "",
  appearance: "STABLE",
  notes: "",
};

export function useStabilityOperations() {
  const [showNewStudy, setShowNewStudy] = useState(false);
  const [showLogResult, setShowLogResult] = useState<string | null>(null);
  const [localStudies, setLocalStudies] = useState<StabilityStudy[]>([]);
  const queryClient = useQueryClient();

  const [newStudy, setNewStudy] = useState<NewStudyFormState>(INITIAL_NEW_STUDY);
  const [logResult, setLogResult] = useState<LogResultFormState>(INITIAL_LOG_RESULT);

  const { data: stabilityLogs, isLoading } = useQuery<StabilityStudy[]>({
    queryKey: ["stability-logs"],
    queryFn: async () => {
      const res = await api.get("/rnd/lab-test-results", { params: { type: "stability" } });
      return (res.data || []).map((r: any) => ({
        id: r.id.substring(0, 8).toUpperCase(),
        product: r.formula?.name || "Unknown",
        batch: r.formula?.sampleRequest?.sampleCode || "â€”",
        startDate: new Date(r.testDate).toISOString().split("T")[0],
        currentMonth: Math.floor((Date.now() - new Date(r.testDate).getTime()) / (30 * 24 * 60 * 60 * 1000)) || 1,
        status: r.stability40C === "STABLE" && r.stabilityRT === "STABLE" ? "STABLE" : "MONITORING",
        nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        chamber: "A",
        interval: "1M",
        notes: "",
        results: [],
      }));
    },
  });

  const createStudyMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post("/qc/audits", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Stability study created");
      queryClient.invalidateQueries({ queryKey: ["stability-logs"] });
      setShowNewStudy(false);
      setNewStudy(INITIAL_NEW_STUDY);
    },
    onError: (err: any) => {
      toast.error("Failed to create study", {
        description: err.response?.data?.message || "Check connection",
      });
    },
  });

  const logResultMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post("/qc/audits", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Test result logged");
      queryClient.invalidateQueries({ queryKey: ["stability-logs"] });
      setShowLogResult(null);
      setLogResult(INITIAL_LOG_RESULT);
    },
    onError: (err: any) => {
      toast.error("Failed to log result", {
        description: err.response?.data?.message || "Check connection",
      });
    },
  });

  const handleCreateStudy = () => {
    if (!newStudy.product) {
      toast.error("Product name is required");
      return;
    }

    const study: StabilityStudy = {
      id: `STAB-${Date.now().toString(36).toUpperCase()}`,
      product: newStudy.product,
      batch: newStudy.batch || `B-${Date.now()}`,
      chamber: newStudy.chamber,
      startDate: newStudy.startDate,
      interval: newStudy.interval,
      notes: newStudy.notes,
      status: "INITIATED",
      currentMonth: 1,
      nextTest: newStudy.startDate,
      results: [],
    };

    setLocalStudies((prev) => [study, ...prev]);
    setShowNewStudy(false);
    setNewStudy(INITIAL_NEW_STUDY);
    toast.success("New stability study added");
  };

  const handleLogResult = (studyId: string) => {
    if (!logResult.ph && !logResult.viscosity) {
      toast.error("Enter at least one test value");
      return;
    }

    setLocalStudies((prev) =>
      prev.map((s) => {
        if (s.id !== studyId) return s;
        return {
          ...s,
          status: logResult.appearance === "STABLE" ? "STABLE" : "MONITORING",
          currentMonth: logResult.month,
          nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          results: [
            ...s.results,
            {
              date: logResult.date,
              month: logResult.month,
              ph: logResult.ph,
              viscosity: logResult.viscosity,
              appearance: logResult.appearance,
              notes: logResult.notes,
            },
          ],
        };
      }),
    );

    logResultMutation.mutate({
      status: logResult.appearance === "STABLE" ? "GOOD" : "REJECT",
      phase: "FINAL",
      notes: `Stability ${logResult.appearance} | pH: ${logResult.ph} | Visc: ${logResult.viscosity} | ${logResult.notes}`,
    });

    setShowLogResult(null);
    setLogResult(INITIAL_LOG_RESULT);
  };

  const handleOpenNewStudy = () => setShowNewStudy(true);
  const handleCloseNewStudy = () => setShowNewStudy(false);

  const handleOpenLogResult = (study: StabilityStudy) => {
    setShowLogResult(study.id);
    setLogResult({
      date: new Date().toISOString().split("T")[0],
      month: (study.currentMonth || 1) + 1,
      ph: "",
      viscosity: "",
      appearance: "STABLE",
      notes: "",
    });
  };
  const handleCloseLogResult = () => setShowLogResult(null);

  const allStudies: StabilityStudy[] = [...(stabilityLogs || []), ...localStudies];

  return {
    showNewStudy,
    setShowNewStudy,
    showLogResult,
    setShowLogResult,
    localStudies,
    setLocalStudies,
    newStudy,
    setNewStudy,
    logResult,
    setLogResult,
    stabilityLogs,
    isLoading,
    createStudyMutation,
    logResultMutation,
    handleCreateStudy,
    handleLogResult,
    handleOpenNewStudy,
    handleCloseNewStudy,
    handleOpenLogResult,
    handleCloseLogResult,
    allStudies,
  };
}
