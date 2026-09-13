"use client";

// /communications — thread inbox page.
// Lists threads from communication-service, filter by status, click → detail.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, MessageSquare, Inbox, RefreshCw } from "lucide-react";
import {
  DnaCard,
  DnaButton,
  DnaBadge,
  DnaInput,
  DnaEmptyState,
  DnaPageContainer,
  DnaPageHeader,
} from "@/components/dna";
import { DnaNotificationCenter } from "@/components/dna/DnaNotificationCenter";
import { communicationService, mockCommViewer } from "@/lib/services/communication-service";
import type { CommThread, ListThreadsQuery, ThreadStatus } from "@/types/communication";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: { value: ThreadStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function CommunicationsInboxPage() {
  const viewer = mockCommViewer;
  const [threads, setThreads] = useState<CommThread[]>([]);
  const [status, setStatus] = useState<ThreadStatus | "all">("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo<ListThreadsQuery>(() => ({ status, q: q.trim() || undefined }), [status, q]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await communicationService.listThreads(viewer, query);
      setThreads(res.items);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat thread");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <DnaPageContainer>
      <div className="flex items-center justify-between mb-4">
        <DnaPageHeader
          title="Communications"
          subtitle="Zero-chat: thread diskusi lintas divisi yang terdokumentasi otomatis."
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <DnaNotificationCenter viewer={viewer} />
      </div>

      <DnaCard padding="md" className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <DnaInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari thread…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1">
            {STATUS_OPTIONS.map((opt) => (
              <DnaButton
                key={opt.value}
                variant={status === opt.value ? "primary" : "outline"}
                size="sm"
                onClick={() => setStatus(opt.value)}
              >
                {opt.label}
              </DnaButton>
            ))}
          </div>
          <DnaButton variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={load}>
            Refresh
          </DnaButton>
        </div>
      </DnaCard>

      {loading && <div className="text-xs text-slate-500 p-8 text-center">Memuat…</div>}
      {error && <div className="text-xs text-rose-600 p-4">{error}</div>}

      {!loading && !error && threads.length === 0 && (
        <DnaEmptyState
          icon={<Inbox className="w-8 h-8" />}
          title="Belum ada thread"
          description="Mulai diskusi baru dari halaman Approval, Formulasi, atau Produksi."
        />
      )}

      {!loading && threads.length > 0 && (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/communications/threads/${t.id}`}>
                <DnaCard padding="md" className="hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-semibold text-sm text-slate-900 truncate">{t.title}</span>
                        {(t.unreadCount ?? 0) > 0 && (
                          <DnaBadge variant="danger" className="text-[10px] font-bold">
                            {t.unreadCount} baru
                          </DnaBadge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <span className="font-mono">{t.lastActivityAt}</span>
                        <span>·</span>
                        <span>{t.participants?.length ?? 0} peserta</span>
                        {t.contextType && (
                          <>
                            <span>·</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold uppercase tracking-wide text-[9px]">
                              {t.contextType}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <DnaBadge variant={t.status === "OPEN" ? "info" : "neutral"} className="text-[10px]">
                        {t.status}
                      </DnaBadge>
                      <span className="text-[10px] text-slate-500 font-mono">{t.replyCount} balasan</span>
                    </div>
                  </div>
                </DnaCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DnaPageContainer>
  );
}