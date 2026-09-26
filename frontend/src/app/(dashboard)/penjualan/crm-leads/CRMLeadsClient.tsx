"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Users,
  User,
  Phone,
  Activity,
  CheckCircle2,
  Clock4,
  XCircle,
  Filter,
  Search,
  Download,
  Trash2,
  Settings,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
  PieChart,
  Plus,
  X,
  Globe,
  Loader2,
  PhoneCall,
  UserCheck,
  Percent,
  Eye,
} from "lucide-react";
import {
  Card,
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { toast } from "sonner";

interface SalesMember {
  name: string;
  phone: string;
  active: boolean;
}

interface LeadConversion {
  id: string;
  visitId?: string;
  pageUrl: string;
  pageTitle?: string;
  source: string;
  nama?: string;
  perusahaan?: string;
  hp?: string;
  produk?: string;
  trafficSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  assignedTo?: string;
  assignedPhone?: string;
  status: string;
  timestamp: string;
}

interface OperationalLeadItem {
  penerima: string;
  qty: number;
}

interface OperationalLeadBatch {
  id: string;
  tanggalLeads: string;
  catatan: string;
  totalQtyLeads: number;
  items: OperationalLeadItem[];
}

const INITIAL_BATCHES: OperationalLeadBatch[] = [
  {
    id: "LEAD-2026-001",
    tanggalLeads: "2026-09-15",
    catatan: "Distribusi Leads Kampanye TikTok Skincare Glow",
    totalQtyLeads: 45,
    items: [
      { penerima: "Edi (BusDev)", qty: 15 },
      { penerima: "Rendi (BusDev)", qty: 15 },
      { penerima: "Rina (BusDev)", qty: 15 },
    ],
  },
  {
    id: "LEAD-2026-002",
    tanggalLeads: "2026-09-12",
    catatan: "Inbound Leads Expo Kosmetik Jakarta 2026",
    totalQtyLeads: 30,
    items: [
      { penerima: "Siti (BusDev)", qty: 10 },
      { penerima: "Budi (BusDev)", qty: 10 },
      { penerima: "Maya (BusDev)", qty: 10 },
    ],
  },
  {
    id: "LEAD-2026-003",
    tanggalLeads: "2026-09-08",
    catatan: "Batch Leads Digital Ads Serum Retinol Anti Aging",
    totalQtyLeads: 60,
    items: [
      { penerima: "Edi (BusDev)", qty: 20 },
      { penerima: "Rina (BusDev)", qty: 20 },
      { penerima: "Maya (BusDev)", qty: 20 },
    ],
  },
  {
    id: "LEAD-2026-004",
    tanggalLeads: "2026-09-01",
    catatan: "Batch Leads Brand Body Lotion Tone Up",
    totalQtyLeads: 25,
    items: [
      { penerima: "Rendi (BusDev)", qty: 12 },
      { penerima: "Siti (BusDev)", qty: 13 },
    ],
  },
];

const AVAILABLE_RECEIVERS = [
  "Edi (BusDev)",
  "Rendi (BusDev)",
  "Rina (BusDev)",
  "Siti (BusDev)",
  "Budi (BusDev)",
  "Maya (BusDev)",
];

export default function CRMLeadsClient() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"operational" | "leads" | "sales" | "stats">("operational");

  // Operational Leads Batch State (G-SERP row 103 & 104)
  const [batches, setBatches] = useState<OperationalLeadBatch[]>(INITIAL_BATCHES);
  const [batchSearch, setBatchSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBatchDetail, setSelectedBatchDetail] = useState<OperationalLeadBatch | null>(null);
  const [selectedLeadDetail, setSelectedLeadDetail] = useState<LeadConversion | null>(null);

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
    queryFn: () => api.get("/marketing/landing-tracker/conversions?limit=500").then((r) => r.data),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["crm-stats"],
    queryFn: () => api.get("/marketing/landing-tracker/stats").then((r) => r.data),
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

  const clearAllLeadsMutation = useMutation({
    mutationFn: () => api.delete("/marketing/landing-tracker/conversions"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast.success("Semua data lead berhasil dibersihkan!");
    },
    onError: () => {
      toast.error("Gagal membersihkan data lead.");
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

    setBatches([newBatch, ...batches]);
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
      setBatches(batches.filter((b) => b.id !== id));
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

  const filterOptions = useMemo(() => {
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

  const handleClearAllLeads = () => {
    if (confirm("Apakah Anda yakin ingin membersihkan semua data lead?")) {
      clearAllLeadsMutation.mutate();
    }
  };

  const handleDeleteLead = (id: string) => {
    if (confirm("Hapus data lead ini?")) {
      deleteLeadMutation.mutate(id);
    }
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
  const distributions = useMemo(() => {
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
        icon: <Users className="w-4 h-4" />,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        key: "NEW",
        title: "LEAD BARU (UNTOUCHED)",
        value: `${newLeads} Lead`,
        deltaText: "Perlu dihubungi",
        isDeltaPositive: false,
        icon: <Clock4 className="w-4 h-4" />,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
      },
      {
        key: "CONTACTED",
        title: "DALAM PROSPEK",
        value: `${contactedLeads} Lead`,
        deltaText: "Follow-up sales",
        isDeltaPositive: true,
        icon: <PhoneCall className="w-4 h-4" />,
        iconBg: "bg-sky-50",
        iconColor: "text-sky-600",
      },
      {
        key: "QUALIFIED",
        title: "DEAL / QUALIFIED",
        value: `${qualifiedLeads} Lead`,
        deltaText: "Konversi tercapai",
        isDeltaPositive: true,
        icon: <CheckCircle2 className="w-4 h-4" />,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
    ];
  }, [leads]);

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      <DnaPageHeader
        title="CRM & LEAD MANAGEMENT"
        tabs={[
          { key: "operational", label: "Distribusi Leads", count: batches.length },
          { key: "leads", label: "Inbound Leads & WA", count: filteredLeads.length },
          { key: "sales", label: "Konfigurasi Sales", count: editedSales.length },
          { key: "stats", label: "Statistik Rotasi" },
        ]}
        activeTab={activeTab}
        onTabChange={(v) => setActiveTab(v as any)}
      />

      <DnaKpiGrid cards={kpiCards} />

      {/* ========================================================================= */}
      {/* TAB 1: OPERATIONAL LEADS (1:1 G-SERP ROW 103 & 104)                       */}
      {/* ========================================================================= */}
      {activeTab === "operational" && (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery: batchSearch,
            onSearchChange: setBatchSearch,
            searchPlaceholder: "Cari tanggal, catatan, penerima...",
            actionButton: {
              label: "Buat Leads",
              onClick: () => setIsCreateModalOpen(true),
            },
          }}
          paginationProps={{
            currentPage: 1,
            totalPages: 1,
            totalEntries: filteredBatches.length,
            pageSize: 10,
            onPageChange: () => {},
          }}
        >
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <DnaTh className="p-3.5 w-12 text-center text-slate-400">#</DnaTh>
                <DnaTh className="p-3.5 w-40">TANGGAL LEADS</DnaTh>
                <DnaTh className="p-3.5">CATATAN DISTRIBUSI</DnaTh>
                <DnaTh className="p-3.5 w-40 text-center">TOTAL QTY LEADS</DnaTh>
                <DnaTh className="p-3.5 w-24 text-center">AKSI</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredBatches.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    Tidak ada data distribusi leads ditemukan.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredBatches.map((batch, index) => (
                  <DnaTableRow key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="p-3.5 text-center text-slate-400 tabular-nums">{index + 1}</DnaTd>
                    <DnaTd className="p-3.5 font-bold text-slate-800">{batch.tanggalLeads}</DnaTd>
                    <DnaTd className="p-3.5 text-slate-700">
                      <p className="font-semibold text-slate-900">{batch.catatan}</p>
                      <p className="text-[11px] text-slate-400">{batch.items.map((i) => i.penerima).join(", ")}</p>
                    </DnaTd>
                    <DnaTd className="p-3.5 text-center">
                      <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full font-bold text-xs">
                        {batch.totalQtyLeads} Leads
                      </span>
                    </DnaTd>
                    <DnaTd className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedBatchDetail(batch)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Lihat Alokasi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </DnaDataTableCard>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INBOUND LEADS & WHATSAPP ROTATION                                  */}
      {/* ========================================================================= */}
      {activeTab === "leads" && (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery: searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: "Cari lead, nama, brand, no HP...",
            filterColumns: [
              {
                key: "status",
                label: "Status",
                type: "select",
                options: ["New", "Contacted", "Qualified", "Lost"],
              },
              {
                key: "traffic",
                label: "Traffic",
                type: "select",
                options: filterOptions.traffics,
              },
            ],
            selectedColumn: statusFilter ? "status" : trafficFilter ? "traffic" : undefined,
            onSelectColumn: (col) => {
              if (!col) {
                setStatusFilter("");
                setTrafficFilter("");
              }
            },
            filterValue: statusFilter || trafficFilter,
            onFilterValueChange: (val) => {
              if (["New", "Contacted", "Qualified", "Lost"].includes(val)) {
                setStatusFilter(val);
              } else {
                setTrafficFilter(val);
              }
            },
            actionButton: {
              label: "Ekspor CSV",
              onClick: handleExportCSV,
            },
          }}
          paginationProps={{
            currentPage: 1,
            totalPages: 1,
            totalEntries: filteredLeads.length,
            pageSize: 15,
            onPageChange: () => {},
          }}
        >
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <DnaTh className="p-3.5 w-10 text-center text-slate-400">#</DnaTh>
                <DnaTh className="p-3.5 w-36">TANGGAL & WAKTU</DnaTh>
                <DnaTh className="p-3.5">PROSPEK & PERUSAHAAN</DnaTh>
                <DnaTh className="p-3.5 w-36">KONTAK WHATSAPP</DnaTh>
                <DnaTh className="p-3.5 w-44">SUMBER & SALES</DnaTh>
                <DnaTh className="p-3.5 w-32">STATUS</DnaTh>
                <DnaTh className="p-3.5 w-20 text-center">AKSI</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredLeads.map((lead, idx) => {
                const date = new Date(lead.timestamp);
                const formattedDate = date.toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const formattedTime = date.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <DnaTableRow key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                    <DnaTd className="p-3.5">
                      <div className="font-semibold text-slate-800">{formattedDate}</div>
                      <div className="text-[11px] text-slate-400">{formattedTime} WIB</div>
                    </DnaTd>
                    <DnaTd className="p-3.5 cursor-pointer" onClick={() => setSelectedLeadDetail(lead)}>
                      <div className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                        {lead.nama || "-"}
                      </div>
                      <div className="text-[11px] text-slate-500">{lead.perusahaan || "Perusahaan Belum Terdaftar"}</div>
                    </DnaTd>
                    <DnaTd className="p-3.5">
                      {lead.hp ? (
                        <a
                          href={`https://wa.me/${lead.hp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-bold text-xs"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-500" /> {lead.hp}
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </DnaTd>
                    <DnaTd className="p-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <DnaBadge variant="info">{lead.source || "Dreamlab"}</DnaBadge>
                        <span className="text-[11px] text-slate-500 font-medium">({lead.trafficSource || "Direct"})</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                        PIC: {lead.assignedTo || "Unassigned"}
                      </div>
                    </DnaTd>
                    <DnaTd className="p-3.5">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({ id: lead.id, status: e.target.value })
                        }
                        className={`text-[11px] font-bold py-1 px-2 border rounded-lg cursor-pointer ${getStatusBadgeStyle(
                          lead.status
                        )} focus:outline-none`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </DnaTd>
                    <DnaTd className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedLeadDetail(lead)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                );
              })}

              {filteredLeads.length === 0 && (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    {leadsLoading ? "Memuat data lead..." : "Belum ada lead masuk"}
                  </DnaTd>
                </DnaTableRow>
              )}
            </DnaTableBody>
          </DnaTable>
        </DnaDataTableCard>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SALES CONFIGURATION                                                */}
      {/* ========================================================================= */}
      {activeTab === "sales" && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Cara Kerja Rotasi Server-Side Round-Robin:
              </h4>
              <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                Setiap lead baru yang masuk dari formulir landing page akan dialokasikan secara bergilir ke sales WhatsApp yang berstatus aktif.
              </p>
            </div>
          </div>

          <Card className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pengaturan WhatsApp Sales</h3>
                <p className="text-xs text-slate-500">Kelola nomor telepon WhatsApp dan keaktifan sales</p>
              </div>
              <DnaButton
                variant="outline"
                onClick={() => {
                  if (confirm("Reset counter rotasi?")) {
                    resetRotationMutation.mutate();
                  }
                }}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Reset Counter
              </DnaButton>
            </div>

            <div className="p-5 space-y-4">
              {salesLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading data sales...</div>
              ) : (
                editedSales.map((member, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-slate-50/50 border border-slate-100 p-4 rounded-xl"
                  >
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Sales</label>
                      <DnaInput
                        value={member.name}
                        onChange={(e) => handleSalesFieldChange(i, "name", e.target.value)}
                        placeholder="Nama"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp (62...)</label>
                      <DnaInput
                        type="tel"
                        value={member.phone}
                        onChange={(e) => handleSalesFieldChange(i, "phone", e.target.value.replace(/\D/g, ""))}
                        placeholder="62812..."
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
                      <button
                        onClick={() => handleToggleSales(i)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          member.active
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {member.active ? "● Aktif Bertugas" : "○ Cuti / Off"}
                      </button>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      {member.phone.startsWith("62") ? (
                        <span className="text-emerald-600 font-bold">✓ Valid (62)</span>
                      ) : (
                        <span className="text-rose-500 font-bold">⚠️ Gunakan 62</span>
                      )}
                    </div>
                  </div>
                ))
              )}

              {!salesLoading && (
                <div className="pt-2 flex justify-end">
                  <DnaButton
                    variant="primary"
                    onClick={handleSaveSalesConfig}
                    disabled={saveSalesMutation.isPending}
                  >
                    {saveSalesMutation.isPending ? "Menyimpan..." : "Simpan Konfigurasi"}
                  </DnaButton>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ROTATION STATS                                                     */}
      {/* ========================================================================= */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Menghitung statistik rotasi...</div>
          ) : leads.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200 rounded-xl">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Belum Ada Data Statistik Lead</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Distribusi Lead per Sales</h3>
                <div className="space-y-3">
                  {distributions.sales.map(([name, count]) => {
                    const total = leads.length;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{name}</span>
                          <span className="text-blue-600">{count} lead ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Kanal Asal Traffic</h3>
                <div className="space-y-3">
                  {distributions.traffics.map(([traffic, count]) => {
                    const total = leads.length;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={traffic} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{traffic}</span>
                          <span className="text-amber-600">{count} lead ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUAT LEADS (G-SERP ROW 104 FORM WITH DYNAMIC SUB-TABLE BASKET)      */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Buat Distribusi Leads Baru</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Tanggal Leads <span className="text-rose-500">*</span>
                  </label>
                  <DnaInput
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Catatan</label>
                  <DnaInput
                    placeholder="Contoh: Leads Iklan TikTok Batch 1"
                    value={formCatatan}
                    onChange={(e) => setFormCatatan(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Sub-tabel Keranjang Penerima Leads */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Daftar Alokasi Penerima</span>
                  <button
                    type="button"
                    onClick={handleAddFormItem}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Penerima
                  </button>
                </div>

                <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase px-1">
                    <span className="col-span-7">Penerima Leads *</span>
                    <span className="col-span-4">Qty Leads *</span>
                    <span className="col-span-1 text-center">Aksi</span>
                  </div>

                  {formItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7">
                        <select
                          value={item.penerima}
                          onChange={(e) => handleItemChange(idx, "penerima", e.target.value)}
                          className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 focus:outline-none"
                        >
                          {AVAILABLE_RECEIVERS.map((recv) => (
                            <option key={recv} value={recv}>
                              {recv}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <DnaInput
                          type="number"
                          min="1"
                          required
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, "qty", parseInt(e.target.value) || 0)}
                          className="h-8 text-xs text-center"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFormItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600">Total Qty Leads Terbagi:</span>
                  <span className="text-blue-600">
                    {formItems.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0)} Leads
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <DnaButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Kembali
                </DnaButton>
                <DnaButton type="submit" variant="primary">
                  Simpan Leads
                </DnaButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER 1: DETAIL ALOKASI BATCH LEADS                                       */}
      {/* ========================================================================= */}
      <DnaDetailDrawer
        isOpen={!!selectedBatchDetail}
        onClose={() => setSelectedBatchDetail(null)}
        title="Detail Distribusi Leads"
        subtitle={selectedBatchDetail?.id}
        badge={selectedBatchDetail ? `${selectedBatchDetail.totalQtyLeads} Leads` : undefined}
        badgeVariant="primary"
        actions={
          <DnaButton variant="outline" onClick={() => setSelectedBatchDetail(null)}>
            Tutup
          </DnaButton>
        }
      >
        {selectedBatchDetail && (
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Tanggal Leads</span>
                <span className="text-sm font-bold text-slate-800">{selectedBatchDetail.tanggalLeads}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Catatan Distribusi</span>
                <span className="text-xs text-slate-700">{selectedBatchDetail.catatan}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Rincian Penerima Leads</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="p-3">#</DnaTh>
                      <DnaTh className="p-3">Penerima Leads</DnaTh>
                      <DnaTh className="p-3 text-center">Qty</DnaTh>
                      <DnaTh className="p-3 text-center">Porsi (%)</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedBatchDetail.items.map((item, idx) => {
                      const pct = Math.round((item.qty / selectedBatchDetail.totalQtyLeads) * 100);
                      return (
                        <DnaTableRow key={idx}>
                          <DnaTd className="p-3 text-slate-400">{idx + 1}</DnaTd>
                          <DnaTd className="p-3 font-bold text-slate-800">{item.penerima}</DnaTd>
                          <DnaTd className="p-3 text-center font-bold text-slate-700">{item.qty}</DnaTd>
                          <DnaTd className="p-3 text-center font-bold text-blue-600">{pct}%</DnaTd>
                        </DnaTableRow>
                      );
                    })}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* ========================================================================= */}
      {/* DRAWER 2: DETAIL PROSPEK INBOUND LEAD                                      */}
      {/* ========================================================================= */}
      <DnaDetailDrawer
        isOpen={!!selectedLeadDetail}
        onClose={() => setSelectedLeadDetail(null)}
        title={selectedLeadDetail?.nama || "Detail Lead Inbound"}
        subtitle={selectedLeadDetail?.perusahaan || "Perusahaan Belum Terdaftar"}
        badge={selectedLeadDetail?.status}
        badgeVariant={
          selectedLeadDetail?.status === "Qualified" || selectedLeadDetail?.status === "WON"
            ? "success"
            : selectedLeadDetail?.status === "Contacted"
            ? "warning"
            : "neutral"
        }
        actions={
          <>
            {selectedLeadDetail?.hp && (
              <a
                href={`https://wa.me/${selectedLeadDetail.hp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Hubungi via WhatsApp
              </a>
            )}
            <DnaButton variant="outline" onClick={() => setSelectedLeadDetail(null)}>
              Tutup
            </DnaButton>
          </>
        }
      >
        {selectedLeadDetail && (
          <div className="space-y-5 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Waktu Masuk</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedLeadDetail.timestamp).toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status Saat Ini</span>
                  <span className="font-bold text-slate-900">{selectedLeadDetail.status}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nomor WhatsApp</span>
                <span className="font-bold text-emerald-600 tabular-nums text-sm">{selectedLeadDetail.hp || "-"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Atribut Landing Page & Traffic</h4>
              <div className="grid grid-cols-2 gap-3 border border-slate-200 p-3.5 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Kanal Traffic</span>
                  <span className="font-bold text-slate-800">{selectedLeadDetail.trafficSource || "Direct"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sumber Brand</span>
                  <span className="font-bold text-slate-800">{selectedLeadDetail.source || "Dreamlab"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Produk Peminatan</span>
                  <span className="font-bold text-blue-600">{selectedLeadDetail.produk || "Formulasi Kosmetik"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sales Bertugas</span>
                  <span className="font-bold text-slate-800">{selectedLeadDetail.assignedTo || "Unassigned"}</span>
                </div>
              </div>
            </div>

            {selectedLeadDetail.pageUrl && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">URL Landing Page</span>
                <span className="text-slate-600 break-all text-[11px] tabular-nums">{selectedLeadDetail.pageUrl}</span>
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>
    </div>
  );
}
