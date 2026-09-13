# Data Model — Complete Schema

> **Source**: `src/types.ts` (405 lines), `src/data/initialData.ts` (1545 lines), `src/data/channelReportsData.ts` (740 lines) — all from local reference.
>
> Every interface field documented. Every enum value listed. Sample data referenced for context.

---

## How to read this doc

Each entity is documented in 4 parts:
1. **Type signature** — from `types.ts`
2. **Field-by-field** — name, type, required/optional, business meaning, sample value
3. **Storage location** — where this data lives at runtime
4. **Cross-references** — which views/modals read or write this entity

---

## 1. Enums (7 total)

### `TaskType` — `types.ts:1`
```
'Daily' | 'Project'
```
- `Daily` — recurring task (e.g., "Daily Standup", "Check Incoming Leads")
- `Project` — one-off with a `project` field linking to a project name

### `TaskStatus` — `types.ts:2`
```
'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Late'
```
Workflow order: `Pending` → `In Progress` → `Review` → `Completed`. `Late` is an auto-derived status (task with past due date + not in completed state). Computed at render time, not stored.

### `TaskPriority` — `types.ts:3`
```
'High' | 'Medium' | 'Low'
```

### `PostFormat` — `types.ts:34`
```
'Reels' | 'Carousel' | 'Single' | 'Story' | 'TikTok' | 'Video' | 'Shorts'
```
- `Reels` — Instagram short-form video
- `Carousel` — Instagram swipeable multi-image
- `Single` — Instagram single image
- `Story` — Instagram 24h story
- `TikTok` — TikTok video (different from Reels because of platform constraint)
- `Video` — YouTube long-form
- `Shorts` — YouTube short-form

### `PostPlatform` — `types.ts:35`
```
'Instagram' | 'TikTok' | 'YouTube' | 'LinkedIn' | 'Website' | 'Paid Ads'
```

### `PostStatus` — `types.ts:36`
```
'Planning' | 'Brief' | 'Draft' | 'Production' | 'Review' | 'Published' | 'Late'
```
Workflow: `Planning` → `Brief` → `Draft` → `Production` → `Review` → `Published`. `Late` is auto-derived.

---

## 2. Core entities

### `Task` — `types.ts:5-21`

```ts
interface Task {
  id: string;
  name: string;
  type: TaskType;
  project?: string;
  assignee: string;        // Member.name (string, not FK)
  startDate: string;       // YYYY-MM-DD
  dueDate: string;         // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  link?: string;
  reference?: string;
  caption?: string;
  brief?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  createdAt: string;       // YYYY-MM-DD
}
```

| Field | Type | Required | Meaning |
|---|---|:---:|---|
| `id` | string | ✅ | `t-{prefix}-{timestamp}` pattern, e.g., `t-g1`, `t-r3`, `t-z1`, `t-rh1` |
| `name` | string | ✅ | Display title |
| `type` | `TaskType` | ✅ | `'Daily'` or `'Project'` |
| `project` | string | ❌ | Only set when `type === 'Project'`. Project grouping name |
| `assignee` | string | ✅ | **References `Member.name` as string** (no FK integrity) |
| `startDate` | string (YYYY-MM-DD) | ✅ | Inclusive start |
| `dueDate` | string (YYYY-MM-DD) | ✅ | Inclusive due |
| `priority` | `TaskPriority` | ✅ | High/Medium/Low |
| `status` | `TaskStatus` | ✅ | Pending → In Progress → Review → Completed (+ Late) |
| `link` | string (URL) | ❌ | External link (e.g., CRM URL) |
| `reference` | string | ❌ | Plain text reference / source |
| `caption` | string | ❌ | Long-form description |
| `brief` | string | ❌ | Brief instructions |
| `checklist` | array | ❌ | Sub-items with done flags |
| `createdAt` | string (YYYY-MM-DD) | ✅ | Date created |

**Storage**: `localStorage.dl_tasks` (Task[]). Read/written by App.tsx.

**Sample data** (19 tasks in `initialData.ts`):
- Gusti: 8 tasks (g1-g8) — Daily + Project mix, 1 Late
- Revita: 7 tasks (r1-r7) — 1 Late
- Zarkasi: 3 tasks (z1-z3) — 1 Late
- Rahmat: 3 tasks (rh1-rh3) — 1 Late

**Read by**: TaskOverview (groups by status), MemberProfileView (per-member), Sidebar (badge count)
**Written by**: TaskModal, TaskDetailModal (status update, delete)

---

### `Member` — `types.ts:23-32`

```ts
interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatarBg: string;       // hex color
  initial: string;        // 1-letter avatar label
  department: string;
}
```

| Field | Type | Required | Meaning |
|---|---|:---:|---|
| `id` | string | ✅ | `m{N}` pattern, e.g., `m1`, `m2` |
| `name` | string | ✅ | Display name (also used as FK reference from `Task.assignee`, `SocialPost.pic`) |
| `role` | string | ✅ | Job title |
| `email` | string | ✅ | Email address |
| `phone` | string | ✅ | Phone with country code |
| `avatarBg` | string (hex) | ✅ | Background color for avatar circle |
| `initial` | string (1 char) | ✅ | Avatar letter |
| `department` | string | ✅ | Department name |

**Sample data** (4 members in `initialData.ts:17-58`):

| ID | Name | Role | Email | Department |
|---|---|---|---|---|
| m1 | Gusti | Lead Digital & Brand Strategist | gusti@dreamlab.id | Digital Strategy |
| m2 | Revita | Creative Content & Social Media Lead | revita@dreamlab.id | Social Media |
| m3 | Zarkasi | Graphic Designer & Visual Specialist | zarkasi@dreamlab.id | Design & Visual |
| m4 | Rahmat | Video Production & Copywriter | rahmat@dreamlab.id | Production |

**Read by**: Sidebar (Team Members list), MemberProfileView (header), TaskOverview (per-member counts)
**Written by**: MemberEditModal

---

### `Brand` — `types.ts:73-82`

```ts
interface Brand {
  id: string;
  name: string;
  handle: string;           // @handle
  initial: string;          // 1-letter
  color: string;            // hex
  primaryPlatform: string;
  pic: string;              // Person in Charge — references Member.name
  note: string;
}
```

| Field | Type | Required | Meaning |
|---|---|:---:|---|
| `id` | string | ✅ | `b{N}` pattern |
| `name` | string | ✅ | Display name (used as FK reference from SocialPost.brandId) |
| `handle` | string | ✅ | Social handle e.g. `@dreamlab.workspace` |
| `initial` | string (1 char) | ✅ | Avatar letter |
| `color` | string (hex) | ✅ | Brand color (used in UI accents) |
| `primaryPlatform` | string | ✅ | Comma-separated platforms |
| `pic` | string | ✅ | **References Member.name** (the PIC) |
| `note` | string | ✅ | Brand description / tone |

**Sample data** (2 brands in `initialData.ts:60-81`):

| ID | Name | Handle | Color | PIC | Note |
|---|---|---|---|---|---|
| b1 | Dreamlab | @dreamlab.workspace | #1264d3 | Revita | B2B Cosmetic R&D & Maklon formulation laboratory. Tone: Professional, authoritative, sleek, innovative. |
| b2 | Toribio | @toribio.skincare | #ec4899 | Gusti | B2C Skincare & Beauty brand focusing on skin barrier and radiant glow. Tone: Friendly, vibrant, aesthetic, relatable. |

**Read by**: Sidebar (one card per brand), ContentPlannerView, BrandReportingView
**Written by**: BrandModal

---

### `SocialPost` — `types.ts:51-71`

```ts
interface SocialPost {
  id: string;
  brandId: string;                   // References Brand.name
  platform?: PostPlatform;
  title: string;
  date: string;                      // YYYY-MM-DD
  format: PostFormat;
  status: PostStatus;
  pic: string;                       // References Member.name
  progress: number;                  // 0 to 100
  imageUrl?: string;
  hook?: string;                     // First-line hook
  soundTrend?: string;               // For TikTok/Reels
  targetAngle?: string;              // Content angle / audience target
  ctaLink?: string;
  caption?: string;
  brief?: string;
  reference?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  metrics?: PostMetrics;
}
```

| Field | Type | Required | Meaning |
|---|---|:---:|---|
| `id` | string | ✅ | `p-{prefix}` e.g., `p-d1`, `p-t3`, `p-d-tt1` (TikTok), `p-d-yt1` (YouTube) |
| `brandId` | string | ✅ | **References Brand.name** (e.g., "Dreamlab", "Toribio") |
| `platform` | `PostPlatform` | ❌ | Specific platform; when omitted, post is brand-level (Instagram primary) |
| `title` | string | ✅ | Post title/topic |
| `date` | string (YYYY-MM-DD) | ✅ | Scheduled/posted date |
| `format` | `PostFormat` | ✅ | Reels/Carousel/Single/Story/TikTok/Video/Shorts |
| `status` | `PostStatus` | ✅ | Planning → Brief → Draft → Production → Review → Published (+ Late) |
| `pic` | string | ✅ | **References Member.name** (Person in Charge) |
| `progress` | number (0-100) | ✅ | Visual progress % |
| `imageUrl` | string (URL) | ❌ | Preview thumbnail |
| `hook` | string | ❌ | First-line hook (e.g., "Formula gagal di pasaran bukan karena wangi...") |
| `soundTrend` | string | ❌ | Audio trend name (TikTok/Reels) |
| `targetAngle` | string | ❌ | Content angle (e.g., "Behind the Scenes & Pabrik CPKB Tour") |
| `ctaLink` | string (URL) | ❌ | Call-to-action / bio link |
| `caption` | string | ❌ | Full post caption |
| `brief` | string | ❌ | Production brief |
| `reference` | string | ❌ | Reference URL or note |
| `checklist` | array | ❌ | Sub-tasks |
| `metrics` | `PostMetrics` | ❌ | Engagement metrics (only when Published) |

**Sample data** (30 posts in `initialData.ts:339-1031`):

| Brand | Count | Platforms | Statuses represented |
|---|---:|---|---|
| Dreamlab | 17 | Instagram, TikTok (4), YouTube (3), Website (2), Paid Ads (3) | Brief, Draft, Production, Review, Published, Late |
| Toribio | 13 | Instagram, TikTok (2), YouTube (1), Website (1), Paid Ads (1) | Brief, Draft, Production, Published |

**Read by**: ContentPlannerView (calendar + posts list), BrandReportingView (per-channel post lists)
**Written by**: PostModal, PostDetailModal, PostMetricsModal

---

### `BrandReport` — `types.ts:349-398` (master entity, 60+ fields)

```ts
interface BrandReport {
  id: string;
  brandId: string;
  monthYear: string;            // "September 2026"
  
  // Followers & growth (5)
  totalFollowers: number;
  followersGained: number;
  followersUnfollowed: number;
  followersNetGrowth: number;
  followersGrowthPercent: number;
  
  // Views & Reach (7)
  totalViews: number;
  averageViewsPerPost: number;
  totalReach: number;
  reachGrowthPercent: number;
  totalImpressions: number;
  impressionsGrowthPercent: number;
  
  // Engagements (7)
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  totalEngagements: number;
  engagementRate: number;
  engagementRateChange: number;
  
  // Stories
  storiesRecap?: StoriesMonthlyRecap;
  
  // Weekly breakdowns
  weeklyReports?: WeeklyReportData[];
  
  // Lead funnels (per channel)
  leadFunnels?: ChannelLeadFunnel[];
  
  // Per-channel deep dives (5)
  tiktokReport?: TikTokReportData;
  youtubeReport?: YouTubeReportData;
  websiteReport?: WebsiteReportData;
  metaAdsReport?: MetaAdsReportData;
  googleAdsReport?: GoogleAdsReportData;
  
  // Summary rollups
  totalPostsPublished: number;
  platformBreakdown: PlatformMetric[];
  weeklyTrends: WeeklyTrend[];
  formatPerformance: FormatPerformance[];
  executiveSummary: string;
  strategicRecommendations: string[];
}
```

**Field-by-field documentation:**

#### Identity (3)
| Field | Type | Required | Sample | Meaning |
|---|---|:---:|---|---|
| `id` | string | ✅ | `rep-dreamlab-sep26` | Unique report ID |
| `brandId` | string | ✅ | "Dreamlab" | References Brand.name |
| `monthYear` | string | ✅ | "September 2026" | Period label |

#### Followers & Growth (5)
| Field | Type | Required | Sample (Dreamlab Sep) | Sample (Toribio Sep) |
|---|---|:---:|---:|---:|
| `totalFollowers` | number | ✅ | 28450 | 64800 |
| `followersGained` | number | ✅ | 2180 | 5240 |
| `followersUnfollowed` | number | ✅ | 530 | 1120 |
| `followersNetGrowth` | number | ✅ | 1650 | 4120 |
| `followersGrowthPercent` | number (%) | ✅ | 6.1 | 6.8 |

#### Views & Reach (6)
| Field | Type | Required | Dreamlab | Toribio |
|---|---|:---:|---:|---:|
| `totalViews` | number | ✅ | 284000 | 620000 |
| `averageViewsPerPost` | number | ✅ | 35500 | 68800 |
| `totalReach` | number | ✅ | 184200 | 342000 |
| `reachGrowthPercent` | number (%) | ✅ | 22.4 | 31.2 |
| `totalImpressions` | number | ✅ | 492000 | 885000 |
| `impressionsGrowthPercent` | number (%) | ✅ | 19.5 | 28.0 |

#### Engagements (7)
| Field | Type | Required | Dreamlab | Toribio |
|---|---|:---:|---:|---:|
| `totalLikes` | number | ✅ | 4320 | 14500 |
| `totalComments` | number | ✅ | 380 | 1680 |
| `totalShares` | number | ✅ | 1220 | 3420 |
| `totalSaves` | number | ✅ | 2430 | 5100 |
| `totalEngagements` | number | ✅ | 8350 | 24700 |
| `engagementRate` | number (%) | ✅ | 5.2 | 6.8 |
| `engagementRateChange` | number (%) | ✅ | 0.8 | 1.2 |

#### Stories recap
| Field | Type | Required | Sample |
|---|---|:---:|---|
| `storiesRecap` | `StoriesMonthlyRecap` | ❌ | see below |

#### Weekly breakdowns
| Field | Type | Required | Sample count |
|---|---|:---:|---|
| `weeklyReports` | `WeeklyReportData[]` | ❌ | 4 (one per week of month) |

#### Lead funnels
| Field | Type | Required | Sample count |
|---|---|:---:|---|
| `leadFunnels` | `ChannelLeadFunnel[]` | ❌ | 6 (Instagram, TikTok, YouTube, Website, Meta Ads, Google Ads) |

#### Per-channel reports
| Field | Type | Required |
|---|---|:---:|
| `tiktokReport` | `TikTokReportData` | ❌ |
| `youtubeReport` | `YouTubeReportData` | ❌ |
| `websiteReport` | `WebsiteReportData` | ❌ |
| `metaAdsReport` | `MetaAdsReportData` | ❌ |
| `googleAdsReport` | `GoogleAdsReportData` | ❌ |

#### Summary rollups
| Field | Type | Required | Dreamlab | Toribio |
|---|---|:---:|---:|---:|
| `totalPostsPublished` | number | ✅ | 8 | 9 |
| `platformBreakdown` | `PlatformMetric[]` | ✅ | 3 platforms | 3 platforms |
| `weeklyTrends` | `WeeklyTrend[]` | ✅ | 4 weeks | 4 weeks |
| `formatPerformance` | `FormatPerformance[]` | ✅ | 3 formats | 3 formats |
| `executiveSummary` | string (paragraph) | ✅ | "Performa brand Dreamlab di September 2026..." | "Toribio mencatat lonjakan impresif..." |
| `strategicRecommendations` | string[] | ✅ | 3 items | 3 items |

**Storage**: `localStorage.dl_reports` keyed by brand name OR `"BrandName__Month Year"` (e.g., `reports["Dreamlab"]`, `reports["Dreamlab__Agustus 2026"]`). The dual keying supports both current brand lookup and historical period lookup.

**Sample data** (4 reports in `initialData.ts:1033-1544`):
- `reports["Dreamlab"]` — September 2026 (full)
- `reports["Toribio"]` — September 2026 (full)
- `reports["Dreamlab__Agustus 2026"]` — August 2026 (historical, partial)
- `reports["Toribio__Agustus 2026"]` — August 2026 (historical, partial)

**Read by**: BrandReportingView (all 7 tabs)
**Written by**: ReportMetricModal, MonthlyStoriesModal, WeeklyMetricModal, App.tsx (new brand fallback report)

---

## 3. Per-post metrics

### `PostMetrics` — `types.ts:38-49`

```ts
interface PostMetrics {
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  avgWatchPercentage?: number;
  engagementRate?: number;
  leadsContributed?: number;
  sampleRequests?: number;
}
```

| Field | Type | Required | Sample (TikTok video p-d-tt1) | Meaning |
|---|---|:---:|---:|---|
| `views` | number | ✅ | 94200 | Kuantitas Views / Video Plays / Impressions |
| `reach` | number | ✅ | 67100 | Unique accounts reached |
| `likes` | number | ✅ | 5410 | Likes |
| `comments` | number | ✅ | 312 | Comments |
| `shares` | number | ✅ | 980 | Shares |
| `saves` | number | ✅ | 1430 | Saves / Bookmarks |
| `avgWatchPercentage` | number | ❌ | 74 | Watch retention % (for video content) |
| `engagementRate` | number | ❌ | 4.88 | Calculated ER % = (likes+comments+shares+saves) / reach × 100 |
| `leadsContributed` | number | ❌ | 42 | Direct leads / DM inquiries from this post |
| `sampleRequests` | number | ❌ | 28 | Sample kit / formulation sample requests |

---

## 4. Per-platform metrics

### `PlatformMetric` — `types.ts:84-92`

```ts
interface PlatformMetric {
  platform: 'Instagram' | 'TikTok' | 'LinkedIn' | 'YouTube' | string;
  followers: number;
  followersGrowth: number;
  reach: number;
  views: number;
  engagementRate: number;
  postsCount: number;
}
```

Sample (Dreamlab Sep 2026):
- Instagram: 18900 followers, +1100 growth, 114200 reach, 186000 views, 5.4% ER, 9 posts
- LinkedIn: 6350 followers, +420 growth, 48000 reach, 65000 views, 6.8% ER, 4 posts
- TikTok: 3200 followers, +130 growth, 22000 reach, 33000 views, 3.2% ER, 1 post

Sample (Toribio Sep 2026):
- Instagram: 41200 followers, +2350 growth, 188000 reach, 340000 views, 6.5% ER, 11 posts
- TikTok: 21800 followers, +1680 growth, 142000 reach, 260000 views, 7.4% ER, 6 posts
- YouTube: 1800 followers, +90 growth, 12000 reach, 20000 views, 4.8% ER, 1 post

---

## 5. Weekly rollups

### `WeeklyTrend` — `types.ts:94-102` (for chart)

```ts
interface WeeklyTrend {
  week: string;        // "Minggu 1", "Minggu 2", etc.
  reach: number;
  views: number;
  engagement: number;
  impressions: number;
  followersGained?: number;
  followersUnfollowed?: number;
}
```

Sample (Dreamlab Sep 2026):
- Minggu 1: reach 38500, views 62000, engagement 2100, impressions 98000
- Minggu 2: reach 52400, views 88000, engagement 2950, impressions 138000
- Minggu 3: reach 47200, views 71000, engagement 2540, impressions 126000
- Minggu 4: reach 46100, views 63000, engagement 2430, impressions 130000

### `WeeklyReportData` — `types.ts:143-178` (detailed weekly)

```ts
interface WeeklyReportData {
  id: string;
  weekNumber: number;          // 1, 2, 3, 4, 5
  weekLabel: string;           // "Minggu 1"
  dateRange: string;           // "1 - 7 Sep 2026"
  
  // Followers
  startingFollowers?: number;
  followersGained: number;
  followersUnfollowed: number;
  netGrowth: number;
  growthPercent?: number;
  endingFollowers: number;
  
  // Engagement
  views: number;
  reach: number;
  impressions?: number;
  totalEngagement: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  
  // Stories
  storiesCount: number;
  totalStoryViews: number;
  avgViewsPerStory: number;
  storyReplies?: number;
  storyCompletionRate?: number;
  
  // Qualitative
  highlights?: string;
  notes?: string;
}
```

**23 fields per week**. Sample (Dreamlab Minggu 1 Sep 2026):
- startingFollowers: 26800
- followersGained: 520, followersUnfollowed: 110, netGrowth: 410, growthPercent: 1.53
- endingFollowers: 27210
- views: 62000, reach: 38500, impressions: 98000
- totalEngagement: 2100, engagementRate: 5.45
- likes: 1100, comments: 95, shares: 310, saves: 595
- storiesCount: 6, totalStoryViews: 14200, avgViewsPerStory: 2367, storyReplies: 48, storyCompletionRate: 77
- highlights: "Peluncuran BTS lab homogenizer mendapat respon positif."
- notes: "Engagement didorong oleh antusiasme formulasi barrier cream baru."

---

## 6. Format performance

### `FormatPerformance` — `types.ts:104-110`

```ts
interface FormatPerformance {
  format: string;                  // 'Carousel' | 'Reels' | 'Single Image' etc.
  postsCount: number;
  avgEngagementRate: number;
  avgReach: number;
  avgViews: number;
}
```

Sample (Dreamlab Sep 2026):
- Carousel: 6 posts, 6.4% ER, 24500 reach, 38000 views
- Reels: 5 posts, 4.8% ER, 39800 reach, 64000 views
- Single Image: 3 posts, 3.6% ER, 14600 reach, 22000 views

Sample (Toribio Sep 2026):
- Reels: 9 posts, 7.8% ER, 48200 reach, 86000 views
- Carousel: 6 posts, 5.9% ER, 28400 reach, 44000 views
- Single Image: 3 posts, 4.2% ER, 16800 reach, 26000 views

---

## 7. Stories metrics

### `DailyStoryRecap` — `types.ts:112-125`

```ts
interface DailyStoryRecap {
  id: string;
  date: string;                   // YYYY-MM-DD
  dayNumber: number;              // 1, 2, 3...
  dayName?: string;               // "Rabu", "Selasa", etc.
  storiesCount: number;
  totalViews: number;
  avgViewsPerStory?: number;
  replies?: number;               // DM replies
  linkClicks?: number;            // Sticker tap-through
  shares?: number;
  topicOrTheme?: string;
  note?: string;
}
```

Sample (Toribio Sep 9 — flash sale day):
- dayNumber: 9, dayName: "Rabu"
- storiesCount: 6, totalViews: 21500, avgViewsPerStory: 3583
- replies: 195, linkClicks: 320
- topicOrTheme: "D-Day Flash Sale 9.9 & Live Order Packing"

### `StoriesMonthlyRecap` — `types.ts:127-134`

```ts
interface StoriesMonthlyRecap {
  totalStoriesCreated: number;
  totalStoryViews: number;
  avgViewsPerStory: number;
  avgStoriesPerDay?: number;
  completionRate?: number;        // %
  dailyStories?: DailyStoryRecap[];
}
```

Sample (Dreamlab Sep 2026):
- totalStoriesCreated: 20, totalStoryViews: 48100, avgViewsPerStory: 2405
- avgStoriesPerDay: 2.2, completionRate: 78
- dailyStories: 9 entries (Sep 1-9, others implicit)

Sample (Toribio Sep 2026):
- totalStoriesCreated: 32, totalStoryViews: 105000, avgViewsPerStory: 3281
- avgStoriesPerDay: 3.5, completionRate: 84

### `FollowerDynamics` — `types.ts:136-141`

```ts
interface FollowerDynamics {
  followersGained: number;
  followersUnfollowed: number;
  netGrowth: number;
  unfollowRate: number;          // %
}
```

---

## 8. Lead funnel per channel

### `ChannelLeadFunnel` — `types.ts:180-191`

```ts
interface ChannelLeadFunnel {
  channel: 'Instagram' | 'TikTok' | 'YouTube' | 'Website' | 'Meta Ads' | 'Google Ads';
  traffic: number;               // Impressions / Views / Sessions
  prospects: number;             // Contributed Leads / Inquiries
  nurturingSamples: number;      // Product sample kits / Formulation testing sent
  goals: number;                 // Closed Deals / Won Contracts / Paying Customers
  conversionRate: number;        // Leads to Goals %
  spend?: number;                // Ad spend (paid channels only)
  cpl?: number;                  // Cost per Lead (IDR)
  dealValue?: number;            // Estimated closed deal value (IDR)
  notes: string;
}
```

Sample (Dreamlab Sep 2026):
| Channel | Traffic | Prospects | Samples | Goals | Conv% | Spend | CPL |
|---|---:|---:|---:|---:|---:|---:|---:|
| Instagram | 186000 | 84 | 32 | 8 | 9.5% | - | - |
| TikTok | 67000 | 65 | 45 | 5 | 7.7% | - | - |
| YouTube | 34000 | 26 | 18 | 3 | 11.5% | - | - |
| Website | 38400 | 48 | 32 | 6 | 12.5% | - | - |
| Meta Ads | 384000 | 112 | 84 | 14 | 12.5% | 10750000 | 95982 |
| Google Ads | 89400 | 52 | 28 | 7 | 13.5% | 9320000 | 179230 |

---

## 9. TikTok-specific

### `TikTokTopVideo` — `types.ts:193-204`

```ts
interface TikTokTopVideo {
  id: string;
  title: string;
  hook: string;
  views: number;
  likes: number;
  shares: number;
  saves: number;
  retentionRate: number;          // %
  leadsContributed: number;
  sampleRequests: number;
}
```

### `TikTokReportData` — `types.ts:206-220`

```ts
interface TikTokReportData {
  followers: number;
  followersGained: number;
  totalViews: number;
  avgWatchRetention: number;      // %
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  profileVisits: number;
  bioLinkClicks: number;
  leadsContributed: number;
  sampleRequests: number;
  topVideos: TikTokTopVideo[];
}
```

Sample (Dreamlab TikTok Sep 2026):
- followers: 3200, followersGained: 460, totalViews: 94000, avgWatchRetention: 73
- totalLikes: ~10000, totalComments: ~800, totalShares: ~2200, totalSaves: ~3700
- profileVisits: ~4500, bioLinkClicks: ~280
- leadsContributed: ~110, sampleRequests: ~75

---

## 10. YouTube-specific

### `YouTubeTopVideo` — `types.ts:222-231`

```ts
interface YouTubeTopVideo {
  id: string;
  title: string;
  format: 'Video' | 'Shorts';
  views: number;
  watchTimeHours: number;
  ctr: number;                    // %
  leadsContributed: number;
  sampleRequests: number;
}
```

### `YouTubeReportData` — `types.ts:233-245`

```ts
interface YouTubeReportData {
  subscribers: number;
  subsGained: number;
  totalViews: number;
  watchTimeHours: number;
  avgViewDuration: string;        // e.g., "4:32"
  impressions: number;
  ctr: number;
  leadsContributed: number;
  sampleRequests: number;
  trafficSources: { source: string; percentage: number }[];
  topVideos: YouTubeTopVideo[];
}
```

Sample (Dreamlab YouTube Sep 2026):
- subscribers: 1420, subsGained: 180, totalViews: 28400, watchTimeHours: 1240
- avgViewDuration: "4:32" (example), impressions: ~84000, ctr: 4.8%
- leadsContributed: ~64, sampleRequests: ~40

---

## 11. Website/SEO

### `WebsiteTask` — `types.ts:247-256`

```ts
interface WebsiteTask {
  id: string;
  title: string;
  category: 'SEO Optimization' | 'Landing Page' | 'Blog Article' | 'CRO & Sample Form' | 'Technical & Speed';
  assignee: string;
  targetQuery?: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Review' | 'Completed';
  impact: string;                // e.g., "+520 Organic Impressions / +12 Leads"
}
```

### `WebsiteQueryMetric` — `types.ts:258-268`

```ts
interface WebsiteQueryMetric {
  id: string;
  queryName: string;
  impressions: number;            // Search Console
  clicks: number;                  // Organic clicks
  ctr: number;                     // %
  avgPosition: number;             // SERP rank
  leadsTraffic: number;
  sampleRequests: number;
  landingPage: string;
}
```

### `WebsiteReportData` — `types.ts:270-282`

```ts
interface WebsiteReportData {
  totalSessions: number;
  totalUsers: number;
  organicImpressions: number;
  organicClicks: number;
  avgCtr: number;
  avgPosition: number;
  leadsTraffic: number;
  sampleRequests: number;
  conversionRate: number;
  queries: WebsiteQueryMetric[];
  tasks: WebsiteTask[];
}
```

Sample (Dreamlab Website Sep 2026):
- totalSessions: 38400, totalUsers: 29100, organicImpressions: 128000, organicClicks: 10330
- avgCtr: 8.07, avgPosition: 4.2, leadsTraffic: ~96, sampleRequests: ~64
- conversionRate: 4.8

---

## 12. Meta Ads

### `MetaAdsCreativePerformance` — `types.ts:284-300`

```ts
interface MetaAdsCreativePerformance {
  id: string;
  creativeName: string;
  hook: string;
  format: 'Video / Reel' | 'Carousel' | 'Single Image' | 'Catalog';
  visualAngle: string;
  spend: number;                   // IDR
  impressions: number;
  clicks: number;
  ctr: number;                     // %
  hookRate: number;                // 3-sec video view %
  leadsContributed: number;
  cpl: number;                     // IDR
  sampleRequests: number;
  status: 'Top Performer' | 'Active' | 'Fatigue' | 'Testing';
  actionRecommendation: string;
}
```

### `MetaAdsReportData` — `types.ts:302-313`

```ts
interface MetaAdsReportData {
  spend: number;                   // IDR
  impressions: number;
  clicks: number;
  cpc: number;                     // IDR
  ctr: number;                     // %
  leadsContributed: number;
  cpl: number;                     // IDR
  sampleRequests: number;
  roas: number;
  creatives: MetaAdsCreativePerformance[];
}
```

Sample (Dreamlab Meta Ads Sep 2026):
- spend: 10750000, impressions: 384000, clicks: 12400, cpc: 866
- ctr: 3.23%, leadsContributed: ~194, cpl: ~55400, sampleRequests: ~142
- roas: 4.2

---

## 13. Google Ads

### `GoogleAdsQueryMetric` — `types.ts:315-324`

```ts
interface GoogleAdsQueryMetric {
  keyword: string;
  matchType: 'Exact' | 'Phrase' | 'Broad';
  impressions: number;
  clicks: number;
  cpc: number;
  leadsContributed: number;
  conversionRate: number;
  cpl: number;
}
```

### `GoogleAdsCampaign` — `types.ts:326-334`

```ts
interface GoogleAdsCampaign {
  name: string;
  type: 'Search' | 'Performance Max' | 'Display / Retargeting';
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
}
```

### `GoogleAdsReportData` — `types.ts:336-347`

```ts
interface GoogleAdsReportData {
  spend: number;
  impressions: number;
  clicks: number;
  avgCpc: number;
  ctr: number;
  leadsContributed: number;
  costPerLead: number;
  conversionRate: number;
  campaigns: GoogleAdsCampaign[];
  topQueries: GoogleAdsQueryMetric[];
}
```

Sample (Dreamlab Google Ads Sep 2026):
- spend: 9320000, impressions: 89400, clicks: 6420, avgCpc: 1451
- ctr: 7.18%, leadsContributed: ~120, costPerLead: ~77600, conversionRate: 12.4

---

## 14. Cross-entity relationships

```
Member (m1-m4)
  ↓ (referenced by name string)
  ├→ Task.assignee
  └→ Brand.pic

Brand (b1-b2: Dreamlab, Toribio)
  ↓ (referenced by name string)
  ├→ SocialPost.brandId
  └→ BrandReport.brandId

SocialPost
  ↓ (1:many)
  └→ PostMetrics (embedded, only if Published)

BrandReport (keyed by brand name OR "BrandName__Month Year")
  ├→ platformBreakdown: PlatformMetric[]
  ├→ weeklyTrends: WeeklyTrend[]
  ├→ formatPerformance: FormatPerformance[]
  ├→ storiesRecap: StoriesMonthlyRecap
  │     └→ dailyStories: DailyStoryRecap[]
  ├→ weeklyReports: WeeklyReportData[]
  ├→ leadFunnels: ChannelLeadFunnel[]
  ├→ tiktokReport: TikTokReportData
  │     └→ topVideos: TikTokTopVideo[]
  ├→ youtubeReport: YouTubeReportData
  │     ├→ trafficSources: {source, percentage}[]
  │     └→ topVideos: YouTubeTopVideo[]
  ├→ websiteReport: WebsiteReportData
  │     ├→ queries: WebsiteQueryMetric[]
  │     └→ tasks: WebsiteTask[]
  ├→ metaAdsReport: MetaAdsReportData
  │     └→ creatives: MetaAdsCreativePerformance[]
  └→ googleAdsReport: GoogleAdsReportData
        ├→ campaigns: GoogleAdsCampaign[]
        └→ topQueries: GoogleAdsQueryMetric[]
```

---

## 15. Computed/derived metrics (not stored, computed at render)

| Metric | Formula | Used by |
|---|---|---|
| `lateTasksCount` | `tasks.filter(t => t.status === 'Late').length` | Sidebar badge |
| Per-member task count | `tasks.filter(t => t.assignee === member.name).length` | MemberProfileView, TaskOverview |
| Per-member completion | `memberTasks.filter(t => t.status === 'Completed').length / memberTasks.length` | Sidebar badge |
| Per-member has-late | `memberTasks.some(t => t.status === 'Late')` | Sidebar dot indicator |
| Engagement rate per post | `(likes+comments+shares+saves) / reach × 100` | PostMetrics.engagementRate |
| Average views per story | `totalStoryViews / totalStoriesCreated` | MonthlyStoriesModal save action |
| Net follower growth | `followersGained - followersUnfollowed` | BrandReport (stored, also derived) |
| Avg views per post (brand) | `totalViews / postsCount` (implied) | BrandReport.averageViewsPerPost |

---

## 16. Storage summary

```ts
// App.tsx localStorage keys:
localStorage.setItem('dl_members', JSON.stringify(members))      // Member[]
localStorage.setItem('dl_tasks', JSON.stringify(tasks))          // Task[]
localStorage.setItem('dl_brands', JSON.stringify(brands))        // Brand[]
localStorage.setItem('dl_posts', JSON.stringify(posts))          // SocialPost[]
localStorage.setItem('dl_reports', JSON.stringify(reports))      // Record<string, BrandReport>
```

Reports dual-keyed:
- `reports["Dreamlab"]` → current report for Dreamlab
- `reports["Dreamlab__September 2026"]` → historical September
- `reports["Dreamlab__Agustus 2026"]` → historical August

Lookup logic (`getReportForBrandAndPeriod` in App.tsx:303-305):
```ts
reports[`${brandName}__${period}`] || reports[brandName]
```

---

## 17. Dead code / orphan fields (verified by grep)

| Field | Source | Issue |
|---|---|---|
| `Task.caption` | `types.ts:17` | Declared; never populated in `INITIAL_TASKS`, never read by any component |
| `Task.checklist` | `types.ts:19` | Declared; never populated; never read |
| `PostMetrics.shares` (nested in SocialPost.metrics) | `types.ts:43` | Declared in PostMetrics type, but never populated in any sample post |
| `SocialPost.checklist` | `types.ts:69` | Declared; never populated in `INITIAL_POSTS` |
| `SocialPost.ctaLink` | `types.ts:65` | Declared; never populated; never read |
| `SocialPost.reference` | `types.ts:68` | Declared; populated only on 1 sample post (`p-d4`); never rendered |
| `DailyStoryRecap.shares` | `types.ts:122` | Declared; never populated; never read |
| `DailyStoryRecap.note` | `types.ts:124` | Declared; never populated; never read |
| `WebsiteTask.targetQuery` | `types.ts:252` | Declared; never populated; never read |
| **`FollowerDynamics` (whole interface)** | `types.ts:136-141` | **ORPHAN** — defined but never imported by any file |
| `App.tsx handleSaveBrand` `weeklyTrends` seed | `App.tsx:248-253` | New-brand seed omits `views`, `followersGained`, `followersUnfollowed` — inconsistent with later writes that include them |
| `App.tsx handleSaveBrand` `topPosts: []` | `App.tsx:258` | References a `topPosts` field that **doesn't exist** on `BrandReport` type — stale dead code |
| `WeeklyTrend.followersGained` / `followersUnfollowed` | `types.ts:100-101` | Filled in `INITIAL_REPORTS` but omitted in new-brand seed — schema mismatch |

---

## 18. Helper utilities (`src/utils/helpers.ts`)

| Function | Formula | Used for |
|---|---|---|
| `calculateDaysLeft` | `Math.round((dueDate - today) / 86400000)` | Days-until-due badge on tasks |
| `formatDateIndo` | Indonesian short-month (`Sep`, `Okt`) with day-of-week lookup | Date displays |
| `calcComparison` | `(curr - prev) / abs(prev) × 100` with prev=0 edge cases (returns N/A or 100%) | Month-over-month % change |
| `formatNumber` | `Intl.NumberFormat('id-ID')` → `"36.000.000"` | All IDR amounts in UI |
| `getPreviousMonth` | Period string math | Historical comparison |

**Formatting conventions:**
- Currency: IDR, stored as raw integer, displayed via `formatNumber()` → `"36.000.000"`. Never stored with currency symbol.
- Percentages: stored as plain number 0-100, displayed with `%` suffix.
- Time/duration: `avgViewDuration` is string `"mm:ss"` (e.g., `"08:45"`), never a number.
- Indonesian labels: hard-coded arrays in helpers; **inconsistent** — mixes short (`'Sep'`) and full (`'September'`) forms across the codebase.

**Footgun**: `formatDateIndo` month array is missing entries — Apr, Jul, Aug are collapsed (e.g., `formatDateIndo('2026-04-01')` may return wrong result).

---

## 19. Computed/derived metrics (not stored, computed at render) — EXPANDED

| Metric | Formula | Used by |
|---|---|---|
| `lateTasksCount` | `tasks.filter(t => t.status === 'Late').length` | Sidebar badge |
| Per-member task count | `tasks.filter(t => t.assignee === member.name).length` | MemberProfileView, TaskOverview |
| Per-member completion | `memberTasks.filter(t => t.status === 'Completed').length / memberTasks.length` | Sidebar badge |
| Per-member has-late | `memberTasks.some(t => t.status === 'Late')` | Sidebar dot indicator |
| Engagement rate per post | `(likes+comments+shares+saves) / reach × 100` | `PostMetrics.engagementRate` |
| Average views per story | `Math.round(totalStoryViews / totalStoriesCreated)` | MonthlyStoriesModal save action |
| Net follower growth | `followersGained - followersUnfollowed` | Stored + derived in BrandReport |
| **Weekly growth percent** | `netGrowth / startingFollowers × 100` | Stored in `WeeklyReportData.growthPercent` |
| **Total engagements** | `likes + comments + shares + saves` | Stored in BrandReport.totalEngagements |
| **CTR (ads)** | `clicks / impressions × 100` | Stored in Meta/Google Ads reports |
| **CPC** | `spend / clicks` | Stored (Meta + Google Ads) |
| **CPL (cost per lead)** | `spend / leadsContributed` | Stored in funnel + ads reports |
| **ROAS (proxy)** | `dealValue / spend` (proxy) | Stored in MetaAdsReportData.roas |
| **Funnel conversion rate** | `goals / prospects × 100` | Stored per channel |
| **Hook rate** | 3-second video view percentage | Stored per creative |
| **Save-to-Reach ratio** | `saves / reach × 100` (referenced in recommendation text only) | Used in strategicRecommendations strings |
| **Stories completion rate** | Stored as percentage | `storiesRecap.completionRate` |
| **Daily done / total per member** | Count of `Daily` type with `status='Completed'` over total `Daily` | `TaskOverview.tsx` member cards |
| **Project active per member** | Count of `Project` type with `status != 'Completed'` | `TaskOverview.tsx` member cards |
| **Member completion rate** | `Math.round(mCompleted / mTasks × 100)` | `TaskOverview.tsx` |
| **Overall completion** | `Math.round(completed / total × 100)` | Overview metric card |

---

**Status**: Draft v2. Pending 2 remaining Explore agents (pages/routes/features) for cross-validation. Final integration into VIEWS.md / MODALS.md / FEATURES-AND-WORKFLOWS.md next.
