// Marketing API Contract (Contract-First UI-First, 2026-09-11)
// Single source of truth for both UI (consumes) and backend (serves).
// Backend DTOs in `backend/src/modules/marketing/canonical/canonical-marketing.dto.ts`
// must match these shapes; mock service in `frontend/src/lib/services/marketing-service.ts`
// implements the same interface for offline UI development.

// ─── Common ────────────────────────────────────────────────────────────────

export type Uuid = string;
export type IsoDate = string; // "2026-09-11" or "2026-09-11T10:00:00Z"

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface MarketingViewer {
  id: Uuid;
  email: string;
  name?: string;
  roles: string[];
}

export type MarketingRole =
  | "SUPER_ADMIN"
  | "HEAD_OPS"
  | "MARKETING"
  | "DIGIMAR"
  | "DIRECTOR"
  | "COMMERCIAL"
  | "DESIGN"
  | "RND"
  | "FINANCE";

// ─── Task Management ───────────────────────────────────────────────────────

export type TaskType = "DAILY" | "PROJECT";
export type TaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "REVISION"
  | "DONE"
  | "BLOCKED"
  | "CANCELLED"
  | "LATE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ChecklistItem {
  id: Uuid;
  taskId: Uuid;
  text: string;
  done: boolean;
  isRequired: boolean;
  sortOrder: number;
  completedById?: Uuid | null;
  completedAt?: IsoDate | null;
}

export interface TaskComment {
  id: Uuid;
  taskId: Uuid;
  authorId?: Uuid | null;
  body: string;
  createdAt: IsoDate;
}

export interface TaskAttachment {
  id: Uuid;
  taskId: Uuid;
  name: string;
  type: string; // mime type
  sizeKb: number;
  path: string;
  uploadedById?: Uuid | null;
  createdAt: IsoDate;
}

export interface TaskHistoryEntry {
  id: Uuid;
  taskId: Uuid;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  note?: string | null;
  changedById?: Uuid | null;
  createdAt: IsoDate;
}

export interface MarketingTeamMember {
  id: Uuid;
  userId?: Uuid | null;
  name: string;
  role: string;
  department?: string;
  email?: string;
  phone?: string;
  avatarBg?: string;
  initial?: string;
}

export interface MarketingTask {
  id: Uuid;
  taskCode: string;
  type: TaskType;
  title: string;
  projectId?: Uuid | null;
  project?: MarketingProject | null;
  brandId?: Uuid | null;
  brand?: MarketingBrand | null;
  channel: string;
  category: string;
  ownerId?: Uuid | null;
  assigneeId?: Uuid | null;
  assignee?: { id: Uuid; name: string } | null;
  reviewerId?: Uuid | null;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: IsoDate;
  dueDate: IsoDate;
  completedAt?: IsoDate | null;
  brief?: string | null;
  outputUrl?: string | null;
  referenceUrl?: string | null;
  estimatedMinutes: number;
  actualMinutes: number;
  version: number;
  checklist: ChecklistItem[];
  checklistDone: number;
  checklistTotal: number;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  history?: TaskHistoryEntry[];
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface TaskListQuery {
  status?: TaskStatus;
  assigneeId?: Uuid;
  projectId?: Uuid;
  brandId?: Uuid;
  type?: TaskType;
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CreateTaskInput {
  type: TaskType;
  title: string;
  projectId?: Uuid;
  brandId?: Uuid;
  channel: string;
  category: string;
  assigneeId: Uuid;
  reviewerId?: Uuid;
  priority: TaskPriority;
  startDate: IsoDate;
  dueDate: IsoDate;
  brief?: string;
  outputUrl?: string;
  referenceUrl?: string;
  estimatedMinutes?: number;
  checklist?: { text: string; isRequired?: boolean; sortOrder?: number }[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  version: number;
}

export interface UpdateChecklistItemInput {
  version: number;
  done: boolean;
}

export interface UpdateTaskStatusInput {
  version: number;
  status: TaskStatus;
  reason?: string;
}

export interface CreateTaskCommentInput {
  body: string;
}

// ─── Project ───────────────────────────────────────────────────────────────

export interface MarketingProject {
  id: Uuid;
  projectCode: string;
  name: string;
  channel: string;
  category: string;
  ownerId?: Uuid | null;
  startDate?: IsoDate | null;
  deadline?: IsoDate | null;
  progress: number;
  status: string;
  summary?: string | null;
  blockers?: string | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface CreateProjectInput {
  projectCode: string;
  name: string;
  channel: string;
  category: string;
  ownerId?: Uuid;
  startDate?: IsoDate;
  deadline?: IsoDate;
  summary?: string;
  blockers?: string;
}

// ─── Brand ─────────────────────────────────────────────────────────────────

export interface MarketingBrand {
  id: Uuid;
  name: string;
  handle?: string | null;
  initial: string;
  color?: string | null;
  primaryPlatform?: string | null;
  pic?: string | null;
  note?: string | null;
  isActive: boolean;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface CreateBrandInput {
  code: string;
  name: string;
  handle?: string;
  primaryPlatform?: string;
  pic?: string;
  note?: string;
}

// ─── Social Media Planner ──────────────────────────────────────────────────

export type PostPlatform =
  | "Instagram"
  | "TikTok"
  | "YouTube"
  | "LinkedIn"
  | "Website"
  | "Paid Ads";

export type PostFormat =
  | "Reels"
  | "Carousel"
  | "Single"
  | "Story"
  | "TikTok"
  | "Video"
  | "Shorts";

export type PostStatus =
  | "Planning"
  | "Brief"
  | "Draft"
  | "Production"
  | "Review"
  | "Published"
  | "Late";

export interface PostMetrics {
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  avgWatchPercentage?: number;
  engagementRate?: number; // derived: (likes+comments+shares+saves)/views*100
  leadsContributed?: number;
  sampleRequests?: number;
  viralFlag?: boolean; // derived: views>40k OR shares>300
}

export interface SocialPost {
  id: Uuid;
  brandId: Uuid;
  brand?: MarketingBrand;
  platform: PostPlatform;
  title: string;
  date: IsoDate;
  format: PostFormat;
  status: PostStatus;
  pic?: string;
  picId?: Uuid;
  progress: number; // 0-100
  imageUrl?: string;
  hook?: string;
  soundTrend?: string;
  targetAngle?: string;
  ctaLink?: string;
  caption?: string;
  brief?: string;
  reference?: string;
  metrics?: PostMetrics;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface PostListQuery {
  brandId?: Uuid;
  channel?: PostPlatform | "all";
  status?: PostStatus;
  dateFrom?: IsoDate;
  dateTo?: IsoDate;
  page?: number;
  limit?: number;
}

export interface CreatePostInput {
  brandId: Uuid;
  platform: PostPlatform;
  title: string;
  date: IsoDate;
  format: PostFormat;
  status?: PostStatus;
  pic?: string;
  progress?: number;
  imageUrl?: string;
  hook?: string;
  soundTrend?: string;
  caption?: string;
  brief?: string;
  reference?: string;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  version: number;
}

export interface AddPostMetricsInput {
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  avgWatchPercentage?: number;
  leadsContributed?: number;
  sampleRequests?: number;
}

// ─── Brand Reporting ───────────────────────────────────────────────────────

export type ReportChannel =
  | "Instagram"
  | "TikTok"
  | "YouTube"
  | "Website"
  | "Meta Ads"
  | "Google Ads";

export interface BrandReportKPIs {
  // Follower
  totalFollowers: number;
  followersGained: number;
  followersUnfollowed: number;
  followersNetGrowth: number;
  followersGrowthPercent: number;
  // Views
  totalViews: number;
  averageViewsPerPost: number;
  totalReach: number;
  reachGrowthPercent: number;
  totalImpressions: number;
  impressionsGrowthPercent: number;
  // Engagement
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  totalEngagements: number;
  engagementRate: number;
  engagementRateChange: number;
}

export interface StoriesRecap {
  totalStoriesCreated: number;
  totalStoryViews: number;
  avgViewsPerStory: number;
  avgStoriesPerDay?: number;
  completionRate?: number;
}

export interface WeeklyTrend {
  week: string;
  reach: number;
  views: number;
  engagement: number;
  impressions?: number;
}

export interface ChannelLeadFunnel {
  channel: ReportChannel;
  traffic: number;
  prospects: number;
  nurturingSamples: number;
  goals: number;
  conversionRate: number;
  spend?: number;
  cpl?: number;
  dealValue?: number;
  notes?: string;
}

export interface BrandReport {
  id: Uuid;
  brandId: Uuid;
  monthYear: string; // "2026-09"
  kpis: BrandReportKPIs;
  storiesRecap?: StoriesRecap;
  leadFunnels?: ChannelLeadFunnel[];
  weeklyTrends?: WeeklyTrend[];
  weeklyReports?: WeeklyReportRow[];
  executiveSummary?: string;
  strategicRecommendations?: string[];
  totalPostsPublished: number;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface WeeklyReportRow {
  id: Uuid;
  brandId: Uuid;
  weekNumber: number;
  weekLabel: string;
  dateRange: string;
  startingFollowers: number;
  followersGained: number;
  followersUnfollowed: number;
  netGrowth: number;
  growthPercent?: number;
  endingFollowers: number;
  views: number;
  reach: number;
  impressions?: number;
  totalEngagement: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  storiesCount: number;
  totalStoryViews: number;
  avgViewsPerStory: number;
}

export interface WebsiteTask {
  id: Uuid;
  brandId: Uuid;
  title: string;
  category:
    | "SEO Optimization"
    | "Landing Page"
    | "Blog Article"
    | "CRO & Sample Form"
    | "Technical & Speed";
  assignee?: string;
  targetQuery?: string;
  dueDate?: IsoDate;
  status: "Pending" | "In Progress" | "Review" | "Completed";
  impact?: string;
}

export interface CreateWebsiteTaskInput {
  brandId: Uuid;
  title: string;
  category: WebsiteTask["category"];
  assignee?: string;
  targetQuery?: string;
  dueDate?: IsoDate;
  impact?: string;
}

// ─── Integrations ──────────────────────────────────────────────────────────

export type IntegrationProvider =
  | "META"
  | "GOOGLE"
  | "TIKTOK"
  | "LINKEDIN";

export type IntegrationStatus =
  | "active"
  | "expired"
  | "revoked"
  | "error";

export interface IntegrationConnection {
  id: Uuid;
  brandId: Uuid;
  brand?: MarketingBrand;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  lastSyncAt?: IsoDate | null;
  lastError?: string | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  // NOTE: secretCiphertext, secretIv, secretTag are NEVER exposed to UI
}

export type SyncJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed";

export interface SyncJob {
  id: Uuid;
  integrationId: Uuid;
  status: SyncJobStatus;
  startedAt: IsoDate;
  finishedAt?: IsoDate | null;
  error?: string | null;
  recordsProcessed?: number;
}

export interface ConnectIntegrationInput {
  brandId: Uuid;
  provider: IntegrationProvider;
  secret: string; // plaintext over wire; backend AES-encrypts at rest
}

// ─── Service Interface (UI consumes this; Mock or Http implementation) ──────

export interface IMarketingService {
  // Tasks
  listTasks(viewer: MarketingViewer, query: TaskListQuery): Promise<{ items: MarketingTask[]; total: number; page: number; limit: number }>;
  getTask(viewer: MarketingViewer, taskId: Uuid): Promise<MarketingTask>;
  createTask(viewer: MarketingViewer, input: CreateTaskInput, idempotencyKey?: string): Promise<MarketingTask>;
  updateTask(viewer: MarketingViewer, taskId: Uuid, input: UpdateTaskInput): Promise<MarketingTask>;
  updateTaskStatus(viewer: MarketingViewer, taskId: Uuid, input: UpdateTaskStatusInput): Promise<MarketingTask>;
  updateChecklist(viewer: MarketingViewer, taskId: Uuid, itemId: Uuid, input: UpdateChecklistItemInput): Promise<MarketingTask>;
  deleteTask(viewer: MarketingViewer, taskId: Uuid): Promise<void>;
  // Members
  listMembers(viewer: MarketingViewer): Promise<MarketingTeamMember[]>;
  updateMember(viewer: MarketingViewer, memberId: Uuid, patch: Partial<MarketingTeamMember>): Promise<MarketingTeamMember>;
  // Comments
  listTaskComments(viewer: MarketingViewer, taskId: Uuid): Promise<TaskComment[]>;
  createTaskComment(viewer: MarketingViewer, taskId: Uuid, input: CreateTaskCommentInput): Promise<TaskComment>;
  deleteTaskComment(viewer: MarketingViewer, commentId: Uuid): Promise<void>;
  // Attachments
  listTaskAttachments(viewer: MarketingViewer, taskId: Uuid): Promise<TaskAttachment[]>;
  addTaskAttachment(viewer: MarketingViewer, taskId: Uuid, file: File): Promise<TaskAttachment>;
  deleteTaskAttachment(viewer: MarketingViewer, attachmentId: Uuid): Promise<void>;
  // Projects
  listProjects(viewer: MarketingViewer, query: { page?: number; limit?: number; q?: string }): Promise<{ items: MarketingProject[]; total: number }>;
  createProject(viewer: MarketingViewer, input: CreateProjectInput, idempotencyKey?: string): Promise<MarketingProject>;
  // Brands
  listBrands(viewer: MarketingViewer): Promise<MarketingBrand[]>;
  createBrand(viewer: MarketingViewer, input: CreateBrandInput, idempotencyKey?: string): Promise<MarketingBrand>;
  // Social Planner
  listPosts(viewer: MarketingViewer, query: PostListQuery): Promise<{ items: SocialPost[]; total: number }>;
  getPost(viewer: MarketingViewer, postId: Uuid): Promise<SocialPost>;
  createPost(viewer: MarketingViewer, input: CreatePostInput): Promise<SocialPost>;
  updatePost(viewer: MarketingViewer, postId: Uuid, input: UpdatePostInput): Promise<SocialPost>;
  deletePost(viewer: MarketingViewer, postId: Uuid): Promise<void>;
  addPostMetrics(viewer: MarketingViewer, postId: Uuid, input: AddPostMetricsInput): Promise<SocialPost>;
  uploadPostImage(viewer: MarketingViewer, postId: Uuid, file: File): Promise<{ url: string }>;
  // Brand Reporting
  getBrandReport(viewer: MarketingViewer, brandId: Uuid, monthYear: string): Promise<BrandReport>;
  upsertBrandReport(viewer: MarketingViewer, report: Partial<BrandReport> & { brandId: Uuid; monthYear: string }): Promise<BrandReport>;
  listWeeklyReports(viewer: MarketingViewer, brandId: Uuid, monthYear: string): Promise<WeeklyReportRow[]>;
  copyFromPrevious(viewer: MarketingViewer, brandId: Uuid, targetMonthYear: string): Promise<BrandReport>;
  listWebsiteTasks(viewer: MarketingViewer, brandId: Uuid): Promise<WebsiteTask[]>;
  createWebsiteTask(viewer: MarketingViewer, input: CreateWebsiteTaskInput): Promise<WebsiteTask>;
  // Integrations
  listIntegrations(viewer: MarketingViewer): Promise<IntegrationConnection[]>;
  connectIntegration(viewer: MarketingViewer, input: ConnectIntegrationInput): Promise<IntegrationConnection>;
  triggerSync(viewer: MarketingViewer, integrationId: Uuid): Promise<SyncJob>;
  listSyncJobs(viewer: MarketingViewer, integrationId?: Uuid): Promise<SyncJob[]>;
  // AI (stub)
  generateBrief(viewer: MarketingViewer, params: { brandId: Uuid; platform: PostPlatform; format: PostFormat; topic: string }): Promise<{ hook: string; caption: string; brief: string }>;
}
