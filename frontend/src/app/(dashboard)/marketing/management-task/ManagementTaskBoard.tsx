"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  ExternalLink,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
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
import { toLocalDateString, parseLocalDate, calendarDayDiff } from "@/lib/utils";
import { canonicalMember, sameMember } from "@/lib/marketing-members";

type TaskStatus = "Not started" | "Working on it" | "Revision" | "Done";

type TaskAttachment = {
  id: string;
  name: string;
  type: string;
  sizeKb: number;
  path: string;
  uploadedBy: string;
  createdAt: string;
};

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
  completedAt?: string;
  brief: string;
  link?: string;
  attachments?: TaskAttachment[];
  history?: Array<{ at: string; by: string; from?: string; to: string; note: string }>;
};

type BrandKpiBreakdown = {
  total: number;
  done: number;
  late: number;
  inProgress: number;
  onTime: number;
  progress: number;
};

type ProfileRow = {
  id: string;
  name: string;
  role: string;
  monthKpi?: number;
  completed?: number;
  inProgress?: number;
  late?: number;
  brandKpi?: {
    dreamlab: BrandKpiBreakdown;
    toribio: BrandKpiBreakdown;
  };
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
  slug: "overview" | "aurel" | "revi" | "zarka" | "gusti" | "luthfi" | "rahmat";
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
  brief: string;
  link: string;
};

const memberConfigs: MemberConfig[] = [
  { slug: "overview", label: "Overview", role: "Snapshot Divisi", aliases: [] },
  { slug: "aurel", label: "Aurel", role: "Content Creator", aliases: ["aurel"] },
  { slug: "revi", label: "Revita", role: "Digital Marketing Strategy", aliases: ["revi", "revita"] },
  { slug: "zarka", label: "Zarkasi", role: "Full Stack Video Editor", aliases: ["zarka", "zarkasi"] },
  { slug: "gusti", label: "Gusti", role: "Full Stack Desain Graphic", aliases: ["gusti"] },
  { slug: "luthfi", label: "Luthfi", role: "Design Logo & Packaging", aliases: ["luthfi"] },
  { slug: "rahmat", label: "Rahmat", role: "IS Manager", aliases: ["rahmat"] },
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
  // Pencocokan alias kanonik (bukan substring-includes yang longgar).
  // Task ber-pic "Revita" → member "Revita" (slug revi) tetap cocok; task
  // ber-pic "Nisa" juga cocok (alias revi) — konsisten dengan backend.
  const memberName = canonicalMember(member.label);
  return canonicalMember(task.pic) === memberName || member.aliases.some((alias) => sameMember(task.pic, alias));
}

function defaultQuickAdd(memberSlug: string, viewerName?: string | null): QuickAddState {
  const member = memberLookup[memberSlug] ?? memberLookup.overview;
  const pic = member?.slug === "overview" ? (viewerName ?? "Aurel") : member.label;
  const today = toLocalDateString();
  return {
    title: "",
    project: "",
    brand: "Dreamlab",
    pic,
    startDate: today,
    dueDate: today,
    priority: "Medium",
  };
}

function defaultDraft(memberSlug: string, viewerName?: string | null): TaskDraft {
  const member = memberLookup[memberSlug] ?? memberLookup.overview;
  const pic = viewerName ?? (member?.slug === "overview" ? "Aurel" : member.label);
  const today = toLocalDateString();
  return {
    title: "",
    project: "",
    brand: "Dreamlab",
    pic,
    status: "Not started",
    priority: "Medium",
    startDate: today,
    dueDate: today,
    brief: "",
    link: "",
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
    brief: task.brief ?? "",
    link: task.link ?? "",
  };
}

function draftToTask(taskId: string, draft: TaskDraft, viewerName?: string | null): TaskRow {
  const viewer = viewerName?.trim() || "System";
  return {
    id: taskId,
    title: draft.title.trim(),
    projectId: "local",
    project: draft.project.trim() || "Marketing",
    brand: draft.brand,
    // assignedBy/reviewer diisi viewer (manager) — bukan "System"/"" supaya
    // task baru punya reviewer yang jelas & tidak hilang dari view reviewer.
    assignedBy: viewer,
    pic: draft.pic.trim() || "Aurel",
    reviewer: viewer === "System" ? "Revi" : viewer,
    priority: draft.priority,
    startDate: draft.startDate,
    dueDate: draft.dueDate,
    status: draft.status,
    sla: "Healthy",
    brief: draft.brief,
    link: draft.link.trim(),
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
  if (!today) return [];
  const [year, month] = today.split("-").map(Number);
  if (Number.isNaN(year) || Number.isNaN(month)) return [];
  // Susun key bulan secara LOKAL (new Date(y, m-1, 1)), bukan via
  // toISOString() yang bisa salah bulan di perbatasan bulan (BUG-D4/P1.4).
  return Array.from({ length: monthCount }, (_, index) => {
    const base = new Date(year, month - 1 + index, 1);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });
}

function getDayLeftLabel(dueDate: string, today: string) {
  if (!dueDate) return "-";
  // Selisih hari kalender lokal (mirror backend calendarDayDiff) — tanpa
  // Math.round pecahan jam yang menggeser batas "late" ±12 jam (BUG-D3).
  const diff = calendarDayDiff(parseLocalDate(dueDate), parseLocalDate(today));
  if (Number.isNaN(diff)) return "-";
  if (diff === 0) return "Today";
  if (diff > 0) return `${diff} day${diff === 1 ? "" : "s"}`;
  return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} late`;
}

function stopRowClick(event: React.SyntheticEvent) {
  event.stopPropagation();
}

// ── Attachment helpers ─────────────────────────────────
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB — samakan dengan backend

/** URL stream file attachment (autentikasi via cookie `token` → `<img>` bisa
 *  render inline). Origin mengikuti lib/api: prod `/api`, dev `localhost:3001`. */
function attachmentContentUrl(taskId: string, attachmentId: string): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:3001"
      : "/api");
  return `${apiUrl}/marketing/prototype/tasks/${taskId}/attachments/${attachmentId}/content`;
}

function formatAttachmentSize(sizeKb: number): string {
  if (!sizeKb) return "";
  if (sizeKb < 1) return "<1 Kb";
  if (sizeKb < 1024) return `${sizeKb} Kb`;
  return `${(sizeKb / 1024).toFixed(1)} Mb`;
}

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp"];
const TEXT_EXTS = ["pdf", "doc", "docx", "txt"];
const SHEET_EXTS = ["xls", "xlsx", "csv"];
const ARCHIVE_EXTS = ["zip"];

function fileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function AttachmentFileIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const ext = fileExtension(name);
  if (IMAGE_EXTS.includes(ext)) return <FileImage className={className} />;
  if (TEXT_EXTS.includes(ext)) return <FileText className={className} />;
  if (SHEET_EXTS.includes(ext)) return <FileSpreadsheet className={className} />;
  if (ARCHIVE_EXTS.includes(ext)) return <FileArchive className={className} />;
  return <File className={className} />;
}

// ── KPI Timeliness Helpers ──────────────────────────────
function getTimelinessColor(percentage: number): string {
  if (percentage >= 80) return "🟢";
  if (percentage >= 70) return "🟡";
  if (percentage >= 60) return "🟠";
  return "🔴";
}

function getTimelinessTailwind(percentage: number): string {
  if (percentage >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (percentage >= 70) return "border-yellow-200 bg-yellow-50 text-yellow-800";
  if (percentage >= 60) return "border-orange-200 bg-orange-50 text-orange-800";
  return "border-red-200 bg-red-50 text-red-800";
}

function calcMemberTimeliness(profile: ProfileRow): { percentage: number; onTime: number; total: number } {
  const total = profile.completed ?? 0;
  const late = profile.late ?? 0;
  if (total === 0) return { percentage: 0, onTime: 0, total: 0 };
  const onTime = Math.max(total - late, 0);
  return { percentage: Math.round((onTime / total) * 100), onTime, total };
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
  // Timer debounce untuk edit inline (title/date) — mencegah request beruntun
  // per keystroke (BUG-U1/P5.1).
  const inlineEditTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Upload attachment (task) — guard klik ganda (BUG-B-05).
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialProjects = useMemo(() => {
    const fromProjects = projects.map((p) => p.name);
    return Array.from(new Set(fromProjects.filter(Boolean)));
  }, [projects]);

  // Server adalah sumber kebenaran project (P3.3): semua tambah/ubah/hapus
  // project lewat API, lalu mirror hasilnya ke localProjects.
  useEffect(() => {
    setLocalProjects(initialProjects);
  }, [initialProjects]);

  const [globalQuickAdd, setGlobalQuickAdd] = useState<QuickAddState>(defaultQuickAdd(activeMember, viewerName));
  const [brandFilter, setBrandFilter] = useState<"all" | "Dreamlab" | "Toribio">("all");

  useEffect(() => {
    setLocalTasks((current) => {
      // Server adalah sumber kebenaran: task yang ada di server selalu dipakai
      // versi server-nya (status/date terbaru). Sebelumnya task ber-ID "local-"
      // SELALU dipertahankan versi lokal dan versi server dibuang — akibatnya
      // kalau server berubah (tab lain / penyimpanan ulang), board menampilkan
      // data basi (mis. status "Done" yang sebenarnya gagal tersimpan tetap
      // tampil sampai reload). Hanya task yang BENAR-BENAR belum ada di server
      // (baru dibuat / create gagal) yang dipertahankan dari state lokal.
      const serverIds = new Set(tasks.map((t) => t.id));
      const localOnly = current.filter((t) => !serverIds.has(t.id));
      return [...tasks, ...localOnly];
    });
  }, [tasks]);

  useEffect(() => {
    setGlobalQuickAdd(defaultQuickAdd(activeMember, viewerName));
    setBrandFilter("all");
    if (!selectedTaskId) {
      setDraft(defaultDraft(activeMember, viewerName));
    }
  }, [activeMember, selectedTaskId, viewerName]);

  // Signature field yang dicerminkan draft — dipakai untuk mencegah reset draft
  // saat localTasks berubah karena hal yang TIDAK memengaruhi draft (mis.
  // upload/hapus attachment). Tanpa ini, hasil upload langsung menimpa ketikan
  // user di Notes/Link yang belum disimpan.
  const draftSourceRef = useRef("");

  useEffect(() => {
    if (!drawerOpen) return;
    if (drawerMode === "edit" && selectedTaskId) {
      const selected = localTasks.find((task) => task.id === selectedTaskId);
      if (selected) {
        const signature = JSON.stringify([
          selected.title,
          selected.project,
          selected.brand,
          selected.pic,
          selected.status,
          selected.priority,
          selected.startDate ?? "",
          selected.dueDate,
          selected.brief ?? "",
          selected.link ?? "",
        ]);
        if (draftSourceRef.current === signature) return;
        draftSourceRef.current = signature;
        setDraft(taskToDraft(selected));
      }
      return;
    }

    draftSourceRef.current = "";
    setDraft(defaultDraft(activeMember, viewerName));
  }, [activeMember, drawerMode, drawerOpen, localTasks, selectedTaskId, viewerName]);

  const selectedMember = memberLookup[activeMember] ?? memberLookup.overview;
  const isOverview = selectedMember?.slug === "overview";
  // Tanggal "hari ini" LOKAL (WIB) — jangan toISOString() yang bisa
  // mengembalikan tanggal KEMARIN sebelum pukul 07:00 (BUG-D1/P1.1).
  const today = toLocalDateString();

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

  const visibleMembers = useMemo(
    () => isManager ? overviewMembers : overviewMembers.filter((m) => m.slug === viewerSlug),
    [isManager, viewerSlug],
  );

  const visibleTasks = useMemo(
    () => (isOverview ? localTasks : localTasks.filter((task) => matchMember(task, selectedMember.slug))),
    [isOverview, localTasks, selectedMember.slug],
  );

  const boardTasks = useMemo(() => {
    return visibleTasks
      .filter((task) => selectedMonth === "all" || task.dueDate.slice(0, 7) === selectedMonth)
      .filter((task) => selectedCampaign === "all" || task.project === selectedCampaign)
      .filter((task) => brandFilter === "all" || task.brand === brandFilter);
  }, [brandFilter, selectedCampaign, selectedMonth, visibleTasks]);

  const chartMonths = useMemo(() => getRecentMonthKeys(6, today), [today]);

  const monthlyPerformance = useMemo(
    () =>
      visibleMembers.map((member) => {
        const memberRows = localTasks.filter((task) => matchMember(task, member.slug));
        const data = chartMonths.map((month) => {
          const rows = memberRows.filter((task) => task.dueDate.slice(0, 7) === month);
          // Done dikelompokkan berdasarkan bulan SELESAI (completedAt), bukan
          // bulan dueDate — supaya grafik "KPI per Bulan" mencerminkan kapan
          // task benar-benar selesai (BUG-K3/P2.3).
          const done = memberRows.filter(
            (task) => task.status === "Done" && (task.completedAt?.slice(0, 7) ?? task.dueDate.slice(0, 7)) === month,
          ).length;
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
    [chartMonths, localTasks, profiles, visibleMembers],
  );

  const snapshots = useMemo(
    () =>
      visibleMembers.map((member) => {
        const rows = localTasks.filter((task) => matchMember(task, member.slug));
        const done = rows.filter((task) => task.status === "Done").length;
        const open = rows.filter((task) => task.status !== "Done").length;
        // "Overdue" = task aktif (belum Done) yang due-nya sudah lewat — dihitung
        // dengan calendarDayDiff (hari kalender lokal), bukan perbandingan string
        // (BUG-K1/P2.1). Open overdue TIDAK menggerus KPI on-time (lihat
        // selectedMemberBrandSnapshot & backend getBundle).
        const late = rows.filter((task) => task.status !== "Done" && calendarDayDiff(parseLocalDate(today), parseLocalDate(task.dueDate)) > 0).length;
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
    [localTasks, profiles, today, visibleMembers],
  );

  const selectedMemberSnapshot = useMemo(
    () => snapshots.find(s => s.slug === selectedMember.slug) ?? null,
    [snapshots, selectedMember.slug],
  );

  // Brand-filtered snapshot for member detail page
  const selectedMemberBrandSnapshot = useMemo(() => {
    const base = selectedMemberSnapshot;
    if (!base || brandFilter === "all") return base;

    const brand = brandFilter as "Dreamlab" | "Toribio";
    const profile = profiles.find((p) => normalize(p.id) === normalize(selectedMember.slug));
    const brandData = profile?.brandKpi?.[brand === "Dreamlab" ? "dreamlab" : "toribio"];

    if (brandData) {
      return {
        ...base,
        total: brandData.total,
        done: brandData.done,
        late: brandData.late,
        open: brandData.inProgress,
        progress: brandData.progress,
        onTime: brandData.onTime,
      };
    }

    // Fallback: compute from local tasks
    const memberTasks = localTasks.filter((task) => matchMember(task, selectedMember.slug) && task.brand === brand);
    const total = memberTasks.length;
    const done = memberTasks.filter((task) => task.status === "Done").length;
    const open = memberTasks.filter((task) => task.status !== "Done").length;
    // Overdue = open task yang lewat due (tidak menggerus KPI on-time).
    const late = memberTasks.filter((task) => task.status !== "Done" && calendarDayDiff(parseLocalDate(today), parseLocalDate(task.dueDate)) > 0).length;
    // Late completion (KPI) = HANYA task Done yang selesai lewat due.
    const lateDone = memberTasks.filter(
      (task) => task.status === "Done" && task.completedAt && calendarDayDiff(parseLocalDate(task.completedAt.slice(0, 10)), parseLocalDate(task.dueDate)) > 0,
    ).length;
    const onTime = Math.max(done - lateDone, 0);
    const progress = total ? Math.round((done / total) * 100) : 0;
    return { ...base, total, done, open, late, progress, onTime };
  }, [selectedMemberSnapshot, brandFilter, profiles, selectedMember.slug, localTasks, today]);

  const selectedMemberChart = useMemo(
    () => monthlyPerformance.find(m => m.slug === selectedMember.slug) ?? null,
    [monthlyPerformance, selectedMember.slug],
  );

  const selectedMemberProfile = useMemo(
    () => profiles.find((p) => normalize(p.id) === normalize(selectedMember.slug)) ?? null,
    [profiles, selectedMember.slug],
  );

  const selectedMemberTimeliness = useMemo(
    () => selectedMemberProfile ? calcMemberTimeliness(selectedMemberProfile) : null,
    [selectedMemberProfile],
  );

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

  // Upload attachment aktif hanya untuk task yang SUDAH punya id server
  // (BUG-A-04) & bukan mode create & bukan sedang upload (BUG-B-05).
  const canUploadAttachment = Boolean(
    selectedTask &&
      !selectedTask.id.startsWith("local-") &&
      !attachmentsUploading &&
      (isManager || drawerMode === "edit"),
  );

  function setTaskField(taskId: string, field: keyof TaskRow, value: string) {
    // Optimistic update — tampilkan perubahan langsung.
    setLocalTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task,
      ),
    );

    // Status memakai endpoint khusus & tidak perlu debounce (select fire sekali).
    if (field === "status") {
      api.patch(`/marketing/prototype/tasks/${taskId}/status`, { status: value, note: `Status changed to ${value}` })
        .then(() => queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] }))
        .catch((err) => {
          console.error("[InlineEdit] Status update failed:", err?.response?.status);
          // Rollback via refetch server (bukan snapshot closure yang stale).
          queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
          alert(`Gagal mengubah status! Silakan coba lagi. (${err?.response?.status || 'Network error'})`);
        });
      return;
    }

    // Non-manager hanya boleh mengubah startDate (backend hanya menerima itu).
    // Field lain dibuat read-only di JSX; kalau sempat berubah, refetch ulang.
    if (!isManager && field !== "startDate") {
      queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
      return;
    }

    // Debounce persist (400 ms) untuk edit inline — satu request per jeda
    // ketik, bukan per keystroke. Rollback gagal = refetch server (P5.1).
    const timerKey = `${taskId}:${field}`;
    const existing = inlineEditTimers.current[timerKey];
    if (existing) clearTimeout(existing);
    inlineEditTimers.current[timerKey] = setTimeout(() => {
      delete inlineEditTimers.current[timerKey];
      api.patch(`/marketing/prototype/tasks/${taskId}`, { [field]: value })
        .then(() => queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] }))
        .catch((err) => {
          console.error("[InlineEdit] Update failed:", field, err?.response?.status);
          queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
          alert(`Gagal menyimpan perubahan! Silakan coba lagi. (${err?.response?.status || 'Network error'})`);
        });
    }, 400);
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
    if (quickAddSaving) return;
    // Semua member bisa membuat task sendiri (Quick Add hanya tampil di halaman
    // member sendiri / overview manager — pic = diri sendiri).
    // Validasi tanggal (BUG-U3/P5.2): dueDate tidak boleh lebih awal dari startDate.
    if (globalQuickAdd.dueDate < globalQuickAdd.startDate) {
      alert("Due date tidak boleh lebih awal dari start date.");
      return;
    }
    setQuickAddSaving(true);

    const pic = globalQuickAdd.pic.trim() || "Aurel";
    const viewer = viewerName?.trim() || "System";

    const newTask = {
      id: `local-${Date.now()}`,
      title: globalQuickAdd.title.trim(),
      projectId: "local",
      project: globalQuickAdd.project.trim() || "Marketing",
      brand: globalQuickAdd.brand,
      assignedBy: viewer,
      pic,
      reviewer: viewer === "System" ? "Revi" : viewer,
      priority: globalQuickAdd.priority,
      startDate: globalQuickAdd.startDate,
      dueDate: globalQuickAdd.dueDate,
      status: "Not started" as const,
      sla: "Healthy" as const,
      brief: "",
      link: "",
    };

    setLocalTasks((current) => [newTask, ...current]);
    setGlobalQuickAdd(defaultQuickAdd(activeMember, viewerName));

    // Persist to backend so other users see it. Setelah sukses, id lokal
    // diganti id server dari respons (BUG-S3/P4.3) supaya status berikutnya
    // (edit/delete) memakai id yang benar.
    api.post("/marketing/prototype/tasks", newTask).then((res) => {
      const savedId = res?.data?.id;
      if (savedId && savedId !== newTask.id) {
        setLocalTasks((current) => current.map((t) => (t.id === newTask.id ? { ...t, id: savedId } : t)));
        // Jika drawer sedang terbuka pada task yang baru dibuat ini (id lokal
        // belum diganti server), sinkronkan selectedTaskId juga — kalau tidak,
        // `selectedTask` jadi undefined dan Save drawer berikutnya diam-diam
        // membuat DUPLIKAT task (terlihat di produksi: 2 task judul sama).
        setSelectedTaskId((prev) => (prev === newTask.id ? savedId : prev));
      }
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
    if (drawerSaving) return;
    setDrawerSaving(true);

    // Semua member boleh membuat task sendiri lewat drawer create (bukan
    // hanya manager). Edit task tetap dibatasi untuk non-manager.
    // Validasi tanggal (BUG-U3/P5.2).
    if (draft.dueDate < draft.startDate) {
      alert("Due date tidak boleh lebih awal dari start date.");
      setDrawerSaving(false);
      return;
    }

    // Resolusi target EDIT difresh dari localTasks (bukan snapshot `selectedTask`
    // yang bisa stale): jika id task lokal sudah diganti id server saat drawer
    // terbuka, kita tetap menemukan task-nya dan PATCH (bukan POST duplikat).
    const isEdit = drawerMode === "edit" && Boolean(selectedTaskId);
    const editBase = isEdit ? localTasks.find((task) => task.id === selectedTaskId) : undefined;
    const nextTask = editBase
      ? { ...editBase, ...draftToTask(editBase.id, draft, viewerName) }
      : draftToTask(`local-${Date.now()}`, draft, viewerName);

    setLocalTasks((current) => {
      if (editBase) {
        return current.map((task) => (task.id === editBase.id ? nextTask : task));
      }
      return [nextTask, ...current];
    });

    setDrawerOpen(false);

    // Persist to backend. Rollback gagal = invalidate/refetch dari server,
    // BUKAN snapshot closure yang stale (BUG-U2/P5.1).
    const persistPromise = editBase
      ? api.patch(`/marketing/prototype/tasks/${editBase.id}`, draft)
      : api.post("/marketing/prototype/tasks", nextTask);

    persistPromise
      .then((res) => {
        // Untuk task baru (bukan edit): ganti id lokal dengan id server.
        if (!editBase) {
          const savedId = res?.data?.id;
          if (savedId && savedId !== nextTask.id) {
            setLocalTasks((current) => current.map((t) => (t.id === nextTask.id ? { ...t, id: savedId } : t)));
          }
        }
        queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
        setDrawerSaving(false);
      })
      .catch((err) => {
        console.error("[SaveDrawer] Failed:", err?.response?.status, err?.response?.data);
        // Rollback via refetch server.
        queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
        alert(`Gagal ${editBase ? 'update' : 'menyimpan'} task! ${err?.response?.status ? `Server: ${err?.response?.status}` : 'Koneksi terputus'}`);
        setDrawerSaving(false);
      });
  }

  // ── Attachment handlers (PLAN-TASK-ATTACHMENTS.md) ─────────────────
  function uploadAttachment(file: File): Promise<void> {
    // Guard BUG-A-04: task belum punya id server (masih `local-`) → jangan kirim.
    if (!selectedTask || selectedTask.id.startsWith("local-")) return Promise.resolve();
    // Guard BUG-B-05: cegah klik ganda / upload ganda.
    if (attachmentsUploading) return Promise.resolve();
    // Pre-check ukuran (BUG-B-01) — backend tetap enforcer final.
    if (file.size > MAX_ATTACHMENT_SIZE) {
      alert("File terlalu besar (maks 10 MB).");
      return Promise.resolve();
    }

    setAttachmentsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post(`/marketing/prototype/tasks/${selectedTask.id}/attachments`, formData, {
        // BUG-C-08: override Content-Type agar axios memakai multipart (bukan JSON).
        headers: { "Content-Type": "multipart/form-data" },
        // BUG-D-07: timeout lebih panjang untuk file besar di koneksi lambat.
        timeout: 60000,
      })
      .then((res) => {
        const updated = res?.data;
        if (updated?.id) {
          // Server = sumber kebenaran; replace entry task dgn versi terbaru.
          setLocalTasks((current) =>
            current.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
          );
        }
        queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
        setAttachmentsUploading(false);
      })
      .catch((err) => {
        console.error("[Attachment] Upload failed:", err?.response?.status, err?.response?.data);
        setAttachmentsUploading(false);
        alert(`Gagal upload file! ${err?.response?.data?.message ?? (err?.response?.status ? `Server: ${err?.response?.status}` : "Koneksi terputus")}`);
      });
  }

  /** Upload banyak file BERURUTAN — mencegah respons yang tumpang tindih
   *  menimpa tampilan (BUG-B-05). */
  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await uploadAttachment(file).catch(() => undefined);
    }
  }

  function deleteAttachment(attachmentId: string) {
    if (!selectedTask || selectedTask.id.startsWith("local-")) return;
    if (!window.confirm("Hapus file ini?")) return;
    api
      .delete(`/marketing/prototype/tasks/${selectedTask.id}/attachments/${attachmentId}`)
      .then((res) => {
        const updated = res?.data;
        if (updated?.id) {
          setLocalTasks((current) =>
            current.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
          );
        }
        queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
      })
      .catch((err) => {
        console.error("[Attachment] Delete failed:", err?.response?.status, err?.response?.data);
        alert(`Gagal hapus file! ${err?.response?.data?.message ?? (err?.response?.status ? `Server: ${err?.response?.status}` : "Koneksi terputus")}`);
      });
  }

  function deleteTask(taskId: string) {
    // Hapus di server dulu; baru hapus lokal setelah sukses. Kalau gagal,
    // refetch server sebagai rollback (task tetap ada) (BUG-U8/P5.7).
    api.delete(`/marketing/prototype/tasks/${taskId}`).then(() => {
      setLocalTasks((current) => current.filter((task) => task.id !== taskId));
      setDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
    }).catch((err) => {
      console.error("[Delete] Failed:", err?.response?.status, err?.response?.data);
      queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
      alert(`Gagal hapus task! ${err?.response?.status}: ${err?.response?.data?.message ?? ''}`);
    });
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
      <div data-marketing-page="management-task" className="space-y-6">
        <div data-marketing-surface="toolbar" className="flex flex-wrap items-end justify-between gap-4 rounded-[28px] border border-slate-200 bg-white/90 px-6 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)] backdrop-blur">
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
          <section data-marketing-surface="panel" className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_-34px_rgba(15,23,42,0.24)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KPI Timeliness</p>
                <h2 className="mt-1 text-[16px] font-bold tracking-tight text-slate-900">Ketepatan Waktu per Member</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Users2 className="h-4 w-4" />
                {isManager ? `${snapshots.length} Members` : "My Performance"}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-5">
              {snapshots.map((member) => {
                const profile = profiles.find((p) => normalize(p.id) === normalize(member.slug));
                const t = profile ? calcMemberTimeliness(profile) : null;
                return (
                  <Link
                    key={member.slug}
                    href={`/marketing/management-task/${member.slug}`}
                    data-marketing-surface="member-card"
                    className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3 min-h-[50px]">
                      <div className="min-w-0 flex-[1]">
                        <h3 className="text-[14px] font-bold tracking-tight text-slate-900 truncate">{member.label}</h3>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{member.role}</p>
                      </div>
                      {t && (
                        <div className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${getTimelinessTailwind(t.percentage)}`}>
                          {getTimelinessColor(t.percentage)} {t.percentage}%
                        </div>
                      )}
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
                    <div className={`mt-4 flex flex-col rounded-[16px] border px-4 py-3 bg-white shadow-sm gap-2 ${t ? getTimelinessTailwind(t.percentage).split(' ').slice(1).join(' ') : 'border-slate-200'}`}>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Ketepatan Waktu</span>
                      <div className="flex items-end justify-between">
                        <span className="text-[26px] font-black tabular-nums leading-none">{t ? `${t.percentage}%` : '-'}</span>
                        {t && <span className="text-[9px] font-bold uppercase tracking-wider">{t.onTime}/{t.total} tepat</span>}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <MetricMini label="Tasks" value={member.total} />
                      <MetricMini label="Done" value={member.done} />
                      <MetricMini label="Late" value={member.late} tone={member.late > 0 ? "danger" : "default"} />
                      <MetricMini label="Open" value={member.open} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : selectedMemberBrandSnapshot ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
            {/* ── Member Snapshot ── */}
            {(() => {
              const activeSnapshot = selectedMemberBrandSnapshot;
              const kpiPct = selectedMemberTimeliness?.percentage ?? activeSnapshot.kpi;
              const kpiColor = kpiPct >= 80 ? 'emerald' : kpiPct >= 70 ? 'yellow' : kpiPct >= 60 ? 'orange' : 'red';
              const colorMap = { emerald: 'border-l-emerald-500 bg-emerald-50/40', yellow: 'border-l-yellow-500 bg-yellow-50/40', orange: 'border-l-orange-500 bg-orange-50/40', red: 'border-l-red-500 bg-red-50/40' };
              const badgeMap = { emerald: 'bg-emerald-100 text-emerald-800', yellow: 'bg-yellow-100 text-yellow-800', orange: 'bg-orange-100 text-orange-800', red: 'bg-red-100 text-red-800' };
              const brandLabel = brandFilter === 'all' ? 'All' : brandFilter;
              const brandColor = brandFilter === 'Dreamlab' ? 'border-blue-200 bg-blue-50 text-blue-700' : brandFilter === 'Toribio' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-slate-200 bg-white/80 text-slate-600';
              const brandDot = brandFilter === 'Dreamlab' ? 'bg-blue-500' : brandFilter === 'Toribio' ? 'bg-purple-500' : 'bg-slate-400';
              return (
                <section data-marketing-surface="member-summary" className={`rounded-[20px] border border-l-4 border-slate-200 ${colorMap[kpiColor]} shadow-[0_8px_24px_-18px_rgba(15,23,42,0.2)] p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold tracking-tight text-slate-900">{selectedMember.label}</h3>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400/80">{activeSnapshot.role}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* ── Brand Toggle ── */}
                      <div className="flex items-center rounded-full border border-slate-200 bg-white/90 shadow-sm overflow-hidden">
                        {(["all", "Dreamlab", "Toribio"] as const).map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBrandFilter(b)}
                            className={`relative px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] transition ${
                              brandFilter === b
                                ? b === 'all'
                                  ? 'bg-slate-800 text-white'
                                  : b === 'Dreamlab'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-purple-600 text-white'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            {b === 'all' ? 'All' : b === 'Dreamlab' ? 'DL' : 'TB'}
                          </button>
                        ))}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black tabular-nums ${badgeMap[kpiColor]}`}>
                        {kpiPct}%
                      </span>
                      <span className="rounded-full bg-white/80 border border-slate-200 px-2.5 py-1 text-[9px] font-bold text-slate-500">
                        {activeSnapshot.total} tgs
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-2.5">
                    <div className="flex-1 h-2 rounded-full bg-white/70 border border-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${activeSnapshot.late > 0 ? "bg-rose-500" : "bg-blue-500"}`} style={{ width: `${activeSnapshot.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-slate-400">{activeSnapshot.progress}%</span>
                  </div>
                  {/* KPI Cards: All Task | Done | Progress | Late | Onetime */}
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {[
                      { label: 'All Task', value: activeSnapshot.total, color: 'text-slate-800' },
                      { label: 'Done', value: activeSnapshot.done, color: 'text-emerald-700' },
                      { label: 'Progress', value: `${activeSnapshot.progress}%`, color: activeSnapshot.progress >= 80 ? 'text-emerald-700' : activeSnapshot.progress >= 60 ? 'text-amber-700' : 'text-rose-700' },
                      { label: 'Late', value: activeSnapshot.late, color: activeSnapshot.late > 0 ? 'text-rose-600' : 'text-slate-400' },
                      { label: 'Onetime', value: (brandFilter !== 'all' && 'onTime' in activeSnapshot ? (activeSnapshot as any).onTime : selectedMemberTimeliness?.onTime ?? activeSnapshot.done), color: 'text-emerald-700' },
                    ].map(m => (
                      <div key={m.label} data-marketing-surface="mini-metric" className="rounded-xl bg-white/70 border border-slate-100 px-2 py-2 text-center">
                        <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
                        <p className={`mt-0.5 text-[13px] font-black tabular-nums ${m.color}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* ── Monthly KPI Chart ── */}
            {selectedMemberChart && (
              <section data-marketing-surface="chart-card" className="rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_24px_-18px_rgba(15,23,42,0.2)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">KPI per Bulan</p>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{chartMonths.length} bln</span>
                </div>
                <div className="mt-2 h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedMemberChart.data} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 600 }} />
                      <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#94A3B8", fontSize: 9, fontWeight: 600 }} width={24} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", background: "#fff", fontSize: "10px", padding: "6px 10px" }} formatter={(value) => [`${Number(value ?? 0)}%`, ""]} />
                      <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1.5, fill: "#fff" }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </div>
        ) : null}

        {!isOverview ? (
        <>
        <div data-marketing-surface="quick-add" className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_-34px_rgba(15,23,42,0.24)] overflow-hidden">
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
                  const diff = calendarDayDiff(parseLocalDate(globalQuickAdd.dueDate), parseLocalDate(today));
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
              <div key={group.status} data-marketing-surface="task-group" className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_-34px_rgba(15,23,42,0.24)]">
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
                              data-marketing-surface="task-row"
                              className="grid cursor-pointer grid-cols-[minmax(200px,2.2fr)_minmax(100px,1fr)_minmax(80px,0.8fr)_minmax(120px,1.1fr)_minmax(100px,0.9fr)_minmax(90px,0.8fr)_minmax(70px,0.7fr)] items-center gap-1.5 px-6 py-3 transition hover:bg-slate-50/80 focus-visible:bg-slate-50/80 focus-visible:outline-none"
                            >
                              <div className="min-w-0 flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <DnaInput
                                    value={task.title}
                                    onChange={(event) => setTaskField(task.id, "title", event.target.value)}
                                    onClick={stopRowClick}
                                    readOnly={!isManager}
                                    title={!isManager ? "Hanya manager yang dapat mengubah judul" : undefined}
                                    className={`h-8 border-0 bg-transparent px-0 text-[13px] font-bold shadow-none focus:ring-0 text-slate-800 ${!isManager ? "cursor-default opacity-80" : ""}`}
                                  />
                                  {task.link ? (
                                    <a
                                      href={task.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={task.link}
                                      onClick={stopRowClick}
                                      className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  ) : null}
                                </div>
                                <select
                                  value={task.project}
                                  onChange={(event) => setTaskField(task.id, "project", event.target.value)}
                                  onClick={stopRowClick}
                                  disabled={!isManager}
                                  className="mt-0.5 block w-fit border-0 bg-transparent p-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 outline-none focus:ring-0 focus:text-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
                                  // Badge disinkronkan dengan SLA backend (BUG-D2/D3/P2.1).
                                  // diff = due - today (hari kalender lokal). Task DONE memakai
                                  // SLA (tepat waktu vs terlambat selesai) — tidak ada lagi
                                  // pengecualian hardcode "sla === Healthy".
                                  const diff = calendarDayDiff(parseLocalDate(task.dueDate), parseLocalDate(today));
                                  if (Number.isNaN(diff)) return <span className="text-slate-400">-</span>;
                                  if (task.status === "Done") {
                                    if (task.sla === "Healthy") {
                                      return <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm">On time</span>;
                                    }
                                    const lateDays = task.completedAt
                                      ? Math.max(calendarDayDiff(parseLocalDate(task.completedAt.slice(0, 10)), parseLocalDate(task.dueDate)), 0)
                                      : Math.abs(diff);
                                    return <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-700 shadow-sm">{lateDays}d late</span>;
                                  }
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
              {/* Notes — di ATAS karena isi utama. Field backend = `brief`; diubah
                  dari `notes` agar tersimpan (BUG-L1/L2 — sebelumnya dibuang
                  diam-diam oleh whitelist updateTask). */}
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                <textarea
                  value={draft.brief}
                  onChange={(event) => setDraft((current) => ({ ...current, brief: event.target.value }))}
                  rows={5}
                  disabled={!isManager && drawerMode !== "create"}
                  className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-[13px] leading-6 text-slate-900 outline-none focus:border-blue-300 resize-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="Write task description or notes here..."
                />
              </div>

              {/* Link — URL deliverable/lampiran (BUG-L3). Disimpan ke field
                  `link` di backend. */}
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Link</p>
                <DnaInput
                  type="url"
                  value={draft.link}
                  onChange={(event) => setDraft((current) => ({ ...current, link: event.target.value }))}
                  placeholder="https://drive.google.com/..."
                  disabled={!isManager && drawerMode !== "create"}
                  className="h-11 w-full rounded-[20px] border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 outline-none focus:border-blue-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {/* Attachment — upload gambar/dokumen ala Notion
                  (PLAN-TASK-ATTACHMENTS.md). Upload LANGSUNG ke server saat
                  file dipilih (bukan lewat tombol Save Task). */}
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Attachment
                    {(selectedTask?.attachments?.length ?? 0) > 0 ? (
                      <span className="ml-1.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                        {selectedTask!.attachments!.length}
                      </span>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!canUploadAttachment}
                    title={
                      selectedTask && selectedTask.id.startsWith("local-")
                        ? "Simpan task terlebih dahulu sebelum menambah file"
                        : "Tambah file"
                    }
                    className={`inline-flex h-7 items-center gap-1 rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider transition ${
                      canUploadAttachment
                        ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {attachmentsUploading ? "Uploading..." : "Add file"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                    className="hidden"
                    onChange={(event) => {
                      uploadFiles(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </div>

                <div className="space-y-2">
                  {(selectedTask?.attachments ?? []).length ? (
                    selectedTask!.attachments!.map((att) => {
                      const isImage = att.path && att.type.startsWith("image/");
                      const contentUrl = att.path
                        ? attachmentContentUrl(selectedTask!.id, att.id)
                        : null;
                      const canDelete =
                        isManager || normalize(att.uploadedBy) === normalize(viewerName ?? "");
                      return (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2"
                          onClick={stopRowClick}
                        >
                          {isImage && contentUrl ? (
                            <img
                              src={contentUrl}
                              alt={att.name}
                              onClick={() => window.open(contentUrl, "_blank")}
                              onError={(event) => {
                                // BUG-C-02/D-08: file hilang/401 → jatuh ke ikon,
                                // bukan menampilkan gambar rusak.
                                event.currentTarget.style.display = "none";
                              }}
                              className="h-12 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
                              <AttachmentFileIcon name={att.name} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-semibold text-slate-800">{att.name}</p>
                            <p className="text-[10px] font-medium text-slate-400">
                              {formatAttachmentSize(att.sizeKb)}
                              {att.uploadedBy ? ` · ${att.uploadedBy}` : ""}
                            </p>
                          </div>
                          {contentUrl ? (
                            <a
                              href={contentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={stopRowClick}
                              title="Buka file"
                              className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteAttachment(att.id);
                              }}
                              title="Hapus file"
                              className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 py-4 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                      Belum ada file
                    </p>
                  )}
                </div>
              </div>

              {/* Fields grid — field selain status/startDate bersifat read-only
                  untuk non-manager (backend tidak menerimanya; mencegah perubahan
                  yang diam-diam hilang — P5.1). */}
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Task">
                  <DnaInput value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Task title" disabled={!isManager && drawerMode !== "create"} />
                </Field>
                <Field label="Project">
                  <select
                    value={draft.project}
                    onChange={(event) => setDraft((current) => ({ ...current, project: event.target.value }))}
                    disabled={!isManager && drawerMode !== "create"}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none focus:border-blue-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
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
                    disabled={!isManager && drawerMode !== "create"}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none focus:border-blue-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="Dreamlab">Dreamlab</option>
                    <option value="Toribio">Toribio</option>
                  </select>
                </Field>
                <Field label="Assignee">
                  <DnaInput value={draft.pic} onChange={(event) => setDraft((current) => ({ ...current, pic: event.target.value }))} placeholder="Aurel" disabled={!isManager} />
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
                    disabled={!isManager && drawerMode !== "create"}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-900 outline-none focus:border-blue-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
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
                  <DnaInput type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} disabled={!isManager && drawerMode !== "create"} />
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
          <div data-marketing-surface="modal" className="w-full max-w-[450px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
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
                  if (!trimmed || localProjects.includes(trimmed)) return;
                  // Tambah project via API backend (P3.3) supaya tetap ada
                  // setelah refresh — bukan hanya state lokal.
                  api.post("/marketing/prototype/projects", { name: trimmed })
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] });
                      setNewProjectName("");
                    })
                    .catch((err) => {
                      console.error("[ProjectManager] Add failed:", err?.response?.status, err?.response?.data);
                      alert(`Gagal tambah project! ${err?.response?.status ? `Server: ${err?.response?.status}` : 'Koneksi terputus'}`);
                    });
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
                            setEditingProjectIndex(null);
                            if (!trimmed || trimmed === projectName) return;
                            const project = projects.find((p) => p.name === projectName);
                            if (!project) return;
                            // Ubah project via API backend (P3.3); task yang
                            // ber-project lama ikut di-reassign oleh backend.
                            api.patch(`/marketing/prototype/projects/${project.id}`, { name: trimmed })
                              .then(() => queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] }))
                              .catch((err) => {
                                console.error("[ProjectManager] Edit failed:", err?.response?.status, err?.response?.data);
                                alert(`Gagal ubah project! ${err?.response?.status ? `Server: ${err?.response?.status}` : 'Koneksi terputus'}`);
                              });
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
                              const project = projects.find((p) => p.name === projectName);
                              if (!project) return;
                              if (!window.confirm(`Hapus project "${projectName}"? Task di dalamnya dipindah ke project lain.`)) return;
                              // Hapus project via API backend (P3.3) — task di
                              // dalamnya otomatis di-reassign oleh backend.
                              api.delete(`/marketing/prototype/projects/${project.id}`)
                                .then(() => queryClient.invalidateQueries({ queryKey: ["marketing-prototype-bundle"] }))
                                .catch((err) => {
                                  console.error("[ProjectManager] Delete failed:", err?.response?.status, err?.response?.data);
                                  alert(`Gagal hapus project! ${err?.response?.status ? `Server: ${err?.response?.status}` : 'Koneksi terputus'}`);
                                });
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
