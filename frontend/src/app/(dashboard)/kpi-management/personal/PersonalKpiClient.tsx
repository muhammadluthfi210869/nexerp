"use client";

// PersonalKpiClient — WS-B KPI (Wave 3 D2).
// Per-orang KPI: aggregate ActivityLog by LogActivityType, completion rate,
// compare to division average. Auto-refresh every 30s.

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  DnaStatCard,
  DnaCard,
  DnaButton,
  DnaDatePicker,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaTdNumber,
} from "@/components/dna";
import { TrendingUp, Activity, BarChart3, Clock, Users } from "lucide-react";

type PeriodKey = "last7days" | "thisMonth" | "custom";

interface PersonKpi {
  userId: string;
  period: { from: string | null; to: string | null };
  total: number;
  breakdown: Record<string, number>;
  completionRate: number;
  pageViews: number;
  mutations: number;
}

interface DivisionKpi {
  aggregateScore: number;
  metricCount: number;
  aggregateFunction: string;
}

const ACTIVITY_LABELS: Record<string, string> = {
  CREATE: "Buat Data",
  UPDATE: "Edit Data",
  DELETE: "Hapus Data",
  PAGE_VIEW: "Halaman Dilihat",
  STATE_TRANSITION: "Transisi Status",
  LOGIN_SUCCESS: "Login Berhasil",
  LOGIN_FAIL: "Login Gagal",
  LOGOUT: "Logout",
};

function periodFromKey(key: PeriodKey, customFrom: Date | null, customTo: Date | null) {
  if (key === "custom" && customFrom && customTo) {
    return { from: customFrom.toISOString(), to: customTo.toISOString() };
  }
  const to = new Date();
  if (key === "thisMonth") {
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function PersonalKpiClient() {
  const [period, setPeriod] = useState<PeriodKey>("last7days");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [compareDivision, setCompareDivision] = useState(false);
  const [kpi, setKpi] = useState<PersonKpi | null>(null);
  const [divisionKpi, setDivisionKpi] = useState<DivisionKpi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hardcoded for MVP — Division enum mapped to a single pick.
  // Frontend doesn't know user's division yet, so default to BD.
  const myDivision = "BD";

  const periodParams = useMemo(
    () => periodFromKey(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const qs = `from=${encodeURIComponent(periodParams.from)}&to=${encodeURIComponent(periodParams.to)}`;
    Promise.all([
      api.get<PersonKpi>(`/kpi/person/me?${qs}`),
      compareDivision
        ? api.get<DivisionKpi>(`/kpi/division/${myDivision}?${qs}`)
        : Promise.resolve(null),
    ])
      .then(([person, div]) => {
        if (cancelled) return;
        setKpi(person.data);
        if (div) setDivisionKpi(div.data);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Gagal memuat KPI");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const t = setInterval(() => {
      api.get<PersonKpi>(`/kpi/person/me?${qs}`).then((res) => {
        if (!cancelled) setKpi(res.data);
      }).catch(() => {});
    }, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [periodParams, compareDivision]);

  if (error) {
    return (
      <div data-testid="personal-kpi-error" className="p-6 text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div data-testid="personal-kpi" className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
      {/* 1. Header */}
      <header>
        <h1 className="text-[28px] leading-[36px] font-bold tracking-tight">
          KPI Personal
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Agregasi otomatis dari Activity Log per individu. Default: 7 hari terakhir.
        </p>
      </header>

      {/* 2. Period selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {(["last7days", "thisMonth", "custom"] as PeriodKey[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {p === "last7days" ? "7 Hari" : p === "thisMonth" ? "Bulan Ini" : "Custom"}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <DnaDatePicker
              value={customFrom ? customFrom.toISOString().slice(0, 10) : ""}
              onChange={(v: string) => setCustomFrom(v ? new Date(v) : null)}
              placeholder="Dari"
            />
            <DnaDatePicker
              value={customTo ? customTo.toISOString().slice(0, 10) : ""}
              onChange={(v: string) => setCustomTo(v ? new Date(v) : null)}
              placeholder="Sampai"
            />
          </div>
        )}
        <label className="flex items-center gap-2 ml-auto text-[12px] text-slate-600">
          <input
            type="checkbox"
            checked={compareDivision}
            onChange={(e) => setCompareDivision(e.target.checked)}
            className="rounded"
          />
          Bandingkan dengan rata-rata divisi
        </label>
      </div>

      {loading && !kpi ? (
        <div className="text-slate-500 text-[13px]">Memuat KPI…</div>
      ) : kpi && kpi.total === 0 ? (
        <DnaEmptyState
          title="Belum ada aktivitas"
          description="Tidak ada log aktivitas pada periode ini. Mulai kerjakan sesuatu untuk mengisi KPI kamu."
          icon={<Activity className="h-10 w-10 text-slate-400" />}
        />
      ) : kpi ? (
        <>
          {/* 3. KPI tiles */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <DnaStatCard
              variant="blue"
              label="Total Aktivitas"
              value={kpi.total}
              subtext={`${kpi.mutations} mutations`}
              icon={<Activity className="h-5 w-5" />}
            />
            <DnaStatCard
              variant="emerald"
              label="Completion Rate"
              value={fmtPct(kpi.completionRate)}
              subtext="Transisi / CREATE"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <DnaStatCard
              variant="purple"
              label="Page Views"
              value={kpi.pageViews}
              subtext="Halaman dilihat"
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <DnaStatCard
              variant={compareDivision && divisionKpi ? "amber" : "slate"}
              label={compareDivision ? "Div Avg Score" : "Mutations"}
              value={
                compareDivision && divisionKpi
                  ? fmtPct(divisionKpi.aggregateScore)
                  : kpi.mutations
              }
              subtext={
                compareDivision && divisionKpi
                  ? `${divisionKpi.metricCount} orang di ${myDivision}`
                  : "CREATE + UPDATE + DELETE"
              }
              icon={<Users className="h-5 w-5" />}
            />
          </div>

          {/* 4. Per-type breakdown */}
          <DnaCard title="Breakdown per Tipe Aktivitas" className="p-6">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh>Tipe</DnaTh>
                  <DnaTh>Jumlah</DnaTh>
                  <DnaTh>% dari Total</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {Object.entries(kpi.breakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <DnaTableRow key={type}>
                      <DnaTd>
                        <span className="font-mono text-[12px]">
                          {ACTIVITY_LABELS[type] ?? type}
                        </span>
                      </DnaTd>
                      <DnaTdNumber value={count} />
                      <DnaTdNumber
                        value={Math.round((count / kpi.total) * 100)}
                        suffix="%"
                      />
                    </DnaTableRow>
                  ))}
              </DnaTableBody>
            </DnaTable>
          </DnaCard>

          {/* 5. Period info */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" />
            Periode: {kpi.period.from ?? "∞"} → {kpi.period.to ?? "∞"}
          </div>
        </>
      ) : null}
    </div>
  );
}