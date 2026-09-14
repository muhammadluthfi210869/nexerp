"use client";

// KpiLandingClient — WS-B KPI landing page (Wave 3 D2).
// Quick stats card + 2 entry cards (Personal / Division).

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  DnaStatCard,
  DnaCard,
  DnaButton,
} from "@/components/dna";
import { User, Users, ArrowRight, TrendingUp } from "lucide-react";

interface PersonKpi {
  userId: string;
  total: number;
  completionRate: number;
  period: { from: string | null; to: string | null };
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function KpiLandingClient() {
  const [kpi, setKpi] = useState<PersonKpi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    api.get<PersonKpi>(`/kpi/person/me?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((res) => { if (!cancelled) setKpi(res.data); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Gagal memuat"); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div data-testid="kpi-landing-error" className="p-6 text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div data-testid="kpi-landing" className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
      <header>
        <h1 className="text-[28px] leading-[36px] font-bold tracking-tight">
          KPI Management
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Pantau produktivitas per individu dan per divisi. Otomatis diagregasi dari Activity Log.
        </p>
      </header>

      {/* Quick stats card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <DnaStatCard
          variant="blue"
          label="Aktivitas Bulan Ini"
          value={kpi?.total ?? "—"}
          subtext="Total mutasi + page view"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <DnaStatCard
          variant="emerald"
          label="Completion Rate"
          value={kpi ? fmtPct(kpi.completionRate) : "—"}
          subtext="Transisi / CREATE"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <DnaStatCard
          variant="purple"
          label="Periode"
          value={
            kpi
              ? `${kpi.period.from?.slice(0, 10) ?? "∞"} → ${kpi.period.to?.slice(0, 10) ?? "∞"}`
              : "Bulan Ini"
          }
          subtext="Otomatis dihitung server-side"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Two entry cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DnaCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-50 text-blue-600 p-3 dark:bg-blue-950/40">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-[16px] font-bold">KPI Personal</h3>
              <p className="text-[12px] text-slate-500 mt-1">
                Breakdown per tipe aktivitas, completion rate, page views, dan
                perbandingan dengan rata-rata divisi.
              </p>
              <Link href="/kpi-management/personal" className="inline-block mt-4">
                <DnaButton size="sm" variant="primary">
                  Buka Personal <ArrowRight className="h-4 w-4 ml-1" />
                </DnaButton>
              </Link>
            </div>
          </div>
        </DnaCard>

        <DnaCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-50 text-emerald-600 p-3 dark:bg-emerald-950/40">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-[16px] font-bold">KPI Per Divisi</h3>
              <p className="text-[12px] text-slate-500 mt-1">
                Aggregate score seluruh personel di sebuah divisi. Default formula: MEAN.
              </p>
              <Link href="/kpi-management/division" className="inline-block mt-4">
                <DnaButton size="sm" variant="primary">
                  Buka Divisi <ArrowRight className="h-4 w-4 ml-1" />
                </DnaButton>
              </Link>
            </div>
          </div>
        </DnaCard>
      </div>
    </div>
  );
}