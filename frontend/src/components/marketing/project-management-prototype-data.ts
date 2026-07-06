export type MarketingTaskStatus =
  | "Backlog"
  | "To Do"
  | "In Progress"
  | "Waiting Approval"
  | "Revision"
  | "Done"
  | "Cancelled";

export type MarketingTaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface MarketingProjectPrototype {
  id: string;
  name: string;
  channel: string;
  owner: string;
  start: string;
  deadline: string;
  progress: number;
  openTasks: number;
  pendingApproval: number;
  status: "On Track" | "At Risk" | "Review" | "Completed";
  summary: string;
  blockers: string[];
}

export interface MarketingTaskPrototype {
  id: string;
  title: string;
  projectId: string;
  project: string;
  channel: string;
  assignedBy: string;
  pic: string;
  reviewer: string;
  priority: MarketingTaskPriority;
  dueDate: string;
  status: MarketingTaskStatus;
  sla: "Healthy" | "Watch" | "Late";
  revisionCount: number;
  checklistDone: number;
  checklistTotal: number;
  brief: string;
}

export interface MarketingPerformancePrototype {
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
}

export const headOfMarketing = "Revi";

export const marketingTeam = [
  { name: headOfMarketing, role: "Head of Marketing" },
  { name: "Zarka", role: "Video Editor" },
  { name: "Gusti", role: "Digital Marketing Strategy" },
  { name: "Aurel", role: "Content Creator" },
  { name: "Edy", role: "Packaging Designer" },
];

export const marketingProjects: MarketingProjectPrototype[] = [
  {
    id: "PRJ-2401",
    name: "Q3 Acquisition Sprint",
    channel: "Paid Ads",
    owner: headOfMarketing,
    start: "2026-07-01",
    deadline: "2026-07-31",
    progress: 68,
    openTasks: 9,
    pendingApproval: 3,
    status: "On Track",
    summary: "Scale paid lead generation for July campaign clusters across Meta and TikTok.",
    blockers: ["Meta creative refresh waiting", "Landing hero copy still in revision"],
  },
  {
    id: "PRJ-2402",
    name: "SEO Authority Lift",
    channel: "SEO",
    owner: headOfMarketing,
    start: "2026-07-03",
    deadline: "2026-08-15",
    progress: 44,
    openTasks: 7,
    pendingApproval: 1,
    status: "At Risk",
    summary: "Recover ranking on non-brand intent pages and publish technical SEO fixes.",
    blockers: ["Schema update not shipped", "Three blog drafts not reviewed"],
  },
  {
    id: "PRJ-2403",
    name: "TikTok Content Batch W2",
    channel: "Content",
    owner: headOfMarketing,
    start: "2026-07-07",
    deadline: "2026-07-18",
    progress: 81,
    openTasks: 4,
    pendingApproval: 2,
    status: "Review",
    summary: "Produce and release 12 short-form educational and promotional assets.",
    blockers: ["Two edits waiting approval"],
  },
  {
    id: "PRJ-2404",
    name: "CRM Winback Flow",
    channel: "CRM",
    owner: headOfMarketing,
    start: "2026-07-02",
    deadline: "2026-07-24",
    progress: 59,
    openTasks: 5,
    pendingApproval: 1,
    status: "On Track",
    summary: "Launch segmented WhatsApp and email recovery flows for dormant leads.",
    blockers: ["Offer copy for segment C not locked"],
  },
  {
    id: "PRJ-2405",
    name: "Landing Page CRO Sprint",
    channel: "Website",
    owner: headOfMarketing,
    start: "2026-07-05",
    deadline: "2026-07-29",
    progress: 37,
    openTasks: 8,
    pendingApproval: 0,
    status: "At Risk",
    summary: "Improve conversion paths on high-intent landing pages and forms.",
    blockers: ["Heatmap findings not synthesized", "Variant B not QA tested"],
  },
  {
    id: "PRJ-2406",
    name: "Evergreen Brand Education",
    channel: "Organic Social",
    owner: headOfMarketing,
    start: "2026-06-20",
    deadline: "2026-07-20",
    progress: 92,
    openTasks: 2,
    pendingApproval: 1,
    status: "Review",
    summary: "Maintain educational always-on content calendar for awareness lift.",
    blockers: ["Final carousel caption approval"],
  },
  {
    id: "PRJ-2407",
    name: "Marketplace Promo Push",
    channel: "Marketplace",
    owner: headOfMarketing,
    start: "2026-07-08",
    deadline: "2026-07-28",
    progress: 26,
    openTasks: 6,
    pendingApproval: 0,
    status: "At Risk",
    summary: "Align promo creative, PDP updates, and retargeting ads around marketplace traffic.",
    blockers: ["Voucher mechanics not approved by finance"],
  },
  {
    id: "PRJ-2408",
    name: "June Retrospective Pack",
    channel: "Analytics",
    owner: headOfMarketing,
    start: "2026-06-28",
    deadline: "2026-07-06",
    progress: 100,
    openTasks: 0,
    pendingApproval: 0,
    status: "Completed",
    summary: "Close monthly reporting pack and performance summary for management.",
    blockers: [],
  },
];

export const marketingTasks: MarketingTaskPrototype[] = [
  {
    id: "TSK-3101",
    title: "Refresh Meta lead gen headline set",
    projectId: "PRJ-2401",
    project: "Q3 Acquisition Sprint",
    channel: "Meta Ads",
    assignedBy: headOfMarketing,
    pic: "Aulia Putra",
    reviewer: headOfMarketing,
    priority: "Urgent",
    dueDate: "2026-07-02",
    status: "Waiting Approval",
    sla: "Watch",
    revisionCount: 1,
    checklistDone: 4,
    checklistTotal: 5,
    brief: "Deliver 5 primary headline variations with pain-point and proof angles.",
  },
  {
    id: "TSK-3102",
    title: "Draft TikTok hook bank for serum angle",
    projectId: "PRJ-2403",
    project: "TikTok Content Batch W2",
    channel: "Content",
    assignedBy: headOfMarketing,
    pic: "Celine Maharani",
    reviewer: headOfMarketing,
    priority: "High",
    dueDate: "2026-07-03",
    status: "In Progress",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 3,
    checklistTotal: 6,
    brief: "Prepare hook bank for top-funnel and promo content variants.",
  },
  {
    id: "TSK-3103",
    title: "QA landing form friction on mobile",
    projectId: "PRJ-2405",
    project: "Landing Page CRO Sprint",
    channel: "Website",
    assignedBy: headOfMarketing,
    pic: "Dimas Pratama",
    reviewer: headOfMarketing,
    priority: "High",
    dueDate: "2026-07-04",
    status: "To Do",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 0,
    checklistTotal: 4,
    brief: "Review mobile field spacing, CTA visibility, and sticky submit behavior.",
  },
  {
    id: "TSK-3104",
    title: "Build June non-brand ranking delta sheet",
    projectId: "PRJ-2402",
    project: "SEO Authority Lift",
    channel: "SEO",
    assignedBy: headOfMarketing,
    pic: "Nabila Salsabila",
    reviewer: headOfMarketing,
    priority: "Medium",
    dueDate: "2026-07-02",
    status: "Revision",
    sla: "Late",
    revisionCount: 2,
    checklistDone: 2,
    checklistTotal: 4,
    brief: "Compare priority query groups and identify highest-loss URLs.",
  },
  {
    id: "TSK-3105",
    title: "Prepare dormant-lead segment C offer",
    projectId: "PRJ-2404",
    project: "CRM Winback Flow",
    channel: "CRM",
    assignedBy: headOfMarketing,
    pic: "Tasya Permata",
    reviewer: headOfMarketing,
    priority: "High",
    dueDate: "2026-07-05",
    status: "Waiting Approval",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 5,
    checklistTotal: 5,
    brief: "Finalize incentive copy and CTA path for inactive leads older than 60 days.",
  },
  {
    id: "TSK-3106",
    title: "Design carousel for manufacturing trust proof",
    projectId: "PRJ-2406",
    project: "Evergreen Brand Education",
    channel: "Organic Social",
    assignedBy: headOfMarketing,
    pic: "Dimas Pratama",
    reviewer: headOfMarketing,
    priority: "Medium",
    dueDate: "2026-07-06",
    status: "Done",
    sla: "Healthy",
    revisionCount: 1,
    checklistDone: 6,
    checklistTotal: 6,
    brief: "Create 6-slide proof carousel using production floor and QC visuals.",
  },
  {
    id: "TSK-3107",
    title: "Write PDP promo bullets for marketplace bundle",
    projectId: "PRJ-2407",
    project: "Marketplace Promo Push",
    channel: "Marketplace",
    assignedBy: headOfMarketing,
    pic: "Celine Maharani",
    reviewer: headOfMarketing,
    priority: "Medium",
    dueDate: "2026-07-07",
    status: "Backlog",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 0,
    checklistTotal: 3,
    brief: "Reframe benefit-led bullets for promo bundle hero and above-the-fold PDP block.",
  },
  {
    id: "TSK-3108",
    title: "Compile weekly paid pacing snapshot",
    projectId: "PRJ-2401",
    project: "Q3 Acquisition Sprint",
    channel: "Analytics",
    assignedBy: headOfMarketing,
    pic: "Aulia Putra",
    reviewer: headOfMarketing,
    priority: "Low",
    dueDate: "2026-07-01",
    status: "Done",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 3,
    checklistTotal: 3,
    brief: "Summarize spend, CPL, CTR, and lead trend by paid platform.",
  },
  {
    id: "TSK-3109",
    title: "Fix schema gaps on high-intent product pages",
    projectId: "PRJ-2402",
    project: "SEO Authority Lift",
    channel: "SEO",
    assignedBy: headOfMarketing,
    pic: "Nabila Salsabila",
    reviewer: headOfMarketing,
    priority: "Urgent",
    dueDate: "2026-07-03",
    status: "In Progress",
    sla: "Watch",
    revisionCount: 0,
    checklistDone: 1,
    checklistTotal: 5,
    brief: "Audit product FAQ, breadcrumb, and organization schema on money pages.",
  },
  {
    id: "TSK-3110",
    title: "Review TikTok captions for soft CTA compliance",
    projectId: "PRJ-2403",
    project: "TikTok Content Batch W2",
    channel: "Content",
    assignedBy: headOfMarketing,
    pic: "Raka Saputra",
    reviewer: headOfMarketing,
    priority: "High",
    dueDate: "2026-07-04",
    status: "Waiting Approval",
    sla: "Healthy",
    revisionCount: 1,
    checklistDone: 4,
    checklistTotal: 4,
    brief: "Check all caption variants against claim and compliance boundaries.",
  },
  {
    id: "TSK-3111",
    title: "Map CTA placements on landing variant B",
    projectId: "PRJ-2405",
    project: "Landing Page CRO Sprint",
    channel: "Website",
    assignedBy: headOfMarketing,
    pic: "Dimas Pratama",
    reviewer: headOfMarketing,
    priority: "High",
    dueDate: "2026-07-08",
    status: "To Do",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 0,
    checklistTotal: 4,
    brief: "Reposition CTA and trust markers for long-scroll mobile flows.",
  },
  {
    id: "TSK-3112",
    title: "Prepare winback WA automation copy set",
    projectId: "PRJ-2404",
    project: "CRM Winback Flow",
    channel: "CRM",
    assignedBy: headOfMarketing,
    pic: "Tasya Permata",
    reviewer: headOfMarketing,
    priority: "Medium",
    dueDate: "2026-07-06",
    status: "In Progress",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 2,
    checklistTotal: 5,
    brief: "Write 3-sequence WhatsApp recovery flow for inactive lead clusters.",
  },
  {
    id: "TSK-3113",
    title: "Build story sequence for testimonial proof",
    projectId: "PRJ-2406",
    project: "Evergreen Brand Education",
    channel: "Organic Social",
    assignedBy: headOfMarketing,
    pic: "Raka Saputra",
    reviewer: headOfMarketing,
    priority: "Low",
    dueDate: "2026-07-05",
    status: "Done",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 4,
    checklistTotal: 4,
    brief: "Create story stack with review proof, swipe CTA, and saved highlights plan.",
  },
  {
    id: "TSK-3114",
    title: "Sync promo banner claim with legal-safe wording",
    projectId: "PRJ-2407",
    project: "Marketplace Promo Push",
    channel: "Marketplace",
    assignedBy: headOfMarketing,
    pic: "Celine Maharani",
    reviewer: headOfMarketing,
    priority: "Urgent",
    dueDate: "2026-07-03",
    status: "Revision",
    sla: "Late",
    revisionCount: 3,
    checklistDone: 1,
    checklistTotal: 3,
    brief: "Revise claim-heavy copy into compliant, conversion-safe marketplace messaging.",
  },
  {
    id: "TSK-3115",
    title: "Create lead-source dashboard summary card set",
    projectId: "PRJ-2408",
    project: "June Retrospective Pack",
    channel: "Analytics",
    assignedBy: headOfMarketing,
    pic: "Aulia Putra",
    reviewer: headOfMarketing,
    priority: "Low",
    dueDate: "2026-07-01",
    status: "Done",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 3,
    checklistTotal: 3,
    brief: "Summarize lead-source mix, deal share, and CPL movement for management recap.",
  },
  {
    id: "TSK-3116",
    title: "Audit blog internal links to commercial pages",
    projectId: "PRJ-2402",
    project: "SEO Authority Lift",
    channel: "SEO",
    assignedBy: headOfMarketing,
    pic: "Nabila Salsabila",
    reviewer: headOfMarketing,
    priority: "Medium",
    dueDate: "2026-07-09",
    status: "To Do",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 0,
    checklistTotal: 5,
    brief: "Improve internal intent flow from educational pages to high-conversion service pages.",
  },
  {
    id: "TSK-3117",
    title: "Design remarketing visual pack for angle B",
    projectId: "PRJ-2401",
    project: "Q3 Acquisition Sprint",
    channel: "Creative",
    assignedBy: headOfMarketing,
    pic: "Dimas Pratama",
    reviewer: headOfMarketing,
    priority: "High",
    dueDate: "2026-07-04",
    status: "Waiting Approval",
    sla: "Healthy",
    revisionCount: 1,
    checklistDone: 5,
    checklistTotal: 6,
    brief: "Produce static remarketing pack aligned to revised offer and social proof.",
  },
  {
    id: "TSK-3118",
    title: "Update landing FAQ with top sales objections",
    projectId: "PRJ-2405",
    project: "Landing Page CRO Sprint",
    channel: "Website",
    assignedBy: headOfMarketing,
    pic: "Celine Maharani",
    reviewer: headOfMarketing,
    priority: "Medium",
    dueDate: "2026-07-10",
    status: "Backlog",
    sla: "Healthy",
    revisionCount: 0,
    checklistDone: 0,
    checklistTotal: 4,
    brief: "Translate sales-call objections into FAQ blocks that reduce hesitation.",
  },
];

export const marketingPerformance: MarketingPerformancePrototype[] = [
  {
    name: "Aulia Putra",
    role: "Paid Ads Specialist",
    assigned: 16,
    completed: 13,
    onTime: 11,
    late: 2,
    revision: 2,
    completionScore: 81,
    disciplineScore: 88,
    qualityScore: 84,
    productivityScore: 92,
    overallKpi: 86,
  },
  {
    name: "Nabila Salsabila",
    role: "SEO Specialist",
    assigned: 14,
    completed: 9,
    onTime: 6,
    late: 3,
    revision: 3,
    completionScore: 64,
    disciplineScore: 72,
    qualityScore: 69,
    productivityScore: 78,
    overallKpi: 69,
  },
  {
    name: "Dimas Pratama",
    role: "Graphic Designer",
    assigned: 18,
    completed: 15,
    onTime: 13,
    late: 2,
    revision: 2,
    completionScore: 83,
    disciplineScore: 90,
    qualityScore: 87,
    productivityScore: 94,
    overallKpi: 88,
  },
  {
    name: "Celine Maharani",
    role: "Content Strategist",
    assigned: 17,
    completed: 12,
    onTime: 9,
    late: 3,
    revision: 4,
    completionScore: 71,
    disciplineScore: 79,
    qualityScore: 73,
    productivityScore: 86,
    overallKpi: 76,
  },
  {
    name: "Raka Saputra",
    role: "Social Media Officer",
    assigned: 13,
    completed: 11,
    onTime: 10,
    late: 1,
    revision: 1,
    completionScore: 85,
    disciplineScore: 93,
    qualityScore: 91,
    productivityScore: 88,
    overallKpi: 89,
  },
  {
    name: "Tasya Permata",
    role: "CRM Officer",
    assigned: 12,
    completed: 8,
    onTime: 7,
    late: 1,
    revision: 2,
    completionScore: 67,
    disciplineScore: 84,
    qualityScore: 77,
    productivityScore: 75,
    overallKpi: 74,
  },
];

const marketingNameMap: Record<string, string> = {
  "Revita Yustianawati": "Revi",
  "Aulia Putra": "Zarka",
  "Nabila Salsabila": "Gusti",
  "Dimas Pratama": "Edy",
  "Celine Maharani": "Aurel",
  "Raka Saputra": "Zarka",
  "Tasya Permata": "Revi",
};

const marketingRoleMap: Record<string, string> = {
  Revi: "Head of Marketing",
  Zarka: "Video Editor",
  Gusti: "Digital Marketing Strategy",
  Aurel: "Content Creator",
  Edy: "Packaging Designer",
};

const renameMarketingText = (value: string) =>
  Object.entries(marketingNameMap).reduce((current, [from, to]) => current.split(from).join(to), value);

marketingProjects.forEach((project) => {
  project.owner = marketingNameMap[project.owner] ?? project.owner;
  project.summary = renameMarketingText(project.summary);
  project.blockers = project.blockers.map(renameMarketingText);
});

marketingTasks.forEach((task) => {
  task.assignedBy = marketingNameMap[task.assignedBy] ?? task.assignedBy;
  task.pic = marketingNameMap[task.pic] ?? task.pic;
  task.reviewer = marketingNameMap[task.reviewer] ?? task.reviewer;
  task.title = renameMarketingText(task.title);
  task.project = renameMarketingText(task.project);
  task.channel = renameMarketingText(task.channel);
  task.brief = renameMarketingText(task.brief);
});

marketingPerformance.forEach((row) => {
  row.name = marketingNameMap[row.name] ?? row.name;
  row.role = marketingRoleMap[row.name] ?? row.role;
});
