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
  PostFormat,
  PostPlatform,
  WeeklyReportData,
  DailyStoryRecap
} from './types';
import { INITIAL_BRANDS, INITIAL_MEMBERS } from './data/initialData';
import { 
  createEmptyBrandReport,
  EMPTY_LEAD_FUNNELS, 
  EMPTY_TIKTOK_REPORT, 
  EMPTY_YOUTUBE_REPORT, 
  EMPTY_WEBSITE_REPORT, 
  EMPTY_META_ADS_REPORT, 
  EMPTY_GOOGLE_ADS_REPORT
} from './data/channelReportsData';

import { ContentPlannerView } from './components/ContentPlannerView';
import { BrandReportingView, ReportTab } from './components/BrandReportingView';
import { TikTokSection } from './components/TikTokSection';
import { YouTubeSection } from './components/YouTubeSection';
import { WebsiteSection } from './components/WebsiteSection';
import { PaidAdsSection } from './components/PaidAdsSection';
import { NurturingFunnelSection } from './components/NurturingFunnelSection';
import { StoriesRecapSection } from './components/StoriesRecapSection';
import { WeeklyReportingSection } from './components/WeeklyReportingSection';

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
  Calendar as CalendarIcon,
  ArrowLeft,
  CalendarDays,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  Printer,
  Sparkles,
  LayoutDashboard,
  Share2,
  FileSpreadsheet,
  Globe,
  Video,
  Megaphone,
  Target,
  BookOpen
} from 'lucide-react';
import { Instagram, Youtube } from './utils/socialIcons';
import { getPreviousMonth, parsePeriodDates, getWeekDates } from './utils/helpers';
import { useDnaToast } from '@/components/dna/DnaToast';
import { api } from '@/lib/api';

export type BrandWorkspaceTab = 
  | 'overview' 
  | 'instagram' 
  | 'tiktok' 
  | 'youtube' 
  | 'website' 
  | 'ads' 
  | 'funnel' 
  | 'stories';

export type ChannelViewMode = 'report' | 'planner';

export const BRAND_NAV_CHANNELS = [
  {
    id: 'overview' as BrandWorkspaceTab,
    label: 'Overview',
    icon: LayoutDashboard,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    desc: 'Executive Summary & Ringkasan Metrik Agregat',
    plannerChannel: 'All',
  },
  {
    id: 'instagram' as BrandWorkspaceTab,
    label: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    desc: 'Feed, Reels & Stories Performance & Konten',
    plannerChannel: 'Instagram',
  },
  {
    id: 'tiktok' as BrandWorkspaceTab,
    label: 'TikTok',
    icon: Video,
    color: 'text-cyan-500',
    bg: 'bg-slate-900 text-white',
    desc: 'Hooks, Sounds & Video Performance & Kalender Konten',
    plannerChannel: 'TikTok',
  },
  {
    id: 'youtube' as BrandWorkspaceTab,
    label: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    bg: 'bg-red-50',
    desc: 'Shorts & Masterclass Analytics & Jadwal Video',
    plannerChannel: 'YouTube',
  },
  {
    id: 'website' as BrandWorkspaceTab,
    label: 'Website & SEO',
    icon: Globe,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    desc: 'Organic Traffic, Queries, SERP & Tasks',
    plannerChannel: 'Website',
  },
  {
    id: 'ads' as BrandWorkspaceTab,
    label: 'Paid Ads',
    icon: Megaphone,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    desc: 'Meta Ads & Google Ads Performance & Campaign Planning',
    plannerChannel: 'Paid Ads',
  },
  {
    id: 'funnel' as BrandWorkspaceTab,
    label: 'Lead Funnel',
    icon: Target,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    desc: 'Leads Acquisition & Conversion Funnel Goals',
    plannerChannel: 'Instagram',
  },
  {
    id: 'stories' as BrandWorkspaceTab,
    label: 'Stories Recap',
    icon: BookOpen,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    desc: 'Daily & Monthly Stories Recap Archive',
    plannerChannel: 'Instagram',
  },
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
  initialMode?: string;
}

export default function BrandWorkspace({
  initialBrandSlug = 'dreamlab',
  initialTab = 'overview',
  initialChannel,
  initialMode
}: BrandWorkspaceProps) {
  const router = useRouter();
  const toast = useDnaToast();

  // Active brand resolution: "dreamlab" or "toribio"
  const isToribio = initialBrandSlug.toLowerCase().includes('toribio');
  const [activeBrandName, setActiveBrandName] = useState<'Dreamlab' | 'Toribio'>(
    isToribio ? 'Toribio' : 'Dreamlab'
  );

  // Sync activeBrandName if initialBrandSlug changes
  useEffect(() => {
    setActiveBrandName(initialBrandSlug.toLowerCase().includes('toribio') ? 'Toribio' : 'Dreamlab');
  }, [initialBrandSlug]);

  // Main Navbar Tab State: Overview, Instagram, TikTok, YouTube, Website & SEO, Paid Ads, Lead Funnel, Stories Recap
  const [activeTab, setActiveTab] = useState<BrandWorkspaceTab>(() => {
    if (initialChannel) {
      const ch = initialChannel.toLowerCase();
      if (ch.includes('tiktok')) return 'tiktok';
      if (ch.includes('youtube')) return 'youtube';
      if (ch.includes('web')) return 'website';
      if (ch.includes('ad')) return 'ads';
      if (ch.includes('funnel')) return 'funnel';
      if (ch.includes('stor')) return 'stories';
      if (ch.includes('insta')) return 'instagram';
    }
    if (initialTab) {
      const t = initialTab.toLowerCase();
      if (t === 'instagram' || t === 'tiktok' || t === 'youtube' || t === 'website' || t === 'ads' || t === 'funnel' || t === 'stories') {
        return t as BrandWorkspaceTab;
      }
    }
    return 'overview';
  });

  // Per-channel view mode: 'report' or 'planner'
  const [channelViewMode, setChannelViewMode] = useState<ChannelViewMode>(() => {
    if (initialMode === 'planner' || initialTab === 'planner') return 'planner';
    return 'report';
  });

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

  // Brands data
  const brands = INITIAL_BRANDS;
  const currentBrand: Brand = useMemo(() => {
    return (
      brands.find(b => b.name.toLowerCase() === activeBrandName.toLowerCase()) || {
        id: activeBrandName === 'Dreamlab' ? 'b1' : 'b2',
        name: activeBrandName,
        handle: activeBrandName === 'Dreamlab' ? '@dreamlab.workspace' : '@toribio.skincare',
        initial: activeBrandName.charAt(0),
        color: activeBrandName === 'Dreamlab' ? '#1264d3' : '#ec4899',
        primaryPlatform: activeBrandName === 'Dreamlab' ? 'Instagram & LinkedIn' : 'Instagram & TikTok',
        pic: activeBrandName === 'Dreamlab' ? 'Revita' : 'Gusti',
        note: activeBrandName === 'Dreamlab' 
          ? 'B2B Cosmetic R&D & Maklon formulation laboratory.'
          : 'B2C Skincare & Beauty brand focusing on skin barrier.',
      }
    );
  }, [brands, activeBrandName]);

  const currentChannelConfig = useMemo(() => {
    return BRAND_NAV_CHANNELS.find(c => c.id === activeTab) || BRAND_NAV_CHANNELS[0];
  }, [activeTab]);

  // Posts State loaded directly from database
  const [posts, setPosts] = useState<SocialPost[]>([]);

  // Reports State loaded directly from database
  const [reports, setReports] = useState<Record<string, BrandReport>>({});

  // Helper to map backend post to frontend SocialPost
  const mapApiSocialPost = (p: any): SocialPost => {
    const rawFormat = String(p.contentType || 'single_post').toLowerCase();
    const format: PostFormat =
      rawFormat === 'reel' ? 'Reels' :
      rawFormat === 'carousel' ? 'Carousel' :
      rawFormat === 'story' ? 'Story' :
      rawFormat === 'video' ? 'Video' : 'Single';

    const rawStatus = String(p.status || 'draft').toLowerCase();
    const status: PostStatus =
      rawStatus === 'published' ? 'Published' :
      rawStatus === 'review' || rawStatus === 'in_review' ? 'Review' :
      rawStatus === 'scripting' || rawStatus === 'production' ? 'Production' :
      rawStatus === 'draft' ? 'Draft' : 'Planning';

    const rawPlatform = String(p.platform || 'instagram').toLowerCase();
    const platform: PostPlatform =
      rawPlatform === 'tiktok' ? 'TikTok' :
      rawPlatform === 'youtube' ? 'YouTube' :
      rawPlatform === 'website' ? 'Website' :
      rawPlatform === 'linkedin' ? 'LinkedIn' :
      rawPlatform === 'ads' || rawPlatform === 'paid ads' || rawPlatform === 'facebook' ? 'Paid Ads' : 'Instagram';

    return {
      id: p.id,
      brandId: p.brand?.name || p.brandId || activeBrandName,
      platform,
      title: p.title || 'Untitled Post',
      date: p.scheduledDate ? p.scheduledDate.split('T')[0] : p.publishedDate ? p.publishedDate.split('T')[0] : new Date().toISOString().split('T')[0],
      format,
      status,
      pic: p.author?.name || p.assignee?.fullName || p.authorName || 'Gusti',
      progress: status === 'Published' ? 100 : (p.progress ?? 50),
      imageUrl: p.coverImage || p.mediaUrls?.[0] || undefined,
      hook: p.hooks?.[0] || undefined,
      caption: p.caption || undefined,
      brief: p.brief || p.notes || undefined,
      checklist: Array.isArray(p.checklist) ? p.checklist.map((c: any) => ({ id: c.id, text: c.text, done: Boolean(c.done) })) : [],
      metrics: p.performance ? {
        reach: Number(p.performance.reach || 0),
        views: Number(p.performance.videoViews || p.performance.impressions || 0),
        likes: Number(p.performance.likes || 0),
        comments: Number(p.performance.comments || 0),
        shares: Number(p.performance.shares || 0),
        saves: Number(p.performance.saves || 0),
        engagementRate: Number(p.performance.engagementRate || 0),
      } : undefined,
    };
  };

  // Load posts and reports from backend database on brand or period change
  useEffect(() => {
    let isMounted = true;

    async function loadBrandData() {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dl_posts');
          localStorage.removeItem('dl_reports');
        }

        const [postsRes, reportsRes] = await Promise.allSettled([
          api.get(`/marketing/social/posts?brand=${encodeURIComponent(activeBrandName)}&limit=200`),
          api.get(`/marketing/social/reports?brandId=${encodeURIComponent(activeBrandName)}`),
        ]);

        if (isMounted && postsRes.status === 'fulfilled') {
          const list = postsRes.value?.data?.data || postsRes.value?.data;
          if (Array.isArray(list)) {
            setPosts(list.map(mapApiSocialPost));
          }
        }

        if (isMounted && reportsRes.status === 'fulfilled') {
          const repList = reportsRes.value?.data?.data || reportsRes.value?.data;
          if (Array.isArray(repList) && repList.length > 0) {
            setReports(prev => {
              const updated = { ...prev };
              repList.forEach((rep: any) => {
                const periodLabel = rep.monthYear || selectedPeriod;
                const key = `${activeBrandName}__${periodLabel}`;
                const existing = updated[key] || createEmptyBrandReport(activeBrandName, periodLabel);
                const cm = Array.isArray(rep.channelMetrics) ? rep.channelMetrics : [];
                const totFollowers = cm.reduce((acc: number, c: any) => acc + Number(c.followersEnd || 0), 0);
                const totViews = cm.reduce((acc: number, c: any) => acc + Number(c.views || 0), 0);
                const totReach = cm.reduce((acc: number, c: any) => acc + Number(c.reach || 0), 0);
                const totImpressions = cm.reduce((acc: number, c: any) => acc + Number(c.impressions || 0), 0);
                const totLikes = cm.reduce((acc: number, c: any) => acc + Number(c.likes || 0), 0);
                const totComments = cm.reduce((acc: number, c: any) => acc + Number(c.comments || 0), 0);
                const totShares = cm.reduce((acc: number, c: any) => acc + Number(c.shares || 0), 0);
                const totSaves = cm.reduce((acc: number, c: any) => acc + Number(c.saves || 0), 0);
                const totGained = cm.reduce((acc: number, c: any) => acc + Math.max(0, Number(c.followersEnd || 0) - Number(c.followersStart || 0)), 0);
                const totUnfollowed = cm.reduce((acc: number, c: any) => acc + Math.max(0, Number(c.followersStart || 0) - Number(c.followersEnd || 0)), 0);
                const netGrowth = totGained - totUnfollowed;
                const totEngagements = totLikes + totComments + totShares + totSaves;
                const er = totReach > 0 ? Number(((totEngagements / totReach) * 100).toFixed(2)) : 0;

                const mappedWeekly = (existing.weeklyReports || []).map(w => {
                  const found = rep.weeklyReports?.find((rw: any) => rw.weekNumber === w.weekNumber);
                  if (!found) return w;
                  return {
                    ...w,
                    id: found.id,
                    startingFollowers: Number(found.followersStart || 0),
                    endingFollowers: Number(found.followersEnd || 0),
                    followersGained: Number(found.followersGained || 0),
                    followersUnfollowed: Number(found.followersLost || 0),
                    netGrowth: Number(found.followersGained || 0) - Number(found.followersLost || 0),
                    reach: Number(found.reach || 0),
                    views: Number(found.views || 0),
                    impressions: Number(found.impressions || 0),
                    totalEngagement: Number(found.totalEngagement || 0),
                    engagementRate: Number(found.reach) > 0 ? Number(((Number(found.totalEngagement) / Number(found.reach)) * 100).toFixed(2)) : 0,
                    storiesCount: Number(found.storiesCount || 0),
                    totalStoryViews: Number(found.storyViews || 0),
                    avgViewsPerStory: Number(found.storiesCount) > 0 ? Math.round(Number(found.storyViews) / Number(found.storiesCount)) : 0,
                    highlights: found.highlights || w.highlights,
                    notes: found.notes || w.notes,
                  };
                });

                const storyList = Array.isArray(rep.storyMetrics) ? rep.storyMetrics : [];
                const totStories = storyList.reduce((acc: number, s: any) => acc + Number(s.storiesCount || 0), 0);
                const totStoryViews = storyList.reduce((acc: number, s: any) => acc + Number(s.views || 0), 0);
                const avgStoryViews = totStories > 0 ? Math.round(totStoryViews / totStories) : 0;
                const storiesRecap = (totStories > 0 || totStoryViews > 0) ? {
                  ...(existing.storiesRecap || { completionRate: 80 }),
                  totalStoriesCreated: totStories,
                  totalStoryViews: totStoryViews,
                  avgViewsPerStory: avgStoryViews,
                } : existing.storiesRecap;

                const finalReport: BrandReport = {
                  ...existing,
                  totalFollowers: totFollowers,
                  followersGained: totGained,
                  followersUnfollowed: totUnfollowed,
                  followersNetGrowth: netGrowth,
                  totalViews: totViews,
                  totalReach: totReach,
                  totalImpressions: totImpressions,
                  totalLikes: totLikes,
                  totalComments: totComments,
                  totalShares: totShares,
                  totalSaves: totSaves,
                  totalEngagements: totEngagements,
                  engagementRate: er,
                  weeklyReports: mappedWeekly,
                  storiesRecap,
                  leadFunnels: Array.isArray(rep.funnels) && rep.funnels.length > 0 ? rep.funnels : existing.leadFunnels,
                };

                updated[key] = finalReport;
                if (periodLabel === selectedPeriod) {
                  updated[activeBrandName] = finalReport;
                }
              });
              return updated;
            });
          }
        }
      } catch (err) {
        console.error('Failed to load brand data from backend:', err);
      }
    }

    loadBrandData();
    return () => {
      isMounted = false;
    };
  }, [activeBrandName, selectedPeriod]);

  // Active Report calculation
  const getReportForBrandAndPeriod = (brandName: string, period: string): BrandReport => {
    const key = `${brandName}__${period}`;
    if (reports[key]) return reports[key];
    if (reports[brandName]) return reports[brandName];

    // Clean zero-based report (all 0s initially until updated or recorded in DB)
    const base = createEmptyBrandReport(brandName, period);

    // Calculate metrics dynamically from real loaded posts if available
    const brandPosts = posts.filter(p => p.brandId.toLowerCase() === brandName.toLowerCase());
    const publishedPosts = brandPosts.filter(p => p.status === 'Published');
    const postsLikes = publishedPosts.reduce((acc, p) => acc + (p.metrics?.likes || 0), 0);
    const postsComments = publishedPosts.reduce((acc, p) => acc + (p.metrics?.comments || 0), 0);
    const postsShares = publishedPosts.reduce((acc, p) => acc + (p.metrics?.shares || 0), 0);
    const postsSaves = publishedPosts.reduce((acc, p) => acc + (p.metrics?.saves || 0), 0);
    const postsViews = publishedPosts.reduce((acc, p) => acc + (p.metrics?.views || 0), 0);
    const postsReach = publishedPosts.reduce((acc, p) => acc + (p.metrics?.reach || 0), 0);
    const postsEngagements = postsLikes + postsComments + postsShares + postsSaves;
    const postsEr = postsReach > 0 ? Number(((postsEngagements / postsReach) * 100).toFixed(2)) : 0;

    return {
      ...base,
      totalPostsPublished: publishedPosts.length,
      totalLikes: postsLikes,
      totalComments: postsComments,
      totalShares: postsShares,
      totalSaves: postsSaves,
      totalViews: postsViews,
      totalReach: postsReach,
      totalEngagements: postsEngagements,
      engagementRate: postsEr,
    };
  };

  const currentReport = useMemo(() => {
    return getReportForBrandAndPeriod(currentBrand.name, selectedPeriod);
  }, [currentBrand.name, selectedPeriod, reports]);

  const previousReport = useMemo(() => {
    return getReportForBrandAndPeriod(currentBrand.name, getPreviousMonth(selectedPeriod));
  }, [currentBrand.name, selectedPeriod, reports]);

  // Modal States
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postModalInitialDate, setPostModalInitialDate] = useState<string | undefined>(undefined);
  const [detailPost, setDetailPost] = useState<SocialPost | null>(null);
  const [editingPostMetrics, setEditingPostMetrics] = useState<SocialPost | null>(null);
  const [isReportMetricModalOpen, setIsReportMetricModalOpen] = useState(false);
  const [reportBrandTarget, setReportBrandTarget] = useState<string>(currentBrand.name);
  const [editingMonthlyStories, setEditingMonthlyStories] = useState<{
    brandName: string;
    monthYear: string;
  } | null>(null);
  const [editingWeeklyData, setEditingWeeklyData] = useState<{
    brandName: string;
    monthYear: string;
    weekData: WeeklyReportData;
  } | null>(null);

  // Post Actions
  const handleSavePost = async (postData: Omit<SocialPost, 'id'>) => {
    const rawPlatform = (postData.platform || 'Instagram').toLowerCase();
    const backendPlatform =
      rawPlatform === 'paid ads' || rawPlatform === 'ads' ? 'facebook' : rawPlatform;

    const payload = {
      title: postData.title,
      brandId: activeBrandName,
      platform: backendPlatform,
      contentType:
        postData.format === 'Reels'
          ? 'reel'
          : postData.format === 'Carousel'
          ? 'carousel'
          : postData.format === 'Story'
          ? 'story'
          : postData.format === 'Video'
          ? 'video'
          : 'single_post',
      status: postData.status === 'Published' ? 'published' : postData.status === 'Draft' ? 'draft' : 'scheduled',
      scheduledDate: postData.date ? new Date(postData.date).toISOString() : new Date().toISOString(),
      caption: postData.caption || undefined,
      coverImage: postData.imageUrl || undefined,
      hooks: postData.hook ? [postData.hook] : undefined,
      notes: postData.brief || undefined,
    };

    try {
      const res = await api.post('/marketing/social/posts', payload);
      const created = res.data?.post || res.data?.data || res.data;
      if (created?.id) {
        setPosts(prev => [mapApiSocialPost(created), ...prev]);
        toast.success('Postingan berhasil disimpan.');
      } else {
        toast.error('Gagal menyimpan postingan: respons server tidak valid.');
      }
    } catch (e: any) {
      console.error('Failed to save post to backend:', e);
      toast.error('Gagal menyimpan postingan: ' + (e.response?.data?.message || e.message || 'Terjadi kesalahan'));
    }
  };

  const handleUpdatePostStatus = async (postId: string, newStatus: PostStatus) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            status: newStatus,
            progress: newStatus === 'Published' ? 100 : p.progress,
          };
        }
        return p;
      })
    );
    if (detailPost && detailPost.id === postId) {
      setDetailPost(prev => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await api.patch(`/marketing/social/posts/${postId}`, {
        status: newStatus === 'Published' ? 'published' : newStatus === 'Draft' ? 'draft' : 'scheduled',
      });
    } catch (e) {
      console.warn('Failed to update post status in backend:', e);
    }
  };

  const handleUpdatePostProgress = async (postId: string, progress: number) => {
    setPosts(prev => prev.map(p => (p.id === postId ? { ...p, progress } : p)));
    try {
      await api.patch(`/marketing/social/posts/${postId}`, {
        notes: `Progress: ${progress}%`,
      });
    } catch (e) {
      console.warn('Failed to update post progress in backend:', e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (detailPost && detailPost.id === postId) {
      setDetailPost(null);
    }

    try {
      await api.delete(`/marketing/social/posts/${postId}`);
      toast.success('Postingan berhasil dihapus.');
    } catch (e) {
      console.warn('Failed to delete post from backend:', e);
      toast.error('Gagal menghapus postingan.');
    }
  };

  const handleSavePostMetrics = async (
    postId: string,
    metrics: NonNullable<SocialPost['metrics']>,
    imageUrl?: string
  ) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, metrics, ...(imageUrl !== undefined ? { imageUrl } : {}) } : p
      )
    );

    try {
      await api.patch(`/marketing/social/posts/${postId}`, {
        performance: {
          reach: metrics.reach,
          videoViews: metrics.views,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          saves: metrics.saves,
          engagementRate: metrics.engagementRate,
        },
        ...(imageUrl ? { coverImage: imageUrl } : {}),
      });
      toast.success('Metrik postingan berhasil disimpan.');
    } catch (e) {
      console.warn('Failed to update post metrics in backend:', e);
      toast.error('Gagal memperbarui metrik postingan.');
    }
  };

  const handleUpdatePostMedia = async (postId: string, imageUrl: string) => {
    setPosts(prev => prev.map(p => (p.id === postId ? { ...p, imageUrl } : p)));
    try {
      await api.patch(`/marketing/social/posts/${postId}`, {
        coverImage: imageUrl,
      });
    } catch (e) {
      console.warn('Failed to update post media in backend:', e);
    }
  };

  // Report Metric Actions
  const handleSaveReportMetrics = async (updatedReport: BrandReport) => {
    const reportKey = `${updatedReport.brandId}__${updatedReport.monthYear}`;
    setReports(prev => ({
      ...prev,
      [updatedReport.brandId]: updatedReport,
      [reportKey]: updatedReport,
    }));

    try {
      const { periodStart, periodEnd } = parsePeriodDates(updatedReport.monthYear || selectedPeriod);
      const targetChannel =
        currentChannelConfig.plannerChannel && currentChannelConfig.plannerChannel !== 'All'
          ? currentChannelConfig.plannerChannel
          : 'Instagram';

      const followersEnd = Math.max(0, Math.round(Number(updatedReport.totalFollowers) || 0));
      const gained = Math.max(0, Math.round(Number(updatedReport.followersGained) || 0));
      const lost = Math.max(0, Math.round(Number(updatedReport.followersUnfollowed) || 0));
      const followersStart = Math.max(0, followersEnd - (gained - lost));

      await api.post('/marketing/social/reports/channel-metrics', {
        brandId: activeBrandName,
        periodStart,
        periodEnd,
        channel: targetChannel,
        reach: Math.max(0, Math.round(Number(updatedReport.totalReach) || 0)),
        views: Math.max(0, Math.round(Number(updatedReport.totalViews) || 0)),
        impressions: Math.max(0, Math.round(Number(updatedReport.totalImpressions) || 0)),
        likes: Math.max(0, Math.round(Number(updatedReport.totalLikes) || 0)),
        comments: Math.max(0, Math.round(Number(updatedReport.totalComments) || 0)),
        shares: Math.max(0, Math.round(Number(updatedReport.totalShares) || 0)),
        saves: Math.max(0, Math.round(Number(updatedReport.totalSaves) || 0)),
        followersStart,
        followersEnd,
      });

      // Sync monthly story metrics if entered
      if (updatedReport.storiesRecap?.totalStoriesCreated !== undefined && updatedReport.storiesRecap.totalStoriesCreated > 0) {
        try {
          await api.post('/marketing/social/reports/stories', {
            brandId: activeBrandName,
            periodStart,
            periodEnd,
            date: periodStart,
            storiesCount: Math.max(0, Math.round(Number(updatedReport.storiesRecap.totalStoriesCreated) || 0)),
            views: Math.max(0, Math.round(Number(updatedReport.storiesRecap.totalStoryViews) || 0)),
            replies: 0,
            linkClicks: 0,
            shares: 0,
            completionPct: Math.max(0, Math.min(100, Math.round(Number(updatedReport.storiesRecap.completionRate) || 80))),
            notes: `Rekap Bulanan Stories: ${updatedReport.storiesRecap.totalStoriesCreated} dibuat`,
          });
        } catch (storyErr) {
          console.warn('Could not sync monthly stories recap:', storyErr);
        }
      }

      toast.success('Metrik channel berhasil disimpan.');
    } catch (e: any) {
      console.warn('Failed to persist channel metric to backend:', e);
      toast.error('Gagal menyimpan metrik channel: ' + (e.response?.data?.message || e.message || 'Terjadi kesalahan'));
    }
  };

  const handleSaveMonthlyStories = async (
    brandName: string,
    monthYear: string,
    totalStoriesCreated: number,
    totalStoryViews: number
  ) => {
    const reportKey = `${brandName}__${monthYear}`;
    const base = getReportForBrandAndPeriod(brandName, monthYear);
    const avgViewsPerStory = totalStoriesCreated > 0 ? Math.round(totalStoryViews / totalStoriesCreated) : 0;

    const updated: BrandReport = {
      ...base,
      storiesRecap: {
        ...(base.storiesRecap || { completionRate: 80 }),
        totalStoriesCreated,
        totalStoryViews,
        avgViewsPerStory,
      },
    };

    setReports(prev => ({
      ...prev,
      [reportKey]: updated,
      [brandName]: updated,
    }));

    try {
      const { periodStart, periodEnd } = parsePeriodDates(monthYear || selectedPeriod);
      await api.post('/marketing/social/reports/stories', {
        brandId: brandName,
        periodStart,
        periodEnd,
        date: periodStart,
        storiesCount: Math.max(0, Math.round(Number(totalStoriesCreated) || 0)),
        views: Math.max(0, Math.round(Number(totalStoryViews) || 0)),
        replies: 0,
        linkClicks: 0,
        shares: 0,
        completionPct: Math.max(0, Math.min(100, Math.round(Number(updated.storiesRecap?.completionRate) || 80))),
        notes: `Monthly Stories Recap: ${totalStoriesCreated} stories, ${totalStoryViews} views`,
      });
      toast.success('Data story bulanan berhasil disimpan.');
    } catch (e: any) {
      console.warn('Failed to persist story metric to backend:', e);
      toast.error('Gagal menyimpan recap story: ' + (e.response?.data?.message || e.message || 'Terjadi kesalahan'));
    }
  };

  const handleSaveWeeklyData = async (
    brandName: string,
    monthYear: string,
    updatedWeek: WeeklyReportData
  ) => {
    const reportKey = `${brandName}__${monthYear}`;
    const base = getReportForBrandAndPeriod(brandName, monthYear);
    const existing = base.weeklyReports || [];
    const newWeekly = existing.map(w => (w.weekNumber === updatedWeek.weekNumber ? updatedWeek : w));

    const updated: BrandReport = {
      ...base,
      weeklyReports: newWeekly,
    };

    setReports(prev => ({
      ...prev,
      [reportKey]: updated,
      [brandName]: updated,
    }));

    try {
      const { periodStart, periodEnd } = parsePeriodDates(monthYear || selectedPeriod);
      const { weekStart, weekEnd } = getWeekDates(monthYear || selectedPeriod, updatedWeek.weekNumber);
      const endingFollowers = Math.max(0, Math.round(Number(updatedWeek.endingFollowers) || 0));
      const gained = Math.max(0, Math.round(Number(updatedWeek.followersGained) || 0));
      const lost = Math.max(0, Math.round(Number(updatedWeek.followersUnfollowed) || 0));
      const starting = updatedWeek.startingFollowers !== undefined
        ? Math.max(0, Math.round(Number(updatedWeek.startingFollowers) || 0))
        : Math.max(0, endingFollowers - (gained - lost));

      await api.post('/marketing/social/reports/weekly', {
        brandId: brandName,
        periodStart,
        periodEnd,
        weekNumber: Math.max(1, Math.round(Number(updatedWeek.weekNumber) || 1)),
        weekStart,
        weekEnd,
        followersStart: starting,
        followersEnd: endingFollowers,
        followersGained: gained,
        followersLost: lost,
        reach: Math.max(0, Math.round(Number(updatedWeek.reach) || 0)),
        views: Math.max(0, Math.round(Number(updatedWeek.views) || 0)),
        impressions: Math.max(0, Math.round(Number(updatedWeek.impressions) || 0)),
        totalEngagement: Math.max(0, Math.round(Number(updatedWeek.totalEngagement) || 0)),
        storiesCount: Math.max(0, Math.round(Number(updatedWeek.storiesCount) || 0)),
        storyViews: Math.max(0, Math.round(Number(updatedWeek.totalStoryViews) || 0)),
        highlights: updatedWeek.highlights?.trim() || undefined,
        notes: updatedWeek.notes?.trim() || undefined,
      });
      toast.success(`Laporan Minggu ${updatedWeek.weekNumber} berhasil disimpan.`);
    } catch (e: any) {
      console.warn('Failed to persist weekly report to backend:', e);
      toast.error('Gagal menyimpan laporan mingguan: ' + (e.response?.data?.message || e.message || 'Terjadi kesalahan'));
    }
  };

  const handleSaveWeeklyReportsList = async (updatedWeeklyList: WeeklyReportData[]) => {
    const reportKey = `${activeBrandName}__${selectedPeriod}`;
    const base = getReportForBrandAndPeriod(activeBrandName, selectedPeriod);
    const updated: BrandReport = {
      ...base,
      weeklyReports: updatedWeeklyList,
    };
    setReports(prev => ({
      ...prev,
      [reportKey]: updated,
      [activeBrandName]: updated,
    }));

    try {
      await Promise.all(
        updatedWeeklyList.map(w => handleSaveWeeklyData(activeBrandName, selectedPeriod, w))
      );
    } catch (e) {
      console.warn('Failed to persist batch weekly reports to backend:', e);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // Switch Brand helper
  const handleSwitchBrand = (brandName: 'Dreamlab' | 'Toribio') => {
    setActiveBrandName(brandName);
    const targetSlug = brandName.toLowerCase();
    router.push(`/marketing/${targetSlug}`);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 space-y-6">
      {/* 🏛️ HEADER: Modern Un-boxed Visual DNA */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                href="/marketing/management-task"
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Management Task
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Social Media Brands
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-white shadow-xs"
                style={{ backgroundColor: currentBrand.color }}
              >
                {currentBrand.initial}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
                {currentBrand.name} Workspace
              </h1>

              {/* Brand Switcher Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ml-2">
                <button
                  type="button"
                  onClick={() => handleSwitchBrand('Dreamlab')}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                    activeBrandName === 'Dreamlab'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dreamlab
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchBrand('Toribio')}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                    activeBrandName === 'Toribio'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Toribio
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-1.5">
              <span className="font-semibold text-slate-700">{currentBrand.handle}</span> · PIC: {currentBrand.pic} · {currentBrand.note}
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* Period Selector */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 shadow-2xs h-9">
              <button
                onClick={handlePrevMonth}
                disabled={periodIndex >= AVAILABLE_MONTHS.length - 1}
                className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 rounded-lg transition"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-xs font-bold bg-transparent px-2 text-slate-800 focus:outline-none cursor-pointer"
              >
                {AVAILABLE_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                onClick={handleNextMonth}
                disabled={periodIndex <= 0}
                className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 rounded-lg transition"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setReportBrandTarget(currentBrand.name);
                setIsReportMetricModalOpen(true);
              }}
              className="h-9 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Update Metrik</span>
            </button>

            <button
              onClick={handlePrint}
              className="h-9 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
              title="Cetak Laporan"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* 🌟 UNIFIED CHANNEL TOP NAVBAR: Overview, Instagram, TikTok, YouTube, Website & SEO, Paid Ads, Lead Funnel, Stories Recap */}
        <div className="max-w-7xl mx-auto mt-5 pt-3 border-t border-slate-100 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            {BRAND_NAV_CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const isActive = activeTab === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  id={`brand-nav-${ch.id}`}
                  onClick={() => {
                    setActiveTab(ch.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : ch.color}`} />
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-semibold text-slate-400 hidden lg:flex items-center gap-2">
            <span>Periode Aktif:</span>
            <span className="text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">{selectedPeriod}</span>
          </div>
        </div>
      </div>

      {/* 🚀 MAIN CONTENT BODY */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW (All-In-One Executive Summary & Brand KPIs) */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <BrandReportingView
              brand={currentBrand}
              report={currentReport}
              previousReport={previousReport}
              posts={posts}
              initialTab="all"
              currentPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              onOpenReportMetricModal={(b) => {
                setReportBrandTarget(b);
                setIsReportMetricModalOpen(true);
              }}
              onOpenPostMetricsModal={(p) => setEditingPostMetrics(p)}
              onOpenStoriesModal={(b, m) => setEditingMonthlyStories({ brandName: b, monthYear: m })}
              onOpenDailyStoryModal={(b, m, s) => setEditingMonthlyStories({ brandName: b, monthYear: m })}
              onSaveReportMetrics={handleSaveReportMetrics}
              onUpdateWeeklyReports={handleSaveWeeklyReportsList}
              onUpdatePostMedia={handleUpdatePostMedia}
              onNavigateToPlanner={(channel) => {
                if (channel) {
                  const chLower = channel.toLowerCase();
                  if (chLower.includes('tiktok')) setActiveTab('tiktok');
                  else if (chLower.includes('youtube')) setActiveTab('youtube');
                  else if (chLower.includes('web')) setActiveTab('website');
                  else if (chLower.includes('ad')) setActiveTab('ads');
                  else setActiveTab('instagram');
                } else {
                  setActiveTab('instagram');
                }
                setChannelViewMode('planner');
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2..8: SPECIFIC SOCIAL CHANNEL (Report & Planner Modes) */}
        {/* ========================================================= */}
        {activeTab !== 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 📍 Channel Sub-Header Bar: Channel Identity & Report/Planner Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${currentChannelConfig.bg}`}>
                  <currentChannelConfig.icon className={`w-4 h-4 ${currentChannelConfig.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {currentBrand.name} · {currentChannelConfig.label}
                    </h2>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase">
                      {channelViewMode === 'report' ? 'Report Mode' : 'Planner Mode'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {currentChannelConfig.desc}
                  </p>
                </div>
              </div>

              {/* Sub-Navbar Toggle: Report & Planner */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  id={`channel-btn-report`}
                  onClick={() => setChannelViewMode('report')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    channelViewMode === 'report'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>

                <button
                  type="button"
                  id={`channel-btn-planner`}
                  onClick={() => setChannelViewMode('planner')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    channelViewMode === 'planner'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Planner</span>
                </button>
              </div>
            </div>

            {/* Content: Either Channel Report or Channel Content Planner */}
            {channelViewMode === 'report' ? (
              <div>
                {activeTab === 'instagram' && (
                  <WeeklyReportingSection
                    brand={currentBrand}
                    report={currentReport}
                    currentPeriod={selectedPeriod}
                    onUpdateWeeklyReports={(updatedReports) => {
                      const updated: BrandReport = { ...currentReport, weeklyReports: updatedReports };
                      handleSaveReportMetrics(updated);
                    }}
                  />
                )}
                {activeTab === 'tiktok' && (
                  <TikTokSection data={currentReport.tiktokReport || EMPTY_TIKTOK_REPORT} />
                )}
                {activeTab === 'youtube' && (
                  <YouTubeSection data={currentReport.youtubeReport || EMPTY_YOUTUBE_REPORT} />
                )}
                {activeTab === 'website' && (
                  <WebsiteSection data={currentReport.websiteReport || EMPTY_WEBSITE_REPORT} />
                )}
                {activeTab === 'ads' && (
                  <PaidAdsSection
                    brand={currentBrand}
                    metaAds={currentReport.metaAdsReport || EMPTY_META_ADS_REPORT}
                    googleAds={currentReport.googleAdsReport || EMPTY_GOOGLE_ADS_REPORT}
                    period={selectedPeriod}
                  />
                )}
                {activeTab === 'funnel' && (
                  <NurturingFunnelSection
                    brandName={currentBrand.name}
                    funnels={currentReport.leadFunnels || EMPTY_LEAD_FUNNELS}
                  />
                )}
                {activeTab === 'stories' && (
                  <StoriesRecapSection
                    brandName={currentBrand.name}
                    monthYear={selectedPeriod}
                    storiesRecap={currentReport.storiesRecap}
                    previousReport={previousReport}
                    onOpenStoriesModal={(b: string, m: string) => setEditingMonthlyStories({ brandName: b, monthYear: m })}
                  />
                )}
              </div>
            ) : (
              <ContentPlannerView
                brand={currentBrand}
                posts={posts}
                initialChannel={currentChannelConfig.plannerChannel}
                onOpenAddPostModal={(date) => {
                  setPostModalInitialDate(date);
                  setIsPostModalOpen(true);
                }}
                onViewPostDetail={(p) => setDetailPost(p)}
                onUpdatePostStatus={handleUpdatePostStatus}
                onUpdatePostProgress={handleUpdatePostProgress}
                onNavigateToReporting={() => setChannelViewMode('report')}
              />
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODALS CONTAINER                                          */}
      {/* ========================================================= */}
      {/* 1. Add Post Modal */}
      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setPostModalInitialDate(undefined);
        }}
        onSave={handleSavePost}
        brands={brands}
        members={INITIAL_MEMBERS}
        initialBrand={currentBrand.name}
        initialDate={postModalInitialDate}
      />

      {/* 2. Detail Post Modal */}
      <PostDetailModal
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onDelete={handleDeletePost}
        onUpdateStatus={handleUpdatePostStatus}
      />

      {/* 3. Post Metrics Modal */}
      <PostMetricsModal
        post={editingPostMetrics}
        isOpen={Boolean(editingPostMetrics)}
        onClose={() => setEditingPostMetrics(null)}
        onSave={handleSavePostMetrics}
      />

      {/* 4. Report Metric Modal */}
      <ReportMetricModal
        isOpen={isReportMetricModalOpen}
        onClose={() => setIsReportMetricModalOpen(false)}
        brandName={reportBrandTarget}
        currentReport={getReportForBrandAndPeriod(reportBrandTarget, selectedPeriod)}
        onSave={handleSaveReportMetrics}
      />

      {/* 5. Monthly Stories Modal */}
      <MonthlyStoriesModal
        isOpen={Boolean(editingMonthlyStories)}
        onClose={() => setEditingMonthlyStories(null)}
        brandName={editingMonthlyStories?.brandName || currentBrand.name}
        monthYear={editingMonthlyStories?.monthYear || selectedPeriod}
        currentReport={currentReport}
        previousReport={previousReport}
        onSave={(totalStoriesCreated: number, totalStoryViews: number) => {
          handleSaveMonthlyStories(
            editingMonthlyStories?.brandName || currentBrand.name,
            editingMonthlyStories?.monthYear || selectedPeriod,
            totalStoriesCreated,
            totalStoryViews
          );
        }}
      />

      {/* 6. Weekly Metric Modal */}
      {editingWeeklyData && (
        <WeeklyMetricModal
          isOpen={Boolean(editingWeeklyData)}
          onClose={() => setEditingWeeklyData(null)}
          weekData={editingWeeklyData.weekData}
          brandName={editingWeeklyData.brandName}
          currentPeriod={editingWeeklyData.monthYear}
          onSave={(updatedWeek: WeeklyReportData) => {
            handleSaveWeeklyData(editingWeeklyData.brandName, editingWeeklyData.monthYear, updatedWeek);
            setEditingWeeklyData(null);
          }}
        />
      )}
    </div>
  );
}
