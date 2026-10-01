"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  ComplianceAsset,
  ComplianceAssetType,
} from "../_types/compliance-asset.types";

export function useComplianceAssetOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ComplianceAsset | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<ComplianceAssetType>("BPOM");
  const [formBrand, setFormBrand] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formMonths, setFormMonths] = useState("36");
  const [formCost, setFormCost] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // 1. Fetch live intangible & compliance assets
  const { data: rawAssets = [], isLoading } = useQuery<any[]>({
    queryKey: ["finance-intangible-assets"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/intangible-assets");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  const assets: ComplianceAsset[] = useMemo(() => {
    const now = new Date();
    return rawAssets.map((a: any) => {
      const issue = a.acquisitionDate ? new Date(a.acquisitionDate) : new Date();
      const periodMonths = Number(a.amortizationPeriod || 36);
      const expiry = new Date(issue);
      expiry.setMonth(expiry.getMonth() + periodMonths);

      const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
      const cost = Number(a.acquisitionCost || 0);
      const monthlyAmortization = periodMonths > 0 ? cost / periodMonths : 0;

      // Extract type and brand from notes if formatted as "TYPE - BRAND - NOTES"
      let type: ComplianceAssetType = "BPOM";
      let brand = "-";
      if (a.notes && typeof a.notes === "string") {
        const parts = a.notes.split(" - ");
        if (["BPOM", "HALAL", "ISO", "HKI"].includes(parts[0])) {
          type = parts[0] as ComplianceAssetType;
          brand = parts[1] || "-";
        }
      }

      let status: ComplianceAsset["status"] = "ACTIVE";
      if (a.status === "RETIRED" || daysToExpiry < 0) {
        status = "EXPIRED";
      } else if (daysToExpiry <= 60) {
        status = "WARNING";
      }

      return {
        id: a.id,
        code: a.assetNumber || a.id.slice(0, 8),
        name: a.assetName || "Izin / Sertifikasi",
        type,
        productBrand: brand,
        issueDate: issue.toISOString().split("T")[0],
        expiryDate: expiry.toISOString().split("T")[0],
        cost,
        monthlyAmortization,
        accumulatedAmortization: Math.max(0, cost - Number(a.bookValue || 0)),
        daysToExpiry,
        status,
      };
    });
  }, [rawAssets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.code.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.productBrand.toLowerCase().includes(search.toLowerCase())
    );
  }, [assets, search]);

  const activeCount = assets.filter((a) => a.status === "ACTIVE").length;
  const warningCount = assets.filter((a) => a.status === "WARNING").length;
  const expiredCount = assets.filter((a) => a.status === "EXPIRED").length;
  const totalAmortMonth = assets.reduce(
    (acc, a) => acc + (a.status !== "EXPIRED" ? a.monthlyAmortization : 0),
    0
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post("/finance/intangible-assets", {
        assetNumber: formCode.trim() || undefined,
        assetName: formName.trim(),
        acquisitionDate: formDate,
        acquisitionCost: Number(formCost),
        amortizationPeriod: Number(formMonths),
        notes: `${formType} - ${formBrand || "Umum"} - ${formNotes}`,
      });
    },
    onSuccess: () => {
      toast.success("Registrasi Berhasil", "Aset tak berwujud berhasil didaftarkan ke sistem.");
      queryClient.invalidateQueries({ queryKey: ["finance-intangible-assets"] });
      setIsModalOpen(false);
      setFormName("");
      setFormCode("");
      setFormBrand("");
      setFormCost("");
      setFormNotes("");
    },
    onError: (err: any) => {
      toast.error("Registrasi Gagal", err?.response?.data?.message || err.message);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCost || Number(formCost) <= 0) {
      toast.error("Validasi Gagal", "Nama sertifikasi dan biaya perolehan wajib diisi valid.");
      return;
    }
    createMutation.mutate();
  };

  return {
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    selectedAsset,
    setSelectedAsset,
    formName,
    setFormName,
    formCode,
    setFormCode,
    formType,
    setFormType,
    formBrand,
    setFormBrand,
    formDate,
    setFormDate,
    formMonths,
    setFormMonths,
    formCost,
    setFormCost,
    formNotes,
    setFormNotes,
    rawAssets,
    isLoading,
    assets,
    filteredAssets,
    activeCount,
    warningCount,
    expiredCount,
    totalAmortMonth,
    createMutation,
    handleSave,
  };
}
