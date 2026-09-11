"use client";

// TaskDetailModal: opens when user clicks a task in TaskWorkspace.
// Shows full task detail + comments thread + attachments + audit history.

import { useEffect, useState } from "react";
import { MessageSquare, Paperclip, Send, Trash2, History } from "lucide-react";
import { DnaButton, DnaDrawer, DnaTextarea } from "@/components/dna";
import { useDnaToast } from "@/components/dna/DnaToast";
import { DnaStatusBadge, DnaPriorityBadge, DnaDaysLeftChip, DnaAvatar, DnaAttachmentList } from "@/components/dna";
import { marketingService, mockViewer } from "@/lib/services/marketing-service";
import type { MarketingTask, TaskComment, TaskAttachment, ChecklistItem } from "@/types/marketing-api";

export default function TaskDetailModal({
  isOpen,
  taskId,
  onClose,
  onUpdated,
}: {
  isOpen: boolean;
  taskId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const toast = useDnaToast();
  const [task, setTask] = useState<MarketingTask | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen && taskId) loadAll(taskId);
  }, [isOpen, taskId]);

  async function loadAll(id: string) {
    const [t, c, a] = await Promise.all([
      marketingService.getTask(mockViewer, id),
      marketingService.listTaskComments(mockViewer, id),
      marketingService.listTaskAttachments(mockViewer, id),
    ]);
    setTask(t);
    setComments(c);
    setAttachments(a);
  }

  async function handleAddComment() {
    if (!taskId || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await marketingService.createTaskComment(mockViewer, taskId, { body: newComment });
      setNewComment("");
      const c = await marketingService.listTaskComments(mockViewer, taskId);
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
      await marketingService.deleteTaskComment(mockViewer, id);
      if (taskId) {
        const c = await marketingService.listTaskComments(mockViewer, taskId);
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
      await marketingService.addTaskAttachment(mockViewer, taskId, file);
      const a = await marketingService.listTaskAttachments(mockViewer, taskId);
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
      await marketingService.deleteTaskAttachment(mockViewer, id);
      if (taskId) {
        const a = await marketingService.listTaskAttachments(mockViewer, taskId);
        setAttachments(a);
      }
      toast.success("Lampiran dihapus.");
    } catch (e: any) {
      toast.error("Gagal hapus: " + e.message);
    }
  }

  async function handleToggleChecklist(item: ChecklistItem) {
    if (!taskId) return;
    try {
      await marketingService.updateChecklist(mockViewer, taskId, item.id, {
        version: task?.version ?? 1,
        done: !item.done,
      });
      const t = await marketingService.getTask(mockViewer, taskId);
      setTask(t);
      toast.success("Checklist diupdate.");
      onUpdated?.();
    } catch (e: any) {
      toast.error("Gagal update: " + e.message);
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
      {!task && <div className="text-sm text-slate-500">Memuat task…</div>}
      {task && (
        <div className="space-y-5">
          {/* Meta strip */}
          <div className="flex flex-wrap items-center gap-2">
            <DnaStatusBadge status={task.status} />
            <DnaPriorityBadge priority={task.priority} />
            <DnaDaysLeftChip dueDate={task.dueDate} />
            {task.assignee && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <DnaAvatar name={task.assignee.name} size="sm" />
                <span>{task.assignee.name}</span>
              </div>
            )}
            {task.brand && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{task.brand.name}</span>
            )}
          </div>

          {/* Description */}
          {task.brief && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Brief</div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">{task.brief}</div>
            </div>
          )}

          {/* Checklist */}
          {task.checklist.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Checklist ({task.checklistDone}/{task.checklistTotal})
              </div>
              <div className="space-y-1">
                {task.checklist.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={() => handleToggleChecklist(c)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className={`text-sm ${c.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {c.text}
                    </span>
                    {c.isRequired && !c.done && <span className="text-xs text-rose-600">*required</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase mb-3">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </div>
            <div className="space-y-3 mb-3">
              {comments.length === 0 && (
                <p className="text-xs text-slate-400 italic">Belum ada komentar.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <DnaAvatar name={c.authorId ?? "?"} size="sm" />
                  <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-slate-500">
                        {c.authorId ?? "anon"} · {new Date(c.createdAt).toLocaleString("id-ID")}
                      </div>
                      <button onClick={() => handleDeleteComment(c.id)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2">
              <DnaTextarea
                placeholder="Tulis komentar..."
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <DnaButton
                variant="primary"
                size="sm"
                icon={<Send className="h-4 w-4" />}
                onClick={handleAddComment}
                disabled={submitting || !newComment.trim()}
              >
                Kirim
              </DnaButton>
            </div>
          </div>

          {/* Attachments */}
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <Paperclip className="h-4 w-4" />
                Lampiran ({attachments.length})
              </div>
              <label className="cursor-pointer">
                <span className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-block">
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
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase mb-3">
                <History className="h-4 w-4" />
                History ({task.history.length})
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
        </div>
      )}
    </DnaDrawer>
  );
}
