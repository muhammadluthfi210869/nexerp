"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  NpfSampleRow,
  CreateNpfForm,
  FeedbackDecision,
  STAGE_LABEL,
  DECISION_STAGE,
  str,
  fmtDate,
  num,
} from "../_types/npf.types";

export function useNpfOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNpf, setSelectedNpf] = useState<NpfSampleRow | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Form state â€” exactly the fields `POST /rnd/npf` accepts. Anything else the
  // form collects but the endpoint does not persist would be a silent lie.
  const [createForm, setCreateForm] = useState<CreateNpfForm>({
    leadId: "",
    clientLabel: "",
    productName: "",
    targetPrice: 0,
    conceptNotes: "",
  });

  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackDecision, setFeedbackDecision] = useState<FeedbackDecision>("APPROVED");

  const samplesQuery = useQuery<NpfSampleRow[]>({
    queryKey: ["rnd-npf-samples"],
    queryFn: async () => {
      const res = await api.get("/rnd/samples");
      const body = unwrapResponse<any>(res.data);
      const list: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return list.map((s: any): NpfSampleRow => {
        const stage = str(s.stage, "QUEUE");
        const version = num(s.version) || 1;
        const revisionCount = num(s.revisionCount);
        return {
          id: String(s.id),
          sampleCode: str(s.sampleCode),
          entryDate: fmtDate(s.requestedAt ?? s.createdAt),
          clientName: str(s.lead?.clientName, "Pelanggan tidak diketahui"),
          brandName: str(s.lead?.brandName, "â€”"),
          productName: str(s.productName),
          targetFunction: str(s.targetFunction),
          textureReq: str(s.textureReq),
          aromaReq: str(s.aromaReq),
          colorReq: str(s.colorReq),
          targetHppPrice: num(s.targetHpp),
          targetDeadline: s.targetDeadline ?? null,
          formulatorPic: str(s.pic?.name ?? s.rnd?.fullName, "Belum ditugaskan"),
          busdevPic: str(s.lead?.pic?.name, "â€”"),
          currentRevision:
            revisionCount > 0 ? `Rev ${version} (${revisionCount}x revisi)` : `Rev ${version}`,
          stage,
          stageLabel: STAGE_LABEL[stage] ?? stage,
          courier: str(s.courierName, ""),
          trackingAwb: str(s.trackingNumber, ""),
          clientFeedback: str(s.clientFeedback ?? s.feedback, ""),
        };
      });
    },
  });

  const samples = samplesQuery.data ?? [];

  const filteredNpfs = useMemo(() => {
    return samples.filter((n) => {
      if (activeTab === "lab" && n.stage !== "FORMULATING" && n.stage !== "LAB_TEST") return false;
      if (activeTab === "shipped" && n.stage !== "READY_TO_SHIP" && n.stage !== "SHIPPED" && n.stage !== "RECEIVED") return false;
      if (activeTab === "approved" && n.stage !== "APPROVED") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          n.sampleCode.toLowerCase().includes(q) ||
          n.clientName.toLowerCase().includes(q) ||
          n.brandName.toLowerCase().includes(q) ||
          n.productName.toLowerCase().includes(q) ||
          n.formulatorPic.toLowerCase().includes(q) ||
          n.textureReq.toLowerCase().includes(q) ||
          n.aromaReq.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [samples, activeTab, searchQuery]);

  const totalNpfs = samples.length;
  const labTrialCount = samples.filter((n) => n.stage === "FORMULATING" || n.stage === "LAB_TEST").length;
  const shippedCount = samples.filter((n) => n.stage === "READY_TO_SHIP" || n.stage === "SHIPPED" || n.stage === "RECEIVED").length;
  const approvedCount = samples.filter((n) => n.stage === "APPROVED").length;

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/rnd/npf", {
        leadId: createForm.leadId,
        productName: createForm.productName.trim(),
        targetPrice: num(createForm.targetPrice),
        conceptNotes: createForm.conceptNotes.trim() || undefined,
      });
      return unwrapResponse(res.data);
    },
    onSuccess: () => {
      toast.success(
        "Dokumen NPF Disimpan",
        "Dokumen formulasi produk baru berhasil didaftarkan ke tim R&D."
      );
      queryClient.invalidateQueries({ queryKey: ["rnd-npf-samples"] });
      setIsCreateModalOpen(false);
      setCreateForm({ leadId: "", clientLabel: "", productName: "", targetPrice: 0, conceptNotes: "" });
    },
    onError: (error) => {
      toast.error("Gagal Menyimpan NPF", extractApiError(error).message);
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/rnd/sample/${selectedNpf?.id}/advance`, {
        newStage: feedbackDecision,
        feedback: feedbackNotes.trim() || undefined,
      });
      return unwrapResponse(res.data);
    },
    onSuccess: () => {
      toast.success(
        feedbackDecision === "APPROVED" ? "Sample Disetujui (Approved)" : "Sample Ditolak â€” Revisi Diajukan",
        feedbackDecision === "APPROVED"
          ? "Sample telah disetujui klien. Project dapat dilanjutkan ke tahap HPP & SPK Pra-Produksi."
          : "Keputusan penolakan tercatat; formulator dapat memulai revisi formula."
      );
      queryClient.invalidateQueries({ queryKey: ["rnd-npf-samples"] });
      setIsFeedbackModalOpen(false);
      setFeedbackNotes("");
    },
    onError: (error) => {
      toast.error("Gagal Menyimpan Keputusan", extractApiError(error).message);
    },
  });

  const handleCreateNpf = () => {
    if (!createForm.leadId) {
      toast.warning("Form Belum Lengkap", "Pelanggan harus dipilih dari daftar master pelanggan.");
      return;
    }
    if (!createForm.productName.trim()) {
      toast.warning("Form Belum Lengkap", "Nama Produk wajib diisi.");
      return;
    }
    createMutation.mutate();
  };

  const handleSaveFeedback = () => {
    if (!selectedNpf || selectedNpf.stage !== DECISION_STAGE) return;
    feedbackMutation.mutate();
  };

  const handleExport = () => {
    const header = [
      "Kode Sample", "Tanggal", "Klien", "Brand", "Produk", "Fungsi", "Tahap",
      "Revisi", "Formulator", "Kurir", "Resi", "Feedback Klien",
    ];
    const body = filteredNpfs.map((r) => [
      r.sampleCode, r.entryDate, r.clientName, r.brandName, r.productName,
      r.targetFunction, r.stageLabel, r.currentRevision, r.formulatorPic,
      r.courier, r.trackingAwb, r.clientFeedback,
    ]);
    const csv = [header, ...body]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "daftar-sample-npf.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export Berhasil", `${filteredNpfs.length} baris diunduh sebagai CSV.`);
  };

  const openDetailModal = (row: NpfSampleRow) => {
    setSelectedNpf(row);
    setIsDetailModalOpen(true);
  };

  const openFeedbackModal = (row: NpfSampleRow) => {
    setSelectedNpf(row);
    setFeedbackNotes(row.clientFeedback);
    setFeedbackDecision("APPROVED");
    setIsFeedbackModalOpen(true);
  };

  return {
    // State
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedNpf,
    setSelectedNpf,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
    createForm,
    setCreateForm,
    feedbackNotes,
    setFeedbackNotes,
    feedbackDecision,
    setFeedbackDecision,

    // Query state
    samplesQuery,
    samples,
    filteredNpfs,
    totalNpfs,
    labTrialCount,
    shippedCount,
    approvedCount,

    // Mutation state
    createMutation,
    feedbackMutation,

    // Handlers
    handleCreateNpf,
    handleSaveFeedback,
    handleExport,
    openDetailModal,
    openFeedbackModal,
  };
}
