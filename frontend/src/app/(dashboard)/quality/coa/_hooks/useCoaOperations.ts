import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import type { CoaRecord } from "../_types/coa.types";

interface RawQcAudit {
  id?: string;
  reportNumber?: string;
  notes?: string;
  materialBatchNo?: string;
  createdAt?: string;
  coaVerified?: boolean;
  phase?: string;
  phValue?: string;
  viscosityValue?: string;
  organoleptic?: string;
  samplingVolume?: string;
  sealingCheck?: string;
  labelingCheck?: string;
  expDateCheck?: string;
  densityValue?: string;
  homogenityPass?: boolean;
  torqueValue?: string;
  leakTestPass?: boolean;
  dimensionCheck?: string;
  defectCategory?: string;
  defectType?: string;
  material?: { name?: string };
  analyst?: { fullName?: string };
}

export function useCoaOperations() {
  const toast = useDnaToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedCoa, setSelectedCoa] = useState<CoaRecord | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [printingCoa, setPrintingCoa] = useState<CoaRecord | null>(null);

  const { data: rawCoaRecords, isLoading } = useQuery({
    queryKey: ["coa-records"],
    queryFn: async () => {
      try {
        const res = await api.get("/qc/audits", { params: { status: "GOOD" } });
        const list: RawQcAudit[] = res.data?.data || res.data || [];
        return list.map((a: RawQcAudit): CoaRecord => ({
          id: a.reportNumber || a.id || "COA-EXP-001",
          rawId: a.id || "raw-id",
          product: a.material?.name || a.notes || "Brightening Serum 30ml",
          batch: a.materialBatchNo || (a.id ? a.id.substring(0, 8).toUpperCase() : "BATCH-001"),
          releaseDate: a.createdAt ? new Date(a.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          status: "VERIFIED",
          analyst: a.analyst?.fullName || "Ahmad Maulana",
          phase: a.phase || "RELEASE",
          parameters: {
            ph: a.phValue || "5.45",
            viscosity: a.viscosityValue || "3200",
            organoleptic: a.organoleptic || "Normal",
            samplingVolume: a.samplingVolume,
            sealingCheck: a.sealingCheck,
            labelingCheck: a.labelingCheck,
            expDateCheck: a.expDateCheck,
            density: a.densityValue || "1.02",
            homogenity: a.homogenityPass ?? true,
            torque: a.torqueValue,
            leakTest: a.leakTestPass ?? true,
            dimension: a.dimensionCheck,
            coaVerified: a.coaVerified ?? true,
          },
          defectCategory: a.defectCategory,
          defectType: a.defectType,
          notes: a.notes,
        }));
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });

  const coaRecords: CoaRecord[] = useMemo(() => {
    return Array.isArray(rawCoaRecords) ? rawCoaRecords : [];
  }, [rawCoaRecords]);

  const filteredRecords = useMemo(() => {
    return coaRecords.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        r.product.toLowerCase().includes(q) ||
        r.batch.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.analyst.toLowerCase().includes(q);

      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "VERIFIED" && r.status === "VERIFIED") ||
        (activeTab === "PENDING" && r.status === "PENDING");

      return matchesSearch && matchesTab;
    });
  }, [coaRecords, search, activeTab]);

  const totalCoa = coaRecords.length;
  const verifiedCoa = coaRecords.filter((r) => r.status === "VERIFIED").length;
  const pendingCoa = totalCoa - verifiedCoa;

  return {
    search,
    setSearch,
    activeTab,
    setActiveTab,
    selectedCoa,
    setSelectedCoa,
    isDetailDrawerOpen,
    setIsDetailDrawerOpen,
    printingCoa,
    setPrintingCoa,
    isLoading,
    coaRecords,
    filteredRecords,
    totalCoa,
    verifiedCoa,
    pendingCoa,
    toast,
  };
}
