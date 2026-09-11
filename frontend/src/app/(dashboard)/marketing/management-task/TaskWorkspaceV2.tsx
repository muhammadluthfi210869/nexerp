"use client";

// TaskWorkspace V2: full DNA-wrap, 3 view modes (Table/Kanban/Calendar),
// uses marketingService (mock by default) for comments + attachments.
// Replaces older TaskWorkspace.tsx that used useCanonicalMarketing (real backend).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Search, ListChecks, LayoutGrid, CalendarDays } from "lucide-react";
import { DnaButton, DnaEmptyState, DnaInput, DnaKpiGrid, DnaPageContainer, DnaPageHeader, DnaTabNav } from "@/components/dna";
import { DnaKanban, DnaDaysLeftChip, DnaPriorityBadge, DnaStatusBadge, DnaAvatar } from "@/components/dna";
import { marketingService, mockViewer } from "@/lib/services/marketing-service";
import TaskDetailModal from "./components/TaskDetailModal";
import type { MarketingTask, TaskStatus } from "@/types/marketing-api";

type ViewMode = "table" | "kanban" | "calendar";

const KANBAN_STATUSES: TaskStatus[] = ["NOT_STARTED", "IN_PROGRESS", "REVIEW", "DONE"];

export default function TaskWorkspaceV2({ memberSlug }: { memberSlug: string }) {
  const [tasks, setTasks] = useState<MarketingTask[]>([]);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MarketingTask | null>(null);

  // Load all tasks once
  useEffect(() => {
    marketingService.listTasks(mockViewer, { limit: 100 }).then((r) => setTasks(r.items));
  }, []);

  // Filter logic — same across views
  const filtered = useMemo(() => {
    let items = tasks;
    // memberSlug: "overview" = all, "my-tasks" = viewer only, "aurel" = that member
    if (memberSlug === "my-tasks") {
      items = items.filter((t) => t.assigneeId === mockViewer.id);
    } else if (memberSlug !== "overview") {
      // find member by slug — simple match by fullName lower-cased
      const targetSlug = memberSlug.toLowerCase();
      items = items.filter((t) => t.assignee?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === targetSlug);
    }
    if (statusFilter !== "all") items = items.filter((t) => t.status === statusFilter);
    if (brandFilter !== "all") items = items.filter((t) => t.brandId === brandFilter);
    if (projectFilter !== "all") items = items.filter((t) => t.projectId === projectFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.project?.name.toLowerCase().includes(q) ?? false) ||
        (t.assignee?.name.toLowerCase().includes(q) ?? false)
      );
    }
    return items;
  }, [tasks, memberSlug, statusFilter, brandFilter, projectFilter, search]);

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

  // KPIs
  const total = filtered.length;
  const active = filtered.filter((t) => ["IN_PROGRESS", "REVIEW", "NOT_STARTED"].includes(t.status)).length;
  const late = filtered.filter((t) => t.status !== "DONE" && new Date(t.dueDate) < new Date()).length;
  const done = filtered.filter((t) => t.status === "DONE").length;

  const refresh = async () => {
    const r = await marketingService.listTasks(mockViewer, { limit: 100 });
    setTasks(r.items);
  };

  const tabTitle = memberSlug === "overview" ? "Overview" :
    memberSlug === "my-tasks" ? "Task Saya" :
    memberSlug.charAt(0).toUpperCase() + memberSlug.slice(1);

  return (
    <DnaPageContainer className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
      <DnaPageHeader
        title="MANAGEMENT TASK"
        subtitle={`${tabTitle} — operasional task Digital Marketing. Mock data aktif (set NEXT_PUBLIC_MARKETING_API_MODE=real untuk backend).`}
        breadcrumbs={[
          { label: "Marketing", href: "/marketing/dashboard" },
          { label: "Management Task" },
        ]}
        actions={
          <DnaButton variant="primary" icon={<Plus />}>
            Tambah task
          </DnaButton>
        }
      />

      <DnaKpiGrid
        items={[
          { label: "TOTAL TASK", value: String(total), subtext: "Sesuai filter", variant: "blue" },
          { label: "ACTIVE", value: String(active), subtext: "Belum selesai", variant: "amber" },
          { label: "TERLAMBAT", value: String(late), subtext: "Lewat due date", variant: "rose" },
          { label: "SELESAI", value: String(done), variant: "emerald" },
        ]}
      />

      {/* Toolbar */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <DnaInput
            aria-label="Cari task"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, judul, atau PIC..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
          >
            <option value="all">Semua status</option>
            {["NOT_STARTED", "IN_PROGRESS", "IN_REVIEW", "DONE", "LATE"].map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
          >
            <option value="all">Semua brand</option>
            {brands.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
          >
            <option value="all">Semua project</option>
            {projects.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <DnaButton variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => {
            setSearch("");
            setStatusFilter("all");
            setBrandFilter("all");
            setProjectFilter("all");
            refresh();
          }}>
            Reset
          </DnaButton>
        </div>

        {/* View-mode tabs */}
        <nav className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <DnaButton variant={view === "table" ? "primary" : "outline"} size="sm" icon={<ListChecks className="h-4 w-4" />} onClick={() => setView("table")}>
            Tabel
          </DnaButton>
          <DnaButton variant={view === "kanban" ? "primary" : "outline"} size="sm" icon={<LayoutGrid className="h-4 w-4" />} onClick={() => setView("kanban")}>
            Kanban
          </DnaButton>
          <DnaButton variant={view === "calendar" ? "primary" : "outline"} size="sm" icon={<CalendarDays className="h-4 w-4" />} onClick={() => setView("calendar")}>
            Kalender
          </DnaButton>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} task</span>
        </nav>
      </section>

      {/* View content */}
      {view === "table" && <TableView tasks={filtered} onSelect={(id) => setSelectedTaskId(id)} />}
      {view === "kanban" && (
        <DnaKanban
          items={filtered.map((t) => ({
            id: t.id,
            title: t.title,
            status: KANBAN_STATUSES.includes(t.status) ? t.status : "NOT_STARTED",
            meta: (
              <div className="flex items-center gap-2">
                <DnaAvatar name={t.assignee?.name ?? "?"} size="sm" />
                <DnaDaysLeftChip dueDate={t.dueDate} />
              </div>
            ),
          }))}
          onClick={(id) => setSelectedTaskId(id)}
        />
      )}
      {view === "calendar" && <CalendarView tasks={filtered} onSelect={(id) => setSelectedTaskId(id)} />}

      {/* Detail modal */}
      <TaskDetailModal
        isOpen={!!selectedTaskId}
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={refresh}
      />
    </DnaPageContainer>
  );
}

function TableView({ tasks, onSelect }: { tasks: MarketingTask[]; onSelect: (id: string) => void }) {
  if (tasks.length === 0) {
    return <DnaEmptyState title="Belum ada task" description="Coba ubah filter atau tambah task baru." />;
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="text-left px-4 py-3 font-bold">Task</th>
            <th className="text-left px-4 py-3 font-bold">Brand</th>
            <th className="text-left px-4 py-3 font-bold">PIC</th>
            <th className="text-left px-4 py-3 font-bold">Prioritas</th>
            <th className="text-left px-4 py-3 font-bold">Status</th>
            <th className="text-left px-4 py-3 font-bold">Due</th>
            <th className="text-left px-4 py-3 font-bold">Checklist</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <tr
              key={task.id}
              tabIndex={0}
              onClick={() => onSelect(task.id)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(task.id)}
              className="cursor-pointer hover:bg-blue-50/40 focus:bg-blue-50 focus:outline-none"
            >
              <td className="px-4 py-3">
                <p className="font-bold text-slate-900">{task.title}</p>
                <p className="text-xs font-mono text-slate-400">{task.taskCode}</p>
              </td>
              <td className="px-4 py-3">
                <p>{task.brand?.name ?? "—"}</p>
                <p className="text-xs text-slate-400">{task.project?.name ?? task.category}</p>
              </td>
              <td className="px-4 py-3">
                {task.assignee && (
                  <div className="flex items-center gap-1.5">
                    <DnaAvatar name={task.assignee.name} size="sm" />
                    <span className="text-xs">{task.assignee.name}</span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <DnaPriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3">
                <DnaStatusBadge status={task.status} />
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <div className="text-xs text-slate-600 tabular-nums">{task.dueDate}</div>
                  <DnaDaysLeftChip dueDate={task.dueDate} />
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums text-xs">
                {task.checklistDone}/{task.checklistTotal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalendarView({ tasks, onSelect }: { tasks: MarketingTask[]; onSelect: (id: string) => void }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  const tasksByDate = useMemo(() => {
    const map = new Map<string, MarketingTask[]>();
    tasks.forEach((t) => {
      if (!map.has(t.dueDate)) map.set(t.dueDate, []);
      map.get(t.dueDate)!.push(t);
    });
    return map;
  }, [tasks]);

  const monthName = new Date(year, month).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <button
          onClick={() => {
            if (month === 0) { setMonth(11); setYear((y) => y - 1); }
            else setMonth((m) => m - 1);
          }}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          ‹
        </button>
        <h2 className="font-semibold capitalize">{monthName}</h2>
        <button
          onClick={() => {
            if (month === 11) { setMonth(0); setYear((y) => y + 1); }
            else setMonth((m) => m + 1);
          }}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-700 text-center border-b border-slate-100">{d}</div>
        ))}
        {cells.map((c, i) => {
          const dateStr = c.day !== null ? `${year}-${String(month + 1).padStart(2, "0")}-${String(c.day).padStart(2, "0")}` : "";
          const dayTasks = dateStr ? (tasksByDate.get(dateStr) ?? []) : [];
          return (
            <div
              key={i}
              className={`min-h-[90px] p-1.5 border-r border-b border-slate-100 ${c.day === null ? "bg-slate-50/50" : ""}`}
            >
              {c.day !== null && (
                <>
                  <div className="text-xs text-slate-500 mb-1">{c.day}</div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t.id)}
                        className="text-[10px] w-full text-left px-1.5 py-0.5 rounded border border-slate-200 bg-white hover:bg-blue-50 truncate"
                      >
                        {t.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-slate-400">+{dayTasks.length - 3}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
