"use client";

import { AlertTriangle, ArrowLeft, FileText, Layers } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  DnaTable,
  DnaTableBody,
  DnaTableHead,
  DnaTableRow,
  DnaTd,
  DnaTh,
} from "@/components/dna";

/**
 * Project detail. There is no per-project endpoint for the project-control model
 * (blockers/decisions/milestones have no storage), so this page reads the project from
 * the canonical register (/marketing/projects) and, for its id, the linked tasks
 * (/marketing/tasks?projectId=...). Nothing is invented: an id that is not in the
 * register renders an honest not-found state.
 */
interface ProjectRow {
  id: string;
  projectCode: string;
  name: string;
  channel: string;
  category: string;
  status: string;
  progress: number;
  startDate: string | null;
  deadline: string | null;
  summary: string | null;
  blockers: string | null;
  ownerName: string;
  brandName: string | null;
  updatedAt: string;
  taskCount: number;
}

interface ProjectTaskRow {
  id: string;
  title: string;
  status: string;
  assigneeName: string;
  dueDate: string | null;
  projectName: string;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function unwrapList(payload: any): any[] {
  const list = payload?.data?.data || payload?.data || payload;
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data)) return list.data;
  return [];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const {
    data: project,
    isLoading,
    isError,
    refetch,
  } = useQuery<ProjectRow | null>({
    queryKey: ["marketing-project", projectId],
    queryFn: async () => {
      try {
        const res = await api.get("/marketing/projects", { params: { limit: 100 } });
        const row = unwrapList(res.data).find((p: any) => p.id === projectId);
        if (!row) return null;
        return {
          id: row.id,
          projectCode: row.projectCode || "—",
          name: row.name || "—",
          channel: row.channel || "—",
          category: row.category || "—",
          status: row.canonicalStatus || row.status || "PLANNED",
          progress: Number(row.progress ?? 0),
          startDate: row.startDate || null,
          deadline: row.deadline || null,
          summary: row.summary || null,
          blockers: row.blockers || null,
          ownerName: row.owner?.fullName || row.owner?.name || "—",
          brandName: row.brand?.name || null,
          updatedAt: row.updatedAt,
          taskCount: Number(row._count?.tasks ?? 0),
        };
      } catch {
        return null;
      }
    },
  });

  const { data: tasks = [] } = useQuery<ProjectTaskRow[]>({
    queryKey: ["marketing-project-tasks", projectId],
    enabled: !!project,
    queryFn: async () => {
      try {
        const res = await api.get("/marketing/tasks", {
          params: { projectId, limit: 100 },
        });
        return unwrapList(res.data).map(
          (t: any): ProjectTaskRow => ({
            id: t.id,
            title: t.title || "—",
            status: t.canonicalStatus || t.status || "—",
            assigneeName: t.assignee?.fullName || t.assignee?.name || "—",
            dueDate: t.dueDate || null,
            projectName: t.project?.name || "—",
          })
        );
      } catch {
        return [];
      }
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
        <DnaLoadingSkeleton rows={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
        <DnaErrorState
          title="Gagal Memuat Detail Proyek"
          message="Tidak dapat mengambil data dari /marketing/projects."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6 px-6 py-12 bg-[#F8FAFC] min-h-screen text-slate-900 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-2" />
        <h2 className="text-xl font-bold">Proyek Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1">
          Tidak ada proyek dengan ID <code className="text-rose-600 font-mono">{projectId}</code> pada
          register proyek (<code className="font-mono">/marketing/projects</code>).
        </p>
        <Link
          href="/samples/project-control"
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Project Control Hub</span>
        </Link>
      </div>
    );
  }

  const doneTasks = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
      <div>
        <Link
          href="/samples/project-control"
          className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors mb-2 text-decoration-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Project Control Hub</span>
        </Link>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] leading-[34px] font-bold text-slate-900 tracking-tight">
                {project.name}
              </h1>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-bold border border-slate-200">
                {project.status}
              </span>
            </div>
            <p className="text-[13px] text-slate-500 mt-1">
              Kode: <strong className="text-slate-700 tabular-nums">{project.projectCode}</strong> | Channel:{" "}
              <strong className="text-slate-700">{project.channel}</strong> | Brand:{" "}
              <strong className="text-slate-700">{project.brandName || "—"}</strong> | Owner:{" "}
              <strong className="text-slate-700">{project.ownerName}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Status Kanonik</p>
          <p className="text-[14px] font-black text-slate-900 mt-1">{project.status}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Progress Tercatat</p>
          <h3 className="text-[22px] font-black text-slate-900 mt-0.5">{project.progress}%</h3>
          <p className="text-[10px] text-slate-500 font-medium">Field progress proyek</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Deadline</p>
          <h3 className="text-[16px] font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatDate(project.deadline)}
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">Mulai: {formatDate(project.startDate)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Kategori</p>
          <p className="text-[12px] font-bold text-slate-900 mt-1 truncate">{project.category}</p>
          <p className="text-[10px] text-slate-500 font-medium">channel {project.channel}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Task Terkait</p>
          <h3 className="text-[22px] font-black text-slate-900 mt-0.5">
            {doneTasks}/{tasks.length || project.taskCount}
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">Selesai / total task</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Update Terakhir</p>
          <h3 className="text-[14px] font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatDate(project.updatedAt)}
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">updatedAt register</p>
        </div>
      </div>

      {project.blockers?.trim() && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 shadow-2xs">
          <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[10px] rounded uppercase tracking-wider">
            BLOCKER TERCATAT
          </span>
          <p className="text-[13px] text-rose-900 font-medium mt-1.5">{project.blockers}</p>
        </div>
      )}

      {project.summary?.trim() && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-500" /> Ringkasan Proyek
          </h3>
          <p className="text-[13px] text-slate-700 font-medium bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
            {project.summary}
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" /> Task Proyek
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            {tasks.length} task dari /marketing/tasks
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-6">
            <DnaEmptyState
              title="Belum Ada Task Tercatat"
              description="Tidak ada task marketing yang terhubung ke proyek ini pada /marketing/tasks?projectId="
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <DnaTh className="px-4 py-3 w-12 text-center">#</DnaTh>
                  <DnaTh className="px-4 py-3">Judul Task</DnaTh>
                  <DnaTh className="px-4 py-3">Penanggung Jawab</DnaTh>
                  <DnaTh className="px-4 py-3">Status</DnaTh>
                  <DnaTh className="px-4 py-3">Tenggat</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {tasks.map((t, idx) => (
                  <DnaTableRow key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <DnaTd className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</DnaTd>
                    <DnaTd className="px-4 py-3 font-semibold text-slate-900">{t.title}</DnaTd>
                    <DnaTd className="px-4 py-3 text-slate-700 font-medium">{t.assigneeName}</DnaTd>
                    <DnaTd className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                        {t.status}
                      </span>
                    </DnaTd>
                    <DnaTd className="px-4 py-3 tabular-nums text-[12px] text-slate-600">
                      {formatDate(t.dueDate)}
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-900">
        <strong className="block mb-1">Catatan cakupan data</strong>
        Detail proyek dibaca dari register <code className="font-mono">/marketing/projects</code> dan task
        terkait dari <code className="font-mono">/marketing/tasks</code>. Model milestone dengan bukti
        verifikasi, blocker berjenjang keparahan, dan keputusan Direksi yang sebelumnya tampil sebagai contoh
        belum memiliki penyimpanan di backend, sehingga tidak ditampilkan di sini.
      </div>
    </div>
  );
}