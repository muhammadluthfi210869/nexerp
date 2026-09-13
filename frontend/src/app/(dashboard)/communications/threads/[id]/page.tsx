"use client";

// /communications/threads/[id] — single thread view (DnaThread island).

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { DnaCard, DnaBadge, DnaPageContainer, DnaPageHeader } from "@/components/dna";
import { DnaThread } from "@/components/dna/DnaThread";
import { communicationService, mockCommViewer } from "@/lib/services/communication-service";
import type { CommThread } from "@/types/communication";

export const dynamic = "force-dynamic";

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = mockCommViewer;
  const [threadId, setThreadId] = useState<string | null>(null);
  const [meta, setMeta] = useState<CommThread | null>(null);

  useEffect(() => {
    void params.then((p) => setThreadId(p.id));
  }, [params]);

  useEffect(() => {
    if (!threadId) return;
    void communicationService.getThread(viewer, threadId).then(setMeta).catch(() => setMeta(null));
  }, [threadId, viewer]);

  return (
    <DnaPageContainer>
      <Link
        href="/communications"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 mb-3"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Kembali ke Communications
      </Link>

      <DnaPageHeader
        title={meta?.title ?? "Thread"}
        subtitle={meta?.contextType ? `Konteks: ${meta.contextType}` : undefined}
        icon={<Users className="w-5 h-5" />}
      />

      <DnaCard padding="lg" className="mt-4">
        {threadId ? (
          <DnaThread threadId={threadId} viewer={viewer} contextLabel={meta?.contextType ?? undefined} />
        ) : (
          <div className="text-xs text-slate-500">Memuat…</div>
        )}
      </DnaCard>

      {meta && meta.participants && meta.participants.length > 0 && (
        <DnaCard padding="md" className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Peserta</div>
          <div className="flex flex-wrap gap-2">
            {meta.participants.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs"
              >
                <span
                  className="w-6 h-6 rounded-full text-white flex items-center justify-center font-black text-[10px]"
                  style={{ backgroundColor: p.avatarBg ?? "#94a3b8" }}
                >
                  {p.initial ?? p.name[0]?.toUpperCase()}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold text-slate-900">{p.name}</span>
                  <span className="text-[10px] text-slate-500">{p.role}</span>
                </span>
                {p.id === viewer.id && (
                  <DnaBadge variant="info" className="text-[9px] ml-1">
                    You
                  </DnaBadge>
                )}
              </span>
            ))}
          </div>
        </DnaCard>
      )}
    </DnaPageContainer>
  );
}