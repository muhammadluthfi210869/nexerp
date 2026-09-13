# Views — Per-View Documentation

> **Source**: 4 top-level view components + 7 sub-section components in `src/components/`
>
> Each view documents: purpose, props, data consumed, tables rendered, buttons/actions, and which modals it can open.

---

## View 1: Task Overview (`activePage.type === 'overview'`)

**Component**: `src/components/TaskOverview.tsx`
**Lines**: ~425

### Purpose
Aggregate view of ALL tasks across ALL members, grouped by status, with summary metrics and per-member breakdown cards.

### Props
```ts
interface TaskOverviewProps {
  tasks: Task[];
  members: Member[];
  onSelectMember: (name: string) => void;
  onOpenAddTaskModal: () => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onViewTaskDetail: (task: Task) => void;
}
```

### Data consumed
- `tasks: Task[]` (from App)
- `members: Member[]` (from App)

### Sections (top to bottom)

#### 1.1 Header
- Title: "Task Management" or similar
- "Tambah Task" button → `onOpenAddTaskModal()` opens `TaskModal`

#### 1.2 Metric cards (4 cards)
| Card | Source | Computed |
|---|---|---|
| Total Task | `tasks.length` | direct |
| Total Completed | `tasks.filter(t => t.status === 'Completed').length` | derived |
| Overall Completion % | `Math.round(completed / total * 100)` | derived |
| Late Tasks | `tasks.filter(t => t.status === 'Late').length` | derived |

#### 1.3 Status-grouped task table (4 groups: Late, In Progress, Pending, Completed)
Each group shows a table with columns:
| Column | Source |
|---|---|
| Nama Task | `Task.name` + `Task.brief` (truncated to 1 line) |
| Tipe / Project | `Task.type` badge (Daily/Project) + `Task.project` if Project |
| Assignee | `Task.assignee` (member name + initial char avatar) |
| Due Date | `Task.dueDate` → `formatDateIndo()` |
| Days Left | `Task.dueDate` → `calculateDaysLeft()` |
| Priority | `Task.priority` → `getPriorityBadgeClass()` (High=red, Medium=amber, Low=blue) |
| Status | `<select>` inline editor → `onUpdateTaskStatus(taskId, newStatus)` |
| Aksi | "Detail" button → `onViewTaskDetail(task)` opens `TaskDetailModal` |

#### 1.4 Per-member cards
For each member:
- Avatar (from `Member.avatarBg` + `Member.initial`)
- Name + Role
- Daily task count: `mDailyDone / mDailyTotal`
- Project task count: `mProjectActive`
- Completion rate: `Math.round(mCompleted / mTasks * 100)`%
- Click → `onSelectMember(member.name)` → navigates to MemberProfileView

### Buttons / Actions
- "Tambah Task" → opens TaskModal
- Inline status `<select>` on each task row → updates task status
- "Detail" button on task row → opens TaskDetailModal
- Click member card → navigates to member view

### Modals opened
- `TaskModal` (add task)
- `TaskDetailModal` (view task detail, update status, delete)

---

## View 2: Member Profile (`activePage.type === 'member'`)

**Component**: `src/components/MemberProfileView.tsx`
**Lines**: ~250

### Purpose
Per-member detail: profile, task list, post list.

### Props
```ts
interface MemberProfileViewProps {
  member: Member;
  tasks: Task[];
  onBack: () => void;                    // navigates to overview
  onOpenAddTaskModal: () => void;
  onOpenEditProfileModal: (m: Member) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onViewTaskDetail: (task: Task) => void;
}
```

### Data consumed
- `member: Member` (looked up by name from `members[]`)
- `tasks: Task[]` (filtered to `t.assignee === member.name`)

### Sections

#### 2.1 Header
- Avatar (large, `Member.avatarBg` + `Member.initial`)
- Name + Role + Department
- Email + Phone (clickable)
- "Back" button → `onBack()` → navigates to overview
- "Edit Profile" button → `onOpenEditProfileModal(member)` opens `MemberEditModal`

#### 2.2 Member task table
Filtered to tasks where `Task.assignee === member.name`. Same columns as Task Overview table:
| Column | Source |
|---|---|
| Nama Task | `Task.name` |
| Tipe / Project | `Task.type` + `Task.project` |
| Due Date | `Task.dueDate` → `formatDateIndo()` |
| Days Left | `Task.dueDate` → `calculateDaysLeft()` |
| Status | `<select>` inline editor → `onUpdateTaskStatus` |
| Priority | `Task.priority` |
| Aksi | "Detail" button → `onViewTaskDetail` |

Grouped by status (Late → In Progress → Pending → Completed).

### Buttons / Actions
- "Back" → overview
- "Edit Profile" → MemberEditModal
- "Tambah Task" → TaskModal (new task pre-assigned to this member)
- Inline status editor per task
- "Detail" button per task → TaskDetailModal

### Modals opened
- `MemberEditModal`
- `TaskModal` (pre-filled assignee)
- `TaskDetailModal`

---

## View 3: Content Planner (`activePage.type === 'social-planner'`)

**Component**: `src/components/ContentPlannerView.tsx`
**Lines**: ~300

### Purpose
Calendar view + posts list for a specific brand. Per-channel filter (Instagram, TikTok, YouTube, Website, Paid Ads).

### Props
```ts
interface ContentPlannerViewProps {
  brand: Brand;
  posts: SocialPost[];
  initialChannel?: string;
  onOpenAddPostModal: (date?: string) => void;
  onViewPostDetail: (post: SocialPost) => void;
  onUpdatePostStatus: (postId: string, newStatus: PostStatus) => void;
  onUpdatePostProgress: (postId: string, progress: number) => void;
  onNavigateToReporting: (targetTab?: string) => void;
}
```

### Data consumed
- `brand: Brand` (from `getBrandByName()` in App)
- `posts: SocialPost[]` (filtered to `post.brandId === brand.name`)
- `initialChannel?: string` (e.g., `'Instagram'`, `'TikTok'`)

### Sections

#### 3.1 Header
- Brand name (large)
- Brand handle + PIC (Person in Charge) + Note
- Channel filter pills: All, Instagram, TikTok, YouTube, Website, Paid Ads
  - Click pill → filter posts by `post.platform` (or show all if "All")
- "Tambah Post" button → `onOpenAddPostModal(undefined)` opens `PostModal`
- "Lihat Report" button → `onNavigateToReporting('all')` navigates to BrandReportingView

#### 3.2 Calendar view
Month-grid layout showing posts scheduled for each date. Click on empty date cell → `onOpenAddPostModal(date)` opens `PostModal` with date pre-filled.

Each post on the calendar shows:
- Title (truncated)
- Format badge (Reels, Carousel, etc.)
- Status badge color
- PIC avatar

#### 3.3 Posts list (table view)
All posts for the brand (filtered by channel if filter active):

| Column | Source |
|---|---|
| Tanggal | `SocialPost.date` → `formatDateIndo()` |
| Title | `SocialPost.title` |
| Format | `SocialPost.format` (badge) |
| Platform | `SocialPost.platform` (if specified) |
| PIC | `SocialPost.pic` (member name + initial) |
| Progress | `SocialPost.progress` (0-100, slider or bar) |
| Status | `<select>` inline editor → `onUpdatePostStatus` |
| Aksi | "Detail" button → `onViewPostDetail(post)` opens `PostDetailModal` |

### Buttons / Actions
- Channel filter pills → filter posts
- "Tambah Post" → PostModal
- "Lihat Report" → navigate to BrandReportingView
- Click calendar date → PostModal with date pre-filled
- Click calendar post → PostDetailModal
- Inline progress editor (drag slider) → `onUpdatePostProgress`
- Inline status editor → `onUpdatePostStatus`

### Modals opened
- `PostModal` (add post, optionally pre-filled with date + brand)
- `PostDetailModal` (view detail, update status, delete)

---

## View 4: Brand Reporting (`activePage.type === 'social-report'`)

**Component**: `src/components/BrandReportingView.tsx`
**Lines**: ~400
**Sub-components**: 7 dedicated section files

### Purpose
Monthly reporting view per brand. 7 tabs each rendering a different aspect of the brand's monthly performance.

### Props
```ts
interface BrandReportingViewProps {
  brand: Brand;
  report: BrandReport;                 // current month
  previousReport?: BrandReport;         // previous month for comparison
  posts: SocialPost[];
  initialTab?: string;
  currentPeriod: string;                // e.g., "September 2026"
  onPeriodChange: (period: string) => void;
  onOpenReportMetricModal: (brandName: string) => void;
  onOpenPostMetricsModal: (post: SocialPost) => void;
  onOpenStoriesModal: (brandName: string, monthYear: string) => void;
  onSaveReportMetrics: (updated: BrandReport) => void;
  onUpdatePostMedia: (postId: string, imageUrl: string) => void;
  onNavigateToPlanner: (targetChannel?: string) => void;
}
```

### Data consumed
- `brand: Brand`
- `report: BrandReport` (current period — fetched via `getReportForBrandAndPeriod(brand.name, currentPeriod)`)
- `previousReport?: BrandReport` (previous month via `getPreviousMonth()`)
- `posts: SocialPost[]` (filtered to brand)

### Period selector
- Dropdown or pill selector at top → `onPeriodChange(period)`
- "Edit Monthly Metrics" button → `onOpenReportMetricModal(brand.name)` opens `ReportMetricModal`

### Tab 1: Executive Summary
**Component**: rendered inline in BrandReportingView

#### 1.1 KPI grid (top 6 cards)
| Card | Source | Display |
|---|---|---|
| Total Followers | `report.totalFollowers` | Number + delta vs previous |
| Followers Gained | `report.followersGained` | Number + arrow icon |
| Engagement Rate | `report.engagementRate` | Percentage + delta pp |
| Total Reach | `report.totalReach` | Number + growth% |
| Total Views | `report.totalViews` | Number |
| Total Posts | `report.totalPostsPublished` | Number |

Each card uses `calcComparison(curr, prev)` for delta display.

#### 1.2 Followers Dynamics bar
| Metric | Source |
|---|---|
| Gained | `report.followersGained` |
| Unfollowed | `report.followersUnfollowed` |
| Net Growth | `report.followersNetGrowth` |
| Growth % | `report.followersGrowthPercent` |

#### 1.3 Engagement breakdown
- Likes, Comments, Shares, Saves (4 metrics from `report`)
- Total Engagements = sum
- Engagement Rate % + delta

#### 1.4 Platform breakdown table
| Column | Source |
|---|---|
| Platform | `PlatformMetric.platform` |
| Followers | `PlatformMetric.followers` |
| Growth | `PlatformMetric.followersGrowth` |
| Reach | `PlatformMetric.reach` |
| Views | `PlatformMetric.views` |
| ER % | `PlatformMetric.engagementRate` |
| Posts | `PlatformMetric.postsCount` |

#### 1.5 Weekly trend chart
4 bars: Week 1-4, X-axis reach/views/engagement/impressions, Y-axis counts. Source: `report.weeklyTrends[]`

#### 1.6 Format performance table
| Column | Source |
|---|---|
| Format | `FormatPerformance.format` |
| Posts | `FormatPerformance.postsCount` |
| Avg ER | `FormatPerformance.avgEngagementRate` |
| Avg Reach | `FormatPerformance.avgReach` |
| Avg Views | `FormatPerformance.avgViews` |

#### 1.7 Executive Summary text
Paragraph from `report.executiveSummary`.

#### 1.8 Strategic Recommendations list
Bulleted list from `report.strategicRecommendations[]`.

### Tab 2: Leads Funnel (Goals)
**Component**: `src/components/NurturingFunnelSection.tsx`

Per-channel funnel visualization. Each row = one channel with 4 sequential boxes:
| Box | Metric | Source |
|---|---|---|
| Traffic | Impressions/Views/Sessions | `ChannelLeadFunnel.traffic` |
| Prospects | Leads/Inquiries | `ChannelLeadFunnel.prospects` |
| Nurturing | Sample kits / Formula testing | `ChannelLeadFunnel.nurturingSamples` |
| Goals | Closed deals | `ChannelLeadFunnel.goals` |

Below each row:
| Metric | Source |
|---|---|
| Conversion Rate | `ChannelLeadFunnel.conversionRate` |
| Spend (if paid) | `ChannelLeadFunnel.spend` |
| CPL (if paid) | `ChannelLeadFunnel.cpl` |
| Deal Value | `ChannelLeadFunnel.dealValue` |
| Notes | `ChannelLeadFunnel.notes` |

Channels displayed: Instagram, TikTok, YouTube, Website, Meta Ads, Google Ads.

### Tab 3: Weekly
**Component**: `src/components/WeeklyReportingSection.tsx`

Detailed per-week breakdown. For each of 4 weeks:

| Field | Source |
|---|---|
| Week label | `WeeklyReportData.weekLabel` (e.g., "Minggu 1") |
| Date range | `WeeklyReportData.dateRange` (e.g., "1 - 7 Sep 2026") |
| Starting Followers | `WeeklyReportData.startingFollowers` |
| Followers Gained | `WeeklyReportData.followersGained` |
| Followers Unfollowed | `WeeklyReportData.followersUnfollowed` |
| Net Growth | `WeeklyReportData.netGrowth` |
| Growth % | `WeeklyReportData.growthPercent` |
| Ending Followers | `WeeklyReportData.endingFollowers` |
| Views | `WeeklyReportData.views` |
| Reach | `WeeklyReportData.reach` |
| Impressions | `WeeklyReportData.impressions` |
| Total Engagement | `WeeklyReportData.totalEngagement` |
| Engagement Rate | `WeeklyReportData.engagementRate` |
| Likes | `WeeklyReportData.likes` |
| Comments | `WeeklyReportData.comments` |
| Shares | `WeeklyReportData.shares` |
| Saves | `WeeklyReportData.saves` |
| Stories Count | `WeeklyReportData.storiesCount` |
| Total Story Views | `WeeklyReportData.totalStoryViews` |
| Avg Views Per Story | `WeeklyReportData.avgViewsPerStory` |
| Story Replies | `WeeklyReportData.storyReplies` |
| Story Completion Rate | `WeeklyReportData.storyCompletionRate` |
| Highlights | `WeeklyReportData.highlights` |
| Notes | `WeeklyReportData.notes` |

Each week has an "Edit Weekly Metrics" button → opens `WeeklyMetricModal`.

### Tab 4: TikTok
**Component**: `src/components/TikTokSection.tsx`

#### 4.1 Aggregate metrics grid
| Card | Source |
|---|---|
| Followers | `TikTokReportData.followers` |
| Followers Gained | `TikTokReportData.followersGained` |
| Total Views | `TikTokReportData.totalViews` |
| Avg Watch Retention % | `TikTokReportData.avgWatchRetention` |
| Total Likes | `TikTokReportData.totalLikes` |
| Total Comments | `TikTokReportData.totalComments` |
| Total Shares | `TikTokReportData.totalShares` |
| Total Saves | `TikTokReportData.totalSaves` |
| Profile Visits | `TikTokReportData.profileVisits` |
| Bio Link Clicks | `TikTokReportData.bioLinkClicks` |
| Leads Contributed | `TikTokReportData.leadsContributed` |
| Sample Requests | `TikTokReportData.sampleRequests` |

#### 4.2 Top videos table
| Column | Source |
|---|---|
| Title | `TikTokTopVideo.title` |
| Hook | `TikTokTopVideo.hook` |
| Views | `TikTokTopVideo.views` |
| Likes | `TikTokTopVideo.likes` |
| Shares | `TikTokTopVideo.shares` |
| Saves | `TikTokTopVideo.saves` |
| Retention Rate | `TikTokTopVideo.retentionRate` |
| Leads | `TikTokTopVideo.leadsContributed` |
| Sample Requests | `TikTokTopVideo.sampleRequests` |

### Tab 5: YouTube
**Component**: `src/components/YouTubeSection.tsx`

#### 5.1 Aggregate metrics grid
| Card | Source |
|---|---|
| Subscribers | `YouTubeReportData.subscribers` |
| Subs Gained | `YouTubeReportData.subsGained` |
| Total Views | `YouTubeReportData.totalViews` |
| Watch Time Hours | `YouTubeReportData.watchTimeHours` |
| Avg View Duration | `YouTubeReportData.avgViewDuration` |
| Impressions | `YouTubeReportData.impressions` |
| CTR | `YouTubeReportData.ctr` |
| Leads Contributed | `YouTubeReportData.leadsContributed` |
| Sample Requests | `YouTubeReportData.sampleRequests` |

#### 5.2 Traffic sources bar
| Source | Source |
|---|---|
| Source name | `trafficSources[].source` |
| Percentage | `trafficSources[].percentage` |

#### 5.3 Top videos table
| Column | Source |
|---|---|
| Title | `YouTubeTopVideo.title` |
| Format | `YouTubeTopVideo.format` (Video/Shorts) |
| Views | `YouTubeTopVideo.views` |
| Watch Time Hours | `YouTubeTopVideo.watchTimeHours` |
| CTR | `YouTubeTopVideo.ctr` |
| Leads | `YouTubeTopVideo.leadsContributed` |
| Sample Requests | `YouTubeTopVideo.sampleRequests` |

### Tab 6: Website (SEO)
**Component**: `src/components/WebsiteSection.tsx`

#### 6.1 Aggregate metrics grid
| Card | Source |
|---|---|
| Total Sessions | `WebsiteReportData.totalSessions` |
| Total Users | `WebsiteReportData.totalUsers` |
| Organic Impressions | `WebsiteReportData.organicImpressions` |
| Organic Clicks | `WebsiteReportData.organicClicks` |
| Avg CTR | `WebsiteReportData.avgCtr` |
| Avg Position | `WebsiteReportData.avgPosition` |
| Leads Traffic | `WebsiteReportData.leadsTraffic` |
| Sample Requests | `WebsiteReportData.sampleRequests` |
| Conversion Rate | `WebsiteReportData.conversionRate` |

#### 6.2 Top queries table
| Column | Source |
|---|---|
| Query | `WebsiteQueryMetric.queryName` |
| Impressions | `WebsiteQueryMetric.impressions` |
| Clicks | `WebsiteQueryMetric.clicks` |
| CTR | `WebsiteQueryMetric.ctr` |
| Avg Position | `WebsiteQueryMetric.avgPosition` |
| Leads | `WebsiteQueryMetric.leadsTraffic` |
| Sample Requests | `WebsiteQueryMetric.sampleRequests` |
| Landing Page | `WebsiteQueryMetric.landingPage` |

#### 6.3 Website tasks table
| Column | Source |
|---|---|
| Title | `WebsiteTask.title` |
| Category | `WebsiteTask.category` (SEO Optimization | Landing Page | Blog Article | CRO & Sample Form | Technical & Speed) |
| Assignee | `WebsiteTask.assignee` |
| Due Date | `WebsiteTask.dueDate` |
| Status | `WebsiteTask.status` (Pending | In Progress | Review | Completed) |
| Impact | `WebsiteTask.impact` |

### Tab 7: Paid Ads
**Component**: `src/components/PaidAdsSection.tsx`

#### 7.1 Meta Ads subsection
Aggregate:
| Card | Source |
|---|---|
| Spend (IDR) | `MetaAdsReportData.spend` → `formatNumber()` |
| Impressions | `MetaAdsReportData.impressions` |
| Clicks | `MetaAdsReportData.clicks` |
| CPC (IDR) | `MetaAdsReportData.cpc` → `formatNumber()` |
| CTR | `MetaAdsReportData.ctr` |
| Leads Contributed | `MetaAdsReportData.leadsContributed` |
| CPL (IDR) | `MetaAdsReportData.cpl` → `formatNumber()` |
| Sample Requests | `MetaAdsReportData.sampleRequests` |
| ROAS | `MetaAdsReportData.roas` |

Meta Ads Creatives table:
| Column | Source |
|---|---|
| Creative Name | `MetaAdsCreativePerformance.creativeName` |
| Hook | `MetaAdsCreativePerformance.hook` |
| Format | `MetaAdsCreativePerformance.format` (Video/Reel | Carousel | Single Image | Catalog) |
| Visual Angle | `MetaAdsCreativePerformance.visualAngle` |
| Spend (IDR) | `MetaAdsCreativePerformance.spend` → `formatNumber()` |
| Impressions | `MetaAdsCreativePerformance.impressions` |
| Clicks | `MetaAdsCreativePerformance.clicks` |
| CTR | `MetaAdsCreativePerformance.ctr` |
| Hook Rate | `MetaAdsCreativePerformance.hookRate` |
| Leads | `MetaAdsCreativePerformance.leadsContributed` |
| CPL | `MetaAdsCreativePerformance.cpl` → `formatNumber()` |
| Sample Requests | `MetaAdsCreativePerformance.sampleRequests` |
| Status | `MetaAdsCreativePerformance.status` (Top Performer | Active | Fatigue | Testing) |
| Action Recommendation | `MetaAdsCreativePerformance.actionRecommendation` |

#### 7.2 Google Ads subsection
Aggregate:
| Card | Source |
|---|---|
| Spend (IDR) | `GoogleAdsReportData.spend` → `formatNumber()` |
| Impressions | `GoogleAdsReportData.impressions` |
| Clicks | `GoogleAdsReportData.clicks` |
| Avg CPC (IDR) | `GoogleAdsReportData.avgCpc` → `formatNumber()` |
| CTR | `GoogleAdsReportData.ctr` |
| Leads Contributed | `GoogleAdsReportData.leadsContributed` |
| Cost Per Lead (IDR) | `GoogleAdsReportData.costPerLead` → `formatNumber()` |
| Conversion Rate | `GoogleAdsReportData.conversionRate` |

Google Ads Campaigns table:
| Column | Source |
|---|---|
| Campaign Name | `GoogleAdsCampaign.name` |
| Type | `GoogleAdsCampaign.type` (Search | Performance Max | Display/Retargeting) |
| Spend (IDR) | `GoogleAdsCampaign.spend` → `formatNumber()` |
| Impressions | `GoogleAdsCampaign.impressions` |
| Clicks | `GoogleAdsCampaign.clicks` |
| Leads | `GoogleAdsCampaign.leads` |
| CPL | `GoogleAdsCampaign.cpl` → `formatNumber()` |

Google Ads Top Queries table:
| Column | Source |
|---|---|
| Keyword | `GoogleAdsQueryMetric.keyword` |
| Match Type | `GoogleAdsQueryMetric.matchType` (Exact | Phrase | Broad) |
| Impressions | `GoogleAdsQueryMetric.impressions` |
| Clicks | `GoogleAdsQueryMetric.clicks` |
| CPC | `GoogleAdsQueryMetric.cpc` |
| Leads | `GoogleAdsQueryMetric.leadsContributed` |
| Conversion Rate | `GoogleAdsQueryMetric.conversionRate` |
| CPL | `GoogleAdsQueryMetric.cpl` |

### Buttons / Actions (across all tabs)
- Period dropdown → `onPeriodChange(period)`
- "Edit Monthly Metrics" button → `onOpenReportMetricModal(brand.name)` opens `ReportMetricModal`
- Per-post "Edit Metrics" → `onOpenPostMetricsModal(post)` opens `PostMetricsModal`
- "Edit Monthly Stories" → `onOpenStoriesModal(brand.name, monthYear)` opens `MonthlyStoriesModal`
- "Edit Weekly Metrics" (per week) → opens `WeeklyMetricModal`
- "Lihat Planner" → `onNavigateToPlanner(targetChannel)` navigates to ContentPlannerView

### Modals opened
- `ReportMetricModal`
- `PostMetricsModal`
- `MonthlyStoriesModal`
- `WeeklyMetricModal`

---

## Cross-view: Sidebar component (`Sidebar.tsx`)

**Lines**: 440
**Props**:
```ts
interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  members: Member[];
  brands: Brand[];
  tasks: Task[];
  onOpenAddBrandModal: () => void;
}
```

### Internal state
- `expandedBrands: Record<string, boolean>` — Dreamlab and Toribio default to expanded

### Sections

#### Brand header
- "DL" avatar + "Dreamlab" name + "WORKSPACE ERP" label

#### Section 1: MANAGEMENT TASK
- Section label: "Management Task" + late task count badge
- Button: "Overview & All Tasks" (Layers icon, task count) → `onNavigate({type: 'overview'})`
- Sub-section: "Team Members" — per-member button (avatar + name + completion ratio + late dot)

#### Section 2: SOCIAL MEDIA BRANDS
- Section label: "Social Media Brands" + "+" add button → `onOpenAddBrandModal()`
- For each brand: expandable card with:
  - Header: brand avatar + name + handle (click → `onNavigate({type: 'social-planner', brandName: brand.name})`)
  - Sub-buttons (when expanded):
    - "Leads Funnel (Goals)" (Target icon) → `onNavigate({type: 'social-report', brandName, initialTab: 'funnel'})`
    - "Executive Summary" (BarChart3 icon) → `onNavigate({type: 'social-report', brandName, initialTab: 'all'})`
  - Sub-section "Sub-Kanal Digital":
    - Per channel (Instagram, TikTok, YouTube, Website, Paid Ads): 2 buttons
      - "Planner" (Calendar icon) → `onNavigate({type: 'social-planner', brandName, initialChannel: ch.plannerChannel})`
      - "Report" (BarChart3 icon) → `onNavigate({type: 'social-report', brandName, initialTab: ch.reportTab})`
- "Tambah Brand Baru" button → `onOpenAddBrandModal()` (also opens BrandModal)

#### Footer
- "Dreamlab ERP v2.4" + "Live Sync" indicator + "Task Management & Planner"

### Modals opened
- `BrandModal` (via `onOpenAddBrandModal`)

---

**Status**: Draft v1. Cross-references App.tsx render branches + sidebar entries. Pending final integration with FEATURES-AND-WORKFLOWS.md.
