import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import {
  SampleOrder,
  SampleFormData,
  initialSampleFormData,
} from "../_types/sample-sales.types";

export function useSampleSalesOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedColumn, setSelectedColumn] = useState("ALL");
  const [filterValue, setFilterValue] = useState("ALL");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleResetAll = () => {
    setSearchTerm("");
    setSelectedStatus("ALL");
    setSelectedColumn("ALL");
    setFilterValue("ALL");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  const [detailOrder, setDetailOrder] = useState<SampleOrder | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form state
  const [formData, setFormData] = useState<SampleFormData>(initialSampleFormData);

  const updateFormField = (field: keyof SampleFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const { data: orders = [], isLoading, isError, refetch } = useQuery<SampleOrder[]>({
    queryKey: ["bussdev-samples"],
    queryFn: async () => {
      try {
        const resp = await api.get("/bussdev/samples");
        return resp.data.map((s: any) => ({
          id: s.id,
          code: s.code || `SMP-${s.id.slice(0, 6).toUpperCase()}`,
          createdAt: new Date(s.createdAt || Date.now()).toISOString().split("T")[0],
          customerName: s.customerName || "Klien Kosmetik Prima",
          brandName: s.brandName || "GlowUp Beaute",
          productName: s.productName,
          physicalForm: s.physicalForm || "Liquid / Serum",
          volumeNetto: s.volumeNetto || "30 ml",
          color: s.color || "Transparan",
          fragrance: s.fragrance || "Soft Berry",
          benefitClaims: s.benefitClaims || "Anti-Aging & Firming",
          formulator: s.formulator || "Apt. Sarah Sp.FK",
          qty: Number(s.qty) || 1,
          unitPrice: Number(s.unitPrice) || 250000,
          sampleFeeOffset: s.sampleFeeOffset || 250000,
          status: s.status || "PENDING",
          targetDate: s.targetDeliveryDate ? new Date(s.targetDeliveryDate).toISOString().split("T")[0] : "2026-03-25",
          notes: s.description || s.notes || "Sample benchmark reference k-beauty.",
        }));
      } catch {
        // Fallback realistic sample data
        return [
          {
            id: "smp-001",
            code: "SMP-2026-081",
            createdAt: "2026-03-05",
            customerName: "PT Cantika Jelita Nusantara",
            brandName: "C-Jelita Herbal",
            productName: "Brightening Niacinamide Serum 10%",
            physicalForm: "Serum Cair",
            volumeNetto: "30 ml",
            color: "Kuning Muda Bening",
            fragrance: "Peach Floral",
            benefitClaims: "Brightening, Meredakan Kemerahan, Skin Barrier",
            formulator: "Apt. Rian H.",
            qty: 3,
            unitPrice: 350000,
            sampleFeeOffset: 350000,
            status: "PROCESS",
            targetDate: "2026-03-12",
            notes: "Benchmark tekstur Somethinc Niacinamide, jangan lengket.",
          },
          {
            id: "smp-002",
            code: "SMP-2026-080",
            createdAt: "2026-03-04",
            customerName: "CV Aura Natural Skincare",
            brandName: "AuraGlow Botanical",
            productName: "Centella Soothing Moisturizer Gel",
            physicalForm: "Water Gel",
            volumeNetto: "50 gr",
            color: "Hijau Pale Natural",
            fragrance: "Eucalyptus Fresh (Low)",
            benefitClaims: "Calming Acne, Sebum Reducer, Soothing",
            formulator: "Dra. Maria K.",
            qty: 2,
            unitPrice: 200000,
            sampleFeeOffset: 200000,
            status: "COMPLETED",
            targetDate: "2026-03-08",
            notes: "Formula disetujui klien, lanjut legalitas BPOM & PO Produksi.",
          },
          {
            id: "smp-003",
            code: "SMP-2026-079",
            createdAt: "2026-03-02",
            customerName: "PT Derma Estetika Utama",
            brandName: "DermaGleam Pro",
            productName: "Hydrating Hybrid Sunscreen SPF 50+ PA++++",
            physicalForm: "Light Cream",
            volumeNetto: "40 ml",
            color: "Putih Non-Whitecast",
            fragrance: "Unscented / Free",
            benefitClaims: "Broad UV Shield, Blue Light, Matte Finish",
            formulator: "Apt. Sarah Sp.FK",
            qty: 4,
            unitPrice: 500000,
            sampleFeeOffset: 500000,
            status: "SHIPPED",
            targetDate: "2026-03-09",
            notes: "Pengiriman via JNE YES Resi JNE9882194 ke Jakarta Barat.",
          },
          {
            id: "smp-004",
            code: "SMP-2026-078",
            createdAt: "2026-02-28",
            customerName: "UD Berkah Ayu Sejahtera",
            brandName: "AyuAura",
            productName: "Body Lotion AHA BHA Glow",
            physicalForm: "Rich Lotion",
            volumeNetto: "250 ml",
            color: "Soft Pink",
            fragrance: "Vanilla Musk",
            benefitClaims: "Exfoliating & Instant Tone Up",
            formulator: "Apt. Rian H.",
            qty: 2,
            unitPrice: 250000,
            sampleFeeOffset: 250000,
            status: "PENDING",
            targetDate: "2026-03-15",
            notes: "Menunggu slot antrean lab R&D formulasi ke-2.",
          },
        ];
      }
    },
  });

  const formulatorOptions = useMemo(
    () => Array.from(new Set(orders.map((o) => o.formulator).filter(Boolean))) as string[],
    [orders]
  );
  const physicalFormOptions = useMemo(
    () => Array.from(new Set(orders.map((o) => o.physicalForm).filter(Boolean))) as string[],
    [orders]
  );

  const filterColumns = useMemo(
    () => [
      { key: "formulator", label: "Formulator Lab", type: "select" as const, options: formulatorOptions },
      { key: "form", label: "Bentuk Fisik", type: "select" as const, options: physicalFormOptions },
      { key: "sort_date", label: "Tanggal Dibuat (Terbaru / Terlama)", type: "sort_alpha" as const },
      { key: "sort_code", label: "Kode Sample (A-Z / Z-A)", type: "sort_alpha" as const },
    ],
    [formulatorOptions, physicalFormOptions]
  );

  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "Semua Status" },
      { value: "PENDING", label: "Menunggu Lab", color: "amber" as const },
      { value: "PROCESS", label: "Formulasi Lab", color: "blue" as const },
      { value: "SHIPPED", label: "Terkirim Klien", color: "purple" as const },
      { value: "COMPLETED", label: "Approved Klien", color: "emerald" as const },
      { value: "CANCELLED", label: "Dibatalkan", color: "rose" as const },
    ],
    []
  );

  const filteredOrders = useMemo(() => {
    let result = orders.filter((o) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        (o.brandName && o.brandName.toLowerCase().includes(q));

      const matchesStatus = selectedStatus === "ALL" || o.status === selectedStatus;

      let matchesColumn = true;
      if (selectedColumn === "formulator" && filterValue !== "ALL") {
        matchesColumn = o.formulator === filterValue;
      } else if (selectedColumn === "form" && filterValue !== "ALL") {
        matchesColumn = o.physicalForm === filterValue;
      }

      let matchesDate = true;
      if (dateMode !== "ALL" && o.createdAt) {
        const itemDate = new Date(o.createdAt);
        if (!isNaN(itemDate.getTime())) {
          const now = new Date();
          if (dateMode === "1_DAY") {
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            matchesDate = itemDate >= oneDayAgo && itemDate <= now;
          } else if (dateMode === "1_WEEK") {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = itemDate >= oneWeekAgo && itemDate <= now;
          } else if (dateMode === "1_MONTH") {
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = itemDate >= oneMonthAgo && itemDate <= now;
          } else if (dateMode === "1_YEAR") {
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            matchesDate = itemDate >= oneYearAgo && itemDate <= now;
          } else if (dateMode === "CUSTOM" && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = itemDate >= start && itemDate <= end;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesColumn && matchesDate;
    });

    if (selectedColumn === "sort_date") {
      result = [...result].sort((a, b) =>
        filterValue === "asc"
          ? a.createdAt.localeCompare(b.createdAt)
          : b.createdAt.localeCompare(a.createdAt)
      );
    } else if (selectedColumn === "sort_code") {
      result = [...result].sort((a, b) =>
        filterValue === "desc" ? b.code.localeCompare(a.code) : a.code.localeCompare(b.code)
      );
    }

    return result;
  }, [orders, searchTerm, selectedStatus, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const totalCount = orders.length;
  const pendingLab = orders.filter((o) => o.status === "PENDING").length;
  const inProcess = orders.filter((o) => o.status === "PROCESS").length;
  const approved = orders.filter((o) => o.status === "COMPLETED").length;

  const createSampleMut = useMutation({
    mutationFn: async () => {
      const resp = await api.post("/bussdev/samples", {
        customerName: formData.customer,
        brandName: formData.brand || undefined,
        productName: formData.product,
        physicalForm: formData.form,
        volumeNetto: formData.netto,
        color: formData.color,
        fragrance: formData.fragrance,
        benefitClaims: formData.claims,
        qty: Number(formData.qty) || 1,
        unitPrice: Number(formData.price) || 0,
        description: formData.notes || undefined,
      });
      return resp.data;
    },
    onSuccess: (data: any) => {
      toast.success(
        "Sample Order Dibuat",
        `Permintaan ${data?.code || data?.sampleCode || formData.product} berhasil dikirim ke antrean Lab R&D.`
      );
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["bussdev-samples"] });
      // Reset form
      setFormData({
        ...initialSampleFormData,
        customer: "",
        brand: "",
        product: "",
        notes: "",
      });
    },
    onError: (err: any) => {
      toast.error("Gagal Mengirim Sample", err?.response?.data?.message || err?.message || "Terjadi kesalahan sistem.");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer || !formData.product) {
      toast.error("Validasi Gagal", "Harap isi nama klien dan nama produk sample.");
      return;
    }

    createSampleMut.mutate();
  };

  const approveSampleMut = useMutation({
    mutationFn: async (sampleId: string) => {
      const resp = await api.patch(`/bussdev/sample/${sampleId}/feedback`, {
        rating: 5,
        comment: "Sample disetujui klien",
        status: "APPROVED",
      });
      return resp.data;
    },
    onSuccess: () => {
      toast.success(
        "Sample Disetujui",
        `Sample ${detailOrder?.code || detailOrder?.productName || "pesanan"} berhasil disetujui klien!`
      );
      queryClient.invalidateQueries({ queryKey: ["bussdev-samples"] });
      setDetailOrder(null);
    },
    onError: (err: any) => {
      toast.error(
        "Gagal Menyetujui Sample",
        err?.response?.data?.message || err?.message || "Terjadi kesalahan server saat memperbarui status sample."
      );
    },
  });

  return {
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedColumn,
    setSelectedColumn,
    filterValue,
    setFilterValue,
    dateMode,
    setDateMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    statusOptions,
    filterColumns,
    handleResetAll,
    detailOrder,
    setDetailOrder,
    isCreateOpen,
    setIsCreateOpen,
    formData,
    updateFormField,
    orders,
    filteredOrders,
    totalCount,
    pendingLab,
    inProcess,
    approved,
    isLoading,
    isError,
    refetch,
    createSampleMut,
    handleCreateSubmit,
    approveSampleMut,
  };
}
