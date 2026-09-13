"use client";

// /decision-support — Wave 4 / D3.
//
// 3 tabs: Pending (action items for current user) / Queue (director view
// org-wide) / History (audit trail of decisions). Click a pending row →
// opens DnaDecisionModal. Director-only check on Queue tab via role
// inspection of the localStorage 'user' blob.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Compass, Inbox, ListChecks, History, RefreshCw } from "lucide-react";
import {
  DnaCard,
  DnaButton,
  DnaBadge,
  DnaEmptyState,
  DnaPageContainer,
  DnaPageHeader,
} from "@/components/dna";
import { DnaNotificationCenter } from "@/components/dna/DnaNotificationCenter";
import { DnaDecisionModal, type DecisionAction } from "@/components/dna/DnaDecisionModal";
import { decisionService } from "@/lib/services/decision-service";
import { mockCommViewer } from "@/lib/services/communication-service";
import type { PendingItem, Recommendation, DecisionHistoryEntry } from "@/types/decision";

export const dynamic = "force-dynamic";

type TabKey = "pending" | "queue" | "history";

interface ViewerUser {
  id: string;
  fullName?: string;
  email?: string;
  roles?: string[];
}

function readViewer(): ViewerUser {
  if (typeof window === "undefined") return { id: mockCommViewer.id };
  try {
    const raw = window.localStorage.getItem("user");
    if (!raw) return { id: mockCommViewer.id };
    const parsed = JSON.parse(raw) as ViewerUser;
    return parsed;
  } catch {
    return { id: mockCommViewer.id };
  }
}

function severityTone(sev: string): "success" | "warning" | "critical" | "info" {
  switch (sev) {
    case "CRITICAL":
      return "critical";
    case "HIGH":
      return "critical";
    case "MEDIUM":
      return "warning";
    default:
      return "info";
  }
}

export default function DecisionSupportPage() {
  const [tab, setTab] = useState<TabKey>("pending");
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [queue, setQueue] = useState<PendingItem[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [history, setHistory] = useState<DecisionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewer] = useState<ViewerUser>(() => readViewer());

  const isDirector = useMemo(
    () =>
      (viewer.roles ?? []).some((r) =>
        ["DIRECTOR", "SUPER_ADMIN", "HEAD_OPS"].includes(r),
      ),
    [viewer],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, q, r, h] = await Promise.all([
        decisionService.listPending(),
        isDirector ? decisionService.listQueue().catch(() => []) : Promise.resolve([]),
        decisionService.listRecommendations().catch(() => []),
        decisionService.listHistory().catch(() => []),
      ]);
      setPending(p);
      setQueue(q);
      setRecs(r);
      setHistory(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data decision support");
    } finally {
      setLoading(false);
    }
  }, [isDirector]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const tabs = [
    { key: "pending" as const, label: "Pending", icon: <Inbox className="w-3.5 h-3.5" />, count: pending.length },
    ...(isDirector
      ? [{ key: "queue" as const, label: "Queue", icon: <ListChecks className="w-3.5 h-3.5" />, count: queue.length }]
      : []),
    { key: "history" as const, label: "History", icon: <History className="w-3.5 h-3.5" />, count: history.length },
  ];

  return (
    <DnaPageContainer>
      <div className="flex items-center justify-between mb-4">
        <DnaPageHeader
          title="Decision Support"
          subtitle="Rekomendasi + antrian keputusan untuk Direksi. Heuristik, bukan ML."
          tabs={tabs}
          activeTab={tab}
          onTabChange={(k) => setTab(k as TabKey)}
        />
        <div className="flex items-center gap-2">
          <DnaButton
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => void refresh()}
          >
            Refresh
          </DnaButton>
          <DnaNotificationCenter viewer={mockCommViewer} />
        </div>
      </div>

      {error && (
        <DnaCard padding="md" className="mb-4 border-rose-300 bg-rose-50">
          <div className="text-xs text-rose-700">{error}</div>
        </DnaCard>
      )}

      {/* Recommendations strip */}
      {recs.length > 0 && (
        <DnaCard padding="md" className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase text-slate-700 tracking-wide">
              Rekomendasi ({recs.length})
            </span>
          </div>
          <ul className="space-y-2">
            {recs.slice(0, 3).map((r) => (
              <li key={r.id} className="text-xs">
                <div className="font-semibold text-slate-800">{r.title}</div>
                <div className="text-slate-600">{r.rationale}</div>
                <div className="text-[10px] text-slate-500 italic mt-0.5">{r.impact}</div>
              </li>
            ))}
          </ul>
        </DnaCard>
      )}

      {/* Tab content */}
      {tab === "pending" && (
        <PendingList items={pending} loading={loading} viewerRoles={viewer.roles ?? []} onResolved={refresh} />
      )}
      {tab === "queue" && isDirector && (
        <PendingList items={queue} loading={loading} viewerRoles={viewer.roles ?? []} onResolved={refresh} />
      )}
      {tab === "history" && <HistoryList items={history} loading={loading} />}
    </DnaPageContainer>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PendingList({
  items,
  loading,
  viewerRoles,
  onResolved,
}: {
  items: PendingItem[];
  loading: boolean;
  viewerRoles: string[];
  onResolved: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<PendingItem | null>(null);

  const openModal = (item: PendingItem) => {
    const ref = item.contextRefs[0];
    if (!ref) return;
    setModalTarget(item);
    setModalOpen(true);
  };

  if (loading && items.length === 0) {
    return <div className="text-xs text-slate-500 p-8 text-center">Memuat…</div>;
  }
  if (!loading && items.length === 0) {
    return (
      <DnaEmptyState
        icon={<Inbox className="w-8 h-8" />}
        title="Tidak ada item pending"
        description="Semua keputusan sudah ditangani. Bagus!"
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id}>
            <DnaCard padding="md" className="hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0 gap-1">
                  <div className="flex items-center gap-2">
                    <DnaBadge status={severityTone(p.severity)}>{p.severity}</DnaBadge>
                    <span className="font-semibold text-sm text-slate-900 truncate">{p.title}</span>
                  </div>
                  <div className="text-xs text-slate-600">{p.description}</div>
                  {p.contextRefs.length > 0 && (
                    <div className="text-[10px] text-slate-400">
                      {p.contextRefs
                        .map((r) => r.label ?? `${r.entityType}/${r.entityId.slice(0, 8)}`)
                        .join(" · ")}
                    </div>
                  )}
                </div>
                <DnaButton size="sm" variant="outline" onClick={() => openModal(p)}>
                  Tindaklanjuti
                </DnaButton>
              </div>
            </DnaCard>
          </li>
        ))}
      </ul>

      {modalTarget && (
        <DnaDecisionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          decisionId={modalTarget.contextRefs[0]?.entityId ?? modalTarget.id}
          contextLabel={modalTarget.contextRefs[0]?.label ?? modalTarget.title}
          entityType={modalTarget.contextRefs[0]?.entityType}
          onResolved={onResolved}
        />
      )}
    </>
  );
}

function HistoryList({ items, loading }: { items: DecisionHistoryEntry[]; loading: boolean }) {
  if (loading && items.length === 0) {
    return <div className="text-xs text-slate-500 p-8 text-center">Memuat…</div>;
  }
  if (!loading && items.length === 0) {
    return (
      <DnaEmptyState
        icon={<History className="w-8 h-8" />}
        title="Belum ada history"
        description="Keputusan yang Anda catat akan muncul di sini."
      />
    );
  }
  return (
    <DnaCard padding="md">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 uppercase tracking-wide border-b border-slate-200">
            <th className="py-2">Waktu</th>
            <th className="py-2">Aksi</th>
            <th className="py-2">Entity</th>
            <th className="py-2">Rationale</th>
          </tr>
        </thead>
        <tbody>
          {items.map((h) => (
            <tr key={h.id} className="border-b border-slate-100 last:border-b-0">
              <td className="py-2 text-slate-500">{new Date(h.createdAt).toLocaleString("id-ID")}</td>
              <td className="py-2">
                <DnaBadge status={h.metadata?.action === "APPROVE" ? "success" : h.metadata?.action === "REJECT" ? "critical" : "warning"}>
                  {h.metadata?.action ?? "—"}
                </DnaBadge>
              </td>
              <td className="py-2 text-slate-700">{h.entityId?.slice(0, 8) ?? "—"}</td>
              <td className="py-2 text-slate-600 italic">{h.metadata?.rationale ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DnaCard>
  );
}