// Marketing Service: Contract-First UI-First implementation
// Step 1.5 of 7-phase plan, 2026-09-11
//
// Two implementations of IMarketingService (see /types/marketing-api.ts):
//   - MockMarketingService: in-memory with DREAMLAB + TORIBIO seed data. Use during UI dev.
//   - HttpMarketingService: real fetch to /v1/marketing/*. Use after backend is wired.
//
// Swap via `marketingService` export below. Default = mock until NEXT_PUBLIC_MARKETING_API_MODE=real.

import type {
  IMarketingService,
  MarketingViewer,
  MarketingTask,
  TaskListQuery,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateChecklistItemInput,
  UpdateTaskStatusInput,
  CreateTaskCommentInput,
  TaskComment,
  TaskAttachment,
  MarketingProject,
  CreateProjectInput,
  MarketingBrand,
  CreateBrandInput,
  SocialPost,
  PostListQuery,
  CreatePostInput,
  UpdatePostInput,
  AddPostMetricsInput,
  BrandReport,
  WeeklyReportRow,
  WebsiteTask,
  CreateWebsiteTaskInput,
  IntegrationConnection,
  ConnectIntegrationInput,
  SyncJob,
  MarketingTeamMember,
} from "@/types/marketing-api";

// ─── Seed Data ─────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();

const viewer: MarketingViewer = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "revita@dreamlab.id",
  name: "Revita",
  roles: ["DIGIMAR", "MARKETING"],
};

const brandsSeed: MarketingBrand[] = [
  {
    id: "brand-dreamlab",
    name: "Dreamlab",
    handle: "@dreamlab.id",
    initial: "D",
    color: "#2563EB",
    primaryPlatform: "Instagram",
    pic: "Revita",
    note: "B2B maklon cosmetic lab. Premium, profesional, fokus edukasi formula.",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "brand-toribio",
    name: "Toribio",
    handle: "@toribioskincare",
    initial: "T",
    color: "#10B981",
    primaryPlatform: "TikTok",
    pic: "Gusti",
    note: "B2C skincare brightening. Playful, viral-friendly, fokus before-after.",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

const projectsSeed: MarketingProject[] = [
  {
    id: "proj-q3-launch",
    projectCode: "DRE-Q3-LAUNCH",
    name: "Dreamlab Q3 Product Launch",
    channel: "Instagram",
    category: "campaign",
    ownerId: viewer.id,
    startDate: "2026-07-01",
    deadline: "2026-09-30",
    progress: 65,
    status: "On Track",
    summary: "Launch 3 SKU baru serum Vitamin C + B5 di Q3.",
    blockers: null,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "proj-trending",
    projectCode: "TOR-TRENDING",
    name: "Toribio Trending Sound Pipeline",
    channel: "TikTok",
    category: "always-on",
    ownerId: viewer.id,
    startDate: "2026-08-01",
    deadline: "2026-12-31",
    progress: 40,
    status: "On Track",
    summary: "Pipeline 4 video trending per minggu dengan hook < 2 detik.",
    blockers: null,
    createdAt: "2026-07-15T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
  },
];

const tasksSeed: MarketingTask[] = [
  {
    id: "task-1",
    taskCode: "MKT-001",
    type: "DAILY",
    title: "Post Instagram Dreamlab — Edukasi B5",
    projectId: "proj-q3-launch",
    project: projectsSeed[0],
    brandId: "brand-dreamlab",
    brand: brandsSeed[0],
    channel: "Instagram",
    category: "content",
    ownerId: viewer.id,
    assigneeId: viewer.id,
    assignee: { id: viewer.id, name: "Revita" },
    reviewerId: viewer.id,
    priority: "HIGH",
    status: "IN_PROGRESS",
    startDate: "2026-09-08",
    dueDate: "2026-09-11",
    completedAt: null,
    brief: "Carousel 5 slide: edukasi B5 untuk skin barrier. Tone profesional, warna gold.",
    outputUrl: null,
    referenceUrl: "https://figma.com/file/dreamlab-b5",
    estimatedMinutes: 120,
    actualMinutes: 45,
    version: 1,
    checklist: [
      { id: "ci-1", taskId: "task-1", text: "Draft hook", done: true, isRequired: true, sortOrder: 0, completedById: viewer.id, completedAt: "2026-09-08T10:00:00Z" },
      { id: "ci-2", taskId: "task-1", text: "Design 5 slide", done: false, isRequired: true, sortOrder: 1, completedById: null, completedAt: null },
      { id: "ci-3", taskId: "task-1", text: "Caption + CTA", done: false, isRequired: true, sortOrder: 2, completedById: null, completedAt: null },
    ],
    checklistDone: 1,
    checklistTotal: 3,
    createdAt: "2026-09-08T08:00:00Z",
    updatedAt: "2026-09-11T09:00:00Z",
  },
  {
    id: "task-2",
    taskCode: "MKT-002",
    type: "PROJECT",
    title: "TikTok Sound Audit Toribio — Minggu 1 Sept",
    projectId: "proj-trending",
    project: projectsSeed[1],
    brandId: "brand-toribio",
    brand: brandsSeed[1],
    channel: "TikTok",
    category: "research",
    ownerId: viewer.id,
    assigneeId: viewer.id,
    assignee: { id: viewer.id, name: "Revita" },
    reviewerId: null,
    priority: "MEDIUM",
    status: "LATE",
    startDate: "2026-09-01",
    dueDate: "2026-09-07",
    completedAt: null,
    brief: "Cari 5 sound trending minggu ini yang cocok untuk skincare before-after.",
    outputUrl: null,
    referenceUrl: null,
    estimatedMinutes: 90,
    actualMinutes: 0,
    version: 1,
    checklist: [],
    checklistDone: 0,
    checklistTotal: 0,
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-09-07T18:00:00Z",
  },
  {
    id: "task-3",
    taskCode: "MKT-003",
    type: "DAILY",
    title: "Reply DM Instagram Dreamlab",
    projectId: null,
    project: null,
    brandId: "brand-dreamlab",
    brand: brandsSeed[0],
    channel: "Instagram",
    category: "engagement",
    ownerId: viewer.id,
    assigneeId: viewer.id,
    assignee: { id: viewer.id, name: "Revita" },
    reviewerId: null,
    priority: "LOW",
    status: "DONE",
    startDate: "2026-09-10",
    dueDate: "2026-09-10",
    completedAt: "2026-09-10T15:30:00Z",
    brief: "Reply semua DM dan comment yang masuk hari ini.",
    outputUrl: null,
    referenceUrl: null,
    estimatedMinutes: 30,
    actualMinutes: 25,
    version: 1,
    checklist: [],
    checklistDone: 0,
    checklistTotal: 0,
    createdAt: "2026-09-10T08:00:00Z",
    updatedAt: "2026-09-10T15:30:00Z",
  },
  {
    id: "task-4",
    taskCode: "MKT-004",
    type: "DAILY",
    title: "Shoot produk Dreamlab Vitamin C",
    projectId: "proj-q3-launch",
    project: projectsSeed[0],
    brandId: "brand-dreamlab",
    brand: brandsSeed[0],
    channel: "Instagram",
    category: "production",
    ownerId: viewer.id,
    assigneeId: viewer.id,
    assignee: { id: viewer.id, name: "Revita" },
    reviewerId: viewer.id,
    priority: "URGENT",
    status: "NOT_STARTED",
    startDate: "2026-09-12",
    dueDate: "2026-09-12",
    completedAt: null,
    brief: "Shoot 5 angle: hero, ingredient, texture, on-skin, packaging.",
    outputUrl: null,
    referenceUrl: null,
    estimatedMinutes: 240,
    actualMinutes: 0,
    version: 1,
    checklist: [
      { id: "ci-4", taskId: "task-4", text: "Setup studio", done: false, isRequired: true, sortOrder: 0, completedById: null, completedAt: null },
      { id: "ci-5", taskId: "task-4", text: "Setup produk", done: false, isRequired: true, sortOrder: 1, completedById: null, completedAt: null },
      { id: "ci-6", taskId: "task-4", text: "Shoot hero", done: false, isRequired: false, sortOrder: 2, completedById: null, completedAt: null },
      { id: "ci-7", taskId: "task-4", text: "Shoot ingredient", done: false, isRequired: false, sortOrder: 3, completedById: null, completedAt: null },
      { id: "ci-8", taskId: "task-4", text: "Shoot texture", done: false, isRequired: false, sortOrder: 4, completedById: null, completedAt: null },
    ],
    checklistDone: 0,
    checklistTotal: 5,
    createdAt: "2026-09-11T08:00:00Z",
    updatedAt: "2026-09-11T08:00:00Z",
  },
];

const postsSeed: SocialPost[] = [
  {
    id: "post-1",
    brandId: "brand-dreamlab",
    brand: brandsSeed[0],
    platform: "Instagram",
    title: "Carousel — 5 Kesalahan Pakai Vitamin C",
    date: "2026-09-11",
    format: "Carousel",
    status: "Production",
    pic: "Revita",
    picId: viewer.id,
    progress: 60,
    imageUrl: undefined,
    hook: "5 kesalahan yang bikin Vitamin C kamu nggak ngefek!",
    soundTrend: undefined,
    targetAngle: "edukasi",
    caption: "Klik swipe untuk lihat 5 kesalahan umum...",
    brief: "5 slide carousel, tone edukatif",
    reference: "https://figma.com/file/dreamlab-vit-c",
    metrics: undefined,
    createdAt: "2026-09-08T08:00:00Z",
    updatedAt: "2026-09-11T09:00:00Z",
  },
  {
    id: "post-2",
    brandId: "brand-toribio",
    brand: brandsSeed[1],
    platform: "TikTok",
    title: "Before-After Toribio Brightening Serum",
    date: "2026-09-10",
    format: "TikTok",
    status: "Published",
    pic: "Gusti",
    progress: 100,
    imageUrl: undefined,
    hook: "POV: 7 hari pakai Toribio Brightening Serum",
    soundTrend: "Original Sound — viral",
    targetAngle: "before-after",
    caption: "Glow up 7 hari ✨ #toribioskincare #skincare",
    brief: "Before-after reveal 7 hari, original sound",
    reference: undefined,
    metrics: {
      views: 48200,
      reach: 32100,
      likes: 4120,
      comments: 218,
      shares: 95,
      saves: 540,
      avgWatchPercentage: 87,
      engagementRate: 10.4,
      leadsContributed: 12,
      sampleRequests: 8,
      viralFlag: true,
    },
    createdAt: "2026-09-08T10:00:00Z",
    updatedAt: "2026-09-10T18:00:00Z",
  },
  {
    id: "post-3",
    brandId: "brand-dreamlab",
    brand: brandsSeed[0],
    platform: "Instagram",
    title: "Story — Behind the Scene Lab",
    date: "2026-09-12",
    format: "Story",
    status: "Brief",
    pic: "Revita",
    picId: viewer.id,
    progress: 10,
    hook: undefined,
    caption: undefined,
    brief: "Story 3 slide: behind the scene lab + tim R&D",
    reference: undefined,
    metrics: undefined,
    createdAt: "2026-09-11T08:00:00Z",
    updatedAt: "2026-09-11T08:00:00Z",
  },
];

// ─── In-Memory Database ────────────────────────────────────────────────────

const db = {
  tasks: [...tasksSeed],
  comments: [] as TaskComment[],
  attachments: [] as TaskAttachment[],
  projects: [...projectsSeed],
  brands: [...brandsSeed],
  posts: [...postsSeed],
  reports: new Map<string, BrandReport>(),
  weeklyReports: new Map<string, WeeklyReportRow[]>(),
  websiteTasks: [] as WebsiteTask[],
  integrations: [] as IntegrationConnection[],
  syncJobs: [] as SyncJob[],
  members: [
    {
      id: "mem-revita",
      userId: "00000000-0000-0000-0000-000000000001",
      name: "Revita",
      role: "Digital Marketing Lead",
      department: "Marketing",
      email: "revita@dreamlab.id",
      phone: "+62 812-0000-0001",
      avatarBg: "#fce7f3",
      initial: "R",
    },
    {
      id: "mem-gusti",
      name: "Gusti Raditya",
      role: "Lead Digital & Brand Strategist",
      department: "Marketing",
      email: "gusti@dreamlab.id",
      phone: "+62 812-0000-0002",
      avatarBg: "#dbeafe",
      initial: "G",
    },
    {
      id: "mem-andra",
      name: "Andra",
      role: "Content Creator",
      department: "Marketing",
      email: "andra@dreamlab.id",
      avatarBg: "#dcfce7",
      initial: "A",
    },
  ] as MarketingTeamMember[],
};

// ─── Mock Implementation ───────────────────────────────────────────────────

const MOCK_DELAY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

function uid(): string {
  return crypto.randomUUID();
}

class MockMarketingService implements IMarketingService {
  // Tasks
  async listTasks(_viewer: MarketingViewer, query: TaskListQuery) {
    let items = [...db.tasks];
    if (query.status) items = items.filter((t) => t.status === query.status);
    if (query.assigneeId) items = items.filter((t) => t.assigneeId === query.assigneeId);
    if (query.projectId) items = items.filter((t) => t.projectId === query.projectId);
    if (query.brandId) items = items.filter((t) => t.brandId === query.brandId);
    if (query.type) items = items.filter((t) => t.type === query.type);
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.project?.name.toLowerCase().includes(q) ?? false) ||
          (t.assignee?.name.toLowerCase().includes(q) ?? false)
      );
    }
    const total = items.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    return delay({ items: items.slice((page - 1) * limit, page * limit), total, page, limit });
  }

  async getTask(_viewer: MarketingViewer, taskId: string) {
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    return delay(task);
  }

  async createTask(_viewer: MarketingViewer, input: CreateTaskInput, _key?: string) {
    const id = uid();
    const code = `MKT-${String(db.tasks.length + 1).padStart(3, "0")}`;
    const project = input.projectId ? db.projects.find((p) => p.id === input.projectId) ?? null : null;
    const brand = input.brandId ? db.brands.find((b) => b.id === input.brandId) ?? null : null;
    const task: MarketingTask = {
      id,
      taskCode: code,
      type: input.type,
      title: input.title,
      projectId: input.projectId ?? null,
      project,
      brandId: input.brandId ?? null,
      brand,
      channel: input.channel,
      category: input.category,
      ownerId: viewer.id,
      assigneeId: input.assigneeId,
      assignee: { id: input.assigneeId, name: "Member" },
      reviewerId: input.reviewerId ?? null,
      priority: input.priority,
      status: "NOT_STARTED",
      startDate: input.startDate,
      dueDate: input.dueDate,
      completedAt: null,
      brief: input.brief ?? null,
      outputUrl: input.outputUrl ?? null,
      referenceUrl: input.referenceUrl ?? null,
      estimatedMinutes: input.estimatedMinutes ?? 0,
      actualMinutes: 0,
      version: 1,
      checklist: (input.checklist ?? []).map((c, i) => ({
        id: uid(),
        taskId: id,
        text: c.text,
        done: false,
        isRequired: c.isRequired ?? true,
        sortOrder: c.sortOrder ?? i,
        completedById: null,
        completedAt: null,
      })),
      checklistDone: 0,
      checklistTotal: input.checklist?.length ?? 0,
      createdAt: now(),
      updatedAt: now(),
    };
    db.tasks.push(task);
    return delay(task);
  }

  async updateTask(_viewer: MarketingViewer, taskId: string, input: UpdateTaskInput) {
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    if (input.version !== task.version) throw new Error("Version conflict");
    Object.assign(task, input, { version: task.version + 1, updatedAt: now() });
    return delay(task);
  }

  async updateTaskStatus(_viewer: MarketingViewer, taskId: string, input: UpdateTaskStatusInput) {
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    if (input.version !== task.version) throw new Error("Version conflict");
    task.status = input.status;
    task.version += 1;
    task.updatedAt = now();
    return delay(task);
  }

  async updateChecklist(_viewer: MarketingViewer, taskId: string, itemId: string, input: UpdateChecklistItemInput) {
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    const item = task.checklist.find((c) => c.id === itemId);
    if (!item) throw new Error("Checklist item not found");
    item.done = input.done;
    item.completedById = input.done ? viewer.id : null;
    item.completedAt = input.done ? now() : null;
    task.checklistDone = task.checklist.filter((c) => c.done).length;
    task.version += 1;
    task.updatedAt = now();
    return delay(task);
  }

  async deleteTask(_viewer: MarketingViewer, taskId: string) {
    const idx = db.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error("Task not found");
    db.tasks.splice(idx, 1);
    db.comments = db.comments.filter((c) => c.taskId !== taskId);
    db.attachments = db.attachments.filter((a) => a.taskId !== taskId);
    return delay(undefined);
  }

  // Members
  async listMembers(_viewer: MarketingViewer) {
    return delay(db.members);
  }

  async updateMember(_viewer: MarketingViewer, memberId: string, patch: Partial<MarketingTeamMember>) {
    const member = db.members.find((m) => m.id === memberId);
    if (!member) throw new Error("Member not found");
    Object.assign(member, patch);
    return delay(member);
  }

  // Comments
  async listTaskComments(_viewer: MarketingViewer, taskId: string) {
    return delay(db.comments.filter((c) => c.taskId === taskId));
  }

  async createTaskComment(_viewer: MarketingViewer, taskId: string, input: CreateTaskCommentInput) {
    const comment: TaskComment = {
      id: uid(),
      taskId,
      authorId: viewer.id,
      body: input.body,
      createdAt: now(),
    };
    db.comments.push(comment);
    return delay(comment);
  }

  async deleteTaskComment(_viewer: MarketingViewer, commentId: string) {
    db.comments = db.comments.filter((c) => c.id !== commentId);
    return delay(undefined);
  }

  // Attachments
  async listTaskAttachments(_viewer: MarketingViewer, taskId: string) {
    return delay(db.attachments.filter((a) => a.taskId === taskId));
  }

  async addTaskAttachment(_viewer: MarketingViewer, taskId: string, file: File) {
    const att: TaskAttachment = {
      id: uid(),
      taskId,
      name: file.name,
      type: file.type || "application/octet-stream",
      sizeKb: Math.ceil(file.size / 1024),
      path: `uploads/marketing-tasks/${taskId}/${uid()}-${file.name}`,
      uploadedById: viewer.id,
      createdAt: now(),
    };
    db.attachments.push(att);
    return delay(att);
  }

  async deleteTaskAttachment(_viewer: MarketingViewer, attachmentId: string) {
    db.attachments = db.attachments.filter((a) => a.id !== attachmentId);
    return delay(undefined);
  }

  // Projects
  async listProjects(_viewer: MarketingViewer, query: { page?: number; limit?: number; q?: string }) {
    let items = [...db.projects];
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.projectCode.toLowerCase().includes(q));
    }
    return delay({ items, total: items.length });
  }

  async createProject(_viewer: MarketingViewer, input: CreateProjectInput, _key?: string) {
    const project: MarketingProject = {
      id: uid(),
      projectCode: input.projectCode,
      name: input.name,
      channel: input.channel,
      category: input.category,
      ownerId: input.ownerId ?? viewer.id,
      startDate: input.startDate ?? null,
      deadline: input.deadline ?? null,
      progress: 0,
      status: "On Track",
      summary: input.summary ?? null,
      blockers: input.blockers ?? null,
      createdAt: now(),
      updatedAt: now(),
    };
    db.projects.push(project);
    return delay(project);
  }

  // Brands
  async listBrands(_viewer: MarketingViewer) {
    return delay(db.brands);
  }

  async createBrand(_viewer: MarketingViewer, input: CreateBrandInput, _key?: string) {
    const brand: MarketingBrand = {
      id: uid(),
      name: input.name,
      handle: input.handle ?? null,
      initial: input.name[0]?.toUpperCase() ?? "?",
      color: "#6366F1",
      primaryPlatform: input.primaryPlatform ?? null,
      pic: input.pic ?? null,
      note: input.note ?? null,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
    db.brands.push(brand);
    return delay(brand);
  }

  // Social Planner
  async listPosts(_viewer: MarketingViewer, query: PostListQuery) {
    let items = [...db.posts];
    if (query.brandId) items = items.filter((p) => p.brandId === query.brandId);
    if (query.channel && query.channel !== "all") items = items.filter((p) => p.platform === query.channel);
    if (query.status) items = items.filter((p) => p.status === query.status);
    if (query.dateFrom) items = items.filter((p) => p.date >= query.dateFrom!);
    if (query.dateTo) items = items.filter((p) => p.date <= query.dateTo!);
    return delay({ items, total: items.length });
  }

  async getPost(_viewer: MarketingViewer, postId: string) {
    const post = db.posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");
    return delay(post);
  }

  async createPost(_viewer: MarketingViewer, input: CreatePostInput) {
    const brand = db.brands.find((b) => b.id === input.brandId);
    const post: SocialPost = {
      id: uid(),
      brandId: input.brandId,
      brand: brand ?? undefined,
      platform: input.platform,
      title: input.title,
      date: input.date,
      format: input.format,
      status: input.status ?? "Planning",
      pic: input.pic,
      picId: viewer.id,
      progress: input.progress ?? 0,
      imageUrl: input.imageUrl,
      hook: input.hook,
      soundTrend: input.soundTrend,
      targetAngle: undefined,
      ctaLink: undefined,
      caption: input.caption,
      brief: input.brief,
      reference: input.reference,
      metrics: undefined,
      createdAt: now(),
      updatedAt: now(),
    };
    db.posts.push(post);
    return delay(post);
  }

  async updatePost(_viewer: MarketingViewer, postId: string, input: UpdatePostInput) {
    const post = db.posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");
    Object.assign(post, input, { updatedAt: now() });
    // Auto-set progress=100 when Published (per brief rule)
    if (post.status === "Published") post.progress = 100;
    return delay(post);
  }

  async deletePost(_viewer: MarketingViewer, postId: string) {
    db.posts = db.posts.filter((p) => p.id !== postId);
    return delay(undefined);
  }

  async addPostMetrics(_viewer: MarketingViewer, postId: string, input: AddPostMetricsInput) {
    const post = db.posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");
    const views = input.views;
    const likes = input.likes;
    const comments = input.comments;
    const shares = input.shares;
    const saves = input.saves;
    const er = views > 0 ? ((likes + comments + shares + saves) / views) * 100 : 0;
    const viral = views > 40000 || shares > 300;
    post.metrics = {
      views,
      reach: input.reach,
      likes,
      comments,
      shares,
      saves,
      avgWatchPercentage: input.avgWatchPercentage,
      engagementRate: er,
      leadsContributed: input.leadsContributed,
      sampleRequests: input.sampleRequests,
      viralFlag: viral,
    };
    post.updatedAt = now();
    return delay(post);
  }

  async uploadPostImage(_viewer: MarketingViewer, postId: string, file: File) {
    const url = `uploads/social-posts/${postId}/${uid()}-${file.name}`;
    const post = db.posts.find((p) => p.id === postId);
    if (post) post.imageUrl = url;
    return delay({ url });
  }

  // Brand Reporting
  async getBrandReport(_viewer: MarketingViewer, brandId: string, monthYear: string) {
    const key = `${brandId}:${monthYear}`;
    if (db.reports.has(key)) return delay(db.reports.get(key)!);
    // Default synthetic report
    const isDreamlab = brandId === "brand-dreamlab";
    const report: BrandReport = {
      id: uid(),
      brandId,
      monthYear,
      kpis: isDreamlab
        ? {
            totalFollowers: 45200,
            followersGained: 3200,
            followersUnfollowed: 180,
            followersNetGrowth: 3020,
            followersGrowthPercent: 7.2,
            totalViews: 312000,
            averageViewsPerPost: 12480,
            totalReach: 198000,
            reachGrowthPercent: 12.4,
            totalImpressions: 524000,
            impressionsGrowthPercent: 8.1,
            totalLikes: 18600,
            totalComments: 1240,
            totalShares: 890,
            totalSaves: 2400,
            totalEngagements: 23130,
            engagementRate: 7.4,
            engagementRateChange: 0.6,
          }
        : {
            totalFollowers: 128400,
            followersGained: 18400,
            followersUnfollowed: 1200,
            followersNetGrowth: 17200,
            followersGrowthPercent: 15.5,
            totalViews: 1240000,
            averageViewsPerPost: 49600,
            totalReach: 720000,
            reachGrowthPercent: 22.1,
            totalImpressions: 1820000,
            impressionsGrowthPercent: 18.7,
            totalLikes: 96400,
            totalComments: 4200,
            totalShares: 8900,
            totalSaves: 14200,
            totalEngagements: 123700,
            engagementRate: 9.98,
            engagementRateChange: 1.2,
          },
      storiesRecap: isDreamlab
        ? { totalStoriesCreated: 24, totalStoryViews: 38400, avgViewsPerStory: 1600, avgStoriesPerDay: 1.0, completionRate: 78 }
        : { totalStoriesCreated: 42, totalStoryViews: 184000, avgViewsPerStory: 4381, avgStoriesPerDay: 1.4, completionRate: 82 },
      executiveSummary: isDreamlab
        ? "Q3 launch month — focus on B5 education content. Engagement rate naik 0.6% MoM, B5 carousel outperform baseline 2x."
        : "Viral TikTok series 'before-after 7 hari' menghasilkan 3 video > 40k views. Leads dari sample request naik 28%.",
      strategicRecommendations: isDreamlab
        ? ["Double down on B5 carousel pattern", "Invest in Reels behind-the-scene lab", "A/B test CTA: 'konsultasi' vs 'order'"]
        : ["Scale TikTok frequency 5x/week", "Launch 'review unboxing' creator series", "Boost top-of-funnel Meta Ads dari leads qualified"],
      totalPostsPublished: isDreamlab ? 25 : 30,
      createdAt: now(),
      updatedAt: now(),
    };
    db.reports.set(key, report);
    return delay(report);
  }

  async upsertBrandReport(_viewer: MarketingViewer, report: Partial<BrandReport> & { brandId: string; monthYear: string }) {
    const key = `${report.brandId}:${report.monthYear}`;
    const existing = db.reports.get(key);
    const merged: BrandReport = {
      id: existing?.id ?? uid(),
      brandId: report.brandId,
      monthYear: report.monthYear,
      kpis: report.kpis ?? existing?.kpis ?? ({} as any),
      storiesRecap: report.storiesRecap ?? existing?.storiesRecap,
      leadFunnels: report.leadFunnels ?? existing?.leadFunnels,
      weeklyTrends: report.weeklyTrends ?? existing?.weeklyTrends,
      weeklyReports: report.weeklyReports ?? existing?.weeklyReports,
      executiveSummary: report.executiveSummary ?? existing?.executiveSummary,
      strategicRecommendations: report.strategicRecommendations ?? existing?.strategicRecommendations,
      totalPostsPublished: report.totalPostsPublished ?? existing?.totalPostsPublished ?? 0,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };
    db.reports.set(key, merged);
    return delay(merged);
  }

  async listWeeklyReports(_viewer: MarketingViewer, brandId: string, monthYear: string) {
    const key = `${brandId}:${monthYear}`;
    if (db.weeklyReports.has(key)) return delay(db.weeklyReports.get(key)!);
    // Default 4-week data
    const weeks: WeeklyReportRow[] = [1, 2, 3, 4].map((w) => ({
      id: uid(),
      brandId,
      weekNumber: w,
      weekLabel: `Minggu ${w}`,
      dateRange: `2026-09-0${(w - 1) * 7 + 1} → 2026-09-0${w * 7}`,
      startingFollowers: 42000 + w * 800,
      followersGained: 750,
      followersUnfollowed: 40,
      netGrowth: 710,
      growthPercent: 1.7,
      endingFollowers: 42000 + (w + 1) * 800,
      views: 75000,
      reach: 48000,
      impressions: 130000,
      totalEngagement: 5400,
      engagementRate: 7.2,
      likes: 4200,
      comments: 280,
      shares: 180,
      saves: 740,
      storiesCount: 6,
      totalStoryViews: 9600,
      avgViewsPerStory: 1600,
    }));
    db.weeklyReports.set(key, weeks);
    return delay(weeks);
  }

  async copyFromPrevious(_viewer: MarketingViewer, brandId: string, targetMonthYear: string) {
    const prev = await this.getBrandReport(viewer, brandId, "2026-08");
    return this.upsertBrandReport(viewer, { ...prev, brandId, monthYear: targetMonthYear });
  }

  async listWebsiteTasks(_viewer: MarketingViewer, brandId: string) {
    return delay(db.websiteTasks.filter((t) => t.brandId === brandId));
  }

  async createWebsiteTask(_viewer: MarketingViewer, input: CreateWebsiteTaskInput) {
    const task: WebsiteTask = {
      id: uid(),
      ...input,
      status: "Pending",
    };
    db.websiteTasks.push(task);
    return delay(task);
  }

  // Integrations
  async listIntegrations(_viewer: MarketingViewer) {
    return delay(db.integrations);
  }

  async connectIntegration(_viewer: MarketingViewer, input: ConnectIntegrationInput) {
    const conn: IntegrationConnection = {
      id: uid(),
      brandId: input.brandId,
      brand: db.brands.find((b) => b.id === input.brandId),
      provider: input.provider,
      status: "active",
      lastSyncAt: null,
      lastError: null,
      createdAt: now(),
      updatedAt: now(),
    };
    db.integrations.push(conn);
    return delay(conn);
  }

  async triggerSync(_viewer: MarketingViewer, integrationId: string) {
    const job: SyncJob = {
      id: uid(),
      integrationId,
      status: "running",
      startedAt: now(),
      finishedAt: null,
      error: null,
    };
    db.syncJobs.push(job);
    // Auto-finish after delay
    setTimeout(() => {
      job.status = "succeeded";
      job.finishedAt = new Date().toISOString();
    }, 1000);
    return delay(job);
  }

  async listSyncJobs(_viewer: MarketingViewer, integrationId?: string) {
    const jobs = integrationId ? db.syncJobs.filter((j) => j.integrationId === integrationId) : db.syncJobs;
    return delay(jobs);
  }

  // AI (stub)
  async generateBrief(_viewer: MarketingViewer, params: { brandId: string; platform: string; format: string; topic: string }) {
    await new Promise((r) => setTimeout(r, 800));
    const hook = `3 hal tentang ${params.topic} yang belum kamu tahu!`;
    const caption = `Swipe untuk tahu lebih lanjut ✨ #${params.brandId}`;
    const brief = `Bahas ${params.topic} dengan angle edukatif + before-after. Target audiens: perempuan 25-35, interest skincare. Tone: profesional tapi approachable. Platform: ${params.platform}, format: ${params.format}.`;
    return delay({ hook, caption, brief });
  }
}

// ─── HTTP Implementation ──────────────────────────────────────────────────

class HttpMarketingService implements IMarketingService {
  private baseUrl: string;

  constructor(baseUrl: string = "/v1/marketing") {
    this.baseUrl = baseUrl;
  }

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  listTasks(viewer: MarketingViewer, query: TaskListQuery) {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.assigneeId) params.set("assigneeId", query.assigneeId);
    if (query.projectId) params.set("projectId", query.projectId);
    if (query.brandId) params.set("brandId", query.brandId);
    if (query.type) params.set("type", query.type);
    if (query.q) params.set("q", query.q);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    return this.req<{ items: MarketingTask[]; total: number; page: number; limit: number }>(`/tasks?${params}`);
  }
  getTask(viewer: MarketingViewer, taskId: string) {
    return this.req<MarketingTask>(`/tasks/${taskId}`);
  }
  createTask(viewer: MarketingViewer, input: CreateTaskInput, idempotencyKey?: string) {
    return this.req<MarketingTask>("/tasks", {
      method: "POST",
      body: JSON.stringify(input),
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    });
  }
  updateTask(viewer: MarketingViewer, taskId: string, input: UpdateTaskInput) {
    return this.req<MarketingTask>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(input) });
  }
  updateTaskStatus(viewer: MarketingViewer, taskId: string, input: UpdateTaskStatusInput) {
    return this.req<MarketingTask>(`/tasks/${taskId}/status`, { method: "PATCH", body: JSON.stringify(input) });
  }
  updateChecklist(viewer: MarketingViewer, taskId: string, itemId: string, input: UpdateChecklistItemInput) {
    return this.req<MarketingTask>(`/tasks/${taskId}/checklist/${itemId}`, { method: "PATCH", body: JSON.stringify(input) });
  }
  deleteTask(viewer: MarketingViewer, taskId: string) {
    return this.req<void>(`/tasks/${taskId}`, { method: "DELETE" });
  }
  listMembers(viewer: MarketingViewer) {
    return this.req<MarketingTeamMember[]>("/members");
  }
  updateMember(viewer: MarketingViewer, memberId: string, patch: Partial<MarketingTeamMember>) {
    return this.req<MarketingTeamMember>(`/members/${memberId}`, { method: "PATCH", body: JSON.stringify(patch) });
  }
  listTaskComments(viewer: MarketingViewer, taskId: string) {
    return this.req<TaskComment[]>(`/tasks/${taskId}/comments`);
  }
  createTaskComment(viewer: MarketingViewer, taskId: string, input: CreateTaskCommentInput) {
    return this.req<TaskComment>(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify(input) });
  }
  deleteTaskComment(viewer: MarketingViewer, commentId: string) {
    return this.req<void>(`/tasks/comments/${commentId}`, { method: "DELETE" });
  }
  listTaskAttachments(viewer: MarketingViewer, taskId: string) {
    return this.req<TaskAttachment[]>(`/tasks/${taskId}/attachments`);
  }
  async addTaskAttachment(viewer: MarketingViewer, taskId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${this.baseUrl}/tasks/${taskId}/attachments`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  deleteTaskAttachment(viewer: MarketingViewer, attachmentId: string) {
    return this.req<void>(`/tasks/attachments/${attachmentId}`, { method: "DELETE" });
  }
  listProjects(viewer: MarketingViewer, query: { page?: number; limit?: number; q?: string }) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    return this.req<{ items: MarketingProject[]; total: number }>(`/projects?${params}`);
  }
  createProject(viewer: MarketingViewer, input: CreateProjectInput, idempotencyKey?: string) {
    return this.req<MarketingProject>("/projects", {
      method: "POST",
      body: JSON.stringify(input),
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    });
  }
  listBrands(viewer: MarketingViewer) {
    return this.req<MarketingBrand[]>("/brands");
  }
  createBrand(viewer: MarketingViewer, input: CreateBrandInput, idempotencyKey?: string) {
    return this.req<MarketingBrand>("/brands", {
      method: "POST",
      body: JSON.stringify(input),
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    });
  }
  listPosts(viewer: MarketingViewer, query: PostListQuery) {
    const params = new URLSearchParams();
    if (query.brandId) params.set("brandId", query.brandId);
    if (query.channel) params.set("channel", query.channel);
    if (query.status) params.set("status", query.status);
    if (query.dateFrom) params.set("dateFrom", query.dateFrom);
    if (query.dateTo) params.set("dateTo", query.dateTo);
    return this.req<{ items: SocialPost[]; total: number }>(`/social/posts?${params}`);
  }
  getPost(viewer: MarketingViewer, postId: string) {
    return this.req<SocialPost>(`/social/posts/${postId}`);
  }
  createPost(viewer: MarketingViewer, input: CreatePostInput) {
    return this.req<SocialPost>("/social/posts", { method: "POST", body: JSON.stringify(input) });
  }
  updatePost(viewer: MarketingViewer, postId: string, input: UpdatePostInput) {
    return this.req<SocialPost>(`/social/posts/${postId}`, { method: "PATCH", body: JSON.stringify(input) });
  }
  deletePost(viewer: MarketingViewer, postId: string) {
    return this.req<void>(`/social/posts/${postId}`, { method: "DELETE" });
  }
  addPostMetrics(viewer: MarketingViewer, postId: string, input: AddPostMetricsInput) {
    return this.req<SocialPost>(`/social/posts/${postId}/metrics`, { method: "POST", body: JSON.stringify(input) });
  }
  async uploadPostImage(viewer: MarketingViewer, postId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${this.baseUrl}/social/posts/${postId}/media`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  getBrandReport(viewer: MarketingViewer, brandId: string, monthYear: string) {
    return this.req<BrandReport>(`/reports/${brandId}/${monthYear}`);
  }
  upsertBrandReport(viewer: MarketingViewer, report: Partial<BrandReport> & { brandId: string; monthYear: string }) {
    return this.req<BrandReport>("/reports", { method: "POST", body: JSON.stringify(report) });
  }
  listWeeklyReports(viewer: MarketingViewer, brandId: string, monthYear: string) {
    return this.req<WeeklyReportRow[]>(`/reports/${brandId}/${monthYear}/weeks`);
  }
  copyFromPrevious(viewer: MarketingViewer, brandId: string, targetMonthYear: string) {
    return this.req<BrandReport>(`/reports/${brandId}/${targetMonthYear}/copy-from-previous`, { method: "POST" });
  }
  listWebsiteTasks(viewer: MarketingViewer, brandId: string) {
    return this.req<WebsiteTask[]>(`/website-tasks?brandId=${brandId}`);
  }
  createWebsiteTask(viewer: MarketingViewer, input: CreateWebsiteTaskInput) {
    return this.req<WebsiteTask>("/website-tasks", { method: "POST", body: JSON.stringify(input) });
  }
  listIntegrations(viewer: MarketingViewer) {
    return this.req<IntegrationConnection[]>("/integrations");
  }
  connectIntegration(viewer: MarketingViewer, input: ConnectIntegrationInput) {
    return this.req<IntegrationConnection>("/integrations/connect", { method: "POST", body: JSON.stringify(input) });
  }
  triggerSync(viewer: MarketingViewer, integrationId: string) {
    return this.req<SyncJob>(`/integrations/${integrationId}/sync`, { method: "POST" });
  }
  listSyncJobs(viewer: MarketingViewer, integrationId?: string) {
    const q = integrationId ? `?integrationId=${integrationId}` : "";
    return this.req<SyncJob[]>(`/integrations/sync-jobs${q}`);
  }
  generateBrief(viewer: MarketingViewer, params: { brandId: string; platform: any; format: any; topic: string }) {
    return this.req<{ hook: string; caption: string; brief: string }>("/social/ai/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }
}

// ─── Singleton + Mode Switch ──────────────────────────────────────────────

const MODE = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_MARKETING_API_MODE) || "mock";

export const marketingService: IMarketingService =
  MODE === "real" ? new HttpMarketingService() : new MockMarketingService();

export const isMockMode = MODE !== "real";

// Convenience export of the viewer (mock mode assumes single-user; real mode gets viewer from auth context)
export const mockViewer: MarketingViewer = viewer;
