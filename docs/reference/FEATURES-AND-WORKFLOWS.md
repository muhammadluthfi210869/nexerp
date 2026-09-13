# Features and Workflows

> **Source**: Reverse-engineered from `src/App.tsx`, view components, modals, and sample data flows.
>
> **Status**: Draft v1. Inferred workflows from state-management patterns in App.tsx + view component behavior.

---

## Feature 1: Task Management

### Lifecycle
```
[New] → Pending → In Progress → Review → Completed
                    ↓
                    Late (auto-derived)
```

### Workflow steps
1. **Create task** (TaskModal)
   - User fills: name, type, project (if Project), assignee, start/due date, priority, status (default Pending)
   - Optional: link, reference, brief
   - `handleSaveTask` generates `id: 't-{timestamp}'`, sets `createdAt: today`
   - Prepended to `tasks[]` array

2. **View tasks** (TaskOverview)
   - All tasks shown grouped by status (Late → In Progress → Pending → Completed)
   - Each row: name, type/project, assignee, due date, days left, priority, status (editable), action

3. **Update status** (inline `<select>`)
   - `onUpdateTaskStatus(taskId, newStatus)` → `handleUpdateTaskStatus` in App
   - Updates `tasks[]` entry by id
   - If task is currently shown in detail modal, also updates detail modal

4. **View detail** (TaskDetailModal)
   - Opens via "Detail" button
   - All fields shown
   - Status updateable
   - Delete available

5. **Delete** (TaskDetailModal "Delete" button)
   - `onDelete(taskId)` → `handleDeleteTask` removes from `tasks[]`

6. **Per-member view** (MemberProfileView)
   - Filter tasks where `Task.assignee === member.name`
   - Same columns + actions as overview
   - "Tambah Task" pre-fills assignee

### Late detection
- `Late` is a manual status (not auto-computed). Workflow assumes user marks task Late manually when it passes due date without completion.
- `Sidebar` shows late count badge globally: `tasks.filter(t => t.status === 'Late').length`

### Validation rules (inferred)
- `dueDate >= startDate` (logical, not enforced in code)
- If `type === 'Project'`, `project` should be non-empty
- `assignee` must match an existing `Member.name`

---

## Feature 2: Brand Management

### Lifecycle
```
[New Brand] → active in sidebar → has blank initial report → updated monthly
```

### Workflow steps
1. **Create brand** (BrandModal)
   - User fills: name, handle, color, primaryPlatform, PIC, note
   - `handleSaveBrand` in App:
     - Generates `id: 'b-{timestamp}'`
     - Auto-derives `initial: name.charAt(0).toUpperCase()`
     - **Initializes blank report** with default metric values (see Brand Modal docs)
     - ⚠️ STALE CODE BUG: references `topPosts: []` field not in BrandReport type

2. **View brand in sidebar**
   - Each brand is an expandable card
   - Default expanded: Dreamlab, Toribio (hardcoded)

3. **Navigate to brand planner**
   - Click brand header → `onNavigate({type: 'social-planner', brandName})`
   - `getBrandByName(name)` in App returns brand object (with fallback to first brand or default)

4. **Navigate to brand reporting**
   - Click "Executive Summary" → `onNavigate({type: 'social-report', brandName, initialTab: 'all'})`
   - Or click "Leads Funnel (Goals)" → `initialTab: 'funnel'`

5. **Edit brand metrics** (ReportMetricModal)
   - Updates all `BrandReport` fields for that brand + period
   - Stores under both keys: `reports[brandName]` (latest) and `reports[\`${brandName}__${monthYear}\`]` (historical)

### Brand persistence
- Brand stays in `localStorage.dl_brands` until manually deleted (no delete UI exists in current sample — DELETE not implemented in modals)

### Report history (period selector)
- Period dropdown shows: current month (e.g., "September 2026") + previous month (e.g., "Agustus 2026")
- Lookup: `reports[\`${brandName}__${period}\`] || reports[brandName]`

---

## Feature 3: Content Planning (Posts)

### Lifecycle
```
Planning → Brief → Draft → Production → Review → Published
                                              ↓
                                              Late (auto/manual)
```

### Workflow steps
1. **Add post** (PostModal)
   - User fills: brand, platform, title, date, format, status (default Planning), PIC, progress (0-100)
   - Optional: imageUrl, hook, soundTrend, targetAngle, caption, brief, reference
   - `handleSavePost` → prepends with `id: 'p-{timestamp}'`

2. **View posts in calendar** (ContentPlannerView)
   - Calendar grid by month
   - Posts displayed on their scheduled date
   - Click empty date → opens PostModal with date pre-filled

3. **Filter by channel**
   - Pill filter: All / Instagram / TikTok / YouTube / Website / Paid Ads
   - Updates displayed posts and calendar

4. **Update status** (inline `<select>`)
   - `onUpdatePostStatus(postId, newStatus)` → `handleUpdatePostStatus`
   - If status === 'Published', automatically sets progress = 100

5. **Update progress** (slider)
   - `onUpdatePostProgress(postId, progress)` → `handleUpdatePostProgress`
   - 0-100 visual progress

6. **View detail** (PostDetailModal)
   - All fields + Edit Metrics button

7. **Edit metrics** (PostMetricsModal)
   - For Published posts only
   - Fills PostMetrics fields (views, reach, likes, comments, shares, saves, etc.)
   - Optional: also update imageUrl

8. **Delete post** (PostDetailModal "Delete" button)
   - `onDelete(postId)` → `handleDeletePost`

---

## Feature 4: Monthly Reporting (Brand)

### Lifecycle (per brand per month)
```
[New report or carry-over] → updated via ReportMetricModal → displayed across 7 tabs
```

### Workflow steps

#### 4.1 Executive Summary tab
- Displays all top-level BrandReport metrics
- KPI grid (6 cards)
- Followers dynamics bar
- Engagement breakdown (likes/comments/shares/saves)
- Platform breakdown table (per PlatformMetric)
- Weekly trend chart (per WeeklyTrend)
- Format performance table (per FormatPerformance)
- Executive summary paragraph (free text)
- Strategic recommendations list

#### 4.2 Leads Funnel tab
- For each of 6 channels (Instagram, TikTok, YouTube, Website, Meta Ads, Google Ads)
- 4-stage funnel: Traffic → Prospects → Nurturing → Goals
- Conversion rate, spend (if paid), CPL (if paid), deal value, notes

#### 4.3 Weekly tab
- 4 week cards (Minggu 1-4)
- Per-week: startingFollowers, endingFollowers, netGrowth, growthPercent, views, reach, totalEngagement, ER, likes/comments/shares/saves, stories metrics, highlights, notes
- "Edit Weekly Metrics" per week → WeeklyMetricModal

#### 4.4 TikTok tab
- Aggregate: followers, totalViews, avgWatchRetention, likes/comments/shares/saves, profileVisits, bioLinkClicks, leadsContributed, sampleRequests
- Top videos table

#### 4.5 YouTube tab
- Aggregate: subscribers, totalViews, watchTimeHours, avgViewDuration, impressions, CTR, leadsContributed, sampleRequests
- Traffic sources breakdown
- Top videos table

#### 4.6 Website (SEO) tab
- Aggregate: totalSessions, totalUsers, organicImpressions, organicClicks, avgCtr, avgPosition, leadsTraffic, sampleRequests, conversionRate
- Top queries table (per WebsiteQueryMetric)
- Website tasks table (per WebsiteTask — SEO Optimization, Landing Page, Blog Article, CRO, Technical)

#### 4.7 Paid Ads tab
- Meta Ads subsection: aggregate + creatives table (per MetaAdsCreativePerformance with status Top Performer/Active/Fatigue/Testing)
- Google Ads subsection: aggregate + campaigns table + top queries table

### Period navigation
- Period selector at top of BrandReportingView
- Defaults to "September 2026" (current)
- `onPeriodChange(period)` updates `selectedReportingPeriod`
- Lookups use dual-key scheme (current vs historical)

---

## Feature 5: Stories Recap

### Workflow
1. **Daily stories captured** via `DailyStoryRecap[]` (in `storiesRecap.dailyStories`)
2. **Monthly aggregation** computed/stored in `storiesRecap`:
   - totalStoriesCreated
   - totalStoryViews
   - avgViewsPerStory (derived)
   - avgStoriesPerDay (derived)
   - completionRate
3. **Edit Monthly Stories** (MonthlyStoriesModal)
   - User inputs: totalStoriesCreated + totalStoryViews
   - System computes avgViewsPerStory on save
4. **Display in Weekly tab**
   - Per-week: storiesCount, totalStoryViews, avgViewsPerStory, storyReplies, storyCompletionRate

---

## Feature 6: Lead Funnel Tracking

### 4-stage model
```
Traffic (impressions/views/sessions)
  ↓
Prospects (leads/inquiries)
  ↓
Nurturing (sample kits / formulation testing)
  ↓
Goals (closed deals / won contracts)
```

### Per-channel metrics
For each of 6 channels: traffic, prospects, nurturingSamples, goals, conversionRate, spend (if paid), cpl (if paid), dealValue, notes.

### Conversion rate formula
`conversionRate = (goals / prospects) × 100`

### Cross-channel aggregation
- Total leads = sum of prospects across channels
- Total closed deals = sum of goals across channels
- Overall conversion = total goals / total prospects

---

## Feature 7: Cross-Feature Data Flow

### How data flows through the app

```
User Input (Modals)
  ↓
App.tsx state (useState)
  ↓
localStorage (effect: setItem on every change)
  ↓
View rendering (re-renders on state change)
  ↓
Computed metrics (calcComparison, calculateDaysLeft, etc.)
  ↓
Display
```

### Data consistency
- localStorage is the source of truth on reload
- On mount: read from localStorage OR fallback to `INITIAL_*` constants
- Any state mutation immediately persists to localStorage
- No optimistic updates / no rollback
- No undo (except modal close without save)

### Cross-references
- `Task.assignee` references `Member.name` by string — if member renamed, tasks orphaned
- `SocialPost.brandId` references `Brand.name` by string — if brand renamed, posts orphaned
- `Brand.pic` references `Member.name` by string
- `BrandReport.brandId` references `Brand.name` by string

### Known gaps (from dead-code analysis)
- No member delete UI (orphaned references if Member removed)
- No brand delete UI (orphaned references if Brand removed)
- No cascading update for renames
- No validation that FK references exist
- `App.tsx handleSaveBrand` references `topPosts: []` field that doesn't exist on `BrandReport` type

---

## Feature 8: Mobile Responsiveness

- Sidebar collapses to hamburger on mobile (lg breakpoint)
- `mobileMenuOpen` state in App.tsx
- Mobile backdrop overlay closes sidebar on click
- Desktop: fixed sidebar + main content area

---

## Feature 9: Persistence

### localStorage keys (App.tsx)
```ts
localStorage.setItem('dl_members', JSON.stringify(members))
localStorage.setItem('dl_tasks', JSON.stringify(tasks))
localStorage.setItem('dl_brands', JSON.stringify(brands))
localStorage.setItem('dl_posts', JSON.stringify(posts))
localStorage.setItem('dl_reports', JSON.stringify(reports))
```

### Read flow (App.tsx:47-92)
```ts
const [members, setMembers] = useState<Member[]>(() => {
  const saved = localStorage.getItem('dl_members');
  return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
});
// ... same pattern for tasks, brands, posts, reports
```

### Reports dual-key merge (App.tsx:67-92)
```ts
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
          // ... etc for all nested reports
        };
      });
      return merged;
    }
  } catch (e) {
    console.warn('Failed to parse saved reports, resetting to defaults:', e);
  }
  return INITIAL_REPORTS;
});
```

### Save flow (App.tsx:95-113)
```ts
useEffect(() => {
  localStorage.setItem('dl_members', JSON.stringify(members));
}, [members]);
// ... same for other entities
```

---

## Feature 10: Computed/Derived Metrics Catalog

| Metric | Formula | Used by |
|---|---|---|
| `lateTasksCount` | `tasks.filter(t => t.status === 'Late').length` | Sidebar |
| Per-member task count | `tasks.filter(t => t.assignee === member.name).length` | MemberProfileView |
| Per-member completion | `memberTasks.filter(t => t.status === 'Completed').length / memberTasks.length` | Sidebar |
| Per-member has-late | `memberTasks.some(t => t.status === 'Late')` | Sidebar |
| Engagement rate per post | `(likes+comments+shares+saves) / reach × 100` | PostMetrics |
| Avg views per story | `Math.round(totalStoryViews / totalStoriesCreated)` | MonthlyStoriesModal |
| Net follower growth | `followersGained - followersUnfollowed` | BrandReport |
| Weekly growth percent | `netGrowth / startingFollowers × 100` | WeeklyReportData |
| Total engagements | `likes + comments + shares + saves` | BrandReport |
| CTR (ads) | `clicks / impressions × 100` | Ads reports |
| CPC | `spend / clicks` | Meta + Google Ads |
| CPL (cost per lead) | `spend / leadsContributed` | Funnel + ads |
| ROAS (proxy) | `dealValue / spend` | MetaAdsReportData |
| Funnel conversion rate | `goals / prospects × 100` | ChannelLeadFunnel |
| Hook rate | 3-second video view percentage | MetaAdsCreativePerformance |
| Save-to-Reach ratio | `saves / reach × 100` | strategicRecommendations text |
| Stories completion rate | Stored as percentage | StoriesMonthlyRecap |
| Daily done/total per member | `Daily Completed / Daily Total` | TaskOverview |
| Project active per member | `Project != Completed count` | TaskOverview |
| Member completion rate | `Math.round(mCompleted / mTasks × 100)` | TaskOverview |
| Overall completion | `Math.round(completed / total × 100)` | Overview |
| Days left | `Math.round((dueDate - today) / 86400000)` | TaskOverview, MemberProfileView |
| calcComparison | `(curr - prev) / abs(prev) × 100` (with 0-prev edge cases) | Reporting deltas |
| formatNumber | `Intl.NumberFormat('id-ID')` → IDR string | All currency displays |

---

## State Machine Summary

### Task Status Machine
```
[New Task (default Pending)]
  ↓ (user sets)
Pending → In Progress → Review → Completed
              ↓
              Late (manual override)
              ↓
              In Progress (resume)
```

### Post Status Machine
```
[New Post (default Planning)]
  ↓
Planning → Brief → Draft → Production → Review → Published
                                            ↓
                                            Late (manual override)
```

### Task Lifecycle
- Create (TaskModal) → Update (inline select or detail modal) → Delete (detail modal)
- No automatic transitions (user-driven only)

### Post Lifecycle
- Create (PostModal or calendar click) → Update status (inline or detail modal) → Update progress (slider) → Update metrics (PostMetricsModal, after Published) → Delete (detail modal)

---

**Status**: Draft v1. Pending cross-validation with the 2 remaining Explore agents (pages/routes/features).
