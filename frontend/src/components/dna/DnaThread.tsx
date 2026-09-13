"use client";

// DnaThread — thread-level reply feed + composer for /v1/communications.
//
// Wraps the same visual DNA as DnaInternalThread (rounded card, urgency
// borders, role chips) but reads from communication-service instead of
// getSharedInternalNotes(entityId) so it can drive real backend threads.
//
// ponytail: re-implemented the rendering (not forked DnaInternalThread) —
// DnaInternalThread is bound to shared-erp-flow per-entity notes; the
// communications module is per-thread replies. Same DNA primitives, two
// data sources, two components. Add a wrapper if both end up needing it.

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Bell, User, Paperclip, Reply as ReplyIcon, Image as ImageIcon } from "lucide-react";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { DnaComposer } from "@/components/dna/DnaComposer";
import { communicationService } from "@/lib/services/communication-service";
import type { CommAttachment, CommReply, CommThread, CommUser } from "@/types/communication";

export interface DnaThreadProps {
  threadId: string;
  viewer: CommUser;
  /** Optional context shown in header (e.g. "Formulasi B5"). */
  contextLabel?: string;
  /** Compact mode for sidebar preview (hides composer + nested replies). */
  compact?: boolean;
  className?: string;
}

const URGENCY_STYLES: Record<string, string> = {
  NORMAL: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800",
  PENTING: "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60",
  URGENT: "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60",
};

export function DnaThread({ threadId, viewer, contextLabel, compact, className }: DnaThreadProps) {
  const [thread, setThread] = useState<CommThread | null>(null);
  const [replies, setReplies] = useState<CommReply[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([
        communicationService.getThread(viewer, threadId),
        communicationService.listReplies(viewer, threadId),
      ]);
      setThread(t);
      setReplies(r);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat thread");
    } finally {
      setLoading(false);
    }
  }, [viewer, threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll every 30s (mock-only real-time; D1.Backend will replace with WS).
  useEffect(() => {
    if (compact) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, compact]);

  const onReplyCreated = (r: CommReply) => {
    setReplies((prev) => [...prev, r]);
    setReplyTo(null);
  };

  // Group replies: top-level + replies-by-parent map
  const grouped = useMemo(() => {
    const top: CommReply[] = [];
    const byParent = new Map<string, CommReply[]>();
    for (const r of replies) {
      if (!r.parentReplyId) top.push(r);
      else {
        const arr = byParent.get(r.parentReplyId) ?? [];
        arr.push(r);
        byParent.set(r.parentReplyId, arr);
      }
    }
    return { top, byParent };
  }, [replies]);

  if (loading) {
    return <div className="p-4 text-xs text-slate-500">Memuat thread…</div>;
  }
  if (error || !thread) {
    return <div className="p-4 text-xs text-rose-600">{error ?? "Thread tidak ditemukan"}</div>;
  }

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider truncate">
              {thread.title}
            </span>
            <DnaBadge variant={thread.status === "OPEN" ? "info" : "neutral"} className="text-[10px]">
              {thread.status}
            </DnaBadge>
          </div>
          {contextLabel && <span className="text-[10px] text-slate-500 pl-6">{contextLabel}</span>}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono font-semibold">
            {replies.length} balasan
          </span>
          <Bell className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {grouped.top.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Belum ada balasan</p>
            <p className="text-[11px] text-slate-400 mt-1">Jadilah yang pertama membalas thread ini.</p>
          </div>
        ) : (
          grouped.top.map((r) => (
            <ReplyCard
              key={r.id}
              reply={r}
              children={grouped.byParent.get(r.id) ?? []}
              onReply={(id) => setReplyTo(id)}
              groupedByParent={grouped.byParent}
            />
          ))
        )}
      </div>

      {!compact && (
        <DnaComposer
          threadId={threadId}
          viewer={viewer}
          parentReplyId={replyTo}
          onReplyCreated={onReplyCreated}
          placeholder={replyTo ? "Balas thread ini…" : "Tulis balasan… (@ untuk mention)"}
        />
      )}
    </div>
  );
}

function ReplyCard({
  reply,
  children,
  onReply,
  groupedByParent,
}: {
  reply: CommReply;
  children: CommReply[];
  onReply: (id: string) => void;
  groupedByParent: Map<string, CommReply[]>;
}) {
  const urgency = reply.urgency;
  return (
    <div className={cn("p-3.5 rounded-xl border text-xs transition-all shadow-xs", URGENCY_STYLES[urgency])}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <User className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-800 truncate">{reply.authorName}</span>
          {reply.authorRole && (
            <DnaBadge variant="slate" className="text-[10px] px-1.5 py-0">
              {reply.authorRole}
            </DnaBadge>
          )}
          {reply.mentions?.map((m) => (
            <span
              key={m.id}
              className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md"
            >
              @{m.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {urgency === "URGENT" && (
            <DnaBadge variant="danger" className="text-[10px] font-bold">
              URGENT
            </DnaBadge>
          )}
          {urgency === "PENTING" && (
            <DnaBadge variant="warning" className="text-[10px] font-semibold">
              PENTING
            </DnaBadge>
          )}
          <span className="text-[10px] font-mono text-slate-400">{reply.createdAt}</span>
        </div>
      </div>
      <p className="text-slate-700 font-normal leading-relaxed whitespace-pre-wrap">{reply.body}</p>
      {reply.attachments.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {reply.attachments.map((a) => (
            <AttachmentThumb key={a.id} att={a} />
          ))}
        </ul>
      )}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => onReply(reply.id)}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-blue-600"
        >
          <ReplyIcon className="w-3 h-3" /> Reply
        </button>
      </div>
      {children.length > 0 && (
        <div className="mt-3 ml-4 pl-3 border-l border-slate-200 space-y-2">
          {children.map((c) => (
            <ReplyCard
              key={c.id}
              reply={c}
              children={groupedByParent.get(c.id) ?? []}
              onReply={onReply}
              groupedByParent={groupedByParent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentThumb({ att }: { att: CommAttachment }) {
  if (att.isImage) {
    return (
      <li className="relative h-16 w-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
        <span className="absolute inset-0 flex items-center justify-center text-slate-400">
          <ImageIcon className="w-5 h-5" />
        </span>
        <span className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[9px] bg-black/50 text-white truncate">
          {att.name}
        </span>
      </li>
    );
  }
  return (
    <li className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-[11px] text-slate-700">
      <Paperclip className="w-3 h-3" />
      <span className="truncate max-w-[140px]">{att.name}</span>
      <span className="text-[10px] text-slate-400 font-mono">{Math.ceil(att.sizeBytes / 1024)}KB</span>
    </li>
  );
}