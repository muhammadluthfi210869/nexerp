'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Eye, 
  Filter, 
  Globe, 
  Grid, 
  Layers, 
  LayoutList, 
  Lock, 
  Search, 
  Share2, 
  Sparkles, 
  Table, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  X, 
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Bookmark,
  Zap,
  Activity,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { DnaBadge } from '@/components/dna/DnaBadge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { 
  initialPosts, 
  initialMetaInsights, 
  initialDailyTrends, 
  initialDemographics, 
  initialBestTimeSlots, 
  initialCampaignOkrs, 
  initialMetaAccount 
} from './mockData';

import { 
  PostItem, 
  PostStatus, 
  DatabaseViewType, 
  ViewFilter, 
  SocialPlatform, 
  ContentPillar 
} from './types';

export default function SocialTrackerClient() {
  const [activeView, setActiveView] = useState<DatabaseViewType>('table');
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [filter, setFilter] = useState<ViewFilter>({
    platform: 'all',
    status: 'all',
    pillar: 'all',
    search: '',
  });

  const posts = initialPosts;
  const insights = initialMetaInsights;
  const metaAccount = initialMetaAccount;
  const campaignOkrs = initialCampaignOkrs;
  const dailyTrends = initialDailyTrends;
  const demographics = initialDemographics;
  const bestTimeSlots = initialBestTimeSlots;

  const counts = {
    total: posts.length,
    ideas: posts.filter((p) => p.status === 'idea').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    published: posts.filter((p) => p.status === 'published').length,
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filter.platform && filter.platform !== 'all' && post.platform !== filter.platform) return false;
      if (filter.status && filter.status !== 'all' && post.status !== filter.status) return false;
      if (filter.pillar && filter.pillar !== 'all' && post.pillar !== filter.pillar) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const matchTitle = post.title.toLowerCase().includes(q);
        const matchCaption = post.caption?.toLowerCase().includes(q);
        const matchTags = post.hashtags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchCaption && !matchTags) return false;
      }
      return true;
    });
  }, [posts, filter]);

  const handleOpenPost = (post: PostItem) => {
    setSelectedPost(post);
    setIsDrawerOpen(true);
  };

  const getStatusBadge = (status: PostStatus) => {
    switch (status) {
      case 'published':
        return <DnaBadge status="success">PUBLISHED</DnaBadge>;
      case 'scheduled':
        return <DnaBadge status="info">SCHEDULED</DnaBadge>;
      case 'review':
        return <DnaBadge status="warning">IN REVIEW</DnaBadge>;
      case 'scripting':
        return <DnaBadge status="purple">SCRIPTING</DnaBadge>;
      case 'idea':
        return <DnaBadge status="default">IDEA</DnaBadge>;
      default:
        return <DnaBadge status="default">{status}</DnaBadge>;
    }
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'instagram':
        return <span className="text-pink-500 font-bold text-xs">IG</span>;
      case 'facebook':
        return <span className="text-blue-600 font-bold text-xs">FB</span>;
      case 'tiktok':
        return <span className="text-slate-900 dark:text-white font-bold text-xs">TK</span>;
      default:
        return <span className="text-slate-500 font-bold text-xs">{platform.slice(0, 2).toUpperCase()}</span>;
    }
  };

  return (
    <DashboardShell
      title="Social Media Content & Meta Analytics Tracker"
      subtitle="Notion-style Content Planner & Meta Suite Performance Insights (Read-Only Inspection Mode)"
    >
      <div className="space-y-5">
        {/* Top Read-Only Banner & Header Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                {metaAccount.pageName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {metaAccount.igUsername}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cross-Platform Content Repository & Realtime Meta Insights Benchmark
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 text-xs text-amber-300">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-[11px]">Mode Read-Only Aktif</span>
            <span className="text-[10px] text-slate-400 hidden md:inline">(Input & Edit Dibatasi)</span>
          </div>
        </div>

        {/* Compact Clean KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Konten</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">{counts.total}</h3>
              <p className="text-[10px] font-bold text-slate-400">{counts.published} Published</p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Terjadwal</p>
              <h3 className="text-xl sm:text-2xl font-black text-blue-600 tabular-nums">{counts.scheduled}</h3>
              <p className="text-[10px] font-bold text-blue-500">Scheduled Feed</p>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Reach Meta</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {(insights.totalReach / 1000).toFixed(1)}K
              </h3>
              <p className="text-[10px] font-bold text-emerald-600">+{insights.reachGrowthPercent}% vs bln lalu</p>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Avg Engagement</p>
              <h3 className="text-xl sm:text-2xl font-black text-purple-600 tabular-nums">{insights.engagementRate}%</h3>
              <p className="text-[10px] font-bold text-purple-500">+{insights.engagementGrowthPercent}% Growth</p>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Database View Switcher Tabs */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'table', label: 'Table', icon: Table },
              { id: 'board', label: 'Board', icon: Grid },
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
              { id: 'gallery', label: 'Gallery', icon: Layers },
              { id: 'list', label: 'List', icon: LayoutList },
              { id: 'meta_analytics', label: 'Meta Analytics', icon: BarChart3 },
              { id: 'campaign_okrs', label: 'Campaign OKRs', icon: TrendingUp },
              { id: 'api_hub', label: 'API Status', icon: Globe },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as DatabaseViewType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & Filters */}
          {['table', 'board', 'calendar', 'gallery', 'list'].includes(activeView) && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari postingan, hashtag..."
                  value={filter.search}
                  onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>

              <select
                value={filter.platform}
                onChange={(e) => setFilter((prev) => ({ ...prev, platform: e.target.value as any }))}
                className="h-8 px-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">Semua Platform</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
          )}
        </div>

        {/* ACTIVE VIEW CONTENT */}

        {/* 1. TABLE VIEW */}
        {activeView === 'table' && (
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Judul Konten</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Content Pillar</th>
                    <th className="p-3">Jadwal Publish</th>
                    <th className="p-3">Author</th>
                    <th className="p-3">Reach / Likes</th>
                    <th className="p-3 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      onClick={() => handleOpenPost(post)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                          {getPlatformIcon(post.platform)}
                          <span className="capitalize">{post.platform}</span>
                        </span>
                      </td>
                      <td className="p-3">{getStatusBadge(post.status)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {post.pillar}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">
                        {new Date(post.scheduledDate).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">{post.author.name}</td>
                      <td className="p-3">
                        {post.performance ? (
                          <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                            {(post.performance.reach / 1000).toFixed(1)}k / {post.performance.likes}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Belum tayang</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPost(post);
                          }}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspeksi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 2. BOARD VIEW */}
        {activeView === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto pb-3">
            {(['idea', 'scripting', 'review', 'scheduled', 'published'] as PostStatus[]).map((status) => {
              const statusPosts = filteredPosts.filter((p) => p.status === status);
              return (
                <div
                  key={status}
                  className="bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-600 dark:text-slate-400">
                      {statusPosts.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {statusPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleOpenPost(post)}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-extrabold uppercase text-slate-400">{post.platform}</span>
                          <span className="font-bold text-blue-600">{post.pillar}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                          {post.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-700/50">
                          <span className="font-medium">{post.author.name.split(' ')[0]}</span>
                          <span>{new Date(post.scheduledDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. CALENDAR VIEW */}
        {activeView === 'calendar' && (
          <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Kalender Publikasi Konten (Agustus - September 2026)
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Read-Only Grid</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-extrabold uppercase text-slate-400 pb-1">
              <div>Sen</div>
              <div>Sel</div>
              <div>Rab</div>
              <div>Kam</div>
              <div>Jum</div>
              <div>Sab</div>
              <div>Min</div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const dayStr = day < 10 ? `0${day}` : `${day}`;
                const dateKey = `2026-08-${dayStr}`;
                const dayPosts = filteredPosts.filter((p) => p.scheduledDate.startsWith(dateKey));

                return (
                  <div
                    key={day}
                    className="min-h-20 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <span className="font-bold text-[10px] text-slate-400 text-right">{day}</span>
                    <div className="space-y-1">
                      {dayPosts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleOpenPost(p)}
                          className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-[9px] font-bold text-blue-800 dark:text-blue-200 truncate cursor-pointer hover:underline"
                        >
                          {p.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 4. GALLERY VIEW */}
        {activeView === 'gallery' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                onClick={() => handleOpenPost(post)}
                className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all cursor-pointer flex flex-col shadow-sm"
              >
                {post.coverImage && (
                  <div className="h-36 w-full overflow-hidden relative">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(post.status)}
                    </div>
                  </div>
                )}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="uppercase font-extrabold text-blue-600">{post.platform}</span>
                      <span className="font-bold">{post.pillar}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                      {post.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-medium">{post.author.name}</span>
                    <span className="font-bold text-blue-600 hover:underline flex items-center gap-1 text-[10px]">
                      <Eye className="w-3 h-3" /> Detail
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 5. LIST VIEW */}
        {activeView === 'list' && (
          <div className="space-y-2.5">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                onClick={() => handleOpenPost(post)}
                className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-400 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(post.status)}
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase">{post.platform}</span>
                    <span className="text-[10px] text-slate-400 font-bold">• {post.pillar}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{post.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{post.caption}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-[11px] text-slate-500 hidden sm:block">
                    <div className="font-semibold">{post.author.name}</div>
                    <div className="text-[10px] text-slate-400">{new Date(post.scheduledDate).toLocaleDateString('id-ID')}</div>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Inspeksi
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 6. META ANALYTICS VIEW */}
        {activeView === 'meta_analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Impressions Suite</span>
                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {(insights.impressions / 1000).toFixed(1)}K
                </div>
                <span className="text-[10px] text-emerald-600 font-bold">+{insights.impressionsGrowthPercent}% M-o-M</span>
              </Card>
              <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Profil Visits</span>
                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {insights.profileVisits.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-emerald-600 font-bold">Net Followers: +{insights.netFollowers}</span>
              </Card>
              <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Website Clicks</span>
                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {insights.websiteClicks.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-blue-600 font-bold">Link CTR Tinggi</span>
              </Card>
              <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Reels Total Views</span>
                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {(insights.reelsViews / 1000).toFixed(1)}K
                </div>
                <span className="text-[10px] text-purple-600 font-bold">Format Video Utama</span>
              </Card>
            </div>

            {/* Demographics & Daily Trend */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" /> Demografi Audiens Meta
                </h3>
                <div className="space-y-2.5 text-xs">
                  {demographics.topCities.map((c) => (
                    <div key={c.city} className="space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span>{c.city}</span>
                        <span>{c.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${c.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Best Time Slots Publishing
                </h3>
                <div className="space-y-2.5 text-xs">
                  {bestTimeSlots.map((slot) => (
                    <div key={slot.day} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5">
                      <span className="font-extrabold text-[11px] text-slate-900 dark:text-slate-100">{slot.day}</span>
                      <div className="grid grid-cols-4 gap-2">
                        {slot.hourScores.map((h) => (
                          <div key={h.hour} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-center border text-[10px]">
                            <div className="font-extrabold text-blue-600">{h.hour}:00</div>
                            <div className="text-[9px] text-slate-400">{h.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 7. CAMPAIGN OKRS VIEW */}
        {activeView === 'campaign_okrs' && (
          <div className="space-y-3">
            {campaignOkrs.map((okr) => {
              const pct = Math.min(100, Math.round((okr.currentValue / okr.targetValue) * 100));
              return (
                <Card key={okr.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">{okr.targetMetric}</span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{okr.title}</h3>
                    </div>
                    <DnaBadge status={okr.status === 'on_track' ? 'success' : 'warning'}>
                      {okr.status.toUpperCase()}
                    </DnaBadge>
                  </div>
                  <p className="text-[11px] text-slate-500">{okr.objective}</p>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span>Progress: {okr.currentValue.toLocaleString('id-ID')} / {okr.targetValue.toLocaleString('id-ID')} {okr.unit}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 8. API HUB VIEW */}
        {activeView === 'api_hub' && (
          <Card className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Meta Graph API Integration Status</h3>
                  <p className="text-[11px] text-slate-500">Live API Connection & Permissions Readout</p>
                </div>
              </div>
              <DnaBadge status="success">CONNECTED & LIVE</DnaBadge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                <span className="font-extrabold text-[10px] uppercase text-slate-400">Facebook Page</span>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{metaAccount.pageName}</div>
                <div className="text-[10px] text-slate-500">Page ID: {metaAccount.pageId}</div>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                <span className="font-extrabold text-[10px] uppercase text-slate-400">Instagram Account</span>
                <div className="text-xs font-bold text-pink-600">{metaAccount.igUsername}</div>
                <div className="text-[10px] text-slate-500">Followers: {metaAccount.igFollowersCount.toLocaleString('id-ID')}</div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-extrabold text-[10px] uppercase text-slate-400">Active Meta Permissions:</span>
              <div className="flex flex-wrap gap-1.5">
                {metaAccount.permissions.map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* POST INSPECTION DRAWER (READ ONLY) */}
      {isDrawerOpen && selectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl p-5 overflow-y-auto space-y-5 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
            <div className="space-y-5">
              {/* Top Bar */}
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <DnaBadge status="default">READ-ONLY INSPECTION</DnaBadge>
                  {getStatusBadge(selectedPost.status)}
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cover & Title */}
              {selectedPost.coverImage && (
                <div className="h-40 w-full rounded-xl overflow-hidden">
                  <img src={selectedPost.coverImage} alt={selectedPost.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-extrabold text-blue-600 uppercase">
                  <span>{selectedPost.platform}</span>
                  <span>•</span>
                  <span>{selectedPost.pillar}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedPost.title}</h2>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Author:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{selectedPost.author.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Jadwal Publish:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    {new Date(selectedPost.scheduledDate).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Caption Copywriter:</span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-700/50">
                  {selectedPost.caption}
                </div>
              </div>

              {/* Hashtags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Hashtags:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedPost.hashtags.map((h) => (
                    <span key={h} className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 text-[10px] font-bold">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Checklist Produksi (Read-Only):</span>
                <div className="space-y-1 text-xs">
                  {selectedPost.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${item.done ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span className={item.done ? 'line-through text-slate-400 text-[11px]' : 'text-slate-700 dark:text-slate-300 text-[11px]'}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance if published */}
              {selectedPost.performance && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2">
                  <span className="text-[10px] font-extrabold text-blue-400 block uppercase tracking-wider">Live Meta Performance</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs font-black">{(selectedPost.performance.reach / 1000).toFixed(1)}K</div>
                      <div className="text-[9px] text-slate-400 uppercase">Reach</div>
                    </div>
                    <div>
                      <div className="text-xs font-black">{selectedPost.performance.likes}</div>
                      <div className="text-[9px] text-slate-400 uppercase">Likes</div>
                    </div>
                    <div>
                      <div className="text-xs font-black">{selectedPost.performance.engagementRate}%</div>
                      <div className="text-[9px] text-slate-400 uppercase">Engagement</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs"
              >
                Tutup Inspeksi
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
