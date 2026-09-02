'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Eye,
  Filter,
  FlaskConical,
  Globe,
  Share2,
  Target,
  TrendingUp,
  Trophy,
  Zap
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardCard } from '@/components/dna/DashboardCard';
import type { MarketingOverview } from '@/types/marketing-overview';
import { formatInteger, formatPercent } from '../lib/format';

export type PlatformChannel = {
  id: string;
  name: string;
  category: 'Paid Social' | 'Paid Search' | 'SEO Organic' | 'Organic Social' | 'Retention CRM';
  badgeColor: string;
  icon: any;
  spend: number;
  views: number;
  clicks: number;
  leads: number;
  sample: number;
  deal: number;
  cpm: string;
  cpc: string;
  cpl: string;
  cps: string;
  cac: string;
  isBottleneck?: boolean;
  isTopPerformer?: boolean;
};

const DEFAULT_PLATFORMS: PlatformChannel[] = [
  {
    id: 'meta-ads',
    name: 'Meta Ads',
    category: 'Paid Social',
    badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
    icon: Zap,
    spend: 150000000,
    views: 1250000,
    clicks: 30000,
    leads: 900,
    sample: 360,
    deal: 30,
    cpm: 'Rp 120k',
    cpc: 'Rp 5.0k',
    cpl: 'Rp 166k',
    cps: 'Rp 416k',
    cac: 'Rp 5.0M',
    isBottleneck: true,
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    category: 'Paid Search',
    badgeColor: 'bg-amber-50 text-amber-600 border-amber-200',
    icon: Filter,
    spend: 100000000,
    views: 450000,
    clicks: 21600,
    leads: 300,
    sample: 75,
    deal: 8,
    cpm: 'Rp 220k',
    cpc: 'Rp 4.6k',
    cpl: 'Rp 330k',
    cps: 'Rp 1.3M',
    cac: 'Rp 12.5M',
  },
  {
    id: 'google-organic',
    name: 'Google Organic',
    category: 'SEO Organic',
    badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    icon: Globe,
    spend: 0,
    views: 180000,
    clicks: 9900,
    leads: 198,
    sample: 59,
    deal: 3,
    cpm: 'Gratis',
    cpc: 'Gratis',
    cpl: 'Gratis',
    cps: 'Gratis',
    cac: 'Gratis',
  },
  {
    id: 'organic-social',
    name: 'Organic Social (IG & TikTok)',
    category: 'Organic Social',
    badgeColor: 'bg-pink-50 text-pink-600 border-pink-200',
    icon: Share2,
    spend: 0,
    views: 850000,
    clicks: 15300,
    leads: 183,
    sample: 40,
    deal: 1,
    cpm: 'Viral',
    cpc: 'Organic',
    cpl: 'Gratis',
    cps: 'Gratis',
    cac: 'Gratis',
  },
  {
    id: 'database-crm',
    name: 'Database / CRM (WA & Email)',
    category: 'Retention CRM',
    badgeColor: 'bg-purple-50 text-purple-600 border-purple-200',
    icon: Database,
    spend: 12500000,
    views: 25000,
    clicks: 3000,
    leads: 150,
    sample: 75,
    deal: 15,
    cpm: 'Rp 500k',
    cpc: 'Rp 4.1k',
    cpl: 'Rp 83k',
    cps: 'Rp 166k',
    cac: 'Rp 833k',
    isTopPerformer: true,
  },
];

const COLORS = { Organic: 'var(--status-success)', Ads: 'var(--status-action)' } as const;

const metric = (value: unknown) => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
};

const rate = (current: number, previous: number) => (previous ? current / previous : 0);

/**
 * Option A: Horizontal Comparative Funnel Matrix Component
 */
function OptionAFunnelMatrix({ platforms }: { platforms: PlatformChannel[] }) {
  const [viewMode, setViewMode] = useState<'all' | 'convOnly'>('all');

  const totalViews = platforms.reduce((acc, p) => acc + p.views, 0);
  const totalClicks = platforms.reduce((acc, p) => acc + p.clicks, 0);
  const totalLeads = platforms.reduce((acc, p) => acc + p.leads, 0);
  const totalSample = platforms.reduce((acc, p) => acc + p.sample, 0);
  const totalDeal = platforms.reduce((acc, p) => acc + p.deal, 0);

  const blendedConv1 = rate(totalClicks, totalViews);
  const blendedConv2 = rate(totalLeads, totalClicks);
  const blendedConv3 = rate(totalSample, totalLeads);
  const blendedConv4 = rate(totalDeal, totalSample);

  return (
    <DashboardCard className="overflow-hidden p-0 border border-[var(--border-color)]">
      {/* Header section */}
      <div className="flex flex-col gap-4 border-b border-[var(--gray-100)] bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 items-center rounded-lg bg-[var(--insight-action-bg)] px-2.5 text-[10px] font-black uppercase tracking-wider text-[var(--status-action)]">
              OPTI A — ZERO CLICK MATRIX
            </span>
            <h2 className="text-base font-extrabold text-[var(--gray-900)]">
              Multi-Platform Funnel Performance & Audit
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Perbandingan alur 5 stage dari Impression hingga Deal Production lintas 5 channel utama.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-[var(--gray-100)] p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`rounded-lg px-3 py-1.5 transition ${
                viewMode === 'all'
                  ? 'bg-white text-[var(--gray-900)] shadow-xs font-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--gray-900)]'
              }`}
            >
              Semua Metric & Costs
            </button>
            <button
              type="button"
              onClick={() => setViewMode('convOnly')}
              className={`rounded-lg px-3 py-1.5 transition ${
                viewMode === 'convOnly'
                  ? 'bg-white text-[var(--gray-900)] shadow-xs font-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--gray-900)]'
              }`}
            >
              Fokus Konversi (%)
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Audit Summary Bar */}
      <div className="flex flex-col gap-3 bg-[var(--gray-50)] px-6 py-3 border-b border-[var(--gray-100)] text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-700">
            <AlertTriangle className="h-3 w-3" /> BOTTLENECK AUDIT
          </span>
          <span className="font-medium text-[var(--gray-900)]">
            Meta Ads mengalami drop terbesar di stage <strong className="font-extrabold">Leads → Sample (Drop 60.0%)</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
            <Trophy className="h-3 w-3" /> TOP PERFORMER
          </span>
          <span className="font-medium text-[var(--gray-900)]">
            Database CRM menghasilkan <strong className="font-extrabold">Deal Win Rate tertinggi (20.0%)</strong> dengan CAC terendah.
          </span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead className="bg-[var(--gray-50)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--gray-500)] border-b border-[var(--gray-100)]">
            <tr>
              <th scope="col" className="px-6 py-3.5 w-48">Platform Channel</th>
              <th scope="col" className="px-4 py-3.5 text-right">1. Impression & Views</th>
              <th scope="col" className="px-2 py-3.5 text-center bg-blue-50/50 text-blue-700">Impr ➔ Click</th>
              <th scope="col" className="px-4 py-3.5 text-right">2. Clicks & Visits</th>
              <th scope="col" className="px-2 py-3.5 text-center bg-purple-50/50 text-purple-700">Click ➔ Lead</th>
              <th scope="col" className="px-4 py-3.5 text-right">3. Leads Qualified</th>
              <th scope="col" className="px-2 py-3.5 text-center bg-amber-50/50 text-amber-700">Lead ➔ Sample</th>
              <th scope="col" className="px-4 py-3.5 text-right">4. Sample Pitched</th>
              <th scope="col" className="px-2 py-3.5 text-center bg-emerald-50/50 text-emerald-700">Sample ➔ Deal</th>
              <th scope="col" className="px-6 py-3.5 text-right">5. Deal Production</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gray-100)] text-xs">
            {platforms.map((p) => {
              const Icon = p.icon;
              const conv1 = rate(p.clicks, p.views);
              const conv2 = rate(p.leads, p.clicks);
              const conv3 = rate(p.sample, p.leads);
              const conv4 = rate(p.deal, p.sample);

              return (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <th scope="row" className="px-6 py-4 font-bold text-[var(--gray-900)]">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${p.badgeColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm">{p.name}</span>
                          {p.isBottleneck && (
                            <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[9px] font-black text-rose-700">
                              Bottleneck
                            </span>
                          )}
                          {p.isTopPerformer && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black text-emerald-700">
                              Top ROI
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">
                          {p.category}
                        </span>
                      </div>
                    </div>
                  </th>

                  <td className="px-4 py-4 text-right align-middle">
                    <p className="font-extrabold text-sm text-[var(--gray-900)] tabular-nums">
                      {formatInteger(p.views)}
                    </p>
                    {viewMode === 'all' && (
                      <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                        CPM: {p.cpm}
                      </p>
                    )}
                  </td>

                  <td className="px-2 py-4 text-center align-middle bg-blue-50/20">
                    <span className="inline-flex flex-col items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700 border border-blue-100 tabular-nums">
                      <span>{formatPercent(conv1)}</span>
                      <span className="text-[9px] font-medium text-blue-500">
                        Drop {formatPercent(1 - conv1)}
                      </span>
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right align-middle">
                    <p className="font-extrabold text-sm text-[var(--gray-900)] tabular-nums">
                      {formatInteger(p.clicks)}
                    </p>
                    {viewMode === 'all' && (
                      <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                        CPC: {p.cpc}
                      </p>
                    )}
                  </td>

                  <td className="px-2 py-4 text-center align-middle bg-purple-50/20">
                    <span className="inline-flex flex-col items-center rounded-md bg-purple-50 px-2 py-1 text-[10px] font-black text-purple-700 border border-purple-100 tabular-nums">
                      <span>{formatPercent(conv2)}</span>
                      <span className="text-[9px] font-medium text-purple-500">
                        Drop {formatPercent(1 - conv2)}
                      </span>
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right align-middle">
                    <p className="font-extrabold text-sm text-[var(--gray-900)] tabular-nums">
                      {formatInteger(p.leads)}
                    </p>
                    {viewMode === 'all' && (
                      <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                        CPL: {p.cpl}
                      </p>
                    )}
                  </td>

                  <td className="px-2 py-4 text-center align-middle bg-amber-50/20">
                    <span className={`inline-flex flex-col items-center rounded-md px-2 py-1 text-[10px] font-black border tabular-nums ${
                      conv3 < 0.3 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      <span>{formatPercent(conv3)}</span>
                      <span className="text-[9px] font-medium opacity-80">
                        Drop {formatPercent(1 - conv3)}
                      </span>
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right align-middle">
                    <p className="font-extrabold text-sm text-[var(--gray-900)] tabular-nums">
                      {formatInteger(p.sample)}
                    </p>
                    {viewMode === 'all' && (
                      <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                        CPS: {p.cps}
                      </p>
                    )}
                  </td>

                  <td className="px-2 py-4 text-center align-middle bg-emerald-50/20">
                    <span className={`inline-flex flex-col items-center rounded-md px-2 py-1 text-[10px] font-black border tabular-nums ${
                      conv4 > 0.15 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      <span>{formatPercent(conv4)}</span>
                      <span className="text-[9px] font-medium text-emerald-600">
                        Drop {formatPercent(1 - conv4)}
                      </span>
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right align-middle bg-emerald-50/10">
                    <p className="font-black text-base text-[var(--status-success)] tabular-nums">
                      {formatInteger(p.deal)} Deals
                    </p>
                    {viewMode === 'all' && (
                      <p className="text-[10px] font-extrabold text-[var(--gray-900)]">
                        CAC: {p.cac}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot className="bg-[var(--gray-900)] text-white font-extrabold">
            <tr>
              <td className="px-6 py-4 text-sm font-black tracking-wider">
                📊 BLENDED TOTAL (ALL PLATFORMS)
              </td>
              <td className="px-4 py-4 text-right tabular-nums text-sm">
                {formatInteger(totalViews)}
              </td>
              <td className="px-2 py-4 text-center text-xs bg-slate-800 text-blue-300">
                {formatPercent(blendedConv1)}
              </td>
              <td className="px-4 py-4 text-right tabular-nums text-sm">
                {formatInteger(totalClicks)}
              </td>
              <td className="px-2 py-4 text-center text-xs bg-slate-800 text-purple-300">
                {formatPercent(blendedConv2)}
              </td>
              <td className="px-4 py-4 text-right tabular-nums text-sm">
                {formatInteger(totalLeads)}
              </td>
              <td className="px-2 py-4 text-center text-xs bg-slate-800 text-amber-300">
                {formatPercent(blendedConv3)}
              </td>
              <td className="px-4 py-4 text-right tabular-nums text-sm">
                {formatInteger(totalSample)}
              </td>
              <td className="px-2 py-4 text-center text-xs bg-slate-800 text-emerald-300">
                {formatPercent(blendedConv4)}
              </td>
              <td className="px-6 py-4 text-right tabular-nums text-base text-[var(--status-success)] font-black">
                {formatInteger(totalDeal)} Deals
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </DashboardCard>
  );
}

export function ExecutiveFunnelOverview({ data }: { data: MarketingOverview }) {
  const apiRows = (data.channels ?? []).map((source: any): PlatformChannel | null => {
    const m = source.metrics;
    const views = metric(m.views ?? m.impressions);
    const clicks = metric(m.clicks ?? m.engagement);
    const leads = metric(m.leads ?? m.lead);
    const sample = metric(m.sample ?? m.samples);
    const deal = metric(m.deal ?? m.deals ?? m.won);
    if (!views && !clicks && !leads) return null;

    const channelName = source.channel || source.provider;
    const isAds = /ads|paid|meta/i.test(`${source.provider} ${channelName}`);
    return {
      id: channelName.toLowerCase().replace(/\s+/g, '-'),
      name: channelName,
      category: isAds ? 'Paid Social' : 'SEO Organic',
      badgeColor: isAds ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
      icon: isAds ? Zap : Globe,
      spend: 0,
      views,
      clicks,
      leads,
      sample,
      deal,
      cpm: 'N/A',
      cpc: 'N/A',
      cpl: 'N/A',
      cps: 'N/A',
      cac: 'N/A',
    };
  }).filter((row): row is PlatformChannel => row !== null);

  const platforms = apiRows.length >= 3 ? apiRows : DEFAULT_PLATFORMS;

  const totalViews = platforms.reduce((acc: number, p: PlatformChannel) => acc + p.views, 0);
  const totalSample = platforms.reduce((acc: number, p: PlatformChannel) => acc + p.sample, 0);
  const totalDeal = platforms.reduce((acc: number, p: PlatformChannel) => acc + p.deal, 0);
  const totalLeads = platforms.reduce((acc: number, p: PlatformChannel) => acc + p.leads, 0);

  const bestPlatform = [...platforms].sort((a, b) => rate(b.deal, b.leads) - rate(a.deal, a.leads))[0];

  const cards = [
    {
      label: 'Total views & Impressions',
      value: totalViews,
      note: `${formatPercent(rate(totalLeads, totalViews))} mengkonversi jadi lead`,
      icon: Eye,
      tone: 'bg-[var(--insight-action-bg)] text-[var(--status-action)]',
    },
    {
      label: 'Sample request',
      value: totalSample,
      note: `${formatPercent(rate(totalSample, totalLeads))} dari qualified leads`,
      icon: FlaskConical,
      tone: 'bg-violet-50 text-[var(--accent-purple)]',
    },
    {
      label: 'Deal selesai / Order',
      value: totalDeal,
      note: `Terbaik: ${bestPlatform.name} (${formatPercent(rate(bestPlatform.deal, bestPlatform.leads))} deal rate)`,
      icon: CheckCircle2,
      tone: 'bg-[var(--insight-success-bg)] text-[var(--status-success)]',
    },
  ];

  const stageComparison = [
    { stage: 'Views ➔ Clicks', Organic: 4.5, Ads: 2.4 },
    { stage: 'Clicks ➔ Leads', Organic: 2.0, Ads: 3.0 },
    { stage: 'Leads ➔ Sample', Organic: 30.0, Ads: 40.0 },
    { stage: 'Sample ➔ Deal', Organic: 5.1, Ads: 8.3 },
  ];

  const ranking = platforms
    .map((p: PlatformChannel) => ({ channel: p.name, conversion: Number((rate(p.deal, p.leads) * 100).toFixed(1)), isAds: p.category.includes('Paid') }))
    .sort((a: { conversion: number }, b: { conversion: number }) => b.conversion - a.conversion);

  return (
    <div className="space-y-[var(--section-gap)]">
      {/* 🚀 TOP SECTION: 3 EXECUTIVE KPI CARDS */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Tiga KPI eksekutif">
        {cards.map(({ label, value, note, icon: Icon, tone }) => (
          <DashboardCard key={label} className="min-h-[154px] p-5 sm:p-6" label={label}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-3xl font-extrabold tracking-tight tabular-nums text-[var(--gray-900)]">
                {formatInteger(value)}
              </p>
              <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">{note}</p>
          </DashboardCard>
        ))}
      </section>

      {/* 📈 MIDDLE SECTION: 2 ANALYTICS CHARTS */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2" aria-label="Grafik keputusan eksekutif">
        <DashboardCard className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[var(--gray-900)]">Efisiensi Funnel Stage (%)</h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                Persentase bertahan pada perpindahan tiap tahap (Organic vs Ads).
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--insight-success-bg)] text-[var(--status-success)]">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-5 h-64" aria-label="Grafik perbandingan konversi organic dan ads">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageComparison} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--gray-100)" strokeDasharray="4 4" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--gray-500)' }} />
                <YAxis unit="%" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--gray-500)' }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Bertahan']} contentStyle={{ borderRadius: 14, borderColor: 'var(--border-color)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Organic" fill={COLORS.Organic} radius={[5, 5, 0, 0]} />
                <Bar dataKey="Ads" fill={COLORS.Ads} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[var(--gray-900)]">Channel Terbaik untuk Deal</h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                Ranking persentase konversi Lead ➔ Deal Order.
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--insight-action-bg)] text-[var(--status-action)]">
              <Target className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-5 h-64" aria-label="Grafik ranking conversion channel">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} layout="vertical" margin={{ top: 8, right: 32, left: 16, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--gray-100)" strokeDasharray="4 4" />
                <XAxis type="number" unit="%" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--gray-500)' }} />
                <YAxis type="category" dataKey="channel" width={140} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--gray-500)' }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Lead → Deal Rate']} contentStyle={{ borderRadius: 14, borderColor: 'var(--border-color)', fontSize: 12 }} />
                <Bar dataKey="conversion" radius={[0, 5, 5, 0]}>
                  {ranking.map((row: { channel: string; isAds: boolean }) => (
                    <Cell key={row.channel} fill={row.isAds ? COLORS.Ads : COLORS.Organic} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </section>

      {/* 🎯 BOTTOM SECTION: OPTION A MULTI-PLATFORM FUNNEL MATRIX */}
      <OptionAFunnelMatrix platforms={platforms} />
    </div>
  );
}

