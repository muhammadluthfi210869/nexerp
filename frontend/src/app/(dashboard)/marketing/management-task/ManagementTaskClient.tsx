"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Download,
  FolderKanban,
  MessageSquareQuote,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Users2,
  GripVertical,
  Save,
  AlertTriangle,
  BarChart3,
  Bell,
  FileText,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  DashboardCard,
  DnaButton,
  DnaInput,
  PageSection,
  StatCard,
  TableWrapper,
} from "@/components/dna";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMarketingPrototypeBundle } from "@/components/marketing/use-marketing-prototype";
import {
  AvatarPill,
  PriorityBadge,
  ProgressBar,
  StatusBadge,
  formatLongDate,
  formatShortDate,
} from "@/components/marketing/project-management-prototype-ui";

type TaskSortKey = "title" | "project" | "channel" | "pic" | "priority" | "dueDate" | "status" | "sla";
type TaskStatus = "Backlog" | "To Do" | "In Progress" | "Waiting Approval" | "Revision" | "Done" | "Cancelled";
type ProjectStatus = "On Track" | "At Risk" | "Review" | "Completed";

type TaskRow = {
  id: string;
  title: string;
  projectId: string;
  project: string;
  channel: string;
  category?: string;
  assignedBy: string;
  pic: string;
  reviewer: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  startDate?: string;
  dueDate: string;
  status: TaskStatus;
  sla: "Healthy" | "Watch" | "Late";
  estimatedHours?: number;
  actualHours?: number;
  revisionCount: number;
  checklistDone: number;
  checklistTotal: number;
  brief: string;
  tags?: string[];
  comments?: Array<{ author: string; body: string; createdAt: string }>;
  history?: Array<{ at: string; by: string; from?: string; to: string; note: string }>;
  attachments?: Array<{ name: string; type: string; sizeKb: number }>;
};

type ProjectRow = {
  id: string;
  name: string;
  channel: string;
  category?: string;
  owner: string;
  start: string;
  deadline: string;
  progress: number;
  openTasks: number;
  pendingApproval: number;
  status: ProjectStatus;
  summary: string;
  blockers: string[];
};

type ProfileRow = {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  joinDate?: string;
  bio?: string;
  monthKpi?: number;
  completed?: number;
  inProgress?: number;
  late?: number;
  overdue?: number;
  breakdown?: { completion: number; discipline: number; quality: number; productivity: number };
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  detail: string;
  actor: string;
  time: string;
  unread: boolean;
};

type InsightRow = { title: string; summary: string; impact: "Positive" | "Negative" | "Neutral" };
type ViewerMeta = { name?: string | null; isManager?: boolean };
type SettingsMeta = { projectCategories?: string[] };

type ManagementTaskClientProps = {
  initialTab?: string;
};

type TaskFormState = {
  title: string;
  projectId: string;
  project: string;
  channel: string;
  category: string;
  pic: string;
  reviewer: string;
  priority: TaskRow["priority"];
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  checklistDone: number;
  checklistTotal: number;
  brief: string;
  tags: string;
  attachmentName: string;
  attachmentType: string;
  attachmentSizeKb: number;
};

const taskCategoryOptions = [
  "meta_ads",
  "google_ads",
  "seo",
  "geo",
  "website",
  "social_media",
  "content",
  "copywriting",
  "design",
  "video_editing",
  "motion_graphic",
  "crm",
  "marketplace",
  "email_marketing",
  "analytics",
] as const;

const teamMemberOptions = ["Revi", "Zarka", "Gusti", "Aurel", "Edy"] as const;

const statusOrder: TaskStatus[] = ["Backlog", "To Do", "In Progress", "Waiting Approval", "Revision", "Done", "Cancelled"];

const defaultTaskForm = (project?: ProjectRow): TaskFormState => ({
  title: "",
  projectId: project?.id ?? "",
  project: project?.name ?? "",
  channel: project?.channel ?? "Content",
  category: "content",
  pic: "Aurel",
  reviewer: "Revi",
  priority: "Medium" as TaskRow["priority"],
  startDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date().toISOString().slice(0, 10),
  status: "Backlog" as TaskStatus,
  estimatedHours: 4,
  actualHours: 0,
  checklistDone: 0,
  checklistTotal: 4,
  brief: "",
  tags: "",
  attachmentName: "",
  attachmentType: "application/pdf",
  attachmentSizeKb: 0,
});

const defaultProjectForm = {
  name: "",
  channel: "Content",
  category: "content_production",
  owner: "Revi",
  start: new Date().toISOString().slice(0, 10),
  deadline: new Date().toISOString().slice(0, 10),
  progress: 0,
  status: "On Track" as ProjectStatus,
  summary: "",
  blockers: "",
};

function escapeCsv(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function compareTask(left: TaskRow, right: TaskRow, key: TaskSortKey) {
  switch (key) {
    case "dueDate":
      return left.dueDate.localeCompare(right.dueDate);
    case "priority": {
      const rank = { Low: 1, Medium: 2, High: 3, Urgent: 4 };
      return rank[left.priority] - rank[right.priority];
    }
    case "sla": {
      const rank = { Healthy: 1, Watch: 2, Late: 3 };
      return rank[left.sla] - rank[right.sla];
    }
    case "status":
      return statusOrder.indexOf(left.status) - statusOrder.indexOf(right.status);
    default:
      return left[key].localeCompare(right[key]);
  }
}

function toTaskForm(task: TaskRow): TaskFormState {
  const attachment = task.attachments?.[0];
  return {
    title: task.title,
    projectId: task.projectId,
    project: task.project,
    channel: task.channel,
    category: task.category ?? task.channel.toLowerCase().replaceAll(" ", "_"),
    pic: task.pic,
    reviewer: task.reviewer,
    priority: task.priority,
    startDate: task.startDate ?? task.dueDate,
    dueDate: task.dueDate,
    status: task.status,
    estimatedHours: task.estimatedHours ?? task.checklistTotal,
    actualHours: task.actualHours ?? task.checklistDone,
    checklistDone: task.checklistDone,
    checklistTotal: task.checklistTotal,
    brief: task.brief,
    tags: (task.tags ?? []).join(", "),
    attachmentName: attachment?.name ?? "",
    attachmentType: attachment?.type ?? "application/pdf",
    attachmentSizeKb: attachment?.sizeKb ?? 0,
  };
}

function formatCategoryLabel(value: string) {
  return value.replaceAll("_", " ");
}

function criticalGlowClass(active: boolean) {
  return active
    ? "border-[rgba(220,38,38,0.28)] shadow-[0_0_0_1px_rgba(220,38,38,0.08),0_18px_40px_-16px_rgba(220,38,38,0.34)] [&_h3]:text-[#DC2626]"
    : "";
}

function criticalPanelClass(active: boolean) {
  return active
    ? "border-[rgba(220,38,38,0.28)] shadow-[0_0_0_1px_rgba(220,38,38,0.08),0_18px_40px_-16px_rgba(220,38,38,0.34)]"
    : "";
}

export function ManagementTaskClient({ initialTab = "overview" }: ManagementTaskClientProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: prototype } = useMarketingPrototypeBundle();

  const tasks = (prototype?.tasks ?? []) as TaskRow[];
  const projects = (prototype?.projects ?? []) as ProjectRow[];
  const profiles = (prototype?.profiles ?? []) as ProfileRow[];
  const notifications = (prototype?.notifications ?? []) as NotificationRow[];
  const insights = (prototype?.insights ?? []) as InsightRow[];
  const viewer = (prototype?.viewer ?? {}) as ViewerMeta;
  const settings = (prototype?.settings ?? {}) as SettingsMeta;
  const projectCategories = settings.projectCategories ?? [];
  const fallbackManager =
    user?.email === "revita@nexerp.id" ||
    user?.roles?.includes("SUPER_ADMIN") ||
    user?.roles?.includes("HEAD_OPS") ||
    user?.roles?.includes("MARKETING");
  const canManage = viewer.isManager ?? fallbackManager;
  const actorName = viewer.name ?? (fallbackManager ? "Revi" : user?.fullName ?? "User");

  const [tab, setTab] = useState(initialTab);
  const [taskView, setTaskView] = useState<"kanban" | "table">("kanban");
  const [taskSortKey, setTaskSortKey] = useState<TaskSortKey>("dueDate");
  const [taskSortDir, setTaskSortDir] = useState<"asc" | "desc">("asc");
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(tasks[0]?.id);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projects[0]?.id);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(profiles[0]?.id);
  const [taskForm, setTaskForm] = useState(defaultTaskForm(projects[0]));
  const [taskComposerOpen, setTaskComposerOpen] = useState(false);
  const [taskComposerMode, setTaskComposerMode] = useState<"create" | "edit">("create");
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(defaultProjectForm);
  const [projectComposerOpen, setProjectComposerOpen] = useState(false);
  const [projectComposerMode, setProjectComposerMode] = useState<"create" | "edit">("create");
  const [newProjectCategory, setNewProjectCategory] = useState("");
  const [editingProjectCategory, setEditingProjectCategory] = useState<string | null>(null);
  const [editingProjectCategoryValue, setEditingProjectCategoryValue] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("2026-07-01");

  useEffect(() => {
    if (!selectedTaskId && tasks[0]) setSelectedTaskId(tasks[0].id);
  }, [selectedTaskId, tasks]);

  useEffect(() => {
    if (!selectedProjectId && projects[0]) setSelectedProjectId(projects[0].id);
  }, [selectedProjectId, projects]);

  useEffect(() => {
    if (!selectedMemberId && profiles[0]) setSelectedMemberId(profiles[0].id);
  }, [selectedMemberId, profiles]);

  useEffect(() => {
    const project = projects.find((item) => item.id === taskForm.projectId) ?? projects[0];
    if (!project) return;
    setTaskForm((current) =>
      current.projectId ? current : defaultTaskForm(project),
    );
  }, [projects, taskForm.projectId]);

  const selectedTask = tasks.find((item) => item.id === selectedTaskId) ?? tasks[0];
  const selectedProject = projects.find((item) => item.id === selectedProjectId) ?? projects[0];
  const selectedMember = profiles.find((item) => item.id === selectedMemberId) ?? profiles[0];

  useEffect(() => {
    if (!selectedTask) return;
    setTaskForm(toTaskForm(selectedTask));
    setCommentDraft("");
  }, [selectedTask]);

  useEffect(() => {
    if (!selectedProject) return;
    setProjectForm({
      name: selectedProject.name,
      channel: selectedProject.channel,
      category: selectedProject.category ?? "content_production",
      owner: selectedProject.owner,
      start: selectedProject.start,
      deadline: selectedProject.deadline,
      progress: selectedProject.progress,
      status: selectedProject.status,
      summary: selectedProject.summary,
      blockers: selectedProject.blockers.join(", "),
    });
  }, [selectedProject]);

  const activeTasks = useMemo(
    () => tasks.filter((task) => !["Done", "Cancelled"].includes(task.status)),
    [tasks],
  );

  const sortedTasks = useMemo(() => {
    const copy = [...tasks].sort((left, right) => compareTask(left, right, taskSortKey));
    return taskSortDir === "asc" ? copy : copy.reverse();
  }, [taskSortDir, taskSortKey, tasks]);

  const openTasks = tasks.filter((task) => !["Done", "Cancelled"].includes(task.status)).length;
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = tasks.filter((task) => task.dueDate === today).length;
  const waitingApproval = tasks.filter((task) => task.status === "Waiting Approval").length;
  const activeProjects = projects.filter((project) => project.status !== "Completed").length;
  const completedTasks = tasks.filter((task) => task.status === "Done").length;
  const overdueTasks = tasks.filter((task) => task.dueDate < today && !["Done", "Cancelled"].includes(task.status)).length;
  const dueThisWeek = tasks.filter((task) => task.dueDate >= today && task.dueDate <= "2026-07-12" && !["Done", "Cancelled"].includes(task.status)).length;
  const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length;
  const revisionTasks = tasks.filter((task) => task.status === "Revision");
  const recentlyAssignedTasks = [...tasks]
    .sort((left, right) => (right.history?.[0]?.at ?? "").localeCompare(left.history?.[0]?.at ?? ""))
    .slice(0, 4);
  const dueTodayTasks = tasks.filter((task) => task.dueDate === today).slice(0, 4);
  const overdueTaskList = tasks.filter((task) => task.dueDate < today && !["Done", "Cancelled"].includes(task.status)).slice(0, 4);
  const highPriorityTasks = tasks.filter((task) => ["High", "Urgent"].includes(task.priority) && !["Done", "Cancelled"].includes(task.status)).slice(0, 4);
  const pendingApprovalTasks = tasks.filter((task) => task.status === "Waiting Approval").slice(0, 4);
  const averageKpi = Math.round(profiles.reduce((sum, member) => sum + (member.monthKpi ?? 0), 0) / Math.max(profiles.length, 1));
  const averageDiscipline = Math.round(profiles.reduce((sum, member) => sum + (member.breakdown?.discipline ?? 0), 0) / Math.max(profiles.length, 1));
  const rankedProfiles = [...profiles].sort((left, right) => (right.monthKpi ?? 0) - (left.monthKpi ?? 0));
  const bestPerformer = rankedProfiles[0];
  const mostCompletedMember = [...profiles].sort((left, right) => (right.completed ?? 0) - (left.completed ?? 0))[0];
  const mostLateMember = [...profiles].sort((left, right) => (right.late ?? 0) - (left.late ?? 0))[0];

  function syncTaskProject(projectId: string) {
    const project = projects.find((item) => item.id === projectId);
    setTaskForm((current) => ({
      ...current,
      projectId,
      project: project?.name ?? current.project,
      channel: project?.channel ?? current.channel,
    }));
  }

  function openCreateTaskComposer(prefill?: Partial<TaskFormState>) {
    setTaskComposerMode("create");
    setTaskForm({ ...defaultTaskForm(projects[0]), ...prefill });
    setTaskComposerOpen(true);
    setTab("tasks");
  }

  function openEditTaskComposer(task?: TaskRow) {
    const target = task ?? selectedTask;
    if (!target) return;
    setSelectedTaskId(target.id);
    setTaskComposerMode("edit");
    setTaskForm(toTaskForm(target));
    setTaskComposerOpen(true);
    setTaskDetailOpen(false);
    setTab("tasks");
  }

  function closeTaskComposer() {
    setTaskComposerOpen(false);
    if (selectedTask && taskComposerMode === "edit") {
      setTaskForm(toTaskForm(selectedTask));
      return;
    }
    setTaskForm(defaultTaskForm(projects[0]));
  }

  function openTaskDetail(task: TaskRow) {
    setSelectedTaskId(task.id);
    setTaskDetailOpen(true);
    setTab("tasks");
  }

  function closeTaskDetail() {
    setTaskDetailOpen(false);
  }

  function openCreateProjectComposer() {
    setProjectComposerMode("create");
    setProjectForm(defaultProjectForm);
    setProjectComposerOpen(true);
    setTab("projects");
  }

  function openEditProjectComposer(project: ProjectRow) {
    setSelectedProjectId(project.id);
    setProjectComposerMode("edit");
    setProjectForm({
      name: project.name,
      channel: project.channel,
      category: project.category ?? "content_production",
      owner: project.owner,
      start: project.start,
      deadline: project.deadline,
      progress: project.progress,
      status: project.status,
      summary: project.summary,
      blockers: project.blockers.join(", "),
    });
    setProjectComposerOpen(true);
    setTab("projects");
  }

  function closeProjectComposer() {
    setProjectComposerOpen(false);
    setProjectForm(selectedProject ? {
      name: selectedProject.name,
      channel: selectedProject.channel,
      category: selectedProject.category ?? "content_production",
      owner: selectedProject.owner,
      start: selectedProject.start,
      deadline: selectedProject.deadline,
      progress: selectedProject.progress,
      status: selectedProject.status,
      summary: selectedProject.summary,
      blockers: selectedProject.blockers.join(", "),
    } : defaultProjectForm);
  }

  function buildTaskPayload() {
    return {
      title: taskForm.title.trim(),
      projectId: taskForm.projectId,
      project: taskForm.project.trim(),
      channel: taskForm.channel.trim(),
      category: taskForm.category,
      pic: taskForm.pic,
      reviewer: taskForm.reviewer,
      priority: taskForm.priority,
      startDate: taskForm.startDate,
      dueDate: taskForm.dueDate,
      status: taskForm.status,
      estimatedHours: Number(taskForm.estimatedHours) || 0,
      actualHours: Number(taskForm.actualHours) || 0,
      checklistDone: Number(taskForm.checklistDone) || 0,
      checklistTotal: Math.max(Number(taskForm.checklistTotal) || 1, 1),
      brief: taskForm.brief.trim(),
      tags: taskForm.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      attachments: taskForm.attachmentName.trim()
        ? [
            {
              name: taskForm.attachmentName.trim(),
              type: taskForm.attachmentType.trim() || "application/pdf",
              sizeKb: Number(taskForm.attachmentSizeKb) || 0,
            },
          ]
        : [],
    };
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
  }

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    setSaving(true);
    try {
      await api.post("/marketing/prototype/tasks", {
        ...buildTaskPayload(),
        assignedBy: actorName,
      });
      await refresh();
      setTaskComposerOpen(false);
      setTaskForm(defaultTaskForm(projects[0]));
    } finally {
      setSaving(false);
    }
  }

  async function saveTask() {
    if (!selectedTask || !canManage) return;
    setSaving(true);
    try {
      await api.patch(`/marketing/prototype/tasks/${selectedTask.id}`, {
        ...buildTaskPayload(),
        assignedBy: actorName,
      });
      await refresh();
      setTaskComposerOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(taskId: string) {
    if (!canManage) return;
    setSaving(true);
    try {
      await api.delete(`/marketing/prototype/tasks/${taskId}`);
      setTaskComposerOpen(false);
      setSelectedTaskId(undefined);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    setSaving(true);
    try {
      await api.patch(`/marketing/prototype/tasks/${taskId}/status`, {
        status,
        note: `Moved to ${status}`,
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function addComment() {
    if (!selectedTask || !commentDraft.trim()) return;
    setSaving(true);
    try {
      await api.post(`/marketing/prototype/tasks/${selectedTask.id}/comment`, {
        author: actorName,
        body: commentDraft.trim(),
      });
      setCommentDraft("");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    setSaving(true);
    try {
      await api.post("/marketing/prototype/projects", {
        ...projectForm,
        blockers: projectForm.blockers
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      await refresh();
      setProjectComposerOpen(false);
      setProjectForm(defaultProjectForm);
    } finally {
      setSaving(false);
    }
  }

  async function saveProject() {
    if (!selectedProject || !canManage) return;
    setSaving(true);
    try {
      await api.patch(`/marketing/prototype/projects/${selectedProject.id}`, {
        ...projectForm,
        blockers: projectForm.blockers
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      await refresh();
      setProjectComposerOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(projectId: string) {
    if (!canManage) return;
    setSaving(true);
    try {
      await api.delete(`/marketing/prototype/projects/${projectId}`);
      setProjectComposerOpen(false);
      setSelectedProjectId(undefined);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function markAllRead() {
    setSaving(true);
    try {
      await api.post("/marketing/prototype/notifications/read-all");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveProjectCategories(nextCategories: string[]) {
    if (!canManage) return;
    setSaving(true);
    try {
      await api.patch("/marketing/prototype/settings", {
        projectCategories: nextCategories,
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function createProjectCategory() {
    const value = newProjectCategory.trim().toLowerCase().replaceAll(" ", "_");
    if (!value || projectCategories.includes(value)) return;
    await saveProjectCategories([...projectCategories, value]);
    setNewProjectCategory("");
  }

  async function updateProjectCategory(previous: string) {
    const nextValue = editingProjectCategoryValue.trim().toLowerCase().replaceAll(" ", "_");
    if (!nextValue) return;
    const nextCategories = projectCategories.map((category) => (category === previous ? nextValue : category));
    await saveProjectCategories(Array.from(new Set(nextCategories)));
    setEditingProjectCategory(null);
    setEditingProjectCategoryValue("");
    if (projectForm.category === previous) {
      setProjectForm((current) => ({ ...current, category: nextValue }));
    }
  }

  function exportTasksCsv(rows: TaskRow[]) {
    const headers = ["ID", "Title", "Project", "Channel", "PIC", "Reviewer", "Priority", "Due Date", "Status", "SLA", "Checklist", "Brief"];
    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.title,
          row.project,
          row.channel,
          row.pic,
          row.reviewer,
          row.priority,
          row.dueDate,
          row.status,
          row.sla,
          `${row.checklistDone}/${row.checklistTotal}`,
          row.brief,
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marketing-management-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const selectedTasks = tasks.filter((task) => task.projectId === selectedProject?.id).slice(0, 5);
  const calendarDays = useMemo(() => {
    const first = new Date("2026-07-01T00:00:00");
    const startWeekday = (first.getDay() + 6) % 7;
    const monthDays = 31;
    return Array.from({ length: 35 }, (_, index) => index - startWeekday + 1).map((day, index) => ({
      day,
      index,
      valid: day > 0 && day <= monthDays,
      date: day > 0 && day <= monthDays ? `2026-07-${String(day).padStart(2, "0")}` : `out-${index}`,
    }));
  }, []);

  const tasksByDate = useMemo<Record<string, TaskRow[]>>(() => {
    return tasks.reduce((acc, task) => {
      const bucket = acc[task.dueDate] ?? [];
      bucket.push(task);
      acc[task.dueDate] = bucket;
      return acc;
    }, {} as Record<string, TaskRow[]>);
  }, [tasks]);

  const selectedCalendarTasks = tasksByDate[selectedCalendarDate] ?? [];

  const heroActions = (
    <>
      <DnaButton variant="outline" icon={<RefreshCcw />} onClick={() => void refresh()}>
        Refresh
      </DnaButton>
      <DnaButton variant="outline" icon={<Download />} onClick={() => exportTasksCsv(tasks)}>
        Export CSV
      </DnaButton>
      {canManage ? (
        <>
          <DnaButton variant="outline" icon={<FolderKanban />} onClick={() => openCreateProjectComposer()}>
            New Project
          </DnaButton>
          <DnaButton variant="primary" icon={<Plus />} onClick={() => openCreateTaskComposer()}>
            New Task
          </DnaButton>
        </>
      ) : null}
    </>
  );

  return (
    <DashboardShell
      title="Marketing"
      titleAccent="Management Task"
      subtitle="Single operating center for task assignment, project control, approval workflow, and team KPI."
      actions={heroActions}
    >
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-14 min-w-max gap-1 rounded-2xl border border-slate-200/50 bg-slate-100/60 p-1.5 shadow-inner backdrop-blur-md">
            {[
              ["overview", "Overview"],
              ["tasks", "Tasks"],
              ["projects", "Projects"],
              ["calendar", "Calendar"],
              ["team", "Team KPI"],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-xl px-5 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <PageSection title="Executive Snapshot">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Tasks" value={tasks.length} subValue="Full task registry" icon={<ClipboardList className="text-blue-600" />} />
              <StatCard label="Completed" value={completedTasks} subValue="Closed and approved" icon={<CheckCheck className="text-emerald-500" />} />
              <StatCard label="Overdue" value={overdueTasks} subValue="Need immediate action" icon={<AlertTriangle className="text-rose-500" />} className={criticalGlowClass(overdueTasks > 0)} />
              <StatCard label="Due Today" value={dueToday} subValue="Same-day deadlines" icon={<CalendarDays className="text-amber-500" />} className={criticalGlowClass(dueToday > 0)} />
              <StatCard label="Due This Week" value={dueThisWeek} subValue="Seven-day horizon" icon={<CalendarDays className="text-cyan-500" />} />
              <StatCard label="In Progress" value={inProgressTasks} subValue="Execution underway" icon={<ShieldCheck className="text-indigo-500" />} />
              <StatCard label="Overall Team KPI" value={averageKpi} subValue="Monthly average score" icon={<BarChart3 className="text-slate-700" />} />
              <StatCard label="Discipline Score" value={averageDiscipline} subValue="Average deadline quality" icon={<Bell className="text-emerald-600" />} className={criticalGlowClass(averageDiscipline < 90)} />
            </div>
          </PageSection>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <DashboardCard label="Approval Command Center" className={criticalPanelClass(waitingApproval > 0 || revisionTasks.length > 0)}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className={`rounded-[20px] border p-4 ${criticalPanelClass(waitingApproval > 0) || "border-emerald-100 bg-emerald-50"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-[9px] font-black uppercase tracking-[0.16em] ${waitingApproval > 0 ? "text-rose-700" : "text-emerald-700"}`}>Waiting Approval</p>
                      <span className={`tabular text-[12px] font-black ${waitingApproval > 0 ? "text-rose-700" : "text-emerald-900"}`}>{waitingApproval}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {pendingApprovalTasks.length ? pendingApprovalTasks.map((task) => (
                        <button key={task.id} type="button" onClick={() => openTaskDetail(task)} className="w-full rounded-2xl border border-white/80 bg-white/80 px-3 py-3 text-left transition hover:bg-white">
                          <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">{task.title}</p>
                          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{task.pic} · {task.project}</p>
                        </button>
                      )) : <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/60 px-3 py-4 text-center text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">Queue clear</div>}
                    </div>
                  </div>
                  <div className={`rounded-[20px] border p-4 ${criticalPanelClass(revisionTasks.length > 0) || "border-amber-100 bg-amber-50"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-[9px] font-black uppercase tracking-[0.16em] ${revisionTasks.length > 0 ? "text-rose-700" : "text-amber-700"}`}>Revision Requested</p>
                      <span className={`tabular text-[12px] font-black ${revisionTasks.length > 0 ? "text-rose-700" : "text-amber-900"}`}>{revisionTasks.length}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {revisionTasks.slice(0, 4).length ? revisionTasks.slice(0, 4).map((task) => (
                        <button key={task.id} type="button" onClick={() => openTaskDetail(task)} className="w-full rounded-2xl border border-white/80 bg-white/80 px-3 py-3 text-left transition hover:bg-white">
                          <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">{task.title}</p>
                          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{task.pic} · {formatShortDate(task.dueDate)}</p>
                        </button>
                      )) : <div className="rounded-2xl border border-dashed border-amber-200 bg-white/60 px-3 py-4 text-center text-[9px] font-black uppercase tracking-[0.14em] text-amber-700">No revisions</div>}
                    </div>
                  </div>
                </div>
                <div className="rounded-[20px] border border-blue-100 bg-blue-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">Recently Assigned</p>
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">Latest intake</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {recentlyAssignedTasks.map((task) => (
                      <button key={task.id} type="button" onClick={() => openTaskDetail(task)} className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-left transition hover:bg-white">
                        <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">{task.title}</p>
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{task.pic} · {task.status}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard label="Team Pulse" className={criticalPanelClass((mostLateMember?.late ?? 0) > 0 || averageDiscipline < 90)}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Best Performer</p>
                    <p className="mt-2 text-[12px] font-black uppercase tracking-tight text-slate-900">{bestPerformer?.name ?? "-"}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-500">{bestPerformer?.monthKpi ?? 0} KPI</p>
                  </div>
                  <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Most Completed</p>
                    <p className="mt-2 text-[12px] font-black uppercase tracking-tight text-slate-900">{mostCompletedMember?.name ?? "-"}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-500">{mostCompletedMember?.completed ?? 0} tasks</p>
                  </div>
                  <div className={`rounded-[20px] border p-4 ${criticalPanelClass((mostLateMember?.late ?? 0) > 0) || "border-slate-100 bg-slate-50"}`}>
                    <p className={`text-[9px] font-black uppercase tracking-[0.14em] ${(mostLateMember?.late ?? 0) > 0 ? "text-rose-600" : "text-slate-400"}`}>Most Late</p>
                    <p className={`mt-2 text-[12px] font-black uppercase tracking-tight ${(mostLateMember?.late ?? 0) > 0 ? "text-rose-700" : "text-slate-900"}`}>{mostLateMember?.name ?? "-"}</p>
                    <p className={`mt-1 text-[10px] font-bold ${(mostLateMember?.late ?? 0) > 0 ? "text-rose-600" : "text-slate-500"}`}>{mostLateMember?.late ?? 0} late tasks</p>
                  </div>
                  <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Active Projects</p>
                    <p className="mt-2 text-[12px] font-black uppercase tracking-tight text-slate-900">{activeProjects}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-500">Running containers</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {rankedProfiles.slice(0, 5).map((member, index) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedMemberId(member.id);
                        setTab("team");
                      }}
                      className="w-full rounded-[18px] border border-slate-100 bg-white px-4 py-3 text-left transition hover:border-blue-200 hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-600">{index + 1}</span>
                          <AvatarPill name={member.name} role={member.role} subtle />
                        </div>
                        <span className="tabular text-[11px] font-black text-slate-700">{member.monthKpi ?? 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </DashboardCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <DashboardCard label="Today Focus" className={criticalPanelClass(overdueTaskList.length > 0 || dueTodayTasks.length > 0)}>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {[
                  { label: "Due Today", rows: dueTodayTasks, tone: "amber" },
                  { label: "Overdue", rows: overdueTaskList, tone: "rose" },
                  { label: "High Priority", rows: highPriorityTasks, tone: "blue" },
                  { label: "Revision Loop", rows: revisionTasks.slice(0, 4), tone: "slate" },
                ].map(({ label, rows, tone }) => (
                  <div key={label} className={`rounded-[20px] border p-4 ${label === "Overdue" && rows.length ? criticalPanelClass(true) : tone === "amber" ? "border-amber-100 bg-amber-50" : tone === "rose" ? "border-rose-100 bg-rose-50" : tone === "blue" ? "border-blue-100 bg-blue-50" : "border-slate-100 bg-slate-50"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-[9px] font-black uppercase tracking-[0.16em] ${label === "Overdue" && rows.length ? "text-rose-700" : "text-slate-700"}`}>{label}</p>
                      <span className={`tabular text-[11px] font-black ${label === "Overdue" && rows.length ? "text-rose-700" : "text-slate-700"}`}>{rows.length}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {rows.length ? rows.map((task) => (
                        <button key={task.id} type="button" onClick={() => openTaskDetail(task)} className="w-full rounded-2xl border border-white/80 bg-white/80 px-3 py-3 text-left transition hover:bg-white">
                          <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">{task.title}</p>
                          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{task.pic} · {task.project}</p>
                        </button>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-white/90 bg-white/60 px-3 py-4 text-center text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Nothing critical
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard label="Project Health" className={criticalPanelClass(projects.some((project) => project.status === "At Risk" || project.pendingApproval > 0))}>
              <div className="space-y-3">
                {projects.slice(0, 6).map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setTab("projects")}
                    className={`w-full rounded-[20px] border p-4 text-left transition hover:border-blue-200 hover:bg-white ${project.status === "At Risk" || project.pendingApproval > 0 ? criticalPanelClass(true) : "border-slate-100 bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">{project.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">{formatCategoryLabel(project.category ?? "general_operations")}</p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-white bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Progress</p>
                        <p className={`mt-1 text-[10px] font-black uppercase ${project.status === "At Risk" ? "text-rose-700" : "text-slate-700"}`}>{project.progress}%</p>
                      </div>
                      <div className="rounded-2xl border border-white bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Open</p>
                        <p className="mt-1 text-[10px] font-black uppercase text-slate-700">{project.openTasks}</p>
                      </div>
                      <div className="rounded-2xl border border-white bg-white px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Approval</p>
                        <p className={`mt-1 text-[10px] font-black uppercase ${project.pendingApproval > 0 ? "text-rose-700" : "text-slate-700"}`}>{project.pendingApproval}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </DashboardCard>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <PageSection title="Task Operations">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <StatCard label="Open Tasks" value={openTasks} icon={<ClipboardList className="text-blue-600" />} />
              <StatCard label="Due Today" value={dueToday} icon={<AlertTriangle className="text-amber-500" />} className={criticalGlowClass(dueToday > 0)} />
              <StatCard label="Waiting Approval" value={waitingApproval} icon={<CheckCheck className="text-emerald-500" />} className={criticalGlowClass(waitingApproval > 0)} />
              <StatCard label="Members" value={profiles.length} icon={<Users2 className="text-slate-700" />} />
            </div>
          </PageSection>

          <div className="flex flex-wrap gap-2">
            <DnaButton variant={taskView === "kanban" ? "secondary" : "outline"} onClick={() => setTaskView("kanban")}>Kanban</DnaButton>
            <DnaButton variant={taskView === "table" ? "secondary" : "outline"} onClick={() => setTaskView("table")}>Table</DnaButton>
            <DnaButton variant="outline" onClick={() => exportTasksCsv(tasks)}>Export Tasks</DnaButton>
            <DnaButton variant="outline" onClick={() => setSelectedTaskId(tasks[0]?.id)}>Select First</DnaButton>
          </div>

          <DashboardCard label={taskView === "kanban" ? "Native Kanban" : "Sortable Table"}>
            {taskView === "kanban" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {statusOrder.filter((status) => status !== "Cancelled").map((status) => {
                  const columnTasks = tasks.filter((task) => task.status === status);
                  return (
                    <div
                      key={status}
                      className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const dragged = event.dataTransfer.getData("text/task-id");
                        if (dragged) void updateTaskStatus(dragged, status);
                      }}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <StatusBadge status={status} />
                        <div className="flex items-center gap-2">
                          <span className="tabular text-[10px] font-black text-slate-400">{columnTasks.length}</span>
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => openCreateTaskComposer({ status, projectId: projects[0]?.id ?? "", project: projects[0]?.name ?? "", channel: projects[0]?.channel ?? "Content" })}
                              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-600 transition hover:border-blue-200 hover:bg-white hover:text-blue-700"
                            >
                              Add
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {columnTasks.length ? columnTasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            draggable
                            onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
                            onClick={() => openTaskDetail(task)}
                            className="w-full rounded-[20px] border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-white"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-[10px] font-black uppercase tracking-tight text-slate-900">{task.title}</p>
                                <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{task.project}</p>
                              </div>
                              <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <PriorityBadge priority={task.priority} />
                              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{formatShortDate(task.dueDate)}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <AvatarPill name={task.pic} subtle />
                              <StatusBadge status={task.sla} />
                            </div>
                          </button>
                        )) : (
                          <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            No tasks
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/70">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      {[
                        ["title", "Task"],
                        ["project", "Project"],
                        ["channel", "Channel"],
                        ["pic", "PIC"],
                        ["priority", "Priority"],
                        ["dueDate", "Due Date"],
                        ["status", "Status"],
                        ["sla", "SLA"],
                      ].map(([key, label]) => (
                        <TableHead key={key} className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-left"
                            onClick={() => {
                              const nextDir = taskSortKey === key && taskSortDir === "asc" ? "desc" : "asc";
                              setTaskSortKey(key as TaskSortKey);
                              setTaskSortDir(nextDir);
                            }}
                          >
                            {label}
                            {taskSortKey === key ? (
                              taskSortDir === "asc" ? <ArrowUpAZ className="h-3.5 w-3.5" /> : <ArrowDownAZ className="h-3.5 w-3.5" />
                            ) : (
                              <GripVertical className="h-3.5 w-3.5 opacity-40" />
                            )}
                          </button>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTasks.map((task) => (
                      <TableRow key={task.id} className="cursor-pointer border-slate-50 hover:bg-slate-50/70" onClick={() => openTaskDetail(task)}>
                        <TableCell className="px-4 py-4">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">{task.title}</p>
                            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{task.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{task.project}</TableCell>
                        <TableCell className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{task.channel}</TableCell>
                        <TableCell className="px-4 py-4"><AvatarPill name={task.pic} subtle /></TableCell>
                        <TableCell className="px-4 py-4"><PriorityBadge priority={task.priority} /></TableCell>
                        <TableCell className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{formatShortDate(task.dueDate)}</TableCell>
                        <TableCell className="px-4 py-4"><StatusBadge status={task.status} /></TableCell>
                        <TableCell className="px-4 py-4"><StatusBadge status={task.sla} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DashboardCard>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <PageSection title="Project Registry">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <StatCard label="Projects" value={projects.length} icon={<FolderKanban className="text-blue-600" />} />
              <StatCard label="On Track" value={projects.filter((item) => item.status === "On Track").length} icon={<ShieldCheck className="text-emerald-500" />} />
              <StatCard label="At Risk" value={projects.filter((item) => item.status === "At Risk").length} icon={<AlertTriangle className="text-rose-500" />} className={criticalGlowClass(projects.some((item) => item.status === "At Risk"))} />
              <StatCard label="Approval Queue" value={projects.reduce((sum, item) => sum + item.pendingApproval, 0)} icon={<CheckCheck className="text-amber-500" />} className={criticalGlowClass(projects.some((item) => item.pendingApproval > 0))} />
            </div>
          </PageSection>

          <DashboardCard label="Projects">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className="w-full rounded-[24px] border border-slate-100 bg-slate-50 p-5 text-left transition hover:border-blue-200 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">{project.name}</p>
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">{formatCategoryLabel(project.category ?? "general_operations")}</p>
                      <p className="max-w-[28rem] text-[10px] font-semibold leading-relaxed text-slate-500">{project.summary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={project.status} />
                      {canManage ? (
                        <button
                          type="button"
                          aria-label={`Edit ${project.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditProjectComposer(project);
                          }}
                          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Owner</p>
                      <p className="mt-1 text-[10px] font-black uppercase text-slate-700">{project.owner}</p>
                    </div>
                    <div className="rounded-2xl border border-white bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Open</p>
                      <p className="mt-1 text-[10px] font-black uppercase text-slate-700">{project.openTasks}</p>
                    </div>
                    <div className="rounded-2xl border border-white bg-white px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Deadline</p>
                      <p className="mt-1 text-[10px] font-black uppercase text-slate-700">{formatShortDate(project.deadline)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard label="Project Categories">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {projectCategories.map((category) => (
                  <div key={category} className="flex items-center gap-2 rounded-[16px] border border-slate-100 bg-slate-50 px-3 py-3">
                    {editingProjectCategory === category ? (
                      <>
                        <DnaInput
                          value={editingProjectCategoryValue}
                          onChange={(event) => setEditingProjectCategoryValue(event.target.value)}
                          placeholder="category name"
                          className="h-9"
                        />
                        <DnaButton variant="secondary" loading={saving} onClick={() => void updateProjectCategory(category)}>Save</DnaButton>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">{formatCategoryLabel(category)}</p>
                        </div>
                        {canManage ? (
                          <DnaButton
                            variant="outline"
                            onClick={() => {
                              setEditingProjectCategory(category);
                              setEditingProjectCategoryValue(category);
                            }}
                          >
                            Edit
                          </DnaButton>
                        ) : null}
                      </>
                    )}
                  </div>
                ))}
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  <DnaInput value={newProjectCategory} onChange={(event) => setNewProjectCategory(event.target.value)} placeholder="add new category" />
                  <DnaButton variant="secondary" loading={saving} onClick={() => void createProjectCategory()}>Add Category</DnaButton>
                </div>
              ) : null}
            </div>
          </DashboardCard>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <PageSection title="Deadline Calendar">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.85fr]">
              <DashboardCard label="July 2026">
                <div className="grid grid-cols-7 gap-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map(({ day, valid, date, index }) => {
                    const dayTasks = valid ? tasksByDate[date] ?? [] : [];
                    return (
                      <button
                        key={date}
                        type="button"
                        aria-label={valid ? `Day ${String(day).padStart(2, "0")}` : undefined}
                        onClick={() => {
                          if (!valid) return;
                          setSelectedCalendarDate(date);
                        }}
                        className={`min-h-[8.5rem] rounded-[20px] border p-3 text-left ${valid ? selectedCalendarDate === date ? "border-blue-200 bg-blue-50/60" : "border-slate-100 bg-white" : "border-transparent bg-transparent opacity-0"} `}
                      >
                        {valid ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="tabular text-[11px] font-black text-slate-700">{String(day).padStart(2, "0")}</span>
                              {dayTasks.length ? <span className="rounded-full bg-slate-900 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white">{dayTasks.length}</span> : null}
                            </div>
                            <div className="mt-3 space-y-2">
                              {dayTasks.slice(0, 3).map((task) => (
                                <div key={task.id} className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2">
                                  <p className="line-clamp-2 text-[9px] font-black uppercase tracking-tight text-slate-800">{task.title}</p>
                                  <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">{task.pic}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </DashboardCard>

              <DashboardCard label="Selected Day">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Selected date</p>
                    <p className="mt-2 text-[22px] font-black tracking-[-0.03em] text-slate-900">{formatLongDate(selectedCalendarDate)}</p>
                  </div>
                  <div className="space-y-3">
                    {selectedCalendarTasks.length ? selectedCalendarTasks.slice(0, 6).map((task) => (
                      <div key={task.id} className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">{task.title}</p>
                            <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{task.project}</p>
                          </div>
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <AvatarPill name={task.pic} subtle />
                          <StatusBadge status={task.status} />
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                        No deadlines on this day
                      </div>
                    )}
                  </div>
                </div>
              </DashboardCard>
            </div>
          </PageSection>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <PageSection title="Team KPI">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <StatCard label="Members" value={profiles.length} icon={<Users2 className="text-blue-600" />} />
              <StatCard label="Average KPI" value={Math.round((profiles.reduce((sum, member) => sum + (member.monthKpi ?? 0), 0) / Math.max(profiles.length, 1)))} icon={<BarChart3 className="text-emerald-500" />} />
              <StatCard label="Notifications" value={notifications.length} icon={<Bell className="text-amber-500" />} />
              <StatCard label="Insights" value={insights.length} icon={<FileText className="text-slate-700" />} />
            </div>
          </PageSection>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <DashboardCard label="Roster">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {profiles.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMemberId(member.id)}
                    className="rounded-[20px] border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-white"
                  >
                    <div className="space-y-3">
                      <AvatarPill name={member.name} role={member.role} />
                      <ProgressBar value={member.breakdown?.discipline ?? member.monthKpi ?? 0} tone="emerald" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white bg-white p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Done</p>
                          <p className="mt-1 text-[12px] font-black text-slate-900">{member.completed ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-white bg-white p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Late</p>
                          <p className="mt-1 text-[12px] font-black text-slate-900">{member.late ?? 0}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard label="Member Detail">
              {selectedMember ? (
                <div className="space-y-5">
                  <AvatarPill name={selectedMember.name} role={selectedMember.role} />
                  <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Bio</p>
                    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-slate-500">{selectedMember.bio}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">KPI</p>
                      <p className="mt-2 text-[24px] font-black text-slate-900">{selectedMember.monthKpi ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Tasks</p>
                      <p className="mt-2 text-[24px] font-black text-slate-900">{selectedMember.completed ?? 0}</p>
                    </div>
                  </div>
                  {selectedMember.breakdown ? (
                    <div className="space-y-3">
                      {Object.entries(selectedMember.breakdown).map(([label, value]) => (
                        <div key={label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
                            <span className="tabular text-[10px] font-black text-slate-700">{value}</span>
                          </div>
                          <ProgressBar value={value} tone={label === "discipline" ? "emerald" : label === "quality" ? "amber" : "blue"} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </DashboardCard>
          </div>
        </TabsContent>

      </Tabs>

      <Dialog open={taskDetailOpen} onOpenChange={(open) => (open ? setTaskDetailOpen(true) : closeTaskDetail())}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_30px_120px_-40px_rgba(15,23,42,0.45)]">
          {selectedTask ? (
            <div className="flex max-h-[92vh] flex-col">
              <DialogHeader className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-start justify-between gap-4 pr-10">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">{selectedTask.id}</p>
                    <DialogTitle className="mt-2 text-[26px] font-black tracking-[-0.04em] text-slate-900">{selectedTask.title}</DialogTitle>
                    <DialogDescription className="mt-2 max-w-2xl text-[12px] font-semibold leading-relaxed text-slate-500">
                      {selectedTask.brief}
                    </DialogDescription>
                  </div>
                  <StatusBadge status={selectedTask.status} />
                </div>
              </DialogHeader>
              <div className="space-y-6 overflow-y-auto px-6 py-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Project</p>
                    <p className="mt-2 text-[11px] font-black uppercase tracking-tight text-slate-900">{selectedTask.project}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Due</p>
                    <p className="mt-2 text-[11px] font-black uppercase tracking-tight text-slate-900">{formatLongDate(selectedTask.dueDate)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Category</p>
                    <p className="mt-2 text-[11px] font-black uppercase tracking-tight text-slate-900">{formatCategoryLabel(selectedTask.category ?? selectedTask.channel)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Hours</p>
                    <p className="mt-2 text-[11px] font-black uppercase tracking-tight text-slate-900">{selectedTask.actualHours ?? 0} / {selectedTask.estimatedHours ?? 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <AvatarPill name={selectedTask.pic} role="PIC" />
                      <AvatarPill name={selectedTask.reviewer} role="Reviewer" subtle />
                    </div>
                    <div className="space-y-3 rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Checklist</p>
                        <p className="tabular text-[10px] font-black text-slate-500">{selectedTask.checklistDone}/{selectedTask.checklistTotal}</p>
                      </div>
                      <ProgressBar value={Math.round((selectedTask.checklistDone / Math.max(selectedTask.checklistTotal, 1)) * 100)} tone="blue" />
                      <div className="flex flex-wrap gap-2">
                        <PriorityBadge priority={selectedTask.priority} />
                        <StatusBadge status={selectedTask.sla} />
                        {(selectedTask.tags ?? []).map((tag) => (
                          <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {(selectedTask.attachments ?? []).length ? (
                      <div className="space-y-3 rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Attachments</p>
                          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{selectedTask.attachments?.length ?? 0} files</span>
                        </div>
                        <div className="space-y-2">
                          {(selectedTask.attachments ?? []).map((file) => (
                            <div key={`${file.name}-${file.sizeKb}`} className="flex items-center justify-between rounded-[16px] border border-white bg-white px-4 py-3">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">{file.name}</p>
                                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{file.type}</p>
                              </div>
                              <span className="text-[10px] font-black text-slate-500">{file.sizeKb} KB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Comments</p>
                        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{selectedTask.comments?.length ?? 0} threads</span>
                      </div>
                      <div className="space-y-3">
                        {(selectedTask.comments ?? []).map((note) => (
                          <div key={`${note.createdAt}-${note.body}`} className="rounded-[16px] border border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-semibold leading-relaxed text-slate-600">
                            <div className="mb-2 flex items-center gap-2">
                              <MessageSquareQuote className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{note.author}</span>
                            </div>
                            {note.body}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 rounded-[16px] border border-slate-100 bg-white p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Add Comment</p>
                        <textarea
                          value={commentDraft}
                          onChange={(event) => setCommentDraft(event.target.value)}
                          className="min-h-24 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-semibold text-slate-700 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                          placeholder="Add review note or clarification..."
                        />
                        <DnaButton variant="secondary" loading={saving} onClick={() => void addComment()}>
                          Add Comment
                        </DnaButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t border-slate-100 bg-white/95 px-6 py-4">
                <DnaButton variant="secondary" loading={saving} onClick={() => void updateTaskStatus(selectedTask.id, "Waiting Approval")}>Submit</DnaButton>
                {canManage ? (
                  <>
                    <DnaButton variant="outline" loading={saving} onClick={() => openEditTaskComposer(selectedTask)} icon={<Pencil />}>Edit Task</DnaButton>
                    <DnaButton variant="outline" loading={saving} onClick={() => void updateTaskStatus(selectedTask.id, "Done")}>Approve</DnaButton>
                    <DnaButton variant="danger" loading={saving} onClick={() => void updateTaskStatus(selectedTask.id, "Revision")}>Revision</DnaButton>
                    <DnaButton variant="danger" loading={saving} onClick={() => void deleteTask(selectedTask.id)} icon={<Trash2 />}>Delete Task</DnaButton>
                  </>
                ) : null}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={projectComposerOpen} onOpenChange={(open) => (open ? setProjectComposerOpen(true) : closeProjectComposer())}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_30px_120px_-40px_rgba(15,23,42,0.45)]">
          <form onSubmit={(event) => void createProject(event)} className="flex max-h-[92vh] flex-col">
            <DialogHeader className="border-b border-slate-100 px-6 py-5">
              <DialogTitle className="text-[26px] font-black tracking-[-0.04em] text-slate-900">
                {projectComposerMode === "create" ? "Project Composer" : "Edit Project"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-[12px] font-semibold leading-relaxed text-slate-500">
                Buat atau update container project tanpa memenuhi surface utama page.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 overflow-y-auto px-6 py-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Project Name</p>
                <DnaInput required value={projectForm.name} onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Project name" />
              </div>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Channel</p>
                <DnaInput value={projectForm.channel} onChange={(event) => setProjectForm((prev) => ({ ...prev, channel: event.target.value }))} placeholder="Channel" />
              </div>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Category</p>
                <select
                  aria-label="Project Category"
                  value={projectForm.category}
                  onChange={(event) => setProjectForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                >
                  {projectCategories.map((category) => (
                    <option key={category} value={category}>
                      {formatCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Owner</p>
                <DnaInput value={projectForm.owner} onChange={(event) => setProjectForm((prev) => ({ ...prev, owner: event.target.value }))} placeholder="Owner" />
              </div>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Status</p>
                <select
                  aria-label="Project Status"
                  value={projectForm.status}
                  onChange={(event) => setProjectForm((prev) => ({ ...prev, status: event.target.value as ProjectStatus }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                >
                  {["On Track", "At Risk", "Review", "Completed"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Start Date</p>
                <DnaInput type="date" value={projectForm.start} onChange={(event) => setProjectForm((prev) => ({ ...prev, start: event.target.value }))} />
              </div>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Deadline</p>
                <DnaInput type="date" value={projectForm.deadline} onChange={(event) => setProjectForm((prev) => ({ ...prev, deadline: event.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Progress</p>
                <DnaInput type="number" min={0} max={100} value={projectForm.progress} onChange={(event) => setProjectForm((prev) => ({ ...prev, progress: Number(event.target.value) }))} />
              </div>
              <div className="md:col-span-2">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Summary</p>
                <DnaInput value={projectForm.summary} onChange={(event) => setProjectForm((prev) => ({ ...prev, summary: event.target.value }))} placeholder="Summary" />
              </div>
              <div className="md:col-span-2">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Blockers</p>
                <DnaInput value={projectForm.blockers} onChange={(event) => setProjectForm((prev) => ({ ...prev, blockers: event.target.value }))} placeholder="Blockers, separated by comma" />
              </div>
            </div>
            <DialogFooter className="border-t border-slate-100 bg-white/95 px-6 py-4">
              {projectComposerMode === "edit" && selectedProject ? (
                <DnaButton variant="danger" loading={saving} onClick={() => void deleteProject(selectedProject.id)} icon={<Trash2 />}>Delete Project</DnaButton>
              ) : null}
              <DnaButton variant="outline" type="button" onClick={() => closeProjectComposer()}>
                Cancel
              </DnaButton>
              {projectComposerMode === "create" ? (
                <DnaButton variant="secondary" type="submit" loading={saving} icon={<Plus />}>Create Project</DnaButton>
              ) : (
                <DnaButton variant="secondary" type="button" loading={saving} onClick={() => void saveProject()} icon={<Save />}>Save Project</DnaButton>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={taskComposerOpen} onOpenChange={(open) => (open ? setTaskComposerOpen(true) : closeTaskComposer())}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_30px_120px_-40px_rgba(15,23,42,0.45)]">
          <form onSubmit={(event) => void createTask(event)} className="flex max-h-[92vh] flex-col">
            <DialogHeader className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4 pr-10">
                <div>
                  <DialogTitle className="text-[26px] font-black tracking-[-0.04em] text-slate-900">
                    {taskComposerMode === "create" ? "Task Composer" : "Edit Task"}
                  </DialogTitle>
                  <DialogDescription className="mt-2 max-w-2xl text-[12px] font-semibold leading-relaxed text-slate-500">
                    Input task lengkap untuk digital marketing: assignment, review owner, timeline, hours, tags, dan attachment seed untuk prototype.
                  </DialogDescription>
                </div>
                <div className="rounded-[20px] border border-blue-100 bg-blue-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                  Assign by {actorName} · approval by {taskForm.reviewer}
                </div>
              </div>
            </DialogHeader>

            <div className="grid flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[1.1fr_0.7fr]">
              <div className="space-y-6 px-6 py-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Task Name</p>
                    <DnaInput required value={taskForm.title} onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Contoh: Review landing CRO hypothesis" />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Project</p>
                    <select
                      aria-label="Project"
                      value={taskForm.projectId}
                      onChange={(event) => syncTaskProject(event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Category</p>
                    <select
                      aria-label="Category"
                      value={taskForm.category}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, category: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    >
                      {taskCategoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {formatCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Channel</p>
                    <DnaInput aria-label="Channel" value={taskForm.channel} onChange={(event) => setTaskForm((prev) => ({ ...prev, channel: event.target.value }))} placeholder="Content / SEO / Ads" />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Priority</p>
                    <select
                      aria-label="Priority"
                      value={taskForm.priority}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value as TaskRow["priority"] }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    >
                      {["Low", "Medium", "High", "Urgent"].map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Status</p>
                    <select
                      aria-label="Status"
                      value={taskForm.status}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    >
                      {statusOrder.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">PIC</p>
                    <select
                      aria-label="PIC"
                      value={taskForm.pic}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, pic: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    >
                      {teamMemberOptions.filter((name) => name !== "Revi").map((member) => (
                        <option key={member} value={member}>
                          {member}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Reviewer</p>
                    <select
                      aria-label="Reviewer"
                      value={taskForm.reviewer}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, reviewer: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    >
                      {teamMemberOptions.map((member) => (
                        <option key={member} value={member}>
                          {member}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Start Date</p>
                    <DnaInput aria-label="Start Date" type="date" value={taskForm.startDate} onChange={(event) => setTaskForm((prev) => ({ ...prev, startDate: event.target.value }))} />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Due Date</p>
                    <DnaInput aria-label="Due Date" type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))} />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Estimated Hours</p>
                    <DnaInput aria-label="Estimated Hours" type="number" min={0} step="0.5" value={taskForm.estimatedHours} onChange={(event) => setTaskForm((prev) => ({ ...prev, estimatedHours: Number(event.target.value) }))} />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Actual Hours</p>
                    <DnaInput aria-label="Actual Hours" type="number" min={0} step="0.5" value={taskForm.actualHours} onChange={(event) => setTaskForm((prev) => ({ ...prev, actualHours: Number(event.target.value) }))} />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Checklist Done</p>
                    <DnaInput aria-label="Checklist Done" type="number" min={0} value={taskForm.checklistDone} onChange={(event) => setTaskForm((prev) => ({ ...prev, checklistDone: Number(event.target.value) }))} />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Checklist Total</p>
                    <DnaInput aria-label="Checklist Total" type="number" min={1} value={taskForm.checklistTotal} onChange={(event) => setTaskForm((prev) => ({ ...prev, checklistTotal: Number(event.target.value) }))} />
                  </div>
                  <div className="md:col-span-2">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Description / Brief</p>
                    <textarea
                      aria-label="Description"
                      value={taskForm.brief}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, brief: event.target.value }))}
                      className="min-h-32 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      placeholder="Isi objective, deliverable, CTA, dependencies, dan output yang harus direview."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Tags</p>
                    <DnaInput aria-label="Tags" value={taskForm.tags} onChange={(event) => setTaskForm((prev) => ({ ...prev, tags: event.target.value }))} placeholder="seo, landing-page, high-intent" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-6 xl:border-t-0 xl:border-l">
                <div className="space-y-6">
                  <div className="rounded-[24px] border border-white bg-white p-5 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Assignment Summary</p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Project</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">{taskForm.project || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">PIC</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">{taskForm.pic}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Reviewer</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">{taskForm.reviewer}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Timeline</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">{taskForm.startDate} → {taskForm.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white bg-white p-5 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Attachment Seed</p>
                    <div className="mt-4 space-y-3">
                      <DnaInput aria-label="Attachment Name" value={taskForm.attachmentName} onChange={(event) => setTaskForm((prev) => ({ ...prev, attachmentName: event.target.value }))} placeholder="brief-q3-acquisition.pdf" />
                      <div className="grid grid-cols-2 gap-3">
                        <DnaInput aria-label="Attachment Type" value={taskForm.attachmentType} onChange={(event) => setTaskForm((prev) => ({ ...prev, attachmentType: event.target.value }))} placeholder="application/pdf" />
                        <DnaInput aria-label="Attachment Size KB" type="number" min={0} value={taskForm.attachmentSizeKb} onChange={(event) => setTaskForm((prev) => ({ ...prev, attachmentSizeKb: Number(event.target.value) }))} placeholder="Size KB" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-700">Approval Logic</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {["Assign", "Execute", "Submit", "Approve"].map((step, index) => (
                        <div key={step} className="rounded-2xl border border-white/80 bg-white/70 px-3 py-3">
                          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-blue-400">Step {index + 1}</p>
                          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-blue-900">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 bg-white/95 px-6 py-4">
              {taskComposerMode === "edit" && selectedTask ? (
                <DnaButton variant="danger" loading={saving} onClick={() => void deleteTask(selectedTask.id)} icon={<Trash2 />}>
                  Delete Task
                </DnaButton>
              ) : null}
              <DnaButton variant="outline" type="button" onClick={() => closeTaskComposer()}>
                Cancel
              </DnaButton>
              {taskComposerMode === "create" ? (
                <DnaButton variant="secondary" type="submit" loading={saving} icon={<Plus />}>
                  Create Task
                </DnaButton>
              ) : (
                <DnaButton variant="secondary" type="button" loading={saving} onClick={() => void saveTask()} icon={<Save />}>
                  Save Task
                </DnaButton>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
