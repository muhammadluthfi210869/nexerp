"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { DnaInput } from "@/components/dna/DnaInput";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { DnaButton } from "@/components/dna/DnaButton";
import { StatCard } from "@/components/dna/StatCard";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { SectionLabel } from "@/components/dna/SectionLabel";
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

export default function CRMLeadsClient() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"leads" | "sales" | "stats">("leads");
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [trafficFilter, setTrafficFilter] = useState("");

  // Queries
  const { data: salesData, isLoading: salesLoading } = useQuery<SalesMember[]>({
    queryKey: ["crm-sales"],
    queryFn: () => api.get("/marketing/landing-tracker/sales").then(r => r.data),
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ data: LeadConversion[] }>({
    queryKey: ["crm-leads"],
    queryFn: () => api.get("/marketing/landing-tracker/conversions?limit=500").then(r => r.data),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["crm-stats"],
    queryFn: () => api.get("/marketing/landing-tracker/stats").then(r => r.data),
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
    }
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
    }
  });

  const resetRotationMutation = useMutation({
    mutationFn: () => api.post("/marketing/landing-tracker/sales/reset-counter"),
    onSuccess: () => {
      toast.success("Counter rotasi WhatsApp sales berhasil direset!");
    },
    onError: () => {
      toast.error("Gagal mereset counter rotasi.");
    }
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
    }
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
    }
  });

  // Local sales edits before save
  const [editedSales, setEditedSales] = useState<SalesMember[]>([]);

  // Initialize edited sales when data is loaded
  React.useEffect(() => {
    if (salesData) {
      setEditedSales(salesData);
    }
  }, [salesData]);

  // Handle Sales Change Helper
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
    // Basic phone validation
    const invalid = editedSales.some(s => s.phone.replace(/\D/g, "").length < 9);
    if (invalid) {
      toast.error("Nomor WhatsApp minimal 9 digit!");
      return;
    }
    saveSalesMutation.mutate(editedSales);
  };

  // KPI Calculations (Real-time from Leads)
  const leads = useMemo(() => leadsData?.data ?? [], [leadsData]);
  
  const kpis = useMemo(() => {
    const total = leads.length;
    const now = new Date();
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const week0 = today0 - 6 * 86400000;

    const todayLeads = leads.filter(l => new Date(l.timestamp).getTime() >= today0).length;
    const weeklyLeads = leads.filter(l => new Date(l.timestamp).getTime() >= week0).length;
    const qualifiedLeads = leads.filter(l => l.status === "Qualified" || l.status === "WON" || l.status === "WON_DEAL").length;
    const convRate = total > 0 ? Math.round((qualifiedLeads / total) * 100) : 0;

    return { total, todayLeads, weeklyLeads, convRate };
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((l) => {
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

        const matchesSource =
          !sourceFilter ||
          (l.source || "Dreamlab").includes(sourceFilter);

        const matchesTraffic =
          !trafficFilter ||
          (l.trafficSource || "Direct") === trafficFilter;

        return matchesSearch && matchesStatus && matchesSource && matchesTraffic;
      });
  }, [leads, searchQuery, statusFilter, sourceFilter, trafficFilter]);

  // Unique list of sources & traffics for filter dropdowns
  const filterOptions = useMemo(() => {
    const sources = new Set<string>();
    const traffics = new Set<string>();
    
    leads.forEach(l => {
      if (l.source) sources.add(l.source);
      if (l.trafficSource) traffics.add(l.trafficSource);
    });

    return {
      sources: Array.from(sources),
      traffics: Array.from(traffics)
    };
  }, [leads]);

  // Excel CSV Export local assembly
  const handleExportCSV = () => {
    if (!filteredLeads.length) {
      toast.warning("Tidak ada data lead untuk diekspor!");
      return;
    }
    const headers = [
      "Tanggal", "Nama", "Brand / Perusahaan", "No. HP",
      "Halaman Sumber", "URL Asal", "Produk Peminatan",
      "Kanal Traffic", "UTM Source", "UTM Medium", "UTM Campaign",
      "Sales Penerima", "Status"
    ];
    const rows = filteredLeads.map(l => [
      new Date(l.timestamp).toLocaleString("id-ID"),
      l.nama || "",
      l.perusahaan || "",
      l.hp || "",
      l.source || "Dreamlab",
      l.pageUrl || "",
      l.produk || "",
      l.trafficSource || "Direct",
      l.utmSource || "",
      l.utmMedium || "",
      l.utmCampaign || "",
      l.assignedTo || "",
      l.status
    ]);
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
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
    if (confirm("Apakah Anda yakin ingin menghapus SEMUA lead secara permanen? Aksi ini tidak dapat dibatalkan!")) {
      clearAllLeadsMutation.mutate();
    }
  };

  const handleDeleteLead = (id: string) => {
    if (confirm("Hapus lead ini secara permanen?")) {
      deleteLeadMutation.mutate(id);
    }
  };

  // Status Styling helpers
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

  // Local Distribution metrics for Tab 3 (Statistik Rotasi)
  const distributions = useMemo(() => {
    const salesCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};
    const trafficCounts: Record<string, number> = {};
    const productCounts: Record<string, number> = {};

    leads.forEach(l => {
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
      products: Object.entries(productCounts).sort((a, b) => b[1] - a[1])
    };
  }, [leads]);

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "leads" | "sales" | "stats")} className="space-y-6">
      <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
        <TabsTrigger value="leads" className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
          📋 Lead Masuk
        </TabsTrigger>
        <TabsTrigger value="sales" className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
          👥 Konfigurasi Sales
        </TabsTrigger>
        <TabsTrigger value="stats" className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
          📊 Statistik Rotasi
        </TabsTrigger>
      </TabsList>

      <TabsContent value="leads" className="space-y-6">
            <div className="space-y-6">
              {/* KPIs Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Lead" value={leadsLoading ? "..." : kpis.total} subValue="Sepanjang waktu" icon={<Users />} />
                <StatCard label="Lead Hari Ini" value={leadsLoading ? "..." : kpis.todayLeads} subValue="Sejak 00:00 hari ini" icon={<Activity />} />
                <StatCard label="Minggu Ini" value={leadsLoading ? "..." : kpis.weeklyLeads} subValue="7 hari terakhir" icon={<Globe />} />
                <StatCard label="Conversion Rate" value={leadsLoading ? "..." : `${kpis.convRate}%`} subValue="Lead → Qualified" icon={<Percent />} />
              </div>

              <TableWrapper
                filters={
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Daftar Lead Masuk
                    </h3>
                    
                    {/* Filters Grid */}
                    <div className="flex flex-wrap items-center gap-3">
                      <DnaInput
                        placeholder="Cari nama/brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 font-bold w-52"
                        icon={<Search className="w-3.5 h-3.5 text-slate-300" />}
                      />

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl cursor-pointer focus:outline-none"
                      >
                        <option value="">Semua Status</option>
                        <option value="New">🔵 New</option>
                        <option value="Contacted">🟠 Contacted</option>
                        <option value="Qualified">🟢 Qualified</option>
                        <option value="Lost">⚫ Lost</option>
                      </select>

                      <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="h-9 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl cursor-pointer focus:outline-none max-w-[180px]"
                      >
                        <option value="">Semua Sumber</option>
                        {filterOptions.sources.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      <select
                        value={trafficFilter}
                        onChange={(e) => setTrafficFilter(e.target.value)}
                        className="h-9 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl cursor-pointer focus:outline-none"
                      >
                        <option value="">Semua Traffic</option>
                        {filterOptions.traffics.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      <DnaButton
                        variant="outline"
                        onClick={handleExportCSV}
                        icon={<Download />}
                      >
                        Export CSV
                      </DnaButton>

                      <DnaButton
                        variant="danger"
                        onClick={handleClearAllLeads}
                        icon={<Trash2 />}
                      >
                        Hapus Semua
                      </DnaButton>
                    </div>
                  </div>
                }
              >
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="p-4 text-left w-28">
                          <span className="text-table-header text-slate-400">Tanggal</span>
                        </th>
                        <th className="p-4 text-left">
                          <span className="text-table-header text-slate-400">Nama</span>
                        </th>
                        <th className="p-4 text-left">
                          <span className="text-table-header text-slate-400">Brand</span>
                        </th>
                        <th className="p-4 text-left w-36">
                          <span className="text-table-header text-slate-400">No. HP</span>
                        </th>
                        <th className="p-4 text-left">
                          <span className="text-table-header text-slate-400">Sumber</span>
                        </th>
                        <th className="p-4 text-left">
                          <span className="text-table-header text-slate-400">Traffic</span>
                        </th>
                        <th className="p-4 text-left">
                          <span className="text-table-header text-slate-400">Sales</span>
                        </th>
                        <th className="p-4 text-left w-36">
                          <span className="text-table-header text-slate-400">Status</span>
                        </th>
                        <th className="p-4 text-center w-20">
                          <span className="text-table-header text-slate-400">Aksi</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => {
                        const date = new Date(lead.timestamp);
                        const dateStr = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
                        const timeStr = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

                        return (
                          <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                            <td className="p-4 align-middle">
                              <div className="flex flex-col">
                                <span className="text-[11.5px] font-black text-slate-700 tabular-nums">{dateStr}</span>
                                <span className="text-[9.5px] font-bold text-slate-400 tabular-nums">{timeStr}</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="text-[12px] font-black text-slate-900">{lead.nama || "-"}</span>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="text-[12px] font-bold text-slate-600">{lead.perusahaan || "-"}</span>
                            </td>
                            <td className="p-4 align-middle">
                              {lead.hp ? (
                                <a
                                  href={`https://wa.me/${lead.hp.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11.5px] font-bold text-emerald-600 hover:underline inline-flex items-center gap-1 tabular-nums"
                                >
                                  <PhoneCall className="w-3 h-3" /> {lead.hp}
                                </a>
                              ) : (
                                <span className="text-[11.5px] text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-4 align-middle">
                              <DnaBadge status="default">
                                {lead.source || "Dreamlab"}
                              </DnaBadge>
                            </td>
                            <td className="p-4 align-middle">
                              <DnaBadge status="info">
                                {lead.trafficSource || "Direct"}
                              </DnaBadge>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[12px] font-black text-slate-800">{lead.assignedTo || "-"}</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <select
                                value={lead.status}
                                onChange={(e) => updateStatusMutation.mutate({ id: lead.id, status: e.target.value })}
                                className={`text-[11.5px] font-black uppercase py-1 px-2 border rounded-xl cursor-pointer ${getStatusBadgeStyle(lead.status)} focus:outline-none`}
                              >
                                <option value="New">🔵 New</option>
                                <option value="Contacted">🟠 Contacted</option>
                                <option value="Qualified">🟢 Qualified</option>
                                <option value="Lost">⚫ Lost</option>
                              </select>
                            </td>
                            <td className="p-4 align-middle text-center">
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                title="Hapus Lead"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredLeads.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-12 text-center">
                            {leadsLoading ? (
                              <div className="flex flex-col items-center justify-center gap-2">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Memuat data lead...</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2">
                                <AlertCircle className="w-8 h-8 text-slate-300" />
                                <p className="text-sm font-black uppercase text-slate-400 tracking-wider">Belum ada lead masuk</p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                  Lead baru akan muncul di sini secara otomatis dari widget landing page.
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TableWrapper>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6 max-w-4xl">
              {/* Information Banner */}
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-800">
                    Cara Kerja Rotasi Server-Side Round-Robin:
                  </h4>
                  <p className="text-[11.5px] font-bold text-blue-600 mt-1 leading-relaxed">
                    Setiap lead baru yang masuk dari formulir konsultasi pelanggan akan dialokasikan secara bergiliran (adil 1-ke-1) ke sales WhatsApp yang berstatus aktif (toggle saklar berwarna hijau). Nonaktifkan sales yang sedang cuti agar tidak menerima alokasi leads.
                  </p>
                </div>
              </div>

              {/* Sales Config Card */}
              <Card className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Sales WhatsApp Rotator Settings
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Kelola nomor telepon WhatsApp dan keaktifan sales
                    </p>
                  </div>
                  <DnaButton
                    variant="outline"
                    onClick={() => {
                      if (confirm("Reset counter rotasi? Lead berikutnya akan masuk ke sales pertama yang aktif.")) {
                        resetRotationMutation.mutate();
                      }
                    }}
                    icon={<RefreshCw />}
                  >
                    Reset Counter
                  </DnaButton>
                </div>

                <div className="p-6 space-y-4">
                  {salesLoading ? (
                    <div className="p-12 text-center">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-xs font-black uppercase text-slate-400">Loading data sales...</p>
                    </div>
                  ) : (
                    editedSales.map((member, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-slate-50/50 border border-slate-100 p-4 rounded-2xl group hover:border-slate-200 transition-all">
                        {/* Name Input */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nama Sales</label>
                          <DnaInput
                            value={member.name}
                            onChange={(e) => handleSalesFieldChange(i, "name", e.target.value)}
                            placeholder="Contoh: Annisa"
                            className="h-9 font-bold"
                          />
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">WhatsApp (Internasional)</label>
                          <DnaInput
                            type="tel"
                            value={member.phone}
                            onChange={(e) => handleSalesFieldChange(i, "phone", e.target.value.replace(/\D/g, ""))}
                            placeholder="62812..."
                            className="h-9 font-bold tabular-nums"
                          />
                        </div>

                        {/* Active Toggle */}
                        <div className="flex flex-col items-center md:items-start justify-center pt-2 md:pt-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Status Dinas</span>
                          <div className="flex items-center gap-2">
                            {/* Toggle switch custom */}
                            <button
                              onClick={() => handleToggleSales(i)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                member.active ? "bg-emerald-500" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  member.active ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <DnaBadge status={member.active ? "success" : "default"}>
                              {member.active ? "Aktif" : "Off"}
                            </DnaBadge>
                          </div>
                        </div>

                        {/* Tips indicator */}
                        <div className="text-[10px] text-slate-400 font-medium md:pt-4 text-center md:text-right">
                          {member.phone.startsWith("62") ? (
                            <span className="text-emerald-500 font-bold">✓ Format nomor valid</span>
                          ) : member.phone ? (
                            <span className="text-rose-500 font-bold">⚠️ Harus diawali 62</span>
                          ) : (
                            <span>Belum diisi</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Actions buttons */}
                  {!salesLoading && (
                    <div className="pt-4 flex justify-end">
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

              {/* Format Guide */}
              <Card className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">Panduan Format Nomor Telepon</h3>
                <p className="text-[11.5px] font-bold text-slate-500 leading-relaxed">
                  Semua nomor telepon WhatsApp wajib didaftarkan menggunakan format kode negara internasional tanpa tanda "+" atau "0" di depan:
                </p>
                <ul className="list-disc list-inside text-[11px] font-bold text-slate-400 mt-2 space-y-1.5 ml-2">
                  <li>Contoh: <code className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-lg border border-rose-100">08123456789</code> ditulis sebagai <strong className="text-slate-700">628123456789</strong></li>
                  <li>Awalan kode negara Indonesia selalu <strong className="text-slate-700">62</strong></li>
                </ul>
              </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
              {statsLoading ? (
                <div className="p-20 text-center bg-white border border-slate-200 rounded-2xl">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Menghitung statistik rotasi lead...</p>
                </div>
              ) : leads.length === 0 ? (
                <Card className="p-12 text-center bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="w-10 h-10 text-slate-300" />
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Belum Ada Data Statistik</h3>
                  <p className="text-[10.5px] text-slate-300 font-bold uppercase tracking-widest">
                    Statistik visual akan otomatis muncul setelah lead masuk pertama kali tercatat.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Distribution per Sales */}
                  <Card className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="mb-6">
                      <SectionLabel>Lead Allocations</SectionLabel>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mt-1">
                        Distribusi Giliran per Sales
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Menjamin pembagian lead merata secara round-robin
                      </p>
                    </div>

                    <div className="space-y-4">
                      {distributions.sales.map(([name, count]) => {
                        const total = leads.length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={name} className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-800">{name}</span>
                              <span className="text-blue-600 font-black tabular-nums">{count} lead ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Distribution per Source Page */}
                  <Card className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="mb-6">
                      <SectionLabel>Sources Ranking</SectionLabel>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mt-1">
                        Distribusi Halaman Sumber
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Landing page dengan performa konversi terbaik
                      </p>
                    </div>

                    <div className="space-y-4">
                      {distributions.pages.map(([page, count]) => {
                        const total = leads.length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={page} className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-800 truncate max-w-[200px]">{page}</span>
                              <span className="text-purple-600 font-black tabular-nums">{count} lead ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-600 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Distribution per Traffic Platform */}
                  <Card className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="mb-6">
                      <SectionLabel>Traffic Share</SectionLabel>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mt-1">
                        Kanal Asal Traffic
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Distribusi lead berdasarkan platform iklan & organic
                      </p>
                    </div>

                    <div className="space-y-4">
                      {distributions.traffics.map(([traffic, count]) => {
                        const total = leads.length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={traffic} className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-800">{traffic}</span>
                              <span className="text-amber-600 font-black tabular-nums">{count} lead ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Distribution per Product Category */}
                  <Card className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="mb-6">
                      <SectionLabel>Product Interests</SectionLabel>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mt-1">
                        Distribusi Minat Produk
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Produk kosmetik/maklon yang paling diminati visitor
                      </p>
                    </div>

                    <div className="space-y-4">
                      {distributions.products.map(([product, count]) => {
                        const total = leads.length;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={product} className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-800">{product}</span>
                              <span className="text-rose-600 font-black tabular-nums">{count} lead ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-600 to-rose-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              )}
          </TabsContent>
    </Tabs>
  );
}
