'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PostItem, 
  PostStatus, 
  DatabaseViewType, 
  ViewFilter, 
  ViewSort, 
  MetaAccountConfig, 
  MetaInsightsSummary,
  MetaDailyTrend,
  DemographicData,
  BestTimeSlot,
  CampaignOKR,
  SocialPlatform,
  ContentPillar,
} from './types';
import { TableView } from './components/views/TableView';
import { BoardView } from './components/views/BoardView';
import { CalendarView } from './components/views/CalendarView';
import { GalleryView } from './components/views/GalleryView';
import { ListView } from './components/views/ListView';
import { MetaAnalyticsView } from './components/views/MetaAnalyticsView';
import { MetaApiHubView } from './components/views/MetaApiHubView';
import { CampaignOkrsView } from './components/views/CampaignOkrsView';
import { AiStudioView } from './components/views/AiStudioView';
import { PostDrawer } from './components/PostDrawer';
import { NewPostModal } from './components/NewPostModal';
import { platformConfig, formatNumber } from './utils/notionStyles';
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaTabNav,
  DnaToolbar,
  DnaButton,
} from '@/components/dna';
import {
  Table,
  LayoutGrid,
  Calendar,
  Image as ImageIcon,
  List,
  BarChart3,
  Zap,
  Target,
  Sparkles,
  Plus,
  RefreshCw,
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react';
import {
  useCreateSocialPost,
  useDeleteSocialPost,
  useFetchMetaInsights,
  useSocialPosts,
  useUpdateSocialPost,
} from '@/hooks/useSocialPlanner';

const EMPTY_META_ACCOUNT: MetaAccountConfig = {
  accessToken: '',
  pageId: '',
  pageName: '',
  igAccountId: '',
  igUsername: '',
  profilePictureUrl: '',
  isConnected: false,
  isLiveApi: false,
  permissions: [],
  followersCount: 0,
  igFollowersCount: 0,
};

const PLATFORMS: { id: SocialPlatform | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'Semua Platform', icon: '🌐' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'facebook', label: 'Facebook', icon: '👥' },
  { id: 'threads', label: 'Threads', icon: '🧵' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
];

export default function SocialTrackerClient() {
  const socialPostsQuery = useSocialPosts();
  const createPostMutation = useCreateSocialPost();
  const updatePostMutation = useUpdateSocialPost();
  const deletePostMutation = useDeleteSocialPost();
  const fetchMetaInsightsMutation = useFetchMetaInsights();
  const updateTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Database View State
  const [activeView, setActiveView] = useState<DatabaseViewType>('table');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Content Data State
  const [posts, setPosts] = useState<PostItem[]>([]);

  // Meta Insights State
  const [insights, setInsights] = useState<MetaInsightsSummary | null>(null);

  // Meta Account Config State
  const [metaAccount, setMetaAccount] = useState<MetaAccountConfig>(EMPTY_META_ACCOUNT);

  const [campaignOkrs] = useState<CampaignOKR[]>([]);
  const [dailyTrends, setDailyTrends] = useState<MetaDailyTrend[]>([]);
  const [demographics, setDemographics] = useState<DemographicData | null>(null);
  const [bestTimeSlots] = useState<BestTimeSlot[]>([]);
  const [insightsSyncedAt, setInsightsSyncedAt] = useState<string | null>(null);

  // Filter & Sort State
  const [filter, setFilter] = useState<ViewFilter>({
    platform: 'all',
    status: 'all',
    pillar: 'all',
    search: '',
  });

  const [sort, setSort] = useState<ViewSort>({
    field: 'scheduledDate',
    direction: 'asc',
  });

  // Drawer & Modal State
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [modalInitialStatus, setModalInitialStatus] = useState<PostStatus>('idea');
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);

  // Syncing State
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // The database is authoritative. API failures must never reveal sample data.
  useEffect(() => {
    if (socialPostsQuery.data) setPosts(socialPostsQuery.data);
    else if (socialPostsQuery.isError) setPosts([]);
  }, [socialPostsQuery.data, socialPostsQuery.isError]);

  useEffect(() => () => {
    updateTimers.current.forEach((timer) => clearTimeout(timer));
    updateTimers.current.clear();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync Meta Graph API Handler
  const handleSyncMeta = async () => {
    setIsSyncingMeta(true);
    try {
      if (!metaAccount.accessToken.trim()) {
        showToast('ℹ️ Mode manual aktif. Tambahkan token hanya jika ingin sinkronisasi Meta.');
        return;
      }
      const data = await fetchMetaInsightsMutation.mutateAsync({
        accessToken: metaAccount.accessToken,
        igAccountId: metaAccount.igAccountId || undefined,
        pageId: metaAccount.pageId || undefined,
      });
      if (!data.success || !data.insights) {
        throw new Error('Meta API belum mengembalikan kontrak analytics yang dapat diverifikasi.');
      }
      const syncedAt = new Date().toISOString();
      setInsights(data.insights);
      setDailyTrends(data.dailyTrends || []);
      setDemographics(data.demographics || null);
      setInsightsSyncedAt(syncedAt);
      setMetaAccount((prev) => ({ ...prev, lastSyncTime: syncedAt, isConnected: true, isLiveApi: true }));
      showToast('✅ Data Meta Business Suite berhasil diperbarui dari API.');
    } catch {
      setInsights(null);
      setDailyTrends([]);
      setDemographics(null);
      setInsightsSyncedAt(null);
      showToast('Meta API belum dapat disinkronkan. Tidak ada angka fallback yang ditampilkan.');
    } finally {
      setIsSyncingMeta(false);
    }
  };

  // Filter & Sort computation
  const filteredAndSortedPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (filter.platform && filter.platform !== 'all' && post.platform !== filter.platform) {
          return false;
        }
        if (filter.status && filter.status !== 'all' && post.status !== filter.status) {
          return false;
        }
        if (filter.pillar && filter.pillar !== 'all' && post.pillar !== filter.pillar) {
          return false;
        }
        if (filter.search) {
          const q = filter.search.toLowerCase();
          const matchTitle = post.title.toLowerCase().includes(q);
          const matchCaption = post.caption?.toLowerCase().includes(q);
          const matchTags = post.hashtags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchCaption && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort.field === 'scheduledDate') {
          const dateA = new Date(a.scheduledDate).getTime();
          const dateB = new Date(b.scheduledDate).getTime();
          return sort.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sort.field === 'performance.reach') {
          const reachA = a.performance?.reach || 0;
          const reachB = b.performance?.reach || 0;
          return sort.direction === 'asc' ? reachA - reachB : reachB - reachA;
        }
        if (sort.field === 'performance.engagementRate') {
          const engA = a.performance?.engagementRate || 0;
          const engB = b.performance?.engagementRate || 0;
          return sort.direction === 'asc' ? engA - engB : engB - engA;
        }
        if (sort.field === 'title') {
          return sort.direction === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        return 0;
      });
  }, [posts, filter, sort]);

  // Post Actions
  const handleOpenPost = (post: PostItem) => {
    setSelectedPost(post);
    setIsDrawerOpen(true);
  };

  const handleUpdateStatus = (postId: string, newStatus: PostStatus) => {
    const current = posts.find((post) => post.id === postId);
    if (!current) return;
    const updated = { ...current, status: newStatus, updatedAt: new Date().toISOString() };
    setPosts((prev) => prev.map((post) => (post.id === postId ? updated : post)));
    updatePostMutation.mutate(
      { id: postId, data: { status: newStatus } },
      { onError: () => { setPosts((prev) => prev.map((post) => (post.id === postId ? current : post))); showToast('Status belum dapat disimpan.'); } },
    );
    showToast(`Status konten diubah ke: ${newStatus.toUpperCase()}`);
  };

  const handleUpdatePost = (updated: PostItem) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPost(updated);
    const existingTimer = updateTimers.current.get(updated.id);
    if (existingTimer) clearTimeout(existingTimer);
    updateTimers.current.set(updated.id, setTimeout(() => {
      updatePostMutation.mutate(
        { id: updated.id, data: updated },
        {
          onSuccess: (saved) => {
            setPosts((prev) => prev.map((post) => (post.id === saved.id ? saved : post)));
            setSelectedPost((current) => current?.id === saved.id ? saved : current);
          },
          onError: () => {
            socialPostsQuery.refetch();
            showToast('Perubahan belum dapat disimpan. Data akan dimuat ulang.');
          },
        },
      );
      updateTimers.current.delete(updated.id);
    }, 350));
  };

  const handleDeletePost = (postId: string) => {
    deletePostMutation.mutate(postId, {
      onSuccess: () => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setIsDrawerOpen(false);
        setSelectedPost(null);
        showToast('Konten berhasil dihapus.');
      },
      onError: () => showToast('Konten belum dapat dihapus.'),
    });
  };

  const handleAddNewPost = () => {
    setModalInitialStatus('idea');
    setModalInitialDate(undefined);
    setIsNewPostModalOpen(true);
  };

  const handleAddNewPostWithStatus = (status: PostStatus) => {
    setModalInitialStatus(status);
    setModalInitialDate(undefined);
    setIsNewPostModalOpen(true);
  };

  const handleAddNewPostForDate = (dateStr: string) => {
    setModalInitialStatus('scheduled');
    setModalInitialDate(dateStr);
    setIsNewPostModalOpen(true);
  };

  const handleSaveNewPost = (newPost: PostItem) => {
    createPostMutation.mutate(newPost, {
      onSuccess: (saved) => {
        setPosts((prev) => [saved, ...prev.filter((post) => post.id !== saved.id)]);
        showToast('✨ Konten baru berhasil ditambahkan!');
      },
      onError: () => showToast('Konten baru belum dapat disimpan.'),
    });
  };

  const handleInsertFromAiStudio = (aiPostPartial: Partial<PostItem>) => {
    const newPost: PostItem = {
      id: `post-${Date.now()}`,
      title: aiPostPartial.title || 'Untitled Content',
      platform: aiPostPartial.platform || 'instagram',
      contentType: aiPostPartial.contentType || 'reel',
      status: aiPostPartial.status || 'scripting',
      scheduledDate: '2026-09-08T18:00',
      pillar: aiPostPartial.pillar || 'Educational',
      coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80',
      caption: aiPostPartial.caption || '',
      hooks: aiPostPartial.hooks || [],
      cta: aiPostPartial.cta || 'Follow untuk tips harian!',
      hashtags: aiPostPartial.hashtags || ['#socialmediaplanner', '#contentmarketing'],
      targetAudience: aiPostPartial.targetAudience || 'Audience Indonesia',
      notes: aiPostPartial.notes || '',
      author: {
        id: 'u-1',
        name: 'Sarah Nabila',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'Social Media Lead',
      },
      checklist: [
        { id: 'c-1', text: 'Scripting & Hook Validation', done: true },
        { id: 'c-2', text: 'Visual Asset Creation', done: false },
        { id: 'c-3', text: 'Schedule to Meta Suite', done: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveView('table');
    createPostMutation.mutate(newPost, {
      onSuccess: (saved) => {
        setPosts((prev) => [saved, ...prev]);
        setSelectedPost(saved);
        setIsDrawerOpen(true);
        showToast('✨ Konten dari AI Studio berhasil disimpan!');
      },
      onError: () => showToast('Konten AI belum dapat disimpan.'),
    });
  };

  const counts = {
    total: posts.length,
    ideas: posts.filter((p) => p.status === 'idea').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    published: posts.filter((p) => p.status === 'published').length,
  };

  return (
    <DnaPageContainer className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-2xl border border-slate-700 animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Layer 01: Ultra-Clean Un-boxed Header */}
      {/* Layer 01: Ultra-Clean Un-boxed Header */}
      <DnaPageHeader
        title="SOCIAL MEDIA PLANNER & TRACKER"
        subtitle="Multi-Platform Content Calendar, Creative Briefing & Meta Graph API Integration"
        breadcrumbs={[
          { label: 'Marketing', href: '/marketing/dashboard' },
          { label: 'Social Media Tracker' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncMeta}
              disabled={isSyncingMeta}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Tarik & Sinkronisasi Data dari Meta API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMeta ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isSyncingMeta ? 'Sinkronisasi...' : 'Sync Meta API'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddNewPost()}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold shadow-2xs cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Konten
            </button>
          </div>
        }
      />

      {socialPostsQuery.isError && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          Data content planner tidak tersedia karena API gagal dimuat. Data contoh tidak ditampilkan.
        </div>
      )}

      {/* Layer 02: 4 KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
        <DnaStatCard
          label="KONTEN TERJADWAL"
          value={`${counts.scheduled} Konten`}
          subtext={`Dari total ${counts.total} ide & draft`}
          icon={<Calendar className="w-4 h-4" />}
          variant="blue"
        />
        <DnaStatCard
          label="TOTAL META REACH"
          value={insights ? formatNumber(insights.totalReach) : '—'}
          subtext={insightsSyncedAt ? `Meta API • ${new Date(insightsSyncedAt).toLocaleString('id-ID')}` : 'Belum ada data API terverifikasi'}
          icon={<TrendingUp className="w-4 h-4" />}
          variant="emerald"
        />
        <DnaStatCard
          label="AVG ENGAGEMENT"
          value={insights ? `${insights.engagementRate}%` : '—'}
          subtext={insightsSyncedAt ? 'Sumber: Meta Graph API' : 'Belum ada data API terverifikasi'}
          icon={<Sparkles className="w-4 h-4" />}
          variant="amber"
        />
        <DnaStatCard
          label="CAMPAIGN OKRS"
          value={campaignOkrs.length > 0 ? `${campaignOkrs.length} OKR` : '—'}
          subtext="API Campaign OKR belum tersedia"
          icon={<Target className="w-4 h-4" />}
          variant="sky"
        />
      </div>

      {/* Layer 03: Bordered Tab Nav Container */}
      <DnaTabNav
        tabs={[
          { id: 'table', label: 'Tabel', icon: Table },
          { id: 'board', label: 'Kanban', icon: LayoutGrid },
          { id: 'calendar', label: 'Kalender', icon: Calendar },
          { id: 'gallery', label: 'Galeri', icon: ImageIcon },
          { id: 'list', label: 'Daftar', icon: List },
          { id: 'meta_analytics', label: 'Meta Analytics', icon: BarChart3 },
          { id: 'api_hub', label: 'Meta API Hub', icon: Zap },
          { id: 'campaign_okrs', label: 'Campaign OKRs', icon: Target },
          { id: 'ai_studio', label: 'AI Copy Studio', icon: Sparkles },
        ]}
        activeTab={activeView}
        onChange={(tabId) => setActiveView(tabId as DatabaseViewType)}
        className="mt-[22px]"
      />

      {/* Layer 04: Filter Bar & Platform Pills */}
      <div className="mt-[18px] space-y-2.5">
        {/* Quick Platform Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Platform:
          </span>
          {PLATFORMS.map((p) => {
            const isActive = filter.platform === p.id;
            const countForPlatform =
              p.id === 'all'
                ? posts.length
                : posts.filter((item) => item.platform === p.id).length;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setFilter((prev) => ({ ...prev, platform: p.id }))}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {countForPlatform}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <DnaToolbar
          search={filter.search}
          onSearchChange={(val) => setFilter((prev) => ({ ...prev, search: val }))}
          searchPlaceholder="Cari judul konten, caption, atau hashtag..."
          variant="card"
          filters={
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Select */}
              <select
                value={filter.status}
                onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value as any }))}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[12px] font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="idea">💡 Ide</option>
                <option value="draft">📝 Draft</option>
                <option value="review">👀 Review</option>
                <option value="scheduled">⏰ Scheduled</option>
                <option value="published">✅ Published</option>
              </select>

              {/* Pillar Select */}
              <select
                value={filter.pillar}
                onChange={(e) => setFilter((prev) => ({ ...prev, pillar: e.target.value as any }))}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[12px] font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="all">Semua Pillar</option>
                <option value="Educational">📚 Educational</option>
                <option value="Behind The Scene">🎬 Behind The Scene</option>
                <option value="Promotion">🔥 Promotion</option>
                <option value="Social Proof">⭐ Social Proof</option>
                <option value="Entertainment">🎭 Entertainment</option>
              </select>

              {/* Sort Select */}
              <select
                value={`${sort.field}-${sort.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-') as [any, any];
                  setSort({
                    field: field === 'reach'
                      ? 'performance.reach'
                      : field === 'engagementRate'
                        ? 'performance.engagementRate'
                        : field,
                    direction,
                  });
                }}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[12px] font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="scheduledDate-asc">📅 Jadwal Terdekat</option>
                <option value="scheduledDate-desc">📅 Jadwal Terjauh</option>
                <option value="createdAt-desc">⏱️ Dibuat Terbaru</option>
                <option value="reach-desc">👥 Reach Tertinggi</option>
                <option value="engagementRate-desc">⭐ Engagement Tertinggi</option>
              </select>
            </div>
          }
          onReset={() => {
            setFilter({
              platform: 'all',
              status: 'all',
              pillar: 'all',
              search: '',
            });
            setSort({ field: 'scheduledDate', direction: 'asc' });
          }}
          isFiltered={
            filter.platform !== 'all' ||
            filter.status !== 'all' ||
            filter.pillar !== 'all' ||
            !!filter.search
          }
        />
      </div>

      {/* Layer 05: Active Database View Body */}
      <div className="mt-[18px]">
        {activeView === 'table' && (
          <TableView
            posts={filteredAndSortedPosts}
            onOpenPost={handleOpenPost}
            onUpdateStatus={handleUpdateStatus}
            onAddNewPost={handleAddNewPost}
          />
        )}

        {activeView === 'board' && (
          <BoardView
            posts={filteredAndSortedPosts}
            onOpenPost={handleOpenPost}
            onUpdateStatus={handleUpdateStatus}
            onAddNewPostWithStatus={handleAddNewPostWithStatus}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView
            posts={filteredAndSortedPosts}
            onOpenPost={handleOpenPost}
            onAddNewPostForDate={handleAddNewPostForDate}
          />
        )}

        {activeView === 'gallery' && (
          <GalleryView
            posts={filteredAndSortedPosts}
            onOpenPost={handleOpenPost}
            onAddNewPost={handleAddNewPost}
          />
        )}

        {activeView === 'list' && (
          <ListView
            posts={filteredAndSortedPosts}
            onOpenPost={handleOpenPost}
            onUpdateStatus={handleUpdateStatus}
            onAddNewPost={handleAddNewPost}
          />
        )}

        {activeView === 'meta_analytics' && (
          <MetaAnalyticsView
            insights={insights}
            dailyTrends={dailyTrends}
            demographics={demographics}
            bestTimeSlots={bestTimeSlots}
            posts={posts}
            metaAccount={metaAccount}
            syncedAt={insightsSyncedAt}
            onSyncMeta={handleSyncMeta}
            isSyncing={isSyncingMeta}
            onOpenPost={handleOpenPost}
          />
        )}

        {activeView === 'api_hub' && (
          <MetaApiHubView
            metaAccount={metaAccount}
            setMetaAccount={setMetaAccount}
            onSyncMeta={handleSyncMeta}
            isSyncing={isSyncingMeta}
          />
        )}

        {activeView === 'campaign_okrs' && (
          <CampaignOkrsView
            okrs={campaignOkrs}
            posts={posts}
            onOpenPost={handleOpenPost}
          />
        )}

        {activeView === 'ai_studio' && (
          <AiStudioView onInsertAsNewPost={handleInsertFromAiStudio} />
        )}
      </div>

      {/* Notion Document / Post Drawer */}
      <PostDrawer
        post={selectedPost}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedPost(null);
        }}
        onUpdatePost={handleUpdatePost}
        onDeletePost={handleDeletePost}
      />

      {/* Quick Add Post Modal */}
      <NewPostModal
        isOpen={isNewPostModalOpen}
        onClose={() => setIsNewPostModalOpen(false)}
        onSave={handleSaveNewPost}
        initialStatus={modalInitialStatus}
        initialDate={modalInitialDate}
      />
    </DnaPageContainer>
  );
}
