# Inventory Cheatsheet — One-Page Quick Lookup

> **One-pager for the dreamlab-erp reference at `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\dreamlab-erp-—-task-&-social-media-management`**

---

## Stack at a glance
- **Type**: React + TypeScript SPA (Vite)
- **Backend**: NONE — all data in `localStorage`
- **Routing**: NONE — in-memory `activePage` discriminated union (4 types)
- **State mgmt**: Plain React `useState` + `useEffect` for localStorage sync
- **No auth**, no roles, no multi-tenant
- **~21 source files**, ~7000 LOC

---

## 4 view types

| Type | Component | Purpose |
|---|---|---|
| `overview` | `TaskOverview` | All tasks across members, grouped by status |
| `member` | `MemberProfileView` | Per-member detail + tasks + posts |
| `social-planner` | `ContentPlannerView` | Calendar + posts per brand per channel |
| `social-report` | `BrandReportingView` | 7-tab monthly reporting per brand |

---

## 5 core entities (localStorage keys)

| Key | Entity | Sample count |
|---|---|---|
| `dl_members` | `Member` | 4 (Gusti, Revita, Zarkasi, Rahmat) |
| `dl_brands` | `Brand` | 2 (Dreamlab, Toribio) |
| `dl_tasks` | `Task` | 19-20 across members |
| `dl_posts` | `SocialPost` | 22-30 across brands/platforms |
| `dl_reports` | `Record<string, BrandReport>` | 4 reports (2 brands × 2 months) |

---

## 9 modals (in `Modals.tsx` + 2 standalone)

| Modal | Trigger |
|---|---|
| `TaskModal` | "Tambah Task" button |
| `PostModal` | Click calendar date or "Tambah Post" |
| `BrandModal` | Sidebar "+" or "Tambah Brand Baru" |
| `ReportMetricModal` | "Edit Monthly Metrics" in reporting header |
| `TaskDetailModal` | "Detail" button on task row |
| `PostDetailModal` | "Detail" button on post row |
| `MemberEditModal` | "Edit Profile" on member view |
| `PostMetricsModal` | "Edit Metrics" on post detail |
| `MonthlyStoriesModal` | "Edit Monthly Stories" button |
| `WeeklyMetricModal` | "Edit Weekly Metrics" per week card |

---

## 7 enums

| Enum | Values |
|---|---|
| `TaskType` | `'Daily' \| 'Project'` |
| `TaskStatus` | `'Pending' \| 'In Progress' \| 'Review' \| 'Completed' \| 'Late'` |
| `TaskPriority` | `'High' \| 'Medium' \| 'Low'` |
| `PostFormat` | `'Reels' \| 'Carousel' \| 'Single' \| 'Story' \| 'TikTok' \| 'Video' \| 'Shorts'` |
| `PostPlatform` | `'Instagram' \| 'TikTok' \| 'YouTube' \| 'LinkedIn' \| 'Website' \| 'Paid Ads'` |
| `PostStatus` | `'Planning' \| 'Brief' \| 'Draft' \| 'Production' \| 'Review' \| 'Published' \| 'Late'` |
| `WebsiteTask.category` | `'SEO Optimization' \| 'Landing Page' \| 'Blog Article' \| 'CRO & Sample Form' \| 'Technical & Speed'` |
| `MetaAdsCreativePerformance.format` | `'Video / Reel' \| 'Carousel' \| 'Single Image' \| 'Catalog'` |
| `MetaAdsCreativePerformance.status` | `'Top Performer' \| 'Active' \| 'Fatigue' \| 'Testing'` |
| `GoogleAdsQueryMetric.matchType` | `'Exact' \| 'Phrase' \| 'Broad'` |
| `GoogleAdsCampaign.type` | `'Search' \| 'Performance Max' \| 'Display / Retargeting'` |
| `YouTubeTopVideo.format` | `'Video' \| 'Shorts'` |
| `ChannelLeadFunnel.channel` | `'Instagram' \| 'TikTok' \| 'YouTube' \| 'Website' \| 'Meta Ads' \| 'Google Ads'` |
| `PlatformMetric.platform` | `'Instagram' \| 'TikTok' \| 'LinkedIn' \| 'YouTube' \| (string)` |

---

## BrandReport fields (60+) — quick reference

### Identity (3)
- `id`, `brandId`, `monthYear`

### Followers (5)
- `totalFollowers`, `followersGained`, `followersUnfollowed`, `followersNetGrowth`, `followersGrowthPercent`

### Views/Reach (6)
- `totalViews`, `averageViewsPerPost`, `totalReach`, `reachGrowthPercent`, `totalImpressions`, `impressionsGrowthPercent`

### Engagements (7)
- `totalLikes`, `totalComments`, `totalShares`, `totalSaves`, `totalEngagements`, `engagementRate`, `engagementRateChange`

### Stories
- `storiesRecap?: StoriesMonthlyRecap`

### Weekly
- `weeklyReports?: WeeklyReportData[]`

### Lead funnels
- `leadFunnels?: ChannelLeadFunnel[]`

### Per-channel (5)
- `tiktokReport?: TikTokReportData`
- `youtubeReport?: YouTubeReportData`
- `websiteReport?: WebsiteReportData`
- `metaAdsReport?: MetaAdsReportData`
- `googleAdsReport?: GoogleAdsReportData`

### Summary rollups
- `totalPostsPublished`, `platformBreakdown[]`, `weeklyTrends[]`, `formatPerformance[]`, `executiveSummary`, `strategicRecommendations[]`

---

## 4-stage Lead Funnel

```
Traffic (impressions/views/sessions)
  ↓
Prospects (leads/inquiries)
  ↓
Nurturing (sample kits / formulation testing)
  ↓
Goals (closed deals / won contracts)
```

---

## Computed/derived metric catalog

- `lateTasksCount` — sidebar badge
- Per-member completion — `(completed / total) × 100`
- Per-member has-late — `tasks.some(t => t.status === 'Late')`
- Engagement rate per post — `(likes+comments+shares+saves) / reach × 100`
- Avg views per story — `Math.round(totalStoryViews / totalStoriesCreated)`
- Net follower growth — `followersGained - followersUnfollowed`
- Weekly growth percent — `netGrowth / startingFollowers × 100`
- Total engagements — `likes + comments + shares + saves`
- CTR — `clicks / impressions × 100`
- CPC — `spend / clicks`
- CPL — `spend / leadsContributed`
- ROAS (proxy) — `dealValue / spend`
- Funnel conversion rate — `goals / prospects × 100`
- Hook rate — 3-second video view %
- Save-to-Reach ratio — `saves / reach × 100`
- Stories completion rate — stored as %
- Daily done/total per member — count
- Project active per member — count
- Days left — `Math.round((dueDate - today) / 86400000)`

---

## Helper functions (`src/utils/helpers.ts`)

- `calculateDaysLeft` — days until due
- `formatDateIndo` — Indonesian short-month
- `calcComparison` — MoM delta with edge cases
- `formatNumber` — IDR formatting
- `getPreviousMonth` — period math

---

## Known bugs / footguns

- `App.tsx handleSaveBrand` references `topPosts: []` (field not in `BrandReport` type)
- `formatDateIndo` month array incomplete (Apr/Jul/Aug missing entries)
- `Task.caption`, `Task.checklist`, `SocialPost.ctaLink`, `SocialPost.checklist`, `SocialPost.reference` declared but unused
- `PostMetrics.shares` declared but never populated
- `FollowerDynamics` interface ORPHAN (never imported)
- `WeeklyTrend.followersGained`/`followersUnfollowed` filled in samples but missing in new-brand seed (schema mismatch)
- Mixed short `'Sep'` vs full `'September'` month labels across codebase

---

## FK relationships (loose, string-based, NOT enforced)

```
Brand.name ← SocialPost.brandId
Member.name ← Task.assignee
Member.name ← SocialPost.pic
Member.name ← Brand.pic
Brand.name ← BrandReport.brandId
```

---

## What to use as source of truth when porting to NexERP

- **Types**: `src/types.ts` (the schema is the ground truth)
- **Sample data**: `src/data/initialData.ts` (members, brands, tasks, posts, reports)
- **Per-channel reports**: `src/data/channelReportsData.ts` (12 mock reports)
- **View render branches**: `src/App.tsx:371-444` (4 view types)
- **State management**: `src/App.tsx:47-113` (5 entities + 9 modal states)
- **Computed metrics**: scattered across components + `src/utils/helpers.ts`

---

**Use this page for orientation. See other docs for depth.**
