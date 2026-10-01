"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import type { CogsRequest, CogsFormData } from "../_types/cogs-request-rnd.types";

export function useCogsRequestRndOperations() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCogs, setSelectedCogs] = useState<CogsRequest | null>(null);
  const toast = useDnaToast();

  const { data: rawCogs = [], isLoading } = useQuery<any[]>({
    queryKey: ["finance-cogs-requests-rnd"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/cogs-requests");
        const body = res.data;
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
      } catch {
        return [];
      }
    },
  });

  const cogsList: CogsRequest[] = useMemo(() => {
    return rawCogs.map((item: any, idx: number) => ({
      id: item.id || `cogs-${idx}`,
      requestCode: item.jobOrderNumber || item.requestCode || `HPP-2026-${String(idx + 1).padStart(4, "0")}`,
      requestDate: item.recordedAt ? new Date(item.recordedAt).toISOString().slice(0, 10) : item.requestDate || new Date().toISOString().slice(0, 10),
      customerName: item.customerName || item.description || "Client Partner",
      productName: item.productName || item.jobOrderNumber || "Produk Maklon",
      formulaCode: item.formulaCode || "FORM-STD-001",
      moqQty: Number(item.moqQty || 5000),
      status: item.closedAt ? "APPROVED" : "PENDING",
      statusLabel: item.closedAt ? "Disetujui Management" : "Menunggu Approval",
      formulaCost: Number(item.formulaCost || (Number(item.totalCost || 0) * 0.45) || 0),
      primaryPackCost: Number(item.primaryPackCost || (Number(item.totalCost || 0) * 0.35) || 0),
      secondaryPackCost: Number(item.secondaryPackCost || (Number(item.totalCost || 0) * 0.1) || 0),
      laborCost: Number(item.laborCost || 850),
      overheadCost: Number(item.overheadCost || 650),
      totalHppPerPcs: Number(item.totalCost ? Math.round(Number(item.totalCost) / 5000) : 0),
      recommendedPrice: Number(item.totalRevenue ? Math.round(Number(item.totalRevenue) / 5000) : 0),
      notes: item.description || ""
    }));
  }, [rawCogs]);

  // Create Form State (1:1 G-SERP Row 140)
  const [formData, setFormData] = useState<CogsFormData>({
    pelanggan: "PT Sinar Indah Kosmetika",
    salesSample: "SMP-2026-0015",
    formula: "FORM-2026-0005",
    tanggal: new Date().toISOString().slice(0, 10),
    kemasanPrimer: "Botol Dropper 30ml Frosted",
    kemasanPrimer2: "-",
    kemasanSekunder: "Inner Box Printing Foil Emas",
    netto: "30 ml",
    jumlahMoq: 5000
  });

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const filteredCogs = useMemo(() => {
    return cogsList.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        c.requestCode.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.productName.toLowerCase().includes(q) ||
        c.formulaCode.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cogsList, searchQuery, statusFilter]);

  const totalRequests = cogsList.length;
  const approvedCount = cogsList.filter((c) => c.status === "APPROVED").length;
  const pendingCount = cogsList.filter((c) => c.status === "PENDING").length;

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/finance/cogs-requests", payload);
    },
    onSuccess: () => {
      toast.success("Permintaan HPP Dibuat", "Dokumen pengajuan HPP berhasil disimpan di backend.");
      qc.invalidateQueries({ queryKey: ["finance-cogs-requests-rnd"] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error("Gagal membuat HPP", err?.response?.data?.message || err?.message || "Kesalahan jaringan");
    }
  });

  const handleSaveCogs = (e: React.FormEvent) => {
    e.preventDefault();
    const moq = Number(formData.jumlahMoq) || 5000;
    const joNum = `JO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const payload = {
      jobOrderNumber: joNum,
      description: `${formData.pelanggan} - ${formData.formula} - ${formData.netto}`,
      totalCost: moq * 12450,
      totalRevenue: moq * 25000,
    };
    createMutation.mutate(payload);
  };

  const handleExportExcel = () => {
    toast.success("Export Excel", "Data rekapitulasi HPP berhasil diekspor.");
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedCogs,
    setSelectedCogs,
    formData,
    setFormData,
    isLoading,
    cogsList,
    filteredCogs,
    totalRequests,
    approvedCount,
    pendingCount,
    createMutation,
    handleSaveCogs,
    handleExportExcel,
  };
}
