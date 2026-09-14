"use client";

// CrmGuestbookClient — Buku Tamu approval log.
// Loads /crm/guestbook/events?status=PENDING&assignedToId=..., lets BusDev approve/reject.
//
// B1 — per-busdev filter via DnaSearchableSelect (mirrors Overview pattern).

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  DnaBadge,
  DnaButton,
  DnaSearchableSelect,
  DnaConfirmDialog,
  dnaToastApi,
  type DnaSelectOption,
} from "@/components/dna";

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
    assignedToId: string | null;
  };
}

interface BusDev { id: string; name: string; userId: string | null; isActive: boolean; totalLeads: number; }

export function CrmGuestbookClient() {
  const [events, setEvents] = useState<GuestbookEvent[]>([]);
  const [busdevs, setBusdevs] = useState<BusDev[]>([]);
  const [busdevId, setBusdevId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<{ id: string; decision: "APPROVED" | "REJECTED" } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<GuestbookEvent[]>("/crm/guestbook/events", {
        params: { status: "PENDING", ...(busdevId ? { assignedToId: busdevId } : {}) },
      }),
      api.get<BusDev[]>("/crm/busdevs", { params: { isActive: "true" } }),
    ])
      .then(([evRes, bdRes]) => {
        setEvents(evRes.data);
        setBusdevs(bdRes.data);
      })
      .catch((e) => setError(e?.message ?? "Gagal memuat buku tamu"))
      .finally(() => setLoading(false));
  }, [busdevId]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setBusyId(id);
    try {
      await api.post(`/crm/guestbook/events/${id}/${decision === "APPROVED" ? "approve" : "reject"}`, {
        approverNote: null,
      });
      dnaToastApi.success({
        title: decision === "APPROVED" ? "Buku Tamu disetujui" : "Buku Tamu ditolak",
        description: `Event ${id.slice(0, 8)} telah di-${decision === "APPROVED" ? "approve" : "reject"}.`,
      });
      load();
    } catch (e: any) {
      setError(e?.message ?? `Gagal ${decision}`);
      dnaToastApi.error({
        title: `Gagal ${decision === "APPROVED" ? "menyetujui" : "menolak"}`,
        description: e?.message ?? "Unknown error",
      });
    } finally {
      setBusyId(null);
      setPendingDecision(null);
    }
  };

  // Filter dropdown to only busdevs with valid userId. Backend expects User.id
  // (matches Overview convention) — busdevs without a User link silently
  // return empty results when selected.
  const busdevOptions: DnaSelectOption[] = useMemo(
    () => [
      { value: "", label: "Semua BusDev" },
      ...busdevs.filter((b) => b.userId).map((b) => ({ value: b.userId as string, label: b.name })),
    ],
    [busdevs],
  );

  if (loading && events.length === 0) return <div data-testid="omnicrm-guestbook-loading">Memuat buku tamu…</div>;
  if (error) return <div data-testid="omnicrm-guestbook-error" className="text-red-600">{error}</div>;

  return (
    <div data-testid="omnicrm-guestbook" className="flex flex-col gap-3">
      <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/90 bg-white p-4">
        <div className="flex min-w-[200px] flex-col gap-1">
          <label className="text-xs text-muted-foreground">BusDev</label>
          <DnaSearchableSelect
            options={busdevOptions}
            value={busdevId}
            onChange={(v) => setBusdevId(String(v))}
            placeholder="Semua BusDev"
            data-testid="guestbook-filter-busdev"
          />
        </div>
        <div className="ml-auto text-xs text-muted-foreground" data-testid="guestbook-count">
          {events.length} entri pending
        </div>
      </section>

      {events.length === 0 && (
        <div data-testid="omnicrm-guestbook-empty" className="rounded-2xl border border-slate-200/90 bg-white p-6 text-sm text-muted-foreground">
          Tidak ada buku tamu pending untuk filter ini.
        </div>
      )}

      {events.map((ev) => {
        const busdev = busdevs.find((b) => b.userId === ev.lead.assignedToId);
        return (
          <article
            key={ev.id}
            data-testid={`omnicrm-guestbook-row-${ev.id}`}
            className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-medium">{ev.lead.displayName ?? "(belum ada nama)"}</p>
              <p className="text-sm text-muted-foreground">{ev.lead.phone}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <DnaBadge status="default">{ev.source}</DnaBadge>
                <span className="text-muted-foreground">via</span>
                <span className="truncate text-muted-foreground">{ev.pageTitle ?? ev.pageUrl}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  BusDev: {busdev?.name ?? <span className="italic">unassigned</span>}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <DnaButton
                variant="primary"
                disabled={busyId === ev.id}
                onClick={() => setPendingDecision({ id: ev.id, decision: "APPROVED" })}
                data-testid={`omnicrm-guestbook-approve-${ev.id}`}
              >
                Approve
              </DnaButton>
              <DnaButton
                variant="secondary"
                disabled={busyId === ev.id}
                onClick={() => setPendingDecision({ id: ev.id, decision: "REJECTED" })}
                data-testid={`omnicrm-guestbook-reject-${ev.id}`}
              >
                Reject
              </DnaButton>
            </div>
          </article>
        );
      })}

      {/* DnaConfirmDialog before approve/reject (B4) */}
      <DnaConfirmDialog
        isOpen={pendingDecision !== null}
        onClose={() => setPendingDecision(null)}
        title={pendingDecision?.decision === "APPROVED" ? "Setujui Buku Tamu?" : "Tolak Buku Tamu?"}
        description={pendingDecision
          ? `Event ${pendingDecision.id.slice(0, 8)} akan di-${pendingDecision.decision === "APPROVED" ? "approve" : "reject"}. Tindakan ini tidak dapat dibatalkan.`
          : ""}
        confirmText={pendingDecision?.decision === "APPROVED" ? "Ya, Setujui" : "Ya, Tolak"}
        variant={pendingDecision?.decision === "APPROVED" ? "success" : "danger"}
        onConfirm={() => { if (pendingDecision) decide(pendingDecision.id, pendingDecision.decision); }}
        isProcessing={busyId !== null}
      />
    </div>
  );
}