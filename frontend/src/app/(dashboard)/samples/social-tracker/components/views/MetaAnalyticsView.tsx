import React from 'react';
import { BarChart3, Clock, Eye, RefreshCw, Users } from 'lucide-react';
import {
  BestTimeSlot,
  DemographicData,
  MetaAccountConfig,
  MetaDailyTrend,
  MetaInsightsSummary,
  PostItem,
} from '../../types';
import { formatNumber } from '../../utils/notionStyles';

interface MetaAnalyticsViewProps {
  insights: MetaInsightsSummary | null;
  dailyTrends: MetaDailyTrend[];
  demographics: DemographicData | null;
  bestTimeSlots: BestTimeSlot[];
  posts: PostItem[];
  metaAccount: MetaAccountConfig;
  syncedAt: string | null;
  onSyncMeta: () => void;
  isSyncing: boolean;
  onOpenPost: (post: PostItem) => void;
}

export const MetaAnalyticsView: React.FC<MetaAnalyticsViewProps> = ({
  insights,
  dailyTrends,
  demographics,
  bestTimeSlots,
  posts,
  metaAccount,
  syncedAt,
  onSyncMeta,
  isSyncing,
  onOpenPost,
}) => {
  if (!insights) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-amber-600" />
        <h2 className="mt-3 text-base font-bold text-amber-950">Belum ada analytics Meta terverifikasi</h2>
        <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-amber-800">
          Dashboard tidak menampilkan benchmark, cache browser, atau angka contoh. Hubungkan akun Meta dan lakukan sinkronisasi untuk memuat data API.
        </p>
        <button
          type="button"
          onClick={onSyncMeta}
          disabled={isSyncing || !metaAccount.accessToken}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-amber-700 px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Menyinkronkan…' : 'Sinkronkan Meta API'}
        </button>
      </div>
    );
  }

  const publishedPosts = posts
    .filter((post) => post.status === 'published' && post.performance)
    .sort((a, b) => (b.performance?.reach || 0) - (a.performance?.reach || 0));
  const maxDailyReach = Math.max(...dailyTrends.map((trend) => trend.reach), 1);
  const metrics = [
    { label: 'Reach', value: formatNumber(insights.totalReach), icon: Eye },
    { label: 'Impressions', value: formatNumber(insights.impressions), icon: BarChart3 },
    { label: 'Engagement', value: `${insights.engagementRate}%`, icon: Users },
    { label: 'Net Followers', value: formatNumber(insights.netFollowers), icon: Users },
  ];

  return (
    <div className="space-y-6 pb-16 pt-2">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="text-sm font-bold text-blue-950">Meta Analytics</div>
          <div className="mt-1 text-xs text-blue-800">
            Sumber: Meta Graph API{syncedAt ? ` • Sinkron terakhir ${new Date(syncedAt).toLocaleString('id-ID')}` : ''}
          </div>
        </div>
        <button type="button" onClick={onSyncMeta} disabled={isSyncing} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-4 text-xs font-semibold text-white disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          Sinkronkan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: MetricIcon }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-xs text-slate-500"><span>{label}</span><MetricIcon className="h-4 w-4" /></div>
            <div className="mt-2 text-xl font-bold tabular-nums text-slate-900">{value}</div>
            <div className="mt-1 text-[10px] text-slate-400">Meta Graph API</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Tren reach harian</h3>
        {dailyTrends.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">API belum menyediakan data tren untuk periode ini.</p>
        ) : (
          <div className="mt-4 flex h-52 items-end gap-2">
            {dailyTrends.map((trend) => (
              <div key={trend.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${trend.date}: ${trend.reach}`}>
                <div className="w-full max-w-8 rounded-t bg-blue-600" style={{ height: `${Math.max(2, (trend.reach / maxDailyReach) * 100)}%` }} />
                <span className="text-[9px] text-slate-400">{trend.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Users className="h-4 w-4" />Demografi</h3>
          {!demographics ? <p className="mt-3 text-xs text-slate-500">API belum menyediakan data demografi.</p> : (
            <div className="mt-3 space-y-2 text-xs text-slate-700">
              {demographics.topCities.map((city) => <div key={city.city} className="flex justify-between"><span>{city.city}</span><span>{city.percent}%</span></div>)}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Clock className="h-4 w-4" />Waktu posting terbaik</h3>
          {bestTimeSlots.length === 0 ? <p className="mt-3 text-xs text-slate-500">Belum dapat dihitung dari data API historis.</p> : (
            <div className="mt-3 space-y-2 text-xs text-slate-700">{bestTimeSlots.map((slot) => <div key={slot.day}>{slot.day}: {slot.hourScores.map((item) => `${item.hour}:00`).join(', ')}</div>)}</div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Konten dengan performa API</h3>
        {publishedPosts.length === 0 ? <p className="mt-3 text-xs text-slate-500">Belum ada post dengan metrik yang telah disinkronkan.</p> : (
          <div className="mt-3 divide-y divide-slate-100">{publishedPosts.map((post) => <button key={post.id} type="button" onClick={() => onOpenPost(post)} className="flex w-full justify-between py-3 text-left text-xs"><span>{post.title}</span><span className="tabular-nums">{formatNumber(post.performance?.reach || 0)} reach</span></button>)}</div>
        )}
      </div>
    </div>
  );
};
