"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Beaker,
  FlaskConical,
  CheckCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users2,
  BarChart3,
  RefreshCcw,
  ArrowRight,
  Search,
  Package,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  StatCard,
  DnaButton,
  PageSection,
  DashboardCard,
} from "@/components/dna";
import { cn } from "@/lib/utils";

// ── Types ──
type DashboardData = {
  summary: {
    totalSamples: number;
    activeSamples: number;
    completedThisMonth: number;
    overdueCount: number;
    onTimeRate: number;
    firstTimeApprovalRate: number;
    avgCycleDays: number;
    avgRevisions: number;
    overallUtilization: number;
  };
  perPic: Array<{
    picId: string;
    picName: string;
    totalSamples: number;
    completed: number;
    onTime: number;
    late: number;
    active: number;
    onTimeRate: number;
    firstTimeApprovalRate: number;
    avgCycleDays: number;
    utilizationRate: number;
    activeProjects: number;
  }>;
  categoryBreakdown: Array<{ name: string; count: number }>;
  monthlyTrend: Array<{
    month: string;
    totalSamples: number;
    completed: number;
    onTimeRate: number;
  }>;
  recentSamples: Array<{
    id: string;
    sampleCode: string;
    productName: string;
    stage: string;
    category: string | null;
    picName: string;
    bdHandler: string | null;
    brandName: string;
    progressPercent: number;
    kendala: string | null;
    nextAction: string | null;
    targetDeadline: string | null;
    completedAt: string | null;
    requestedAt: string;
    onTime: boolean | null;
    revisionCount: number;
  }>;
};

type StaffKpiData = Array<{
  picId: string;
  picName: string;
  totalSamples: number;
  completed: number;
  onTime: number;
  late: number;
  onTimeRate: number;
  firstTimeApprovalRate: number;
  avgCycleDays: number;
  utilizationRate: number;
  activeProjects: number;
  kpiScore: number;
  monthlyTrend: Array<{
    month: string;
    completed: number;
    onTime: number;
    late: number;
  }>;
}>;

type CategoryTrendData = {
  categories: Array<{ name: string; count: number; percentage: number }>;
  topIngredients: Array<{ name: string; usedInSamples: number }>;
  monthlyTrend: Array<{
    month: string;
    categories: Array<{ name: string; count: number }>;
  }>;
  totalSamples: number;
  insight: string;
  generatedAt: string;
};

// ── Sub-components ──

function KpiStatCards({ data }: { data: DashboardData }) {
  const s = data.summary;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
      <StatCard
        label="Total Samples"
        value={s.totalSamples}
        subValue="All time"
        icon={<Beaker className="h-5 w-5" />}
      />
      <StatCard
        label="Active Pipeline"
        value={s.activeSamples}
        subValue="In development"
        icon={<FlaskConical className="h-5 w-5" />}
      />
      <StatCard
        label="Completed (Month)"
        value={s.completedThisMonth}
        subValue="Approved samples"
        icon={<CheckCheck className="h-5 w-5 text-emerald-500" />}
      />
      <StatCard
        label="On-Time Rate"
        value={`${s.onTimeRate}%`}
        subValue={`Avg ${s.avgCycleDays}d cycle`}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatCard
        label="Overdue"
        value={s.overdueCount}
        subValue="Need attention"
        icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
        className={s.overdueCount > 0 ? "border-[rgba(185,28,28,0.18)]" : ""}
      />
      <StatCard
        label="First-Time Approval"
        value={`${s.firstTimeApprovalRate}%`}
        subValue="Accuracy rate"
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <StatCard
        label="Avg Revisions"
        value={s.avgRevisions}
        subValue="Per sample"
        icon={<RefreshCcw className="h-5 w-5" />}
      />
      <StatCard
        label="Team Utilization"
        value={`${s.overallUtilization}%`}
        subValue="Capacity used"
        icon={<BarChart3 className="h-5 w-5" />}
      />
    </div>
  );
}

function PicOverviewCard({
  member,
  onClick,
}: {
  member: DashboardData["perPic"][0];
  onClick: () => void;
}) {
  const progress =
    member.totalSamples > 0
      ? Math.round((member.completed / member.totalSamples) * 100)
      : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[24px] border bg-white p-5 text-left transition hover:-translate-y-0.5",
        member.late > 0
          ? "border-[rgba(185,28,28,0.18)] shadow-[0_0_0_1px_rgba(185,28,28,0.05),0_14px_30px_-20px_rgba(185,28,28,0.18)]"
          : "border-slate-100 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)]"
      )}
    >
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.08em]",
          member.late > 0 ? "text-[#DC2626]" : "text-slate-400"
        )}
      >
        {member.picName}
      </p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-normal text-slate-900">
        R&D Staff
      </p>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.05em] text-slate-400">
          <span>Progress</span>
          <span
            className={cn(
              "tabular-nums",
              member.late > 0 ? "text-[#DC2626]" : "text-slate-700"
            )}
          >
            {progress}%
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              member.late > 0 ? "bg-[#DC2626]" : "bg-[#2563EB]"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 4 metric boxes */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.05em] text-slate-400">
            Samples
          </p>
          <p className="mt-1 text-[16px] font-bold tabular-nums text-slate-900">
            {member.totalSamples}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.05em] text-slate-400">
            Done
          </p>
          <p className="mt-1 text-[16px] font-bold tabular-nums text-slate-900">
            {member.completed}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.05em] text-slate-400">
            Late
          </p>
          <p
            className={cn(
              "mt-1 text-[16px] font-bold tabular-nums",
              member.late > 0 ? "text-[#DC2626]" : "text-slate-900"
            )}
          >
            {member.late}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.05em] text-slate-400">
            Active
          </p>
          <p className="mt-1 text-[16px] font-bold tabular-nums text-slate-900">
            {member.active}
          </p>
        </div>
      </div>

      {/* On-Time & First-Time indicators */}
      <div className="mt-4 flex gap-2">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-bold text-emerald-700">
          {member.onTimeRate}% OT
        </span>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[8px] font-bold text-blue-700">
          {member.firstTimeApprovalRate}% FTA
        </span>
      </div>
    </button>
  );
}

function SampleCard({
  sample,
  onUpdate,
}: {
  sample: DashboardData["recentSamples"][0];
  onUpdate?: (id: string, data: any) => void;
}) {
  const stageColors: Record<string, string> = {
    QUEUE: "bg-slate-100 text-slate-600",
    FORMULATING: "bg-blue-50 text-blue-600",
    LAB_TEST: "bg-purple-50 text-purple-600",
    READY_TO_SHIP: "bg-amber-50 text-amber-600",
    SHIPPED: "bg-indigo-50 text-indigo-600",
    RECEIVED: "bg-teal-50 text-teal-600",
    CLIENT_REVIEW: "bg-orange-50 text-orange-600",
    APPROVED: "bg-emerald-50 text-emerald-600",
    REJECTED: "bg-rose-50 text-rose-600",
    CANCELLED: "bg-slate-100 text-slate-400",
  };

  const agingDays = Math.round(
    (new Date().getTime() - new Date(sample.requestedAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={cn(
        "rounded-[24px] border bg-white p-5 transition-all hover:shadow-md",
        sample.stage === "REJECTED"
          ? "border-rose-200"
          : sample.onTime === false
          ? "border-amber-200"
          : "border-slate-100 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.35)]"
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-normal text-slate-900">
          {sample.productName}
        </span>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.03em]",
            stageColors[sample.stage] || "bg-slate-100 text-slate-600"
          )}
        >
          {sample.stage?.replace(/_/g, " ")}
        </span>
        {sample.onTime === false && (
          <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.03em] text-rose-600">
            DELAY
          </span>
        )}
      </div>

      {/* Info line */}
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.05em] text-slate-400">
        {sample.sampleCode} • {sample.brandName}
      </p>

      {/* Kendala / Blocker */}
      {sample.kendala && (
        <p className="mt-2 max-w-3xl text-[11px] font-medium leading-relaxed text-rose-600">
          ⚠ {sample.kendala}
        </p>
      )}

      {/* Next Action */}
      {sample.nextAction && (
        <p className="mt-1 text-[10px] font-medium text-blue-600">
          → {sample.nextAction}
        </p>
      )}

      {/* 4-column metric grid */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.05em] text-slate-400">
            PIC
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-normal tabular-nums text-slate-700">
            {sample.picName}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.05em] text-slate-400">
            BD
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-normal tabular-nums text-slate-700">
            {sample.bdHandler || "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.05em] text-slate-400">
            Deadline
          </p>
          <p
            className={cn(
              "mt-1 text-[10px] font-medium uppercase tracking-normal tabular-nums",
              sample.targetDeadline &&
                new Date(sample.targetDeadline) < new Date() &&
                sample.stage !== "APPROVED"
                ? "text-rose-600"
                : "text-slate-700"
            )}
          >
            {sample.targetDeadline
              ? new Date(sample.targetDeadline).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })
              : "—"}
            {sample.targetDeadline &&
              new Date(sample.targetDeadline) < new Date() &&
              sample.stage !== "APPROVED" && (
                <span className="ml-1 text-[8px] font-bold text-rose-600 animate-pulse">
                  • LATE
                </span>
              )}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[8px] font-semibold uppercase tracking-[0.05em] text-slate-400">
              Progress
            </p>
            <span className="text-[10px] font-bold tabular-nums text-slate-700">
              {sample.progressPercent || 0}%
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all",
                (sample.progressPercent || 0) >= 80
                  ? "bg-emerald-500"
                  : (sample.progressPercent || 0) >= 40
                  ? "bg-blue-500"
                  : "bg-amber-500"
              )}
              style={{ width: `${sample.progressPercent || 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryTrendPanel({ data }: { data: CategoryTrendData }) {
  return (
    <DashboardCard label="SCM Category Trends">
      <div className="space-y-4">
        <div className="rounded-[20px] border border-blue-100 bg-blue-50 p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">
            AI Insight
          </p>
          <p className="mt-2 text-[12px] font-semibold leading-relaxed text-slate-700">
            {data.insight}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categories */}
          <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 mb-3">
              Sample Categories
            </p>
            {data.categories.slice(0, 10).map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <span className="text-[11px] font-bold text-slate-700">
                  {cat.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {cat.percentage}%
                  </span>
                  <div className="w-16 h-1.5 rounded-full bg-slate-200">
                    <div
                      className="h-1.5 rounded-full bg-blue-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Top Ingredients */}
          <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 mb-3">
              Top Ingredients Used
            </p>
            {data.topIngredients.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">
                No formula data available yet. Ingredients appear when formulas
                are created with linked materials.
              </p>
            ) : (
              data.topIngredients.slice(0, 10).map((ing, i) => (
                <div
                  key={ing.name}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      #{i + 1}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">
                      {ing.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600">
                    {ing.usedInSamples} samples
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

function MonthlyTrendChart({
  data,
}: {
  data: DashboardData["monthlyTrend"];
}) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((m) => m.totalSamples), 1);
  const width = 300;
  const height = 120;
  const points = data
    .map((m, i) => {
      const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
      const y = height - (m.totalSamples / maxVal) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[20px] border border-white bg-white p-4">
      <svg viewBox={`0 0 ${width} ${height + 30}`} className="w-full h-[150px]">
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = height - ratio * height;
          return (
            <g key={ratio}>
              <line
                x1="0"
                x2={width}
                y1={y}
                y2={y}
                stroke="rgba(148,163,184,0.2)"
                strokeDasharray="4 4"
              />
            </g>
          );
        })}
        {/* Area */}
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="rgba(37,99,235,0.08)"
        />
        {/* Line */}
        <polyline
          fill="none"
          stroke="#2563EB"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Month labels */}
        {data.map((m, i) => {
          const x =
            data.length === 1
              ? width / 2
              : (i / (data.length - 1)) * width;
          return (
            <text
              key={m.month}
              x={x}
              y={height + 18}
              textAnchor="middle"
              className="fill-slate-400"
              style={{ fontSize: "9px", fontWeight: 600 }}
            >
              {new Date(m.month + "-01").toLocaleDateString("id-ID", {
                month: "short",
              })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main Component ──

export default function RndDashboardClient() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"overview" | "scm">(
    "overview"
  );
  const [selectedPicId, setSelectedPicId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["rnd-dashboard-v2"],
    queryFn: async () => (await api.get("/rnd/dashboard-v2")).data,
    staleTime: 15000,
  });

  const { data: categoryTrends } = useQuery<CategoryTrendData>({
    queryKey: ["rnd-category-trends"],
    queryFn: async () => (await api.get("/rnd/analytics/category-trends")).data,
    staleTime: 30000,
  });

  const filteredSamples = useMemo(() => {
    if (!dashboard?.recentSamples) return [];
    let samples = dashboard.recentSamples;

    if (selectedPicId) {
      samples = samples.filter((s) => {
        const pic = dashboard.perPic.find((p) => p.picId === selectedPicId);
        return pic && s.picName === pic.picName;
      });
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      samples = samples.filter(
        (s) =>
          s.productName?.toLowerCase().includes(q) ||
          s.sampleCode?.toLowerCase().includes(q) ||
          s.brandName?.toLowerCase().includes(q) ||
          s.picName?.toLowerCase().includes(q)
      );
    }

    return samples;
  }, [dashboard, selectedPicId, searchTerm]);

  const heroActions = (
    <>
      <DnaButton
        variant="outline"
        icon={<RefreshCcw />}
        onClick={() => window.location.reload()}
      >
        Refresh
      </DnaButton>
    </>
  );

  if (isLoading) {
    return (
      <DashboardShell
        title="R&D"
        titleAccent="Performance Hub"
        subtitle="Loading dashboard data..."
        actions={heroActions}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </DashboardShell>
    );
  }

  if (!dashboard) {
    return (
      <DashboardShell
        title="R&D"
        titleAccent="Performance Hub"
        subtitle="Failed to load data"
        actions={heroActions}
      >
        <div className="text-center py-20 text-slate-400">
          No data available. Check backend connection.
        </div>
      </DashboardShell>
    );
  }

  const selectedPic = selectedPicId
    ? dashboard.perPic.find((p) => p.picId === selectedPicId)
    : null;

  return (
    <DashboardShell
      title="R&D"
      titleAccent="Performance Hub"
      subtitle="Pusat kendali tim Research & Development — tracking sample, KPI, dan trend analitik untuk SCM"
      actions={heroActions}
    >
      {/* KPI Stat Cards */}
      <KpiStatCards data={dashboard} />

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200 mb-6">
        {[
          { key: "overview", label: "Team View", icon: Users2 },
          { key: "scm", label: "SCM Trends", icon: Package },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = selectedTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content: OVERVIEW */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          {/* PIC Overview Cards */}
          <PageSection title="Team Performance">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {dashboard.perPic
                .filter((p) => p.totalSamples > 0 || p.picName) // show even if 0
                .map((pic) => (
                  <PicOverviewCard
                    key={pic.picId}
                    member={pic}
                    onClick={() =>
                      setSelectedPicId(
                        selectedPicId === pic.picId ? null : pic.picId
                      )
                    }
                  />
                ))}
            </div>
          </PageSection>

          {/* Monthly Trend */}
          {dashboard.monthlyTrend.length > 0 && (
            <DashboardCard label="Monthly Trend">
              <MonthlyTrendChart data={dashboard.monthlyTrend} />
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {dashboard.monthlyTrend.slice(-4).map((m) => (
                  <div
                    key={m.month}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3"
                  >
                    <p className="text-[8px] font-semibold uppercase text-slate-400">
                      {new Date(m.month + "-01").toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-[14px] font-bold text-slate-900">
                      {m.totalSamples}{" "}
                      <span className="text-[9px] font-normal text-slate-400">
                        samples
                      </span>
                    </p>
                    <p className="text-[9px] font-medium text-emerald-600">
                      {m.completed} completed
                    </p>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* Selected PIC Detail */}
          {selectedPic && (
            <DashboardCard label={`${selectedPic.picName} — Detail`}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <p className="text-[8px] font-semibold uppercase text-slate-400">
                    Total
                  </p>
                  <p className="text-[18px] font-bold text-slate-900">
                    {selectedPic.totalSamples}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <p className="text-[8px] font-semibold uppercase text-slate-400">
                    Completed
                  </p>
                  <p className="text-[18px] font-bold text-emerald-600">
                    {selectedPic.completed}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <p className="text-[8px] font-semibold uppercase text-slate-400">
                    On-Time %
                  </p>
                  <p className="text-[18px] font-bold text-blue-600">
                    {selectedPic.onTimeRate}%
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <p className="text-[8px] font-semibold uppercase text-slate-400">
                    Late
                  </p>
                  <p
                    className={cn(
                      "text-[18px] font-bold",
                      selectedPic.late > 0 ? "text-rose-600" : "text-slate-900"
                    )}
                  >
                    {selectedPic.late}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <p className="text-[8px] font-semibold uppercase text-slate-400">
                    FTA %
                  </p>
                  <p className="text-[18px] font-bold text-purple-600">
                    {selectedPic.firstTimeApprovalRate}%
                  </p>
                </div>
              </div>
            </DashboardCard>
          )}

          {/* Sample Cards (filtered) */}
          <DashboardCard
            label={
              selectedPic
                ? `${selectedPic.picName}'s Samples`
                : "Recent Samples"
            }
          >
            {/* Search + Filter info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPicId(null)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[9px] font-bold uppercase transition",
                    !selectedPicId
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  All
                </button>
                {dashboard.perPic
                  .filter((p) => p.totalSamples > 0)
                  .map((pic) => (
                    <button
                      key={pic.picId}
                      type="button"
                      onClick={() => setSelectedPicId(pic.picId)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[9px] font-bold uppercase transition",
                        selectedPicId === pic.picId
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      {pic.picName} ({pic.totalSamples})
                    </button>
                  ))}
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                {filteredSamples.length} sample
                {filteredSamples.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Sample card list — NO TABLE */}
            {filteredSamples.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-slate-400">
                  No samples found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSamples.map((sample) => (
                  <SampleCard key={sample.id} sample={sample} />
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Category quick view */}
          {dashboard.categoryBreakdown.length > 0 && (
            <DashboardCard label="Kategori Sample (Quick View)">
              <div className="flex flex-wrap gap-3">
                {dashboard.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.name}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-[11px] font-bold text-slate-700">
                      {cat.name.replace(/_/g, " ")}
                    </span>
                    <span className="ml-2 text-[9px] font-semibold text-blue-600">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}
        </div>
      )}

      {/* Tab Content: SCM TRENDS */}
      {selectedTab === "scm" && categoryTrends && (
        <div className="space-y-6">
          <CategoryTrendPanel data={categoryTrends} />

          {/* Monthly category breakdown */}
          {categoryTrends.monthlyTrend.length > 0 && (
            <DashboardCard label="Monthly Category Distribution">
              <div className="space-y-4">
                {categoryTrends.monthlyTrend.slice(-6).map((month) => (
                  <div
                    key={month.month}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">
                      {new Date(month.month + "-01").toLocaleDateString(
                        "id-ID",
                        { month: "long", year: "numeric" }
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {month.categories.map((cat) => (
                        <span
                          key={cat.name}
                          className="rounded-full bg-white border border-slate-200 px-3 py-1 text-[9px] font-bold text-slate-700"
                        >
                          {cat.name}: {cat.count}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}
        </div>
      )}

      {selectedTab === "scm" && !categoryTrends && (
        <div className="text-center py-10 text-slate-400">
          Loading category trends...
        </div>
      )}
    </DashboardShell>
  );
}
