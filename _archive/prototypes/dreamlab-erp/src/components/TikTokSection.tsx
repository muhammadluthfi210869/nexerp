import React, { useState } from 'react';
import { 
  Play, 
  TrendingUp, 
  Share2, 
  Bookmark, 
  Heart, 
  MessageCircle, 
  Users, 
  ExternalLink, 
  Music, 
  Target, 
  FlaskConical,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';
import { Brand, TikTokReportData, SocialPost } from '../types';
import { formatNumber } from '../utils/helpers';

interface TikTokSectionProps {
  brand?: Brand;
  brandName?: string;
  report?: TikTokReportData;
  data?: TikTokReportData;
  posts?: SocialPost[];
  period?: string;
  onNavigateToPlanner?: (channel?: string) => void;
  onOpenAddPostModal?: () => void;
  onViewPostDetail?: (post: SocialPost) => void;
}

export const TikTokSection: React.FC<TikTokSectionProps> = ({
  brand,
  brandName,
  report,
  data,
  posts = [],
  period,
  onNavigateToPlanner,
  onOpenAddPostModal,
  onViewPostDetail
}) => {
  const currentBrandName = brand?.name || brandName || 'Brand';
  const currentBrandId = brand?.id || currentBrandName;

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'planner'>('analytics');
  const [formatFilter, setFormatFilter] = useState<string>('All');

  // Filter TikTok posts
  const tiktokPosts = (posts || []).filter(p => 
    (p.brandId === currentBrandName || p.brandId === currentBrandId) &&
    (p.platform === 'TikTok' || p.format === 'TikTok' || p.format === 'Video' || p.format === 'Reels')
  );

  const filteredPosts = formatFilter === 'All' 
    ? tiktokPosts 
    : tiktokPosts.filter(p => p.targetAngle?.toLowerCase().includes(formatFilter.toLowerCase()) || p.format === formatFilter);

  // Fallback data if report isn't populated
  const activeReportData = report || data;
  const tiktokData: TikTokReportData = activeReportData || {
    followers: 12400,
    followersGained: 1850,
    totalViews: 94000,
    avgWatchRetention: 64.2,
    totalLikes: 6820,
    totalComments: 412,
    totalShares: 1380,
    totalSaves: 2490,
    profileVisits: 8450,
    bioLinkClicks: 1120,
    leadsContributed: 148,
    sampleRequests: 38,
    topVideos: [
      {
        id: 'tt-1',
        title: 'Bongkar Bahan Aktif Skincare Mahal vs Murah',
        hook: 'Kenapa serum seharga 500rb dan 50rb bisa punya formula yang hampir mirip?',
        views: 48500,
        likes: 3100,
        shares: 720,
        saves: 1450,
        retentionRate: 71.4,
        leadsContributed: 64,
        sampleRequests: 19
      },
      {
        id: 'tt-2',
        title: 'Proses Maklon Serum Niacinamide 10% di Laboratorium',
        hook: 'Ini alasan kenapa skincare lokal sekarang kualitasnya bisa kalahkan brand luar!',
        views: 28400,
        likes: 1980,
        shares: 410,
        saves: 680,
        retentionRate: 63.8,
        leadsContributed: 52,
        sampleRequests: 14
      },
      {
        id: 'tt-3',
        title: 'POV: Pertama kali coba bikin brand skincare sendiri',
        hook: 'Ternyata modal maklon skincare ga perlu milyaran, ini breakdown biayanya...',
        views: 17100,
        likes: 1740,
        shares: 250,
        saves: 360,
        retentionRate: 58.2,
        leadsContributed: 32,
        sampleRequests: 5
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* TIKTOK HEADER STATS */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-cyan-300 text-xs font-semibold border border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>TikTok Hub & Content Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{currentBrandName}</span>
              <span className="text-pink-400">TikTok Analytics & Planner</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Platform pertumbuhan viral, edukasi visual format pendek, dan konversi audiens ke leads WhatsApp & sample request form.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'analytics'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>TikTok Report</span>
            </button>
            <button
              onClick={() => setActiveSubTab('planner')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'planner'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>TikTok Content Planner</span>
            </button>
          </div>
        </div>
      </div>

      {/* KEY METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Views */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Video Views</span>
            <Play className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatNumber(tiktokData.totalViews)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">{tiktokData.avgWatchRetention}%</span>
            <span>Avg Retention Rate</span>
          </div>
        </div>

        {/* Bio Link & Profile Visits */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Profile & Bio Clicks</span>
            <ExternalLink className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatNumber(tiktokData.bioLinkClicks)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Dari {formatNumber(tiktokData.profileVisits)} Profile Visits
          </div>
        </div>

        {/* Leads Contributed (The Goal) */}
        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-800">
            <span>Leads Contributed</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {formatNumber(tiktokData.leadsContributed)} <span className="text-xs font-semibold text-blue-600">Leads</span>
          </div>
          <div className="text-[11px] text-blue-800 mt-1 font-semibold">
            Inquiries via TikTok Bio & DM
          </div>
        </div>

        {/* Sample Requests Sent */}
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span>Sample Requests</span>
            <FlaskConical className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatNumber(tiktokData.sampleRequests)} <span className="text-xs font-semibold text-emerald-600">Samples</span>
          </div>
          <div className="text-[11px] text-emerald-800 mt-1 font-semibold">
            Formula trial & kit dikirim
          </div>
        </div>
      </div>

      {activeSubTab === 'analytics' ? (
        /* ANALYTICS SUBTAB: TOP VIDEOS & AUDIENCE RETENTION */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>Top Performing TikTok Videos & Lead Drivers</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Diurutkan berdasarkan Leads Contributed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiktokData.topVideos.map((video, idx) => (
              <div key={video.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-cyan-300 text-xs font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {video.retentionRate}% Retention
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {video.title}
                  </h4>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                    &ldquo;{video.hook}&rdquo;
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1 text-slate-700">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-[10px] text-slate-400 font-medium">Views</div>
                      <div className="font-black text-xs">{formatNumber(video.views)}</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-[10px] text-slate-400 font-medium">Likes</div>
                      <div className="font-black text-xs">{formatNumber(video.likes)}</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <div className="text-[10px] text-slate-400 font-medium">Shares</div>
                      <div className="font-black text-xs">{formatNumber(video.shares)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    <Target className="w-3.5 h-3.5" />
                    <span>+{video.leadsContributed} Leads</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>+{video.sampleRequests} Samples</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* PLANNER SUBTAB: TIKTOK CONTENT PIPELINE */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                TikTok Content Planner & Production Queue
              </h3>
              <p className="text-xs text-slate-500">
                Jadwal video vertikal TikTok, hooks, audio referensi, dan target kontribusi leads.
              </p>
            </div>

            <button
              onClick={onOpenAddPostModal}
              className="px-3.5 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-pink-700 transition cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Konten TikTok</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Judul & Video Hook</th>
                  <th className="py-3 px-3">Format / Angle</th>
                  <th className="py-3 px-3">PIC</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Target Leads</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map(post => (
                    <tr key={post.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        {post.date}
                      </td>
                      <td className="py-3 px-3 max-w-sm">
                        <div className="font-bold text-slate-900">{post.title}</div>
                        {post.hook && (
                          <div className="text-[11px] text-pink-700/80 font-medium italic mt-0.5 truncate">
                            &ldquo;{post.hook}&rdquo;
                          </div>
                        )}
                        {post.soundTrend && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Music className="w-3 h-3" />
                            <span>Audio: {post.soundTrend}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {post.targetAngle || post.format}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {post.pic}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          post.status === 'Published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : post.status === 'Production'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {post.metrics?.leadsContributed ? `+${post.metrics.leadsContributed} Leads` : 'Target 15+'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onViewPostDetail?.(post)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada video TikTok yang dijadwalkan. Klik tombol &ldquo;Tambah Konten TikTok&rdquo; untuk memulai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
