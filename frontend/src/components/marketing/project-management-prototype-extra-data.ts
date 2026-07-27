import {
  headOfMarketing,
  marketingPerformance,
  marketingTasks,
  marketingTeam,
} from "./project-management-prototype-data";

export interface MarketingNotificationPrototype {
  id: string;
  type: "task_assigned" | "due_tomorrow" | "due_today" | "overdue" | "task_completed" | "task_reviewed" | "task_approved" | "comment_added";
  title: string;
  detail: string;
  actor: string;
  time: string;
  unread: boolean;
}

export interface MarketingReportInsightPrototype {
  title: string;
  summary: string;
  impact: "Positive" | "Negative" | "Neutral";
}

export interface MarketingSettingPrototype {
  label: string;
  value: number;
}

export interface MarketingProfilePrototype {
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
  breakdown: {
    completion: number;
    discipline: number;
    quality: number;
    productivity: number;
  };
}

export const marketingNotifications: MarketingNotificationPrototype[] = [
  {
    id: "NTF-501",
    type: "task_assigned",
    title: "New task assigned to Aulia Putra",
    detail: "Meta lead gen headline set moved into To Do under Q3 Acquisition Sprint.",
    actor: headOfMarketing,
    time: "07:10",
    unread: true,
  },
  {
    id: "NTF-502",
    type: "due_today",
    title: "Due today: landing QA review",
    detail: "QA landing form friction on mobile needs update before 17:00.",
    actor: "System",
    time: "08:45",
    unread: true,
  },
  {
    id: "NTF-503",
    type: "task_reviewed",
    title: "Revision feedback added",
    detail: "Head of Marketing returned TikTok caption batch with one comment thread.",
    actor: headOfMarketing,
    time: "09:30",
    unread: false,
  },
  {
    id: "NTF-504",
    type: "task_completed",
    title: "Task completed by Dimas Pratama",
    detail: "Carousel proof assets approved and closed in Evergreen Brand Education.",
    actor: "Dimas Pratama",
    time: "10:20",
    unread: false,
  },
  {
    id: "NTF-505",
    type: "overdue",
    title: "Overdue warning: SEO schema update",
    detail: "Schema work is still waiting approval and crossed the SLA threshold.",
    actor: "System",
    time: "11:05",
    unread: true,
  },
  {
    id: "NTF-506",
    type: "comment_added",
    title: "Comment added on winback copy",
    detail: "Tasya requested one more compliance pass before submission.",
    actor: "Tasya Permata",
    time: "11:40",
    unread: false,
  },
  {
    id: "NTF-507",
    type: "task_approved",
    title: "Approved by Head of Marketing",
    detail: "Weekly paid pacing snapshot moved to Done after review.",
    actor: headOfMarketing,
    time: "13:15",
    unread: false,
  },
  {
    id: "NTF-508",
    type: "due_tomorrow",
    title: "Due tomorrow: promo banner claim review",
    detail: "Marketplace promo copy needs approval before asset handoff.",
    actor: "System",
    time: "14:50",
    unread: true,
  },
];

export const marketingReportInsights: MarketingReportInsightPrototype[] = [
  {
    title: "AI Weekly Insight",
    summary: "Paid and CRM are carrying the strongest completion rate while SEO has the highest revision drag.",
    impact: "Positive",
  },
  {
    title: "Delivery Risk",
    summary: "Tasks with low briefing clarity are the primary cause of review loops and overdue SLA pressure.",
    impact: "Negative",
  },
  {
    title: "Manager Action",
    summary: "Batch approvals at end of day reduce queue switching and improve same-day closure rate.",
    impact: "Neutral",
  },
];

export const marketingSettings: MarketingSettingPrototype[] = [
  { label: "Task Completion", value: 40 },
  { label: "Discipline", value: 30 },
  { label: "Quality", value: 15 },
  { label: "Productivity", value: 15 },
];

export const marketingProfiles: MarketingProfilePrototype[] = [
  {
    id: "aulia-putra",
    name: "Aulia Putra",
    role: "Paid Ads Specialist",
    email: "aulia.putra@portoaureon.id",
    phone: "+62 812-5555-0101",
    joinDate: "2024-03-12",
    bio: "Handles paid acquisition pacing, creative testing, and spend discipline across Meta and TikTok.",
    monthKpi: 86,
    completed: 13,
    inProgress: 2,
    late: 2,
    overdue: 1,
    breakdown: { completion: 81, discipline: 88, quality: 84, productivity: 92 },
  },
  {
    id: "nabila-salsabila",
    name: "Nabila Salsabila",
    role: "SEO Specialist",
    email: "nabila.salsabila@portoaureon.id",
    phone: "+62 813-5555-0202",
    joinDate: "2023-11-05",
    bio: "Owns technical SEO fixes, ranking visibility, and commercial page optimization.",
    monthKpi: 69,
    completed: 9,
    inProgress: 3,
    late: 3,
    overdue: 2,
    breakdown: { completion: 64, discipline: 72, quality: 69, productivity: 78 },
  },
  {
    id: "dimas-pratama",
    name: "Dimas Pratama",
    role: "Graphic Designer",
    email: "dimas.pratama@portoaureon.id",
    phone: "+62 814-5555-0303",
    joinDate: "2024-01-22",
    bio: "Produces brand, performance, and review assets for campaign execution.",
    monthKpi: 88,
    completed: 15,
    inProgress: 2,
    late: 2,
    overdue: 1,
    breakdown: { completion: 83, discipline: 90, quality: 87, productivity: 94 },
  },
  {
    id: "celine-maharani",
    name: "Celine Maharani",
    role: "Content Strategist",
    email: "celine.maharani@portoaureon.id",
    phone: "+62 815-5555-0404",
    joinDate: "2024-04-08",
    bio: "Manages content direction, social scripts, and narrative consistency.",
    monthKpi: 82,
    completed: 12,
    inProgress: 4,
    late: 1,
    overdue: 1,
    breakdown: { completion: 79, discipline: 85, quality: 83, productivity: 80 },
  },
  {
    id: "raka-saputra",
    name: "Raka Saputra",
    role: "Social Media Officer",
    email: "raka.saputra@portoaureon.id",
    phone: "+62 816-5555-0505",
    joinDate: "2024-06-14",
    bio: "Executes social scheduling, publishing discipline, and community handoff updates.",
    monthKpi: 77,
    completed: 10,
    inProgress: 3,
    late: 2,
    overdue: 1,
    breakdown: { completion: 75, discipline: 78, quality: 74, productivity: 79 },
  },
  {
    id: "tasya-permata",
    name: "Tasya Permata",
    role: "CRM Officer",
    email: "tasya.permata@portoaureon.id",
    phone: "+62 817-5555-0606",
    joinDate: "2024-02-27",
    bio: "Maintains segmentation logic, winback automations, and follow-up flows.",
    monthKpi: 80,
    completed: 11,
    inProgress: 2,
    late: 1,
    overdue: 0,
    breakdown: { completion: 78, discipline: 82, quality: 79, productivity: 81 },
  },
  {
    id: "revita-yustianawati",
    name: headOfMarketing,
    role: "Head of Marketing",
    email: "revita.yustianawati@portoaureon.id",
    phone: "+62 811-5555-0001",
    joinDate: "2022-09-01",
    bio: "Owns assignment, approval, escalation control, and KPI governance for the division.",
    monthKpi: 91,
    completed: 18,
    inProgress: 0,
    late: 0,
    overdue: 0,
    breakdown: { completion: 92, discipline: 95, quality: 89, productivity: 88 },
  },
];

const marketingNameMap: Record<string, string> = {
  "Revita Yustianawati": "Revi",
  "Aulia Putra": "Zarka",
  "Nabila Salsabila": "Gusti",
  "Dimas Pratama": "Luthfi",
  "Celine Maharani": "Aurel",
  "Raka Saputra": "Zarka",
  "Tasya Permata": "Revi",
};

const marketingRoleMap: Record<string, string> = {
  Revi: "Head of Marketing",
  Zarka: "Video Editor",
  Gusti: "Digital Marketing Strategy",
  Aurel: "Content Creator",
  Luthfi: "Packaging Designer",
};

const renameMarketingText = (value: string) =>
  Object.entries(marketingNameMap).reduce((current, [from, to]) => current.split(from).join(to), value);

marketingNotifications.forEach((notification) => {
  notification.actor = marketingNameMap[notification.actor] ?? notification.actor;
  notification.title = renameMarketingText(notification.title);
  notification.detail = renameMarketingText(notification.detail);
});

marketingProfiles.splice(
  0,
  marketingProfiles.length,
  {
    id: "revi",
    name: "Revi",
    role: "Head of Marketing",
    email: "revi@portoaureon.id",
    phone: "+62 811-5555-0001",
    joinDate: "2022-09-01",
    bio: "Owns assignment, approval, escalation control, and KPI governance for the division.",
    monthKpi: 91,
    completed: 18,
    inProgress: 0,
    late: 0,
    overdue: 0,
    breakdown: { completion: 92, discipline: 95, quality: 89, productivity: 88 },
  },
  {
    id: "zarka",
    name: "Zarka",
    role: "Video Editor",
    email: "zarka@portoaureon.id",
    phone: "+62 812-5555-0101",
    joinDate: "2024-03-12",
    bio: "Handles video cuts, motion assets, and creative pacing for short-form campaigns.",
    monthKpi: 86,
    completed: 13,
    inProgress: 2,
    late: 2,
    overdue: 1,
    breakdown: { completion: 81, discipline: 88, quality: 84, productivity: 92 },
  },
  {
    id: "gusti",
    name: "Gusti",
    role: "Digital Marketing Strategy",
    email: "gusti@portoaureon.id",
    phone: "+62 813-5555-0202",
    joinDate: "2023-11-05",
    bio: "Owns campaign structure, planning, and channel direction across paid and organic workstreams.",
    monthKpi: 79,
    completed: 11,
    inProgress: 3,
    late: 2,
    overdue: 1,
    breakdown: { completion: 76, discipline: 81, quality: 77, productivity: 80 },
  },
  {
    id: "aurel",
    name: "Aurel",
    role: "Content Creator",
    email: "aurel@portoaureon.id",
    phone: "+62 814-5555-0303",
    joinDate: "2024-01-22",
    bio: "Produces captions, copy blocks, and evergreen content assets for campaign execution.",
    monthKpi: 88,
    completed: 15,
    inProgress: 2,
    late: 1,
    overdue: 0,
    breakdown: { completion: 84, discipline: 90, quality: 87, productivity: 91 },
  },
  {
    id: "luthfi",
    name: "Luthfi",
    role: "Packaging Designer",
    email: "luthfi@portoaureon.id",
    phone: "+62 815-5555-0404",
    joinDate: "2024-04-08",
    bio: "Creates visual packaging direction and adapts brand assets for campaign surfaces.",
    monthKpi: 83,
    completed: 12,
    inProgress: 2,
    late: 1,
    overdue: 1,
    breakdown: { completion: 80, discipline: 85, quality: 82, productivity: 84 },
  },
);

marketingProfiles.forEach((profile) => {
  profile.name = marketingNameMap[profile.name] ?? profile.name;
  profile.role = marketingRoleMap[profile.name] ?? profile.role;
  profile.bio = renameMarketingText(profile.bio);
});

export const marketingTopTasks = marketingTasks.slice(0, 6);
export const marketingTeamSummary = {
  totalMembers: marketingTeam.length,
  totalTasks: marketingTasks.length,
  totalCompleted: marketingTasks.filter((task) => task.status === "Done").length,
  totalWaitingApproval: marketingTasks.filter((task) => task.status === "Waiting Approval").length,
  averageKpi: Math.round(
    marketingPerformance.reduce((sum, item) => sum + item.overallKpi, 0) / marketingPerformance.length,
  ),
};
