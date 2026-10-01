"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  SpkItem,
  SpkStatus,
  SpkKpis,
  mapWorkOrderToSpk,
} from "../_types/spk.types";

const FALLBACK_SPK: SpkItem[] = [
  {
    id: "spk-1",
    spkCode: "SPK-PRD-2026-001",
    issueDate: "2026-03-24",
    soNumber: "SO-2026-0042",
    customerName: "PT Cantika Glow Nusantara",
    brandName: "Aura Glow",
    productName: "Brightening Facial Serum 30ml",
    category: "Skincare / Serum",
    orderQty: 5000,
    unit: "Pcs",
    machineLine: "Line Filling 01 / Mixer 500L",
    supervisor: "Bambang Sutrisno",
    status: "IN_PROGRESS",
    targetDate: "2026-03-30",
    notes: "Prioritas tinggi pesanan launching Q2",
    batchNumber: "BATCH-2026-001",
    formulaCode: "FOR-SKN-2026-012 v2",
  },
  {
    id: "spk-2",
    spkCode: "SPK-PRD-2026-002",
    issueDate: "2026-03-25",
    soNumber: "SO-2026-0045",
    customerName: "PT Herbal Estetika Medika",
    brandName: "BioHerb",
    productName: "Acne Clarifying Facial Cleanser 100ml",
    category: "Cleanser",
    orderQty: 10000,
    unit: "Pcs",
    machineLine: "Line Tube 02 / Mixer 1000L",
    supervisor: "Agus Pratama",
    status: "RELEASED",
    targetDate: "2026-04-02",
    notes: "Kemasan tube 100ml flip top",
    batchNumber: "BATCH-2026-002",
    formulaCode: "FOR-CLN-2026-005 v1",
  },
  {
    id: "spk-3",
    spkCode: "SPK-PRD-2026-003",
    issueDate: "2026-03-22",
    soNumber: "SO-2026-0038",
    customerName: "PT Sinar Kosmetik Prima",
    brandName: "GlowSkin",
    productName: "Hydrating Barrier Gel Cream 50g",
    category: "Moisturizer",
    orderQty: 3000,
    unit: "Pcs",
    machineLine: "Line Jar 01 / Mixer 300L",
    supervisor: "Bambang Sutrisno",
    status: "COMPLETED",
    targetDate: "2026-03-27",
    notes: "Batch selesai dan lolos uji QC mikrobiologi",
    batchNumber: "BATCH-2026-003",
    formulaCode: "FOR-MST-2026-008 v3",
  },
  {
    id: "spk-4",
    spkCode: "SPK-PRD-2026-004",
    issueDate: "2026-03-26",
    soNumber: "SO-2026-0049",
    customerName: "PT Pesona Derma Indonesia",
    brandName: "DermaPure",
    productName: "Sunscreen Invisible Gel SPF 50",
    category: "Sunscreen",
    orderQty: 8000,
    unit: "Pcs",
    machineLine: "Line Tube 01 / Mixer 500L",
    supervisor: "Agus Pratama",
    status: "PENDING_APPROVAL",
    targetDate: "2026-04-05",
    notes: "Menunggu persetujuan rilis formula APJ",
    batchNumber: "BATCH-2026-004",
    formulaCode: "FOR-SUN-2026-003 v1",
  },
];

export function useSpkOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  // Modals & Drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SpkItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formSoNumber, setFormSoNumber] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formCategory, setFormCategory] = useState("Skincare");
  const [formOrderQty, setFormOrderQty] = useState<number>(5000);
  const [formMachineLine, setFormMachineLine] = useState("Line Filling 01 / Mixer 500L");
  const [formSupervisor, setFormSupervisor] = useState("Bambang Sutrisno");
  const [formTargetDate, setFormTargetDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [formNotes, setFormNotes] = useState("");

  const { data: serverSpkList = [], isLoading } = useQuery({
    queryKey: ["production-work-orders-spk"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/work-orders");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          return unwrapped.map(mapWorkOrderToSpk);
        }
        return FALLBACK_SPK;
      } catch {
        return FALLBACK_SPK;
      }
    },
  });

  const spkList = serverSpkList.length > 0 ? serverSpkList : FALLBACK_SPK;

  const filteredList = useMemo(() => {
    return spkList.filter((item) => {
      if (selectedColumn === "status" && filterValue) {
        if (item.status !== filterValue) return false;
      }
      if (selectedColumn === "category" && filterValue) {
        if (!item.category.toLowerCase().includes(filterValue.toLowerCase())) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSpk = item.spkCode.toLowerCase().includes(q);
        const matchSo = item.soNumber.toLowerCase().includes(q);
        const matchProduct = item.productName.toLowerCase().includes(q);
        const matchCustomer = item.customerName.toLowerCase().includes(q);
        const matchBrand = item.brandName.toLowerCase().includes(q);
        const matchSupervisor = item.supervisor.toLowerCase().includes(q);
        if (!matchSpk && !matchSo && !matchProduct && !matchCustomer && !matchBrand && !matchSupervisor) {
          return false;
        }
      }
      return true;
    });
  }, [spkList, selectedColumn, filterValue, searchQuery]);

  const kpis: SpkKpis = useMemo(() => {
    return {
      totalSpk: spkList.length,
      inProgressCount: spkList.filter((s) => s.status === "IN_PROGRESS").length,
      pendingReleaseCount: spkList.filter((s) => s.status === "PENDING_APPROVAL" || s.status === "RELEASED").length,
      completedCount: spkList.filter((s) => s.status === "COMPLETED").length,
    };
  }, [spkList]);

  const handleOpenDetail = (item: SpkItem) => {
    setSelectedItem(item);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDrawerOpen(false);
  };

  const handleOpenPrint = (item: SpkItem) => {
    setSelectedItem(item);
    setIsPrintModalOpen(true);
  };

  const handleCreateSpk = async () => {
    if (!formProduct) {
      toast.error("Nama Produk wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/production/work-orders", {
        productName: formProduct,
        targetQty: formOrderQty,
        category: formCategory,
        notes: formNotes,
        targetDate: formTargetDate,
      });

      toast.success("Surat Perintah Kerja (SPK) baru berhasil dibuat!");
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["production-work-orders-spk"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal membuat SPK.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    spkList,
    filteredList,
    kpis,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedColumn,
    setSelectedColumn,
    filterValue,
    setFilterValue,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isPrintModalOpen,
    setIsPrintModalOpen,
    selectedItem,
    setSelectedItem,
    isDetailDrawerOpen,
    handleOpenDetail,
    handleCloseDetail,
    handleOpenPrint,
    isSubmitting,
    handleCreateSpk,
    // Form props
    formSoNumber,
    setFormSoNumber,
    formCustomer,
    setFormCustomer,
    formBrand,
    setFormBrand,
    formProduct,
    setFormProduct,
    formCategory,
    setFormCategory,
    formOrderQty,
    setFormOrderQty,
    formMachineLine,
    setFormMachineLine,
    formSupervisor,
    setFormSupervisor,
    formTargetDate,
    setFormTargetDate,
    formNotes,
    setFormNotes,
  };
}
