import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  ReleaseForm,
  emptyForm,
  ApjReleaseTab,
  ApjReleaseRecord,
} from "../_types/apj-release.types";

export function useApjReleaseOperations() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ApjReleaseTab>("log");
  const [form, setForm] = useState<ReleaseForm>({ ...emptyForm });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: releases = [], isLoading } = useQuery<ApjReleaseRecord[]>({
    queryKey: ["apj-releases"],
    queryFn: async () => {
      const resp = await api.get("/qc/apj-releases");
      return resp.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/qc/apj-releases", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apj-releases"] });
      toast.success("APJ Release Record Created Successfully");
      setForm({ ...emptyForm });
      setActiveTab("log");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create release record");
    },
  });

  const totalReleases = releases?.length ?? 0;
  const releasedCount = releases?.filter((r: any) => r.keputusan === "RELEASE").length ?? 0;
  const holdCount = releases?.filter((r: any) => r.keputusan === "HOLD").length ?? 0;
  const rejectCount = releases?.filter((r: any) => r.keputusan === "REJECT").length ?? 0;

  const filteredReleases = releases?.filter((r: any) => {
    const term = searchTerm.toLowerCase();
    return (
      r.batchRecord?.toLowerCase().includes(term) ||
      r.keputusan?.toLowerCase().includes(term) ||
      r.nie?.toLowerCase().includes(term) ||
      r.status?.toLowerCase().includes(term)
    );
  }) ?? [];

  const toggleDokumen = (dokumen: string) => {
    setForm((prev) => {
      const checked = prev.jenisDokumen.includes(dokumen);
      const nextDocs = checked
        ? prev.jenisDokumen.filter((d) => d !== dokumen)
        : [...prev.jenisDokumen, dokumen];

      const nextStatuses = prev.docStatuses.filter((ds) =>
        nextDocs.includes(ds.nama)
      );

      nextDocs.forEach((d) => {
        if (!nextStatuses.find((ds) => ds.nama === d)) {
          nextStatuses.push({ nama: d, status: "PENDING", catatan: "" });
        }
      });

      return { ...prev, jenisDokumen: nextDocs, docStatuses: nextStatuses };
    });
  };

  const updateDocStatus = (nama: string, field: "status" | "catatan", value: string) => {
    setForm((prev) => ({
      ...prev,
      docStatuses: prev.docStatuses.map((ds) =>
        ds.nama === nama ? { ...ds, [field]: value } : ds
      ),
    }));
  };

  const canSubmit =
    Boolean(form.batchRecord) &&
    form.jenisDokumen.length > 0 &&
    Boolean(form.keputusan) &&
    form.ttdDigital &&
    (form.keputusan !== "RELEASE" || form.nie.trim() !== "");

  const handleSubmit = () => {
    createMutation.mutate({
      batchRecord: form.batchRecord,
      docStatuses: form.docStatuses,
      nie: form.nie,
      keputusan: form.keputusan,
      ttdDigital: form.ttdDigital,
    });
    setConfirmOpen(false);
  };

  return {
    activeTab,
    setActiveTab,
    form,
    setForm,
    confirmOpen,
    setConfirmOpen,
    searchTerm,
    setSearchTerm,
    releases,
    isLoading,
    totalReleases,
    releasedCount,
    holdCount,
    rejectCount,
    filteredReleases,
    toggleDokumen,
    updateDocStatus,
    canSubmit,
    handleSubmit,
    createMutation,
  };
}
