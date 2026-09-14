import React, { useState } from 'react';
import { Youtube } from '../utils/socialIcons';
import { 
  Play, 
  Clock, 
  Eye, 
  TrendingUp, 
  Target, 
  FlaskConical, 
  ExternalLink,
  Plus,
  Tv,
  Smartphone,
  Layers,
  Sparkles
} from 'lucide-react';
import { Brand, YouTubeReportData, SocialPost } from '../types';
import { formatNumber } from '../utils/helpers';

interface YouTubeSectionProps {
  brand?: Brand;
  brandName?: string;
  report?: YouTubeReportData;
  data?: YouTubeReportData;
  posts?: SocialPost[];
  period?: string;
  onNavigateToPlanner?: (channel?: string) => void;
  onOpenAddPostModal?: () => void;
  onViewPostDetail?: (post: SocialPost) => void;
}

export const YouTubeSection: React.FC<YouTubeSectionProps> = ({
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

  const [activeTab, setActiveTab] = useState<'overview' | 'videos'>('overview');

  const activeReportData = report || data;
  const youtubeData: YouTubeReportData = activeReportData || {
    subscribers: 8450,
    subsGained: 680,
    totalViews: 28400,
    watchTimeHours: 1420,
    avgViewDuration: '4:35',
    impressions: 215000,
    ctr: 7.8,
    leadsContributed: 64,
    sampleRequests: 21,
    trafficSources: [
      { source: 'YouTube Search (SEO Kata Kunci)', percentage: 46 },
      { source: 'Suggested Videos (Rekomendasi Algoritma)', percentage: 32 },
      { source: 'External / Website & WhatsApp', percentage: 14 },
      { source: 'Channel Pages & Others', percentage: 8 }
    ],
    topVideos: [
      {
        id: 'yt-1',
        title: 'Panduan Lengkap Maklon Skincare BPOM: Modal, Syarat & Tahapan Formulasi',
        format: 'Video',
        views: 14200,
        watchTimeHours: 890,
        ctr: 9.2,
        leadsContributed: 38,
        sampleRequests: 14
      },
      {
        id: 'yt-2',
        title: 'Bedah Formula Skincare Viral: Kenapa Kulit Malah Rusak & Iritasi?',
        format: 'Video',
        views: 8900,
        watchTimeHours: 410,
        ctr: 7.4,
        leadsContributed: 18,
        sampleRequests: 5
      },
      {
        id: 'yt-3',
        title: 'Cara Bedain Niacinamide Murni vs Campuran di Lab #Shorts',
        format: 'Shorts',
        views: 5300,
        watchTimeHours: 120,
        ctr: 6.8,
        leadsContributed: 8,
        sampleRequests: 2
      }
    ]
  };

  const youtubePosts = (posts || []).filter(p => 
    (p.brandId === currentBrandName || p.brandId === currentBrandId) &&
    (p.platform === 'YouTube' || p.format === 'Video' || p.format === 'Shorts')
  );

  return (
    <div className="space-y-6">
      {/* YOUTUBE HEADER */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 text-red-400 text-xs font-semibold border border-red-500/20">
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>YouTube Long-Form & Shorts Hub</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{currentBrandName}</span>
              <span className="text-red-400">YouTube Channel & Video Leads</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Pilar konten otoritas mendalam (deep educational content) untuk B2B Maklon kosmetik dan review formula dengan intent konversi tinggi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>YouTube Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'videos'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Video Planner & Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Views */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Channel Views</span>
            <Eye className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatNumber(youtubeData.totalViews)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Watch Time:</span>
            <strong className="text-slate-800">{youtubeData.watchTimeHours} Jam</strong>
          </div>
        </div>

        {/* Avg Duration & CTR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Avg Duration & CTR</span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {youtubeData.avgViewDuration}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Impression CTR:</span>
            <strong className="text-emerald-700">{youtubeData.ctr}%</strong>
          </div>
        </div>

        {/* Leads Contributed */}
        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-800">
            <span>Leads Contributed</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {formatNumber(youtubeData.leadsContributed)} <span className="text-xs font-semibold text-blue-600">Leads</span>
          </div>
          <div className="text-[11px] text-blue-800 mt-1 font-semibold">
            Form link & kontak deskripsi video
          </div>
        </div>

        {/* Sample Requests */}
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span>Sample Requests</span>
            <FlaskConical className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatNumber(youtubeData.sampleRequests)} <span className="text-xs font-semibold text-emerald-600">Samples</span>
          </div>
          <div className="text-[11px] text-emerald-800 mt-1 font-semibold">
            Permintaan formula dari penonton
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TOP VIDEOS TABLE (2 COLUMNS) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Play className="w-4 h-4 text-red-600" />
                <span>Video Performa Tertinggi & Konversi Leads</span>
              </h3>
              <span className="text-xs text-slate-400">Long-form & Shorts</span>
            </div>

            <div className="space-y-3">
              {youtubeData.topVideos.map(video => (
                <div key={video.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                      video.format === 'Shorts' ? 'bg-rose-100 text-rose-800' : 'bg-red-600 text-white'
                    }`}>
                      {video.format === 'Shorts' ? <Smartphone className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                      {video.format}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      CTR: <strong className="text-slate-800">{video.ctr}%</strong>
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">
                    {video.title}
                  </h4>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-200/60">
                    <div className="flex items-center gap-4 text-slate-600">
                      <span><strong>{formatNumber(video.views)}</strong> views</span>
                      <span><strong>{video.watchTimeHours}</strong> jam tonton</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        +{video.leadsContributed} Leads
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        +{video.sampleRequests} Samples
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TRAFFIC SOURCES BREAKDOWN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Distribusi Sumber Trafik Penonton
            </h3>
            <p className="text-xs text-slate-500">
              Bagaimana audiens menemukan konten YouTube brand Anda.
            </p>

            <div className="space-y-3 pt-2">
              {youtubeData.trafficSources.map((src, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{src.source}</span>
                    <span className="font-bold text-slate-900">{src.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-red-600' : idx === 1 ? 'bg-blue-600' : idx === 2 ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}
                      style={{ width: `${src.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl text-xs text-red-900 mt-4 leading-relaxed">
              💡 <strong>Insight YouTube:</strong> 46% trafik datang dari pencarian kata kunci organik maklon BPOM. CTA link di 3 baris pertama deskripsi menghasilkan 68% dari total leads YouTube.
            </div>
          </div>
        </div>
      ) : (
        /* VIDEO PLANNER & PRODUCTION QUEUE */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                YouTube Video Planner & Scripting Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                Jadwal video long-form dan Shorts lengkap dengan thumbnail konsep dan target leads.
              </p>
            </div>

            <button
              onClick={onOpenAddPostModal}
              className="px-3.5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-red-700 transition cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Video YouTube</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Judul Video</th>
                  <th className="py-3 px-3">Format</th>
                  <th className="py-3 px-3">PIC</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Target Leads</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {youtubePosts.length > 0 ? (
                  youtubePosts.map(post => (
                    <tr key={post.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        {post.date}
                      </td>
                      <td className="py-3 px-3 max-w-sm">
                        <div className="font-bold text-slate-900">{post.title}</div>
                        {post.hook && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                            &ldquo;{post.hook}&rdquo;
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          {post.format}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {post.pic}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          post.status === 'Published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {post.metrics?.leadsContributed ? `+${post.metrics.leadsContributed} Leads` : 'Target 10+'}
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
                      Belum ada video YouTube yang dijadwalkan dalam database. Klik tombol &ldquo;Jadwalkan Video YouTube&rdquo; untuk merencanakan konten baru.
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
