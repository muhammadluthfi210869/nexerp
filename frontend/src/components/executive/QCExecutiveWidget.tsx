"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ShieldCheck, TrendingDown } from "lucide-react";

interface QCStats {
  fty: string;
  copq: number;
  trends: { day: string; count: number }[];
  rejected: number;
}

interface DefectItem {
  defectType: string;
  count: number;
  pct: number;
}

export default function QCExecutiveWidget() {
  const [stats, setStats] = useState<QCStats | null>(null);
  const [defects, setDefects] = useState<DefectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, defectsRes] = await Promise.all([
          fetch("/production/qc/stats"),
          fetch("/qc/analytics/defect-pareto"),
        ]);
        const statsData = await statsRes.json();
        const defectsData = await defectsRes.json();
        setStats(statsData);
        setDefects(defectsData.slice(0, 3));
      } catch (err) {
        console.error("QC widget fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const ftyVal = stats ? parseFloat(stats.fty) : 0;
  const ftyColor =
    ftyVal >= 90 ? "text-emerald-500" : ftyVal >= 80 ? "text-amber-500" : "text-rose-500";
  const ftyBarColor =
    ftyVal >= 90 ? "bg-emerald-500" : ftyVal >= 80 ? "bg-amber-500" : "bg-rose-500";

  const formatRp = (val: number) => {
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} M`;
    if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)} rb`;
    return `Rp ${val.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Card className="md:col-span-3 rounded-[2rem] p-5 border border-slate-100 bg-white flex flex-col h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-36 bg-slate-100 rounded" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-slate-50 rounded-2xl" />
            <div className="h-32 bg-slate-50 rounded-2xl" />
            <div className="h-32 bg-slate-50 rounded-2xl" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-3 rounded-[2rem] p-5 border border-slate-100 bg-white flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-black italic">
            QC QUALITY METRICS
          </h3>
        </div>
        <ShieldCheck className="w-4 h-4 text-violet-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 flex flex-col">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2">
            FIRST PASS YIELD (FTY)
          </p>
          <p className={cn("text-[28px] font-black tabular leading-none mb-3", ftyColor)}>
            {stats?.fty || "—"}%
          </p>
          <div className="flex items-end gap-1 flex-1 pb-1">
            {(stats?.trends || []).map((t, i) => {
              const maxCount = Math.max(...(stats?.trends || []).map((x) => x.count), 1);
              const h = (t.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                  <div
                    className={cn("w-full rounded-sm transition-all", ftyBarColor + "/30")}
                    style={{ height: `${Math.max(h, 8)}%` }}
                  />
                  <p className="text-[5px] font-bold text-slate-300 uppercase">{t.day.slice(0, 2)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 flex flex-col">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2">
            COST OF POOR QUALITY (COPQ)
          </p>
          <p className="text-[22px] font-black tabular text-rose-600 leading-none mb-1">
            {stats ? formatRp(stats.copq) : "—"}
          </p>
          <div className="flex items-center gap-1.5 mt-auto">
            <TrendingDown className="w-3 h-3 text-rose-400" />
            <p className="text-[8px] font-bold text-slate-400">
              {stats?.rejected || 0} reject batches this month
            </p>
          </div>
        </div>

        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 flex flex-col">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-3">
            TOP DEFECT TYPES
          </p>
          <div className="space-y-3 flex-1">
            {defects.length === 0 && (
              <p className="text-[9px] font-bold text-slate-300 italic">No defects recorded</p>
            )}
            {defects.map((d, i) => {
              const barColor =
                i === 0 ? "bg-rose-500" : i === 1 ? "bg-amber-500" : "bg-violet-500";
              return (
                <div key={d.defectType} className="space-y-1">
                  <div className="flex justify-between text-[8px] font-bold uppercase">
                    <p className="text-brand-black truncate">{d.defectType}</p>
                    <p className="text-slate-400 shrink-0 ml-2">{d.count}x</p>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", barColor)}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
