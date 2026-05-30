"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dna/KpiCard";
import { TableWrapper, DnaBadge } from "@/components/dna";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend, ResponsiveContainer
} from "recharts";
import {
  Activity, AlertTriangle, FlaskConical, Clock,
  AlertCircle, Target, DollarSign, Package, ShieldCheck
} from "lucide-react";

// --- Types ---
interface QCStats {
  fty: number;
  copq: number;
  leakageHotspot: string;
  activeQuarantines: number;
}

interface ParetoItem {
  defect: string;
  count: number;
  percentage: number;
}

interface SupplierQualityItem {
  supplier: string;
  quality: number;
  delivery: number;
  compliance: number;
}

interface VendorWatchlistItem {
  supplier: string;
  rejectCount: number;
  acceptRate: number;
  topDefects: string[];
}

interface ReworkHoldItem {
  batch: string;
  phase: string;
  defect: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  disposition: string;
  heldHours: number;
}

interface PhaseBreakdownItem {
  phase: string;
  totalAudits: number;
  passCount: number;
  rejectCount: number;
  holdCount: number;
  passRate: number;
  topRejectReasons: { defectCategory: string; count: number }[];
  topDefectTypes: { defectType: string; count: number }[];
  severityBreakdown: Record<string, number>;
  dispositionBreakdown: Record<string, number>;
}

interface PhaseBreakdownData {
  phases: PhaseBreakdownItem[];
  overall: {
    totalPass: number;
    totalReject: number;
    overallPassRate: number;
  };
}

// --- Fetchers ---
const fetchStats = async (): Promise<QCStats> => (await api.get("/production/qc/stats")).data;
const fetchPareto = async (): Promise<ParetoItem[]> => (await api.get("/qc/analytics/defect-pareto")).data;
const fetchSupplierQuality = async (): Promise<SupplierQualityItem[]> => (await api.get("/qc/analytics/supplier-quality")).data;
const fetchVendorWatchlist = async (): Promise<VendorWatchlistItem[]> => (await api.get("/qc/analytics/vendor-watchlist")).data;
const fetchReworkHold = async (): Promise<ReworkHoldItem[]> => (await api.get("/qc/analytics/rework-hold-log")).data;
const fetchPhaseBreakdown = async (): Promise<PhaseBreakdownData> => (await api.get("/qc/analytics/phase-breakdown")).data;

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function severityColor(s: string) {
  switch (s) {
    case "CRITICAL": return "bg-red-500/20 text-red-400 border-red-500/40";
    case "MAJOR": return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/40";
  }
}

export default function QCAnalyticsDashboard() {
  const { data: stats } = useQuery({ queryKey: ["qc-stats"], queryFn: fetchStats });
  const { data: pareto } = useQuery({ queryKey: ["qc-pareto"], queryFn: fetchPareto });
  const { data: supplierQuality } = useQuery({ queryKey: ["qc-supplier-quality"], queryFn: fetchSupplierQuality });
  const { data: vendorWatchlist } = useQuery({ queryKey: ["qc-vendor-watchlist"], queryFn: fetchVendorWatchlist });
  const { data: reworkHold } = useQuery({ queryKey: ["qc-rework-hold"], queryFn: fetchReworkHold });
  const { data: phaseBreakdown } = useQuery({ queryKey: ["qc-phase-breakdown"], queryFn: fetchPhaseBreakdown });

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-1000 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">QC Analytics</h1>
          <p className="text-zinc-500 font-sans text-sm uppercase tracking-tight mt-2">
            <span className="text-emerald-500 animate-pulse">●</span> Quality Intelligence Dashboard
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          label="FTY (First Time Yield)"
          value={stats ? `${(stats.fty * 100).toFixed(1)}%` : "—"}
          targetPct={stats ? Math.round(stats.fty * 100) : 0}
          icon={<Target />}
        />
        <KpiCard
          label="COPQ"
          value={stats ? formatRp(stats.copq) : "—"}
          targetPct={stats ? (stats.copq < 1e9 ? 80 : stats.copq < 5e9 ? 50 : 20) : 0}
          icon={<DollarSign />}
        />
        <KpiCard
          label="LEAKAGE HOTSPOT"
          value={stats?.leakageHotspot ?? "—"}
          targetPct={stats?.leakageHotspot ? 50 : 100}
          icon={<AlertTriangle />}
        />
        <KpiCard
          label="ACTIVE QUARANTINES"
          value={stats ? String(stats.activeQuarantines) : "—"}
          targetPct={stats ? (stats.activeQuarantines === 0 ? 100 : 0) : 0}
          icon={<Package />}
        />
      </div>

      {/* Phase Breakdown */}
      {phaseBreakdown && (
        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white uppercase tracking-tighter text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> PHASE BREAKDOWN
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[10px] uppercase">
                Pass / Reject per inspection phase
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-xl border border-zinc-900 overflow-hidden mx-6 mb-6">
                <Table>
                  <TableHeader className="bg-zinc-900/50">
                    <TableRow className="border-zinc-900">
                      <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Phase</TableHead>
                      <TableHead className="font-sans text-[10px] uppercase text-zinc-500 text-right">Pass</TableHead>
                      <TableHead className="font-sans text-[10px] uppercase text-zinc-500 text-right">Reject</TableHead>
                      <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Pass Rate</TableHead>
                      <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Top Defect</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phaseBreakdown.phases.map((p) => {
                      const topDefect = p.topDefectTypes[0];
                      return (
                        <TableRow key={p.phase} className="border-zinc-900 hover:bg-white/[0.02]">
                          <TableCell className="font-bold text-white text-sm">{p.phase}</TableCell>
                          <TableCell className="text-right text-emerald-400 font-bold">{p.passCount}</TableCell>
                          <TableCell className="text-right text-red-400 font-bold">{p.rejectCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all"
                                  style={{ width: `${p.passRate}%` }}
                                />
                              </div>
                              <span className="text-zinc-400 text-xs font-mono">{p.passRate}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-400 text-xs">
                            {topDefect ? (
                              <DnaBadge status="warning" className="text-[9px]">
                                {topDefect.defectType} ({topDefect.count})
                              </DnaBadge>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Defect Categories */}
          <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white uppercase tracking-tighter text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" /> DEFECT CATEGORIES
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[10px] uppercase">
                Aggregated defect categories across all phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {(() => {
                  const categoryMap: Record<string, number> = {};
                  for (const p of phaseBreakdown.phases) {
                    for (const r of p.topRejectReasons) {
                      categoryMap[r.defectCategory] = (categoryMap[r.defectCategory] || 0) + r.count;
                    }
                  }
                  const categoryColors: Record<string, string> = {
                    FISIK: "bg-red-500/20 text-red-400 border-red-500/40",
                    KIMIA: "bg-blue-500/20 text-blue-400 border-blue-500/40",
                    MIKROBIOLOGI: "bg-purple-500/20 text-purple-400 border-purple-500/40",
                    LABEL_DOKUMEN: "bg-amber-500/20 text-amber-400 border-amber-500/40",
                    KEMASAN: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                    LAINNYA: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40",
                  };
                  return Object.entries(categoryMap)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => (
                      <Badge
                        key={cat}
                        className={`border text-[10px] font-black uppercase rounded-none px-3 py-1.5 ${categoryColors[cat] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/40"}`}
                      >
                        {cat}: {count}
                      </Badge>
                    ));
                })()}
                {(() => {
                  const hasAny = phaseBreakdown.phases.some((p) => p.topRejectReasons.length > 0);
                  return !hasAny ? <p className="text-zinc-600 text-xs">No defect data</p> : null;
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Pareto Defect Distribution */}
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white uppercase tracking-tighter text-sm font-bold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-emerald-500" /> Pareto Defect Distribution
            </CardTitle>
            <CardDescription className="text-zinc-500 text-[10px] uppercase">
              Defect frequency sorted by impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={pareto ?? []} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="defect" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value) => [value, "Count"]}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Supplier Quality Radar */}
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white uppercase tracking-tighter text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" /> Supplier Quality Radar
            </CardTitle>
            <CardDescription className="text-zinc-500 text-[10px] uppercase">
              Multi-dimensional score per supplier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={supplierQuality ?? []} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="supplier" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 9 }} />
                <Radar name="Quality" dataKey="quality" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Radar name="Delivery" dataKey="delivery" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                <Radar name="Compliance" dataKey="compliance" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#fff" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Critical Vendor Watchlist */}
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white uppercase tracking-tighter text-sm font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" /> Critical Vendor Watchlist
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[10px] uppercase">
                Suppliers flagged below 90% acceptance
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-xl border border-zinc-900 overflow-hidden mx-6 mb-6">
              <Table>
                <TableHeader className="bg-zinc-900/50">
                  <TableRow className="border-zinc-900">
                    <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Supplier</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase text-zinc-500 text-right">Rejects</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase text-zinc-500 text-right">Accept Rate</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Top Defects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(vendorWatchlist ?? []).map(v => (
                    <TableRow
                      key={v.supplier}
                      className={`border-zinc-900 hover:bg-white/[0.02] ${v.acceptRate < 90 ? "bg-red-950/20" : ""}`}
                    >
                      <TableCell className={`font-bold text-sm ${v.acceptRate < 90 ? "text-red-400" : "text-white"}`}>
                        {v.supplier}
                        {v.acceptRate < 90 && (
                          <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/40 text-[8px] font-black uppercase rounded-none">FLAGGED</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-zinc-300">{v.rejectCount}</TableCell>
                      <TableCell className={`text-right font-bold ${v.acceptRate < 90 ? "text-red-400" : "text-emerald-400"}`}>
                        {v.acceptRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {v.topDefects.map(d => (
                            <Badge key={d} className="bg-zinc-900 border-zinc-800 text-zinc-400 text-[9px] font-mono rounded-none px-2">{d}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(vendorWatchlist ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16">
                        <p className="text-zinc-800 font-black text-xl uppercase tracking-tight italic opacity-20">No flagged vendors</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Rework & Hold Action Log */}
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white uppercase tracking-tighter text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" /> Rework &amp; Hold Action Log
            </CardTitle>
            <CardDescription className="text-zinc-500 text-[10px] uppercase">
              Batches exceeding 24h hold are blinking red
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-xl border border-zinc-900 overflow-hidden mx-6 mb-6">
              <Table>
                <TableHeader className="bg-zinc-900/50">
                  <TableRow className="border-zinc-900">
                    <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Batch</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Phase</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Defect</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Severity</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase text-zinc-500">Disposition</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase text-zinc-500 text-right">Held Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reworkHold ?? []).map((r, i) => (
                    <TableRow
                      key={`${r.batch}-${i}`}
                      className={`border-zinc-900 hover:bg-white/[0.02] ${r.heldHours > 24 ? "blink-red" : ""}`}
                    >
                      <TableCell className="font-bold text-white text-sm">{r.batch}</TableCell>
                      <TableCell className="text-zinc-400 text-xs">{r.phase}</TableCell>
                      <TableCell className="text-zinc-300">{r.defect}</TableCell>
                      <TableCell>
                        <Badge className={`border text-[9px] font-black uppercase rounded-none ${severityColor(r.severity)}`}>
                          {r.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs">{r.disposition}</TableCell>
                      <TableCell className={`text-right font-bold ${r.heldHours > 24 ? "text-red-400" : "text-zinc-300"}`}>
                        {r.heldHours}h
                      </TableCell>
                    </TableRow>
                  ))}
                  {(reworkHold ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16">
                        <p className="text-zinc-800 font-black text-xl uppercase tracking-tight italic opacity-20">Clean floor — no holds</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>

      <style>{`
        @keyframes blink-red {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(239, 68, 68, 0.15); }
        }
        .blink-red {
          animation: blink-red 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
