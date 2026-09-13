"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  ListTodo,
} from "lucide-react";
import {
  DnaButton,
} from "@/components/dna";
import { DnaEmptyState } from "@/components/dna/DnaEmptyState";
import { DnaDaysLeftChip, DnaPriorityBadge } from "@/components/dna/DnaExtras";
import TaskDetailModal from "./TaskDetailModal";
import CreateTaskModal from "./CreateTaskModal";
import MemberEditModal from "./MemberEditModal";
import { marketingService } from "@/lib/services/marketing-service";
import { useDnaToast } from "@/components/dna/DnaToast";
import type { MarketingTask, MarketingTeamMember, MarketingViewer, TaskStatus } from "@/types/marketing-api";

const NEXT_STATUSES: Partial<Record<TaskStatus, TaskStatus[]>> = {
  NOT_STARTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: ["DONE"],
  REVISION: ["IN_PROGRESS"],
};

function formatDateIndo(dateStr: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getStatusClass(status: TaskStatus) {
  switch (status) {
    case "DONE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "IN_REVIEW":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "LATE":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "NOT_STARTED":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

interface MemberProfileViewProps {
  member: MarketingTeamMember;
  tasks: MarketingTask[];
  viewer: MarketingViewer;
  onRefresh: () => void;
}

export default function MemberProfileView({ member, tasks, viewer, onRefresh }: MemberProfileViewProps) {
  const toast = useDnaToast();
  const canManage = viewer.roles.some((role) => ["SUPER_ADMIN", "HEAD_OPS", "MARKETING"].includes(role));
  const canCreateForMember = canManage || member.userId === viewer.id;
  const [activeTab, setActiveTab] = useState<"overview" | "daily" | "projects">("overview");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState<"DAILY" | "PROJECT">("DAILY");
  const [editingTask, setEditingTask] = useState<MarketingTask | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter tasks specifically for this member
  const memberTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.assigneeId === member.userId || t.assignee?.name?.toLowerCase() === member.name.toLowerCase()
    );
  }, [tasks, member]);

  const dailyTasks = useMemo(() => memberTasks.filter((t) => t.type === "DAILY"), [memberTasks]);
  const projectTasks = useMemo(() => memberTasks.filter((t) => t.type === "PROJECT"), [memberTasks]);

  // Overall member stats
  const totalCount = memberTasks.length;
  const totalCompleted = memberTasks.filter((t) => t.status === "DONE").length;
  const totalLate = memberTasks.filter(
    (t) => t.status === "LATE" || (t.status !== "DONE" && new Date(t.dueDate) < new Date())
  ).length;
  const overallCompRate = totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0;
  const overallLateRate = totalCount > 0 ? Math.round((totalLate / totalCount) * 100) : 0;

  // Daily stats
  const dailyDone = dailyTasks.filter((t) => t.status === "DONE").length;
  const dailyLate = dailyTasks.filter(
    (t) => t.status === "LATE" || (t.status !== "DONE" && new Date(t.dueDate) < new Date())
  ).length;
  const dailyOnTime = dailyDone;
  const dailyCompRate = dailyTasks.length > 0 ? Math.round((dailyDone / dailyTasks.length) * 100) : 0;
  const dailyLateRate = dailyTasks.length > 0 ? Math.round((dailyLate / dailyTasks.length) * 100) : 0;

  // Project stats
  const projectDone = projectTasks.filter((t) => t.status === "DONE").length;
  const projectLate = projectTasks.filter(
    (t) => t.status === "LATE" || (t.status !== "DONE" && new Date(t.dueDate) < new Date())
  ).length;
  const projectOnTime = projectDone;
  const projectCompRate = projectTasks.length > 0 ? Math.round((projectDone / projectTasks.length) * 100) : 0;
  const projectLateRate = projectTasks.length > 0 ? Math.round((projectLate / projectTasks.length) * 100) : 0;

  // Fast-path status toggle
  const handleToggleTaskDone = async (task: MarketingTask, e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status !== "IN_REVIEW") return;
    const nextStatus: TaskStatus = "DONE";
    try {
      await marketingService.updateTaskStatus(viewer, task.id, {
        version: task.version,
        status: nextStatus,
      });
      toast.success(
        nextStatus === "DONE"
          ? `Task "${task.title}" ditandai selesai.`
          : `Task "${task.title}" dikembalikan ke pengerjaan.`
      );
      onRefresh();
    } catch (err: any) {
      toast.error("Gagal update status: " + err.message);
    }
  };

  // Inline status selector change
  const handleInlineStatusChange = async (task: MarketingTask, newStatus: TaskStatus) => {
    try {
      await marketingService.updateTaskStatus(viewer, task.id, {
        version: task.version,
        status: newStatus,
      });
      toast.success(`Status "${task.title}" diubah menjadi ${newStatus.replace("_", " ")}.`);
      onRefresh();
    } catch (err: any) {
      toast.error("Gagal ubah status: " + err.message);
    }
  };

  // Save profile edit
  const handleSaveProfile = async (patch: Partial<MarketingTeamMember>) => {
    await marketingService.updateMember(viewer, member.id, patch);
    onRefresh();
  };

  // Filtered daily/project by search query
  const filteredDaily = useMemo(() => {
    if (!search.trim()) return dailyTasks;
    const q = search.toLowerCase();
    return dailyTasks.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.brief?.toLowerCase().includes(q) ?? false)
    );
  }, [dailyTasks, search]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projectTasks;
    const q = search.toLowerCase();
    return projectTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.project?.name.toLowerCase().includes(q) ?? false) ||
        (t.brief?.toLowerCase().includes(q) ?? false)
    );
  }, [projectTasks, search]);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/marketing/management-task/overview"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Overview Tim</span>
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-700 border border-slate-200 shadow-xs shrink-0"
            style={{ backgroundColor: member.avatarBg }}
          >
            {member.initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{member.name}</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {member.department}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {member.role} · <span className="font-mono text-slate-400">{member.email}</span>
              {member.phone && <span className="text-slate-400"> · {member.phone}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage && <DnaButton
            variant="outline"
            icon={<Edit3 className="w-4 h-4" />}
            onClick={() => setEditProfileOpen(true)}
          >
            Edit Profile
          </DnaButton>}
          {canCreateForMember && <DnaButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingTask(null);
              setCreateDefaultType("DAILY");
              setCreateModalOpen(true);
            }}
          >
            Tambah task
          </DnaButton>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "overview"
              ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Overview & Performa
        </button>
        <button
          onClick={() => setActiveTab("daily")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "daily"
              ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span>Daily Tasks</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
            {dailyTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "projects"
              ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span>Project Tasks</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
            {projectTasks.length}
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & PERFORMA */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Total Task
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">{totalCount - totalCompleted} sedang berjalan</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Total Completed
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{totalCompleted}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Selesai tepat waktu</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Overall Completion Rate
              </span>
              <div className="text-2xl font-black text-blue-600 mt-1">{overallCompRate}%</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Target standar ≥ 75%</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Overall Late Rate
              </span>
              <div className="text-2xl font-black text-rose-600 mt-1">{overallLateRate}%</div>
              <p className="text-[11px] text-slate-400 mt-0.5">{totalLate} task butuh follow-up</p>
            </div>
          </div>

          {/* Two Evaluation Comparison Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Tasks Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Daily Task</h3>
                  <p className="text-[11px] text-slate-400">Penilaian kepatuhan daily task rutin</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  DAILY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    Completion Rate
                  </span>
                  <div className="text-xl font-black text-emerald-600 mt-1">{dailyCompRate}%</div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${dailyCompRate}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    Late Rate
                  </span>
                  <div className="text-xl font-black text-rose-600 mt-1">{dailyLateRate}%</div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${dailyLateRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Completed</span>
                  <span className="font-bold text-emerald-600">
                    {dailyDone} / {dailyTasks.length}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Late</span>
                  <span className="font-bold text-rose-600">
                    {dailyLate} / {dailyTasks.length}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">On Time</span>
                  <span className="font-bold text-emerald-600">{dailyOnTime}</span>
                </div>
              </div>
            </div>

            {/* Project Tasks Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Project Task</h3>
                  <p className="text-[11px] text-slate-400">Penilaian milestone & deadline proyek</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                  PROJECT
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    Completion Rate
                  </span>
                  <div className="text-xl font-black text-emerald-600 mt-1">{projectCompRate}%</div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${projectCompRate}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    Late Rate
                  </span>
                  <div className="text-xl font-black text-rose-600 mt-1">{projectLateRate}%</div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${projectLateRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Completed</span>
                  <span className="font-bold text-emerald-600">
                    {projectDone} / {projectTasks.length}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Late</span>
                  <span className="font-bold text-rose-600">
                    {projectLate} / {projectTasks.length}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">On Time</span>
                  <span className="font-bold text-emerald-600">{projectOnTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY TASKS */}
      {activeTab === "daily" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Daily Tasks</h3>
              <p className="text-xs text-slate-400">Tugas operasional rutin dan tenggat waktu hari ini</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari daily task..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none w-48"
              />
              {canCreateForMember && <DnaButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setEditingTask(null);
                  setCreateDefaultType("DAILY");
                  setCreateModalOpen(true);
                }}
              >
                Tambah Daily Task
              </DnaButton>}
            </div>
          </div>

          {filteredDaily.length === 0 ? (
            <DnaEmptyState
              title="Belum ada Daily Task"
              description={`Tidak ada daily task untuk ${member.name} yang cocok dengan pencarian.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Task</th>
                    <th className="py-3 px-2">Start Date</th>
                    <th className="py-3 px-2">Due Date</th>
                    <th className="py-3 px-2">Days Left</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Prioritas</th>
                    <th className="py-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDaily.map((task) => {
                    const isDone = task.status === "DONE";
                    const allowedStatuses = [task.status, ...(NEXT_STATUSES[task.status] ?? [])];
                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => handleToggleTaskDone(task, e)}
                              disabled={task.status !== "IN_REVIEW"}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 disabled:cursor-not-allowed disabled:opacity-45 ${
                                isDone
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-300 hover:border-slate-500 bg-white"
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3" />}
                            </button>
                            <div>
                              <div
                                className={`font-semibold transition ${
                                  isDone
                                    ? "line-through text-slate-400"
                                    : "text-slate-900 group-hover:text-blue-600"
                                }`}
                              >
                                {task.title}
                              </div>
                              {task.brief && (
                                <div className="text-[10px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                                  {task.brief}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                          {formatDateIndo(task.startDate)}
                        </td>

                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                          {formatDateIndo(task.dueDate)}
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          <DnaDaysLeftChip dueDate={task.dueDate} />
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) => handleInlineStatusChange(task, e.target.value as TaskStatus)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${getStatusClass(task.status)}`}
                          >
                            {allowedStatuses.map((status) => <option key={status} value={status}>{status === "IN_REVIEW" ? "In Review" : status.replace("_", " ")}</option>)}
                          </select>
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          <DnaPriorityBadge priority={task.priority} />
                        </td>

                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTaskId(task.id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
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
          )}
        </div>
      )}

      {/* TAB 3: PROJECT TASKS */}
      {activeTab === "projects" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Project Tasks</h3>
              <p className="text-xs text-slate-400">Milestone proyek dan timeline penugasan penting</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari project task..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none w-48"
              />
              {canCreateForMember && <DnaButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setEditingTask(null);
                  setCreateDefaultType("PROJECT");
                  setCreateModalOpen(true);
                }}
              >
                Tambah Project Task
              </DnaButton>}
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <DnaEmptyState
              title="Belum ada Project Task"
              description={`Tidak ada project task untuk ${member.name} yang cocok dengan pencarian.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Task</th>
                    <th className="py-3 px-2">Project</th>
                    <th className="py-3 px-2">Start Date</th>
                    <th className="py-3 px-2">Due Date</th>
                    <th className="py-3 px-2">Days Left</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Prioritas</th>
                    <th className="py-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProjects.map((task) => {
                    const isDone = task.status === "DONE";
                    const allowedStatuses = [task.status, ...(NEXT_STATUSES[task.status] ?? [])];
                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => handleToggleTaskDone(task, e)}
                              disabled={task.status !== "IN_REVIEW"}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 disabled:cursor-not-allowed disabled:opacity-45 ${
                                isDone
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-300 hover:border-slate-500 bg-white"
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3" />}
                            </button>
                            <div>
                              <div
                                className={`font-semibold transition ${
                                  isDone
                                    ? "line-through text-slate-400"
                                    : "text-slate-900 group-hover:text-blue-600"
                                }`}
                              >
                                {task.title}
                              </div>
                              {task.brief && (
                                <div className="text-[10px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                                  {task.brief}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                            {task.project?.name || "General"}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                          {formatDateIndo(task.startDate)}
                        </td>

                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                          {formatDateIndo(task.dueDate)}
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          <DnaDaysLeftChip dueDate={task.dueDate} />
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) => handleInlineStatusChange(task, e.target.value as TaskStatus)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${getStatusClass(task.status)}`}
                          >
                            {allowedStatuses.map((status) => <option key={status} value={status}>{status === "IN_REVIEW" ? "In Review" : status.replace("_", " ")}</option>)}
                          </select>
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          <DnaPriorityBadge priority={task.priority} />
                        </td>

                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTaskId(task.id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
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
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={Boolean(selectedTaskId)}
        taskId={selectedTaskId}
        viewer={viewer}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={onRefresh}
        onEditTask={(t) => {
          setEditingTask(t);
          setCreateModalOpen(true);
        }}
        onDeleteTask={() => {
          onRefresh();
        }}
      />

      {/* Create / Edit Task Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingTask(null);
        }}
        onCreated={onRefresh}
        viewer={viewer}
        defaultAssigneeId={member.userId ?? viewer.id}
        defaultType={createDefaultType}
        initialTask={editingTask}
      />

      {/* Edit Member Profile Modal */}
      {canManage && <MemberEditModal
        isOpen={editProfileOpen}
        member={member}
        onClose={() => setEditProfileOpen(false)}
        onSave={handleSaveProfile}
      />}
    </div>
  );
}
