"use client";

// TaskDetailModal: opens when user clicks a task in TaskWorkspace.
// Shows full task detail + comments thread + attachments + audit history + edit & delete actions.

import { useEffect, useState } from "react";
import { MessageSquare, Paperclip, Send, Trash2, History, ExternalLink, Edit3 } from "lucide-react";
import { DnaButton, DnaDrawer, DnaTextarea } from "@/components/dna";
import { useDnaToast } from "@/components/dna/DnaToast";
import { DnaPriorityBadge, DnaDaysLeftChip, DnaAvatar, DnaAttachmentList } from "@/components/dna/DnaExtras";
import { marketingService } from "@/lib/services/marketing-service";
import type { MarketingTask, MarketingViewer, TaskComment, TaskAttachment, TaskStatus } from "@/types/marketing-api";

interface TaskDetailModalProps {
  isOpen: boolean;
  taskId: string | null;
  viewer: MarketingViewer;
  onClose: () => void;
  onUpdated?: () => void;
  onEditTask?: (task: MarketingTask) => void;
  onDeleteTask?: (taskId: string) => void;
}

const NEXT_STATUSES: Partial<Record<TaskStatus, TaskStatus[]>> = {
  NOT_STARTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: ["DONE"],
};

export default function TaskDetailModal({
  isOpen,
  taskId,
  viewer,
  onClose,
  onUpdated,
  onEditTask,
  onDeleteTask,
}: TaskDetailModalProps) {
  const toast = useDnaToast();
  const [task, setTask] = useState<MarketingTask | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && taskId) void loadAll(taskId);
  }, [isOpen, taskId, viewer]);

  async function loadAll(id: string) {
    setLoadError(null);
    try {
      const [t, c, a] = await Promise.all([
        marketingService.getTask(viewer, id),
        marketingService.listTaskComments(viewer, id),
        marketingService.listTaskAttachments(viewer, id),
      ]);
      setTask(t);
      setComments(c);
      setAttachments(a);
    } catch (error) {
      setTask(null);
      setComments([]);
      setAttachments([]);
      setLoadError(error instanceof Error ? error.message : "Detail task tidak dapat dimuat.");
    }
  }

  async function handleAddComment() {
    if (!taskId || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await marketingService.createTaskComment(viewer, taskId, { body: newComment });
      setNewComment("");
      const c = await marketingService.listTaskComments(viewer, taskId);
      setComments(c);
      toast.success("Komentar terkirim.");
      onUpdated?.();
    } catch (e: any) {
      toast.error("Gagal kirim: " + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(id: string) {
    try {
      await marketingService.deleteTaskComment(viewer, id);
      if (taskId) {
        const c = await marketingService.listTaskComments(viewer, taskId);
        setComments(c);
      }
      toast.success("Komentar dihapus.");
    } catch (e: any) {
      toast.error("Gagal hapus: " + e.message);
    }
  }

  async function handleUpload(file: File) {
    if (!taskId) return;
    setUploading(true);
    try {
      await marketingService.addTaskAttachment(viewer, taskId, file);
      const a = await marketingService.listTaskAttachments(viewer, taskId);
      setAttachments(a);
      toast.success("Lampiran terupload.");
      onUpdated?.();
    } catch (e: any) {
      toast.error("Upload gagal: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAttachment(id: string) {
    try {
      await marketingService.deleteTaskAttachment(viewer, id);
      if (taskId) {
        const a = await marketingService.listTaskAttachments(viewer, taskId);
        setAttachments(a);
      }
      toast.success("Lampiran dihapus.");
      onUpdated?.();
    } catch (e: any) {
      toast.error("Gagal hapus: " + e.message);
    }
  }

  async function handleToggleChecklist(itemId: string, done: boolean) {
    if (!task) return;
    try {
      const updated = await marketingService.updateChecklist(viewer, task.id, itemId, {
        version: task.version,
        done,
      });
      setTask(updated);
      onUpdated?.();
    } catch (e: any) {
      toast.error("Gagal update checklist: " + e.message);
    }
  }

  async function handleStatusChange(newStatus: TaskStatus) {
    if (!task) return;
    try {
      await marketingService.updateTaskStatus(viewer, task.id, {
        version: task.version,
        status: newStatus,
      });
      const updated = await marketingService.getTask(viewer, task.id);
      setTask(updated);
      toast.success(`Status diubah menjadi ${newStatus.replace("_", " ")}.`);
      onUpdated?.();
    } catch (e: any) {
      toast.error("Gagal update status: " + e.message);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus task "${task.title}"?`)) {
      try {
        await marketingService.deleteTask(viewer, task.id);
        toast.success("Task berhasil dihapus.");
        onDeleteTask?.(task.id);
        onUpdated?.();
        onClose();
      } catch (e: any) {
        toast.error("Gagal menghapus task: " + e.message);
      }
    }
  }

  return (
    <DnaDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={task?.title ?? "Task Detail"}
      subtitle={task ? `${task.taskCode} · ${task.type} · ${task.channel}` : ""}
      size="lg"
    >
      {!task && !loadError && <div className="text-sm text-slate-500" aria-busy="true">Memuat task…</div>}
      {loadError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p>{loadError}</p>{taskId && <DnaButton className="mt-3" variant="outline" onClick={() => void loadAll(taskId)}>Coba lagi</DnaButton>}</div>}
      {task && (
        <div className="space-y-5">
          {/* Meta strip */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="h-8 px-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
            >
              {[task.status, ...(NEXT_STATUSES[task.status] ?? [])].map((s) => (
                <option key={s} value={s}>
                  {s === "IN_REVIEW" ? "IN REVIEW" : s.replace("_", " ")}
                </option>
              ))}
            </select>
            <DnaPriorityBadge priority={task.priority} />
            <DnaDaysLeftChip dueDate={task.dueDate} />
            {task.assignee && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                <DnaAvatar name={task.assignee.name} size="sm" />
                <span className="font-semibold">{task.assignee.name}</span>
              </div>
            )}
            {task.brand && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-150">
                {task.brand.name}
              </span>
            )}
          </div>

          {/* External Links / Deliverable URL */}
          {(task.outputUrl || task.referenceUrl) && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2">
              <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                Link Terkait & Deliverable
              </div>
              <div className="space-y-1.5 text-xs">
                {task.outputUrl && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 shrink-0">Deliverable:</span>
                    <a
                      href={task.outputUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{task.outputUrl}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}
                {task.referenceUrl && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 shrink-0">Referensi:</span>
                    <a
                      href={task.referenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{task.referenceUrl}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brief */}
          {task.brief && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Brief Pengerjaan
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {task.brief}
              </p>
            </div>
          )}

          {/* Checklist */}
          {task.checklist && task.checklist.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Checklist ({task.checklistDone}/{task.checklistTotal})
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {task.checklistTotal > 0 ? Math.round((task.checklistDone / task.checklistTotal) * 100) : 0}%
                </span>
              </div>
              <div className="space-y-2">
                {task.checklist.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className={item.done ? "line-through text-slate-400" : "font-medium"}>{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Diskusi & Komentar ({comments.length})
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.length === 0 && (
                <div className="text-xs text-slate-400 italic py-2">Belum ada komentar.</div>
              )}
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl bg-slate-50 p-2.5 text-xs group">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-semibold text-slate-700">{c.authorId ?? "Team Member"}</span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(c.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <DnaTextarea
                placeholder="Tulis komentar atau update progres…"
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="text-xs"
              />
              <DnaButton
                variant="primary"
                size="sm"
                icon={<Send className="h-3.5 w-3.5" />}
                onClick={handleAddComment}
                disabled={submitting || !newComment.trim()}
              >
                Kirim
              </DnaButton>
            </div>
          </div>

          {/* Attachments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Paperclip className="h-4 w-4 text-blue-600" />
                Lampiran ({attachments.length})
              </div>
              <label className="cursor-pointer">
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition inline-block">
                  {uploading ? "Uploading…" : "+ Upload"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            </div>
            <DnaAttachmentList
              attachments={attachments.map((a) => ({
                id: a.id,
                name: a.name,
                sizeKb: a.sizeKb,
                uploadedBy: a.uploadedById ?? undefined,
                uploadedAt: a.createdAt,
                url: a.path,
              }))}
              onDelete={handleDeleteAttachment}
            />
          </div>

          {/* Audit timeline */}
          {task.history && task.history.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                <History className="h-4 w-4 text-slate-400" />
                Audit History ({task.history.length})
              </div>
              <div className="space-y-2 border-l-2 border-slate-100 pl-4">
                {task.history.map((h) => (
                  <div key={h.id} className="text-xs">
                    <span className="font-medium text-slate-700">
                      {h.fromStatus ?? "—"} → {h.toStatus}
                    </span>
                    {h.note && <span className="text-slate-500"> · {h.note}</span>}
                    <span className="text-slate-400 ml-2">{new Date(h.createdAt).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Footer Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-white sticky bottom-0 py-3">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Task</span>
            </button>
            <div className="flex items-center gap-2">
              <DnaButton variant="outline" size="sm" onClick={onClose}>
                Tutup
              </DnaButton>
              <DnaButton
                variant="primary"
                size="sm"
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => {
                  if (task) {
                    onEditTask?.(task);
                    onClose();
                  }
                }}
              >
                Edit Task
              </DnaButton>
            </div>
          </div>
        </div>
      )}
    </DnaDrawer>
  );
}
