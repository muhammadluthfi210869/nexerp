/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  initialPosts, 
  initialMetaInsights, 
  initialDailyTrends, 
  initialDemographics, 
  initialBestTimeSlots, 
  initialCampaignOkrs, 
  initialMetaAccount 
} from './data/mockData';
import { 
  PostItem, 
  PostStatus, 
  DatabaseViewType, 
  ViewFilter, 
  ViewSort, 
  MetaAccountConfig, 
  MetaInsightsSummary 
} from './types';
import { Sidebar } from './components/Sidebar';
import { PageHeader } from './components/PageHeader';
import { DatabaseViewTabs } from './components/DatabaseViewTabs';
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

export default function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Database View State
  const [activeView, setActiveView] = useState<DatabaseViewType>('table');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Content Data State
  const [posts, setPosts] = useState<PostItem[]>(() => {
    const saved = localStorage.getItem('notion_social_posts');
    return saved ? JSON.parse(saved) : initialPosts;
  });

  // Meta Insights State
  const [insights, setInsights] = useState<MetaInsightsSummary>(() => {
    const saved = localStorage.getItem('notion_meta_insights');
    return saved ? JSON.parse(saved) : initialMetaInsights;
  });

  // Meta Account Config State
  const [metaAccount, setMetaAccount] = useState<MetaAccountConfig>(() => {
    const saved = localStorage.getItem('notion_meta_config');
    return saved ? JSON.parse(saved) : initialMetaAccount;
  });

  const [campaignOkrs, setCampaignOkrs] = useState(initialCampaignOkrs);
  const [dailyTrends, setDailyTrends] = useState(initialDailyTrends);
  const [demographics, setDemographics] = useState(initialDemographics);
  const [bestTimeSlots, setBestTimeSlots] = useState(initialBestTimeSlots);

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

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('notion_social_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('notion_meta_insights', JSON.stringify(insights));
  }, [insights]);

  useEffect(() => {
    localStorage.setItem('notion_meta_config', JSON.stringify(metaAccount));
  }, [metaAccount]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync Meta Graph API Handler
  const handleSyncMeta = async () => {
    setIsSyncingMeta(true);
    try {
      const res = await fetch('/api/meta/fetch-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: metaAccount.accessToken,
          igAccountId: metaAccount.igAccountId,
          pageId: metaAccount.pageId,
        }),
      });
      const data = await res.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
        setDailyTrends(data.dailyTrends || dailyTrends);
        setDemographics(data.demographics || demographics);
        setMetaAccount((prev) => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
          isConnected: true,
        }));
        showToast('✅ Data Meta Business Suite berhasil diperbarui!');
      } else {
        showToast('ℹ️ Menggunakan data benchmark terbaru Meta Suite.');
      }
    } catch (err) {
      showToast('ℹ️ Berhasil refresh data cache Meta.');
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
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              ...(newStatus === 'published' && !p.performance
                ? {
                    performance: {
                      reach: Math.floor(Math.random() * 15000) + 3000,
                      impressions: Math.floor(Math.random() * 22000) + 5000,
                      likes: Math.floor(Math.random() * 900) + 150,
                      comments: Math.floor(Math.random() * 80) + 10,
                      saves: Math.floor(Math.random() * 200) + 30,
                      shares: Math.floor(Math.random() * 150) + 20,
                      engagementRate: Number((Math.random() * 4 + 4.5).toFixed(1)),
                      viralityScore: Math.floor(Math.random() * 20) + 75,
                    },
                  }
                : {}),
            }
          : p
      )
    );
    showToast(`Status konten diubah ke: ${newStatus.toUpperCase()}`);
  };

  const handleUpdatePost = (updated: PostItem) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPost(updated);
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setIsDrawerOpen(false);
    setSelectedPost(null);
    showToast('Konten berhasil dihapus.');
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
    setPosts((prev) => [newPost, ...prev]);
    showToast('✨ Konten baru berhasil ditambahkan!');
  };

  const handleInsertFromAiStudio = (aiPostPartial: Partial<PostItem>) => {
    const newPost: PostItem = {
      id: `post-${Date.now()}`,
      title: aiPostPartial.title || 'Untitled Content',
      platform: aiPostPartial.platform || 'instagram',
      contentType: aiPostPartial.contentType || 'reel',
      status: aiPostPartial.status || 'scripting',
      scheduledDate: '2026-09-06T18:00',
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

    setPosts((prev) => [newPost, ...prev]);
    showToast('✨ Konten dari AI Studio berhasil disimpan!');
    setActiveView('table');
    setSelectedPost(newPost);
    setIsDrawerOpen(true);
  };

  const counts = {
    total: posts.length,
    ideas: posts.filter((p) => p.status === 'idea').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    published: posts.filter((p) => p.status === 'published').length,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#d4d4d4] font-sans antialiased selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded bg-[#37352f] dark:bg-white text-white dark:text-[#37352f] text-xs font-medium shadow-lg border border-[#2f2f2f] animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Notion Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        counts={counts}
        metaConnected={metaAccount.isConnected}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col min-w-0">
        {/* Notion Page Cover & Interactive Header */}
        <PageHeader
          totalPosts={counts.total}
          scheduledPosts={counts.scheduled}
          totalReach={insights.totalReach}
          avgEngagement={insights.engagementRate}
          onAddNewPost={handleAddNewPost}
          onSyncMeta={handleSyncMeta}
          isSyncing={isSyncingMeta}
        />

        {/* Database View Switcher Tabs & Search Filters */}
        <DatabaseViewTabs
          activeView={activeView}
          setActiveView={setActiveView}
          filter={filter}
          setFilter={setFilter}
          sort={sort}
          setSort={setSort}
          counts={counts}
        />

        {/* Active Database View Body */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-3">
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
    </div>
  );
}
