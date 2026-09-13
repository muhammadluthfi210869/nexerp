"use client";

// DivisionKpiClient — WS-B KPI (Wave 3 D2).
// Per-divisi KPI: MEAN of per-person completion rates + top performers table.

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  DnaStatCard,
  DnaCard,
  DnaSearchableSelect,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaTdNumber,
  DnaEmptyState,
} from "@/components/dna";
import { TrendingUp, Award, Users, Activity } from "lucide-react";
import type { DnaSelectOption } from "@/components/dna";

type PeriodKey = "last7days" | "thisMonth";

interface TopPerformer {
  userId: string;
  fullName: string | null;
  score: number;
  total: number;
  completionRate: number;
}

interface DivisionMetricTile {
  metricKey: string;
  label: string;
  value: number;
  source: string;
}

interface DivisionKpi {
  division: string;
  period: { from: string | null; to: string | null };
  aggregateFunction: string;
  metricCount: number;
  aggregateScore: number;
  metrics: DivisionMetricTile[];
  topPerformers: TopPerformer[];
  formulaNote: string;
}

const DIVISION_OPTIONS: DnaSelectOption[] = [
  { value: "BD", label: "Business Development (BD)" },
  { value: "RND", label: "Research & Development" },
  { value: "FINANCE", label: "Finance" },
  { value: "SCM", label: "Supply Chain" },
  { value: "LEGAL", label: "Legal" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "PRODUCTION", label: "Production" },
  { value: "QC", label: "Quality Control" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "SYSTEM", label: "System" },
  { value: "CREATIVE", label: "Creative" },
];

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function DivisionKpiClient() {
  const [division, setDivision] = useState<string>("BD");
  const [period, setPeriod] = useState<PeriodKey>("last7days");
  const [kpi, setKpi] = useState<DivisionKpi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const periodParams = useMemo(() => {
    const to = new Date();
    if (period === "thisMonth") {
      const from = new Date(to.getFullYear(), to.getMonth(), 1);
      return { from: from.toISOString(), to: to.toISOString() };
    }
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const qs = `from=${encodeURIComponent(periodParams.from)}&to=${encodeURIComponent(periodParams.to)}`;
    api.get<DivisionKpi>(`/kpi/division/${division}?${qs}`)
      .then((res) => { if (!cancelled) setKpi(res.data); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Gagal memuat KPI"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [division, periodParams]);

  if (error) {
    return (
      <div data-testid="division-kpi-error" className="p-6 text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div data-testid="division-kpi" className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
      {/* 1. Header */}
      <header>
        <h1 className="text-[28px] leading-[36px] font-bold tracking-tight">
          KPI Per Divisi
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Agregat nilai KPI seluruh personel dalam divisi. Formula: MEAN of per-person completion rate.
        </p>
      </header>

      {/* 2. Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <DnaSearchableSelect
          value={division}
          onChange={(v) => setDivision(String(v))}
          options={DIVISION_OPTIONS}
          placeholder="Pilih divisi…"
        />
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {(["last7days", "thisMonth"] as PeriodKey[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {p === "last7days" ? "7 Hari" : "Bulan Ini"}
            </button>
          ))}
        </div>
      </div>

      {loading && !kpi ? (
        <div className="text-slate-500 text-[13px]">Memuat KPI…</div>
      ) : kpi && kpi.metricCount === 0 ? (
        <DnaEmptyState
          title="Belum ada aktivitas"
          description={`Tidak ada personel aktif di divisi ${division} pada periode ini.`}
          icon={<Users className="h-10 w-10 text-slate-400" />}
        />
      ) : kpi ? (
        <>
          {/* 3. Aggregate score tiles */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <DnaStatCard
              variant="blue"
              label="Aggregate Score"
              value={fmtPct(kpi.aggregateScore)}
              subtext={`${kpi.aggregateFunction} across ${kpi.metricCount} metric tiles`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <DnaStatCard
              variant="emerald"
              label="Personil Aktif"
              value={kpi.metricCount}
              subtext={`Di divisi ${kpi.division}`}
              icon={<Users className="h-5 w-5" />}
            />
            <DnaStatCard
              variant="purple"
              label="Aggregate Function"
              value={kpi.aggregateFunction}
              subtext="Default: MEAN"
              icon={<Activity className="h-5 w-5" />}
            />
            <DnaStatCard
              variant="amber"
              label="Top Score"
              value={
                kpi.topPerformers[0]
                  ? fmtPct(kpi.topPerformers[0].score)
                  : "—"
              }
              subtext={
                kpi.topPerformers[0]?.fullName ?? "Belum ada data"
              }
              icon={<Award className="h-5 w-5" />}
            />
          </div>

          {/* 4. Per-metric tiles (per-person completion rates) */}
          <DnaCard title="Per-Metric Breakdown" className="p-6">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh>Metric Key</DnaTh>
                  <DnaTh>Source</DnaTh>
                  <DnaTh>Score</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {kpi.metrics.map((m) => (
                  <DnaTableRow key={m.metricKey}>
                    <DnaTd>
                      <span className="font-mono text-[12px]">{m.label}</span>
                    </DnaTd>
                    <DnaTd>
                      <span className="text-[12px] text-slate-500">{m.source}</span>
                    </DnaTd>
                    <DnaTdNumber
                      value={Math.round(m.value * 100)}
                      suffix="%"
                    />
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </DnaCard>

          {/* 5. Top performers */}
          <DnaCard title="Top Performers" className="p-6">
            {kpi.topPerformers.length === 0 ? (
              <div className="text-[13px] text-slate-500">
                Belum ada data.
              </div>
            ) : (
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow>
                    <DnaTh>#</DnaTh>
                    <DnaTh>Nama</DnaTh>
                    <DnaTh>Score</DnaTh>
                    <DnaTh>Total Activity</DnaTh>
                    <DnaTh>Completion</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {kpi.topPerformers.map((p, idx) => (
                    <DnaTableRow key={p.userId}>
                      <DnaTdNumber value={idx + 1} />
                      <DnaTd>
                        <span className="font-medium">{p.fullName ?? p.userId}</span>
                      </DnaTd>
                      <DnaTdNumber
                        value={Math.round(p.score * 100)}
                        suffix="%"
                      />
                      <DnaTdNumber value={p.total} />
                      <DnaTdNumber
                        value={Math.round(p.completionRate * 100)}
                        suffix="%"
                      />
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            )}
          </DnaCard>
        </>
      ) : null}
    </div>
  );
}