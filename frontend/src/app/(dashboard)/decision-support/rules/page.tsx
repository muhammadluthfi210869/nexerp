"use client";

// /decision-support/rules — Wave 4 / D3 admin page.
//
// Lists all configured alert rules, lets directors toggle them on/off.
// Calls PATCH /v1/decision/rules/:id/toggle. Director-only — others
// see an access-denied DnaEmptyState.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GitBranch, ShieldOff } from "lucide-react";
import {
  DnaCard,
  DnaButton,
  DnaBadge,
  DnaEmptyState,
  DnaPageContainer,
  DnaPageHeader,
  DnaSwitch,
} from "@/components/dna";
import { decisionService } from "@/lib/services/decision-service";
import type { AlertRule } from "@/types/decision";

export const dynamic = "force-dynamic";

interface ViewerUser {
  id: string;
  roles?: string[];
}
function readViewer(): ViewerUser {
  if (typeof window === "undefined") return { id: "anon" };
  try {
    const raw = window.localStorage.getItem("user");
    if (!raw) return { id: "anon" };
    return JSON.parse(raw) as ViewerUser;
  } catch {
    return { id: "anon" };
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

export default function DecisionSupportRulesPage() {
  const [viewer] = useState<ViewerUser>(() => readViewer());
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDirector = useMemo(
    () =>
      (viewer.roles ?? []).some((r) =>
        ["DIRECTOR", "SUPER_ADMIN", "HEAD_OPS"].includes(r),
      ),
    [viewer],
  );

  const load = useCallback(async () => {
    if (!isDirector) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await decisionService.listRules();
      setRules(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat rules");
    } finally {
      setLoading(false);
    }
  }, [isDirector]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (ruleId: string, enabled: boolean) => {
    setRules((cur) => cur.map((r) => (r.id === ruleId ? { ...r, enabled } : r)));
    try {
      await decisionService.toggleRule(ruleId, enabled);
    } catch (e) {
      // revert on error
      setRules((cur) =>
        cur.map((r) => (r.id === ruleId ? { ...r, enabled: !enabled } : r)),
      );
      setError(e instanceof Error ? e.message : "Toggle gagal");
    }
  };

  if (!isDirector) {
    return (
      <DnaPageContainer>
        <DnaPageHeader
          title="Alert Rules"
          backLink={{ href: "/decision-support", label: "Kembali ke Decision Support" }}
        />
        <DnaEmptyState
          icon={<ShieldOff className="w-8 h-8" />}
          title="Akses ditolak"
          description="Halaman ini hanya untuk Direksi / SUPER_ADMIN / HEAD_OPS."
        />
      </DnaPageContainer>
    );
  }

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Alert Rules"
        subtitle="Toggle aktif/nonaktif. Rule dievaluasi via AlertEngineService + cache 60s."
        backLink={{ href: "/decision-support", label: "Kembali ke Decision Support" }}
      />

      {error && (
        <DnaCard padding="md" className="mb-4 border-rose-300 bg-rose-50">
          <div className="text-xs text-rose-700">{error}</div>
        </DnaCard>
      )}

      {loading && <div className="text-xs text-slate-500 p-8 text-center">Memuat…</div>}

      {!loading && rules.length === 0 && (
        <DnaEmptyState
          icon={<GitBranch className="w-8 h-8" />}
          title="Belum ada rule"
          description="Rule default di-load dari alert-rules.yaml backend. Restart backend setelah edit."
        />
      )}

      {!loading && rules.length > 0 && (
        <ul className="space-y-2">
          {rules.map((r) => (
            <li key={r.id}>
              <DnaCard padding="md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <DnaBadge status={severityTone(r.severity)}>{r.severity}</DnaBadge>
                      <span className="font-semibold text-sm text-slate-900">{r.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">#{r.id}</span>
                    </div>
                    <div className="text-xs text-slate-600 mb-1">{r.description}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {r.metric} {r.comparator} {r.threshold.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Recipients: {r.recipients.map((x) => x.role ?? x.userId ?? x.division).filter(Boolean).join(", ") || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">
                      {r.enabled ? "Aktif" : "Nonaktif"}
                    </span>
                    <DnaSwitch
                      checked={r.enabled}
                      onCheckedChange={(v) => void toggle(r.id, v)}
                    />
                  </div>
                </div>
              </DnaCard>
            </li>
          ))}
        </ul>
      )}
    </DnaPageContainer>
  );
}