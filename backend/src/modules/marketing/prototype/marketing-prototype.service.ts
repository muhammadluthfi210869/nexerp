import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { dirname, join } from 'path';

type TaskStatus =
  | 'Backlog'
  | 'To Do'
  | 'In Progress'
  | 'Waiting Approval'
  | 'Revision'
  | 'Done'
  | 'Cancelled';

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
  assignedBy: string;
  pic: string;
  reviewer: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  sla: 'Healthy' | 'Watch' | 'Late';
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
];

const managerRoleSet = new Set(['SUPER_ADMIN', 'HEAD_OPS', 'MARKETING']);
const viewerAliases: Record<string, string[]> = {
  revi: ['revi', 'revita', 'fadhilah', 'nisa'],
  zarka: ['zarka', 'zarkasi'],
  gusti: ['gusti'],
  aurel: ['aurel'],
  luthfi: ['luthfi'],
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

function daysDiff(left: Date, right: Date) {
  const ms = left.getTime() - right.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function calcDisciplinePoints(task: MarketingTask) {
  if (task.status === 'Cancelled') return 0;
  const today = new Date();
  const due = new Date(task.dueDate);
  const delta = daysDiff(today, due);
  if (task.status === 'Done' || task.status === 'Waiting Approval') {
    if (delta <= -1) return 100;
    if (delta === 0) return 95;
    if (delta === 1) return 80;
    if (delta === 2) return 70;
    if (delta === 3) return 60;
    return 40;
  }
  if (delta <= 0) return 100;
  if (delta === 1) return 80;
  if (delta === 2) return 70;
  if (delta === 3) return 60;
  if (delta > 3) return 40;
  return 0;
}

function calcQualityScore(discipline: number, revisionCount: number) {
  const revisionRate = clamp(revisionCount / 3, 0, 1);
  return Math.round(clamp(discipline * 0.7 + (1 - revisionRate) * 30, 0, 100));
}

function calcProductivityScore(assigned: number) {
  const days = workingDaysInMonth();
  return Math.round(clamp(((assigned / Math.max(days, 1)) / 3) * 100, 0, 100));
}

function deriveSla(task: MarketingTask) {
  const discipline = calcDisciplinePoints(task);
  return discipline >= 95 ? 'Healthy' : discipline >= 70 ? 'Watch' : 'Late';
}

function normalizeIdentity(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
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

  const taskRows = [
    ['TSK-3101', 'Refresh Meta lead gen headline set', 'PRJ-2401', 'Q3 Acquisition Sprint', 'Meta Ads', 'Zarka', 'Urgent', '2026-07-02', 'Waiting Approval', 'Watch', 1, 4, 5, 'Deliver 5 primary headline variations with pain-point and proof angles.'],
    ['TSK-3102', 'Draft TikTok hook bank for serum angle', 'PRJ-2403', 'TikTok Content Batch W2', 'Content', 'Aurel', 'High', '2026-07-03', 'In Progress', 'Healthy', 0, 3, 6, 'Prepare hook bank for top-funnel and promo content variants.'],
    ['TSK-3103', 'QA landing form friction on mobile', 'PRJ-2405', 'Landing Page CRO Sprint', 'Website', 'Gusti', 'High', '2026-07-04', 'To Do', 'Healthy', 0, 0, 4, 'Review mobile field spacing, CTA visibility, and sticky submit behavior.'],
    ['TSK-3104', 'Build June non-brand ranking delta sheet', 'PRJ-2402', 'SEO Authority Lift', 'SEO', 'Revi', 'Medium', '2026-07-02', 'Revision', 'Late', 2, 2, 4, 'Compare priority query groups and identify highest-loss URLs.'],
    ['TSK-3105', 'Prepare dormant-lead segment C offer', 'PRJ-2404', 'CRM Winback Flow', 'CRM', 'Aurel', 'High', '2026-07-05', 'Waiting Approval', 'Healthy', 0, 5, 5, 'Finalize incentive copy and CTA path for inactive leads older than 60 days.'],
    ['TSK-3106', 'Design carousel for manufacturing trust proof', 'PRJ-2406', 'Evergreen Brand Education', 'Organic Social', 'Gusti', 'Medium', '2026-07-06', 'Done', 'Healthy', 1, 6, 6, 'Create 6-slide proof carousel using production floor and QC visuals.'],
    ['TSK-3107', 'Write PDP promo bullets for marketplace bundle', 'PRJ-2407', 'Marketplace Promo Push', 'Marketplace', 'Aurel', 'Medium', '2026-07-07', 'Backlog', 'Healthy', 0, 0, 3, 'Reframe benefit-led bullets for promo bundle hero and above-the-fold PDP block.'],
    ['TSK-3108', 'Compile weekly paid pacing snapshot', 'PRJ-2401', 'Q3 Acquisition Sprint', 'Analytics', 'Zarka', 'Low', '2026-07-01', 'Done', 'Healthy', 0, 3, 3, 'Summarize spend, CPL, CTR, and lead trend by paid platform.'],
    ['TSK-3109', 'Fix schema gaps on high-intent product pages', 'PRJ-2402', 'SEO Authority Lift', 'SEO', 'Revi', 'Urgent', '2026-07-03', 'In Progress', 'Watch', 0, 1, 5, 'Audit product FAQ, breadcrumb, and organization schema on money pages.'],
    ['TSK-3110', 'Review TikTok captions for soft CTA compliance', 'PRJ-2403', 'TikTok Content Batch W2', 'Content', 'Luthfi', 'High', '2026-07-04', 'Waiting Approval', 'Healthy', 1, 4, 4, 'Check all caption variants against claim and compliance boundaries.'],
    ['TSK-3111', 'Map CTA placements on landing variant B', 'PRJ-2405', 'Landing Page CRO Sprint', 'Website', 'Gusti', 'High', '2026-07-08', 'To Do', 'Healthy', 0, 0, 4, 'Reposition CTA and trust markers for long-scroll mobile flows.'],
    ['TSK-3112', 'Prepare winback WA automation copy set', 'PRJ-2404', 'CRM Winback Flow', 'CRM', 'Aurel', 'Medium', '2026-07-06', 'In Progress', 'Healthy', 0, 2, 5, 'Write 3-sequence WhatsApp recovery flow for inactive lead clusters.'],
    ['TSK-3113', 'Build story sequence for testimonial proof', 'PRJ-2406', 'Evergreen Brand Education', 'Organic Social', 'Luthfi', 'Low', '2026-07-05', 'Done', 'Healthy', 0, 4, 4, 'Create story stack with review proof, swipe CTA, and saved highlights plan.'],
    ['TSK-3114', 'Sync promo banner claim with legal-safe wording', 'PRJ-2407', 'Marketplace Promo Push', 'Marketplace', 'Aurel', 'Urgent', '2026-07-03', 'Revision', 'Late', 3, 1, 3, 'Revise claim-heavy copy into compliant, conversion-safe marketplace messaging.'],
    ['TSK-3115', 'Create lead-source dashboard summary card set', 'PRJ-2408', 'June Retrospective Pack', 'Analytics', 'Zarka', 'Low', '2026-07-01', 'Done', 'Healthy', 0, 3, 3, 'Summarize lead-source mix, deal share, and CPL movement for management recap.'],
    ['TSK-3116', 'Audit blog internal links to commercial pages', 'PRJ-2402', 'SEO Authority Lift', 'SEO', 'Revi', 'Medium', '2026-07-09', 'To Do', 'Healthy', 0, 0, 5, 'Improve internal intent flow from educational pages to high-conversion service pages.'],
    ['TSK-3117', 'Design remarketing visual pack for angle B', 'PRJ-2401', 'Q3 Acquisition Sprint', 'Creative', 'Gusti', 'High', '2026-07-04', 'Waiting Approval', 'Healthy', 1, 5, 6, 'Produce static remarketing pack aligned to revised offer and social proof.'],
    ['TSK-3118', 'Update landing FAQ with top sales objections', 'PRJ-2405', 'Landing Page CRO Sprint', 'Website', 'Aurel', 'Medium', '2026-07-10', 'Backlog', 'Healthy', 0, 0, 4, 'Translate sales-call objections into FAQ blocks that reduce hesitation.'],
  ] as const;

  const tasks: MarketingTask[] = taskRows.map((row) => {
    const [id, title, projectId, project, channel, pic, priority, dueDate, status, sla, revisionCount, done, total, brief] = row;
    return {
      id,
      title,
      projectId,
      project,
      channel,
      category: channel.toLowerCase().replaceAll(' ', '_'),
      assignedBy: headOfMarketing,
      pic,
      reviewer: headOfMarketing,
      priority: priority as TaskPriority,
      startDate: dueDate,
      dueDate,
      status: status as TaskStatus,
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
        { at: '2026-07-01T07:45:00.000Z', by: headOfMarketing, to: 'To Do', note: 'Task assigned' },
        { at: '2026-07-01T09:15:00.000Z', by: pic, from: 'To Do', to: status, note: 'Status updated' },
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
      const disciplineScore = avg(tasks.filter((task) => task.pic === profile.name).map(calcDisciplinePoints));
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
    return state;
  }

  private async readState(): Promise<MarketingPrototypeState> {
    try {
      await access(statePath, fsConstants.F_OK);
      const raw = await readFile(statePath, 'utf8');
      return this.normalizeState(JSON.parse(raw) as MarketingPrototypeState);
    } catch {
      const seed = buildSeedState();
      await this.writeState(seed);
      return seed;
    }
  }

  private async writeState(state: MarketingPrototypeState) {
    await mkdir(dirname(statePath), { recursive: true });
    await writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');
  }

  private async updateState(mutator: (state: MarketingPrototypeState) => MarketingPrototypeState | void) {
    const state = this.normalizeState(await this.readState());
    const result = mutator(state);
    const next = (result ?? state) as MarketingPrototypeState;
    await this.writeState(next);
    return next;
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
      id: `NTF-${Math.floor(Math.random() * 9000) + 1000}`,
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
        openTasks: tasks.filter((task) => task.projectId === project.id && !['Done', 'Cancelled'].includes(task.status)).length,
        pendingApproval: tasks.filter((task) => task.projectId === project.id && task.status === 'Waiting Approval').length,
      }));
    const notifications = state.notifications.filter((notification) => this.isNotificationVisible(notification, scope));
    const performance = state.performance.map((member) => {
      const taskCount = tasks.filter((task) => task.pic === member.name).length;
      const completed = tasks.filter((task) => task.pic === member.name && task.status === 'Done').length;
      const late = tasks.filter((task) => task.pic === member.name && task.sla === 'Late').length;
      const revision = tasks.filter((task) => task.pic === member.name && task.status === 'Revision').length;
      const discipline = avg(tasks.filter((task) => task.pic === member.name).map((task) => task.disciplinePoints));
      const quality = avg(tasks.filter((task) => task.pic === member.name).map((task) => task.qualityScore));
      const productivity = avg(tasks.filter((task) => task.pic === member.name).map((task) => task.productivityScore));
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
        revision,
        onTime: Math.max(completed - late, 0),
        completionScore: completion,
        disciplineScore: discipline,
        qualityScore: quality,
        productivityScore: productivity,
        overallKpi: overall,
      };
    });

    const summary = {
      activeProjects: projects.filter((project) => project.status !== 'Completed').length,
      openTasks: tasks.filter((task) => !['Done', 'Cancelled'].includes(task.status)).length,
      waitingApproval: tasks.filter((task) => task.status === 'Waiting Approval').length,
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
            tasks.some((task) => task.pic === profile.name),
          )
      ).map((profile) => ({
        ...profile,
        monthKpi: performance.find((member) => member.name === profile.name)?.overallKpi ?? profile.monthKpi,
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
        start: input.start ?? new Date().toISOString().slice(0, 10),
        deadline: input.deadline ?? new Date().toISOString().slice(0, 10),
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
      const actor = scope.prototypeName ?? headOfMarketing;
      task.history.push({
        at: new Date().toISOString(),
        by: actor,
        from: task.status,
        to: status,
        note,
      });
      task.status = status;
      task.sla = deriveSla(task);
      if (status === 'Done') {
        task.checklistDone = task.checklistTotal;
        this.pushNotification(state, {
          type: 'task_completed',
          title: `Task completed by ${task.pic}`,
          detail: `${task.title} has been marked Done and is waiting review closure.`,
          actor,
          unread: true,
          recipient: task.reviewer,
        });
      }
      if (status === 'Waiting Approval') {
        this.pushNotification(state, {
          type: 'task_reviewed',
          title: `Approval requested for ${task.title}`,
          detail: `${task.pic} submitted ${task.title} for review.`,
          actor,
          unread: true,
          recipient: task.reviewer,
        });
      }
      if (status === 'Revision') {
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

      if (scope.isManager) {
        // Manager: full update (all fields allowed)
        Object.assign(task, input);
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
          task.status = input.status;
          note.push(`status: ${before.status} -> ${input.status}`);
        }
        if (note.length === 0) return; // nothing to update
      }

      task.sla = deriveSla(task);
      task.history.push({
        at: new Date().toISOString(),
        by: actor,
        from: before.status,
        to: task.status,
        note: note.join('; ') || 'No changes',
      });
      if (task.status === 'Done') {
        task.checklistDone = task.checklistTotal;
      }
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
    const scope = this.ensureManager(viewer);
    const next = await this.updateState((state) => {
      const id = input.id ?? `TSK-${Math.floor(Math.random() * 9000) + 1000}`;
      const actor = scope.prototypeName ?? headOfMarketing;
      const project = state.projects.find((item) => item.id === input.projectId) ?? state.projects[0];
      const assignee = input.pic ?? 'Aurel';
      state.tasks.unshift({
        id,
        title: input.title ?? 'Untitled task',
        projectId: input.projectId ?? project.id,
        project: input.project ?? project.name,
        channel: input.channel ?? 'General',
        category: input.category ?? (input.channel ?? 'General').toLowerCase().replaceAll(' ', '_'),
        assignedBy: input.assignedBy ?? actor,
        pic: assignee,
        reviewer: input.reviewer ?? headOfMarketing,
        priority: (input.priority ?? 'Medium') as TaskPriority,
        startDate: input.startDate ?? new Date().toISOString().slice(0, 10),
        dueDate: input.dueDate ?? new Date().toISOString().slice(0, 10),
        status: (input.status ?? 'Backlog') as TaskStatus,
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
            to: (input.status ?? 'Backlog') as TaskStatus,
            note: 'Task created',
          },
        ],
        attachments: input.attachments ?? [],
      });
      this.pushNotification(state, {
        type: 'task_assigned',
        title: `New task assigned to ${assignee}`,
        detail: `${input.title ?? 'Untitled task'} was assigned under ${input.project ?? project.name}.`,
        actor,
        unread: true,
        recipient: assignee,
      });
    });
    return next.tasks[0];
  }
}
