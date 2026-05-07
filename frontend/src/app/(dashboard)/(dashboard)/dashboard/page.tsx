"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  CreditCard, 
  Target, 
  Share2, 
  PieChart as PieIcon,
  Activity,
  ArrowRight,
  UserCheck,
  Heart,
  MessageSquare,
  Repeat2,
  Bookmark,
  Package
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";

const LazyTrendAreaChart = dynamic(() => import("./DashboardCharts").then(m => ({ default: m.TrendAreaChart })), {
  ssr: false,
  loading: () => <ChartSkeleton height={350} />,
});

const LazySpendBarChart = dynamic(() => import("./DashboardCharts").then(m => ({ default: m.SpendBarChart })), {
  ssr: false,
  loading: () => <ChartSkeleton height={350} />,
});

const LazyAdSpendPieChart = dynamic(() => import("./DashboardCharts").then(m => ({ default: m.AdSpendPieChart })), {
  ssr: false,
  loading: () => <ChartSkeleton height={350} />,
});

interface TrendItem {
  date: string;
  leads: number;
  cpl: number;
  spend: number;
}

interface AuditData {
  acquisition: {
    revenue_mtd: number;
    target: number;
    deal_count: number;
    avg_cpa: number;
  };
  funnel: {
    leads: number;
    samples: number;
    closing_rate: number;
  };
  budget: {
    total_spend: number;
    budget_limit: number;
    cpl: number;
    cost_per_sample: number;
  };
  trends: TrendItem[];
  content: {
    id: string;
    title: string;
    category: string;
    views: number;
    engagement_rate: number;
  }[];
  vitality: {
    followers: number;
    growth: string;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_saves: number;
  };
  platform_audit: {
    platform: string;
    spend: number;
    leads: number;
    cpl: number;
    cpc: number;
  }[];
  lead_ranking: {
    source: string;
    count: number;
  }[];
}

export default function DashboardPage() {
  const { data: rawAudit, isLoading, isError } = useQuery<AuditData>({
    queryKey: ["marketing-audit"],
    queryFn: async () => {
      const res = await api.get("/analytics/executive");
      return res.data;
    }
  });

  if (isLoading) {
    return (
        <div className="p-8 space-y-8 animate-pulse bg-slate-50/50 min-h-screen rounded-3xl">
            <div className="h-20 w-1/3 bg-white rounded-2xl" />
            <div className="grid grid-cols-3 gap-6">
                <div className="h-64 bg-white rounded-3xl shadow-sm" />
                <div className="h-64 bg-white rounded-3xl shadow-sm" />
                <div className="h-64 bg-white rounded-3xl shadow-sm" />
            </div>
            <div className="h-96 bg-white rounded-3xl shadow-sm" />
        </div>
    );
  }

  if (isError || !rawAudit) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-red-50 rounded-full">
          <Activity className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-text-main">Audit Stream Offline</h2>
        <p className="text-text-muted text-sm max-w-xs text-center">Failed to synchronize with binary marketing engine. Verify backend connection is active.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-brand-blue text-white rounded-full font-bold text-xs uppercase tracking-tight hover:bg-blue-700 transition-colors"
        >
          Re-authenticate & Sync
        </button>
      </div>
    );
  }

  const audit = rawAudit;

  return (
    <div className="p-[var(--page-px)] space-y-[var(--section-gap)] bg-base min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-dashboard-title text-brand-black uppercase">
             Marketing <span className="text-primary">Dashboard</span>
           </h1>
           <p className="text-section-label mt-2">
              Command Center • Precision Analytics Engine
           </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-border shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-micro-label text-emerald-600">Protocol: Nominal</span>
        </div>
      </header>

      {/* SECTION I, II, III: PRIMARY SCORECARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--card-gap)]">
        <div className="bento-card p-[var(--card-px)] bento-card-hover">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-section-label">I. ACQUISITION HUB</h3>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary border border-slate-100">
               <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-6">
             <div>
                <p className="text-section-label mb-2">Revenue Sales (MTD)</p>
                <p className="text-primary-value text-brand-black tabular">IDR {audit.acquisition.revenue_mtd.toLocaleString()}</p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-6 overflow-hidden">
                   <div 
                      className="bg-primary h-full transition-all duration-1000" 
                      style={{ width: `${Math.min((audit.acquisition.revenue_mtd / audit.acquisition.target) * 100, 100)}%` }} 
                   />
                </div>
                <div className="flex justify-between mt-3 px-1">
                   <p className="text-micro-label text-slate-400">Target: 350M</p>
                   <p className="text-micro-label text-primary">{((audit.acquisition.revenue_mtd / audit.acquisition.target) * 100).toFixed(1)}%</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-micro-label text-slate-400 mb-1">Clients</p>
                   <p className="text-secondary-value text-brand-black tabular">{audit.acquisition.deal_count}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-micro-label text-slate-400 mb-1">Avg CPA</p>
                   <p className="text-secondary-value text-primary tabular">IDR {Math.round(audit.acquisition.avg_cpa / 1000)}k</p>
                </div>
             </div>
          </div>
        </div>

        <div className="bento-card p-[var(--card-px)] bento-card-hover border-emerald-100 bg-emerald-50/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-section-label text-emerald-600">II. FUNNEL EFFICIENCY</h3>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-sm">
               <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                <div>
                   <p className="text-micro-label text-emerald-600/60 mb-1">Leads</p>
                   <p className="text-secondary-value text-brand-black tabular">{audit.funnel.leads}</p>
                </div>
                <ArrowRight className="text-emerald-300 h-4 w-4" />
                <div className="text-right">
                   <p className="text-micro-label text-emerald-600/60 mb-1">Samples</p>
                   <p className="text-secondary-value text-brand-black tabular">{audit.funnel.samples}</p>
                </div>
             </div>
             <div className="pt-4 border-t border-emerald-100">
                <div className="flex justify-between items-end mb-2 px-1">
                   <p className="text-section-label text-emerald-600">Closing Rate</p>
                   <p className="text-primary-value text-emerald-500 tabular">{audit.funnel.closing_rate.toFixed(1)}%</p>
                </div>
                <p className="text-micro-label text-emerald-600/40">Benchmark: 5.5%+</p>
             </div>
          </div>
        </div>

        <div className="bento-card p-[var(--card-px)] bento-card-hover">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-section-label">III. BUDGET AUDIT</h3>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-rose-500 border border-slate-100">
               <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-6">
             <div>
                <p className="text-section-label mb-1">Burned Spend</p>
                <p className="text-primary-value text-brand-black tabular">IDR {audit.budget.total_spend.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                   <p className="text-micro-label text-slate-500">
                       Utilization: {((audit.budget.total_spend / audit.budget.budget_limit) * 100).toFixed(0)}%
                   </p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-micro-label text-slate-400 mb-1">CPL Global</p>
                   <p className="text-secondary-value text-brand-black tabular">IDR {Math.round(audit.budget.cpl).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-micro-label text-slate-400 mb-1">Cost / Sample</p>
                   <p className="text-secondary-value text-brand-black tabular">IDR {Math.round(audit.budget.cost_per_sample).toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--card-gap)]">
        <Suspense fallback={<ChartSkeleton height={350} />}>
          <LazyTrendAreaChart data={audit.trends} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton height={350} />}>
          <LazySpendBarChart data={audit.trends} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--card-gap)]">
          <div className="lg:col-span-2 bento-card overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                   <Zap className="h-4 w-4" />
                </div>
                <h3 className="text-section-label">VI. TOP LIST CONTENT LEADERS</h3>
             </div>
             <div className="p-0">
                <Table>
                   <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent">
                         <TableHead className="text-table-header pl-6 py-4">Judul Konten</TableHead>
                         <TableHead className="text-table-header py-4">Kategori</TableHead>
                         <TableHead className="text-table-header py-4 text-center">Views</TableHead>
                         <TableHead className="text-table-header py-4 text-right pr-6">Engagement</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {audit.content.map((c: { id: string, title: string, category: string, views: number, engagement_rate: number }) => (
                         <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                            <TableCell className="pl-6 py-4 text-audit-body text-brand-black uppercase">{c.title}</TableCell>
                            <TableCell className="text-micro-label text-slate-400">{c.category}</TableCell>
                            <TableCell className="text-center font-bold text-sm text-brand-black tabular">{(c.views / 1000).toFixed(1)}k</TableCell>
                            <TableCell className="text-right pr-6 font-bold text-emerald-500 text-base tabular">{c.engagement_rate}%</TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </div>
          </div>

          <div className="bento-card p-[var(--card-px)] bento-card-hover">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-primary border border-slate-100">
                   <Share2 className="h-4 w-4" />
                </div>
                <h3 className="text-section-label">VII. VITALITAS KONTEN</h3>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <UserCheck className="w-4 h-4 text-primary" />, title: "Followers", value: audit.vitality.followers.toLocaleString(), delta: `+${audit.vitality.growth}` },
                  { icon: <Heart className="w-4 h-4 text-rose-500" />, title: "Likes", value: (audit.vitality.total_likes / 1000).toFixed(1) + 'k' },
                  { icon: <MessageSquare className="w-4 h-4 text-primary" />, title: "Comments", value: audit.vitality.total_comments.toLocaleString() },
                  { icon: <Repeat2 className="w-4 h-4 text-emerald-500" />, title: "Shares", value: audit.vitality.total_shares.toLocaleString() },
                  { icon: <Bookmark className="w-4 h-4 text-amber-500" />, title: "Saves", value: audit.vitality.total_saves.toLocaleString() },
                  { icon: <Activity className="w-4 h-4 text-primary" />, title: "Status", value: "OPTIMAL" }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2 mb-2">
                        {item.icon}
                        <p className="text-micro-label text-slate-400">{item.title}</p>
                     </div>
                     <div className="flex items-baseline gap-2">
                        <p className="text-secondary-value text-brand-black tabular">{item.value}</p>
                        {item.delta && <span className="text-micro-label text-emerald-500">{item.delta}</span>}
                     </div>
                  </div>
                ))}
             </div>
          </div>
      </div>

      <div className="bento-card overflow-hidden">
         <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
               <PieIcon className="h-4 w-4" />
            </div>
            <h3 className="text-section-label">VIII. ADS PERFORMANCE DASHBOARD</h3>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2">
               <Table>
                  <TableHeader className="bg-slate-50/50">
                     <TableRow className="hover:bg-transparent">
                        <TableHead className="text-table-header pl-8 py-4">Platform Identity</TableHead>
                        <TableHead className="text-table-header py-4">Total Spend</TableHead>
                        <TableHead className="text-table-header py-4 text-center">Leads</TableHead>
                        <TableHead className="text-table-header py-4 text-center">CPL Efficiency</TableHead>
                        <TableHead className="text-table-header py-4 text-right pr-8">Ad CPC</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {audit.platform_audit.map((p: { platform: string, spend: number, leads: number, cpl: number, cpc: number }) => (
                        <TableRow key={p.platform} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                           <TableCell className="pl-8 py-5 text-audit-body text-brand-black uppercase">{p.platform}</TableCell>
                           <TableCell className="text-audit-body text-brand-black tabular">IDR {p.spend.toLocaleString()}</TableCell>
                           <TableCell className="text-center text-audit-body text-brand-black tabular">{p.leads}</TableCell>
                           <TableCell className="text-center text-audit-body text-primary tabular">IDR {Math.round(p.cpl).toLocaleString()}</TableCell>
                           <TableCell className="text-right pr-8 text-audit-body text-slate-400 tabular">IDR {Math.round(p.cpc).toLocaleString()}</TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>
             <Suspense fallback={<ChartSkeleton height={350} />}>
                <LazyAdSpendPieChart data={audit.platform_audit} />
             </Suspense>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--card-gap)]">
         {audit.lead_ranking.map((rank: { source: string, count: number }, i: number) => (
             <div key={rank.source} className="bento-card p-[var(--card-px)] bento-card-hover flex items-center justify-between">
                <div>
                   <p className="text-section-label mb-2">{rank.source}</p>
                   <p className="text-primary-value text-brand-black tabular">{rank.count}</p>
                   <p className="text-micro-label text-primary mt-1">Verified Leads</p>
                </div>
                <div className={cn(
                   "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm",
                   i === 0 ? "bg-primary text-white" : "bg-slate-50 text-slate-300 border border-slate-100"
                )}>
                   {i === 0 ? <Zap className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                </div>
             </div>
         ))}
      </div>
    </div>
  );
}

