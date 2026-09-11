"use client";

// CrmInboxClient — leads kanban (8 columns, FIVE_STAGE_FUNNEL + 2 loss + 1 won).
// Fetches from /crm/leads. Minimal scaffold: load + render cards. DnD wired
// via onClick→PATCH /crm/leads/:id/displayName mutation in Phase 4.2.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DnaBadge } from "@/components/dna";

type CrmStage = "LEADS_MASUK" | "COLD" | "WARM" | "HOT" | "SAMPLE" | "JUNK_LEADS" | "CLIENT_DEAL" | "CLOSED_LOST";

interface CrmLead {
  id: string;
  stage: CrmStage;
  displayName: string | null;
  phone: string;
  source: string;
  pageUrl: string | null;
  assignedToId: string | null;
  createdAt: string;
}

const STAGES: { id: CrmStage; label: string; tone: string }[] = [
  { id: "LEADS_MASUK", label: "Leads Masuk", tone: "default" },
  { id: "COLD", label: "Cold", tone: "default" },
  { id: "WARM", label: "Warm", tone: "warning" },
  { id: "HOT", label: "Hot", tone: "critical" },
  { id: "SAMPLE", label: "Sample", tone: "warning" },
  { id: "JUNK_LEADS", label: "Junk", tone: "default" },
  { id: "CLIENT_DEAL", label: "Client Deal", tone: "default" },
  { id: "CLOSED_LOST", label: "Closed Lost", tone: "default" },
];

export function CrmInboxClient() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get<CrmLead[]>("/crm/leads", { params: { limit: 200 } })
      .then((res) => { if (!cancelled) setLeads(res.data); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Gagal memuat leads"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div data-testid="omnicrm-inbox-loading">Memuat leads…</div>;
  if (error) return <div data-testid="omnicrm-inbox-error" className="text-red-600">{error}</div>;

  const byStage = STAGES.map((s) => ({
    ...s,
    leads: leads.filter((l) => l.stage === s.id),
  }));

  return (
    <div data-testid="omnicrm-inbox" className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
      {byStage.map((col) => (
        <div key={col.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{col.label}</h3>
            <DnaBadge status={col.tone as any}>{col.leads.length}</DnaBadge>
          </div>
          <div className="flex flex-col gap-2">
            {col.leads.length === 0 && (
              <p className="text-xs text-muted-foreground">Kosong</p>
            )}
            {col.leads.map((lead) => (
              <article
                key={lead.id}
                data-testid={`omnicrm-lead-card-${lead.id}`}
                className="rounded-md border border-border bg-background p-2 text-xs shadow-sm"
              >
                <p className="font-medium">{lead.displayName ?? "(belum ada nama)"}</p>
                <p className="text-muted-foreground">{lead.phone}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {lead.source}
                </p>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
