"use client";

// TaskWorkspace V2: full DNA-wrap, 3 view modes (Table/Kanban/Calendar),
// uses marketingService with localStorage persistence,
// supporting Member Workspace Grid, Member Profile View, Create Task Modal, and Daily/Project Task breakdown.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  Search,
  ListChecks,
  LayoutGrid,
  CalendarDays,
  Check,
  ListTodo,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  DnaButton,
  DnaInput,
  DnaKpiGrid,
  DnaPageContainer,
  DnaPageHeader,
} from "@/components/dna";
import { DnaEmptyState } from "@/components/dna/DnaEmptyState";
import { DnaAvatar, DnaDaysLeftChip, DnaKanban, DnaPriorityBadge } from "@/components/dna/DnaExtras";
import { useMarketingTasks, useMarketingMembers, useTaskStatusMutation } from "@/hooks/useCanonicalMarketing";
import { useAuth } from "@/hooks/useAuth";
import TaskDetailModal from "./components/TaskDetailModal";
import CreateTaskModal from "./components/CreateTaskModal";
import MemberCardsGrid from "./components/MemberCardsGrid";
import MemberProfileView from "./components/MemberProfileView";
import { useDnaToast } from "@/components/dna/DnaToast";
import type { MarketingTask, MarketingTeamMember, MarketingViewer, TaskStatus, TaskType } from "@/types/marketing-api";

type ViewMode = "table" | "kanban" | "calendar";

const KANBAN_STATUSES: TaskStatus[] = ["NOT_STARTED", "IN_PROGRESS", "REVIEW", "REVISION", "DONE"];

const NEXT_STATUSES: Partial<Record<TaskStatus, TaskStatus[]>> = {
  NOT_STARTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["REVIEW"],
  REVIEW: ["DONE"],
  REVISION: ["IN_PROGRESS"],
};

function getStatusClass(status: TaskStatus) {
  switch (status) {
    case "DONE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "REVIEW":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "REVISION":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-500 border-slate-200";
    case "LATE":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "NOT_STARTED":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function TaskWorkspaceV2({ memberSlug }: { memberSlug: string }) {
  const toast = useDnaToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  // Canonical API hooks (replace imperative marketingService + localStorage persistence)
  const tasksQuery = useMarketingTasks({ page: 1, limit: 100 });
  const membersQuery = useMarketingMembers();
  // ponytail: hook returns lean MarketingMember ({fullName}); adapt to MarketingTeamMember
  const members: MarketingTeamMember[] = useMemo(() => (membersQuery.data ?? []).map((m) => ({
    id: m.id,
    name: m.fullName,
    email: m.email,
    role: m.roles?.[0] ?? "MEMBER",
  })), [membersQuery.data]);
  // ponytail: hook types are leaner than marketing-api; cast to canonical shape (runtime data has all fields).
  const tasks: MarketingTask[] = useMemo(() => (tasksQuery.data?.data ?? []) as MarketingTask[], [tasksQuery.data]);
  const loading = tasksQuery.isLoading || membersQuery.isLoading;
  const loadError = (tasksQuery.error ?? membersQuery.error) ? "Data Management Task tidak dapat dimuat." : null;
  const refresh = useCallback(() => {
    void tasksQuery.refetch();
    void membersQuery.refetch();
  }, [tasksQuery, membersQuery]);
  const statusMutation = useTaskStatusMutation();
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TaskType>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MarketingTask | null>(null);

  const viewer = useMemo<MarketingViewer | null>(() =>
    user ? { id: user.id, email: user.email, name: user.fullName, roles: user.roles } : null,
  [user]);

  // Check if memberSlug is a specific team member
  const currentMember = useMemo(() => {
    if (memberSlug === "overview" || memberSlug === "my-tasks") return null;
    return (
      members.find(
        (m) => m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === memberSlug.toLowerCase()
      ) || null
    );
  }, [memberSlug, members]);

  useEffect(() => {
    const isReserved = memberSlug === "overview" || memberSlug === "my-tasks";
    if (!authLoading && !loading && !loadError && !isReserved && members.length > 0 && !currentMember) {
      router.replace("/marketing/management-task/overview");
    }
  }, [authLoading, currentMember, loadError, loading, memberSlug, members.length, router]);

  // Filter logic across views
  const filtered = useMemo(() => {
    let items = tasks;
    if (memberSlug === "my-tasks") {
      items = items.filter((t) => t.assigneeId === viewer?.id);
    }
    if (typeFilter !== "all") items = items.filter((t) => t.type === typeFilter);
    if (statusFilter !== "all") items = items.filter((t) => t.status === statusFilter);
    if (assigneeFilter !== "all") {
      items = items.filter((t) => t.assigneeId === assigneeFilter);
    }
    if (brandFilter !== "all") items = items.filter((t) => t.brandId === brandFilter);
    if (projectFilter !== "all") items = items.filter((t) => t.projectId === projectFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.project?.name.toLowerCase().includes(q) ?? false) ||
          (t.assignee?.name.toLowerCase().includes(q) ?? false) ||
          (t.taskCode?.toLowerCase().includes(q) ?? false)
      );
    }
    return items;
  }, [tasks, memberSlug, typeFilter, statusFilter, assigneeFilter, brandFilter, projectFilter, search]);

  const brands = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => t.brand && map.set(t.brandId!, t.brand.name));
    return Array.from(map.entries());
  }, [tasks]);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => t.project && map.set(t.projectId!, t.project.name));
    return Array.from(map.entries());
  }, [tasks]);

  // If viewing a specific member's workspace, render MemberProfileView
  if (currentMember && viewer) {
    return (
      <DnaPageContainer className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
        <DnaPageHeader
          title="MEMBER WORKSPACE"
          subtitle={`${currentMember.name} (${currentMember.role}) — Profil performa & manajemen tugas.`}
          breadcrumbs={[
            { label: "Marketing", href: "/marketing/dashboard" },
            { label: "Management Task", href: "/marketing/management-task/overview" },
            { label: currentMember.name },
          ]}
        />
        <MemberProfileView member={currentMember} tasks={tasks} viewer={viewer} onRefresh={refresh} />
      </DnaPageContainer>
    );
  }

  // Overall KPI calculations
  const total = filtered.length;
  const active = filtered.filter((t) => ["IN_PROGRESS", "REVIEW", "NOT_STARTED"].includes(t.status)).length;
  const late = filtered.filter((t) => t.status === "LATE" || (t.status !== "DONE" && new Date(t.dueDate) < new Date())).length;
  const done = filtered.filter((t) => t.status === "DONE").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const lateRate = total > 0 ? Math.round((late / total) * 100) : 0;

  // Fast-path status toggle — uses canonical statusMutation (Idempotency-Key handled by hook)
  const handleToggleDone = async (task: MarketingTask, e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status !== "REVIEW") return;
    const nextStatus: TaskStatus = "DONE";
    try {
      await statusMutation.mutateAsync({ id: task.id, version: task.version, status: nextStatus });
      toast.success(`Task "${task.title}" ditandai selesai.`);
    } catch (err: any) {
      toast.error("Gagal update status: " + (err?.message ?? err));
    }
  };

  // Inline status change in table — uses canonical statusMutation
  const handleInlineStatusChange = async (task: MarketingTask, newStatus: TaskStatus) => {
    if (newStatus === task.status) return;
    try {
      await statusMutation.mutateAsync({ id: task.id, version: task.version, status: newStatus as any });
      toast.success(`Status "${task.title}" diubah menjadi ${newStatus.replace("_", " ")}.`);
    } catch (err: any) {
      toast.error("Gagal ubah status: " + (err?.message ?? err));
    }
  };

  const tabTitle = memberSlug === "my-tasks" ? "Task Saya" : "Overview & Performa Tim";

  if (authLoading || (loading && !viewer)) {
    return <DnaPageContainer className="mx-auto max-w-[1500px] p-6 text-sm text-slate-500" aria-busy="true">Memuat sesi…</DnaPageContainer>;
  }

  if (!viewer) {
    return <DnaPageContainer className="mx-auto max-w-[1500px] p-6 text-sm text-rose-700">Sesi tidak valid. Silakan login kembali.</DnaPageContainer>;
  }

  return (
    <DnaPageContainer className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <DnaPageHeader
        title={tabTitle}
        subtitle="Manajemen tugas harian operasional dan milestone proyek tim marketing."
        breadcrumbs={[
          { label: "Marketing", href: "/marketing/dashboard" },
          { label: "Management Task", href: "/marketing/management-task/overview" },
          { label: tabTitle },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void refresh()}
            >
              Sinkronkan
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingTask(null);
                setCreateModalOpen(true);
              }}
            >
              Tambah task
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards Banner matching Prototype */}
      <DnaKpiGrid
        columns={4}
        items={[
          {
            title: "TOTAL TASKS",
            value: total,
            status: "info",
            subtext: `${active} sedang berjalan`,
            icon: <ListTodo className="h-4 w-4" />,
          },
          {
            title: "TOTAL COMPLETED",
            value: done,
            status: "success",
            subtext: "Selesai tepat waktu",
            icon: <Check className="h-4 w-4" />,
          },
          {
            title: "COMPLETION RATE",
            value: `${completionRate}%`,
            status: completionRate >= 75 ? "success" : "warning",
            subtext: "Target standar ≥ 75%",
            icon: <Sparkles className="h-4 w-4" />,
          },
          {
            title: "OVERALL LATE RATE",
            value: `${lateRate}%`,
            status: late === 0 ? "success" : "danger",
            subtext: `${late} task butuh follow-up`,
            icon: <AlertCircle className="h-4 w-4" />,
          },
        ]}
      />

      {/* Member Workspace Cards Grid (Overview Only) */}
      {memberSlug === "overview" && (
        <MemberCardsGrid members={members} tasks={tasks} />
      )}

      {/* Toolbar / Filters (with PIC filter & search matching prototype) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Universal Search Input */}
          <div className="w-64">
            <DnaInput
              placeholder="Cari task, project, PIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              aria-label="Cari task"
            />
          </div>

          {/* Type Segmented Filter */}
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                typeFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Semua Tipe
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("DAILY")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                typeFilter === "DAILY"
                  ? "bg-white text-blue-700 shadow-xs border border-blue-100"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Daily Task
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("PROJECT")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                typeFilter === "PROJECT"
                  ? "bg-white text-amber-700 shadow-xs border border-amber-100"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Project Task
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="NOT_STARTED">NOT STARTED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="DONE">DONE</option>
            <option value="LATE">LATE</option>
          </select>

          {/* Assignee / PIC Filter (Added to match prototype) */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Brand</option>
            {brands.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Project</option>
            {projects.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <DnaButton
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
              setStatusFilter("all");
              setAssigneeFilter("all");
              setBrandFilter("all");
              setProjectFilter("all");
              refresh();
            }}
          >
            Reset
          </DnaButton>
        </div>

        {/* View-mode switcher */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <DnaButton
              variant={view === "table" ? "primary" : "outline"}
              size="sm"
              icon={<ListChecks className="h-4 w-4" />}
              onClick={() => setView("table")}
            >
              Tabel
            </DnaButton>
            <DnaButton
              variant={view === "kanban" ? "primary" : "outline"}
              size="sm"
              icon={<LayoutGrid className="h-4 w-4" />}
              onClick={() => setView("kanban")}
            >
              Kanban
            </DnaButton>
            <DnaButton
              variant={view === "calendar" ? "primary" : "outline"}
              size="sm"
              icon={<CalendarDays className="h-4 w-4" />}
              onClick={() => setView("calendar")}
            >
              Kalender
            </DnaButton>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Menampilkan {filtered.length} Task
          </span>
        </div>
      </section>

      {loadError ? (
        <section role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <p className="font-bold">Data Management Task gagal dimuat.</p>
          <p className="mt-1">{loadError}</p>
          <DnaButton className="mt-4" variant="outline" onClick={() => void refresh()}>Coba lagi</DnaButton>
        </section>
      ) : loading ? (
        <section aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Memuat task dari server…</section>
      ) : view === "table" ? (
        <TableView
          tasks={filtered}
          onSelect={(id) => setSelectedTaskId(id)}
          onToggleDone={handleToggleDone}
          onStatusChange={handleInlineStatusChange}
        />
      ) : view === "kanban" ? (
        <DnaKanban
          items={filtered.map((t) => ({
            id: t.id,
            title: t.title,
            status: KANBAN_STATUSES.includes(t.status) ? t.status : "NOT_STARTED",
            meta: (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <DnaAvatar name={t.assignee?.name ?? "?"} size="sm" />
                  <span className="text-[11px] font-medium text-slate-700">{t.assignee?.name}</span>
                </div>
                <DnaDaysLeftChip dueDate={t.dueDate} />
              </div>
            ),
          }))}
          onClick={(id) => setSelectedTaskId(id)}
        />
      ) : (
        <CalendarView tasks={filtered} onSelect={(id) => setSelectedTaskId(id)} />
      )}

      {/* Detail Drawer */}
      <TaskDetailModal
        isOpen={Boolean(selectedTaskId)}
        taskId={selectedTaskId}
        viewer={viewer}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={refresh}
        onEditTask={(task) => {
          setEditingTask(task);
          setCreateModalOpen(true);
        }}
        onDeleteTask={() => {
          refresh();
        }}
      />

      {/* Create / Edit Task Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingTask(null);
        }}
        onCreated={refresh}
        viewer={viewer}
        initialTask={editingTask}
      />
    </DnaPageContainer>
  );
}

// ── TABLE VIEW ─────────────────────────────────────────────────────────────

function TableView({
  tasks,
  onSelect,
  onToggleDone,
  onStatusChange,
}: {
  tasks: MarketingTask[];
  onSelect: (id: string) => void;
  onToggleDone: (task: MarketingTask, e: React.MouseEvent) => void;
  onStatusChange: (task: MarketingTask, newStatus: TaskStatus) => void;
}) {
  if (tasks.length === 0) {
    return (
      <DnaEmptyState
        title="Belum ada task yang cocok"
        description="Silakan reset filter pencarian atau tambahkan task baru."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 font-bold">Nama Task</th>
              <th className="px-3 py-3 font-bold">Tipe / Project</th>
              <th className="px-3 py-3 font-bold">Assignee</th>
              <th className="px-3 py-3 font-bold">Brand</th>
              <th className="px-3 py-3 font-bold">Due Date</th>
              <th className="px-3 py-3 font-bold">Days Left</th>
              <th className="px-3 py-3 font-bold">Prioritas</th>
              <th className="px-3 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tasks.map((task) => {
              const isDone = task.status === "DONE";
              const allowedStatuses = [task.status, ...(NEXT_STATUSES[task.status] ?? [])];
              const memberSlug = task.assignee?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "overview";

              return (
                <tr
                  key={task.id}
                  onClick={() => onSelect(task.id)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  {/* Task Name + Fast-path Checkbox */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => onToggleDone(task, e)}
                        disabled={task.status !== "REVIEW"}
                        aria-label={task.status === "REVIEW" ? "Tandai task selesai" : "Task harus melalui workflow sebelum selesai"}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 disabled:cursor-not-allowed disabled:opacity-45 ${
                          isDone
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 hover:border-slate-500 bg-white"
                        }`}
                        title={task.status === "REVIEW" ? "Tandai selesai" : "Task harus masuk Review sebelum selesai"}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <div>
                        <p
                          className={`font-bold transition ${
                            isDone ? "line-through text-slate-400" : "text-slate-900 group-hover:text-blue-600"
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{task.taskCode}</p>
                      </div>
                    </div>
                  </td>

                  {/* Type / Project */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    {task.type === "PROJECT" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                        {task.project?.name || "Project"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        Daily Task
                      </span>
                    )}
                  </td>

                  {/* Assignee */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Link
                      href={`/marketing/management-task/${memberSlug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 hover:text-blue-600 group/pic"
                    >
                      <DnaAvatar name={task.assignee?.name ?? "?"} size="sm" />
                      <span className="font-semibold text-slate-700 group-hover/pic:text-blue-600 group-hover/pic:underline">
                        {task.assignee?.name ?? "—"}
                      </span>
                    </Link>
                  </td>

                  {/* Brand */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-medium text-slate-600">{task.brand?.name ?? "—"}</span>
                  </td>

                  {/* Due Date */}
                  <td className="px-3 py-3 text-slate-500 whitespace-nowrap font-medium">
                    {new Date(task.dueDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Days Left Chip */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <DnaDaysLeftChip dueDate={task.dueDate} />
                  </td>

                  {/* Priority Badge */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <DnaPriorityBadge priority={task.priority} />
                  </td>

                  {/* Status Inline Select (Interactive) */}
                  <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${getStatusClass(task.status)}`}
                    >
                      {allowedStatuses.map((status) => (
                        <option key={status} value={status}>{status === "REVIEW" ? "In Review" : status.replace("_", " ")}</option>
                      ))}
                    </select>
                  </td>

                  {/* Action Detail */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(task.id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CALENDAR VIEW ──────────────────────────────────────────────────────────

function CalendarView({ tasks, onSelect }: { tasks: MarketingTask[]; onSelect: (id: string) => void }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Kalender Deadline — {monthNames[month]} {year}
        </h3>
        <div className="flex items-center gap-2">
          <DnaButton
            variant="outline"
            size="sm"
            onClick={() => {
              if (month === 0) {
                setMonth(11);
                setYear(year - 1);
              } else {
                setMonth(month - 1);
              }
            }}
          >
            ← Bulan Lalu
          </DnaButton>
          <DnaButton
            variant="outline"
            size="sm"
            onClick={() => {
              if (month === 11) {
                setMonth(0);
                setYear(year + 1);
              } else {
                setMonth(month + 1);
              }
            }}
          >
            Bulan Depan →
          </DnaButton>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <div>Min</div>
        <div>Sen</div>
        <div>Sel</div>
        <div>Rab</div>
        <div>Kam</div>
        <div>Jum</div>
        <div>Sab</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, idx) => {
          if (!cell.day) {
            return <div key={idx} className="min-h-[90px] rounded-xl bg-slate-50/50 border border-transparent" />;
          }

          const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
          const dayTasks = tasks.filter((t) => t.dueDate?.startsWith(dayStr));

          return (
            <div
              key={idx}
              className="min-h-[90px] rounded-xl border border-slate-200 bg-white p-2 flex flex-col justify-between hover:border-blue-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{cell.day}</span>
                {dayTasks.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="space-y-1 mt-1">
                {dayTasks.slice(0, 2).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelect(t.id)}
                    className="w-full text-left p-1 rounded bg-blue-50 hover:bg-blue-100 text-[10px] font-semibold text-blue-900 truncate block transition"
                  >
                    {t.title}
                  </button>
                ))}
                {dayTasks.length > 2 && (
                  <span className="text-[9px] text-slate-400 font-medium block">
                    +{dayTasks.length - 2} lainnya
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
