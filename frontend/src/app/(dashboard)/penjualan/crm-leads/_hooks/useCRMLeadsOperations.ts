"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users, CheckCircle2, Clock4, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import {
  SalesMember,
  LeadConversion,
  OperationalLeadItem,
  OperationalLeadBatch,
  CRMTab,
  CRMDistributionStats,
  CRMFilterOptions,
  INITIAL_BATCHES,
  AVAILABLE_RECEIVERS,
} from "../_types/crm-leads.types";

export function useCRMLeadsOperations() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CRMTab>("operational");

  // Operational Leads Batch State (G-SERP row 103 & 104)
  const [batches, setBatches] = useState<OperationalLeadBatch[]>(INITIAL_BATCHES);
  const [batchSearch, setBatchSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBatchDetail, setSelectedBatchDetail] = useState<OperationalLeadBatch | null>(null);
  const [selectedLeadDetail, setSelectedLeadDetail] = useState<LeadConversion | null>(null);

  // Hydrate batches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("operational_lead_batches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBatches(parsed);
        }
      }
    } catch {
      // ignore JSON parse error in private mode
    }
  }, []);

  const updateAndPersistBatches = (newBatches: OperationalLeadBatch[]) => {
    setBatches(newBatches);
    try {
      localStorage.setItem("operational_lead_batches", JSON.stringify(newBatches));
    } catch {
      // ignore
    }
  };

  // Form State for Buat Leads
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [formCatatan, setFormCatatan] = useState("");
  const [formItems, setFormItems] = useState<OperationalLeadItem[]>([
    { penerima: AVAILABLE_RECEIVERS[0], qty: 10 },
    { penerima: AVAILABLE_RECEIVERS[1], qty: 10 },
  ]);

  // Handle URL action=create
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Inbound CRM Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [trafficFilter, setTrafficFilter] = useState("");

  // Queries
  const { data: salesData, isLoading: salesLoading } = useQuery<SalesMember[]>({
    queryKey: ["crm-sales"],
    queryFn: () => api.get("/marketing/landing-tracker/sales").then((r) => r.data),
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ data: LeadConversion[] }>({
    queryKey: ["crm-leads"],
    queryFn: () => api.get("/marketing/landing-tracker/conversions?limit=100").then((r) => r.data),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/marketing/landing-tracker/conversions/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast.success("Status lead berhasil diperbarui!");
    },
    onError: () => {
      toast.error("Gagal memperbarui status lead.");
    },
  });

  const saveSalesMutation = useMutation({
    mutationFn: (newSales: SalesMember[]) =>
      api.post("/marketing/landing-tracker/sales", newSales),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-sales"] });
      toast.success("Konfigurasi sales berhasil disimpan!");
    },
    onError: () => {
      toast.error("Gagal menyimpan konfigurasi sales.");
    },
  });

  const resetRotationMutation = useMutation({
    mutationFn: () => api.post("/marketing/landing-tracker/sales/reset-counter"),
    onSuccess: () => {
      toast.success("Counter rotasi WhatsApp sales berhasil direset!");
    },
    onError: () => {
      toast.error("Gagal mereset counter rotasi.");
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/marketing/landing-tracker/conversions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast.success("Lead berhasil dihapus!");
    },
    onError: () => {
      toast.error("Gagal menghapus lead.");
    },
  });

  // Local sales edits before save
  const [editedSales, setEditedSales] = useState<SalesMember[]>([]);

  useEffect(() => {
    if (salesData) {
      setEditedSales(salesData);
    }
  }, [salesData]);

  const handleSalesFieldChange = (index: number, field: keyof SalesMember, value: any) => {
    const updated = [...editedSales];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSales(updated);
  };

  const handleToggleSales = (index: number) => {
    const updated = [...editedSales];
    updated[index] = { ...updated[index], active: !updated[index].active };
    setEditedSales(updated);
  };

  const handleSaveSalesConfig = () => {
    const invalid = editedSales.some((s) => s.phone.replace(/\D/g, "").length < 9);
    if (invalid) {
      toast.error("Nomor WhatsApp minimal 9 digit!");
      return;
    }
    saveSalesMutation.mutate(editedSales);
  };

  const handleResetRotation = () => {
    if (confirm("Reset counter rotasi?")) {
      resetRotationMutation.mutate();
    }
  };

  // Operational Leads Handlers
  const handleAddFormItem = () => {
    setFormItems([...formItems, { penerima: AVAILABLE_RECEIVERS[0], qty: 1 }]);
  };

  const handleRemoveFormItem = (index: number) => {
    if (formItems.length <= 1) {
      toast.warning("Minimal harus ada 1 penerima leads!");
      return;
    }
    setFormItems(formItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof OperationalLeadItem, val: any) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: val };
    setFormItems(updated);
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTanggal) {
      toast.error("Tanggal Leads wajib diisi!");
      return;
    }
    const totalQty = formItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
    if (totalQty <= 0) {
      toast.error("Total Qty Leads harus lebih besar dari 0!");
      return;
    }

    const newBatch: OperationalLeadBatch = {
      id: `LEAD-${new Date().getFullYear()}-${String(batches.length + 1).padStart(3, "0")}`,
      tanggalLeads: formTanggal,
      catatan: formCatatan || "Distribusi Leads Batch",
      totalQtyLeads: totalQty,
      items: [...formItems],
    };

    updateAndPersistBatches([newBatch, ...batches]);
    setIsCreateModalOpen(false);
    setFormCatatan("");
    setFormItems([
      { penerima: AVAILABLE_RECEIVERS[0], qty: 10 },
      { penerima: AVAILABLE_RECEIVERS[1], qty: 10 },
    ]);
    toast.success("Batch Leads berhasil disimpan!");
  };

  const handleDeleteBatch = (id: string) => {
    if (confirm("Hapus baris distribusi leads ini?")) {
      updateAndPersistBatches(batches.filter((b) => b.id !== id));
      toast.success("Data distribusi leads berhasil dihapus!");
    }
  };

  // Filtered Operational Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = batchSearch.toLowerCase();
      return (
        !q ||
        b.tanggalLeads.toLowerCase().includes(q) ||
        b.catatan.toLowerCase().includes(q) ||
        b.items.some((item) => item.penerima.toLowerCase().includes(q))
      );
    });
  }, [batches, batchSearch]);

  // Inbound Leads
  const leads = useMemo(() => leadsData?.data ?? [], [leadsData]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (l.nama || "").toLowerCase().includes(query) ||
        (l.perusahaan || "").toLowerCase().includes(query) ||
        (l.hp || "").includes(searchQuery);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "New" && l.status === "New") ||
        (statusFilter === "Contacted" && l.status === "Contacted") ||
        (statusFilter === "Qualified" && (l.status === "Qualified" || l.status === "WON")) ||
        (statusFilter === "Lost" && l.status === "Lost");

      const matchesSource = !sourceFilter || (l.source || "Dreamlab").includes(sourceFilter);
      const matchesTraffic = !trafficFilter || (l.trafficSource || "Direct") === trafficFilter;

      return matchesSearch && matchesStatus && matchesSource && matchesTraffic;
    });
  }, [leads, searchQuery, statusFilter, sourceFilter, trafficFilter]);

  const filterOptions = useMemo<CRMFilterOptions>(() => {
    const sources = new Set<string>();
    const traffics = new Set<string>();
    leads.forEach((l) => {
      if (l.source) sources.add(l.source);
      if (l.trafficSource) traffics.add(l.trafficSource);
    });
    return {
      sources: Array.from(sources),
      traffics: Array.from(traffics),
    };
  }, [leads]);

  const handleExportCSV = () => {
    if (!filteredLeads.length) {
      toast.warning("Tidak ada data lead untuk diekspor!");
      return;
    }
    const headers = [
      "Tanggal",
      "Nama",
      "Brand / Perusahaan",
      "No. HP",
      "Halaman Sumber",
      "URL Asal",
      "Produk Peminatan",
      "Kanal Traffic",
      "Sales Penerima",
      "Status",
    ];
    const rows = filteredLeads.map((l) => [
      new Date(l.timestamp).toLocaleString("id-ID"),
      l.nama || "",
      l.perusahaan || "",
      l.hp || "",
      l.source || "Dreamlab",
      l.pageUrl || "",
      l.produk || "",
      l.trafficSource || "Direct",
      l.assignedTo || "",
      l.status,
    ]);
    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nexerp-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Ekspor CSV berhasil diunduh!");
  };

  const handleDeleteLead = (id: string) => {
    if (confirm("Hapus data lead ini?")) {
      deleteLeadMutation.mutate(id);
    }
  };

  const handleUpdateLeadStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "Contacted":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "Qualified":
      case "WON":
      case "WON_DEAL":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Lost":
        return "bg-slate-50 text-slate-600 border-slate-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  // Local Distribution metrics for Tab 4 (Statistik Rotasi)
  const distributions = useMemo<CRMDistributionStats>(() => {
    const salesCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};
    const trafficCounts: Record<string, number> = {};
    const productCounts: Record<string, number> = {};

    leads.forEach((l) => {
      const s = l.assignedTo || "Unassigned";
      const src = l.source || "Dreamlab";
      const t = l.trafficSource || "Direct";
      const p = l.produk || "Tidak diisi";

      salesCounts[s] = (salesCounts[s] || 0) + 1;
      pageCounts[src] = (pageCounts[src] || 0) + 1;
      trafficCounts[t] = (trafficCounts[t] || 0) + 1;
      productCounts[p] = (productCounts[p] || 0) + 1;
    });

    return {
      sales: Object.entries(salesCounts).sort((a, b) => b[1] - a[1]),
      pages: Object.entries(pageCounts).sort((a, b) => b[1] - a[1]),
      traffics: Object.entries(trafficCounts).sort((a, b) => b[1] - a[1]),
      products: Object.entries(productCounts).sort((a, b) => b[1] - a[1]),
    };
  }, [leads]);

  const kpiCards = useMemo(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === "New").length;
    const contactedLeads = leads.filter((l) => l.status === "Contacted").length;
    const qualifiedLeads = leads.filter((l) => l.status === "Qualified" || l.status === "WON").length;
    return [
      {
        key: "TOTAL",
        title: "TOTAL LEADS MASUK",
        value: `${totalLeads} Lead`,
        deltaText: "Inbound Realtime",
        isDeltaPositive: true,
        icon: React.createElement(Users, { className: "w-4 h-4" }),
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        key: "NEW",
        title: "LEAD BARU (UNTOUCHED)",
        value: `${newLeads} Lead`,
        deltaText: "Perlu dihubungi",
        isDeltaPositive: false,
        icon: React.createElement(Clock4, { className: "w-4 h-4" }),
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
      },
      {
        key: "CONTACTED",
        title: "DALAM PROSPEK",
        value: `${contactedLeads} Lead`,
        deltaText: "Follow-up sales",
        isDeltaPositive: true,
        icon: React.createElement(PhoneCall, { className: "w-4 h-4" }),
        iconBg: "bg-sky-50",
        iconColor: "text-sky-600",
      },
      {
        key: "QUALIFIED",
        title: "DEAL / QUALIFIED",
        value: `${qualifiedLeads} Lead`,
        deltaText: "Konversi tercapai",
        isDeltaPositive: true,
        icon: React.createElement(CheckCircle2, { className: "w-4 h-4" }),
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
    ];
  }, [leads]);

  return {
    // Navigation / Tabs
    activeTab,
    setActiveTab,

    // Batches
    batches,
    batchSearch,
    setBatchSearch,
    filteredBatches,
    handleDeleteBatch,

    // Modals & Drawers state
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedBatchDetail,
    setSelectedBatchDetail,
    selectedLeadDetail,
    setSelectedLeadDetail,

    // Form Buat Leads
    formTanggal,
    setFormTanggal,
    formCatatan,
    setFormCatatan,
    formItems,
    handleAddFormItem,
    handleRemoveFormItem,
    handleItemChange,
    handleSaveBatch,

    // Inbound Leads
    leads,
    filteredLeads,
    leadsLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    trafficFilter,
    setTrafficFilter,
    filterOptions,
    handleExportCSV,
    handleDeleteLead,
    handleUpdateLeadStatus,
    getStatusBadgeStyle,

    // Sales Config
    salesLoading,
    editedSales,
    isSavingSales: saveSalesMutation.isPending,
    handleSalesFieldChange,
    handleToggleSales,
    handleSaveSalesConfig,
    handleResetRotation,

    // Analytics / KPI
    distributions,
    kpiCards,
  };
}

export type CRMLeadsOperations = ReturnType<typeof useCRMLeadsOperations>;
