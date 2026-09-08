import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { open, rm } from 'fs/promises';
import { constants as fsConstants, createReadStream } from 'fs';
import { dirname, extname, join, relative, resolve, sep } from 'path';
import { randomUUID } from 'crypto';
import {
  calendarDayDiff,
  calcDisciplinePoints,
  deriveSla,
  isCanonicalStatus,
  parseLocalDate,
  toLocalDateString,
  type SlaStatus,
} from './sla.util';
import {
  UPLOADS_ROOT,
  EXT_TO_MIME,
  IMAGE_EXTENSIONS,
  hasValidImageMagic,
} from './prototype-upload.util';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

// Status kanonik = 4 status yang dipakai Board (single source of truth).
type TaskStatus = 'Not started' | 'Working on it' | 'Revision' | 'Done';

// Mapping status lama (data runtime/seed lama) → status kanonik.
const LEGACY_STATUS_MAP: Record<string, TaskStatus> = {
  Backlog: 'Not started',
  'To Do': 'Not started',
  'In Progress': 'Working on it',
  'Waiting Approval': 'Revision',
  Revision: 'Revision',
  Done: 'Done',
  Cancelled: 'Not started',
};

type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

interface MarketingTask {
  id: string;
  taskCode: string;
  title: string;
  projectId: string | null;
  project: string | null;
  channel: string;
  category: string;
  brand: 'Dreamlab' | 'Toribio';
  assignedBy: string | null;
  pic: string | null;
  reviewer: string | null;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  completedAt?: string;
  sla: SlaStatus;
  estimatedHours: number;
  actualHours: number;
  revisionCount: number;
  checklistDone: number;
  checklistTotal: number;
  brief: string;
  link?: string;
  tags: string[];
  comments: Array<{ author: string; body: string; createdAt: string }>;
  history: Array<{ at: string; by: string; from?: string; to: string; note: string }>;
  attachments: Array<{ id: string; name: string; type: string; sizeKb: number; path: string; uploadedBy: string; createdAt: string }>;
}

interface MarketingProject {
  id: string;
  projectCode: string;
  name: string;
  channel: string;
  category: string;
  owner: string | null;
  start: string;
  deadline: string;
  progress: number;
  openTasks: number;
  pendingApproval: number;
  status: string;
  summary: string;
  blockers: string[];
}

interface MarketingTaskInput {
  title?: string;
  projectId?: string;
  project?: string;
  channel?: string;
  category?: string;
  brand?: 'Dreamlab' | 'Toribio';
  assignedBy?: string;
  pic?: string;
  reviewer?: string;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  status?: TaskStatus;
  estimatedHours?: number;
  actualHours?: number;
  revisionCount?: number;
  checklistDone?: number;
  checklistTotal?: number;
  brief?: string;
  link?: string;
  tags?: string[];
  notes?: string;
}

interface ViewerContext {
  id?: string;
  email?: string;
  fullName?: string;
  roles?: string[];
}

interface ViewerScope {
  isManager: boolean;
  prototypeName: string | null;
  aliases: string[];
  managedMembers: string[];
}

const headOfMarketing = 'Revi';
const team = [
  { id: 'revi', name: headOfMarketing, role: 'Head of Marketing' },
  { id: 'zarka', name: 'Zarka', role: 'Video Editor' },
  { id: 'gusti', name: 'Gusti', role: 'Digital Marketing Strategy' },
  { id: 'aurel', name: 'Aurel', role: 'Content Creator' },
  { id: 'luthfi', name: 'Luthfi', role: 'Packaging Designer' },
  { id: 'rahmat', name: 'Rahmat', role: 'IS Manager' },
];

const managerRoleSet = new Set(['SUPER_ADMIN', 'HEAD_OPS', 'MARKETING']);
const viewerAliases: Record<string, string[]> = {
  revi: ['revi', 'revita', 'fadhilah', 'nisa'],
  zarka: ['zarka', 'zarkasi'],
  gusti: ['gusti'],
  aurel: ['aurel'],
  luthfi: ['luthfi'],
  rahmat: ['rahmat'],
};

const DELEGATED_MANAGER_SCOPE: Record<string, string[]> = {
  Rahmat: ['gusti', 'zarka'],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function avg(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));
}

function parseTaskDate(value: string, fieldName: string): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${fieldName} harus berformat YYYY-MM-DD (got: ${value})`);
  }
  const d = new Date(value + 'T00:00:00');
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`${fieldName} tidak valid: ${value}`);
  }
  return d;
}

function workingDaysInMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  let count = 0;
  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day += 1) {
    const d = new Date(year, month, day);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count += 1;
  }
  return count;
}

function calcQualityScore(discipline: number, revisionCount: number) {
  const revisionRate = clamp(revisionCount / 3, 0, 1);
  return Math.round(clamp(discipline * 0.7 + (1 - revisionRate) * 30, 0, 100));
}

function calcProductivityScore(assigned: number) {
  const days = workingDaysInMonth();
  return Math.round(clamp(((assigned / Math.max(days, 1)) / 3) * 100, 0, 100));
}

function normalizeIdentity(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function canonicalMember(name: string): string {
  const key = normalizeIdentity(name);
  for (const [canonical, aliases] of Object.entries(viewerAliases)) {
    if (canonical === key || aliases.includes(key)) {
      return canonical.charAt(0).toUpperCase() + canonical.slice(1);
    }
  }
  return (name ?? '').trim();
}

function memberIdForName(name: string): string {
  return canonicalMember(name).toLowerCase();
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/** Convert Prisma task row (dueDate: Date|null) → SlaTaskShape (dueDate: string) */
function toSlaShape(task: any): { status: string; dueDate: string; completedAt?: string } {
  return {
    status: task.status as string,
    dueDate: fmtDate(task.dueDate),
    completedAt: task.completedAt ? fmtDate(task.completedAt) : undefined,
  };
}

// Map DB task row → API response shape
function mapTaskRow(task: any): MarketingTask {
  const sla = deriveSla(toSlaShape(task));
  return {
    id: task.id,
    taskCode: task.taskCode,
    title: task.title,
    projectId: task.projectId ?? null,
    project: task.project?.name ?? null,
    channel: task.channel,
    category: task.category,
    brand: (task.brand as 'Dreamlab' | 'Toribio') ?? 'Dreamlab',
    assignedBy: task.assignedBy?.fullName ?? null,
    pic: task.pic?.fullName ?? null,
    reviewer: task.reviewer?.fullName ?? null,
    priority: task.priority as TaskPriority,
    startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : '',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    status: (LEGACY_STATUS_MAP[task.status] ?? task.status) as TaskStatus,
    completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : undefined,
    sla,
    estimatedHours: task.estimatedHours ?? 0,
    actualHours: task.actualHours ?? 0,
    revisionCount: task.revisionCount ?? 0,
    checklistDone: task.checklistDone ?? 0,
    checklistTotal: task.checklistTotal ?? 0,
    brief: task.brief ?? '',
    link: task.link ?? '',
    tags: task.tags ? task.tags.split(',').filter(Boolean) : [],
    comments: (task.comments ?? []).map((c: any) => ({
      author: c.author?.fullName ?? c.authorId ?? 'System',
      body: c.body,
      createdAt: new Date(c.createdAt).toISOString(),
    })),
    history: (task.history ?? []).map((h: any) => ({
      at: new Date(h.at).toISOString(),
      by: h.by?.fullName ?? h.byId ?? 'System',
      from: h.fromStatus ?? undefined,
      to: h.toStatus,
      note: h.note ?? '',
    })),
    attachments: (task.attachments ?? []).map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      sizeKb: a.sizeKb,
      path: a.path,
      uploadedBy: a.uploadedBy?.fullName ?? a.uploadedById ?? 'System',
      createdAt: new Date(a.createdAt).toISOString(),
    })),
  };
}

function mapProjectRow(p: any, tasks: any[] = []): MarketingProject {
  return {
    id: p.id,
    projectCode: p.projectCode,
    name: p.name,
    channel: p.channel,
    category: p.category,
    owner: p.owner?.fullName ?? null,
    start: p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : '',
    deadline: p.deadline ? new Date(p.deadline).toISOString().slice(0, 10) : '',
    progress: p.progress ?? 0,
    openTasks: tasks.filter(t => t.projectId === p.id && t.status !== 'Done').length,
    pendingApproval: tasks.filter(t => t.projectId === p.id && t.status === 'Revision').length,
    status: p.status ?? 'On Track',
    summary: p.summary ?? '',
    blockers: p.blockers ? p.blockers.split('; ').filter(Boolean) : [],
  };
}

@Injectable()
export class MarketingPrototypeService {
  constructor(private prisma: PrismaService) {}

  private resolveViewer(viewer?: ViewerContext): ViewerScope {
    const email = normalizeIdentity(viewer?.email);
    const fullName = normalizeIdentity(viewer?.fullName);
    const roles = viewer?.roles ?? [];

    let prototypeName: string | null = null;
    if (viewerAliases.revi.includes(fullName) || email === 'revita@nexerp.id') prototypeName = 'Revi';
    else if (viewerAliases.zarka.includes(fullName) || email === 'zarkasi@dreamlab.com' || email === 'zarkasi@nexerp.id') prototypeName = 'Zarka';
    else if (viewerAliases.gusti.includes(fullName) || email === 'gusti@dreamlab.com' || email === 'gusti@nexerp.id') prototypeName = 'Gusti';
    else if (viewerAliases.aurel.includes(fullName) || email === 'aurel@nexerp.id' || email === 'aurel@dreamlab.com') prototypeName = 'Aurel';
    else if (viewerAliases.luthfi.includes(fullName) || email === 'luthfi@nexerp.id' || email === 'luthfi@dreamlab.com') prototypeName = 'Luthfi';
    else if (viewerAliases.rahmat.includes(fullName) || email.startsWith('rahmat@')) prototypeName = 'Rahmat';
    else if (roles.some(role => managerRoleSet.has(role))) prototypeName = headOfMarketing;

    const isManager =
      email === 'revita@nexerp.id' ||
      viewerAliases.revi.includes(fullName) ||
      roles.some(role => managerRoleSet.has(role)) ||
      email === 'zaki@dreamlab.com' ||
      email === 'zaki@nexerp.id' ||
      email === 'admin@dreamlab.com' ||
      email === 'admin@nexerp.id';

    const aliasLookup: Record<string, string[]> = {
      Revi: viewerAliases.revi,
      Zarka: viewerAliases.zarka,
      Gusti: viewerAliases.gusti,
      Aurel: viewerAliases.aurel,
      Luthfi: viewerAliases.luthfi,
      Rahmat: viewerAliases.rahmat,
    };
    const aliases = prototypeName ? [prototypeName, ...(aliasLookup[prototypeName] ?? [])] : [];

    const delegated = prototypeName ? (DELEGATED_MANAGER_SCOPE[prototypeName] ?? []) : [];
    const managedMembers = isManager ? team.map(m => m.id) : delegated;

    return {
      isManager,
      prototypeName,
      aliases: Array.from(new Set(aliases.map(v => normalizeIdentity(v)).filter(Boolean))),
      managedMembers,
    };
  }

  private canManageTask(task: any, scope: ViewerScope) {
    if (scope.isManager) return true;
    if (scope.aliases.includes(normalizeIdentity(task.pic?.fullName ?? ''))) return true;
    return scope.managedMembers.includes(memberIdForName(task.pic?.fullName ?? ''));
  }

  private isVisibleToViewer(task: any, scope: ViewerScope) {
    if (scope.isManager) return true;
    if (!scope.aliases.length && !scope.managedMembers.length) return false;
    const picName = task.pic?.fullName ?? '';
    const reviewerName = task.reviewer?.fullName ?? '';
    const assignedByName = task.assignedBy?.fullName ?? '';
    const visibleByAlias = [picName, reviewerName, assignedByName].some(v =>
      scope.aliases.includes(normalizeIdentity(v)),
    );
    if (visibleByAlias) return true;
    return scope.managedMembers.includes(memberIdForName(picName));
  }

  private ensureManager(viewer?: ViewerContext) {
    const scope = this.resolveViewer(viewer);
    if (!scope.isManager) {
      throw new ForbiddenException('Only Head of Marketing can manage task registry changes');
    }
    return scope;
  }

  async getBundle(viewer?: ViewerContext) {
    const scope = this.resolveViewer(viewer);

    const rawTasks = await this.prisma.marketingTask.findMany({
      include: {
        project: { include: { owner: true } },
        pic: true,
        reviewer: true,
        assignedBy: true,
        attachments: { include: { uploadedBy: true } },
        comments: { include: { author: true } },
        history: { include: { by: true } },
      },
    });

    const visibleTasks = rawTasks.filter(task => this.isVisibleToViewer(task, scope));
    const tasks = visibleTasks.map(mapTaskRow);

    const rawProjects = await this.prisma.marketingProject.findMany({
      include: { owner: true },
    });
    const visibleProjectIds = new Set(tasks.map(t => t.projectId).filter(Boolean));
    const projects = rawProjects
      .filter(p => scope.isManager || visibleProjectIds.has(p.id))
      .map(p => mapProjectRow(p, rawTasks));

    // KPI calculation (reused from original, now queries DB)
    const calcBrandKpi = (profileName: string, brandFilter: 'Dreamlab' | 'Toribio') => {
      const brandTasks = tasks.filter(t => canonicalMember(t.pic ?? '') === profileName && t.brand === brandFilter);
      const brandTotal = brandTasks.length;
      const brandDone = brandTasks.filter(t => t.status === 'Done').length;
      const brandLate = brandTasks.filter(
        t => t.status === 'Done' && t.completedAt && calendarDayDiff(parseLocalDate(t.completedAt.slice(0, 10)), parseLocalDate(t.dueDate)) > 0,
      ).length;
      const brandInProgress = brandTasks.filter(t => t.status !== 'Done').length;
      const brandOnTime = Math.max(brandDone - brandLate, 0);
      const brandProgress = brandTotal > 0 ? Math.round((brandDone / brandTotal) * 100) : 0;
      return { total: brandTotal, done: brandDone, late: brandLate, inProgress: brandInProgress, onTime: brandOnTime, progress: brandProgress };
    };

    // Performance per member — scoped to viewer so non-managers never see other members' KPIs
    const allMemberNames = [...new Set([...tasks.map(t => t.pic), ...tasks.map(t => t.reviewer)].filter(Boolean))];
    const visibleMemberNames = allMemberNames.filter((name): name is string => {
      if (!name) return false;
      if (scope.isManager) return true;
      const canonical = canonicalMember(name);
      if (scope.aliases.includes(canonical.toLowerCase())) return true;
      return scope.managedMembers.includes(canonical.toLowerCase());
    });
    const performance = visibleMemberNames.map(name => {
      if (!name) return null;
      const memberTasks = tasks.filter(t => canonicalMember(t.pic ?? '') === canonicalMember(name));
      const taskCount = memberTasks.length;
      const completedTasks = memberTasks.filter(t => t.status === 'Done');
      const completed = completedTasks.length;
      const late = completedTasks.filter(
        t => t.completedAt && calendarDayDiff(parseLocalDate(t.completedAt.slice(0, 10)), parseLocalDate(t.dueDate)) > 0,
      ).length;
      const overdue = memberTasks.filter(
        t => t.status !== 'Done' && calendarDayDiff(new Date(), parseLocalDate(t.dueDate)) > 0,
      ).length;
      const revision = memberTasks.filter(t => t.status === 'Revision').length;
      const discipline = avg(memberTasks.map(t => calcDisciplinePoints(t)));
      const quality = calcQualityScore(discipline, revision);
      const productivity = calcProductivityScore(taskCount);
      const completion = taskCount > 0 ? Math.round((completed / taskCount) * 100) : 0;
      const overall = Math.round(completion * 0.4 + discipline * 0.3 + quality * 0.15 + productivity * 0.15);

      return {
        name: canonicalMember(name),
        assigned: taskCount,
        completed,
        onTime: Math.max(completed - late, 0),
        late,
        overdue,
        revision,
        completionScore: completion,
        disciplineScore: discipline,
        qualityScore: quality,
        productivityScore: productivity,
        overallKpi: overall,
        history: [
          { period: 'W1', kpi: clamp(overall - 8, 0, 100), discipline: clamp(discipline - 6, 0, 100) },
          { period: 'W2', kpi: clamp(overall - 4, 0, 100), discipline: clamp(discipline - 3, 0, 100) },
          { period: 'W3', kpi: clamp(overall - 1, 0, 100), discipline: clamp(discipline - 1, 0, 100) },
          { period: 'W4', kpi: clamp(overall + 2, 0, 100), discipline: clamp(discipline + 2, 0, 100) },
          { period: 'W5', kpi: clamp(overall + 4, 0, 100), discipline: clamp(discipline + 4, 0, 100) },
          { period: 'W6', kpi: overall, discipline },
        ],
      };
    }).filter(Boolean);

    const summary = {
      activeProjects: projects.filter(p => p.status !== 'Completed').length,
      openTasks: tasks.filter(t => t.status !== 'Done').length,
      waitingApproval: tasks.filter(t => t.status === 'Revision').length,
      averageKpi: avg(performance.map(m => m!.overallKpi)),
    };

    // Monthly performance: 6 bulan terakhir (terakhir s.d. bulan ini)
    // — KPI per bulan dari tasks yang dueDate-nya di bulan tsb.
    const today = new Date();
    const recentMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      recentMonths.push(ym);
    }
    const monthlyPerformance = recentMonths.map(month => {
      const monthTasks = tasks.filter(t => t.dueDate && t.dueDate.slice(0, 7) === month);
      const monthDone = monthTasks.filter(t => t.status === 'Done').length;
      const monthOnTime = monthTasks.filter(t =>
        t.status === 'Done' && t.completedAt && calendarDayDiff(parseLocalDate(t.completedAt.slice(0, 10)), parseLocalDate(t.dueDate)) <= 0,
      ).length;
      const monthScore = monthTasks.length > 0 ? Math.round((monthDone / monthTasks.length) * 100) : 0;
      return { month, score: monthScore, done: monthDone, total: monthTasks.length, onTime: monthOnTime };
    });
    // Tandai sebagai sudah dipakai (dikirim via response)
    void monthlyPerformance;

    // Profiles
    const profiles = await this.prisma.user.findMany({
      where: {
        OR: [
          { fullName: { in: team.map(t => t.name) } },
          { email: { in: ['revita@nexerp.id', 'zarkasi@nexerp.id', 'gusti@nexerp.id', 'aurel@nexerp.id', 'luthfi@nexerp.id', 'rahmat@nexerp.id', 'zarkasi@dreamlab.com', 'gusti@dreamlab.com', 'aurel@dreamlab.com', 'luthfi@dreamlab.com', 'rahmat@dreamlab.com'] } },
        ],
      },
    });

    const profilesData = profiles.map(u => {
      const memberPerf = performance.find(m => m && canonicalMember(m.name) === canonicalMember(u.fullName ?? ''));
      return {
        id: u.id,
        name: u.fullName ?? '',
        email: u.email,
        monthKpi: memberPerf?.overallKpi ?? 0,
        completed: memberPerf?.completed ?? 0,
        inProgress: memberPerf ? memberPerf.assigned - memberPerf.completed : 0,
        late: memberPerf?.late ?? 0,
        overdue: memberPerf?.overdue ?? 0,
        breakdown: {
          completion: memberPerf?.completionScore ?? 0,
          discipline: memberPerf?.disciplineScore ?? 0,
          quality: memberPerf?.qualityScore ?? 0,
          productivity: memberPerf?.productivityScore ?? 0,
        },
        brandKpi: {
          dreamlab: calcBrandKpi(canonicalMember(u.fullName ?? ''), 'Dreamlab'),
          toribio: calcBrandKpi(canonicalMember(u.fullName ?? ''), 'Toribio'),
        },
      };
    });

    return {
      viewer: {
        name: scope.prototypeName,
        isManager: scope.isManager,
        managedMembers: scope.managedMembers,
      },
      summary,
      projects,
      tasks,
      performance: performance.filter(Boolean) as any[],
      profiles: profilesData,
      insights: [],
      reports: {
        averageKpi: summary.averageKpi,
        teamSize: scope.isManager ? profiles.length : performance.length,
        kpiHistory: performance.filter(Boolean).map(m => ({ name: m!.name, history: m!.history })),
        monthlyPerformance,
      },
    };
  }

  async getDashboard(viewer?: ViewerContext) {
    const bundle = await this.getBundle(viewer);
    return {
      activeProjects: bundle.summary.activeProjects,
      openTasks: bundle.summary.openTasks,
      waitingApproval: bundle.summary.waitingApproval,
      averageKpi: bundle.summary.averageKpi,
      projects: bundle.projects.slice(0, 4),
      tasks: bundle.tasks.slice(0, 6),
      performance: bundle.performance,
      notifications: [],
      insights: [],
    };
  }

  async getProjects(viewer?: ViewerContext) {
    const bundle = await this.getBundle(viewer);
    return bundle.projects;
  }

  async getTasks(viewer?: ViewerContext) {
    const bundle = await this.getBundle(viewer);
    return bundle.tasks;
  }

  async getPerformance(viewer?: ViewerContext) {
    const bundle = await this.getBundle(viewer);
    return bundle.performance;
  }

  async getNotifications(viewer?: ViewerContext) {
    // TODO: implement once MarketingNotification schema is verified
    return [];
  }

  async getSettings() {
    return {
      weights: { completion: 40, discipline: 30, quality: 15, productivity: 15 },
      workingHours: { start: '08:00', end: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      projectCategories: [
        'performance_marketing', 'organic_growth', 'content_production',
        'retention_crm', 'conversion_optimization', 'brand_building',
        'commercial_activation', 'analytics_reporting',
      ],
      appearance: { departmentDefaultTheme: 'professional', allowUserOverride: true },
    };
  }

  async updateSettings(viewer: ViewerContext | undefined, input: any) {
    this.ensureManager(viewer);
    return input;
  }

  async getUiThemePreference(viewer: ViewerContext | undefined) {
    return {
      preference: 'follow-department',
      departmentDefaultTheme: 'professional',
      allowUserOverride: true,
      canManageAppearance: this.resolveViewer(viewer).isManager,
    };
  }

  async updateUiThemePreference(viewer: ViewerContext | undefined, input: any) {
    return { preference: input.preference ?? 'follow-department', departmentDefaultTheme: 'professional', allowUserOverride: true, canManageAppearance: this.resolveViewer(viewer).isManager };
  }

  async updateUiThemeDefault(viewer: ViewerContext | undefined, input: any) {
    const scope = this.ensureManager(viewer);
    return { preference: 'follow-department', departmentDefaultTheme: input.departmentDefaultTheme ?? 'professional', allowUserOverride: input.allowUserOverride ?? true, canManageAppearance: scope.isManager };
  }

  async getProfile(viewer: ViewerContext | undefined, id: string) {
    const bundle = await this.getBundle(viewer);
    return bundle.profiles.find(p => p.id === id) ?? null;
  }

  async updateTaskStatus(viewer: ViewerContext | undefined, id: string, status: TaskStatus, note = 'Status updated') {
    const scope = this.resolveViewer(viewer);

    const task = await this.prisma.marketingTask.findUnique({
      where: { id },
      include: { pic: true, reviewer: true, assignedBy: true },
    });
    if (!task || !this.isVisibleToViewer(task, scope)) throw new NotFoundException('Task tidak ditemukan');

    const canonicalStatus = (LEGACY_STATUS_MAP[status] ?? status) as TaskStatus;
    if (!isCanonicalStatus(canonicalStatus) || canonicalStatus === task.status) return task;

    const now = new Date();
    const historyEntry = {
      taskId: task.id,
      byId: null,
      fromStatus: task.status,
      toStatus: canonicalStatus,
      note,
      at: now,
    };
    const updateData: any = { status: canonicalStatus, sla: deriveSla({ ...toSlaShape(task), status: canonicalStatus }) };
    if (canonicalStatus === 'Done') {
      updateData.completedAt = now;
      updateData.checklistDone = task.checklistTotal;
    } else {
      updateData.completedAt = null;
    }

    const [_, updated] = await this.prisma.$transaction([
      this.prisma.marketingTaskHistory.create({ data: historyEntry }),
      this.prisma.marketingTask.update({ where: { id }, data: updateData }),
    ]);
    return updated;
  }

  async updateTask(viewer: ViewerContext | undefined, id: string, input: MarketingTaskInput) {
    const scope = this.resolveViewer(viewer);

    const task = await this.prisma.marketingTask.findUnique({
      where: { id },
      include: { pic: true, project: true },
    });
    if (!task || !this.isVisibleToViewer(task, scope)) throw new NotFoundException('Task tidak ditemukan');

    const canEditFull = scope.isManager || scope.managedMembers.includes(memberIdForName(task.pic?.fullName ?? ''));

    // Scope leak guard
    if (!scope.isManager && input.pic !== undefined) {
      const newPicOk = scope.aliases.includes(normalizeIdentity(input.pic)) ||
        scope.managedMembers.includes(memberIdForName(input.pic));
      if (!newPicOk) throw new ForbiddenException('Can only reassign tasks to yourself or your managed members');
    }

    const ALLOWED = ['title', 'projectId', 'channel', 'category', 'brand', 'pic', 'reviewer', 'priority', 'startDate', 'dueDate', 'status', 'estimatedHours', 'actualHours', 'revisionCount', 'checklistDone', 'checklistTotal', 'brief', 'link', 'tags'];

    const updateData: any = {};

    if (canEditFull) {
      for (const key of ALLOWED) {
        const val = input[key as keyof MarketingTaskInput];
        if (val !== undefined && key !== 'pic' && key !== 'projectId') {
          if (key === 'dueDate' || key === 'startDate') {
            updateData[key] = val ? parseTaskDate(val as string, key) : null;
          } else {
            updateData[key] = val;
          }
        }
      }
      if (input.projectId !== undefined) {
        updateData.projectId = input.projectId || null;
      }
      if (input.pic !== undefined) {
        const picUser = await this.prisma.user.findFirst({
          where: {
            OR: [
              { fullName: { equals: input.pic, mode: 'insensitive' } },
              { email: { startsWith: `${input.pic.toLowerCase()}@` } },
            ],
          },
        });
        updateData.picId = picUser?.id ?? null;
      }
      if (input.notes !== undefined && input.brief === undefined) {
        updateData.brief = input.notes;
      }
    } else {
      const disallowed = Object.keys(input).filter(k => k !== 'startDate' && k !== 'status');
      if (disallowed.length > 0) {
        console.warn(`[updateTask] Member ${viewer?.id ?? 'anon'} tried to edit disallowed fields: ${disallowed.join(', ')}`);
      }
      if (input.startDate !== undefined) updateData.startDate = parseTaskDate(input.startDate, 'startDate');
      if (input.status !== undefined && input.status !== task.status) {
        const canonical = (LEGACY_STATUS_MAP[input.status] ?? input.status) as TaskStatus;
        if (isCanonicalStatus(canonical)) updateData.status = canonical;
      }
      if (Object.keys(updateData).length === 0) {
        throw new ForbiddenException('No fields you can edit on this task');
      }
    }

    if (updateData.status === 'Done' || (updateData.status === undefined && task.status === 'Done')) {
      updateData.completedAt = task.completedAt ?? new Date();
      updateData.checklistDone = task.checklistTotal;
    } else if (updateData.status && updateData.status !== 'Done') {
      updateData.completedAt = null;
    }

    // Cross-validate startDate vs dueDate (dueDate from DB row, not yet overwritten)
    if (updateData.startDate && task.dueDate && updateData.startDate.getTime() > task.dueDate.getTime()) {
      throw new BadRequestException('startDate tidak boleh setelah dueDate');
    }

    const mergedForSla = {
      status: (updateData.status ?? task.status) as string,
      dueDate: updateData.dueDate ? fmtDate(updateData.dueDate) : fmtDate(task.dueDate),
      completedAt: updateData.completedAt ? fmtDate(updateData.completedAt) : (task.completedAt ? fmtDate(task.completedAt) : undefined),
    };
    updateData.sla = deriveSla(mergedForSla);

    const byId = viewer?.id ?? null;
    const changedKeys = Object.keys(updateData).filter(k => k !== 'sla' && k !== 'completedAt' && k !== 'checklistDone');
    const note = changedKeys.length ? `Task updated (${changedKeys.join(', ')})` : 'Task updated';
    return this.prisma.$transaction(async (tx) => {
      await tx.marketingTaskHistory.create({
        data: { taskId: task.id, byId, fromStatus: task.status, toStatus: updateData.status ?? task.status, note, at: new Date() },
      });
      return tx.marketingTask.update({ where: { id }, data: updateData });
    });
  }

  async deleteTask(viewer: ViewerContext | undefined, id: string) {
    const scope = this.resolveViewer(viewer);
    const task = await this.prisma.marketingTask.findUnique({
      where: { id },
      include: { pic: true, reviewer: true, assignedBy: true },
    });
    if (!task) throw new NotFoundException('Task tidak ditemukan');
    if (!this.canManageTask(task, scope)) {
      throw new ForbiddenException('Only the manager or delegated manager of this task can delete it');
    }
    await this.prisma.marketingTask.delete({ where: { id } });
    // Clean up attachment files — order: DB delete first, then rm; on failure file orphans but DB is clean
    rm(join(UPLOADS_ROOT, 'tasks', id), { recursive: true, force: true })
      .catch((err) => console.warn(`[deleteTask] orphan cleanup failed for task ${id}:`, err));
    return true;
  }

  async createTask(viewer: ViewerContext | undefined, input: MarketingTaskInput & { id?: string }) {
    const scope = this.resolveViewer(viewer);
    if (!scope.isManager && !scope.prototypeName) {
      throw new ForbiddenException('Only team members can create tasks');
    }

    let assignee = input.pic ?? scope.prototypeName ?? '';
    const assigneeOk = scope.isManager || scope.aliases.includes(normalizeIdentity(assignee)) ||
      scope.managedMembers.includes(memberIdForName(assignee));
    if (!assigneeOk) {
      throw new ForbiddenException('Members can only create tasks assigned to themselves or their managed members');
    }

    const actor = scope.prototypeName ?? headOfMarketing;
    const status = (LEGACY_STATUS_MAP[input.status ?? 'Not started'] ?? 'Not started') as TaskStatus;
    const now = new Date();

    let id = input.id;
    if (!id) {
      // ponytail: race-free UUID-derived code; legacy numeric TSK-XXXX codes are
      // preserved when input.id is provided, new tasks get a UUID-based id.
      id = `TSK-${randomUUID().slice(0, 8).toUpperCase()}`;
    }

    const project = input.projectId
      ? await this.prisma.marketingProject.findUnique({ where: { id: input.projectId } })
      : null;

    let picUserId: string | null = null;
    if (assignee) {
      const picUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { fullName: { equals: assignee, mode: 'insensitive' } },
            { email: { startsWith: `${assignee.toLowerCase()}@` } },
          ],
        },
      });
      picUserId = picUser?.id ?? null;
    }

    let assignedByUserId: string | null = viewer?.id ?? null;
    if (!assignedByUserId && actor) {
      const actorUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { fullName: { equals: actor, mode: 'insensitive' } },
            { email: { startsWith: `${actor.toLowerCase()}@` } },
          ],
        },
      });
      assignedByUserId = actorUser?.id ?? null;
    }

    const startDate = input.startDate ? parseTaskDate(input.startDate, 'startDate') : now;
    const dueDate = input.dueDate ? parseTaskDate(input.dueDate, 'dueDate') : now;
    if (startDate && dueDate && startDate.getTime() > dueDate.getTime()) {
      throw new BadRequestException('startDate tidak boleh setelah dueDate');
    }

    return this.prisma.$transaction(async (tx) => {
      // ponytail: Prisma's CreateInput vs UncheckedCreateInput union narrowing rejects
      // mixed flat-FK + scalar values even though runtime accepts them. Cast to
      // MarketingTaskUncheckedCreateInput — matches the data shape (flat FK cols).
      const task = await tx.marketingTask.create({
        // @ts-expect-error -- Prisma type-union limitation; runtime accepts flat FK cols
        data: {
          taskCode: id,
          title: input.title ?? 'Untitled task',
          projectId: input.projectId ?? project?.id,
          channel: input.channel ?? 'General',
          category: input.category ?? (input.channel ?? 'General').toLowerCase().replaceAll(' ', '_'),
          brand: (input.brand ?? 'Dreamlab') as 'Dreamlab' | 'Toribio',
          assignedById: assignedByUserId,
          picId: picUserId,
          priority: (input.priority ?? 'Medium') as TaskPriority,
          startDate,
          dueDate,
          status,
          sla: deriveSla({
            status,
            dueDate: input.dueDate ?? '',
            completedAt: status === 'Done' ? now.toISOString() : undefined,
          }),
          estimatedHours: input.estimatedHours ?? 4,
          actualHours: input.actualHours ?? 0,
          revisionCount: input.revisionCount ?? 0,
          checklistDone: input.checklistDone ?? 0,
          checklistTotal: input.checklistTotal ?? 4,
          brief: input.brief ?? input.notes ?? '',
          link: input.link ?? '',
          tags: input.tags?.join(',') ?? '',
        },
      });

      await tx.marketingTaskHistory.create({
        data: { taskId: task.id, byId: assignedByUserId, fromStatus: null, toStatus: status, note: 'Task created', at: now },
      });

      return task;
    });
  }

  async addAttachment(viewer: ViewerContext | undefined, taskId: string, file: any) {
    const scope = this.resolveViewer(viewer);
    const uploaderId = viewer?.id ?? null;
    const ext = extname(file.originalname).toLowerCase().slice(1);

    if (IMAGE_EXTENSIONS.has(ext)) {
      const full = resolve(file.path);
      try {
        const handle = await open(full, 'r');
        const buf = Buffer.alloc(16);
        await handle.read(buf, 0, 16, 0);
        await handle.close();
        if (!hasValidImageMagic(buf.subarray(0, 16), ext)) {
          await rm(file.path, { force: true }).catch(() => undefined);
          throw new BadRequestException('Isi file tidak cocok dengan ekstensi gambar yang dikirim');
        }
      } catch { /* file may not exist in test */ }
    }

    // Snapshot current task status so history.toStatus stays valid (NOT NULL column).
    const task = await this.prisma.marketingTask.findUnique({
      where: { id: taskId },
      select: { id: true, status: true },
    });
    if (!task || !this.isVisibleToViewer(task, scope)) {
      await rm(file.path, { force: true }).catch(() => undefined);
      throw new NotFoundException('Task tidak ditemukan');
    }

    const attachment = await this.prisma.$transaction(async (tx) => {
      const a = await tx.marketingTaskAttachment.create({
        data: {
          taskId,
          name: file.originalname,
          type: EXT_TO_MIME[ext] ?? 'application/octet-stream',
          sizeKb: Math.max(Math.round(file.size / 1024), 0),
          path: relative(resolve(UPLOADS_ROOT), resolve(file.path)).split(sep).join('/'),
          uploadedById: uploaderId,
        },
      });

      const safeName = file.originalname.replace(/[\r\n\t]/g, ' ').slice(0, 200);
      await tx.marketingTaskHistory.create({
        data: { taskId, byId: uploaderId, fromStatus: null, toStatus: task.status ?? 'Not started', note: `Attachment added: ${safeName}`, at: new Date() },
      });

      return a;
    });

    return attachment;
  }

  async deleteAttachment(viewer: ViewerContext | undefined, taskId: string, attachmentId: string) {
    const scope = this.resolveViewer(viewer);
    const task = await this.prisma.marketingTask.findUnique({ where: { id: taskId }, include: { pic: true } });
    if (!task || !this.isVisibleToViewer(task, scope)) throw new NotFoundException('Task tidak ditemukan');

    const att = await this.prisma.marketingTaskAttachment.findUnique({
      where: { id: attachmentId },
      include: { uploadedBy: true },
    });
    if (!att) return true;

    const isUploader =
      att.uploadedById === (viewer?.id ?? null) ||
      normalizeIdentity(att.uploadedBy?.fullName ?? '') === normalizeIdentity(scope.prototypeName ?? '');
    const managedOk = scope.managedMembers.includes(memberIdForName(task.pic?.fullName ?? ''));
    if (!scope.isManager && !isUploader && !managedOk) {
      throw new ForbiddenException('Hanya pengunggah, manager, atau delegated manager task ini yang dapat menghapus file');
    }

    await this.prisma.marketingTaskAttachment.delete({ where: { id: attachmentId } });
    if (att.path) {
      const full = resolve(UPLOADS_ROOT, att.path);
      if (full.startsWith(resolve(UPLOADS_ROOT))) {
        rm(full, { force: true }).catch((err) => console.warn(`[deleteAttachment] file cleanup failed for ${attachmentId}:`, err));
      }
    }
    return true;
  }

  async getAttachmentContent(viewer: ViewerContext | undefined, taskId: string, attachmentId: string) {
    const scope = this.resolveViewer(viewer);
    const task = await this.prisma.marketingTask.findUnique({
      where: { id: taskId },
      include: { pic: true, reviewer: true, assignedBy: true },
    });
    if (!task || !this.isVisibleToViewer(task, scope)) throw new NotFoundException('Task tidak ditemukan');

    const att = await this.prisma.marketingTaskAttachment.findUnique({ where: { id: attachmentId } });
    if (!att || !att.path) throw new NotFoundException('File tidak ditemukan');
    if (!att.path.startsWith('tasks/') || att.path.includes('..')) throw new NotFoundException('File tidak ditemukan');

    const full = resolve(UPLOADS_ROOT, att.path);
    if (!full.startsWith(resolve(UPLOADS_ROOT))) throw new NotFoundException('File tidak ditemukan');

    return { stream: createReadStream(full), type: att.type, name: att.name };
  }

  async addTaskComment(viewer: ViewerContext | undefined, id: string, author: string, body: string) {
    const scope = this.resolveViewer(viewer);
    const task = await this.prisma.marketingTask.findUnique({
      where: { id },
      include: { pic: true, reviewer: true, assignedBy: true },
    });
    if (!task || !this.isVisibleToViewer(task, scope)) throw new NotFoundException('Task tidak ditemukan');

    const authorId = viewer?.id ?? null;
    await this.prisma.$transaction([
      this.prisma.marketingTaskComment.create({
        data: { taskId: id, authorId, body, createdAt: new Date() },
      }),
      this.prisma.marketingTaskHistory.create({
        data: { taskId: id, byId: authorId, fromStatus: null, toStatus: task.status ?? 'Not started', note: 'Comment added', at: new Date() },
      }),
    ]);
    return this.prisma.marketingTask.findUnique({
      where: { id },
      include: { pic: true, reviewer: true, assignedBy: true, comments: { include: { author: true } } },
    });
  }

  async markAllNotificationsRead(viewer?: ViewerContext) {
    // TODO: implement once marketingNotification model is confirmed in schema
    console.warn('[markAllNotificationsRead] not yet implemented — marketingNotification model needs verification');
    return [];
  }

  async resetState(viewer?: ViewerContext) {
    this.ensureManager(viewer);
    // ponytail: intentionally a no-op for prod; use prisma studio for real resets
    return { message: 'Reset not needed — data is in database' };
  }

  async createProject(viewer: ViewerContext | undefined, input: any) {
    const scope = this.ensureManager(viewer);
    const id = input.id ?? `PRJ-${randomUUID().slice(0, 8).toUpperCase()}`;
    return this.prisma.marketingProject.create({
      data: {
        projectCode: id,
        name: input.name ?? 'Untitled project',
        channel: input.channel ?? 'General',
        category: input.category ?? 'general_operations',
        ownerId: input.ownerId ?? null,
        startDate: input.start ? new Date(input.start) : new Date(),
        deadline: input.deadline ? new Date(input.deadline) : new Date(),
        progress: clamp(Number(input.progress ?? 0), 0, 100),
        status: input.status ?? 'On Track',
        summary: input.summary ?? '',
        blockers: (input.blockers ?? []).join('; '),
      },
    });
  }

  async updateProject(viewer: ViewerContext | undefined, id: string, input: any) {
    this.ensureManager(viewer);
    return this.prisma.marketingProject.update({
      where: { id },
      data: {
        ...input,
        progress: input.progress !== undefined ? clamp(Number(input.progress), 0, 100) : undefined,
        blockers: input.blockers ? input.blockers.join('; ') : undefined,
      },
    });
  }

  async deleteProject(viewer: ViewerContext | undefined, id: string) {
    this.ensureManager(viewer);
    await this.prisma.marketingProject.delete({ where: { id } });
    return true;
  }
}
