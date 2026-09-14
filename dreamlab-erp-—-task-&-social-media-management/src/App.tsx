import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { 
  ActivePage, 
  Member, 
  Task, 
  Brand, 
  SocialPost, 
  BrandReport, 
  TaskStatus, 
  PostStatus,
  DailyStoryRecap 
} from './types';
import { 
  INITIAL_MEMBERS, 
  INITIAL_TASKS, 
  INITIAL_BRANDS, 
  INITIAL_POSTS, 
  INITIAL_REPORTS 
} from './data/initialData';

import { Sidebar } from './components/Sidebar';
import { TaskOverview } from './components/TaskOverview';
import { MemberProfileView } from './components/MemberProfileView';
import { ContentPlannerView } from './components/ContentPlannerView';
import { BrandReportingView } from './components/BrandReportingView';

import { 
  TaskModal, 
  PostModal, 
  BrandModal, 
  ReportMetricModal, 
  TaskDetailModal, 
  PostDetailModal,
  MemberEditModal,
  PostMetricsModal,
  MonthlyStoriesModal
} from './components/Modals';
import { getPreviousMonth } from './utils/helpers';

export default function App() {
  // Navigation State
  const [activePage, setActivePage] = useState<ActivePage>({ type: 'overview' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persistent Data States with localStorage
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('dl_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('dl_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('dl_brands');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [posts, setPosts] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('dl_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [reports, setReports] = useState<Record<string, BrandReport>>(() => {
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
      console.warn('Failed to parse saved reports, resetting to defaults:', e);
    }
    return INITIAL_REPORTS;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('dl_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('dl_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('dl_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('dl_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('dl_reports', JSON.stringify(reports));
  }, [reports]);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postModalInitialDate, setPostModalInitialDate] = useState<string | undefined>(undefined);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isReportMetricModalOpen, setIsReportMetricModalOpen] = useState(false);
  const [reportBrandTarget, setReportBrandTarget] = useState<string>('Dreamlab');

  // Detail Modal States
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [detailPost, setDetailPost] = useState<SocialPost | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingPostMetrics, setEditingPostMetrics] = useState<SocialPost | null>(null);
  const [selectedReportingPeriod, setSelectedReportingPeriod] = useState<string>('September 2026');
  const [editingMonthlyStories, setEditingMonthlyStories] = useState<{
    brandName: string;
    monthYear: string;
  } | null>(null);

  // Navigation Handler
  const handleNavigate = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Task Actions
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)));
    if (detailTask && detailTask.id === taskId) {
      setDetailTask(prev => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Post Actions
  const handleSavePost = (postData: Omit<SocialPost, 'id'>) => {
    const newPost: SocialPost = {
      ...postData,
      id: `p-${Date.now()}`
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const handleUpdatePostStatus = (postId: string, newStatus: PostStatus) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          status: newStatus,
          progress: newStatus === 'Published' ? 100 : p.progress
        };
      }
      return p;
    }));
    if (detailPost && detailPost.id === postId) {
      setDetailPost(prev => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleUpdatePostProgress = (postId: string, progress: number) => {
    setPosts(prev => prev.map(p => (p.id === postId ? { ...p, progress } : p)));
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleSavePostMetrics = (postId: string, metrics: NonNullable<SocialPost['metrics']>, imageUrl?: string) => {
    setPosts(prev => prev.map(p => (p.id === postId ? { ...p, metrics, ...(imageUrl !== undefined ? { imageUrl } : {}) } : p)));
  };

  const handleUpdatePostMedia = (postId: string, imageUrl: string) => {
    setPosts(prev => prev.map(p => (p.id === postId ? { ...p, imageUrl } : p)));
  };

  // Brand Actions
  const handleSaveBrand = (brandData: Omit<Brand, 'id' | 'initial'>) => {
    const safeName = brandData.name || 'New Brand';
    const newBrand: Brand = {
      ...brandData,
      id: `b-${Date.now()}`,
      initial: safeName.charAt(0).toUpperCase() || 'B'
    };
    setBrands(prev => [...prev, newBrand]);

    // Initialize blank reporting for new brand
    setReports(prev => ({
      ...prev,
      [newBrand.name]: {
        id: `rep-${newBrand.id}`,
        brandId: newBrand.name,
        monthYear: 'September 2026',
        totalFollowers: 5000,
        followersGrowth: 320,
        followersGrowthPercent: 6.8,
        totalReach: 45000,
        reachGrowthPercent: 15.2,
        totalImpressions: 110000,
        impressionsGrowthPercent: 12.0,
        engagementRate: 4.5,
        engagementRateChange: 0.5,
        totalPostsPublished: 4,
        platformBreakdown: [
          {
            platform: 'Instagram',
            followers: 3800,
            followersGrowth: 260,
            reach: 32000,
            engagementRate: 4.8,
            postsCount: 3
          },
          {
            platform: 'TikTok',
            followers: 1200,
            followersGrowth: 60,
            reach: 13000,
            engagementRate: 4.1,
            postsCount: 1
          }
        ],
        weeklyTrends: [
          { week: 'W1', reach: 9500, engagement: 450, impressions: 24000 },
          { week: 'W2', reach: 12000, engagement: 580, impressions: 29000 },
          { week: 'W3', reach: 11500, engagement: 520, impressions: 28000 },
          { week: 'W4', reach: 12000, engagement: 560, impressions: 29000 }
        ],
        formatPerformance: [
          { format: 'Carousel', postsCount: 2, avgEngagementRate: 5.2, avgReach: 14000 },
          { format: 'Reels', postsCount: 2, avgEngagementRate: 4.4, avgReach: 21000 }
        ],
        topPosts: [],
        executiveSummary: `Laporan analitik awal untuk brand ${newBrand.name}. Fokus membangun brand awareness dan follower base di fase pertama.`,
        strategicRecommendations: [
          'Jadwalkan postingan pengenalan produk dan core values brand.',
          'Uji coba konten reels edukatif untuk memperluas jangkauan ke non-follower.',
          'Bangun engagement aktif di kolom komentar dan direct messages.'
        ]
      }
    }));
  };

  // Report Metric Actions
  const handleSaveReportMetrics = (updatedReport: BrandReport) => {
    const reportKey = `${updatedReport.brandId}__${updatedReport.monthYear}`;
    setReports(prev => ({
      ...prev,
      [updatedReport.brandId]: updatedReport,
      [reportKey]: updatedReport
    }));
  };

  // Monthly Stories Action (Direct Monthly Edit: Total Stories Dibuat & Total Views)
  const handleSaveMonthlyStories = (brandName: string, monthYear: string, totalStoriesCreated: number, totalStoryViews: number) => {
    const reportKey = `${brandName}__${monthYear}`;
    const baseReport = getReportForBrandAndPeriod(brandName, monthYear);
    const avgViewsPerStory = totalStoriesCreated > 0 ? Math.round(totalStoryViews / totalStoriesCreated) : 0;

    const updatedReport: BrandReport = {
      ...baseReport,
      storiesRecap: {
        ...(baseReport?.storiesRecap || { completionRate: 80 }),
        totalStoriesCreated,
        totalStoryViews,
        avgViewsPerStory
      }
    };

    setReports(prev => ({
      ...prev,
      [reportKey]: updatedReport,
      [brandName]: updatedReport
    }));
  };

  // Helper to get report for brand and period
  const getReportForBrandAndPeriod = (brandName: string, period: string): BrandReport | undefined => {
    return reports[`${brandName}__${period}`] || reports[brandName];
  };

  // Member Edit Actions
  const handleSaveMember = (updatedMember: Member) => {
    setMembers(prev => prev.map(m => (m.id === updatedMember.id ? updatedMember : m)));
  };

  // Helper to get active brand object
  const getBrandByName = (name?: string): Brand => {
    const safeName = name || (brands[0]?.name ?? 'Dreamlab');
    return (
      brands.find(b => b.name.toLowerCase() === safeName.toLowerCase()) || {
        id: 'fallback',
        name: safeName,
        handle: `@${safeName.toLowerCase()}`,
        initial: safeName.charAt(0).toUpperCase() || 'D',
        color: '#1264d3',
        primaryPlatform: 'Instagram',
        pic: 'Revita',
        note: `Akun media sosial brand ${safeName}`
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Mobile Top Navbar with Hamburger */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-200 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-black text-xs">
            DL
          </div>
          <span className="font-extrabold text-sm tracking-tight">Dreamlab Workspace</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar: Desktop fixed & Mobile overlay */}
      <div className={`fixed inset-0 z-50 lg:static lg:z-auto transition-all ${
        mobileMenuOpen ? 'block' : 'hidden lg:block'
      }`}>
        {/* Mobile backdrop */}
        <div 
          className="fixed inset-0 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          members={members}
          brands={brands}
          tasks={tasks}
          onOpenAddBrandModal={() => setIsBrandModalOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-18 lg:pt-8 min-h-screen overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* VIEW: OVERVIEW */}
          {activePage.type === 'overview' && (
            <TaskOverview
              tasks={tasks}
              members={members}
              onSelectMember={(name) => handleNavigate({ type: 'member', memberName: name })}
              onOpenAddTaskModal={() => setIsTaskModalOpen(true)}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onViewTaskDetail={(t) => setDetailTask(t)}
            />
          )}

          {/* VIEW: MEMBER PROFILE */}
          {activePage.type === 'member' && (
            <MemberProfileView
              member={
                members.find(m => m.name.toLowerCase() === (activePage.memberName || '').toLowerCase()) || members[0]
              }
              tasks={tasks}
              onBack={() => handleNavigate({ type: 'overview' })}
              onOpenAddTaskModal={() => setIsTaskModalOpen(true)}
              onOpenEditProfileModal={(m) => setEditingMember(m)}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onViewTaskDetail={(t) => setDetailTask(t)}
            />
          )}

          {/* VIEW: SOCIAL CONTENT PLANNER */}
          {activePage.type === 'social-planner' && (
            <ContentPlannerView
              brand={getBrandByName(activePage.brandName)}
              posts={posts}
              initialChannel={activePage.initialChannel}
              onOpenAddPostModal={(date) => {
                setPostModalInitialDate(date);
                setIsPostModalOpen(true);
              }}
              onViewPostDetail={(p) => setDetailPost(p)}
              onUpdatePostStatus={handleUpdatePostStatus}
              onUpdatePostProgress={handleUpdatePostProgress}
              onNavigateToReporting={(targetTab) => handleNavigate({ 
                type: 'social-report', 
                brandName: activePage.brandName, 
                initialTab: targetTab || 'all' 
              })}
            />
          )}

          {/* VIEW: SOCIAL MEDIA REPORTING (Requested Submenu for each brand) */}
          {activePage.type === 'social-report' && (
            <BrandReportingView
              brand={getBrandByName(activePage.brandName)}
              report={getReportForBrandAndPeriod(activePage.brandName, selectedReportingPeriod)}
              previousReport={getReportForBrandAndPeriod(activePage.brandName, getPreviousMonth(selectedReportingPeriod))}
              posts={posts}
              initialTab={activePage.initialTab as any}
              currentPeriod={selectedReportingPeriod}
              onPeriodChange={setSelectedReportingPeriod}
              onOpenReportMetricModal={(brandName) => {
                setReportBrandTarget(brandName);
                setIsReportMetricModalOpen(true);
              }}
              onOpenPostMetricsModal={(post) => setEditingPostMetrics(post)}
              onOpenStoriesModal={(brandName, monthYear) => {
                setEditingMonthlyStories({ brandName, monthYear });
              }}
              onSaveReportMetrics={handleSaveReportMetrics}
              onUpdatePostMedia={handleUpdatePostMedia}
              onNavigateToPlanner={(targetChannel) => handleNavigate({ 
                type: 'social-planner', 
                brandName: activePage.brandName, 
                initialChannel: targetChannel 
              })}
            />
          )}
        </div>
      </main>

      {/* MODALS */}
      {/* 1. Add/Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        members={members}
      />

      {/* 2. Add Social Post Modal */}
      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setPostModalInitialDate(undefined);
        }}
        onSave={handleSavePost}
        brands={brands}
        members={members}
        initialBrand={
          activePage.type === 'social-planner' || activePage.type === 'social-report'
            ? activePage.brandName
            : undefined
        }
        initialDate={postModalInitialDate}
      />

      {/* 3. Add Brand Modal */}
      <BrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSave={handleSaveBrand}
        members={members}
      />

      {/* 4. Update Report Metric Modal */}
      <ReportMetricModal
        isOpen={isReportMetricModalOpen}
        onClose={() => setIsReportMetricModalOpen(false)}
        brandName={reportBrandTarget}
        currentReport={getReportForBrandAndPeriod(reportBrandTarget, selectedReportingPeriod)}
        previousReport={getReportForBrandAndPeriod(reportBrandTarget, getPreviousMonth(selectedReportingPeriod))}
        currentPeriod={selectedReportingPeriod}
        onSave={handleSaveReportMetrics}
      />

      {/* 5. Task Detail Modal */}
      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onDelete={handleDeleteTask}
        onUpdateStatus={handleUpdateTaskStatus}
      />

      {/* 6. Post Detail Modal */}
      <PostDetailModal
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onDelete={handleDeletePost}
        onUpdateStatus={handleUpdatePostStatus}
      />

      {/* 7. Member Edit Modal */}
      <MemberEditModal
        isOpen={!!editingMember}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSave={handleSaveMember}
      />

      {/* 8. Post Specific Metrics Modal */}
      <PostMetricsModal
        isOpen={!!editingPostMetrics}
        post={editingPostMetrics}
        onClose={() => setEditingPostMetrics(null)}
        onSave={handleSavePostMetrics}
      />

      {/* 9. Monthly Stories Recap Modal (Direct Monthly Edit) */}
      {editingMonthlyStories && (
        <MonthlyStoriesModal
          isOpen={!!editingMonthlyStories}
          onClose={() => setEditingMonthlyStories(null)}
          brandName={editingMonthlyStories.brandName}
          monthYear={editingMonthlyStories.monthYear}
          currentReport={getReportForBrandAndPeriod(editingMonthlyStories.brandName, editingMonthlyStories.monthYear)}
          previousReport={getReportForBrandAndPeriod(editingMonthlyStories.brandName, getPreviousMonth(editingMonthlyStories.monthYear))}
          onSave={(storiesCount, totalViews) => {
            handleSaveMonthlyStories(editingMonthlyStories.brandName, editingMonthlyStories.monthYear, storiesCount, totalViews);
            setEditingMonthlyStories(null);
          }}
        />
      )}
    </div>
  );
}
