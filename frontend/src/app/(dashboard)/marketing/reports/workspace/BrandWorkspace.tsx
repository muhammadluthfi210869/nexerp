"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Member, 
  Brand, 
  SocialPost, 
  BrandReport, 
  PostStatus,
  WeeklyReportData
} from './types';
import { 
  INITIAL_POSTS, 
  INITIAL_REPORTS 
} from './data/initialData';
import { useMarketingBrands, useMarketingMembers } from '@/hooks/useCanonicalMarketing';

import { ContentPlannerView } from './components/ContentPlannerView';
import { BrandReportingView, ReportTab } from './components/BrandReportingView';

import { 
  PostModal, 
  BrandModal, 
  ReportMetricModal, 
  PostDetailModal,
  PostMetricsModal
} from './components/Modals';
import { MonthlyStoriesModal } from './components/MonthlyStoriesModal';
import { WeeklyMetricModal } from './components/WeeklyMetricModal';

import { 
  BarChart3, 
  Video, 
  Globe, 
  Megaphone, 
  Calendar as CalendarIcon,
  ArrowLeft,
  CalendarDays,
  LineChart,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  Printer
} from 'lucide-react';
import { Instagram, Youtube } from './utils/socialIcons';

export type MainTab = 'executive' | 'instagram' | 'tiktok' | 'youtube' | 'website' | 'ads';
export type ChannelMode = 'planner' | 'report';

const TABS: Array<{ id: MainTab; label: string; icon: React.FC<{ className?: string }>; colorClass?: string }> = [
  { id: 'executive', label: 'Executive Summary', icon: BarChart3 },
  { id: 'instagram', label: 'Instagram', icon: Instagram, colorClass: 'text-pink-600' },
  { id: 'tiktok', label: 'TikTok', icon: Video, colorClass: 'text-cyan-500' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, colorClass: 'text-red-600' },
  { id: 'website', label: 'Website & SEO', icon: Globe, colorClass: 'text-emerald-600' },
  { id: 'ads', label: 'Paid Ads', icon: Megaphone, colorClass: 'text-amber-600' },
];

const AVAILABLE_MONTHS = [
  'September 2026',
  'Agustus 2026',
  'Juli 2026',
  'Juni 2026',
  'Mei 2026',
  'April 2026',
  'Maret 2026',
  'Februari 2026',
  'Januari 2026'
];

interface BrandWorkspaceProps {
  initialBrandSlug?: string;
  initialTab?: string;
  initialChannel?: string;
  initialMode?: 'planner' | 'report';
}

export default function BrandWorkspace({
  initialBrandSlug = 'dreamlab',
  initialTab = 'all',
  initialChannel,
  initialMode = 'planner'
}: BrandWorkspaceProps) {
  const router = useRouter();

  // Active brand resolution: "dreamlab" or "toribio"
  const isToribio = initialBrandSlug.toLowerCase().includes('toribio');
  const [activeBrandName, setActiveBrandName] = useState<'Dreamlab' | 'Toribio'>(
    isToribio ? 'Toribio' : 'Dreamlab'
  );

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    if (initialTab === 'all' || initialTab === 'funnel' || initialTab === 'executive') return 'executive';
    if (initialChannel) {
      const ch = initialChannel.toLowerCase();
      if (ch.includes('instagram')) return 'instagram';
      if (ch.includes('tiktok')) return 'tiktok';
      if (ch.includes('youtube')) return 'youtube';
      if (ch.includes('website')) return 'website';
      if (ch.includes('ads')) return 'ads';
    }
    return 'executive';
  });

  // Channel mode: 'planner' vs 'report' (default planner for channels)
  const [channelMode, setChannelMode] = useState<ChannelMode>(initialMode);

  // Month Period Selection
  const [selectedPeriod, setSelectedPeriod] = useState('September 2026');
  const periodIndex = AVAILABLE_MONTHS.indexOf(selectedPeriod);

  const handlePrevMonth = () => {
    if (periodIndex < AVAILABLE_MONTHS.length - 1) {
      setSelectedPeriod(AVAILABLE_MONTHS[periodIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    if (periodIndex > 0) {
      setSelectedPeriod(AVAILABLE_MONTHS[periodIndex - 1]);
    }
  };

  // Persistent Data States with localStorage
  // Wire members to canonical API (no local mutation — server-owned)
  // ponytail: hook returns canonical MarketingMember shape ({name, role, avatarBg, initial, department}); pass-through.
  const { data: membersData } = useMarketingMembers();
  const members: Member[] = useMemo(() => (membersData ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role || 'MEMBER',
    email: m.email,
    phone: m.phone ?? '',
    avatarBg: m.avatarBg ?? '#e8eef6',
    initial: (m.initial ?? m.name ?? '?').charAt(0).toUpperCase(),
    department: m.department ?? '',
  })), [membersData]);

  // Wire brands to canonical API (local mutation no-op until useCreateBrand hook lands)
  // ponytail: hook returns lean MarketingBrand shape ({code, accentToken}); richer fields stay empty.
  const { data: brandsData } = useMarketingBrands();
  const brands: Brand[] = useMemo(() => (brandsData ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    handle: b.handle ?? '',
    initial: b.code,
    color: b.accentToken ?? '#1264d3',
    primaryPlatform: b.primaryPlatform ?? '',
    pic: '',
    note: '',
  })), [brandsData]);
  // Stub setter — brand create UI disabled until backend mutation wired
  const setBrands = (_updater: Brand[] | ((prev: Brand[]) => Brand[])) => {
    // ponytail: brand mutation intentionally no-op pending useCreateBrand hook
  };

  const [posts, setPosts] = useState<SocialPost[]>(() => {
    if (typeof window === 'undefined') return INITIAL_POSTS;
    try {
      const saved = localStorage.getItem('dl_posts');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  const [reports, setReports] = useState<Record<string, BrandReport>>(() => {
    if (typeof window === 'undefined') return INITIAL_REPORTS;
    try {
      const saved = localStorage.getItem('dl_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: Record<string, BrandReport> = { ...INITIAL_REPORTS };
        Object.keys(parsed).forEach(k => {
          merged[k] = {
            ...(INITIAL_REPORTS[k] || {}),
            ...parsed[k],
            leadFunnels: parsed[k]?.leadFunnels || INITIAL_REPORTS[k]?.leadFunnels,
            tiktokReport: parsed[k]?.tiktokReport || INITIAL_REPORTS[k]?.tiktokReport,
            youtubeReport: parsed[k]?.youtubeReport || INITIAL_REPORTS[k]?.youtubeReport,
            websiteReport: parsed[k]?.websiteReport || INITIAL_REPORTS[k]?.websiteReport,
            metaAdsReport: parsed[k]?.metaAdsReport || INITIAL_REPORTS[k]?.metaAdsReport,
            googleAdsReport: parsed[k]?.googleAdsReport || INITIAL_REPORTS[k]?.googleAdsReport,
            storiesRecap: parsed[k]?.storiesRecap || INITIAL_REPORTS[k]?.storiesRecap
          };
        });
        return merged;
      }
    } catch (e) {
      console.warn('Failed to parse saved reports:', e);
    }
    return INITIAL_REPORTS;
  });

  // Save posts + reports to localStorage (brands now server-owned)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dl_posts', JSON.stringify(posts));
    }
  }, [posts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dl_reports', JSON.stringify(reports));
    }
  }, [reports]);

  // Modals state
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalInitialDate, setPostModalInitialDate] = useState<string | undefined>(undefined);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [postMetricsModalOpen, setPostMetricsModalOpen] = useState(false);
  const [postForMetrics, setPostForMetrics] = useState<SocialPost | null>(null);
  const [reportMetricModalOpen, setReportMetricModalOpen] = useState(false);
  const [reportMetricBrand, setReportMetricBrand] = useState<string>('Dreamlab');
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [monthlyStoriesModalOpen, setMonthlyStoriesModalOpen] = useState(false);
  const [weeklyMetricModalOpen, setWeeklyMetricModalOpen] = useState(false);
  const [editingWeeklyData, setEditingWeeklyData] = useState<WeeklyReportData | null>(null);

  const currentBrand = useMemo(() => {
    const target = (activeBrandName ?? '').toLowerCase();
    return (
      brands.find(b => (b.name ?? '').toLowerCase() === target) ||
      brands[0] || {
        id: 'b1',
        name: activeBrandName,
        handle: activeBrandName === 'Toribio' ? '@toribio.skincare' : '@dreamlab.workspace',
        initial: (activeBrandName ?? '?').charAt(0),
        color: activeBrandName === 'Toribio' ? '#ec4899' : '#1264d3',
        primaryPlatform: 'Instagram & TikTok',
        pic: 'Revita',
        note: 'Brand workspace.'
      }
    );
  }, [brands, activeBrandName]);

  const currentReportKey = `${(currentBrand.name ?? '').toLowerCase()}-${selectedPeriod.replace(/\s+/g, '-').toLowerCase()}`;
  const currentReport = reports[currentReportKey] || reports[(currentBrand.name ?? '').toLowerCase()];
  const previousReportKey = `${(currentBrand.name ?? '').toLowerCase()}-agustus-2026`;
  const previousReport = reports[previousReportKey];

  // Post handlers
  const handleSavePost = (postData: Omit<SocialPost, 'id'>) => {
    const newPost: SocialPost = {
      ...postData,
      id: `post-${Date.now()}`
    };
    setPosts(prev => [newPost, ...prev]);
    setPostModalOpen(false);
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setSelectedPost(null);
  };

  const handleUpdatePostStatus = (postId: string, status: PostStatus) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status } : p));
  };

  const handleUpdatePostProgress = (postId: string, progress: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, progress } : p));
  };

  // Metric update handler
  const handleSaveReportMetrics = (updatedReport: BrandReport) => {
    const brandKey = (updatedReport.brandId ?? '').toLowerCase();
    const key = `${brandKey}-${(updatedReport.monthYear || selectedPeriod).replace(/\s+/g, '-').toLowerCase()}`;
    setReports(prev => ({
      ...prev,
      [key]: updatedReport,
      [brandKey]: updatedReport
    }));
    setReportMetricModalOpen(false);
  };

  // Weekly update handler
  const handleSaveWeeklyMetric = (updatedWeekly: WeeklyReportData) => {
    if (!currentReport) return;
    const currentList = currentReport.weeklyReports || [];
    const index = currentList.findIndex(w => w.weekNumber === updatedWeekly.weekNumber);
    let newList: WeeklyReportData[];
    if (index !== -1) {
      newList = [...currentList];
      newList[index] = updatedWeekly;
    } else {
      newList = [...currentList, updatedWeekly];
    }
    const updated: BrandReport = {
      ...currentReport,
      weeklyReports: newList
    };
    handleSaveReportMetrics(updated);
    setWeeklyMetricModalOpen(false);
    setEditingWeeklyData(null);
  };

  // Print handler
  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // Channel mapping helpers
  const channelPlannerMap: Record<MainTab, string> = {
    executive: 'Instagram',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    website: 'Website',
    ads: 'Paid Ads'
  };

  const channelReportTabMap: Record<MainTab, ReportTab> = {
    executive: 'all',
    instagram: 'weekly',
    tiktok: 'tiktok',
    youtube: 'youtube',
    website: 'website',
    ads: 'ads'
  };

  return (
    <div className="w-full space-y-5">
      {/* 🏛️ LAYER 01: Ultra-Clean Un-boxed Header (Visual DNA Standard) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/marketing/management-task/overview"
            className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-decoration-none mb-1 w-fit transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Management Task
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] md:text-[32px] leading-[40px] font-bold text-slate-900 tracking-tight uppercase">
              {activeBrandName} — SOCIAL MEDIA &amp; PIPELINE
            </h1>
            {/* Quick Brand Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveBrandName('Dreamlab');
                  router.push('/marketing/reports/dreamlab');
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition ${
                  activeBrandName === 'Dreamlab'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dreamlab
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveBrandName('Toribio');
                  router.push('/marketing/reports/toribio');
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition ${
                  activeBrandName === 'Toribio'
                    ? 'bg-pink-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Toribio
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentBrand.handle} · Arsitektur pelacakan konversi berjenjang, perencanaan konten, dan analitik multi-kanal.
          </p>
        </div>

        {/* Global Toolbar: Month Nav, Update Metrik Bulanan, Print */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {/* Month Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs h-9">
            <button
              onClick={handlePrevMonth}
              disabled={periodIndex >= AVAILABLE_MONTHS.length - 1}
              className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 rounded-lg transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs font-semibold bg-transparent px-2 text-slate-800 focus:outline-none cursor-pointer"
            >
              {AVAILABLE_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m} {m === 'September 2026' ? '· (Aktif)' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleNextMonth}
              disabled={periodIndex <= 0}
              className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 rounded-lg transition"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setReportMetricBrand(currentBrand.name);
              setReportMetricModalOpen(true);
            }}
            className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Update Metrik Bulanan</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-9 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
            title="Cetak Ringkasan Laporan"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* 🏛️ LAYER 03: Bordered Tab Nav Container (Visual DNA Standard) */}
      <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-2xs h-[46px] flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-[38px] px-4 rounded-lg text-[12px] transition-all shrink-0 cursor-pointer border-none flex items-center gap-2 ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.colorClass || 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 🏛️ SUB-NAV MODE PILL (Shown for social media channels: Planner vs Report) */}
      {activeTab !== 'executive' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Mode Switcher Pill */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setChannelMode('planner')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                channelMode === 'planner'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Content Planner ({TABS.find(t => t.id === activeTab)?.label})</span>
            </button>
            <button
              type="button"
              onClick={() => setChannelMode('report')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                channelMode === 'report'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Performance Report ({TABS.find(t => t.id === activeTab)?.label})</span>
            </button>
          </div>

          {/* Quick Context Action */}
          <div className="flex items-center gap-2">
            {channelMode === 'planner' ? (
              <button
                onClick={() => {
                  setPostModalInitialDate(new Date().toISOString().split('T')[0]);
                  setPostModalOpen(true);
                }}
                className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Konten {TABS.find(t => t.id === activeTab)?.label}</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">
                Periode: <strong className="text-slate-800">{selectedPeriod}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 🏛️ MAIN CONTENT CONTAINER */}
      <div className="w-full">
        {/* 1. EXECUTIVE SUMMARY TAB (Gambar 1: Omni-Channel Funnel & All Overview) */}
        {activeTab === 'executive' && (
          <BrandReportingView
            brand={currentBrand}
            report={currentReport}
            previousReport={previousReport}
            posts={posts}
            currentPeriod={selectedPeriod}
            initialTab="all"
            hideHeader={true}
            onPeriodChange={setSelectedPeriod}
            onOpenReportMetricModal={(bName) => {
              setReportMetricBrand(bName);
              setReportMetricModalOpen(true);
            }}
            onOpenPostMetricsModal={(post) => {
              setPostForMetrics(post);
              setPostMetricsModalOpen(true);
            }}
            onOpenStoriesModal={() => setMonthlyStoriesModalOpen(true)}
            onSaveReportMetrics={handleSaveReportMetrics}
            onNavigateToPlanner={(ch) => {
              if (ch) {
                const lower = ch.toLowerCase();
                if (lower.includes('instagram')) setActiveTab('instagram');
                else if (lower.includes('tiktok')) setActiveTab('tiktok');
                else if (lower.includes('youtube')) setActiveTab('youtube');
                else if (lower.includes('website')) setActiveTab('website');
                else if (lower.includes('ads')) setActiveTab('ads');
              } else {
                setActiveTab('instagram');
              }
              setChannelMode('planner');
            }}
          />
        )}

        {/* 2. CHANNELS: PLANNER MODE (Gambar 3: Calendar & Database View, Status chips) */}
        {activeTab !== 'executive' && channelMode === 'planner' && (
          <ContentPlannerView
            brand={currentBrand}
            posts={posts}
            initialChannel={channelPlannerMap[activeTab]}
            onOpenAddPostModal={(initDate) => {
              setPostModalInitialDate(initDate);
              setPostModalOpen(true);
            }}
            onViewPostDetail={(post) => {
              setSelectedPost(post);
            }}
            onUpdatePostStatus={handleUpdatePostStatus}
            onUpdatePostProgress={handleUpdatePostProgress}
            onNavigateToReporting={() => {
              setChannelMode('report');
            }}
          />
        )}

        {/* 3. CHANNELS: REPORT MODE (Gambar 5: Weekly Report & Channel Analytics) */}
        {activeTab !== 'executive' && channelMode === 'report' && (
          <BrandReportingView
            brand={currentBrand}
            report={currentReport}
            previousReport={previousReport}
            posts={posts}
            currentPeriod={selectedPeriod}
            initialTab={channelReportTabMap[activeTab]}
            hideHeader={true}
            onPeriodChange={setSelectedPeriod}
            onOpenReportMetricModal={(bName) => {
              setReportMetricBrand(bName);
              setReportMetricModalOpen(true);
            }}
            onOpenPostMetricsModal={(post) => {
              setPostForMetrics(post);
              setPostMetricsModalOpen(true);
            }}
            onOpenStoriesModal={() => setMonthlyStoriesModalOpen(true)}
            onSaveReportMetrics={handleSaveReportMetrics}
            onNavigateToPlanner={() => {
              setChannelMode('planner');
            }}
          />
        )}
      </div>

      {/* 🏛️ MODALS (Matching Gambar 1, 2, 4) */}
      {/* 1. Tambah Konten & Creative Brief (Gambar 4) */}
      <PostModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSave={handleSavePost}
        brands={brands}
        members={members}
        initialBrand={currentBrand.name}
        initialDate={postModalInitialDate}
      />

      {/* 2. Detail Konten */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onDelete={handleDeletePost}
          onUpdateStatus={(id, status) => {
            handleUpdatePostStatus(id, status);
            setSelectedPost(prev => prev && prev.id === id ? { ...prev, status } : prev);
          }}
        />
      )}

      {/* 3. Update Metrik Bulanan (Gambar 2) */}
      <ReportMetricModal
        isOpen={reportMetricModalOpen}
        onClose={() => setReportMetricModalOpen(false)}
        brandName={reportMetricBrand}
        currentReport={currentReport}
        previousReport={previousReport}
        currentPeriod={selectedPeriod}
        onSave={handleSaveReportMetrics}
      />

      {/* 4. Edit Metrik Mingguan (Gambar 1 User Upload) */}
      {editingWeeklyData && (
        <WeeklyMetricModal
          isOpen={weeklyMetricModalOpen}
          onClose={() => {
            setWeeklyMetricModalOpen(false);
            setEditingWeeklyData(null);
          }}
          weekData={editingWeeklyData}
          brandName={currentBrand.name}
          currentPeriod={selectedPeriod}
          onSave={handleSaveWeeklyMetric}
        />
      )}

      {/* 5. Monthly Stories Modal */}
      {monthlyStoriesModalOpen && (
        <MonthlyStoriesModal
          isOpen={monthlyStoriesModalOpen}
          onClose={() => setMonthlyStoriesModalOpen(false)}
          brandName={currentBrand.name}
          monthYear={selectedPeriod}
          currentReport={currentReport}
          previousReport={previousReport}
          onSave={(totalStories, totalViews) => {
            if (!currentReport) return;
            const updated: BrandReport = {
              ...currentReport,
              storiesRecap: {
                ...(currentReport.storiesRecap || {
                  avgStoriesPerDay: 2,
                  completionRate: 80,
                  dailyStories: []
                }),
                totalStoriesCreated: totalStories,
                totalStoryViews: totalViews,
                avgViewsPerStory: totalStories > 0 ? Math.round(totalViews / totalStories) : 0
              }
            };
            handleSaveReportMetrics(updated);
            setMonthlyStoriesModalOpen(false);
          }}
        />
      )}

      {/* 6. Post Metrics Modal */}
      {postForMetrics && (
        <PostMetricsModal
          isOpen={postMetricsModalOpen}
          post={postForMetrics}
          onClose={() => {
            setPostMetricsModalOpen(false);
            setPostForMetrics(null);
          }}
          onSave={(postId, metrics, imgUrl) => {
            setPosts(prev => prev.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  metrics,
                  ...(imgUrl ? { imageUrl: imgUrl } : {})
                };
              }
              return p;
            }));
            setPostMetricsModalOpen(false);
            setPostForMetrics(null);
          }}
        />
      )}

      {/* 7. Brand Modal — disabled pending useCreateBrand hook */}
      <BrandModal
        isOpen={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        members={members}
        onSave={() => {
          // ponytail: brand mutation hook not yet exposed; UI save is no-op
          setBrandModalOpen(false);
        }}
      />
    </div>
  );
}
