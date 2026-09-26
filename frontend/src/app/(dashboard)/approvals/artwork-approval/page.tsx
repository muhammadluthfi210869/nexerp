"use client";

/**
 * Wired to the live creative module:
 *   GET   /creative/tasks                 — design task list (lead + latest version)
 *   GET   /creative/tasks/:id/history     — feedback trail, revision bound, allowance left
 *   PATCH /creative/task/:id/client-review   {status, versionId, notes}
 *   PATCH /creative/task/:id/apj-review      {status, versionId, notes, pin}
 *
 * The previous revision rendered `INITIAL_ARTWORK_DATA` (three invented projects with
 * invented versions and invented three-way approvals) merged with a localStorage store,
 * so an operator could "approve" artwork that existed only in the bundle. There is no
 * static array, no localStorage store and no auto-sync from unrelated client state here.
 *
 * Honest limits of the live model: DesignTask has no client/product/packaging columns
 * (those come from the linked Lead), no per-version three-way approval matrix (the
 * backend records exactly two decisions — APJ/Legal and Client/BD — as DesignFeedback
 * rows), no BPOM fields and no batch/expiry fields. Columns and tabs that had no backend
 * source are gone rather than invented; the BPOM tab says so plainly.
 *
 * Decisions are gated on the real state machine: client review only applies while the
 * task is WAITING_CLIENT, APJ review only while WAITING_APJ, and both require a version
 * id (BUS-RULE-110). Buttons outside that state are disabled with the reason shown, so
 * the backend's refusal is not provoked just to produce a toast.
 */

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  KpiCard,
  TableWrapper,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaBadge,
  DnaButton,
  DnaDrawer,
  DnaModal,
  DnaInput,
  DnaTextarea,
  DnaTabNav,
  DnaErrorState,
} from "@/components/dna";
import {
  ExternalLink,
  History,
  Search,
  Users,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Clock,
  BookOpen,
} from "lucide-react";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

const EMPTY = "—";

interface DesignVersionRow {
  id: string;
  versionNumber: number;
  artworkUrl?: string | null;
  mockupUrl?: string | null;
  createdAt?: string;
}

interface DesignTaskRow {
  id: string;
  brief: string;
  taskType?: string | null;
  kanbanState: string;
  revisionCount: number;
  isLocked: boolean;
  isFinal: boolean;
  slaDeadline?: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: string;
    clientName?: string | null;
    brandName?: string | null;
    productInterest?: string | null;
  } | null;
  versions: DesignVersionRow[];
}

const KANBAN_LABEL: Record<string, string> = {
  INBOX: "ANTREAN BARU",
  IN_PROGRESS: "DIKERJAKAN DESAINER",
  WAITING_APJ: "MENUNGGU REVIEW APJ",
  WAITING_CLIENT: "MENUNGGU ACC KLIEN",
  REVISION: "REVISI",
  LOCKED: "FINAL / TERKUNCI",
};

const KANBAN_VARIANT: Record<string, "info" | "warning" | "critical" | "success" | "neutral"> = {
  INBOX: "neutral",
  IN_PROGRESS: "info",
  WAITING_APJ: "warning",
  WAITING_CLIENT: "warning",
  REVISION: "critical",
  LOCKED: "success",
};

function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function latestVersionOf(task: DesignTaskRow): DesignVersionRow | undefined {
  if (!Array.isArray(task.versions) || task.versions.length === 0) return undefined;
  return [...task.versions].sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0))[0];
}

export default function ArtworkApprovalPage() {
  const qc = useQueryClient();
  const queryKey = ["creative-tasks-approval"];

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState<DesignTaskRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"detail" | "bpom" | "protocol">("detail");

  const [isApjModalOpen, setIsApjModalOpen] = useState(false);
  const [apjDecision, setApjDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [apjPin, setApjPin] = useState("");
  const [apjNotes, setApjNotes] = useState("");

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientDecision, setClientDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [clientNotes, setClientNotes] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery<DesignTaskRow[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/creative/tasks", { params: { limit: 100 } });
      const body = unwrapResponse<any>(resp);
      if (Array.isArray(body)) return body;
      return Array.isArray(body?.data) ? body.data : [];
    },
  });

  const selectedId = selectedTask?.id;
  const {
    data: history,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useQuery<any>({
    queryKey: ["creative-task-history", selectedId],
    enabled: Boolean(selectedId && isDrawerOpen),
    queryFn: async () => {
      const resp = await api.get(`/creative/tasks/${selectedId}/history`);
      return unwrapResponse<any>(resp);
    },
  });

  const clientReview = useMutation({
    mutationFn: (p: { id: string; status: "APPROVED" | "REJECTED"; versionId: string; notes: string }) =>
      api
        .patch(`/creative/task/${p.id}/client-review`, {
          status: p.status,
          versionId: p.versionId,
          notes: p.notes,
          reason: p.status === "REJECTED" ? p.notes : undefined,
        })
        .then((r) => unwrapResponse(r)),
    onSuccess: (_res, p) => {
      toast.success(
        p.status === "APPROVED" ? "Artwork disetujui klien (final)." : "Artwork dikembalikan untuk revisi.",
      );
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["creative-task-history", p.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyimpan keputusan klien."),
  });

  const apjReview = useMutation({
    mutationFn: (p: { id: string; status: "APPROVED" | "REJECTED"; versionId: string; notes: string; pin: string }) =>
      api
        .patch(`/creative/task/${p.id}/apj-review`, {
          status: p.status,
          versionId: p.versionId,
          notes: p.notes,
          pin: p.pin,
        })
        .then((r) => unwrapResponse(r)),
    onSuccess: (_res, p) => {
      toast.success(p.status === "APPROVED" ? "Review APJ/Legal disetujui." : "Review APJ/Legal menolak artwork.");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["creative-task-history", p.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyimpan review APJ."),
  });

  const tasks = useMemo<DesignTaskRow[]>(() => (Array.isArray(data) ? data : []), [data]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          (t.brief || "").toLowerCase().includes(q) ||
          (t.lead?.clientName || "").toLowerCase().includes(q) ||
          (t.lead?.brandName || "").toLowerCase().includes(q);
        const matchState = stateFilter === "ALL" || t.kanbanState === stateFilter;
        return matchSearch && matchState;
      }),
    [tasks, searchQuery, stateFilter],
  );

  const counts = useMemo(
    () => ({
      total: tasks.length,
      waitingApj: tasks.filter((t) => t.kanbanState === "WAITING_APJ").length,
      waitingClient: tasks.filter((t) => t.kanbanState === "WAITING_CLIENT").length,
      final: tasks.filter((t) => t.kanbanState === "LOCKED" || t.isFinal).length,
    }),
    [tasks],
  );

  const openDrawer = (task: DesignTaskRow) => {
    setSelectedTask(task);
    setDrawerTab("detail");
    setIsDrawerOpen(true);
  };

  const startClientDecision = (task: DesignTaskRow, status: "APPROVED" | "REJECTED") => {
    setClientDecision(status);
    setClientNotes("");
    setIsClientModalOpen(true);
  };

  const startApjDecision = (task: DesignTaskRow, status: "APPROVED" | "REJECTED") => {
    setApjDecision(status);
    setApjPin("");
    setApjNotes("");
    setIsApjModalOpen(true);
  };

  const submitClientDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    const ver = latestVersionOf(selectedTask);
    if (!ver) {
      toast.error("Belum ada versi desain yang diunggah, keputusan tidak dapat dicatat.");
      return;
    }
    if (clientDecision === "REJECTED" && !clientNotes.trim()) {
      toast.error("Catatan revisi wajib diisi untuk penolakan.");
      return;
    }
    clientReview.mutate(
      { id: selectedTask.id, status: clientDecision, versionId: ver.id, notes: clientNotes },
      { onSuccess: () => setIsClientModalOpen(false) },
    );
  };

  const submitApjDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    const ver = latestVersionOf(selectedTask);
    if (!ver) {
      toast.error("Belum ada versi desain yang diunggah, keputusan tidak dapat dicatat.");
      return;
    }
    if (!apjPin.trim()) {
      toast.error("PIN approval wajib diisi (e-signature).");
      return;
    }
    apjReview.mutate(
      { id: selectedTask.id, status: apjDecision, versionId: ver.id, notes: apjNotes, pin: apjPin },
      { onSuccess: () => setIsApjModalOpen(false) },
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Memuat daftar task desain...</div>;
  }

  if (isError) {
    const errStatus = (error as { response?: { status?: number } })?.response?.status;
    const denied = errStatus === 401 || errStatus === 403;
    return (
      <div className="p-8">
        <DnaErrorState
          title={denied ? "Akses ditolak" : "Gagal memuat data"}
          message={
            denied
              ? "Akun ini tidak berwenang membaca daftar task desain (hanya SUPER_ADMIN dan DIRECTOR)."
              : "Daftar task desain tidak dapat diambil dari server."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const selectedVersion = selectedTask ? latestVersionOf(selectedTask) : undefined;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Artwork Approval & Design History"
        badge={<DnaBadge variant="purple">DESIGN WORKSPACE</DnaBadge>}
        subtitle="Kelola versi desain kemasan dan keputusan dua tahap yang tercatat pada sistem: review APJ/Legal, lalu ACC klien via BD."
      />

      <DnaKpiGrid>
        <KpiCard label="Total Task Desain" value={counts.total} subtext="Seluruh task aktif di creative" variant="slate" />
        <KpiCard label="Menunggu Review APJ" value={counts.waitingApj} subtext="Antrean validasi Legal/APJ" variant="amber" />
        <KpiCard label="Menunggu ACC Klien" value={counts.waitingClient} subtext="Sudah lolos APJ, menunggu klien" variant="slate" />
        <KpiCard label="Final / Terkunci" value={counts.final} subtext="Artwork sudah di-ACC dan dikunci" variant="emerald" />
      </DnaKpiGrid>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <DnaTabNav
          tabs={[
            { id: "ALL", label: "Semua", badge: tasks.length },
            { id: "INBOX", label: "Antrean Baru" },
            { id: "IN_PROGRESS", label: "Dikerjakan" },
            { id: "WAITING_APJ", label: "Menunggu APJ", badge: counts.waitingApj },
            { id: "WAITING_CLIENT", label: "Menunggu Klien", badge: counts.waitingClient },
            { id: "REVISION", label: "Revisi" },
            { id: "LOCKED", label: "Final" },
          ]}
          activeTab={stateFilter}
          onChange={(tabId) => setStateFilter(tabId)}
        />

        <div className="w-72">
          <DnaInput
            placeholder="Cari brief, klien, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      <TableWrapper>
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh>KLIEN &amp; BRIEF</DnaTh>
              <DnaTh>TIPE / SLA</DnaTh>
              <DnaTh align="center">VERSI TERBARU</DnaTh>
              <DnaTh align="center">REVISI</DnaTh>
              <DnaTh align="center">STATE BACKEND</DnaTh>
              <DnaTh>DIPERBARUI</DnaTh>
              <DnaTh align="right">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredTasks.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                  {tasks.length === 0
                    ? "Belum ada task desain pada sistem."
                    : "Tidak ada task desain yang sesuai pencarian."}
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredTasks.map((task) => {
                const ver = latestVersionOf(task);
                return (
                  <DnaTableRow key={task.id}>
                    <DnaTd>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {task.lead?.clientName ?? "Klien belum tertaut"}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs">
                          {task.brief}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Brand: {task.lead?.brandName ?? EMPTY}
                        </span>
                      </div>
                    </DnaTd>

                    <DnaTd>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {task.taskType ?? "Tidak dispesifikasikan"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          SLA: {formatDate(task.slaDeadline)}
                        </span>
                      </div>
                    </DnaTd>

                    <DnaTd align="center">
                      {ver ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="px-2.5 py-1 text-[11px] font-black bg-purple-100 text-purple-800 rounded-lg border border-purple-200">
                            v{ver.versionNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">{formatDate(ver.createdAt)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Belum ada file</span>
                      )}
                    </DnaTd>

                    <DnaTd align="center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 tabular-nums">
                          {task.revisionCount}
                        </span>
                        {task.isLocked && (
                          <span className="text-[9px] font-bold text-rose-600">BATAS TERCAPAI</span>
                        )}
                      </div>
                    </DnaTd>

                    <DnaTd align="center">
                      <DnaBadge variant={KANBAN_VARIANT[task.kanbanState] ?? "neutral"}>
                        {KANBAN_LABEL[task.kanbanState] ?? task.kanbanState}
                      </DnaBadge>
                    </DnaTd>

                    <DnaTd>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(task.updatedAt)}
                      </span>
                    </DnaTd>

                    <DnaTd align="right">
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        icon={<History className="w-3.5 h-3.5" />}
                        onClick={() => openDrawer(task)}
                      >
                        Riwayat &amp; Approval
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </TableWrapper>

      <DnaDrawer
        isOpen={isDrawerOpen && !!selectedTask}
        onClose={() => setIsDrawerOpen(false)}
        title={`Riwayat Desain — ${selectedTask?.lead?.clientName ?? "Klien belum tertaut"}`}
        badge={selectedTask ? KANBAN_LABEL[selectedTask.kanbanState] ?? selectedTask.kanbanState : undefined}
        className="max-w-2xl"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Brief Desain
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedTask.brief}
                  </span>
                </div>
                <DnaBadge variant={KANBAN_VARIANT[selectedTask.kanbanState] ?? "neutral"}>
                  {KANBAN_LABEL[selectedTask.kanbanState] ?? selectedTask.kanbanState}
                </DnaBadge>
              </div>
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                <span>Klien: <strong>{selectedTask.lead?.clientName ?? EMPTY}</strong></span>
                <span>Brand: <strong>{selectedTask.lead?.brandName ?? EMPTY}</strong></span>
                <span>Produk diminati: <strong>{selectedTask.lead?.productInterest ?? EMPTY}</strong></span>
                <span>Revisi: <strong className="tabular-nums">{selectedTask.revisionCount}</strong></span>
                <span>SLA: <strong>{formatDate(selectedTask.slaDeadline)}</strong></span>
              </div>
            </div>

            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
              {[
                { id: "detail", label: "Detail & Versi", icon: <History className="w-3.5 h-3.5" /> },
                { id: "bpom", label: "Dokumen BPOM", icon: <BookOpen className="w-3.5 h-3.5" /> },
                { id: "protocol", label: "Protokol Komunikasi", icon: <MessageSquare className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                // dna-allow-legacy: underline tab strip inside the drawer, preserved from the original layout
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id as typeof drawerTab)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                    drawerTab === tab.id
                      ? "border-purple-600 text-purple-700 dark:text-purple-300"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {drawerTab === "detail" && (
              <div className="space-y-4">
                {selectedVersion ? (
                  <div className="border rounded-2xl p-4 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 bg-purple-700 text-white text-xs font-black rounded-xl">
                          v{selectedVersion.versionNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Diunggah: {formatDate(selectedVersion.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedVersion.artworkUrl ? (
                          <a
                            href={selectedVersion.artworkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Artwork ↗
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">Artwork belum diunggah</span>
                        )}
                        {selectedVersion.mockupUrl && (
                          <a
                            href={selectedVersion.mockupUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Mockup ↗
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500">
                      Endpoint creative/tasks hanya mengembalikan versi terbaru per task. Riwayat lengkap versi
                      belum tersedia dari endpoint ini.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 dark:bg-slate-900 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-slate-700 uppercase flex items-center gap-1.5 dark:text-slate-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Review APJ / Legal
                          </span>
                        </div>
                        {selectedTask.kanbanState === "WAITING_APJ" ? (
                          <div className="flex items-center gap-2 pt-1">
                            <DnaButton
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                              onClick={() => startApjDecision(selectedTask, "APPROVED")}
                            >
                              ✓ ACC APJ
                            </DnaButton>
                            <DnaButton
                              variant="danger"
                              size="sm"
                              className="flex-1"
                              onClick={() => startApjDecision(selectedTask, "REJECTED")}
                            >
                              ✕ Tolak
                            </DnaButton>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Keputusan APJ hanya dapat dicatat saat task berstatus MENUNGGU REVIEW APJ.
                          </p>
                        )}
                      </div>

                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 dark:bg-slate-900 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-slate-700 uppercase flex items-center gap-1.5 dark:text-slate-300">
                            <Users className="w-3.5 h-3.5 text-blue-500" /> ACC Klien (via BD)
                          </span>
                        </div>
                        {selectedTask.kanbanState === "WAITING_CLIENT" ? (
                          <div className="flex items-center gap-2 pt-1">
                            <DnaButton
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                              onClick={() => startClientDecision(selectedTask, "APPROVED")}
                            >
                              ✓ ACC Klien
                            </DnaButton>
                            <DnaButton
                              variant="danger"
                              size="sm"
                              className="flex-1"
                              onClick={() => startClientDecision(selectedTask, "REJECTED")}
                            >
                              ✕ Revisi
                            </DnaButton>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            ACC klien hanya dapat dicatat saat task berstatus MENUNGGU ACC KLIEN.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-xs text-amber-700">
                      Task ini belum memiliki versi desain, sehingga keputusan belum dapat dicatat.
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase dark:text-slate-100">
                      Jejak Keputusan (DesignFeedback)
                    </h4>
                  </div>
                  {isHistoryLoading ? (
                    <p className="text-xs text-slate-400">Memuat riwayat...</p>
                  ) : isHistoryError ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-rose-600">Riwayat gagal dimuat.</p>
                      <DnaButton variant="ghost" size="sm" onClick={() => refetchHistory()}>
                        Coba lagi
                      </DnaButton>
                    </div>
                  ) : Array.isArray(history?.history) && history.history.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500">
                        Sisa jatah revisi: <strong>{history?.allowanceLeft ?? 0}</strong> dari batas{" "}
                        <strong>{history?.revisionBound ?? EMPTY}</strong>.
                      </p>
                      {history.history.map((h: any) => (
                        <div key={h.id} className="flex items-start gap-2 text-[11px]">
                          <span
                            className={
                              "w-2 h-2 mt-1 rounded-full flex-shrink-0 " +
                              (h.approvalStatus === "APPROVED"
                                ? "bg-emerald-500"
                                : h.approvalStatus === "REJECTED"
                                ? "bg-rose-500"
                                : "bg-slate-400")
                            }
                          />
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {h.fromDivision ?? EMPTY}
                            </span>
                            <span className="text-slate-400 ml-1">
                              · {h.author?.fullName ?? "Pengguna tidak tercatat"}
                            </span>
                            <span className="text-slate-400 ml-1">
                              · v{h.version?.versionNumber ?? EMPTY}
                            </span>
                            <span className="text-slate-400 ml-1">· {formatDate(h.createdAt)}</span>
                            {h.approvalStatus && (
                              <span className="text-slate-500 ml-1">— {h.approvalStatus}</span>
                            )}
                            {h.content && (
                              <span className="text-slate-500 block">Catatan: {h.content}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Belum ada keputusan yang tercatat untuk task ini.
                    </p>
                  )}
                </div>
              </div>
            )}

            {drawerTab === "bpom" && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-700 font-semibold">
                    Data izin edar BPOM belum tersedia dari endpoint creative.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    DesignTask tidak menyimpan nomor registrasi BPOM, status pengajuan, maupun nomor aplikasi.
                    Data tersebut berada pada modul Legalitas dan belum diekspos ke layar ini.
                  </p>
                </div>
              </div>
            )}

            {drawerTab === "protocol" && (
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-black text-purple-900 uppercase">
                      Protokol Komunikasi Tim Design
                    </h4>
                  </div>
                  <div className="space-y-2 text-xs text-purple-800">
                    <div className="space-y-1">
                      <p className="font-bold text-purple-900">1. Cara Mengajukan Input Design</p>
                      <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                        <li>Brief design diajukan via ticket di Creative Board.</li>
                        <li>
                          Sertakan: nama produk, brand guidelines, referensi desain (moodboard), dan target
                          tanggal publish.
                        </li>
                        <li>Jika ada regulasi BPOM, lampirkan nomor notifikasi atau klaim yang sudah disetujui.</li>
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-purple-900">2. Alur Persetujuan Sistem</p>
                      <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                        <li>Desain draft → review APJ/Legal (validasi klaim &amp; regulatory).</li>
                        <li>Setelah ACC APJ → review klien via BD (konfirmasi branding &amp; final artwork).</li>
                        <li>
                          Setelah ACC klien, task terkunci sebagai final (LOCKED) dan menjadi acuan cetak.
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-purple-900">3. Aturan Revisi</p>
                      <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                        <li>Jumlah revisi dibatasi oleh sistem; sisa jatah tampil di tab Detail &amp; Versi.</li>
                        <li>
                          Bila batas revisi tercapai, task terkunci dan hanya supervisor yang dapat membukanya
                          kembali.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-2 dark:bg-slate-900 dark:border-slate-800">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Protokol ini berlaku untuk seluruh task desain kemasan di Creative Board.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DnaDrawer>

      <DnaModal
        isOpen={isApjModalOpen && !!selectedTask}
        onClose={() => setIsApjModalOpen(false)}
        title={apjDecision === "APPROVED" ? "ACC Review APJ / Legal" : "Tolak Review APJ / Legal"}
        maxWidth="max-w-md"
      >
        <form onSubmit={submitApjDecision} className="space-y-3.5 text-xs">
          <p className="text-muted-foreground">
            Task: <span className="font-bold text-foreground">{selectedTask?.brief}</span>
          </p>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">PIN Approval (E-Signature):</label>
            <DnaInput
              type="password"
              value={apjPin}
              onChange={(e) => setApjPin(e.target.value)}
              placeholder="Masukkan PIN approval Anda"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Catatan Review:</label>
            <DnaTextarea
              rows={3}
              value={apjNotes}
              onChange={(e) => setApjNotes(e.target.value)}
              placeholder="Catatan validasi klaim / regulasi..."
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
            <DnaButton variant="secondary" onClick={() => setIsApjModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant={apjDecision === "APPROVED" ? "primary" : "danger"}
              type="submit"
              disabled={apjReview.isPending}
            >
              {apjReview.isPending ? "Menyimpan..." : "Simpan Keputusan"}
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      <DnaModal
        isOpen={isClientModalOpen && !!selectedTask}
        onClose={() => setIsClientModalOpen(false)}
        title={clientDecision === "APPROVED" ? "ACC Klien (Final Artwork)" : "Kembalikan untuk Revisi"}
        maxWidth="max-w-md"
      >
        <form onSubmit={submitClientDecision} className="space-y-3.5 text-xs">
          <p className="text-muted-foreground">
            Task: <span className="font-bold text-foreground">{selectedTask?.brief}</span>
          </p>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Catatan {clientDecision === "REJECTED" ? "(wajib)" : "(opsional)"}:
            </label>
            <DnaTextarea
              rows={3}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Catatan persetujuan atau alasan revisi..."
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
            <DnaButton variant="secondary" onClick={() => setIsClientModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant={clientDecision === "APPROVED" ? "primary" : "danger"}
              type="submit"
              disabled={clientReview.isPending}
            >
              {clientReview.isPending ? "Menyimpan..." : "Simpan Keputusan"}
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </DnaPageContainer>
  );
}