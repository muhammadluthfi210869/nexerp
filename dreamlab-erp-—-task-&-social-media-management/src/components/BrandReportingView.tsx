import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  UserPlus, 
  UserMinus, 
  Eye, 
  Heart, 
  Calendar, 
  Printer, 
  Sparkles, 
  FileText,
  Share2,
  Bookmark,
  MessageCircle,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit3,
  Video,
  Layers,
  Image,
  Flame,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
  LayoutGrid,
  Columns,
  Maximize2,
  ExternalLink,
  X,
  Target,
  Globe,
  Tv,
  Megaphone
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import { Brand, BrandReport, SocialPost, PostFormat, DailyStoryRecap, WeeklyReportData } from '../types';
import { formatNumber } from '../utils/helpers';
import { StoriesRecapSection } from './StoriesRecapSection';
import { WeeklyReportingSection } from './WeeklyReportingSection';
import { NurturingFunnelSection } from './NurturingFunnelSection';
import { TikTokSection } from './TikTokSection';
import { YouTubeSection } from './YouTubeSection';
import { WebsiteSection } from './WebsiteSection';
import { PaidAdsSection } from './PaidAdsSection';
import { 
  DREAMLAB_LEAD_FUNNELS, 
  DREAMLAB_TIKTOK_REPORT, 
  DREAMLAB_YOUTUBE_REPORT, 
  DREAMLAB_WEBSITE_REPORT, 
  DREAMLAB_META_ADS_REPORT, 
  DREAMLAB_GOOGLE_ADS_REPORT,
  TORIBIO_LEAD_FUNNELS,
  TORIBIO_TIKTOK_REPORT,
  TORIBIO_YOUTUBE_REPORT,
  TORIBIO_WEBSITE_REPORT,
  TORIBIO_META_ADS_REPORT,
  TORIBIO_GOOGLE_ADS_REPORT
} from '../data/channelReportsData';

export type ReportTab = 'all' | 'funnel' | 'weekly' | 'tiktok' | 'youtube' | 'website' | 'ads' | 'monthly';

export const AVAILABLE_REPORT_MONTHS = [
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

interface BrandReportingViewProps {
  brand: Brand;
  report?: BrandReport;
  previousReport?: BrandReport;
  posts: SocialPost[];
  currentPeriod?: string;
  initialTab?: ReportTab;
  onPeriodChange?: (period: string) => void;
  onOpenReportMetricModal: (brandName: string) => void;
  onOpenPostMetricsModal: (post: SocialPost) => void;
  onOpenStoriesModal: (brandName: string, monthYear: string) => void;
  onOpenDailyStoryModal?: (brandName: string, monthYear: string, story?: DailyStoryRecap | null) => void;
  onUpdatePostMedia?: (postId: string, imageUrl: string) => void;
  onSaveReportMetrics?: (updatedReport: BrandReport) => void;
  onNavigateToPlanner?: (targetChannel?: string) => void;
}

export const BrandReportingView: React.FC<BrandReportingViewProps> = ({
  brand,
  report,
  previousReport,
  posts,
  currentPeriod,
  initialTab,
  onPeriodChange,
  onOpenReportMetricModal,
  onOpenPostMetricsModal,
  onOpenStoriesModal,
  onOpenDailyStoryModal,
  onUpdatePostMedia,
  onSaveReportMetrics,
  onNavigateToPlanner
}) => {
  const [internalPeriod, setInternalPeriod] = useState('September 2026');
  const selectedPeriod = currentPeriod || internalPeriod;

  // Primary reporting view tab: 'all' (complete), 'funnel', 'weekly', 'tiktok', 'youtube', 'website', 'ads', 'monthly'
  const [reportViewTab, setReportViewTab] = useState<ReportTab>(initialTab || 'all');

  useEffect(() => {
    if (initialTab) {
      setReportViewTab(initialTab);
    }
  }, [initialTab]);

  // View mode for content performance: 'columns' (visual card columns) or 'table' (full table)
  const [contentViewMode, setContentViewMode] = useState<'columns' | 'table'>('columns');

  // Modals for visual content
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string; post: SocialPost } | null>(null);
  const [uploadModalPost, setUploadModalPost] = useState<SocialPost | null>(null);
  const [uploadInputUrl, setUploadInputUrl] = useState('');
  const [activeUploadTab, setActiveUploadTab] = useState<'file' | 'url'>('file');
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const [directUploadPostId, setDirectUploadPostId] = useState<string | null>(null);

  const handleSelectPeriod = (newPeriod: string) => {
    setInternalPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const periodIndex = AVAILABLE_REPORT_MONTHS.indexOf(selectedPeriod);

  const handlePrevMonth = () => {
    if (periodIndex !== -1 && periodIndex < AVAILABLE_REPORT_MONTHS.length - 1) {
      handleSelectPeriod(AVAILABLE_REPORT_MONTHS[periodIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    if (periodIndex > 0) {
      handleSelectPeriod(AVAILABLE_REPORT_MONTHS[periodIndex - 1]);
    }
  };

  const [postSearch, setPostSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'shares' | 'saves' | 'er' | 'date'>('views');

  // Filter posts belonging to this brand
  const brandPosts = useMemo(() => {
    return posts.filter(p => p.brandId.toLowerCase() === brand.name.toLowerCase());
  }, [posts, brand.name]);

  // If report not found or missing fields, create a robust default
  const activeReport: BrandReport = useMemo(() => {
    const isDreamlab = brand.name.toLowerCase().includes('dreamlab');
    const defaultFunnels = isDreamlab ? DREAMLAB_LEAD_FUNNELS : TORIBIO_LEAD_FUNNELS;
    const defaultTikTok = isDreamlab ? DREAMLAB_TIKTOK_REPORT : TORIBIO_TIKTOK_REPORT;
    const defaultYouTube = isDreamlab ? DREAMLAB_YOUTUBE_REPORT : TORIBIO_YOUTUBE_REPORT;
    const defaultWebsite = isDreamlab ? DREAMLAB_WEBSITE_REPORT : TORIBIO_WEBSITE_REPORT;
    const defaultMeta = isDreamlab ? DREAMLAB_META_ADS_REPORT : TORIBIO_META_ADS_REPORT;
    const defaultGoogle = isDreamlab ? DREAMLAB_GOOGLE_ADS_REPORT : TORIBIO_GOOGLE_ADS_REPORT;

    const defaultRep: BrandReport = {
      id: `rep-${brand.name.toLowerCase()}-${selectedPeriod.replace(/\s+/g, '-').toLowerCase()}`,
      brandId: brand.name,
      monthYear: selectedPeriod,
      leadFunnels: defaultFunnels,
      tiktokReport: defaultTikTok,
      youtubeReport: defaultYouTube,
      websiteReport: defaultWebsite,
      metaAdsReport: defaultMeta,
      googleAdsReport: defaultGoogle,
      totalFollowers: isDreamlab ? 28450 : 64800,
      followersGained: isDreamlab ? 2180 : 5240,
      followersUnfollowed: isDreamlab ? 530 : 1120,
      followersNetGrowth: isDreamlab ? 1650 : 4120,
      followersGrowthPercent: isDreamlab ? 6.1 : 6.8,

      totalViews: isDreamlab ? 284000 : 620000,
      averageViewsPerPost: isDreamlab ? 35500 : 68800,
      totalReach: isDreamlab ? 184200 : 342000,
      reachGrowthPercent: isDreamlab ? 22.4 : 31.2,
      totalImpressions: isDreamlab ? 492000 : 885000,
      impressionsGrowthPercent: isDreamlab ? 19.5 : 28.0,

      totalLikes: isDreamlab ? 4320 : 14500,
      totalComments: isDreamlab ? 380 : 1680,
      totalShares: isDreamlab ? 1220 : 3420,
      totalSaves: isDreamlab ? 2430 : 5100,
      totalEngagements: isDreamlab ? 8350 : 24700,
      engagementRate: isDreamlab ? 5.2 : 6.8,
      engagementRateChange: isDreamlab ? 0.8 : 1.2,

      totalPostsPublished: isDreamlab ? 8 : 9,
      platformBreakdown: [
        { platform: 'Instagram', followers: isDreamlab ? 18900 : 41200, followersGrowth: isDreamlab ? 1100 : 2350, reach: isDreamlab ? 114200 : 188000, views: isDreamlab ? 186000 : 340000, engagementRate: isDreamlab ? 5.4 : 6.5, postsCount: 9 },
        { platform: isDreamlab ? 'LinkedIn' : 'TikTok', followers: isDreamlab ? 6350 : 21800, followersGrowth: isDreamlab ? 420 : 1680, reach: isDreamlab ? 48000 : 142000, views: isDreamlab ? 65000 : 260000, engagementRate: isDreamlab ? 6.8 : 7.4, postsCount: 4 },
        { platform: isDreamlab ? 'TikTok' : 'YouTube', followers: isDreamlab ? 3200 : 1800, followersGrowth: isDreamlab ? 130 : 90, reach: isDreamlab ? 22000 : 12000, views: isDreamlab ? 33000 : 20000, engagementRate: isDreamlab ? 3.2 : 4.8, postsCount: 1 }
      ],
      weeklyTrends: [
        { week: 'Minggu 1', reach: isDreamlab ? 38500 : 76000, views: isDreamlab ? 62000 : 145000, engagement: 2100, impressions: 98000, followersGained: 520, followersUnfollowed: 110 },
        { week: 'Minggu 2', reach: isDreamlab ? 52400 : 98500, views: isDreamlab ? 88000 : 198000, engagement: 2950, impressions: 138000, followersGained: 680, followersUnfollowed: 150 },
        { week: 'Minggu 3', reach: isDreamlab ? 47200 : 84200, views: isDreamlab ? 71000 : 142000, engagement: 2540, impressions: 126000, followersGained: 490, followersUnfollowed: 130 },
        { week: 'Minggu 4', reach: isDreamlab ? 46100 : 83300, views: isDreamlab ? 63000 : 135000, engagement: 2430, impressions: 130000, followersGained: 490, followersUnfollowed: 140 }
      ],
      formatPerformance: [
        { format: 'Carousel', postsCount: 6, avgEngagementRate: 6.4, avgReach: 24500, avgViews: 38000 },
        { format: 'Reels', postsCount: 5, avgEngagementRate: 4.8, avgReach: 39800, avgViews: 64000 },
        { format: 'Single Image', postsCount: 3, avgEngagementRate: 3.6, avgReach: 14600, avgViews: 22000 }
      ],
      storiesRecap: {
        totalStoriesCreated: isDreamlab ? 20 : 32,
        totalStoryViews: isDreamlab ? 48100 : 105000,
        avgViewsPerStory: isDreamlab ? 2405 : 3281,
        avgStoriesPerDay: isDreamlab ? 2.2 : 3.5,
        completionRate: isDreamlab ? 78 : 84,
        dailyStories: isDreamlab ? [
          { id: 'ds-dl-1', date: '2026-09-01', dayNumber: 1, dayName: 'Selasa', storiesCount: 2, totalViews: 4200, avgViewsPerStory: 2100, replies: 14, linkClicks: 22, topicOrTheme: 'Lab Update: Clinical Trial Batch 4' },
          { id: 'ds-dl-2', date: '2026-09-02', dayNumber: 2, dayName: 'Rabu', storiesCount: 1, totalViews: 2800, avgViewsPerStory: 2800, replies: 8, linkClicks: 15, topicOrTheme: 'Tim R&D Meeting Insight & Formula' },
          { id: 'ds-dl-3', date: '2026-09-03', dayNumber: 3, dayName: 'Kamis', storiesCount: 3, totalViews: 6500, avgViewsPerStory: 2167, replies: 24, linkClicks: 38, topicOrTheme: 'B2B OEM Client Consultation' },
          { id: 'ds-dl-4', date: '2026-09-04', dayNumber: 4, dayName: 'Jumat', storiesCount: 2, totalViews: 5100, avgViewsPerStory: 2550, replies: 16, linkClicks: 29, topicOrTheme: 'Sterilisasi Alat Cleanroom ISO-9001' },
          { id: 'ds-dl-5', date: '2026-09-05', dayNumber: 5, dayName: 'Sabtu', storiesCount: 3, totalViews: 7400, avgViewsPerStory: 2467, replies: 32, linkClicks: 45, topicOrTheme: 'Sertifikasi BPOM & CPKB Checklist' },
          { id: 'ds-dl-6', date: '2026-09-06', dayNumber: 6, dayName: 'Minggu', storiesCount: 1, totalViews: 3200, avgViewsPerStory: 3200, replies: 10, linkClicks: 18, topicOrTheme: 'Weekend Lab Maintenance Routine' },
          { id: 'ds-dl-7', date: '2026-09-07', dayNumber: 7, dayName: 'Senin', storiesCount: 2, totalViews: 4900, avgViewsPerStory: 2450, replies: 18, linkClicks: 26, topicOrTheme: 'Formulasi Serum Vitamin C Terstabil' },
          { id: 'ds-dl-8', date: '2026-09-08', dayNumber: 8, dayName: 'Selasa', storiesCount: 3, totalViews: 6800, avgViewsPerStory: 2267, replies: 27, linkClicks: 40, topicOrTheme: 'Workshop Formulator Muda Batch 2' },
          { id: 'ds-dl-9', date: '2026-09-09', dayNumber: 9, dayName: 'Rabu', storiesCount: 3, totalViews: 7200, avgViewsPerStory: 2400, replies: 35, linkClicks: 52, topicOrTheme: 'Kunjungan Partner Industri Skincare' }
        ] : [
          { id: 'ds-tb-1', date: '2026-09-01', dayNumber: 1, dayName: 'Selasa', storiesCount: 3, totalViews: 8900, avgViewsPerStory: 2966, replies: 32, linkClicks: 54, topicOrTheme: 'Behind The Scenes Formulasi Barrier Cream' },
          { id: 'ds-tb-2', date: '2026-09-02', dayNumber: 2, dayName: 'Rabu', storiesCount: 2, totalViews: 6400, avgViewsPerStory: 3200, replies: 18, linkClicks: 42, topicOrTheme: 'Morning Skincare Routine Steps' },
          { id: 'ds-tb-3', date: '2026-09-03', dayNumber: 3, dayName: 'Kamis', storiesCount: 4, totalViews: 11800, avgViewsPerStory: 2950, replies: 65, linkClicks: 88, topicOrTheme: 'Q&A: Cara Mengatasi Kulit Kering & Sensitif' },
          { id: 'ds-tb-4', date: '2026-09-04', dayNumber: 4, dayName: 'Jumat', storiesCount: 3, totalViews: 9200, avgViewsPerStory: 3067, replies: 41, linkClicks: 65, topicOrTheme: 'Packaging Unboxing & Detail Botol Kaca' },
          { id: 'ds-tb-5', date: '2026-09-05', dayNumber: 5, dayName: 'Sabtu', storiesCount: 5, totalViews: 16500, avgViewsPerStory: 3300, replies: 112, linkClicks: 185, topicOrTheme: 'Teaser Flash Sale 9.9 & Quiz Voucher' },
          { id: 'ds-tb-6', date: '2026-09-06', dayNumber: 6, dayName: 'Minggu', storiesCount: 2, totalViews: 7100, avgViewsPerStory: 3550, replies: 28, linkClicks: 46, topicOrTheme: 'Customer Testimonial Repost & Real Results' },
          { id: 'ds-tb-7', date: '2026-09-07', dayNumber: 7, dayName: 'Senin', storiesCount: 3, totalViews: 10400, avgViewsPerStory: 3467, replies: 53, linkClicks: 78, topicOrTheme: 'Ceramide vs Niacinamide Skin Barrier Guide' },
          { id: 'ds-tb-8', date: '2026-09-08', dayNumber: 8, dayName: 'Selasa', storiesCount: 4, totalViews: 13200, avgViewsPerStory: 3300, replies: 88, linkClicks: 140, topicOrTheme: 'Countdown H-1 Menuju 9.9 Mega Sale' },
          { id: 'ds-tb-9', date: '2026-09-09', dayNumber: 9, dayName: 'Rabu', storiesCount: 6, totalViews: 21500, avgViewsPerStory: 3583, replies: 195, linkClicks: 320, topicOrTheme: 'D-Day Flash Sale 9.9 & Live Order Packing' }
        ]
      },
      executiveSummary: `Laporan analitik media sosial untuk brand ${brand.name} pada periode ${selectedPeriod}. Performa menunjukkan lonjakan positif pada total kuantitas view dan retensi follower.`,
      strategicRecommendations: [
        'Pertahankan jadwal publikasi konsisten pada hari aktif engagement.',
        'Optimalkan format Carousel dan Reels edukasi.',
        'Monitor retensi follower agar rasio unfollow tetap terkendali.'
      ]
    };

    if (!report) return defaultRep;

    const gained = report.followersGained ?? defaultRep.followersGained;
    const unfollowed = report.followersUnfollowed ?? defaultRep.followersUnfollowed;
    const net = report.followersNetGrowth ?? (Number(gained) - Number(unfollowed));

    return {
      ...defaultRep,
      ...report,
      monthYear: selectedPeriod,
      totalFollowers: report.totalFollowers ?? defaultRep.totalFollowers,
      followersGained: gained,
      followersUnfollowed: unfollowed,
      followersNetGrowth: net,
      followersGrowthPercent: report.followersGrowthPercent ?? defaultRep.followersGrowthPercent,
      totalViews: report.totalViews ?? defaultRep.totalViews,
      averageViewsPerPost: report.averageViewsPerPost ?? defaultRep.averageViewsPerPost,
      totalReach: report.totalReach ?? defaultRep.totalReach,
      reachGrowthPercent: report.reachGrowthPercent ?? defaultRep.reachGrowthPercent,
      totalImpressions: report.totalImpressions ?? defaultRep.totalImpressions,
      impressionsGrowthPercent: report.impressionsGrowthPercent ?? defaultRep.impressionsGrowthPercent,
      totalLikes: report.totalLikes ?? defaultRep.totalLikes,
      totalComments: report.totalComments ?? defaultRep.totalComments,
      totalShares: report.totalShares ?? defaultRep.totalShares,
      totalSaves: report.totalSaves ?? defaultRep.totalSaves,
      totalEngagements: report.totalEngagements ?? defaultRep.totalEngagements,
      engagementRate: report.engagementRate ?? defaultRep.engagementRate,
      engagementRateChange: report.engagementRateChange ?? defaultRep.engagementRateChange,
      storiesRecap: report.storiesRecap || defaultRep.storiesRecap,
      weeklyReports: report.weeklyReports || defaultRep.weeklyReports,
      leadFunnels: report.leadFunnels || defaultRep.leadFunnels,
      tiktokReport: report.tiktokReport || defaultRep.tiktokReport,
      youtubeReport: report.youtubeReport || defaultRep.youtubeReport,
      websiteReport: report.websiteReport || defaultRep.websiteReport,
      metaAdsReport: report.metaAdsReport || defaultRep.metaAdsReport,
      googleAdsReport: report.googleAdsReport || defaultRep.googleAdsReport
    };
  }, [report, brand.name, selectedPeriod]);

  const handleUpdateWeeklyReports = (updatedWeeklyList: WeeklyReportData[]) => {
    const updated: BrandReport = {
      ...activeReport,
      weeklyReports: updatedWeeklyList
    };
    onSaveReportMetrics?.(updated);
  };

  // Calculate live aggregates from actual posts if available
  const aggregatedStats = useMemo(() => {
    let postsTotalViews = 0;
    let postsTotalLikes = 0;
    let postsTotalComments = 0;
    let postsTotalShares = 0;
    let postsTotalSaves = 0;
    let postsCountWithMetrics = 0;

    brandPosts.forEach(p => {
      if (p.metrics) {
        postsTotalViews += p.metrics.views || 0;
        postsTotalLikes += p.metrics.likes || 0;
        postsTotalComments += p.metrics.comments || 0;
        postsTotalShares += p.metrics.shares || 0;
        postsTotalSaves += p.metrics.saves || 0;
        postsCountWithMetrics += 1;
      }
    });

    const totalViewsDisplay = postsTotalViews > 0 ? postsTotalViews : activeReport.totalViews;
    const avgViewsDisplay = postsCountWithMetrics > 0 
      ? Math.round(postsTotalViews / postsCountWithMetrics) 
      : activeReport.averageViewsPerPost;

    const totalLikesDisplay = postsTotalLikes > 0 ? postsTotalLikes : activeReport.totalLikes;
    const totalSharesDisplay = postsTotalShares > 0 ? postsTotalShares : activeReport.totalShares;
    const totalCommentsDisplay = postsTotalComments > 0 ? postsTotalComments : activeReport.totalComments;
    const totalSavesDisplay = postsTotalSaves > 0 ? postsTotalSaves : activeReport.totalSaves;
    const totalEngagementsDisplay = totalLikesDisplay + totalSharesDisplay + totalCommentsDisplay + totalSavesDisplay;

    return {
      totalViews: totalViewsDisplay,
      avgViews: avgViewsDisplay,
      totalLikes: totalLikesDisplay,
      totalShares: totalSharesDisplay,
      totalComments: totalCommentsDisplay,
      totalSaves: totalSavesDisplay,
      totalEngagements: totalEngagementsDisplay
    };
  }, [brandPosts, activeReport]);

  // Filter and sort the detailed content list
  const filteredAndSortedPosts = useMemo(() => {
    return brandPosts
      .filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
          (p.hook && p.hook.toLowerCase().includes(postSearch.toLowerCase())) ||
          p.pic.toLowerCase().includes(postSearch.toLowerCase());
        const matchesFormat = formatFilter === 'All' || p.format === formatFilter;
        return matchesSearch && matchesFormat;
      })
      .sort((a, b) => {
        const aMetrics = a.metrics || { views: 0, likes: 0, shares: 0, saves: 0, engagementRate: 0 };
        const bMetrics = b.metrics || { views: 0, likes: 0, shares: 0, saves: 0, engagementRate: 0 };

        if (sortBy === 'views') return (bMetrics.views || 0) - (aMetrics.views || 0);
        if (sortBy === 'likes') return (bMetrics.likes || 0) - (aMetrics.likes || 0);
        if (sortBy === 'shares') return (bMetrics.shares || 0) - (aMetrics.shares || 0);
        if (sortBy === 'saves') return (bMetrics.saves || 0) - (aMetrics.saves || 0);
        if (sortBy === 'er') return (bMetrics.engagementRate || 0) - (aMetrics.engagementRate || 0);
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [brandPosts, postSearch, formatFilter, sortBy]);

  const handlePrint = () => {
    window.print();
  };

  const getFormatIcon = (format: PostFormat) => {
    switch (format) {
      case 'Reels':
      case 'Video':
        return <Video className="w-3.5 h-3.5 text-purple-600" />;
      case 'Carousel':
        return <Layers className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Image className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  // Follower churn calculation
  const unfollowRate = activeReport.totalFollowers > 0 
    ? ((activeReport.followersUnfollowed / activeReport.totalFollowers) * 100).toFixed(1)
    : '1.8';

  const handleOpenUploadModal = (post: SocialPost) => {
    setUploadModalPost(post);
    setUploadInputUrl(post.imageUrl || '');
    setActiveUploadTab('file');
  };

  const handleDirectFileSelect = (post: SocialPost) => {
    setDirectUploadPostId(post.id);
    if (directFileInputRef.current) {
      directFileInputRef.current.value = '';
      directFileInputRef.current.click();
    }
  };

  const handleDirectFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && directUploadPostId && onUpdatePostMedia) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdatePostMedia(directUploadPostId, reader.result);
          setDirectUploadPostId(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadModalPost && onUpdatePostMedia) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdatePostMedia(uploadModalPost.id, reader.result);
          setUploadModalPost(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveModalUrl = () => {
    if (uploadModalPost && uploadInputUrl.trim() && onUpdatePostMedia) {
      onUpdatePostMedia(uploadModalPost.id, uploadInputUrl.trim());
      setUploadModalPost(null);
    }
  };

  const handleRemovePostImage = (postId: string) => {
    if (onUpdatePostMedia) {
      onUpdatePostMedia(postId, '');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:space-y-4">
      {/* Brand & Reporting Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0"
            style={{ backgroundColor: brand.color }}
          >
            {brand.initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Reporting & Analytics · {brand.name}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                {reportViewTab === 'funnel' ? '🎯 Leads Funnel Pipeline' :
                 reportViewTab === 'weekly' ? '📸 Instagram Report' :
                 reportViewTab === 'tiktok' ? '🎵 TikTok Report' :
                 reportViewTab === 'youtube' ? '▶️ YouTube Channel' :
                 reportViewTab === 'website' ? '🌐 Website & SEO' :
                 reportViewTab === 'ads' ? '📣 Paid Ads Report' :
                 reportViewTab === 'monthly' ? '📈 Overview Bulanan' : '📊 Executive Summary'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {brand.handle} · Evaluasi menyeluruh kuantitas views, followers vs unfollows, dan performa per konten.
            </p>
          </div>
        </div>

        {/* Action buttons with Month Selector */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Bulanan Selector with prev / next navigation */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              disabled={periodIndex >= AVAILABLE_REPORT_MONTHS.length - 1}
              className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/60 rounded-lg transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <select
              value={selectedPeriod}
              onChange={(e) => handleSelectPeriod(e.target.value)}
              className="text-xs font-bold bg-transparent px-2.5 py-1.5 text-slate-800 focus:outline-none cursor-pointer"
            >
              {AVAILABLE_REPORT_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m} {m === 'September 2026' ? '· (Aktif)' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              disabled={periodIndex <= 0}
              className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/60 rounded-lg transition"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onOpenReportMetricModal(brand.name)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Update Metrik Bulanan</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg transition"
            title="Cetak Ringkasan Laporan"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={() => onNavigateToPlanner?.(
              reportViewTab === 'tiktok' ? 'TikTok' :
              reportViewTab === 'youtube' ? 'YouTube' :
              reportViewTab === 'website' ? 'Website' :
              reportViewTab === 'ads' ? 'Paid Ads' :
              reportViewTab === 'weekly' ? 'Instagram' : undefined
            )}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Buka Planner {
                reportViewTab === 'tiktok' ? 'TikTok' :
                reportViewTab === 'youtube' ? 'YouTube' :
                reportViewTab === 'website' ? 'Website' :
                reportViewTab === 'ads' ? 'Paid Ads' :
                reportViewTab === 'weekly' ? 'Instagram' : 'Brand'
              }
            </span>
          </button>
        </div>
      </div>

      {/* 1. LEAD FUNNEL PIPELINE SECTION (When in 'all' or 'funnel' tab) */}
      {(reportViewTab === 'all' || reportViewTab === 'funnel') && (
        <NurturingFunnelSection
          brand={brand}
          brandName={brand.name}
          funnels={activeReport.leadFunnels || []}
          period={selectedPeriod}
        />
      )}

      {/* 2. TIKTOK SECTION (When in 'tiktok' tab) */}
      {reportViewTab === 'tiktok' && (
        <TikTokSection
          brand={brand}
          brandName={brand.name}
          report={activeReport.tiktokReport}
          data={activeReport.tiktokReport}
          posts={posts}
          period={selectedPeriod}
          onNavigateToPlanner={onNavigateToPlanner}
        />
      )}

      {/* 3. YOUTUBE SECTION (When in 'youtube' tab) */}
      {reportViewTab === 'youtube' && (
        <YouTubeSection
          brand={brand}
          brandName={brand.name}
          report={activeReport.youtubeReport}
          data={activeReport.youtubeReport}
          posts={posts}
          period={selectedPeriod}
          onNavigateToPlanner={onNavigateToPlanner}
        />
      )}

      {/* 4. WEBSITE SECTION (When in 'website' tab) */}
      {reportViewTab === 'website' && (
        <WebsiteSection
          brand={brand}
          brandName={brand.name}
          report={activeReport.websiteReport}
          data={activeReport.websiteReport}
          period={selectedPeriod}
        />
      )}

      {/* 5. PAID ADS SECTION (When in 'ads' tab) */}
      {reportViewTab === 'ads' && (
        <PaidAdsSection
          brand={brand}
          brandName={brand.name}
          metaAds={activeReport.metaAdsReport}
          metaData={activeReport.metaAdsReport}
          googleAds={activeReport.googleAdsReport}
          googleData={activeReport.googleAdsReport}
          period={selectedPeriod}
        />
      )}

      {/* 6. CHANNEL QUICK ACCESS HUB (Rendered in 'all' view right after funnel) */}
      {reportViewTab === 'all' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Platform Reports &amp; Content Hub
            </h3>
            <span className="text-[11px] text-slate-400">Klik card untuk membuka report &amp; planner lengkap</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card TikTok */}
            <div 
              onClick={() => setReportViewTab('tiktok')}
              className="bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition cursor-pointer rounded-2xl p-4 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    TT
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">TikTok &amp; Planner</h4>
                    <span className="text-[10px] text-slate-400">Content Angle &amp; Sound</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition group-hover:translate-x-0.5" />
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Views</span>
                  <strong className="text-slate-800 font-bold">{formatNumber(activeReport.tiktokReport?.totalViews || 0)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Leads TikTok</span>
                  <strong className="text-rose-600 font-extrabold">
                    {activeReport.tiktokReport?.leadsContributed || 0} Leads
                  </strong>
                </div>
              </div>
            </div>

            {/* Card YouTube */}
            <div 
              onClick={() => setReportViewTab('youtube')}
              className="bg-white border border-slate-200 hover:border-red-300 hover:shadow-md transition cursor-pointer rounded-2xl p-4 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                    YT
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-red-600 transition">YouTube Channel</h4>
                    <span className="text-[10px] text-slate-400">Long-form &amp; Shorts</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 transition group-hover:translate-x-0.5" />
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Watch Time</span>
                  <strong className="text-slate-800 font-bold">{activeReport.youtubeReport?.watchTimeHours || 0} Jam</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Impression CTR</span>
                  <strong className="text-red-600 font-extrabold">{activeReport.youtubeReport?.ctr || 0}%</strong>
                </div>
              </div>
            </div>

            {/* Card Website */}
            <div 
              onClick={() => setReportViewTab('website')}
              className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition cursor-pointer rounded-2xl p-4 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    SEO
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition">Website &amp; SEO</h4>
                    <span className="text-[10px] text-slate-400">Query Impressions &amp; Tasks</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition group-hover:translate-x-0.5" />
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Sessions</span>
                  <strong className="text-slate-800 font-bold">{formatNumber(activeReport.websiteReport?.totalSessions || 0)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Tasks Website</span>
                  <strong className="text-indigo-600 font-extrabold">
                    {activeReport.websiteReport?.tasks?.length || 0} Tasks
                  </strong>
                </div>
              </div>
            </div>

            {/* Card Paid Ads */}
            <div 
              onClick={() => setReportViewTab('ads')}
              className="bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md transition cursor-pointer rounded-2xl p-4 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-xs">
                    ADS
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition">Meta &amp; Google Ads</h4>
                    <span className="text-[10px] text-slate-400">Creative Ads &amp; ROAS</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition group-hover:translate-x-0.5" />
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Meta Creatives</span>
                  <strong className="text-slate-800 font-bold">{activeReport.metaAdsReport?.creatives?.length || 0} Ads</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Avg ROAS</span>
                  <strong className="text-emerald-600 font-extrabold">{activeReport.metaAdsReport?.roas || 0}x</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WEEKLY REPORTING SECTION (When in 'weekly' tab) */}
      {reportViewTab === 'weekly' && (
        <WeeklyReportingSection
          brand={brand}
          report={activeReport}
          currentPeriod={selectedPeriod}
          onUpdateWeeklyReports={handleUpdateWeeklyReports}
        />
      )}

      {/* MONTHLY SECTIONS (When in 'all' or 'monthly' tab) */}
      {(reportViewTab === 'all' || reportViewTab === 'monthly') && (
        <>
          {/* SECTION 1: DINAMIKA FOLLOWERS BULANAN (GAIN & UNFOLLOW) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Dinamika Followers Bulanan (Followers Baru vs Unfollow)
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Periode {activeReport.monthYear}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Total Followers */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Total Followers</span>
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {formatNumber(activeReport.totalFollowers)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Akumulasi audiens akun aktif
                </div>
              </div>

              {/* Followers Baru (+ Gained) */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  <span>Followers Baru (+ Follow)</span>
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-2">
                  +{formatNumber(activeReport.followersGained)}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Akuisisi audiens organik baru</span>
                </div>
              </div>

              {/* Unfollow (- Lost) */}
          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/80 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-800">
              <span>Unfollow (- Berhenti)</span>
              <UserMinus className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700 mt-2">
              -{formatNumber(activeReport.followersUnfollowed)}
            </div>
            <div className="text-[11px] font-medium text-rose-600 mt-1">
              Tingkat unfollow / churn: {unfollowRate}%
            </div>
          </div>

          {/* Net Growth */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Net Follower Growth</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              +{formatNumber(activeReport.followersNetGrowth)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span>+{activeReport.followersGrowthPercent}% pertumbuhan bersih</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: KUANTITAS VIEWS & ATTENTION METRICS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Kuantitas Views Konten & Jangkauan
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Akumulasi video views & impressions</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Total Views */}
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-4 rounded-xl border border-blue-200/80 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-800">
              <span>Total Kuantitas Views</span>
              <Video className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-900 mt-2">
              {formatNumber(aggregatedStats.totalViews)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-blue-700">
              <span>Akumulasi pemutaran konten</span>
            </div>
          </div>

          {/* Average Views per Post */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Average Views / Post</span>
              <BarChart3 className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {formatNumber(aggregatedStats.avgViews)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Rata-rata tayangan per postingan
            </div>
          </div>

          {/* Total Reach */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Total Reach (Unique)</span>
              <Eye className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {formatNumber(activeReport.totalReach)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>+{activeReport.reachGrowthPercent}% vs bulan lalu</span>
            </div>
          </div>

          {/* Total Impressions */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Total Impressions</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {formatNumber(activeReport.totalImpressions)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>+{activeReport.impressionsGrowthPercent}% paparan feed</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: METRIK ENGAGEMENT (LIKE, SHARE, COMMENT, SAVE & ER%) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Metrik Engagement (Likes, Shares, Comments, Saves)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Interaksi aktif audiens</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Total Likes */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
              <span>Total Likes</span>
              <Heart className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1.5">
              {formatNumber(aggregatedStats.totalLikes)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Apresiasi audiens</span>
          </div>

          {/* Total Shares */}
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-emerald-800">
              <span>Total Shares</span>
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700 mt-1.5">
              {formatNumber(aggregatedStats.totalShares)}
            </div>
            <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">Indikator viralitas</span>
          </div>

          {/* Total Comments */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
              <span>Comments</span>
              <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1.5">
              {formatNumber(aggregatedStats.totalComments)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Percakapan komunitas</span>
          </div>

          {/* Total Saves */}
          <div className="bg-white p-3.5 rounded-xl border border-indigo-200/80 shadow-xs bg-indigo-50/20">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-indigo-800">
              <span>Total Saves</span>
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-extrabold text-indigo-700 mt-1.5">
              {formatNumber(aggregatedStats.totalSaves)}
            </div>
            <span className="text-[10px] text-indigo-600 block mt-0.5 font-medium">Konten bernilai simpan</span>
          </div>

          {/* Avg ER */}
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs bg-blue-50/30 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-blue-800">
              <span>Engagement Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-black text-blue-900 mt-1.5">
              {activeReport.engagementRate}%
            </div>
            <span className="text-[10px] text-blue-600 block mt-0.5 font-medium">
              +{activeReport.engagementRateChange}% di atas standar
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: REKAP STORIES BULANAN */}
      <StoriesRecapSection
        brandName={brand.name}
        monthYear={selectedPeriod}
        storiesRecap={activeReport.storiesRecap}
        previousReport={previousReport}
        onOpenStoriesModal={onOpenStoriesModal}
      />

      {/* WEEKLY REPORTING SECTION (When in 'all' view tab, displayed right after monthly overview) */}
      {reportViewTab === 'all' && (
        <WeeklyReportingSection
          brand={brand}
          report={activeReport}
          currentPeriod={selectedPeriod}
          onUpdateWeeklyReports={handleUpdateWeeklyReports}
        />
      )}
    </>
  )}

      {/* SECTION 5 & 6: RINCIAN KONTEN & EXECUTIVE SUMMARY (Rendered in 'all' and 'monthly' tabs) */}
      {(reportViewTab === 'all' || reportViewTab === 'monthly') && (
        <>
          {/* SECTION 5: RINCIAN & HASIL KONTEN (DENGAN VISUAL KONTEN & FORMAT KOLOM) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Hidden File Input for Direct Upload */}
        <input 
          type="file" 
          ref={directFileInputRef} 
          onChange={handleDirectFileInputChange} 
          accept="image/*" 
          className="hidden" 
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900">
                Rincian &amp; Hasil Konten ({brand.name})
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {filteredAndSortedPosts.length} Konten
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visual karya konten diperlihatkan secara jelas. Anda dapat meng-up / mengganti foto konten untuk memperlihatkan hasilnya secara terstruktur.
            </p>
          </div>

          {/* Controls: Search, Filter, Sort, & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* View Mode Toggle (Kolom vs Tabel) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 mr-1">
              <button
                type="button"
                onClick={() => setContentViewMode('columns')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                  contentViewMode === 'columns'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Kolom Konten &amp; Visual"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Kolom Konten</span>
              </button>
              <button
                type="button"
                onClick={() => setContentViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                  contentViewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Tabel Rinci"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Tabel Rinci</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={postSearch}
                onChange={e => setPostSearch(e.target.value)}
                placeholder="Cari konten / PIC..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none w-36 md:w-44 font-medium"
              />
            </div>

            {/* Format Filter */}
            <select
              value={formatFilter}
              onChange={e => setFormatFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none"
            >
              <option value="All">Semua Format</option>
              <option value="Reels">Reels</option>
              <option value="Carousel">Carousel</option>
              <option value="Single">Single Image</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none"
            >
              <option value="views">Urut: Views Terbanyak</option>
              <option value="likes">Urut: Likes Terbanyak</option>
              <option value="shares">Urut: Shares Terbanyak</option>
              <option value="saves">Urut: Saves Terbanyak</option>
              <option value="er">Urut: ER% Tertinggi</option>
              <option value="date">Urut: Tanggal Terbaru</option>
            </select>
          </div>
        </div>

        {/* VIEW 1: TAMPILAN KOLOM HASIL KONTEN (VISUAL COLUMN GRID) */}
        {contentViewMode === 'columns' && (
          <div>
            {filteredAndSortedPosts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Image className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Tidak ada konten yang sesuai filter</p>
                <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter format</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
                {filteredAndSortedPosts.map((post) => {
                  const m = post.metrics || {
                    views: 0,
                    reach: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    saves: 0,
                    engagementRate: 0
                  };
                  const totalInteraksi = (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0);
                  const isViral = (m.views || 0) > 40000 || (m.shares || 0) > 300;
                  const isHighER = (m.engagementRate || 0) >= 5.0;

                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col group hover:border-blue-300"
                    >
                      {/* Visual Header / Media Box */}
                      {post.imageUrl ? (
                        <div className="relative w-full h-44 bg-slate-900 overflow-hidden group/thumb">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-95 group-hover:opacity-100"
                          />
                          {/* Format Badge */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {getFormatIcon(post.format)}
                            <span>{post.format}</span>
                          </div>

                          {/* Status Badge */}
                          <div className="absolute top-2.5 right-2.5">
                            {isViral ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                                <Flame className="w-3 h-3" />
                                Viral
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-slate-200">
                                {post.status}
                              </span>
                            )}
                          </div>

                          {/* Quick Hover Actions */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 opacity-0 group-hover/thumb:opacity-100 transition flex items-end justify-between p-3">
                            <button
                              type="button"
                              onClick={() => setPreviewImageModal({ url: post.imageUrl!, title: post.title, post })}
                              className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-bold text-[11px] shadow-sm flex items-center gap-1 transition backdrop-blur-xs"
                            >
                              <Maximize2 className="w-3 h-3 text-blue-600" />
                              <span>Lihat Detail</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenUploadModal(post)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Ganti Foto</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenUploadModal(post)}
                          className="w-full h-44 border-b border-dashed border-slate-300 bg-slate-50/80 hover:bg-blue-50/60 transition flex flex-col items-center justify-center p-4 text-center group/up"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-blue-600 group-hover/up:scale-110 group-hover/up:border-blue-300 transition mb-2">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-xs text-slate-800 group-hover/up:text-blue-700">
                            Up Hasil Konten
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Klik untuk upload foto/screenshot karya
                          </span>
                        </button>
                      )}

                      {/* Content Info */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Date, PIC, & Format */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                            <span className="flex items-center gap-1 text-slate-500 font-medium">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {post.date}
                            </span>
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              PIC: {post.pic}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 
                            className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-700 transition cursor-pointer"
                            onClick={() => onOpenPostMetricsModal(post)}
                            title={post.title}
                          >
                            {post.title}
                          </h4>

                          {post.hook && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              "{post.hook}"
                            </p>
                          )}
                        </div>

                        {/* HASIL REPORT PERFORMA (KOLOM METRIK) */}
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                          {/* Views & Reach Primary Highlight */}
                          <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100/80 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">Kuantitas Views</span>
                              <strong className="text-blue-950 font-black text-base leading-tight">
                                {formatNumber(m.views || 0)}
                              </strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Reach Akun</span>
                              <strong className="text-slate-800 font-extrabold text-xs">
                                {formatNumber(m.reach || 0)}
                              </strong>
                            </div>
                          </div>

                          {/* 4 Kolom Interaksi */}
                          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 block font-semibold flex items-center justify-center gap-0.5">
                                <Heart className="w-2.5 h-2.5 text-rose-500" /> Likes
                              </span>
                              <strong className="text-slate-800 text-[11px] font-bold block mt-0.5">
                                {formatNumber(m.likes || 0)}
                              </strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 block font-semibold flex items-center justify-center gap-0.5">
                                <Share2 className="w-2.5 h-2.5 text-emerald-600" /> Share
                              </span>
                              <strong className="text-emerald-700 text-[11px] font-bold block mt-0.5">
                                {formatNumber(m.shares || 0)}
                              </strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 block font-semibold flex items-center justify-center gap-0.5">
                                <MessageCircle className="w-2.5 h-2.5 text-blue-500" /> Komen
                              </span>
                              <strong className="text-slate-800 text-[11px] font-bold block mt-0.5">
                                {formatNumber(m.comments || 0)}
                              </strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 block font-semibold flex items-center justify-center gap-0.5">
                                <Bookmark className="w-2.5 h-2.5 text-indigo-600" /> Save
                              </span>
                              <strong className="text-indigo-700 text-[11px] font-bold block mt-0.5">
                                {formatNumber(m.saves || 0)}
                              </strong>
                            </div>
                          </div>

                          {/* ER & Total Interaksi Row */}
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-slate-500 text-[10px]">
                              Total Interaksi: <strong className="text-slate-900">{formatNumber(totalInteraksi)}</strong>
                            </span>
                            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                              isHighER ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              ER: {m.engagementRate || (m.views ? ((totalInteraksi / m.views) * 100).toFixed(2) : 0)}%
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenUploadModal(post)}
                            className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Upload className="w-3 h-3 text-slate-500" />
                            <span>{post.imageUrl ? 'Ganti Foto' : 'Up Konten'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPostMetricsModal(post)}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Log Metrik</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: TAMPILAN TABEL LENGKAP DENGAN PREVIEW KONTEN */}
        {contentViewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                  <th className="py-3 px-3">Visual Konten</th>
                  <th className="py-3 px-2">Tanggal</th>
                  <th className="py-3 px-2">PIC</th>
                  <th className="py-3 px-2 text-right">Kuantitas Views</th>
                  <th className="py-3 px-2 text-right">Reach</th>
                  <th className="py-3 px-2 text-right">Likes</th>
                  <th className="py-3 px-2 text-right">Shares</th>
                  <th className="py-3 px-2 text-right">Comments</th>
                  <th className="py-3 px-2 text-right">Saves</th>
                  <th className="py-3 px-2 text-right">Total Interaksi</th>
                  <th className="py-3 px-2 text-right">ER %</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAndSortedPosts.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400">
                      Tidak ada konten yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedPosts.map((post) => {
                    const m = post.metrics || {
                      views: 0,
                      reach: 0,
                      likes: 0,
                      comments: 0,
                      shares: 0,
                      saves: 0,
                      engagementRate: 0
                    };
                    const totalInteraksi = (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0);
                    const isViral = (m.views || 0) > 40000 || (m.shares || 0) > 300;
                    const isHighER = (m.engagementRate || 0) >= 5.0;

                    return (
                      <tr key={post.id} className="hover:bg-slate-50/80 transition group">
                        {/* Visual Konten & Judul */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3 max-w-sm">
                            {post.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewImageModal({ url: post.imageUrl!, title: post.title, post })}
                                className="relative group/thumb shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-2xs"
                                title="Klik untuk lihat gambar penuh"
                              >
                                <img
                                  src={post.imageUrl}
                                  alt={post.title}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 object-cover group-hover/thumb:scale-110 transition duration-200"
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center text-white">
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenUploadModal(post)}
                                className="w-12 h-12 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 shrink-0 transition"
                                title="Up gambar konten ini"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-bold mt-0.5">Up</span>
                              </button>
                            )}

                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                {post.title}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {getFormatIcon(post.format)}
                                  {post.format}
                                </span>
                                {m.avgWatchPercentage && (
                                  <span className="text-[10px] text-purple-600 font-medium">
                                    · {m.avgWatchPercentage}% watch
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tanggal */}
                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap text-[11px]">
                          {post.date}
                        </td>

                        {/* PIC */}
                        <td className="py-3 px-2 whitespace-nowrap font-semibold text-slate-700 text-[11px]">
                          {post.pic}
                        </td>

                        {/* Views */}
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <span className="font-black text-blue-900 text-sm">
                            {formatNumber(m.views || 0)}
                          </span>
                        </td>

                        {/* Reach */}
                        <td className="py-3 px-2 text-right whitespace-nowrap text-slate-600 font-semibold">
                          {formatNumber(m.reach || 0)}
                        </td>

                        {/* Likes */}
                        <td className="py-3 px-2 text-right whitespace-nowrap text-slate-700">
                          {formatNumber(m.likes || 0)}
                        </td>

                        {/* Shares */}
                        <td className="py-3 px-2 text-right whitespace-nowrap text-emerald-700 font-semibold">
                          {formatNumber(m.shares || 0)}
                        </td>

                        {/* Comments */}
                        <td className="py-3 px-2 text-right whitespace-nowrap text-slate-700">
                          {formatNumber(m.comments || 0)}
                        </td>

                        {/* Saves */}
                        <td className="py-3 px-2 text-right whitespace-nowrap text-indigo-700 font-semibold">
                          {formatNumber(m.saves || 0)}
                        </td>

                        {/* Total Interaksi */}
                        <td className="py-3 px-2 text-right whitespace-nowrap font-extrabold text-slate-900">
                          {formatNumber(totalInteraksi)}
                        </td>

                        {/* ER % */}
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-black ${
                            isHighER ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {m.engagementRate || (m.views ? ((totalInteraksi / m.views) * 100).toFixed(2) : 0)}%
                          </span>
                        </td>

                        {/* Status Tag */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          {isViral ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Flame className="w-3 h-3 text-amber-600" />
                              Viral
                            </span>
                          ) : post.status === 'Published' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Published
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {post.status}
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenUploadModal(post)}
                              title={post.imageUrl ? 'Ganti Foto' : 'Up Foto Konten'}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 transition"
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenPostMetricsModal(post)}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-semibold text-[11px] transition flex items-center gap-1 shadow-2xs"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Metrik</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

          {/* SECTION 6: PLATFORM BREAKDOWN & EXECUTIVE SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Executive Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Executive Summary & Evaluasi</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-3.5">
                {activeReport.executiveSummary}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>PIC Brand: {brand.pic}</span>
                <span>Status: Terverifikasi Dreamlab Lead</span>
              </div>
            </div>

            {/* Strategic Next Steps */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Rekomendasi Strategis Bulan Depan</h3>
              </div>
              <div className="space-y-2 mt-3.5">
                {activeReport.strategicRecommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* LIGHTBOX MODAL: PREVIEW VISUAL KONTEN FULL */}
      {previewImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {getFormatIcon(previewImageModal.post.format)}
                    {previewImageModal.post.format}
                  </span>
                  <span className="text-[11px] text-slate-400">· {previewImageModal.post.date} · PIC: {previewImageModal.post.pic}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">{previewImageModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Full Image */}
            <div className="bg-slate-950 flex items-center justify-center p-2 max-h-[55vh] overflow-hidden">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.title}
                referrerPolicy="no-referrer"
                className="max-h-[50vh] max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Performance Stats Breakdown */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Views</span>
                  <strong className="text-blue-900 font-black text-sm block mt-0.5">
                    {formatNumber(previewImageModal.post.metrics?.views || 0)}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Reach</span>
                  <strong className="text-slate-800 font-bold text-xs block mt-0.5">
                    {formatNumber(previewImageModal.post.metrics?.reach || 0)}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Likes</span>
                  <strong className="text-slate-800 font-bold text-xs block mt-0.5">
                    {formatNumber(previewImageModal.post.metrics?.likes || 0)}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Shares</span>
                  <strong className="text-emerald-700 font-bold text-xs block mt-0.5">
                    {formatNumber(previewImageModal.post.metrics?.shares || 0)}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Comments</span>
                  <strong className="text-slate-800 font-bold text-xs block mt-0.5">
                    {formatNumber(previewImageModal.post.metrics?.comments || 0)}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">ER%</span>
                  <strong className="text-indigo-700 font-black text-xs block mt-0.5">
                    {previewImageModal.post.metrics?.engagementRate || 0}%
                  </strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const p = previewImageModal.post;
                    setPreviewImageModal(null);
                    handleOpenUploadModal(p);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti / Up Foto Lain</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const p = previewImageModal.post;
                      setPreviewImageModal(null);
                      onOpenPostMetricsModal(p);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Log Metrik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewImageModal(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL: UP VISUAL KONTEN UNTUK REPORT */}
      {uploadModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <div className="text-[10px] font-bold tracking-wider text-blue-700 uppercase">UP VISUAL KONTEN HASIL REPORT</div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-1">
                  {uploadModalPost.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Format: {uploadModalPost.format} · PIC: {uploadModalPost.pic}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalPost(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selection */}
            <div className="p-5 space-y-4 text-xs">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setActiveUploadTab('file')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                    activeUploadTab === 'file'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File dari Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUploadTab('url')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                    activeUploadTab === 'url'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Input Link URL Gambar</span>
                </button>
              </div>

              {/* Tab 1: File Upload */}
              {activeUploadTab === 'file' && (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition group">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:border-blue-300 transition mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 group-hover:text-blue-700">
                      Klik atau Drag Foto Konten ke Sini
                    </span>
                    <span className="text-slate-400 text-[11px] mt-1 text-center">
                      Mendukung screenshot postingan, visual feeds/reels (PNG, JPG, WebP)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleModalFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Tab 2: URL Input */}
              {activeUploadTab === 'url' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      URL Gambar (Link Langsung)
                    </label>
                    <input
                      type="url"
                      value={uploadInputUrl}
                      onChange={e => setUploadInputUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... atau link foto"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {uploadInputUrl && (
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Preview Gambar:</span>
                      <img
                        src={uploadInputUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="h-32 mx-auto object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveModalUrl}
                    disabled={!uploadInputUrl.trim()}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition"
                  >
                    Terapkan Link Gambar
                  </button>
                </div>
              )}

              {/* Preset Visuals for Instant Testing */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Atau Pilih Contoh Visual Siap Pakai:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Reels Studio', url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80' },
                    { label: 'Skin Glow', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80' },
                    { label: 'Tech Workspace', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80' },
                    { label: 'Serum Bottle', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (uploadModalPost && onUpdatePostMedia) {
                          onUpdatePostMedia(uploadModalPost.id, preset.url);
                          setUploadModalPost(null);
                        }
                      }}
                      className="group/preset p-1 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 transition text-center"
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-12 object-cover rounded mb-1"
                      />
                      <span className="text-[9px] font-semibold text-slate-600 group-hover/preset:text-blue-700 line-clamp-1">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Image & Remove Option */}
              {uploadModalPost.imageUrl && (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Sudah ada gambar terpasang</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleRemovePostImage(uploadModalPost.id);
                      setUploadModalPost(null);
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                  >
                    Hapus Foto Konten
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
