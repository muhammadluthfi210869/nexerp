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
      {/* Subtle Background Icon - Stripped of color for pure decorative effect */}
      <div className="absolute -bottom-4 -right-4 text-slate-900/[0.03] group-hover:text-primary/[0.06] transition-all duration-700 pointer-events-none">
        {React.cloneElement(icon, { 
          size: 100, 
          className: "text-inherit stroke-[1px]" 
        })}
      </div>
    </Card>
  );
}

function AlertItem({ label, val, critical }: { label: string; val: number; critical?: boolean }) {
  return (
    <div className={cn("flex justify-between items-center p-4 rounded-2xl border transition-all duration-300", critical && val > 0 ? "bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/10" : "bg-white/5 border-white/10")}>
      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.1em]">{label}</span>
      <span className={cn("text-sm font-black italic", val > 0 ? "text-rose-600" : "text-text-muted/30")}>{val}</span>
    </div>
  );
}

function StatRow({ label, val, pct, isMain = false, highlight = false, subValue }: any) {
  return (
    <div className="flex justify-between items-center group/row">
      <span className={cn("text-[10px] font-bold text-slate-500 uppercase tracking-tight group-hover/row:text-brand-black transition-colors", isMain && "text-[11px] text-slate-900")}>{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-[11px] font-black text-slate-900", isMain && "text-sm", highlight && "text-blue-600")}>{val ?? 0}</span>
        {pct && <span className="text-[9px] font-bold text-emerald-500 italic">{pct}</span>}
        {subValue && <span className="text-[9px] font-bold text-slate-400">{subValue}</span>}
      </div>
    </div>
  );
}

export function DashboardCards({ variant, data }: DashboardCardsProps) {
  if (!data) return null;

  // ─── DASHBOARD OVERVIEW ─────────────────────────────────────────────────────
  if (variant === 'dashboard') {
    const overview = data.overview || {};
    const revenue = data.revenuePipeline || {};
    const activity = data.activityPerformance || {};
    const alerts = data.criticalAlerts || {};

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card I - Funnel Overview */}
        <Card className="bento-card p-6 bg-white border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-[11px] font-black text-brand-black uppercase tracking-[0.2em]">A. FUNNEL OVERVIEW</h3>
          </div>
          <div className="space-y-4">
             <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Total Leads</span>
                <div className="text-right">
                   <span className="text-sm font-black text-brand-black tabular">1,245</span>
                   <span className="ml-2 text-[9px] font-bold text-emerald-500 uppercase">(Inflow)</span>
                </div>
             </div>
             <div className="space-y-3">
                {[
                  { label: "Leads Contacted", val: "850", pct: "68%" },
                  { label: "Sample Process", val: "220", pct: "25%" },
                  { label: "DP Received", val: "110", pct: "50%" },
                  { label: "Deal Confirmed", val: "85", pct: "77%" },
                  { label: "Repeat Order", val: "42", pct: "49%" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center group/item">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight group-hover/item:text-slate-900 transition-colors">{item.label}</span>
                    <div className="flex items-center gap-3">
                       <span className="text-[12px] font-black text-brand-black tabular">{item.val}</span>
                       <span className="text-[9px] font-bold text-emerald-500 uppercase">({item.pct})</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </Card>
 
        {/* Card II - Revenue Pipeline */}
        <Card className="bento-card p-6 bg-white border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-[11px] font-black text-brand-black uppercase tracking-[0.2em]">B. REVENUE PIPELINE</h3>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">TOTAL PIPELINE VALUE</p>
            <h2 className="text-3xl font-black text-brand-black tabular tracking-tighter">Rp 12.5 M</h2>
            <div className="space-y-3 mt-8 pt-6 border-t border-slate-50">
               {[
                 { label: "Potential Sample", val: "Rp 4.2M" },
                 { label: "Potential Deal", val: "Rp 2.8M" },
                 { label: "Confirmed Deal", val: "Rp 3.5M", color: "text-blue-600" },
                 { label: "Repeat Order Value", val: "Rp 1.5M", color: "text-emerald-500" },
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center group/item">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight group-hover/item:text-slate-900 transition-colors">{item.label}</span>
                    <span className={cn("text-[12px] font-black tabular", item.color || "text-brand-black")}>{item.val}</span>
                 </div>
               ))}
            </div>
          </div>
        </Card>
 
        {/* Card III - Activity Performance */}
        <Card className="bento-card p-6 bg-white border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-[11px] font-black text-brand-black uppercase tracking-[0.2em]">C. ACTIVITY PERFORMANCE</h3>
          </div>
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50 flex flex-col">
                <p className="text-[8px] font-black text-amber-600 uppercase tracking-tighter mb-1">FOLLOW-UP TODAY</p>
                <span className="text-3xl font-black text-brand-black tabular leading-none">45</span>
              </div>
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 flex flex-col">
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter mb-1">AVG RESPONSE</p>
                <div className="flex items-baseline gap-0.5">
                   <span className="text-3xl font-black text-brand-black tabular leading-none">1.2</span>
                   <span className="text-[10px] font-black text-slate-400 uppercase">H</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Leads</span>
                  <span className="text-[12px] font-black text-brand-black tabular">320</span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '65%' }} />
               </div>
            </div>
          </div>
        </Card>
 
        {/* Card IV - Critical Alert */}
        <Card className="bento-card p-6 bg-rose-50/20 border-rose-100/50 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-[11px] font-black text-rose-600 uppercase tracking-[0.2em]">D. CRITICAL ALERT</h3>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Unfollowed Leads", val: "12" },
              { label: "Stuck Samples (>14d)", val: "8" },
              { label: "Stuck Negotiation", val: "5" },
              { label: "At Risk Clients", val: "3" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 px-4 bg-white rounded-xl border border-rose-100/30 group-hover:border-rose-100 transition-all shadow-sm">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{item.label}</span>
                 <span className="text-[14px] font-black text-rose-600 tabular">{item.val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ─── GUEST BOOK ──────────────────────────────────────────────────────────────
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

  // ─── CLIENT SAMPLE ───────────────────────────────────────────────────────────
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
          subValue="Sample Approved → SPK Signed"
          icon={<CheckCircle2 className="text-emerald-500" />}
        />
      </div>
    );
  }

  // ─── CLIENT PRODUCTION ───────────────────────────────────────────────────────
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

  // ─── CLIENT RO ───────────────────────────────────────────────────────────────
  if (variant === 'ro') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active RO Clients"
          value={data.activeRoLeads ?? 0}
          subValue="Clients dengan ≥ 2 Order"
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

  // ─── LOST PAGE ───────────────────────────────────────────────────────────────
  if (variant === 'lost') {
    const funnel = data.funnelConversion || {};
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="A. Funnel Conversion"
          value={`${funnel.leadToSmpl || 0}%`}
          subValue={`SMPL→PROD: ${funnel.smplToProd || 0}% · RO: ${funnel.prodToRo || "—"}`}
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

  // ─── SALES PIPELINE ─────────────────────────────────────────────────────────
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

