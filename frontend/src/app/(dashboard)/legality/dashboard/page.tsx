"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Activity, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  FileCheck,
  Beaker,
  BookOpen,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TableWrapper, DataCard, DnaBadge, DnaButton } from "@/components/dna";
import { KpiCard } from "@/components/dna/KpiCard";

export default function LegalityDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["legality-dashboard"],
    queryFn: async () => {
      const [dashboard, pipeline, expiry] = await Promise.all([
        api.get("/legality/dashboard"),
        api.get("/legality/pipeline/stats"),
        api.get("/legality/expiry?limit=10"),
      ]);
      return { 
        ...dashboard.data, 
        pipeline: pipeline.data,
        expiryData: expiry.data,
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
       <Activity className="h-6 w-6 text-slate-400 animate-pulse" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Compliance DNA...</p>
    </div>
  );

  return (
    <DashboardShell
      title="LEGALITY & COMPLIANCE"
      subtitle="Regulatory Surveillance & HKI Audit"
    >
      {/* I. EXECUTIVE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-slide-in">
        <KpiCard
          label="Active Total"
          value={String(metrics?.overall?.activeTotal ?? 0)}
          targetPct={50}
          icon={<ShieldCheck />}
        />
        <KpiCard
          label="Delayed"
          value={String(metrics?.overall?.delayed ?? 0)}
          targetPct={(metrics?.overall?.delayed ?? 0) === 0 ? 100 : 0}
          icon={<Clock />}
        />
        <KpiCard
          label="Expired"
          value={String(metrics?.riskMonitor?.expired ?? 0)}
          targetPct={(metrics?.riskMonitor?.expired ?? 0) === 0 ? 100 : 0}
          icon={<AlertTriangle />}
        />
        <KpiCard
          label="Under 90 Days"
          value={String(metrics?.riskMonitor?.under90Days ?? 0)}
          targetPct={(metrics?.riskMonitor?.under90Days ?? 0) === 0 ? 100 : 0}
          icon={<FileCheck />}
        />
        <KpiCard
          label="BPOM Avg Time"
          value={`${metrics?.bpomStats?.avgTime?.replace(" Days", "") ?? "0"} days`}
          targetPct={50}
          icon={<Beaker />}
        />
        <KpiCard
          label="HKI Avg Time"
          value={`${metrics?.hkiStats?.avgTime?.replace(" Days", "") ?? "0"} days`}
          targetPct={50}
          icon={<BookOpen />}
        />
        <KpiCard
          label="Halal Certified"
          value={String(metrics?.halalStats?.certified ?? 0)}
          targetPct={(metrics?.halalStats?.certified ?? 0) > 0 ? 100 : 50}
          icon={<Award />}
        />
      </div>

      {/* II. HKI TRACKING HUB - ULTRA COMPACT TABLE */}
      <div className="space-y-3 mt-6 animate-fade-slide-in">
        <TableWrapper
          filters={
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs font-black uppercase tracking-tight text-slate-900">
                1. HKI (HAK KEKAYAAN INTELEKTUAL) TRACKING HUB
              </h3>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">BRAND / PRODUCT (HKI ID)</th>
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">TYPE / CLIENT</th>
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">PIC / APPLY</th>
                  <th className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">FLOW STATE (DAYS)</th>
                  <th className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">STATUS</th>
                  <th className="px-4 py-4 text-right text-table-header text-slate-400 uppercase tracking-widest">AUDIT RISK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics?.tables?.hkiTracking?.map((row: any, i: number) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-black text-brand-black uppercase tracking-tight">{row.brand}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase leading-none mt-0.5">{row.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-black text-brand-black uppercase">{row.type}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mt-0.5">{row.client}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-black text-purple-600 uppercase italic">{row.pic}</p>
                      <p className="text-[8px] font-bold text-slate-300 tabular uppercase leading-none mt-0.5">{row.apply}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="text-[10px] font-black text-brand-black uppercase leading-tight">{row.flow}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mt-0.5">{row.days}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DnaBadge 
                        status={
                          row.status === 'DONE' ? "success" :
                          row.status === 'REJECT' ? "critical" :
                          "warning"
                        }
                      >
                        {row.status}
                      </DnaBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.risk === 'OK' ? (
                          <>
                            <span className="text-[9px] font-black text-emerald-500 uppercase">OK</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[9px] font-black text-amber-600 uppercase italic">DELAY AUDIT</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableWrapper>
      </div>

      {/* III. BPOM PROGRESS AUDIT */}
      <div className="space-y-3 mt-6 animate-fade-slide-in">
        <TableWrapper
          filters={
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-tight text-slate-900">
                2. BPOM (NOTIFIKASI KOSMETIK) PROGRESS AUDIT
              </h3>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">PRODUCT NAME (BPOM ID)</th>
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">CATEGORY / CLIENT</th>
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">PIC / APPLY</th>
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">STAGE (BOTTLENECK)</th>
                  <th className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">STATUS</th>
                  <th className="px-4 py-4 text-right text-table-header text-slate-400 uppercase tracking-widest">DAYS ELAPSED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics?.tables?.bpomProgress?.map((row: any, i: number) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-black text-brand-black uppercase tracking-tight">{row.name}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase leading-none mt-0.5">{row.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-black text-brand-black uppercase">{row.cat}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mt-0.5">{row.client}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-black text-emerald-600 uppercase italic">{row.pic}</p>
                      <p className="text-[8px] font-bold text-slate-300 tabular leading-none mt-0.5">{row.date}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-black text-brand-black uppercase italic leading-none">{row.stage}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DnaBadge 
                        status={
                          row.status === 'DONE' ? "success" :
                          row.status === 'IN_PROGRESS_ROSE' ? "critical" :
                          "warning"
                        }
                      >
                        {row.status.replace("_ROSE", "")}
                      </DnaBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className={cn("text-[11px] font-black tabular leading-none", row.days === '52d' ? "text-rose-600" : "text-brand-black")}>{row.days}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableWrapper>
      </div>

      {/* IV. NEAREST EXPIRING RADAR */}
      <div className="space-y-3 mt-6 animate-fade-slide-in">
        <TableWrapper
          filters={
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-black uppercase tracking-tight text-slate-900">
                EXPIRY RADAR — NEAREST EXPIRING CERTIFICATES
              </h3>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">TYPE</th>
                  <th className="px-4 py-4 text-left text-table-header text-slate-400 uppercase tracking-widest">CERTIFICATE / NAME</th>
                  <th className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">CERT NUMBER</th>
                  <th className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">EXPIRY DATE</th>
                  <th className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">DAYS LEFT</th>
                  <th className="px-4 py-4 text-center text-table-header text-slate-400 uppercase tracking-widest">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics?.expiryData?.nearestExpiring?.map((item: any, i: number) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-4 py-3">
                      <DnaBadge status={
                        item.type === 'HKI' ? 'info' :
                        item.type === 'BPOM' ? 'success' : 'warning'
                      }>
                        {item.type}
                      </DnaBadge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-black text-brand-black uppercase tracking-tight">{item.name}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="text-[10px] font-black text-slate-600 tabular">{item.certNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="text-[10px] font-black text-slate-600 tabular">{item.expiry}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DnaBadge 
                        status={
                          item.daysLeft <= 30 ? "critical" :
                          item.daysLeft <= 60 ? "warning" :
                          "success"
                        }
                        className="tabular rounded-full"
                      >
                        {item.daysLeft}d
                      </DnaBadge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DnaBadge status={
                        item.status === 'EXPIRED' ? 'critical' :
                        item.status === 'CRITICAL' ? 'critical' :
                        item.status === 'WARNING' ? 'warning' : 'success'
                      }>
                        {item.status}
                      </DnaBadge>
                    </td>
                  </tr>
                ))}
                {(!metrics?.expiryData?.nearestExpiring || metrics.expiryData.nearestExpiring.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      No certificates with expiry dates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableWrapper>
      </div>

      {/* V. DUAL SECTION: EXPIRY + PERFORMANCE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 animate-fade-slide-in">
        {/* CRITICAL EXPIRY AUDIT */}
        <div className="md:col-span-7 space-y-3">
          <TableWrapper
            filters={
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-black uppercase tracking-tight text-slate-900">
                  3. CRITICAL EXPIRY AUDIT (PROTECTION)
                </h3>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-rose-50/30 border-b border-rose-100/50">
                    <th className="px-4 py-4 text-left text-table-header text-rose-800 uppercase tracking-widest">TYPE / REGISTRATION (BRAND)</th>
                    <th className="px-4 py-4 text-center text-table-header text-rose-800 uppercase tracking-widest">CERT NUMBER / EXPIRY</th>
                    <th className="px-4 py-4 text-right text-table-header text-rose-800 uppercase tracking-widest">DAYS LEFT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100/30">
                  {metrics?.tables?.criticalExpiry?.map((row: any, i: number) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                      <td className="px-4 py-3.5">
                        <p className="text-[11px] font-black text-brand-black uppercase tracking-tight">{row.type}</p>
                        <p className="text-[8px] font-bold text-rose-400 uppercase leading-none mt-0.5">{row.sub}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <p className="text-[10px] font-black text-rose-900 tabular">{row.cert}</p>
                        <p className="text-[9px] font-black text-rose-600 tabular leading-none mt-1">{row.expiry}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <DnaBadge status="critical">
                          {row.left}
                        </DnaBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </div>

        {/* LEGAL STAFF PERFORMANCE */}
        <div className="md:col-span-5 space-y-3">
          <DataCard
            dotColor="bg-blue-500"
            title="4. LEGAL STAFF PERFORMANCE"
            titleColor="text-slate-400"
            className="!p-5 rounded-2xl"
          >
            <div className="space-y-4 mt-2">
              <div className="flex justify-between text-table-header text-slate-400 uppercase tracking-widest px-1">
                <span>STAFF NAME</span>
                <span className="text-center">DONE/TOTAL</span>
                <span className="text-right">WIN RATE</span>
              </div>
              {metrics?.tables?.staffHistory?.map((staff: any) => (
                <div key={staff.name} className="flex justify-between items-center group py-2 border-b border-slate-50 last:border-none">
                  <div>
                    <p className="text-[12px] font-black text-brand-black uppercase tracking-tight">{staff.name}</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase leading-none mt-0.5">{staff.avg}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-black text-brand-black tabular leading-none">{staff.stat}</p>
                    <p className="text-[8px] font-bold text-rose-400 uppercase tracking-widest mt-1">{staff.delay}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-[16px] font-black tabular", staff.color)}>{staff.rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </DataCard>
        </div>
      </div>
    </DashboardShell>
  );
}
