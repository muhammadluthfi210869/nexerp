# Dreamlab ERP — Reference Inventory (Master Index)

> **Source**: `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\dreamlab-erp-—-task-&-social-media-management` (Vite + React + TypeScript SPA, 21 source files, ~3000+ LOC).
>
> **Online preview**: `https://erppreview1.ai.studio/` — JS-rendered SPA, page title only recoverable: "Dreamlab ERP — Task & Social Media Management". See `ONLINE-REFERENCE.md` for the limitation.
>
> **Purpose**: Exhaustive reverse-engineered documentation of every page, route, view, modal, data entity, metric, and field. Use as source of truth when porting features to NexERP production.

---

## How to use this doc set

| File | Contents |
|---|---|
| `DREAMLAB-ERP-INVENTORY.md` (this file) | Master index: view types, modals, data entities, metrics count |
| `VIEWS.md` | Per-view documentation: purpose, inputs, outputs, tables, columns |
| `MODALS.md` | Per-modal documentation: fields, validation, save actions |
| `DATA-MODEL.md` | Full schema from `types.ts`: every interface, field, type, enum value |
| `FEATURES-AND-WORKFLOWS.md` | Per-feature workflows, status machines, validation rules |
| `INVENTORY-CHEATSHEET.md` | One-pager quick lookup |
| `ONLINE-REFERENCE.md` | Online `erppreview1.ai.studio` investigation results |

---

## 1. Product scope

A **single-page React SPA** for digital marketing team management + multi-brand social media planning + multi-channel reporting. Two brands hardcoded as sample data: **Dreamlab** (B2B cosmetic R&D lab) and **Toribio** (B2C skincare brand). No URL-based routing — navigation via in-memory `activePage` state union.

### What it solves

- Daily task tracking per team member with status workflow
- Content calendar per brand per channel (Instagram, TikTok, YouTube, Website, Paid Ads)
- Monthly reporting per brand with sub-tab deep dives per channel
- Lead funnel tracking: traffic → prospects → nurturing → goals
- Stories recap (daily + monthly)
- Per-post metrics tracking
- Multi-period comparison (current vs previous month)

### What it does NOT do

- No backend / no API — all data in `localStorage` keys: `dl_members`, `dl_tasks`, `dl_brands`, `dl_posts`, `dl_reports`
- No authentication / no user roles
- No multi-tenant
- No real-time sync
- No data export (CSV/PDF) — only in-app display

---

## 2. View types (top-level navigation, 4 total)

```ts
type ActivePage =
  | { type: 'overview' }                                                     // TaskOverview
  | { type: 'member'; memberName: string }                                    // MemberProfileView
  | { type: 'social-planner'; brandName: string; initialChannel?: string }   // ContentPlannerView
  | { type: 'social-report'; brandName: string; initialTab?: string };       // BrandReportingView
```

| View Type | Component | File | Sub-tabs |
|---|---|---|---|
| `overview` | `TaskOverview` | `src/components/TaskOverview.tsx` | Tasks grouped by status (Late / In Progress / Pending / Completed), per-member counts |
| `member` | `MemberProfileView` | `src/components/MemberProfileView.tsx` | Profile header + member's tasks list + member's posts list |
| `social-planner` | `ContentPlannerView` | `src/components/ContentPlannerView.tsx` | Calendar view + posts per brand + per-channel filter |
| `social-report` | `BrandReportingView` | `src/components/BrandReportingView.tsx` | 7 tabs: Executive Summary, Leads Funnel, Weekly, TikTok, YouTube, Website, Paid Ads |

See `VIEWS.md` for full per-view documentation.

---

## 3. Sidebar navigation (from `src/components/Sidebar.tsx`)

Two top-level sections in the sidebar (rendered via `Sidebar.tsx` component):

### Section 1: MANAGEMENT TASK (lines 132-211)
- **Overview & All Tasks** button → calls `onNavigate({type: 'overview'})` (Layers icon, total task count badge)
- **Team Members** sub-section: per-member button rows (avatar, name, completion ratio badge, late indicator)

### Section 2: SOCIAL MEDIA BRANDS (lines 213-422)
For each brand in `brands[]` (Dreamlab, Toribio):
- Brand header (clickable, navigates to social-planner)
- Expanded sub-menus:
  - **Leads Funnel (Goals)** → `social-report` with `initialTab: 'funnel'` (Target icon, GOALS badge)
  - **Executive Summary** → `social-report` with `initialTab: 'all'` (BarChart3 icon, ALL badge)
  - **Sub-Kanal Digital** sub-section with per-channel rows for `Instagram`, `TikTok`, `YouTube`, `Website`, `Paid Ads`:
    - Each channel has 2 action buttons: **Planner** (Calendar icon) and **Report** (BarChart3 icon)
- "Tambah Brand Baru" button at bottom (opens `BrandModal`)

---

## 4. Modals (9 total from `src/components/Modals.tsx` + 2 standalone)

| # | Modal | Trigger | Save action |
|---|---|---|---|
| 1 | `TaskModal` | "+ Add Task" button on Overview | `handleSaveTask` → prepends new task to `tasks[]` |
| 2 | `PostModal` | Click on date cell in Planner | `handleSavePost` → prepends new post to `posts[]` |
| 3 | `BrandModal` | "Tambah Brand Baru" in Sidebar | `handleSaveBrand` → appends brand + initializes blank report |
| 4 | `ReportMetricModal` | "Edit Monthly Metrics" in Reporting tab | `handleSaveReportMetrics` → updates report in `reports[]` |
| 5 | `TaskDetailModal` | Click task row | Read-only detail + status update + delete |
| 6 | `PostDetailModal` | Click post row | Read-only detail + status update + delete |
| 7 | `MemberEditModal` | "Edit Profile" in Member view | `handleSaveMember` → updates member |
| 8 | `PostMetricsModal` | "Edit Metrics" on Post detail | `handleSavePostMetrics` → updates `post.metrics` |
| 9 | `MonthlyStoriesModal` | "Edit Monthly Stories" in Stories tab | `handleSaveMonthlyStories` → updates `report.storiesRecap` |
| 10 | `WeeklyMetricModal` (standalone) | "Edit Weekly Metrics" in Weekly tab | Updates specific week's `weeklyReports[i]` |
| 11 | (sidebar `onOpenAddBrandModal`) | Tambah Brand | Wraps `BrandModal` |

See `MODALS.md` for field-by-field documentation.

---

## 5. Data entities (from `src/types.ts`, 405 lines)

11 core interfaces + 13 sub-types:

| Entity | Source type | Purpose |
|---|---|---|
| `Task` | `types.ts:5-21` | Single task item |
| `Member` | `types.ts:23-32` | Team member |
| `Brand` | `types.ts:73-82` | Social media brand |
| `SocialPost` | `types.ts:51-71` | Single content post |
| `BrandReport` | `types.ts:349-398` | Monthly report (60+ fields) |
| `PostMetrics` | `types.ts:38-49` | Per-post engagement metrics |
| `PlatformMetric` | `types.ts:84-92` | Per-platform rollup |
| `WeeklyTrend` | `types.ts:94-102` | Per-week rollup for chart |
| `FormatPerformance` | `types.ts:104-110` | Per-format rollup |
| `DailyStoryRecap` | `types.ts:112-125` | Per-day stories stats |
| `StoriesMonthlyRecap` | `types.ts:127-134` | Monthly stories rollup |
| `FollowerDynamics` | `types.ts:136-141` | Follower gain/loss/net |
| `WeeklyReportData` | `types.ts:143-178` | Single week detailed report |
| `ChannelLeadFunnel` | `types.ts:180-191` | Per-channel funnel (4 stages) |
| `TikTokTopVideo` | `types.ts:193-204` | Per-video TikTok performance |
| `TikTokReportData` | `types.ts:206-220` | TikTok monthly rollup |
| `YouTubeTopVideo` | `types.ts:222-231` | Per-video YouTube performance |
| `YouTubeReportData` | `types.ts:233-245` | YouTube monthly rollup |
| `WebsiteTask` | `types.ts:247-256` | SEO/web task |
| `WebsiteQueryMetric` | `types.ts:258-268` | Per-query GSC performance |
| `WebsiteReportData` | `types.ts:270-282` | Website monthly rollup |
| `MetaAdsCreativePerformance` | `types.ts:284-300` | Per-creative Meta Ads |
| `MetaAdsReportData` | `types.ts:302-313` | Meta Ads monthly rollup |
| `GoogleAdsQueryMetric` | `types.ts:315-324` | Per-query Google Ads |
| `GoogleAdsCampaign` | `types.ts:326-334` | Google Ads campaign |
| `GoogleAdsReportData` | `types.ts:336-347` | Google Ads monthly rollup |

### 7 enum types

| Enum | Values | Source |
|---|---|---|
| `TaskType` | `'Daily' \| 'Project'` | `types.ts:1` |
| `TaskStatus` | `'Pending' \| 'In Progress' \| 'Review' \| 'Completed' \| 'Late'` | `types.ts:2` |
| `TaskPriority` | `'High' \| 'Medium' \| 'Low'` | `types.ts:3` |
| `PostFormat` | `'Reels' \| 'Carousel' \| 'Single' \| 'Story' \| 'TikTok' \| 'Video' \| 'Shorts'` | `types.ts:34` |
| `PostPlatform` | `'Instagram' \| 'TikTok' \| 'YouTube' \| 'LinkedIn' \| 'Website' \| 'Paid Ads'` | `types.ts:35` |
| `PostStatus` | `'Planning' \| 'Brief' \| 'Draft' \| 'Production' \| 'Review' \| 'Published' \| 'Late'` | `types.ts:36` |

See `DATA-MODEL.md` for full schema.

---

## 6. Metrics inventory — exhaustive list

Every numeric field that represents a metric (displayed or computed). Organized by source entity.

### Task metrics
- Total task count (per status)
- Per-member task count
- Per-member completion ratio (Completed / Total)
- Late task count (per member, per status filter)

### Member / team metrics
- 4 hardcoded members: Gusti, Revita, Zarkasi, Rahmat

### Post / content metrics
- **Per-post (PostMetrics)**: views, reach, likes, comments, shares, saves, avgWatchPercentage, engagementRate, leadsContributed, sampleRequests
- **Per-post**: progress (0-100), status (Planning → ... → Published + Late), format, platform, hook, soundTrend, targetAngle, caption, brief
- **Per-week trends**: reach, views, engagement, impressions, followersGained, followersUnfollowed
- **Per-format performance**: postsCount, avgEngagementRate, avgReach, avgViews
- **Per-platform rollup**: followers, followersGrowth, reach, views, engagementRate, postsCount

### Brand report metrics (60+ in BrandReport)
- **Followers**: totalFollowers, followersGained, followersUnfollowed, followersNetGrowth, followersGrowthPercent
- **Views/Reach**: totalViews, averageViewsPerPost, totalReach, reachGrowthPercent, totalImpressions, impressionsGrowthPercent
- **Engagement**: totalLikes, totalComments, totalShares, totalSaves, totalEngagements, engagementRate, engagementRateChange
- **Stories**: totalStoriesCreated, totalStoryViews, avgViewsPerStory, avgStoriesPerDay, completionRate
- **Per-day stories**: storiesCount, totalViews, avgViewsPerStory, replies, linkClicks, shares, topicOrTheme, note, dayName
- **Weekly report fields** (per week): startingFollowers, followersGained, followersUnfollowed, netGrowth, growthPercent, endingFollowers, views, reach, impressions, totalEngagement, engagementRate, likes, comments, shares, saves, storiesCount, totalStoryViews, avgViewsPerStory, storyReplies, storyCompletionRate, highlights, notes

### Channel lead funnel (per channel × 4 stages)
- **Per-channel**: traffic (impressions/views/sessions), prospects (leads/inquiries), nurturingSamples (sample kits sent), goals (closed deals), conversionRate (%), spend (if paid), cpl (cost per lead IDR), dealValue (IDR), notes

### TikTok-specific metrics
- **Aggregate**: followers, followersGained, totalViews, avgWatchRetention, totalLikes, totalComments, totalShares, totalSaves, profileVisits, bioLinkClicks, leadsContributed, sampleRequests
- **Per top video**: title, hook, views, likes, shares, saves, retentionRate, leadsContributed, sampleRequests

### YouTube-specific metrics
- **Aggregate**: subscribers, subsGained, totalViews, watchTimeHours, avgViewDuration, impressions, ctr, leadsContributed, sampleRequests
- **Per top video**: title, format (Video | Shorts), views, watchTimeHours, ctr, leadsContributed, sampleRequests
- **Per traffic source**: source, percentage

### Website/SEO metrics
- **Aggregate**: totalSessions, totalUsers, organicImpressions, organicClicks, avgCtr, avgPosition, leadsTraffic, sampleRequests, conversionRate
- **Per query (GSC)**: queryName, impressions, clicks, ctr, avgPosition, leadsTraffic, sampleRequests, landingPage
- **Per task**: category (SEO Optimization | Landing Page | Blog Article | CRO & Sample Form | Technical & Speed), assignee, targetQuery, dueDate, status, impact

### Meta Ads metrics
- **Aggregate**: spend (IDR), impressions, clicks, cpc, ctr, leadsContributed, cpl (cost per lead IDR), sampleRequests, roas
- **Per creative**: creativeName, hook, format (Video/Reel | Carousel | Single Image | Catalog), visualAngle, spend, impressions, clicks, ctr, hookRate, leadsContributed, cpl, sampleRequests, status (Top Performer | Active | Fatigue | Testing), actionRecommendation

### Google Ads metrics
- **Aggregate**: spend, impressions, clicks, avgCpc, ctr, leadsContributed, costPerLead, conversionRate
- **Per campaign**: name, type (Search | Performance Max | Display/Retargeting), spend, impressions, clicks, leads, cpl
- **Per query**: keyword, matchType (Exact | Phrase | Broad), impressions, clicks, cpc, leadsContributed, conversionRate, cpl

### Calculated/derived metrics (from App.tsx + components)
- `lateTasksCount` — `tasks.filter(t => t.status === 'Late').length`
- Per-member completion ratio — `memberTasks.filter(t => t.status === 'Completed').length / memberTasks.length`
- Per-member has-late flag — `memberTasks.some(t => t.status === 'Late')`
- avgViewsPerStory (in monthly modal) — `totalStoryViews / totalStoriesCreated`
- Brand fallback report — auto-creates blank report with default values when new brand added

### Sample data values (from `data/initialData.ts` + `data/channelReportsData.ts`)
- 4 members
- 19 sample tasks (across all members + statuses)
- 2 brands (Dreamlab, Toribio)
- 30 sample posts (across both brands, all platforms, all statuses)
- 4 brand reports (Dreamlab Sep, Dreamlab Aug, Toribio Sep, Toribio Aug)
- 12 channel-specific report mocks (6 per brand × 2 brands)

---

## 7. localStorage schema

Keys written by `App.tsx`:

```ts
localStorage.setItem('dl_members', JSON.stringify(members))    // Member[]
localStorage.setItem('dl_tasks', JSON.stringify(tasks))        // Task[]
localStorage.setItem('dl_brands', JSON.stringify(brands))      // Brand[]
localStorage.setItem('dl_posts', JSON.stringify(posts))        // SocialPost[]
localStorage.setItem('dl_reports', JSON.stringify(reports))    // Record<string, BrandReport> — key is either brand name or "BrandName__Month Year"
```

Read on mount with fallback to `INITIAL_*` constants from `data/initialData.ts`.

---

## 8. File-by-file inventory

| File | LOC | Purpose |
|---|---:|---|
| `src/App.tsx` | 543 | Single-page shell, all view routing, state management, localStorage sync |
| `src/main.tsx` | ~10 | React entry |
| `src/types.ts` | 405 | All TypeScript interfaces and enums |
| `src/utils/helpers.ts` | ~50 | `getPreviousMonth` etc. |
| `src/data/initialData.ts` | 1545 | All sample data: members, brands, tasks, posts, reports |
| `src/data/channelReportsData.ts` | 740 | Per-channel report mock data (TikTok, YouTube, Website, Meta Ads, Google Ads, Lead Funnels × 2 brands) |
| `src/components/Sidebar.tsx` | 440 | Navigation sidebar |
| `src/components/TaskOverview.tsx` | ~200 | Tasks overview page |
| `src/components/MemberProfileView.tsx` | ~250 | Member detail page |
| `src/components/ContentPlannerView.tsx` | ~300 | Calendar + posts planner |
| `src/components/BrandReportingView.tsx` | ~400 | 7-tab reporting view |
| `src/components/Modals.tsx` | ~600 | All 8 main modals |
| `src/components/NurturingFunnelSection.tsx` | ~150 | Lead funnel sub-tab |
| `src/components/PaidAdsSection.tsx` | ~150 | Paid Ads (Meta + Google) sub-tab |
| `src/components/TikTokSection.tsx` | ~150 | TikTok reporting sub-tab |
| `src/components/YouTubeSection.tsx` | ~150 | YouTube reporting sub-tab |
| `src/components/WebsiteSection.tsx` | ~200 | Website/SEO reporting sub-tab |
| `src/components/WeeklyReportingSection.tsx` | ~200 | Weekly trends sub-tab |
| `src/components/StoriesRecapSection.tsx` | ~200 | Stories recap sub-tab |
| `src/components/MonthlyStoriesModal.tsx` | ~80 | Monthly stories edit modal |
| `src/components/WeeklyMetricModal.tsx` | ~100 | Weekly metric edit modal |
| `vite.config.ts` | ~30 | Vite + React build config |
| `package.json` | ~40 | Dependencies (React 18+, TypeScript, lucide-react, recharts) |
| `index.html` | ~15 | SPA entry |
| `metadata.json` | ~10 | Project metadata |
| `README.md` | ~30 | Brief project description |

**Total: ~21 source files, ~7000+ LOC** (rough estimate from file sizes).

---

## 9. Quick navigation

- Want to know what a page shows? → `VIEWS.md`
- Want to know what fields a form has? → `MODALS.md`
- Want to know the data schema? → `DATA-MODEL.md`
- Want to know how a workflow works? → `FEATURES-AND-WORKFLOWS.md`
- Want a one-page lookup? → `INVENTORY-CHEATSHEET.md`
- Want online reference notes? → `ONLINE-REFERENCE.md`

---

**Status**: Draft v1. Awaiting parallel Explore agents for gap-fill + user review.
