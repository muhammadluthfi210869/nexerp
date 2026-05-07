"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Users, Activity, Calendar, Target, FlaskConical, TrendingUp,
  CheckCircle2, DollarSign, Timer, Award, RefreshCw, Star,
  AlertTriangle, ArrowUpRight, Factory, XCircle, Percent,
  BarChart3, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardCardsProps {
  variant: 'guest' | 'sample' | 'production' | 'ro' | 'dashboard' | 'lost' | 'pipeline';
  data: any;
}

function StatCard({ title, value, subValue, icon, className, accentColor }: any) {
  return (
    <Card className={cn("p-6 border-none glass-premium shadow-2xl rounded-[2.5rem] overflow-hidden relative group hover:translate-y-[-4px] transition-all duration-500", className)}>
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted group-hover:text-brand-black transition-colors">{title}</p>
          <h3 className="text-2xl font-heading font-bold text-brand-black tracking-tight">{value ?? "—"}</h3>
          <p className="text-[9px] font-medium text-text-muted uppercase tracking-wider">{subValue}</p>
        </div>
        <div className="p-3 bg-base rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-lg group-hover:shadow-primary/20">
          {React.cloneElement(icon, { size: 18, className: cn(icon.props.className, "transition-colors") })}
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 text-slate-900/[0.03] group-hover:text-primary/[0.06] transition-all duration-700 pointer-events-none">
        {React.cloneElement(icon, { 
          size: 100, 
          className: "text-inherit stroke-[1px]" 
        })}
      </div>
    </Card>
  );
}

export function DashboardCards({ variant, data }: DashboardCardsProps) {
  if (!data) return null;

  // --- DASHBOARD OVERVIEW ---
  if (variant === 'dashboard') {
    const overview = data.overview || {};
    const revenue = data.revenuePipeline || {};
    const activity = data.activityPerformance || {};
    const alerts = data.criticalAlerts || {};

    const fmt = (n: any) => (n ?? 0).toLocaleString();
    const fmtM = (n: any) => `Rp ${(Number(n || 0) / 1000000).toFixed(1)}M`;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card A - Funnel Overview */}
        <Card className="bento-card p-8 bg-white border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
               <div className="w-2.5 h-2.5 rounded-full bg-rose-200" />
            </div>
            <h3 className="text-[12px] font-black text-brand-black uppercase tracking-[0.1em]">A. FUNNEL OVERVIEW</h3>
          </div>
          <div className="space-y-6">
             <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <span className="text-[13px] font-black text-slate-500 uppercase tracking-tight">Total Leads</span>
                <div className="flex items-center gap-2">
                   <span className="text-lg font-black text-slate-900 tabular">{fmt(overview.totalLeads)}</span>
                   <span className="text-[9px] font-black text-emerald-500 uppercase">(Inflow)</span>
                </div>
             </div>
             <div className="space-y-5">
                {[
                  { label: "Leads Contacted", val: overview.contactedLeads, pct: overview.contactRate },
                  { label: "Sample Process", val: overview.sampleProcess, pct: overview.sampleRate },
                  { label: "DP Received", val: overview.dpReceived, pct: overview.dpRate },
                  { label: "Deal Confirmed", val: overview.dealConfirmed, pct: overview.dealRate },
                  { label: "Repeat Order", val: overview.repeatOrder, pct: overview.retentionRate },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center group/item">
                    <span className="text-[12px] font-black text-slate-500 uppercase tracking-tight group-hover/item:text-slate-900 transition-colors">{item.label}</span>
                    <div className="flex items-center gap-3">
                       <span className="text-[13px] font-black text-slate-900 tabular">{fmt(item.val)}</span>
                       <span className="text-[10px] font-black text-emerald-500 uppercase">({item.pct ?? 0}%)</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </Card>
 
        {/* Card B - Revenue Pipeline */}
        <Card className="bento-card p-8 bg-white border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
               <div className="w-2.5 h-2.5 rounded-full bg-orange-200" />
            </div>
            <h3 className="text-[12px] font-black text-brand-black uppercase tracking-[0.1em]">B. REVENUE PIPELINE</h3>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">TOTAL PIPELINE VALUE</p>
            <h2 className="text-[32px] font-black text-slate-900 tabular tracking-tighter mb-10 leading-none">Rp {(Number(revenue.totalPipelineValue || 0) / 1000000).toFixed(1)} M</h2>
            <div className="space-y-4 pt-8 border-t border-slate-50">
               {[
                 { label: "Potential Sample", val: fmtM(revenue.potentialSample) },
                 { label: "Potential Deal", val: fmtM(revenue.potentialDeal) },
                 { label: "Confirmed Deal", val: fmtM(revenue.confirmedDeal), color: "text-blue-600" },
                 { label: "Repeat Order Value", val: fmtM(revenue.repeatOrderValue), color: "text-emerald-500" },
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center group/item">
                    <span className="text-[12px] font-black text-slate-500 uppercase tracking-tight group-hover/item:text-slate-900 transition-colors">{item.label}</span>
                    <span className={cn("text-[13px] font-black tabular", item.color || "text-slate-900")}>{item.val}</span>
                 </div>
               ))}
            </div>
          </div>
        </Card>
 
        {/* Card C - Activity Performance */}
        <Card className="bento-card p-8 bg-white border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
               <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            </div>
            <h3 className="text-[12px] font-black text-brand-black uppercase tracking-[0.1em]">C. ACTIVITY PERFORMANCE</h3>
          </div>
          <div className="space-y-12">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50/60 rounded-2xl p-5 border border-yellow-100 flex flex-col items-start">
                <p className="text-[10px] font-black text-yellow-800 uppercase leading-tight mb-2">FOLLOW-UP<br/>TODAY</p>
                <span className="text-3xl font-black text-slate-900 tabular tracking-tighter leading-none">{fmt(activity.followUpToday)}</span>
              </div>
              <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 flex flex-col items-start">
                <p className="text-[10px] font-black text-emerald-800 uppercase leading-tight mb-2">AVG RESPONSE<br/>TIME</p>
                <div className="flex items-baseline gap-0.5">
                   <span className="text-3xl font-black text-slate-900 tabular tracking-tighter leading-none">{(activity.avgResponse ?? 0).toFixed(1)}</span>
                   <span className="text-[12px] font-black text-slate-900">h</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <span className="text-[12px] font-black text-slate-500 uppercase tracking-tight">Active Leads</span>
                  <span className="text-[16px] font-black text-slate-900 tabular">{fmt(activity.activeLeads)}</span>
               </div>
               <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(100, (activity.activeLeads || 0) / 5)}%` }} />
               </div>
            </div>
          </div>
        </Card>
 
        {/* Card D - Critical Alert */}
        <Card className="bento-card p-8 bg-[#FFF5F5] border-rose-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
               <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            </div>
            <h3 className="text-[12px] font-black text-rose-800 uppercase tracking-[0.1em]">D. CRITICAL ALERT</h3>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Unfollowed Leads", val: alerts.unfollowedLeads },
              { label: "Stuck Samples (>14d)", val: alerts.stuckSamples },
              { label: "Stuck Negotiation", val: alerts.stuckNego },
              { label: "At Risk Clients", val: alerts.atRiskClients },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-4 px-6 bg-white rounded-xl border border-rose-100/50 hover:border-rose-200 transition-all shadow-sm">
                 <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{item.label}</span>
                 <span className="text-lg font-black text-rose-600 tabular">{fmt(item.val)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // --- GUEST BOOK ---
  if (variant === 'guest') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={data.totalLeads ?? 0}
          subValue={`+${data.increment || 0} Dari Kemarin`}
          icon={<Users className="text-violet-500" />}
        />
        <StatCard
          title="Follow Up Aktivitas"
          value={data.followUpActivity ?? 0}
          subValue={`${data.completedTasks || 0} Selesai · ${data.taskPercentage || 0}% Persentase`}
          icon={<Activity className="text-amber-500" />}
        />
        <StatCard
          title="Jumlah Meeting"
          value={data.meetingCount ?? 0}
          subValue="Offline & Online (Period Ini)"
          icon={<Calendar className="text-rose-500" />}
        />
        <StatCard
          title="Conversion Rate"
          value={`${data.conversionRate || 0}%`}
          subValue="Lead to Deal (Close Ratio)"
          icon={<Target className="text-emerald-500" />}
        />
      </div>
    );
  }

  // --- CLIENT SAMPLE ---
  if (variant === 'sample') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Sample Dalam Proses"
          value={data.activeSamples ?? 0}
          subValue="Sedang di R&D Lab"
          icon={<FlaskConical className="text-amber-500" />}
        />
        <StatCard
          title="Revenue Forecast"
          value={formatCurrency(data.revenueForecast ?? 0)}
          subValue="Pipeline Aktif (Sample Stage)"
          icon={<TrendingUp className="text-blue-500" />}
        />
        <StatCard
          title="Potential Sample"
          value={formatCurrency(data.potentialSample ?? 0)}
          subValue="Dari Leads Contacted/Nego"
          icon={<DollarSign className="text-violet-500" />}
        />
        <StatCard
          title="Conversion ke Produksi"
          value={`${data.conversionToProd || 0}%`}
          subValue="Sample Approved -> SPK Signed"
          icon={<CheckCircle2 className="text-emerald-500" />}
        />
      </div>
    );
  }

  // --- CLIENT PRODUCTION ---
  if (variant === 'production') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Conversion Rate"
          value={`${data.inProduction || 0} Active`}
          subValue={`Nilai: ${formatCurrency(data.productionValue ?? 0)}`}
          icon={<Factory className="text-cyan-600" />}
        />
        <StatCard
          title="Avg. Closing Time"
          value={data.avgClosingTime || "—"}
          subValue="Dari Konsultasi ke SPK"
          icon={<Timer className="text-violet-500" />}
        />
        <StatCard
          title="On-Time Delivery"
          value={data.onTimeDelivery || "—"}
          subValue="Ketepatan Jadwal Produksi"
          icon={<Shield className="text-emerald-500" />}
        />
      </div>
    );
  }

  // --- CLIENT RO ---
  if (variant === 'ro') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active RO Clients"
          value={data.activeRoLeads ?? 0}
          subValue="Clients dengan >= 2 Order"
          icon={<RefreshCw className="text-emerald-500" />}
        />
        <StatCard
          title="RO Revenue"
          value={formatCurrency(data.roRevenue ?? 0)}
          subValue="Total Nilai Repeat Order"
          icon={<DollarSign className="text-emerald-600" />}
        />
        <StatCard
          title="Retention Rate"
          value={data.retentionRate || "—"}
          subValue={`${data.readyToRepeat || 0} Siap Repeat (MTD)`}
          icon={<Star className="text-amber-500" />}
        />
      </div>
    );
  }

  // --- LOST PAGE ---
  if (variant === 'lost') {
    const funnel = data.funnelConversion || {};
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="A. Funnel Conversion"
          value={`${funnel.leadToSmpl || 0}%`}
          subValue={`SMPL -> PROD: ${funnel.smplToProd || 0}% · RO: ${funnel.prodToRo || "—"}`}
          icon={<BarChart3 className="text-violet-500" />}
        />
        <StatCard
          title="C. Lost Count"
          value={data.lostLeads ?? 0}
          subValue="Total Lead Hilang"
          icon={<XCircle className="text-rose-500" />}
        />
        <StatCard
          title="D. Lost Value"
          value={formatCurrency(data.lostValue ?? 0)}
          subValue="Total Nilai Hilang"
          icon={<DollarSign className="text-rose-600" />}
        />
        <StatCard
          title="F. Top Reason"
          value={data.topReason?.replace(/_/g, ' ') || "—"}
          subValue={`Leakage Rate: ${data.leakageRate || "—"}`}
          icon={<AlertTriangle className="text-amber-500" />}
        />
      </div>
    );
  }

  // --- SALES PIPELINE ---
  if (variant === 'pipeline') {
    const conversion = data.conversion || {};
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Active Opportunities"
          value={data.activeLeads ?? 0}
          subValue="Leads in Active Pipeline"
          icon={<Target className="text-blue-500" />}
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(data.pipelineValue ?? 0)}
          subValue="Est. Total Revenue"
          icon={<DollarSign className="text-emerald-500" />}
        />
        <StatCard
          title="Avg. Velocity"
          value={data.avgDays || "0 Days"}
          subValue="Leads to Deal Duration"
          icon={<Timer className="text-violet-500" />}
        />
        <StatCard
          title="Lead to Deal CR"
          value={`${conversion.sampleToDeal || 0}%`}
          subValue="Sample to Closing Rate"
          icon={<TrendingUp className="text-amber-500" />}
        />
      </div>
    );
  }

  return null;
}
