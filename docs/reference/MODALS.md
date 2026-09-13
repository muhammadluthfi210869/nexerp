# Modals — Per-Modal Documentation

> **Source**: `src/components/Modals.tsx` (8 main modals), `src/components/MonthlyStoriesModal.tsx`, `src/components/WeeklyMetricModal.tsx`
>
> **Note**: Modals.tsx is ~600 LOC. This doc captures the field structure inferred from how App.tsx + view components call them. Some fields below are inferred from `BrandReport` shape; final cross-validation pending Modals.tsx read.

---

## 1. `TaskModal` — Add/Edit Task

### Trigger
- "Tambah Task" button on `TaskOverview`
- "Tambah Task" button on `MemberProfileView` (pre-filled assignee)

### Props
```ts
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  members: Member[];
}
```

### Fields (inferred from `Task` shape)
| Field | Type | Required | Source |
|---|---|:---:|---|
| Name | string | ✅ | `Task.name` |
| Type | `TaskType` | ✅ | radio: Daily / Project |
| Project | string | ❌ | `Task.project` (only when Type=Project) |
| Assignee | select | ✅ | `Task.assignee` — Member.name dropdown |
| Start Date | date | ✅ | `Task.startDate` |
| Due Date | date | ✅ | `Task.dueDate` |
| Priority | `TaskPriority` | ✅ | select: High/Medium/Low |
| Status | `TaskStatus` | ✅ | select: Pending/In Progress/Review/Completed |
| Link | string | ❌ | `Task.link` |
| Reference | string | ❌ | `Task.reference` |
| Brief | textarea | ❌ | `Task.brief` |
| Caption | textarea | ❌ | `Task.caption` (declared but unused per dead-code analysis) |
| Checklist | array | ❌ | `Task.checklist` (declared but unused per dead-code analysis) |

### Save action
`onSave(taskData)` → calls `handleSaveTask` in App → prepends new task with `id: 't-{timestamp}'` and `createdAt: today`.

---

## 2. `PostModal` — Add Social Post

### Trigger
- Click on calendar date cell in `ContentPlannerView`
- "Tambah Post" button in `ContentPlannerView` header

### Props
```ts
interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (postData: Omit<SocialPost, 'id'>) => void;
  brands: Brand[];
  members: Member[];
  initialBrand?: string;
  initialDate?: string;
}
```

### Fields (inferred from `SocialPost` shape)
| Field | Type | Required | Source |
|---|---|:---:|---|
| Brand | select | ✅ | `SocialPost.brandId` — Brand.name dropdown |
| Platform | select | ❌ | `SocialPost.platform` — defaults to brand's `primaryPlatform` |
| Title | string | ✅ | `SocialPost.title` |
| Date | date | ✅ | `SocialPost.date` |
| Format | `PostFormat` | ✅ | select: Reels/Carousel/Single/Story/TikTok/Video/Shorts |
| Status | `PostStatus` | ✅ | select: Planning/Brief/Draft/Production/Review/Published |
| PIC | select | ✅ | `SocialPost.pic` — Member.name dropdown |
| Progress | number (0-100) | ✅ | slider for `SocialPost.progress` |
| Image URL | string | ❌ | `SocialPost.imageUrl` |
| Hook | string | ❌ | `SocialPost.hook` |
| Sound Trend | string | ❌ | `SocialPost.soundTrend` |
| Target Angle | string | ❌ | `SocialPost.targetAngle` |
| CTA Link | string | ❌ | `SocialPost.ctaLink` (declared unused) |
| Caption | textarea | ❌ | `SocialPost.caption` |
| Brief | textarea | ❌ | `SocialPost.brief` |
| Reference | string | ❌ | `SocialPost.reference` |
| Checklist | array | ❌ | `SocialPost.checklist` (declared unused) |

### Save action
`onSave(postData)` → calls `handleSavePost` in App → prepends new post with `id: 'p-{timestamp}'`.

---

## 3. `BrandModal` — Add New Brand

### Trigger
- "+" button in Sidebar "Social Media Brands" section header
- "Tambah Brand Baru" button at bottom of Sidebar

### Props
```ts
interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (brandData: Omit<Brand, 'id' | 'initial'>) => void;
  members: Member[];
}
```

### Fields
| Field | Type | Required | Source |
|---|---|:---:|---|
| Name | string | ✅ | `Brand.name` |
| Handle | string | ✅ | `Brand.handle` (e.g., `@brandname`) |
| Color | color picker | ✅ | `Brand.color` (hex) |
| Primary Platform | string | ✅ | `Brand.primaryPlatform` (free text, e.g., "Instagram & TikTok") |
| PIC | select | ✅ | `Brand.pic` — Member.name dropdown |
| Note | textarea | ✅ | `Brand.note` (brand description / tone-of-voice) |

### Save action
`onSave(brandData)` → calls `handleSaveBrand` in App → appends brand with `id: 'b-{timestamp}'` + auto-derived `initial: name.charAt(0).toUpperCase()` + **initializes blank report** with default values:
- totalFollowers: 5000
- followersGrowth: 320, followersGrowthPercent: 6.8
- totalReach: 45000, reachGrowthPercent: 15.2
- totalImpressions: 110000, impressionsGrowthPercent: 12.0
- engagementRate: 4.5, engagementRateChange: 0.5
- totalPostsPublished: 4
- platformBreakdown: [Instagram, TikTok] entries (3-4 fields)
- weeklyTrends: 4-week seed (W1-W4)
- formatPerformance: [Carousel, Reels] entries
- **NOTE: `topPosts: []` field referenced in `handleSaveBrand` doesn't exist on BrandReport type — STALE CODE bug**

---

## 4. `ReportMetricModal` — Edit Monthly Brand Report

### Trigger
- "Edit Monthly Metrics" button in `BrandReportingView` header (all tabs)

### Props (inferred)
```ts
interface ReportMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  currentReport: BrandReport;
  previousReport?: BrandReport;
  currentPeriod: string;
  onSave: (updated: BrandReport) => void;
}
```

### Fields
Likely includes inputs for all `BrandReport` top-level numeric fields:
- Followers: totalFollowers, followersGained, followersUnfollowed
- Views/Reach: totalViews, averageViewsPerPost, totalReach, totalImpressions
- Engagements: totalLikes, totalComments, totalShares, totalSaves, engagementRate
- Posts: totalPostsPublished
- Summary: executiveSummary (textarea), strategicRecommendations (list editor)
- Plus platformBreakdown / weeklyTrends / formatPerformance / storiesRecap / leadFunnels / channel reports (sub-editors)

### Save action
`onSave(updated)` → calls `handleSaveReportMetrics` in App → updates `reports[brandName]` AND `reports[\`${brandName}__${currentPeriod}\`]`.

---

## 5. `TaskDetailModal` — View/Edit/Delete Task

### Trigger
- "Detail" button on any task row in `TaskOverview` or `MemberProfileView`

### Props
```ts
interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}
```

### Display
- All Task fields read-only (or selectively editable)
- Status `<select>` inline editor
- "Delete" button → `onDelete(task.id)` → `handleDeleteTask` removes from `tasks[]`
- "Close" button → `onClose()`

### Save action
No full-form save. Just status updates + delete.

---

## 6. `PostDetailModal` — View/Edit/Delete Post

### Trigger
- "Detail" button on post row in `ContentPlannerView`
- Click on calendar post

### Props
```ts
interface PostDetailModalProps {
  post: SocialPost | null;
  onClose: () => void;
  onDelete: (postId: string) => void;
  onUpdateStatus: (postId: string, newStatus: PostStatus) => void;
}
```

### Display
- All SocialPost fields read-only (or selectively editable)
- Status `<select>` inline editor → `onUpdateStatus`
- "Edit Metrics" button → opens `PostMetricsModal`
- "Delete" button → `onDelete(post.id)` → `handleDeletePost` removes from `posts[]`
- "Close" button

### Save action
Status updates + delete. Metrics editing delegated to `PostMetricsModal`.

---

## 7. `MemberEditModal` — Edit Member Profile

### Trigger
- "Edit Profile" button on `MemberProfileView` header

### Props
```ts
interface MemberEditModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onSave: (member: Member) => void;
}
```

### Fields
| Field | Type | Required | Source |
|---|---|:---:|---|
| Name | string | ✅ | `Member.name` |
| Role | string | ✅ | `Member.role` |
| Email | string | ✅ | `Member.email` |
| Phone | string | ✅ | `Member.phone` |
| Department | string | ✅ | `Member.department` |
| Avatar BG | color picker | ✅ | `Member.avatarBg` |
| Initial | string (1 char) | ✅ | `Member.initial` |

### Save action
`onSave(updatedMember)` → calls `handleSaveMember` → updates member in `members[]` by id.

---

## 8. `PostMetricsModal` — Edit Per-Post Metrics

### Trigger
- "Edit Metrics" button on `PostDetailModal`

### Props
```ts
interface PostMetricsModalProps {
  isOpen: boolean;
  post: SocialPost | null;
  onClose: () => void;
  onSave: (postId: string, metrics: PostMetrics, imageUrl?: string) => void;
}
```

### Fields (from `PostMetrics` shape)
| Field | Type | Required | Source |
|---|---|:---:|---|
| Views | number | ✅ | `PostMetrics.views` |
| Reach | number | ✅ | `PostMetrics.reach` |
| Likes | number | ✅ | `PostMetrics.likes` |
| Comments | number | ✅ | `PostMetrics.comments` |
| Shares | number | ✅ | `PostMetrics.shares` (declared unused in samples) |
| Saves | number | ✅ | `PostMetrics.saves` |
| Avg Watch % | number | ❌ | `PostMetrics.avgWatchPercentage` |
| Engagement Rate % | number | ❌ | `PostMetrics.engagementRate` |
| Leads Contributed | number | ❌ | `PostMetrics.leadsContributed` |
| Sample Requests | number | ❌ | `PostMetrics.sampleRequests` |
| Image URL | string | ❌ | optional second param to onSave |

### Save action
`onSave(postId, metrics, imageUrl?)` → calls `handleSavePostMetrics` → updates `post.metrics` and optionally `post.imageUrl`.

---

## 9. `MonthlyStoriesModal` — Edit Monthly Stories Recap

### Trigger
- "Edit Monthly Stories" button in Stories tab / section

### Props
```ts
interface MonthlyStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  monthYear: string;
  currentReport: BrandReport;
  previousReport?: BrandReport;
  onSave: (storiesCount: number, totalViews: number) => void;
}
```

### Fields
| Field | Type | Required | Source |
|---|---|:---:|---|
| Total Stories Created | number | ✅ | `StoriesMonthlyRecap.totalStoriesCreated` |
| Total Story Views | number | ✅ | `StoriesMonthlyRecap.totalStoryViews` |
| (Derived) Avg Views Per Story | number | display only | `Math.round(totalStoryViews / totalStoriesCreated)` |
| Completion Rate | number | display | `StoriesMonthlyRecap.completionRate` |

### Save action
`onSave(storiesCount, totalViews)` → calls `handleSaveMonthlyStories` → computes avgViewsPerStory, updates `report.storiesRecap`.

---

## 10. `WeeklyMetricModal` — Edit Weekly Report Data

### Trigger
- "Edit Weekly Metrics" button on each week card in Weekly tab

### Props (inferred)
```ts
interface WeeklyMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekData: WeeklyReportData;
  onSave: (updated: WeeklyReportData) => void;
}
```

### Fields (from `WeeklyReportData` shape)
- Week number/label/dateRange (display only)
- Followers: startingFollowers, followersGained, followersUnfollowed, endingFollowers
- Growth: growthPercent (derived), netGrowth (derived)
- Engagement: views, reach, impressions, totalEngagement, engagementRate
- Counts: likes, comments, shares, saves
- Stories: storiesCount, totalStoryViews, avgViewsPerStory, storyReplies, storyCompletionRate
- Qualitative: highlights, notes

### Save action
`onSave(updated)` → updates `report.weeklyReports[index]` for that week.

---

## Modal state summary (from App.tsx)

| State | Type | Opens |
|---|---|---|
| `isTaskModalOpen` | boolean | TaskModal |
| `isPostModalOpen` | boolean | PostModal |
| `isBrandModalOpen` | boolean | BrandModal |
| `isReportMetricModalOpen` | boolean | ReportMetricModal |
| `detailTask` | Task \| null | TaskDetailModal |
| `detailPost` | SocialPost \| null | PostDetailModal |
| `editingMember` | Member \| null | MemberEditModal |
| `editingPostMetrics` | SocialPost \| null | PostMetricsModal |
| `editingMonthlyStories` | {brandName, monthYear} \| null | MonthlyStoriesModal |

---

**Status**: Draft v1. Inferred fields pending Modals.tsx full read. Cross-validation with FEATURES-AND-WORKFLOWS.md next.
