"use client";

// Brand overview: KPI grid + period selector + tabbed detail.
// /marketing/reports/[brand] (default landing, e.g. /marketing/reports/dreamlab)

import { useEffect, useState } from "react";
import { use } from "react";
import { ChevronLeft, ChevronRight, Users, Eye, TrendingUp, BarChart3, FileText, Sparkles, Target, DollarSign, Music2, MonitorPlay, Globe, Megaphone, Plus } from "lucide-react";
import { DnaButton, DnaKpiGrid, DnaPageContainer, DnaPageHeader, DnaTabNav, DnaEmptyState } from "@/components/dna";
import { marketingService, mockViewer } from "@/lib/services/marketing-service";
import type { BrandReport } from "@/types/marketing-api";

const AVAILABLE_MONTHS = [
  { key: "2026-09", label: "September 2026" },
  { key: "2026-08", label: "Agustus 2026" },
  { key: "2026-07", label: "Juli 2026" },
  { key: "2026-06", label: "Juni 2026" },
  { key: "2026-05", label: "Mei 2026" },
  { key: "2026-04", label: "April 2026" },
  { key: "2026-03", label: "Maret 2026" },
  { key: "2026-02", label: "Februari 2026" },
  { key: "2026-01", label: "Januari 2026" },
];

export default function BrandOverviewPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = use(params);
  const [report, setReport] = useState<BrandReport | null>(null);
  const [monthYear, setMonthYear] = useState("2026-09");
  const [tab, setTab] = useState<"all" | "weekly" | "stories" | "funnel" | "tiktok" | "youtube" | "website" | "ads">("all");

  const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
  const brandId = `brand-${brand}`;

  useEffect(() => {
    marketingService.getBrandReport(mockViewer, brandId, monthYear).then(setReport);
  }, [brandId, monthYear]);

  const goPrev = () => {
    const idx = AVAILABLE_MONTHS.findIndex((m) => m.key === monthYear);
    if (idx < AVAILABLE_MONTHS.length - 1) setMonthYear(AVAILABLE_MONTHS[idx + 1].key);
  };
  const goNext = () => {
    const idx = AVAILABLE_MONTHS.findIndex((m) => m.key === monthYear);
    if (idx > 0) setMonthYear(AVAILABLE_MONTHS[idx - 1].key);
  };

  const currentLabel = AVAILABLE_MONTHS.find((m) => m.key === monthYear)?.label ?? monthYear;

  const kpis = report?.kpis;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title={`BRAND REPORT — ${brandName.toUpperCase()}`}
        subtitle={`Monthly overview, weekly performance, dan lead funnel untuk brand ${brandName}.`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Bulan sebelumnya">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium min-w-[140px] text-center">{currentLabel}</span>
            <button onClick={goNext} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Bulan berikutnya">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        }
      />

      <DnaTabNav
        tabs={[
          { id: "all", label: "All Overview", icon: BarChart3 as any },
          { id: "weekly", label: "Weekly", icon: FileText as any },
          { id: "stories", label: "Stories", icon: Sparkles as any },
          { id: "funnel", label: "Funnel", icon: Target as any },
          { id: "tiktok", label: "TikTok", icon: Music2 as any },
          { id: "youtube", label: "YouTube", icon: MonitorPlay as any },
          { id: "website", label: "Website", icon: Globe as any },
          { id: "ads", label: "Ads", icon: Megaphone as any },
        ]}
        activeTab={tab}
        onChange={(id) => setTab(id as any)}
      />

      {tab === "all" && (
        <>
          {!report && <div className="text-sm text-slate-500">Memuat report…</div>}
          {report && kpis && (
            <>
              <h3 className="text-sm font-semibold text-slate-700 mt-4 mb-2">Follower</h3>
              <DnaKpiGrid
                items={[
                  { label: "Total Followers", value: kpis.totalFollowers.toLocaleString("id-ID"), variant: "blue", icon: <Users className="h-4 w-4" />, subtext: `+${kpis.followersGrowthPercent}% MoM` },
                  { label: "Gained", value: kpis.followersGained.toLocaleString("id-ID"), variant: "emerald", subtext: "Bulan ini" },
                  { label: "Unfollow", value: kpis.followersUnfollowed.toLocaleString("id-ID"), variant: "rose", subtext: "Bulan ini" },
                  { label: "Net Growth", value: kpis.followersNetGrowth.toLocaleString("id-ID"), variant: "emerald", subtext: `+${kpis.followersGrowthPercent}%` },
                ]}
              />
              <h3 className="text-sm font-semibold text-slate-700 mt-4 mb-2">Views & Reach</h3>
              <DnaKpiGrid
                items={[
                  { label: "Total Views", value: kpis.totalViews.toLocaleString("id-ID"), variant: "blue", icon: <Eye className="h-4 w-4" /> },
                  { label: "Avg / Post", value: kpis.averageViewsPerPost.toLocaleString("id-ID"), variant: "blue" },
                  { label: "Total Reach", value: kpis.totalReach.toLocaleString("id-ID"), variant: "amber", subtext: `+${kpis.reachGrowthPercent}% MoM` },
                  { label: "Impressions", value: kpis.totalImpressions.toLocaleString("id-ID"), variant: "amber" },
                ]}
              />
              <h3 className="text-sm font-semibold text-slate-700 mt-4 mb-2">Engagement</h3>
              <DnaKpiGrid
                items={[
                  { label: "Likes", value: kpis.totalLikes.toLocaleString("id-ID") },
                  { label: "Shares", value: kpis.totalShares.toLocaleString("id-ID") },
                  { label: "Comments", value: kpis.totalComments.toLocaleString("id-ID") },
                  { label: "Saves", value: kpis.totalSaves.toLocaleString("id-ID") },
                  { label: "ER%", value: `${kpis.engagementRate.toFixed(2)}%`, variant: "emerald", icon: <TrendingUp className="h-4 w-4" />, subtext: `+${kpis.engagementRateChange}% MoM` },
                ]}
              />

              {report.storiesRecap && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Stories Recap
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-slate-500">Total Stories</div>
                      <div className="text-2xl font-bold">{report.storiesRecap.totalStoriesCreated}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Total Story Views</div>
                      <div className="text-2xl font-bold">{report.storiesRecap.totalStoryViews.toLocaleString("id-ID")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Avg / Story</div>
                      <div className="text-2xl font-bold">{report.storiesRecap.avgViewsPerStory.toLocaleString("id-ID")}</div>
                    </div>
                  </div>
                </div>
              )}

              {report.executiveSummary && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Executive Summary</h3>
                  <p className="text-sm text-slate-600">{report.executiveSummary}</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "weekly" && <WeeklyTab brandId={brandId} monthYear={monthYear} />}
      {tab === "stories" && <StoriesTab report={report} />}
      {tab === "funnel" && <FunnelTab brandId={brandId} />}
      {tab === "tiktok" && <ChannelSection brandId={brandId} channel="TikTok" title="TikTok Analytics" />}
      {tab === "youtube" && <ChannelSection brandId={brandId} channel="YouTube" title="YouTube Analytics" />}
      {tab === "website" && <ChannelSection brandId={brandId} channel="Website" title="Website + SEO" />}
      {tab === "ads" && <ChannelSection brandId={brandId} channel="Paid Ads" title="Paid Ads Performance" />}
    </DnaPageContainer>
  );
}

function WeeklyTab({ brandId, monthYear }: { brandId: string; monthYear: string }) {
  const [weeks, setWeeks] = useState<any[]>([]);
  useEffect(() => {
    marketingService.listWeeklyReports(mockViewer, brandId, monthYear).then(setWeeks);
  }, [brandId, monthYear]);

  if (weeks.length === 0) return <DnaEmptyState title="Belum ada data weekly" description="Tambah post untuk generate weekly metrics." />;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mt-4">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">Minggu</th>
            <th className="text-left px-3 py-2 font-semibold">Date Range</th>
            <th className="text-right px-3 py-2 font-semibold">Followers +</th>
            <th className="text-right px-3 py-2 font-semibold">Views</th>
            <th className="text-right px-3 py-2 font-semibold">ER%</th>
            <th className="text-right px-3 py-2 font-semibold">Stories</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.id} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium">{w.weekLabel}</td>
              <td className="px-3 py-2 text-slate-600 text-xs">{w.dateRange}</td>
              <td className="px-3 py-2 text-right">+{w.followersGained.toLocaleString("id-ID")}</td>
              <td className="px-3 py-2 text-right">{w.views.toLocaleString("id-ID")}</td>
              <td className="px-3 py-2 text-right font-semibold text-emerald-700">{w.engagementRate.toFixed(2)}%</td>
              <td className="px-3 py-2 text-right">{w.storiesCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StoriesTab({ report }: { report: BrandReport | null }) {
  if (!report?.storiesRecap) return <DnaEmptyState title="Belum ada data stories" />;
  return (
    <div className="mt-4">
      <DnaKpiGrid
        items={[
          { label: "Total Stories Created", value: report.storiesRecap.totalStoriesCreated, variant: "blue" },
          { label: "Total Story Views", value: report.storiesRecap.totalStoryViews.toLocaleString("id-ID"), variant: "emerald" },
          { label: "Avg Views / Story", value: report.storiesRecap.avgViewsPerStory.toLocaleString("id-ID"), variant: "amber" },
        ]}
      />
    </div>
  );
}

function FunnelTab({ brandId }: { brandId: string }) {
  // Funnel viz — simple 3-stage hero + table (full DnaFunnel component in Phase 4)
  const channels = ["Instagram", "TikTok", "YouTube", "Website", "Meta Ads", "Google Ads"];
  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {["Traffic", "Prospects", "Goals Sample"].map((stage, i) => (
          <div key={stage} className={`rounded-xl p-5 text-white ${i === 0 ? "bg-blue-500" : i === 1 ? "bg-violet-500" : "bg-emerald-500"}`}>
            <div className="text-xs uppercase opacity-80">{stage}</div>
            <div className="text-3xl font-bold mt-1">{(i + 1) * 1200}</div>
            <div className="text-xs opacity-80 mt-1">leads</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Per-Channel Funnel (placeholder)
        </h3>
        <p className="text-xs text-slate-500">Full DnaFunnel viz + table landed in Phase 4 reporting deep.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {channels.map((c) => (
            <div key={c} className="flex items-center justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-700">{c}</span>
              <span className="text-slate-400">— (Phase 4)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChannelSection({ brandId, channel, title }: { brandId: string; channel: any; title: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    marketingService.listPosts(mockViewer, { brandId, channel, limit: 20 }).then((r) => setPosts(r.items));
  }, [brandId, channel]);

  const topPosts = [...posts].sort((a, b) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0)).slice(0, 5);
  const totalViews = posts.reduce((s: number, p: any) => s + (p.metrics?.views ?? 0), 0);
  const totalLeads = posts.reduce((s: number, p: any) => s + (p.metrics?.leadsContributed ?? 0), 0);
  const totalSamples = posts.reduce((s: number, p: any) => s + (p.metrics?.sampleRequests ?? 0), 0);
  const avgEr = posts.length > 0 ? posts.reduce((s: number, p: any) => s + (p.metrics?.engagementRate ?? 0), 0) / posts.length : 0;

  return (
    <div className="mt-4 space-y-4">
      <DnaKpiGrid
        items={[
          { label: "Total Views", value: totalViews.toLocaleString("id-ID"), variant: "blue" },
          { label: "Avg ER%", value: `${avgEr.toFixed(2)}%`, variant: "emerald" },
          { label: "Leads", value: totalLeads.toLocaleString("id-ID"), variant: "amber" },
          { label: "Sample Requests", value: totalSamples.toLocaleString("id-ID"), variant: "amber" },
        ]}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Content ({channel})</h3>
        {topPosts.length === 0 ? (
          <DnaEmptyState title="Belum ada content" description={`Tambah post ${channel} untuk mulai tracking.`} />
        ) : (
          <div className="space-y-2">
            {topPosts.map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                <div className="text-2xl font-bold text-slate-300 w-8">#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-xs text-slate-500">{p.date} · {p.format} · {p.status}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{(p.metrics?.views ?? 0).toLocaleString("id-ID")}</div>
                  <div className="text-xs text-slate-500">{(p.metrics?.engagementRate ?? 0).toFixed(2)}% ER</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">{channel} — Recent Activity</h3>
        <div className="space-y-1 text-sm">
          {posts.slice(0, 5).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between border-b border-slate-100 py-2">
              <span className="truncate flex-1">{p.title}</span>
              <span className="text-xs text-slate-500 ml-2">{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
