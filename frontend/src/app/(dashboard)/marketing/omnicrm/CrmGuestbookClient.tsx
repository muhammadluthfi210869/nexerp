"use client";

// CrmGuestbookClient — Buku Tamu approval log.
// Loads /crm/guestbook/events?status=PENDING, lets BusDev approve/reject.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DnaBadge, DnaButton } from "@/components/dna";

interface GuestbookEvent {
  id: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  pageUrl: string;
  pageTitle: string | null;
  source: string;
  intent: string | null;
  createdAt: string;
  lead: {
    id: string;
    displayName: string | null;
    phone: string;
    source: string;
  };
}

export function CrmGuestbookClient() {
  const [events, setEvents] = useState<GuestbookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get<GuestbookEvent[]>("/crm/guestbook/events", { params: { status: "PENDING" } })
      .then((res) => setEvents(res.data))
      .catch((e) => setError(e?.message ?? "Gagal memuat buku tamu"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const decide = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setBusyId(id);
    try {
      await api.post(`/crm/guestbook/events/${id}/${decision === "APPROVED" ? "approve" : "reject"}`, {
        approverNote: null,
      });
      load();
    } catch (e: any) {
      setError(e?.message ?? `Gagal ${decision}`);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div data-testid="omnicrm-guestbook-loading">Memuat buku tamu…</div>;
  if (error) return <div data-testid="omnicrm-guestbook-error" className="text-red-600">{error}</div>;
  if (events.length === 0) return <div data-testid="omnicrm-guestbook-empty">Tidak ada buku tamu pending.</div>;

  return (
    <div data-testid="omnicrm-guestbook" className="flex flex-col gap-3">
      {events.map((ev) => (
        <article
          key={ev.id}
          data-testid={`omnicrm-guestbook-row-${ev.id}`}
          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="font-medium">{ev.lead.displayName ?? "(belum ada nama)"}</p>
            <p className="text-sm text-muted-foreground">{ev.lead.phone}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <DnaBadge status="default">{ev.source}</DnaBadge>
              <span className="text-muted-foreground">via</span>
              <span className="truncate text-muted-foreground">{ev.pageTitle ?? ev.pageUrl}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <DnaButton
              variant="primary"
              disabled={busyId === ev.id}
              onClick={() => decide(ev.id, "APPROVED")}
              data-testid={`omnicrm-guestbook-approve-${ev.id}`}
            >
              Approve
            </DnaButton>
            <DnaButton
              variant="secondary"
              disabled={busyId === ev.id}
              onClick={() => decide(ev.id, "REJECTED")}
              data-testid={`omnicrm-guestbook-reject-${ev.id}`}
            >
              Reject
            </DnaButton>
          </div>
        </article>
      ))}
    </div>
  );
}
