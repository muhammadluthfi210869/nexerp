import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  Bookmark, 
  Share2, 
  MessageCircle, 
  Flame, 
  Clock, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  RefreshCw,
  Sparkles,
  Zap,
  Globe,
  MapPin,
  Calendar
} from 'lucide-react';
import { 
  MetaInsightsSummary, 
  MetaDailyTrend, 
  DemographicData, 
  BestTimeSlot, 
  PostItem, 
  MetaAccountConfig 
} from '../../types';
import { formatNumber, formatDateIndonesian } from '../../utils/notionStyles';

interface MetaAnalyticsViewProps {
  insights: MetaInsightsSummary;
  dailyTrends: MetaDailyTrend[];
  demographics: DemographicData;
  bestTimeSlots: BestTimeSlot[];
  posts: PostItem[];
  metaAccount: MetaAccountConfig;
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
  onSyncMeta,
  isSyncing,
  onOpenPost,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedDay, setSelectedDay] = useState<string>('Kamis');

  // Filter published posts with performance
  const publishedPosts = posts
    .filter((p) => p.status === 'published' && p.performance)
    .sort((a, b) => (b.performance?.reach || 0) - (a.performance?.reach || 0));

  const maxDailyReach = Math.max(...dailyTrends.map((d) => d.reach), 1000);

  const activeSlot = bestTimeSlots.find((s) => s.day === selectedDay) || bestTimeSlots[0];

  return (
    <div className="w-full max-w-7xl pb-16 pt-2 space-y-8 font-sans">
      {/* Header Banner & Live Status */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Meta Business Suite API v19.0
              </span>
              <span className="text-xs text-blue-100">{metaAccount.igUsername} ({metaAccount.pageName})</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold">Meta Performance Tracker & Insights</h2>
            <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-xl">
              Lacak pertumbuhan jangkauan, interaksi Reels & Carousel, demografi audiens, serta prime-time posting secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-xs">
              <span className="text-blue-200 block text-[10px]">Total Followers:</span>
              <span className="font-bold text-sm font-mono">
                {formatNumber(metaAccount.igFollowersCount + metaAccount.followersCount)}
              </span>
            </div>

            <button
              onClick={onSyncMeta}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-white text-blue-800 hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg text-xs shadow-md transition cursor-pointer disabled:opacity-75"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sync Data Meta'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Reach */}
        <div className="bg-white dark:bg-[#202020] rounded-lg p-3 border border-[#ececec] dark:border-[#2f2f2f] shadow-xs">
          <div className="flex items-center justify-between text-[#787774] dark:text-[#909090] mb-1">
            <span className="text-xs">Accounts Reached</span>
            <Eye className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold font-mono text-[#37352f] dark:text-white">
              {formatNumber(insights.totalReach)}
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{insights.reachGrowthPercent}%</span>
            </div>
          </div>
          <p className="text-[10px] text-[#787774] mt-0.5">vs last 30 days</p>
        </div>

        {/* Total Impressions */}
        <div className="bg-white dark:bg-[#202020] rounded-lg p-3 border border-[#ececec] dark:border-[#2f2f2f] shadow-xs">
          <div className="flex items-center justify-between text-[#787774] dark:text-[#909090] mb-1">
            <span className="text-xs">Total Impressions</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold font-mono text-[#37352f] dark:text-white">
              {formatNumber(insights.impressions)}
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{insights.impressionsGrowthPercent}%</span>
            </div>
          </div>
          <p className="text-[10px] text-[#787774] mt-0.5">Avg freq: 1.5x</p>
        </div>

        {/* Average Engagement Rate */}
        <div className="bg-white dark:bg-[#202020] rounded-lg p-3 border border-[#ececec] dark:border-[#2f2f2f] shadow-xs">
          <div className="flex items-center justify-between text-[#787774] dark:text-[#909090] mb-1">
            <span className="text-xs">Avg Engagement</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold font-mono text-[#37352f] dark:text-white">
              {insights.engagementRate}%
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{insights.engagementGrowthPercent}%</span>
            </div>
          </div>
          <p className="text-[10px] text-[#787774] mt-0.5">Industry top &gt;5%</p>
        </div>

        {/* Net Followers Gain */}
        <div className="bg-white dark:bg-[#202020] rounded-lg p-3 border border-[#ececec] dark:border-[#2f2f2f] shadow-xs">
          <div className="flex items-center justify-between text-[#787774] dark:text-[#909090] mb-1">
            <span className="text-xs">Net Followers</span>
            <Users className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold font-mono text-[#37352f] dark:text-white">
              +{formatNumber(insights.netFollowers)}
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{insights.followersGrowthPercent}%</span>
            </div>
          </div>
          <p className="text-[10px] text-[#787774] mt-0.5">Profile conversion: 11.4%</p>
        </div>
      </div>

      {/* Main Charts Row: Daily Reach & Engagement Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Reach Trend (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#202020] rounded-xl p-5 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-sm font-bold text-[#37352f] dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span>Tren Jangkauan Harian Meta (Instagram vs Facebook)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Pertumbuhan akun terjangkau per hari</p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-pink-500" />
                <span className="text-zinc-600 dark:text-zinc-300">Instagram</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-zinc-600 dark:text-zinc-300">Facebook</span>
              </div>
            </div>
          </div>

          {/* Bar chart visualisation */}
          <div className="h-56 flex items-end gap-2 pt-6 pb-2">
            {dailyTrends.map((trend, idx) => {
              const heightPercent = Math.min(100, Math.round((trend.reach / maxDailyReach) * 100));
              const igPercent = Math.round((trend.instagramReach / trend.reach) * 100);
              const fbPercent = 100 - igPercent;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group/bar h-full justify-end">
                  <div className="opacity-0 group-hover/bar:opacity-100 transition absolute -top-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded pointer-events-none z-20 whitespace-nowrap">
                    {formatNumber(trend.reach)} reach ({trend.date.slice(5)})
                  </div>

                  {/* Stacked bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }} 
                    className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-300 hover:brightness-110"
                  >
                    <div style={{ height: `${fbPercent}%` }} className="bg-blue-500 w-full" />
                    <div style={{ height: `${igPercent}%` }} className="bg-pink-500 w-full" />
                  </div>

                  <span className="text-[9px] text-zinc-400 font-mono transform -rotate-45 sm:rotate-0 origin-center mt-1">
                    {trend.date.slice(8)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audience Breakdown (Instagram vs Facebook) */}
        <div className="bg-white dark:bg-[#202020] rounded-xl p-5 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#37352f] dark:text-white flex items-center gap-2 mb-1">
              <Share2 className="w-4 h-4 text-purple-500" />
              <span>Distribusi Channel Meta</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-5">Proporsi jangkauan dan interaksi akun</p>

            <div className="space-y-4">
              {/* Instagram */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-pink-600 dark:text-pink-400">Instagram (@brandstudio.id)</span>
                  <span className="font-mono">68.4%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full w-[68.4%]" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">224,500 reach • Reels & Carousels</p>
              </div>

              {/* Facebook */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-blue-600 dark:text-blue-400">Facebook Page</span>
                  <span className="font-mono">31.6%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[31.6%]" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">103,950 reach • Articles & Ads</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-xs mt-4">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insight AI Rekomendasi:</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
              Format Reels Instagram menghasilkan Save Rate 3.2x lebih tinggi dibanding Single Post. Pertahankan jadwal posting 4x seminggu.
            </p>
          </div>
        </div>
      </div>

      {/* Top Performing Content Leaderboard */}
      <div className="bg-white dark:bg-[#202020] rounded-xl p-5 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#37352f] dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Leaderboard Konten Terbaik Meta Suite</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Postingan dengan Reach & Engagement tertinggi</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-400 font-medium">
                <th className="py-2 px-3">Rank</th>
                <th className="py-2 px-3">Konten</th>
                <th className="py-2 px-3">Platform</th>
                <th className="py-2 px-3">Reach</th>
                <th className="py-2 px-3">Likes</th>
                <th className="py-2 px-3">Saves</th>
                <th className="py-2 px-3">Shares</th>
                <th className="py-2 px-3">Engagement</th>
                <th className="py-2 px-3">Virality Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {publishedPosts.map((post, idx) => {
                const perf = post.performance!;
                return (
                  <tr
                    key={post.id}
                    onClick={() => onOpenPost(post)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-3 font-bold font-mono text-zinc-500">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5 max-w-sm">
                        {post.coverImage && (
                          <img
                            src={post.coverImage}
                            alt="Cover"
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <span className="font-medium text-[#37352f] dark:text-zinc-200 truncate">
                          {post.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize text-zinc-600 dark:text-zinc-300 font-medium">
                        {post.platform} ({post.contentType})
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatNumber(perf.reach)}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-600 dark:text-zinc-300">
                      {formatNumber(perf.likes)}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-600 dark:text-zinc-300">
                      {formatNumber(perf.saves)}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-600 dark:text-zinc-300">
                      {formatNumber(perf.shares)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {perf.engagementRate}%
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        <Zap className="w-3 h-3 text-purple-500" />
                        {perf.viralityScore || 85}/100
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Columns: Best Posting Time Heatmap & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Posting Time Heatmap */}
        <div className="bg-white dark:bg-[#202020] rounded-xl p-5 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#37352f] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Prime Time Posting Meta (WIB)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Jam aktif audiens dengan interaksi tertinggi</p>
            </div>

            {/* Day Selector Tabs */}
            <div className="flex gap-1 overflow-x-auto">
              {bestTimeSlots.map((slot) => (
                <button
                  key={slot.day}
                  onClick={() => setSelectedDay(slot.day)}
                  className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer ${
                    selectedDay === slot.day
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  {slot.day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Scores for Selected Day */}
          <div className="space-y-2.5">
            {activeSlot.hourScores.map((h) => {
              const isPeak = h.score >= 90;
              return (
                <div key={h.hour} className="flex items-center gap-3 text-xs">
                  <span className="w-16 font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">
                    {String(h.hour).padStart(2, '0')}:00 WIB
                  </span>
                  
                  <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden relative">
                    <div
                      style={{ width: `${h.score}%` }}
                      className={`h-full rounded-md transition-all duration-300 ${
                        isPeak
                          ? 'bg-gradient-to-r from-amber-500 to-red-500'
                          : h.score >= 75
                          ? 'bg-blue-500'
                          : 'bg-zinc-400 dark:bg-zinc-600'
                      }`}
                    />
                    <div className="absolute inset-0 px-2 flex items-center justify-between text-[10px] font-semibold text-white mix-blend-difference">
                      <span>{h.label}</span>
                      <span>{h.score}% aktif</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-1.5">
            <span className="font-semibold text-amber-600 dark:text-amber-400">💡 Rekomendasi:</span>
            <span>Jadwalkan posting di hari {selectedDay} pukul 18:00 - 20:00 WIB untuk lonjakan reach awal.</span>
          </div>
        </div>

        {/* Demographics & Geographic Data */}
        <div className="bg-white dark:bg-[#202020] rounded-xl p-5 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[#37352f] dark:text-white flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>Demografi & Lokasi Audiens</span>
            </h3>
            <p className="text-xs text-zinc-400">Distribusi usia, gender, dan kota audiens di Meta</p>
          </div>

          {/* Age & Gender breakdown */}
          <div>
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex justify-between">
              <span>Rentang Usia:</span>
              <span className="text-purple-600 dark:text-purple-400">Mayoritas 25-34 Tahun (66%)</span>
            </div>
            <div className="space-y-1.5">
              {demographics.ageGender.map((ag) => (
                <div key={ag.group} className="flex items-center gap-3 text-xs">
                  <span className="w-12 text-zinc-500 font-mono text-[11px]">{ag.group}</span>
                  <div className="flex-1 h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                    <div style={{ width: `${ag.female}%` }} className="bg-pink-500 h-full" title={`Female: ${ag.female}%`} />
                    <div style={{ width: `${ag.male}%` }} className="bg-blue-500 h-full" title={`Male: ${ag.male}%`} />
                  </div>
                  <span className="w-14 text-right font-mono text-[10px] text-zinc-400">
                    {ag.male + ag.female}%
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 text-[10px] text-zinc-400 mt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500" /> Wanita</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Pria</span>
            </div>
          </div>

          {/* Top Indonesian Cities */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Kota Teratas (Indonesia):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demographics.topCities.map((city) => (
                <div key={city.city} className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded">
                  <span className="text-zinc-700 dark:text-zinc-300">{city.city}</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{city.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Month-over-Month (MoM) Historical Growth Table */}
      <div className="bg-white dark:bg-[#202020] rounded-xl p-5 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#37352f] dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Perbandingan Performa Bulan ke Bulan (Month-over-Month)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Analisis histori dan proyeksi pertumbuhan jangkauan dan engagement per bulan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg border border-[#ececec] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#252525]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#37352f] dark:text-white mb-2">
              <span>🗓️ Juli 2026</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-mono">Selesai</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Konten:</span>
                <span className="font-mono font-medium text-[#37352f] dark:text-white">2 post</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Total Reach:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">84,500</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Avg Engagement:</span>
                <span className="font-mono font-medium text-[#37352f] dark:text-white">5.4%</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border-2 border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs relative">
            <div className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
              Bulan Ini
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#37352f] dark:text-white mb-2">
              <span>🗓️ Agustus 2026</span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-1.5 py-0.2 rounded font-mono">Aktif</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Konten:</span>
                <span className="font-mono font-medium text-[#37352f] dark:text-white">10 post</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Total Reach:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">328,450 (+288%)</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Avg Engagement:</span>
                <span className="font-mono font-medium text-[#37352f] dark:text-white">6.8%</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-[#ececec] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#252525]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#37352f] dark:text-white mb-2">
              <span>🗓️ September 2026</span>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono">Scheduled</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Konten:</span>
                <span className="font-mono font-medium text-[#37352f] dark:text-white">5 post</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Target Reach:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">140,200</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Status:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">2 Ready, 2 Sched</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-[#ececec] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#252525]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#37352f] dark:text-white mb-2">
              <span>🗓️ Oktober 2026</span>
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.2 rounded font-mono">Drafting</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Konten:</span>
                <span className="font-mono font-medium text-[#37352f] dark:text-white">2 post</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Target Reach:</span>
                <span className="font-mono font-bold text-zinc-500">80,000</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Status:</span>
                <span className="font-mono text-zinc-500">Idea / Pipeline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
