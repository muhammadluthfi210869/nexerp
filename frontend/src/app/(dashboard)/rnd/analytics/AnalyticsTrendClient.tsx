"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { BarChart3, Calendar, Award, User2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardCard } from "@/components/dna";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isRndHeadAccount } from "@/lib/rnd-access";
import { TYPOGRAPHY, CHIP_CLASSES, deriveGrade, calcWeightedScore } from "@/components/rnd/rnd-constants";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type TabId = "trend" | "weekly" | "kpi";

type RndWeeklyPerformance = {
  id: string; pic: string; weekLabel: string; weekStart: string; weekEnd: string;
  totalTask: number; doneCount: number; delayedCount: number; failedTrial: number;
  revisionCount: number; ontimePct: number; trialSuccessRate: number;
  initiativeScore: number; weeklyScore: number; notes: string;
};

type RndMonthlyKpi = {
  id: string; month: string; pic: string; ontimePct: number;
  trialSuccessRate: number; revisionRate: number; initiativeScore: number;
  knowledgeContribution: number; compositeScore: number; grade: string;
};

// API response types for analytics trends
type AnalyticsTrendsResponse = {
  summary: {
    totalTasks: number; totalProjects: number; doneTasks: number;
    activeTasks: number; failedTasks: number; avgProgress: number;
  };
  monthlyTrend: Array<{
    month: string; total: number; done: number;
    onTimeRate: number; failedCount: number;
  }>;
  perPic: Array<{
    pic: string; totalTasks: number; done: number; failed: number;
    active: number; avgProgress: number; completionRate: number;
  }>;
  categoryBreakdown: Array<{ name: string; count: number }>;
};

// ═══════════════════════════════════════════════════════════════
// COMPACT STAT CARD
// ═══════════════════════════════════════════════════════════════
function StatCardCompact({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-2 md:p-8 shadow-sm">
      <p className="text-[7px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.05em] md:tracking-[0.1em] truncate">{label}</p>
      <p className="text-[13px] md:text-[32px] font-black text-slate-900 tracking-[-0.01em] md:tracking-[-0.02em] tabular-nums leading-tight mt-0.5 md:mt-0">{value ?? "—"}</p>
      {subValue && <p className="text-[6px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-tight mt-0.5 md:mt-0">{subValue}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GRADE BADGE
// ═══════════════════════════════════════════════════════════════
function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "A-": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "B+": "bg-blue-50 text-blue-700 border-blue-200",
    B: "bg-blue-50 text-blue-600 border-blue-200",
    "B-": "bg-amber-50 text-amber-700 border-amber-200",
    "C+": "bg-amber-50 text-amber-600 border-amber-200",
    C: "bg-rose-50 text-rose-700 border-rose-200",
    D: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[10px] font-black", colors[grade] || "bg-slate-50 text-slate-600 border-slate-200")}>
      {grade}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// PIC COLORED DOT
// ═══════════════════════════════════════════════════════════════
const PIC_COLORS: Record<string, string> = { Panca: "bg-blue-500", Yaya: "bg-emerald-500", Amira: "bg-purple-500" };

// ═══════════════════════════════════════════════════════════════
// MAKLON CATEGORY COLORS
// ═══════════════════════════════════════════════════════════════
const MAKLON_COLORS: Record<string, string> = {
  "MAKLON SKINCARE": "#2563EB",
  "MAKLON PARFUM": "#8B5CF6",
  "MAKLON BODY CARE": "#10B981",
  "MAKLON HAIR CARE": "#F59E0B",
  "MAKLON BABY CARE": "#EC4899",
  "MAKLON DECORATIVE": "#06B6D4",
  "MAKLON FOOT CARE": "#A855F7",
};

// ═══════════════════════════════════════════════════════════════
// DEFAULT FALLBACK — API offline
// ═══════════════════════════════════════════════════════════════
const FALLBACK_TRENDS: AnalyticsTrendsResponse = {
  summary: { totalTasks: 0, totalProjects: 0, doneTasks: 0, activeTasks: 0, failedTasks: 0, avgProgress: 0 },
  monthlyTrend: [],
  perPic: [],
  categoryBreakdown: [],
};

const FALLBACK_WEEKLY: RndWeeklyPerformance[] = [
  { id:"WP-1", pic:"Panca", weekLabel:"W1 Jul", weekStart:"2026-06-29", weekEnd:"2026-07-05", totalTask:8, doneCount:6, delayedCount:1, failedTrial:0, revisionCount:2, ontimePct:75, trialSuccessRate:100, initiativeScore:85, weeklyScore:82, notes:"" },
  { id:"WP-3", pic:"Yaya", weekLabel:"W1 Jul", weekStart:"2026-06-29", weekEnd:"2026-07-05", totalTask:6, doneCount:5, delayedCount:0, failedTrial:0, revisionCount:1, ontimePct:83, trialSuccessRate:100, initiativeScore:90, weeklyScore:86, notes:"" },
  { id:"WP-5", pic:"Amira", weekLabel:"W1 Jul", weekStart:"2026-06-29", weekEnd:"2026-07-05", totalTask:3, doneCount:3, delayedCount:0, failedTrial:0, revisionCount:0, ontimePct:100, trialSuccessRate:100, initiativeScore:95, weeklyScore:97, notes:"" },
  { id:"WP-2", pic:"Panca", weekLabel:"W2 Jul", weekStart:"2026-07-06", weekEnd:"2026-07-12", totalTask:7, doneCount:5, delayedCount:2, failedTrial:1, revisionCount:1, ontimePct:71, trialSuccessRate:83, initiativeScore:80, weeklyScore:74, notes:"Butuh improvement planning" },
  { id:"WP-4", pic:"Yaya", weekLabel:"W2 Jul", weekStart:"2026-07-06", weekEnd:"2026-07-12", totalTask:8, doneCount:7, delayedCount:1, failedTrial:0, revisionCount:0, ontimePct:88, trialSuccessRate:100, initiativeScore:95, weeklyScore:91, notes:"Performa bagus" },
  { id:"WP-6", pic:"Amira", weekLabel:"W2 Jul", weekStart:"2026-07-06", weekEnd:"2026-07-12", totalTask:5, doneCount:4, delayedCount:0, failedTrial:1, revisionCount:1, ontimePct:80, trialSuccessRate:80, initiativeScore:85, weeklyScore:81, notes:"Failed trial pada sunscreen" },
];

const FALLBACK_MONTHLY_KPI: RndMonthlyKpi[] = [
  { id:"KPI-1", month:"Jun 2026", pic:"Panca", ontimePct:78, trialSuccessRate:83, revisionRate:1.2, initiativeScore:75, knowledgeContribution:70, compositeScore:77, grade:"C" },
  { id:"KPI-2", month:"Jul 2026", pic:"Panca", ontimePct:82, trialSuccessRate:88, revisionRate:0.9, initiativeScore:80, knowledgeContribution:75, compositeScore:81, grade:"B" },
  { id:"KPI-3", month:"Jun 2026", pic:"Yaya", ontimePct:85, trialSuccessRate:92, revisionRate:0.7, initiativeScore:82, knowledgeContribution:78, compositeScore:84, grade:"B" },
  { id:"KPI-4", month:"Jul 2026", pic:"Yaya", ontimePct:88, trialSuccessRate:95, revisionRate:0.5, initiativeScore:85, knowledgeContribution:82, compositeScore:88, grade:"B+" },
  { id:"KPI-5", month:"Jun 2026", pic:"Amira", ontimePct:90, trialSuccessRate:85, revisionRate:0.8, initiativeScore:90, knowledgeContribution:85, compositeScore:87, grade:"B+" },
  { id:"KPI-6", month:"Jul 2026", pic:"Amira", ontimePct:92, trialSuccessRate:88, revisionRate:0.6, initiativeScore:92, knowledgeContribution:88, compositeScore:90, grade:"A" },
];

const tickStyle = { fill: "#94A3B8", fontSize: 11, fontWeight: 600 as const };
const tooltipStyle = { borderRadius: "16px", border: "1px solid #E2E8F0", fontSize: "12px" };

// ═══════════════════════════════════════════════════════════════
// MOCK DATA — MONTHLY KPI
// ═══════════════════════════════════════════════════════════════
const monthlyKpis: RndMonthlyKpi[] = [
  { id:"KPI-1", month:"Jun 2026", pic:"Panca", ontimePct:78, trialSuccessRate:83, revisionRate:1.2, initiativeScore:75, knowledgeContribution:70, compositeScore:77, grade:"C" },
  { id:"KPI-2", month:"Jul 2026", pic:"Panca", ontimePct:82, trialSuccessRate:88, revisionRate:0.9, initiativeScore:80, knowledgeContribution:75, compositeScore:81, grade:"B" },
  { id:"KPI-3", month:"Jun 2026", pic:"Yaya", ontimePct:85, trialSuccessRate:92, revisionRate:0.7, initiativeScore:82, knowledgeContribution:78, compositeScore:84, grade:"B" },
  { id:"KPI-4", month:"Jul 2026", pic:"Yaya", ontimePct:88, trialSuccessRate:95, revisionRate:0.5, initiativeScore:85, knowledgeContribution:82, compositeScore:88, grade:"B+" },
  { id:"KPI-5", month:"Jun 2026", pic:"Amira", ontimePct:90, trialSuccessRate:85, revisionRate:0.8, initiativeScore:90, knowledgeContribution:85, compositeScore:87, grade:"B+" },
  { id:"KPI-6", month:"Jul 2026", pic:"Amira", ontimePct:92, trialSuccessRate:88, revisionRate:0.6, initiativeScore:92, knowledgeContribution:88, compositeScore:90, grade:"A" },
];

// ═══════════════════════════════════════════════════════════════
// TAB: TREND CHARTS — Menggunakan API /rnd/analytics/trends
// ═══════════════════════════════════════════════════════════════
function TrendTab() {
  const [data, setData] = useState<AnalyticsTrendsResponse>(FALLBACK_TRENDS);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/rnd/analytics/trends");
      setData(res.data || FALLBACK_TRENDS);
    } catch {
      setData(FALLBACK_TRENDS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { summary, monthlyTrend, perPic, categoryBreakdown: catBrk } = data;
  const completedCount = data.summary.doneTasks;
  const activeCount = data.summary.activeTasks;
  const totalCount = data.summary.totalTasks;

  // ── Transform API data to chart formats ──
  const ontimeChart = monthlyTrend.length > 0
    ? monthlyTrend.map(m => ({
        month: m.month.slice(5, 7) + "/" + m.month.slice(2, 4),
        ontime: m.onTimeRate,
        late: 100 - m.onTimeRate,
      }))
    : [{ month: "N/A", ontime: 0, late: 0 }];

  // Category breakdown sorted by count descending for bar chart
  const categorySorted = [...catBrk].sort((a, b) => b.count - a.count);
  const categoryBarData = categorySorted.length > 0
    ? categorySorted.map(c => ({
        name: c.name.replace('MAKLON ', ''),
        count: c.count,
        color: MAKLON_COLORS[c.name] || "#94A3B8",
        pct: totalCount > 0 ? Math.round((c.count / totalCount) * 100) : 0,
      }))
    : [{ name: "No Data", count: 0, color: "#E2E8F0", pct: 0 }];

  const picPerformance = perPic.length > 0
    ? perPic.map(p => ({ name: p.pic, success: p.done, failed: p.failed }))
    : [{ name: "No Data", success: 0, failed: 0 }];

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-6">
        <StatCardCompact label="Total Tasks" value={String(totalCount)} subValue="All time" />
        <StatCardCompact label="Completed" value={String(completedCount)} subValue={totalCount > 0 ? Math.round((completedCount / totalCount) * 100) + "%" : "0%"} />
        <StatCardCompact label="Active" value={String(activeCount)} subValue="Still running" />
        <StatCardCompact label="Failed Trials" value={String(summary.failedTasks)} subValue="Need review" />
        <StatCardCompact label="Avg Progress" value={summary.avgProgress + "%"} subValue="Across all tasks" />
      </div>

      {/* Monthly Trend + Category Breakdown */}
      <div className="grid grid-cols-2 gap-2 md:gap-6 mb-3 md:mb-6">
        <DashboardCard label="Monthly Completion Rate" className="!p-3 md:!p-8">
          <div className="h-[130px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ontimeChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={tickStyle} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v: any) => `${v}%`} tick={tickStyle} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, ""]} />
                <Bar dataKey="ontime" fill="#10B981" radius={[6, 6, 0, 0]} name="On-Time %" />
                <Bar dataKey="late" fill="#EF4444" radius={[6, 6, 0, 0]} name="Late %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
        <DashboardCard label="Category Breakdown — Sample Count by Maklon Category" className="!p-3 md:!p-8">
          <div className="h-[130px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={tickStyle} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false}
                  tick={{ fill: "#1E293B", fontSize: 10, fontWeight: 700 }} width={80} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(value: any, name: any, props: any) => [`${value} samples (${props.payload.pct}%)`, props.payload.name]} />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Number cards di bawah chart — jelas per kategori */}
          <div className="mt-2 md:mt-4 grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
            {categoryBarData.map(c => (
              <div key={c.name} className="rounded-lg border border-slate-100 bg-white p-1.5 md:p-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-[7px] md:text-[9px] font-black uppercase text-slate-500 truncate">{c.name}</span>
                </div>
                <p className="text-[11px] md:text-[18px] font-black text-slate-900 mt-0.5 tabular-nums">{c.count}</p>
                <p className="text-[7px] md:text-[9px] font-bold text-slate-400">{c.pct}% of total</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Per-PIC Performance */}
      <div className="grid grid-cols-2 gap-2 md:gap-6 mb-3 md:mb-6">
        <DashboardCard label="Task Completion by PIC" className="!p-3 md:!p-8">
          <div className="h-[130px] md:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={picPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={tickStyle} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#1E293B", fontSize: 11, fontWeight: 700 }} width={60} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="success" fill="#10B981" radius={[0, 4, 4, 0]} name="Done" stackId="a" />
                <Bar dataKey="failed" fill="#EF4444" radius={[0, 4, 4, 0]} name="Failed" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
        <DashboardCard label="Per-PIC Stats" className="!p-3 md:!p-8">
          <div className="space-y-2 md:space-y-3">
            {perPic.length === 0 && (
              <p className="text-[11px] font-semibold text-slate-400 text-center py-8">No PIC data available</p>
            )}
            {perPic.map(p => (
              <div key={p.pic} className="rounded-xl bg-slate-50 border border-slate-100 p-2 md:p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] md:text-[12px] font-black text-slate-900">{p.pic}</span>
                  <span className="text-[9px] md:text-[11px] font-bold text-slate-500">{p.completionRate}% done</span>
                </div>
                <div className="flex gap-3 text-[8px] md:text-[10px] font-bold text-slate-400">
                  <span>{p.totalTasks} tasks</span>
                  <span className="text-emerald-600">{p.done} done</span>
                  {p.failed > 0 && <span className="text-rose-500">{p.failed} failed</span>}
                  <span>Progress: {p.avgProgress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-1.5 rounded-full bg-blue-500" style={{ width: p.avgProgress + "%" }} />
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Monthly Trend Details */}
      {monthlyTrend.length > 0 && (
        <div className="grid grid-cols-1 gap-2 md:gap-6 mb-3 md:mb-6">
          <DashboardCard label="Monthly Trend Details" className="!p-3 md:!p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {monthlyTrend.slice(-6).map(m => (
                <div key={m.month} className="rounded-xl border border-slate-100 bg-white p-2 md:p-4">
                  <p className="text-[7px] md:text-[9px] font-black uppercase text-slate-400">{m.month.slice(0, 7)}</p>
                  <p className="text-[11px] md:text-[20px] font-black text-slate-900 mt-0.5">{m.total}</p>
                  <p className="text-[8px] md:text-[10px] font-bold text-slate-500">{m.done} done | {m.failedCount} failed</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: WEEKLY PERFORMANCE — API Fetching with PIC filter
// ═══════════════════════════════════════════════════════════════
function WeeklyPerformanceTab({ picFilter }: { picFilter?: string | null }) {
  const [data, setData] = useState<RndWeeklyPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = picFilter ? `?pic=${encodeURIComponent(picFilter)}` : "";
      const res = await api.get(`/rnd/weekly-performance${params}`);
      setData(res.data || []);
    } catch {
      // Fallback to mock if API unavailable
      let fallback = [...FALLBACK_WEEKLY];
      if (picFilter) {
        fallback = fallback.filter(wp => wp.pic.toLowerCase() === picFilter.toLowerCase());
      }
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [picFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group by weekLabel (MUST be before early return — Rules of Hooks)
  const weekGroups = useMemo(() => {
    const map = new Map<string, RndWeeklyPerformance[]>();
    data.forEach(wp => {
      const arr = map.get(wp.weekLabel) || [];
      arr.push(wp);
      map.set(wp.weekLabel, arr);
    });
    return Array.from(map.entries()).sort((a, b) => {
      const aStart = a[1][0]?.weekStart || "";
      const bStart = b[1][0]?.weekStart || "";
      return bStart.localeCompare(aStart);
    });
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const gradeColors: Record<string, string> = {
    A: "bg-emerald-500 text-white", "A-": "bg-emerald-400 text-white",
    "B+": "bg-blue-500 text-white", B: "bg-blue-400 text-white",
    "B-": "bg-amber-500 text-white", "C+": "bg-amber-400 text-white",
    C: "bg-rose-400 text-white", D: "bg-red-500 text-white",
  };

  return (
    <div className="space-y-6">
      {weekGroups.map(([weekLabel, entries]) => (
        <div key={weekLabel}>
          <h3 className="text-[13px] font-black uppercase tracking-wider text-slate-400 mb-3">{weekLabel}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {entries.map(wp => {
              const score = wp.weeklyScore || wp.ontimePct || 0;
              const grade = deriveGrade(score);
              const gradeClass = gradeColors[grade] || "bg-slate-200 text-slate-600";
              const picColor = PIC_COLORS[wp.pic] || "bg-slate-400";

              // Weighted weekly score (menggunakan shared function)
              const weightedScore = calcWeightedScore({
                ontimePct: wp.ontimePct,
                trialSuccessRate: wp.trialSuccessRate,
                initiativeScore: wp.initiativeScore,
                revisionCount: wp.revisionCount,
                doneCount: wp.doneCount,
                totalTask: wp.totalTask,
              });

              return (
                <div key={wp.id} className="rounded-2xl border border-slate-100 bg-white overflow-hidden transition hover:shadow-sm">
                  {/* Header: PIC + Grade + Score */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-3 w-3 rounded-full", picColor)} />
                      <span className="text-[14px] font-black text-slate-900">{wp.pic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center justify-center w-9 h-9 rounded-xl text-[16px] font-black shadow-sm",
                        gradeClass
                      )}>{grade}</span>
                      <div className="text-right">
                        <span className={cn(
                          "text-[16px] font-black tabular-nums",
                          score >= 90 ? "text-emerald-600" : score >= 75 ? "text-blue-600" : score >= 60 ? "text-amber-600" : "text-rose-600"
                        )}>{score}</span>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">score</p>
                      </div>
                    </div>
                  </div>

                  {/* 4 metric cards */}
                  <div className="px-4 grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <p className="text-[8px] font-bold uppercase text-slate-400">Tasks</p>
                      <p className="text-[16px] font-black text-slate-900">{wp.totalTask}</p>
                      <p className="text-[9px] text-emerald-600 font-bold">{wp.doneCount} done</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <p className="text-[8px] font-bold uppercase text-slate-400">On-Time</p>
                      <p className={cn("text-[16px] font-black tabular-nums", wp.ontimePct >= 85 ? "text-emerald-600" : wp.ontimePct >= 70 ? "text-blue-600" : "text-rose-600")}>{wp.ontimePct}%</p>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{ width: wp.ontimePct + "%", background: wp.ontimePct >= 85 ? "#059669" : wp.ontimePct >= 70 ? "#2563EB" : "#DC2626" }} />
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <p className="text-[8px] font-bold uppercase text-slate-400">Trial Success</p>
                      <p className={cn("text-[16px] font-black tabular-nums", wp.trialSuccessRate >= 85 ? "text-emerald-600" : wp.trialSuccessRate >= 70 ? "text-blue-600" : "text-amber-600")}>{wp.trialSuccessRate}%</p>
                      <p className="text-[9px] text-slate-400 font-bold">{wp.failedTrial} failed</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <p className="text-[8px] font-bold uppercase text-slate-400">Initiatives</p>
                      <p className="text-[16px] font-black text-slate-900">{wp.initiativeScore}</p>
                      <p className="text-[9px] text-amber-600 font-bold">{wp.revisionCount}x revisi</p>
                    </div>
                  </div>

                  {/* Weighted score + Notes */}
                  <div className="mx-4 mb-3 rounded-xl bg-blue-50 border border-blue-100 p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] font-black uppercase text-blue-600 tracking-wider">Weighted Score</p>
                      <span className="text-[13px] font-black text-blue-700">{weightedScore}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[8px] font-bold text-blue-500">
                      <span>OT×30%</span><span>|</span><span>TS×25%</span><span>|</span><span>Init×25%</span><span>|</span><span>Rev×10%</span><span>|</span><span>Done×10%</span>
                    </div>
                    {wp.notes && (
                      <p className="mt-1.5 text-[10px] font-medium text-slate-600 italic border-t border-blue-200/50 pt-1.5">
                        “{wp.notes}”
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-[12px] font-bold">
          No weekly performance data yet.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: MONTHLY KPI — API Fetching with PIC filter
// ═══════════════════════════════════════════════════════════════
function MonthlyKpiTab({ picFilter }: { picFilter?: string | null }) {
  const [data, setData] = useState<RndMonthlyKpi[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = picFilter ? `?pic=${encodeURIComponent(picFilter)}` : "";
      const res = await api.get(`/rnd/monthly-kpi${params}`);
      setData(res.data || []);
    } catch {
      // Fallback to mock
      let fallback = [...FALLBACK_MONTHLY_KPI];
      if (picFilter) {
        fallback = fallback.filter(kpi => kpi.pic.toLowerCase() === picFilter.toLowerCase());
      }
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [picFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group by month (MUST be before early return — Rules of Hooks)
  const monthGroups = useMemo(() => {
    const map = new Map<string, RndMonthlyKpi[]>();
    data.forEach(kpi => {
      const arr = map.get(kpi.month) || [];
      arr.push(kpi);
      map.set(kpi.month, arr);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (monthGroups.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-[12px] font-bold">No monthly KPI data yet.</div>;
  }

  return (
    <div className="space-y-6">
      {monthGroups.map(([month, entries]) => (
        <div key={month}>
          <h3 className="text-[13px] font-black uppercase tracking-wider text-slate-400 mb-3">{month}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {entries.map(kpi => {
              const picColor = PIC_COLORS[kpi.pic] || "bg-slate-400";
              const gradeColors: Record<string, string> = {
                A: "bg-emerald-500 text-white", "A-": "bg-emerald-400 text-white",
                "B+": "bg-blue-500 text-white", B: "bg-blue-400 text-white",
                "B-": "bg-amber-500 text-white", "C+": "bg-amber-400 text-white",
                C: "bg-rose-400 text-white", D: "bg-red-500 text-white",
              };
              const gradeClass = gradeColors[kpi.grade] || "bg-slate-200 text-slate-600";
              // Weighted score (menggunakan shared function)
              const weightedScore = calcWeightedScore({
                ontimePct: kpi.ontimePct,
                trialSuccessRate: kpi.trialSuccessRate,
                initiativeScore: kpi.initiativeScore,
                revisionRate: kpi.revisionRate,
                knowledgeContribution: kpi.knowledgeContribution,
              });
              return (
                <div key={kpi.id} className="rounded-2xl border border-slate-100 bg-white overflow-hidden transition hover:shadow-sm">
                  {/* Header: PIC + Grade + Composite Score */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-3 w-3 rounded-full", picColor)} />
                      <span className="text-[14px] font-black text-slate-900">{kpi.pic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center justify-center w-9 h-9 rounded-xl text-[16px] font-black shadow-sm",
                        gradeClass
                      )}>{kpi.grade}</span>
                      <div className="text-right">
                        <span className="text-[16px] font-black tabular-nums text-slate-900">{kpi.compositeScore}</span>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">composite</p>
                      </div>
                    </div>
                  </div>

                  {/* 4 metric cards */}
                  <div className="px-4 grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <p className="text-[8px] font-bold uppercase text-slate-400">On-Time</p>
                      <p className={cn("text-[16px] font-black tabular-nums", kpi.ontimePct >= 85 ? "text-emerald-600" : kpi.ontimePct >= 70 ? "text-blue-600" : "text-rose-600")}>{kpi.ontimePct}%</p>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{ width: kpi.ontimePct + "%", background: kpi.ontimePct >= 85 ? "#059669" : kpi.ontimePct >= 70 ? "#2563EB" : "#DC2626" }} />
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <p className="text-[8px] font-bold uppercase text-slate-400">Trial Success</p>
                      <p className={cn("text-[16px] font-black tabular-nums", kpi.trialSuccessRate >= 85 ? "text-emerald-600" : kpi.trialSuccessRate >= 70 ? "text-blue-600" : "text-amber-600")}>{kpi.trialSuccessRate}%</p>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{ width: kpi.trialSuccessRate + "%", background: kpi.trialSuccessRate >= 85 ? "#059669" : kpi.trialSuccessRate >= 70 ? "#2563EB" : "#D97706" }} />
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <p className="text-[8px] font-bold uppercase text-slate-400">Revision Rate</p>
                      <p className="text-[16px] font-black" style={{ color: (kpi.revisionRate || 0) <= 30 ? "#059669" : "#D97706" }}>{kpi.revisionRate || 0}%</p>
                      <p className="text-[9px] text-slate-400 font-bold">target ≤30%</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <p className="text-[8px] font-bold uppercase text-slate-400">Initiative</p>
                      <p className="text-[16px] font-black text-slate-900">{kpi.initiativeScore}</p>
                      <p className={cn("text-[9px] font-bold", (kpi.knowledgeContribution || 0) >= 1 ? "text-emerald-600" : "text-slate-400")}>
                        {kpi.knowledgeContribution || 0} knowledge
                      </p>
                    </div>
                  </div>

                  {/* Weighted score breakdown */}
                  <div className="mx-4 mb-3 rounded-xl bg-blue-50 border border-blue-100 p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] font-black uppercase text-blue-600 tracking-wider">Weighted Score</p>
                      <span className="text-[13px] font-black text-blue-700">{weightedScore}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[8px] font-bold text-blue-500">
                      <span>OT×30%</span>
                      <span>|</span>
                      <span>TS×25%</span>
                      <span>|</span>
                      <span>Init×25%</span>
                      <span>|</span>
                      <span>Rev×10%</span>
                      <span>|</span>
                      <span>Know×10%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN — TAB CONTAINER (with PIC filter)
// ═══════════════════════════════════════════════════════════════
export default function AnalyticsTrendClient() {
  const [tab, setTab] = useState<TabId>("trend");
  const [picFilter, setPicFilter] = useState<string | null>(null);

  // Determine current user
  const [currentUser, setCurrentUser] = useState<{ fullName?: string; email?: string; roles?: string[]; id?: string }>({});
  useEffect(() => {
    try {
      setCurrentUser(JSON.parse(localStorage.getItem("user") || "{}"));
    } catch {}
  }, []);

  const isHead = currentUser.id
    ? (currentUser.roles?.includes?.("SUPER_ADMIN") ||
       isRndHeadAccount(currentUser.email))
    : false;

  const allPics = ["Panca", "Yaya", "Amira"];

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "trend", label: "Trend", icon: <BarChart3 size={14} /> },
    { id: "weekly", label: "Weekly Performance", icon: <Calendar size={14} /> },
    { id: "kpi", label: "Monthly KPI", icon: <Award size={14} /> },
  ];

  return (
    <DashboardShell
      title="R&D"
      titleAccent="Analytics"
      subtitle="Visualisasi performa, weekly monitoring, dan KPI bulanan — semua dalam satu halaman"
    >
      {/* ── Tab Navigation ── */}
      <div className="mb-3 flex gap-1 border-b border-slate-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition border-b-2 -mb-px",
              tab === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PIC Filter Chips (hanya untuk weekly & kpi tabs) ── */}
      {(tab === "weekly" || tab === "kpi") && isHead && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-black uppercase text-slate-400 mr-1">PIC:</span>
          <button onClick={() => setPicFilter(null)}
            className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase transition", !picFilter ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
            All
          </button>
          {allPics.map(pic => (
            <button key={pic} onClick={() => setPicFilter(picFilter === pic ? null : pic)}
              className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase transition", picFilter === pic ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
              {pic}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab Content ── */}
      {tab === "trend" && <TrendTab />}
      {tab === "weekly" && <WeeklyPerformanceTab picFilter={picFilter} />}
      {tab === "kpi" && <MonthlyKpiTab picFilter={picFilter} />}
    </DashboardShell>
  );
}
