"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Folder,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users2,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaButton, DnaInput } from "@/components/dna";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMarketingPrototypeBundle } from "@/components/marketing/use-marketing-prototype";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

type TaskStatus = "Not started" | "Working on it" | "Revision" | "Done";

type TaskRow = {
  id: string;
  title: string;
  projectId: string;
  project: string;
  brand: "Dreamlab" | "Toribio";
  assignedBy: string;
  pic: string;
  reviewer: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  startDate?: string;
  dueDate: string;
  status: TaskStatus;
  sla: "Healthy" | "Watch" | "Late";
  notes: string;
  history?: Array<{ at: string; by: string; from?: string; to: string; note: string }>;
};

type ProfileRow = {
  id: string;
  name: string;
  role: string;
  monthKpi?: number;
  completed?: number;
  inProgress?: number;
  late?: number;
};

type MonthlyPerformancePoint = {
  month: string;
  score: number;
  done: number;
  total: number;
};

type ManagementTaskBoardProps = {
  activeMember: string;
};

type MemberConfig = {
  slug: "overview" | "aurel" | "revi" | "zarka" | "gusti" | "edy";
  label: string;
  role: string;
  aliases: string[];
};

type QuickAddState = {
  title: string;
  project: string;
  brand: "Dreamlab" | "Toribio";
  pic: string;
  startDate: string;
  dueDate: string;
  priority: TaskRow["priority"];
};

type TaskDraft = {
  title: string;
  project: string;
  brand: "Dreamlab" | "Toribio";
  pic: string;
  status: TaskStatus;
  priority: TaskRow["priority"];
  startDate: string;
  dueDate: string;
  notes: string;
};

const memberConfigs: MemberConfig[] = [
  { slug: "overview", label: "Overview", role: "Snapshot Divisi", aliases: [] },
  { slug: "aurel", label: "Aurel", role: "Content Creator", aliases: ["aurel"] },
  { slug: "revi", label: "Revita", role: "Digital Marketing Strategy", aliases: ["revi", "revita"] },
  { slug: "zarka", label: "Zarkasi", role: "Full Stack Video Editor", aliases: ["zarka", "zarkasi"] },
  { slug: "gusti", label: "Gusti", role: "Full Stack Desain Graphic", aliases: ["gusti"] },
  { slug: "edy", label: "Edy", role: "Design Logo & Packaging", aliases: ["edy"] },
];

const memberLookup = memberConfigs.reduce<Record<string, MemberConfig>>((acc, member) => {
  acc[member.slug] = member;
  member.aliases.forEach((alias) => {
    acc[alias] = member;
  });
  return acc;
}, {});

const statusGroups: TaskStatus[] = ["Not started", "Working on it", "Revision", "Done"];

const statusLabels: Record<TaskStatus, string> = {
  "Not started": "Not started",
  "Working on it": "Working on it",
  Revision: "Revision",
  Done: "Done",
};

const statusStyles: Record<TaskStatus, { accent: string; pill: string; soft: string }> = {
  "Not started": { accent: "bg-slate-400", pill: "bg-slate-50 text-slate-600 border-slate-200", soft: "bg-slate-50/70" },
  "Working on it": { accent: "bg-blue-500", pill: "bg-blue-50 text-blue-700 border-blue-100", soft: "bg-blue-50/70" },
  Revision: { accent: "bg-rose-500", pill: "bg-rose-50 text-rose-700 border-rose-100", soft: "bg-rose-50/70" },
  Done: { accent: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-100", soft: "bg-emerald-50/70" },
};

const overviewMembers = memberConfigs.filter((member) => member.slug !== "overview");

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function matchMember(task: TaskRow, memberSlug: string) {
  const member = memberLookup[memberSlug];
  if (!member || member.slug === "overview") return true;
  const owner = normalize(task.pic);
  return [member.label, ...member.aliases].some((alias) => owner.includes(normalize(alias)));
}

function defaultQuickAdd(memberSlug: string, viewerName?: string | null): QuickAddState {
  const member = memberLookup[memberSlug] ?? memberLookup.overview;
  const pic = member?.slug === "overview" ? (viewerName ?? "Aurel") : member.label;
  return {
    title: "",
    project: "",
    brand: "Dreamlab",
    pic,
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    priority: "Medium",
  };
}

function defaultDraft(memberSlug: string, viewerName?: string | null): TaskDraft {
  const member = memberLookup[memberSlug] ?? memberLookup.overview;
  const pic = viewerName ?? (member?.slug === "overview" ? "Aurel" : member.label);
  return {
    title: "",
    project: "",
    brand: "Dreamlab",
    pic,
    status: "Not started",
    priority: "Medium",
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

function taskToDraft(task: TaskRow): TaskDraft {
  return {
    title: task.title,
    project: task.project,
    brand: task.brand,
    pic: task.pic,
    status: task.status,
    priority: task.priority,
    startDate: task.startDate ?? task.dueDate,
    dueDate: task.dueDate,
    notes: task.notes ?? "",
  };
}

function draftToTask(taskId: string, draft: TaskDraft): TaskRow {
  return {
    id: taskId,
    title: draft.title.trim(),
    projectId: "local",
    project: draft.project.trim() || "Marketing",
    brand: draft.brand,
    assignedBy: "System",
    pic: draft.pic.trim() || "Aurel",
    reviewer: "",
    priority: draft.priority,
    startDate: draft.startDate,
    dueDate: draft.dueDate,
    status: draft.status,
    sla: "Healthy",
    notes: draft.notes,
    history: [],
  };
}

function formatMondayDate(value: string) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function formatMonthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function formatMonthShortLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

function getRecentMonthKeys(monthCount: number, today: string) {
  const current = new Date(`${today}T00:00:00`);
  if (Number.isNaN(current.getTime())) return [];
  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(current);
    date.setMonth(current.getMonth() - (monthCount - 1 - index));
    return date.toISOString().slice(0, 7);
  });
}

function getDayLeftLabel(dueDate: string, today: string) {
  if (!dueDate) return "-";
  const dayMs = 24 * 60 * 60 * 1000;
  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  if (Number.isNaN(due.getTime()) || Number.isNaN(now.getTime())) return "-";
  const diff = Math.round((due.getTime() - now.getTime()) / dayMs);
  if (diff === 0) return "Today";
  if (diff > 0) return `${diff} day${diff === 1 ? "" : "s"}`;
  return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} late`;
}

function stopRowClick(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function ActionIconButton({
  label,
  tone = "default",
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass = {
    default: "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-700",
    danger: "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-700",
    success: "border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-700",
  }[tone];

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${toneClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function MetricMini({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "danger" }) {
  return (
    <div className={`rounded-[18px] border px-3 py-3 ${tone === "danger" ? "border-rose-100 bg-rose-50" : "border-slate-200 bg-white"}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-[18px] font-bold tabular-nums ${tone === "danger" ? "text-rose-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

export function ManagementTaskBoard({ activeMember }: ManagementTaskBoardProps) {
  const router = useRouter();
  const { data: prototype } = useMarketingPrototypeBundle();
  const tasks = useMemo(() => (prototype?.tasks ?? []) as TaskRow[], [prototype?.tasks]);
  const projects = useMemo(() => (prototype?.projects ?? []) as Array<{ id: string; name: string; channel?: string }>, [prototype?.projects]);
  const profiles = useMemo(() => (prototype?.profiles ?? []) as ProfileRow[], [prototype?.profiles]);
  const viewer = prototype?.viewer as { name: string | null; isManager: boolean } | undefined;
  const isManager = viewer?.isManager ?? false;
  const viewerName = viewer?.name ?? null;
  const queryClient = useQueryClient();
  const [localTasks, setLocalTasks] = useState<TaskRow[]>(tasks);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft>(defaultDraft(activeMember, viewerName));
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [localProjects, setLocalProjects] = useState<string[]>([]);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");

  const initialProjects = useMemo(() => {
    const fromProjects = projects.map((p) => p.name);
    return Array.from(new Set(fromProjects.filter(Boolean)));
  }, [projects]);

  useEffect(() => {
    if (initialProjects.length > 0 && localProjects.length === 0) {
      setLocalProjects(initialProjects);
    }
  }, [initialProjects, localProjects.length]);

  const [globalQuickAdd, setGlobalQuickAdd] = useState<QuickAddState>(defaultQuickAdd(activeMember, viewerName));

  useEffect(() => {
    setLocalTasks((current) => {
      const localIds = new Set(current.filter((t) => t.id.startsWith('local-')).map((t) => t.id));
      const serverTasks = tasks.filter((t) => !localIds.has(t.id));
      const localTasks = current.filter((t) => localIds.has(t.id));
      return [...serverTasks, ...localTasks];
    });
  }, [tasks]);

  useEffect(() => {
    setGlobalQuickAdd(defaultQuickAdd(activeMember, viewerName));
    if (!selectedTaskId) {
      setDraft(defaultDraft(activeMember, viewerName));
    }
  }, [activeMember, selectedTaskId, viewerName]);

  useEffect(() => {
    if (!drawerOpen) return;
    if (drawerMode === "edit" && selectedTaskId) {
      const selected = localTasks.find((task) => task.id === selectedTaskId);
      if (selected) {
        setDraft(taskToDraft(selected));
      }
      return;
    }

    setDraft(defaultDraft(activeMember, viewerName));
  }, [activeMember, drawerMode, drawerOpen, localTasks, selectedTaskId, viewerName]);

  const selectedMember = memberLookup[activeMember] ?? memberLookup.overview;
  const isOverview = selectedMember?.slug === "overview";
  const today = new Date().toISOString().slice(0, 10);

  // Viewer identity → slug mapping
  const viewerSlug = useMemo(() => {
    if (!viewerName) return null;
    const name = normalize(viewerName);
    const found = memberConfigs.find(
      (m) => normalize(m.label) === name || m.aliases.some((a) => normalize(a) === name),
    );
    return found?.slug ?? null;
  }, [viewerName]);

  // Redirect non-manager if they somehow land on another member's page
  useEffect(() => {
    if (!isManager && viewerSlug && activeMember !== "overview" && activeMember !== viewerSlug) {
      router.push(`/marketing/management-task/${viewerSlug}`);
    }
  }, [isManager, viewerSlug, activeMember, router]);

  // Restrict member dropdown for non-manager
  const memberSelectOptions = useMemo(() => {
    const all = [
      { value: "overview", label: "Overview" },
      ...overviewMembers.map((member) => ({ value: member.slug, label: member.label })),
    ];
    if (isManager) return all;
    if (viewerSlug) {
      return all.filter((o) => o.value === "overview" || o.value === viewerSlug);
    }
    return all.filter((o) => o.value === "overview");
  }, [isManager, viewerSlug]);

  const projectOptions = useMemo(() => {
    const fromTasks = localTasks.map((task) => task.project);
    return Array.from(new Set([...localProjects, ...fromTasks].map((value) => value.trim()).filter(Boolean))).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [localTasks, localProjects]);

  const monthOptions = useMemo(() => {
    return Array.from(
      new Set(
        localTasks
          .map((task) => task.dueDate?.slice(0, 7))
          .filter((value): value is string => Boolean(value)),
      ),
    )
      .sort((left, right) => right.localeCompare(left))
      .map((value) => ({ value, label: formatMonthLabel(value) }));
  }, [localTasks]);

  const visibleTasks = useMemo(
    () => (isOverview ? localTasks : localTasks.filter((task) => matchMember(task, selectedMember.slug))),
    [isOverview, localTasks, selectedMember.slug],
  );

  const boardTasks = useMemo(() => {
    return visibleTasks
      .filter((task) => selectedMonth === "all" || task.dueDate.slice(0, 7) === selectedMonth)
      .filter((task) => selectedCampaign === "all" || task.project === selectedCampaign);
  }, [selectedCampaign, selectedMonth, visibleTasks]);

  const chartMonths = useMemo(() => getRecentMonthKeys(6, today), [today]);

  const monthlyPerformance = useMemo(
    () =>
      overviewMembers.map((member) => {
        const data = chartMonths.map((month) => {
          const rows = localTasks.filter((task) => matchMember(task, member.slug) && task.dueDate.slice(0, 7) === month);
          const done = rows.filter((task) => task.status === "Done").length;
          const score = rows.length ? Math.round((done / rows.length) * 100) : 0;
          return {
            month,
            label: formatMonthShortLabel(month),
            score,
            done,
            total: rows.length,
          };
        });

        const profile = profiles.find((item) => normalize(item.name) === normalize(member.label) || normalize(item.id) === normalize(member.slug));

        return {
          ...member,
          profileKpi: profile?.monthKpi ?? 0,
          data,
        };
      }),
    [chartMonths, localTasks, profiles],
  );

  const snapshots = useMemo(
    () =>
      overviewMembers.map((member) => {
        const rows = localTasks.filter((task) => matchMember(task, member.slug));
        const done = rows.filter((task) => task.status === "Done").length;
        const open = rows.filter((task) => task.status !== "Done").length;
        const late = rows.filter((task) => task.dueDate < today && task.status !== "Done").length;
        const progress = rows.length ? Math.round((done / rows.length) * 100) : 0;
        const profile = profiles.find((item) => normalize(item.name) === normalize(member.label) || normalize(item.id) === normalize(member.slug));

        return {
          ...member,
          role: profile?.role ?? member.role,
          done,
          open,
          late,
          progress,
          total: rows.length,
          kpi: profile?.monthKpi ?? 0,
        };
      }),
    [localTasks, profiles, today],
  );

  const stats = useMemo(() => {
    const open = boardTasks.filter((task) => task.status !== "Done").length;
    const done = boardTasks.filter((task) => task.status === "Done").length;
    const late = boardTasks.filter((task) => task.dueDate < today && task.status !== "Done").length;
    const dueSoon = boardTasks.filter((task) => {
      const diff = new Date(task.dueDate).getTime() - new Date(today).getTime();
      return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000 && task.status !== "Done";
    }).length;
    const profile = profiles.find((item) => normalize(item.name) === normalize(selectedMember?.label ?? ""));

    return [
      { label: "Open Tasks", value: open },
      { label: "Done", value: done },
      { label: "Late", value: late },
      { label: "Due Soon", value: dueSoon },
      { label: "KPI", value: 0 },
    ];
  }, [boardTasks, profiles, selectedMember?.label, today]);

  const rowsByStatus = useMemo(
    () =>
      statusGroups.map((status) => ({
        status,
        items: boardTasks
          .filter((task) => task.status === status)
          .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.title.localeCompare(right.title)),
      })),
    [boardTasks],
  );

  const selectedTask = selectedTaskId ? localTasks.find((task) => task.id === selectedTaskId) : undefined;

  function setTaskField(taskId: string, field: keyof TaskRow, value: string) {
    // Save previous state for rollback
    const prevTasks = localTasks;

    setLocalTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task,
      ),
    );

    // Persist field changes to backend (status uses dedicated endpoint, others use PATCH)
    const persistPromise = (() => {
      if (field === "status") {
        return api.patch(`/marketing/prototype/tasks/${taskId}/status`, { status: value, note: `Status changed to ${value}` });
      } else if (taskId.startsWith("local-")) {
        // Local-only tasks don't exist on backend yet, skip
        return Promise.resolve();
      } else if (!isManager && field === "dueDate") {
        // Non-managers cannot edit due date
        return Promise.resolve();
      } else {
        return api.patch(`/marketing/prototype/tasks/${taskId}`, { [field]: value });
      }
    })();

    persistPromise
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
      })
      .catch((err) => {
        console.error("[InlineEdit] Update failed, rolling back:", field, err?.response?.status);
        // Rollback to previous state on failure
        setLocalTasks(prevTasks);
        // Show user feedback
        alert(`Gagal menyimpan perubahan! Silakan coba lagi. (${err?.response?.status || 'Network error'})`);
      });
  }

  function openCreateDrawer() {
    const member = selectedMember?.slug === "overview" ? memberLookup.aurel : selectedMember;
    const pic = member?.slug === "overview"
      ? (viewerName ?? "Aurel")
      : member.label;
    setDrawerMode("create");
    setSelectedTaskId(null);
    setDraft({
      ...defaultDraft(activeMember, viewerName),
      status: "Not started",
      pic,
    });
    setDrawerOpen(true);
  }

  function openEditDrawer(task: TaskRow) {
    setDrawerMode("edit");
    setSelectedTaskId(task.id);
    setDraft(taskToDraft(task));
    setDrawerOpen(true);
  }

  function createGlobalQuickTask() {
    if (!globalQuickAdd.title.trim()) return;
    if (quickAddSaving) return; // Prevent double-click
    setQuickAddSaving(true);

    const pic = globalQuickAdd.pic.trim() || "Aurel";

    const newTask = {
      id: `local-${Date.now()}`,
      title: globalQuickAdd.title.trim(),
      projectId: "local",
      project: globalQuickAdd.project.trim() || "Marketing",
      brand: globalQuickAdd.brand,
      assignedBy: "System",
      pic,
      reviewer: "",
      priority: globalQuickAdd.priority,
      startDate: globalQuickAdd.startDate,
      dueDate: globalQuickAdd.dueDate,
      status: "Not started" as const,
      sla: "Healthy" as const,
      notes: "",
    };

    setLocalTasks((current) => [newTask, ...current]);
    setGlobalQuickAdd(defaultQuickAdd(activeMember, viewerName));

    // Persist to backend so other users see it
    api.post("/marketing/prototype/tasks", newTask).then(() => {
      queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
      setQuickAddSaving(false);
    }).catch((err) => {
      console.error("[QuickAdd] Failed to save task:", err?.response?.status, err?.response?.data);
      // Rollback: remove the local-only task on failure
      setLocalTasks((current) => current.filter((t) => t.id !== newTask.id));
      alert(`Gagal menyimpan task! ${err?.response?.status ? `Server: ${err?.response?.status}` : 'Koneksi terputus'}`);
      setQuickAddSaving(false);
    });
  }

  function saveDrawer() {
    if (drawerSaving) return; // Prevent double-click
    setDrawerSaving(true);

    const isEdit = drawerMode === "edit" && selectedTask;
    const nextTask = isEdit
      ? { ...selectedTask, ...draftToTask(selectedTask!.id, draft) }
      : draftToTask(`local-${Date.now()}`, draft);

    // Save previous state for rollback
    const prevTasks = localTasks;

    setLocalTasks((current) => {
      if (isEdit && selectedTask) {
        return current.map((task) => (task.id === selectedTask.id ? nextTask : task));
      }
      return [nextTask, ...current];
    });

    setDrawerOpen(false);

    // Persist to backend
    const persistPromise = isEdit && selectedTask
      ? api.patch(`/marketing/prototype/tasks/${selectedTask.id}`, draft)
      : api.post("/marketing/prototype/tasks", nextTask);

    persistPromise
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
        setDrawerSaving(false);
      })
      .catch((err) => {
        console.error("[SaveDrawer] Failed:", err?.response?.status, err?.response?.data);
        // Rollback
        setLocalTasks(prevTasks);
        alert(`Gagal ${isEdit ? 'update' : 'menyimpan'} task! ${err?.response?.status ? `Server: ${err?.response?.status}` : 'Koneksi terputus'}`);
        setDrawerSaving(false);
      });
  }

  function deleteTask(taskId: string) {
    setLocalTasks((current) => current.filter((task) => task.id !== taskId));
    setDrawerOpen(false);

    api.delete(`/marketing/prototype/tasks/${taskId}`).catch((err) => {
      console.error("[Delete] Failed:", err?.response?.status, err?.response?.data);
      alert(`Gagal hapus task! ${err?.response?.status}: ${err?.response?.data?.message ?? ''}`);
    });
    queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
  }

  const title = selectedMember?.slug === "overview" ? "Management Task" : selectedMember?.label ?? "Management Task";
  const subtitle = "Monday-style task hub with inline cells, month sorting, and a right-side detail drawer.";
  const activeMonthLabel = selectedMonth === "all" ? "All months" : formatMonthLabel(selectedMonth);
  const activeCampaignLabel = selectedCampaign === "all" ? "All projects" : selectedCampaign;

  const navigateToMember = (memberSlug: string) => {
    router.push(`/marketing/management-task/${memberSlug}`);
  };

  return (
    <DashboardShell title={title} titleAccent="Hub" subtitle={subtitle}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-[28px] border border-slate-200 bg-white/90 px-6 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)] backdrop-blur">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marketing / Management Task</p>
            <h1 className="text-[18px] font-bold tracking-tight text-slate-900">{selectedMember?.label ?? "Overview"}</h1>
            <p className="text-[12px] font-medium text-slate-500">
              {activeMonthLabel} · {activeCampaignLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[220px]">
              <select
                value={activeMember}
                onChange={(event) => navigateToMember(event.target.value)}
                className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 outline-none"
              >
                {memberSelectOptions.map((member) => (
                  <option key={member.value} value={member.value}>
                    {member.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 outline-none"
              >
                <option value="all">All months</option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <select
                value={selectedCampaign}
                onChange={(event) => setSelectedCampaign(event.target.value)}
                className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 outline-none"
              >
                <option value="all">All projects</option>
                {projectOptions.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>
            <DnaButton variant="outline" icon={<Folder />} onClick={() => setIsProjectManagerOpen(true)}>
              Projects
            </DnaButton>
            <DnaButton variant="primary" icon={<Plus />} onClick={() => openCreateDrawer()}>
              New Task
            </DnaButton>
          </div>
        </div>

        {selectedMember?.slug === "overview" ? (
          <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_-34px_rgba(15,23,42,0.24)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Member Snapshot</p>
                <h2 className="mt-1 text-[16px] font-bold tracking-tight text-slate-900">Member Performance Overview</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Users2 className="h-4 w-4" />
                {snapshots.length} Members
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-5">
              {snapshots.map((member) => (
                <Link
                  key={member.slug}
                  href={`/marketing/management-task/${member.slug}`}
                  className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3 min-h-[50px]">
                    <div className="min-w-0 flex-[1]">
                      <h3 className="text-[14px] font-bold tracking-tight text-slate-900 truncate">{member.label}</h3>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{member.role}</p>
                    </div>
                    <div className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm whitespace-nowrap shrink-0 self-start">
                      {member.total} Tasks
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Progress</span>
                      <span className="text-slate-700">{member.progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${member.late > 0 ? "bg-rose-500" : "bg-blue-500"}`} style={{ width: `${member.progress}%` }} />
                    </div>
                  </div>
                  {/* KPI Score */}
                  <div className="mt-4 flex flex-col rounded-[16px] border px-4 py-3 bg-white shadow-sm gap-2"
                    style={{
                      borderColor: member.kpi >= 95 ? '#10B981' : member.kpi >= 90 ? '#3B82F6' : member.kpi >= 80 ? '#6366F1' : member.kpi >= 70 ? '#F59E0B' : '#EF4444',
                    }}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">KPI Score</span>
                    <div className="flex items-end justify-between">
                      <span className="text-[26px] font-black tabular-nums leading-none"
                        style={{
                          color: member.kpi >= 95 ? '#10B981' : member.kpi >= 90 ? '#3B82F6' : member.kpi >= 80 ? '#6366F1' : member.kpi >= 70 ? '#F59E0B' : '#EF4444',
                        }}
                      >
                        {member.kpi}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: member.kpi >= 95 ? '#D1FAE5' : member.kpi >= 90 ? '#DBEAFE' : member.kpi >= 80 ? '#E0E7FF' : member.kpi >= 70 ? '#FEF3C7' : '#FEE2E2',
                          color: member.kpi >= 95 ? '#065F46' : member.kpi >= 90 ? '#1E40AF' : member.kpi >= 80 ? '#3730A3' : member.kpi >= 70 ? '#92400E' : '#991B1B',
                        }}
                      >
                        {member.kpi >= 95 ? 'Excellent' : member.kpi >= 90 ? 'Very Good' : member.kpi >= 80 ? 'Good' : member.kpi >= 70 ? 'Needs Work' : 'Critical'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MetricMini label="Tasks" value={member.total} />
                    <MetricMini label="Done" value={member.done} />
                    <MetricMini label="Late" value={member.late} tone={member.late > 0 ? "danger" : "default"} />
                    <MetricMini label="Open" value={member.open} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {stats.map((card) => (
              <div key={card.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.24)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className="mt-3 text-[24px] font-bold tracking-tight text-slate-900 tabular-nums">{card.value}</p>
              </div>
            ))}
          </section>
        )}

        {isOverview ? (
          <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_-34px_rgba(15,23,42,0.24)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Performance</p>
                <h2 className="mt-1 text-[16px] font-bold tracking-tight text-slate-900">Line graph per member</h2>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last {chartMonths.length} months</div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
              {monthlyPerformance.map((member) => (
                <div key={member.slug} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{member.label}</p>
                      <h3 className="mt-1 text-[14px] font-bold tracking-tight text-slate-900">{member.role}</h3>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
                      {member.profileKpi} KPI
                    </div>
                  </div>
                  <div className="mt-4 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={member.data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 600 }} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                          width={36}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "16px",
                            border: "1px solid #E2E8F0",
                            background: "#fff",
                            boxShadow: "0 16px 30px -22px rgba(15,23,42,0.28)",
                            fontSize: "12px",
                          }}
                          formatter={(value) => [`${Number(value ?? 0)}%`, "Performance"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#2563EB"
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!isOverview ? (
        <>
        {/* Global Quick-Add Bar — satu baris input untuk semua status */}
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_-34px_rgba(15,23,42,0.24)] overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Add Task</p>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-[minmax(160px,1.6fr)_minmax(120px,1.1fr)_minmax(90px,0.85fr)_minmax(90px,0.85fr)_minmax(90px,0.8fr)_minmax(100px,0.9fr)_70px] items-center gap-2">
              <DnaInput
                value={globalQuickAdd.title}
                onChange={(event) => setGlobalQuickAdd((current) => ({ ...current, title: event.target.value }))}
                placeholder="Task name"
                className="h-9 w-full border border-slate-200 bg-white px-3 text-[12px] font-bold rounded-xl shadow-none focus:ring-0 text-slate-800"
              />
              <div className="flex flex-col gap-1">
                <DnaInput
                  type="date"
                  value={globalQuickAdd.startDate}
                  onChange={(event) => setGlobalQuickAdd((current) => ({ ...current, startDate: event.target.value }))}
                  className="h-9 w-full border border-slate-200 rounded-lg bg-white px-2 text-[10px] font-semibold text-slate-700 shadow-none focus:ring-0"
                />
                <DnaInput
                  type="date"
                  value={globalQuickAdd.dueDate}
                  onChange={(event) => setGlobalQuickAdd((current) => ({ ...current, dueDate: event.target.value }))}
                  className="h-9 w-full border border-slate-200 rounded-lg bg-white px-2 text-[10px] font-semibold text-slate-700 shadow-none focus:ring-0"
                />
              </div>
              <div>
                <select
                  value={globalQuickAdd.brand}
                  onChange={(event) => setGlobalQuickAdd((current) => ({ ...current, brand: event.target.value as "Dreamlab" | "Toribio" }))}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 outline-none"
                >
                  <option value="Dreamlab">Dreamlab</option>
                  <option value="Toribio">Toribio</option>
                </select>
              </div>
              <div>
                <select
                  value={globalQuickAdd.priority}
                  onChange={(event) => setGlobalQuickAdd((current) => ({ ...current, priority: event.target.value as TaskRow["priority"] }))}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wider outline-none text-slate-700"
                >
                  {(["Low", "Medium", "High", "Urgent"] as const).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="text-center">
                {(() => {
                  const due = new Date(`${globalQuickAdd.dueDate}T00:00:00`);
                  const now = new Date(`${today}T00:00:00`);
                  const diff = Math.round((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                  if (Number.isNaN(diff)) return <span className="text-slate-400 text-[10px]">—</span>;
                  if (diff === 0) return <span className="text-[10px] font-bold text-amber-600">Today</span>;
                  if (diff > 0) return <span className="text-[10px] font-semibold text-blue-600">{diff}d</span>;
                  return <span className="text-[10px] font-bold text-rose-600">{Math.abs(diff)}d late</span>;
                })()}
              </div>
              <div className="text-center hidden md:block">
                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 rounded-md px-2 py-1.5 border border-dashed border-slate-200">
                  → {isOverview ? (viewerName ?? "Aurel") : selectedMember.label}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => createGlobalQuickTask()}
                  disabled={quickAddSaving}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-white transition ${
                    quickAddSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  aria-label="Create task"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          {rowsByStatus.map((group) => {
            const style = statusStyles[group.status];

            return (
              <div key={group.status} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_-34px_rgba(15,23,42,0.24)]">
                <div className={`flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 ${style.soft}`}>
                  <div className="flex items-center gap-3">
                    <span className={`h-9 w-1.5 rounded-full ${style.accent}`} />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{statusLabels[group.status]}</p>
                      <p className="mt-0.5 text-[14px] font-bold text-slate-800">{group.items.length} tasks</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-[minmax(200px,2.2fr)_minmax(100px,1fr)_minmax(80px,0.8fr)_minmax(120px,1.1fr)_minmax(100px,0.9fr)_minmax(90px,0.8fr)_minmax(70px,0.7fr)] items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span>Task & Project</span>
                      <span className="text-center">Date</span>
                      <span className="text-center">Day left</span>
                      <span className="text-center">Status</span>
                      <span className="text-center">Brand</span>
                      <span className="text-center">Priority</span>
                      <span className="text-center">Actions</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {group.items.length ? (
                        group.items.map((task) => {
                          const taskKey = task.id || `${task.title}-${task.project}-${task.dueDate}`;
                          return (
                            <div
                              key={taskKey}
                              role="button"
                              tabIndex={0}
                              onClick={() => openEditDrawer(task)}
                              onKeyDown={(event) => {
                                if (event.target !== event.currentTarget) return;
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openEditDrawer(task);
                                }
                              }}
                              className="grid cursor-pointer grid-cols-[minmax(200px,2.2fr)_minmax(100px,1fr)_minmax(80px,0.8fr)_minmax(120px,1.1fr)_minmax(100px,0.9fr)_minmax(90px,0.8fr)_minmax(70px,0.7fr)] items-center gap-1.5 px-6 py-3 transition hover:bg-slate-50/80 focus-visible:bg-slate-50/80 focus-visible:outline-none"
                            >
                              <div className="min-w-0 flex flex-col">
                                <DnaInput
                                  value={task.title}
                                  onChange={(event) => setTaskField(task.id, "title", event.target.value)}
                                  onClick={stopRowClick}
                                  className="h-8 border-0 bg-transparent px-0 text-[13px] font-bold shadow-none focus:ring-0 text-slate-800"
                                />
                                <select
                                  value={task.project}
                                  onChange={(event) => setTaskField(task.id, "project", event.target.value)}
                                  onClick={stopRowClick}
                                  className="mt-0.5 block w-fit border-0 bg-transparent p-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 outline-none focus:ring-0 focus:text-blue-500 cursor-pointer"
                                >
                                  {projectOptions.map((project) => (
                                    <option key={project} value={project}>
                                      {project}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col gap-1.5 w-full mx-auto min-w-0">
                                <DnaInput
                                  type="date"
                                  value={task.startDate ?? task.dueDate}
                                  onChange={(event) => setTaskField(task.id, "startDate", event.target.value)}
                                  onClick={stopRowClick}
                                  className="h-8 w-full border border-slate-200 rounded-lg bg-slate-50 px-2 text-[10px] font-semibold text-slate-700 shadow-none focus:bg-white focus:ring-0"
                                />
                                <DnaInput
                                  type="date"
                                  value={task.dueDate}
                                  onChange={(event) => setTaskField(task.id, "dueDate", event.target.value)}
                                  onClick={stopRowClick}
                                  disabled={!isManager}
                                  className={`h-8 w-full border rounded-lg px-2 text-[10px] font-semibold shadow-none focus:bg-white focus:ring-0 ${
                                    !isManager
                                      ? "border-slate-100 bg-slate-100/50 text-slate-400 cursor-not-allowed"
                                      : task.dueDate < today && task.status !== "Done"
                                        ? "border-rose-200 bg-rose-50 text-rose-700 focus:border-rose-400"
                                        : "border-slate-200 bg-slate-50 text-slate-700 focus:border-blue-400"
                                  }`}
                                />
                              </div>
                              <div className="text-center">
                                {(() => {
                                  const due = new Date(`${task.dueDate}T00:00:00`);
                                  const now = new Date(`${today}T00:00:00`);
                                  const diff = Math.round((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                                  if (Number.isNaN(diff)) return <span className="text-slate-400">-</span>;
                                  if (diff === 0) return <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 shadow-sm">Today</span>;
                                  if (diff > 0) return <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-700">{diff}d</span>;
                                  return <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-700 shadow-sm">{Math.abs(diff)}d late</span>;
                                })()}
                              </div>
                              <div className="w-full mx-auto">
                                <select
                                  value={task.status}
                                  onChange={(event) => setTaskField(task.id, "status", event.target.value)}
                                  onClick={stopRowClick}
                                  className={`h-9 w-full rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider outline-none ${
                                    task.status === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    task.status === "Revision" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                    task.status === "Working on it" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {statusGroups.map((s) => (
                                    <option key={s} value={s}>{statusLabels[s]}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-full mx-auto text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                                  task.brand === "Dreamlab" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                                }`}>
                                  {task.brand}
                                </span>
                              </div>
                              <div className="w-full mx-auto text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                                  task.priority === "Urgent" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                  task.priority === "High" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                  task.priority === "Medium" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                  "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                              <div className="flex items-center justify-center gap-1" onClick={stopRowClick}>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEditDrawer(task);
                                  }}
                                  className="text-slate-400 hover:text-blue-600 transition p-1.5 hover:bg-slate-100 rounded-md"
                                  title="Edit task"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                {isManager && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (window.confirm(`Hapus task "${task.title}"?`)) {
                                      deleteTask(task.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-rose-600 transition p-1.5 hover:bg-slate-100 rounded-md"
                                  title="Delete task"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-5 py-8 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          No tasks in this group
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </section>
        </>
        ) : null}
      </div>

      <Sheet open={drawerOpen} onOpenChange={(open) => setDrawerOpen(open)}>
        <SheetContent side="right" className="w-full border-l border-slate-200 bg-white p-0 text-slate-900 sm:max-w-[680px]">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-slate-100 bg-slate-50/80 px-6 py-5 text-left">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <SheetTitle className="text-xl font-bold tracking-tight text-slate-900">
                    {drawerMode === "create" ? "New Task" : selectedTask?.title ?? "Task Detail"}
                  </SheetTitle>
                  <SheetDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {drawerMode === "create" ? "Create a new task" : "Edit task details"}
                  </SheetDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    draft.status === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    draft.status === "Revision" ? "bg-rose-50 text-rose-700 border-rose-200" :
                    draft.status === "Working on it" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {statusLabels[draft.status]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 transition hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Notes — di ATAS karena isi utama */}
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                <textarea
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  rows={5}
                  className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-[13px] leading-6 text-slate-900 outline-none focus:border-blue-300 resize-none"
                  placeholder="Write task description or notes here..."
                />
              </div>

              {/* Fields grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Task">
                  <DnaInput value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Task title" />
                </Field>
                <Field label="Project">
                  <select
                    value={draft.project}
                    onChange={(event) => setDraft((current) => ({ ...current, project: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none focus:border-blue-300"
                  >
                    <option value="">Project</option>
                    {projectOptions.map((project) => (
                      <option key={project} value={project}>
                        {project}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Brand">
                  <select
                    value={draft.brand}
                    onChange={(event) => setDraft((current) => ({ ...current, brand: event.target.value as "Dreamlab" | "Toribio" }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none focus:border-blue-300"
                  >
                    <option value="Dreamlab">Dreamlab</option>
                    <option value="Toribio">Toribio</option>
                  </select>
                </Field>
                <Field label="Assignee">
                  <DnaInput value={draft.pic} onChange={(event) => setDraft((current) => ({ ...current, pic: event.target.value }))} placeholder="Aurel" />
                </Field>
                <Field label="Status">
                  <select
                    value={draft.status}
                    onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as TaskStatus }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none focus:border-blue-300"
                  >
                    {statusGroups.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    value={draft.priority}
                    onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as TaskRow["priority"] }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none focus:border-blue-300"
                  >
                    {["Low", "Medium", "High", "Urgent"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Start Date">
                  <DnaInput type="date" value={draft.startDate} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))} />
                </Field>
                <Field label="Due Date">
                  <DnaInput type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} disabled={!isManager} />
                </Field>
              </div>
            </div>

            <SheetFooter className="border-t border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2">
                  {drawerMode === "edit" && selectedTask ? (
                    <ActionIconButton label="Delete task" tone="danger" onClick={() => deleteTask(selectedTask.id)}>
                      <Trash2 className="h-4 w-4" />
                    </ActionIconButton>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <DnaButton variant="outline" onClick={() => setDrawerOpen(false)}>
                    Cancel
                  </DnaButton>
                  <DnaButton variant="primary" icon={<Save />} onClick={saveDrawer} disabled={drawerSaving}>
                    {drawerSaving ? "Saving..." : "Save Task"}
                  </DnaButton>
                </div>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* Project Manager Modal */}
      {isProjectManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProjectManagerOpen(false)}>
          <div className="w-full max-w-[450px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-[16px] font-bold tracking-tight text-slate-900">Manage Projects</h2>
                <p className="text-[11px] font-medium text-slate-400">Add, edit, or delete marketing projects</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProjectManagerOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Add New Project */}
            <div className="mt-4 flex gap-2">
              <DnaInput
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New project name"
                className="flex-1 h-9 text-[12px] rounded-xl border-slate-200 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = newProjectName.trim();
                  if (trimmed && !localProjects.includes(trimmed)) {
                    setLocalProjects((current) => [...current, trimmed]);
                    setNewProjectName("");
                  }
                }}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-4 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>

            {/* Project List */}
            <div className="mt-5 max-h-[250px] overflow-y-auto divide-y divide-slate-100 pr-1">
              {localProjects.length === 0 ? (
                <p className="py-6 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">No projects added yet</p>
              ) : (
                localProjects.map((projectName, index) => (
                  <div key={projectName} className="flex items-center justify-between py-3">
                    {editingProjectIndex === index ? (
                      <div className="flex flex-1 gap-2 items-center">
                        <DnaInput
                          value={editingProjectName}
                          onChange={(e) => setEditingProjectName(e.target.value)}
                          className="flex-1 h-8 text-[11px] rounded-lg border-slate-200 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = editingProjectName.trim();
                            if (trimmed && trimmed !== projectName) {
                              setLocalProjects((current) => {
                                const next = [...current];
                                next[index] = trimmed;
                                return next;
                              });
                              setLocalTasks((current) =>
                                current.map((t) => (t.project === projectName ? { ...t, project: trimmed } : t))
                              );
                            }
                            setEditingProjectIndex(null);
                          }}
                          className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px] px-2 py-1"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProjectIndex(null)}
                          className="text-slate-400 hover:text-slate-600 font-bold text-[11px] px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-[12px] font-semibold text-slate-750">{projectName}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProjectIndex(index);
                              setEditingProjectName(projectName);
                            }}
                            className="text-slate-400 hover:text-blue-600 p-1 hover:bg-slate-50 rounded"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLocalProjects((current) => current.filter((_, i) => i !== index));
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 hover:bg-slate-50 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </label>
  );
}