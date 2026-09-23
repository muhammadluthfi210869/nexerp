"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Inbox,
  ShieldAlert,
  CheckCircle2,
  Search,
  MessageSquare,
  Beaker,
  ImageIcon,
  CreditCard,
  ChevronRight,
  AlertTriangle,
  Download,
  PlusCircle,
  RefreshCcw,
  Sparkles,
  Eye,
  FileSpreadsheet,
  XCircle,
  Layers,
  FileCheck,
} from "lucide-react";
import Image from "next/image";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaTable,
  DnaBadge,
  DnaButton,
  DnaDetailDrawer,
  DnaInput,
  DnaTextarea,
  useDnaToast,
} from "@/components/dna";

const DISPLAYABLE_RENDITION = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

const isDisplayable = (url?: string | null) =>
  !!url && DISPLAYABLE_RENDITION.test(url.split("?")[0]);

export default function ComplianceInboxPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useDnaToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: tasks = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["compliance-tasks"],
    queryFn: async () => {
      const resp = await api.get("/legality/inbox/tasks");
      return resp.data || [];
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: ({ pipelineId, isApproved, notes }: { pipelineId: string; isApproved: boolean; notes: string }) =>
      api.post(`/legality/pipeline/${pipelineId}/artwork-review`, { isApproved, notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["compliance-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["legality-dashboard"] });
      success(variables.isApproved ? "Review kepatuhan disetujui resmi." : "Catatan revisi berhasil dikirim.");
      setIsDetailDrawerOpen(false);
      setReviewNotes("");
      setSelectedTask(null);
    },
    onError: (err: any) => {
      toastError(err?.response?.data?.error?.message || err?.response?.data?.message || "Gagal memproses review");
    },
  });

  const totalTasks = tasks.length;
  const highPriorityTasks = tasks.filter((t: any) => t.priority === "HIGH").length;
  const artworkTasks = tasks.filter((t: any) => t.type === "ARTWORK_REVIEW").length;
  const formulaTasks = tasks.filter((t: any) => t.type === "FORMULA_VALIDATION").length;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      if (activeTab !== "all" && t.type !== activeTab) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchId = t.pipelineId?.toLowerCase().includes(q);
        const matchType = t.type?.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchType) return false;
      }
      return true;
    });
  }, [tasks, activeTab, searchTerm]);

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. PAGE HEADER DENGAN TABS TERPADU (Golden Rule 2) ── */}
      <DnaPageHeader
        backLink={{ href: "/legality/dashboard", label: "Kembali ke Dashboard Legal" }}
        title="COMPLIANCE INBOX & ARTWORK REVIEW"
        badge={<DnaBadge variant="info">REGULATORY INBOX</DnaBadge>}
        subtitle="Pusat kurasi berkas kepatuhan, review etiket & klaim kemasan BPOM, serta otorisasi formula"
        tabs={[
          {
            key: "all",
            label: "Semua Tugas",
            count: totalTasks,
            icon: <Inbox className="w-3.5 h-3.5" />,
          },
          {
            key: "ARTWORK_REVIEW",
            label: "Review Artwork & Etiket",
            count: artworkTasks,
            icon: <ImageIcon className="w-3.5 h-3.5" />,
          },
          {
            key: "FORMULA_VALIDATION",
            label: "Validasi Formula BPOM",
            count: formulaTasks,
            icon: <Beaker className="w-3.5 h-3.5" />,
          },
          {
            key: "PNBP_FILING",
            label: "Billing & PNBP",
            count: tasks.filter((t: any) => t.type === "PNBP_FILING").length,
            icon: <CreditCard className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            variant="outline"
            icon={<RefreshCcw className="w-3.5 h-3.5" />}
            onClick={() => refetch()}
          >
            Sinkronisasi Antrean
          </DnaButton>
        }
      />

      {/* ── 02. MODULAR 4 KPI METRIC CARDS ── */}
      <DnaKpiGrid
        cards={[
          {
            key: "TOTAL",
            title: "TOTAL ANTREAN TUGAS",
            value: totalTasks.toLocaleString("id-ID"),
            deltaText: "Menunggu kurasi & verifikasi",
            isDeltaPositive: true,
            icon: <Inbox className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            isSelected: false,
          },
          {
            key: "HIGH",
            title: "PRIORITAS TINGGI (URGENT)",
            value: `${highPriorityTasks} Tugas`,
            deltaText: "Perlu tindakan segera (< 24 jam)",
            isDeltaPositive: false,
            icon: <ShieldAlert className="w-4 h-4" />,
            iconBg: "bg-rose-50",
            iconColor: "text-rose-600",
            isSelected: false,
          },
          {
            key: "ARTWORK",
            title: "REVIEW ARTWORK KEMASAN",
            value: `${artworkTasks} Desain`,
            deltaText: "Pemeriksaan tata letak etiket BPOM",
            isDeltaPositive: true,
            icon: <ImageIcon className="w-4 h-4" />,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            isSelected: activeTab === "ARTWORK_REVIEW",
            onClick: () => setActiveTab(activeTab === "ARTWORK_REVIEW" ? "all" : "ARTWORK_REVIEW"),
          },
          {
            key: "FORMULA",
            title: "VALIDASI FORMULA BPOM",
            value: `${formulaTasks} Formula`,
            deltaText: "Cek kepatuhan batas konsentrasi",
            isDeltaPositive: true,
            icon: <Beaker className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            isSelected: activeTab === "FORMULA_VALIDATION",
            onClick: () => setActiveTab(activeTab === "FORMULA_VALIDATION" ? "all" : "FORMULA_VALIDATION"),
          },
        ]}
      />

      {/* ── 03. MODULAR DATA TABLE CARD (Golden Rule 1 & 4) ── */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery: searchTerm,
          onSearchChange: setSearchTerm,
          searchPlaceholder: "Cari judul tugas, kode proyek, atau tipe kepatuhan...",
        }}
      >
        <DnaTable className="table-fixed w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
              <th className="p-3 w-10 text-slate-400">#</th>
              <th className="p-3 w-[30%]">JUDUL TUGAS & ID PIPELINE</th>
              <th className="p-3 w-[22%]">TIPE KEPATUHAN & PRIORITAS</th>
              <th className="p-3 w-[20%]">WAKTU PENGAJUAN</th>
              <th className="p-3 w-[16%] text-center">STATUS</th>
              <th className="p-3 text-center w-[12%] whitespace-nowrap">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Memuat antrean tugas kepatuhan...</span>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-rose-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span>Gagal memuat inbox kepatuhan: {(error as any)?.message || "Terjadi kesalahan"}</span>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-md border border-rose-200 transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                  Antrean bersih! Tidak ada tugas kepatuhan yang pending saat ini.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task: any, idx: number) => (
                <tr
                  key={task.id || idx}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedTask(task);
                    setReviewNotes("");
                    setIsDetailDrawerOpen(true);
                  }}
                >
                  <td className="p-3 text-slate-400 font-mono text-[11px] tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 truncate uppercase">{task.title}</div>
                    <div className="font-mono text-[11px] text-blue-600 font-semibold truncate">
                      ID: {task.pipelineId ? task.pipelineId.substring(0, 12) : task.id}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <DnaBadge
                        variant={
                          task.priority === "HIGH"
                            ? "critical"
                            : task.priority === "MEDIUM"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {task.priority || "NORMAL"}
                      </DnaBadge>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {task.type?.replace("_", " ")}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-slate-800 text-xs">
                      {task.createdAt ? new Date(task.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {task.createdAt ? new Date(task.createdAt).toLocaleTimeString("id-ID") : ""}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <DnaBadge variant="warning">Menunggu Review</DnaBadge>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                      onClick={() => {
                        setSelectedTask(task);
                        setReviewNotes("");
                        setIsDetailDrawerOpen(true);
                      }}
                      title="Review Tugas"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </DnaButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>

      {/* ── 04. DETAIL DRAWER QUICK PEEK (Golden Rule 5) ── */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedTask?.title || "Review Kepatuhan"}
        subtitle={`Tipe: ${selectedTask?.type?.replace("_", " ") || "-"} • Pipeline: ${selectedTask?.pipelineId?.substring(0, 10) || "-"}`}
        badge={
          selectedTask?.priority === "HIGH" ? (
            <DnaBadge variant="critical">PRIORITAS TINGGI</DnaBadge>
          ) : (
            <DnaBadge variant="info">ANTREAN REVIEW</DnaBadge>
          )
        }
        tabs={[
          {
            id: "specs",
            label: "Rincian Berkas & Etiket",
            content: selectedTask ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Judul Tugas</span>
                    <span className="font-bold text-slate-900 text-sm uppercase">{selectedTask.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tipe Kepatuhan</span>
                    <span className="font-mono font-bold text-blue-600 text-sm">{selectedTask.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Prioritas Antrean</span>
                    <span className="font-semibold text-slate-800">{selectedTask.priority || "NORMAL"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">ID Pipeline Proyek</span>
                    <span className="font-mono text-slate-600">{selectedTask.pipelineId}</span>
                  </div>
                </div>

                {/* Preview Artwork jika ada */}
                {(selectedTask.artworkUrl || selectedTask.artworkPreviewUrl) && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                      Preview Artwork / Etiket Kemasan:
                    </span>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[200px]">
                      {isDisplayable(selectedTask.artworkUrl || selectedTask.artworkPreviewUrl) ? (
                        <div className="relative w-full h-48">
                          <Image
                            src={selectedTask.artworkUrl || selectedTask.artworkPreviewUrl}
                            alt="Artwork Preview"
                            fill
                            className="object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <FileCheck className="w-10 h-10 text-slate-400 mx-auto" />
                          <p className="font-bold text-slate-700">Berkas Master Grafis Terlampir</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {selectedTask.artworkUrl?.split("/").pop() || "master-artwork.pdf"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Input Catatan Evaluasi */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Catatan Kepatuhan / Evaluasi Regulasi:
                  </label>
                  <DnaTextarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Masukkan alasan persetujuan atau poin revisi etiket (klaim, komposisi, font size)..."
                    rows={3}
                  />
                </div>
              </div>
            ) : null,
          },
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
              disabled={submitReviewMutation.isPending}
              onClick={() => {
                if (!reviewNotes.trim()) {
                  toastError("Harap cantumkan alasan revisi pada catatan!");
                  return;
                }
                submitReviewMutation.mutate({
                  pipelineId: selectedTask.pipelineId,
                  isApproved: false,
                  notes: reviewNotes,
                });
              }}
            >
              Minta Revisi
            </DnaButton>
            <div className="flex items-center gap-2">
              <DnaButton
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                disabled={submitReviewMutation.isPending}
                onClick={() => {
                  submitReviewMutation.mutate({
                    pipelineId: selectedTask.pipelineId,
                    isApproved: true,
                    notes: reviewNotes || "Kepatuhan etiket dan formula disetujui resmi",
                  });
                }}
              >
                Setujui (Approve)
              </DnaButton>
            </div>
          </div>
        }
      />
    </div>
  );
}
