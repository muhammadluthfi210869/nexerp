"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Eye,
  Users,
  MousePointer2,
  Activity,
  Globe,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
  Search,
  ExternalLink,
  Zap,
  BarChart3,
  PieChart,
  Layers,
  Phone,
  User,
  Building2,
  Package,
  CheckCircle2,
  Clock4,
  XCircle,
  Loader2,
  Trash2,
  Triangle,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { DnaInput } from "@/components/dna/DnaInput";
import { Input } from "@/components/ui/input";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { DnaButton } from "@/components/dna/DnaButton";
import { StatCard } from "@/components/dna/StatCard";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { SectionLabel } from "@/components/dna/SectionLabel";

const COLORS = ["#2563EB", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444", "#6B7280"];

export default function LandingTrackerClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [isPolling, setIsPolling] = useState(true);
  // null di awal → hindari hydration mismatch (server vs client Date).
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "pages" | "traffic" | "conversions">("overview");
  const [vercelProjectId, setVercelProjectId] = useState("");
  const [vercelProjectName, setVercelProjectName] = useState("");
  const [vercelDeployUrl, setVercelDeployUrl] = useState("");
  const [vercelConnecting, setVercelConnecting] = useState(false);

  const pollInterval = isPolling ? 8000 : undefined;

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: () => api.get("/marketing/landing-tracker/stats").then((r) => r.data),
    refetchInterval: pollInterval,
  });

  const { data: recentData } = useQuery({
    queryKey: ["landing-recent"],
    queryFn: () => api.get("/marketing/landing-tracker/recent?limit=50").then((r) => r.data),
    refetchInterval: pollInterval,
  });

  const { data: visitsData } = useQuery({
    queryKey: ["landing-visits"],
    queryFn: () => api.get("/marketing/landing-tracker/visits?page=1&limit=50").then((r) => r.data),
    refetchInterval: pollInterval,
  });

  const { data: conversionsData, isLoading: conversionsLoading } = useQuery({
    queryKey: ["landing-conversions"],
    queryFn: () => api.get("/marketing/landing-tracker/conversions?page=1&limit=50").then((r) => r.data),
    refetchInterval: pollInterval,
  });

  const { data: vercelProjects, refetch: refetchVercel } = useQuery({
    queryKey: ["vercel-projects"],
    queryFn: () => api.get("/marketing/vercel/projects").then((r) => r.data),
  });

  const connectVercel = async () => {
    if (!vercelProjectId.trim()) return;
    setVercelConnecting(true);
    try {
      await api.post("/marketing/vercel/connect", {
        projectId: vercelProjectId.trim(),
        projectName: vercelProjectName.trim() || undefined,
        deployUrl: vercelDeployUrl.trim() || undefined,
      });
      setVercelProjectId("");
      setVercelProjectName("");
      setVercelDeployUrl("");
      refetchVercel();
    } catch (err) {
      console.error("Failed to connect Vercel project:", err);
    } finally {
      setVercelConnecting(false);
    }
  };

  const disconnectVercel = async (projectId: string) => {
    try {
      await api.delete(`/marketing/vercel/disconnect/${projectId}`);
      refetchVercel();
    } catch (err) {
      console.error("Failed to disconnect Vercel project:", err);
    }
  };

  useEffect(() => {
    setLastUpdate(new Date());
    if (!isPolling) return;
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 8000);
    return () => clearInterval(interval);
  }, [isPolling]);

  const stats = useMemo(() => statsData || {}, [statsData]);
  const totalViews = stats.totalViews ?? 0;
  const uniqueVisitors = stats.uniqueVisitors ?? 0;
  const conversionRate = stats.conversionRate ?? 0;
  const activeNow = stats.activeNow ?? 0;
  const hourlyTrend = stats.hourlyTrend ?? [];
  const pageStats = stats.pageStats ?? [];
  const trafficStats = useMemo(() => stats.trafficStats ?? [], [stats.trafficStats]);

  const visits = useMemo(() => recentData || visitsData?.data || [], [recentData, visitsData]);
  const conversions = useMemo(() => conversionsData?.data || [], [conversionsData]);

  const trafficSourceChart = useMemo(() => {
    return trafficStats.map((t: { source: string; visits: number }, i: number) => ({
      name: t.source?.replace(/_/g, " ") || "Unknown",
      value: t.visits,
      color: COLORS[i % COLORS.length],
    }));
  }, [trafficStats]);

  const filteredVisits = useMemo(() => {
    return (visits || []).filter((v: any) => {
      const matchesSearch =
        !searchQuery ||
        (v.pageTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.referrer || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.visitorId || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = !filterSource || v.utmSource === filterSource;
      return matchesSearch && matchesSource;
    });
  }, [visits, searchQuery, filterSource]);

  const formatTime = (iso: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  };

  const getConversionStatusIcon = (status: string) => {
    switch (status) {
      case "NEW": return <Clock4 className="w-3 h-3 text-amber-500" />;
      case "CONTACTED": return <Phone className="w-3 h-3 text-blue-500" />;
      case "WON": return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case "LOST": return <XCircle className="w-3 h-3 text-rose-500" />;
      default: return <Clock4 className="w-3 h-3 text-slate-400" />;
    }
  };

  const getConversionStatusBadge = (status: string) => {
    switch (status) {
      case "NEW": return "warning";
      case "CONTACTED": return "info";
      case "WON": return "success";
      case "LOST": return "critical";
      default: return "default";
    }
  };

  const formatTrend = (value: number | undefined | null, suffix = "") => {
    if (value === undefined || value === null) return "0";
    return value.toLocaleString() + suffix;
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 pb-20">
      {/* 1. TOP COMMAND BAR */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-0 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 180 }}
              className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100"
            >
              <Eye className="text-white w-6 h-6" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                LANDING <span className="text-blue-600">PAGE TRACKER</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <Globe className="w-2.5 h-2.5 text-blue-500" /> Real-Time Visit Intelligence v2.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-tight">LIVE</span>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600">
                {lastUpdate
                  ? lastUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                  : "--:--"}
              </span>
            </div>

            <DnaButton
              variant="outline"
              onClick={() => setIsPolling(!isPolling)}
              className={cn(isPolling ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "")}
              icon={<RefreshCw className={cn("w-4 h-4", isPolling && "animate-spin")} />}
            >
              {isPolling ? "LIVE" : "PAUSED"}
            </DnaButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-0 mt-4 space-y-6">
        {/* 2. KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Page Views" value={statsLoading ? "..." : formatTrend(totalViews)} icon={<Eye />} />
          <StatCard label="Unique Visitors" value={statsLoading ? "..." : formatTrend(uniqueVisitors)} icon={<Users />} />
          <StatCard label="Conversion Rate" value={statsLoading ? "..." : `${conversionRate}%`} icon={<MousePointer2 />} />
          <StatCard label="Active Now" value={statsLoading ? "..." : activeNow} subValue="visitors on landing pages" icon={<Activity />} />
        </div>

        {/* 3. VIEW TABS */}
        <div className="flex items-center gap-2 flex-wrap">
          <DnaButton
            variant={activeView === "overview" ? "primary" : "outline"}
            icon={<BarChart3 />}
            onClick={() => setActiveView("overview")}
          >
            Overview
          </DnaButton>
          <DnaButton
            variant={activeView === "pages" ? "primary" : "outline"}
            icon={<Layers />}
            onClick={() => setActiveView("pages")}
          >
            Pages
          </DnaButton>
          <DnaButton
            variant={activeView === "traffic" ? "primary" : "outline"}
            icon={<PieChart />}
            onClick={() => setActiveView("traffic")}
          >
            Traffic Sources
          </DnaButton>
          <DnaButton
            variant={activeView === "conversions" ? "primary" : "outline"}
            icon={<User />}
            onClick={() => setActiveView("conversions")}
          >
            Conversions
          </DnaButton>
        </div>

        {/* 4. VIEW SECTIONS */}
        <AnimatePresence mode="wait">
          {activeView === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* HOURLY TREND CHART */}
              <Card className="p-6 border border-slate-200 shadow-sm rounded-2xl bg-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <SectionLabel as="h3">
                      Hourly Visit Trend
                    </SectionLabel>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Page views & conversions per hour
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-[9px] font-black text-slate-400 uppercase">Views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase">Conversions</span>
                    </div>
                  </div>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyTrend.length > 0 ? hourlyTrend : [{ hour: "00:00", views: 0, conversions: 0 }]} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: "#94A3B8" }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: "#94A3B8" }} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "10px" }} />
                      <Area type="monotone" dataKey="views" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" dot={{ r: 3, fill: "#FFFFFF", stroke: "#2563EB", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConv)" dot={{ r: 3, fill: "#FFFFFF", stroke: "#10B981", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* LIVE VISIT LOG */}
              <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <SectionLabel as="h3">
                      Live Visit Log
                    </SectionLabel>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Real-time page visits across all landing pages
                    </p>
                  </div>
                </div>
                <TableWrapper>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Time</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Page</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Referrer</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">UTM Source</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Campaign</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Visitor</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVisits.slice(0, 20).map((v: any, i: number) => (
                        <tr key={v.id || i} className="group hover:bg-slate-50 transition-colors even:bg-slate-50/20">
                          <td className="p-3 border-b border-slate-100">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-700 tabular-nums">{formatTime(v.timestamp)}</span>
                              <span className="text-[9px] font-bold text-slate-400">{formatDate(v.timestamp)}</span>
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Globe className="w-3 h-3 text-slate-300" />
                              <div>
                                <p className="text-[11px] font-bold text-slate-700">{v.pageTitle || "Untitled"}</p>
                                <p className="text-[9px] font-bold text-slate-400 truncate max-w-[200px]">{v.pageUrl}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <DnaBadge status="default">
                              {v.referrer === "direct" || !v.referrer ? "Direct" : v.referrer}
                            </DnaBadge>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            {v.utmSource ? (
                              <DnaBadge status={(v.utmSource === "google" ? "info" : v.utmSource === "facebook" || v.utmSource === "instagram" ? "purple" : v.utmSource === "tiktok" ? "warning" : v.utmSource === "youtube" ? "critical" : "default") as any}>
                                {v.utmSource}
                              </DnaBadge>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500">{v.utmCampaign || "-"}</span>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">{v.visitorId || "-"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrapper>

                {filteredVisits.length === 0 && (
                  <div className="p-12 text-center">
                    <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">
                      {statsLoading ? "Memuat data..." : "No visits match your filters"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 mt-1">
                      {statsLoading ? "Menunggu koneksi ke server..." : "Try adjusting your search or filter criteria"}
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {activeView === "pages" && (
            <motion.div
              key="pages"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* PAGE PERFORMANCE BAR CHART */}
              <Card className="p-6 border border-slate-200 shadow-sm rounded-2xl bg-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <SectionLabel as="h3">
                      Page Performance
                    </SectionLabel>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Views per landing page
                    </p>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pageStats.length > 0 ? pageStats : [{ page: "No data", views: 0, url: "" }]} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="page" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 800, fill: "#94A3B8" }} dy={5} angle={-15} textAnchor="end" height={60} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: "#94A3B8" }} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "10px" }} />
                      <Bar dataKey="views" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* PAGE LIST TABLE */}
              <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-5 border-b border-slate-100">
                  <SectionLabel as="h3">
                    Landing Pages Ranking
                  </SectionLabel>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Sorted by total views
                  </p>
                </div>
                <TableWrapper>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">#</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Page</span>
                        </th>
                        <th className="p-3 text-right">
                          <span className="text-table-header text-slate-400">Views</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageStats.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-12 text-center">
                            <p className="text-sm font-bold text-slate-400">Belum ada data kunjungan</p>
                          </td>
                        </tr>
                      )}
                      {pageStats.map((p: any, i: number) => (
                        <tr key={i} className="group hover:bg-slate-50 transition-colors even:bg-slate-50/20">
                          <td className="p-3 border-b border-slate-100">
                            <span className={cn(
                              "text-[11px] font-black",
                              i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-slate-300"
                            )}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Globe className="w-3 h-3 text-slate-300" />
                              <div>
                                <p className="text-[11px] font-bold text-slate-700">{p.page || "Unknown"}</p>
                                <p className="text-[9px] font-bold text-slate-400">{p.url}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-100 text-right">
                            <span                           className="text-[12px] font-black text-blue-600 tabular-nums">{p.views?.toLocaleString() || 0}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrapper>
              </Card>
            </motion.div>
          )}

          {activeView === "traffic" && (
            <motion.div
              key="traffic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PIE CHART */}
                <Card className="p-6 border border-slate-200 shadow-sm rounded-2xl bg-white">
                  <div className="mb-6">
                    <SectionLabel as="h3">
                      Traffic Source Distribution
                    </SectionLabel>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Share of visits by source
                    </p>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={trafficSourceChart.length > 0 ? trafficSourceChart : [{ name: "No Data", value: 1, color: "#E2E8F0" }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {(trafficSourceChart.length > 0 ? trafficSourceChart : [{ name: "No Data", value: 1, color: "#E2E8F0" }]).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "10px" }} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* SOURCE LIST */}
                <Card className="p-6 border border-slate-200 shadow-sm rounded-2xl bg-white">
                  <div className="mb-6">
                    <SectionLabel as="h3">
                      Source Breakdown
                    </SectionLabel>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Detailed traffic source metrics
                    </p>
                  </div>
                  <div className="space-y-4">
                    {trafficSourceChart.length === 0 && (
                      <p className="text-sm font-bold text-slate-400 text-center py-8">Belum ada data traffic</p>
                    )}
                    {trafficSourceChart.sort((a: any, b: any) => b.value - a.value).map((source: any, i: number) => {
                      const total = trafficSourceChart.reduce((sum: number, s: any) => sum + s.value, 0);
                      const percent = total > 0 ? ((source.value / total) * 100).toFixed(1) : "0";
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                              <span className="text-[11px] font-bold text-slate-700">{source.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black text-slate-700 tabular-nums">{source.value}</span>
                              <span className="text-[10px] font-bold text-slate-400 w-10 text-right">{percent}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%`, backgroundColor: source.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeView === "conversions" && (
            <motion.div
              key="conversions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-5 border-b border-slate-100">
                  <SectionLabel as="h3">
                    Conversion Leads
                  </SectionLabel>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Form submissions with contact data
                  </p>
                </div>
                <TableWrapper>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Waktu</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Nama</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">No. HP</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Perusahaan</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Produk</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Halaman</span>
                        </th>
                        <th className="p-3 text-left">
                          <span className="text-table-header text-slate-400">Status</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversions.length === 0 && !conversionsLoading && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center">
                            <User className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-400">Belum ada conversion data</p>
                            <p className="text-[10px] font-bold text-slate-300 mt-1">
                              Data akan muncul ketika ada form submission dari landing page
                            </p>
                          </td>
                        </tr>
                      )}
                      {conversionsLoading && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center">
                            <Loader2 className="w-6 h-6 text-slate-300 mx-auto animate-spin mb-2" />
                            <p className="text-sm font-bold text-slate-400">Memuat data...</p>
                          </td>
                        </tr>
                      )}
                      {conversions.map((c: any, i: number) => (
                        <tr key={c.id || i} className="group hover:bg-slate-50 transition-colors even:bg-slate-50/20">
                          <td className="p-3 border-b border-slate-100">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-700 tabular-nums">{formatTime(c.timestamp)}</span>
                              <span className="text-[9px] font-bold text-slate-400">{formatDate(c.timestamp)}</span>
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-slate-300" />
                              <span className="text-[11px] font-bold text-slate-700">{c.nama || "-"}</span>
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-slate-300" />
                              <span className="text-[11px] font-bold text-slate-700 tabular-nums">{c.hp || "-"}</span>
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3 h-3 text-slate-300" />
                              <span className="text-[11px] font-bold text-slate-700">{c.perusahaan || "-"}</span>
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3 text-slate-300" />
                              <span className="text-[11px] font-bold text-slate-700">{c.produk || "-"}</span>
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[150px] inline-block">
                              {c.pageTitle || c.pageUrl || "-"}
                            </span>
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <div className="flex items-center gap-1.5">
                              {getConversionStatusIcon(c.status || "NEW")}
                              <DnaBadge status={getConversionStatusBadge(c.status || "NEW") as any}>
                                {c.status || "NEW"}
                              </DnaBadge>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrapper>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. VERCEL CONNECT PANEL */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <Triangle className="w-4 h-4 text-blue-600 fill-blue-600" />
              <SectionLabel as="h3">
                Vercel Connect
              </SectionLabel>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Hubungkan landing page yang di-deploy di Vercel ke tracker
            </p>
          </div>
          <div className="p-5">
            <div className="flex flex-col md:flex-row gap-3 mb-5">
              <DnaInput
                placeholder="Vercel Project ID"
                value={vercelProjectId}
                onChange={(e) => setVercelProjectId(e.target.value)}
                className="h-10 font-bold"
              />
              <DnaInput
                placeholder="Project Name (optional)"
                value={vercelProjectName}
                onChange={(e) => setVercelProjectName(e.target.value)}
                className="h-10 font-bold"
              />
              <DnaInput
                placeholder="Deploy URL (optional)"
                value={vercelDeployUrl}
                onChange={(e) => setVercelDeployUrl(e.target.value)}
                className="h-10 font-bold"
              />
              <DnaButton
                variant="primary"
                onClick={connectVercel}
                disabled={vercelConnecting || !vercelProjectId.trim()}
              >
                {vercelConnecting ? "Connecting..." : "Connect"}
              </DnaButton>
            </div>

            {vercelProjects && vercelProjects.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Connected Projects</p>
                {vercelProjects.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">{p.projectName || p.projectId}</p>
                        <p className="text-[9px] font-bold text-slate-400">{p.deployUrl || `https://${p.projectId}.vercel.app`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DnaBadge status={p.status === "connected" ? "success" : "critical"}>
                        {p.status === "connected" ? "LIVE" : "ERROR"}
                      </DnaBadge>
                      <DnaButton
                        variant="ghost"
                        onClick={() => disconnectVercel(p.projectId)}
                        icon={<Trash2 />}
                        className="w-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!vercelProjects || vercelProjects.length === 0) && (
              <div className="text-center py-4">
                <Triangle className="w-6 h-6 text-slate-200 mx-auto mb-2 fill-slate-200" />
                <p className="text-[11px] font-bold text-slate-400">Belum ada project Vercel terhubung</p>
                <p className="text-[9px] font-bold text-slate-300 mt-0.5">Masukkan Project ID di atas untuk memulai tracking</p>
              </div>
            )}
          </div>
        </Card>

        {/* FOOTER CONTEXT */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-0.5">
              <p className="text-md font-bold text-slate-900 uppercase tracking-tight">Landing Page Tracking Protocol</p>
              <p className="text-[11px] text-slate-500 font-medium max-w-md">Real-time visit tracking across all landing pages. Data refreshes every 8 seconds.</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-tight text-slate-400">
              Polling: <span className="text-emerald-600">{isPolling ? "8s" : "OFF"}</span>
            </div>
            <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-tight text-slate-400">
              Mode: <span className="text-emerald-600">LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
