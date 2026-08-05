import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { dirname, join } from 'path';
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

// Status kanonik = 4 status yang dipakai Board (single source of truth).
// Status lama (Backlog/To Do/In Progress/Waiting Approval/Cancelled) di-mapping
// ke 4 status ini di normalizeState() (lihat FASE 3, P3.1).
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

interface MarketingProject {
  id: string;
  name: string;
  channel: string;
  category: string;
  owner: string;
  start: string;
  deadline: string;
  progress: number;
  openTasks: number;
  pendingApproval: number;
  status: 'On Track' | 'At Risk' | 'Review' | 'Completed';
  summary: string;
  blockers: string[];
}

type MarketingProjectInput = Partial<
  Pick<
    MarketingProject,
    | 'id'
    | 'name'
    | 'channel'
    | 'category'
    | 'owner'
    | 'start'
    | 'deadline'
    | 'progress'
    | 'status'
    | 'summary'
    | 'blockers'
  >
>;

interface MarketingTask {
  id: string;
  title: string;
  projectId: string;
  project: string;
  channel: string;
  category: string;
  brand: 'Dreamlab' | 'Toribio';
  assignedBy: string;
  pic: string;
  reviewer: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  /** ISO timestamp saat task ditandai Done (jika pernah) — dasar perhitungan
   * SLA/KPI untuk task selesai. Diisi oleh updateTaskStatus/updateTask. */
  completedAt?: string;
  sla: SlaStatus;
  estimatedHours: number;
  actualHours: number;
  revisionCount: number;
  checklistDone: number;
  checklistTotal: number;
  brief: string;
  tags: string[];
  comments: Array<{ author: string; body: string; createdAt: string }>;
  history: Array<{ at: string; by: string; from?: string; to: string; note: string }>;
  attachments: Array<{ name: string; type: string; sizeKb: number }>;
}

type MarketingTaskInput = Partial<
  Pick<
    MarketingTask,
    | 'title'
    | 'projectId'
    | 'project'
    | 'channel'
    | 'category'
    | 'brand'
    | 'assignedBy'
    | 'pic'
    | 'reviewer'
    | 'priority'
    | 'startDate'
    | 'dueDate'
    | 'status'
    | 'sla'
    | 'estimatedHours'
    | 'actualHours'
    | 'revisionCount'
    | 'checklistDone'
    | 'checklistTotal'
    | 'brief'
    | 'tags'
    | 'attachments'
  >
>;

interface MarketingPerformance {
  name: string;
  role: string;
  assigned: number;
  completed: number;
  onTime: number;
  late: number;
  revision: number;
  completionScore: number;
  disciplineScore: number;
  qualityScore: number;
  productivityScore: number;
  overallKpi: number;
  history: Array<{ period: string; kpi: number; discipline: number }>;
}

interface MarketingNotification {
  id: string;
  type: string;
  title: string;
  detail: string;
  actor: string;
  time: string;
  unread: boolean;
  recipient?: string | null;
}

interface MarketingSettings {
  weights: { completion: number; discipline: number; quality: number; productivity: number };
  workingHours: { start: string; end: string; days: string[] };
  projectCategories: string[];
  appearance: {
    departmentDefaultTheme: 'professional' | 'marketing-aesthetic';
    allowUserOverride: boolean;
  };
}

interface MarketingProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  joinDate: string;
  bio: string;
  monthKpi: number;
  completed: number;
  inProgress: number;
  late: number;
  overdue: number;
  breakdown: { completion: number; discipline: number; quality: number; productivity: number };
}

interface MarketingPrototypeState {
  summaryDate: string;
  projects: MarketingProject[];
  tasks: MarketingTask[];
  performance: MarketingPerformance[];
  notifications: MarketingNotification[];
  settings: MarketingSettings;
  uiPreferences?: Record<string, 'professional' | 'marketing-aesthetic' | 'follow-department'>;
  profiles: MarketingProfile[];
  insights: Array<{ title: string; summary: string; impact: 'Positive' | 'Negative' | 'Neutral' }>;
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
}

const statePath = join(process.cwd(), 'data', 'marketing-prototype-state.json');

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function avg(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));
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

/** Nama member kanonik (mis. "Revita" → "Revi", "Zarkasi" → "Zarka").
 * Dipakai seragam di semua perbandingan pic/owner supaya task ber-pic
 * "Revita" ikut terhitung untuk profil "Revi" (BUG-C2/P3.2). */
function canonicalMember(name: string): string {
  const key = normalizeIdentity(name);
  for (const [canonical, aliases] of Object.entries(viewerAliases)) {
    if (canonical === key || aliases.includes(key)) {
      return canonical.charAt(0).toUpperCase() + canonical.slice(1);
    }
  }
  return (name ?? '').trim();
}

function timeStampLabel(date = new Date()) {
  return date.toISOString().slice(11, 16);
}

function buildSeedState(): MarketingPrototypeState {
  const projects: MarketingProject[] = [
    {
      id: 'PRJ-2401',
      name: 'Q3 Acquisition Sprint',
      channel: 'Paid Ads',
      category: 'performance_marketing',
      owner: headOfMarketing,
      start: '2026-07-01',
      deadline: '2026-07-31',
      progress: 68,
      openTasks: 9,
      pendingApproval: 3,
      status: 'On Track',
      summary: 'Scale paid lead generation for July campaign clusters across Meta and TikTok.',
      blockers: ['Meta creative refresh waiting', 'Landing hero copy still in revision'],
    },
    {
      id: 'PRJ-2402',
      name: 'SEO Authority Lift',
      channel: 'SEO',
      category: 'organic_growth',
      owner: headOfMarketing,
      start: '2026-07-03',
      deadline: '2026-08-15',
      progress: 44,
      openTasks: 7,
      pendingApproval: 1,
      status: 'At Risk',
      summary: 'Recover ranking on non-brand intent pages and publish technical SEO fixes.',
      blockers: ['Schema update not shipped', 'Three blog drafts not reviewed'],
    },
    {
      id: 'PRJ-2403',
      name: 'TikTok Content Batch W2',
      channel: 'Content',
      category: 'content_production',
      owner: headOfMarketing,
      start: '2026-07-07',
      deadline: '2026-07-18',
      progress: 81,
      openTasks: 4,
      pendingApproval: 2,
      status: 'Review',
      summary: 'Produce and release 12 short-form educational and promotional assets.',
      blockers: ['Two edits waiting approval'],
    },
    {
      id: 'PRJ-2404',
      name: 'CRM Winback Flow',
      channel: 'CRM',
      category: 'retention_crm',
      owner: headOfMarketing,
      start: '2026-07-02',
      deadline: '2026-07-24',
      progress: 59,
      openTasks: 5,
      pendingApproval: 1,
      status: 'On Track',
      summary: 'Launch segmented WhatsApp and email recovery flows for dormant leads.',
      blockers: ['Offer copy for segment C not locked'],
    },
    {
      id: 'PRJ-2405',
      name: 'Landing Page CRO Sprint',
      channel: 'Website',
      category: 'conversion_optimization',
      owner: headOfMarketing,
      start: '2026-07-05',
      deadline: '2026-07-29',
      progress: 37,
      openTasks: 8,
      pendingApproval: 0,
      status: 'At Risk',
      summary: 'Improve conversion paths on high-intent landing pages and forms.',
      blockers: ['Heatmap findings not synthesized', 'Variant B not QA tested'],
    },
    {
      id: 'PRJ-2406',
      name: 'Evergreen Brand Education',
      channel: 'Organic Social',
      category: 'brand_building',
      owner: headOfMarketing,
      start: '2026-06-20',
      deadline: '2026-07-20',
      progress: 92,
      openTasks: 2,
      pendingApproval: 1,
      status: 'Review',
      summary: 'Maintain educational always-on content calendar for awareness lift.',
      blockers: ['Final carousel caption approval'],
    },
    {
      id: 'PRJ-2407',
      name: 'Marketplace Promo Push',
      channel: 'Marketplace',
      category: 'commercial_activation',
      owner: headOfMarketing,
      start: '2026-07-08',
      deadline: '2026-07-28',
      progress: 26,
      openTasks: 6,
      pendingApproval: 0,
      status: 'At Risk',
      summary: 'Align promo creative, PDP updates, and retargeting ads around marketplace traffic.',
      blockers: ['Voucher mechanics not approved by finance'],
    },
    {
      id: 'PRJ-2408',
      name: 'June Retrospective Pack',
      channel: 'Analytics',
      category: 'analytics_reporting',
      owner: headOfMarketing,
      start: '2026-06-28',
      deadline: '2026-07-06',
      progress: 100,
      openTasks: 0,
      pendingApproval: 0,
      status: 'Completed',
      summary: 'Close monthly reporting pack and performance summary for management.',
      blockers: [],
    },
  ];

  const taskRows: Array<[string, string, string, string, string, string, string, string, string, string, number, number, number, string, 'Dreamlab' | 'Toribio']> = [
    ['TSK-3101', 'Refresh Meta lead gen headline set', 'PRJ-2401', 'Q3 Acquisition Sprint', 'Meta Ads', 'Zarka', 'Urgent', '2026-07-02', 'Revision', 'Watch', 1, 4, 5, 'Deliver 5 primary headline variations with pain-point and proof angles.', 'Dreamlab'],
    ['TSK-3102', 'Draft TikTok hook bank for serum angle', 'PRJ-2403', 'TikTok Content Batch W2', 'Content', 'Aurel', 'High', '2026-07-03', 'Working on it', 'Healthy', 0, 3, 6, 'Prepare hook bank for top-funnel and promo content variants.', 'Dreamlab'],
    ['TSK-3103', 'QA landing form friction on mobile', 'PRJ-2405', 'Landing Page CRO Sprint', 'Website', 'Gusti', 'High', '2026-07-04', 'Not started', 'Healthy', 0, 0, 4, 'Review mobile field spacing, CTA visibility, and sticky submit behavior.', 'Dreamlab'],
    ['TSK-3104', 'Build June non-brand ranking delta sheet', 'PRJ-2402', 'SEO Authority Lift', 'SEO', 'Revi', 'Medium', '2026-07-02', 'Revision', 'Late', 2, 2, 4, 'Compare priority query groups and identify highest-loss URLs.', 'Dreamlab'],
    ['TSK-3105', 'Prepare dormant-lead segment C offer', 'PRJ-2404', 'CRM Winback Flow', 'CRM', 'Aurel', 'High', '2026-07-05', 'Revision', 'Healthy', 0, 5, 5, 'Finalize incentive copy and CTA path for inactive leads older than 60 days.', 'Toribio'],
    ['TSK-3106', 'Design carousel for manufacturing trust proof', 'PRJ-2406', 'Evergreen Brand Education', 'Organic Social', 'Gusti', 'Medium', '2026-07-06', 'Done', 'Healthy', 1, 6, 6, 'Create 6-slide proof carousel using production floor and QC visuals.', 'Toribio'],
    ['TSK-3107', 'Write PDP promo bullets for marketplace bundle', 'PRJ-2407', 'Marketplace Promo Push', 'Marketplace', 'Aurel', 'Medium', '2026-07-07', 'Not started', 'Healthy', 0, 0, 3, 'Reframe benefit-led bullets for promo bundle hero and above-the-fold PDP block.', 'Toribio'],
    ['TSK-3108', 'Compile weekly paid pacing snapshot', 'PRJ-2401', 'Q3 Acquisition Sprint', 'Analytics', 'Zarka', 'Low', '2026-07-01', 'Done', 'Healthy', 0, 3, 3, 'Summarize spend, CPL, CTR, and lead trend by paid platform.', 'Dreamlab'],
    ['TSK-3109', 'Fix schema gaps on high-intent product pages', 'PRJ-2402', 'SEO Authority Lift', 'SEO', 'Revi', 'Urgent', '2026-07-03', 'Working on it', 'Watch', 0, 1, 5, 'Audit product FAQ, breadcrumb, and organization schema on money pages.', 'Dreamlab'],
    ['TSK-3110', 'Review TikTok captions for soft CTA compliance', 'PRJ-2403', 'TikTok Content Batch W2', 'Content', 'Luthfi', 'High', '2026-07-04', 'Revision', 'Healthy', 1, 4, 4, 'Check all caption variants against claim and compliance boundaries.', 'Dreamlab'],
    ['TSK-3111', 'Map CTA placements on landing variant B', 'PRJ-2405', 'Landing Page CRO Sprint', 'Website', 'Gusti', 'High', '2026-07-08', 'Not started', 'Healthy', 0, 0, 4, 'Reposition CTA and trust markers for long-scroll mobile flows.', 'Toribio'],
    ['TSK-3112', 'Prepare winback WA automation copy set', 'PRJ-2404', 'CRM Winback Flow', 'CRM', 'Aurel', 'Medium', '2026-07-06', 'Working on it', 'Healthy', 0, 2, 5, 'Write 3-sequence WhatsApp recovery flow for inactive lead clusters.', 'Toribio'],
    ['TSK-3113', 'Build story sequence for testimonial proof', 'PRJ-2406', 'Evergreen Brand Education', 'Organic Social', 'Luthfi', 'Low', '2026-07-05', 'Done', 'Healthy', 0, 4, 4, 'Create story stack with review proof, swipe CTA, and saved highlights plan.', 'Toribio'],
    ['TSK-3114', 'Sync promo banner claim with legal-safe wording', 'PRJ-2407', 'Marketplace Promo Push', 'Marketplace', 'Aurel', 'Urgent', '2026-07-03', 'Revision', 'Late', 3, 1, 3, 'Revise claim-heavy copy into compliant, conversion-safe marketplace messaging.', 'Toribio'],
    ['TSK-3115', 'Create lead-source dashboard summary card set', 'PRJ-2408', 'June Retrospective Pack', 'Analytics', 'Zarka', 'Low', '2026-07-01', 'Done', 'Healthy', 0, 3, 3, 'Summarize lead-source mix, deal share, and CPL movement for management recap.', 'Dreamlab'],
    ['TSK-3116', 'Audit blog internal links to commercial pages', 'PRJ-2402', 'SEO Authority Lift', 'SEO', 'Revi', 'Medium', '2026-07-09', 'Not started', 'Healthy', 0, 0, 5, 'Improve internal intent flow from educational pages to high-conversion service pages.', 'Dreamlab'],
    ['TSK-3117', 'Design remarketing visual pack for angle B', 'PRJ-2401', 'Q3 Acquisition Sprint', 'Creative', 'Gusti', 'High', '2026-07-04', 'Revision', 'Healthy', 1, 5, 6, 'Produce static remarketing pack aligned to revised offer and social proof.', 'Toribio'],
    ['TSK-3118', 'Update landing FAQ with top sales objections', 'PRJ-2405', 'Landing Page CRO Sprint', 'Website', 'Aurel', 'Medium', '2026-07-10', 'Not started', 'Healthy', 0, 0, 4, 'Translate sales-call objections into FAQ blocks that reduce hesitation.', 'Toribio'],
  ] as const;

  const tasks: MarketingTask[] = taskRows.map((row) => {
    const [id, title, projectId, project, channel, pic, priority, dueDate, status, sla, revisionCount, done, total, brief, brand] = row;
    return {
      id,
      title,
      projectId,
      project,
      channel,
      category: channel.toLowerCase().replaceAll(' ', '_'),
      brand: brand as 'Dreamlab' | 'Toribio',
      assignedBy: headOfMarketing,
      pic,
      reviewer: headOfMarketing,
      priority: priority as TaskPriority,
      startDate: dueDate,
      dueDate,
      status: status as TaskStatus,
      // Task seed yang statusnya Done dianggap selesai PADA due date-nya
      // (on-time), jadi SLA-nya dihitung dari completedAt = dueDate.
      completedAt: status === 'Done' ? `${dueDate}T08:00:00.000Z` : undefined,
      sla: sla as MarketingTask['sla'],
      estimatedHours: total,
      actualHours: done,
      revisionCount,
      checklistDone: done,
      checklistTotal: total,
      brief,
      tags: [channel.toLowerCase().replaceAll(' ', '-'), project.split(' ')[0].toLowerCase()],
      comments: [
        { author: headOfMarketing, body: 'Please tighten the hook and attach proof.', createdAt: '2026-07-01T08:00:00.000Z' },
        { author: pic, body: 'Updated draft uploaded for review.', createdAt: '2026-07-01T10:30:00.000Z' },
      ],
      history: [
        { at: '2026-07-01T07:45:00.000Z', by: headOfMarketing, to: 'Not started', note: 'Task assigned' },
        { at: '2026-07-01T09:15:00.000Z', by: pic, from: 'Not started', to: status, note: 'Status updated' },
      ],
      attachments: [
        { name: 'brief.pdf', type: 'application/pdf', sizeKb: 244 },
        { name: 'proof.png', type: 'image/png', sizeKb: 812 },
      ],
    };
  });

  const profiles: MarketingProfile[] = [
    ['zarka', 'Zarka', 'Video Editor', 'zarka@portoaureon.id', '+62 812-5555-0101', '2024-03-12', 'Handles paid acquisition pacing, creative testing, and spend discipline across Meta and TikTok.', 86, 13, 2, 2, 1, { completion: 81, discipline: 88, quality: 84, productivity: 92 }],
    ['gusti', 'Gusti', 'Digital Marketing Strategy', 'gusti@portoaureon.id', '+62 813-5555-0202', '2023-11-05', 'Owns technical SEO fixes, ranking visibility, and commercial page optimization.', 69, 9, 3, 3, 2, { completion: 64, discipline: 72, quality: 69, productivity: 78 }],
    ['aurel', 'Aurel', 'Content Creator', 'aurel@portoaureon.id', '+62 814-5555-0303', '2024-01-22', 'Produces brand, performance, and review assets for campaign execution.', 88, 15, 2, 2, 1, { completion: 83, discipline: 90, quality: 87, productivity: 94 }],
    ['luthfi', 'Luthfi', 'Packaging Designer', 'luthfi@portoaureon.id', '+62 815-5555-0404', '2024-04-08', 'Creates visual packaging direction and adapts brand assets for campaign surfaces.', 83, 12, 2, 1, 1, { completion: 80, discipline: 85, quality: 82, productivity: 84 }],
    ['rahmat', 'Rahmat', 'IS Manager', 'rahmat@portoaureon.id', '+62 816-5555-0505', '2025-01-15', 'Menangani sistem informasi dan integrasi digital marketing.', 0, 0, 0, 0, 0, { completion: 0, discipline: 0, quality: 0, productivity: 0 }],
    ['revi', headOfMarketing, 'Head of Marketing', 'revi@portoaureon.id', '+62 811-5555-0001', '2022-09-01', 'Owns assignment, approval, escalation control, and KPI governance for the division.', 91, 18, 0, 0, 0, { completion: 92, discipline: 95, quality: 89, productivity: 88 }],
  ].map(([id, name, role, email, phone, joinDate, bio, monthKpi, completed, inProgress, late, overdue, breakdown]) => ({
    id: id as string,
    name: name as string,
    role: role as string,
    email: email as string,
    phone: phone as string,
    joinDate: joinDate as string,
    bio: bio as string,
    monthKpi: monthKpi as number,
    completed: completed as number,
    inProgress: inProgress as number,
    late: late as number,
    overdue: overdue as number,
    breakdown: breakdown as MarketingProfile['breakdown'],
  }));

  const performance: MarketingPerformance[] = profiles
    .filter((profile) => profile.role !== 'Head of Marketing')
    .map((profile) => {
      const assigned = tasks.filter((task) => task.pic === profile.name).length;
      const completed = tasks.filter((task) => task.pic === profile.name && task.status === 'Done').length;
      const late = tasks.filter((task) => task.pic === profile.name && task.sla === 'Late').length;
      const revision = tasks.filter((task) => task.pic === profile.name && task.status === 'Revision').length;
      const onTime = Math.max(completed - late, 0);
      const completionScore = Math.round(clamp((completed / Math.max(assigned, 1)) * 100, 0, 100));
      const disciplineScore = avg(tasks.filter((task) => task.pic === profile.name).map((task) => calcDisciplinePoints(task)));
      const qualityScore = calcQualityScore(disciplineScore, revision);
      const productivityScore = calcProductivityScore(assigned);
      const overallKpi = Math.round(
        completionScore * 0.4 +
        disciplineScore * 0.3 +
        qualityScore * 0.15 +
        productivityScore * 0.15,
      );

      return {
        name: profile.name,
        role: profile.role,
        assigned,
        completed,
        onTime,
        late,
        revision,
        completionScore,
        disciplineScore,
        qualityScore,
        productivityScore,
        overallKpi,
        history: [
          { period: 'W1', kpi: clamp(overallKpi - 8, 0, 100), discipline: clamp(disciplineScore - 6, 0, 100) },
          { period: 'W2', kpi: clamp(overallKpi - 4, 0, 100), discipline: clamp(disciplineScore - 3, 0, 100) },
          { period: 'W3', kpi: clamp(overallKpi - 1, 0, 100), discipline: clamp(disciplineScore - 1, 0, 100) },
          { period: 'W4', kpi: clamp(overallKpi + 2, 0, 100), discipline: clamp(disciplineScore + 2, 0, 100) },
          { period: 'W5', kpi: clamp(overallKpi + 4, 0, 100), discipline: clamp(disciplineScore + 4, 0, 100) },
          { period: 'W6', kpi: overallKpi, discipline: disciplineScore },
        ],
      };
    });

  const notifications: MarketingNotification[] = [
    { id: 'NTF-501', type: 'task_assigned', title: 'New task assigned to Zarka', detail: 'Meta lead gen headline set moved into To Do under Q3 Acquisition Sprint.', actor: headOfMarketing, time: '07:10', unread: true, recipient: 'Zarka' },
    { id: 'NTF-502', type: 'due_today', title: 'Due today: landing QA review', detail: 'QA landing form friction on mobile needs update before 17:00.', actor: 'System', time: '08:45', unread: true, recipient: null },
    { id: 'NTF-503', type: 'task_reviewed', title: 'Revision feedback added', detail: 'Head of Marketing returned TikTok caption batch with one comment thread.', actor: headOfMarketing, time: '09:30', unread: false, recipient: 'Aurel' },
    { id: 'NTF-504', type: 'task_completed', title: 'Task completed by Gusti', detail: 'Carousel proof assets approved and closed in Evergreen Brand Education.', actor: 'Gusti', time: '10:20', unread: false, recipient: headOfMarketing },
    { id: 'NTF-505', type: 'overdue', title: 'Overdue warning: SEO schema update', detail: 'Schema work is still waiting approval and crossed the SLA threshold.', actor: 'System', time: '11:05', unread: true, recipient: 'Revi' },
    { id: 'NTF-506', type: 'comment_added', title: 'Comment added on winback copy', detail: 'Aurel requested one more compliance pass before submission.', actor: 'Aurel', time: '11:40', unread: false, recipient: headOfMarketing },
    { id: 'NTF-507', type: 'task_approved', title: 'Approved by Head of Marketing', detail: 'Weekly paid pacing snapshot moved to Done after review.', actor: headOfMarketing, time: '13:15', unread: false, recipient: 'Zarka' },
    { id: 'NTF-508', type: 'due_tomorrow', title: 'Due tomorrow: promo banner claim review', detail: 'Marketplace promo copy needs approval before asset handoff.', actor: 'System', time: '14:50', unread: true, recipient: null },
  ];

  const settings: MarketingSettings = {
    weights: { completion: 40, discipline: 30, quality: 15, productivity: 15 },
    workingHours: { start: '08:00', end: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    projectCategories: [
      'performance_marketing',
      'organic_growth',
      'content_production',
      'retention_crm',
      'conversion_optimization',
      'brand_building',
      'commercial_activation',
      'analytics_reporting',
    ],
    appearance: {
      departmentDefaultTheme: 'professional',
      allowUserOverride: true,
    },
  };

  const insights = [
    { title: 'AI Weekly Insight', summary: 'Paid and CRM are carrying the strongest completion rate while SEO has the highest revision drag.', impact: 'Positive' as const },
    { title: 'Delivery Risk', summary: 'Tasks with low briefing clarity are the primary cause of review loops and overdue SLA pressure.', impact: 'Negative' as const },
    { title: 'Manager Action', summary: 'Batch approvals at end of day reduce queue switching and improve same-day closure rate.', impact: 'Neutral' as const },
  ];

  return {
    summaryDate: new Date().toISOString(),
    projects,
    tasks,
    performance,
    notifications,
    settings,
    uiPreferences: {},
    profiles,
    insights,
  };
}

@Injectable()
export class MarketingPrototypeService {
  /** Path state untuk unit test (P6.1). TIDAK via konstruktor — Nest DI akan
   * mencoba meng-inject param bertipe `string` dan gagal. Setelah instantiate
   * oleh test, panggil `useStatePath(path)`. Produksi memakai file default. */
  private stateFilePathOverride?: string;

  /** Alihkan file state (hanya untuk unit test). */
  useStatePath(path: string): this {
    this.stateFilePathOverride = path;
    return this;
  }

  /** Path file state. Bisa di-override lewat useStatePath (untuk unit test yang
   * memakai temp file, bukan file produksi — lihat P6.1). */
  private get resolvedStatePath(): string {
    return this.stateFilePathOverride ?? statePath;
  }

  private normalizeState(state: MarketingPrototypeState): MarketingPrototypeState {
    state.settings = {
      ...state.settings,
      projectCategories: state.settings.projectCategories ?? [],
      appearance: {
        departmentDefaultTheme: state.settings.appearance?.departmentDefaultTheme ?? 'professional',
        allowUserOverride: state.settings.appearance?.allowUserOverride ?? true,
      },
    };
    state.uiPreferences = state.uiPreferences ?? {};
    // Ensure every task has a brand field (default to Dreamlab for backward compat),
    // status dinormalisasi ke 4 kanonik, dan completedAt di-backfill untuk task Done.
    state.tasks = state.tasks.map((task) => {
      const next = {
        ...task,
        brand: (task as any).brand ?? 'Dreamlab',
        status: (LEGACY_STATUS_MAP[task.status] ?? task.status) as TaskStatus,
      };
      if (next.status === 'Done' && !next.completedAt) {
        // Migrasi sekali jalan: tarik tanggal selesai dari history (event terakhir
        // ke 'Done'), fallback ke dueDate (perlu review manual oleh admin).
        const doneEvent = [...(next.history ?? [])]
          .reverse()
          .find((h) => h.to === 'Done');
        next.completedAt = doneEvent?.at ?? `${next.dueDate}T08:00:00.000Z`;
      }
      if (next.status !== 'Done') {
        // Task yang tidak lagi Done tidak boleh menyimpan completedAt basi.
        delete next.completedAt;
      }
      return next;
    });
    // Merge seed profiles so new members (Rahmat, Luthfi) appear on existing
    // runtime state (production) WITHOUT resetting the task data.
    const seedProfiles = buildSeedState().profiles;
    const existingIds = new Set(state.profiles.map((p) => p.id));
    const existingNames = new Set(state.profiles.map((p) => normalizeIdentity(p.name)));
    for (const seedProfile of seedProfiles) {
      if (!existingIds.has(seedProfile.id) && !existingNames.has(normalizeIdentity(seedProfile.name))) {
        state.profiles.push(seedProfile);
        existingIds.add(seedProfile.id);
        existingNames.add(normalizeIdentity(seedProfile.name));
      }
    }
    return state;
  }

  private async readState(): Promise<MarketingPrototypeState> {
    try {
      await access(this.resolvedStatePath, fsConstants.F_OK);
      const raw = await readFile(this.resolvedStatePath, 'utf8');
      return this.normalizeState(JSON.parse(raw) as MarketingPrototypeState);
    } catch {
      const seed = buildSeedState();
      await this.writeState(seed);
      return seed;
    }
  }

  private async writeState(state: MarketingPrototypeState) {
    await mkdir(dirname(this.resolvedStatePath), { recursive: true });
    await writeFile(this.resolvedStatePath, JSON.stringify(state, null, 2), 'utf8');
  }

  /** Rantai serialisasi untuk updateState — mencegah kehilangan data.
   * updateState = read → mutate → write. Tanpa serialisasi, dua request PATCH
   * yang datang hampir bersamaan membaca snapshot yang SAMA, lalu write yang
   * terakhir menimpa perubahan yang pertama → task bisa kembali ke status lama
   * (mis. "Done" yang baru disimpan tiba-tiba balik "Not started"), termasuk
   * history-nya ikut hilang. Queue ini memastikan hanya satu read-modify-write
   * berjalan pada satu waktu. */
  private stateWriteChain: Promise<unknown> = Promise.resolve();

  private async updateState(mutator: (state: MarketingPrototypeState) => MarketingPrototypeState | void) {
    const operation = this.stateWriteChain.then(async () => {
      const state = this.normalizeState(await this.readState());
      const result = mutator(state);
      const next = (result ?? state) as MarketingPrototypeState;
      await this.writeState(next);
      return next;
    });
    // Jangan biarkan satu kegagalan memblokir operasi berikutnya.
    this.stateWriteChain = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  private resolveViewer(viewer?: ViewerContext): ViewerScope {
    const email = normalizeIdentity(viewer?.email);
    const fullName = normalizeIdentity(viewer?.fullName);
    const roles = viewer?.roles ?? [];

    let prototypeName: string | null = null;
    if (viewerAliases.revi.includes(fullName) || email === 'revita@nexerp.id') prototypeName = 'Revi';
    else if (viewerAliases.zarka.includes(fullName) || email === 'zarkasi@dreamlab.com') prototypeName = 'Zarka';
    else if (viewerAliases.gusti.includes(fullName) || email === 'gusti@dreamlab.com') prototypeName = 'Gusti';
    else if (viewerAliases.aurel.includes(fullName)) prototypeName = 'Aurel';
    else if (viewerAliases.luthfi.includes(fullName)) prototypeName = 'Luthfi';
    else if (viewerAliases.rahmat.includes(fullName)) prototypeName = 'Rahmat';
    else if (roles.some((role) => managerRoleSet.has(role))) prototypeName = headOfMarketing;

    const isManager =
      email === 'revita@nexerp.id' ||
      roles.some((role) => managerRoleSet.has(role)) ||
      email === 'zaki@dreamlab.com' ||
      email === 'admin@dreamlab.com';

    const aliasLookup: Record<string, string[]> = {
      Revi: viewerAliases.revi,
      Zarka: viewerAliases.zarka,
      Gusti: viewerAliases.gusti,
      Aurel: viewerAliases.aurel,
      Luthfi: viewerAliases.luthfi,
      Rahmat: viewerAliases.rahmat,
    };
    const aliases = prototypeName ? [prototypeName, ...(aliasLookup[prototypeName] ?? [])] : [];

    return {
      isManager,
      prototypeName,
      aliases: Array.from(new Set(aliases.map((value) => normalizeIdentity(value)).filter(Boolean))),
    };
  }

  private isVisibleToViewer(task: MarketingTask, scope: ViewerScope) {
    if (scope.isManager) return true;
    if (!scope.aliases.length) return false;
    return [task.pic, task.reviewer, task.assignedBy].some((value) =>
      scope.aliases.includes(normalizeIdentity(value)),
    );
  }

  private isNotificationVisible(notification: MarketingNotification, scope: ViewerScope) {
    if (scope.isManager) return true;
    if (!scope.aliases.length) return false;
    if (!notification.recipient) return true;
    return scope.aliases.includes(normalizeIdentity(notification.recipient));
  }

  private ensureManager(viewer?: ViewerContext) {
    const scope = this.resolveViewer(viewer);
    if (!scope.isManager) {
      throw new ForbiddenException('Only Head of Marketing can manage task registry changes');
    }
    return scope;
  }

  private viewerPreferenceKey(viewer?: ViewerContext) {
    return (
      viewer?.id ??
      normalizeIdentity(viewer?.email) ??
      normalizeIdentity(viewer?.fullName) ??
      'anonymous'
    );
  }

  private pushNotification(
    state: MarketingPrototypeState,
    notification: Omit<MarketingNotification, 'id' | 'time'>,
  ) {
    state.notifications.unshift({
      ...notification,
      // randomUUID() — id unik global, hindari collide (sebelumnya Math.random()
      // 4 digit bisa bertabrakan dalam volume tinggi).
      id: `NTF-${randomUUID()}`,
      time: timeStampLabel(),
    });
  }

  private mapTask(task: MarketingTask, settings: MarketingSettings) {
    const discipline = calcDisciplinePoints(task);
    const quality = calcQualityScore(discipline, task.revisionCount);
    const productivity = calcProductivityScore(1);
    const completion = Math.round((task.checklistDone / Math.max(task.checklistTotal, 1)) * 100);
    const overall = Math.round(
      completion * (settings.weights.completion / 100) +
      discipline * (settings.weights.discipline / 100) +
      quality * (settings.weights.quality / 100) +
      productivity * (settings.weights.productivity / 100),
    );

    return {
      ...task,
      sla: deriveSla(task),
      disciplinePoints: discipline,
      qualityScore: quality,
      productivityScore: productivity,
      completionScore: completion,
      overallKpi: overall,
    };
  }

  async getBundle(viewer?: ViewerContext) {
    const state = await this.readState();
    const scope = this.resolveViewer(viewer);
    const visibleTasks = state.tasks.filter((task) => this.isVisibleToViewer(task, scope));
    const tasks = visibleTasks.map((task) => this.mapTask(task, state.settings));
    const visibleProjectIds = new Set(tasks.map((task) => task.projectId));
    const projects = state.projects
      .filter((project) => scope.isManager || visibleProjectIds.has(project.id))
      .map((project) => ({
        ...project,
        openTasks: tasks.filter((task) => task.projectId === project.id && task.status !== 'Done').length,
        pendingApproval: tasks.filter((task) => task.projectId === project.id && task.status === 'Revision').length,
      }));
    const notifications = state.notifications.filter((notification) => this.isNotificationVisible(notification, scope));
    const performance = state.performance.map((member) => {
      const memberTasks = tasks.filter((task) => canonicalMember(task.pic) === member.name);
      const taskCount = memberTasks.length;
      const completedTasks = memberTasks.filter((task) => task.status === 'Done');
      const completed = completedTasks.length;
      // late (KPI) = HANYA task Done yang selesai LEWAT due (completedAt > dueDate).
      // Open task yang overdue TIDAK masuk ke sini (dipisah ke `overdue`).
      const late = completedTasks.filter(
        (task) =>
          task.completedAt &&
          calendarDayDiff(parseLocalDate(task.completedAt.slice(0, 10)), parseLocalDate(task.dueDate)) > 0,
      ).length;
      const overdue = memberTasks.filter(
        (task) => task.status !== 'Done' && calendarDayDiff(new Date(), parseLocalDate(task.dueDate)) > 0,
      ).length;
      const revision = memberTasks.filter((task) => task.status === 'Revision').length;
      const discipline = avg(memberTasks.map((task) => task.disciplinePoints));
      const quality = avg(memberTasks.map((task) => task.qualityScore));
      const productivity = avg(memberTasks.map((task) => task.productivityScore));
      const completion = taskCount > 0 ? Math.round((completed / taskCount) * 100) : 0;
      const overall = Math.round(
        completion * (state.settings.weights.completion / 100) +
        discipline * (state.settings.weights.discipline / 100) +
        quality * (state.settings.weights.quality / 100) +
        productivity * (state.settings.weights.productivity / 100),
      );
      return {
        ...member,
        assigned: taskCount,
        completed,
        late,
        overdue,
        revision,
        onTime: Math.max(completed - late, 0),
        completionScore: completion,
        disciplineScore: discipline,
        qualityScore: quality,
        productivityScore: productivity,
        overallKpi: overall,
      };
    });

    // ── Brand-specific KPI helper ──
    const calcBrandKpi = (profileName: string, brandFilter: 'Dreamlab' | 'Toribio') => {
      const brandTasks = tasks.filter((task) => canonicalMember(task.pic) === profileName && task.brand === brandFilter);
      const brandTotal = brandTasks.length;
      const brandDone = brandTasks.filter((task) => task.status === 'Done').length;
      // brandLate = hanya task Done yang selesai lewat due (late completion),
      // bukan open task yang overdue.
      const brandLate = brandTasks.filter(
        (task) =>
          task.status === 'Done' &&
          task.completedAt &&
          calendarDayDiff(parseLocalDate(task.completedAt.slice(0, 10)), parseLocalDate(task.dueDate)) > 0,
      ).length;
      const brandInProgress = brandTasks.filter((task) => task.status !== 'Done').length;
      const brandOnTime = Math.max(brandDone - brandLate, 0);
      const brandProgress = brandTotal > 0 ? Math.round((brandDone / brandTotal) * 100) : 0;
      return { total: brandTotal, done: brandDone, late: brandLate, inProgress: brandInProgress, onTime: brandOnTime, progress: brandProgress };
    };

    const summary = {
      activeProjects: projects.filter((project) => project.status !== 'Completed').length,
      openTasks: tasks.filter((task) => task.status !== 'Done').length,
      waitingApproval: tasks.filter((task) => task.status === 'Revision').length,
      averageKpi: avg(performance.map((member) => member.overallKpi)),
    };

    return {
      viewer: {
        name: scope.prototypeName,
        isManager: scope.isManager,
      },
      summary,
      projects,
      tasks,
      performance,
      notifications,
      settings: state.settings,
      profiles: (scope.isManager
        ? state.profiles
        : state.profiles.filter((profile) =>
            tasks.some((task) => canonicalMember(task.pic) === profile.name),
          )
      ).map((profile) => ({
        ...profile,
        monthKpi: performance.find((member) => member.name === profile.name)?.overallKpi ?? profile.monthKpi,
        brandKpi: {
          dreamlab: calcBrandKpi(profile.name, 'Dreamlab'),
          toribio: calcBrandKpi(profile.name, 'Toribio'),
        },
      })),
      insights: state.insights,
      reports: {
        averageKpi: summary.averageKpi,
          teamSize: scope.isManager ? state.profiles.length : performance.length,
          kpiHistory: performance.map((member) => ({
            name: member.name,
            history: member.history,
        })),
      },
    };
  }

  async resetState(viewer?: ViewerContext) {
    this.ensureManager(viewer);
    const seed = buildSeedState();
    await this.writeState(seed);
    return seed;
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
      notifications: bundle.notifications.slice(0, 6),
      insights: bundle.insights,
    };
  }

  async getProjects(viewer?: ViewerContext) {
    const bundle = await this.getBundle(viewer);
    return bundle.projects;
  }

  async createProject(viewer: ViewerContext | undefined, input: MarketingProjectInput) {
    const scope = this.ensureManager(viewer);
    const next = await this.updateState((state) => {
      const id = input.id ?? `PRJ-${Math.floor(Math.random() * 9000) + 1000}`;
      state.projects.unshift({
        id,
        name: input.name ?? 'Untitled project',
        channel: input.channel ?? 'General',
        category: input.category ?? 'general_operations',
        owner: input.owner ?? (scope.prototypeName ?? headOfMarketing),
        start: input.start ?? toLocalDateString(),
        deadline: input.deadline ?? toLocalDateString(),
        progress: clamp(Number(input.progress ?? 0), 0, 100),
        openTasks: 0,
        pendingApproval: 0,
        status: (input.status ?? 'On Track') as MarketingProject['status'],
        summary: input.summary ?? '',
        blockers: input.blockers ?? [],
      });
    });
    return next.projects[0];
  }

  async updateProject(viewer: ViewerContext | undefined, id: string, input: MarketingProjectInput) {
    this.ensureManager(viewer);
    const next = await this.updateState((state) => {
      const project = state.projects.find((item) => item.id === id);
      if (!project) return;
      Object.assign(project, {
        ...input,
        category: input.category ?? project.category,
        progress:
          input.progress === undefined
            ? project.progress
            : clamp(Number(input.progress), 0, 100),
      });
    });
    return next.projects.find((project) => project.id === id) ?? null;
  }

  async deleteProject(viewer: ViewerContext | undefined, id: string) {
    this.ensureManager(viewer);
    const next = await this.updateState((state) => {
      const fallback = state.projects.find((project) => project.id !== id)?.id;
      if (fallback) {
        state.tasks = state.tasks.map((task) =>
          task.projectId === id
            ? {
                ...task,
                projectId: fallback,
                project: state.projects.find((project) => project.id === fallback)?.name ?? task.project,
              }
            : task,
        );
      }
      state.projects = state.projects.filter((project) => project.id !== id);
    });
    return !next.projects.some((project) => project.id === id);
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
    const bundle = await this.getBundle(viewer);
    return bundle.notifications;
  }

  async getSettings() {
    const state = await this.readState();
    return state.settings;
  }

  async updateSettings(viewer: ViewerContext | undefined, input: Partial<MarketingSettings>) {
    this.ensureManager(viewer);
    const next = await this.updateState((state) => {
      state.settings = {
        ...state.settings,
        ...input,
        weights: {
          ...state.settings.weights,
          ...(input.weights ?? {}),
        },
        workingHours: {
          ...state.settings.workingHours,
          ...(input.workingHours ?? {}),
        },
        appearance: {
          ...state.settings.appearance,
          ...(input.appearance ?? {}),
        },
      };
    });
    return next.settings;
  }

  async getUiThemePreference(viewer: ViewerContext | undefined) {
    const state = await this.readState();
    const key = this.viewerPreferenceKey(viewer);
    const scope = this.resolveViewer(viewer);
    const preference = state.uiPreferences?.[key] ?? 'follow-department';

    return {
      preference,
      departmentDefaultTheme: state.settings.appearance.departmentDefaultTheme,
      allowUserOverride: state.settings.appearance.allowUserOverride,
      canManageAppearance: scope.isManager,
    };
  }

  async updateUiThemePreference(
    viewer: ViewerContext | undefined,
    input: { preference?: 'professional' | 'marketing-aesthetic' | 'follow-department' },
  ) {
    const allowed = new Set(['professional', 'marketing-aesthetic', 'follow-department']);
    const preference = input.preference ?? 'follow-department';

    if (!allowed.has(preference)) {
      throw new BadRequestException('Unsupported UI theme preference');
    }

    const key = this.viewerPreferenceKey(viewer);
    const next = await this.updateState((state) => {
      state.uiPreferences = state.uiPreferences ?? {};
      state.uiPreferences[key] = preference;
    });

    return {
      preference: next.uiPreferences?.[key] ?? 'follow-department',
      departmentDefaultTheme: next.settings.appearance.departmentDefaultTheme,
      allowUserOverride: next.settings.appearance.allowUserOverride,
      canManageAppearance: this.resolveViewer(viewer).isManager,
    };
  }

  async updateUiThemeDefault(
    viewer: ViewerContext | undefined,
    input: {
      departmentDefaultTheme?: 'professional' | 'marketing-aesthetic';
      allowUserOverride?: boolean;
    },
  ) {
    const scope = this.ensureManager(viewer);
    const allowed = new Set(['professional', 'marketing-aesthetic']);
    const departmentDefaultTheme = input.departmentDefaultTheme;

    if (departmentDefaultTheme && !allowed.has(departmentDefaultTheme)) {
      throw new BadRequestException('Unsupported department default UI theme');
    }

    const next = await this.updateState((state) => {
      state.settings.appearance = {
        ...state.settings.appearance,
        ...(departmentDefaultTheme ? { departmentDefaultTheme } : {}),
        ...(typeof input.allowUserOverride === 'boolean'
          ? { allowUserOverride: input.allowUserOverride }
          : {}),
      };
    });

    const key = this.viewerPreferenceKey(viewer);

    return {
      preference: next.uiPreferences?.[key] ?? 'follow-department',
      departmentDefaultTheme: next.settings.appearance.departmentDefaultTheme,
      allowUserOverride: next.settings.appearance.allowUserOverride,
      canManageAppearance: scope.isManager,
    };
  }

  async getProfile(viewer: ViewerContext | undefined, id: string) {
    const bundle = await this.getBundle(viewer);
    return bundle.profiles.find((profile) => profile.id === id) ?? null;
  }

  async updateTaskStatus(viewer: ViewerContext | undefined, id: string, status: TaskStatus, note = 'Status updated') {
    const scope = this.resolveViewer(viewer);
    const next = await this.updateState((state) => {
      const task = state.tasks.find((item) => item.id === id);
      if (!task || !this.isVisibleToViewer(task, scope)) return;
      // Normalisasi status (terima status lama 7-kanonik untuk kompatibilitas).
      const canonicalStatus = (LEGACY_STATUS_MAP[status] ?? status) as TaskStatus;
      if (!isCanonicalStatus(canonicalStatus) || canonicalStatus === task.status) return;
      const actor = scope.prototypeName ?? headOfMarketing;
      task.history.push({
        at: new Date().toISOString(),
        by: actor,
        from: task.status,
        to: canonicalStatus,
        note,
      });
      task.status = canonicalStatus;
      if (canonicalStatus === 'Done') {
        // completedAt = saat task BENAR-BENAR selesai — dasar SLA/KPI on-time
        // (task yang selesai tepat waktu di masa lalu tidak boleh dinilai Late).
        task.completedAt = new Date().toISOString();
        task.checklistDone = task.checklistTotal;
        this.pushNotification(state, {
          type: 'task_completed',
          title: `Task completed by ${task.pic}`,
          detail: `${task.title} has been marked Done and is waiting review closure.`,
          actor,
          unread: true,
          recipient: task.reviewer,
        });
      } else if (task.completedAt) {
        // Pindah keluar dari Done → completedAt basi dihapus (tidak boleh
        // dianggap selesai tepat waktu).
        delete task.completedAt;
      }
      task.sla = deriveSla(task);
      if (canonicalStatus === 'Revision') {
        this.pushNotification(state, {
          type: 'task_reviewed',
          title: `Revision requested on ${task.title}`,
          detail: `${task.reviewer} requested revision on ${task.title}.`,
          actor,
          unread: true,
          recipient: task.pic,
        });
      }
    });
    return next.tasks.find((task) => task.id === id) ?? null;
  }

  async updateTask(viewer: ViewerContext | undefined, id: string, input: MarketingTaskInput) {
    const scope = this.resolveViewer(viewer);
    const next = await this.updateState((state) => {
      const task = state.tasks.find((item) => item.id === id);
      if (!task || !this.isVisibleToViewer(task, scope)) return;
      const actor = scope.prototypeName ?? headOfMarketing;
      const before = { ...task };
      const note: string[] = [];

      // Whitelist field yang boleh di-update manager. id/sla/history/comments/
      // assignedBy TIDAK boleh ditimpa lewat input (BUG-S2/P4.2).
      const ALLOWED: Array<keyof MarketingTaskInput> = [
        'title',
        'projectId',
        'project',
        'channel',
        'category',
        'brand',
        'pic',
        'reviewer',
        'priority',
        'startDate',
        'dueDate',
        'estimatedHours',
        'actualHours',
        'revisionCount',
        'checklistDone',
        'checklistTotal',
        'brief',
        'tags',
        'attachments',
      ];

      if (scope.isManager) {
        for (const key of ALLOWED) {
          const value = input[key as keyof MarketingTaskInput];
          if (value !== undefined) (task as any)[key] = value;
        }
        if (input.pic && input.pic !== before.pic) {
          this.pushNotification(state, {
            type: 'task_assigned',
            title: `New task assigned to ${task.pic}`,
            detail: `${task.title} is now assigned under ${task.project}.`,
            actor,
            unread: true,
            recipient: task.pic,
          });
        }
        note.push('Task updated');
      } else {
        // Non-manager: hanya bisa update startDate dan status
        // dueDate, pic, reviewer, priority dll TIDAK bisa diubah
        if (input.startDate !== undefined) {
          task.startDate = input.startDate;
          note.push('startDate updated');
        }
        if (input.status !== undefined && input.status !== before.status) {
          const canonicalStatus = (LEGACY_STATUS_MAP[input.status] ?? input.status) as TaskStatus;
          if (isCanonicalStatus(canonicalStatus)) {
            task.status = canonicalStatus;
            note.push(`status: ${before.status} -> ${canonicalStatus}`);
          }
        }
        if (note.length === 0) return; // nothing to update
      }

      // Sinkronkan completedAt dengan status akhir (via status yang di-set lewat
      // PATCH body maupun transisi Done di blok atas).
      if (task.status === 'Done') {
        if (!task.completedAt) task.completedAt = new Date().toISOString();
        task.checklistDone = task.checklistTotal;
      } else if (task.completedAt) {
        delete task.completedAt;
      }

      task.sla = deriveSla(task);
      task.history.push({
        at: new Date().toISOString(),
        by: actor,
        from: before.status,
        to: task.status,
        note: note.join('; ') || 'No changes',
      });
    });
    return next.tasks.find((task) => task.id === id) ?? null;
  }

  async deleteTask(viewer: ViewerContext | undefined, id: string) {
    this.ensureManager(viewer);
    const next = await this.updateState((state) => {
      state.tasks = state.tasks.filter((task) => task.id !== id);
    });
    return !next.tasks.some((task) => task.id === id);
  }

  async addTaskComment(viewer: ViewerContext | undefined, id: string, author: string, body: string) {
    const scope = this.resolveViewer(viewer);
    const next = await this.updateState((state) => {
      const task = state.tasks.find((item) => item.id === id);
      if (!task || !this.isVisibleToViewer(task, scope)) return;
      const actor = scope.prototypeName ?? author;
      task.comments.push({ author: actor, body, createdAt: new Date().toISOString() });
      task.history.push({
        at: new Date().toISOString(),
        by: actor,
        to: task.status,
        note: 'Comment added',
      });
      this.pushNotification(state, {
        type: 'comment_added',
        title: `Comment added on ${task.title}`,
        detail: `${actor} added a new comment on ${task.title}.`,
        actor,
        unread: true,
        recipient: actor === task.pic ? task.reviewer : task.pic,
      });
    });
    return next.tasks.find((task) => task.id === id) ?? null;
  }

  async markAllNotificationsRead(viewer?: ViewerContext) {
    const scope = this.resolveViewer(viewer);
    const next = await this.updateState((state) => {
      state.notifications = state.notifications.map((notification) => ({
        ...notification,
        unread: this.isNotificationVisible(notification, scope) ? false : notification.unread,
      }));
    });
    return next.notifications.filter((notification) => this.isNotificationVisible(notification, scope));
  }

  async createTask(viewer: ViewerContext | undefined, input: Partial<MarketingTask>) {
    // Semua member (termasuk DIGIMAR) boleh membuat task sendiri — asalkan
    // pic/assignee = dirinya sendiri (di bawah). Manager bebas menugaskan ke
    // siapa pun. Penerjemahan: "semua member bisa input task".
    const scope = this.resolveViewer(viewer);
    if (!scope.isManager && !scope.prototypeName) {
      throw new ForbiddenException('Only team members can create tasks');
    }
    const next = await this.updateState((state) => {
      // Id server adalah otoritas. Id `local-*` dari Board / id yang sudah ada
      // di state DIBUANG, diganti id server (Board mengganti id lokal dengan id
      // dari respons). Ini mencegah duplikat/penimpaan task (BUG-S3/P4.3).
      let id = input.id;
      if (!id || id.startsWith('local-') || state.tasks.some((t) => t.id === id)) {
        do {
          id = `TSK-${Math.floor(Math.random() * 9000) + 1000}`;
        } while (state.tasks.some((t) => t.id === id));
      }
      const actor = scope.prototypeName ?? headOfMarketing;
      // Project bisa kosong (state produksi tanpa projects) — jangan sampai
      // `project.id` melempar undefined (bug saat createTask dengan projects []).
      const project = state.projects.find((item) => item.id === input.projectId) ?? state.projects[0];
      const projectId = input.projectId ?? project?.id ?? 'PRJ-LOCAL';
      const projectName = input.project ?? project?.name ?? 'Marketing';
      // Non-manager: assignee WAJIB dirinya sendiri (tidak bisa menugaskan ke
      // orang lain); assignedBy = dirinya; reviewer dipaksa ke manager supaya
      // task baru punya peninjau yang jelas & tidak hilang dari view manager.
      let assignee = input.pic ?? actor;
      if (!scope.isManager && !scope.aliases.includes(normalizeIdentity(assignee))) {
        throw new ForbiddenException('Members can only create tasks assigned to themselves');
      }
      const status = (LEGACY_STATUS_MAP[input.status ?? 'Not started'] ?? 'Not started') as TaskStatus;
      state.tasks.unshift({
        id,
        title: input.title ?? 'Untitled task',
        projectId,
        project: projectName,
        channel: input.channel ?? 'General',
        category: input.category ?? (input.channel ?? 'General').toLowerCase().replaceAll(' ', '_'),
        brand: (input.brand ?? 'Dreamlab') as 'Dreamlab' | 'Toribio',
        assignedBy: scope.isManager ? (input.assignedBy ?? actor) : actor,
        pic: assignee,
        reviewer: scope.isManager ? (input.reviewer ?? headOfMarketing) : headOfMarketing,
        priority: (input.priority ?? 'Medium') as TaskPriority,
        startDate: input.startDate ?? toLocalDateString(),
        dueDate: input.dueDate ?? toLocalDateString(),
        status,
        sla: (input.sla ?? 'Healthy') as MarketingTask['sla'],
        estimatedHours: input.estimatedHours ?? 4,
        actualHours: input.actualHours ?? 0,
        revisionCount: input.revisionCount ?? 0,
        checklistDone: input.checklistDone ?? 0,
        checklistTotal: input.checklistTotal ?? 4,
        brief: input.brief ?? '',
        tags: input.tags ?? [],
        comments: [],
        history: [
          {
            at: new Date().toISOString(),
            by: actor,
            to: status,
            note: 'Task created',
          },
        ],
        attachments: input.attachments ?? [],
      });
      this.pushNotification(state, {
        type: 'task_assigned',
        title: `New task assigned to ${assignee}`,
        detail: `${input.title ?? 'Untitled task'} was assigned under ${projectName}.`,
        actor,
        unread: true,
        recipient: assignee,
      });
    });
    return next.tasks[0];
  }
}
