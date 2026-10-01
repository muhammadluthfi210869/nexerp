"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CandidateItem, CreateCandidatePayload, CandidateStage } from "../_types/recruitment.types";

export function useRecruitmentOperations() {
  const queryClient = useQueryClient();
  const [filterTab, setFilterTab] = useState<"ALL" | "IN_PROCESS" | "HIRED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);

  const { data: candidates = [], isLoading, refetch } = useQuery<CandidateItem[]>({
    queryKey: ["hr-candidates"],
    queryFn: async () => {
      const res = await api.get("/hr/candidates");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateCandidatePayload) => {
      const res = await api.post("/hr/candidates", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-candidates"] });
      toast.success("Kandidat berhasil didaftarkan ke pipeline ATS!");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menambahkan kandidat");
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage, rejectionReason }: { id: string; stage: CandidateStage; rejectionReason?: string }) => {
      const res = await api.patch(`/hr/candidates/${id}/stage`, { stage, rejectionReason });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hr-candidates"] });
      toast.success(
        variables.stage === "HIRED"
          ? "Selamat! Kandidat dinyatakan LOLOS (Hired)."
          : variables.stage === "REJECTED"
          ? "Kandidat telah ditandai Ditolak (Reject)."
          : `Tahapan kandidat berhasil diubah ke ${variables.stage}.`
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memperbarui tahapan kandidat");
    },
  });

  const filteredCandidates = candidates.filter((item) => {
    const matchesFilter =
      filterTab === "ALL" ? true : item.status === filterTab;
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return {
    candidates: filteredCandidates,
    allCandidates: candidates,
    isLoading,
    refetch,
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    selectedCandidate,
    setSelectedCandidate,
    createCandidate: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateStage: updateStageMutation.mutate,
    isUpdatingStage: updateStageMutation.isPending,
  };
}
